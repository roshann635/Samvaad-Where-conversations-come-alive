import { useState } from 'react';
import { updateProfile } from '../../services/api';
import { X, User, Mail, Shield, Save, Loader } from 'lucide-react';

const ProfileModal = ({ user, onClose, onProfileUpdate }) => {
  const [username, setUsername] = useState(user?.username || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSave = async () => {
    if (!username.trim() || username.trim().length < 2) {
      setError('Username must be at least 2 characters');
      return;
    }
    if (username.trim() === user.username) {
      onClose();
      return;
    }

    setSaving(true);
    setError('');
    try {
      const { data } = await updateProfile({ username: username.trim() });
      setSuccess('Profile updated successfully!');
      if (onProfileUpdate) onProfileUpdate(data);
      setTimeout(() => onClose(), 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const avatarColors = [
    '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#3b82f6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4'
  ];

  const getColor = (name = '') => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return avatarColors[Math.abs(hash) % avatarColors.length];
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Profile Settings</h3>
          <button className="group-info-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="profile-modal-body">
          {/* Large avatar */}
          <div className="profile-avatar-section">
            <div
              className="profile-avatar-lg"
              style={{ background: `linear-gradient(135deg, ${getColor(user?.username)}, ${getColor(user?.email)})` }}
            >
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="profile-avatar-status">
              <span className="profile-status-dot"></span>
              Online
            </div>
          </div>

          {/* Username field */}
          <div className="profile-field">
            <label className="profile-field-label">
              <User size={14} />
              Username
            </label>
            <input
              type="text"
              className="input-field profile-input"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(''); setSuccess(''); }}
              placeholder="Enter username"
              maxLength={30}
            />
          </div>

          {/* Email (read-only) */}
          <div className="profile-field">
            <label className="profile-field-label">
              <Mail size={14} />
              Email
            </label>
            <div className="profile-readonly">{user?.email}</div>
          </div>

          {/* Role */}
          <div className="profile-field">
            <label className="profile-field-label">
              <Shield size={14} />
              Role
            </label>
            <div className="profile-readonly">
              <span className={`profile-role-badge ${user?.isAdmin ? 'profile-role-admin' : ''}`}>
                {user?.isAdmin ? 'Admin' : 'Member'}
              </span>
            </div>
          </div>

          {error && <div className="profile-error">{error}</div>}
          {success && <div className="profile-success">{success}</div>}

          <button
            className="btn btn-primary profile-save-btn"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <Loader size={16} className="spin" /> : <Save size={16} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
