import { useState, useRef, useCallback, useEffect } from 'react';

const PRIORITY_MAP = {
  LUXURY: 100,
  VIP: 80,
  SPECIAL: 70,
  FULL_SCREEN: 60,
  CENTER_STAGE: 50,
  FLY_TO_RECEIVER: 30,
  FLOATING: 20,
  NORMAL: 10,
};

export function useGiftQueue() {
  const [activeAnimation, setActiveAnimation] = useState(null);
  const queueRef = useRef([]);
  const isPlayingRef = useRef(false);
  const currentTimeoutRef = useRef(null);
  const activeIdRef = useRef(null);

  const processNext = useCallback(() => {
    if (queueRef.current.length === 0) {
      isPlayingRef.current = false;
      activeIdRef.current = null;
      setActiveAnimation(null);
      return;
    }

    isPlayingRef.current = true;
    // Sort queue by priority descending (Luxury > VIP > Special > Normal)
    queueRef.current.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    const item = queueRef.current.shift();
    activeIdRef.current = item.id;
    setActiveAnimation(item);

    const isSvga =
      String(item.mediaType || item.gift?.mediaType || '').toLowerCase() === 'svga' ||
      /\.svga(?:[?#]|$)/i.test(String(item.animationUrl || item.gift?.animationUrl || ''));
    const duration = isSvga
      ? Math.min(12000, Math.max(4500, Number(item.duration || item.gift?.duration) || 4500))
      : Math.min(12000, Math.max(2400, Number(item.duration || item.gift?.duration) || 4200));

    if (currentTimeoutRef.current) {
      clearTimeout(currentTimeoutRef.current);
    }

    // The player allows up to 12 seconds to load remote media before playback.
    currentTimeoutRef.current = setTimeout(() => {
      processNext();
    }, duration + 13000);
  }, []);

  const enqueue = useCallback(
    (giftEvent) => {
      if (!giftEvent) return;

      const animType = String(
        giftEvent.animationType || giftEvent.gift?.animationType || 'NORMAL'
      ).toUpperCase();
      const priority = PRIORITY_MAP[animType] || 10;

      const giftId = String(giftEvent.gift?.id || giftEvent.gift?._id || giftEvent.giftId || '');
      const senderId = String(giftEvent.sender?.id || giftEvent.sender?._id || giftEvent.sender?.userId || '');
      const receiverId = String(
        giftEvent.receivers?.[0]?.id ||
        giftEvent.receivers?.[0]?._id ||
        giftEvent.receiver?.id ||
        ''
      );

      // Smart Grouping: Check if an identical gift from same sender to same receiver is already in queue
      const existingIdx = queueRef.current.findIndex(
        (item) =>
          String(item.gift?.id || item.gift?._id || item.giftId || '') === giftId &&
          String(item.sender?.id || item.sender?._id || item.sender?.userId || '') === senderId &&
          String(item.receivers?.[0]?.id || item.receivers?.[0]?._id || item.receiver?.id || '') === receiverId
      );

      if (existingIdx !== -1) {
        // Merge quantities and combo count without running redundant animations
        const matched = queueRef.current[existingIdx];
        matched.quantity = (Number(matched.quantity) || 1) + (Number(giftEvent.quantity) || 1);
        matched.comboCount = Math.max(
          Number(matched.comboCount) || 1,
          Number(giftEvent.comboCount) || 1
        );
        return;
      }

      const queuedItem = {
        ...giftEvent,
        priority,
        animationType: animType,
        id: giftEvent.animationId || `q_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      };

      // Cap queue size at 15 to prevent memory pressure on lower-end devices
      if (queueRef.current.length >= 15) {
        queueRef.current.sort((a, b) => (a.priority || 0) - (b.priority || 0));
        queueRef.current.shift();
      }

      queueRef.current.push(queuedItem);

      if (!isPlayingRef.current) {
        processNext();
      }
    },
    [processNext]
  );

  const clearQueue = useCallback(() => {
    queueRef.current = [];
    if (currentTimeoutRef.current) {
      clearTimeout(currentTimeoutRef.current);
    }
    isPlayingRef.current = false;
    activeIdRef.current = null;
    setActiveAnimation(null);
  }, []);

  const completeAnimation = useCallback((id) => {
    if (!activeIdRef.current || (id && id !== activeIdRef.current)) return;
    clearTimeout(currentTimeoutRef.current);
    currentTimeoutRef.current = null;
    processNext();
  }, [processNext]);

  useEffect(() => () => {
    clearTimeout(currentTimeoutRef.current);
    queueRef.current = [];
    activeIdRef.current = null;
    isPlayingRef.current = false;
  }, []);

  return {
    activeAnimation,
    setActiveAnimation,
    enqueue,
    clearQueue,
    completeAnimation,
  };
}
