import SpInAppUpdates, {
  IAUUpdateKind,
} from 'sp-react-native-in-app-updates';
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { apiPublic } from '../utils/apiUtil';

class InAppUpdateService {
  constructor() {
    this.inAppUpdates = new SpInAppUpdates(false); // false = production mode
    this.listenerAdded = false;
  }

  /**
   * Check if an update is available from Google Play or required by Backend.
   * Returns details on update status.
   */
  async checkUpdateStatus() {
    if (!this.pendingCheck) {
      this.pendingCheck = this.readUpdateStatus().finally(() => { this.pendingCheck = null; });
    }
    return this.pendingCheck;
  }

  async readUpdateStatus() {
    const currentBuildNumber = parseInt(DeviceInfo.getBuildNumber() || '0', 10);
    const currentVersionName = DeviceInfo.getVersion();

    let playStoreUpdateAvailable = false;
    let playStoreInfo = null;

    const playCheck = async () => {
      if (Platform.OS === 'android') {
        let timeout;
        try {
          const result = await Promise.race([
            this.inAppUpdates.checkNeedsUpdate(),
            new Promise(resolve => { timeout = setTimeout(() => resolve(null), 5000); }),
          ]);
          if (result && result.shouldUpdate) {
            playStoreUpdateAvailable = true;
            playStoreInfo = result;
          }
        } catch (err) {
          console.log('[IN_APP_UPDATE] Play Store check note:', err?.message || err);
        } finally {
          clearTimeout(timeout);
        }
      }
    };

    // Check optional backend minimumSupportedVersion
    let backendForceUpdate = false;
    const backendCheck = async () => {
      try {
        const response = await apiPublic.get('/public/settings', { timeout: 5000, networkRetry: false });
        if (response && response.data && response.data.success && response.data.data) {
          const settings = response.data.data;
          const minVersion = Number(settings.minimumSupportedVersion || 0);
          if (minVersion > 0 && currentBuildNumber < minVersion) {
            backendForceUpdate = true;
          }
        }
      } catch (backendErr) {
        // Retain the existing offline fallback to the Play Store check.
      }
    };
    await Promise.all([playCheck(), backendCheck()]);

    const isUpdateRequired = playStoreUpdateAvailable || backendForceUpdate;

    return {
      needsUpdate: isUpdateRequired,
      isMandatory: isUpdateRequired,
      currentBuildNumber,
      currentVersionName,
      playStoreUpdateAvailable,
      backendForceUpdate,
      playStoreInfo,
    };
  }

  /**
   * Trigger Google Play Immediate In-App Update flow.
   */
  async startImmediateUpdate(onStatusUpdate) {
    if (Platform.OS !== 'android') {
      return { success: false, message: 'In-app update is only supported on Android' };
    }

    try {
      if (onStatusUpdate && !this.listenerAdded) {
        this.inAppUpdates.addStatusUpdateListener((status) => {
          console.log('[IN_APP_UPDATE] Status update:', status);
          if (onStatusUpdate) {
            onStatusUpdate(status);
          }
        });
        this.listenerAdded = true;
      }

      await this.inAppUpdates.startUpdate({
        updateType: IAUUpdateKind.IMMEDIATE,
      });

      return { success: true };
    } catch (error) {
      console.error('[IN_APP_UPDATE] startImmediateUpdate error:', error);
      return {
        success: false,
        error,
        message: error?.message || 'Failed to start immediate update flow',
      };
    }
  }

  /**
   * Remove status listeners
   */
  removeListeners() {
    if (this.listenerAdded && this.inAppUpdates) {
      try {
        this.inAppUpdates.removeStatusUpdateListener();
      } catch (e) {
        // ignore
      }
      this.listenerAdded = false;
    }
  }
}

export default new InAppUpdateService();
