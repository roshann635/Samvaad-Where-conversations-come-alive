import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getGroups,
  joinGroup,
  leaveGroup,
  createGroup,
  getUsers,
} from "../services/api";
import { getSocket } from "../services/socket";
import Sidebar from "../components/chat/Sidebar";
import ChatArea from "../components/chat/ChatArea";
import GroupInfo from "../components/chat/GroupInfo";
import CreateGroupModal from "../components/chat/CreateGroupModal";
import DirectMessageArea from "../components/chat/DirectMessageArea";
import NewDMModal from "../components/chat/NewDMModal";
import ProfileModal from "../components/chat/ProfileModal";
import "./ChatLayout.css";

const ChatLayout = () => {
  const { user, logout } = useAuth();

  // Groups
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  // DMs
  const [users, setUsers] = useState([]);
  const [activeDM, setActiveDM] = useState(null);
  const [dmConversations, setDmConversations] = useState([]); // users we've chatted with
  const [showNewDMModal, setShowNewDMModal] = useState(false);

  // UI
  const [activeTab, setActiveTab] = useState("groups");
  const [showSidebar, setShowSidebar] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Online presence (global)
  const [onlineUserIds, setOnlineUserIds] = useState([]);

  // Unread tracking
  const [unreadGroups, setUnreadGroups] = useState({});
  const [unreadDMs, setUnreadDMs] = useState({});

  // Fetch groups
  const fetchGroups = useCallback(async () => {
    try {
      const { data } = await getGroups();
      setGroups(data);
    } catch (err) {
      console.error("Failed to fetch groups:", err);
    }
  }, []);

  // Fetch all users for DM picker
  const fetchUsers = useCallback(async () => {
    try {
      const { data } = await getUsers();
      setUsers(data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      await fetchGroups();
      await fetchUsers();
    };
    loadInitialData();
  }, [fetchGroups, fetchUsers]);

  // Socket event listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleUsersInRoom = (users) => setOnlineUsers(users);
    const handleUserLeft = (userId) =>
      setOnlineUsers((prev) => prev.filter((u) => u._id !== userId));

    // Global online presence
    const handleOnlineUsers = (ids) => setOnlineUserIds(ids);

    // Unread group messages (when not viewing that group)
    const handleMessageReceived = (message) => {
      // If the message is for a group we're NOT currently viewing, increment unread
      if (message.groupId && message.groupId !== activeGroup?._id) {
        setUnreadGroups((prev) => ({
          ...prev,
          [message.groupId]: (prev[message.groupId] || 0) + 1,
        }));
      }
    };

    // Unread DMs
    const handleDMReceived = (message) => {
      const senderId = message.sender?._id;
      if (senderId && senderId !== activeDM?._id) {
        setUnreadDMs((prev) => ({
          ...prev,
          [senderId]: (prev[senderId] || 0) + 1,
        }));
        // Auto-add to DM conversations if not already there
        if (
          message.sender &&
          !dmConversations.find((u) => u._id === senderId)
        ) {
          setDmConversations((prev) => [message.sender, ...prev]);
        }
      }
    };

    socket.on("users in room", handleUsersInRoom);
    socket.on("user left", handleUserLeft);
    socket.on("online users", handleOnlineUsers);
    socket.on("message received", handleMessageReceived);
    socket.on("dm received", handleDMReceived);

    return () => {
      socket.off("users in room", handleUsersInRoom);
      socket.off("user left", handleUserLeft);
      socket.off("online users", handleOnlineUsers);
      socket.off("message received", handleMessageReceived);
      socket.off("dm received", handleDMReceived);
    };
  }, [activeGroup?._id, activeDM?._id, dmConversations]);

  // ── Group handlers ──
  const handleSelectGroup = (group) => {
    const socket = getSocket();
    if (activeGroup && socket) socket.emit("leave room", activeGroup._id);
    setActiveGroup(group);
    setActiveDM(null);
    setShowSidebar(false);
    // Clear unread for this group
    setUnreadGroups((prev) => {
      const n = { ...prev };
      delete n[group._id];
      return n;
    });
    if (socket) socket.emit("join room", group._id);
  };

  const handleJoinGroup = async (groupId) => {
    try {
      await joinGroup(groupId);
      await fetchGroups();
    } catch (err) {
      console.error("Failed to join group:", err);
    }
  };

  const handleLeaveGroup = async (groupId) => {
    try {
      const socket = getSocket();
      if (socket) socket.emit("leave room", groupId);
      await leaveGroup(groupId);
      if (activeGroup?._id === groupId) setActiveGroup(null);
      await fetchGroups();
    } catch (err) {
      console.error("Failed to leave group:", err);
    }
  };

  const handleCreateGroup = async (groupData) => {
    try {
      await createGroup(groupData);
      await fetchGroups();
      setShowCreateModal(false);
    } catch (err) {
      console.error("Failed to create group:", err);
      throw err;
    }
  };

  const isMember = (group) => group.members?.some((m) => m._id === user._id);

  // ── DM handlers ──
  const handleSelectDM = (recipient) => {
    setActiveDM(recipient);
    setActiveGroup(null);
    setShowSidebar(false);
    // Clear unread for this DM
    setUnreadDMs((prev) => {
      const n = { ...prev };
      delete n[recipient._id];
      return n;
    });

    // Track conversations
    setDmConversations((prev) => {
      if (prev.find((u) => u._id === recipient._id)) return prev;
      return [recipient, ...prev];
    });
  };

  const handleStartDM = (recipient) => {
    setActiveTab("dms");
    setShowNewDMModal(false);
    handleSelectDM(recipient);
  };

  // ── Tab change ──
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "groups") setActiveDM(null);
    if (tab === "dms") setActiveGroup(null);
  };

  // ── Profile update ──
  const handleProfileUpdate = (updatedUser) => {
    // Update localStorage
    const stored = JSON.parse(localStorage.getItem("samvaad_user") || "{}");
    const merged = { ...stored, ...updatedUser };
    localStorage.setItem("samvaad_user", JSON.stringify(merged));
    // Force page reload to pick up new user data in AuthContext
    window.location.reload();
  };

  return (
    <div className="chat-layout">
      <Sidebar
        // Groups
        groups={groups}
        activeGroup={activeGroup}
        onSelectGroup={handleSelectGroup}
        onJoinGroup={handleJoinGroup}
        onCreateGroup={() => setShowCreateModal(true)}
        isMember={isMember}
        // DMs
        dmConversations={dmConversations}
        activeDM={activeDM}
        onSelectDM={handleSelectDM}
        onNewDM={() => setShowNewDMModal(true)}
        // Shared
        user={user}
        onLogout={logout}
        isOpen={showSidebar}
        // Tab
        activeTab={activeTab}
        onTabChange={handleTabChange}
        // Online
        onlineUserIds={onlineUserIds}
        // Profile
        onOpenProfile={() => setShowProfileModal(true)}
        // Unread
        unreadGroups={unreadGroups}
        unreadDMs={unreadDMs}
      />

      {/* Main chat area */}
      {activeTab === "dms" ? (
        <DirectMessageArea
          recipient={activeDM}
          currentUser={user}
          onToggleSidebar={() => setShowSidebar(!showSidebar)}
          onlineUserIds={onlineUserIds}
        />
      ) : (
        <ChatArea
          group={activeGroup}
          user={user}
          onToggleSidebar={() => setShowSidebar(!showSidebar)}
          onToggleGroupInfo={() => setShowGroupInfo(!showGroupInfo)}
          onlineUsers={onlineUsers}
        />
      )}

      {/* Group info panel */}
      {showGroupInfo && activeGroup && (
        <GroupInfo
          group={activeGroup}
          user={user}
          onlineUsers={onlineUsers}
          onClose={() => setShowGroupInfo(false)}
          onLeaveGroup={handleLeaveGroup}
          isMember={isMember}
        />
      )}

      {/* Create Group modal */}
      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateGroup}
        />
      )}

      {/* New DM modal */}
      {showNewDMModal && (
        <NewDMModal
          users={users}
          onStartDM={handleStartDM}
          onClose={() => setShowNewDMModal(false)}
        />
      )}

      {/* Profile modal */}
      {showProfileModal && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfileModal(false)}
          onProfileUpdate={handleProfileUpdate}
        />
      )}
    </div>
  );
};

export default ChatLayout;
