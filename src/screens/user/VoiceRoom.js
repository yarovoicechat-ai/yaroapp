
import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageBackground,
  Dimensions,
  FlatList,
  TextInput,
  Modal,
  Animated,
  StatusBar,
  Alert,
  ScrollView,
  BackHandler,
  Share,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AuthContext } from '../../context/AuthProvider';
import { useVoiceRoom } from '../../context/VoiceRoomContext';
import { AlertService } from '../../utils/AlertService';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';
import { apiUtil } from '../../utils/apiUtil';
import { requestCameraAndCapture, requestGalleryAndSelect } from '../../utils/verificationMedia';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RoomUserProfileModal from '../../components/room/RoomUserProfileModal';
import RoomDetailsModal from '../../components/room/RoomDetailsModal';
import RoomEntryEffectEngine from '../../components/room/RoomEntryEffectEngine';
import VipFloatingEntryEngine from '../../components/room/VipFloatingEntryEngine';
import ResponsiveChatBubble from '../../components/room/ResponsiveChatBubble';
import VipMicWave from '../../components/room/VipMicWave';
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
  receiverPositionRegistry,
} from '../../components/gift';
import RoomToolsModal from '../../components/room/RoomToolsModal';
import RoomExitModal from '../../components/room/RoomExitModal';
import RoomEmojiModal from '../../components/room/RoomEmojiModal';
import RoomWealthModal from '../../components/room/RoomWealthModal';
import RoomOnlineUsersModal from '../../components/room/RoomOnlineUsersModal';
import RoomMusicModal from '../../components/room/RoomMusicModal';
import SeatLayoutModal from '../../components/room/SeatLayoutModal';

const { width } = Dimensions.get('window');

const SAMPLE_GIFTS = [
  { id: 'g1', name: 'Soda water', icon: '🍹', cost: 100, isWeekly: true, days: '6d', category: 'Gift' },
  { id: 'g2', name: 'Travel time', icon: '🚌', cost: 3000, isWeekly: true, days: '6d', category: 'Gift' },
  { id: 'g3', name: 'Happy Bubbles', icon: '🤡', cost: 10000, isWeekly: true, days: '6d', category: 'Gift' },
  { id: 'g4', name: 'Joy Carnival', icon: '🎡', cost: 30000, isWeekly: true, days: '6d', category: 'Gift' },
  { id: 'g5', name: 'Awesome', icon: '👍', cost: 50, isWeekly: false, category: 'Gift' },
  { id: 'g6', name: 'Lipstick', icon: '💄', cost: 50, isWeekly: false, category: 'Gift' },
  { id: 'g7', name: 'Gold brick', icon: '🧈', cost: 50, isWeekly: false, category: 'Gift' },
  { id: 'g8', name: 'Lucky Bag', icon: '🧧', cost: 100, isWeekly: false, category: 'Gift' },
  { id: 'g9', name: 'Perfume', icon: '🧴', cost: 500, isWeekly: false, category: 'Gift' },
  { id: 'g10', name: 'Rose Bouquet', icon: '🌹', cost: 200, isWeekly: false, category: 'Gift' },
  { id: 'g11', name: 'Teddy Bear', icon: '🧸', cost: 1200, isWeekly: false, category: 'Gift' },
  { id: 'g12', name: 'Love Balloon', icon: '🎈', cost: 800, isWeekly: false, category: 'Gift' },
  { id: 'g13', name: 'Sports Car', icon: '🏎️', cost: 50000, isWeekly: true, days: '6d', category: 'Vip' },
  { id: 'g14', name: 'Diamond Ring', icon: '💍', cost: 20000, isWeekly: false, category: 'Vip' },
  { id: 'g15', name: 'Magic Castle', icon: '🏰', cost: 100000, isWeekly: true, days: '6d', category: 'Vip' },
  { id: 'g16', name: 'Super Yacht', icon: '🛥️', cost: 75000, isWeekly: false, category: 'Celebrity' },
  { id: 'g17', name: 'Royal Crown', icon: '👑', cost: 15000, isWeekly: false, category: 'Celebrity' },
  { id: 'g18', name: 'Champagne', icon: '🍾', cost: 2500, isWeekly: false, category: 'Lucky' },
];

const ROOM_THEMES = [
  { id: 'luxury', name: 'Dark Luxury', colors: ['#0F172A', '#1E1B4B', '#090D16'] },
  { id: 'cyberpunk', name: 'Cyberpunk Neon', colors: ['#1A0B2E', '#3B0764', '#0F172A'] },
  { id: 'sunset', name: 'Sunset Romance', colors: ['#4C0519', '#831843', '#0F172A'] },
  { id: 'emerald', name: 'Deep Emerald', colors: ['#022C22', '#064E3B', '#0F172A'] },
];

function DanmakuItem({ bullet, onComplete }) {
  const animX = useRef(new Animated.Value(width + 10)).current;

  useEffect(() => {
    Animated.timing(animX, {
      toValue: -width - 250,
      duration: 6500,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        onComplete(bullet.id);
      }
    });
  }, []);

  const topPosition = 260 + (bullet.track || 0) * 50;

  return (
    <Animated.View
      style={[
        styles.flyingBulletCard,
        {
          top: topPosition,
          left: animX,
        },
      ]}
    >
      <LinearGradient
        colors={['#7C3AED', '#EC4899', '#F59E0B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.flyingBulletGradient}
      >
        <Image
          source={{ uri: bullet.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200' }}
          style={styles.flyingBulletAvatar}
        />
        <Text style={styles.flyingBulletUser}>{bullet.user}:</Text>
        <Text style={styles.flyingBulletText} numberOfLines={1}>{bullet.text}</Text>
        <Text style={{ fontSize: 13, marginLeft: 4 }}>🚀</Text>
      </LinearGradient>
    </Animated.View>
  );
}

export default function VoiceRoomScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomSafePadding = getStackScreenBottomPadding(insets.bottom);
  const { user } = useContext(AuthContext);

  const {
    activeRoom,
    isMuted,
    currentSeatIndex,
    isOwner: contextIsOwner,
    admins,
    bannedChatUsers,
    mutedUsers,
    seats,
    seatCount,
    setRoomSeatCount,
    onlineCount,
    onlineUsers,
    chatMessages,
    enterRoom,
    takeSeat,
    leaveSeat,
    minimizeRoom,
    leaveRoom,
    toggleMic,
    clearChat,
    toggleAdmin,
    toggleChatBan,
    toggleMuteUser,
    kickFromSeat,
    removeFromSeat,
    kickFromRoom,
    kickFromRoom24h,
    setChatMessages,
    updateRoomDetails,
    lockSeat,
    unlockSeat,
    toggleSeatLock,
    lockAllSeats,
    unlockAllSeats,
    broadcastChatMessage,
    broadcastGift,
    broadcastReaction,
    joinedNotification,
    activeEntryEffect,
    setActiveEntryEffect,
    activeVipEntry,
    setActiveVipEntry,
    agoraStatus,
    agoraErrorMessage,
    isMusicPlaying,
    currentTrack,
    musicVolume,
    micVolume,
    startMusicMixing,
    pauseMusicMixing,
    resumeMusicMixing,
    stopMusicMixing,
    setMusicVolume,
    setMicVolume,
  } = useVoiceRoom();

  const [activeJoinBanner, setActiveJoinBanner] = useState(null);
  const joinBannerAnim = useRef(new Animated.Value(-60)).current;
  const joinBannerOpacity = useRef(new Animated.Value(0)).current;

  // Modals for Tools, Music, Seat Layout
  const [toolsModalVisible, setToolsModalVisible] = useState(false);
  const [musicModalVisible, setMusicModalVisible] = useState(false);
  const [seatLayoutModalVisible, setSeatLayoutModalVisible] = useState(false);

  // Image 2 Announcement & Notice States
  const [roomAnnouncement, setRoomAnnouncement] = useState("Welcome to my room, let's chat together!");
  const [isEditingAnnouncement, setIsEditingAnnouncement] = useState(false);
  const [tempAnnouncement, setTempAnnouncement] = useState("Welcome to my room, let's chat together!");

  // Image 1 Top Flying Gift Announcement State
  const [flyingGiftBanner, setFlyingGiftBanner] = useState(null);
  const flyingGiftAnim = useRef(new Animated.Value(-60)).current;
  const flyingGiftOpacity = useRef(new Animated.Value(0)).current;

  const triggerFlyingGiftBanner = (bannerData) => {
    setFlyingGiftBanner(bannerData);
    flyingGiftAnim.setValue(-40);
    flyingGiftOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(flyingGiftAnim, {
        toValue: 0,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(flyingGiftOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(flyingGiftAnim, {
          toValue: -40,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(flyingGiftOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => setFlyingGiftBanner(null));
    }, 3800);
  };

  useEffect(() => {
    if (joinedNotification?.name) {
      setActiveJoinBanner(joinedNotification);
      joinBannerAnim.setValue(-50);
      joinBannerOpacity.setValue(0);

      Animated.parallel([
        Animated.spring(joinBannerAnim, {
          toValue: 0,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(joinBannerOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(joinBannerAnim, {
            toValue: -50,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(joinBannerOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setActiveJoinBanner(null);
        });
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [joinedNotification]);

  const incomingRoomId = route.params?.roomId || route.params?.id || route.params?.room?.id;
  const isSelfHostFromDeepLink = Boolean(incomingRoomId && user?.userId && String(incomingRoomId) === String(user.userId));

  const room = activeRoom || route.params?.room || {
    id: incomingRoomId || ('room-' + Date.now()),
    roomId: incomingRoomId || ('room-' + Date.now()),
    title: isSelfHostFromDeepLink ? (user?.name ? `${user.name}'s Party Lounge 🎶` : 'Voice Party Lounge 🎶') : (incomingRoomId ? `Voice Room #${incomingRoomId}` : 'Voice Party Lounge 🎶'),
    hostName: isSelfHostFromDeepLink ? (user?.name || 'You') : (incomingRoomId ? `Host #${incomingRoomId}` : 'Voice Host'),
    coverImage: isSelfHostFromDeepLink ? (user?.avatar || user?.image) : 'https://api.yaroapp.in/uploads/avatars/female_default.webp',
    onlineCount: '1',
    flag: '🇮🇳',
    hostId: incomingRoomId,
    isSelfHost: isSelfHostFromDeepLink,
  };

  const hasLeftRef = useRef(false);

  const handleShareRoom = async () => {
    try {
      const shareRoomId = room.id || room.roomId || route.params?.roomId || user?.userId || '1000000001';
      const shareTitle = currentRoomTitle || room.title || 'Voice Party Lounge';
      const shareUrl = `https://yaroapp.in/room/${shareRoomId}`;
      await Share.share({
        title: `Join ${shareTitle} on Yaro App`,
        message: `🎙️ Join my Live Voice Party Room on Yaro App!\n🔥 Room: "${shareTitle}" (Room ID: ${shareRoomId})\n👇 Tap to join directly: ${shareUrl}`,
        url: shareUrl,
      });
    } catch (err) {
      console.log('Share room error:', err);
    }
  };

  // UGC Moderation: Report & Block in Voice Room
  const [ugcReportModalVisible, setUgcReportModalVisible] = useState(false);
  const [ugcReportTargetUser, setUgcReportTargetUser] = useState(null);
  const [ugcReportReason, setUgcReportReason] = useState('Inappropriate content');
  const [ugcReportDetails, setUgcReportDetails] = useState('');
  const [submittingUgcReport, setSubmittingUgcReport] = useState(false);

  const UGC_REPORT_REASONS = [
    'Inappropriate content',
    'Harassment or bullying',
    'Spam or scam',
    'Underage user',
    'Hate speech',
    'Other',
  ];

  const handleBlockUserFromRoom = (targetUser) => {
    const targetUserId = targetUser?._id || targetUser?.userId || targetUser?.id;
    if (!targetUserId) return;

    Alert.alert(
      'Block User',
      `Are you sure you want to block ${targetUser.name || 'this user'}? You will no longer interact with them.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await apiUtil.post(`/user/block-contact/${targetUserId}`);
              if (res.data?.success) {
                setProfileModalVisible(false);
                AlertService.show('Blocked', `${targetUser.name || 'User'} has been blocked.`, 'success');
              } else {
                AlertService.show('Error', res.data?.message || 'Failed to block user', 'error');
              }
            } catch (err) {
              AlertService.show('Error', err.response?.data?.message || 'Failed to block user', 'error');
            }
          },
        },
      ]
    );
  };

  const handleSendUgcReport = async () => {
    const targetUserId = ugcReportTargetUser?._id || ugcReportTargetUser?.userId || ugcReportTargetUser?.id;
    if (!targetUserId) return;

    try {
      setSubmittingUgcReport(true);
      const res = await apiUtil.post('/user/report', {
        reportedUserId: targetUserId,
        reason: ugcReportReason,
        description: ugcReportDetails || ugcReportReason,
        reportedType: 'user',
      });
      if (res.data?.success) {
        setUgcReportModalVisible(false);
        setUgcReportDetails('');
        AlertService.show('Report Submitted', 'Thank you for reporting. Our safety team will review this.', 'success');
      } else {
        AlertService.show('Error', res.data?.message || 'Failed to submit report', 'error');
      }
    } catch (err) {
      AlertService.show('Error', err.response?.data?.message || 'Failed to submit report', 'error');
    } finally {
      setSubmittingUgcReport(false);
    }
  };

  // Initialize or synchronize room in context
  useEffect(() => {
    if (!hasLeftRef.current) {
      if (route.params?.room) {
        const incoming = route.params.room;
        if (!activeRoom || activeRoom.id !== incoming.id) {
          const isSelf = Boolean(incoming.isSelfHost);
          enterRoom(incoming, isSelf, incoming.seatCount || 8, user);
        }
      } else if (route.params?.roomId || route.params?.id) {
        const incomingId = String(route.params.roomId || route.params.id);
        if (!activeRoom || String(activeRoom.id) !== incomingId) {
          const myId = String(user?.userId || user?._id || '');
          const isSelf = Boolean(myId && myId === incomingId);
          const deepLinkedRoom = {
            id: incomingId,
            roomId: incomingId,
            title: isSelf ? (user?.name ? `${user.name}'s Party Lounge 🎶` : 'Voice Party Lounge 🎶') : `Voice Room #${incomingId}`,
            hostName: isSelf ? (user?.name || 'You') : `Host #${incomingId}`,
            coverImage: isSelf ? (user?.avatar || user?.image) : 'https://api.yaroapp.in/uploads/avatars/female_default.webp',
            onlineCount: '1',
            flag: '🇮🇳',
            seatCount: 8,
            isSelfHost: isSelf,
            hostId: incomingId,
          };
          enterRoom(deepLinkedRoom, isSelf, 8, user);
        }
      }
    }
  }, [route.params?.room, route.params?.roomId, route.params?.id, activeRoom?.id]);

  // Android hardware back handler: trigger Keep vs Leave dialog
  useEffect(() => {
    const onBackPress = () => {
      setExitModalVisible(true);
      return true;
    };
    const backSub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backSub.remove();
  }, []);

  // Strict ownership check: prevent visitor from getting host/admin controls
  const currentUserId = user?.userId ? String(user.userId) : (user?._id ? String(user._id) : null);
  const roomHostId = (room?.hostId || room?.hostUserId || room?.creatorId)
    ? String(room.hostId || room.hostUserId || room.creatorId)
    : null;

  const isSelfHostParam = Boolean(route.params?.room?.isSelfHost || room?.isSelfHost);
  const isIdMatch = Boolean(currentUserId && roomHostId && currentUserId === roomHostId);
  const isContextOwnerMatch = Boolean(contextIsOwner && activeRoom?.id === room?.id && (activeRoom?.isSelfHost || isSelfHostParam || isIdMatch));

  const isRoomOwner = Boolean(isSelfHostParam || isIdMatch || isContextOwnerMatch);
  const isCurrentUserAdmin = Boolean(
    isRoomOwner || (currentUserId && Array.isArray(admins) && admins.map(String).includes(currentUserId))
  );

  // Balance & Chat
  const [coinsBalance, setCoinsBalance] = useState(user?.coins || 15400);
  const [inputText, setInputText] = useState('');
  const chatListRef = useRef(null);
  const textInputRef = useRef(null);

  // Seat Action Modal for Host/Admin
  const [selectedSeatForAction, setSelectedSeatForAction] = useState(null);
  const [seatActionModalVisible, setSeatActionModalVisible] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isChatBarExpanded, setIsChatBarExpanded] = useState(false);
  const isUserOnSeat = currentSeatIndex !== null && currentSeatIndex !== undefined && currentSeatIndex !== -1;

  // Bullet Message (Danmaku "udte udte jaye")
  const [isBulletMode, setIsBulletMode] = useState(false);
  const [bulletMessages, setBulletMessages] = useState([]);
  const bulletTrackRef = useRef(0);

  const triggerBulletMessage = (bulletData) => {
    const track = bulletTrackRef.current % 4;
    bulletTrackRef.current += 1;
    const newBullet = {
      ...bulletData,
      track,
    };
    setBulletMessages((prev) => [...prev, newBullet]);
  };

  const handleRemoveBullet = (bulletId) => {
    setBulletMessages((prev) => prev.filter((b) => b.id !== bulletId));
  };

  // Selected Theme
  const [currentTheme, setCurrentTheme] = useState(ROOM_THEMES[0]);

  // Floating reactions
  const [reactions, setReactions] = useState([]);

  // Modals
  // New Enterprise Gift Flow Hooks
  const { diamondBalance, setDiamondBalance, deductLocalBalance } = useGiftBalance();
  const { activeAnimation, setActiveAnimation, enqueue: enqueueGiftAnimation } = useGiftQueue();
  const [roomGiftNotifications, setRoomGiftNotifications] = useState([]);

  const currentRoomId = activeRoom?.id || activeRoom?.roomId || room?.id || room?.roomId || '';

  // Register Host and Seats screen positions for Flight Animation targeting
  useEffect(() => {
    // 1. Host Seat 0 (Top Left of Featured Pair)
    const hostLayout = { x: width * 0.5 - 61 - 24, y: topSafeInset + 115, width: 56, height: 56 };
    receiverPositionRegistry.register('host', hostLayout);
    if (room?.hostId) receiverPositionRegistry.register(room.hostId, hostLayout);
    if (room?.ownerId) receiverPositionRegistry.register(room.ownerId, hostLayout);
    if (room?.hostName) receiverPositionRegistry.register(room.hostName, hostLayout);

    // 2. Co-Host Seat 1 (Top Right of Featured Pair)
    const coHostLayout = { x: width * 0.5 + 61 - 24, y: topSafeInset + 115, width: 56, height: 56 };
    receiverPositionRegistry.register('cohost', coHostLayout);

    if (Array.isArray(seats)) {
      const cfg = getSeatConfig(seatCount);
      const bPerRow = cfg.seatsPerRow;
      const isCompact = cfg.isCompact;

      seats.forEach((seat, idx) => {
        if (!seat) return;
        let layout;
        if (seat.seatIndex === 0) {
          layout = hostLayout;
        } else if (seat.seatIndex === 1) {
          layout = coHostLayout;
        } else {
          const bottomIdx = seat.seatIndex - 2;
          const rowIdx = Math.floor(bottomIdx / bPerRow);
          const colIdx = bottomIdx % bPerRow;
          const colW = isCompact ? (width - 16) / 5 : (width - 24) / 4;
          const startX = isCompact ? 8 : 12;
          const seatX = startX + colIdx * colW + (colW - 50) / 2;
          const seatY = topSafeInset + 115 + 78 + rowIdx * 80;
          layout = { x: seatX, y: seatY, width: 50, height: 50 };
        }

        if (layout) {
          receiverPositionRegistry.register(`seat-${seat.seatIndex}`, layout);
          if (seat.user) {
            if (seat.user.userId) receiverPositionRegistry.register(seat.user.userId, layout);
            if (seat.user.id) receiverPositionRegistry.register(seat.user.id, layout);
            if (seat.user._id) receiverPositionRegistry.register(seat.user._id, layout);
            if (seat.user.name) receiverPositionRegistry.register(seat.user.name, layout);
          }
        }
      });
    }
  }, [room?.hostId, room?.ownerId, room?.hostName, seats, seatCount, topSafeInset]);

  const giftHook = useGift({
    roomId: currentRoomId,
    diamondBalance,
    deductLocalBalance,
    onGiftSentSuccess: (data) => {
      const giftName = data.gift?.name || 'Gift';
      const receiverNames = Array.isArray(data.receivers)
        ? data.receivers.map((r) => r.name).join(', ')
        : 'Host';
      setChatMessages((prev) => [
        ...prev,
        {
          id: 'gift-' + Date.now(),
          type: 'gift',
          user: user?.name || 'You',
          gift: `${data.gift?.icon || '🎁'} ${giftName} x${data.quantity || 1}`,
          to: receiverNames,
          timestamp: Date.now(),
        },
      ]);

      // Trigger visual gift animation locally for sender
      enqueueGiftAnimation({
        id: 'anim-' + Date.now(),
        gift: data.gift,
        sender: { id: user?.userId || 'you', name: user?.name || 'You', avatar: user?.avatar },
        receivers: data.receivers,
        quantity: data.quantity || 1,
        comboCount: data.comboCount || 1,
        animationType: data.gift?.animationType || 'PARTICLE',
      });
    },
  });

  useGiftSocket({
    roomId: currentRoomId,
    currentUserId: user?.userId || user?._id || user?.id,
    onGiftReceived: (payload) => {
      if (payload.sender && payload.gift) {
        const receiverText = Array.isArray(payload.receivers) && payload.receivers.length > 0
          ? payload.receivers.map((r) => r.name || 'Recipient').join(', ')
          : payload.receiver?.name || 'Everyone';
        const msgId = 'gift-sock-' + (payload.transactionId || Date.now());
        setChatMessages((prev) => {
          if (prev.some((m) => m.id === msgId || (payload.transactionId && m.transactionId === payload.transactionId))) {
            return prev;
          }
          return [
            ...prev,
            {
              id: msgId,
              transactionId: payload.transactionId,
              type: 'gift',
              user: payload.sender.name || 'User',
              gift: `${payload.gift.icon || '🎁'} ${payload.gift.name || 'Gift'} x${payload.quantity || 1}`,
              to: receiverText,
              timestamp: Date.now(),
            },
          ];
        });
      }
    },
    onGiftAnimation: (animPayload) => {
      enqueueGiftAnimation(animPayload);
    },
    onRoomNotification: (notif) => {
      setRoomGiftNotifications((prev) => [...prev, notif]);
    },
    onEntryEffect: (entryPayload) => {
      if (entryPayload && entryPayload.effect) {
        setActiveEntryEffect(entryPayload);
        const effectName = entryPayload.effect.name || 'Entry Effect';
        const userName = entryPayload.user?.name || 'User';
        setChatMessages((prev) => [
          ...prev,
          {
            id: 'entry-' + (entryPayload.entryId || Date.now()),
            type: 'system',
            text: `👑 ${userName} entered with ${effectName}!`,
            tagText: entryPayload.tagText,
            timestamp: Date.now(),
          },
        ]);
      }
    },
  });

  const [giftPanelVisible, setGiftPanelVisible] = useState(false);
  const giftModalVisible = giftPanelVisible;
  const setGiftModalVisible = setGiftPanelVisible;
  const [selectedGift, setSelectedGift] = useState(SAMPLE_GIFTS[0]);
  const [giftRecipient, setGiftRecipient] = useState(room.hostName || 'Host');
  const [giftBanner, setGiftBanner] = useState(null);

  const [exitModalVisible, setExitModalVisible] = useState(false);

  useEffect(() => {
    const onBackPress = () => {
      setExitModalVisible(true);
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, []);
  const [roomMenuModalVisible, setRoomMenuModalVisible] = useState(false);
  const [emojiModalVisible, setEmojiModalVisible] = useState(false);
  const [messageModalVisible, setMessageModalVisible] = useState(false);
  const [activeGiftTab, setActiveGiftTab] = useState('Gift');
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [selectedProfileUser, setSelectedProfileUser] = useState(null);
  const [selfSeatModalVisible, setSelfSeatModalVisible] = useState(false);
  const [wealthModalVisible, setWealthModalVisible] = useState(false);
  const [onlineUsersModalVisible, setOnlineUsersModalVisible] = useState(false);

  // Room Details and Settings Modals
  const [currentRoomTitle, setCurrentRoomTitle] = useState(room.title);
  const [currentRoomCover, setCurrentRoomCover] = useState(room.coverImage);
  const [currentRoomAbout, setCurrentRoomAbout] = useState(room.about || 'Welcome to our voice club! Jump on a seat, chat, send gifts & enjoy!');
  const [currentSeatCount, setCurrentSeatCount] = useState(room.seatCount || 8);
  const [currentRoomLocked, setCurrentRoomLocked] = useState(room.isLocked || false);
  const [currentRoomPin, setCurrentRoomPin] = useState(room.pin || '');

  const [roomDetailsModalVisible, setRoomDetailsModalVisible] = useState(false);
  const [roomSettingsModalVisible, setRoomSettingsModalVisible] = useState(false);

  // Edit settings form state
  const [editRoomName, setEditRoomName] = useState(room.title);
  const [editRoomCover, setEditRoomCover] = useState(room.coverImage);
  const [editRoomAbout, setEditRoomAbout] = useState(room.about || 'Welcome to our voice club! Jump on a seat, chat, send gifts & enjoy!');
  const [editSeatCount, setEditSeatCount] = useState(room.seatCount || 8);
  const [editRoomLocked, setEditRoomLocked] = useState(false);
  const [editRoomPin, setEditRoomPin] = useState('');

  const handleSaveRoomSettings = async () => {
    const trimmedTitle = editRoomName.trim();
    if (!trimmedTitle) {
      AlertService.show('Required', 'Please enter a valid room title', 'error');
      return;
    }

    if (editRoomLocked && (!editRoomPin || editRoomPin.length !== 4)) {
      AlertService.show('PIN Required', 'Please enter a 4-digit PIN for passcode lock', 'error');
      return;
    }

    setCurrentRoomTitle(trimmedTitle);
    setCurrentRoomCover(editRoomCover);
    setCurrentRoomAbout(editRoomAbout.trim());
    setCurrentSeatCount(editSeatCount);
    setCurrentRoomLocked(editRoomLocked);
    setCurrentRoomPin(editRoomPin);

    // Update in context
    updateRoomDetails({
      title: trimmedTitle,
      coverImage: editRoomCover,
      about: editRoomAbout.trim(),
      seatCount: editSeatCount,
      isLocked: editRoomLocked,
      pin: editRoomPin,
    });

    // Save to AsyncStorage for future Go Live
    try {
      const config = {
        title: trimmedTitle,
        coverImage: editRoomCover,
        about: editRoomAbout.trim(),
        seatCount: editSeatCount,
        category: room.category || 'Music 🎵',
        mode: editRoomLocked ? 'Private (PIN)' : 'Public',
      };
      await AsyncStorage.setItem('@yaro_my_room_config', JSON.stringify(config));
      // Persist to server database
      apiUtil.post('/voice-room/create-or-update', {
        title: trimmedTitle,
        coverImage: editRoomCover,
        about: editRoomAbout.trim(),
        seatCount: editSeatCount,
        mode: editRoomLocked ? 'Private (PIN)' : 'Public',
      }).catch((e) => console.log('Server room sync err:', e));
    } catch (e) {
      console.log('Error saving room config', e);
    }

    setRoomSettingsModalVisible(false);
    AlertService.show('Settings Saved', 'Room settings saved and applied successfully!', 'success');
  };

  // Pulse animation for host
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.14,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulseAnim]);

  // Handle seat clicks
  const handleSeatPress = (seat) => {
    if (seat.seatIndex === 0 && !seat.user && !(isContextOwnerMatch || isIdMatch)) {
      AlertService.show('Host seat', 'Only the room host can use this seat.', 'info');
      return;
    }
    if (seat.user) {
      const myIdList = [
        user?._id,
        user?.id,
        user?.userId,
        user?.user_id,
      ].filter(Boolean).map(String);

      const seatUserIdList = [
        seat.user.userId,
        seat.user.id,
        seat.user._id,
        seat.user.user_id,
      ].filter(Boolean).map(String);

      const isMatchingId = myIdList.some((id) => seatUserIdList.includes(id));
      const isMatchingName = Boolean(
        user?.name &&
        seat.user.name &&
        String(user.name).trim().toLowerCase() === String(seat.user.name).trim().toLowerCase()
      );
      const isCurrentUserSeat = Boolean(
        seat.user.isCurrentUser ||
        isMatchingId ||
        isMatchingName ||
        (seat.seatIndex === 0 && (isRoomOwner || isContextOwnerMatch))
      );

      if (isCurrentUserSeat) {
        // Current user clicked their own seat -> show own Profile modal with "Profile" & "Leave the seat"
        setSelectedProfileUser({
          ...seat.user,
          isCurrentUser: true,
          userId: user?.userId || user?._id || user?.id || seat.user.userId || seat.user.id || '10000001',
          name: user?.name || seat.user.name,
          avatar: user?.avatar || user?.image || seat.user.avatar,
          followersCount: user?.followersCount !== undefined ? user.followersCount : (seat.user.followersCount || 1),
          level: user?.level || seat.user.level || 4,
          charm: user?.charm || seat.user.charm || 0,
          gender: user?.gender || seat.user.gender || 'male',
          isOwner: isRoomOwner || isContextOwnerMatch || seat.seatIndex === 0,
          isAdmin: isCurrentUserAdmin && !isRoomOwner,
        });
        setProfileModalVisible(true);
      } else {
        // Clicked another user's seat -> show Profile modal
        setSelectedProfileUser(seat.user);
        setGiftRecipient(seat.user.name);
        setProfileModalVisible(true);
      }
    } else if (seat.isLocked) {
      if (isCurrentUserAdmin) {
        // Host / Admin clicked on a locked seat -> show unlock option
        setSelectedSeatForAction(seat);
        setSeatActionModalVisible(true);
      } else {
        AlertService.show('Seat Locked', `Seat #${seat.seatIndex + 1} has been locked by the host`, 'warning');
      }
    } else {
      if (isCurrentUserAdmin) {
        // Host / Admin clicked empty seat -> choice to Take Seat or Lock Seat
        setSelectedSeatForAction(seat);
        setSeatActionModalVisible(true);
      } else {
        // Empty seat -> Take seat
        takeSeat(seat.seatIndex, user);
      }
    }
  };

  // Handle chat message sending
  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    if (user?.userId && bannedChatUsers.includes(user.userId)) {
      AlertService.show('Muted from Chat', 'You are currently muted from chat in this room', 'error');
      return;
    }

    const trimmed = inputText.trim();

    if (isBulletMode) {
      triggerBulletMessage({
        id: 'bullet-' + Date.now(),
        text: trimmed,
        user: user?.name || 'You',
        avatar: user?.avatar || 'https://api.yaroapp.in/uploads/avatars/female_default.webp',
      });
    }

    const newMsg = {
      id: 'm-' + Date.now(),
      type: 'user',
      user: user?.name || 'You',
      userId: user?.userId || '10000055',
      text: trimmed,
      isBullet: isBulletMode,
    };

    setChatMessages(prev => [...prev, newMsg]);
    setInputText('');
    broadcastChatMessage(newMsg);

    setTimeout(() => {
      chatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // Handle mentioning user
  const handleMentionUser = (targetUser) => {
    setProfileModalVisible(false);
    const mentionText = `@${targetUser.name} `;
    setInputText(prev => `${prev ? prev + ' ' : ''}${mentionText}`);
    setTimeout(() => {
      textInputRef.current?.focus();
    }, 200);
  };

  // Handle reactions
  const handleSendReaction = (emoji) => {
    const id = 'react-' + Date.now() + Math.random();
    setReactions(prev => [...prev, { id, emoji }]);
    broadcastReaction(emoji, user?.name || 'Guest');
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== id));
    }, 2000);
  };

  // Play Sound Effect
  const handlePlaySoundEffect = (soundName, soundEmoji) => {
    handleSendReaction(soundEmoji);
    setChatMessages(prev => [
      ...prev,
      { id: 'sfx-' + Date.now(), type: 'system', text: `🔊 ${user?.name || 'Room'} played ${soundName} ${soundEmoji}!` },
    ]);
  };

  // Handle sending gift
  const handleSendGift = () => {
    if (!selectedGift) return;

    if (coinsBalance < selectedGift.cost) {
      AlertService.show('Insufficient Diamonds', `You need ${selectedGift.cost} diamonds for ${selectedGift.name}. Please recharge your wallet.`, 'error');
      return;
    }

    setCoinsBalance(prev => prev - selectedGift.cost);

    const bannerText = `🎁 ${user?.name || 'You'} sent ${selectedGift.icon || '💖'} ${selectedGift.name} to ${giftRecipient}!`;
    setGiftBanner(bannerText);

    // Image 1 Top Flying Gift Banner
    triggerFlyingGiftBanner({
      senderName: user?.name || 'You',
      senderAvatar: user?.avatar,
      giftName: selectedGift.name,
      giftIcon: selectedGift.icon || '💖',
      combo: 1,
    });

    const giftMsg = {
      id: 'g-' + Date.now(),
      type: 'gift',
      user: user?.name || 'You',
      avatar: user?.avatar || 'https://api.yaroapp.in/uploads/avatars/female_default.webp',
      gift: selectedGift.name,
      giftIcon: selectedGift.icon || '💖',
      giftImage: selectedGift.image,
      to: giftRecipient,
      count: 1,
      combo: 1,
      isSvip: true,
      svipLevel: 1,
    };
    setChatMessages(prev => [...prev, giftMsg]);

    broadcastGift({
      senderId: user?.userId,
      senderName: user?.name || 'You',
      senderAvatar: user?.avatar,
      giftId: selectedGift.id,
      giftName: selectedGift.name,
      giftIcon: selectedGift.icon || '💖',
      giftImage: selectedGift.image,
      receiverName: giftRecipient,
      combo: 1,
      count: 1,
    });

    setGiftModalVisible(false);

    setTimeout(() => {
      setGiftBanner(null);
    }, 3500);
  };

  // Handle exit choices (Keep vs Leave)
  const handleKeepFloating = () => {
    setExitModalVisible(false);
    minimizeRoom();
  };

  const handleLeaveCompletely = () => {
    hasLeftRef.current = true;
    setExitModalVisible(false);
    leaveRoom(user);
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MainTabs');
    }
  };

  // Dynamic Seat Layout according to seatCount (8, 10, 15)
  // Upar 2 seat, uske niche 8 seat (4+4) = 10 total!
  const getSeatConfig = (seatSetting) => {
    const val = Number(seatSetting) || 8;
    if (val === 15 || val === 17) {
      return { bottomCount: 15, totalCount: 17, seatsPerRow: 5, isCompact: true };
    }
    if (val === 10 || val === 12) {
      return { bottomCount: 10, totalCount: 12, seatsPerRow: 5, isCompact: true };
    }
    return { bottomCount: 8, totalCount: 10, seatsPerRow: 4, isCompact: false };
  };

  const seatConfig = getSeatConfig(seatCount);
  const targetTotalSeats = seatConfig.totalCount;
  const fullSeats = [...seats];
  while (fullSeats.length < targetTotalSeats) {
    fullSeats.push({
      seatIndex: fullSeats.length,
      isHost: fullSeats.length === 0,
      user: null,
      isMuted: true,
      isLocked: false,
      charm: 0,
    });
  }

  // Top 2 seats: Seat 0 (Host) & Seat 1 (Co-Host / CP)
  const topTwoSeats = fullSeats.slice(0, 2);

  // Bottom remaining seats: exactly bottomCount seats (8, 10, or 15)!
  const bottomRemainingSeats = fullSeats.slice(2, 2 + seatConfig.bottomCount);
  const isCompactLayout = seatConfig.isCompact;
  const bottomSeatsPerRow = seatConfig.seatsPerRow;
  const bottomSeatRows = [];
  for (let i = 0; i < bottomRemainingSeats.length; i += bottomSeatsPerRow) {
    bottomSeatRows.push(bottomRemainingSeats.slice(i, i + bottomSeatsPerRow));
  }

  return (
    <ImageBackground
      source={{ uri: currentRoomCover || room.coverImage || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1080' }}
      style={styles.screenContainer}
      resizeMode="cover"
    >
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Dark Ambient Overlay */}
      <LinearGradient
        colors={['rgba(8, 16, 26, 0.72)', 'rgba(6, 12, 22, 0.82)', 'rgba(4, 8, 16, 0.92)']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Top Header Bar (Matching Image 1 & 2) */}
      <View style={[styles.topHeaderBar, { paddingTop: topSafeInset + 4 }]}>
        {/* Left: Room Avatar & Info */}
        <TouchableOpacity
          style={styles.headerRoomInfoTouch}
          activeOpacity={0.8}
          onPress={() => setRoomDetailsModalVisible(true)}
        >
          <Image
            source={{ uri: currentRoomCover || room.coverImage || 'https://api.yaroapp.in/uploads/avatars/female_default.webp' }}
            style={styles.headerRoomAvatar}
          />
          <View style={styles.headerRoomTexts}>
            <Text style={styles.headerRoomTitle} numberOfLines={1}>
              {currentRoomTitle || room.title}
            </Text>
            <View style={styles.headerRoomSubRow}>
              <Text style={styles.headerRoomIdText}>ID:{room.id || room.roomId || '1000000002'}</Text>
              <Text style={styles.headerRoomMembersText}>👤 {onlineCount ?? 2}</Text>
              {agoraStatus === 'connected' ? (
                <View style={styles.voiceLiveBadge}>
                  <View style={styles.voiceGreenDot} />
                  <Text style={styles.voiceLiveText}>Live</Text>
                </View>
              ) : agoraStatus === 'connecting' ? (
                <View style={[styles.voiceLiveBadge, { backgroundColor: 'rgba(245, 158, 11, 0.25)' }]}>
                  <Text style={[styles.voiceLiveText, { color: '#FBBF24' }]}>Voice...</Text>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => AlertService.show('Voice Diagnostic', agoraErrorMessage || 'Agora Voice disconnected. Reconnecting...', 'info')}
                  style={[styles.voiceLiveBadge, { backgroundColor: 'rgba(239, 68, 68, 0.25)' }]}
                >
                  <Text style={[styles.voiceLiveText, { color: '#EF4444' }]}>Voice ⚠️</Text>
                </TouchableOpacity>
              )}
              <MaterialCommunityIcons name="chevron-right" size={13} color="rgba(255, 255, 255, 0.6)" />
            </View>
          </View>
        </TouchableOpacity>

        {/* Right Actions: Share, 3-dots Menu, Power Exit */}
        <View style={styles.headerRightActionIcons}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={handleShareRoom}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="share-variant-outline" size={19} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => setToolsModalVisible(true)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="dots-horizontal" size={21} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => setExitModalVisible(true)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="power" size={19} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sub-Header Row: Group Tag & Top 3 Contributors (Image 1 & 2) */}
      <View style={styles.subHeaderRow}>
        {/* Left: Group Badge */}
        <View style={styles.groupPillBadge}>
          <Text style={{ fontSize: 11, marginRight: 3 }}>💜</Text>
          <Text style={styles.groupPillText}>Group 1</Text>
        </View>

        {/* Right: Top 3 Contributors */}
        <TouchableOpacity
          style={styles.topContribRowTouch}
          onPress={() => setWealthModalVisible(true)}
          activeOpacity={0.8}
        >
          <View style={styles.topContribAvatarsRow}>
            <View style={[styles.contribAvatarWrap, { zIndex: 3 }]}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' }}
                style={styles.smallContribAvatar}
              />
              <View style={[styles.contribRankBadge, { backgroundColor: '#F59E0B' }]}>
                <Text style={styles.contribRankText}>1</Text>
              </View>
            </View>
            <View style={[styles.contribAvatarWrap, { marginLeft: -6, zIndex: 2 }]}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' }}
                style={styles.smallContribAvatar}
              />
              <View style={[styles.contribRankBadge, { backgroundColor: '#94A3B8' }]}>
                <Text style={styles.contribRankText}>2</Text>
              </View>
            </View>
            <View style={[styles.contribAvatarWrap, { marginLeft: -6, zIndex: 1 }]}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' }}
                style={styles.smallContribAvatar}
              />
              <View style={[styles.contribRankBadge, { backgroundColor: '#B45309' }]}>
                <Text style={styles.contribRankText}>3</Text>
              </View>
            </View>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={15} color="rgba(255, 255, 255, 0.7)" />
        </TouchableOpacity>
      </View>

      {/* Top Flying Gift Announcement Banner (Image 1 top left) */}
      {flyingGiftBanner && (
        <Animated.View
          style={[
            styles.flyingGiftBannerContainer,
            {
              transform: [{ translateY: flyingGiftAnim }],
              opacity: flyingGiftOpacity,
            },
          ]}
        >
          <LinearGradient
            colors={['#BE185D', '#9333EA', '#4F46E5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.flyingGiftGradient}
          >
            <Image
              source={{ uri: flyingGiftBanner.senderAvatar || 'https://api.yaroapp.in/uploads/avatars/female_default.webp' }}
              style={styles.flyingGiftAvatar}
            />
            <View style={styles.flyingGiftTextCol}>
              <Text style={styles.flyingGiftSender} numberOfLines={1}>
                {flyingGiftBanner.senderName}
              </Text>
              <Text style={styles.flyingGiftAction} numberOfLines={1}>
                Sent {flyingGiftBanner.giftName}
              </Text>
            </View>
            <Text style={styles.flyingGiftEmoji}>{flyingGiftBanner.giftIcon || '💖'}</Text>
            <Text style={styles.flyingGiftMultiplier}>
              x{flyingGiftBanner.combo || 1}
            </Text>
          </LinearGradient>
        </Animated.View>
      )}

      {/* Floating Animated Room Join Banner */}
      {activeJoinBanner && (
        <Animated.View
          style={[
            styles.roomJoinBanner,
            {
              transform: [{ translateY: joinBannerAnim }],
              opacity: joinBannerOpacity,
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(124, 58, 237, 0.95)', 'rgba(79, 70, 229, 0.95)', 'rgba(219, 39, 119, 0.95)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.roomJoinBannerGradient}
          >
            <Image
              source={{ uri: activeJoinBanner.avatar || room.coverImage || 'https://api.yaroapp.in/uploads/avatars/female_default.webp' }}
              style={styles.joinAvatar}
            />
            <View style={{ flex: 1, marginRight: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Text style={styles.joinUserName} numberOfLines={1}>{activeJoinBanner.name || 'User'}</Text>
                <View style={styles.joinLevelBadge}>
                  <Text style={styles.joinLevelText}>Lv.{activeJoinBanner.level || 1}</Text>
                </View>
              </View>
              <Text style={styles.joinSubText}>joined the voice room! 🎉</Text>
            </View>
            <Text style={{ fontSize: 18 }}>✨</Text>
          </LinearGradient>
        </Animated.View>
      )}

      {/* Gift Celebration Banner */}
      {giftBanner && (
        <LinearGradient
          colors={['#F59E0B', '#EF4444', '#EC4899']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.giftCelebrationBanner}
        >
          <Text style={styles.giftCelebrationText}>{giftBanner}</Text>
        </LinearGradient>
      )}

      {/* Voice Seats Grid: Top 2 Featured Seats (Host & Co-Host) + Responsive Bottom Grid */}
      <View style={styles.seatsAreaContainer}>
        {/* 1. TOP ROW: 2 FEATURED SEATS (Centered: Host 👑 & Co-Host 💖) */}
        <View style={styles.topTwoSeatsRow}>
          {topTwoSeats.map((seat) => {
            const isHostSeat = seat.seatIndex === 0;
            const isOccupied = Boolean(seat.user);
            return (
              <TouchableOpacity
                key={`top-seat-${seat.seatIndex}`}
                style={styles.topFeaturedSeatItem}
                onLayout={(e) => {
                  const layout = e.nativeEvent.layout;
                  if (seat.user) {
                    const uid = seat.user.id || seat.user._id || seat.user.userId;
                    if (uid) {
                      receiverPositionRegistry.register(uid, {
                        x: layout.x,
                        y: layout.y + 160,
                        width: layout.width,
                        height: layout.height,
                      });
                    }
                  }
                }}
                onPress={() => {
                  handleSeatPress(seat);
                }}
                activeOpacity={0.85}
              >
                {isOccupied ? (
                  <View style={styles.occupiedSeatWrapper}>
                    <VipMicWave
                      state={seat.isMuted ? 'MUTED' : (seat.isSpeaking ? 'SPEAKING' : 'IDLE')}
                      waveColors={isHostSeat ? ['#F59E0B', '#FBBF24'] : ['#EC4899', '#F472B6']}
                      intensity={1.1}
                      size={56}
                    >
                      <View style={[styles.topFeaturedAvatarBox, isHostSeat ? styles.hostGoldBorder : styles.cpPinkBorder]}>
                        <Image
                          source={{ uri: seat.user.avatar || 'https://api.yaroapp.in/uploads/avatars/female_default.webp' }}
                          style={styles.topFeaturedAvatarImg}
                        />
                        <View style={[styles.avatarCrestFrame, isHostSeat ? styles.hostCrest : styles.cpCrest]}>
                          <MaterialCommunityIcons
                            name={isHostSeat ? 'crown' : 'heart'}
                            size={11}
                            color={isHostSeat ? '#FBBF24' : '#F472B6'}
                          />
                        </View>
                        {seat.isMuted && (
                          <View style={styles.micMuteBadge}>
                            <Icon name="mic-off" size={7} color="#FFF" />
                          </View>
                        )}
                      </View>
                    </VipMicWave>
                    <Text style={styles.topSeatUserName} numberOfLines={1}>
                      {seat.user.name}
                    </Text>
                    <View style={styles.charmPill}>
                      <Text style={styles.charmFlower}>🌸</Text>
                      <Text style={styles.charmVal}>{seat.charm || 0}</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.emptySeatWrapper}>
                    <View style={[styles.topFeaturedEmptyCircle, isHostSeat ? styles.hostEmptyBorder : styles.cpEmptyBorder]}>
                      <MaterialCommunityIcons
                        name={isHostSeat ? 'crown-outline' : 'heart-outline'}
                        size={22}
                        color={isHostSeat ? '#F59E0B' : '#EC4899'}
                      />
                    </View>
                    <Text style={[styles.topSeatLabel, isHostSeat ? styles.hostLabelColor : styles.cpLabelColor]}>
                      {isHostSeat ? 'Host 👑' : 'Co-Host 💖'}
                    </Text>
                    <View style={styles.charmPill}>
                      <Text style={styles.charmFlower}>🌸</Text>
                      <Text style={styles.charmVal}>0</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 2. BOTTOM SEAT ROWS: 5 in a line for > 8 seats */}
        {bottomSeatRows.map((row, rowIdx) => (
          <View key={`bottom-row-${rowIdx}`} style={[styles.seatsRow, { marginTop: 10 }]}>
            {row.map((seat) => {
              const seatNum = `No.${seat.seatIndex + 1}`;
              const isOccupied = Boolean(seat.user);
              const seatWidth = isCompactLayout ? (width - 16) / 5 : (width - 24) / 4;
              const circleSize = isCompactLayout ? 42 : 50;
              const avatarSize = isCompactLayout ? 38 : 46;

              return (
                <TouchableOpacity
                  key={`seat-${seat.seatIndex}`}
                  style={[styles.seatItem, { width: seatWidth }]}
                  onLayout={(e) => {
                    const layout = e.nativeEvent.layout;
                    if (seat.user) {
                      const uid = seat.user.id || seat.user._id || seat.user.userId;
                      if (uid) {
                        receiverPositionRegistry.register(uid, {
                          x: layout.x,
                          y: layout.y + 220,
                          width: layout.width,
                          height: layout.height,
                        });
                      }
                    }
                  }}
                  onPress={() => {
                    handleSeatPress(seat);
                  }}
                  activeOpacity={0.85}
                >
                  {isOccupied ? (
                    <View style={styles.occupiedSeatWrapper}>
                      <VipMicWave
                        state={seat.isMuted ? 'MUTED' : (seat.isSpeaking ? 'SPEAKING' : 'IDLE')}
                        waveColors={['#38BDF8', '#0284C7']}
                        size={circleSize}
                      >
                        <View style={[styles.occupiedAvatarContainer, { width: circleSize, height: circleSize, borderRadius: circleSize / 2 }]}>
                          <Image
                            source={{ uri: seat.user.avatar || 'https://api.yaroapp.in/uploads/avatars/female_default.webp' }}
                            style={{ width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2, borderWidth: 1.2, borderColor: '#38BDF8' }}
                          />
                          {seat.isMuted && (
                            <View style={styles.micMuteBadge}>
                              <Icon name="mic-off" size={7} color="#FFF" />
                            </View>
                          )}
                        </View>
                      </VipMicWave>
                      <Text style={[styles.seatUserName, isCompactLayout && { fontSize: 8.5, maxWidth: 54 }]} numberOfLines={1}>
                        {seat.user.name}
                      </Text>
                      <View style={[styles.charmPill, isCompactLayout && { paddingHorizontal: 3, paddingVertical: 0 }]}>
                        <Text style={styles.charmFlower}>🌸</Text>
                        <Text style={[styles.charmVal, isCompactLayout && { fontSize: 8 }]}>{seat.charm || 0}</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.emptySeatWrapper}>
                      <View style={[styles.emptySeatCircle, { width: circleSize, height: circleSize, borderRadius: circleSize / 2 }]}>
                        <MaterialCommunityIcons name="sofa-outline" size={isCompactLayout ? 17 : 20} color="rgba(255, 255, 255, 0.55)" />
                      </View>
                      <Text style={[styles.seatNumText, isCompactLayout && { fontSize: 8.5 }]}>{seatNum}</Text>
                      <View style={[styles.charmPill, isCompactLayout && { paddingHorizontal: 3, paddingVertical: 0 }]}>
                        <Text style={styles.charmFlower}>🌸</Text>
                        <Text style={[styles.charmVal, isCompactLayout && { fontSize: 8 }]}>0</Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* PK Button (Image 1 & 2) */}
      <View style={styles.pkButtonContainer}>
        <TouchableOpacity
          style={styles.pkButton}
          activeOpacity={0.85}
          onPress={() => AlertService.show('PK Battle', 'Room PK Battle starting soon!', 'info')}
        >
          <LinearGradient
            colors={['#1E293B', '#0F172A']}
            style={styles.pkGradient}
          >
            <Text style={styles.pkText}>PK</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Notice & Announcement & Event Row (Image 2 Model) */}
      <View style={styles.noticeAnnouncementRow}>
        {/* Left Column: Upar Notice & Niche Announcement */}
        <View style={styles.noticeAnnouncementCol}>
          {/* 1. Upar Notice */}
          <View style={styles.noticeCard}>
            <Text style={styles.noticeText}>
              Please respect each other and chat in friendly manner. Abuse, sexual and violent contents are not allowed. All violators will be banned.
            </Text>
          </View>

          {/* 2. Niche Announcement */}
          <View style={styles.announcementCard}>
            <View style={styles.announcementHeader}>
              <Text style={styles.announcementLabel}>Announcement:</Text>
              <TouchableOpacity
                onPress={() => {
                  if (isRoomOwner || admins.includes(currentUserId)) {
                    setTempAnnouncement(roomAnnouncement);
                    setIsEditingAnnouncement(true);
                  } else {
                    AlertService.show('Room Announcement', roomAnnouncement, 'info');
                  }
                }}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="pencil-outline" size={14} color="#F59E0B" />
              </TouchableOpacity>
            </View>
            <Text style={styles.announcementBody} numberOfLines={2}>
              {roomAnnouncement}
            </Text>
          </View>
        </View>

        {/* Right Column: Weekly CP Side Event Card */}
        <TouchableOpacity
          style={styles.sideEventCard}
          activeOpacity={0.85}
          onPress={() => AlertService.show('Weekly CP', 'Weekly CP couples ranking event live now!', 'info')}
        >
          <LinearGradient
            colors={['#4C1D95', '#BE185D']}
            style={styles.sideEventGradient}
          >
            <MaterialCommunityIcons name="heart-multiple" size={18} color="#F472B6" />
            <Text style={styles.sideEventTitle}>Weekly</Text>
            <Text style={styles.sideEventSub}>CP</Text>
          </LinearGradient>
          {/* Carousel Indicator Dots */}
          <View style={styles.sideEventDots}>
            <View style={styles.eventDot} />
            <View style={styles.eventDot} />
            <View style={styles.eventDot} />
            <View style={[styles.eventDot, styles.eventDotActive]} />
          </View>
        </TouchableOpacity>
      </View>

      {/* 3. Come on mic and chat together~ Banner (Image 1 & 2) */}
      <TouchableOpacity
        style={styles.comeOnMicBanner}
        activeOpacity={0.85}
        onPress={() => {
          const emptySeat = seats.find((s) => !s.user && !s.isLocked);
          if (emptySeat) {
            handleSeatPress(emptySeat);
          } else {
            AlertService.show('Seats Full', 'All seats are currently occupied.', 'info');
          }
        }}
      >
        <LinearGradient
          colors={['#A855F7', '#C084FC']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.comeOnMicGradient}
        >
          <Text style={styles.comeOnMicText}>Come on mic and chat together~</Text>
          <View style={styles.comeOnMicIconWrapper}>
            <MaterialCommunityIcons name="microphone-variant" size={18} color="#FEF08A" />
            <Text style={{ fontSize: 13, marginLeft: 3 }}>🎁</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Floating Reaction Emojis Overlay */}
      <View style={styles.floatingReactionsContainer} pointerEvents="none">
        {reactions.map((r) => (
          <Text key={r.id} style={styles.floatingEmoji}>
            {r.emoji}
          </Text>
        ))}
      </View>

      {/* Live Chat Stream with Floating Right Widgets (Image 1 & 2 Model) */}
      <View style={styles.chatAreaContainer}>
        <FlatList
          ref={chatListRef}
          data={chatMessages}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          style={styles.chatFlatList}
          renderItem={({ item }) => {
            if (item.type === 'system') {
              return (
                <View style={styles.systemChatBubble}>
                  <Text style={styles.systemChatText}>{item.text}</Text>
                </View>
              );
            }
            return (
              <ResponsiveChatBubble
                message={item}
                sender={{ name: item.user, avatar: item.avatar }}
                isVip={Boolean(item.isVip || item.vipLevel)}
                isSvip={Boolean(item.isSvip || item.svipLevel)}
                bubbleConfig={item.bubbleConfig}
                onPressUser={(u) => {
                  setSelectedProfileUser(u);
                  setGiftRecipient(u.name);
                  setProfileModalVisible(true);
                }}
              />
            );
          }}
        />

        {/* Floating Widgets on Right Side (Lucky Fruit, Treasure, Quick Chat) */}
        <View style={styles.rightFloatingWidgetsCol} pointerEvents="box-none">
          {/* 1. Lucky Fruit / Slot Game */}
          <TouchableOpacity
            style={styles.luckyFruitWidget}
            onPress={() => AlertService.show('Lucky Fruit', 'Spin and win huge diamond jackpots!', 'info')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#EC4899', '#8B5CF6']}
              style={styles.luckyFruitBox}
            >
              <Text style={{ fontSize: 16 }}>🎰</Text>
              <Text style={styles.luckyFruitLabel}>LUCKY</Text>
            </LinearGradient>
            <View style={styles.luckyDotsRow}>
              <View style={styles.tinyDot} />
              <View style={styles.tinyDot} />
              <View style={styles.tinyDot} />
            </View>
          </TouchableOpacity>

          {/* 2. Treasure Chest / Rewards Bag */}
          <TouchableOpacity
            style={styles.treasureChestWidget}
            onPress={() => AlertService.show('Treasure Chest', 'Daily room treasure rewards!', 'info')}
            activeOpacity={0.85}
          >
            <Text style={{ fontSize: 22 }}>💰</Text>
            <View style={styles.treasureBar}>
              <View style={styles.treasureBarFill} />
            </View>
          </TouchableOpacity>

          {/* 3. Floating Quick Chat Trigger */}
          <TouchableOpacity
            style={styles.floatingChatBubbleBtn}
            onPress={() => setIsChatBarExpanded((prev) => !prev)}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="message-text" size={19} color="#22C55E" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Room Control Bar */}
      <View style={[styles.bottomControlBar, { paddingBottom: insets.bottom > 0 ? insets.bottom : 6 }]}>
        {!isUserOnSeat ? (
          <>
            {/* 1. Speaker button */}
            <TouchableOpacity
              style={styles.controlCircleBtn}
              onPress={() => {
                const next = !isSpeakerOn;
                setIsSpeakerOn(next);
                try {
                  InCallManager.setForceSpeakerphoneOn(next);
                  InCallManager.setSpeakerphoneOn(next);
                } catch (_) {}
              }}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name={isSpeakerOn ? 'volume-high' : 'volume-off'}
                size={22}
                color={isSpeakerOn ? '#FFF' : '#EF4444'}
              />
            </TouchableOpacity>

            {/* 2. Chat Input Pill: "Say hi..." */}
            <View style={styles.chatInputWrapper}>
              <TouchableOpacity
                style={[styles.bulletToggleBtn, isBulletMode && styles.bulletToggleBtnActive]}
                onPress={() => {
                  const next = !isBulletMode;
                  setIsBulletMode(next);
                  AlertService.show('Bullet Chat', next ? 'Bullet Mode ON 🚀' : 'Standard Chat Mode', next ? 'success' : 'info');
                }}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 16 }}>🚀</Text>
                {isBulletMode && <View style={styles.bulletActiveDot} />}
              </TouchableOpacity>

              <TextInput
                ref={textInputRef}
                style={styles.chatTextInput}
                placeholder={isBulletMode ? 'Bullet 🚀' : 'Say hi...'}
                placeholderTextColor="rgba(255, 255, 255, 0.55)"
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={handleSendMessage}
                returnKeyType="send"
              />
              {inputText.length > 0 && (
                <TouchableOpacity onPress={handleSendMessage} style={styles.sendMsgBtn}>
                  <Icon name="send" size={16} color="#7C3AED" />
                </TouchableOpacity>
              )}
            </View>

            {/* 3. Lucky Bag */}
            <TouchableOpacity
              style={styles.controlCircleBtn}
              onPress={() => AlertService.show('Lucky Bag', 'Lucky bag rewards opening soon!', 'info')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="bag-personal-outline" size={22} color="#FBBF24" />
            </TouchableOpacity>

            {/* 4. Luxury Gift Tray Trigger */}
            <GiftButton
              onPress={() => setGiftPanelVisible((prev) => !prev)}
              badgeText={giftHook.comboCount > 1 ? `x${giftHook.comboCount}` : null}
            />

            {/* 5. Gamepad Trigger */}
            <TouchableOpacity
              style={styles.controlCircleBtn}
              onPress={() => AlertService.show('Party Games', 'Spin the wheel and lucky party games opening soon!', 'info')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="gamepad-variant-outline" size={22} color="#38BDF8" />
            </TouchableOpacity>

            {/* 6. 4-Squares Room Tools Trigger */}
            <TouchableOpacity
              style={styles.controlCircleBtn}
              onPress={() => setRoomMenuModalVisible(true)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="view-grid-outline" size={22} color="#FFF" />
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* 1. Speaker button */}
            <TouchableOpacity
              style={styles.controlCircleBtn}
              onPress={() => {
                const next = !isSpeakerOn;
                setIsSpeakerOn(next);
                try {
                  InCallManager.setForceSpeakerphoneOn(next);
                  InCallManager.setSpeakerphoneOn(next);
                } catch (_) {}
              }}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name={isSpeakerOn ? 'volume-high' : 'volume-off'}
                size={22}
                color={isSpeakerOn ? '#FFF' : '#EF4444'}
              />
            </TouchableOpacity>

            {/* 2. Microphone button (Live or Muted) */}
            <TouchableOpacity
              style={[
                styles.controlCircleBtn,
                isMuted ? styles.controlCircleBtnMuted : styles.controlCircleBtnActive,
              ]}
              onPress={() => toggleMic()}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name={isMuted ? 'microphone-off' : 'microphone'}
                size={23}
                color={isMuted ? '#EF4444' : '#10B981'}
              />
            </TouchableOpacity>

            {/* 3. Chat bubble icon (opens floating chat input) */}
            <TouchableOpacity
              style={styles.controlCircleBtn}
              onPress={() => setIsChatBarExpanded((prev) => !prev)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="chat-processing-outline" size={22} color="#FFF" />
            </TouchableOpacity>

            {/* 4. Emoji Faces Sheet Trigger */}
            <TouchableOpacity
              style={styles.controlCircleBtn}
              onPress={() => setEmojiModalVisible(true)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="emoticon-happy-outline" size={23} color="#FFF" />
            </TouchableOpacity>

            {/* 5. Lucky Bag */}
            <TouchableOpacity
              style={styles.controlCircleBtn}
              onPress={() => AlertService.show('Lucky Bag', 'Lucky bag rewards opening soon!', 'info')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="bag-personal-outline" size={22} color="#FBBF24" />
            </TouchableOpacity>

            {/* 6. Luxury Gift Tray Trigger */}
            <GiftButton
              onPress={() => setGiftPanelVisible((prev) => !prev)}
              badgeText={giftHook.comboCount > 1 ? `x${giftHook.comboCount}` : null}
            />

            {/* 7. Gamepad Trigger */}
            <TouchableOpacity
              style={styles.controlCircleBtn}
              onPress={() => AlertService.show('Party Games', 'Spin the wheel and lucky party games opening soon!', 'info')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="gamepad-variant-outline" size={22} color="#38BDF8" />
            </TouchableOpacity>

            {/* 8. 4-Squares Room Tools Trigger */}
            <TouchableOpacity
              style={styles.controlCircleBtn}
              onPress={() => setRoomMenuModalVisible(true)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="view-grid-outline" size={22} color="#FFF" />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Floating Expanded Chat Input Bar when in On-Seat Mode */}
      {isUserOnSeat && isChatBarExpanded && (
        <View style={[styles.floatingChatInputBar, { bottom: (insets.bottom > 0 ? insets.bottom : 6) + 56 }]}>
          <TouchableOpacity
            style={[styles.bulletToggleBtn, isBulletMode && styles.bulletToggleBtnActive]}
            onPress={() => {
              const next = !isBulletMode;
              setIsBulletMode(next);
            }}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 16 }}>🚀</Text>
            {isBulletMode && <View style={styles.bulletActiveDot} />}
          </TouchableOpacity>
          <TextInput
            ref={textInputRef}
            style={styles.chatTextInput}
            placeholder={isBulletMode ? 'Bullet 🚀' : 'Say hi...'}
            placeholderTextColor="rgba(255, 255, 255, 0.55)"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => {
              handleSendMessage();
              setIsChatBarExpanded(false);
            }}
            returnKeyType="send"
            autoFocus
          />
          <TouchableOpacity
            onPress={() => {
              handleSendMessage();
              setIsChatBarExpanded(false);
            }}
            style={styles.sendMsgBtn}
          >
            <Icon name="send" size={16} color="#7C3AED" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setIsChatBarExpanded(false)}
            style={{ paddingHorizontal: 6 }}
          >
            <Icon name="close-circle" size={20} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        </View>
      )}

      {/* Flying Bullet Messages (Danmaku "udte udte jaye") Overlay */}
      {bulletMessages.length > 0 && (
        <View style={styles.bulletOverlay} pointerEvents="none">
          {bulletMessages.map((b) => (
            <DanmakuItem key={b.id} bullet={b} onComplete={handleRemoveBullet} />
          ))}
        </View>
      )}

      {/* MODAL 1: EXIT MODAL (KEEP VS LEAVE) */}
      <RoomExitModal
        visible={exitModalVisible}
        onClose={() => setExitModalVisible(false)}
        onKeepFloating={handleKeepFloating}
        onLeaveCompletely={handleLeaveCompletely}
      />

      {/* MODAL 2: ROOM TOOLS MODAL */}
      <RoomToolsModal
        visible={roomMenuModalVisible || toolsModalVisible}
        onClose={() => {
          setRoomMenuModalVisible(false);
          setToolsModalVisible(false);
        }}
        isMuted={isMuted}
        onToggleMic={toggleMic}
        onFollowRoom={() => AlertService.show('Followed', 'You are now following this room!', 'success')}
        onTakeSeat={() => {
          const freeIdx = seats.findIndex(s => !s.user && !s.isLocked);
          if (freeIdx !== -1) {
            takeSeat(freeIdx, user);
          } else {
            AlertService.show('Seats Full', 'All seats are currently occupied.', 'info');
          }
        }}
        onRoomSettings={() => setRoomSettingsModalVisible(true)}
        onLockSeats={lockAllSeats}
        onClearChat={clearChat}
        onOpenMusic={() => setMusicModalVisible(true)}
        onOpenSeatSettings={() => setSeatLayoutModalVisible(true)}
        seatCount={seatCount}
        isHost={isRoomOwner}
        bottomSafePadding={bottomSafePadding}
      />

      {/* MODAL: IN-ROOM MUSIC PLAYER MODAL */}
      <RoomMusicModal
        visible={musicModalVisible}
        onClose={() => setMusicModalVisible(false)}
        isMusicPlaying={isMusicPlaying}
        currentTrack={currentTrack}
        musicVolume={musicVolume}
        micVolume={micVolume}
        onPlayTrack={startMusicMixing}
        onPauseTrack={pauseMusicMixing}
        onResumeTrack={resumeMusicMixing}
        onStopTrack={stopMusicMixing}
        onSetMusicVolume={setMusicVolume}
        onSetMicVolume={setMicVolume}
        bottomSafePadding={bottomSafePadding}
      />

      {/* MODAL: SEAT LAYOUT CONFIGURATION MODAL */}
      <SeatLayoutModal
        visible={seatLayoutModalVisible}
        onClose={() => setSeatLayoutModalVisible(false)}
        currentSeatCount={seatCount}
        onSelectSeatCount={(count) => {
          setRoomSeatCount && setRoomSeatCount(count);
          setSeatLayoutModalVisible(false);
          AlertService.show('Seat Layout', `Room updated to ${count} seats`, 'success');
        }}
        bottomSafePadding={bottomSafePadding}
      />

      {/* MODAL: EMOJI / REACTIONS MODAL */}
      <RoomEmojiModal
        visible={emojiModalVisible}
        onClose={() => setEmojiModalVisible(false)}
        onSelectEmoji={handleSendReaction}
        bottomSafePadding={bottomSafePadding}
      />

      {/* ============================================================== */}
      {/* MODAL: MESSAGE NOTICES POPUP (MATCHING SCREENSHOT 7)            */}
      {/* ============================================================== */}
      <Modal
        visible={messageModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMessageModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.messageNoticesSheet, { paddingBottom: bottomSafePadding + 24 }]}>
            {/* Header */}
            <View style={styles.messageNoticesHeader}>
              <Text style={styles.messageNoticesTitle}>Message</Text>
              <TouchableOpacity
                onPress={() => setMessageModalVisible(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Icon name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            {/* System Item */}
            <TouchableOpacity
              style={styles.messageRowItem}
              activeOpacity={0.8}
              onPress={() => {
                setMessageModalVisible(false);
                AlertService.show('System Notices', 'Welcome to Voice Club! Keep conversation friendly and respectful.', 'info');
              }}
            >
              <LinearGradient
                colors={['#A855F7', '#7C3AED']}
                style={styles.noticeIconCircle}
              >
                <MaterialCommunityIcons name="volume-high" size={22} color="#FFF" />
              </LinearGradient>
              <View style={styles.noticeInfoCol}>
                <Text style={styles.noticeTitle}>System</Text>
              </View>
              <Text style={styles.noticeTimestamp}>Early morning02:31</Text>
            </TouchableOpacity>

            {/* Activity Item */}
            <TouchableOpacity
              style={styles.messageRowItem}
              activeOpacity={0.8}
              onPress={() => {
                setMessageModalVisible(false);
                AlertService.show('Activity Notices', 'Daily check-in and room event rewards available!', 'info');
              }}
            >
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                style={styles.noticeIconCircle}
              >
                <MaterialCommunityIcons name="bullhorn-variant" size={22} color="#FFF" />
              </LinearGradient>
              <View style={styles.noticeInfoCol}>
                <Text style={styles.noticeTitle}>Activity</Text>
              </View>
              <Text style={styles.noticeTimestamp}>Early morning02:31</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: ROOM USER PROFILE CARD (MODULAR COMPONENT) */}
      <RoomUserProfileModal
        visible={profileModalVisible}
        onClose={() => setProfileModalVisible(false)}
        user={selectedProfileUser}
        currentUserId={user?.userId || user?.id || user?._id}
        currentUserName={user?.name}
        onLeaveSeat={() => leaveSeat(user)}
        onOpenFullProfile={() => {
          setProfileModalVisible(false);
          navigation.navigate('MainTabs', { screen: 'Profile' });
        }}
        onMention={handleMentionUser}
        onGift={(u) => {
          giftHook.setSelectedReceivers([
            {
              id: u?.id || u?._id || u?.userId,
              userId: u?.userId,
              name: u?.name || 'User',
              avatar: u?.avatar || u?.image,
            },
          ]);
          setGiftModalVisible(true);
        }}
        onFollow={(u) => {
          AlertService.show('Followed', `You are now following ${u?.name || 'this user'}!`, 'success');
        }}
        onReport={(u) => {
          setUgcReportTargetUser(u);
          setUgcReportModalVisible(true);
        }}
        isHostOrAdmin={isCurrentUserAdmin}
        isRoomOwner={isRoomOwner}
        roomOwnerId={room.hostId || room.creatorId || room.ownerId || (isContextOwnerMatch ? user?.userId : null)}
        admins={admins}
        seats={seats}
        onToggleAdmin={(u) => toggleAdmin(String(u?.userId || u?.id), u?.name)}
        onBanChat={(u) => toggleChatBan(String(u?.userId || u?.id), u?.name)}
        onKickUser={(u) => kickFromRoom24h(String(u?.userId || u?.id), u?.name)}
        onRemoveFromSeat={(u) => removeFromSeat(String(u?.userId || u?.id), u?.name)}
        onToggleSeatLock={(seatIdx) => toggleSeatLock(seatIdx)}
        onMuteSeat={(u) => toggleMuteUser(String(u?.userId || u?.id), u?.name)}
        bannedChatUsers={bannedChatUsers}
        mutedUsers={mutedUsers}
        bottomSafePadding={bottomSafePadding}
      />

      {/* MODAL: ROOM WEALTH LEADERBOARD */}
      <RoomWealthModal
        visible={wealthModalVisible}
        onClose={() => setWealthModalVisible(false)}
        onSelectUser={(u) => {
          setSelectedProfileUser(u);
          setProfileModalVisible(true);
        }}
        bottomSafePadding={bottomSafePadding}
      />

      {/* MODAL: ROOM ONLINE USERS LIST */}
      <RoomOnlineUsersModal
        visible={onlineUsersModalVisible}
        onClose={() => setOnlineUsersModalVisible(false)}
        onSelectUser={(u) => {
          setSelectedProfileUser(u);
          setProfileModalVisible(true);
        }}
        bottomSafePadding={bottomSafePadding}
      />


      {/* ============================================================== */}
      {/* MODAL 4: SELF SEAT OPTIONS                                      */}
      {/* ============================================================== */}
      <Modal
        visible={selfSeatModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSelfSeatModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.selfSeatSheet}>
            <Text style={styles.selfSeatTitle}>Your Seat Options</Text>

            <TouchableOpacity
              style={styles.selfSeatActionBtn}
              onPress={() => {
                setSelfSeatModalVisible(false);
                leaveSeat(user);
              }}
            >
              <MaterialCommunityIcons name="seat-passenger" size={20} color="#EF4444" style={{ marginRight: 8 }} />
              <Text style={[styles.selfSeatActionText, { color: '#EF4444' }]}>Leave Seat (Become Listener)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.selfSeatActionBtn}
              onPress={() => {
                setSelfSeatModalVisible(false);
                toggleMic();
              }}
            >
              <Icon name={isMuted ? 'mic' : 'mic-off'} size={20} color="#4F46E5" style={{ marginRight: 8 }} />
              <Text style={styles.selfSeatActionText}>{isMuted ? 'Turn Microphone Live' : 'Mute Microphone'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.selfSeatCancelBtn}
              onPress={() => setSelfSeatModalVisible(false)}
            >
              <Text style={styles.selfSeatCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 5: NEW ENTERPRISE GIFT PANEL */}
      <GiftPanel
        visible={giftPanelVisible}
        onClose={() => setGiftPanelVisible(false)}
        room={room}
        seats={seats}
        diamondBalance={diamondBalance}
        onTopUp={() => navigation.navigate('Recharge')}
        giftHook={giftHook}
        bottomSafePadding={bottomSafePadding}
      />

      {/* ROOM ENTRY EFFECT ANIMATION ENGINE */}
      <RoomEntryEffectEngine
        activeEntry={activeEntryEffect}
        onComplete={() => setActiveEntryEffect && setActiveEntryEffect(null)}
      />

      {/* VIP FLOATING ENTRY ENGINE */}
      <VipFloatingEntryEngine
        vipEntryEvent={activeVipEntry}
        onComplete={() => setActiveVipEntry && setActiveVipEntry(null)}
      />

      {/* ENTERPRISE GIFT ANIMATION ENGINE (CENTER -> RECIPIENT AVATAR FLIGHT -> BURST) */}
      <GiftAnimationEngine
        animation={activeAnimation}
        onAnimationComplete={() => setActiveAnimation && setActiveAnimation(null)}
      />

      {/* GIFT COMBO POPUP BADGE */}
      <GiftCombo
        comboCount={giftHook.comboCount}
        giftName={giftHook.lastSentGift?.gift?.name}
        giftIcon={giftHook.lastSentGift?.gift?.icon}
      />

      {/* ROOM GIFT NOTIFICATION BANNER */}
      <GiftRoomNotification
        notifications={roomGiftNotifications}
        onDismiss={(id) =>
          setRoomGiftNotifications((prev) => prev.filter((n) => n.id !== id))
        }
      />

      {/* MODAL 6A: ROOM DETAILS CARD (MODULAR COMPONENT) */}
      <RoomDetailsModal
        visible={roomDetailsModalVisible}
        onClose={() => setRoomDetailsModalVisible(false)}
        room={{
          id: room.id || room.roomId || '30001',
          title: currentRoomTitle || room.title || 'TÜRKİYE',
          coverImage: currentRoomCover || room.coverImage,
          tag: room.tag || 'Party',
          about: currentRoomAbout || 'No title',
        }}
        members={onlineUsers}
        onFollow={() => {}}
        onJoin={() => {}}
        bottomSafePadding={bottomSafePadding}
      />



      {/* ============================================================== */}
      {/* MODAL 6B: ROOM SETTINGS EDITOR POPUP (AVATAR, NAME, SEATS, PIN) */}
      {/* ============================================================== */}
      <Modal
        visible={roomSettingsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRoomSettingsModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setRoomSettingsModalVisible(false)}
          />
          <View style={[styles.roomSettingsSheet, { paddingBottom: bottomSafePadding + 10 }]}>
            <View style={styles.sheetHandle} />

            <View style={styles.settingsHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialIcons name="tune" size={22} color="#8B5CF6" />
                <Text style={styles.settingsSheetTitle}>Room Settings</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <TouchableOpacity
                  style={styles.headerSavePillBtn}
                  onPress={handleSaveRoomSettings}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#8B5CF6', '#EC4899']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.headerSavePillGradient}
                  >
                    <Icon name="checkmark" size={14} color="#FFF" />
                    <Text style={styles.headerSavePillText}>Save</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setRoomSettingsModalVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Icon name="close" size={22} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: '70%' }}>
              {/* 1. Room Cover / Avatar Manual Upload */}
              <Text style={styles.settingsSectionTitle}>Room Avatar / Cover</Text>
              <View style={styles.manualUploadAvatarBox}>
                <Image
                  source={{ uri: editRoomCover || user?.avatar || 'https://api.yaroapp.in/uploads/avatars/female_default.webp' }}
                  style={styles.manualUploadAvatarPreview}
                />
                <View style={styles.manualUploadActionsCol}>
                  <Text style={styles.manualUploadTitle}>Custom Room Cover</Text>
                  <Text style={styles.manualUploadSub}>Upload from device gallery or take photo</Text>
                  <View style={styles.uploadBtnRow}>
                    <TouchableOpacity
                      style={styles.uploadMiniBtn}
                      activeOpacity={0.8}
                      onPress={async () => {
                        try {
                          const picked = await requestGalleryAndSelect();
                          if (picked?.uri) {
                            setEditRoomCover(picked.uri);
                          }
                        } catch (e) {
                          console.log('Upload error', e);
                        }
                      }}
                    >
                      <Icon name="images-outline" size={16} color="#6366F1" style={{ marginRight: 5 }} />
                      <Text style={styles.uploadMiniBtnText}>Gallery</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.uploadMiniBtn}
                      activeOpacity={0.8}
                      onPress={async () => {
                        try {
                          const captured = await requestCameraAndCapture('back');
                          if (captured?.uri) {
                            setEditRoomCover(captured.uri);
                          }
                        } catch (e) {
                          console.log('Camera error', e);
                        }
                      }}
                    >
                      <Icon name="camera-outline" size={16} color="#EC4899" style={{ marginRight: 5 }} />
                      <Text style={styles.uploadMiniBtnText}>Camera</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* 2. Room Name Input */}
              <View style={styles.settingsInputGroup}>
                <View style={styles.settingsLabelRow}>
                  <Text style={styles.settingsInputLabel}>Room Name</Text>
                  <Text style={styles.settingsCharCount}>{editRoomName.length}/30</Text>
                </View>
                <TextInput
                  style={styles.settingsTextInput}
                  value={editRoomName}
                  onChangeText={setEditRoomName}
                  maxLength={30}
                  placeholder="Enter a catchy room name..."
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* 3. Room Bio / Announcement Input */}
              <View style={styles.settingsInputGroup}>
                <View style={styles.settingsLabelRow}>
                  <Text style={styles.settingsInputLabel}>Room Announcement / Bio</Text>
                  <Text style={styles.settingsCharCount}>{editRoomAbout.length}/120</Text>
                </View>
                <TextInput
                  style={[styles.settingsTextInput, { height: 75, textAlignVertical: 'top' }]}
                  value={editRoomAbout}
                  onChangeText={setEditRoomAbout}
                  maxLength={120}
                  multiline
                  numberOfLines={3}
                  placeholder="Tell listeners what this room is about..."
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* 4. Seat Layout / Count */}
              <View style={styles.settingsInputGroup}>
                <Text style={styles.settingsInputLabel}>Seat Layout (Top: 2 Seats Host & Co-Host)</Text>
                <View style={styles.seatOptionsRow}>
                  {[
                    { count: 8, label: '8 Below (4+4)' },
                    { count: 10, label: '10 Below (5+5)' },
                    { count: 15, label: '15 Below (5+5+5)' },
                  ].map((item) => {
                    const isSelected = editSeatCount === item.count;
                    return (
                      <TouchableOpacity
                        key={item.count}
                        onPress={() => setEditSeatCount(item.count)}
                        activeOpacity={0.8}
                        style={[styles.seatOptionChip, isSelected && styles.seatOptionChipActive]}
                      >
                        <Text style={[styles.seatOptionText, isSelected && styles.seatOptionTextActive]}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* 5. Room Security & Lock PIN */}
              <View style={styles.settingsInputGroup}>
                <Text style={styles.settingsInputLabel}>Room Lock & Privacy</Text>
                <View style={styles.lockToggleRow}>
                  <TouchableOpacity
                    style={[styles.lockChoiceCard, !editRoomLocked && styles.lockChoiceCardActive]}
                    onPress={() => setEditRoomLocked(false)}
                    activeOpacity={0.8}
                  >
                    <Icon name="lock-open-outline" size={20} color={!editRoomLocked ? '#10B981' : '#64748B'} />
                    <Text style={[styles.lockChoiceTitle, !editRoomLocked && { color: '#10B981' }]}>Public Room</Text>
                    <Text style={styles.lockChoiceSub}>Anyone can join</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.lockChoiceCard, editRoomLocked && styles.lockChoiceCardActive]}
                    onPress={() => setEditRoomLocked(true)}
                    activeOpacity={0.8}
                  >
                    <Icon name="lock-closed-outline" size={20} color={editRoomLocked ? '#EF4444' : '#64748B'} />
                    <Text style={[styles.lockChoiceTitle, editRoomLocked && { color: '#EF4444' }]}>PIN Protected</Text>
                    <Text style={styles.lockChoiceSub}>Passcode needed</Text>
                  </TouchableOpacity>
                </View>

                {editRoomLocked && (
                  <View style={styles.pinInputContainer}>
                    <Text style={styles.pinInputHint}>Set 4-Digit Passcode PIN:</Text>
                    <TextInput
                      style={styles.pinTextInput}
                      value={editRoomPin}
                      onChangeText={(val) => setEditRoomPin(val.replace(/[^0-9]/g, '').slice(0, 4))}
                      keyboardType="numeric"
                      maxLength={4}
                      placeholder="e.g. 1234"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                )}
              </View>
            </ScrollView>

            {/* STICKY FIXED SAVE BUTTON AT BOTTOM - ALWAYS VISIBLE */}
            <View style={styles.fixedSettingsFooter}>
              <TouchableOpacity
                style={styles.saveSettingsSubmitBtn}
                onPress={handleSaveRoomSettings}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#EC4899']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveSettingsSubmitGradient}
                >
                  <MaterialIcons name="done-all" size={20} color="#FFF" style={{ marginRight: 6 }} />
                  <Text style={styles.saveSettingsSubmitText}>Save & Apply Settings / सहेजें</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* ============================================================== */}
      {/* MODAL 7: UGC REPORT USER MODAL                                  */}
      {/* ============================================================== */}
      <Modal
        visible={ugcReportModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setUgcReportModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.menuSheet, { paddingBottom: bottomSafePadding + 20 }]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.menuSheetTitle}>Report User</Text>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 8 }}>
              Select a reason for reporting {ugcReportTargetUser?.name || 'this participant'}:
            </Text>

            <ScrollView style={{ maxHeight: 200, marginVertical: 8 }}>
              {UGC_REPORT_REASONS.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.ugcReasonItem,
                    ugcReportReason === r && styles.ugcReasonItemSelected
                  ]}
                  onPress={() => setUgcReportReason(r)}
                >
                  <Text style={[styles.ugcReasonText, ugcReportReason === r && styles.ugcReasonTextSelected]}>
                    {r}
                  </Text>
                  {ugcReportReason === r && <MaterialIcons name="check" size={18} color="#03dcfe" />}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput
              style={[styles.editTextInput, { height: 60, textAlignVertical: 'top' }]}
              value={ugcReportDetails}
              onChangeText={setUgcReportDetails}
              placeholder="Additional details (optional)..."
              placeholderTextColor="#94A3B8"
              multiline
              maxLength={200}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
              <TouchableOpacity
                style={{ paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.08)' }}
                onPress={() => setUgcReportModalVisible(false)}
                disabled={submittingUgcReport}
              >
                <Text style={{ color: '#fff', fontSize: 14 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10, backgroundColor: '#e11d48' }}
                onPress={handleSendUgcReport}
                disabled={submittingUgcReport}
              >
                {submittingUgcReport ? (
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Submitting...</Text>
                ) : (
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Submit Report</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL 8: SEAT ACTION MODAL (HOST/ADMIN EMPTY SEAT BOTTOM SHEET)  */}
      {/* 4 HORIZONTAL ITEMS: Lock/Unlock, Lock All/Unlock All, On mic, Invite */}
      {/* ============================================================== */}
      <Modal
        visible={seatActionModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setSeatActionModalVisible(false);
          setSelectedSeatForAction(null);
        }}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => {
            setSeatActionModalVisible(false);
            setSelectedSeatForAction(null);
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.emptySeatActionSheet, { paddingBottom: bottomSafePadding + 16 }]}
          >
            <View style={styles.sheetHandle} />

            <View style={styles.emptySeatActionRow}>
              {/* Option 1: Lock / Unlock */}
              <TouchableOpacity
                style={styles.emptySeatActionItem}
                onPress={() => {
                  if (selectedSeatForAction) {
                    toggleSeatLock(selectedSeatForAction.seatIndex);
                  }
                  setSeatActionModalVisible(false);
                  setSelectedSeatForAction(null);
                }}
                activeOpacity={0.75}
              >
                <View style={styles.emptySeatIconCircle}>
                  <MaterialCommunityIcons
                    name={selectedSeatForAction?.isLocked ? 'lock-open-variant' : 'lock'}
                    size={26}
                    color="#334155"
                  />
                </View>
                <Text style={styles.emptySeatActionLabel}>
                  {selectedSeatForAction?.isLocked ? 'Unlock' : 'Lock'}
                </Text>
              </TouchableOpacity>

              {/* Option 2: Lock All / Unlock All */}
              <TouchableOpacity
                style={styles.emptySeatActionItem}
                onPress={() => {
                  const guestSeats = seats.filter((s) => s.seatIndex > 0);
                  const allLocked = guestSeats.length > 0 && guestSeats.every((s) => s.isLocked);
                  if (allLocked) {
                    unlockAllSeats();
                  } else {
                    lockAllSeats();
                  }
                  setSeatActionModalVisible(false);
                  setSelectedSeatForAction(null);
                }}
                activeOpacity={0.75}
              >
                <View style={styles.emptySeatIconCircle}>
                  <MaterialCommunityIcons
                    name={
                      seats.filter((s) => s.seatIndex > 0).every((s) => s.isLocked)
                        ? 'lock-open-variant-outline'
                        : 'lock-outline'
                    }
                    size={26}
                    color="#334155"
                  />
                </View>
                <Text style={styles.emptySeatActionLabel}>
                  {seats.filter((s) => s.seatIndex > 0).every((s) => s.isLocked)
                    ? 'Unlock All'
                    : 'Lock All'}
                </Text>
              </TouchableOpacity>

              {/* Option 3: On mic */}
              <TouchableOpacity
                style={styles.emptySeatActionItem}
                onPress={() => {
                  if (selectedSeatForAction) {
                    takeSeat(selectedSeatForAction.seatIndex, user);
                  }
                  setSeatActionModalVisible(false);
                  setSelectedSeatForAction(null);
                }}
                activeOpacity={0.75}
              >
                <View style={styles.emptySeatIconCircle}>
                  <MaterialCommunityIcons name="microphone" size={26} color="#334155" />
                </View>
                <Text style={styles.emptySeatActionLabel}>On mic</Text>
              </TouchableOpacity>

              {/* Option 4: Invite */}
              <TouchableOpacity
                style={styles.emptySeatActionItem}
                onPress={() => {
                  setSeatActionModalVisible(false);
                  setSelectedSeatForAction(null);
                  setOnlineUsersModalVisible(true);
                }}
                activeOpacity={0.75}
              >
                <View style={styles.emptySeatIconCircle}>
                  <MaterialCommunityIcons name="account-plus-outline" size={26} color="#334155" />
                </View>
                <Text style={styles.emptySeatActionLabel}>Invite</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Enterprise Gift Panel Sheet */}
      <GiftPanel
        visible={giftPanelVisible}
        onClose={() => setGiftPanelVisible(false)}
        room={room}
        seats={seats}
        diamondBalance={diamondBalance}
        onTopUp={() => {
          setGiftPanelVisible(false);
          navigation.navigate('Wallet');
        }}
        giftHook={giftHook}
        bottomSafePadding={bottomSafePadding}
      />

      <GiftQuickSend
        visible={giftHook.quickSendVisible}
        gift={giftHook.lastSentGift?.gift}
        receiver={giftHook.selectedReceivers[0]}
        comboCount={giftHook.comboCount}
        onQuickSend={(gift, qty, receiver) =>
          giftHook.executeSend(gift, qty, receiver ? [receiver] : null)
        }
        onClose={() => giftHook.setQuickSendVisible(false)}
        bottomInset={bottomSafePadding + 62}
      />

      {/* Edit Room Announcement Modal (Image 2) */}
      <Modal
        visible={isEditingAnnouncement}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditingAnnouncement(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.announcementModalOverlay}
        >
          <View style={styles.announcementModalCard}>
            <View style={styles.announcementModalHeader}>
              <MaterialCommunityIcons name="bullhorn-outline" size={22} color="#F59E0B" />
              <Text style={styles.announcementModalTitle}>Edit Announcement</Text>
            </View>
            <TextInput
              style={styles.announcementTextInput}
              value={tempAnnouncement}
              onChangeText={setTempAnnouncement}
              placeholder="Enter room announcement..."
              placeholderTextColor="#94A3B8"
              multiline
              maxLength={150}
            />
            <View style={styles.announcementModalButtonsRow}>
              <TouchableOpacity
                style={styles.announcementCancelBtn}
                onPress={() => setIsEditingAnnouncement(false)}
              >
                <Text style={styles.announcementCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.announcementSaveBtn}
                onPress={() => {
                  setRoomAnnouncement(tempAnnouncement.trim() || "Welcome to my room, let's chat together!");
                  setIsEditingAnnouncement(false);
                  AlertService.show('Announcement Saved', 'Room announcement updated successfully', 'success');
                }}
              >
                <Text style={styles.announcementSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#0C0806',
  },
  topHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 6,
  },
  hostInfoCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(25, 20, 18, 0.85)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.4)',
    padding: 3,
    paddingRight: 4,
    maxWidth: width * 0.52,
  },
  hostCapsuleAvatar: {
    width: 34,
    height: 34,
    borderRadius: 8,
    marginRight: 6,
  },
  hostCapsuleTexts: {
    flex: 1,
    marginRight: 6,
  },
  hostCapsuleName: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  capsuleIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  capsuleIdText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  starCircleBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#00BCD4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topContribAvatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallContribAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#1F1A17',
  },
  headerOnlineCountText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
    marginRight: 8,
  },
  headerPowerBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginTop: 4,
  },
  trophyBadgeCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 24, 20, 0.8)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  trophyAvatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 2,
  },
  trophyDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#334155',
    borderWidth: 1,
    borderColor: '#475569',
  },
  roomLevelCrestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 4,
  },
  roomLevelCrestText: {
    color: '#FDE047',
    fontSize: 11,
    fontWeight: '800',
  },
  roomJoinBanner: {
    position: 'absolute',
    top: 70,
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 20,
    shadowColor: '#7C3AED',
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  roomJoinBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  joinAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    marginRight: 10,
    backgroundColor: '#6366F1',
  },
  joinUserName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    flexShrink: 1,
  },
  joinLevelBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  joinLevelText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  joinSubText: {
    color: '#EDE9FE',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  giftCelebrationBanner: {
    marginHorizontal: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  giftCelebrationText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  voiceLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    marginLeft: 4,
  },
  voiceGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 3,
  },
  voiceLiveText: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '800',
  },
  topTwoSeatsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
    marginBottom: 6,
  },
  topFeaturedSeatItem: {
    alignItems: 'center',
    width: 90,
  },
  topFeaturedAvatarBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: '#1E1B24',
  },
  hostGoldBorder: {
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  cpPinkBorder: {
    borderWidth: 2,
    borderColor: '#EC4899',
  },
  topFeaturedAvatarImg: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  hostCrest: {
    borderColor: '#F59E0B',
  },
  cpCrest: {
    borderColor: '#EC4899',
  },
  topSeatUserName: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
    maxWidth: 80,
    textAlign: 'center',
  },
  topFeaturedEmptyCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostEmptyBorder: {
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  cpEmptyBorder: {
    borderWidth: 1.5,
    borderColor: 'rgba(236, 72, 153, 0.4)',
  },
  topSeatLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
  hostLabelColor: {
    color: '#FBBF24',
  },
  cpLabelColor: {
    color: '#F472B6',
  },
  seatsAreaContainer: {
    paddingHorizontal: 8,
    marginTop: 8,
  },
  seatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  seatItem: {
    alignItems: 'center',
    width: (width - 16) / 5,
  },
  emptySeatWrapper: {
    alignItems: 'center',
  },
  emptySeatCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatNumText: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 3,
  },
  occupiedSeatWrapper: {
    alignItems: 'center',
  },
  occupiedAvatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  avatarCrestFrame: {
    position: 'absolute',
    bottom: -4,
    backgroundColor: 'rgba(30, 20, 10, 0.9)',
    borderRadius: 6,
    paddingHorizontal: 3,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  micMuteBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatUserName: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 3,
    maxWidth: 64,
    textAlign: 'center',
  },
  charmPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginTop: 2,
  },
  charmFlower: {
    fontSize: 8,
    marginRight: 2,
  },
  charmVal: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '700',
  },
  midInfoSection: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  yaroNoticeText: {
    color: '#00E5FF',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  partyTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  partyTagHash: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    marginRight: 4,
  },
  partyTagText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  chatAreaContainer: {
    flex: 1,
    paddingLeft: 12,
    paddingRight: 78,
    marginTop: 4,
    marginBottom: 4,
    maxWidth: width - 74,
  },
  chatFlatList: {
    flex: 1,
  },
  comingBannerRow: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  comingBannerText: {
    color: '#CBD5E1',
    fontSize: 11.5,
    fontWeight: '600',
  },
  quickActionsPillsRow: {
    gap: 6,
    marginBottom: 6,
  },
  cyanPillBtn: {
    height: 34,
    width: 145,
    borderRadius: 17,
    backgroundColor: 'rgba(8, 145, 178, 0.85)',
    borderWidth: 1,
    borderColor: '#06B6D4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 10,
    paddingRight: 3,
  },
  cyanPillText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  cyanPillIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#0891B2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerOnlineTouchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightFloatingWidgetsCol: {
    position: 'absolute',
    right: 2,
    bottom: 132,
    alignItems: 'flex-end',
    gap: 8,
    zIndex: 20,
    elevation: 8,
  },
  firstRechargeWidget: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  firstRechargeWidgetText: {
    color: '#FDE047',
    fontSize: 8.5,
    fontWeight: '800',
    marginTop: 1,
  },
  rocketWidget: {
    alignItems: 'center',
  },
  rocketCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1.5,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rocketPercentBadge: {
    backgroundColor: '#2563EB',
    borderRadius: 7,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginTop: -5,
  },
  rocketPercentText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '800',
  },
  userChatBubble: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 4,
    maxWidth: '100%',
    alignSelf: 'flex-start',
  },
  chatAvatarThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    marginRight: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  chatContentCol: {
    flexShrink: 1,
  },
  chatUserHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chatSenderName: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '700',
  },
  chatLevelPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 7,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  chatLevelText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '800',
  },
  chatMessageText: {
    color: '#FFF',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 1,
    flexWrap: 'wrap',
  },
  systemChatBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
    maxWidth: '100%',
  },
  systemChatText: {
    fontSize: 10.5,
    color: '#CBD5E1',
    lineHeight: 14,
  },
  giftChatBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
    maxWidth: '100%',
  },
  giftChatUser: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#FDE047',
  },
  giftChatText: {
    fontSize: 10.5,
    color: '#FFF',
  },
  giftChatReceiver: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#F472B6',
  },
  floatingReactionsContainer: {
    position: 'absolute',
    bottom: 85,
    right: 16,
    alignItems: 'center',
  },
  floatingEmoji: {
    fontSize: 26,
    marginBottom: 6,
  },
  bottomControlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 2,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
    gap: 4,
  },
  chatInputWrapper: {
    flex: 1,
    maxWidth: 125,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  chatTextInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 11.5,
    paddingVertical: 0,
  },
  sendMsgBtn: {
    paddingHorizontal: 3,
  },
  controlCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftTriggerBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
  },
  giftTriggerGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Modal Backdrops
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  // Exit Dialog Box
  exitDialogBox: {
    backgroundColor: '#1E1B4B',
    marginHorizontal: 20,
    marginBottom: 40,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  exitDialogIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  exitDialogTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  exitDialogSub: {
    fontSize: 12.5,
    color: '#CBD5E1',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  exitDialogBtnRow: {
    width: '100%',
    gap: 10,
  },
  exitKeepBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  exitKeepGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
  },
  exitKeepBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  exitLeaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 14,
  },
  exitLeaveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },
  // Menu Sheet
  menuSheet: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#64748B',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },
  menuSheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  menuItemCard: {
    width: (width - 56) / 2,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  menuItemIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  menuItemLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  menuItemSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  closeSheetBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  closeSheetBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  // Profile Sheet
  profileSheet: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileAvatarLarge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: '#818CF8',
    marginRight: 14,
  },
  profileInfoColumn: {
    flex: 1,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  profileSheetName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginRight: 6,
  },
  adminPill: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  adminPillText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#000',
  },
  profileSheetId: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 4,
  },
  levelGenderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  levelBadge: {
    backgroundColor: '#4338CA',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  levelBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#C7D2FE',
  },
  genderBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EC4899',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  viewProfileBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    paddingVertical: 11,
    borderRadius: 12,
  },
  viewProfileBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },
  mentionActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    paddingVertical: 11,
    borderRadius: 12,
  },
  mentionActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4F46E5',
  },
  giftActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EC4899',
    paddingVertical: 11,
    borderRadius: 12,
  },
  giftActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },
  ugcSafetyRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  ugcReportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  ugcReportBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#f43f5e',
  },
  ugcBlockBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  ugcBlockBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#ef4444',
  },
  ugcReasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  ugcReasonItemSelected: {
    backgroundColor: 'rgba(3, 220, 254, 0.15)',
    borderWidth: 1,
    borderColor: '#03dcfe',
  },
  ugcReasonText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
  },
  ugcReasonTextSelected: {
    color: '#03dcfe',
    fontWeight: '700',
  },
  adminToolsContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  adminToolsTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FDE047',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  adminToolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  toolItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  toolItemText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E2E8F0',
    marginLeft: 4,
  },
  // Self Seat Sheet
  selfSeatSheet: {
    backgroundColor: '#1E293B',
    marginHorizontal: 20,
    marginBottom: 40,
    borderRadius: 20,
    padding: 20,
  },
  selfSeatTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 14,
    textAlign: 'center',
  },
  selfSeatActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  selfSeatActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },
  selfSeatCancelBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  selfSeatCancelText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  // Gift Modal
  giftModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  giftModalSheet: {
    backgroundColor: '#1E1B4B',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  giftModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  coinBalanceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  coinBalanceNumber: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FDE047',
  },
  giftToLabel: {
    fontSize: 12,
    color: '#CBD5E1',
  },
  closeGiftBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  giftGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  giftCard: {
    width: (width - 60) / 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  giftCardSelected: {
    borderColor: '#EC4899',
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
  },
  giftIconEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  giftNameText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 2,
  },
  giftCostRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  giftCostText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FDE047',
  },
  sendGiftBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  sendGiftGradient: {
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendGiftBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
  },
  // Edit Room
  editInputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CBD5E1',
    marginBottom: 6,
    marginTop: 8,
  },
  editTextInput: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#FFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  saveEditBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 16,
  },
  saveEditGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveEditText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },

  /* Room Details Bottom Sheet */
  roomDetailsSheet: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '85%',
  },
  roomDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  roomCoverAvatarWrap: {
    position: 'relative',
    marginRight: 14,
  },
  roomCoverAvatar: {
    width: 68,
    height: 68,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#EC4899',
  },
  roomLiveDotBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#0F172A',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomLivePulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
  },
  roomDetailsInfoCol: {
    flex: 1,
  },
  roomDetailsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  roomDetailsMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  roomIdBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roomIdText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  roomFlagBadge: {
    fontSize: 14,
  },
  roomHotnessBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roomHotnessText: {
    color: '#F87171',
    fontSize: 11,
    fontWeight: '800',
  },
  roomCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  categoryPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryPillText: {
    color: '#CBD5E1',
    fontSize: 10.5,
    fontWeight: '700',
  },
  announcementCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  announcementHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  announcementLabel: {
    color: '#A78BFA',
    fontSize: 12,
    fontWeight: '800',
  },
  announcementContent: {
    color: '#E2E8F0',
    fontSize: 13,
    lineHeight: 18,
  },
  hostProfileStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    padding: 10,
    marginBottom: 16,
  },
  hostStripAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
  },
  hostStripDetails: {
    flex: 1,
  },
  hostStripName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  hostCrownTag: {
    backgroundColor: '#FEF08A',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  hostCrownTagText: {
    color: '#854D0E',
    fontSize: 9,
    fontWeight: '900',
  },
  hostStripSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  roomDetailsActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  roomSettingsTriggerBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  roomSettingsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  roomSettingsBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  roomShareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    borderRadius: 14,
    paddingVertical: 12,
  },
  roomShareBtnText: {
    color: '#818CF8',
    fontSize: 13.5,
    fontWeight: '800',
  },

  /* Room Settings Editor Sheet */
  roomSettingsSheet: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '90%',
  },
  settingsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  settingsSheetTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  headerSavePillBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  headerSavePillGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 4,
  },
  headerSavePillText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  fixedSettingsFooter: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  settingsSectionTitle: {
    color: '#CBD5E1',
    fontSize: 12.5,
    fontWeight: '800',
    marginBottom: 10,
  },
  coversScrollRow: {
    gap: 10,
    paddingBottom: 14,
  },
  coverThumbItem: {
    width: 64,
    height: 64,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  coverThumbSelected: {
    borderColor: '#EC4899',
  },
  coverThumbImg: {
    width: '100%',
    height: '100%',
  },
  coverCheckMark: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EC4899',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsInputGroup: {
    marginBottom: 14,
  },
  settingsLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  settingsInputLabel: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '700',
  },
  settingsCharCount: {
    color: '#64748B',
    fontSize: 11,
  },
  settingsTextInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#FFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  seatOptionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  seatOptionChip: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  seatOptionChipActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.25)',
    borderColor: '#8B5CF6',
  },
  seatOptionText: {
    color: '#94A3B8',
    fontSize: 11.5,
    fontWeight: '700',
  },
  seatOptionTextActive: {
    color: '#A78BFA',
    fontWeight: '800',
  },
  lockToggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  lockChoiceCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  lockChoiceCardActive: {
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
  },
  lockChoiceTitle: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 6,
  },
  lockChoiceSub: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 2,
  },
  pinInputContainer: {
    marginTop: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  pinInputHint: {
    color: '#F87171',
    fontSize: 11.5,
    fontWeight: '700',
    marginBottom: 6,
  },
  pinTextInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFF',
    fontSize: 16,
    letterSpacing: 6,
    textAlign: 'center',
    fontWeight: '800',
  },
  saveSettingsSubmitBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 18,
    marginBottom: 8,
  },
  saveSettingsSubmitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
  },
  saveSettingsSubmitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  lockedSeatCircle: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderWidth: 1.5,
  },
  manualUploadAvatarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 8,
    marginBottom: 16,
  },
  manualUploadAvatarPreview: {
    width: 68,
    height: 68,
    borderRadius: 12,
    backgroundColor: '#1E293B',
  },
  manualUploadActionsCol: {
    flex: 1,
    marginLeft: 12,
  },
  manualUploadTitle: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  manualUploadSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
    marginBottom: 8,
  },
  uploadBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  uploadMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  uploadMiniBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  bulletOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 9999,
  },
  flyingBulletCard: {
    position: 'absolute',
    alignSelf: 'flex-start',
    zIndex: 99999,
    elevation: 99999,
  },
  flyingBulletGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  flyingBulletAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  flyingBulletUser: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
    marginRight: 4,
  },
  flyingBulletText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    maxWidth: 220,
  },
  bulletToggleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  bulletToggleBtnActive: {
    backgroundColor: '#7C3AED',
    borderWidth: 1,
    borderColor: '#A78BFA',
  },
  bulletActiveDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
  },
  bulletChatBadge: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 2,
  },
  bulletChatBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },

  /* Room Tools Sheet (Screenshot 6) */
  roomToolsSheet: {
    backgroundColor: '#18181B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  toolsPillRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 12,
  },
  actionPillBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0E7490',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 22,
  },
  actionPillText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  actionPillIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomToolsTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 16,
  },
  toolsIconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  toolCircleCol: {
    alignItems: 'center',
    width: (width - 40) / 5,
  },
  toolRoundIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  toolRoundIconMuted: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  toolRoundLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },

  /* Emoji Sheet (Screenshot 5) */
  emojiSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  emojiTabsRow: {
    flexDirection: 'row',
    gap: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 14,
  },
  emojiTabItem: {
    padding: 6,
    borderRadius: 12,
  },
  emojiTabItemActive: {
    backgroundColor: '#F1F5F9',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  emojiGridCard: {
    width: (width - 64) / 4,
    alignItems: 'center',
    paddingVertical: 10,
  },
  emojiGridIcon: {
    fontSize: 34,
    marginBottom: 4,
  },
  emojiGridLabel: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },

  /* Message Notices Sheet (Screenshot 7) */
  messageNoticesSheet: {
    backgroundColor: '#1E1206',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  messageNoticesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 12,
  },
  messageNoticesTitle: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
  },
  messageRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  noticeIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  noticeInfoCol: {
    flex: 1,
  },
  noticeTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  noticeTimestamp: {
    color: '#94A3B8',
    fontSize: 11,
  },

  /* Gift Modal Screenshot 8 Styles */
  giftRecipientsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
    paddingHorizontal: 6,
  },
  recipientPill: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  recipientPillActive: {
    backgroundColor: '#D97706',
  },
  recipientPillText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  giftTabsScroll: {
    flexDirection: 'row',
    gap: 16,
    paddingBottom: 8,
    paddingHorizontal: 6,
  },
  giftTabItem: {
    alignItems: 'center',
    paddingBottom: 4,
  },
  giftTabText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  giftTabTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  giftTabActiveLine: {
    width: 16,
    height: 3,
    backgroundColor: '#FFF',
    borderRadius: 2,
    marginTop: 4,
  },
  giftGridScreenshot: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    marginVertical: 10,
  },
  giftItemCard: {
    width: (width - 56) / 4,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    position: 'relative',
  },
  giftItemCardSelected: {
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  weeklyBadgeWrap: {
    position: 'absolute',
    top: 3,
    right: 3,
    backgroundColor: '#2563EB',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  weeklyBadgeText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '800',
  },
  giftLargeIcon: {
    fontSize: 28,
    marginVertical: 4,
  },
  giftDaysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  giftDaysText: {
    fontSize: 9,
    color: '#94A3B8',
  },
  giftItemName: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  giftPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  giftPriceVal: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '700',
  },
  giftBottomControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  giftCoinBalanceCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  giftBalanceText: {
    color: '#F59E0B',
    fontSize: 16,
    fontWeight: '800',
    marginRight: 6,
  },
  giftTopUpLink: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '700',
  },
  giftActionRightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  giftCountBox: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  giftCountText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  giftSendPillBtn: {
    backgroundColor: '#92400E',
    paddingHorizontal: 22,
    paddingVertical: 7,
    borderRadius: 16,
  },
  giftSendPillBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  // Modal 8 Empty Seat Action Sheet (Screenshot 3)
  emptySeatActionSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  emptySeatActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 14,
  },
  emptySeatActionItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
  },
  emptySeatIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptySeatActionLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },
  // Dynamic Bottom Bar Controls
  controlCircleBtnActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1.5,
    borderColor: '#10B981',
  },
  controlCircleBtnMuted: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1.5,
    borderColor: '#EF4444',
  },
  floatingChatInputBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    zIndex: 100,
    elevation: 10,
  },

  // Image 1 & 2 Header Styles
  headerRoomInfoTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: width * 0.55,
  },
  headerRoomAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    marginRight: 8,
  },
  headerRoomTexts: {
    flex: 1,
  },
  headerRoomTitle: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  headerRoomSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  headerRoomIdText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  headerRoomMembersText: {
    color: '#E2E8F0',
    fontSize: 10,
    fontWeight: '700',
  },
  headerRightActionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Sub Header: Group Tag & Top Contributors
  groupPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(147, 51, 234, 0.35)',
    borderColor: 'rgba(168, 85, 247, 0.6)',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  groupPillText: {
    color: '#E9D5FF',
    fontSize: 11,
    fontWeight: '800',
  },
  topContribRowTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contribAvatarWrap: {
    position: 'relative',
  },
  contribRankBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFF',
  },
  contribRankText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '900',
  },

  // Image 1 Top Flying Gift Banner
  flyingGiftBannerContainer: {
    position: 'absolute',
    top: 90,
    left: 12,
    zIndex: 999,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#BE185D',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 8,
  },
  flyingGiftGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
  },
  flyingGiftAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#FDE047',
  },
  flyingGiftTextCol: {
    maxWidth: 110,
  },
  flyingGiftSender: {
    color: '#FEF08A',
    fontSize: 10,
    fontWeight: '800',
  },
  flyingGiftAction: {
    color: '#FFF',
    fontSize: 8.5,
    fontWeight: '600',
  },
  flyingGiftEmoji: {
    fontSize: 16,
  },
  flyingGiftMultiplier: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FDE047',
    fontStyle: 'italic',
  },

  // PK Button
  pkButtonContainer: {
    alignItems: 'center',
    marginVertical: 4,
  },
  pkButton: {
    borderRadius: 14,
    padding: 1.2,
    backgroundColor: '#38BDF8',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 4,
  },
  pkGradient: {
    paddingHorizontal: 16,
    paddingVertical: 2.5,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pkText: {
    fontSize: 12,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#38BDF8',
    letterSpacing: 1.5,
  },

  // Notice & Announcement & Event (Image 2)
  noticeAnnouncementRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginHorizontal: 10,
    marginTop: 2,
    gap: 8,
  },
  noticeAnnouncementCol: {
    flex: 1,
    gap: 4,
  },
  noticeCard: {
    backgroundColor: 'rgba(9, 32, 42, 0.85)',
    borderColor: 'rgba(20, 75, 90, 0.6)',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  noticeText: {
    color: '#F59E0B',
    fontSize: 10,
    lineHeight: 13.5,
    fontWeight: '500',
  },
  announcementCard: {
    backgroundColor: 'rgba(9, 32, 42, 0.85)',
    borderColor: 'rgba(20, 75, 90, 0.6)',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  announcementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  announcementLabel: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: 'bold',
  },
  announcementBody: {
    color: '#FDE047',
    fontSize: 10,
    lineHeight: 13.5,
  },
  sideEventCard: {
    width: 82,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: '#EC4899',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(30, 10, 45, 0.85)',
  },
  sideEventGradient: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 6,
  },
  sideEventTitle: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#FFF',
    textShadowColor: 'rgba(236, 72, 153, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  sideEventSub: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FDE047',
  },
  sideEventDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingBottom: 4,
  },
  eventDot: {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  eventDotActive: {
    width: 10,
    backgroundColor: '#FFF',
  },

  // Come on mic and chat together Banner
  comeOnMicBanner: {
    marginHorizontal: 10,
    marginTop: 5,
    marginBottom: 4,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#C084FC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 4,
  },
  comeOnMicGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  comeOnMicText: {
    color: '#FFF',
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  comeOnMicIconWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Floating Widgets on Right
  luckyFruitWidget: {
    alignItems: 'center',
    marginBottom: 8,
  },
  luckyFruitBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: '#F472B6',
  },
  luckyFruitLabel: {
    fontSize: 7.5,
    fontWeight: '900',
    color: '#FFF',
  },
  luckyDotsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  tinyDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  treasureChestWidget: {
    alignItems: 'center',
    marginBottom: 8,
  },
  treasureBar: {
    width: 32,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    marginTop: 2,
    overflow: 'hidden',
  },
  treasureBarFill: {
    width: '65%',
    height: '100%',
    backgroundColor: '#F59E0B',
  },
  floatingChatBubbleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  // Announcement Edit Modal
  announcementModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  announcementModalCard: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 12,
  },
  announcementModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  announcementModalTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  announcementTextInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    padding: 12,
    color: '#FFF',
    fontSize: 13,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  announcementModalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  announcementCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  announcementCancelText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  announcementSaveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F59E0B',
  },
  announcementSaveText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '800',
  },
});

