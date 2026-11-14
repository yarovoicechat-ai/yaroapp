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
  handleMessageNotificationEvent,
  showMessageNotification,
} from './src/utils/MessageNotificationService';

import { isActivityNotification, showActivityNotification, handleActivityNotificationEvent } from './src/utils/ActivityNotificationService';

notifee.onBackgroundEvent(async event => {
  if (isActivityNotification(event.detail?.notification?.data)) {
    return handleActivityNotificationEvent(event);
  }
  if (event.detail?.notification?.data?.type === 'message') {
    return handleMessageNotificationEvent(event);
  }


});

// Headless task for FCM messages while app is killed/background
messaging().setBackgroundMessageHandler(async remoteMessage => {
  if (['call', 'call_state', 'missed_call'].includes(remoteMessage?.data?.type)) return;
  if (isActivityNotification(remoteMessage?.data) || remoteMessage?.notification) {
    await showActivityNotification({
      ...(remoteMessage?.data || {}),
      title: remoteMessage?.data?.title || remoteMessage?.notification?.title,
      body: remoteMessage?.data?.body || remoteMessage?.notification?.body,
    });
  } else if (remoteMessage?.data?.type === 'message') {
    await showMessageNotification(remoteMessage.data);
  }
});

// Initialize Firebase App Check once at startup
initializeFirebaseAppCheck().catch(error => {
  console.error('[AppCheck] Startup initialization failed:', error);
});

AppRegistry.registerComponent(appName, () => App);
