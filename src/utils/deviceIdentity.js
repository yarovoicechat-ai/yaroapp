import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';

const DEVICE_ID_STORAGE_KEY = 'yaro_installation_device_id';
let cachedDeviceId = null;

/**
 * Returns a stable, persistent installation device identifier.
 * Survives normal app restarts.
 */
export async function getInstallationDeviceId() {
  if (cachedDeviceId) return cachedDeviceId;

  try {
    const stored = await AsyncStorage.getItem(DEVICE_ID_STORAGE_KEY);
    if (stored && typeof stored === 'string' && stored.trim().length > 3) {
      cachedDeviceId = stored.trim();
      return cachedDeviceId;
    }

    let hardwareId = '';
    try {
      if (DeviceInfo && typeof DeviceInfo.getUniqueId === 'function') {
        hardwareId = await DeviceInfo.getUniqueId();
      }
    } catch (_) {}

    const cleanHardwareId = String(hardwareId || '').trim();
    const finalId = cleanHardwareId && cleanHardwareId !== 'unknown'
      ? cleanHardwareId
      : `yaro_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;

    cachedDeviceId = finalId;
    await AsyncStorage.setItem(DEVICE_ID_STORAGE_KEY, finalId);
    return finalId;
  } catch (err) {
    console.warn('[DeviceIdentity] Failed to access storage:', err?.message);
    const fallbackId = `yaro_fallback_${Date.now()}`;
    cachedDeviceId = fallbackId;
    return fallbackId;
  }
}
