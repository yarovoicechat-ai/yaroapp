import React, {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AppState, DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiUtil } from '../utils/apiUtil';
import { initSocket, getSocket } from '../sockets/';
import { attachSocketListeners } from '../utils/initializeSocket';
import { syncFCMToken } from '../utils/NotificationManager';
import { AUTH_SESSION_EXPIRED_EVENT, clearAuthSession } from '../utils/authSession';
import { mergeCanonicalUser } from '../utils/cosmeticResolver';

export const AuthContext = createContext();

const getItemId = (item) =>
  item?.catalogItem?._id ||
  item?.catalogItem?.id ||
  item?.itemId?._id ||
  item?.itemId ||
  item?._id ||
  item?.id ||
  null;

export const AuthProvider = ({ children }) => {
  const defaultUser = {
    _id: 'guest_101',
    name: 'Yaro User',
    coins: 0,
    diamonds: 0,
    gender: 'male',
    avatar: null,
    equippedFrame: null,
    equippedMicWave: null,
  };

  const [user, setUser] = useState(defaultUser);
  const userRef = useRef(defaultUser);
  const [role, setRole] = useState('user');
  const [hosts, setHosts] = useState([]);
  const [equippedFrame, setEquippedFrameState] = useState(null);
  const [equippedMicWave, setEquippedMicWaveState] = useState(null);
  const [equippedEntry, setEquippedEntryState] = useState(null);
  const [equippedChatBubble, setEquippedChatBubbleState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const syncEquippedState = useCallback((profile) => {
    setEquippedFrameState(profile?.equippedFrame || null);
    setEquippedMicWaveState(profile?.equippedMicWave || null);
    setEquippedEntryState(
      profile?.equippedEntry || profile?.equippedEntryEffect || null,
    );
    setEquippedChatBubbleState(profile?.equippedChatBubble || null);
  }, []);

  const commitCanonicalUser = useCallback(
    async (incoming) => {
      if (!incoming || typeof incoming !== 'object') return userRef.current;
      const next = mergeCanonicalUser(userRef.current, incoming);
      userRef.current = next;
      setUser(next);
      syncEquippedState(next);
      await AsyncStorage.setItem('cachedUser', JSON.stringify(next));
      return next;
    },
    [syncEquippedState],
  );

  /**
   * The server validates ownership and returns the canonical equipped fields.
   * No client supplied asset URL is persisted or trusted.
   */
  const equipCosmetic = useCallback(
    async (item, category, shouldEquip = true) => {
      const name = typeof item === 'string' ? item : item?.name || '';
      const response = await apiUtil.post(
        '/store/equip',
        {
          itemId: shouldEquip ? getItemId(item) : null,
          name: shouldEquip ? name : '',
          category,
          equipped: Boolean(shouldEquip),
        },
        { suppressGlobalError: true },
      );
      const payload = response?.data?.data?.user || response?.data?.data;
      if (!response?.data?.success || !payload) {
        throw new Error(response?.data?.message || 'Item equip nahi ho saka');
      }
      return commitCanonicalUser(payload);
    },
    [commitCanonicalUser],
  );

  const setEquippedFrame = useCallback(
    (item) => equipCosmetic(item, 'Frames', Boolean(item)),
    [equipCosmetic],
  );
  const setEquippedEntry = useCallback(
    (item) => equipCosmetic(item, 'Entry', Boolean(item)),
    [equipCosmetic],
  );
  const setEquippedMicWave = useCallback(
    (item) => equipCosmetic(item, 'Mic Wave', Boolean(item)),
    [equipCosmetic],
  );
  const setEquippedChatBubble = useCallback(
    (item) => equipCosmetic(item, 'Chat Bubble', Boolean(item)),
    [equipCosmetic],
  );

  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await apiUtil.get('/user/profile');
      if (!response?.data?.success) return null;
      const profile = response.data.data?.user || response.data.data;
      return await commitCanonicalUser(profile);
    } catch (error) {
      console.warn('[AUTH] Profile refresh failed:', error?.message);
      return null;
    }
  }, [commitCanonicalUser]);

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
      if (!stored.accessToken || !stored.refreshToken) {
        setIsAuthenticated(false);
        return;
      }

      setIsAuthenticated(true);
      setRole(stored.role || 'user');
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
          const cached = JSON.parse(stored.cachedUser);
          userRef.current = cached;
          setUser(cached);
          syncEquippedState(cached);
          if (!acceptingCall) setLoading(false);
          if (cached.userId === 888888) return;
        } catch (_) {
          await AsyncStorage.removeItem('cachedUser');
        }
      }

      if (acceptingCall) {
        for (let attempt = 0; attempt < 75; attempt += 1) {
          if (await AsyncStorage.getItem('acceptedCall')) break;
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
        setLoading(false);
      }

      await fetchUserProfile();
      const socket = await initSocket();
      attachSocketListeners(socket, setHosts);
    } catch (error) {
      console.warn('[AUTH] Session restore failed:', error?.message);
    } finally {
      setLoading(false);
    }
  }, [fetchUserProfile, syncEquippedState]);

  useEffect(() => {
    const authExpiredSubscription = DeviceEventEmitter.addListener(
      AUTH_SESSION_EXPIRED_EVENT,
      () => {
        userRef.current = null;
        setUser(null);
        setRole(null);
        setIsAuthenticated(false);
        getSocket()?.disconnect();
      },
    );
    loadAuthState();

    const subscription = AppState.addEventListener('change', (nextState) => {
      const socket = getSocket();
      if (!socket) return;
      if (nextState === 'active') {
        syncFCMToken();
        if (!socket.connected) initSocket();
      }
    });

    return () => {
      authExpiredSubscription.remove();
      subscription.remove();
      getSocket()?.disconnect();
    };
  }, [loadAuthState]);

  const login = async ({
    accessToken,
    refreshToken,
    role: nextRole,
    gender,
  }) => {
    await AsyncStorage.multiSet([
      ['accessToken', accessToken],
      ['refreshToken', refreshToken],
      ['role', nextRole],
      ['gender', gender || ''],
    ]);
    setRole(nextRole);
    setIsAuthenticated(true);
    await Promise.allSettled([
      fetchUserProfile(),
      syncFCMToken(),
      (async () => {
        getSocket()?.disconnect();
        const socket = await initSocket();
        attachSocketListeners(socket, setHosts);
      })(),
    ]);
  };

  const logout = async () => {
    await clearAuthSession({ notify: false });
    userRef.current = null;
    setUser(null);
    syncEquippedState(null);
    setRole(null);
    setIsAuthenticated(false);
    getSocket()?.disconnect();
  };

  const updateUserLocally = useCallback((patch) => {
    setUser((previous) => {
      const next = { ...(previous || {}), ...patch };
      userRef.current = next;
      AsyncStorage.setItem('cachedUser', JSON.stringify(next)).catch(() => undefined);
      return next;
    });
  }, []);

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
        updateCoins: (coins) => updateUserLocally({ coins }),
        updateDiamonds: (diamonds) => updateUserLocally({ diamonds }),
        equipCosmetic,
        equippedFrame,
        setEquippedFrame,
        equippedMicWave,
        setEquippedMicWave,
        equippedEntry,
        setEquippedEntry,
        equippedChatBubble,
        setEquippedChatBubble,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
