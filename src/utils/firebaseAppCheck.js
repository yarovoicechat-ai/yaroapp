import { Platform } from 'react-native';
import {
  initializeAppCheck,
  ReactNativeFirebaseAppCheckProvider,
} from '@react-native-firebase/app-check';

let appCheckInitializationPromise = null;

export const initializeFirebaseAppCheck = () => {
  if (appCheckInitializationPromise) {
    return appCheckInitializationPromise;
  }

  appCheckInitializationPromise = (async () => {
    try {
      const provider = new ReactNativeFirebaseAppCheckProvider();

      provider.configure({
        android: {
          provider: __DEV__ ? 'debug' : 'playIntegrity',
        },
        apple: {
          provider: __DEV__
            ? 'debug'
            : 'appAttestWithDeviceCheckFallback',
        },
        isTokenAutoRefreshEnabled: true,
      });

      const appCheck = await initializeAppCheck(undefined, {
        provider,
        isTokenAutoRefreshEnabled: true,
      });

      if (__DEV__) {
        console.log(
          `[AppCheck] Initialized (${Platform.OS}, debug provider)`,
        );
      }

      return appCheck;
    } catch (error) {
      console.error('[AppCheck] Initialization failed:', error);
      throw error;
    }
  })();

  return appCheckInitializationPromise;
};