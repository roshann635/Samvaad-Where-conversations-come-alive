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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("samvaad_user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      connectSocket(parsed);
    }
    setLoading(false);
  }, []);

  const login = async (email, password, adminCode) => {
    const payload = { email, password };
    if (adminCode) payload.adminCode = adminCode;
    const { data } = await loginAPI(payload);
    const userData = data.user;
    localStorage.setItem("samvaad_user", JSON.stringify(userData));
    setUser(userData);
    connectSocket(userData);
    return userData;
  };

  const register = async (username, email, password, adminCode) => {
    const payload = { username, email, password };
    if (adminCode) payload.adminCode = adminCode;
    const { data } = await registerAPI(payload);
    return data;
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
