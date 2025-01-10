const { createUser, matches, fetchRecommendUsers } = require("./user.service");
const user = require("../../model/user.model");
const connection = require("../../model/connection.model");
const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

require("dotenv").config();

// const config = require("../../src/config/config")

const createuser1 = async (req, res) => {
  console.log("API called");
  try {
    const { firstname, lastname, email, typeofstudent, referredfrom, referredby, country, countrycode, phonenumber, password } = req.body;

    // Validate required fields
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

    // Check if the email already exists
    const existingUser = await user.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists." });
    }
    console.log(existingUser, "existingUser");

    // Generate an 8-character unique alphanumeric ID
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
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
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

    // Save the user to the database
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

    // Check if password matches
    const isMatch = await bcrypt.compare(password, userdata.password);
    if (!isMatch) {
      return res.status(400).send({ message: "Invalid email ID or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { email: userdata.email }, // Include role in token
      "yourSecretKey",
      { expiresIn: "1h" }
    );

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

    // Validate input
    if (!_id) {
      return res.status(400).json({ message: "User ID (_id) is required." });
    }

    // Find the user by _id
    const User = await user.findById(_id);
    if (!User) {
      return res.status(404).json({ message: "User not found." });
    }

    //   const userCountry = User.country;

    //   // Fetch all records with the same country, excluding the user's own data and the password field
    //   const records = await user.find(
    //     { country: userCountry, _id: { $ne: _id } }, // Exclude user's own data
    //     '-password' // Exclude the password field
    //   );
    //  // Count the number of records fetched
    //  const recordsCount = records.length;

    //  // Count the total number of users in the same country (including the current user)
    //  const connectionCount = await user.countDocuments({ country: userCountry });
    // Fetch connections
    const connectionQuery = {
      $or: [{ sender: new mongoose.Types.ObjectId(_id) }, { receiver: new mongoose.Types.ObjectId(_id) }],
    };
    const connections = await connection.find(connectionQuery, "sender receiver");
    const mergedConnections = connections.flatMap((conn) => [conn.sender, conn.receiver]);
    const uniqueConnections = [...new Set(mergedConnections)].map((id) => id.toString());

    console.log("--->>", uniqueConnections);
    const recommendedUsers = (await fetchRecommendUsers(_id))?.data;

    if (!recommendedUsers || recommendedUsers.length === 0) {
      return res.status(404).json({ message: "No recommendations found.", code: 404 });
    }

    console.log(recommendedUsers.data);
    console.log("\n\n:::connections::", connections);
    // 677ff445ec0252648169ed3b
    // Define the aggregation pipeline
    const newRecommendedUsers = recommendedUsers.filter((user) => !uniqueConnections.includes(user));

    const objectIds = newRecommendedUsers.map((id) => new ObjectId(id));

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
    console.log("Connection QUERY::", JSON.stringify(connectionQuery));

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

const getConnectionDetails = async (req, res) => {
  const { senderId } = req.body; // Get senderId from request body

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

    // 4. Format response to include name, designation, and profile image
    const response = users.map((userdetails) => ({
      name: `${userdetails.firstname} ${userdetails.lastname}`,
      designation: userdetails.designation,
      profileImage: userdetails.profileImage,
      userdetails: userdetails,
    }));

    // 5. Send the response
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

    // Validate input
    if (!senderId || !receiverId) {
      return res.status(400).json({ message: "Sender and Receiver IDs are required." });
    }

    // Check if both sender and receiver exist in the User collection
    const sender = await user.findById(senderId);
    const receiver = await user.findById(receiverId);

    if (!sender) {
      return res.status(404).json({ message: "Sender not found." });
    }
    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found." });
    }

    // Check if a connection request already exists
    const existingRequest = await connection.findOne({
      sender: senderId,
      receiver: receiverId,
      status: "Pending",
    });

    if (existingRequest) {
      return res.status(400).json({ message: "Connection request already sent." });
    }

    // Create a new connection request in the ConnectionList collection
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

    // Validate input
    if (!receiverId) {
      return res.status(400).json({ message: "Receiver ID is required." });
    }

    // Convert receiverId to ObjectId
    const receiverObjectId = new mongoose.Types.ObjectId(receiverId);

    // Fetch connections for the receiver with status "Pending" and include sender details
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
        $unwind: "$senderDetails", // Unwind the senderDetails array to make it an object
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

    // Validate input
    if (!senderId) {
      return res.status(400).json({ message: "Sender ID is required." });
    }

    // Convert senderId to ObjectId
    const senderObjectId = new mongoose.Types.ObjectId(senderId);

    // Fetch connections for the receiver with status "Pending" and include sender details
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
        $unwind: "$receiverDetails", // Unwind the senderDetails array to make it an object
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

    // Validate input
    if (!receiverId || !senderId || !status) {
      return res.status(400).json({ message: "Receiver ID, Sender ID, and status are required." });
    }

    // Validate status
    const validStatuses = ["Pending", "Accepted", "Rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value." });
    }

    // Find and update the connection status
    const connections = await connection.findOneAndUpdate(
      { receiver: receiverId, sender: senderId },
      { status },
      { new: true } // Return the updated document
    );

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
  const { query } = req.body; // The search query input from the frontend

  if (!query) {
    return res.status(400).json({ message: "Search query is required." });
  }

  try {
    // 1. Find connections where `firstname` or `lastname` matches the query
    const regex = new RegExp(query, "i"); // Case-insensitive partial match
    const users = await user
      .find({
        $or: [{ firstname: regex }, { lastname: regex }],
      })
      .select("firstname lastname designation profileImage");

    // 2. Format response with name, designation, and profile image
    const response = users.map((user) => ({
      name: `${user.firstname} ${user.lastname}`,
      designation: user.designation,
      profileImage: user.profileImage,
    }));

    // 3. Return the search results
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
};
