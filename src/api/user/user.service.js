// const user = require("../../model/user.model")
const axios = require("axios");

let user = {};
const hashpaswword = require("./passwordHash");
const nodemailer = require("nodemailer");
const createUser = async (userbody) => {
  const userDetails = await user.find({
    businessEmail: userbody.businessEmail,
  });

  const password = hashpaswword(userbody.password);
  if (userbody.length) {
    userbody.password = password;
    const userCreated = await user.create(userbody);
    return userCreated;
  }
};

const matches = (obj1, obj2) => {
  let matchdata = [];
  for (let key in obj1) {
    if (key in obj2) {
      matchdata.push(obj2[key]);
    }
  }
  // console.log(matchdata);
  const result = matchdata.every((i) => {
    return Object.values(obj1).includes(i);
  });
  return result;
};

const fetchRecommendUsers = async (userId) => {
  const url = `${process.env.ML_AI_BKD_URL}/recommend-user/${userId}`;
  let data = JSON.stringify({
    top: process.env.TOP_N_SUGGESTION || 8,
  });
  const config = {
    method: "post",
    maxBodyLength: Infinity,
    url: url,
    headers: { "Content-Type": "application/json" },
    data: data,
  };

  try {
    const response = await axios.request(config);
    console.log(JSON.stringify(response.data));
    return response.data; // Return the response data for further use
  } catch (error) {
    // console.error(error);
    // throw error; // Rethrow the error for caller to handle
    return {};
  }
};

module.exports = {
  createUser,
  matches,
  fetchRecommendUsers,
};
