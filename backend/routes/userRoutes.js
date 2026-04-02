const express = require("express");
const User = require("../models/UserModel");
const userRouter = express.Router();
const jwt = require("jsonwebtoken");
const { protect } = require("../middlewares/authMiddleware");

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const sendSms = async (to, body) => {
  // legacy placeholder; real provider removed
  console.log(`Mock SMS to ${to}: ${body}`);
  return Promise.resolve();
};

//Register route
userRouter.post("/register", async (req, res) => {
  try {
    const { username, mobile, email, password, adminCode } = req.body;
    if (!username || !mobile || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const isAdmin =
      adminCode &&
      process.env.ADMIN_SECRET &&
      adminCode === process.env.ADMIN_SECRET;

    //Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const mobileExists = await User.findOne({ mobile });
    if (mobileExists) {
      return res.status(400).json({ message: "Mobile number already in use" });
    }

    //Create new user
    const user = await User.create({
      username,
      mobile,
      email,
      password,
      isAdmin,
    });
    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        mobile: user.mobile,
        isAdmin: user.isAdmin,
        mobileVerified: user.mobileVerified,
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//Login route
userRouter.post("/login", async (req, res) => {
  try {
    const { email, password, mobile, adminCode } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.mobile !== mobile) {
      return res.status(401).json({ message: "Mobile number does not match" });
    }

    if (!user.mobileVerified) {
      return res.status(401).json({ message: "Mobile not verified" });
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
          mobile: user.mobile,
          isAdmin: user.isAdmin,
          mobileVerified: user.mobileVerified,
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

// Send OTP to registered mobile
userRouter.post("/send-otp", async (req, res) => {
  try {
    const { mobile } = req.body;
    if (!mobile) {
      return res.status(400).json({ message: "Mobile is required" });
    }

    const user = await User.findOne({ mobile });
    if (!user) {
      return res
        .status(404)
        .json({ message: "User with this mobile not found" });
    }

    const now = Date.now();
    if (user.otpLockedUntil && user.otpLockedUntil > now) {
      return res.status(429).json({
        message: "Your account is temporarily locked. Try again later.",
      });
    }

    if (
      user.otpResendCount >= 5 &&
      user.otpSentAt &&
      now - user.otpSentAt < 60 * 60 * 1000
    ) {
      return res
        .status(429)
        .json({ message: "Too many OTP requests. Try again in an hour." });
    }

    if (!user.otpSentAt || now - user.otpSentAt > 60 * 60 * 1000) {
      user.otpResendCount = 0;
    }

    const otpCode = generateOTP();
    user.otpCode = otpCode;
    user.otpExpires = new Date(now + 5 * 60 * 1000);
    user.otpAttempts = 0;
    user.otpLockedUntil = undefined;
    user.otpResendCount = (user.otpResendCount || 0) + 1;
    user.otpSentAt = new Date(now);
    await user.save();

    const messageBody = `Your Samvaad OTP is ${otpCode}. It expires in 5 minutes.`;

    try {
      await sendSms(mobile, messageBody);
    } catch (smsError) {
      // fallback for dev/testing
      console.warn(
        "Twilio send failed, falling back to console output",
        smsError.message,
      );
    }

    return res.json({ message: "OTP sent" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Verify OTP
userRouter.post("/verify-otp", async (req, res) => {
  try {
    const { mobile, otp } = req.body;
    if (!mobile || !otp) {
      return res.status(400).json({ message: "Mobile and OTP are required" });
    }
    const user = await User.findOne({ mobile });
    if (!user) {
      return res
        .status(404)
        .json({ message: "User with this mobile not found" });
    }

    const now = Date.now();
    if (user.otpLockedUntil && user.otpLockedUntil > now) {
      return res
        .status(429)
        .json({ message: "Too many invalid attempts. Try again later." });
    }

    if (!user.otpCode || !user.otpExpires || user.otpExpires < now) {
      return res.status(400).json({ message: "OTP expired or not sent" });
    }

    if (user.otpCode !== otp) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      if (user.otpAttempts >= 5) {
        user.otpLockedUntil = new Date(now + 15 * 60 * 1000); // lock 15 min
      }
      await user.save();
      return res.status(400).json({ message: "Invalid OTP" });
    }

    user.mobileVerified = true;
    user.otpCode = undefined;
    user.otpExpires = undefined;
    user.otpAttempts = 0;
    user.otpLockedUntil = undefined;
    user.otpResendCount = 0;
    user.otpSentAt = undefined;
    await user.save();

    return res.json({ message: "Mobile verified" });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
    if (!req.user.mobileVerified) {
      return res
        .status(403)
        .json({ message: "Verify mobile before updating profile" });
    }

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
