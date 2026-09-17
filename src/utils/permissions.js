import { Platform, PermissionsAndroid } from 'react-native';
import { FloatingCallBridge } from '../services/FloatingCallBridge';

export const requestMicrophonePermission = async () => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'Meethi Chat needs access to your microphone to make voice calls.',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Microphone permission request error:', err);
      return false;
    }
  }
  return true;
};

export const requestAllCallPermissions = async () => {
  if (Platform.OS === 'android') {
    try {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ];

      if (PermissionsAndroid.PERMISSIONS.CAMERA) {
        permissions.push(PermissionsAndroid.PERMISSIONS.CAMERA);
      }

      if (Platform.Version >= 33 && PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS) {
        permissions.push(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      }

      const granted = await PermissionsAndroid.requestMultiple(permissions);
      const audioGranted = granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;
      console.log('📱 Upfront call permissions result:', granted);
      return audioGranted;
    } catch (err) {
      console.warn('Upfront permissions request error:', err);
      return false;
    }
  }
  return true;
};

export const checkCallPermissionsStatus = async () => {
  if (Platform.OS !== 'android') {
    return { audio: true, camera: true, notification: true, overlay: true, allGranted: true };
  }

  try {
    const audio = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
    const camera = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
    let notification = true;
    if (Platform.Version >= 33 && PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS) {
      notification = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    }
    const overlay = await FloatingCallBridge.hasOverlayPermission();

    const allGranted = audio && camera && notification && overlay;
    return { audio, camera, notification, overlay, allGranted };
  } catch (err) {
    console.warn('Error checking call permissions status:', err);
    return { audio: false, camera: false, notification: false, overlay: false, allGranted: false };
  }
};

export const checkAllCallPermissionsGranted = async () => {
  const status = await checkCallPermissionsStatus();
  return status.allGranted;
};

export const ensureNativeCallPermissions = async () => {
  if (Platform.OS !== 'android') return true;

  try {
    const permissions = [
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      PermissionsAndroid.PERMISSIONS.CAMERA,
    ];

    if (Platform.Version >= 33 && PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS) {
      permissions.push(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    }

    // 1. Native Android Permission Dialogs
    await PermissionsAndroid.requestMultiple(permissions);

    return true;
  } catch (err) {
    console.warn('ensureNativeCallPermissions error:', err);
    return false;
  }
};


