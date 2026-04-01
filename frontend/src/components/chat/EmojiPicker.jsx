import { useState, useRef, useEffect } from 'react';

const EMOJI_CATEGORIES = {
  'Smileys': ['😀','😂','🥹','😍','🤩','😎','🥳','😢','😡','🤯','🫡','🤔','😴','🤗','😈','💀','👻','🤖'],
  'Gestures': ['👍','👎','❤️','🔥','✅','⭐','💯','🎉','👏','🙌','💪','🤝','✌️','🫶','👀','🧠'],
  'Nature': ['🌟','🌈','☀️','🌙','⚡','💧','🍀','🌸','🌊','🦋'],
  'Objects': ['💡','🎯','🚀','💎','🏆','🎵','📌','💬','⏰','🔑'],
};

// Quick-reaction bar emojis
const QUICK_EMOJIS = ['👍', '❤️', '😂', '🔥', '😢', '🎉'];

const EmojiPicker = ({ onSelect, onClose, isQuickReaction = false, position = 'bottom' }) => {
  const [activeCategory, setActiveCategory] = useState('Smileys');
  const [search, setSearch] = useState('');
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Quick reaction bar (appears on hover over a message)
  if (isQuickReaction) {
    return (
      <div ref={pickerRef} className={`emoji-quick-bar emoji-quick-${position}`}>
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            className="emoji-quick-btn"
            onClick={() => onSelect(emoji)}
            title={emoji}
          >
            {emoji}
          </button>
        ))}
        <button className="emoji-quick-btn emoji-quick-more" onClick={() => {}}>
          +
        </button>
      </div>
    );
  }

  // Full picker (for message input)
  const allEmojis = Object.values(EMOJI_CATEGORIES).flat();
  const filtered = search
    ? allEmojis // emoji search is limited, just show all for now
    : EMOJI_CATEGORIES[activeCategory] || [];

  return (
    <div ref={pickerRef} className="emoji-picker">
      {/* Category tabs */}
      <div className="emoji-picker-tabs">
        {Object.keys(EMOJI_CATEGORIES).map((cat) => (
          <button
            key={cat}
            className={`emoji-tab ${activeCategory === cat ? 'emoji-tab-active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat === 'Smileys' ? '😀' : cat === 'Gestures' ? '👍' : cat === 'Nature' ? '🌟' : '💡'}
          </button>
        ))}
      </div>

      {/* Emoji grid */}
      <div className="emoji-picker-grid">
        {filtered.map((emoji) => (
          <button
            key={emoji}
            className="emoji-item"
            onClick={() => { onSelect(emoji); onClose(); }}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

export { QUICK_EMOJIS };
export default EmojiPicker;
