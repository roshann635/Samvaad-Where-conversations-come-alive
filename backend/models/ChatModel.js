const mongoose = require("mongoose");

//schema
const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    // For group messages
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
    },
    // For direct messages (1-to-1)
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // Emoji reactions: array of { emoji, userId, username }
    reactions: [
      {
        emoji: { type: String, required: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        username: { type: String },
      },
    ],
    // Reply-to: reference to another message
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    // Poll support
    isPoll: { type: Boolean, default: false },
    pollData: {
      question: { type: String },
      options: [
        {
          optionText: { type: String },
          votes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        },
      ],
    },
  },
  { timestamps: true },
);

const Message =
  mongoose.models.Message || mongoose.model("Message", messageSchema);
module.exports = Message;
