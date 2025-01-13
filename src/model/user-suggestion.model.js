const mongoose = require("mongoose");

const suggestionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  suggested_user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  timestamp: { type: Date, default: Date.now },
});

const ttlDuration = parseInt(process.env.USER_SUGG_EXP, 10) || 24 * 60 * 60;
suggestionSchema.index({ timestamp: 1 }, { expireAfterSeconds: ttlDuration });

suggestionSchema.index({ user: 1, suggested_user_id: 1 }, { unique: true });

const userSuggestionModel = mongoose.model("Suggestion", suggestionSchema);

module.exports = userSuggestionModel;
