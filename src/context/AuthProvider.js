import React, { createContext, useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiUtil } from '../utils/apiUtil';
import { initSocket, getSocket } from '../sockets/';
import { AppState, DeviceEventEmitter } from 'react-native';
import { attachSocketListeners } from '../utils/initializeSocket';
import { syncFCMToken } from '../utils/NotificationManager';
import { AUTH_SESSION_EXPIRED_EVENT, clearAuthSession } from '../utils/authSession';
import { ensureNativeCallPermissions } from '../utils/permissions';
import { OverlayPermissionManager } from '../utils/OverlayPermissionManager';
import OverlayPermissionGateModal from '../components/OverlayPermissionGateModal';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const defaultUser = {
    _id: 'guest_101',
    name: 'Yaro User',
    coins: 1000,
    diamonds: 500,
    gender: 'male',
    avatar: 'https://via.placeholder.com/150',
    mobile: '9876543210',
  };
  const [user, setUser] = useState(defaultUser);
  const [role, setRole] = useState('user');
  const [hosts, setHosts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pendingOverlayGate, setPendingOverlayGate] = useState(false);

  // ✅ Fetch profile using accessToken
const fetchUserProfile = useCallback(async () => {
  try {
    const res = await apiUtil.get('/user');

    console.log("USER API =", res.data);

    if (res.data.success) {
      const profile = res.data.data.user;
      setUser(profile);
      await AsyncStorage.setItem('cachedUser', JSON.stringify(profile));
      return profile;
    }
  } catch (err) {
    console.log("STATUS =", err.response?.status);
    console.log("DATA =", err.response?.data);
    console.log("MESSAGE =", err.message);

    // अभी clear मत करना
    // await AsyncStorage.clear();

    // setUser(null);
    // setRole(null);
    return null;
  }
}, []);

  // inside AuthProvider

  // ✅ Load tokens + fetch profile + socket init
  const loadAuthState = useCallback(async () => {
    try {
      const values = await AsyncStorage.multiGet([
        'accessToken',
        'refreshToken',
        'role',
        'cachedUser',
        'acceptingCall',
      ]);
      const stored = Object.fromEntries(values);
      const token = stored.accessToken;

      if (token && stored.refreshToken) {
        setIsAuthenticated(true);
        console.log('[AUTH] STORED_SESSION_RESTORED');
        setRole(stored.role);
        const acceptingCall = (() => {
          try {
            const value = JSON.parse(stored.acceptingCall || 'null');
            return value && Date.now() - Number(value.startedAt || 0) < 20000;
          } catch (_) {
            return false;
          }
        })();
        if (stored.cachedUser) {
          try {
            setUser(JSON.parse(stored.cachedUser));
            // Avoid flashing Home while a notification Accept is completing.
            if (!acceptingCall) {
              setLoading(false);
            } else {
              for (let attempt = 0; attempt < 75; attempt += 1) {
                if (await AsyncStorage.getItem('acceptedCall')) break;
                await new Promise(resolve => setTimeout(resolve, 200));
              }
              setLoading(false);
            }
          } catch (_) {
            await AsyncStorage.removeItem('cachedUser');
          }
        }
        await fetchUserProfile();
        const socket = await initSocket(); // 👈 no need to pass token
        attachSocketListeners(socket, setHosts); // ✅ Fix: Attach listeners on app load so hosts show up
      } else {
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.log('❌ Load Auth Failed:', err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchUserProfile]);

  useEffect(() => {
    const authExpiredSubscription = DeviceEventEmitter.addListener(
      AUTH_SESSION_EXPIRED_EVENT,
      () => {
        setUser(null);
        setRole(null);
        setIsAuthenticated(false);
        const socket = getSocket();
        if (socket) socket.disconnect();
      },
    );
    loadAuthState();

    // 👇 AppState listener (foreground / background)
    const subscription = AppState.addEventListener('change', nextState => {
      const socket = getSocket();
      if (!socket) return;

      if (nextState === 'background') {
        console.log('📴 App in background');
        // Option A: keep socket alive (WhatsApp style)
        // Option B: socket.disconnect(); (battery save)
      } else if (nextState === 'active') {
        // Refresh push registration whenever Android brings the app back.
        syncFCMToken();
        console.log('📶 App active → ensure socket connected');
        if (!socket.connected) {
          initSocket(); // 👈 no need token
        }
      }
    });

    return () => {
      authExpiredSubscription.remove();
      subscription.remove();
      const socket = getSocket();
      if (socket) socket.disconnect(); // cleanup on provider unmount
    };
  }, [loadAuthState]);

  // ✅ Login
  const login = async ({ accessToken, refreshToken, role, gender, isRegister = false }) => {
    await AsyncStorage.multiSet([
      ['accessToken', accessToken],
      ['refreshToken', refreshToken],
      ['role', role],
      ['gender', gender || ''],
    ]);
    setRole(role);
    setIsAuthenticated(true);
    await Promise.allSettled([
      fetchUserProfile(),
      syncFCMToken(),
      ensureNativeCallPermissions(),
      (async () => {
        const oldSocket = getSocket();
        if (oldSocket) oldSocket.disconnect();
        const socket = await initSocket();
        attachSocketListeners(socket, setHosts);
      })(),
    ]);

    // One-time post-auth overlay permission check
    const granted = await OverlayPermissionManager.ensureOverlayPermissionOnAuth({ isRegister });
    if (!granted) {
      setPendingOverlayGate(true);
    }
  };

  // ✅ Logout
  const logout = async () => {
    await clearAuthSession({ notify: false });
    setUser(null);
    setRole(null);
    setIsAuthenticated(false);
    setPendingOverlayGate(false);

    const socket = getSocket();
    if (socket) socket.disconnect(); // 👈 disconnect on logout
  };

  const updateCoins = (newAmount) => {
    setUser(prev => prev ? { ...prev, coins: newAmount } : prev);
  };

  const updateDiamonds = (newAmount) => {
    setUser(prev => prev ? { ...prev, diamonds: newAmount } : prev);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        role,
        isAuthenticated,
        loading,
        login,
        logout,
        hosts,
        setHosts,
        fetchUserProfile,
        updateCoins,
        updateDiamonds,
      }}
    >
      {children}
      <OverlayPermissionGateModal
        visible={pendingOverlayGate}
        onGranted={() => setPendingOverlayGate(false)}
        onContinueAnyway={() => setPendingOverlayGate(false)}
      />
    </AuthContext.Provider>
  );
};
