// const user = require("../../model/user.model")
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


module.exports = {
  createUser,
  matches,
};
