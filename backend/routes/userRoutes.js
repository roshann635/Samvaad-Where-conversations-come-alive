const express = require("express");
const User = require("../models/UserModel");
const userRouter = express.Router();
const jwt = require("jsonwebtoken");
const { protect } = require("../middlewares/authMiddleware");

//Register route
userRouter.post("/register", async (req, res) => {
  try {
    const { username, email, password, adminCode } = req.body;
    const isAdmin =
      adminCode &&
      process.env.ADMIN_SECRET &&
      adminCode === process.env.ADMIN_SECRET;

    //Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    //Create new user
    const user = await User.create({
      username,
      email,
      password,
      isAdmin,
    });
    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//Login route
userRouter.post("/login", async (req, res) => {
  try {
    const { email, password, adminCode } = req.body;
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      if (
        adminCode &&
        process.env.ADMIN_SECRET &&
        adminCode === process.env.ADMIN_SECRET &&
        !user.isAdmin
      ) {
        user.isAdmin = true;
        await user.save();
      }
      res.json({
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          isAdmin: user.isAdmin,
          token: generateToken(user._id),
        },
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all users except current user (for DM user picker)
userRouter.get("/", protect, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } }).select(
      "-password",
    );
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update own profile
userRouter.put("/profile", protect, async (req, res) => {
  try {
    const { username } = req.body;
    if (!username || username.trim().length < 2) {
      return res
        .status(400)
        .json({ message: "Username must be at least 2 characters" });
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { username: username.trim() },
      { new: true },
    ).select("-password");
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//generate token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

module.exports = userRouter;
