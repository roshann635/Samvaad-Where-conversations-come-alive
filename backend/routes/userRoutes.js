const express = require("express");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/UserModel");
const userRouter = express.Router();
const jwt = require("jsonwebtoken");
const { protect } = require("../middlewares/authMiddleware");

const generateEmailOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const sendEmail = async (to, subject, html) => {
  if (process.env.NODE_ENV === "test") {
    console.log(`[test] Mock Email to ${to}: ${subject} - ${html}`);
    return;
  }

  if (
    !process.env.EMAIL_HOST ||
    !process.env.EMAIL_PORT ||
    !process.env.EMAIL_USER ||
    !process.env.EMAIL_PASS
  ) {
    throw new Error(
      "Email environment not configured (EMAIL_HOST/EMAIL_PORT/EMAIL_USER/EMAIL_PASS required)",
    );
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    html,
  });
};

//Register route
userRouter.post("/register", async (req, res) => {
  let newUser = null;
  try {
    const { username, email, password, adminCode } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const isAdmin =
      adminCode &&
      process.env.ADMIN_SECRET &&
      adminCode === process.env.ADMIN_SECRET;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const verificationToken = generateEmailOtp();
    const verificationExpires = Date.now() + 60 * 60 * 1000; // 1 hour

    // Create new user
    newUser = await User.create({
      username,
      email,
      password,
      isAdmin,
      emailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    });

    const verificationURL = `${
      process.env.CLIENT_URL || "http://localhost:5173"
    }/verify-email?token=${verificationToken}&email=${encodeURIComponent(
      email,
    )}`;

    await sendEmail(
      email,
      "Samvaad Email Verification",
      `<p>Hello ${username},</p><p>Your verification code is: <strong>${verificationToken}</strong></p><p>You can also click here to verify: <a href="${verificationURL}">Verify Email</a></p><p>This code is valid for one hour.</p>`,
    );

    return res.status(201).json({
      _id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      isAdmin: newUser.isAdmin,
      emailVerified: newUser.emailVerified,
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
    const { email, password, adminCode } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.emailVerified) {
      return res.status(401).json({ message: "Email not verified" });
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
          isAdmin: user.isAdmin,
          emailVerified: user.emailVerified,
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

// Email verification endpoint
userRouter.post("/verify-email", async (req, res) => {
  try {
    const { email, token } = req.body;
    if (!email || !token) {
      return res.status(400).json({ message: "Email and token are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (
      !user.emailVerificationToken ||
      !user.emailVerificationExpires ||
      user.emailVerificationExpires < Date.now()
    ) {
      return res
        .status(400)
        .json({ message: "Verification token is expired or not set" });
    }

    if (user.emailVerificationToken !== token) {
      return res.status(400).json({ message: "Invalid verification token" });
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return res.json({ message: "Email verified" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

userRouter.post("/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    const token = generateEmailOtp();
    user.emailVerificationToken = token;
    user.emailVerificationExpires = Date.now() + 60 * 60 * 1000;
    await user.save();

    const verificationURL = `${
      process.env.CLIENT_URL || "http://localhost:5173"
    }/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

    await sendEmail(
      email,
      "Samvaad Email Verification",
      `<p>Your verification code is: <strong>${token}</strong></p><p>You can also click <a href="${verificationURL}">this link</a> to verify automatically.</p><p>This code is valid for one hour.</p>`,
    );

    return res.json({ message: "Verification email resent" });
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
    if (!req.user.emailVerified) {
      return res
        .status(403)
        .json({ message: "Verify email before updating profile" });
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
