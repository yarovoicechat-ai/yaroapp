// src/utils/socket.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { io } from "socket.io-client";
import { SOCKET_URL } from "@env";
import dayjs from "dayjs";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { clearAuthSession } from '../utils/authSession';

const ACTIVE_SOCKET_URL = (SOCKET_URL || 'https://api.mithichat.live').replace(/\/$/, '');

let socket = null;

// --------------------
// 🔄 Refresh Token API
// --------------------
const refreshTokenGenerate = async (body) => {
  try {
    const response = await axios.post(`${ACTIVE_SOCKET_URL}/api/auth/refresh-token`, body, {
      headers: { "Content-Type": "application/json" },
      timeout: 15000,
    });
    return response.data;
  } catch (err) {
    console.log("❌ Refresh API failed:", err.response?.data || err.message);
    throw err;
  }
};

// --------------------
// 🚀 Init Socket
// --------------------
export const initSocket = async () => {
  let token = await AsyncStorage.getItem("accessToken");
  const refreshToken = await AsyncStorage.getItem("refreshToken");

  if (!token || !refreshToken) {
    console.log("⚠️ No tokens found, cannot connect socket");
    return null;
  }

  // ✅ Check Access Token Expiry
  const decoded = jwtDecode(token);
  const isExpired = dayjs.unix(decoded.exp).diff(dayjs()) < 1;

  if (isExpired) {
    console.log("♻️ Socket: Access expired, refreshing...");
    try {
      const refreshResponse = await refreshTokenGenerate({ token: refreshToken });
      const newAccess = refreshResponse?.data?.accessToken;
      if (newAccess) {
        await AsyncStorage.setItem("accessToken", newAccess);
        token = newAccess;
      }
    } catch (err) {
      console.log("❌ Socket token refresh failed → logging out");
      if ([400, 401, 403, 404].includes(err.response?.status)) {
        await clearAuthSession();
      }
      return null;
    }
  }

  if (socket) {
    socket.auth = { token };
    if (!socket.connected) socket.connect();
    return socket;
  }

  // --------------------
  // 🌐 Connect Socket
  // --------------------
  socket = io(ACTIVE_SOCKET_URL, {
    auth: { token },
    reconnection: true, // auto reconnect
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
  });

  socket.on("connect", () => {
    console.log(`[SOCKET] CONNECT id=${socket.id}`);
    console.log("✅ Connected to socket:", socket.id);
  });

  socket.io.on("reconnect", attempt => {
    console.log(`[SOCKET] RECONNECT attempt=${attempt}`);
  });

  socket.on("disconnect", (reason) => {
    console.log("❌ Disconnected from socket:", reason);
  });

  socket.on("connect_error", async (err) => {
    console.log("⚠️ Socket connect error:", err.message);

    if (err.message.includes("Token expired")) {
      try {
        console.log("♻️ Socket: refreshing after token expired...");
        const refreshResponse = await refreshTokenGenerate({ token: refreshToken });
        const newAccess = refreshResponse?.data?.accessToken;

        if (newAccess) {
          await AsyncStorage.setItem("accessToken", newAccess);

          // 🔌 reconnect with new token
          socket.auth = { token: newAccess };
          socket.connect();
        }
      } catch (e) {
        console.log("❌ Auto refresh failed on connect_error → logging out");
        if ([400, 401, 403, 404].includes(e.response?.status)) {
          await clearAuthSession();
        }
        socket.disconnect();
      }
    }
  });

  // Single-device logout event handler from server
  socket.on("force_logout", async (data) => {
    console.log("⚠️ Single-device force_logout received:", data?.message);
    await clearAuthSession();
    const { AlertService } = require('../utils/AlertService');
    AlertService.show(
      "Logged Out",
      data?.message || "Aapka account kisi aur device me login ho gaya hai.",
      "error"
    );
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  });

  socket.on("errorMessage", ({ message }) => {
    console.log("⚠️ Socket Error:", message);
  });

  return socket;
};

// --------------------
// 🔍 Get Existing Socket
// --------------------
export const getSocket = () => socket;

// --------------------
// ❌ Disconnect Socket
// --------------------
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
