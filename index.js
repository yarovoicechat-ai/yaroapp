import 'react-native-gesture-handler';
import { AppRegistry, LogBox } from 'react-native';
LogBox.ignoreAllLogs();
import { initializeFirebaseAppCheck } from './src/utils/firebaseAppCheck';
import messaging from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';
import './src/locales/i18n';
import App from './App';
import { name as appName } from './app.json';

import {
  handleCallNotificationEvent,
  showIncomingCallNotification,
} from './src/utils/CallNotificationService';
import { applyTerminalCallState } from './src/utils/callLifecycle';

import {
  handleMessageNotificationEvent,
  showMessageNotification,
} from './src/utils/MessageNotificationService';

notifee.onBackgroundEvent(async event => {
  if (event.detail?.notification?.data?.type === 'message') {
    return handleMessageNotificationEvent(event);
  }

  return handleCallNotificationEvent(event);
});

// Headless task for FCM messages while app is killed/background
messaging().setBackgroundMessageHandler(async remoteMessage => {
  if (remoteMessage?.data?.type === 'call') {
    await showIncomingCallNotification(remoteMessage.data);
  } else if (remoteMessage?.data?.type === 'call_state') {
    await applyTerminalCallState(remoteMessage.data);
  } else if (remoteMessage?.data?.type === 'message') {
    await showMessageNotification(remoteMessage.data);
  }
});

// Initialize Firebase App Check once at startup
initializeFirebaseAppCheck().catch(error => {
  console.error('[AppCheck] Startup initialization failed:', error);
});

AppRegistry.registerComponent(appName, () => App);
