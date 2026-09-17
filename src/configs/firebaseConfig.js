import { getApps, initializeApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';

// For React Native apps, the native SDKs (Android and iOS)
// automatically read the configuration from your google-services.json file.
// Therefore, you do not need to pass a config object here.
if (!getApps().length) {
   const res = initializeApp();
   console.log("res : ",res)
}

// Export the initialized auth service.
export const auth = getAuth();