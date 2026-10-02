import React, { useContext, useEffect, useState, useRef, useMemo } from 'react';
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
  Modal,
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
import { getUserAvatar } from '../../utils/avatarUtil';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset } from '../../utils/safeAreaUtils';

const { width } = Dimensions.get('window');
const SCREEN_WIDTH = width;

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

  const categories = ['All', 'Popular', 'Special', 'Luxury'];
  const comboQuantities = [1, 10, 99, 520];

  const fetchGifts = async () => {
    setLoadingGifts(true);
    try {
      const res = await apiUtil.get('/gift/all');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setGifts(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedGift(res.data.data[0]);
        }
      }
    } catch (err) {
      console.log('Error fetching gifts in ChatScreen:', err.message);
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
      const cat = gift.category || 'Popular';
      return cat.toLowerCase() === activeTab.toLowerCase();
    });
  };

  const receiverImage = getUserAvatar(otherUser);

  const formatLastSeen = lastMessageTime
    ? new Date(lastMessageTime).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
    : 'Just now';

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await apiUtil.get(`/chat/messages?conversationId=${conversationId}`);
        const msgs = res.data?.data?.messages || [];
        console.log('Fetched messages:', msgs);
        setMessages(msgs);
      } catch (err) {
        console.error('Error fetching messages:', err.message);
      }
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
      const targetUserId = otherUser?._id || otherUser?.id || otherUser?.userId;
      if (
        (String(gift.senderId) === String(user?._id || user?.id) && String(gift.receiverId) === String(targetUserId)) ||
        (String(gift.receiverId) === String(user?._id || user?.id) && String(gift.senderId) === String(targetUserId))
      ) {
        console.log('🎁 Live giftReceived event in ChatScreen:', gift);
        setActiveGift(gift);
        if (giftTimerRef.current) clearTimeout(giftTimerRef.current);
        giftTimerRef.current = setTimeout(() => setActiveGift(null), 3000);
      }
    };

    socket.on('giftReceived', handleGiftReceived);

    return () => {
      console.log('Cleaning up socket listeners');
      if (giftTimerRef.current) clearTimeout(giftTimerRef.current);
      socket.off('newMessageNotification');
      socket.off('messagesSeen');
      socket.off('giftReceived', handleGiftReceived);
      socket.emit('exitChat', { conversationId });
    };
  }, [conversationId, user, otherUser]);

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

    const cost = Number(giftItem.cost || 0) * qty;
    const userBalance = Number((user?.diamonds || 0) + (user?.coins || 0));
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
      // Send gift via /gift/send ONLY (independent from chat messages)
      const giftRes = await apiUtil.post('/gift/send', {
        giftId: giftItem._id,
        receiverId: targetUserId,
        receiver: targetUserId,
        recipientId: targetUserId,
        count: qty,
      });

      if (giftRes.data?.success) {
        if (fetchUserProfile) fetchUserProfile();
        setShowGiftModal(false);

        // Immediately trigger Gift Animation Popup on screen
        const payload = giftRes.data?.data || {};
        setActiveGift({
          name: giftItem.name,
          icon: giftItem.icon,
          animationUrl: giftItem.animationUrl,
          mediaType: giftItem.mediaType,
          count: qty,
          senderId: user?._id || user?.id,
          receiverId: targetUserId,
          ...payload,
        });
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
            const msgTime = new Date(msg.updatedAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

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
            <GiftMedia
              source={activeGift.animationUrl || activeGift.icon}
              mediaType={activeGift.mediaType || 'image'}
              style={{ width: 200, height: 200 }}
              resizeMode="contain"
              fallbackSource={require('../../assets/avtar.webp')}
            />
            <View style={styles.activeGiftTextBadge}>
              <Text style={styles.activeGiftText}>
                {String(activeGift.senderId) === String(user?._id || user?.id)
                  ? `You sent ${activeGift.count || 1}x ${activeGift.name}! 🎁`
                  : `${otherUser?.name || 'User'} sent ${activeGift.count || 1}x ${activeGift.name}! 🎁`}
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
            <TouchableOpacity style={styles.giftIconBtn} onPress={() => setShowGiftModal(true)}>
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

        <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
          <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setMenuVisible(false)}>
            <View style={[styles.chatMenu, { top: topSafeInset + 70 }]}>
              <TouchableOpacity style={styles.chatMenuItem} onPress={handleReportUser}>
                <Icon name="flag" size={20} color="#facc15" />
                <Text style={styles.chatMenuText}>Report user</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.chatMenuItem} onPress={() => { setMenuVisible(false); handleBlockUser(); }}>
                <Icon name="block" size={20} color="#ff3b30" />
                <Text style={styles.chatMenuText}>Block user</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Gift Selection Popup Modal */}
        <Modal
          visible={showGiftModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowGiftModal(false)}
        >
          <TouchableOpacity
            style={styles.giftModalOverlay}
            activeOpacity={1}
            onPress={() => setShowGiftModal(false)}
          >
            <View
              style={[styles.giftModalContainer, { paddingBottom: Math.max(16, (insets.bottom || 0) + 12) }]}
              onStartShouldSetResponder={() => true}
            >
              <View style={styles.giftModalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Icon name="card-giftcard" size={22} color="#fbbf24" style={{ marginRight: 6 }} />
                  <Text style={styles.giftModalTitle}>Send Gift to {otherUser?.name || 'User'}</Text>
                </View>
                <TouchableOpacity onPress={() => setShowGiftModal(false)}>
                  <Icon name="close" size={22} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Balance Bar - ONLY DIAMONDS + RECHARGE PLUS ICON */}
              <View style={styles.giftBalanceRow}>
                <View style={styles.giftBalancePill}>
                  <Image source={require('../../assets/icons/diamond.png')} style={{ width: 14, height: 14, marginRight: 4 }} resizeMode="contain" />
                  <Text style={styles.giftBalanceText}>{user?.diamonds || 0} Diamonds</Text>
                  <TouchableOpacity
                    style={styles.rechargePlusBtn}
                    onPress={() => { setShowGiftModal(false); navigation.navigate('Recharge'); }}
                  >
                    <Icon name="add-circle" size={18} color="#03dcfe" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Category Tabs */}
              <View style={styles.categoryTabsContainer}>
                {categories.map((cat) => {
                  const isActive = activeTab.toLowerCase() === cat.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.categoryTab, isActive && styles.activeCategoryTab]}
                      onPress={() => setActiveTab(cat)}
                    >
                      <Text style={[styles.categoryTabText, isActive && styles.activeCategoryTabText]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Gifts Grid (4 per row) */}
              <ScrollView contentContainerStyle={styles.giftsGridContainer} showsVerticalScrollIndicator={false}>
                {loadingGifts ? (
                  <ActivityIndicator size="large" color="#03dcfe" style={{ marginVertical: 20, width: '100%' }} />
                ) : getFilteredGifts().length === 0 ? (
                  <Text style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginVertical: 20, width: '100%' }}>
                    No gifts in this category
                  </Text>
                ) : (
                  getFilteredGifts().map(g => {
                    const isSelected = selectedGift?._id === g._id;
                    return (
                      <TouchableOpacity
                        key={g._id}
                        style={[styles.giftGridCard, isSelected && styles.selectedGiftCard]}
                        activeOpacity={0.8}
                        disabled={sendingGift}
                        onPress={() => setSelectedGift(g)}
                      >
                        <LinearGradient
                          colors={isSelected ? ['rgba(3, 220, 254, 0.35)', 'rgba(251, 191, 36, 0.2)'] : ['rgba(251, 191, 36, 0.12)', 'rgba(3, 220, 254, 0.05)']}
                          style={styles.giftGridCardGradient}
                        >
                          <GiftMedia
                            source={g.icon}
                            mediaType={g.mediaType}
                            style={styles.giftIconMedia}
                            resizeMode="contain"
                            fallbackSource={require('../../assets/avtar.webp')}
                          />
                          <Text style={styles.giftCardName} numberOfLines={1}>{g.name}</Text>
                          <View style={styles.giftCostTag}>
                            <Image source={require('../../assets/icons/diamond.png')} style={{ width: 10, height: 10, marginRight: 2 }} resizeMode="contain" />
                            <Text style={styles.giftCostTagText}>{g.cost}</Text>
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>

              {/* Combo Quantity Selector & Send Button Bar */}
              {selectedGift && (
                <View style={styles.giftFooterBar}>
                  <View style={styles.comboPillsContainer}>
                    {comboQuantities.map((q) => {
                      const isSelected = selectedQuantity === q;
                      return (
                        <TouchableOpacity
                          key={q}
                          style={[styles.comboPill, isSelected && styles.activeComboPill]}
                          onPress={() => setSelectedQuantity(q)}
                        >
                          <Text style={[styles.comboPillText, isSelected && styles.activeComboPillText]}>
                            x{q}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <TouchableOpacity
                    style={styles.sendGiftActionBtn}
                    onPress={() => handleSendGiftChat(selectedGift, selectedQuantity)}
                    disabled={sendingGift}
                  >
                    <LinearGradient
                      colors={['#2911fe', '#03dcfe']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.sendGiftGradient}
                    >
                      <Text style={styles.sendGiftBtnText}>
                        Send ({selectedGift.cost * selectedQuantity} 💎)
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {sendingGift && (
                <View style={styles.sendingGiftOverlay}>
                  <ActivityIndicator size="large" color="#03dcfe" />
                  <Text style={{ color: '#fff', marginTop: 8, fontWeight: 'bold' }}>Sending Gift...</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </Modal>
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
