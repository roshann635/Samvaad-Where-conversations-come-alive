const express = require("express");
const Message = require("../models/ChatModel");
const User = require("../models/UserModel");
const { protect } = require("../middlewares/authMiddleware");

const messageRouter = express.Router();

// Send group message (supports replyTo and polls)
messageRouter.post("/", protect, async (req, res) => {
  try {
    const { content, groupId, replyTo, isPoll, pollData } = req.body;
    const messagePayload = {
      sender: req.user._id,
      content: isPoll ? (pollData?.question || "Poll") : content,
      group: groupId,
      ...(replyTo && { replyTo }),
      ...(isPoll && { isPoll: true, pollData }),
    };
    const message = await Message.create(messagePayload);
    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "username email")
      .populate({ path: "replyTo", populate: { path: "sender", select: "username" } });
    res.json(populatedMessage);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get messages for a group (with replyTo populated)
messageRouter.get("/group/:groupId", protect, async (req, res) => {
  try {
    const messages = await Message.find({ group: req.params.groupId })
      .populate("sender", "username email")
      .populate({ path: "replyTo", populate: { path: "sender", select: "username" } })
      .sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Vote on a poll (toggle / switch option)
messageRouter.patch("/:messageId/vote", protect, async (req, res) => {
  try {
    const { optionIndex } = req.body;
    const userId = req.user._id;
    const message = await Message.findById(req.params.messageId);
    if (!message || !message.isPoll)
      return res.status(404).json({ error: "Poll not found" });

    // Remove this user's vote from ALL options first (allows vote change)
    message.pollData.options.forEach((opt) => {
      opt.votes = opt.votes.filter((v) => v.toString() !== userId.toString());
    });

    const target = message.pollData.options[optionIndex];
    if (!target) return res.status(400).json({ error: "Invalid option" });
    target.votes.push(userId);

    await message.save();
    const updated = await Message.findById(message._id).populate("sender", "username email");

    // Broadcast real-time
    const io = req.app.get("io");
    if (io && message.group) {
      io.to(message.group.toString()).emit("poll updated", updated);
    }
    res.json(updated);
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

    // AI Bot auto-reply logic
    const recipientUser = await User.findById(recipientId);
    if (recipientUser && recipientUser.isBot) {
      setTimeout(async () => {
        // Generate a random intelligent-sounding reply
        const replies = [
          "That's very interesting! Tell me more.",
          "I am Samvaad AI, I process your thoughts optimally.",
          "How can I help you today?",
          "I beep and boop, but I also agree with what you just said.",
          "Fascinating perspective.",
          `You said: "${content}". I am analyzing it...`
        ];
        const aiContent = replies[Math.floor(Math.random() * replies.length)];
        
        const aiMessage = await Message.create({
          sender: recipientId,
          content: aiContent,
          recipient: req.user._id,
        });

        const popAiMessage = await Message.findById(aiMessage._id)
          .populate("sender", "username email isBot")
          .populate("recipient", "username email");

        // Emit through socket
        const io = req.app.get("io");
        if (io) {
          // getDMRoom logic: [id1, id2].sort().join("_dm_")
          const dmRoom = [req.user._id.toString(), recipientId.toString()].sort().join("_dm_");
          io.to(dmRoom).emit("dm received", popAiMessage);
        }
      }, 1500);
    }
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

// Get DM conversation partners (for saved conversations)
messageRouter.get("/dm/conversations", protect, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authorized" });
    }

    const currentUserId = req.user._id;

    const messages = await Message.find({
      $or: [{ sender: currentUserId }, { recipient: currentUserId }],
    })
      .populate("sender", "username email")
      .populate("recipient", "username email")
      .sort({ createdAt: -1 });

    const partnersMap = new Map();

    messages.forEach((message) => {
      if (message.sender?._id?.toString() === currentUserId.toString()) {
        if (message.recipient)
          partnersMap.set(message.recipient._id.toString(), message.recipient);
      } else if (
        message.recipient?._id?.toString() === currentUserId.toString()
      ) {
        if (message.sender)
          partnersMap.set(message.sender._id.toString(), message.sender);
      }
    });

    res.json(Array.from(partnersMap.values()));
  } catch (error) {
    console.error("/dm/conversations error:", error);
    res.status(500).json({
      error: "Server error",
      details: error.message,
      stack: error.stack,
    });
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
      (r) => r.emoji === emoji && r.userId.toString() === userId.toString(),
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
