import { X, Shield, Crown } from 'lucide-react';

const groupColors = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#3b82f6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4'
];

const getColor = (name) => {
  let hash = 0;
  for (let i = 0; i < name?.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return groupColors[Math.abs(hash) % groupColors.length];
};

const GroupInfo = ({ group, user, onlineUsers, onClose, onLeaveGroup, isMember }) => {
  const isOnline = (userId) => onlineUsers?.some(u => u._id === userId);

  return (
    <div className="group-info-panel">
      <div className="group-info-header">
        <h3>Group Info</h3>
        <button className="group-info-close" onClick={onClose}>
          <X size={16} />
        </button>
      </div>

      <div className="group-info-body">
        {/* Group details */}
        <div className="group-info-section" style={{ textAlign: 'center' }}>
          <div className="group-info-avatar-lg" style={{ background: getColor(group.name) }}>
            {group.name?.charAt(0).toUpperCase()}
          </div>
          <div className="group-info-name">{group.name}</div>
          <div className="group-info-desc">{group.description}</div>
        </div>

        {/* Admin */}
        <div className="group-info-section">
          <div className="group-info-label">
            <Crown size={12} style={{ display: 'inline', marginRight: 4 }} />
            Created by
          </div>
          <div className="member-item">
            <div className="member-avatar" style={{ background: getColor(group.admin?.username) }}>
              {group.admin?.username?.charAt(0).toUpperCase()}
            </div>
            <span className="member-name">{group.admin?.username}</span>
            <span className="member-role member-role-admin">Admin</span>
          </div>
        </div>

        {/* Members */}
        <div className="group-info-section">
          <div className="group-info-label">
            Members ({group.members?.length})
          </div>
          <div className="members-list">
            {group.members?.map((member) => (
              <div key={member._id} className="member-item">
                <div className="member-avatar" style={{ background: getColor(member.username) }}>
                  {member.username?.charAt(0).toUpperCase()}
                  {isOnline(member._id) && <span className="member-online-dot"></span>}
                </div>
                <span className="member-name">{member.username}</span>
                {member._id === group.admin?._id && (
                  <span className="member-role member-role-admin">Admin</span>
                )}
                {member._id === user._id && member._id !== group.admin?._id && (
                  <span className="member-role member-role-you">You</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        {isMember(group) && group.admin?._id !== user._id && (
          <div className="group-info-section">
            <button
              className="btn btn-danger btn-sm"
              style={{ width: '100%' }}
              onClick={() => {
                onLeaveGroup(group._id);
                onClose();
              }}
            >
              Leave Group
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupInfo;
