import axios from "axios";

const API_BASE_URL =
  "https://samvaad-where-conversations-come-alive-1.onrender.com";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const userInfo = localStorage.getItem("samvaad_user");
  if (userInfo) {
    const { token } = JSON.parse(userInfo);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Auth
export const registerUser = (userData) =>
  api.post("/api/users/register", userData);

export const loginUser = (credentials) =>
  api.post("/api/users/login", credentials);

// Users
export const getUsers = () => api.get("/api/users");
export const updateProfile = (data) => api.put("/api/users/profile", data);

// Groups
export const getGroups = () => api.get("/api/groups");
export const createGroup = (groupData) => api.post("/api/groups", groupData);
export const joinGroup = (groupId) => api.post(`/api/groups/${groupId}/join`);
export const leaveGroup = (groupId) => api.post(`/api/groups/${groupId}/leave`);

// Group Messages
export const getMessages = (groupId) =>
  api.get(`/api/messages/group/${groupId}`);
export const sendMessage = (messageData) =>
  api.post("/api/messages", messageData);

// Direct Messages
export const getDMs = (userId) => api.get(`/api/messages/dm/${userId}`);
export const sendDM = (messageData) =>
  api.post("/api/messages/dm", messageData);
export const getDMConversations = () =>
  api.get("/api/messages/dm/conversations");

// Reactions
export const reactToMessage = (messageId, emoji) =>
  api.patch(`/api/messages/${messageId}/react`, { emoji });

// Delete Message
export const deleteMessage = (messageId) => 
  api.delete(`/api/messages/${messageId}`);

// ── Join Requests ─────────────────────────────────────────────────────────────
export const requestToJoinGroup = (groupId) =>
  api.post(`/api/groups/${groupId}/join`);
export const getJoinRequests = (groupId) =>
  api.get(`/api/groups/${groupId}/requests`);
export const approveJoinRequest = (groupId, userId) =>
  api.post(`/api/groups/${groupId}/requests/${userId}/approve`);
export const rejectJoinRequest = (groupId, userId) =>
  api.post(`/api/groups/${groupId}/requests/${userId}/reject`);

// ── Polls ─────────────────────────────────────────────────────────────────────
export const createPoll = (groupId, question, options) =>
  api.post("/api/messages", {
    groupId,
    isPoll: true,
    pollData: { question, options: options.map((o) => ({ optionText: o, votes: [] })) },
  });
export const votePoll = (messageId, optionIndex) =>
  api.patch(`/api/messages/${messageId}/vote`, { optionIndex });

// ── Pin Message ───────────────────────────────────────────────────────────────
export const pinMessage = (groupId, messageId) =>
  api.patch(`/api/groups/${groupId}/pin/${messageId}`);

export default api;

