import { useState, useEffect, useCallback, useMemo, useRef, useContext } from 'react';
import { AuthContext } from '../../../context/AuthProvider';
import { apiUtil } from '../../../utils/apiUtil';
import { AlertService } from '../../../utils/AlertService';
import { getSocket } from '../../../sockets';

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

export const DEFAULT_GIFTS = [
  // Gifts Category (Matches reference screenshot exactly)
  {
    id: 'gift_glory_crown',
    _id: 'gift_glory_crown',
    name: 'Glory Crown',
    icon: '👑',
    price: 50,
    priceDiamonds: 50,
    cost: 50,
    category: 'Gifts',
    animationType: 'BANNER',
    rarity: 'rare',
    badge: 'HOT',
  },
  {
    id: 'gift_clover',
    _id: 'gift_clover',
    name: 'Clover',
    icon: '🍀',
    price: 25,
    priceDiamonds: 25,
    cost: 25,
    category: 'Gifts',
    animationType: 'PARTICLE',
    rarity: 'common',
    badge: 'NEW',
  },
  {
    id: 'gift_friends_player',
    _id: 'gift_friends_player',
    name: 'Friends Player',
    icon: '🎮',
    price: 25,
    priceDiamonds: 25,
    cost: 25,
    category: 'Gifts',
    animationType: 'PARTICLE',
    rarity: 'common',
  },
  {
    id: 'gift_rich',
    _id: 'gift_rich',
    name: 'Rich',
    icon: '💰',
    price: 3999,
    priceDiamonds: 3999,
    cost: 3999,
    category: 'Gifts',
    animationType: 'FULL_SCREEN',
    rarity: 'epic',
    badge: 'VIP',
  },
  {
    id: 'gift_friend_gift',
    _id: 'gift_friend_gift',
    name: 'Friend Gift',
    icon: '🎁',
    price: 5999,
    priceDiamonds: 5999,
    cost: 5999,
    category: 'Gifts',
    animationType: 'FULL_SCREEN',
    rarity: 'epic',
    badge: 'HOT',
  },
  {
    id: 'gift_masum',
    _id: 'gift_masum',
    name: 'MASUM',
    icon: '💎',
    price: 29999,
    priceDiamonds: 29999,
    cost: 29999,
    category: 'Gifts',
    animationType: 'FULL_SCREEN',
    rarity: 'legendary',
    badge: 'SVIP',
  },
  {
    id: 'gift_falcon_king',
    _id: 'gift_falcon_king',
    name: 'Falcon King',
    icon: '🦅',
    price: 49999,
    priceDiamonds: 49999,
    cost: 49999,
    category: 'Gifts',
    animationType: 'FULL_SCREEN',
    rarity: 'mythic',
    badge: 'MAX',
  },
  {
    id: 'gift_boss_arrival',
    _id: 'gift_boss_arrival',
    name: 'Boss Arrival',
    icon: '🏎️',
    price: 99999,
    priceDiamonds: 99999,
    cost: 99999,
    category: 'Gifts',
    animationType: 'FULL_SCREEN',
    rarity: 'mythic',
    badge: 'MAX',
  },

  // Lucky Category
  {
    id: 'gift_rose',
    _id: 'gift_rose',
    name: 'Rose',
    icon: '🌹',
    price: 1,
    priceDiamonds: 1,
    cost: 1,
    category: 'Lucky',
    animationType: 'PARTICLE',
    rarity: 'common',
  },
  {
    id: 'gift_heart',
    _id: 'gift_heart',
    name: 'Heart',
    icon: '❤️',
    price: 5,
    priceDiamonds: 5,
    cost: 5,
    category: 'Lucky',
    animationType: 'PARTICLE',
    rarity: 'common',
  },
  {
    id: 'gift_lollipop',
    _id: 'gift_lollipop',
    name: 'Lollipop',
    icon: '🍭',
    price: 10,
    priceDiamonds: 10,
    cost: 10,
    category: 'Lucky',
    animationType: 'PARTICLE',
    rarity: 'rare',
  },
  {
    id: 'gift_kiss',
    _id: 'gift_kiss',
    name: 'Romantic Kiss',
    icon: '💋',
    price: 50,
    priceDiamonds: 50,
    cost: 50,
    category: 'Lucky',
    animationType: 'BANNER',
    rarity: 'epic',
  },

  // Event Category
  {
    id: 'gift_ring',
    _id: 'gift_ring',
    name: 'Diamond Ring',
    icon: '💍',
    price: 99,
    priceDiamonds: 99,
    cost: 99,
    category: 'Event',
    animationType: 'BANNER',
    rarity: 'epic',
  },
  {
    id: 'gift_fireworks',
    _id: 'gift_fireworks',
    name: 'Grand Fireworks',
    icon: '🎆',
    price: 300,
    priceDiamonds: 300,
    cost: 300,
    category: 'Event',
    animationType: 'FULL_SCREEN',
    rarity: 'legendary',
  },

  // Surprise Category
  {
    id: 'gift_bouquet',
    _id: 'gift_bouquet',
    name: 'Flower Bouquet',
    icon: '💐',
    price: 88,
    priceDiamonds: 88,
    cost: 88,
    category: 'Surprise',
    animationType: 'FULL_SCREEN',
    rarity: 'epic',
  },
  {
    id: 'gift_rocket',
    _id: 'gift_rocket',
    name: 'Space Rocket',
    icon: '🚀',
    price: 2000,
    priceDiamonds: 2000,
    cost: 2000,
    category: 'Surprise',
    animationType: 'FULL_SCREEN',
    rarity: 'legendary',
  },

  // Custom Category
  {
    id: 'gift_castle',
    _id: 'gift_castle',
    name: 'Dream Castle',
    icon: '🏰',
    price: 50000,
    priceDiamonds: 50000,
    cost: 50000,
    category: 'Custom',
    animationType: 'FULL_SCREEN',
    rarity: 'mythic',
  },

  // SVIP Category
  {
    id: 'gift_yacht',
    _id: 'gift_yacht',
    name: 'Mega Yacht',
    icon: '🛥️',
    price: 25000,
    priceDiamonds: 25000,
    cost: 25000,
    category: 'SVIP',
    animationType: 'FULL_SCREEN',
    rarity: 'mythic',
  },

  // Special Category
  {
    id: 'gift_dragon',
    _id: 'gift_dragon',
    name: 'Golden Dragon',
    icon: '🐉',
    price: 88888,
    priceDiamonds: 88888,
    cost: 88888,
    category: 'Special',
    animationType: 'FULL_SCREEN',
    rarity: 'mythic',
    badge: 'MAX',
  },
];

export function useGift({
  roomId,
  callId,
  diamondBalance = 0,
  deductLocalBalance,
  onGiftSentSuccess,
}) {
  const { user } = useContext(AuthContext);

  const activeBalance = Number(diamondBalance || 0);

  const [categories, setCategories] = useState(DEFAULT_GIFT_CATEGORIES);
  const [activeCategory, setActiveCategory] = useState('Gifts');
  const [gifts, setGifts] = useState(DEFAULT_GIFTS);
  const [loadingGifts, setLoadingGifts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedGift, setSelectedGift] = useState(DEFAULT_GIFTS[0]);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedReceivers, setSelectedReceivers] = useState([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

  const [sending, setSending] = useState(false);
  const [confirmationPending, setConfirmationPending] = useState(false);

  // Combo tracking
  const [lastSentGift, setLastSentGift] = useState(null);
  const [comboCount, setComboCount] = useState(1);
  const comboCountRef = useRef(1);
  const comboTimerRef = useRef(null);
  const activeBalanceRef = useRef(activeBalance);
  activeBalanceRef.current = activeBalance;

  // Quick Send
  const [quickSendVisible, setQuickSendVisible] = useState(false);
  const quickSendTimerRef = useRef(null);

  // 1. Fetch Categories
  const fetchCategories = useCallback(async () => {
    try {
      const res = await apiUtil.get('/gifts/categories');
      const cats = res.data?.data || [];
      if (Array.isArray(cats) && cats.length > 0) {
        setCategories(cats);
        if (!activeCategory && cats[0]) {
          setActiveCategory(cats[0].name);
        }
      } else {
        setCategories(DEFAULT_GIFT_CATEGORIES);
      }
    } catch (err) {
      console.log('[useGift] Error fetching categories, using fallback:', err.message);
      setCategories(DEFAULT_GIFT_CATEGORIES);
    }
  }, [activeCategory]);

  // 2. Fetch Gifts
  const fetchGifts = useCallback(async () => {
    try {
      setLoadingGifts(true);
      const res = await apiUtil.get('/gifts');
      const items = res.data?.data || [];
      if (Array.isArray(items) && items.length > 0) {
        setGifts(items);
        if (!selectedGift) setSelectedGift(items[0]);
      } else {
        setGifts(DEFAULT_GIFTS);
        if (!selectedGift) setSelectedGift(DEFAULT_GIFTS[0]);
      }
    } catch (err) {
      console.log('[useGift] Error fetching gifts, using default fallback gifts:', err.message);
      setGifts(DEFAULT_GIFTS);
      if (!selectedGift) setSelectedGift(DEFAULT_GIFTS[0]);
    } finally {
      setLoadingGifts(false);
    }
  }, [selectedGift]);

  useEffect(() => {
    fetchCategories();
    fetchGifts();
  }, [fetchCategories, fetchGifts]);

  // Filtered Gifts by category & search query
  const filteredGifts = useMemo(() => {
    let result = gifts;

    if (activeCategory && activeCategory.toLowerCase() !== 'all') {
      result = result.filter((g) => {
        const catName = g.category || g.categoryId?.name || '';
        return catName.toLowerCase() === activeCategory.toLowerCase();
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((g) => g.name?.toLowerCase().includes(q));
    }

    return result.length > 0 ? result : gifts;
  }, [gifts, activeCategory, searchQuery]);

  // Calculation: Unit Price * Quantity * Number of Receivers
  const unitPrice = Number(
    selectedGift?.price !== undefined
      ? selectedGift.price
      : (selectedGift?.cost !== undefined ? selectedGift.cost : (selectedGift?.priceDiamonds || 0))
  );
  const receiverCount = Math.max(1, selectedReceivers.length);
  const totalDiamonds = unitPrice * selectedQuantity * receiverCount;
  const hasSufficientDiamonds = activeBalance >= totalDiamonds;

  // Combo Handler
  const registerCombo = useCallback((gift, receiver) => {
    if (comboTimerRef.current) clearTimeout(comboTimerRef.current);

    comboCountRef.current = (comboCountRef.current || 1) + 1;
    setComboCount(comboCountRef.current);
    setLastSentGift({ id: gift.id || gift._id, receiverId: receiver?.id, gift });

    // Combo expires after 3.5s of no gifts
    comboTimerRef.current = setTimeout(() => {
      comboCountRef.current = 1;
      setComboCount(1);
      setLastSentGift(null);
    }, 3500);
  }, []);

  // Quick Send Trigger
  const triggerQuickSend = useCallback((gift, qty, receiver) => {
    if (quickSendTimerRef.current) clearTimeout(quickSendTimerRef.current);
    setQuickSendVisible(true);

    quickSendTimerRef.current = setTimeout(() => {
      setQuickSendVisible(false);
    }, 5000);
  }, []);

  // Send Gift Request (Supports continuous non-blocking rapid-fire tap-tap)
  const executeSend = useCallback(
    async (overrideGift = null, overrideQty = null, overrideReceivers = null) => {
      const giftToSend = overrideGift || selectedGift;
      const qtyToSend = overrideQty || selectedQuantity;
      const receiversToSend = overrideReceivers || selectedReceivers;

      if (!giftToSend) return { success: false };

      const singlePrice = Number(
        giftToSend.price !== undefined
          ? giftToSend.price
          : (giftToSend.cost !== undefined ? giftToSend.cost : (giftToSend.priceDiamonds || 0))
      );
      const targetCount = Math.max(1, receiversToSend.length);
      const totalCost = singlePrice * qtyToSend * targetCount;

      const currentBalance = Number(activeBalanceRef.current ?? activeBalance);
      if (currentBalance < totalCost) {
        AlertService.show(
          'Insufficient Diamonds',
          `You need ${totalCost.toLocaleString()} 💎 Diamonds to send this gift. Your current balance is ${currentBalance.toLocaleString()} 💎.`,
          'warning'
        );
        return { success: false, reason: 'INSUFFICIENT_DIAMONDS' };
      }

      // Deduct balance locally immediately for snappy responsiveness
      deductLocalBalance && deductLocalBalance(totalCost);
      activeBalanceRef.current = Math.max(0, currentBalance - totalCost);

      const nextCombo = comboCountRef.current || 1;
      registerCombo(giftToSend, receiversToSend[0]);
      triggerQuickSend(giftToSend, qtyToSend, receiversToSend[0]);

      // Immediate visual gift animation and chat message on sender device
      onGiftSentSuccess && onGiftSentSuccess({
        gift: giftToSend,
        quantity: qtyToSend,
        receivers: receiversToSend,
        totalDiamonds: totalCost,
        comboCount: nextCombo,
      });

      // Immediate socket emit so all peers in room get the gift in real time
      try {
        const sock = getSocket();
        if (sock && (roomId || callId)) {
          sock.emit('voice_room:send_gift', {
            roomId: roomId || '',
            gift: {
              ...giftToSend,
              quantity: qtyToSend,
              comboCount: nextCombo,
              senderId: user?.userId || user?._id || 'you',
              senderName: user?.name || 'You',
              senderAvatar: user?.avatar || user?.image,
              receiverId: receiversToSend[0]?.userId || receiversToSend[0]?.id || receiversToSend[0]?._id,
              receiverName: receiversToSend[0]?.name || 'Host',
              receiverAvatar: receiversToSend[0]?.avatar || receiversToSend[0]?.image,
            },
          });
        }
      } catch (sockErr) {
        console.warn('[useGift] Socket emit warning:', sockErr);
      }

      // Background persistence API call (non-blocking)
      const requestId = `gift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      apiUtil.post('/gifts/send', {
        requestId,
        giftId: giftToSend._id || giftToSend.id,
        quantity: qtyToSend,
        comboCount: nextCombo,
        roomId: roomId || '',
        callId: callId || '',
        currency: 'DIAMONDS',
        diamonds: totalCost,
        receiverIds: receiversToSend.map((r) => r.id || r._id || r.userId).filter(Boolean),
        receiverId: receiversToSend[0]?.id || receiversToSend[0]?._id || receiversToSend[0]?.userId,
      }).then((res) => {
        if (res.data?.data?.senderBalance !== undefined && res.data.data.senderBalance !== null) {
          activeBalanceRef.current = Number(res.data.data.senderBalance);
        }
      }).catch((err) => {
        console.log('[useGift] background /gifts/send status:', err.response?.status || err.message);
      });

      return { success: true };
    },
    [
      selectedGift,
      selectedQuantity,
      selectedReceivers,
      activeBalance,
      roomId,
      callId,
      user,
      deductLocalBalance,
      registerCombo,
      triggerQuickSend,
      onGiftSentSuccess,
    ]
  );

  const handleInitiateSend = useCallback(() => {
    if (totalDiamonds >= CONFIRMATION_THRESHOLD_DIAMONDS) {
      setConfirmationPending(true);
    } else {
      executeSend();
    }
  }, [totalDiamonds, executeSend]);

  const confirmSend = useCallback(() => {
    setConfirmationPending(false);
    executeSend();
  }, [executeSend]);

  const cancelConfirmation = useCallback(() => {
    setConfirmationPending(false);
  }, []);

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
    confirmSend,
    cancelConfirmation,
    executeSend,
    quickSendVisible,
    setQuickSendVisible,
    comboCount,
    lastSentGift,
  };
}
