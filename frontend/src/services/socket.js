import { io } from "socket.io-client";

const SOCKET_URL =
  "https://samvaad-where-conversations-come-alive-1.onrender.com";

let socket = null;

export const connectSocket = (user) => {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { user },
    transports: ["websocket", "polling"],
  });

  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error.message);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

export default { connectSocket, disconnectSocket, getSocket };
