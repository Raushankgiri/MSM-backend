const mongoose = require("mongoose");

const connectionStatusSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  disconnected_user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  timestamp: { type: Date, default: Date.now },
});

connectionStatusSchema.index({ user: 1, disconnected_user: 1 }, { unique: true });
const connectionStatusModel = mongoose.model("Connection", connectionStatusSchema);
module.exports = connectionStatusModel;
