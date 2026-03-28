import { createContext, useContext, useEffect, useState } from "react";
import api, { formatError } from "../services/api";

const AuthContext = createContext(null);
const AUTH_STORAGE_KEY = "sl-customs-auth";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed.user || null);
        setToken(parsed.token || "");
        if (parsed.token) {
          localStorage.setItem("token", parsed.token);
        }
      } catch (error) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem("token");
      }
    }

    setLoading(false);
  }, []);

  const persistAuth = (payload) => {
    setUser(payload.user);
    setToken(payload.token);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
    localStorage.setItem("token", payload.token);
  };

  const loginUser = async (credentials) => {
    try {
      const response = await api.post("/auth/login", credentials);
      persistAuth(response.data);
      return { success: true };
    } catch (error) {
      return { success: false, message: formatError(error) };
    }
  };

  const registerUser = async (payload) => {
    try {
      const response = await api.post("/auth/register", payload);
      persistAuth(response.data);
      return { success: true };
    } catch (error) {
      return { success: false, message: formatError(error) };
    }
  };

  const logout = () => {
    setUser(null);
    setToken("");
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem("token");
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(user && token),
    loginUser,
    registerUser,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}
