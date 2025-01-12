const mongoose = require("mongoose");

const blockSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  blocked_user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  timestamp: { type: Date, default: Date.now },
});

const userBlockModel = mongoose.model("Block", blockSchema);

module.exports = userBlockModel;
