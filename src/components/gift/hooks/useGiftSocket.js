import { useEffect, useRef, useCallback } from 'react';
import { AppState } from 'react-native';
import { getSocket } from '../../../sockets';

export function useGiftSocket({
  roomId,
  callId,
  currentUserId,
  onGiftReceived,
  onGiftAnimation,
  onGiftSent,
  onRoomNotification,
  onComboUpdate,
  onEntryEffect,
}) {
  const isAppActiveRef = useRef(true);
  const seenTransactionsRef = useRef(new Set());
  const seenAnimationsRef = useRef(new Set());

  // Keep callback refs up to date without triggering effect recreation
  const onGiftAnimationRef = useRef(onGiftAnimation);
  onGiftAnimationRef.current = onGiftAnimation;

  const onGiftReceivedRef = useRef(onGiftReceived);
  onGiftReceivedRef.current = onGiftReceived;

  const onGiftSentRef = useRef(onGiftSent);
  onGiftSentRef.current = onGiftSent;

  const onRoomNotificationRef = useRef(onRoomNotification);
  onRoomNotificationRef.current = onRoomNotification;

  const onComboUpdateRef = useRef(onComboUpdate);
  onComboUpdateRef.current = onComboUpdate;

  const onEntryEffectRef = useRef(onEntryEffect);
  onEntryEffectRef.current = onEntryEffect;

  // AppState Listener (Background / Foreground transition safety)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      isAppActiveRef.current = nextAppState === 'active';
      if (nextAppState === 'active' && roomId) {
        const socket = getSocket();
        if (socket && socket.connected) {
          socket.emit('voice_room:subscribe_gifts', { roomId });
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [roomId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    if (roomId) {
      socket.emit('voice_room:subscribe_gifts', { roomId });
    }

    const isSelfUser = (sender) => {
      if (!currentUserId || !sender) return false;
      const sId = String(sender.userId || sender.id || sender._id || '');
      return sId && sId === String(currentUserId);
    };

    const handleGiftAnimation = (payload) => {
      if (!payload || !isAppActiveRef.current) return;
      // Do not duplicate if sender is self (sender already queued local animation)
      if (isSelfUser(payload.sender)) return;

      const animId = payload.animationId || payload.id;
      if (animId) {
        if (seenAnimationsRef.current.has(animId)) return;
        seenAnimationsRef.current.add(animId);
        // keep set bounded
        if (seenAnimationsRef.current.size > 100) {
          const first = seenAnimationsRef.current.values().next().value;
          seenAnimationsRef.current.delete(first);
        }
      }

      onGiftAnimationRef.current && onGiftAnimationRef.current(payload);
    };

    const handleGiftReceived = (payload) => {
      if (!payload) return;
      // Do not duplicate chat/notification if sender is self
      if (isSelfUser(payload.sender)) return;

      const txId = payload.transactionId || payload.id;
      if (txId) {
        if (seenTransactionsRef.current.has(txId)) return;
        seenTransactionsRef.current.add(txId);
        if (seenTransactionsRef.current.size > 100) {
          const first = seenTransactionsRef.current.values().next().value;
          seenTransactionsRef.current.delete(first);
        }
      }

      onGiftReceivedRef.current && onGiftReceivedRef.current(payload);

      if (onRoomNotificationRef.current && payload.sender && payload.gift && isAppActiveRef.current) {
        const receiverText =
          Array.isArray(payload.receivers) && payload.receivers.length > 0
            ? payload.receivers.map((r) => r.name || 'Recipient').join(', ')
            : payload.receiver?.name || 'Everyone';

        onRoomNotificationRef.current({
          id: `notif_${txId || Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          senderName: payload.sender.name || 'User',
          senderAvatar: payload.sender.avatar,
          giftName: payload.gift.name,
          giftIcon: payload.gift.icon,
          quantity: payload.quantity || 1,
          receiverText,
          timestamp: Date.now(),
        });
      }

      if (onComboUpdateRef.current && payload.comboCount > 1 && isAppActiveRef.current) {
        onComboUpdateRef.current(payload);
      }
    };

    const handleGiftSent = (payload) => {
      if (!payload) return;
      onGiftSentRef.current && onGiftSentRef.current(payload);
    };

    const handleEntryEffect = (payload) => {
      if (!payload || !isAppActiveRef.current) return;
      onEntryEffectRef.current && onEntryEffectRef.current(payload);
    };

    const handleVoiceRoomUserJoined = (data) => {
      if (!data || !data.user || !isAppActiveRef.current) return;
      if (onEntryEffectRef.current) {
        onEntryEffectRef.current({
          entryId: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          roomId,
          user: data.user,
          effect: {
            id: 'default_party_entry',
            name: 'Room Welcome',
            animationType: 'BANNER',
            tagText: 'MEMBER',
            bannerColors: ['#6366F1', '#8B5CF6'],
            duration: 2500,
            icon: '✨',
          },
          tagText: 'MEMBER',
          timestamp: Date.now(),
        });
      }
    };

    const handleConnect = () => {
      if (roomId) {
        socket.emit('voice_room:subscribe_gifts', { roomId });
      }
    };

    socket.on('gift:animation', handleGiftAnimation);
    socket.on('gift:received', handleGiftReceived);
    socket.on('gift:sent', handleGiftSent);
    socket.on('entry:effect', handleEntryEffect);
    socket.on('room:entry', handleEntryEffect);
    socket.on('voice_room:user_joined', handleVoiceRoomUserJoined);
    socket.on('connect', handleConnect);

    return () => {
      socket.off('gift:animation', handleGiftAnimation);
      socket.off('gift:received', handleGiftReceived);
      socket.off('gift:sent', handleGiftSent);
      socket.off('entry:effect', handleEntryEffect);
      socket.off('room:entry', handleEntryEffect);
      socket.off('voice_room:user_joined', handleVoiceRoomUserJoined);
      socket.off('connect', handleConnect);
    };
  }, [roomId, currentUserId, callId]);
}
