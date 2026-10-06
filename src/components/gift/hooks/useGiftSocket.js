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
  const seenEntriesRef = useRef(new Set());

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
    let attachedSocket = null;
    let pollInterval = null;
    let isDisposed = false;

    const attach = (socket) => {
      if (isDisposed || !socket || attachedSocket) return;
      attachedSocket = socket;

      if (roomId) {
        socket.emit('voice_room:subscribe_gifts', { roomId });
      }

    const isSelfUser = (sender) => {
      if (!currentUserId || !sender) return false;
      const myId = String(currentUserId).trim();
      const sUserId = sender.userId ? String(sender.userId).trim() : '';
      const sId = sender.id ? String(sender.id).trim() : '';
      const s_id = sender._id ? String(sender._id).trim() : '';
      return (sUserId && sUserId === myId) || (sId && sId === myId) || (s_id && s_id === myId);
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
        const primaryReceiver = payload.receivers?.[0] || payload.receiver || null;

        onRoomNotificationRef.current({
          id: `notif_${txId || Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          senderName: payload.sender.name || 'User',
          senderAvatar: payload.sender.avatar || payload.sender.image,
          giftName: payload.gift.name,
          giftIcon: payload.gift.icon,
          giftImage:
            payload.gift.image ||
            payload.gift.giftImage ||
            payload.gift.previewUrl ||
            payload.giftImage ||
            '',
          quantity: payload.quantity || 1,
          receiverText,
          receiverAvatar: primaryReceiver?.avatar || primaryReceiver?.image || '',
          receivers: payload.receivers || (primaryReceiver ? [primaryReceiver] : []),
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
      const entryId = payload.entryId || payload.id || (payload.user?.userId ? `${payload.user.userId}_${payload.timestamp || ''}` : null);
      if (entryId) {
        if (seenEntriesRef.current.has(entryId)) return;
        seenEntriesRef.current.add(entryId);
        if (seenEntriesRef.current.size > 100) {
          const first = seenEntriesRef.current.values().next().value;
          seenEntriesRef.current.delete(first);
        }
      }
      onEntryEffectRef.current && onEntryEffectRef.current(payload);
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
      socket.on('connect', handleConnect);
    };

    const initialSock = getSocket();
    if (initialSock) {
      attach(initialSock);
    } else {
      let attempts = 0;
      pollInterval = setInterval(() => {
        attempts += 1;
        const s = getSocket();
        if (s) {
          clearInterval(pollInterval);
          attach(s);
        } else if (attempts > 30) {
          clearInterval(pollInterval);
        }
      }, 500);
    }

    return () => {
      isDisposed = true;
      if (pollInterval) clearInterval(pollInterval);
      if (attachedSocket) {
        attachedSocket.off('gift:animation');
        attachedSocket.off('gift:received');
        attachedSocket.off('gift:sent');
        attachedSocket.off('entry:effect');
        attachedSocket.off('room:entry');
      }
    };
  }, [roomId, currentUserId, callId]);
}
