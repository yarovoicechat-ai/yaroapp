import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { apiUtil } from '../utils/apiUtil';
import { getSocket } from '../sockets';

export default function useInboxMessages(enabled = true) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const response = await apiUtil.get('/chat/conversations');
      const list = response.data?.data?.conversations || response.data?.data || [];
      setConversations(Array.isArray(list) ? list : []);
    } catch (_) {} finally {
      setLoading(false);
    }
  }, [enabled]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  useEffect(() => {
    if (!enabled) return;
    refresh();

    const socket = getSocket();
    const changed = () => { refresh(); };
    const read = ({ conversationId, unreadCount }) => {
      setConversations(items => items.map(item =>
        String(item._id) === String(conversationId)
          ? { ...item, unreadCount: Math.max(0, Number(unreadCount) || 0) }
          : item
      ));
    };

    socket?.on('newMessageNotification', changed);
    socket?.on('chatUnreadUpdated', read);
    socket?.on('messagesSeen', changed);
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') refresh();
    });

    return () => {
      socket?.off('newMessageNotification', changed);
      socket?.off('chatUnreadUpdated', read);
      socket?.off('messagesSeen', changed);
      sub.remove();
    };
  }, [enabled, refresh]);

  const totalUnread = conversations.reduce(
    (sum, item) => sum + Math.max(0, Number(item.unreadCount) || 0),
    0
  );

  return { conversations, loading, refresh, unreadCount: totalUnread };
}
