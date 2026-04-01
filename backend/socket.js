const socketIo = (io) => {
  // Track connected users: socketId -> { user, room }
  const connectedUsers = new Map();
  // Track online users by userId -> Set<socketId> (for DM delivery)
  const userSocketMap = new Map();

  // Helper: broadcast updated online user IDs to all clients
  const broadcastOnlineUsers = () => {
    io.emit("online users", Array.from(userSocketMap.keys()));
  };

  // Create deterministic DM room name from two user IDs
  const getDMRoom = (id1, id2) => {
    return [id1, id2].sort().join("_dm_");
  };

  io.on("connection", (socket) => {
    const user = socket.handshake.auth.user;
    console.log("User connected:", user?.username);

    // Register user in online map
    if (user?._id) {
      const uid = user._id.toString();
      if (!userSocketMap.has(uid)) {
        userSocketMap.set(uid, new Set());
      }
      userSocketMap.get(uid).add(socket.id);
      broadcastOnlineUsers();
    }

    //!START: Join Group Room Handler
    socket.on("join room", (groupId) => {
      socket.join(groupId);
      connectedUsers.set(socket.id, { user, room: groupId });
      const usersInRoom = Array.from(connectedUsers.values())
        .filter((u) => u.room === groupId)
        .map((u) => u.user);
      io.in(groupId).emit("users in room", usersInRoom);
      socket.to(groupId).emit("notification", {
        type: "USER_JOINED",
        message: `${user.username} has joined the chat`,
        user: user,
      });
    });
    //!END: Join Group Room Handler

    //!START: Leave Group Room Handler
    socket.on("leave room", (groupId) => {
      console.log(`${user?.username} leaving chat:`, groupId);
      socket.leave(groupId);
      if (connectedUsers.has(socket.id)) {
        connectedUsers.delete(socket.id);
        socket.to(groupId).emit("user left", user?._id);
      }
    });
    //!END: Leave Group Room Handler

    //!START: Group New Message Handler
    socket.on("new message", (message) => {
      socket.to(message.groupId).emit("message received", message);
    });
    //!END: Group New Message Handler

    //!START: Join DM Room Handler
    socket.on("join dm", (recipientId) => {
      if (!user?._id) return;
      const dmRoom = getDMRoom(user._id.toString(), recipientId.toString());
      if (socket.currentDMRoom && socket.currentDMRoom !== dmRoom) {
        socket.leave(socket.currentDMRoom);
      }
      socket.join(dmRoom);
      socket.currentDMRoom = dmRoom;
    });
    //!END: Join DM Room Handler

    //!START: DM Message Handler
    socket.on("dm message", (message) => {
      const { recipientId } = message;
      if (!user?._id || !recipientId) return;

      // Send to recipient sockets directly (supports both online and room-joined users)
      const recipientSockets = userSocketMap.get(recipientId.toString());
      if (recipientSockets) {
        recipientSockets.forEach((sockId) => {
          io.to(sockId).emit("dm received", message);
        });
      }
    });
    //!END: DM Message Handler

    //!START: DM Typing Indicators
    socket.on("dm typing", (recipientId) => {
      if (!user?._id || !recipientId) return;
      const dmRoom = getDMRoom(user._id.toString(), recipientId.toString());
      socket.to(dmRoom).emit("dm typing", { username: user.username });
    });

    socket.on("dm stop typing", (recipientId) => {
      if (!user?._id || !recipientId) return;
      const dmRoom = getDMRoom(user._id.toString(), recipientId.toString());
      socket.to(dmRoom).emit("dm stopped typing");
    });
    //!END: DM Typing Indicators

    //!START: Group Typing Indicator
    socket.on("typing", (groupId, username) => {
      socket.to(groupId).emit("typing", { username });
    });

    socket.on("stop typing", (groupId) => {
      socket.to(groupId).emit("stopped typing", { username: user?.username });
    });
    //!END: Group Typing Indicator

    //!START: Reaction Handler
    // Broadcast reaction update to all relevant participants
    socket.on("reaction update", ({ message, roomId, isDM, recipientId }) => {
      if (isDM && user?._id && recipientId) {
        const dmRoom = getDMRoom(user._id.toString(), recipientId.toString());
        socket.to(dmRoom).emit("reaction updated", message);
      } else if (roomId) {
        socket.to(roomId).emit("reaction updated", message);
      }
    });
    //!END: Reaction Handler

    //!START: Disconnect Handler
    socket.on("disconnect", () => {
      console.log(`${user?.username} disconnected`);
      if (connectedUsers.has(socket.id)) {
        const userData = connectedUsers.get(socket.id);
        socket.to(userData.room).emit("user left", user?._id);
        connectedUsers.delete(socket.id);
      }
      if (user?._id) {
        const uid = user._id.toString();
        if (userSocketMap.has(uid)) {
          const sockets = userSocketMap.get(uid);
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            userSocketMap.delete(uid);
          }
        }
        broadcastOnlineUsers();
      }
    });
    //!END: Disconnect Handler
  });
};

module.exports = socketIo;
