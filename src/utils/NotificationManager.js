import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, { EventType } from '@notifee/react-native';
import { AppState, PermissionsAndroid, Platform } from 'react-native';
import { apiUtil } from './apiUtil';
import { navigate, navigationRef } from './navigationRef';
import {
  handleMessageNotificationEvent,
  showMessageNotification,
} from './MessageNotificationService';
import {
  isActivityNotification,
  showActivityNotification,
  handleActivityNotificationEvent,
} from './ActivityNotificationService';

export const ensureAllNotificationChannels = async () => {
  if (Platform.OS !== 'android') return;
  await notifee.createChannels([
    {
      id: 'activity_notifications_v1',
      name: 'Activity & Room Alerts',
      importance: 4,
      sound: 'default',
    },
    {
      id: 'chat_messages_v2',
      name: 'Chat messages',
      importance: 4,
      sound: 'default',
    },
    {
      id: 'default',
      name: 'General Notifications',
      importance: 3,
      sound: 'default',
    },
  ]);
  // Remove obsolete ringing channels and any persisted incoming notifications.
  await notifee.deleteChannel('incoming_call_v2');
  await notifee.deleteChannel('call_channel');
  await AsyncStorage.multiRemove([
    'pendingCall',
    'acceptedCall',
    'acceptingCall',
  ]);
};
export const syncFCMToken = async () => {
  try {
    const fcmToken = await messaging().getToken();
    if (!fcmToken) return;
    await AsyncStorage.setItem('fcmToken', fcmToken);
    if (await AsyncStorage.getItem('accessToken'))
      await apiUtil.post('/user/save-fcm', { fcmToken });
  } catch (e) {
    console.log('FCM sync deferred:', e.message);
  }
};
export const requestUserPermission = async () => {
  try {
    await ensureAllNotificationChannels();
    if (Platform.OS === 'android' && Platform.Version >= 33)
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
    const status = await messaging().requestPermission();
    if (
      [
        messaging.AuthorizationStatus.AUTHORIZED,
        messaging.AuthorizationStatus.PROVISIONAL,
      ].includes(status)
    )
      await syncFCMToken();
  } catch (e) {
    console.log('Notification permission deferred:', e.message);
  }
};
const retired = data =>
  ['call', 'call_state', 'missed_call'].includes(data?.type);
const open = async (message, attempt = 0) => {
  const data = message?.data || {};
  if (retired(data)) return;
  if (!navigationRef.isReady()) {
    if (attempt < 20) setTimeout(() => open(message, attempt + 1), 500);
    return;
  }
  if (data.type === 'message')
    navigate('Chat', {
      conversationId: data.conversationId,
      otherUser: {
        _id: data.senderId,
        name: data.senderName || 'User',
        image: data.senderImage || '',
      },
    });
  else if (data.type === 'live' && data.roomId)
    navigate('LiveStream', { roomId: data.roomId });
  else if (data.type === 'room_open' && data.roomId)
    navigate('VoiceRoom', { roomId: data.roomId });
  else if (data.action === 'open_face_verification')
    navigate('FaceVerification');
  else if (data.action === 'open_kyc_verification') navigate('Kyc');
  else if (data.action === 'login_redirect') navigate('SignIn');
  else if (data.action === 'open_system_messages' || data.type === 'system')
    navigate('SystemMessage');
  else navigate('Notifications');
};
export const NotificationListen = () => {
  const restore = async () => {
    for (const key of ['pendingMessage', 'pendingActivityNotification']) {
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        await open({ data: JSON.parse(stored) });
        await AsyncStorage.removeItem(key);
      }
    }
  };
  const appState = AppState.addEventListener('change', state => {
    if (state === 'active') {
      syncFCMToken();
      restore().catch(() => {});
    }
  });
  const refresh = messaging().onTokenRefresh(async token => {
    await AsyncStorage.setItem('fcmToken', token);
    if (await AsyncStorage.getItem('accessToken'))
      await apiUtil.post('/user/save-fcm', { fcmToken: token }).catch(() => {});
  });
  const foreground = messaging().onMessage(async message => {
    if (retired(message.data)) return;
    if (message.data?.type === 'message') {
      const current = navigationRef.isReady()
        ? navigationRef.getCurrentRoute()
        : null;
      if (
        current?.name !== 'Chat' ||
        String(current?.params?.conversationId) !==
          String(message.data.conversationId)
      )
        await showMessageNotification(message.data);
    } else if (isActivityNotification(message.data) || message.notification)
      await showActivityNotification({
        ...(message.data || {}),
        title: message.data?.title || message.notification?.title,
        body: message.data?.body || message.notification?.body,
      });
  });
  const opened = messaging().onNotificationOpenedApp(message => {
    open(message).catch(() => {});
  });
  const local = notifee.onForegroundEvent(async event => {
    const data = event.detail?.notification?.data;
    if (retired(data)) return;
    if (data?.type === 'message') {
      const result = await handleMessageNotificationEvent(event);
      if (result?.action === 'open') {
        await AsyncStorage.removeItem('pendingMessage');
        await open({ data: result.data });
      }
    } else if (isActivityNotification(data)) {
      await handleActivityNotificationEvent(event);
      await restore();
    } else if (event.type === EventType.PRESS) await open({ data });
  });
  messaging()
    .getInitialNotification()
    .then(message => {
      if (message) return open(message);
    })
    .catch(() => {});
  notifee
    .getInitialNotification()
    .then(initial => {
      if (initial) return open({ data: initial.notification?.data });
    })
    .catch(() => {});
  restore().catch(() => {});
  return () => {
    appState.remove();
    refresh();
    foreground();
    opened();
    local();
  };
};
