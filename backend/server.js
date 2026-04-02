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

//middlewares

app.use(
  cors({
    origin: "https://samvaad-where-conversations-come-al.vercel.app",
    credentials: true,
  }),
);
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Samvaad API is running 🚀");
});

//connect to db (skip in tests because local in-memory db will handle connection)
if (process.env.NODE_ENV !== "test") {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log("Connected to MongoDB");
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
