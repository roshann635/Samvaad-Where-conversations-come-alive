const express = require("express");
const Message = require("../models/ChatModel");
const { protect } = require("../middlewares/authMiddleware");

const messageRouter = express.Router();

// Send group message
messageRouter.post("/", protect, async (req, res) => {
  try {
    const { content, groupId } = req.body;
    const message = await Message.create({
      sender: req.user._id,
      content,
      group: groupId,
    });
    const populatedMessage = await Message.findById(message._id).populate(
      "sender",
      "username email",
    );
    res.json(populatedMessage);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get messages for a group
messageRouter.get("/group/:groupId", protect, async (req, res) => {
  try {
    const messages = await Message.find({ group: req.params.groupId })
      .populate("sender", "username email")
      .sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Send a direct message
messageRouter.post("/dm", protect, async (req, res) => {
  try {
    const { content, recipientId } = req.body;
    const message = await Message.create({
      sender: req.user._id,
      content,
      recipient: recipientId,
    });
    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "username email")
      .populate("recipient", "username email");
    res.json(populatedMessage);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get DM conversation between current user and another user
messageRouter.get("/dm/:userId", protect, async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const otherUserId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, recipient: otherUserId },
        { sender: otherUserId, recipient: currentUserId },
      ],
    })
      .populate("sender", "username email")
      .populate("recipient", "username email")
      .sort({ createdAt: 1 }); // ascending — oldest first

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Toggle emoji reaction on a message
messageRouter.patch("/:messageId/react", protect, async (req, res) => {
  try {
    const { emoji } = req.body;
    const userId = req.user._id;
    const username = req.user.username;

    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ error: "Message not found" });

    // Check if user already reacted with this emoji
    const existingIndex = message.reactions.findIndex(
      (r) => r.emoji === emoji && r.userId.toString() === userId.toString()
    );

    if (existingIndex >= 0) {
      // Remove reaction (toggle off)
      message.reactions.splice(existingIndex, 1);
    } else {
      // Add reaction
      message.reactions.push({ emoji, userId, username });
    }

    await message.save();

    const updated = await Message.findById(message._id)
      .populate("sender", "username email")
      .populate("recipient", "username email");

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Update user profile (username)
module.exports = messageRouter;
