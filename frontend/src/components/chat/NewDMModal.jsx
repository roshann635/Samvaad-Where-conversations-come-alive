import { useState, useMemo } from 'react';
import { X, Search, MessageCircle } from 'lucide-react';

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

const NewDMModal = ({ users, onStartDM, onClose }) => {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() =>
    users.filter(u =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    ), [users, search]
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <MessageCircle size={20} style={{ color: 'var(--primary-400)' }} />
            <h2 className="modal-title">New Direct Message</h2>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '0 24px 16px' }}>
          <div style={{ position: 'relative' }}>
            <Search
              size={16}
              style={{
                position: 'absolute', left: 12, top: '50%',
                transform: 'translateY(-50%)', color: 'var(--gray-500)'
              }}
            />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                background: 'var(--gray-800)',
                border: '1px solid var(--border-light)',
                borderRadius: 10,
                padding: '10px 12px 10px 38px',
                color: 'var(--gray-100)',
                fontSize: '0.9rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* User list */}
        <div style={{
          maxHeight: 340,
          overflowY: 'auto',
          padding: '0 12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}>
          {filtered.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--gray-500)', padding: '24px 0', fontSize: '0.875rem' }}>
              No users found
            </p>
          ) : (
            filtered.map(u => (
              <button
                key={u._id}
                onClick={() => onStartDM(u)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s',
                  width: '100%',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-800)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: getAvatarColor(u.username),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 700, fontSize: '1rem',
                  flexShrink: 0,
                }}>
                  {u.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ color: 'var(--gray-100)', fontWeight: 600, fontSize: '0.9rem' }}>
                    {u.username}
                  </div>
                  <div style={{ color: 'var(--gray-500)', fontSize: '0.78rem' }}>
                    {u.email}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NewDMModal;
