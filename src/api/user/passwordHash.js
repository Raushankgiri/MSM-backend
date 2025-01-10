const bcrypt = require("bcryptjs");

const securePassword = async (password) => {
  // console.log(password,"hi")
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  // console.log(hashedPassword)
  return hashedPassword;
};
// console.log(securePassword,"hi")

module.exports = securePassword;
