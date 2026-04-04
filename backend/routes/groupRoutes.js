const express = require("express");
const Group = require("../models/GroupModel");
const Message = require("../models/ChatModel");
const { protect } = require("../middlewares/authMiddleware");
const groupRouter = express.Router();

// Helper: check if user is the group admin
const isGroupAdmin = (group, userId) =>
  group.admin?.toString() === userId.toString();

// Create a new group (any logged-in user can create)
groupRouter.post("/", protect, async (req, res) => {
  try {
    const { name, description } = req.body;
    const group = await Group.create({
      name,
      description,
      admin: req.user._id,
      members: [req.user._id],
    });
    const populatedGroup = await Group.findById(group._id)
      .populate("admin", "username email")
      .populate("members", "username email");
    res.status(201).json({ populatedGroup });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all groups (includes joinRequests & pinnedMessage)
groupRouter.get("/", protect, async (req, res) => {
  try {
    const groups = await Group.find()
      .populate("admin", "username email")
      .populate("members", "username email")
      .populate("joinRequests", "username email")
      .populate({
        path: "pinnedMessage",
        populate: { path: "sender", select: "username" },
      });
    res.json(groups);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ── JOIN REQUEST (replaces instant join) ──────────────────────────────────────
groupRouter.post("/:groupId/join", protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const userId = req.user._id;
    const alreadyMember = group.members.some(
      (id) => id.toString() === userId.toString()
    );
    if (alreadyMember)
      return res.status(400).json({ message: "Already a member" });

    const alreadyRequested = group.joinRequests.some(
      (id) => id.toString() === userId.toString()
    );
    if (alreadyRequested)
      return res.status(400).json({ message: "Request already sent" });

    group.joinRequests.push(userId);
    await group.save();

    // Notify admin via socket
    const io = req.app.get("io");
    if (io) {
      io.to(group._id.toString()).emit("join request", {
        groupId: group._id,
        user: { _id: req.user._id, username: req.user.username },
      });
    }
    res.json({ message: "Join request sent" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get pending join requests (admin only)
groupRouter.get("/:groupId/requests", protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId).populate(
      "joinRequests",
      "username email"
    );
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (!isGroupAdmin(group, req.user._id))
      return res.status(403).json({ message: "Only admin can view requests" });
    res.json(group.joinRequests);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Approve join request (admin only)
groupRouter.post("/:groupId/requests/:userId/approve", protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (!isGroupAdmin(group, req.user._id))
      return res.status(403).json({ message: "Only admin can approve" });

    const { userId } = req.params;
    group.joinRequests = group.joinRequests.filter(
      (id) => id.toString() !== userId
    );
    const alreadyMember = group.members.some((id) => id.toString() === userId);
    if (!alreadyMember) group.members.push(userId);
    await group.save();

    // Notify the approved user (and refresh group list for all members)
    const io = req.app.get("io");
    if (io) {
      io.to(group._id.toString()).emit("member joined", {
        groupId: group._id,
        userId,
      });
    }
    res.json({ message: "User approved" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Reject join request (admin only)
groupRouter.post("/:groupId/requests/:userId/reject", protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (!isGroupAdmin(group, req.user._id))
      return res.status(403).json({ message: "Only admin can reject" });

    group.joinRequests = group.joinRequests.filter(
      (id) => id.toString() !== req.params.userId
    );
    await group.save();
    res.json({ message: "Request rejected" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Leave a group
groupRouter.post("/:groupId/leave", protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });
    const isMember = group.members.some(
      (memberId) => memberId.toString() === req.user._id.toString()
    );
    if (!isMember)
      return res.status(400).json({ message: "Not a member of this group" });

    group.members = group.members.filter(
      (memberId) => memberId.toString() !== req.user._id.toString()
    );
    await group.save();
    res.json({ message: "Left group successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Pin / Unpin a message (admin only)
groupRouter.patch("/:groupId/pin/:messageId", protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (!isGroupAdmin(group, req.user._id))
      return res.status(403).json({ message: "Only admin can pin messages" });

    const alreadyPinned =
      group.pinnedMessage?.toString() === req.params.messageId;
    group.pinnedMessage = alreadyPinned ? null : req.params.messageId;
    await group.save();

    const populatedGroup = await Group.findById(group._id).populate({
      path: "pinnedMessage",
      populate: { path: "sender", select: "username" },
    });

    // Broadcast to group room
    const io = req.app.get("io");
    if (io) {
      io.to(req.params.groupId).emit("message pinned", {
        groupId: req.params.groupId,
        pinnedMessage: populatedGroup.pinnedMessage,
      });
    }
    res.json({ pinnedMessage: populatedGroup.pinnedMessage });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = groupRouter;

