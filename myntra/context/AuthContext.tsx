import { createContext, useContext, useEffect, useState } from "react";
import { getUserData, saveUserData, clearUserData } from "@/utils/storage";
import { mergeRecentlyViewedOnLogin } from "@/utils/recentlyViewed";
import { registerForPushNotifications } from "@/utils/notifications";
import React from "react";
import { api } from "@/utils/api";

type AuthContextType = {
  isAuthenticated: boolean;
  authReady: boolean;
  user: { _id: string; name: string; email: string } | null;
  Signup: (fullName: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function postAuthSetup(userId: string) {
  try {
    await mergeRecentlyViewedOnLogin(userId);
  } catch (error) {
    console.log("Recently viewed setup failed:", error);
  }

  try {
    await registerForPushNotifications(userId);
  } catch (error) {
    console.log("Push notification setup failed:", error);
  }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<{
    _id: string;
    name: string;
    email: string;
  } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getUserData();
        if (data._id && data.name && data.email) {
          setUser({ _id: data._id, name: data.name, email: data.email });
          setIsAuthenticated(true);
          await postAuthSetup(data._id);
        }
      } catch (error) {
        console.log("Auth restore failed:", error);
      } finally {
        setAuthReady(true);
      }
    })();
  }, []);

  const login = async (identifier: string, password: string) => {
    const res = await api.post("/user/login", { identifier, password });
    const data = await res.data.user;
    if (data.fullName) {
      await saveUserData(data._id, data.fullName, data.email);
      setUser({ _id: data._id, name: data.fullName, email: data.email });
      setIsAuthenticated(true);
      await postAuthSetup(data._id);
    } else {
      throw new Error(data.message || "Login failed");
    }
  };

  const Signup = async (fullName: string, email: string, password: string) => {
    const res = await api.post("/user/signup", { fullName, email, password });
    const data = await res.data.user;
    if (data.fullName) {
      await saveUserData(data._id, data.fullName, data.email);
      setUser({ _id: data._id, name: data.fullName, email: data.email });
      setIsAuthenticated(true);
      await postAuthSetup(data._id);
    } else {
      throw new Error(data.message || "Signup failed");
    }
  };

  const logout = async () => {
    await clearUserData();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, authReady, user, Signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext)!;
