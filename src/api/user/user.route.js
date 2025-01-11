const express = require("express");
const router = express.Router();
const {
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
  deleteconnectionrequest,
  getUserConnections,
} = require("../user/user.controller");
const auth = require("../../middlewares/auth");

router.post("/register", createuser1);
router.post("/login", login);
router.post("/getsuggestion", getsuggestion);
router.post("/getprofile", getprofile);
router.post("/getConnectionDetails", getConnectionDetails);

router.post("/connectionRequest", connectionRequest);
router.post("/getConnectionListByReceiver", getConnectionListByReceiver);
router.post("/getConnectionListBysender", getConnectionListBysender);
router.put("/updateconnectionstuats", updateconnectionstuats);

router.get("/globalSearchConnections", globalSearchConnections);
router.post("/deleteconnectionrequest", deleteconnectionrequest);
router.post("/getUserConnections", getUserConnections);

module.exports = router;
