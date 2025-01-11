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
    referredby: {
      type: String,
      required: true,
    },
    referrelid: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    countrycode: {
      type: String,
      required: true,
    },
    phonenumber: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    designation: {
      type: String,
      required: true,
    },
    profileImage: {
      type: String,
      required: true,
    },
    university: {
      type: String,
      required: true,
    },
    course: {
      type: String,
      required: true,
    },
    subjects: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  }
);

// Create a text index on the fields you want to search
userschema.index({
  firstname: "text",
  lastname: "text",
  email: "text",
  country: "text",
  university: "text",
  course: "text",
  designation: "text",
  subjects: "text",
});

const user = mongoose.model("user", userschema);
module.exports = user;
