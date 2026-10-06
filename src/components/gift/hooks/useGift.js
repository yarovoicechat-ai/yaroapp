import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiUtil } from '../../../utils/apiUtil';
import { AlertService } from '../../../utils/AlertService';

export const QUANTITY_OPTIONS = [1, 5, 10, 20, 50, 100];
export const CONFIRMATION_THRESHOLD_DIAMONDS = 50000;

export const DEFAULT_GIFT_CATEGORIES = [
  { name: 'Gifts', slug: 'gifts', icon: '🎁' },
  { name: 'Lucky', slug: 'lucky', icon: '🍀' },
  { name: 'Event', slug: 'event', icon: '🎉' },
  { name: 'Surprise', slug: 'surprise', icon: '✨' },
  { name: 'Custom', slug: 'custom', icon: '👑' },
  { name: 'VIP', slug: 'vip', icon: '💎' },
  { name: 'Special', slug: 'special', icon: '🔥' },
];

// Gift items are always loaded from the backend catalog.
export const DEFAULT_GIFTS = [];

export function useGift({
  roomId,
  callId,
  diamondBalance = 0,
  deductLocalBalance,
  onGiftSentSuccess,
}) {
  const activeBalance = Number(diamondBalance || 0);
  const activeBalanceRef = useRef(activeBalance);
  activeBalanceRef.current = activeBalance;

  const [categories, setCategories] = useState(DEFAULT_GIFT_CATEGORIES);
  const [activeCategory, setActiveCategory] = useState('Gifts');
  const [gifts, setGifts] = useState([]);
  const [loadingGifts, setLoadingGifts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGift, setSelectedGift] = useState(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedReceivers, setSelectedReceivers] = useState([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [sending, setSending] = useState(false);
  const [confirmationPending, setConfirmationPending] = useState(false);
  const [lastSentGift, setLastSentGift] = useState(null);
  const [comboCount, setComboCount] = useState(1);
  const comboCountRef = useRef(1);
  const comboTimerRef = useRef(null);
  const [quickSendVisible, setQuickSendVisible] = useState(false);
  const quickSendTimerRef = useRef(null);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await apiUtil.get('/gifts/categories');
      const next = response.data?.data;
      setCategories(Array.isArray(next) && next.length ? next : DEFAULT_GIFT_CATEGORIES);
    } catch (_) {
      setCategories(DEFAULT_GIFT_CATEGORIES);
    }
  }, []);

  const fetchGifts = useCallback(async () => {
    try {
      setLoadingGifts(true);
      const response = await apiUtil.get('/gifts');
      const items = response.data?.data;
      const next = Array.isArray(items) ? items : [];
      setGifts(next);
      setSelectedGift((current) => {
        if (current && next.some((item) => (item._id || item.id) === (current._id || current.id))) {
          return current;
        }
        return next[0] || null;
      });
    } catch (error) {
      console.warn('[useGift] Gift catalog unavailable:', error?.message);
      setGifts([]);
      setSelectedGift(null);
    } finally {
      setLoadingGifts(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchGifts();
    return () => {
      if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
      if (quickSendTimerRef.current) clearTimeout(quickSendTimerRef.current);
    };
  }, [fetchCategories, fetchGifts]);

  const filteredGifts = useMemo(() => {
    let result = gifts;
    if (activeCategory && activeCategory.toLowerCase() !== 'all') {
      result = result.filter((gift) => {
        const categoryName = gift.category || gift.categoryId?.name || '';
        return categoryName.toLowerCase() === activeCategory.toLowerCase();
      });
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((gift) => gift.name?.toLowerCase().includes(query));
    }
    return result;
  }, [gifts, activeCategory, searchQuery]);

  const unitPrice = Number(
    selectedGift?.price ??
      selectedGift?.cost ??
      selectedGift?.priceDiamonds ??
      0,
  );
  const receiverCount = Math.max(1, selectedReceivers.length);
  const totalDiamonds = unitPrice * selectedQuantity * receiverCount;
  const hasSufficientDiamonds = activeBalance >= totalDiamonds;

  const registerCombo = useCallback((gift, receiver) => {
    if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
    comboCountRef.current = Math.max(1, comboCountRef.current || 1);
    setComboCount(comboCountRef.current);
    setLastSentGift({
      id: gift.id || gift._id,
      receiverId: receiver?.id || receiver?._id,
      gift,
    });
    comboTimerRef.current = setTimeout(() => {
      comboCountRef.current = 1;
      setComboCount(1);
      setLastSentGift(null);
    }, 3500);
  }, []);

  const triggerQuickSend = useCallback(() => {
    if (quickSendTimerRef.current) clearTimeout(quickSendTimerRef.current);
    setQuickSendVisible(true);
    quickSendTimerRef.current = setTimeout(() => setQuickSendVisible(false), 5000);
  }, []);

  const executeSend = useCallback(
    async (overrideGift = null, overrideQty = null, overrideReceivers = null) => {
      const giftToSend = overrideGift || selectedGift;
      const quantity = overrideQty || selectedQuantity;
      const receivers = overrideReceivers || selectedReceivers;
      if (!giftToSend) return { success: false, reason: 'NO_GIFT' };

      const price = Number(
        giftToSend.price ?? giftToSend.cost ?? giftToSend.priceDiamonds ?? 0,
      );
      const totalCost = price * quantity * Math.max(1, receivers.length);
      const currentBalance = Number(activeBalanceRef.current || 0);
      if (currentBalance < totalCost) {
        AlertService.show(
          'Insufficient Diamonds',
          `You need ${totalCost.toLocaleString()} Diamonds. Your balance is ${currentBalance.toLocaleString()}.`,
          'warning',
        );
        return { success: false, reason: 'INSUFFICIENT_DIAMONDS' };
      }

      const requestId = `gift_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      const nextCombo = comboCountRef.current || 1;
      setSending(true);
      try {
        const response = await apiUtil.post('/gifts/send', {
          requestId,
          giftId: giftToSend._id || giftToSend.id,
          quantity,
          comboCount: nextCombo,
          roomId: roomId || '',
          callId: callId || '',
          currency: 'DIAMONDS',
          receiverIds: receivers
            .map((receiver) => receiver.id || receiver._id || receiver.userId)
            .filter(Boolean),
          receiverId:
            receivers[0]?.id || receivers[0]?._id || receivers[0]?.userId,
        });
        const result = response.data?.data;
        const payload = result?.data || result;
        if (!response.data?.success || !payload?.transactionId) {
          throw new Error(response.data?.message || 'Gift send nahi hua');
        }

        const exactBalance = Number(
          result?.newBalance ?? payload.senderBalance ?? currentBalance - totalCost,
        );
        activeBalanceRef.current = exactBalance;
        deductLocalBalance?.(Math.max(0, currentBalance - exactBalance));
        registerCombo(payload.gift || giftToSend, payload.receivers?.[0] || receivers[0]);
        triggerQuickSend();
        onGiftSentSuccess?.({
          ...payload,
          gift: payload.gift || giftToSend,
          receivers: payload.receivers || receivers,
          quantity: payload.quantity || quantity,
          transactionId: payload.transactionId,
        });
        return { success: true, data: payload };
      } catch (error) {
        AlertService.show(
          'Gift Failed',
          error?.response?.data?.message || error?.message || 'Please try again.',
          'error',
        );
        return { success: false, reason: 'REQUEST_FAILED' };
      } finally {
        setSending(false);
      }
    },
    [
      selectedGift,
      selectedQuantity,
      selectedReceivers,
      roomId,
      callId,
      deductLocalBalance,
      registerCombo,
      triggerQuickSend,
      onGiftSentSuccess,
    ],
  );

  const handleInitiateSend = useCallback(() => {
    if (totalDiamonds >= CONFIRMATION_THRESHOLD_DIAMONDS) {
      setConfirmationPending(true);
    } else {
      executeSend();
    }
  }, [totalDiamonds, executeSend]);

  return {
    categories,
    activeCategory,
    setActiveCategory,
    gifts: filteredGifts,
    loadingGifts,
    searchQuery,
    setSearchQuery,
    selectedGift,
    setSelectedGift,
    selectedQuantity,
    setSelectedQuantity,
    selectedReceivers,
    setSelectedReceivers,
    isMultiSelectMode,
    setIsMultiSelectMode,
    unitPrice,
    receiverCount,
    totalDiamonds,
    hasSufficientDiamonds,
    sending,
    confirmationPending,
    handleInitiateSend,
    confirmSend: () => {
      setConfirmationPending(false);
      executeSend();
    },
    cancelConfirmation: () => setConfirmationPending(false),
    executeSend,
    quickSendVisible,
    setQuickSendVisible,
    comboCount,
    lastSentGift,
  };
}
