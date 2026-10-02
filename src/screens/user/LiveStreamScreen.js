import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  StyleSheet,
  Dimensions,
  StatusBar,
  Animated,
  Modal,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { AuthContext } from '../../context/AuthProvider';
import { getUserAvatar } from '../../utils/avatarUtil';
import { AlertService } from '../../utils/AlertService';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';
import { apiUtil } from '../../utils/apiUtil';
import {
  GiftButton,
  GiftPanel,
  GiftAnimationEngine,
  GiftQuickSend,
  GiftCombo,
  GiftRoomNotification,
  useGift,
  useGiftQueue,
  useGiftSocket,
  useGiftBalance,
} from '../../components/gift';

const { width, height } = Dimensions.get('window');

export default function LiveStreamScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 20);
  const { user } = useContext(AuthContext);

  const {
    isHost = false,
    host = {
      name: user?.name || 'Live Broadcaster',
      id: user?.userId || '10000001',
      avatar: 'https://api.yaroapp.in/uploads/avatars/female_default.webp',
    },
  } = route.params || {};

  const [likeCount, setLikeCount] = useState(124);
  const [viewerCount, setViewerCount] = useState(48);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([
    { id: 'm1', user: 'System', text: 'Welcome to Yaro Live! Keep the chat friendly & respectful. ❤️', isSystem: true },
    { id: 'm2', user: 'Aanya', text: 'Hello everyone! ✨' },
    { id: 'm3', user: 'Kabir', text: 'Amazing stream today! 🔥' },
  ]);
  const [giftModalVisible, setGiftModalVisible] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (isHost) {
      import('../../utils/permissions').then(({ requestCameraAndAudioPermissions }) => {
        requestCameraAndAudioPermissions().then((result) => {
          if (!result?.allGranted) {
            AlertService.show(
              'Permissions Needed',
              'Camera and microphone permissions are required to broadcast live.',
              'warning'
            );
          }
        }).catch(() => {});
      });
    }
  }, [isHost]);

  // Floating heart burst on double tap / like
  const handleLikePress = () => {
    setLikeCount((prev) => prev + 1);
    const id = Date.now() + Math.random();
    const startX = width - 70 + (Math.random() * 20 - 10);
    setFloatingHearts((prev) => [...prev, { id, x: startX }]);

    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== id));
    }, 1800);
  };

  const handleSendMessage = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    const newMsg = {
      id: 'm-' + Date.now(),
      user: user?.name || 'You',
      text: trimmed,
    };
    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
  };

  const liveRoom = {
    id: host?.id || host?.userId || 'live_stream',
    roomId: host?.id || host?.userId || 'live_stream',
    title: host?.name ? `${host.name}'s Live` : 'Live Stream',
    ownerId: host?.id || host?.userId,
    hostUser: {
      userId: host?.id || host?.userId,
      name: host?.name || 'Broadcaster',
      avatar: host?.avatar || 'https://api.yaroapp.in/uploads/avatars/female_default.webp',
    },
  };

  const liveSeats = [
    {
      seatIndex: 0,
      isHost: true,
      user: {
        userId: host?.id || host?.userId,
        name: host?.name || 'Broadcaster',
        avatar: host?.avatar || 'https://api.yaroapp.in/uploads/avatars/female_default.webp',
      },
    },
  ];

  const { diamondBalance, deductLocalBalance } = useGiftBalance();
  const { activeAnimation, enqueue: enqueueGiftAnimation } = useGiftQueue();
  const [quickSendGift, setQuickSendGift] = useState(null);
  const [activeCombo, setActiveCombo] = useState(null);
  const [recentGiftNotification, setRecentGiftNotification] = useState(null);

  const giftHook = useGift({
    user,
    room: liveRoom,
    seats: liveSeats,
    diamondBalance,
    deductLocalBalance,
    onBalanceDeducted: deductLocalBalance,
    onGiftSentSuccess: (payload) => {
      setQuickSendGift(payload.gift);
      setActiveCombo({
        gift: payload.gift,
        comboCount: payload.comboCount || 1,
        senderName: user?.name || 'You',
      });
      enqueueGiftAnimation(payload);
    },
  });

  useGiftSocket({
    roomId: liveRoom.id,
    currentUserId: user?.id || user?.userId,
    onGiftReceived: (payload) => {
      setRecentGiftNotification(payload);
      enqueueGiftAnimation(payload);
      if (String(payload?.sender?.userId) === String(user?.userId)) {
        setActiveCombo({
          gift: payload.gift,
          comboCount: payload.comboCount || 1,
          senderName: payload.sender?.name,
        });
      }
    },
  });

  const handleEndStream = () => {
    Alert.alert(
      isHost ? 'End Live Stream' : 'Leave Live Stream',
      isHost ? 'Are you sure you want to end your live stream?' : 'Are you sure you want to leave this live stream?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isHost ? 'End Now' : 'Leave',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Stream Background Mock Broadcast */}
      <Image
        source={{ uri: host.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80' }}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      />
      <LinearGradient
        colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.85)']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Floating Hearts Animation Layer */}
      {floatingHearts.map((h) => (
        <Animated.View
          key={h.id}
          style={[styles.floatingHeart, { left: h.x }]}
        >
          <Text style={{ fontSize: 28 }}>💖</Text>
        </Animated.View>
      ))}

      {/* Top Stream Header */}
      <View style={[styles.topHeader, { paddingTop: topSafeInset + 6 }]}>
        {/* Host Info Card */}
        <View style={styles.hostCard}>
          <Image source={{ uri: host.avatar }} style={styles.hostAvatar} />
          <View style={styles.hostInfo}>
            <Text style={styles.hostName} numberOfLines={1}>{host.name}</Text>
            <Text style={styles.hostSub}>ID: {host.id || 'N/A'}</Text>
          </View>
          {!isHost && (
            <TouchableOpacity
              style={[styles.followBtn, isFollowing && styles.followBtnActive]}
              onPress={() => setIsFollowing(!isFollowing)}
            >
              <Text style={styles.followBtnText}>{isFollowing ? '✓' : '+ Follow'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Viewers & Close */}
        <View style={styles.topRightActions}>
          <View style={styles.viewerBadge}>
            <Icon name="eye" size={13} color="#FFFFFF" />
            <Text style={styles.viewerCountText}>{viewerCount}</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={handleEndStream}>
            <Icon name="close" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Chat Messages Feed */}
      <View style={styles.chatSection}>
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.chatBubble, item.isSystem && styles.systemBubble, item.isGift && styles.giftBubble]}>
              <Text style={styles.chatUser}>{item.user}: </Text>
              <Text style={styles.chatText}>{item.text}</Text>
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Bottom Bar: Message Input, Gifts, Like Button */}
      <View style={[styles.bottomBar, { paddingBottom: bottomPadding }]}>
        <View style={styles.inputBox}>
          <TextInput
            style={styles.chatInput}
            placeholder="Say something nice..."
            placeholderTextColor="#CBD5E1"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSendMessage}
          />
          <TouchableOpacity onPress={handleSendMessage} style={styles.sendIconBtn}>
            <Icon name="send" size={16} color="#7C3AED" />
          </TouchableOpacity>
        </View>

        {!isHost && (
          <GiftButton
            onPress={() => setGiftModalVisible(true)}
            size={42}
          />
        )}

        <TouchableOpacity style={styles.likeCircleBtn} onPress={handleLikePress}>
          <Icon name="heart" size={24} color="#EF4444" />
          <Text style={styles.likeBadgeCount}>{likeCount}</Text>
        </TouchableOpacity>
      </View>

      {/* ENTERPRISE GIFT PANEL */}
      <GiftPanel
        visible={giftModalVisible}
        onClose={() => setGiftModalVisible(false)}
        room={liveRoom}
        seats={liveSeats}
        diamondBalance={diamondBalance}
        onTopUp={() => navigation.navigate('Recharge')}
        giftHook={giftHook}
        bottomSafePadding={bottomPadding}
      />

      {/* GIFT ANIMATION ENGINE */}
      <GiftAnimationEngine
        activeAnimation={activeAnimation}
        seats={liveSeats}
      />

      {/* ROOM-WIDE GIFT NOTIFICATION STACK */}
      <GiftRoomNotification
        notification={recentGiftNotification}
        onDismiss={() => setRecentGiftNotification(null)}
      />

      {/* GIFT COMBO BADGE */}
      <GiftCombo combo={activeCombo} onExpire={() => setActiveCombo(null)} />

      {/* QUICK SEND PILL */}
      <GiftQuickSend
        gift={quickSendGift}
        onSendAgain={(qty) => giftHook.handleQuickSend(qty)}
        onDismiss={() => setQuickSendGift(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  hostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderRadius: 24,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  hostAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 8,
  },
  hostInfo: {
    marginRight: 10,
  },
  hostName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    maxWidth: 90,
  },
  hostSub: {
    fontSize: 10.5,
    color: '#94A3B8',
  },
  followBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: 14,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  followBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  followBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderRadius: 14,
    paddingVertical: 5,
    paddingHorizontal: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  viewerCountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatSection: {
    position: 'absolute',
    bottom: 85,
    left: 16,
    width: width * 0.72,
    maxHeight: 220,
  },
  chatBubble: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  systemBubble: {
    backgroundColor: 'rgba(124, 58, 237, 0.75)',
  },
  giftBubble: {
    backgroundColor: 'rgba(245, 158, 11, 0.85)',
  },
  chatUser: {
    color: '#FBBF24',
    fontSize: 12.5,
    fontWeight: '700',
  },
  chatText: {
    color: '#FFFFFF',
    fontSize: 12.5,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 10,
  },
  inputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 22,
    paddingHorizontal: 14,
    height: 42,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  chatInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    paddingVertical: 0,
  },
  sendIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  likeCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  likeBadgeCount: {
    position: 'absolute',
    top: -5,
    right: -4,
    backgroundColor: '#EF4444',
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    paddingHorizontal: 4,
    borderRadius: 6,
  },
  floatingHeart: {
    position: 'absolute',
    bottom: 110,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  giftSheet: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    paddingBottom: 30,
  },
  giftSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  giftSheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  diamondBalanceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 4,
  },
  diamondBalanceText: {
    color: '#06B6D4',
    fontSize: 12.5,
    fontWeight: '700',
  },
  giftsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  giftCard: {
    width: (width - 56) / 3,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  giftCardName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  giftCostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  giftCostText: {
    color: '#06B6D4',
    fontSize: 11.5,
    fontWeight: '700',
  },
});
