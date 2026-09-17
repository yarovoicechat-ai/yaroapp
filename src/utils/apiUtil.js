import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { BASE_URL } from "@env";
import { jwtDecode } from "jwt-decode";
import dayjs from "dayjs";
import { AlertService } from "./AlertService";
import i18next from "i18next";
import { clearAuthSession } from './authSession';

const PRODUCTION_BASE_URL = 'https://api.mithichat.live/api';
const normalizeApiBaseUrl = rawUrl => {
  const origin = String(rawUrl || PRODUCTION_BASE_URL)
    .trim()
    .replace(/\/+$/, '')
    .replace(/(?:\/api)+$/i, '');
  return `${origin}/api`;
};
const API_BASE_URL = normalizeApiBaseUrl(BASE_URL || PRODUCTION_BASE_URL);
const NETWORK_TIMEOUT_MS = 15000;
const INVALID_REFRESH_STATUSES = [400, 401, 403, 404];

// Public instance (no tokens, no interceptors)
const apiPublic = axios.create({
  baseURL: API_BASE_URL,
  timeout: NETWORK_TIMEOUT_MS,
  headers: { "Content-Type": "application/json" },
});

// Private instance (tokens + interceptors)
const apiUtil = axios.create({
  baseURL: API_BASE_URL,
  timeout: NETWORK_TIMEOUT_MS,
  headers: { "Content-Type": "application/json" },
});

const addNetworkRetry = (client) => {
  client.interceptors.response.use(
    response => response,
    async error => {
      const config = error.config;
      const retryable = !error.response || [502, 503, 504].includes(error.response?.status);
      if (config && retryable && !config.__networkRetried) {
        config.__networkRetried = true;
        await new Promise(resolve => setTimeout(resolve, 700));
        return client.request(config);
      }
      return Promise.reject(error);
    }
  );
};

addNetworkRetry(apiPublic);
addNetworkRetry(apiUtil);

const getApiErrorMessage = (error, fallback = 'Something went wrong') => {
  if (error?.code === '12501' || error?.message?.includes('CANCELLED') || error?.message?.includes('canceled')) {
    return 'Google Sign-In canceled.';
  }
  if (error?.code === '10' || error?.message?.includes('DEVELOPER_ERROR') || error?.message?.includes('10:')) {
    return 'Google Sign-In error: SHA-1 fingerprint mismatch or missing Google Play Services configuration.';
  }
  if (!error?.response) {
    const msg = error?.message || '';
    if (msg.includes('Network Error') || msg.includes('ERR_NETWORK') || msg.includes('timeout') || msg.includes('ECONNABORTED')) {
      const detail = msg ? ` (${msg})` : '';
      return `Server se connection nahi ho pa raha. Internet check karke dobara try karein.${detail}`;
    }
    return msg || fallback;
  }
  return error.response?.data?.message || fallback;
};

const exchangeCoins = async (coins) => {
  try {
    return await apiUtil.post('/user/exchange-coins', { coins });
  } catch (error) {
    if (error.response?.status !== 404) throw error;
    return apiUtil.post('/user/exchange', { coins });
  }
};

// --------------------
// Refresh Token API (using apiPublic)
// --------------------
const refreshTokenGenerate = async (body) => {
  try {
    const response = await apiPublic.post("/auth/refresh-token", body);
    console.log("Refresh API Response:", response.data);
    return response;
  } catch (error) {
    console.log("Refresh API Failed:", error.response?.data || error.message);
    throw error;
  }
};

let refreshPromise = null;

// --------------------
// Interceptor for private API
// --------------------
const publicPaths = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/refresh-token",
];

apiUtil.interceptors.request.use(async (req) => {
  // Skip attaching token for public APIs
  if (publicPaths.some((path) => req.url.includes(path))) {
    console.log("Public API Request:", req.url);
    return req;
  }

  const refreshToken = await AsyncStorage.getItem("refreshToken");
  const token = await AsyncStorage.getItem("accessToken");
  if (refreshToken && token) {
    req.headers.Authorization = `Bearer ${token}`;

    let isExpiredAccess = true;
    let isExpiredRefresh = true;

    try {
      const access = jwtDecode(token);
      isExpiredAccess = dayjs.unix(access.exp).diff(dayjs()) < 1;
    } catch (decErr) {
      console.log("Failed to decode access token:", decErr.message);
      isExpiredAccess = true;
    }

    try {
      const refresh = jwtDecode(refreshToken);
      isExpiredRefresh = dayjs.unix(refresh.exp).diff(dayjs()) < 1;
    } catch (decErr) {
      console.log("Failed to decode refresh token:", decErr.message);
      isExpiredRefresh = true;
    }

    if (!isExpiredAccess) {
      // Access token still valid
      return req;
    }

    if (isExpiredRefresh) {
      // Both expired -> clear storage + logout
      console.log("Refresh token expired -> logging out");
      await clearAuthSession();
      return req;
    }

    // Access expired, refresh valid -> get new tokens
    console.log("Access token expired, refreshing...");
    try {
      if (!refreshPromise) {
        refreshPromise = refreshTokenGenerate({ token: refreshToken })
          .finally(() => { refreshPromise = null; });
      }
      const refreshResponse = await refreshPromise;

      const newAccess = refreshResponse.data?.data?.accessToken;

      if (newAccess) {
        await AsyncStorage.setItem("accessToken", newAccess);
        req.headers.Authorization = `Bearer ${newAccess}`;
      }

      return req;
    } catch (err) {
      console.log("Token refresh failed, clearing storage");
      const status = err.response?.status;
      if (INVALID_REFRESH_STATUSES.includes(status)) {
        await clearAuthSession();
      }
      return req;
    }
  }

  console.log("No tokens found, sending request without auth");
  return req;
});

// --------------------
// Response Interceptor for Global Errors
// --------------------
apiUtil.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const code = error.response?.data?.code;
      const msg = error.response?.data?.message || '';
      if (code === 'SINGLE_DEVICE_LOGOUT' || msg.includes('kisi aur device')) {
        await clearAuthSession();
        AlertService.show(
          'Logged Out',
          msg || 'Aapka account kisi aur device me login ho gaya hai.',
          'error'
        );
      }
    } else if (error.response?.status === 500 && !error.config?.suppressGlobalError) {
      AlertService.show(
        i18next.t('error.server_busy_title') || 'Server Busy',
        i18next.t('error.server_busy_msg') || 'Something went wrong. Please try again after some time.',
        'error'
      );
    }
    return Promise.reject(error);
  }
);

// --------------------
// Exports
// --------------------
export { apiUtil, apiPublic, exchangeCoins, getApiErrorMessage, API_BASE_URL };
