"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "@/lib/api";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { initMessaging } from "@/lib/firebase-messaging";
import { deleteToken } from "firebase/messaging";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const login = async (email, password) => {
    try {
      const res = await axios.post("/auth/login", { email, password });
      const { token, role, name, _id } = res.data;

      localStorage.setItem("token", token);
      setUser({ role, name, _id });

      if (role === "driver") {
        connectSocket(token);
      }

      router.push(role === "admin" ? "/admin/dashboard" : `/${role}`);
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed";
     
      throw new Error(msg);
    }
  };

  const register = async (formData) => {
    try {
      const res = await axios.post("/auth/register", {
        ...formData,
        role: "student",
      });

      const { token, role, name, _id } = res.data;

      localStorage.setItem("token", token);
      setUser({ role, name, _id });

    
      router.push("/student");
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed";
     
      throw new Error(msg); // <-- this throws the error you're seeing in console
    }
  };

  const logout = async () => {
    try {
      if (typeof window !== "undefined" && Notification.permission === "granted") {
        const messagingInstance = await initMessaging();
        const fcmToken = localStorage.getItem("fcmToken");
        const authToken = localStorage.getItem("token");

        if (fcmToken && authToken) {
          // Remove from backend
          await axios
            .delete("/notifications/delete-token", {
              headers: { Authorization: `Bearer ${authToken}` },
              data: { token: fcmToken },
            })
            .catch(() => {});

          // Remove from device
          if (messagingInstance) {
            await deleteToken(messagingInstance).catch(() => {});
          }
        }
      }
    } catch (err) {}

    localStorage.removeItem("token");
    localStorage.removeItem("fcmToken");

    if (user?.role === "driver") {
      disconnectSocket();
    }

    setUser(null);
    router.push("/login");
  };

  const fetchUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get("/auth/me");
      setUser(res.data);

      if (res.data.role === "driver") {
        connectSocket(token);
      }
    } catch (err) {
      await logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {loading ? (
        <div className="min-h-screen bg-[#140c08] text-white flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-[#c9a97f] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#c9a97f] text-sm font-medium">Loading Commutex...</p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
