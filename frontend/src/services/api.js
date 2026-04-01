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
export const registerUser = (userData) => api.post("/users/register", userData);
export const loginUser = (credentials) => api.post("/users/login", credentials);

// Users
export const getUsers = () => api.get("/users");
export const updateProfile = (data) => api.put("/users/profile", data);

// Groups
export const getGroups = () => api.get("/groups");
export const createGroup = (groupData) => api.post("/groups", groupData);
export const joinGroup = (groupId) => api.post(`/groups/${groupId}/join`);
export const leaveGroup = (groupId) => api.post(`/groups/${groupId}/leave`);

// Group Messages
export const getMessages = (groupId) => api.get(`/messages/group/${groupId}`);
export const sendMessage = (messageData) => api.post("/messages", messageData);

// Direct Messages
export const getDMs = (userId) => api.get(`/messages/dm/${userId}`);
export const sendDM = (messageData) => api.post("/messages/dm", messageData);

// Reactions
export const reactToMessage = (messageId, emoji) =>
  api.patch(`/messages/${messageId}/react`, { emoji });

export default api;
