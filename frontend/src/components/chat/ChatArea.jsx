import { useState, useEffect, useRef, useCallback } from "react";
import {
  getMessages,
  sendMessage as sendMessageAPI,
  reactToMessage,
} from "../../services/api";
import { getSocket } from "../../services/socket";
import {
  Send,
  Menu,
  Info,
  MessageCircle,
  Hash,
  Search,
  X,
  Smile,
} from "lucide-react";
import EmojiPicker, { QUICK_EMOJIS } from "./EmojiPicker";

const groupColors = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#3b82f6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#06b6d4",
];

const getGroupColor = (name) => {
  let hash = 0;
  for (let i = 0; i < name?.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return groupColors[Math.abs(hash) % groupColors.length];
};

const getAvatarColor = (name) => {
  let hash = 0;
  for (let i = 0; i < name?.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return groupColors[Math.abs(hash) % groupColors.length];
};

const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const ChatArea = ({
  group,
  user,
  onToggleSidebar,
  onToggleGroupInfo,
  onlineUsers,
}) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [typingUser, setTypingUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredMsg, setHoveredMsg] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  const searchRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Fetch messages when group changes
  useEffect(() => {
    if (!group) return;

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const { data } = await getMessages(group._id);
        setMessages(data.reverse()); // API returns desc, we need asc
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
    setNotifications([]);
    setTypingUser(null);
    setShowSearch(false);
    setSearchQuery("");
  }, [group]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Socket listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !group) return;

    const handleMessageReceived = (message) => {
      setMessages((prev) => [...prev, message]);
    };

    const handleTyping = ({ username }) => {
      setTypingUser(username);
    };

    const handleStoppedTyping = () => {
      setTypingUser(null);
    };

    const handleNotification = (notification) => {
      setNotifications((prev) => [
        ...prev,
        { ...notification, id: Date.now() },
      ]);
      setTimeout(() => {
        setNotifications((prev) => prev.slice(1));
      }, 5000);
    };

    const handleReactionUpdated = (updatedMessage) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === updatedMessage._id ? updatedMessage : m)),
      );
    };

    socket.on("message received", handleMessageReceived);
    socket.on("typing", handleTyping);
    socket.on("stopped typing", handleStoppedTyping);
    socket.on("notification", handleNotification);
    socket.on("reaction updated", handleReactionUpdated);

    return () => {
      socket.off("message received", handleMessageReceived);
      socket.off("typing", handleTyping);
      socket.off("stopped typing", handleStoppedTyping);
      socket.off("notification", handleNotification);
      socket.off("reaction updated", handleReactionUpdated);
    };
  }, [group]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !group) return;

    const socket = getSocket();
    try {
      const { data: savedMessage } = await sendMessageAPI({
        content: newMessage.trim(),
        groupId: group._id,
      });

      setMessages((prev) => [...prev, savedMessage]);

      // Emit to socket for real-time delivery
      if (socket) {
        socket.emit("new message", {
          ...savedMessage,
          groupId: group._id,
        });
        socket.emit("stop typing", group._id);
      }

      setNewMessage("");
      setShowEmojiPicker(false);
      inputRef.current?.focus();
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);

    const socket = getSocket();
    if (!socket || !group) return;

    socket.emit("typing", group._id, user.username);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop typing", group._id);
    }, 2000);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleReaction = async (messageId, emoji) => {
    try {
      const { data: updatedMessage } = await reactToMessage(messageId, emoji);
      setMessages((prev) =>
        prev.map((m) => (m._id === updatedMessage._id ? updatedMessage : m)),
      );
      // Broadcast via socket
      const socket = getSocket();
      if (socket) {
        socket.emit("reaction update", {
          message: updatedMessage,
          roomId: group._id,
          isDM: false,
        });
      }
    } catch (err) {
      console.error("Failed to react:", err);
    }
    setHoveredMsg(null);
  };

  const handleEmojiForInput = (emoji) => {
    setNewMessage((prev) => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  // Group reactions by emoji for display
  const groupReactions = (reactions = []) => {
    const map = {};
    reactions.forEach((r) => {
      if (!map[r.emoji]) map[r.emoji] = { emoji: r.emoji, users: [], count: 0 };
      map[r.emoji].users.push(r.username);
      map[r.emoji].count++;
    });
    return Object.values(map);
  };

  const hasUserReacted = (reactions = [], emoji) => {
    return reactions.some(
      (r) => r.emoji === emoji && r.userId?.toString() === user._id?.toString(),
    );
  };

  // Group messages by date
  const getMessagesWithDates = () => {
    const result = [];
    let lastDate = null;

    const filtered = searchQuery.trim()
      ? messages.filter(
          (msg) =>
            msg.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            msg.sender?.username
              ?.toLowerCase()
              .includes(searchQuery.toLowerCase()),
        )
      : messages;

    filtered.forEach((msg) => {
      const msgDate = formatDate(msg.createdAt);
      if (msgDate !== lastDate) {
        result.push({ type: "date", date: msgDate, id: `date-${msg._id}` });
        lastDate = msgDate;
      }
      result.push({ type: "message", ...msg });
    });

    return result;
  };

  // Empty state
  if (!group) {
    return (
      <div className="chat-area">
        <div className="chat-empty">
          <div className="chat-empty-icon">
            <MessageCircle size={36} />
          </div>
          <h3 className="chat-empty-title">Welcome to Samvaad</h3>
          <p className="chat-empty-text">
            Select a group from the sidebar to start chatting, or join a new
            group to begin a conversation.
          </p>
        </div>
      </div>
    );
  }

  const messagesWithDates = getMessagesWithDates();

  return (
    <div className="chat-area">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-left">
          <button className="chat-header-toggle" onClick={onToggleSidebar}>
            <Menu size={20} />
          </button>
          <div
            className="chat-header-avatar"
            style={{ background: getGroupColor(group.name) }}
          >
            <Hash size={18} />
          </div>
          <div className="chat-header-info">
            <div className="chat-header-name">{group.name}</div>
            <div className="chat-header-meta">
              <span className="chat-header-online-dot"></span>
              {onlineUsers?.length || 0} online · {group.members?.length} member
              {group.members?.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
        <div className="chat-header-actions">
          <button
            className={`chat-header-btn ${showSearch ? "chat-header-btn-active" : ""}`}
            onClick={() => {
              setShowSearch(!showSearch);
              if (!showSearch)
                setTimeout(() => searchRef.current?.focus(), 100);
            }}
            title="Search messages"
          >
            <Search size={18} />
          </button>
          <button
            className="chat-header-btn"
            onClick={onToggleGroupInfo}
            title="Group Info"
          >
            <Info size={18} />
          </button>
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="chat-search-bar animate-fade-in-down">
          <Search size={16} className="chat-search-icon" />
          <input
            ref={searchRef}
            type="text"
            className="chat-search-input"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <span className="chat-search-count">
              {messagesWithDates.filter((i) => i.type === "message").length}{" "}
              results
            </span>
          )}
          <button
            className="chat-search-close"
            onClick={() => {
              setShowSearch(false);
              setSearchQuery("");
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* notifications */}
      {notifications.map((n) => (
        <div key={n.id} className="chat-notification">
          <span>{n.message}</span>
        </div>
      ))}

      {/* Messages */}
      <div className="chat-messages">
        {loading ? (
          <div className="chat-empty">
            <div
              className="btn-spinner"
              style={{
                width: 32,
                height: 32,
                borderWidth: 3,
                borderColor: "var(--border-light)",
                borderTopColor: "var(--primary-500)",
              }}
            ></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="chat-empty">
            <div className="chat-empty-icon">
              <Send size={28} />
            </div>
            <h3 className="chat-empty-title">No messages yet</h3>
            <p className="chat-empty-text">
              Be the first to send a message in {group.name}!
            </p>
          </div>
        ) : (
          messagesWithDates.map((item) => {
            if (item.type === "date") {
              return (
                <div key={item.id} className="message-date-separator">
                  <span>{item.date}</span>
                </div>
              );
            }

            const isSelf = item.sender?._id === user._id;
            const reactions = groupReactions(item.reactions);

            return (
              <div
                key={item._id}
                className={`message-wrapper ${isSelf ? "message-wrapper-self" : "message-wrapper-other"}`}
                onMouseEnter={() => setHoveredMsg(item._id)}
                onMouseLeave={() => setHoveredMsg(null)}
              >
                {!isSelf && (
                  <div
                    className="message-avatar"
                    style={{
                      background: getAvatarColor(item.sender?.username),
                    }}
                  >
                    {item.sender?.username?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="message-content">
                  {!isSelf && (
                    <span className="message-sender">
                      {item.sender?.username}
                    </span>
                  )}
                  <div className="message-bubble-wrap">
                    <div
                      className={`message-bubble ${isSelf ? "message-bubble-self" : "message-bubble-other"}`}
                    >
                      {item.content}
                    </div>

                    {/* Quick reaction bar on hover */}
                    {hoveredMsg === item._id && (
                      <div
                        className={`emoji-quick-bar ${isSelf ? "emoji-quick-left" : "emoji-quick-right"}`}
                      >
                        {QUICK_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            className={`emoji-quick-btn ${hasUserReacted(item.reactions, emoji) ? "emoji-quick-active" : ""}`}
                            onClick={() => handleReaction(item._id, emoji)}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Reaction pills */}
                  {reactions.length > 0 && (
                    <div
                      className={`reaction-pills ${isSelf ? "reaction-pills-self" : ""}`}
                    >
                      {reactions.map((r) => (
                        <button
                          key={r.emoji}
                          className={`reaction-pill ${hasUserReacted(item.reactions, r.emoji) ? "reaction-pill-active" : ""}`}
                          onClick={() => handleReaction(item._id, r.emoji)}
                          title={r.users.join(", ")}
                        >
                          <span className="reaction-emoji">{r.emoji}</span>
                          <span className="reaction-count">{r.count}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <span
                    className={`message-time ${isSelf ? "message-time-self" : "message-time-other"}`}
                  >
                    {formatTime(item.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {typingUser && (
          <div className="typing-indicator">
            <span className="typing-indicator-text">
              {typingUser} is typing
            </span>
            <div className="typing-indicator-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chat-input-area">
        <div className="chat-input-wrapper">
          <div className="chat-input-actions">
            <button
              className={`chat-input-icon-btn ${showEmojiPicker ? "chat-input-icon-active" : ""}`}
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              title="Emoji"
            >
              <Smile size={20} />
            </button>
            {showEmojiPicker && (
              <EmojiPicker
                onSelect={handleEmojiForInput}
                onClose={() => setShowEmojiPicker(false)}
              />
            )}
          </div>
          <textarea
            ref={inputRef}
            className="chat-input"
            placeholder={`Message #${group.name}`}
            value={newMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button
            className="chat-send-btn"
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            title="Send message"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
