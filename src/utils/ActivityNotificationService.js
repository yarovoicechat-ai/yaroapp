import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const isActivityNotification = data => ['missed_call', 'room_open', 'system', 'event'].includes(data?.type) || Boolean(data?.title || data?.body);

export const showActivityNotification = async rawData => {
  if (!isActivityNotification(rawData)) return;
  const data = Object.fromEntries(Object.entries(rawData).filter(([, value]) => value != null)
    .map(([key, value]) => [key, String(value)]));
  const channelId = await notifee.createChannel({
    id: 'activity_notifications_v1', name: 'Calls, rooms and system messages',
    importance: AndroidImportance.HIGH, sound: 'default', vibration: true,
  });
  await notifee.displayNotification({
    ...(data.notificationId || data.transactionId ? { id: data.notificationId || 'missed-' + data.transactionId } : {}),
    title: data.title || (data.type === 'missed_call' ? 'Missed call' : 'Yaro'),
    body: data.body || '', data,
    android: { channelId, importance: AndroidImportance.HIGH, autoCancel: true,
      pressAction: { id: 'open-activity', launchActivity: 'default' } },
  });
};

export const handleActivityNotificationEvent = async ({ type, detail }) => {
  const data = detail?.notification?.data;
  if (!isActivityNotification(data) || type !== EventType.PRESS) return null;
  await AsyncStorage.setItem('pendingActivityNotification', JSON.stringify(data));
  return data;
};
