import { useState, useEffect, useRef, useCallback } from "react";
import {
  getMessages,
  sendMessage as sendMessageAPI,
  reactToMessage,
  deleteMessage,
  votePoll,
  pinMessage,
  createPoll,
} from "../../services/api";
import { getSocket } from "../../services/socket";
import {
  Send,
  ChevronLeft,
  Info,
  MessageCircle,
  Hash,
  Search,
  X,
  Smile,
  Trash,
  BarChart2,
  Pin,
  CornerUpLeft,
} from "lucide-react";
import EmojiPicker, { QUICK_EMOJIS } from "./EmojiPicker";
import CreatePollModal from "./CreatePollModal";

// Audio notification sound
const notificationSound = new Audio("/ping.mp3");

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
  onGroupUpdated,
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
  // New feature state
  const [pinnedMessage, setPinnedMessage] = useState(group?.pinnedMessage || null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showPollModal, setShowPollModal] = useState(false);
  const messagesEndRef = useRef(null);
  const pinnedRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  const searchRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Sync pinned message when group changes
  useEffect(() => {
    setPinnedMessage(group?.pinnedMessage || null);
  }, [group?._id, group?.pinnedMessage]);

  // Fetch messages when group changes
  useEffect(() => {
    if (!group) return;

    const fetchMessages = async () => {
      setLoading(true);
      
      // Fast load from cache
      const cacheKey = `chat_messages_group_${group._id}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          setMessages(JSON.parse(cached));
        } catch (e) {
          console.error("Error parsing cache", e);
        }
      }

      if (!navigator.onLine) {
         setLoading(false);
         return;
      }

      try {
        const { data } = await getMessages(group._id);
        setMessages(data.reverse());
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
    setReplyingTo(null);
  }, [group, user._id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Save last 100 non-pending messages to cache
  useEffect(() => {
    if (!group || messages.length === 0) return;
    const cacheKey = `chat_messages_group_${group._id}`;
    const toSave = messages.filter(m => !m.isPending).slice(-100);
    localStorage.setItem(cacheKey, JSON.stringify(toSave));
  }, [messages, group?._id]);

  // Listen for background sync event to refetch synced messages
  useEffect(() => {
    const handleSync = async () => {
      if (!group) return;
      try {
        const { data } = await getMessages(group._id);
        setMessages(data.reverse());
      } catch (e) {
        console.error("Failed to fetch synced messages", e);
      }
    };
    window.addEventListener("messages-synced", handleSync);
    return () => window.removeEventListener("messages-synced", handleSync);
  }, [group?._id]);

  // Socket listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !group) return;

    const currentUserId = user?._id;

    const handleMessageReceived = (message) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });
      if (message.sender?._id !== currentUserId) {
        setNotifications((prev) => [
          ...prev,
          {
            id: Date.now(),
            message: `${message.sender?.username || "Someone"} sent a message`,
          },
        ]);
        setTimeout(() => {
          setNotifications((prev) => prev.slice(1));
        }, 3000);
      }
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
      notificationSound.play().catch(e => console.log('Audio playback prevented', e));
    };

    const handleReactionUpdated = (updatedMessage) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === updatedMessage._id ? updatedMessage : m)),
      );
    };

    const handleMessageDeleted = (deletedMessageId) => {
      setMessages((prev) => prev.filter((m) => m._id !== deletedMessageId));
    };

    // Poll updated in real-time
    const handlePollUpdated = (updatedMessage) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === updatedMessage._id ? updatedMessage : m))
      );
    };

    // Message pinned in real-time
    const handleMessagePinned = ({ pinnedMessage: pm }) => {
      setPinnedMessage(pm);
    };

    socket.on("message received", handleMessageReceived);
    socket.on("typing", handleTyping);
    socket.on("stopped typing", handleStoppedTyping);
    socket.on("notification", handleNotification);
    socket.on("reaction updated", handleReactionUpdated);
    socket.on("message deleted", handleMessageDeleted);
    socket.on("poll updated", handlePollUpdated);
    socket.on("message pinned", handleMessagePinned);

    return () => {
      socket.off("message received", handleMessageReceived);
      socket.off("typing", handleTyping);
      socket.off("stopped typing", handleStoppedTyping);
      socket.off("notification", handleNotification);
      socket.off("reaction updated", handleReactionUpdated);
      socket.off("message deleted", handleMessageDeleted);
      socket.off("poll updated", handlePollUpdated);
      socket.off("message pinned", handleMessagePinned);
    };
  }, [group, user?._id]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !group) return;

    if (!navigator.onLine) {
       const fakeMsg = {
           _id: `temp_${Date.now()}`,
           content: newMessage.trim(),
           sender: user,
           createdAt: new Date().toISOString(),
           isPending: true
       };
       setMessages(prev => [...prev, fakeMsg]);
       
       const queueStr = localStorage.getItem("offline_message_queue") || "[]";
       const queue = JSON.parse(queueStr);
       queue.push({
           type: "group",
           groupId: group._id,
           content: fakeMsg.content
       });
       localStorage.setItem("offline_message_queue", JSON.stringify(queue));
       
       setNewMessage("");
       setShowEmojiPicker(false);
       inputRef.current?.focus();
       return;
    }

    const socket = getSocket();
    try {
      const { data: savedMessage } = await sendMessageAPI({
        content: newMessage.trim(),
        groupId: group._id,
        ...(replyingTo && { replyTo: replyingTo._id }),
      });

      setMessages((prev) => [...prev, savedMessage]);
      setReplyingTo(null);

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

  // ── Poll voting ───────────────────────────────────────────────────────────
  const handleVotePoll = async (messageId, optionIndex) => {
    try {
      const { data: updated } = await votePoll(messageId, optionIndex);
      setMessages((prev) =>
        prev.map((m) => (m._id === updated._id ? updated : m))
      );
    } catch (err) {
      console.error("Failed to vote:", err);
    }
  };

  // ── Pin message ───────────────────────────────────────────────────────────
  const handlePinMessage = async (messageId) => {
    try {
      const { data } = await pinMessage(group._id, messageId);
      setPinnedMessage(data.pinnedMessage);
    } catch (err) {
      console.error("Failed to pin message:", err);
    }
  };

  // ── Create poll ───────────────────────────────────────────────────────────
  const handleCreatePoll = async (question, options) => {
    const socket = getSocket();
    const { data: savedMessage } = await createPoll(group._id, question, options);
    setMessages((prev) => [...prev, savedMessage]);
    if (socket) {
      socket.emit("new message", { ...savedMessage, groupId: group._id });
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

  const handleDeleteMessage = async (messageId) => {
    try {
      await deleteMessage(messageId);
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
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

  const isAdmin = group?.admin?._id === user._id || group?.admin === user._id;
  const totalVotes = (options) => options.reduce((s, o) => s + (o.votes?.length || 0), 0);
  const hasVoted = (option) => option.votes?.some((v) => v === user._id || v?._id === user._id || v?.toString() === user._id?.toString());

  return (
    <div className="chat-area">
      {/* Create Poll Modal */}
      {showPollModal && (
        <CreatePollModal
          onClose={() => setShowPollModal(false)}
          onCreate={handleCreatePoll}
        />
      )}

      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-left">
          <button className="chat-header-toggle" onClick={onToggleSidebar} title="Back to Chats">
            <ChevronLeft size={24} />
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

      {/* Pinned Message Banner */}
      {pinnedMessage && (
        <div
          className="pinned-message-banner"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 16px",
            background: "var(--bg-secondary)",
            borderBottom: "1px solid var(--border-primary)",
            fontSize: "0.82rem",
            cursor: "pointer",
          }}
          onClick={() => {
            const el = document.getElementById(`msg-${pinnedMessage._id}`);
            el?.scrollIntoView({ behavior: "smooth", block: "center" });
          }}
        >
          <Pin size={13} style={{ color: "var(--primary-400)", flexShrink: 0 }} />
          <span style={{ color: "var(--primary-400)", fontWeight: 600, marginRight: 4 }}>Pinned:</span>
          <span style={{ color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {pinnedMessage.sender?.username}: {pinnedMessage.content}
          </span>
          {isAdmin && (
            <button
              style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--gray-500)" }}
              onClick={(e) => { e.stopPropagation(); handlePinMessage(pinnedMessage._id); }}
              title="Unpin"
            >
              <X size={13} />
            </button>
          )}
        </div>
      )}

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
                id={`msg-${item._id}`}
                key={item._id}
                className={`message-wrapper ${isSelf ? "message-wrapper-self" : "message-wrapper-other"}`}
                onMouseEnter={() => setHoveredMsg(item._id)}
                onMouseLeave={() => setHoveredMsg(null)}
              >
                {!isSelf && (
                  <div
                    className="message-avatar"
                    style={{ background: getAvatarColor(item.sender?.username) }}
                  >
                    {item.sender?.username?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="message-content">
                  {!isSelf && (
                    <span className="message-sender">{item.sender?.username}</span>
                  )}

                  {/* Reply-to preview */}
                  {item.replyTo && (
                    <div
                      style={{
                        background: "var(--bg-secondary)",
                        borderLeft: "3px solid var(--primary-400)",
                        borderRadius: "6px",
                        padding: "4px 10px",
                        marginBottom: 4,
                        fontSize: "0.78rem",
                        color: "var(--text-secondary)",
                        cursor: "pointer",
                        maxWidth: 320,
                      }}
                      onClick={() => {
                        const el = document.getElementById(`msg-${item.replyTo._id}`);
                        el?.scrollIntoView({ behavior: "smooth", block: "center" });
                      }}
                    >
                      <span style={{ fontWeight: 600, color: "var(--primary-400)" }}>
                        {item.replyTo.sender?.username || "User"}
                      </span>
                      <br />
                      <span style={{ opacity: 0.8 }}>
                        {item.replyTo.content?.slice(0, 60)}{item.replyTo.content?.length > 60 ? "…" : ""}
                      </span>
                    </div>
                  )}

                  <div className="message-bubble-wrap">
                    {/* Poll message */}
                    {item.isPoll ? (
                      <div
                        className={`message-bubble ${isSelf ? "message-bubble-self" : "message-bubble-other"}`}
                        style={{ minWidth: 220, maxWidth: 300, padding: "12px 14px" }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                          <BarChart2 size={15} style={{ color: "var(--primary-300)" }} />
                          <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{item.pollData?.question}</span>
                        </div>
                        {item.pollData?.options?.map((opt, idx) => {
                          const total = totalVotes(item.pollData.options);
                          const pct = total > 0 ? Math.round((opt.votes?.length || 0) / total * 100) : 0;
                          const voted = hasVoted(opt);
                          return (
                            <button
                              key={idx}
                              onClick={() => handleVotePoll(item._id, idx)}
                              style={{
                                width: "100%",
                                background: voted ? "rgba(99,102,241,0.2)" : "var(--bg-secondary)",
                                border: voted ? "1.5px solid var(--primary-400)" : "1.5px solid var(--border-primary)",
                                borderRadius: 8,
                                padding: "6px 10px",
                                marginBottom: 6,
                                cursor: "pointer",
                                textAlign: "left",
                                position: "relative",
                                overflow: "hidden",
                                transition: "border 0.2s",
                              }}
                            >
                              <div
                                style={{
                                  position: "absolute", left: 0, top: 0, bottom: 0,
                                  width: `${pct}%`,
                                  background: voted ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.05)",
                                  borderRadius: 8, transition: "width 0.4s ease",
                                }}
                              />
                              <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.82rem" }}>
                                <span>{opt.optionText}</span>
                                <span style={{ fontWeight: 600, color: "var(--primary-300)" }}>{pct}%</span>
                              </div>
                            </button>
                          );
                        })}
                        <div style={{ fontSize: "0.74rem", color: "var(--gray-500)", marginTop: 4 }}>
                          {totalVotes(item.pollData?.options || [])} vote{totalVotes(item.pollData?.options || []) !== 1 ? "s" : ""}
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`message-bubble ${isSelf ? "message-bubble-self" : "message-bubble-other"}`}
                      >
                        {item.content}
                      </div>
                    )}

                    {/* Quick action bar on hover */}
                    {hoveredMsg === item._id && (
                      <div
                        className={`emoji-quick-bar ${isSelf ? "emoji-quick-left" : "emoji-quick-right"}`}
                      >
                        {!item.isPoll && QUICK_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            className={`emoji-quick-btn ${hasUserReacted(item.reactions, emoji) ? "emoji-quick-active" : ""}`}
                            onClick={() => handleReaction(item._id, emoji)}
                          >
                            {emoji}
                          </button>
                        ))}
                        {/* Reply button */}
                        {!item.isPoll && (
                          <button
                            className="emoji-quick-btn"
                            onClick={() => { setReplyingTo(item); inputRef.current?.focus(); }}
                            title="Reply"
                          >
                            <CornerUpLeft size={14} />
                          </button>
                        )}
                        {/* Pin button (admin only) */}
                        {isAdmin && (
                          <button
                            className="emoji-quick-btn"
                            onClick={() => handlePinMessage(item._id)}
                            title={pinnedMessage?._id === item._id ? "Unpin" : "Pin"}
                            style={{ color: pinnedMessage?._id === item._id ? "var(--primary-400)" : undefined }}
                          >
                            <Pin size={14} />
                          </button>
                        )}
                        {isSelf && (
                          <button
                            className="emoji-quick-btn text-red-500"
                            onClick={() => handleDeleteMessage(item._id)}
                            title="Delete message"
                          >
                            <Trash size={14} color="#ef4444" />
                          </button>
                        )}
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
                    {item.isPending && <span style={{marginRight: "4px"}}>⏳</span>}
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
        {/* Reply context */}
        {replyingTo && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              background: "var(--bg-secondary)",
              borderTop: "1px solid var(--border-primary)",
              fontSize: "0.8rem",
              color: "var(--text-secondary)",
            }}
          >
            <CornerUpLeft size={13} style={{ color: "var(--primary-400)" }} />
            <span style={{ fontWeight: 600, color: "var(--primary-400)" }}>
              {replyingTo.sender?.username}
            </span>
            <span style={{ opacity: 0.7, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>
              {replyingTo.content?.slice(0, 60)}
            </span>
            <button
              style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--gray-400)" }}
              onClick={() => setReplyingTo(null)}
            >
              <X size={14} />
            </button>
          </div>
        )}
        <div className="chat-input-wrapper">
          <div className="chat-input-actions">
            <button
              className={`chat-input-icon-btn ${showEmojiPicker ? "chat-input-icon-active" : ""}`}
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              title="Emoji"
            >
              <Smile size={20} />
            </button>
            <button
              className="chat-input-icon-btn"
              onClick={() => setShowPollModal(true)}
              title="Create Poll"
            >
              <BarChart2 size={19} />
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
