const express = require("express");
const User = require("../models/UserModel");
const userRouter = express.Router();
const jwt = require("jsonwebtoken");
const { protect } = require("../middlewares/authMiddleware");

//Register route
userRouter.post("/register", async (req, res) => {
  let newUser = null;
  try {
    const { username, email, password, adminCode, mobileNumber } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Username, email and password are required" });
    }
    const isAdmin =
      adminCode &&
      process.env.ADMIN_SECRET &&
      adminCode === process.env.ADMIN_SECRET;

    // Check if user already exists based on email or mobileNumber
    const existingConditions = [{ email }];
    if (mobileNumber) {
      existingConditions.push({ mobileNumber });
    }
    const userExists = await User.findOne({ $or: existingConditions });
    
    if (userExists) {
      return res.status(400).json({ message: "User with this email or mobile number already exists" });
    }

    // Create new user directly (no email verification requirement)
    newUser = await User.create({
      username,
      email,
      password,
      mobileNumber: mobileNumber || undefined,
      isAdmin,
    });

    return res.status(201).json({
      _id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      mobileNumber: newUser.mobileNumber,
      isAdmin: newUser.isAdmin,
    });
  } catch (error) {
    if (newUser) {
      await User.deleteOne({ _id: newUser._id });
    }
    return res.status(500).json({ message: error.message });
  }
});

//Login route
userRouter.post("/login", async (req, res) => {
  try {
    const { identifier, password, adminCode } = req.body;
    
    if (!identifier || !password) {
      return res.status(400).json({ message: "Please provide an email/mobile number and password" });
    }

    const user = await User.findOne({
      $or: [{ email: identifier }, { mobileNumber: identifier }]
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

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
          mobileNumber: user.mobileNumber,
          isAdmin: user.isAdmin,
          emailVerified: user.emailVerified,
          token: generateToken(user._id),
        },
      });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
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
