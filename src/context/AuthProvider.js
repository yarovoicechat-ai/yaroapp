import React, { createContext, useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiUtil } from '../utils/apiUtil';
import { initSocket, getSocket } from '../sockets/';
import { AppState, DeviceEventEmitter } from 'react-native';
import { attachSocketListeners } from '../utils/initializeSocket';
import { syncFCMToken } from '../utils/NotificationManager';
import { AUTH_SESSION_EXPIRED_EVENT, clearAuthSession } from '../utils/authSession';
import { DUMMY_HOSTS } from '../constants/dummyData';

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
    equippedFrame: null,
    equippedMicWave: 'Golden Pulse Wave',
  };
  const [user, setUser] = useState(defaultUser);
  const [role, setRole] = useState('user');
  const [hosts, setHosts] = useState([]);
  const [equippedFrame, setEquippedFrameState] = useState(null);
  const [equippedMicWave, setEquippedMicWaveState] = useState('Golden Pulse Wave');

  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Set & persist equipped frame across all screens (Profile, VoiceRoom, MyItems, Store)
  const setEquippedFrame = useCallback(async (frame) => {
    const frameName = typeof frame === 'object' && frame?.name ? frame.name : (frame || '');
    let frameAsset = typeof frame === 'object' && frame?.name && (frame.imageUrl || frame.animationUrl)
      ? {
          name: frame.name,
          imageUrl: frame.imageUrl || '',
          animationUrl: frame.animationUrl || '',
          expiresAt: frame.expiresAt || null,
        }
      : null;

    setEquippedFrameState(frameName);
    setUser(prev => prev ? { ...prev, equippedFrame: frameName, equippedFrameAsset: frameAsset } : prev);
    try {
      await AsyncStorage.setItem('equippedFrame', frameName);
      if (frameAsset) await AsyncStorage.setItem('equippedFrameAsset', JSON.stringify(frameAsset));
      else await AsyncStorage.removeItem('equippedFrameAsset');
      const cached = await AsyncStorage.getItem('cachedUser');
      if (cached) {
        const parsed = JSON.parse(cached);
        parsed.equippedFrame = frameName;
        parsed.equippedFrameAsset = frameAsset;
        await AsyncStorage.setItem('cachedUser', JSON.stringify(parsed));
      }
      apiUtil.post('/store/equip', {
        name: frameName,
        category: 'Frames',
        imageUrl: frameAsset?.imageUrl || '',
        animationUrl: frameAsset?.animationUrl || '',
      }, { suppressGlobalError: true }).catch(() => undefined);
    } catch (_) {}
  }, []);

  // Set & persist equipped mic wave
  const setEquippedMicWave = useCallback(async (wave) => {
    const waveName = typeof wave === 'object' && wave?.name ? wave.name : (wave || '');
    setEquippedMicWaveState(waveName);
    setUser(prev => prev ? { ...prev, equippedMicWave: waveName } : prev);
    try {
      await AsyncStorage.setItem('equippedMicWave', waveName);
      const cached = await AsyncStorage.getItem('cachedUser');
      if (cached) {
        const parsed = JSON.parse(cached);
        parsed.equippedMicWave = waveName;
        await AsyncStorage.setItem('cachedUser', JSON.stringify(parsed));
      }
    } catch (_) {}
  }, []);

  // ✅ Fetch profile using accessToken
const fetchUserProfile = useCallback(async () => {
  try {
    const res = await apiUtil.get('/user');

    console.log("USER API =", res.data);

    if (res.data.success) {
      const profile = res.data.data.user;
      const [savedFrame, savedMicWave, savedFrameAsset] = await Promise.all([
        AsyncStorage.getItem('equippedFrame'),
        AsyncStorage.getItem('equippedMicWave'),
        AsyncStorage.getItem('equippedFrameAsset'),
      ]);
      let activeFrameAsset = profile.equippedFrameAsset || null;
      if (!activeFrameAsset && savedFrameAsset) {
        try {
          const parsed = JSON.parse(savedFrameAsset);
          if (parsed?.name === savedFrame && (!parsed.expiresAt || new Date(parsed.expiresAt).getTime() > Date.now())) {
            activeFrameAsset = parsed;
          }
        } catch (_) {}
      }

      const effectiveFrame = profile.equippedFrame && profile.equippedFrame !== 'default' && profile.equippedFrame !== 'none'
        ? profile.equippedFrame
        : (savedFrame || profile.equippedFrame || null);

      const mergedProfile = {
        ...profile,
        equippedFrame: effectiveFrame,
        equippedFrameAsset: activeFrameAsset,
        equippedMicWave: profile.equippedMicWave || savedMicWave || 'Golden Pulse Wave',
      };
      setUser(mergedProfile);
      if (effectiveFrame) setEquippedFrameState(effectiveFrame);
      if (savedMicWave) setEquippedMicWaveState(savedMicWave);
      await AsyncStorage.setItem('cachedUser', JSON.stringify(mergedProfile));
      return mergedProfile;
    }
  } catch (err) {
    console.log("STATUS =", err.response?.status);
    console.log("DATA =", err.response?.data);
    console.log("MESSAGE =", err.message);

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
      console.log('[AUTH_DEBUG] values from multiGet:', JSON.stringify(stored));
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
            const parsedUser = JSON.parse(stored.cachedUser);
            const [savedFrame, savedMicWave] = await Promise.all([
              AsyncStorage.getItem('equippedFrame'),
              AsyncStorage.getItem('equippedMicWave'),
            ]);
            parsedUser.equippedFrame = parsedUser.equippedFrame || savedFrame || null;
            parsedUser.equippedMicWave = parsedUser.equippedMicWave || savedMicWave || 'Golden Pulse Wave';
            setUser(parsedUser);
            if (savedFrame) setEquippedFrameState(savedFrame);
            if (savedMicWave) setEquippedMicWaveState(savedMicWave);
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
            if (parsedUser.userId === 888888) {
              setLoading(false);
              return;
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
    const cached = await AsyncStorage.getItem('cachedUser');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setUser(parsed);
      } catch (e) {}
    }
    await Promise.allSettled([
      fetchUserProfile(),
      syncFCMToken(),
      (async () => {
        const oldSocket = getSocket();
        if (oldSocket) oldSocket.disconnect();
        const socket = await initSocket();
        attachSocketListeners(socket, setHosts);
      })(),
    ]);

    // Overlay permission is requested contextually when user minimizes an active call
  };

  // ✅ Logout
  const logout = async () => {
    await clearAuthSession({ notify: false });
    setUser(null);
    setRole(null);
    setIsAuthenticated(false);

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
        equippedFrame,
        setEquippedFrame,
        equippedMicWave,
        setEquippedMicWave,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
