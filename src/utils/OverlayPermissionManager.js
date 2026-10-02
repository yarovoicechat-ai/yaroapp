import { Platform } from 'react-native';
import { FloatingCallBridge } from '../services/FloatingCallBridge';

export const OverlayPermissionManager = {
  /**
   * Check actual Android overlay permission status from OS.
   * Source of truth: Settings.canDrawOverlays(reactContext)
   */
  checkActualOverlayPermission: async () => {
    if (Platform.OS !== 'android') return true;
    try {
      const granted = await FloatingCallBridge.hasOverlayPermission();
      return !!granted;
    } catch (err) {
      console.warn('[OVERLAY] Error checking permission:', err);
      return false;
    }
  },

  /**
   * Open Android "Display over other apps" settings screen.
   */
  openOverlaySettings: () => {
    if (Platform.OS === 'android') {
      console.log('[OVERLAY] Opening Android overlay settings');
      FloatingCallBridge.requestOverlayPermission();
    }
  },
};
