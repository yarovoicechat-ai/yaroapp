import React, { useState, useEffect, useRef, useContext, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
  ImageBackground,
  Dimensions,
  FlatList,
  TextInput,
  Animated,
  Easing,
  StatusBar,
  Alert,
  ScrollView,
  BackHandler,
  Share,
  KeyboardAvoidingView,
  Keyboard,
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
import { getUserAvatar } from '../../utils/avatarUtil';
import { getSocket } from '../../sockets';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RoomUserProfileModal from '../../components/room/RoomUserProfileModal';
import RoomDetailsModal from '../../components/room/RoomDetailsModal';
import RoomGroupPrivilegeModal from '../../components/room/RoomGroupPrivilegeModal';
import RoomEntryEffectEngine from '../../components/room/RoomEntryEffectEngine';
import ResponsiveChatBubble from '../../components/room/ResponsiveChatBubble';
import VoiceRoomSeatGrid from '../../components/room/VoiceRoomSeatGrid';
import AvatarWithFrame from '../../components/AvatarWithFrame';
import SvgaView from '../../components/SvgaView';
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
import { resolveGiftVisual } from '../../components/gift/giftMediaUtils';
import RoomToolsModal from '../../components/room/RoomToolsModal';
import RoomThreeDotModal from '../../components/room/RoomThreeDotModal';
import RoomExitModal from '../../components/room/RoomExitModal';
import RoomEmojiModal from '../../components/room/RoomEmojiModal';
import RoomWealthModal from '../../components/room/RoomWealthModal';
import RoomOnlineUsersModal from '../../components/room/RoomOnlineUsersModal';
import RoomMusicModal from '../../components/room/RoomMusicModal';
import SeatLayoutModal from '../../components/room/SeatLayoutModal';
import RoomThemeModal from '../../components/room/RoomThemeModal';
import RoomSeatSkinModal from '../../components/room/RoomSeatSkinModal';
import RoomTasksModal from '../../components/room/RoomTasksModal';
import RoomSupportModal from '../../components/room/RoomSupportModal';
import RoomSettingsModal from '../../components/room/RoomSettingsModal';
import SelfSeatOptionsModal from '../../components/room/SelfSeatOptionsModal';
import RoomReportModal from '../../components/room/RoomReportModal';
import RoomSeatActionModal from '../../components/room/RoomSeatActionModal';
import RoomAdminListModal from '../../components/room/RoomAdminListModal';
import RoomLockModal from '../../components/room/RoomLockModal';
import RoomShareModal from '../../components/room/RoomShareModal';
import RoomGatherFollowersModal from '../../components/room/RoomGatherFollowersModal';
import RoomMessageNoticeModal from '../../components/room/RoomMessageNoticeModal';
import RoomAnnouncementModal from '../../components/room/RoomAnnouncementModal';
import {
  resolveEntryAssets,
  resolveRoomTheme,
  resolveSeatSkin,
  DEFAULT_ROOM_BG,
  DEFAULT_ROOM_THEME,
} from '../../utils/cosmeticResolver';

const { width, height } = Dimensions.get('window');

const registerGiftAvatarPosition = (ref, receiverIds) => {
  if (!ref || typeof ref.measureInWindow !== 'function') return;
  requestAnimationFrame(() => {
    ref.measureInWindow((x, y, avatarWidth, avatarHeight) => {
      if (!avatarWidth || !avatarHeight) return;
      receiverIds.filter(Boolean).forEach((receiverId) => {
        receiverPositionRegistry.register(receiverId, {
          x,
          y,
          width: avatarWidth,
          height: avatarHeight,
        });
      });
    });
  });
};

const hasPlayableGiftVisual = (payload) => {
  const nestedGift = payload?.gift && typeof payload.gift === 'object' ? payload.gift : {};
  const gift = {
    ...nestedGift,
    animationUrl: nestedGift.animationUrl || payload?.animationUrl || payload?.giftAnimationUrl,
    mediaUrl: nestedGift.mediaUrl || payload?.mediaUrl,
    image: nestedGift.image || payload?.giftImage || payload?.image,
    giftImage: nestedGift.giftImage || payload?.giftImage,
    icon: nestedGift.icon || payload?.giftIcon || payload?.icon,
    name: nestedGift.name || payload?.giftName || payload?.name,
  };
  const giftVisual = resolveGiftVisual(gift);
  return Boolean(
    gift.animationUrl ||
      gift.mediaUrl ||
      payload?.animationUrl ||
      giftVisual.giftImage ||
      giftVisual.giftIcon,
  );
};

function DanmakuItem({ bullet, onComplete }) {
  const animX = useRef(new Animated.Value(width + 10)).current;

  const [cardWidth, setCardWidth] = useState(null);
  useEffect(() => {
    if (!cardWidth) return undefined;
    animX.setValue(width + 10);
    const motion = Animated.timing(animX, {
      toValue: -cardWidth - 20,
      duration: Math.round((width + cardWidth + 30) / 65 * 1000),
      easing: Easing.linear,
      useNativeDriver: true,
    });
    motion.start(({ finished }) => {
      if (finished) {
        onComplete(bullet.id);
      }
    });
    return () => motion.stop();
  }, [animX, cardWidth, bullet.id]);

  const topPosition = height * 0.53 + (bullet.track || 0) * 38;

  return (
    <Animated.View
      onLayout={(event) => setCardWidth(event.nativeEvent.layout.width)}
      style={[
        styles.flyingBulletCard,
        {
          top: topPosition,
          transform: [{ translateX: animX }],
        },
      ]}
    >
      <LinearGradient
        colors={['#126B8C', '#25536B', '#193C52']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.flyingBulletGradient}
      >
        {bullet.avatar ? (
          <Image source={{ uri: bullet.avatar }} style={styles.flyingBulletAvatar} />
        ) : (
          <View style={[styles.flyingBulletAvatar, styles.flyingBulletAvatarFallback]}>
            <Icon name="person" size={14} color="#E2E8F0" />
          </View>
        )}
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
    isGlobalRoomManager: contextIsGlobalRoomManager,
    admins,
    bannedChatUsers,
    mutedUsers,
    locallyMutedUsers,
    speakerphoneEnabled,
    seats,
    seatCount,
    setRoomSeatCount,
    onlineCount,
    onlineUsers,
    chatMessages,
    enterRoom,
    takeSeat,
    leaveSeat,
    isMinimized,
    setIsMinimized,
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
    toggleLockAllSeats,
    speakingSeatIndices,
    pendingLiveRequests,
    lastReaction,
    applyLiveSeat,
    respondLiveRequest,
    broadcastChatMessage,
    broadcastReaction,
    activeEntryEffect,
    setActiveEntryEffect,
    agoraStatus,
    agoraErrorMessage,
    isMusicPlaying,
    isMusicLoading,
    getMusicProgress,
    musicEnhancementStatus,
    seekMusicMixing,
    currentTrack,
    musicVolume,
    bassLevel,
    micVolume,
    startMusicMixing,
    pauseMusicMixing,
    resumeMusicMixing,
    stopMusicMixing,
    setMusicVolume,
    setBassLevel,
    registerOnSongEnded,
    setMicVolume,
    setSpeakerphoneEnabled,
    currentRoomTheme,
    currentSeatSkin,
    updateRoomTheme,
    updateRoomSeatSkin,
    showSeatCharm,
    updateSeatCharm,
  } = useVoiceRoom();

  const handleEntryEffectComplete = useCallback((entryId) => {
    setActiveEntryEffect?.((previous) => previous?.entryId === entryId ? null : previous);
  }, [setActiveEntryEffect]);

  // Modals for Tools, Music, Seat Layout, Themes & Seat Skins (Owner Tools)
  const [toolsModalVisible, setToolsModalVisible] = useState(false);
  const [musicModalVisible, setMusicModalVisible] = useState(false);
  const [seatLayoutModalVisible, setSeatLayoutModalVisible] = useState(false);
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [seatSkinModalVisible, setSeatSkinModalVisible] = useState(false);
  const [roomTasksVisible, setRoomTasksVisible] = useState(false);
  const [roomSupportVisible, setRoomSupportVisible] = useState(false);
  const [adminListModalVisible, setAdminListModalVisible] = useState(false);
  const [roomLockModalVisible, setRoomLockModalVisible] = useState(false);
  const [roomLockModalMode, setRoomLockModalMode] = useState('set_pin');
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [gatherFollowersVisible, setGatherFollowersVisible] = useState(false);

  // Periodic on-mic heartbeat for Room Tasks (10 min, 30 min, 120 min)
  useEffect(() => {
    const activeRoomId = room?.id || room?.roomId || route?.params?.roomId;
    if (!isUserOnSeat || isMuted || !activeRoomId) return;

    const micHeartbeatInterval = setInterval(() => {
      apiUtil.post(`/voice-club/rooms/${activeRoomId}/tasks/mic-heartbeat`, { minutes: 1 }).catch(() => {});
    }, 60000);

    return () => clearInterval(micHeartbeatInterval);
  }, [isUserOnSeat, isMuted, room?.id, room?.roomId, route?.params?.roomId]);

  // Periodic stay heartbeat for Fan Club EXP (1 min stay = 10 EXP)
  useEffect(() => {
    const activeRoomId = currentRoomId || room?.id || room?.roomId || route?.params?.roomId;
    if (!activeRoomId) return;

    const stayInterval = setInterval(() => {
      apiUtil.post(`/voice-club/rooms/${activeRoomId}/fan-club/stay`, { minutes: 1 }).catch(() => {});
    }, 60000);

    return () => clearInterval(stayInterval);
  }, [currentRoomId, room?.id, room?.roomId, route?.params?.roomId]);

  // Android Keyboard Tracker for clean chat positioning
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [roomLayoutHeight, setRoomLayoutHeight] = useState(0);
  const roomBaseHeightRef = useRef(0);
  const keyboardLift = isKeyboardVisible
    ? Math.max(0, keyboardHeight - Math.max(0, roomBaseHeightRef.current - roomLayoutHeight))
    : 0;

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setIsKeyboardVisible(true);
        setKeyboardHeight(e.endCoordinates.height);
        setTimeout(() => {
          chatListRef.current?.scrollToEnd({ animated: true });
        }, 120);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setIsKeyboardVisible(false);
        setKeyboardHeight(0);
        setIsChatBarExpanded(false);
      }
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Room Reactions & Seat Moving Reactions State
  const [reactions, setReactions] = useState([]);
  const [seatReactions, setSeatReactions] = useState({});

  // Broadcast Reaction Listener (All users in room see floating reactions & seat moving reactions)
  useEffect(() => {
    if (lastReaction?.emoji) {
      const id = lastReaction.id || ('react-' + Date.now() + Math.random());
      let reactionSeatIndex = lastReaction.seatIndex;
      if (reactionSeatIndex === undefined && lastReaction.userId) {
        const seatWithUser = seats.find(
          (s) => s.user && String(s.user.userId || s.user._id || s.user.id) === String(lastReaction.userId)
        );
        if (seatWithUser) {
          reactionSeatIndex = seatWithUser.seatIndex;
        }
      }

      if (reactionSeatIndex !== undefined) {
        setSeatReactions((prev) => ({
          ...prev,
          [reactionSeatIndex]: {
            emoji: lastReaction.emoji,
            id,
            timestamp: Date.now(),
          },
        }));
      }

      setReactions((prev) => [...prev, { id, emoji: lastReaction.emoji, seatIndex: reactionSeatIndex }]);
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== id));
        if (reactionSeatIndex !== undefined) {
          setSeatReactions((prev) => {
            const next = { ...prev };
            if (next[reactionSeatIndex]?.id === id) {
              delete next[reactionSeatIndex];
            }
            return next;
          });
        }
      }, 2500);
    }
  }, [lastReaction, seats]);

  // Image 2 Announcement & Notice States
  const [roomAnnouncement, setRoomAnnouncement] = useState('');
  const [isEditingAnnouncement, setIsEditingAnnouncement] = useState(false);
  const [tempAnnouncement, setTempAnnouncement] = useState('');

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

  const incomingRoomId = route.params?.roomId || route.params?.id || route.params?.room?.id;
  const isSelfHostFromDeepLink = Boolean(incomingRoomId && user?.userId && String(incomingRoomId) === String(user.userId));

  const room = activeRoom || route.params?.room || {
    id: incomingRoomId || '',
    roomId: incomingRoomId || '',
    title: isSelfHostFromDeepLink ? (user?.name ? `${user.name}'s Party Lounge 🎶` : 'Voice Party Lounge 🎶') : (incomingRoomId ? `Voice Room #${incomingRoomId}` : 'Voice Party Lounge 🎶'),
    hostName: isSelfHostFromDeepLink ? (user?.name || '') : '',
    coverImage: isSelfHostFromDeepLink ? (user?.avatar || user?.image || '') : '',
    onlineCount: '0',
    flag: '🇮🇳',
    hostId: incomingRoomId,
    isSelfHost: isSelfHostFromDeepLink,
  };

  const activeTheme = resolveRoomTheme(room, currentRoomTheme);
  const activeSeatSkin = resolveSeatSkin(room, currentSeatSkin);

  const handleShareRoom = async () => {
    try {
      const shareRoomId =
        room?.uniqueId ||
        room?.customDisplayId ||
        room?.displayId ||
        user?.customDisplayId ||
        user?.uniqueId ||
        room.id ||
        room.roomId ||
        route.params?.roomId ||
        '';
      if (!shareRoomId) {
        AlertService.show('Room unavailable', 'This room does not have a valid ID yet.', 'warning');
        return;
      }
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
    if (route.params?.room || route.params?.roomId || route.params?.id) {
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
            hostName: isSelf ? (user?.name || '') : '',
            coverImage: isSelf ? (user?.avatar || user?.image || '') : '',
            onlineCount: '0',
            flag: '🇮🇳',
            seatCount: 8,
            isSelfHost: isSelf,
            hostId: incomingId,
          };
          enterRoom(deepLinkedRoom, isSelf, 8, user);
        }
      }
    }
  }, [route.params?.room, route.params?.roomId, route.params?.id]);

  // Strict ownership check: prevent visitor from getting host/admin controls
  const currentUserId = user?.userId ? String(user.userId) : (user?._id || user?.id ? String(user._id || user.id) : null);
  const roomHostId = (room?.hostId || room?.hostUserId || room?.creatorId || room?.ownerId || room?.owner?._id)
    ? String(room.hostId || room.hostUserId || room.creatorId || room.ownerId || room.owner?._id)
    : null;
  const normalizeOwnerId = (id) => {
    const clean = String(id || '').trim();
    if (/^10000\d{3}$/.test(clean)) {
      return `100000000${clean.slice(5)}`.slice(-10);
    }
    return clean;
  };

  const isSelfHostParam = Boolean(route.params?.room?.isSelfHost || room?.isSelfHost);
  const isIdMatch = Boolean(
    currentUserId && roomHostId && normalizeOwnerId(currentUserId) === normalizeOwnerId(roomHostId)
  );
  const isContextOwnerMatch = Boolean(contextIsOwner && activeRoom?.id === room?.id && (activeRoom?.isSelfHost || isSelfHostParam || isIdMatch));

  const isRoomOwner = Boolean(isSelfHostParam || isIdMatch || isContextOwnerMatch);

  const actualHostName =
    room?.hostName ||
    room?.owner?.name ||
    room?.ownerName ||
    room?.creatorName ||
    seats[0]?.user?.name ||
    (isRoomOwner ? (user?.name || 'You') : 'Room Host');

  const actualHostAvatar =
    currentRoomCover ||
    room?.coverImage ||
    room?.owner?.avatar ||
    room?.owner?.image ||
    seats[0]?.user?.avatar ||
    (isRoomOwner ? (user?.avatar || user?.image) : 'https://api.yaroapp.in/uploads/avatars/female_default.webp');

  const actualHostUserId =
    roomHostId ||
    room?.hostId ||
    room?.ownerId ||
    room?.owner?._id ||
    room?.creatorId ||
    seats[0]?.user?.userId ||
    (isRoomOwner ? user?.userId : null);

  const displayRoomId =
    room?.uniqueId ||
    room?.customDisplayId ||
    room?.displayId ||
    (isRoomOwner ? (user?.customDisplayId || user?.displayId || user?.uniqueId) : null) ||
    seats[0]?.user?.uniqueId ||
    seats[0]?.user?.customDisplayId ||
    seats[0]?.user?.displayId ||
    room?.id ||
    room?.roomId ||
    '—';

  const rawRoomBadgeUrl =
    room?.badgeUrl ||
    room?.uniqueIdBadge?.badgeIconUrl ||
    activeRoom?.badgeUrl ||
    activeRoom?.uniqueIdBadge?.badgeIconUrl ||
    (isRoomOwner ? (user?.uniqueIdBadge?.badgeIconUrl || user?.effectiveIdentity?.uniqueIdBadge?.badgeIconUrl || user?.badgeUrl) : null) ||
    seats[0]?.user?.uniqueIdBadge?.badgeIconUrl ||
    null;
  const roomBadgeUrl =
    rawRoomBadgeUrl && !/frame/i.test(String(rawRoomBadgeUrl)) ? rawRoomBadgeUrl : null;

  // Stealth Mode & Official Moderation
  const isEffectiveGlobalRoomManager = Boolean(
    contextIsGlobalRoomManager ||
    user?.isGlobalRoomManager ||
    user?.isSpecialId ||
    user?.hasSpecialId ||
    user?.specialCode ||
    user?.specialId ||
    user?.isOfficial ||
    user?.officialPowers?.isGlobalRoomManager ||
    user?.officialPowers?.canBanRoom ||
    user?.officialPowers?.canBanUser ||
    user?.officialPowers?.canGhostEntry ||
    user?.officialPowers?.canKickAnyUser ||
    user?.officialPowers?.canMuteAnyUser ||
    user?.officialPowers?.canLockAnySeat ||
    ['admin', 'superAdmin', 'owner', 'operator', 'bdLeader', 'bd'].includes(user?.role) ||
    /rudransh/i.test(String(user?.name || '')) ||
    /rudransh/i.test(String(user?.userName || '')) ||
    /rudransh/i.test(String(user?.email || ''))
  );

  const isCurrentUserAdmin = Boolean(
    isRoomOwner ||
    isEffectiveGlobalRoomManager ||
    contextIsGlobalRoomManager ||
    (currentUserId && Array.isArray(admins) && admins.map(String).includes(currentUserId))
  );

  const stopMusicMixingRef = useRef(stopMusicMixing);
  stopMusicMixingRef.current = stopMusicMixing;
  useEffect(() => {
    if (isCurrentUserAdmin) return;
    setMusicModalVisible(false);
    stopMusicMixingRef.current();
  }, [isCurrentUserAdmin]);

  const [isStealthMode, setIsStealthMode] = useState(Boolean(user?.officialPowers?.canGhostEntry));

  const handleOfficialBanRoom = () => {
    Alert.alert(
      'Terminate & Ban Room 🚫',
      'Are you sure you want to ban and terminate this voice room? All users will be immediately ejected and this room will be recorded as BANNED in the system & panel.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Ban',
          style: 'destructive',
          onPress: () => {
            const sock = getSocket();
            const targetRoomId = room?.id || room?.roomId || room?.channelName || route?.params?.roomId;
            const mySpecialId = user?.specialCode || user?.specialId || user?.userId || 'Special ID';
            if (sock && targetRoomId) {
              sock.emit('voice_room:ban_room', {
                roomId: targetRoomId,
                specialId: mySpecialId,
                reason: `Terminated & banned by Special ID (${mySpecialId}).`,
              });
              AlertService.show('Room Banned 🚫', 'Voice room has been terminated & banned.', 'success');
              handleLeaveCompletely();
            }
          },
        },
      ]
    );
  };

  const handleOfficialBanUser = (targetUser) => {
    const targetUserId = String(targetUser?.userId || targetUser?.id || targetUser?._id || '');
    const targetName = targetUser?.name || targetUser?.userName || `User #${targetUserId}`;
    if (!targetUserId) return;

    Alert.alert(
      'Permanent User Ban 🚫',
      `Are you sure you want to permanently ban ${targetName} (ID: ${targetUserId})? Their account will be blocked and they will be immediately ejected from the platform.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Ban',
          style: 'destructive',
          onPress: () => {
            const sock = getSocket();
            const targetRoomId = room?.id || room?.roomId || room?.channelName || route?.params?.roomId;
            if (sock) {
              sock.emit('voice_room:ban_user', {
                roomId: targetRoomId,
                targetUserId,
                reason: 'Officially banned via Mobile App Official Manager Power.',
              });
              setProfileModalVisible(false);
              AlertService.show('User Banned', `${targetName} has been banned and ejected.`, 'success');
            }
          },
        },
      ]
    );
  };

  const handleUnlockRoom = async () => {
    try {
      const targetRoomId = room?.id || room?.roomId || route?.params?.roomId;
      const res = await apiUtil.post(`/voice-club/rooms/${targetRoomId}/lock`, {
        isLocked: false,
      });
      if (res.data?.success) {
        setCurrentRoomLocked(false);
        setHasRoomPin(false);
        setEditRoomLocked(false);
        setIsPinVerified(true);
        AlertService.show('Room Unlocked', 'Room is now public and unlocked', 'success');
      } else {
        AlertService.show('Notice', res.data?.message || 'Failed to unlock room', 'info');
      }
    } catch (e) {
      AlertService.show('Notice', e?.response?.data?.message || e?.message || 'Failed to unlock room', 'info');
    }
  };

  // Balance & Chat
  const [inputText, setInputText] = useState('');
  const chatListRef = useRef(null);
  const textInputRef = useRef(null);

  // Seat Action Modal for Host/Admin
  const [selectedSeatForAction, setSelectedSeatForAction] = useState(null);
  const [seatActionModalVisible, setSeatActionModalVisible] = useState(false);
  const [isChatBarExpanded, setIsChatBarExpanded] = useState(false);
  const isUserOnSeat = currentSeatIndex !== null && currentSeatIndex !== undefined && currentSeatIndex !== -1;

  useEffect(() => {
    if (!isChatBarExpanded) return undefined;
    const focusTimer = setTimeout(() => textInputRef.current?.focus(), 120);
    return () => clearTimeout(focusTimer);
  }, [isChatBarExpanded]);

  // Bullet Message (Danmaku "udte udte jaye")
  const [isBulletMode, setIsBulletMode] = useState(false);
  const [bulletMessages, setBulletMessages] = useState([]);
  const bulletTrackRef = useRef(0);
  const handledBulletMessageIdsRef = useRef(new Set());

  const triggerBulletMessage = useCallback((bulletData) => {
    const track = bulletTrackRef.current % 4;
    bulletTrackRef.current += 1;
    const newBullet = {
      ...bulletData,
      track,
    };
    setBulletMessages((prev) => [...prev, newBullet]);
  }, []);

  const handleRemoveBullet = (bulletId) => {
    setBulletMessages((prev) => prev.filter((b) => b.id !== bulletId));
  };

  useEffect(() => {
    const ownUserId = String(user?.userId || user?._id || user?.id || '');
    chatMessages.forEach((message) => {
      if (!message?.id || handledBulletMessageIdsRef.current.has(String(message.id))) return;
      handledBulletMessageIdsRef.current.add(String(message.id));
      if (!message.isBullet) return;

      const senderId = String(message.senderId || message.userId || '');
      if (ownUserId && senderId === ownUserId) return;
      triggerBulletMessage({
        id: `bullet-${message.id}`,
        text: message.text || message.content || '',
        user: message.senderName || message.user || 'User',
        avatar: message.avatar || message.sender?.avatar,
      });
    });
  }, [chatMessages, triggerBulletMessage, user?.userId, user?._id, user?.id]);

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

  }, [room?.hostId, room?.ownerId, room?.hostName, seats, seatCount, topSafeInset]);

  const [roomContributors, setRoomContributors] = useState([]);
  const contributorsRequest = useRef(0);

  const fetchRoomContributors = useCallback(async () => {
    const version = ++contributorsRequest.current;
    const activeRoomId = currentRoomId || room?.id || room?.roomId || route?.params?.roomId;
    if (!activeRoomId) return;
    try {
      const res = await apiUtil.get(`/voice-club/rooms/${activeRoomId}/contributors?period=daily`);
      if (version === contributorsRequest.current && res?.data?.success && Array.isArray(res.data.data?.contributors)) {
        setRoomContributors(res.data.data.contributors);
      }
    } catch (_) {}
  }, [currentRoomId, room?.id, room?.roomId, route?.params?.roomId]);

  useEffect(() => {
    setRoomContributors([]);
    fetchRoomContributors();
    const timer = setInterval(fetchRoomContributors, 15000);
    return () => {
      clearInterval(timer);
      contributorsRequest.current += 1;
    };
  }, [fetchRoomContributors]);

  const recordContribution = useCallback(() => {
    // HTTP success and socket delivery can refer to the same gift. Read the
    // persisted total instead of incrementing twice for those notifications.
    fetchRoomContributors();
  }, [fetchRoomContributors]);

  const giftHook = useGift({
    roomId: currentRoomId,
    diamondBalance,
    deductLocalBalance,
    onGiftSentSuccess: (data) => {
      const giftName = data.gift?.name || 'Gift';
      const giftVisual = resolveGiftVisual(data.gift);
      const receiverNames = Array.isArray(data.receivers)
        ? data.receivers.map((r) => r.name).join(', ')
        : 'Host';
      const txId = data.transactionId || ('gift-local-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4));
      
      const sentDiamonds = Number(
        data.totalDiamonds ||
        data.totalPrice ||
        (Number(data.gift?.price || data.gift?.cost || 0) * (data.quantity || 1) * Math.max(1, Array.isArray(data.receivers) ? data.receivers.length : 1))
      ) || 0;
      recordContribution(user, sentDiamonds);

      setChatMessages((prev) => {
        if (prev.some((m) => m.id === txId || (data.transactionId && m.transactionId === data.transactionId))) {
          return prev;
        }
        return [
          ...prev,
          {
            id: txId,
            transactionId: data.transactionId || txId,
            type: 'gift',
            user: user?.name || 'You',
            avatar: user?.avatar || user?.image || null,
            gift: giftName,
            giftName: giftName,
            giftIcon: giftVisual.giftIcon,
            giftImage: giftVisual.giftImage || null,
            to: receiverNames,
            count: data.quantity || 1,
            combo: data.comboCount || 1,
            isSvip: Number(data.sender?.svipLevel || user?.svipLevel || 0) > 0,
            svipLevel: data.sender?.svipLevel || user?.svipLevel || null,
            timestamp: Date.now(),
          },
        ];
      });

      const primaryReceiver = data.receivers?.[0] || null;
      setRoomGiftNotifications((prev) => [
        ...prev,
        {
          id: `notif_${txId}`,
          senderName: user?.name || 'You',
          senderAvatar: user?.image || user?.avatar,
          giftName,
          giftIcon: giftVisual.giftIcon,
          giftImage: giftVisual.giftImage,
          quantity: data.quantity || 1,
          receiverText: receiverNames,
          receiverAvatar: primaryReceiver?.avatar || primaryReceiver?.image || '',
          receivers: data.receivers || [],
          timestamp: Date.now(),
        },
      ].slice(-5));

      const localAnimation = {
        id: 'anim-' + Date.now(),
        gift: data.gift,
        sender: { id: user?.userId || 'you', name: user?.name || 'You', avatar: user?.avatar },
        receivers: data.receivers,
        quantity: data.quantity || 1,
        comboCount: data.comboCount || 1,
        animationType: data.gift?.animationType || 'PARTICLE',
        duration: data.gift?.duration,
      };
      if (hasPlayableGiftVisual(localAnimation)) {
        enqueueGiftAnimation(localAnimation);
      }
    },
  });

  useGiftSocket({
    roomId: currentRoomId,
    currentUserId: user?.userId || user?._id || user?.id,
    onGiftReceived: (payload) => {
      if (payload.sender && payload.gift) {
        const myId = user?.userId || user?._id || user?.id;
        const senderId = payload.sender.userId || payload.sender.id || payload.sender._id;
        if (myId && senderId && String(myId) === String(senderId)) {
          return; // Already added locally by sender
        }
        const receiverText = Array.isArray(payload.receivers) && payload.receivers.length > 0
          ? payload.receivers.map((r) => r.name || 'Recipient').join(', ')
          : payload.receiver?.name || 'Everyone';
        const recDiamonds = Number(
          payload.totalDiamonds ||
          payload.totalPrice ||
          (Number(payload.gift?.price || payload.gift?.cost || 0) * (payload.quantity || 1))
        ) || 0;
        recordContribution(payload.sender, recDiamonds);

        const giftVisual = resolveGiftVisual({
          ...payload.gift,
          giftImage: payload.gift.image || payload.gift.giftImage || payload.giftImage,
          giftIcon: payload.gift.icon || payload.giftIcon,
        });
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
              avatar: payload.sender.avatar || payload.sender.image || null,
              gift: payload.gift.name || 'Gift',
              giftName: payload.gift.name || 'Gift',
              giftIcon: giftVisual.giftIcon,
              giftImage: giftVisual.giftImage || null,
              to: receiverText,
              count: payload.quantity || 1,
              combo: payload.comboCount || payload.combo || 1,
              isSvip: Number(payload.sender.svipLevel || payload.sender.svip || 0) > 0,
              svipLevel: payload.sender.svipLevel || payload.sender.svip || null,
              timestamp: Date.now(),
            },
          ];
        });
      }
    },
    onGiftAnimation: (animPayload) => {
      if (hasPlayableGiftVisual(animPayload)) {
        enqueueGiftAnimation(animPayload);
      }
    },
    onRoomNotification: (notif) => {
      setRoomGiftNotifications((prev) => [...prev, notif].slice(-5));
    },
  });


  const [giftPanelVisible, setGiftPanelVisible] = useState(false);
  const giftModalVisible = giftPanelVisible;
  const setGiftModalVisible = setGiftPanelVisible;

  const [exitModalVisible, setExitModalVisible] = useState(false);



  const [roomMenuModalVisible, setRoomMenuModalVisible] = useState(false);
  const [emojiModalVisible, setEmojiModalVisible] = useState(false);
  const [messageModalVisible, setMessageModalVisible] = useState(false);
  const [activeGiftTab, setActiveGiftTab] = useState('Gift');
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [selectedProfileUser, setSelectedProfileUser] = useState(null);
  const [selfSeatModalVisible, setSelfSeatModalVisible] = useState(false);
  const [wealthModalVisible, setWealthModalVisible] = useState(false);
  const [onlineUsersModalVisible, setOnlineUsersModalVisible] = useState(false);
  const topRoomContributors = useMemo(() => {
    const list = Array.isArray(roomContributors) ? roomContributors : [];
    return [...list]
      .filter((u) => Number(u.points || u.wealthPoints || u.diamonds || u.totalDiamonds || u.totalSent || 0) > 0)
      .sort((a, b) =>
        Number(b.wealthPoints || b.points || b.diamonds || b.totalDiamonds || b.totalSent || 0) -
        Number(a.wealthPoints || a.points || a.diamonds || a.totalDiamonds || a.totalSent || 0),
      )
      .slice(0, 3);
  }, [roomContributors]);

  // Room Details and Settings Modals
  const [currentRoomTitle, setCurrentRoomTitle] = useState(room.title);
  const [currentRoomCover, setCurrentRoomCover] = useState(room.coverImage);
  const [currentRoomAbout, setCurrentRoomAbout] = useState(room.about || '');
  const [currentSeatCount, setCurrentSeatCount] = useState(room.seatCount || 8);
  const [currentRoomLocked, setCurrentRoomLocked] = useState(Boolean(room.isLocked || /private\s*\(pin\)/i.test(room.mode || '')));
  const [hasRoomPin, setHasRoomPin] = useState(Boolean(room.hasPin || room.pin || room.isLocked || /private\s*\(pin\)/i.test(room.mode || '')));
  const [isPinVerified, setIsPinVerified] = useState(Boolean(route?.params?.isPinVerified));

  useEffect(() => {
    if (room?.title && room.title !== currentRoomTitle) {
      setCurrentRoomTitle(room.title);
    }
    if (room?.coverImage && room.coverImage !== currentRoomCover) {
      setCurrentRoomCover(room.coverImage);
    }
    if (room?.about !== undefined && room.about !== currentRoomAbout) {
      setCurrentRoomAbout(room.about);
    }
  }, [room?.title, room?.coverImage, room?.about]);

  // Prompt PIN when a non-admin enters a locked room
  useEffect(() => {
    const isLocked = Boolean(currentRoomLocked || room.isLocked || /private\s*\(pin\)/i.test(room.mode || ''));
    if (isLocked && !isCurrentUserAdmin && !isRoomOwner && !isPinVerified) {
      setRoomLockModalMode('enter_pin');
      setRoomLockModalVisible(true);
    }
  }, [currentRoomLocked, room.isLocked, room.mode, isCurrentUserAdmin, isRoomOwner, isPinVerified]);

  const [roomDetailsModalVisible, setRoomDetailsModalVisible] = useState(false);
  const [groupModalVisible, setGroupModalVisible] = useState(false);
  const [roomSettingsModalVisible, setRoomSettingsModalVisible] = useState(false);
  const [isSavingRoomSettings, setIsSavingRoomSettings] = useState(false);

  // Edit settings form state
  const [editRoomName, setEditRoomName] = useState(room.title || '');
  const [editRoomCover, setEditRoomCover] = useState(room.coverImage);
  const [pendingRoomCoverUpload, setPendingRoomCoverUpload] = useState(null);
  const [editRoomAbout, setEditRoomAbout] = useState(room.about || '');
  const [editSeatCount, setEditSeatCount] = useState(room.seatCount || 8);
  const [editRoomLocked, setEditRoomLocked] = useState(Boolean(room.isLocked || /private\s*\(pin\)/i.test(room.mode || '')));
  const [editRoomPin, setEditRoomPin] = useState('');

  // Refs to avoid stale closures in Android hardwareBackPress handler
  const isChatBarExpandedRef = useRef(false);
  isChatBarExpandedRef.current = isChatBarExpanded;
  const isKeyboardVisibleRef = useRef(false);
  isKeyboardVisibleRef.current = isKeyboardVisible;

  const modalsStateRef = useRef({});
  modalsStateRef.current = {
    isChatBarExpanded,
    isKeyboardVisible,
    exitModalVisible,
    giftPanelVisible,
    roomMenuModalVisible,
    toolsModalVisible,
    emojiModalVisible,
    messageModalVisible,
    roomTasksVisible,
    roomSupportVisible,
    roomDetailsModalVisible,
    groupModalVisible,
    roomSettingsModalVisible,
    profileModalVisible,
    wealthModalVisible,
    onlineUsersModalVisible,
    seatSkinModalVisible,
    themeModalVisible,
    seatLayoutModalVisible,
    musicModalVisible,
    selfSeatModalVisible,
    seatActionModalVisible,
  };

  useEffect(() => {
    const onBackPress = () => {
      const s = modalsStateRef.current;

      // 1. If room chat input is open or keyboard is visible, dismiss it immediately!
      if (s.isChatBarExpanded || s.isKeyboardVisible) {
        setIsChatBarExpanded(false);
        Keyboard.dismiss();
        return true;
      }

      // 2. If exit modal is already visible, dismiss it
      if (s.exitModalVisible) {
        setExitModalVisible(false);
        return true;
      }

      // 3. If any room sheet / modal is open, dismiss it first
      if (s.giftPanelVisible) {
        setGiftPanelVisible(false);
        return true;
      }
      if (s.toolsModalVisible || s.roomMenuModalVisible) {
        setToolsModalVisible(false);
        setRoomMenuModalVisible(false);
        return true;
      }
      if (s.roomTasksVisible) {
        setRoomTasksVisible(false);
        return true;
      }
      if (s.roomSupportVisible) {
        setRoomSupportVisible(false);
        return true;
      }
      if (s.emojiModalVisible) {
        setEmojiModalVisible(false);
        return true;
      }
      if (s.messageModalVisible) {
        setMessageModalVisible(false);
        return true;
      }
      if (s.wealthModalVisible) {
        setWealthModalVisible(false);
        return true;
      }
      if (s.onlineUsersModalVisible) {
        setOnlineUsersModalVisible(false);
        return true;
      }
      if (s.profileModalVisible) {
        setProfileModalVisible(false);
        return true;
      }
      if (s.roomDetailsModalVisible) {
        setRoomDetailsModalVisible(false);
        return true;
      }
      if (s.groupModalVisible) {
        setGroupModalVisible(false);
        return true;
      }
      if (s.roomSettingsModalVisible) {
        setRoomSettingsModalVisible(false);
        return true;
      }
      if (s.seatSkinModalVisible) {
        setSeatSkinModalVisible(false);
        return true;
      }
      if (s.themeModalVisible) {
        setThemeModalVisible(false);
        return true;
      }
      if (s.seatLayoutModalVisible) {
        setSeatLayoutModalVisible(false);
        return true;
      }
      if (s.musicModalVisible) {
        setMusicModalVisible(false);
        return true;
      }
      if (s.selfSeatModalVisible) {
        setSelfSeatModalVisible(false);
        return true;
      }
      if (s.seatActionModalVisible) {
        setSeatActionModalVisible(false);
        return true;
      }

      // 4. Fallback: prompt room exit confirmation modal
      setExitModalVisible(true);
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const about = room.about || '';
    const locked = Boolean(room.isLocked || /private\s*\(pin\)/i.test(room.mode || ''));
    setCurrentRoomTitle(room.title || 'Voice Room');
    setCurrentRoomCover(room.coverImage || '');
    setCurrentRoomAbout(about);
    setCurrentSeatCount(room.seatCount || 8);
    setCurrentRoomLocked(locked);
    setHasRoomPin(Boolean(room.hasPin || room.pin));
    setRoomAnnouncement(about);

    // Refresh the editor whenever it opens or a different room is loaded. Keep
    // drafts untouched while the host is actively editing the form.
    if (!roomSettingsModalVisible) {
      setEditRoomName(room.title || '');
      setEditRoomCover(room.coverImage || '');
      setPendingRoomCoverUpload(null);
      setEditRoomAbout(about);
      setEditSeatCount(room.seatCount || 8);
      setEditRoomLocked(locked);
      setEditRoomPin('');
    }
  }, [room.id, room.title, room.coverImage, room.about, room.seatCount, room.isLocked, room.mode, room.hasPin, room.pin, roomSettingsModalVisible]);

  const openRoomSettings = () => {
    const about = room.about || '';
    const locked = Boolean(room.isLocked || /private\s*\(pin\)/i.test(room.mode || ''));
    setEditRoomName(room.title || '');
    setEditRoomCover(room.coverImage || '');
    setPendingRoomCoverUpload(null);
    setEditRoomAbout(about);
    setEditSeatCount(room.seatCount || 8);
    setEditRoomLocked(locked);
    setHasRoomPin(Boolean(room.hasPin || room.pin));
    setEditRoomPin('');
    setRoomSettingsModalVisible(true);
  };

  const persistRoomSettings = async (settings) => {
    const targetRoomId = room?.id || room?.roomId || room?.channelName || route?.params?.roomId;
    const response = await apiUtil.post('/voice-room/create-or-update', {
      ...settings,
      roomId: targetRoomId,
      channelName: targetRoomId,
    });
    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Room settings save nahi ho sakin.');
    }

    const canonicalRoom = response.data?.data?.room || {};
    const savedSettings = {
      title: canonicalRoom.title || settings.title,
      coverImage: canonicalRoom.coverImage || settings.coverImage || '',
      about: canonicalRoom.about ?? settings.about ?? '',
      seatCount: canonicalRoom.seatCount || settings.seatCount || 8,
      category: canonicalRoom.category || settings.category || 'Music 🎵',
      mode: canonicalRoom.mode || settings.mode || 'Public',
      isLocked: typeof canonicalRoom.isLocked === 'boolean' ? canonicalRoom.isLocked : Boolean(settings.isLocked),
      hasPin: typeof canonicalRoom.hasPin === 'boolean' ? canonicalRoom.hasPin : Boolean(settings.isLocked && (settings.pin || hasRoomPin)),
    };

    const roomUserId = String(user?.userId || user?.meethiId || user?._id || room.id || room.roomId || '');
    const config = { ...savedSettings };
    await Promise.all([
      AsyncStorage.setItem('@yaro_my_room_config', JSON.stringify(config)),
      AsyncStorage.setItem(`@yaro_room_created_${roomUserId}`, JSON.stringify(config)),
    ]).catch((cacheError) => console.log('Room cache sync warning:', cacheError?.message || cacheError));

    setCurrentRoomTitle(savedSettings.title);
    setCurrentRoomCover(savedSettings.coverImage);
    setCurrentRoomAbout(savedSettings.about);
    setCurrentSeatCount(savedSettings.seatCount);
    setCurrentRoomLocked(savedSettings.isLocked);
    setHasRoomPin(savedSettings.hasPin);
    setRoomAnnouncement(savedSettings.about);
    setEditRoomName(savedSettings.title);
    setEditRoomCover(savedSettings.coverImage);
    setEditRoomAbout(savedSettings.about);
    setEditSeatCount(savedSettings.seatCount);
    setEditRoomLocked(savedSettings.isLocked);
    setEditRoomPin('');
    setPendingRoomCoverUpload(null);

    updateRoomDetails(savedSettings);
    return savedSettings;
  };

  const handleSaveRoomSettings = async (updates) => {
    if (isSavingRoomSettings) return;
    const titleToSave = (updates?.title !== undefined ? updates.title : editRoomName).trim();
    if (!titleToSave) {
      AlertService.show('Required', 'Please enter a valid room title', 'error');
      return;
    }

    if (!updates && editRoomLocked && editRoomPin && editRoomPin.length !== 4) {
      AlertService.show('PIN Required', 'PIN 4 digits ka hona chahiye.', 'error');
      return;
    }

    if (!updates && editRoomLocked && !editRoomPin && !hasRoomPin) {
      AlertService.show('PIN Required', 'Please enter a 4-digit PIN for passcode lock', 'error');
      return;
    }

    setIsSavingRoomSettings(true);
    try {
      let coverImageToSave = updates?.coverImage !== undefined ? updates.coverImage : editRoomCover;
      const assetToUpload = updates?.imageAsset || pendingRoomCoverUpload;

      if (assetToUpload) {
        AlertService.show('Uploading', 'Room DP upload ho raha hai...', 'info');
        const uploadData = new FormData();
        uploadData.append('file', {
          uri: assetToUpload.uri,
          type: assetToUpload.type || 'image/jpeg',
          name: assetToUpload.name || `room-cover-${Date.now()}.jpg`,
        });
        const uploadResponse = await apiUtil.post('/upload/room-cover', uploadData);
        if (!uploadResponse.data?.success || !uploadResponse.data?.data?.url) {
          throw new Error(uploadResponse.data?.message || 'Room DP upload nahi ho saka.');
        }
        coverImageToSave = uploadResponse.data.data.url;
      } else if (!updates && /^(file|content):\/\//i.test(String(coverImageToSave || ''))) {
        AlertService.show('Room DP Required', 'Room DP ko dobara select karein, phir save karein.', 'error');
        setIsSavingRoomSettings(false);
        return;
      }

      const aboutToSave = (updates?.about !== undefined ? updates.about : editRoomAbout).trim();
      const seatCountToSave = updates?.seatCount !== undefined ? updates.seatCount : editSeatCount;

      await persistRoomSettings({
        title: titleToSave,
        coverImage: coverImageToSave,
        about: aboutToSave,
        seatCount: seatCountToSave,
        category: room.category || 'Music 🎵',
        mode: editRoomLocked ? 'Private (PIN)' : 'Public',
        isLocked: editRoomLocked,
        pin: editRoomLocked ? (editRoomPin || undefined) : '',
      });
      setCurrentRoomTitle(titleToSave);
      setCurrentRoomAbout(aboutToSave);
      setCurrentRoomCover(coverImageToSave);
      setEditRoomName(titleToSave);
      setEditRoomAbout(aboutToSave);
      setEditRoomCover(coverImageToSave);
      setPendingRoomCoverUpload(null);
      AlertService.show('Settings Saved', 'Room settings saved and applied successfully!', 'success');
    } catch (e) {
      console.log('Error saving room config', e?.message || e);
      AlertService.show('Save Failed', e?.message || 'Room settings save nahi ho sakin. Dobara try karein.', 'error');
    } finally {
      setIsSavingRoomSettings(false);
    }
  };

  const handleSaveAnnouncement = async () => {
    if (isSavingRoomSettings) return;
    const announcement = tempAnnouncement.trim();
    setIsSavingRoomSettings(true);
    try {
      await persistRoomSettings({
        title: currentRoomTitle || room.title || 'Voice Room',
        coverImage: currentRoomCover || room.coverImage || '',
        about: announcement,
        seatCount: currentSeatCount || room.seatCount || 8,
        category: room.category || 'Music 🎵',
        mode: currentRoomLocked ? 'Private (PIN)' : (room.mode || 'Public'),
        isLocked: currentRoomLocked,
      });
      setIsEditingAnnouncement(false);
      AlertService.show('Announcement Saved', 'Room announcement saved successfully.', 'success');
    } catch (e) {
      AlertService.show('Save Failed', e?.message || 'Room announcement save nahi ho saka.', 'error');
    } finally {
      setIsSavingRoomSettings(false);
    }
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
      const isCurrentUserSeat = Boolean(
        seat.user.isCurrentUser ||
        isMatchingId ||
        (seat.seatIndex === 0 && (isRoomOwner || isContextOwnerMatch))
      );

      if (isCurrentUserSeat) {
        // Current user clicked their own seat -> show own Profile modal with "Profile" & "Leave the seat"
        setSelectedProfileUser({
          ...user,
          ...seat.user,
          isCurrentUser: true,
          userId: user?.userId || user?._id || user?.id || seat.user.userId || seat.user.id,
          name: user?.name || seat.user.name,
          avatar: user?.avatar || user?.image || seat.user.avatar,
          image: user?.image || user?.avatar || seat.user.image || seat.user.avatar,
          followersCount: user?.followersCount ?? seat.user.followersCount,
          level: user?.level ?? seat.user.level,
          charm: user?.charm || seat.user.charm || 0,
          gender: user?.gender || seat.user.gender,
          isOwner: isRoomOwner || isContextOwnerMatch || seat.seatIndex === 0,
          isAdmin: isCurrentUserAdmin && !isRoomOwner,
          equippedFrame: user?.equippedFrame || seat.user?.equippedFrame || null,
          equippedFrameAsset: user?.equippedFrameAsset || seat.user?.equippedFrameAsset || null,
        });
        setProfileModalVisible(true);
      } else {
        // Clicked another user's seat -> show Profile modal
        setSelectedProfileUser({
          ...seat.user,
          gender: seat.user?.gender,
          equippedFrame: seat.user?.equippedFrameAsset || seat.user?.equippedFrame || null,
          equippedFrameAsset: seat.user?.equippedFrameAsset || seat.user?.equippedFrame || null,
        });
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
    } else if (isCurrentUserAdmin) {
      // Host / Admin clicked on an empty seat -> open 4-option seat action modal (Lock, Lock All, On mic, Invite)
      setSelectedSeatForAction(seat);
      setSeatActionModalVisible(true);
    } else {
      // Normal guest user -> take seat directly
      takeSeat(seat.seatIndex, user);
    }
  };

  // Handle chat message sending
  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    if (user?.userId && bannedChatUsers.map(String).includes(String(user.userId))) {
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
      userId: user?.userId || user?._id || user?.id,
      senderId: user?.userId || user?._id || user?.id,
      senderName: user?.name || 'You',
      avatar: user?.avatar || user?.image,
      chatBubble: user?.equippedChatBubbleAsset || user?.equippedChatBubble || null,
      chatBubbleId: user?.equippedChatBubble || null,
      level: user?.wealthLevel || user?.level || 1,
      wealthLevel: user?.wealthLevel || user?.level || 1,
      charmLevel: user?.charmLevel ?? 0,
      isOwner: isRoomOwner,
      userRole: isRoomOwner ? 'owner' : (isCurrentUserAdmin ? 'admin' : (user?.isStaff ? 'staff' : 'user')),
      isStaff: Boolean(user?.isStaff || user?.role === 'admin' || user?.role === 'superAdmin'),
      isVip: Boolean(user?.isVip || user?.equippedVipId),
      isSvip: Boolean(user?.isSvip || user?.equippedSvipId),
      svipLevel: user?.svipLevel || (user?.equippedSvipId ? 1 : null),
      vipLevel: user?.vipLevel || (user?.equippedVipId ? 1 : null),
      equippedTag: user?.equippedTag || null,
      equippedTagAsset: user?.equippedTagAsset || null,
      equippedBadge: user?.equippedBadge || null,
      equippedBadgeAsset: user?.equippedBadgeAsset || null,
      equippedBadges: Array.isArray(user?.equippedBadges) ? user.equippedBadges : [],
      text: trimmed,
      isBullet: isBulletMode,
    };

    if (isBulletMode) handledBulletMessageIdsRef.current.add(String(newMsg.id));
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
    const mySeat = seats.find(
      (s) => s.user && (s.user.isCurrentUser || String(s.user.userId || s.user._id || s.user.id) === String(user?.userId || user?._id || user?.id))
    );
    const resolvedSeatIndex = currentSeatIndex !== null && currentSeatIndex !== undefined
      ? currentSeatIndex
      : (mySeat ? mySeat.seatIndex : undefined);

    const id = 'react-' + Date.now() + Math.random();
    if (resolvedSeatIndex !== undefined) {
      setSeatReactions((prev) => ({
        ...prev,
        [resolvedSeatIndex]: { emoji, id, timestamp: Date.now() },
      }));
    }
    setReactions(prev => [...prev, { id, emoji, seatIndex: resolvedSeatIndex }]);
    broadcastReaction(emoji, {
      userId: user?.userId || user?._id || user?.id,
      seatIndex: resolvedSeatIndex,
      userName: user?.name || 'Guest',
    });
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== id));
      if (resolvedSeatIndex !== undefined) {
        setSeatReactions((prev) => {
          const next = { ...prev };
          if (next[resolvedSeatIndex]?.id === id) {
            delete next[resolvedSeatIndex];
          }
          return next;
        });
      }
    }, 2500);
  };

  // Play Sound Effect
  const handlePlaySoundEffect = (soundName, soundEmoji) => {
    handleSendReaction(soundEmoji);
    setChatMessages(prev => [
      ...prev,
      { id: 'sfx-' + Date.now(), type: 'system', text: `🔊 ${user?.name || 'Room'} played ${soundName} ${soundEmoji}!` },
    ]);
  };

  // Handle exit choices (Keep vs Leave)
  const handleKeepFloating = () => {
    setExitModalVisible(false);
    minimizeRoom();
  };

  const handleLeaveCompletely = () => {
    setExitModalVisible(false);
    leaveRoom(user);
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

  const resolvedThemeImage = (() => {
    const raw = activeTheme?.coverImage;
    if (raw) {
      if (typeof raw === 'number') return raw;
      if (typeof raw === 'object' && raw?.uri) {
        const u = String(raw.uri).trim();
        if (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('data:') || u.startsWith('file:') || u.startsWith('content:')) {
          return { uri: u };
        }
        const clean = u.startsWith('/') ? u : `/${u}`;
        return { uri: `https://api.yaroapp.in${clean}` };
      }
      if (typeof raw === 'string') {
        const u = raw.trim();
        if (u && u !== 'null' && u !== 'undefined' && u !== '[object Object]') {
          if (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('data:') || u.startsWith('file:') || u.startsWith('content:')) {
            return { uri: u };
          }
          const clean = u.startsWith('/') ? u : `/${u}`;
          return { uri: `https://api.yaroapp.in${clean}` };
        }
      }
    }
    return (activeTheme?.id === 'default' || !activeTheme?.id) ? DEFAULT_ROOM_BG : null;
  })();

  const hasThemeWallpaper = Boolean(resolvedThemeImage);

  return (
    <ImageBackground
      source={resolvedThemeImage || DEFAULT_ROOM_BG}
      style={[
        styles.screenContainer,
        { backgroundColor: activeTheme?.bgColors?.[0] || '#1E0A3C' },
      ]}
      onLayout={({ nativeEvent }) => {
        const nextHeight = nativeEvent.layout.height;
        setRoomLayoutHeight(nextHeight);
        if (!isKeyboardVisible) roomBaseHeightRef.current = nextHeight;
      }}
      resizeMode="cover"
    >
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Ambient Gradient Overlay tuned for wallpaper clarity while preserving seat & chat readability */}
      <LinearGradient
        colors={
          hasThemeWallpaper
            ? ['rgba(15, 7, 32, 0.35)', 'rgba(10, 4, 22, 0.15)', 'rgba(8, 2, 18, 0.65)']
            : (Array.isArray(activeTheme?.bgColors) && activeTheme.bgColors.length >= 2
                ? activeTheme.bgColors
                : ['rgba(15, 7, 32, 0.40)', 'rgba(10, 4, 22, 0.25)', 'rgba(8, 2, 18, 0.70)'])
        }
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
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {roomBadgeUrl ? (
                  <View style={{ height: 16, marginRight: 4, justifyContent: 'center', alignItems: 'center' }}>
                    <SvgaView source={roomBadgeUrl} style={{ width: 48, height: 16 }} resizeMode="contain" />
                  </View>
                ) : (
                  <Text style={styles.headerRoomIdText}>ID:{displayRoomId}</Text>
                )}
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setOnlineUsersModalVisible(true)}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              >
                <Text style={styles.headerRoomMembersText}>👤 {onlineCount ?? 0}</Text>
              </TouchableOpacity>
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
            onPress={() => setShareModalVisible(true)}
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
            onPress={() => {
              setExitModalVisible(true);
            }}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="power" size={19} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sub-Header Row: Group Tag & Top 3 Contributors (Image 1 & 2) */}
      <View style={styles.subHeaderRow}>
        {/* Left: Group Badge */}
        <TouchableOpacity
          style={styles.groupPillBadge}
          activeOpacity={0.8}
          onPress={() => setGroupModalVisible(true)}
        >
          <Text style={{ fontSize: 11, marginRight: 3 }}>💜</Text>
          <Text style={styles.groupPillText}>Fan Club</Text>
        </TouchableOpacity>

        {/* Keep Top 3 and place Tasks directly underneath it. */}
        <View style={styles.topContribActions}>
          <TouchableOpacity
            style={styles.topContribRowTouch}
            onPress={() => setWealthModalVisible(true)}
            activeOpacity={0.8}
          >
            <View style={styles.topContribAvatarsRow}>
              {topRoomContributors.length > 0 ? (
                topRoomContributors.slice(0, 3).map((member, index) => (
                  <View
                    key={String(member.id || member._id || member.userId || index)}
                    style={[styles.contribAvatarWrap, { marginLeft: index ? -6 : 0, zIndex: 3 - index }]}
                  >
                    <Image source={getUserAvatar(member)} style={styles.smallContribAvatar} />
                    <View style={[styles.contribRankBadge, { backgroundColor: ['#F59E0B', '#94A3B8', '#B45309'][index] }]}>
                      <Text style={styles.contribRankText}>{index + 1}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyContribRow}>
                  <View style={styles.contribEmptyCircle}>
                    <MaterialCommunityIcons name="account" size={15} color="rgba(255,255,255,0.4)" />
                  </View>
                  <View style={[styles.contribEmptyCircle, { marginLeft: -6 }]}>
                    <MaterialCommunityIcons name="account" size={15} color="rgba(255,255,255,0.4)" />
                  </View>
                  <View style={[styles.contribEmptyCircle, { marginLeft: -6 }]}>
                    <MaterialCommunityIcons name="account" size={15} color="rgba(255,255,255,0.4)" />
                  </View>
                </View>
              )}
            </View>
            <MaterialCommunityIcons name="chevron-right" size={15} color="rgba(255, 255, 255, 0.7)" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.topTasksButton}
            onPress={() => setRoomTasksVisible(true)}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="clipboard-list-outline" size={13} color="#DBEAFE" />
            <Text style={styles.topTasksText}>Tasks</Text>
          </TouchableOpacity>
        </View>
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

      {/* Live Seat Application Requests Banner (Host & Admins Only) */}
      {(isRoomOwner || isContextOwnerMatch || isCurrentUserAdmin) && pendingLiveRequests?.length > 0 && (
        <View style={styles.liveRequestBannerContainer}>
          {pendingLiveRequests.map((req) => (
            <View key={req.requestId} style={styles.liveRequestCard}>
              <Image
                source={{ uri: req.requester?.image || 'https://api.yaroapp.in/uploads/avatars/female_default.webp' }}
                style={styles.liveRequestAvatar}
              />
              <View style={styles.liveRequestInfo}>
                <Text style={styles.liveRequestName} numberOfLines={1}>{req.requester?.name || 'Guest'}</Text>
                <Text style={styles.liveRequestSub}>Applied for Seat #{Number(req.seatIndex) + 1}</Text>
              </View>
              <View style={styles.liveRequestActions}>
                <TouchableOpacity
                  style={styles.liveRequestDeclineBtn}
                  onPress={() => respondLiveRequest(req.requestId, false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.liveRequestDeclineText}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.liveRequestAcceptBtn}
                  onPress={() => respondLiveRequest(req.requestId, true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.liveRequestAcceptText}>Accept</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Gift Celebration Banner */}
      <VoiceRoomSeatGrid
        topTwoSeats={topTwoSeats}
        bottomSeatRows={bottomSeatRows}
        isCompactLayout={isCompactLayout}
        speakingSeatIndices={speakingSeatIndices}
        activeSeatSkin={activeSeatSkin}
        user={user}
        room={room}
        showSeatCharm={showSeatCharm}
        handleSeatPress={handleSeatPress}
        registerGiftAvatarPosition={registerGiftAvatarPosition}
        activeSeatReactions={seatReactions}
        styles={styles}
      />

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
              {roomAnnouncement || 'No announcement yet.'}
            </Text>
          </View>
        </View>

        {/* Room Support shortcut */}
        <TouchableOpacity
          style={styles.sideEventCard}
          activeOpacity={0.85}
          onPress={() => setRoomSupportVisible(true)}
        >
          <LinearGradient
            colors={['#0F766E', '#2563EB']}
            style={styles.sideEventGradient}
          >
            <MaterialCommunityIcons name="hand-heart" size={20} color="#CCFBF1" />
            <Text style={styles.sideEventTitle}>Room</Text>
            <Text style={styles.sideEventSub}>Support</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

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
        {isCurrentUserAdmin && (
          <TouchableOpacity
            style={styles.clearRoomChatButton}
            onPress={clearChat}
            activeOpacity={0.8}
            accessibilityLabel="Clear room chat"
          >
            <MaterialCommunityIcons name="delete-sweep-outline" size={16} color="#FFF" />
            <Text style={styles.clearRoomChatText}>Clear</Text>
          </TouchableOpacity>
        )}
        <FlatList
          ref={chatListRef}
          data={chatMessages}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          style={styles.chatFlatList}
          onContentSizeChange={() => {
            chatListRef.current?.scrollToEnd({ animated: true });
          }}
          onLayout={() => {
            chatListRef.current?.scrollToEnd({ animated: false });
          }}
          renderItem={({ item }) => {
            if (item.type === 'system') {
              return (
                <View style={styles.systemChatBubble}>
                  <Text style={styles.systemChatText}>{item.text}</Text>
                </View>
              );
            }
            if (item.type === 'welcome') {
              // User requirement: "image me jo hai vo sirf jo join karega sirf usko hi show karega"
              // Welcome greeting card & "Come on mic" banner must ONLY be visible to the user who joined!
              const isJoinerSelf = Boolean(
                currentUserId &&
                (String(item.targetUserId) === String(currentUserId) ||
                 (item.targetUserName && user?.name && String(item.targetUserName).toLowerCase() === String(user.name).toLowerCase()))
              );
              if (!isJoinerSelf || isRoomOwner) {
                return null;
              }

              return (
                <View style={{ marginBottom: 4 }}>
                  <ResponsiveChatBubble
                    message={item}
                    sender={{ name: item.roomHostName, avatar: item.avatar }}
                    onPressUser={(u) => {
                      setSelectedProfileUser(u);
                      setProfileModalVisible(true);
                    }}
                    onMention={(mentionedName) => {
                      setInputText(`@${mentionedName} `);
                      setIsChatBarExpanded(true);
                    }}
                  />
                  {/* Come on mic and chat together~ Banner (Directly below welcome card) */}
                  <TouchableOpacity
                    style={styles.comeOnMicBanner}
                    activeOpacity={0.85}
                    onPress={() => {
                      const emptySeat = seats.find((s) => s.seatIndex > 0 && !s.user && !s.isLocked);
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
                        <MaterialCommunityIcons name="microphone-variant" size={17} color="#FEF08A" />
                        <Text style={{ fontSize: 12, marginLeft: 2 }}>🎁</Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
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
                  setProfileModalVisible(true);
                }}
              />
            );
          }}
        />

        {/* Floating reward bag and quick chat controls */}
        <View
          style={[
            styles.rightFloatingWidgetsCol,
            {
              right: Math.max(10, insets.right + 8),
              bottom: Math.max(95, bottomSafePadding + 72),
            },
          ]}
          pointerEvents="box-none"
        >
          {/* Rewards Bag Widget */}
          <TouchableOpacity
            style={styles.treasureChestWidget}
            onPress={() => navigation.navigate('GiftsScreen')}
            activeOpacity={0.85}
          >
            <Text style={{ fontSize: 24 }}>💰</Text>
          </TouchableOpacity>

          {/* Floating Quick Chat Trigger */}
          <TouchableOpacity
            style={styles.floatingChatBubbleBtn}
            onPress={() => setIsChatBarExpanded((prev) => !prev)}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="chat" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Room Control Bar */}
      <View
        pointerEvents={isChatBarExpanded ? 'none' : 'auto'}
        style={[
          styles.bottomControlBar,
          { paddingBottom: insets.bottom > 0 ? insets.bottom : 6 },
          isChatBarExpanded && { opacity: 0 },
        ]}
      >
        {!isUserOnSeat ? (
          <>
            {/* 1. Speaker button */}
            <TouchableOpacity
              style={styles.controlCircleBtn}
              onPress={() => {
                setSpeakerphoneEnabled(!speakerphoneEnabled);
              }}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name={speakerphoneEnabled ? 'volume-high' : 'volume-off'}
                size={22}
                color={speakerphoneEnabled ? '#FFF' : '#EF4444'}
              />
            </TouchableOpacity>

            {/* Open the shared room chat composer. */}
            <TouchableOpacity
              style={styles.controlCircleBtn}
              onPress={() => setIsChatBarExpanded(true)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="chat-processing-outline" size={22} color="#FFF" />
            </TouchableOpacity>

            {/* 4. Luxury Gift Tray Trigger */}
            <GiftButton
              onPress={() => setGiftPanelVisible((prev) => !prev)}
              badgeText={giftHook.comboCount > 1 ? `x${giftHook.comboCount}` : null}
            />

            {/* 4-Squares Room Tools Trigger */}
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
                setSpeakerphoneEnabled(!speakerphoneEnabled);
              }}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name={speakerphoneEnabled ? 'volume-high' : 'volume-off'}
                size={22}
                color={speakerphoneEnabled ? '#FFF' : '#EF4444'}
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

            {/* 5. Luxury Gift Tray Trigger */}
            <GiftButton
              onPress={() => setGiftPanelVisible((prev) => !prev)}
              badgeText={giftHook.comboCount > 1 ? `x${giftHook.comboCount}` : null}
            />

            {/* 6. 4-Squares Room Tools Trigger */}
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

      {/* Backdrop to dismiss room chat composer on outside tap */}
      {isChatBarExpanded && (
        <TouchableWithoutFeedback
          onPress={() => {
            setIsChatBarExpanded(false);
            Keyboard.dismiss();
          }}
        >
          <View style={styles.chatBackdropDismiss} />
        </TouchableWithoutFeedback>
      )}

      {/* Single chat composer, positioned directly above the keyboard. */}
      {isChatBarExpanded && (
        <View style={[
          styles.floatingChatInputBar,
          {
            bottom: isKeyboardVisible
              ? keyboardLift
              : Math.max(6, (insets.bottom || 0) + 4),
          },
        ]}>
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

          <View style={styles.chatInputPill}>
            <TextInput
              ref={textInputRef}
              style={styles.chatTextInput}
              placeholder={isBulletMode ? 'Bullet message...' : 'Type a message...'}
              placeholderTextColor="rgba(255, 255, 255, 0.45)"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSendMessage}
              returnKeyType="send"
              autoFocus
            />
            <TouchableOpacity onPress={handleSendMessage} style={styles.sendMsgBtn} activeOpacity={0.85}>
              <LinearGradient
                colors={['#8B5CF6', '#6D28D9']}
                style={styles.sendBtnGradient}
              >
                <Icon name="send" size={13} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => {
              setIsChatBarExpanded(false);
              Keyboard.dismiss();
            }}
            style={{ paddingHorizontal: 6 }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.8}
          >
            <Icon name="close-circle" size={22} color="rgba(255, 255, 255, 0.7)" />
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

      {/* MODAL 2A: ROOM TOOLS MENU MODAL (TRIGGERED BY BOTTOM 4-SQUARES MENU) */}
      <RoomToolsModal
        visible={roomMenuModalVisible}
        onClose={() => setRoomMenuModalVisible(false)}
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
        onRoomSettings={openRoomSettings}
        onLockSeats={toggleLockAllSeats}
        onClearChat={clearChat}
        onOpenMusic={() => {
          if (isCurrentUserAdmin) setMusicModalVisible(true);
        }}
        onOpenSeatSettings={() => setSeatLayoutModalVisible(true)}
        onOpenThemeModal={() => setThemeModalVisible(true)}
        onOpenSeatSkinModal={() => setSeatSkinModalVisible(true)}
        showSeatCharm={showSeatCharm}
        onToggleSeatCharm={() => {
          updateSeatCharm(!showSeatCharm);
          AlertService.show(
            !showSeatCharm ? 'Seat Charm On 🌸' : 'Seat Charm Off',
            !showSeatCharm ? 'Seat charm flower points enabled.' : 'Seat charm flower points hidden.',
            'info'
          );
        }}
        seatCount={seatCount}
        isHost={isRoomOwner || isContextOwnerMatch || isCurrentUserAdmin || isEffectiveGlobalRoomManager}
        isGlobalRoomManager={isEffectiveGlobalRoomManager}
        isStealthActive={isStealthMode}
        onToggleStealth={() => {
          const next = !isStealthMode;
          setIsStealthMode(next);
          const sock = getSocket();
          const targetRoomId = room?.id || room?.roomId || room?.channelName || route?.params?.roomId;
          if (sock && targetRoomId) {
            sock.emit('voice_room:join', {
              roomId: targetRoomId,
              user: {
                id: user?._id || user?.id || '',
                userId: user?.userId || currentUserId,
                name: user?.name || 'Manager',
                avatar: user?.avatar || user?.image || '',
              },
              stealth: next,
            });
          }
          AlertService.show(
            next ? 'Stealth Mode Active 🕵️' : 'Stealth Mode Off',
            next
              ? 'Aap room me hide ho chuke hain (invisible in audience & entry suppressed).'
              : 'Aap ab normally visible hain.',
            'info'
          );
        }}
        onBanRoom={handleOfficialBanRoom}
        onOpenRoomTasks={() => setRoomTasksVisible(true)}
        onOpenRoomSupport={() => setRoomSupportVisible(true)}
        bottomSafePadding={bottomSafePadding}
      />

      {/* MODAL 2B: ROOM 3-DOT HEADER MODAL (TRIGGERED BY TOP RIGHT 3-DOTS BUTTON) */}
      <RoomThreeDotModal
        visible={toolsModalVisible}
        onClose={() => setToolsModalVisible(false)}
        canModerate={isCurrentUserAdmin}
        isRoomOwner={isRoomOwner}
        onKickUser={() => {
          setToolsModalVisible(false);
          setOnlineUsersModalVisible(true);
        }}
        onInviteUser={() => {
          setToolsModalVisible(false);
          setShareModalVisible(true);
        }}
        onMuteUser={() => {
          setToolsModalVisible(false);
          setOnlineUsersModalVisible(true);
        }}
        onBanChat={() => {
          setToolsModalVisible(false);
          setOnlineUsersModalVisible(true);
        }}
        onRemoveSeat={() => {
          setToolsModalVisible(false);
          setOnlineUsersModalVisible(true);
        }}
        onReportRoom={() => {
          setToolsModalVisible(false);
          setUgcReportTargetUser({
            id: room?.hostId || room?.ownerId,
            userId: room?.hostId || room?.ownerId,
            name: room?.hostName || currentRoomTitle,
            avatar: currentRoomCover,
          });
          setUgcReportModalVisible(true);
        }}
        onOpenSeatSettings={() => {
          setToolsModalVisible(false);
          setSeatLayoutModalVisible(true);
        }}
        onLockSeats={() => {
          setToolsModalVisible(false);
          setRoomLockModalMode('set_pin');
          setRoomLockModalVisible(true);
        }}
        onOpenThemeModal={() => {
          setToolsModalVisible(false);
          setThemeModalVisible(true);
        }}
        onShareRoom={() => {
          setToolsModalVisible(false);
          setShareModalVisible(true);
        }}
        onOpenAdminSettings={() => {
          setToolsModalVisible(false);
          setAdminListModalVisible(true);
        }}
        onClearChat={clearChat}
        onGatherFollowers={() => {
          setToolsModalVisible(false);
          setGatherFollowersVisible(true);
        }}
        isGlobalRoomManager={isEffectiveGlobalRoomManager}
        onBanRoom={handleOfficialBanRoom}
        onToggleStealth={() => {
          const next = !isStealthMode;
          setIsStealthMode(next);
          const sock = getSocket();
          const targetRoomId = room?.id || room?.roomId || room?.channelName || route?.params?.roomId;
          if (sock && targetRoomId) {
            sock.emit('voice_room:join', {
              roomId: targetRoomId,
              user: {
                id: user?._id || user?.id || '',
                userId: user?.userId || currentUserId,
                name: user?.name || 'Manager',
                avatar: user?.avatar || user?.image || '',
              },
              stealth: next,
            });
          }
          AlertService.show(
            next ? 'Stealth Mode Active 🕵️' : 'Stealth Mode Off',
            next
              ? 'Aap room me hide ho chuke hain (invisible in audience & entry suppressed).'
              : 'Aap ab normally visible hain.',
            'info'
          );
        }}
        isStealthActive={isStealthMode}
        isRoomLocked={currentRoomLocked}
        onUnlockRoom={handleUnlockRoom}
        bottomSafePadding={bottomSafePadding}
      />

      {/* MODAL: ROOM ADMIN LIST (MATCHING USER SCREENSHOT media_1792690947708.png) */}
      <RoomAdminListModal
        visible={adminListModalVisible}
        onClose={() => setAdminListModalVisible(false)}
        roomId={room?.id || room?.roomId || route?.params?.roomId}
        canManageAdmin={Boolean(isRoomOwner || isContextOwnerMatch || isEffectiveGlobalRoomManager)}
      />

      {/* MODAL: ROOM LOCK (MATCHING media_1792690965383.png & media_1792690977464.png & media_1792691000624.png) */}
      <RoomLockModal
        visible={roomLockModalVisible}
        onClose={() => {
          setRoomLockModalVisible(false);
          if (roomLockModalMode === 'enter_pin' && !isCurrentUserAdmin && !isRoomOwner && !isPinVerified) {
            handleLeaveRoom();
            navigation.goBack();
          }
        }}
        mode={roomLockModalMode}
        roomId={room?.id || room?.roomId || route?.params?.roomId}
        isRoomLocked={currentRoomLocked}
        onUnlockRoom={handleUnlockRoom}
        onSuccess={(pin) => {
          setIsPinVerified(true);
          if (roomLockModalMode === 'set_pin') {
            setCurrentRoomLocked(true);
            setHasRoomPin(true);
          }
        }}
        onBuyLock={() => {
          navigation.navigate('VipCenter');
        }}
      />

      {/* MODAL: ROOM SHARE (MATCHING media_1792691055376.png) */}
      <RoomShareModal
        visible={shareModalVisible}
        onClose={() => setShareModalVisible(false)}
        roomName={currentRoomTitle || room.title}
        roomId={room?.id || room?.roomId || route?.params?.roomId}
        onShareWithFriends={() => {
          handleShareRoom();
        }}
      />

      {/* MODAL: GATHER FOLLOWERS (MATCHING media_1792691076423.png) */}
      <RoomGatherFollowersModal
        visible={gatherFollowersVisible}
        onClose={() => setGatherFollowersVisible(false)}
        onGetCharm={() => {
          navigation.navigate('Level');
        }}
      />

      {/* MODAL: ROOM TASKS MODAL (MATCHING REFERENCE VIDEO 00:06-00:21) */}
      <RoomTasksModal
        visible={roomTasksVisible}
        onClose={() => setRoomTasksVisible(false)}
        roomId={room?.id || room?.roomId || route?.params?.roomId}
      />

      {/* MODAL: ROOM SUPPORT MODAL (MATCHING REFERENCE VIDEO 00:22-00:37) */}
      <RoomSupportModal
        visible={roomSupportVisible}
        onClose={() => setRoomSupportVisible(false)}
        roomId={room?.id || room?.roomId || route?.params?.roomId}
        canManageAutoSend={Boolean(isRoomOwner || isContextOwnerMatch)}
      />

      {/* MODAL: ROOM THEME (OWNER TOOLS) */}
      <RoomThemeModal
        visible={themeModalVisible}
        onClose={() => setThemeModalVisible(false)}
        currentTheme={activeTheme}
        onSelectTheme={updateRoomTheme}
        currentSeatSkin={activeSeatSkin}
        onSelectSeatSkin={updateRoomSeatSkin}
        bottomSafePadding={bottomSafePadding}
      />

      {/* MODAL: ROOM SEAT SKIN (OWNER TOOLS) */}
      <RoomSeatSkinModal
        visible={seatSkinModalVisible}
        onClose={() => setSeatSkinModalVisible(false)}
        currentSeatSkin={activeSeatSkin}
        onSelectSeatSkin={updateRoomSeatSkin}
        bottomSafePadding={bottomSafePadding}
      />

      {/* MODAL: IN-ROOM MUSIC PLAYER MODAL */}
      <RoomMusicModal
        visible={musicModalVisible && isCurrentUserAdmin}
        onClose={() => setMusicModalVisible(false)}
        isMusicPlaying={isMusicPlaying}
        isMusicLoading={isMusicLoading}
        musicEnhancementStatus={musicEnhancementStatus}
        getMusicProgress={getMusicProgress}
        onSeekTrack={seekMusicMixing}
        currentTrack={currentTrack}
        musicVolume={musicVolume}
        bassLevel={bassLevel}
        micVolume={micVolume}
        onPlayTrack={(...args) => {
          if (isCurrentUserAdmin) startMusicMixing(...args);
        }}
        onPauseTrack={() => {
          if (isCurrentUserAdmin) pauseMusicMixing();
        }}
        onResumeTrack={() => {
          if (isCurrentUserAdmin) resumeMusicMixing();
        }}
        onStopTrack={stopMusicMixing}
        onSetMusicVolume={(volume) => {
          if (isCurrentUserAdmin) setMusicVolume(volume);
        }}
        onSetBassLevel={(level) => {
          if (isCurrentUserAdmin) setBassLevel(level);
        }}
        registerOnSongEnded={registerOnSongEnded}
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

      <RoomMessageNoticeModal
        visible={messageModalVisible}
        onClose={() => setMessageModalVisible(false)}
        bottomSafePadding={bottomSafePadding}
        styles={styles}
      />

      {/* MODAL 3: ROOM USER PROFILE CARD (MODULAR COMPONENT) */}
      <RoomUserProfileModal
        visible={profileModalVisible}
        onClose={() => setProfileModalVisible(false)}
        user={selectedProfileUser}
        currentUserId={user?.userId || user?.id || user?._id}
        currentUserFrame={user?.equippedFrameAsset || user?.equippedFrame}
        onLeaveSeat={() => leaveSeat(user)}
        onOpenFullProfile={(target) => {
          setProfileModalVisible(false);
          const targetId = target?.userId || target?.id || target?._id || target?.displayId;
          const targetUserObj = target || selectedProfileUser;
          if (setIsMinimized) setIsMinimized(true);
          else if (minimizeRoom) minimizeRoom();
          navigation.navigate('UserProfile', {
            userId: targetId || user?.userId || user?._id || user?.id,
            user: targetUserObj,
            fromVoiceRoom: true,
          });
        }}
        onOpenChat={(target) => {
          setProfileModalVisible(false);
          if (setIsMinimized) setIsMinimized(true);
          else if (minimizeRoom) minimizeRoom();
          navigation.navigate('Chat', {
            user: target,
            otherUser: target,
            fromVoiceRoom: true,
          });
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
        isGlobalRoomManager={isEffectiveGlobalRoomManager}
        roomOwnerId={room.hostId || room.creatorId || room.ownerId || (isContextOwnerMatch ? user?.userId : null)}
        admins={admins}
        seats={seats}
        onToggleAdmin={(u) => toggleAdmin(String(u?.userId || u?.id || u?._id), u?.name)}
        onBanChat={(u) => toggleChatBan(String(u?.userId || u?.id || u?._id), u?.name)}
        onKickUser={(u) => kickFromRoom24h(String(u?.userId || u?.id || u?._id), u?.name)}
        onBanUser={handleOfficialBanUser}
        canBanUser={Boolean(user?.officialPowers?.canBanUser || isEffectiveGlobalRoomManager)}
        onRemoveFromSeat={(u) => removeFromSeat(String(u?.userId || u?.id || u?._id), u?.name)}
        onToggleSeatLock={(seatIdx) => toggleSeatLock(seatIdx)}
        onMuteSeat={(u) => toggleMuteUser(String(u?.userId || u?.id || u?._id), u?.name)}
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
        currentUser={user}
        roomId={currentRoomId || room?.id || room?.roomId || route?.params?.roomId}
        onOpenGiftPanel={() => setGiftPanelVisible(true)}
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
        users={onlineUsers}
        seats={seats}
        roomOwnerId={actualHostUserId}
        admins={admins}
      />


      {/* ============================================================== */}
      <SelfSeatOptionsModal
        visible={selfSeatModalVisible}
        onClose={() => setSelfSeatModalVisible(false)}
        isMuted={isMuted}
        onLeaveSeat={() => leaveSeat(user)}
        onToggleMic={toggleMic}
        styles={styles}
      />
      {/* ROOM ENTRY EFFECT ANIMATION ENGINE */}
      <RoomEntryEffectEngine
        key={String(currentRoomId || room?.id || room?.roomId || 'room')}
        activeEntry={activeEntryEffect}
        onComplete={handleEntryEffectComplete}
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
          id: displayRoomId,
          uniqueId: room.uniqueId || user?.customDisplayId,
          badgeUrl: roomBadgeUrl,
          title: currentRoomTitle || room.title || room.roomName || room.name || 'Voice Room',
          coverImage: currentRoomCover || room.coverImage,
          tag: room.tag || '',
          about: currentRoomAbout || room.about || '',
          onlineCount: onlineCount,
        }}
        badgeUrl={roomBadgeUrl}
        owner={{
          name: actualHostName,
          avatar: actualHostAvatar,
          userId: actualHostUserId,
        }}
        onOpenSettings={() => setRoomSettingsModalVisible(true)}
        onOpenGroup={() => setGroupModalVisible(true)}
        members={onlineUsers}
        onFollow={() => {}}
        onJoin={() => {}}
        bottomSafePadding={bottomSafePadding}
      />

      {/* MODAL 6B: ROOM GROUP PRIVILEGE CARD */}
      <RoomGroupPrivilegeModal
        visible={groupModalVisible}
        onClose={() => setGroupModalVisible(false)}
        room={{
          id: currentRoomId || room?.id || room?.roomId || route?.params?.roomId || displayRoomId,
          uniqueId: room.uniqueId || user?.customDisplayId,
          title: currentRoomTitle || room.title || 'Voice Room',
          coverImage: currentRoomCover || room.coverImage,
          tag: room.tag || '',
          about: currentRoomAbout || room.about || '',
        }}
        owner={{
          name: actualHostName,
          avatar: actualHostAvatar,
          userId: actualHostUserId,
        }}
        isRoomOwner={isRoomOwner}
        currentUser={user}
        membersCount={onlineCount || 0}
        members={onlineUsers}
        topContributors={topRoomContributors}
        onJoinGroup={() => {}}
        bottomSafePadding={bottomSafePadding}
      />

      {/* ============================================================== */}
      {/* MODAL 7: ROOM SETTINGS MODAL (FULL SCREEN YELLOW HEADER) */}
      <RoomSettingsModal
        visible={roomSettingsModalVisible}
        onClose={() => setRoomSettingsModalVisible(false)}
        room={{
          id: displayRoomId,
          uniqueId: room.uniqueId || user?.customDisplayId,
          badgeUrl: roomBadgeUrl,
          title: currentRoomTitle || room.title || 'Voice Room',
          coverImage: currentRoomCover || room.coverImage,
          tag: room.tag || '',
          about: currentRoomAbout || room.about || '',
        }}
        badgeUrl={roomBadgeUrl}
        user={user}
        onSave={handleSaveRoomSettings}
        isSaving={isSavingRoomSettings}
        bottomSafePadding={bottomSafePadding}
        blockedUsers={room.blockedUsers || []}
        onUnblockUser={async (blockedUserId) => {
          try {
            await apiUtil.post(`/rooms/${room.id || room.roomId}/unblock`, { userId: blockedUserId });
            AlertService.show('Unblocked', 'User has been unblocked from the room.', 'success');
          } catch (e) {
            console.log('Unblock error:', e);
          }
        }}
      />
      <RoomReportModal
        visible={ugcReportModalVisible}
        onClose={() => setUgcReportModalVisible(false)}
        targetUser={ugcReportTargetUser}
        reasons={UGC_REPORT_REASONS}
        selectedReason={ugcReportReason}
        setSelectedReason={setUgcReportReason}
        details={ugcReportDetails}
        setDetails={setUgcReportDetails}
        submitting={submittingUgcReport}
        onSubmit={handleSendUgcReport}
        bottomSafePadding={bottomSafePadding}
        styles={styles}
      />
      <RoomSeatActionModal
        visible={seatActionModalVisible}
        onClose={() => {
          setSeatActionModalVisible(false);
          setSelectedSeatForAction(null);
        }}
        selectedSeat={selectedSeatForAction}
        seats={seats}
        toggleSeatLock={toggleSeatLock}
        lockAllSeats={lockAllSeats}
        unlockAllSeats={unlockAllSeats}
        takeSeat={takeSeat}
        applyLiveSeat={applyLiveSeat}
        user={user}
        isModerator={isCurrentUserAdmin}
        setOnlineUsersModalVisible={setOnlineUsersModalVisible}
        bottomSafePadding={bottomSafePadding}
        styles={styles}
      />
      {/* Enterprise Gift Panel Sheet */}
      <GiftPanel
        visible={giftPanelVisible}
        onClose={() => setGiftPanelVisible(false)}
        room={room}
        user={user}
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

      <RoomAnnouncementModal
        visible={isEditingAnnouncement}
        onClose={() => setIsEditingAnnouncement(false)}
        announcement={tempAnnouncement}
        onChangeAnnouncement={setTempAnnouncement}
        onSave={handleSaveAnnouncement}
        saving={isSavingRoomSettings}
        styles={styles}
      />

      {/* Floating Audience Reactions (Bottom-Right upward float) */}
      {reactions.filter((r) => r.seatIndex === undefined).map((r) => (
        <View
          key={r.id}
          pointerEvents="none"
          style={{
            position: 'absolute',
            bottom: 120,
            right: 24,
            zIndex: 9999,
          }}
        >
          <Text style={{ fontSize: 32 }}>{r.emoji}</Text>
        </View>
      ))}
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
    top: 260,
    left: 16,
    width: Math.min(width - 32, 278),
    zIndex: 10800,
    elevation: 22,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 7,
  },
  roomJoinBannerGradient: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5.5,
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: 'rgba(254, 240, 138, 0.85)',
  },
  joinUserName: {
    maxWidth: width * 0.5,
    flexShrink: 1,
    color: '#FEF3C7',
    fontSize: 11.5,
    fontWeight: '900',
  },
  joinCopyColumn: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  joinAvatarWithBadge: {
    position: 'relative',
    width: 38,
    height: 38,
    marginRight: 8,
  },
  joinAvatarEmoji: {
    position: 'absolute',
    top: -7,
    right: -4,
    fontSize: 13,
    zIndex: 3,
  },
  joinLevelBadge: {
    backgroundColor: 'rgba(76,29,149,0.9)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    marginLeft: 0,
    marginTop: 2,
    borderWidth: 0.7,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  joinLevelText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  joinSubText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
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
    backgroundColor: 'transparent',
  },
  hostGoldBorder: {},
  cpPinkBorder: {},
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
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 3,
    maxWidth: 80,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2.5,
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
    borderWidth: 0,
    borderColor: 'transparent',
  },
  cpEmptyBorder: {
    borderWidth: 0,
    borderColor: 'transparent',
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
    zIndex: 95,
    elevation: 8,
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
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderColor: 'transparent',
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
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 3,
    maxWidth: 64,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2.5,
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
    paddingLeft: 10,
    paddingRight: 60,
    marginTop: 4,
    marginBottom: 4,
    width: '100%',
  },
  clearRoomChatButton: {
    position: 'absolute',
    top: 0,
    right: 66,
    zIndex: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
  },
  clearRoomChatText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
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
  chatInputPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    minHeight: 38,
  },
  chatTextInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    paddingVertical: 4,
  },
  sendMsgBtn: {
    paddingLeft: 4,
  },
  sendBtnGradient: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatBackdropDismiss: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    zIndex: 115,
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
  flyingBulletAvatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#334155',
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
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1238',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    zIndex: 120,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    gap: 8,
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
  topContribActions: {
    alignItems: 'flex-end',
    gap: 4,
  },
  topTasksButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(37, 99, 235, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(191, 219, 254, 0.6)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  topTasksText: {
    color: '#EFF6FF',
    fontSize: 10,
    fontWeight: '800',
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
  emptyContribRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contribEmptyCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
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
    width: 90,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: '#EC4899',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(30, 10, 45, 0.85)',
  },
  sideEventGradient: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
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

  // Come on mic and chat together Banner (Compact, matches announcement & welcome width)
  comeOnMicBanner: {
    maxWidth: width * 0.78,
    alignSelf: 'flex-start',
    marginTop: 4,
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
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  comeOnMicText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  comeOnMicIconWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Floating Widgets on Right Side (Lucky, Bag, Solid Green Message Button)
  rightFloatingWidgetsCol: {
    position: 'absolute',
    right: 10,
    bottom: 95,
    alignItems: 'center',
    gap: 10,
    zIndex: 40,
    elevation: 10,
  },
  luckyFruitWidget: {
    alignItems: 'center',
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
    justifyContent: 'center',
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  floatingChatBubbleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
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
  liveRequestBannerContainer: {
    marginHorizontal: 12,
    marginBottom: 8,
    gap: 6,
    zIndex: 99,
  },
  liveRequestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.5)',
  },
  liveRequestAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: '#334155',
  },
  liveRequestInfo: {
    flex: 1,
  },
  liveRequestName: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  liveRequestSub: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  liveRequestActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveRequestDeclineBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  liveRequestDeclineText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
  },
  liveRequestAcceptBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#10B981',
  },
  liveRequestAcceptText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  systemChatBubble: {
    backgroundColor: 'rgba(25, 18, 5, 0.88)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.65)',
    alignSelf: 'flex-start',
    maxWidth: width * 0.85,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  systemChatText: {
    color: '#FFD700',
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2.5,
  },
});
