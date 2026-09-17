import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';

export const AUTH_SESSION_EXPIRED_EVENT = 'auth-session-expired';

export const AUTH_STORAGE_KEYS = [
  'accessToken',
  'refreshToken',
  'role',
  'gender',
  'cachedUser',
];

// Preserve language, notification state and non-auth caches on logout.
export const clearAuthSession = async ({ notify = true } = {}) => {
  await AsyncStorage.multiRemove(AUTH_STORAGE_KEYS);
  if (notify) DeviceEventEmitter.emit(AUTH_SESSION_EXPIRED_EVENT);
};

