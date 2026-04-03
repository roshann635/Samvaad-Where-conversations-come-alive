const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const socketio = require("socket.io");
const userRoutes = require("./routes/userRoutes");
const socketIo = require("./socket");
const groupRouter = require("./routes/groupRoutes");
const messageRouter = require("./routes/messageRoutes");
dotenv.config();

const app = express();
const server = http.createServer(app);

const defaultOrigins = ["http://localhost:5173", "http://localhost:5174"];
const CORS_ORIGIN = process.env.CLIENT_URL
  ? [process.env.CLIENT_URL]
  : defaultOrigins;

const io = socketio(server, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.set("io", io);

//middlewares

const allowedOrigins = process.env.CLIENT_URL
  ? [process.env.CLIENT_URL]
  : [
      "https://samvaad-where-conversations-come-al.vercel.app",
      "https://samvaad-where-conversations-come-alive-sr7t1wv88.vercel.app",
      "http://localhost:5173",
      "http://localhost:5174",
    ];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
      } else if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else if (origin.endsWith(".vercel.app")) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy: Origin ${origin} not allowed`));
      }
    },
    credentials: true,
  }),
);
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Samvaad API is running 🚀");
});

const User = require("./models/UserModel");

//connect to db (skip in tests because local in-memory db will handle connection)
if (process.env.NODE_ENV !== "test") {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(async () => {
      console.log("Connected to MongoDB");
      // Ensure Samvaad AI Bot exists
      try {
        const botExists = await User.findOne({ isBot: true });
        if (!botExists) {
          const bcrypt = require("bcryptjs");
          const hashedPassword = await bcrypt.hash("samvaadaibot123!", 10);
          await User.create({
            username: "Samvaad AI",
            email: "bot@samvaad.ai",
            password: hashedPassword,
            isBot: true,
            isAdmin: false,
          });
          console.log("Samvaad AI Bot created!");
        }
      } catch (err) {
        console.error("Failed to initialize AI bot", err);
      }
    })
    .catch((error) => {
      console.log("Error connecting to MongoDB:", error.message);
    });
}

//Initialize
socketIo(io);

//routes
app.use("/api/users", userRoutes);
app.use("/api/groups", groupRouter);
app.use("/api/messages", messageRouter);

// compatibility aliases for old path expectations
app.post("/login", (req, res, next) => {
  req.url = "/login";
  userRoutes.handle(req, res, next);
});

app.post("/register", (req, res, next) => {
  req.url = "/register";
  userRoutes.handle(req, res, next);
});

//start server
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== "test") {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = { app, server };
