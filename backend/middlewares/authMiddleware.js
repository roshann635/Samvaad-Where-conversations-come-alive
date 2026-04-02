const jwt = require("jsonwebtoken");
const User = require("../models/UserModel");

const protect = async (req, res, next) => {
  //get the token the user is passing
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        return res
          .status(401)
          .json({ error: "Not authorized, user not found" });
      }
      req.user = user;
      return next();
    } catch (error) {
      return res.status(401).json({ error: "Not authorized, token failed" });
    }
  }
  if (!token) {
    return res.status(401).json({ error: "Not authorized, no token" });
  }
};

const isAdmin = async (req, res, next) => {
  try {
    if (req.user && req.user.isAdmin) {
      next();
    } else {
      res.status(403).json({ error: "Not authorized as an admin" });
    }
  } catch (error) {
    res.status(401).json({ error: "Server error" });
  }
};

module.exports = {
  protect,
  isAdmin,
};
