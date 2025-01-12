const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    senderUserId: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
    receiverUserId: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

// Adding index to senderUserId and receiverUserId
conversationSchema.index({ senderUserId: 1, receiverUserId: 1 });
conversationSchema.index({ receiverUserId: 1, senderUserId: 1 }); // To ensure bidirectional querying is optimized

const ConversationModel = mongoose.model("Conversation", conversationSchema);

module.exports = ConversationModel;
