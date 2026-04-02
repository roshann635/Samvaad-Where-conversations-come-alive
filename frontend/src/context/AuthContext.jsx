/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from "react";
import {
  loginUser as loginAPI,
  registerUser as registerAPI,
} from "../services/api";
import { connectSocket, disconnectSocket } from "../services/socket";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const storedUser = localStorage.getItem("samvaad_user");
  const initialUser = storedUser ? JSON.parse(storedUser) : null;
  const [user, setUser] = useState(initialUser);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialUser) {
      connectSocket(initialUser);
    }
  }, [initialUser]);

  const login = async (email, password, adminCode, mobile) => {
    setLoading(true);
    try {
      const payload = { email, password, mobile };
      if (adminCode) payload.adminCode = adminCode;
      const { data } = await loginAPI(payload);
      const userData = data.user;
      localStorage.setItem("samvaad_user", JSON.stringify(userData));
      setUser(userData);
      connectSocket(userData);
      return userData;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, email, mobile, password, adminCode) => {
    setLoading(true);
    try {
      const payload = { username, email, mobile, password };
      if (adminCode) payload.adminCode = adminCode;
      const { data } = await registerAPI(payload);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("samvaad_user");
    disconnectSocket();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
