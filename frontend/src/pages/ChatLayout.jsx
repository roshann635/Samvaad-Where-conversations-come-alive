import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getGroups,
  joinGroup,
  leaveGroup,
  createGroup,
  getUsers,
  getDMConversations,
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
  const [dmConversations, setDmConversations] = useState([]);
  const [showNewDMModal, setShowNewDMModal] = useState(false);

  // UI
  const [activeTab, setActiveTab] = useState("groups");
  const [showSidebar, setShowSidebar] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Online
  const [onlineUserIds, setOnlineUserIds] = useState([]);

  // Unread
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

  // Fetch users
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
      try {
        const { data: dmData } = await getDMConversations();
        setDmConversations(dmData);
      } catch (err) {
        console.error("Failed to fetch DM conversations:", err);
      }
    };
    loadInitialData();
  }, [fetchGroups, fetchUsers]);

  // 🔥 SOCKET LISTENERS
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleUsersInRoom = (users) => setOnlineUsers(users);
    const handleUserLeft = (userId) =>
      setOnlineUsers((prev) => prev.filter((u) => u._id !== userId));

    const handleOnlineUsers = (ids) => setOnlineUserIds(ids);

    const handleMessageReceived = (message) => {
      if (message.groupId === activeGroup?._id) {
        window.dispatchEvent(
          new CustomEvent("new-group-message", { detail: message }),
        );
      } else {
        setUnreadGroups((prev) => ({
          ...prev,
          [message.groupId]: (prev[message.groupId] || 0) + 1,
        }));
      }
    };

    const handleDMReceived = (message) => {
      const senderId = message.sender?._id;

      if (senderId === activeDM?._id) {
        window.dispatchEvent(
          new CustomEvent("new-dm-message", { detail: message }),
        );
      } else {
        setUnreadDMs((prev) => ({
          ...prev,
          [senderId]: (prev[senderId] || 0) + 1,
        }));

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

  // GROUP SELECT
  const handleSelectGroup = (group) => {
    const socket = getSocket();

    if (activeGroup && socket) socket.emit("leave room", activeGroup._id);

    setActiveGroup(group);
    setActiveDM(null);
    setShowSidebar(false);

    setTimeout(() => {
      if (socket) socket.emit("join room", group._id);
    }, 0);

    setUnreadGroups((prev) => {
      const n = { ...prev };
      delete n[group._id];
      return n;
    });
  };

  const handleJoinGroup = async (groupId) => {
    await joinGroup(groupId);
    await fetchGroups();
  };

  const handleLeaveGroup = async (groupId) => {
    const socket = getSocket();
    if (socket) socket.emit("leave room", groupId);

    await leaveGroup(groupId);
    if (activeGroup?._id === groupId) setActiveGroup(null);
    await fetchGroups();
  };

  const handleCreateGroup = async (groupData) => {
    await createGroup(groupData);
    await fetchGroups();
    setShowCreateModal(false);
  };

  const isMember = (group) => group.members?.some((m) => m._id === user._id);

  // DM SELECT
  const handleSelectDM = (recipient) => {
    const socket = getSocket();

    setActiveDM(recipient);
    setActiveGroup(null);
    setShowSidebar(false);

    setTimeout(() => {
      if (socket) socket.emit("join dm", recipient._id);
    }, 0);

    setUnreadDMs((prev) => {
      const n = { ...prev };
      delete n[recipient._id];
      return n;
    });

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

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "groups") setActiveDM(null);
    if (tab === "dms") setActiveGroup(null);
  };

  const handleProfileUpdate = (updatedUser) => {
    const stored = JSON.parse(localStorage.getItem("samvaad_user") || "{}");
    const merged = { ...stored, ...updatedUser };
    localStorage.setItem("samvaad_user", JSON.stringify(merged));
    window.location.reload();
  };

  return (
    <div className="chat-layout">
      <Sidebar
        groups={groups}
        activeGroup={activeGroup}
        onSelectGroup={handleSelectGroup}
        onJoinGroup={handleJoinGroup}
        onCreateGroup={() => setShowCreateModal(true)}
        isMember={isMember}
        users={users}
        dmConversations={dmConversations}
        activeDM={activeDM}
        onSelectDM={handleSelectDM}
        onNewDM={() => setShowNewDMModal(true)}
        user={user}
        onLogout={logout}
        onOpenProfile={() => setShowProfileModal(true)}
        isOpen={showSidebar}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onlineUserIds={onlineUserIds}
        unreadGroups={unreadGroups}
        unreadDMs={unreadDMs}
      />

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

      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateGroup}
        />
      )}

      {showNewDMModal && (
        <NewDMModal
          users={users}
          onStartDM={handleStartDM}
          onClose={() => setShowNewDMModal(false)}
        />
      )}

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
