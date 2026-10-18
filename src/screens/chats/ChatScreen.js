import React, { useContext, useEffect, useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  View as ScreenBackgroundView,
  StatusBar as ScreenBackgroundStatusBar,
  StyleSheet as ScreenBackgroundStyleSheet
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { apiUtil } from '../../utils/apiUtil';
import { AuthContext } from '../../context/AuthProvider';
import { getSocket } from '../../sockets';
import { AlertService } from '../../utils/AlertService';
import GiftMedia from '../../components/GiftMedia';
import { resolveGiftVisual } from '../../components/gift/giftMediaUtils';
import { getUserAvatar } from '../../utils/avatarUtil';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset } from '../../utils/safeAreaUtils';
import ChatGiftModal from '../../components/chat/ChatGiftModal';
import ChatSafetyMenu from '../../components/chat/ChatSafetyMenu';

const { width } = Dimensions.get('window');
const SCREEN_WIDTH = width;
const getEntityIds = (entity) => {
  if (entity == null) return [];
  if (typeof entity !== 'object') return [String(entity)];
  return [entity._id, entity.id, entity.userId].filter(Boolean).map(String);
};

const getMessageKey = (message) => message?.transactionId
  ? `gift:${message.transactionId}`
  : String(message?._id || message?.id || '');

const Massage = ({ route }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const { user, fetchUserProfile } = useContext(AuthContext);
  const scrollViewRef = React.useRef();

  const { conversationId, otherUser = {}, lastMessageTime } = route.params || {};

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [calling, setCalling] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [sendingGift, setSendingGift] = useState(false);
  const [gifts, setGifts] = useState([]);
  const [loadingGifts, setLoadingGifts] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const [selectedGift, setSelectedGift] = useState(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [activeGift, setActiveGift] = useState(null);
  const [inputBarHeight, setInputBarHeight] = useState(76);
  const giftTimerRef = useRef(null);
  const activeGiftVisual = resolveGiftVisual(activeGift?.gift || activeGift || {});

  const categories = useMemo(() => {
    const catalogCategories = gifts
      .map((gift) => typeof gift.category === 'string' ? gift.category.trim() : gift.category?.name?.trim())
      .filter(Boolean);
    return ['All', ...Array.from(new Set(catalogCategories))];
  }, [gifts]);
  const comboQuantities = [1, 10, 99, 520];

  const fetchGifts = async () => {
    setLoadingGifts(true);
    try {
      const res = await apiUtil.get('/gifts');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setGifts(res.data.data);
      } else {
        setGifts([]);
      }
    } catch (err) {
      console.log('Error fetching gifts in ChatScreen:', err.message);
      setGifts([]);
    } finally {
      setLoadingGifts(false);
    }
  };

  useEffect(() => {
    fetchGifts();
  }, []);

  const getFilteredGifts = () => {
    if (!activeTab || activeTab.toLowerCase() === 'all') return gifts;
    return gifts.filter((gift) => {
      const cat = typeof gift.category === 'string' ? gift.category : gift.category?.name || '';
      return cat.toLowerCase() === activeTab.toLowerCase();
    });
  };

  const receiverImage = getUserAvatar(otherUser);

  const appendGiftMessage = useCallback((giftPayload, fallbackGift = null) => {
    const transactionId = giftPayload?.transactionId || giftPayload?.id;
    if (!transactionId) return;
    const giftDetails = giftPayload?.gift || fallbackGift || giftPayload;
    const sender = giftPayload?.sender || {};
    const senderId = sender.id || sender._id || sender.userId || giftPayload?.senderId || '';
    const message = {
      _id: `gift-${transactionId}`,
      transactionId: String(transactionId),
      type: 'gift',
      sender: String(senderId),
      senderName: sender.name || (String(senderId) === String(user?._id || user?.id || user?.userId) ? user?.name : otherUser?.name),
      gift: giftDetails,
      giftName: giftDetails?.name || 'Gift',
      quantity: Number(giftPayload?.quantity || giftPayload?.count || 1),
      updatedAt: giftPayload?.createdAt || giftPayload?.sentAt || new Date().toISOString(),
    };
    setMessages((previous) => {
      if (previous.some((item) => String(item.transactionId || item._id) === String(transactionId))) return previous;
      return [...previous, message];
    });
  }, [otherUser?.name, user?._id, user?.id, user?.name, user?.userId]);

  const formatLastSeen = lastMessageTime
    ? new Date(lastMessageTime).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
    : 'Just now';

  useEffect(() => {
    const fetchMessages = async () => {
      const [messagesResult, sentGiftsResult, receivedGiftsResult] = await Promise.allSettled([
        apiUtil.get(`/chat/messages?conversationId=${conversationId}`),
        apiUtil.get('/gifts/sent', { params: { limit: 100 } }),
        apiUtil.get('/gifts/received', { params: { limit: 100 } }),
      ]);

      const messages = messagesResult.status === 'fulfilled'
        ? messagesResult.value.data?.data?.messages || []
        : [];
      if (messagesResult.status === 'rejected') {
        console.error('Error fetching messages:', messagesResult.reason?.message);
      }

      const sentTransactions = sentGiftsResult.status === 'fulfilled'
        ? sentGiftsResult.value.data?.data?.transactions || []
        : [];
      const receivedTransactions = receivedGiftsResult.status === 'fulfilled'
        ? receivedGiftsResult.value.data?.data?.transactions || []
        : [];
      const currentIds = new Set(getEntityIds(user));
      const otherIds = new Set(getEntityIds(otherUser));
      const giftMessages = [];

      const appendHistoryGift = (transaction, direction) => {
        if (!transaction || transaction.roomId || transaction.callId) return;
        const counterpart = direction === 'sent'
          ? transaction.receiverId || transaction.receiver
          : transaction.senderId || transaction.sender;
        const counterpartIds = getEntityIds(counterpart);
        const receiverIds = Array.isArray(transaction.receiverIds)
          ? transaction.receiverIds.flatMap(getEntityIds)
          : [];
        const matchesConversation = direction === 'sent'
          ? counterpartIds.some((id) => otherIds.has(id)) || receiverIds.some((id) => otherIds.has(id))
          : counterpartIds.some((id) => otherIds.has(id));
        if (!matchesConversation) return;

        const transactionId = transaction.transactionId || transaction._id || transaction.id;
        if (!transactionId) return;
        const sender = direction === 'sent' ? user : (transaction.senderId || transaction.sender || {});
        const receiver = direction === 'sent' ? counterpart : user;
        const senderIds = direction === 'sent' ? [...currentIds] : getEntityIds(sender);
        const gift = transaction.giftId || transaction.gift || {};
        giftMessages.push({
          _id: `gift-${transactionId}`,
          transactionId: String(transactionId),
          type: 'gift',
          sender: senderIds[0] || '',
          senderName: sender?.name || (direction === 'sent' ? user?.name : otherUser?.name),
          receiverId: getEntityIds(receiver)[0] || '',
          receiverName: receiver?.name || (direction === 'sent' ? otherUser?.name : user?.name),
          gift,
          giftName: gift.name || transaction.meta?.giftName || 'Gift',
          quantity: Number(transaction.quantity) || 1,
          createdAt: transaction.createdAt || transaction.updatedAt,
          updatedAt: transaction.createdAt || transaction.updatedAt,
        });
      };

      sentTransactions.forEach((transaction) => appendHistoryGift(transaction, 'sent'));
      receivedTransactions.forEach((transaction) => appendHistoryGift(transaction, 'received'));

      console.log('Fetched chat messages and conversation gift history:', messages.length, giftMessages.length);
      setMessages((previous) => {
        const merged = new Map();
        [...messages, ...giftMessages, ...previous].forEach((message) => {
          const key = getMessageKey(message);
          if (key) merged.set(key, message);
        });
        return [...merged.values()].sort((a, b) => {
          const aTime = new Date(a.updatedAt || a.createdAt || a.timestamp || 0).getTime();
          const bTime = new Date(b.updatedAt || b.createdAt || b.timestamp || 0).getTime();
          return aTime - bTime;
        });
      });
    };
    fetchMessages();

    const socket = getSocket();
    if (!socket) return;

    console.log('Socket connected:', socket.id);
    socket.emit('joinConversation', { conversationId });
    console.log('Joined conversation:', conversationId);

    // Mark all existing unread messages as seen when opening the chat
    socket.emit('markSeen', { conversationId });

    socket.on('newMessageNotification', ({ conversationId: convId, message: msgWrapper }) => {
      console.log('New message event received:', { convId, msgWrapper });
      if (convId === conversationId) {
        const newMsg = msgWrapper?.message || msgWrapper;
        if (newMsg) {
          console.log('Adding new message:', newMsg);
          setMessages(prev => [...prev, newMsg]);
          if (user?._id && newMsg.sender !== user._id) {
            console.log('Marking message as seen for:', convId);
            socket.emit('markSeen', { conversationId });
          }
        }
      }
    });

    socket.on('messagesSeen', ({ conversationId: seenConvId, id: seenById }) => {
      console.log('Messages seen event:', { seenConvId, seenById });
      if (seenConvId === conversationId && otherUser?._id && seenById === otherUser._id) {
        setMessages(prev =>
          prev.map(msg => ({ ...msg, status: 'seen' }))
        );
      }
    });

    const handleGiftReceived = (gift) => {
      if (!gift) return;
      const currentUserIds = [user?._id, user?.userId, user?.id].filter(Boolean).map(String);
      const otherUserIds = [otherUser?._id, otherUser?.userId, otherUser?.id].filter(Boolean).map(String);
      const sender = gift.sender || {};
      const receiver = gift.receiver || {};
      const senderIds = [gift.senderId, sender.id, sender._id, sender.userId].filter(Boolean).map(String);
      const receiverIds = [
        gift.receiverId,
        receiver.id,
        receiver._id,
        receiver.userId,
        ...(Array.isArray(gift.receivers) ? gift.receivers.flatMap((item) => [item.id, item._id, item.userId]) : []),
      ].filter(Boolean).map(String);
      const isThisConversation =
        (senderIds.some((id) => currentUserIds.includes(id)) && receiverIds.some((id) => otherUserIds.includes(id))) ||
        (senderIds.some((id) => otherUserIds.includes(id)) && receiverIds.some((id) => currentUserIds.includes(id)));
      if (!isThisConversation) return;

      const giftDetails = gift.gift || gift;
      setActiveGift({
        ...giftDetails,
        gift: giftDetails,
        count: gift.quantity || gift.count || 1,
        senderId: sender.id || sender.userId || gift.senderId,
        receiverId: receiver.id || receiver.userId || gift.receiverId,
      });
      appendGiftMessage(gift, giftDetails);
      if (giftTimerRef.current) clearTimeout(giftTimerRef.current);
      giftTimerRef.current = setTimeout(() => setActiveGift(null), 3000);
    };

    socket.on('giftReceived', handleGiftReceived);
    socket.on('gift:received', handleGiftReceived);

    return () => {
      console.log('Cleaning up socket listeners');
      if (giftTimerRef.current) clearTimeout(giftTimerRef.current);
      socket.off('newMessageNotification');
      socket.off('messagesSeen');
      socket.off('giftReceived', handleGiftReceived);
      socket.off('gift:received', handleGiftReceived);
      socket.emit('exitChat', { conversationId });
    };
  }, [appendGiftMessage, conversationId, user, otherUser]);

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSend = async () => {
    const messageContentToSend = inputText.trim();
    if (!messageContentToSend) return;

    if (messageContentToSend.length > 50) {
      AlertService.show('Limit Exceeded', '1 message me maximum 50 characters hi bhej sakte hain.', 'error');
      return;
    }

    const userBalance = Number((user?.diamonds || 0) + (user?.coins || 0));
    if (userBalance < 35) {
      AlertService.show(
        'Insufficient Diamonds',
        'Sending a message requires 35 Diamonds. Please recharge your wallet.',
        'error',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Recharge', onPress: () => navigation.navigate('Recharge') },
        ]
      );
      return;
    }

    const targetReceiverId = otherUser?._id || otherUser?.id || otherUser?.userId || route.params?.otherUser?._id || route.params?.otherUser?.id;
    if (!targetReceiverId) {
      AlertService.show('Error', 'Recipient not found', 'error');
      return;
    }

    const tempMessage = {
      _id: `temp-${Date.now()}`,
      sender: user._id || user.id,
      content: messageContentToSend,
      status: 'sending',
      updatedAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, tempMessage]);
    setInputText('');

    try {
      const res = await apiUtil.post('/chat/send', {
        receiverId: targetReceiverId,
        receiver: targetReceiverId,
        recipientId: targetReceiverId,
        content: messageContentToSend,
        conversationId,
      });

      const { message: msgWrapper } = res.data?.data || {};
      const sentMessage = msgWrapper?.message || msgWrapper || res.data?.data;

      console.log('Message sent response:', sentMessage);

      if (sentMessage) {
        setMessages(prev =>
          prev.map(msg => (msg._id === tempMessage._id ? { ...tempMessage, ...sentMessage, status: 'sent' } : msg))
        );
      } else {
        setMessages(prev =>
          prev.map(msg => (msg._id === tempMessage._id ? { ...msg, status: 'sent' } : msg))
        );
      }
      if (fetchUserProfile) fetchUserProfile();
    } catch (err) {
      console.error('Send message error:', err?.response?.data || err.message);
      const isViolation = err.response?.data?.code === 'CHAT_CONTENT_VIOLATION';
      if (isViolation) {
        setMessages(prev => prev.filter(msg => msg._id !== tempMessage._id));
        AlertService.show(
          'Message Not Allowed',
          'Sharing phone numbers, social media handles, messaging-app contact details, or external links is not allowed.',
          'error'
        );
      } else {
        setMessages(prev =>
          prev.map(msg =>
            msg._id === tempMessage._id ? { ...msg, status: 'failed' } : msg
          )
        );
        AlertService.show('Failed to send', err.response?.data?.message || 'Could not send message', 'error');
      }
    }
  };

  const handleGoBack = () => {
    const socket = getSocket();
    if (socket) {
      socket.emit('exitChat', { conversationId });
    }
    navigation.goBack();
  };

  const handleBlockUser = () => {
    AlertService.show(
      "Block User",
      `Are you sure you want to block ${otherUser?.name || 'this user'}?`,
      'info',
      [
        { text: "Cancel", style: "cancel" },
        { text: "Block", style: "destructive", onPress: confirmBlockUser }
      ]
    );
  };

  const confirmBlockUser = async () => {
    try {
      const targetId = otherUser?._id || otherUser?.userId;
      if (!targetId) {
        AlertService.show('Error', 'User ID not found', 'error');
        return;
      }
      const res = await apiUtil.post(`/user/block-contact/${targetId}`);
      if (res.data?.success) {
        AlertService.show('Success', 'User blocked successfully', 'success');
        handleGoBack();
      } else {
        AlertService.show('Error', res.data?.message || 'Failed to block user', 'error');
      }
    } catch (err) {
      console.error('Block user error:', err.message);
      AlertService.show('Error', 'Something went wrong', 'error');
    }
  };

  const handleReportUser = async () => {
    setMenuVisible(false);
    try {
      await apiUtil.post('/user/report', {
        reportedUserId: otherUser?._id || otherUser?.userId,
        reason: 'Inappropriate behaviour',
        description: `Reported from conversation ${conversationId}`,
        severity: 'medium',
      });
      AlertService.show('Reported', 'Our safety team will review this account.', 'success');
    } catch (error) {
      AlertService.show('Report failed', error.response?.data?.message || 'Please try again.', 'error');
    }
  };

  const handleSendGiftChat = async (giftItem = selectedGift, qty = selectedQuantity) => {
    if (!giftItem || sendingGift) return;
    const targetUserId = otherUser?._id || otherUser?.id || otherUser?.userId || route.params?.otherUser?._id || route.params?.otherUser?.id;
    if (!targetUserId) {
      AlertService.show('Error', 'User ID not found', 'error');
      return;
    }

    const cost = Number(giftItem.price ?? giftItem.cost ?? giftItem.priceDiamonds ?? 0) * qty;
    const userBalance = Number(user?.diamonds || 0);
    if (userBalance < cost) {
      AlertService.show(
        'Insufficient Diamonds',
        `You need ${cost} Diamonds to send ${qty}x ${giftItem.name}. Please recharge your wallet.`,
        'error',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Recharge', onPress: () => { setShowGiftModal(false); navigation.navigate('Recharge'); } },
        ]
      );
      return;
    }

    setSendingGift(true);
    try {
      const giftRes = await apiUtil.post('/gifts/send', {
        requestId: `gift_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
        giftId: giftItem._id,
        quantity: qty,
        comboCount: 1,
        currency: 'DIAMONDS',
        receiverIds: [targetUserId],
        receiverId: targetUserId,
      });

      if (giftRes.data?.success) {
        if (fetchUserProfile) fetchUserProfile();
        setShowGiftModal(false);

        const result = giftRes.data?.data?.data || giftRes.data?.data || {};
        const payload = result?.data || result;
        appendGiftMessage({
          ...payload,
          sender: payload.sender || { id: user?._id || user?.userId || user?.id, name: user?.name },
        }, payload.gift || giftItem);
        setActiveGift({
          ...giftItem,
          ...(payload.gift || {}),
          gift: payload.gift || giftItem,
          count: payload.quantity || qty,
          senderId: payload.sender?.id || payload.sender?.userId || user?._id || user?.id,
          receiverId: payload.receiver?.id || payload.receiver?.userId || targetUserId,
        });
        setSelectedGift(null);
        setSelectedQuantity(1);
        if (giftTimerRef.current) clearTimeout(giftTimerRef.current);
        giftTimerRef.current = setTimeout(() => {
          setActiveGift(null);
        }, 3000);
      } else {
        AlertService.show('Failed', giftRes.data?.message || 'Could not send gift', 'error');
      }
    } catch (err) {
      console.error('Send gift error:', err?.response?.data || err.message);
      AlertService.show('Gift failed', err.response?.data?.message || 'Could not send gift', 'error');
    } finally {
      setSendingGift(false);
    }
  };

  const showInsufficientDiamondsAlert = () => {
    AlertService.show(
      'Insufficient Diamonds',
      'Your Diamond balance is too low to start this call. Please recharge your Diamonds to continue.',
      'error',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Recharge Now', onPress: () => navigation.navigate('Recharge') },
      ]
    );
  };

  const startCall = async () => {
    if (calling) return;
    const targetHostId = otherUser?._id || otherUser?.userId;
    if (!targetHostId) {
      AlertService.show('Call unavailable', 'Invalid user information.', 'error');
      return;
    }
    const userDiamonds = Number(user?.diamonds !== undefined ? user.diamonds : (user?.coins || 0));
    console.log('[CALL] START REQUEST | DIAMONDS:', userDiamonds);

    if (userDiamonds < 1) {
      console.log('[CALL] INSUFFICIENT DIAMONDS | REJECTED ON FRONTEND');
      showInsufficientDiamondsAlert();
      return;
    }

    console.log('[CALL] BALANCE OK');
    try {
      setCalling(true);
      const response = await apiUtil.post('/call/start', { hostId: targetHostId });
      if (!response.data?.success || !response.data?.data) {
        const msg = response.data?.message || 'Failed to start call.';
        const errCode = response.data?.data?.code || response.data?.data?.errorCode;
        if (errCode === 'INSUFFICIENT_DIAMONDS' || msg.includes('INSUFFICIENT_DIAMONDS') || msg.toLowerCase().includes('diamond')) {
          showInsufficientDiamondsAlert();
        } else {
          AlertService.show('Call failed', msg, 'error');
        }
        return;
      }
      const data = response.data?.data;
      navigation.navigate('OutGoing', {
        ...data,
        name: otherUser?.name || 'Host',
        image: otherUser?.image,
        isCaller: true,
      });
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'This person is not available.';
      const errCode = error.response?.data?.data?.code || error.response?.data?.data?.errorCode;
      if (errCode === 'INSUFFICIENT_DIAMONDS' || msg.includes('INSUFFICIENT_DIAMONDS') || msg.toLowerCase().includes('diamond')) {
        showInsufficientDiamondsAlert();
      } else {
        AlertService.show('Call unavailable', msg, 'error');
      }
    } finally {
      setCalling(false);
    }
  };

  return (
    <ScreenBackgroundView style={[{ flex: 1, backgroundColor: '#F8FAFC' }, { paddingBottom: 0 }]}>
      <ScreenBackgroundStatusBar translucent backgroundColor="transparent" barStyle="dark-content" animated />
      <LinearGradient colors={['#F8FAFC', '#F1F5F9', '#E2E8F0']} style={ScreenBackgroundStyleSheet.absoluteFillObject} />
      {/* Decorative background overlays (matches chat space design) */}
      <View style={styles.starOverlay1} />
      <View style={styles.starOverlay2} />
      <View style={styles.planetWrapper}>
        <LinearGradient
          colors={['rgba(124, 77, 255, 0.12)', 'rgba(3, 220, 254, 0.25)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.planetGlow}
        />
      </View>
      <View style={styles.gridWrapper}>
        <View style={styles.gridLine1} />
        <View style={styles.gridLine2} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Modern Unified Header */}
        <View style={[styles.navBar, { marginTop: topSafeInset + 8 }]}>
          <TouchableOpacity
            style={styles.navBackButton}
            onPress={handleGoBack}
          >
            <Icon name="chevron-left" size={22} color="#1E293B" />
          </TouchableOpacity>
          
          <View style={styles.navUserInfo}>
            <View style={styles.navAvatarWrapper}>
              <Image source={receiverImage} style={styles.navAvatar} />
              {otherUser?.isOnline && <View style={styles.navOnlineDot} />}
            </View>
            <View style={styles.navTextWrapper}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.navUserName} numberOfLines={1}>
                  {otherUser?.name || 'User'}
                </Text>
                <Icon name="verified" size={13} color="#03dcfe" style={{ marginLeft: 4 }} />
              </View>
              <Text style={styles.navUserStatus}>
                {otherUser?.isOnline ? 'Online' : `Active at ${formatLastSeen}`}
              </Text>
            </View>
          </View>

          <TouchableOpacity onPress={startCall} disabled={calling} style={styles.navBlockButton}>
            {calling ? <ActivityIndicator size="small" color="#6C5CE7" /> : <Icon name="call" size={20} color="#6C5CE7" />}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.navBlockButton}>
            <Icon name="more-vert" size={22} color="#1E293B" />
          </TouchableOpacity>
        </View>

        {/* Message Thread */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[styles.chatThread, { paddingBottom: inputBarHeight + 16 }]}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Today Date Divider Pill */}
          <View style={styles.dateDividerPill}>
            <Text style={styles.dateDividerText}>Today</Text>
          </View>

          {messages.map((msg, index) => {
            if (!msg) return null;
            const isSent = msg.sender === user._id;
            const msgTime = msg.updatedAt ? new Date(msg.updatedAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }) : '';

            if (msg.type === 'gift') {
              const giftDetails = msg.gift || msg;
              const giftVisual = resolveGiftVisual(giftDetails);
              const sentByCurrentUser = String(msg.sender) === String(user?._id || user?.id || user?.userId);
              return (
                <View
                  key={msg._id || msg.transactionId || index}
                  style={[styles.messageRow, sentByCurrentUser ? styles.messageRowRight : styles.messageRowLeft]}
                >
                  <View style={styles.giftMessageBubble}>
                    {giftVisual.giftImage ? (
                      <Image source={{ uri: giftVisual.giftImage }} style={styles.giftMessageIcon} resizeMode="contain" />
                    ) : giftVisual.giftIcon ? (
                      <Text style={styles.giftMessageEmoji}>{giftVisual.giftIcon}</Text>
                    ) : (
                      <Icon name="card-giftcard" size={24} color="#F59E0B" />
                    )}
                    <Text style={styles.giftMessageText}>
                      {sentByCurrentUser ? 'You sent' : `${msg.senderName || otherUser?.name || 'User'} sent`} {msg.quantity || 1}x {msg.giftName || giftDetails.name || 'Gift'}
                    </Text>
                    {!!msgTime && <Text style={styles.giftMessageTime}>{msgTime}</Text>}
                  </View>
                </View>
              );
            }

            return (
              <View
                key={msg._id || index}
                style={[
                  styles.messageRow,
                  isSent ? styles.messageRowRight : styles.messageRowLeft
                ]}
              >
                <View style={isSent ? styles.bubbleWrapperRight : styles.bubbleWrapperLeft}>
                  {isSent ? (
                    <LinearGradient
                      colors={['#8B5CF6', '#6C5CE7']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.bubbleSent}
                    >
                      <Text style={[styles.messageText, { color: '#FFFFFF' }]}>{msg.content}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.bubbleReceived}>
                      <Text style={styles.messageText}>{msg.content}</Text>
                    </View>
                  )}

                  <View style={styles.bubbleMeta}>
                    <Text style={styles.metaTime}>{msgTime}</Text>
                    {isSent && (
                      <View style={{ marginLeft: 4 }}>
                        {msg.status === 'seen' ? (
                          <Icon name="done-all" size={14} color="#03dcfe" />
                        ) : ['sent', 'queued', 'delivered'].includes(msg.status) || !msg.status ? (
                          <Icon name={msg.status === 'delivered' ? 'done-all' : 'done'} size={14} color="rgba(255,255,255,0.55)" />
                        ) : msg.status === 'sending' ? (
                          <ActivityIndicator size={10} color="#03dcfe" />
                        ) : (
                          <Icon name="error-outline" size={14} color="#ff3b30" />
                        )}
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Animated Gift Popup Overlay on Chat Screen */}
        {activeGift && (
          <View style={styles.activeGiftOverlay} pointerEvents="none">
            {activeGift.animationUrl ? (
              <GiftMedia
                source={activeGift.animationUrl}
                mediaType={activeGift.mediaType}
                style={{ width: 200, height: 200 }}
                resizeMode="contain"
              />
            ) : activeGiftVisual.giftImage ? (
              <Image source={{ uri: activeGiftVisual.giftImage }} style={{ width: 200, height: 200 }} resizeMode="contain" />
            ) : activeGiftVisual.giftIcon ? (
              <Text style={{ fontSize: 110, textAlign: 'center' }}>{activeGiftVisual.giftIcon}</Text>
            ) : (
              <Icon name="card-giftcard" size={110} color="#FBBF24" />
            )}
            <View style={styles.activeGiftTextBadge}>
              <Text style={styles.activeGiftText}>
                {String(activeGift.senderId) === String(user?._id || user?.id)
                  ? `You sent ${activeGift.count || 1}x ${activeGift.name}!`
                  : `${otherUser?.name || 'User'} sent ${activeGift.count || 1}x ${activeGift.name}!`}
              </Text>
            </View>
          </View>
        )}

        {/* Bottom Input Area */}
        <View
          style={[styles.bottomBarContainer, { paddingBottom: Math.max(12, (insets.bottom || 0) + 8) }]}
          onLayout={({ nativeEvent }) => setInputBarHeight(nativeEvent.layout.height)}
        >
          <View style={styles.inputBoxWrapper}>
            <TouchableOpacity
              style={styles.giftIconBtn}
              onPress={() => {
                setSelectedGift(null);
                setSelectedQuantity(1);
                setActiveTab('All');
                setShowGiftModal(true);
              }}
            >
              <Icon name="card-giftcard" size={22} color="#fbbf24" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.cameraIconBtn}>
              <Icon name="photo-camera" size={20} color="#fff" />
            </TouchableOpacity>
            
            <TextInput
              placeholder="Type your message (max 50)..."
              placeholderTextColor="#94A3B8"
              style={styles.messageInput}
              value={inputText}
              onChangeText={setInputText}
              maxLength={50}
              multiline
            />
            {inputText.length > 0 && (
              <Text style={{ fontSize: 10, color: inputText.length >= 45 ? '#ff3b30' : '#8B5CF6', marginRight: 6, fontWeight: 'bold' }}>
                {inputText.length}/50
              </Text>
            )}

            <TouchableOpacity
              style={[
                styles.sendIconBtn,
                { opacity: inputText.trim() ? 1 : 0.6 }
              ]}
              onPress={handleSend}
              disabled={!inputText.trim()}
            >
              <LinearGradient
                colors={['#2911fe', '#03dcfe']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.sendGradient}
              >
                <Icon name="send" size={18} color="#ffffff" style={{ transform: [{ rotate: '-25deg' }] }} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <ChatSafetyMenu
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
          top={topSafeInset + 70}
          onReport={handleReportUser}
          onBlock={() => { setMenuVisible(false); handleBlockUser(); }}
          styles={styles}
        />

        <ChatGiftModal
          visible={showGiftModal}
          onClose={() => setShowGiftModal(false)}
          onRecharge={() => { setShowGiftModal(false); navigation.navigate('Recharge'); }}
          bottomInset={insets.bottom}
          user={user}
          otherUser={otherUser}
          categories={categories}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          loading={loadingGifts}
          gifts={getFilteredGifts()}
          selectedGift={selectedGift}
          onSelectGift={setSelectedGift}
          quantities={comboQuantities}
          selectedQuantity={selectedQuantity}
          onSelectQuantity={setSelectedQuantity}
          sending={sendingGift}
          onSend={() => handleSendGiftChat(selectedGift, selectedQuantity)}
          styles={styles}
        />
      </KeyboardAvoidingView>
    </ScreenBackgroundView>
  );
};

const styles = StyleSheet.create({
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  giftModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  giftModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    maxHeight: '60%',
    padding: 16,
    elevation: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  giftModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  giftModalTitle: { color: '#0F172A', fontSize: 16, fontWeight: 'bold' },
  giftBalanceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 12 },
  giftBalancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  giftBalanceText: { color: '#7C3AED', fontSize: 12, fontWeight: 'bold' },
  rechargePlusBtn: { marginLeft: 6, paddingHorizontal: 2 },
  categoryTabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryTab: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  activeCategoryTab: {
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  categoryTabText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: 'bold',
  },
  activeCategoryTabText: {
    color: '#8B5CF6',
  },
  giftsGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 6,
    paddingBottom: 16,
  },
  giftGridCard: {
    width: (SCREEN_WIDTH - 54) / 4,
    height: 90,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
  },
  selectedGiftCard: { borderColor: '#8B5CF6', backgroundColor: '#F5F3FF' },
  giftGridCardGradient: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 6 },
  giftIconMedia: { width: 38, height: 38, marginBottom: 4 },
  giftCardName: { color: '#0F172A', fontSize: 11, fontWeight: 'bold', marginBottom: 2 },
  activeGiftOverlay: {
    position: 'absolute',
    top: '30%',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    elevation: 25,
  },
  activeGiftTextBadge: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#8B5CF6',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 10,
    elevation: 8,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  activeGiftText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  giftCostTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  giftCostTagText: { color: '#D97706', fontSize: 10, fontWeight: 'bold' },
  giftFooterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  comboPillsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  comboPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
  },
  activeComboPill: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  comboPillText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: 'bold',
  },
  activeComboPillText: {
    color: '#B45309',
  },
  sendGiftActionBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  sendGiftGradient: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendGiftBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  giftIconBtn: { paddingHorizontal: 8, paddingVertical: 6, justifyContent: 'center', alignItems: 'center' },
  sendingGiftOverlay: {
    position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
  },
  chatMenu: {
    position: 'absolute', top: 70, right: 16, width: 190,
    paddingVertical: 8, borderRadius: 14, backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: '#E2E8F0', elevation: 12,
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8,
  },
  chatMenuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13 },
  chatMenuText: { color: '#0F172A', fontSize: 14, fontWeight: '600', marginLeft: 12 },
  // Decorative subtle space elements
  starOverlay1: { opacity: 0 },
  starOverlay2: { opacity: 0 },
  planetWrapper: { opacity: 0 },
  planetGlow: { opacity: 0 },
  gridWrapper: { opacity: 0 },
  gridLine1: { opacity: 0 },
  gridLine2: { opacity: 0 },

  // Modern Navbar Header
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    elevation: 3,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  navBackButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  navUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  navAvatarWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  navAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#8B5CF6',
  },
  navOnlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  navTextWrapper: {
    flex: 1,
  },
  navUserName: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
  },
  navUserStatus: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  navBlockButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Message Thread List
  chatThread: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  dateDividerPill: {
    alignSelf: 'center',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
    marginVertical: 12,
  },
  dateDividerText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 6,
    width: '100%',
  },
  messageRowLeft: {
    justifyContent: 'flex-start',
  },
  messageRowRight: {
    justifyContent: 'flex-end',
  },
  
  // Asymmetric Message bubbles (Tails)
  bubbleWrapperLeft: {
    alignItems: 'flex-start',
    maxWidth: SCREEN_WIDTH * 0.75,
  },
  bubbleWrapperRight: {
    alignItems: 'flex-end',
    maxWidth: SCREEN_WIDTH * 0.75,
  },
  bubbleSent: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 4,
    elevation: 2,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  bubbleReceived: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  giftMessageBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: SCREEN_WIDTH * 0.82,
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  giftMessageIcon: { width: 34, height: 34 },
  giftMessageEmoji: { fontSize: 26 },
  giftMessageText: { color: '#78350F', fontSize: 12, fontWeight: '700', flexShrink: 1 },
  giftMessageTime: { color: '#A16207', fontSize: 10, alignSelf: 'flex-end' },
  messageText: {
    color: '#0F172A',
    fontSize: 15,
    lineHeight: 20,
  },

  // Metadata timestamps / checkmarks
  bubbleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  metaTime: {
    fontSize: 10,
    color: '#94A3B8',
  },

  // Bottom Input Panel Styling
  bottomBarContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  inputBoxWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 4,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cameraIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    marginRight: 8,
  },
  messageInput: {
    flex: 1,
    color: '#0F172A',
    fontSize: 14,
    paddingHorizontal: 6,
    maxHeight: 100,
    paddingVertical: Platform.OS === 'android' ? 6 : 8,
  },
  sendIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    marginLeft: 8,
  },
  sendGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Massage;
