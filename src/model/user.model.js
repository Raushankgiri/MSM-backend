const mongoose = require("mongoose");

const userschema = new mongoose.Schema(
  {
  
    firstname: {
      type: String,
      required: true,
    },
    lastname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    typeofstudent: {
      type: String,
      required: true,
    },
    referredfrom: {
      type: String,
      required: true,
    },
    referredby:{
      type: String,
      required: true,
    },
    referrelid:{
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    countrycode: {
      type: String, // Store department as an array of strings to handle multiple departments
      required: true,
    },
    phonenumber: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    }
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  }
);

const user = mongoose.model("user", userschema);
module.exports = user;
