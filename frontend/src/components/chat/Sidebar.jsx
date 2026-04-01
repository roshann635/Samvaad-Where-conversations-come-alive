import { useNavigate } from "react-router-dom";
import {
  MessageCircle,
  Plus,
  LogOut,
  Hash,
  User,
  MessageSquare,
  Settings,
} from "lucide-react";

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

const getAvatarColor = (name = "") => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return groupColors[Math.abs(hash) % groupColors.length];
};

const Sidebar = ({
  // Group props
  groups,
  activeGroup,
  onSelectGroup,
  onJoinGroup,
  onCreateGroup,
  isMember,
  // DM props
  users = [],
  dmConversations = [],
  activeDM,
  onSelectDM,
  onNewDM,
  // Shared
  user,
  onLogout,
  isOpen,
  // Tab
  activeTab,
  onTabChange,
  // Online presence
  onlineUserIds = [],
  // Profile
  onOpenProfile,
  // Unread
  unreadGroups = {},
  unreadDMs = {},
}) => {
  const navigate = useNavigate();

  const existingDMIds = new Set(dmConversations.map((u) => u._id));
  const availableDMUsers = users.filter((u) => !existingDMIds.has(u._id));

  const myGroups = groups.filter((g) => isMember(g));
  const otherGroups = groups.filter((g) => !isMember(g));

  const totalUnreadGroups = Object.values(unreadGroups).reduce(
    (s, c) => s + c,
    0,
  );
  const totalUnreadDMs = Object.values(unreadDMs).reduce((s, c) => s + c, 0);

  return (
    <aside className={`sidebar ${isOpen ? "sidebar-open" : ""}`}>
      {/* Brand */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="brand-icon">
            <MessageCircle size={18} />
          </div>
          <span className="sidebar-brand-text">Samvaad</span>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="sidebar-tabs">
        <button
          className={`sidebar-tab ${activeTab === "groups" ? "sidebar-tab-active" : ""}`}
          onClick={() => onTabChange("groups")}
        >
          <Hash size={14} />
          Groups
          {totalUnreadGroups > 0 && (
            <span className="unread-badge">
              {totalUnreadGroups > 99 ? "99+" : totalUnreadGroups}
            </span>
          )}
        </button>
        <button
          className={`sidebar-tab ${activeTab === "dms" ? "sidebar-tab-active" : ""}`}
          onClick={() => onTabChange("dms")}
        >
          <MessageSquare size={14} />
          Messages
          {totalUnreadDMs > 0 && (
            <span className="unread-badge">
              {totalUnreadDMs > 99 ? "99+" : totalUnreadDMs}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="sidebar-section">
        {/* ── GROUPS TAB ── */}
        {activeTab === "groups" && (
          <>
            {user?.isAdmin && (
              <button className="create-group-btn" onClick={onCreateGroup}>
                <Plus size={16} />
                Create New Group
              </button>
            )}

            {myGroups.length > 0 && (
              <>
                <div className="sidebar-section-title">
                  My Groups ({myGroups.length})
                </div>
                <div className="group-list">
                  {myGroups.map((group) => (
                    <div
                      key={group._id}
                      className={`group-item ${activeGroup?._id === group._id ? "group-item-active" : ""}`}
                      onClick={() => onSelectGroup(group)}
                    >
                      <div
                        className="group-avatar"
                        style={{ background: getAvatarColor(group.name) }}
                      >
                        <Hash size={16} />
                      </div>
                      <div className="group-info-preview">
                        <div className="group-name">{group.name}</div>
                        <div className="group-description-preview">
                          {group.members?.length} member
                          {group.members?.length !== 1 ? "s" : ""}
                        </div>
                      </div>
                      {unreadGroups[group._id] > 0 ? (
                        <span className="unread-badge">
                          {unreadGroups[group._id]}
                        </span>
                      ) : (
                        <span className="group-member-badge">Joined</span>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {otherGroups.length > 0 && (
              <>
                <div
                  className="sidebar-section-title"
                  style={{ marginTop: "20px" }}
                >
                  Discover Groups ({otherGroups.length})
                </div>
                <div className="group-list">
                  {otherGroups.map((group) => (
                    <div key={group._id} className="group-item">
                      <div
                        className="group-avatar"
                        style={{ background: getAvatarColor(group.name) }}
                      >
                        <Hash size={16} />
                      </div>
                      <div className="group-info-preview">
                        <div className="group-name">{group.name}</div>
                        <div className="group-description-preview">
                          {group.members?.length} member
                          {group.members?.length !== 1 ? "s" : ""}
                        </div>
                      </div>
                      <button
                        className="group-join-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onJoinGroup(group._id);
                        }}
                      >
                        Join
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {groups.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 16px" }}>
                <p style={{ color: "var(--gray-500)", fontSize: "0.85rem" }}>
                  No groups available yet.
                  {user?.isAdmin && " Create one to get started!"}
                </p>
              </div>
            )}
          </>
        )}

        {/* ── DMS TAB ── */}
        {activeTab === "dms" && (
          <>
            <button className="create-group-btn dm-new-btn" onClick={onNewDM}>
              <Plus size={16} />
              New Direct Message
            </button>

            {dmConversations.length > 0 ? (
              <>
                <div className="sidebar-section-title">
                  Direct Messages ({dmConversations.length})
                </div>
                <div className="group-list">
                  {dmConversations.map((u) => {
                    const isOnline = onlineUserIds.includes(u._id);
                    return (
                      <div
                        key={u._id}
                        className={`group-item ${activeDM?._id === u._id ? "group-item-active" : ""}`}
                        onClick={() => onSelectDM(u)}
                      >
                        <div className="dm-avatar-wrap">
                          <div
                            className="group-avatar"
                            style={{
                              background: getAvatarColor(u.username),
                              borderRadius: "50%",
                              fontSize: "1rem",
                              fontWeight: 700,
                              color: "#fff",
                            }}
                          >
                            {u.username.charAt(0).toUpperCase()}
                          </div>
                          <span
                            className={`presence-dot ${isOnline ? "presence-online" : "presence-offline"}`}
                          ></span>
                        </div>
                        <div className="group-info-preview">
                          <div className="group-name">{u.username}</div>
                          <div className="group-description-preview">
                            {isOnline ? "Online" : "Offline"}
                          </div>
                        </div>
                        {unreadDMs[u._id] > 0 ? (
                          <span className="unread-badge">
                            {unreadDMs[u._id]}
                          </span>
                        ) : (
                          <User
                            size={14}
                            style={{ color: "var(--gray-500)", flexShrink: 0 }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 16px" }}>
                <MessageSquare
                  size={32}
                  style={{ color: "var(--gray-600)", marginBottom: 12 }}
                />
                <p style={{ color: "var(--gray-500)", fontSize: "0.85rem" }}>
                  No conversations yet.
                </p>
                <p
                  style={{
                    color: "var(--gray-600)",
                    fontSize: "0.78rem",
                    marginTop: 6,
                  }}
                >
                  Start a new direct message above.
                </p>
              </div>
            )}

            {availableDMUsers.length > 0 && (
              <>
                <div
                  className="sidebar-section-title"
                  style={{ marginTop: "20px" }}
                >
                  Available users
                </div>
                <div className="group-list">
                  {availableDMUsers.map((u) => {
                    const isOnline = onlineUserIds.includes(u._id);
                    return (
                      <div
                        key={u._id}
                        className="group-item"
                        onClick={() => onSelectDM(u)}
                      >
                        <div className="dm-avatar-wrap">
                          <div
                            className="group-avatar"
                            style={{
                              background: getAvatarColor(u.username),
                              borderRadius: "50%",
                              fontSize: "1rem",
                              fontWeight: 700,
                              color: "#fff",
                            }}
                          >
                            {u.username.charAt(0).toUpperCase()}
                          </div>
                          <span
                            className={`presence-dot ${isOnline ? "presence-online" : "presence-offline"}`}
                          ></span>
                        </div>
                        <div className="group-info-preview">
                          <div className="group-name">{u.username}</div>
                          <div className="group-description-preview">
                            {isOnline ? "Online" : "Offline"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user-avatar">
          {user?.username?.charAt(0).toUpperCase()}
        </div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{user?.username}</div>
          <div className="sidebar-user-email">{user?.email}</div>
        </div>
        <button
          className="sidebar-settings-btn"
          onClick={onOpenProfile}
          title="Profile Settings"
        >
          <Settings size={16} />
        </button>
        <button
          className="sidebar-logout-btn"
          onClick={() => {
            onLogout();
            navigate("/");
          }}
          title="Logout"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
