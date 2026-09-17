import notifee, {
  AndroidImportance,
  AndroidStyle,
  EventType,
} from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiUtil } from './apiUtil';

const CHANNEL_ID = 'chat_messages_v2';
const notificationId = conversationId => `chat-${conversationId || 'unknown'}`;
const historyKey = conversationId => `notificationHistory:${conversationId || 'unknown'}`;

const ensureChannel = () => notifee.createChannel({
  id: CHANNEL_ID,
  name: 'Chat messages',
  importance: AndroidImportance.HIGH,
  vibration: true,
});

export const showMessageNotification = async rawData => {
  const data = Object.fromEntries(
    Object.entries(rawData || {}).map(([key, value]) => [key, String(value ?? '')])
  );
  if (!data.conversationId || !data.senderId) return;

  const key = historyKey(data.conversationId);
  let previous = [];
  try { previous = JSON.parse(await AsyncStorage.getItem(key) || '[]'); } catch (_) { previous = []; }
  const lines = [...previous, data.body || 'New message'].slice(-5);
  await AsyncStorage.setItem(key, JSON.stringify(lines));

  await notifee.displayNotification({
    id: notificationId(data.conversationId),
    title: data.senderName || data.title || 'New message',
    body: lines.length > 1 ? `${lines.length} new messages` : lines[0],
    data,
    android: {
      channelId: await ensureChannel(),
      importance: AndroidImportance.HIGH,
      autoCancel: true,
      groupId: `conversation-${data.conversationId}`,
      pressAction: { id: 'open-message', launchActivity: 'default' },
      style: { type: AndroidStyle.INBOX, lines },
      actions: [
        {
          title: 'Reply',
          pressAction: { id: 'reply-message' },
          input: { placeholder: 'Type a reply' },
        },
        {
          title: 'Mark as read',
          pressAction: { id: 'mark-message-read' },
        },
      ],
    },
  });
};

export const handleMessageNotificationEvent = async ({ type, detail }) => {
  const data = detail?.notification?.data || {};
  if (data.type !== 'message') return null;

  const actionId = detail?.pressAction?.id;
  const id = notificationId(data.conversationId);

  if (type === EventType.ACTION_PRESS && actionId === 'reply-message') {
    const content = String(detail?.input || '').trim();
    if (content) {
      await apiUtil.post('/chat/send', {
        receiverId: data.senderId,
        conversationId: data.conversationId,
        content,
      });
    }
    await notifee.cancelNotification(id);
    await AsyncStorage.removeItem(historyKey(data.conversationId));
    return { action: 'reply', data };
  }

  if (type === EventType.ACTION_PRESS && actionId === 'mark-message-read') {
    await apiUtil.post('/chat/seen', { conversationId: data.conversationId });
    await notifee.cancelNotification(id);
    await AsyncStorage.removeItem(historyKey(data.conversationId));
    return { action: 'read', data };
  }

  if (type === EventType.PRESS || actionId === 'open-message') {
    await AsyncStorage.setItem('pendingMessage', JSON.stringify(data));
    await AsyncStorage.removeItem(historyKey(data.conversationId));
    return { action: 'open', data };
  }

  return null;
};
