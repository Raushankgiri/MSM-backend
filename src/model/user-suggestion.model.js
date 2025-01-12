const mongoose = require("mongoose");

const suggestionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  suggested_user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  timestamp: { type: Date, default: Date.now },
});

suggestionSchema.index({ user: 1, suggested_user_id: 1 }, { unique: true });
const userSuggestionModel = mongoose.model("Suggestion", suggestionSchema);
module.exports = userSuggestionModel;
