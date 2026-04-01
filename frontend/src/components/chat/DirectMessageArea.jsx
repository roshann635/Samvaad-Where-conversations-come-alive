import { useState, useEffect, useRef, useCallback } from 'react';
import { getDMs, sendDM as sendDMAPI, reactToMessage } from '../../services/api';
import { getSocket } from '../../services/socket';
import { Send, Menu, MessageCircle, Search, X, Smile } from 'lucide-react';
import EmojiPicker, { QUICK_EMOJIS } from './EmojiPicker';

const avatarColors = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#3b82f6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4'
];

const getAvatarColor = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
};

const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
};

const DirectMessageArea = ({ recipient, currentUser, onToggleSidebar, onlineUserIds = [] }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUser, setTypingUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredMsg, setHoveredMsg] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  const searchRef = useRef(null);

  const isOnline = onlineUserIds.includes(recipient?._id);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Fetch history when recipient changes
  useEffect(() => {
    if (!recipient) return;
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const { data } = await getDMs(recipient._id);
        setMessages(data);
      } catch (err) {
        console.error('Failed to fetch DMs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
    setTypingUser(null);
    setShowSearch(false);
    setSearchQuery('');
  }, [recipient?._id]);

  // Join DM room + socket listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !recipient) return;

    // Join the private DM room
    socket.emit('join dm', recipient._id);

    const handleDMReceived = (message) => {
      setMessages(prev => [...prev, message]);
    };

    const handleTyping = ({ username }) => {
      setTypingUser(username);
    };

    const handleStoppedTyping = () => {
      setTypingUser(null);
    };

    const handleReactionUpdated = (updatedMessage) => {
      setMessages(prev => prev.map(m =>
        m._id === updatedMessage._id ? updatedMessage : m
      ));
    };

    socket.on('dm received', handleDMReceived);
    socket.on('dm typing', handleTyping);
    socket.on('dm stopped typing', handleStoppedTyping);
    socket.on('reaction updated', handleReactionUpdated);

    return () => {
      socket.off('dm received', handleDMReceived);
      socket.off('dm typing', handleTyping);
      socket.off('dm stopped typing', handleStoppedTyping);
      socket.off('reaction updated', handleReactionUpdated);
    };
  }, [recipient?._id]);

  // Scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !recipient) return;
    const socket = getSocket();
    try {
      const { data: savedMessage } = await sendDMAPI({
        content: newMessage.trim(),
        recipientId: recipient._id,
      });
      setMessages(prev => [...prev, savedMessage]);
      if (socket) {
        socket.emit('dm message', { ...savedMessage, recipientId: recipient._id });
        socket.emit('dm stop typing', recipient._id);
      }
      setNewMessage('');
      setShowEmojiPicker(false);
      inputRef.current?.focus();
    } catch (err) {
      console.error('Failed to send DM:', err);
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    const socket = getSocket();
    if (!socket || !recipient) return;
    socket.emit('dm typing', recipient._id);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('dm stop typing', recipient._id);
    }, 2000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleReaction = async (messageId, emoji) => {
    try {
      const { data: updatedMessage } = await reactToMessage(messageId, emoji);
      setMessages(prev => prev.map(m =>
        m._id === updatedMessage._id ? updatedMessage : m
      ));
      const socket = getSocket();
      if (socket) {
        socket.emit('reaction update', {
          message: updatedMessage,
          isDM: true,
          recipientId: recipient._id,
        });
      }
    } catch (err) {
      console.error('Failed to react:', err);
    }
    setHoveredMsg(null);
  };

  const handleEmojiForInput = (emoji) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const groupReactions = (reactions = []) => {
    const map = {};
    reactions.forEach(r => {
      if (!map[r.emoji]) map[r.emoji] = { emoji: r.emoji, users: [], count: 0 };
      map[r.emoji].users.push(r.username);
      map[r.emoji].count++;
    });
    return Object.values(map);
  };

  const hasUserReacted = (reactions = [], emoji) => {
    return reactions.some(r => r.emoji === emoji && r.userId?.toString() === currentUser._id?.toString());
  };

  // Group messages by date
  const getMessagesWithDates = () => {
    const result = [];
    let lastDate = null;

    const filtered = searchQuery.trim()
      ? messages.filter(msg =>
          msg.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          msg.sender?.username?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : messages;

    filtered.forEach((msg) => {
      const msgDate = formatDate(msg.createdAt);
      if (msgDate !== lastDate) {
        result.push({ type: 'date', date: msgDate, id: `date-${msg._id}` });
        lastDate = msgDate;
      }
      result.push({ type: 'message', ...msg });
    });
    return result;
  };

  if (!recipient) {
    return (
      <div className="chat-area">
        <div className="chat-empty">
          <div className="chat-empty-icon">
            <MessageCircle size={36} />
          </div>
          <h3 className="chat-empty-title">Your Messages</h3>
          <p className="chat-empty-text">
            Select a conversation or start a new direct message.
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
          <div className="chat-header-avatar-wrap">
            <div
              className="chat-header-avatar"
              style={{ background: getAvatarColor(recipient.username), borderRadius: '50%' }}
            >
              {recipient.username.charAt(0).toUpperCase()}
            </div>
            <span className={`presence-dot presence-dot-header ${isOnline ? 'presence-online' : 'presence-offline'}`}></span>
          </div>
          <div className="chat-header-info">
            <div className="chat-header-name">{recipient.username}</div>
            <div className="chat-header-meta">
              <span className={`chat-header-online-dot ${isOnline ? '' : 'chat-header-offline-dot'}`}></span>
              {isOnline ? 'Online' : 'Offline'} · {recipient.email}
            </div>
          </div>
        </div>
        <div className="chat-header-actions">
          <button
            className={`chat-header-btn ${showSearch ? 'chat-header-btn-active' : ''}`}
            onClick={() => { setShowSearch(!showSearch); if (!showSearch) setTimeout(() => searchRef.current?.focus(), 100); }}
            title="Search messages"
          >
            <Search size={18} />
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
              {messagesWithDates.filter(i => i.type === 'message').length} results
            </span>
          )}
          <button className="chat-search-close" onClick={() => { setShowSearch(false); setSearchQuery(''); }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="chat-messages">
        {loading ? (
          <div className="chat-empty">
            <div className="btn-spinner" style={{ width: 32, height: 32, borderWidth: 3, borderColor: 'var(--border-light)', borderTopColor: 'var(--primary-500)' }}></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="chat-empty">
            <div className="chat-empty-icon">
              <MessageCircle size={28} />
            </div>
            <h3 className="chat-empty-title">Send a message</h3>
            <p className="chat-empty-text">
              This is the beginning of your conversation with {recipient.username}.
            </p>
          </div>
        ) : (
          messagesWithDates.map((item) => {
            if (item.type === 'date') {
              return (
                <div key={item.id} className="message-date-separator">
                  <span>{item.date}</span>
                </div>
              );
            }
            const isSelf = item.sender?._id === currentUser._id;
            const reactions = groupReactions(item.reactions);

            return (
              <div
                key={item._id}
                className={`message-wrapper ${isSelf ? 'message-wrapper-self' : 'message-wrapper-other'}`}
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
                  <div className="message-bubble-wrap">
                    <div className={`message-bubble ${isSelf ? 'message-bubble-self' : 'message-bubble-other'}`}>
                      {item.content}
                    </div>

                    {/* Quick reaction bar */}
                    {hoveredMsg === item._id && (
                      <div className={`emoji-quick-bar ${isSelf ? 'emoji-quick-left' : 'emoji-quick-right'}`}>
                        {QUICK_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            className={`emoji-quick-btn ${hasUserReacted(item.reactions, emoji) ? 'emoji-quick-active' : ''}`}
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
                    <div className={`reaction-pills ${isSelf ? 'reaction-pills-self' : ''}`}>
                      {reactions.map((r) => (
                        <button
                          key={r.emoji}
                          className={`reaction-pill ${hasUserReacted(item.reactions, r.emoji) ? 'reaction-pill-active' : ''}`}
                          onClick={() => handleReaction(item._id, r.emoji)}
                          title={r.users.join(', ')}
                        >
                          <span className="reaction-emoji">{r.emoji}</span>
                          <span className="reaction-count">{r.count}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <span className={`message-time ${isSelf ? 'message-time-self' : 'message-time-other'}`}>
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
            <span className="typing-indicator-text">{typingUser} is typing</span>
            <div className="typing-indicator-dots">
              <span></span><span></span><span></span>
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
              className={`chat-input-icon-btn ${showEmojiPicker ? 'chat-input-icon-active' : ''}`}
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              title="Emoji"
            >
              <Smile size={20} />
            </button>
            {showEmojiPicker && (
              <EmojiPicker onSelect={handleEmojiForInput} onClose={() => setShowEmojiPicker(false)} />
            )}
          </div>
          <textarea
            ref={inputRef}
            className="chat-input"
            placeholder={`Message ${recipient.username}`}
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

export default DirectMessageArea;
