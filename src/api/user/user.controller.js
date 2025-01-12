const { createUser, matches, fetchRecommendUsers } = require("./user.service");
const user = require("../../model/user.model");
const connection = require("../../model/connection.model");
const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const ConversationModel = require("../../model/conversation.model");
const UserReportModel = require("../../model/user-report.model");
const connectionStatusModel = require("../../model/user-conn-status.model");
const userSuggestionModel = require("../../model/user-suggestion.model");

require("dotenv").config();

// const config = require("../../src/config/config")

const createuser1 = async (req, res) => {
  try {
    const { firstname, lastname, email, typeofstudent, referredfrom, referredby, country, countrycode, phonenumber, password } = req.body;

    if (
      !firstname ||
      !lastname ||
      !email ||
      !typeofstudent ||
      !referredfrom ||
      !referredby ||
      !country ||
      !countrycode ||
      !phonenumber ||
      !password
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const existingUser = await user.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists." });
    }
    console.log(existingUser, "existingUser");

    const generateReferralId = () => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let id = "";
      for (let i = 0; i < 8; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return id;
    };
    let referralid = generateReferralId();
    console.log(referralid, "referralid");

    // Ensure the generated referral ID is unique
    while (await user.findOne({ referralid })) {
      referralid = generateReferralId();
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new user({
      firstname,
      lastname,
      email,
      typeofstudent,
      referredfrom,
      referredby,
      country,
      countrycode,
      phonenumber,
      password: hashedPassword,
      referrelid: referralid, // Add the referral ID
    });
    await newUser.save();

    res.status(201).json({ message: "User created successfully.", referralid });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body; // Extract role from request body
    const userdata = await user.findOne({ email }); // Match both userId and role

    // Check if user exists
    if (!userdata) {
      return res.status(400).send({ message: "Invalid user credential" });
    }
    const isMatch = await bcrypt.compare(password, userdata.password);
    if (!isMatch) {
      return res.status(400).send({ message: "Invalid email ID or password" });
    }
    const token = jwt.sign({ email: userdata.email }, "yourSecretKey", { expiresIn: "1h" });
    return res.status(200).send({
      message: "Login successful",
      token,
      userid: userdata._id,
      status: 200,
    });
  } catch (error) {
    return res.status(500).send({ message: error.message, status: 500 });
  }
};

const getprofile = async (req, res) => {
  const { _id } = req.body;
  const User = await user.findById({ _id }, "-password");
  if (!User) {
    return res.status(404).json({ message: "User not found." });
  } else {
    return res.status(200).json({
      message: "user profile details",
      Userdetails: User,
    });
  }
};

const getsuggestion = async (req, res) => {
  try {
    const { _id } = req.body;
    if (!_id) {
      return res.status(400).json({ message: "User ID (_id) is required." });
    }
    const User = await user.findById(_id);
    if (!User) {
      return res.status(404).json({ message: "User not found." });
    }

    const connections = await fetchUserConnections(_id, (data = null));

    console.log("--->>User connections", connections);
    const recommendedUsers = (await fetchRecommendUsers(_id))?.data;
    console.log("recommendedUsers::--->>", recommendedUsers);
    if (!recommendedUsers || recommendedUsers.length === 0) {
      return res.status(404).json({ message: "No recommendations found.", code: 404 });
    }

    console.log("\n\n:::connections::", connections);

    const newRecommendedUsers = recommendedUsers.filter((user) => !connections.includes(user) && user !== _id);

    // Fetch dismissed users
    const dismissedResult = await userSuggestionModel.find({ user: _id }).select("suggested_user_id");
    const dismissedUsers = dismissedResult.map((item) => item.suggested_user_id.toString()).flat();

    console.log("dismissedUsers:::", dismissedUsers);

    // Remove dismissed users from the newRecommendedUsers
    const filteredRecommendedUsers = newRecommendedUsers.filter((user) => !dismissedUsers.includes(user));
    const objectIds = filteredRecommendedUsers.map((id) => new ObjectId(id));
    console.log("newRecommendedUsers::", newRecommendedUsers);
    const pipeline = [
      {
        $match: {
          _id: {
            $in: objectIds, // Use ObjectId in the $in operator
          },
        },
      },
    ];
    console.log("Fetch User QUERY::", JSON.stringify(pipeline));

    const result = await user.aggregate(pipeline);

    return res.status(200).json({
      message: "Records fetched successfully.",
      data: result,
      // country: userCountry,
      // records,
      // recordsCount,
    });
  } catch (error) {
    console.error("Error fetching records by country:", error);
    return res.status(500).json({ message: "Server error.", error: error.message });
  }
};

const fetchUserConnections = async (_id, data = [{ status: "Accepted" }]) => {
  const query = {
    $or: [{ sender: new mongoose.Types.ObjectId(_id) }, { receiver: new mongoose.Types.ObjectId(_id) }],
  };

  // Dynamically add `status` to the query if provided in `data`
  if (data?.length > 0) {
    query.$or = query.$or.map((condition) => ({
      ...condition,
      $and: data.map((filter) => ({ status: filter.status })),
    }));
  }
  console.log("Connection query::", query);
  const connections = await connection.find(query, "_id sender receiver");
  const connectionIds = connections.map((conn) => [conn.sender, conn.receiver]).flat();
  const uniqueIds = [...new Set(connectionIds.map((id) => id.toString()))];
  const filterIds = uniqueIds.filter((userId) => userId !== _id);
  // console.log("--->..", filterIds);
  return filterIds;
};

const getUserConnections = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: "User ID is required" });
    }
    const connections = await connection.find(
      {
        $or: [{ sender: new mongoose.Types.ObjectId(id) }, { receiver: new mongoose.Types.ObjectId(id) }],
        status: "Accepted",
      },
      "_id sender receiver"
    );
    const connectionIds = connections.map((conn) => [conn.sender, conn.receiver]).flat();
    const uniqueIds = [...new Set(connectionIds.map((id) => id.toString()))];
    const filteredIds = uniqueIds.filter((userId) => userId !== id);
    if (filteredIds.length === 0) {
      return res.status(200).json({ users: [] });
    }
    console.log("\n\n::id::", id);
    const disUsersResult = await connectionStatusModel
      .find({ $or: [{ disconnected_user: new mongoose.Types.ObjectId(id) }, { user: new mongoose.Types.ObjectId(id) }] })
      .select("disconnected_user user");

    // Extract the disconnected users and users
    const allUsers = disUsersResult
      .map((item) => [item.disconnected_user, item.user]) // Merge disconnected_user and user
      .flat() // Flatten the array so it's a single list
      .map((user) => user.toString()); // Convert ObjectIds to strings

    console.log("allUsers::", allUsers);

    // Filter out the users in allUsers (disconnected and actual user) from filteredIds
    const filteredIdsWithoutDisconnected = filteredIds.filter((id) => !allUsers.includes(id));
    const users = await user.find({
      _id: { $in: filteredIdsWithoutDisconnected.map((id) => new mongoose.Types.ObjectId(id)) },
    });

    return res.status(200).json({ users });
  } catch (error) {
    console.error("Error fetching connections:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getConnectionDetails = async (req, res) => {
  const { senderId } = req.body;

  try {
    const Connectionslist = await connection.find({ sender: senderId });

    const receiverIds = Connectionslist.map((Connectiondetails) => Connectiondetails.receiver);

    if (receiverIds.length === 0) {
      return res.status(404).json({ message: "No connections found for this sender." });
    }

    // 3. Find users in the 'user' collection based on receiverIds
    const users = await user
      .find({
        _id: { $in: receiverIds },
      })
      .select("firstname lastname designation profileImage");

    const response = users.map((userdetails) => ({
      name: `${userdetails.firstname} ${userdetails.lastname}`,
      designation: userdetails.designation,
      profileImage: userdetails.profileImage,
      userdetails: userdetails,
    }));

    return res.status(200).json({
      message: "Connections found successfully.",
      data: response,
    });
  } catch (error) {
    console.error("Error fetching connection details:", error);
    return res.status(500).json({
      message: "Error fetching connection details.",
      error: error.message,
    });
  }
};

const connectionRequest = async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;

    if (!senderId || !receiverId) {
      return res.status(400).json({ message: "Sender and Receiver IDs are required." });
    }
    const sender = await user.findById(senderId);
    const receiver = await user.findById(receiverId);

    if (!sender) {
      return res.status(404).json({ message: "Sender not found." });
    }
    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found." });
    }
    const existingRequest = await connection.findOne({
      sender: senderId,
      receiver: receiverId,
      status: "Pending",
    });

    if (existingRequest) {
      return res.status(400).json({ message: "Connection request already sent." });
    }

    const connectionRequest = new connection({
      sender: senderId,
      receiver: receiverId,
      status: "Pending",
    });

    await connectionRequest.save();

    res.status(200).json({ message: "Connection request sent successfully." });
  } catch (error) {
    console.error("Error sending connection request:", error);
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

const getConnectionListByReceiver = async (req, res) => {
  try {
    const { receiverId } = req.body;
    if (!receiverId) {
      return res.status(400).json({ message: "Receiver ID is required." });
    }

    // Convert receiverId to ObjectId
    const receiverObjectId = new mongoose.Types.ObjectId(receiverId);

    const connections = await connection.aggregate([
      {
        $match: {
          receiver: receiverObjectId, // Match the receiverId
          status: "Pending", // Match only pending status
        },
      },
      {
        $lookup: {
          from: "users", // Name of the user collection
          localField: "sender", // Field in `connection` collection
          foreignField: "_id", // Field in `users` collection
          as: "senderDetails", // Name of the output field
        },
      },
      {
        $unwind: "$senderDetails",
      },
      {
        $project: {
          _id: 1,
          sender: 1,
          receiver: 1,
          status: 1,
          "senderDetails._id": 1,
          "senderDetails.firstname": 1,
          "senderDetails.lastname": 1,
          "senderDetails.email": 1,
          "senderDetails.phonenumber": 1,
          "senderDetails.profileImage": 1,
          "senderDetails.designation": 1,
        },
      },
    ]);

    if (connections.length === 0) {
      return res.status(404).json({ message: "No pending connections found for this receiver." });
    }

    res.status(200).json({
      message: "Connection list fetched successfully.",
      connections,
    });
  } catch (error) {
    console.error("Error fetching connection list:", error);
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

const getConnectionListBysender = async (req, res) => {
  try {
    const { senderId } = req.body;

    if (!senderId) {
      return res.status(400).json({ message: "Sender ID is required." });
    }

    // Convert senderId to ObjectId
    const senderObjectId = new mongoose.Types.ObjectId(senderId);

    const connections = await connection.aggregate([
      {
        $match: {
          sender: senderObjectId, // Match the senderId
          status: "Pending", // Match only pending status
        },
      },
      {
        $lookup: {
          from: "users", // Name of the user collection
          localField: "receiver", // Field in `connection` collection
          foreignField: "_id", // Field in `users` collection
          as: "receiverDetails", // Name of the output field
        },
      },
      {
        $unwind: "$receiverDetails",
      },
      {
        $project: {
          _id: 1,
          sender: 1,
          receiver: 1,
          status: 1,
          "receiverDetails._id": 1,
          "receiverDetails.firstname": 1,
          "receiverDetails.lastname": 1,
          "receiverDetails.email": 1,
          "receiverDetails.phonenumber": 1,
          "receiverDetails.profileImage": 1,
          "receiverDetails.designation": 1,
        },
      },
    ]);

    if (connections.length === 0) {
      return res.status(404).json({ message: "No pending connections found for this receiver." });
    }

    res.status(200).json({
      message: "Connection list fetched successfully.",
      connections,
    });
  } catch (error) {
    console.error("Error fetching connection list:", error);
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

//   try {
//     const { senderId } = req.body;
//     if (!senderId) {
//       return res.status(400).json({ message: 'sender ID is required.' });
//     }
//     const connections = await connection.find({ sender: senderId })
//       .select('-__v');
//     if (connections.length === 0) {
//       return res.status(404).json({ message: 'No connections found for this sender.' });
//     }
//     res.status(200).json({
//       message: 'Connection list fetched successfully.',
//       connections,
//     });
//   } catch (error) {
//     console.error('Error fetching connection list:', error);
//     res.status(500).json({ message: 'Server error.', error: error.message });
//   }
// };

const updateconnectionstuats = async (req, res) => {
  try {
    const { receiverId, senderId, status } = req.body;

    if (!receiverId || !senderId || !status) {
      return res.status(400).json({ message: "Receiver ID, Sender ID, and status are required." });
    }

    // Validate status
    const validStatuses = ["Pending", "Accepted", "Rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value." });
    }
    const connections = await connection.findOneAndUpdate({ receiver: receiverId, sender: senderId }, { status }, { new: true });

    if (!connections) {
      return res.status(404).json({ message: "Connection not found." });
    }

    res.status(200).json({
      message: "Connection status updated successfully.",
      connections,
    });
  } catch (error) {
    console.error("Error updating connection status:", error);
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

const globalSearchConnections = async (req, res) => {
  const { query, _id } = req.body;

  if (!query) {
    return res.status(400).json({ message: "Search query is required." });
  }

  const userConns = await fetchUserConnections(_id);
  if (!userConns || userConns.length === 0) {
    return res.status(400).json({ message: "No user connections found." });
  }

  try {
    const terms = query.trim().split(/\s+/); // Split query into terms
    const regexArray = terms.map((term) => new RegExp(term, "i")); // Regex for partial matches
    const fullNameRegex = new RegExp(`^${terms.join(" ")}$`, "i"); // Regex for exact full-name match

    // Perform a full-name match first
    const fullNameMatches = await user.find({
      $expr: {
        $regexMatch: {
          input: { $concat: ["$firstname", " ", "$lastname"] },
          regex: fullNameRegex,
        },
      },
      _id: { $in: userConns.map((id) => new mongoose.Types.ObjectId(id)) },
    });
    // .select("firstname lastname designation profileImage _id");
    console.log(fullNameMatches);
    if (fullNameMatches.length > 0) {
      const response = fullNameMatches.map((user) => ({
        name: `${user.firstname} ${user.lastname}`,
        designation: user.designation,
        profileImage: user.profileImage,
        _id: user._id,
      }));

      return res.status(200).json({
        message: "Search results fetched successfully.",
        data: response,
      });
    }

    // Fallback: Partial matches for firstname and lastname
    const partialMatches = await user
      .find({
        $or: [
          { firstname: { $in: regexArray } }, // Partial matches for firstname
          { lastname: { $in: regexArray } }, // Partial matches for lastname
        ],
        _id: { $in: userConns.map((id) => new mongoose.Types.ObjectId(id)) },
      })
      .select("firstname lastname designation profileImage _id");

    const response = partialMatches.map((user) => ({
      name: `${user.firstname} ${user.lastname}`,
      designation: user.designation,
      profileImage: user.profileImage,
      _id: user._id,
    }));

    if (response.length === 0) {
      return res.status(404).json({ message: "No results found." });
    }

    return res.status(200).json({
      message: "Search results fetched successfully.",
      data: response,
    });
  } catch (error) {
    console.error("Error fetching search results:", error);
    return res.status(500).json({
      message: "Error fetching search results.",
      error: error.message,
    });
  }
};

const globalSearch = async (req, res) => {
  const query = req.query.q; // Get the search query from the URL
  let page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
  let limit = parseInt(req.query.limit) || 10;
  const { _id } = req.query._id; // Current user ID

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "Invalid UserId (_id) provided." });
  }

  const userExists = await user.findById(_id); // Fetch the user by their unique ID
  if (!userExists) {
    return res.status(404).json({ message: "User not found." }); // Return a 404 error if the user does not exist
  }

  // Ensure valid pagination parameters
  page = page < 1 ? 1 : page;
  limit = limit < 1 ? 10 : limit;

  if (!query) {
    return res.status(400).json({ message: "Search query is required." });
  }

  const skip = (page - 1) * limit;

  try {
    // Create a case-insensitive regex for partial matches
    const regex = new RegExp(query, "i");

    const searchQuery = {
      $or: [
        { firstname: regex },
        { lastname: regex },
        { email: regex },
        { designation: regex },
        { country: regex },
        { countrycode: regex },
        { phonenumber: regex },
        { typeofstudent: regex },
        { university: regex },
        { course: regex },
        { subjects: regex },
      ],
      _id: { $ne: _id }, // Exclude the logged-in user's data
    };

    // Fields to exclude in response
    const projection = {
      password: 0, // Exclude sensitive fields
      referredfrom: 0,
      referredby: 0,
      referrelid: 0,
      createdAt: 0,
      updatedAt: 0,
      __v: 0,
    };

    // Perform the search query with pagination
    const results = await user.find(searchQuery, projection).skip(skip).limit(limit);

    // Total number of matching documents for pagination
    const totalCount = await user.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalCount / limit);

    if (results.length === 0) {
      return res.status(404).json({ message: "No results found." });
    }

    return res.status(200).json({
      message: "Search results fetched successfully.",
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
      },
      data: results,
    });
  } catch (error) {
    console.error("Error fetching search results:", error);
    return res.status(500).json({
      message: "Error fetching search results.",
      error: error.message,
    });
  }
};

const deleteconnectionrequest = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ message: "ID is required" });
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const deletedConnection = await connection.findByIdAndDelete({ _id: id });

    if (!deletedConnection) {
      return res.status(404).json({ message: "Connection not found" });
    }

    res.status(200).json({ message: "Connection deleted successfully", data: deletedConnection });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const saveConversations = async (req, res) => {
  const { senderUserId, receiverUserId, message } = req.body;

  if (!senderUserId) {
    return res.status(400).json({ message: "senderUserId is required" });
  }

  if (!receiverUserId) {
    return res.status(400).json({ message: "receiverUserId is required" });
  }

  if (!message) {
    return res.status(400).json({ message: "message is required" });
  }

  if (receiverUserId === senderUserId) {
    return res.status(400).json({ message: "Dude come on" });
  }

  const senderUserIdExists = await user.findById(senderUserId); // Fetch the user by their unique ID
  if (!senderUserIdExists) {
    return res.status(404).json({ message: "senderUserId not found." }); // Return a 404 error if the user does not exist
  }

  const receiverUserIdExists = await user.findById(receiverUserId); // Fetch the user by their unique ID
  if (!receiverUserIdExists) {
    return res.status(404).json({ message: "User not found." }); // Return a 404 error if the user does not exist
  }

  try {
    const newMessage = new ConversationModel({
      senderUserId,
      receiverUserId,
      message,
    });

    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ error: "Failed to save the message." });
  }
};

const fetchConversations = async (req, res) => {
  const { userId, otherUserId, page = 1, limit = 10 } = req.query; // Default to page 1 and limit 10

  if (!userId || !otherUserId) {
    return res.status(400).json({ message: "userId and otherUserId are required" });
  }

  if (userId === otherUserId) {
    return res.status(400).json({ message: "Dude come on" });
  }

  console.log(userId, otherUserId);

  try {
    // Convert page and limit to integers
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    // Calculate skip value based on page number and limit
    const skip = (pageNum - 1) * limitNum;

    // Query conversations with pagination
    const conversations = await ConversationModel.find({
      $or: [
        { senderUserId: userId, receiverUserId: otherUserId },
        { senderUserId: otherUserId, receiverUserId: userId },
      ],
    })
      .sort({ timestamp: 1 }) // Sorted by timestamp to show in order.
      .skip(skip) // Skip the messages for previous pages
      .limit(limitNum); // Limit the number of messages per page

    // Get the total count of conversations for pagination metadata
    const totalConversations = await ConversationModel.countDocuments({
      $or: [
        { senderUserId: userId, receiverUserId: otherUserId },
        { senderUserId: otherUserId, receiverUserId: userId },
      ],
    });

    // Calculate total pages
    const totalPages = Math.ceil(totalConversations / limitNum);

    // Send response with conversations and pagination info
    res.status(200).json({
      conversations,
      pagination: {
        totalConversations,
        totalPages,
        currentPage: pageNum,
        limit: limitNum,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch conversations." });
  }
};

const reportUser = async (req, res) => {
  try {
    const { reportedBy, reportedPerson, comment } = req.body;
    if (!reportedBy || !reportedPerson || !comment) {
      return res.status(400).json({ message: "reportedPerson, reportedBy and comment are required" });
    }

    if (!reportedBy) {
      return res.status(400).json({ message: "reportedBy is required" });
    }

    if (!reportedPerson) {
      return res.status(400).json({ message: "reportedPerson is required" });
    }

    if (reportedPerson == reportedBy) {
      return res.status(400).json({ message: "Dude come on" });
    }

    if (!comment) {
      return res.status(400).json({ message: "comment is required" });
    }

    const reportedPersonIdExists = await user.findById(reportedPerson); // Fetch the user by their unique ID
    if (!reportedPersonIdExists) {
      return res.status(404).json({ message: "reportedPersonId not found." }); // Return a 404 error if the user does not exist
    }

    const reportedByIdExists = await user.findById(reportedBy); // Fetch the user by their unique ID
    if (!reportedByIdExists) {
      return res.status(404).json({ message: "reportedById not found." }); // Return a 404 error if the user does not exist
    }

    const reportInfo = new UserReportModel({
      reportedBy,
      reportedPerson,
      comment,
    });

    await reportInfo.save();
    res.status(201).json(reportInfo);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to save data." });
  }
};

const disconnectUser = async (req, res) => {
  try {
    const { _id, disconnected_user } = req.body;
    if (!_id || !disconnected_user) {
      return res.status(400).json({ message: " disconnected_user and _id are required" });
    }

    if (!_id) {
      return res.status(400).json({ message: "_id is required" });
    }

    if (!disconnected_user) {
      return res.status(400).json({ message: "disconnected_user is required" });
    }

    if (_id == disconnected_user) {
      return res.status(400).json({ message: "Dude come on" });
    }

    const IdExists = await user.findById(_id); // Fetch the user by their unique ID
    if (!IdExists) {
      return res.status(404).json({ message: "_id not found." }); // Return a 404 error if the user does not exist
    }

    const disconnected_userIdExists = await user.findById(disconnected_user); // Fetch the user by their unique ID
    if (!disconnected_userIdExists) {
      return res.status(404).json({ message: "disconnected_user not found." }); // Return a 404 error if the user does not exist
    }

    const connections = await fetchUserConnections(_id);
    if (!connections.includes(disconnected_user)) {
      return res.status(401).json({ success: false, message: "Users are not connected" });
    }

    const updatedStatus = await connectionStatusModel.findOneAndUpdate(
      { user: _id, disconnected_user },
      { $set: { timestamp: new Date() } },
      { new: true, upsert: true }
    );

    res.status(201).json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to save data." });
  }
};

const dismissSuggestion = async (req, res) => {
  try {
    const { _id, suggested_user_id } = req.body;
    if (!_id || !suggested_user_id) {
      return res.status(400).json({ message: " suggested_user_id and _id are required" });
    }

    if (!_id) {
      return res.status(400).json({ message: "_id is required" });
    }

    if (!suggested_user_id) {
      return res.status(400).json({ message: "suggested_user_id is required" });
    }

    if (_id == suggested_user_id) {
      return res.status(400).json({ message: "Dude come on" });
    }

    const IdExists = await user.findById(_id); // Fetch the user by their unique ID
    if (!IdExists) {
      return res.status(404).json({ message: "_id not found." }); // Return a 404 error if the user does not exist
    }

    const disconnected_userIdExists = await user.findById(suggested_user_id); // Fetch the user by their unique ID
    if (!disconnected_userIdExists) {
      return res.status(404).json({ message: "suggested_user_id not found." }); // Return a 404 error if the user does not exist
    }

    const updatedStatus = await userSuggestionModel.findOneAndUpdate(
      { user: _id, suggested_user_id },
      { $set: { timestamp: new Date() } },
      { new: true, upsert: true }
    );

    res.status(201).json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to save data." });
  }
};

module.exports = {
  createuser1,
  login,
  getsuggestion,
  getprofile,
  connectionRequest,
  getConnectionListByReceiver,
  getConnectionListBysender,
  updateconnectionstuats,
  getConnectionDetails,
  globalSearchConnections,
  getUserConnections,
  deleteconnectionrequest,
  globalSearch,
  saveConversations,
  fetchConversations,
  reportUser,
  dismissSuggestion,
  disconnectUser,
};
