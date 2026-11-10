import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Clipboard,
  Alert,
  StatusBar,
  Share,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AuthContext } from '../../context/AuthProvider';
import { useVoiceRoom } from '../../context/VoiceRoomContext';
import { AlertService } from '../../utils/AlertService';
import { apiUtil } from '../../utils/apiUtil';
import { formatCompactBalance } from '../../utils/numberUtil';
import { getUserAvatar } from '../../utils/avatarUtil';
import { buildProfileShare } from '../../utils/shareLinks';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_PADDING = 12;
const CARD_INNER_WIDTH = SCREEN_WIDTH - (CARD_PADDING * 2) - 24;

// 1. Honor Medals in Hero
const HONOR_MEDALS = [
  { id: 'm1', name: 'Globe Star', icon: 'earth', color1: '#FBBF24', color2: '#B45309' },
  { id: 'm2', name: 'Cowboy VIP', icon: 'shield-account', color1: '#F59E0B', color2: '#78350F' },
  { id: 'm3', name: 'Rosette Honor', icon: 'medal', color1: '#FCD34D', color2: '#D97706' },
  { id: 'm4', name: 'Gold Seal', icon: 'verified', type: 'mat', color: '#F59E0B' },
  { id: 'm5', name: 'Silver Seal', icon: 'verified', type: 'mat', color: '#9CA3AF' },
  { id: 'm6', name: 'Purple Seal', icon: 'verified', type: 'mat', color: '#A855F7' },
  { id: 'm7', name: 'Blue Seal', icon: 'verified', type: 'mat', color: '#3B82F6' },
  { id: 'm8', name: 'Red Seal', icon: 'verified', type: 'mat', color: '#EF4444' },
];

// 2. Built-in Assets & Tiers for Medal Stage Modal
const MEDAL_ASSETS = {
  tier10m: require('../../assets/medals/medal_tier_10m.png'),
  tier40m: require('../../assets/medals/medal_tier_40m.png'),
  tier200m: require('../../assets/medals/medal_tier_200m.png'),
  podium: require('../../assets/medals/medal_podium.png'),
  tierIcon10m: require('../../assets/medals/tier_icon_10m.png'),
  tierIcon40m: require('../../assets/medals/tier_icon_40m.png'),
  tierIcon200m: require('../../assets/medals/tier_icon_200m.png'),
};

const MEDAL_STAGE_TIERS = [
  {
    tierId: '10m',
    title: 'Received Gifts',
    badgeLabel: '10M Received',
    subTitle: '10000000 diamonds of gifts received',
    current: 0,
    target: 10000000,
    need: 'Need: 10000000',
    bigImage: MEDAL_ASSETS.tier10m,
    milestoneIcon: MEDAL_ASSETS.tierIcon10m,
  },
  {
    tierId: '40m',
    title: '40M Received',
    badgeLabel: '40M Received',
    subTitle: '40000000 diamonds of gifts received',
    current: 0,
    target: 40000000,
    need: 'Need: 40000000',
    bigImage: MEDAL_ASSETS.tier40m,
    milestoneIcon: MEDAL_ASSETS.tierIcon40m,
  },
  {
    tierId: '200m',
    title: '200M Received',
    badgeLabel: '200M Received',
    subTitle: '200000000 diamonds of gifts received (Sabse Bada Target)',
    current: 0,
    target: 200000000,
    need: 'Need: 200000000',
    bigImage: MEDAL_ASSETS.tier200m,
    milestoneIcon: MEDAL_ASSETS.tierIcon200m,
  },
];

// 3. 16 Individual Badges (5-column Grid)
const BADGES_GRID = [
  { id: 'b1', name: 'Lion Throne', icon: 'shield-crown', label: 'LION', color1: '#F59E0B', color2: '#B45309' },
  { id: 'b2', name: 'Royal Crown', icon: 'crown', label: 'KING', color1: '#FBBF24', color2: '#D97706' },
  { id: 'b3', name: 'Purple Star', icon: 'diamond-stone', label: 'STAR', color1: '#C084FC', color2: '#7E22CE' },
  { id: 'b4', name: 'Gold Trophy', icon: 'trophy', label: 'TOP', color1: '#FCD34D', color2: '#F59E0B' },
  { id: 'b5', name: 'Winged Heart', icon: 'heart-pulse', label: 'LOVE', color1: '#FB7185', color2: '#BE123C' },
  { id: 'b6', name: 'Knight Shield', icon: 'shield-star', label: 'ROYAL', color1: '#60A5FA', color2: '#1D4ED8' },
  { id: 'b7', name: 'Blue Star', icon: 'star-four-points', label: 'STAR', color1: '#38BDF8', color2: '#0369A1' },
  { id: 'b8', name: 'PK Champion', icon: 'sword-cross', label: 'PK', color1: '#EF4444', color2: '#991B1B' },
  { id: 'b9', name: 'Red Star Heart', icon: 'heart-multiple', label: 'HEART', color1: '#F43F5E', color2: '#881337' },
  { id: 'b10', name: 'Level 5 Master', icon: 'star-circle', label: 'LV.5', color1: '#F59E0B', color2: '#DC2626' },
  { id: 'b11', name: 'Purple Hex', icon: 'hexagon-slice-6', label: 'HEX', color1: '#A855F7', color2: '#581C87' },
  { id: 'b12', name: '30 Green', icon: 'decagram', label: '30', color1: '#34D399', color2: '#059669' },
  { id: 'b13', name: '30 Emerald', icon: 'seal', label: '30', color1: '#10B981', color2: '#047857' },
  { id: 'b14', name: 'Green Emerald', icon: 'diamond', label: 'GEM', color1: '#6EE7B7', color2: '#065F46' },
  { id: 'b15', name: 'Imperial Crown', icon: 'crown-outline', label: 'VIP', color1: '#FDE047', color2: '#CA8A04' },
  { id: 'b16', name: 'Winged Tiara', icon: 'feather', label: 'TIARA', color1: '#E879F9', color2: '#86198F' },
];

// 4. 14 Individual Vehicles (4-column Grid)
const VEHICLES_GRID = [
  { id: 'v1', name: 'Flame Sport', icon: 'car-sports', color: '#F59E0B', bg: '#FEF3C7', tag: 'Hyper' },
  { id: 'v2', name: 'Purple Phantom', icon: 'car-estate', color: '#8B5CF6', bg: '#EDE9FE', tag: 'V12' },
  { id: 'v3', name: 'Gold Fortune', icon: 'sack', color: '#D97706', bg: '#FFFBEB', tag: 'Luxury' },
  { id: 'v4', name: 'Royal Chariot', icon: 'horse-variant', color: '#EAB308', bg: '#FEFCE8', tag: 'Royal' },
  { id: 'v5', name: 'Red Fortune Bag', icon: 'wallet-giftcard', color: '#DC2626', bg: '#FEE2E2', tag: 'Lucky' },
  { id: 'v6', name: 'Gold Trophy Car', icon: 'trophy-award', color: '#F59E0B', bg: '#FEF3C7', tag: 'Champ' },
  { id: 'v7', name: 'Heart Balloons', icon: 'balloon', color: '#F43F5E', bg: '#FFE4E6', tag: 'Romance' },
  { id: 'v8', name: 'Treasure Ship', icon: 'sail-boat', color: '#0284C7', bg: '#E0F2FE', tag: 'Ocean' },
  { id: 'v9', name: 'Silver Beast', icon: 'car-convertible', color: '#64748B', bg: '#F1F5F9', tag: 'Turbo' },
  { id: 'v10', name: 'Blue Whale', icon: 'water', color: '#0EA5E9', bg: '#E0F2FE', tag: 'Aqua' },
  { id: 'v11', name: 'Vintage Bike', icon: 'motorbike', color: '#EF4444', bg: '#FEE2E2', tag: 'Classic' },
  { id: 'v12', name: 'Neon Superbike', icon: 'racing-helmet', color: '#8B5CF6', bg: '#EDE9FE', tag: 'Speed' },
  { id: 'v13', name: 'Racing Blue', icon: 'car-speed-limiter', color: '#2563EB', bg: '#DBEAFE', tag: 'GT' },
  { id: 'v14', name: 'No.2 Combat', icon: 'tank', color: '#475569', bg: '#F1F5F9', tag: 'Agency' },
];

// 5. 12 Individual Frames (4-column Grid)
const FRAMES_GRID = [
  { id: 'fr1', name: 'SVIP Gold Tiara', border: '#F59E0B', jewel: '👑', color1: '#FEF08A', color2: '#CA8A04' },
  { id: 'fr2', name: 'Sapphire Ring', border: '#3B82F6', jewel: '💎', color1: '#BFDBFE', color2: '#1D4ED8' },
  { id: 'fr3', name: 'Blossom Wreath', border: '#EC4899', jewel: '🌸', color1: '#FBCFE8', color2: '#BE185D' },
  { id: 'fr4', name: 'Ruby Tiara', border: '#F43F5E', jewel: '💖', color1: '#FECDD3', color2: '#9F1239' },
  { id: 'fr5', name: 'Golden Laurel', border: '#EAB308', jewel: '🌿', color1: '#FEF08A', color2: '#A16207' },
  { id: 'fr6', name: 'Emerald Garland', border: '#10B981', jewel: '🍃', color1: '#A7F3D0', color2: '#047857' },
  { id: 'fr7', name: 'Imperial Crown', border: '#F59E0B', jewel: '⭐', color1: '#FDE68A', color2: '#B45309' },
  { id: 'fr8', name: 'Romance Ribbon', border: '#FB7185', jewel: '🎀', color1: '#FFE4E6', color2: '#E11D48' },
  { id: 'fr9', name: 'Ruby Fire Arch', border: '#DC2626', jewel: '🔥', color1: '#FEE2E2', color2: '#991B1B' },
  { id: 'fr10', name: 'Crystal Palace', border: '#A855F7', jewel: '✨', color1: '#E9D5FF', color2: '#6B21A8' },
  { id: 'fr11', name: 'Celestial Ring', border: '#0284C7', jewel: '🌟', color1: '#BAE6FD', color2: '#0369A1' },
  { id: 'fr12', name: 'Tiger King Frame', border: '#D97706', jewel: '🐯', color1: '#FDE68A', color2: '#78350F' },
];

// 6. 32 Individual Gifts (4-column Grid with count badge pills)
const GIFTS_GRID = [
  { id: 'g1', emoji: '💑', name: 'Love Couple', count: 'x191', color: '#EC4899', bg: '#FDF2F8' },
  { id: 'g2', emoji: '👩‍❤️‍💋‍👨', name: 'Sweet Kiss', count: 'x18', color: '#F43F5E', bg: '#FFF1F2' },
  { id: 'g3', emoji: '🧚‍♀️', name: 'Love Fairy', count: 'x6', color: '#8B5CF6', bg: '#F5F3FF' },
  { id: 'g4', emoji: '👰', name: 'White Wedding', count: 'x6', color: '#0EA5E9', bg: '#F0F9FF' },
  { id: 'g5', emoji: '🎭', name: 'Royal Opera', count: 'x16', color: '#F59E0B', bg: '#FFFBEB' },
  { id: 'g6', emoji: '💖', name: 'Embrace', count: 'x21', color: '#FB7185', bg: '#FFF1F2' },
  { id: 'g7', emoji: '🏰', name: 'Red Castle', count: 'x1', color: '#DC2626', bg: '#FEF2F2' },
  { id: 'g8', emoji: '🤴', name: 'Gold Emperor', count: 'x4', color: '#D97706', bg: '#FFFBEB' },
  { id: 'g9', emoji: '💃', name: 'Dancing Diva', count: 'x8', color: '#E11D48', bg: '#FFF1F2' },
  { id: 'g10', emoji: '🌹', name: '999 Roses', count: 'x17', color: '#DC2626', bg: '#FEF2F2' },
  { id: 'g11', emoji: '👁️', name: 'Love Eyes', count: 'x17', color: '#475569', bg: '#F1F5F9' },
  { id: 'g12', emoji: '💎', name: 'Crystal Heart', count: 'x44', color: '#38BDF8', bg: '#F0F9FF' },
  { id: 'g13', emoji: '🧸', name: 'Teddy Hugs', count: 'x1', color: '#B45309', bg: '#FFFBEB' },
  { id: 'g14', emoji: '💋', name: 'Passionate', count: 'x2', color: '#EC4899', bg: '#FDF2F8' },
  { id: 'g15', emoji: '🎆', name: 'Independence', count: 'x1', color: '#F97316', bg: '#FFF7ED' },
  { id: 'g16', emoji: '👩‍❤️‍👨', name: 'Soulmates', count: 'x1', color: '#FB7185', bg: '#FFF1F2' },
  { id: 'g17', emoji: '🎂', name: 'Grand Cake', count: 'x50', color: '#D97706', bg: '#FFFBEB' },
  { id: 'g18', emoji: '💍', name: 'Diamond Ring', count: 'x14', color: '#2563EB', bg: '#EFF6FF' },
  { id: 'g19', emoji: '🚶‍♂️', name: 'Gentleman', count: 'x7', color: '#1E293B', bg: '#F8FAFC' },
  { id: 'g20', emoji: '🥰', name: 'Love Birds', count: 'x13', color: '#F43F5E', bg: '#FFF1F2' },
  { id: 'g21', emoji: '💓', name: 'Pink Heart', count: 'x13149', color: '#EC4899', bg: '#FDF2F8' },
  { id: 'g22', emoji: '🧔', name: 'VIP Friend', count: 'x5', color: '#0284C7', bg: '#F0F9FF' },
  { id: 'g23', emoji: '👗', name: 'Princess Gown', count: 'x2', color: '#FBBF24', bg: '#FEFCE8' },
  { id: 'g24', emoji: '🤵', name: 'Prince Charming', count: 'x2', color: '#475569', bg: '#F1F5F9' },
  { id: 'g25', emoji: '👸', name: 'Beauty Queen', count: 'x2', color: '#F472B6', bg: '#FDF2F8' },
  { id: 'g26', emoji: '🪔', name: 'Golden Diya', count: 'x32510', color: '#EA580C', bg: '#FFF7ED' },
  { id: 'g27', emoji: '👩‍❤️‍💋‍👨', name: 'True Love', count: 'x8', color: '#BE123C', bg: '#FFF1F2' },
  { id: 'g28', emoji: '👑', name: 'Imperial Crown', count: 'x111124', color: '#EAB308', bg: '#FEFCE8' },
  { id: 'g29', emoji: '💐', name: 'Flower Garland', count: 'x2', color: '#DC2626', bg: '#FEF2F2' },
  { id: 'g30', emoji: '🧙‍♂️', name: 'Magical Lamp', count: 'x1', color: '#D97706', bg: '#FFFBEB' },
  { id: 'g31', emoji: '🦅', name: 'Golden Falcon', count: 'x1', color: '#B45309', bg: '#FFFBEB' },
  { id: 'g32', emoji: '🕶️', name: 'Dark Knight', count: 'x1', color: '#0F172A', bg: '#F8FAFC' },
];

export default function UserProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomSafePadding = getStackScreenBottomPadding(insets.bottom, 16);
  const { user: currentUser } = useContext(AuthContext);
  const voiceRoomContext = useVoiceRoom();
  const activeRoom = voiceRoomContext?.activeRoom;
  const maximizeRoom = voiceRoomContext?.maximizeRoom;

  const handleBack = () => {
    if (route.params?.fromVoiceRoom || activeRoom) {
      if (navigation.canGoBack()) {
        navigation.goBack();
        if (activeRoom && maximizeRoom) {
          maximizeRoom();
        }
      } else if (activeRoom) {
        if (maximizeRoom) {
          maximizeRoom();
        } else {
          navigation.navigate('VoiceRoom', { room: activeRoom });
        }
      } else {
        navigation.navigate('MainTabs');
      }
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MainTabs');
    }
  };

  useEffect(() => {
    const onBackPress = () => {
      handleBack();
      return true;
    };
    const backSub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backSub.remove();
  }, [navigation, activeRoom, maximizeRoom, route.params?.fromVoiceRoom]);

  const incomingUser = route.params?.user || route.params?.host || null;
  const [fetchedUser, setFetchedUser] = useState(incomingUser);
  const [isFollowing, setIsFollowing] = useState(Boolean(incomingUser?.isFollowing));
  const [followLoading, setFollowLoading] = useState(false);
  const [callingInProgress, setCallingInProgress] = useState(false);

  // Medal Target & Milestone Modal State
  const [showMedalModal, setShowMedalModal] = useState(false);
  const [activeMedalTierIndex, setActiveMedalTierIndex] = useState(0);

  const handleOpenMedalModal = (tierIdx = 0) => {
    setActiveMedalTierIndex(tierIdx);
    setShowMedalModal(true);
  };

  useEffect(() => {
    const fetchUserById = async () => {
      const uid =
        route.params?.userId ||
        route.params?.id ||
        incomingUser?._id ||
        incomingUser?.userId ||
        incomingUser?.id ||
        incomingUser?.displayId ||
        incomingUser?.name;

      if (uid) {
        apiUtil.post(`/user/visit/${encodeURIComponent(uid)}`).catch(() => {});

        try {
          const res = await apiUtil.get(`/user/profile/${encodeURIComponent(uid)}`);
          if (res.data?.success && (res.data?.user || res.data?.data)) {
            const profile = res.data.user || res.data.data;
            setFetchedUser(profile);
            if (profile.isFollowing !== undefined) {
              setIsFollowing(Boolean(profile.isFollowing));
            }
          }
        } catch (err) {
          console.log('[UserProfile] Profile fetch notice:', err.message);
        }
      }
    };
    fetchUserById();
  }, [route.params?.userId, route.params?.id, route.params?.user, route.params?.host]);

  const targetUser = useMemo(() => {
    const raw = fetchedUser || route.params?.user || route.params?.host || {};
    const fallbackId = route.params?.userId || route.params?.id || '';
    const identity = raw.effectiveIdentity || {};
    const rawCurrentRoom = raw.isInRoom && raw.currentRoomId ? raw.currentRoomId : null;
    const cpPartner =
      raw.cpPartner && (raw.cpPartner.name || raw.cpPartner.partnerName || raw.cpPartner._id)
        ? raw.cpPartner
        : null;
    const family = raw.family && (raw.family.name || raw.family._id) ? raw.family : null;

    return {
      _id: raw._id || raw.id || raw.userId || fallbackId,
      userId: raw.userId || raw.id || fallbackId,
      displayId:
        raw.customDisplayId ||
        raw.equippedCustomId ||
        raw.uniqueId ||
        raw.displayId ||
        identity.displayId ||
        raw.userId ||
        fallbackId ||
        '',
      name: raw.name || raw.hostName || raw.userName || 'User',
      avatar: raw.avatar || raw.coverImage || raw.image || null,
      country: raw.country || null,
      isVerified: Boolean(raw.isProfileVerified || raw.isVerified || raw.isOfficial),
      roleBadgeText: raw.roleBadgeText || (raw.isOfficial ? 'Official' : ''),
      bio: raw.bio || raw.about || '',
      followersCount: Number(
        raw.followersCount ?? (Array.isArray(raw.followers) ? raw.followers.length : 0)
      ),
      followingCount: Number(
        raw.followingCount ?? (Array.isArray(raw.following) ? raw.following.length : 0)
      ),
      visitorsCount: Number(raw.visitorsCount ?? 0),
      svipLevel: Number(raw.svipLevel || 0),
      wealthLevel: Number(raw.wealthLevel || 1),
      charmLevel: Number(raw.charmLevel || 1),
      showFamily: Boolean(raw.showFamily && family),
      family: family,
      showCp: Boolean(raw.showCp && cpPartner),
      cpPartner: cpPartner,
      featuredFriends: Array.isArray(raw.featuredFriends) ? raw.featuredFriends : [],
      topSupporters: Array.isArray(raw.topSupporters) ? raw.topSupporters : [],
      showcase: raw.showcase || {
        badges: [],
        badgesCount: 0,
        vehicles: [],
        vehiclesCount: 0,
        frames: [],
        framesCount: 0,
        gifts: [],
        giftsCount: 0,
      },
      currentRoomId: rawCurrentRoom,
      currentRoomTitle: raw.currentRoomTitle || (rawCurrentRoom ? `${raw.name || 'User'}'s Room` : ''),
      isInRoom: Boolean(rawCurrentRoom),
      isHost: Boolean(raw.isHost ?? (raw.role === 'host' || raw.callRate > 0)),
      callRate: raw.callRate || 20,
      videoCallRate: raw.videoCallRate || 35,
    };
  }, [route.params, fetchedUser]);

  const isOwnProfile = useMemo(() => {
    const myId = String(currentUser?.userId || currentUser?._id || currentUser?.id || '');
    const theirId = String(targetUser.userId || targetUser._id || targetUser.displayId || '');
    return Boolean(myId && theirId && myId === theirId);
  }, [currentUser, targetUser]);

  const handleCopyId = () => {
    const idToCopy = targetUser.displayId || targetUser.userId;
    Clipboard.setString(String(idToCopy));
    AlertService.show('Success', `ID ${idToCopy} copied to clipboard!`, 'success');
  };

  const handleShare = async () => {
    try {
      const shareId = targetUser.userId || targetUser._id || targetUser.id || targetUser.displayId;
      await Share.share(buildProfileShare(shareId, targetUser.name));
    } catch (e) {
      console.log('Share error:', e.message);
    }
  };

  const handleMoreOptions = () => {
    Alert.alert('User Options', targetUser.name, [
      {
        text: 'Report User',
        onPress: () => AlertService.show('Reported', 'Report submitted for review.', 'info'),
      },
      {
        text: 'Block User',
        style: 'destructive',
        onPress: () =>
          AlertService.show('Blocked', `${targetUser.name} has been blocked.`, 'success'),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleToggleFollow = async () => {
    if (followLoading) return;
    setFollowLoading(true);
    const nextState = !isFollowing;
    setIsFollowing(nextState);
    try {
      const targetId = targetUser.userId || targetUser._id;
      const res = await apiUtil.post(`/user/follow/${encodeURIComponent(targetId)}`);
      if (res.data?.success) {
        AlertService.show(
          nextState ? 'Following' : 'Unfollowed',
          nextState
            ? `You are now following ${targetUser.name}!`
            : `You unfollowed ${targetUser.name}`,
          'success'
        );
      }
    } catch (err) {
      setIsFollowing(!nextState);
      AlertService.show(
        'Notice',
        err.response?.data?.message || 'Could not update follow status',
        'error'
      );
    } finally {
      setFollowLoading(false);
    }
  };

  const handleOpenChat = () => {
    navigation.navigate('Chat', {
      user: targetUser,
      chatUser: targetUser,
      otherUser: targetUser,
    });
  };

  const handleEnterRoom = () => {
    if (targetUser.currentRoomId) {
      navigation.navigate('VoiceRoom', {
        roomId: String(targetUser.currentRoomId),
      });
    } else {
      AlertService.show('Room Notice', `${targetUser.name} is not currently in a room.`, 'info');
    }
  };

  const handleStartAudioCall = async () => {
    if (callingInProgress) return;
    const userDiamonds = Number(currentUser?.diamonds || 0);
    if (userDiamonds < targetUser.callRate) {
      Alert.alert('Insufficient Diamonds', 'Please recharge your diamonds to call this host.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Recharge', onPress: () => navigation.navigate('Recharge') },
      ]);
      return;
    }

    try {
      setCallingInProgress(true);
      const res = await apiUtil.post('/call/start', {
        hostId: targetUser._id,
        isVideo: false,
        callType: 'audio',
      });
      if (res.data?.success && res.data?.data) {
        navigation.navigate('OutGoing', {
          ...res.data.data,
          name: targetUser.name,
          hostId: targetUser._id || targetUser.userId || targetUser.id,
          image: targetUser.avatar,
          isCaller: true,
          isVideo: false,
        });
      } else {
        AlertService.show('Call Unavailable', res.data?.message || 'Unable to connect call.', 'error');
      }
    } catch (err) {
      AlertService.show('Call Error', err.response?.data?.message || err.message, 'error');
    } finally {
      setCallingInProgress(false);
    }
  };

  return (
    <View style={styles.screenContainer}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Clean White/Soft Gray Background for Cards */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#F8F9FD' }]} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomSafePadding + 90 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ======================================================== */}
        {/* 1. HERO SECTION: Royal Dark Black/Purple Canopy */}
        {/* ======================================================== */}
        <View style={styles.heroSectionWrap}>
          <LinearGradient
            colors={['#0F061A', '#1E0D33', '#160928', '#0A0312']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.85, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Top Navigation Bar */}
          <View style={[styles.topNavBar, { paddingTop: topSafeInset + 6 }]}>
            <TouchableOpacity
              style={styles.navIconBtn}
              onPress={handleBack}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.7}
            >
              <Icon name="chevron-back" size={26} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.navBrandCenter}>
              <Text style={styles.navBrandText}>·||· YARO ·||·</Text>
            </View>

            <View style={styles.topRightActions}>
              <TouchableOpacity
                style={styles.navIconBtn}
                onPress={handleShare}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                activeOpacity={0.7}
              >
                <Icon name="share-outline" size={22} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navIconBtn}
                onPress={handleMoreOptions}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                activeOpacity={0.7}
              >
                <Icon name="ellipsis-horizontal" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Big Avatar with Crown and Laurel Wreath in pure React Native */}
          <View style={styles.avatarWrap}>
            {/* Top Golden Crown */}
            <View style={styles.avatarCrownBadge}>
              <MaterialCommunityIcons name="crown" size={32} color="#FBBF24" />
            </View>

            {/* Avatar Circle with Wreath Laurel Leaves */}
            <View style={styles.avatarOuterFrame}>
              <View style={styles.avatarInnerCircle}>
                <Image
                  source={getUserAvatar(targetUser)}
                  style={styles.avatarImg}
                  resizeMode="cover"
                />
              </View>
              {/* Left and Right Wreath Badges */}
              <View style={styles.wreathWingLeft}>
                <MaterialCommunityIcons name="leaf" size={20} color="#F59E0B" />
              </View>
              <View style={styles.wreathWingRight}>
                <MaterialCommunityIcons
                  name="leaf"
                  size={20}
                  color="#F59E0B"
                  style={{ transform: [{ scaleX: -1 }] }}
                />
              </View>
            </View>
          </View>

          {/* User Name + Flag + Gold Verified Badge */}
          <View style={styles.nameRow}>
            {Boolean(targetUser.country) && (
              <Text style={styles.countryFlagText}>
                {typeof targetUser.country === 'object' ? targetUser.country?.flag || '🌍' : targetUser.country}
              </Text>
            )}
            <Text style={styles.userNameText} numberOfLines={1}>
              {targetUser.name || 'User'}
            </Text>
            {Boolean(targetUser.isVerified) && (
              <MaterialIcons name="verified" size={19} color="#F59E0B" style={styles.verifiedCheck} />
            )}
          </View>

          {/* YARO ID Row */}
          <TouchableOpacity
            style={styles.yaroIdRow}
            onPress={handleCopyId}
            activeOpacity={0.7}
          >
            <Text style={styles.yaroIdText}>
              YARO ID : {targetUser.displayId || targetUser.userId}
            </Text>
            <Icon name="copy-outline" size={13} color="#D1D5DB" style={{ marginLeft: 5 }} />
          </TouchableOpacity>

          {/* Role Badge */}
          {Boolean(targetUser.roleBadgeText) && (
            <View style={styles.roleBadgeRow}>
              <MaterialCommunityIcons
                name="shield-check"
                size={14}
                color="#F59E0B"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.roleBadgeText}>
                {targetUser.roleBadgeText}
              </Text>
            </View>
          )}

          {/* Status Pill Badges Row */}
          <View style={styles.pillBadgesRow}>
            {targetUser.svipLevel > 0 && (
              <LinearGradient
                colors={['#FDE68A', '#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.svipPill}
              >
                <Text style={styles.svipPillText}>SVIP {targetUser.svipLevel}</Text>
              </LinearGradient>
            )}

            {Boolean(targetUser.name) && (
              <View style={styles.nicknamePill}>
                <Text style={styles.nicknamePillText}>{targetUser.name}</Text>
              </View>
            )}

            {Boolean(targetUser.isVerified) && (
              <View style={styles.officialPill}>
                <Text style={styles.officialPillText}>OFFICIAL</Text>
              </View>
            )}

            <View style={styles.wealthLevelPill}>
              <Text style={styles.wealthLevelPillText}>
                Lev. {targetUser.wealthLevel || 1}
              </Text>
            </View>

            <View style={styles.charmLevelPill}>
              <Text style={styles.charmLevelPillText}>
                Lev. {targetUser.charmLevel || 1}
              </Text>
            </View>
          </View>

          {/* 8 Honor Medals (Tapping opens the Target & Milestone preview modal) */}
          <View style={styles.honorMedalsRow}>
            {HONOR_MEDALS.map((medal, mIdx) => (
              <React.Fragment key={medal.id}>
                {mIdx === 3 && <View style={styles.medalDividerLine} />}
                <TouchableOpacity
                  style={styles.honorMedalItem}
                  onPress={() => handleOpenMedalModal(mIdx % 3)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={
                      medal.color1
                        ? [medal.color1, medal.color2 || medal.color1]
                        : ['#F59E0B', '#B45309']
                    }
                    style={styles.honorMedalCircle}
                  >
                    {medal.type === 'mat' ? (
                      <MaterialIcons name={medal.icon} size={15} color="#FFFFFF" />
                    ) : (
                      <MaterialCommunityIcons name={medal.icon} size={15} color="#FFFFFF" />
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>

          {/* Stats Row: Followers | Followings | Visitors */}
          <View style={styles.statsRow}>
            <TouchableOpacity
              style={styles.statCol}
              onPress={() => navigation.navigate('Followers', { tab: 'followers' })}
              activeOpacity={0.7}
            >
              <Text style={styles.statNum}>
                {formatCompactBalance(targetUser.followersCount || 0)}
              </Text>
              <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>

            <View style={styles.statDivider} />

            <TouchableOpacity
              style={styles.statCol}
              onPress={() => navigation.navigate('Followers', { tab: 'following' })}
              activeOpacity={0.7}
            >
              <Text style={styles.statNum}>
                {formatCompactBalance(targetUser.followingCount || 0)}
              </Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>

            <View style={styles.statDivider} />

            <TouchableOpacity
              style={styles.statCol}
              onPress={() => navigation.navigate('Visitors')}
              activeOpacity={0.7}
            >
              <Text style={styles.statNum}>
                {formatCompactBalance(targetUser.visitorsCount || 0)}
              </Text>
              <Text style={styles.statLabel}>Visitors</Text>
            </TouchableOpacity>
          </View>

          {/* Golden Convex Canopy Bottom Arch */}
          <View style={styles.goldenArchTrim} />
        </View>

        {/* ======================================================== */}
        {/* 2. CONTENT CARDS (NO MOMENT TAB - 100% PURE CODE)       */}
        {/* ======================================================== */}
        <View style={styles.cardsContentWrap}>
          {/* Card 1: About Me */}
          <TouchableOpacity
            style={styles.luxuryContentCard}
            onPress={() => (isOwnProfile ? navigation.navigate('EditProfile') : null)}
            activeOpacity={isOwnProfile ? 0.7 : 1}
          >
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardHeaderText}>About Me</Text>
              <Icon name="chevron-forward" size={17} color="#94A3B8" />
            </View>
            <View style={styles.bioContentRow}>
              <Text style={styles.bioLabelText}>Bio</Text>
              <Text
                style={[
                  styles.bioContentText,
                  !targetUser.bio && { fontStyle: 'italic', color: '#94A3B8' },
                ]}
                numberOfLines={2}
              >
                {targetUser.bio || 'No bio yet.'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Card 2: Club (Hidden if user has no family or if Family is disabled) */}
          {Boolean(targetUser.showFamily && targetUser.family) && (
            <View style={styles.luxuryContentCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardHeaderText}>Club</Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('Family', { familyId: targetUser.family?._id })}
                activeOpacity={0.85}
                style={styles.clubBannerBtn}
              >
                <LinearGradient
                  colors={['#F59E0B', '#D97706', '#92400E']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.clubBannerGradient}
                >
                  <View style={styles.clubShieldBox}>
                    <LinearGradient
                      colors={['#FDE68A', '#F59E0B']}
                      style={styles.clubShieldInner}
                    >
                      <MaterialCommunityIcons name="shield-crown" size={26} color="#78350F" />
                    </LinearGradient>
                  </View>

                  <View style={styles.clubCenterInfo}>
                    <Text style={styles.clubTitleText} numberOfLines={1}>
                      {targetUser.family?.name || 'Club'}
                    </Text>
                    <View style={styles.clubLevelPill}>
                      <Text style={styles.clubLevelPillText}>
                        Lv.{targetUser.family?.level || 1}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.clubRightInfo}>
                    <MaterialCommunityIcons
                      name="account-group"
                      size={16}
                      color="#FFFFFF"
                      style={{ marginRight: 4 }}
                    />
                    <Text style={styles.clubMembersCountText}>
                      {Number(targetUser.family?.memberCount || 1).toLocaleString()}
                    </Text>
                    <Icon name="chevron-forward" size={17} color="#FFFFFF" style={{ marginLeft: 6 }} />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Card 3: CP (Hidden if user has no CP or if CP is disabled) */}
          {Boolean(targetUser.showCp && targetUser.cpPartner) && (
            <View style={styles.luxuryContentCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardHeaderText}>CP</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('CpSpace')}
                  style={styles.cardHeaderRightLink}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cardHeaderRightLinkText}>CP Center</Text>
                  <Icon name="chevron-forward" size={15} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => navigation.navigate('CpSpace')}
                activeOpacity={0.85}
                style={styles.cpBannerBtn}
              >
                <LinearGradient
                  colors={['#F472B6', '#FB7185', '#E11D48']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cpBannerGradient}
                >
                  {/* Partner 1 */}
                  <View style={styles.cpPartnerCol}>
                    <View style={styles.cpAvatarRing}>
                      <Image
                        source={getUserAvatar({ name: targetUser.cpPartner?.partnerName || targetUser.name })}
                        style={styles.cpAvatarImg}
                      />
                      <View style={styles.cpCheckCircle}>
                        <Icon name="checkmark" size={9} color="#FFFFFF" />
                      </View>
                    </View>
                    <Text style={styles.cpPartnerNameText} numberOfLines={1}>
                      ✔ {targetUser.cpPartner?.partnerName || targetUser.name}
                    </Text>
                  </View>

                  {/* Center Crowned Winged Heart Badge */}
                  <View style={styles.cpCenterBadgeBox}>
                    <View style={styles.cpWingLeft}>
                      <MaterialCommunityIcons name="feather" size={18} color="#FFFFFFDD" />
                    </View>
                    <LinearGradient
                      colors={['#FF6B8B', '#BE123C']}
                      style={styles.cpHeartBadgePill}
                    >
                      <MaterialCommunityIcons name="crown" size={13} color="#FDE047" style={{ marginBottom: -2 }} />
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <MaterialCommunityIcons name="heart" size={14} color="#FFFFFF" style={{ marginRight: 2 }} />
                        <Text style={styles.cpHeartLevelText}>
                          Lv.{targetUser.cpPartner?.cpLevel || targetUser.cpPartner?.level || 1}
                        </Text>
                      </View>
                    </LinearGradient>
                    <View style={styles.cpWingRight}>
                      <MaterialCommunityIcons
                        name="feather"
                        size={18}
                        color="#FFFFFFDD"
                        style={{ transform: [{ scaleX: -1 }] }}
                      />
                    </View>
                  </View>

                  {/* Partner 2 */}
                  <View style={styles.cpPartnerCol}>
                    <View style={styles.cpAvatarRing}>
                      <Image
                        source={getUserAvatar({ name: targetUser.cpPartner?.name || 'Partner', avatar: targetUser.cpPartner?.avatar })}
                        style={styles.cpAvatarImg}
                      />
                      <View style={[styles.cpCheckCircle, { backgroundColor: '#EC4899' }]}>
                        <Icon name="heart" size={9} color="#FFFFFF" />
                      </View>
                    </View>
                    <Text style={styles.cpPartnerNameText} numberOfLines={1}>
                      ♡ {targetUser.cpPartner?.name || 'Partner'} ♡
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Card 4: Friend (Top Gifting Mutual Friends) */}
          {Boolean(targetUser.featuredFriends && targetUser.featuredFriends.length > 0) && (
            <View style={styles.luxuryContentCard}>
              <TouchableOpacity
                style={styles.cardHeaderRow}
                onPress={() => navigation.navigate('Followers', { tab: 'friends' })}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.cardHeaderText}>
                    Friend ({targetUser.featuredFriends.length})
                  </Text>
                  <Icon
                    name="help-circle-outline"
                    size={15}
                    color="#94A3B8"
                    style={{ marginLeft: 5 }}
                  />
                </View>
                <Icon name="chevron-forward" size={17} color="#94A3B8" />
              </TouchableOpacity>

              {/* Real Mutual Friends in Horizontal Row */}
              <View style={styles.friendsCardsRow}>
                {targetUser.featuredFriends.slice(0, 3).map((friend, fIdx) => (
                  <TouchableOpacity
                    key={friend.id || friend._id || fIdx}
                    style={[
                      styles.friendCardItem,
                      {
                        backgroundColor: friend.cardBg || (fIdx === 0 ? '#FAF5FF' : fIdx === 1 ? '#F0F9FF' : '#FFF1F2'),
                        borderColor: friend.borderColor || (fIdx === 0 ? '#E9D5FF' : fIdx === 1 ? '#BAE6FD' : '#FECDD3'),
                      },
                    ]}
                    onPress={() =>
                      navigation.navigate('UserProfile', {
                        userId: friend.userId || friend._id || friend.id,
                        user: friend,
                      })
                    }
                    activeOpacity={0.8}
                  >
                    {/* Winged Avatar */}
                    <View style={styles.friendWingedAvatarWrap}>
                      <LinearGradient
                        colors={
                          friend.color1
                            ? [friend.color1, friend.color2 || friend.color1]
                            : fIdx === 0
                            ? ['#C084FC', '#9333EA']
                            : fIdx === 1
                            ? ['#38BDF8', '#0284C7']
                            : ['#F472B6', '#E11D48']
                        }
                        style={styles.friendAvatarHalo}
                      >
                        <Image
                          source={getUserAvatar(friend)}
                          style={styles.friendAvatarThumb}
                        />
                      </LinearGradient>
                    </View>

                    {/* Friend Name */}
                    <Text style={styles.friendCardName} numberOfLines={1}>
                      {friend.name || 'Friend'}
                    </Text>

                    {/* Friendship Days Badge */}
                    <View style={styles.friendDaysBadge}>
                      <Text style={styles.friendDaysBadgeText}>
                        {friend.days || 1} Days
                      </Text>
                    </View>

                    {/* Dual-ended Progress Bar */}
                    <View style={styles.friendProgressWrap}>
                      <View style={styles.friendProgressTextRow}>
                        <Text style={styles.friendProgressLeftText}>
                          {friend.diamonds || '0'}
                        </Text>
                        <Text style={styles.friendProgressRightText}>
                          {friend.target || '50k'}
                        </Text>
                      </View>
                      <View style={styles.friendProgressBarTrack}>
                        <LinearGradient
                          colors={
                            friend.color1
                              ? [friend.color1, friend.color2 || friend.color1]
                              : ['#9333EA', '#C084FC']
                          }
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={[
                            styles.friendProgressBarFill,
                            {
                              width: `${Math.min(100, Math.round(
                                (friend.progress || (Number(String(friend.diamonds || '').replace(/[^0-9.]/g, '')) / 50)) * 100
                              ))}%`,
                            },
                          ]}
                        />
                      </View>
                    </View>

                    {/* Status Pill */}
                    <View style={styles.friendStatusPill}>
                      <MaterialCommunityIcons
                        name={friend.inRoom ? "microphone" : "account"}
                        size={10}
                        color={friend.inRoom ? "#6366F1" : "#94A3B8"}
                        style={{ marginRight: 2 }}
                      />
                      <Text style={styles.friendStatusPillText} numberOfLines={1}>
                        {friend.inRoom ? 'In Voice Room' : 'Active'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Card 5: Supporter */}
          <TouchableOpacity
            style={styles.luxuryContentCard}
            onPress={() => navigation.navigate('Ranking')}
            activeOpacity={0.8}
          >
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardHeaderText}>Supporter</Text>
              <View style={styles.supporterHeaderRight}>
                {targetUser.topSupporters && targetUser.topSupporters.length > 0 ? (
                  targetUser.topSupporters.slice(0, 3).map((supporter, sIdx) => (
                    <View
                      key={supporter.id || supporter._id || sIdx}
                      style={[
                        styles.supporterMiniRing,
                        sIdx > 0 && { marginLeft: -8 },
                      ]}
                    >
                      <Image
                        source={getUserAvatar(supporter)}
                        style={styles.supporterMiniThumb}
                      />
                      <View
                        style={[
                          styles.supporterMiniRankBadge,
                          sIdx === 0 && { backgroundColor: '#F59E0B' },
                          sIdx === 1 && { backgroundColor: '#94A3B8' },
                          sIdx === 2 && { backgroundColor: '#B45309' },
                        ]}
                      >
                        <Text style={styles.supporterMiniRankText}>{sIdx + 1}</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={{ fontSize: 12, color: '#94A3B8' }}>No supporters yet</Text>
                )}
                <Icon name="chevron-forward" size={17} color="#94A3B8" style={{ marginLeft: 8 }} />
              </View>
            </View>
          </TouchableOpacity>

          {/* Card 6: Room (Only if currently in room) */}
          {Boolean(targetUser.isInRoom && targetUser.currentRoomId) && (
            <TouchableOpacity
              style={styles.luxuryContentCard}
              onPress={handleEnterRoom}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.cardHeaderText}>Room</Text>
                  <View style={styles.liveRoomTag}>
                    <Text style={styles.liveRoomTagText}>LIVE</Text>
                  </View>
                </View>
                <Icon name="chevron-forward" size={17} color="#94A3B8" />
              </View>
              <Text style={styles.activeRoomDesc} numberOfLines={1}>
                {targetUser.currentRoomTitle || `${targetUser.name}'s Live Club`}
              </Text>
            </TouchableOpacity>
          )}

          {/* Card 7: Badge (Clicking opens Medal Target modal) */}
          <View style={styles.luxuryContentCard}>
            <TouchableOpacity
              style={styles.cardHeaderRow}
              onPress={() => navigation.navigate('Medal')}
              activeOpacity={0.7}
            >
              <Text style={styles.cardHeaderText}>
                Badge ({targetUser.showcase?.badgesCount ?? targetUser.showcase?.badges?.length ?? 16})
              </Text>
              <Icon name="chevron-forward" size={17} color="#94A3B8" />
            </TouchableOpacity>

            <View style={styles.badgesGridWrap}>
              {(targetUser.showcase?.badges?.length > 0 ? targetUser.showcase.badges : BADGES_GRID).map((badge, bIdx) => (
                <TouchableOpacity
                  key={badge.id || badge._id || bIdx}
                  style={styles.badgeGridItem}
                  onPress={() => handleOpenMedalModal(bIdx % 3)}
                  activeOpacity={0.75}
                >
                  <LinearGradient
                    colors={[badge.color1 || '#F59E0B', badge.color2 || '#B45309']}
                    style={styles.badgeCircleShape}
                  >
                    <MaterialCommunityIcons name={badge.icon || 'shield-star'} size={22} color="#FFFFFF" />
                  </LinearGradient>
                  <View style={styles.badgeLabelPill}>
                    <Text style={styles.badgeLabelText} numberOfLines={1}>
                      {badge.label || badge.name || 'MEDAL'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Card 8: Vehicle */}
          <View style={styles.luxuryContentCard}>
            <TouchableOpacity
              style={styles.cardHeaderRow}
              onPress={() => navigation.navigate('Store', { category: 'Vehicle' })}
              activeOpacity={0.7}
            >
              <Text style={styles.cardHeaderText}>
                Vehicle ({targetUser.showcase?.vehiclesCount ?? targetUser.showcase?.vehicles?.length ?? 14})
              </Text>
              <Icon name="chevron-forward" size={17} color="#94A3B8" />
            </TouchableOpacity>

            <View style={styles.vehiclesGridWrap}>
              {(targetUser.showcase?.vehicles?.length > 0 ? targetUser.showcase.vehicles : VEHICLES_GRID).map((veh, vIdx) => (
                <TouchableOpacity
                  key={veh.id || veh._id || vIdx}
                  style={styles.vehicleGridItem}
                  onPress={() => navigation.navigate('Store', { category: 'Vehicle' })}
                  activeOpacity={0.75}
                >
                  <View style={[styles.vehicleThumbBox, { backgroundColor: veh.bg || '#FEF3C7' }]}>
                    <MaterialCommunityIcons name={veh.icon || 'car-sports'} size={28} color={veh.color || '#F59E0B'} />
                    <View style={styles.vehicleTagPill}>
                      <Text style={styles.vehicleTagText}>{veh.tag || 'Speed'}</Text>
                    </View>
                  </View>
                  <Text style={styles.vehicleTitleText} numberOfLines={1}>
                    {veh.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Card 9: Frame */}
          <View style={styles.luxuryContentCard}>
            <TouchableOpacity
              style={styles.cardHeaderRow}
              onPress={() => navigation.navigate('Store', { category: 'Frames' })}
              activeOpacity={0.7}
            >
              <Text style={styles.cardHeaderText}>
                Frame ({targetUser.showcase?.framesCount ?? targetUser.showcase?.frames?.length ?? 12})
              </Text>
              <Icon name="chevron-forward" size={17} color="#94A3B8" />
            </TouchableOpacity>

            <View style={styles.framesGridWrap}>
              {(targetUser.showcase?.frames?.length > 0 ? targetUser.showcase.frames : FRAMES_GRID).map((fr, fIdx) => (
                <TouchableOpacity
                  key={fr.id || fr._id || fIdx}
                  style={styles.frameGridItem}
                  onPress={() => navigation.navigate('Store', { category: 'Frames' })}
                  activeOpacity={0.75}
                >
                  <View style={[styles.frameCircleOuter, { borderColor: fr.border || '#F59E0B' }]}>
                    <LinearGradient
                      colors={[fr.color1 || '#FEF08A', fr.color2 || '#CA8A04']}
                      style={styles.frameCircleInner}
                    >
                      <Text style={{ fontSize: 20 }}>{fr.jewel || '👑'}</Text>
                    </LinearGradient>
                  </View>
                  <Text style={styles.frameTitleText} numberOfLines={1}>
                    {fr.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Card 10: Gift */}
          <View style={styles.luxuryContentCard}>
            <TouchableOpacity
              style={styles.cardHeaderRow}
              onPress={() => navigation.navigate('GiftsScreen')}
              activeOpacity={0.7}
            >
              <Text style={styles.cardHeaderText}>
                Gift ({targetUser.showcase?.giftsCount ?? targetUser.showcase?.gifts?.length ?? 32})
              </Text>
              <Icon name="chevron-forward" size={17} color="#94A3B8" />
            </TouchableOpacity>

            <View style={styles.giftsGridWrap}>
              {(targetUser.showcase?.gifts?.length > 0 ? targetUser.showcase.gifts : GIFTS_GRID).map((gift, gIdx) => (
                <TouchableOpacity
                  key={gift.id || gift._id || gIdx}
                  style={styles.giftGridItem}
                  onPress={() => navigation.navigate('GiftsScreen')}
                  activeOpacity={0.75}
                >
                  <View style={[styles.giftThumbBox, { backgroundColor: gift.bg || '#FDF2F8' }]}>
                    {gift.imageUrl || gift.image ? (
                      <Image source={{ uri: gift.imageUrl || gift.image }} style={{ width: 36, height: 36 }} resizeMode="contain" />
                    ) : (
                      <Text style={{ fontSize: 28 }}>{gift.emoji || '🎁'}</Text>
                    )}
                  </View>
                  <View style={styles.giftCountPill}>
                    <Text style={styles.giftCountText}>{gift.count ? (typeof gift.count === 'number' ? `x${gift.count}` : gift.count) : 'x1'}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom Action Bar */}
      {!isOwnProfile ? (
        <View style={[styles.bottomBarContainer, { paddingBottom: bottomSafePadding + 8 }]}>
          {targetUser.isInRoom && (
            <TouchableOpacity
              style={styles.inRoomActionBtn}
              onPress={handleEnterRoom}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="waveform" size={18} color="#FFFFFF" />
              <Text style={styles.inRoomActionText}>Join Room</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.chatActionBtn}
            onPress={handleOpenChat}
            activeOpacity={0.8}
          >
            <Icon name="chatbubble-ellipses-outline" size={19} color="#7C3AED" />
            <Text style={styles.chatActionText}>Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.callActionBtn}
            onPress={handleStartAudioCall}
            disabled={callingInProgress}
            activeOpacity={0.8}
          >
            {callingInProgress ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Icon name="call" size={18} color="#FFFFFF" />
                <Text style={styles.callActionText}>Call ({targetUser.callRate}💎)</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.followActionBtn, isFollowing && styles.followingActionBtn]}
            onPress={handleToggleFollow}
            disabled={followLoading}
            activeOpacity={0.8}
          >
            {followLoading ? (
              <ActivityIndicator size="small" color={isFollowing ? '#4B5563' : '#FFFFFF'} />
            ) : (
              <>
                <Icon
                  name={isFollowing ? 'checkmark' : 'add'}
                  size={19}
                  color={isFollowing ? '#374151' : '#FFFFFF'}
                />
                <Text
                  style={[
                    styles.followActionText,
                    isFollowing && styles.followingActionText,
                  ]}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      ) : null}
    
      {/* ======================================================== */}
      {/* MEDAL STAGE MODAL (Target Preview & Highest Target Tier)  */}
      {/* ======================================================== */}
      <Modal
        visible={showMedalModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMedalModal(false)}
      >
        <View style={styles.medalModalOverlay}>
          <LinearGradient
            colors={['#10061E', '#160B24', '#0D0418']}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Top Bar with Back Button */}
          <View style={[styles.medalModalTopBar, { paddingTop: topSafeInset + 8 }]}>
            <TouchableOpacity
              style={styles.medalModalBackBtn}
              onPress={() => setShowMedalModal(false)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Icon name="chevron-back" size={26} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.medalModalTopTitle}>Medal Target & Prestige</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            contentContainerStyle={{ alignItems: 'center', paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Podium Stage with Light Beam */}
            <View style={styles.medalPodiumContainer}>
              <Image
                source={MEDAL_ASSETS.podium}
                style={styles.medalPodiumImage}
                resizeMode="contain"
              />
              {/* Big Glowing Medal on Top of Podium */}
              <View style={styles.medalBigImageWrap}>
                <Image
                  source={MEDAL_STAGE_TIERS[activeMedalTierIndex].bigImage}
                  style={styles.medalBigImage}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* Medal Title & Description */}
            <Text style={styles.medalStageTitle}>
              {MEDAL_STAGE_TIERS[activeMedalTierIndex].title}
            </Text>
            <Text style={styles.medalStageSubtitle}>
              {MEDAL_STAGE_TIERS[activeMedalTierIndex].subTitle}
            </Text>

            {/* Target Progress Bar */}
            <View style={styles.medalProgressBox}>
              <View style={styles.medalProgressLabels}>
                <Text style={styles.medalProgressLeft}>0</Text>
                <Text style={styles.medalProgressRight}>
                  {MEDAL_STAGE_TIERS[activeMedalTierIndex].target.toLocaleString()}
                </Text>
              </View>
              <View style={styles.medalProgressTrack}>
                <LinearGradient
                  colors={['#F59E0B', '#FBBF24']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.medalProgressFill,
                    {
                      width: `${Math.min(100, Math.round(((targetUser.showcase?.giftsCount || 0) / MEDAL_STAGE_TIERS[activeMedalTierIndex].target) * 100))}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.medalNeedText}>
                {MEDAL_STAGE_TIERS[activeMedalTierIndex].need}
              </Text>
            </View>

            {/* Ornamental Divider Line */}
            <View style={styles.medalOrnamentalDivider}>
              <View style={styles.medalDividerSideLine} />
              <MaterialCommunityIcons name="rhombus" size={10} color="#F59E0B88" />
              <View style={styles.medalDividerSideLine} />
            </View>

            {/* 3 Tier Milestones Chain */}
            <View style={styles.medalMilestonesChain}>
              {MEDAL_STAGE_TIERS.map((tier, tIdx) => {
                const isSelected = tIdx === activeMedalTierIndex;
                return (
                  <React.Fragment key={tier.tierId}>
                    {tIdx > 0 && (
                      <View style={styles.medalChainArrowWrap}>
                        <Text style={styles.medalChainArrow}>»</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={[
                        styles.medalMilestoneItem,
                        isSelected && styles.medalMilestoneItemActive,
                      ]}
                      onPress={() => setActiveMedalTierIndex(tIdx)}
                      activeOpacity={0.8}
                    >
                      <Image
                        source={tier.milestoneIcon}
                        style={styles.medalMilestoneIcon}
                        resizeMode="contain"
                      />
                      <Text
                        style={[
                          styles.medalMilestoneLabel,
                          isSelected && styles.medalMilestoneLabelActive,
                        ]}
                        numberOfLines={1}
                      >
                        {tier.badgeLabel}
                      </Text>
                    </TouchableOpacity>
                  </React.Fragment>
                );
              })}
            </View>

            {/* Open Full Medal Center Button */}
            <TouchableOpacity
              style={styles.medalGoCenterBtn}
              onPress={() => {
                setShowMedalModal(false);
                navigation.navigate('Medal');
              }}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.medalGoCenterBtnGrad}
              >
                <MaterialCommunityIcons name="medal-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.medalGoCenterBtnText}>View All in Medal Center</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
</View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#0F061A',
  },

  // 1. HERO SECTION STYLES
  heroSectionWrap: {
    position: 'relative',
    paddingBottom: 24,
    alignItems: 'center',
    overflow: 'hidden',
  },
  topNavBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  navIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBrandCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBrandText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FDE047',
    letterSpacing: 2,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  // Avatar Wreath
  avatarWrap: {
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarCrownBadge: {
    marginBottom: -8,
    zIndex: 12,
  },
  avatarOuterFrame: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInnerCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: '#F59E0B',
    overflow: 'hidden',
    backgroundColor: '#E11D48',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  wreathWingLeft: {
    position: 'absolute',
    left: -14,
    top: 32,
  },
  wreathWingRight: {
    position: 'absolute',
    right: -14,
    top: 32,
  },

  // Name & ID
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
  },
  countryFlagText: {
    fontSize: 18,
    marginRight: 6,
  },
  userNameText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    maxWidth: 220,
  },
  verifiedCheck: {
    marginLeft: 6,
  },
  yaroIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  yaroIdText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  roleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  roleBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F59E0B',
  },

  // 5 Status Pills
  pillBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  svipPill: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 12,
  },
  svipPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#78350F',
  },
  nicknamePill: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 12,
    borderWidth: 0.8,
    borderColor: '#334155',
  },
  nicknamePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  officialPill: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 12,
  },
  officialPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  wealthLevelPill: {
    backgroundColor: '#EA580C',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 12,
  },
  wealthLevelPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  charmLevelPill: {
    backgroundColor: '#A855F7',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 12,
  },
  charmLevelPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Honor Medals
  honorMedalsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  honorMedalItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  honorMedalCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF44',
  },
  medalDividerLine: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 2,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '90%',
    marginTop: 16,
    paddingVertical: 6,
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statNum: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  goldenArchTrim: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 14,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#F8F9FD',
    borderTopWidth: 2,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },

  // 2. CONTENT CARDS STYLES
  cardsContentWrap: {
    paddingHorizontal: CARD_PADDING,
    paddingTop: 8,
    gap: 12,
  },
  luxuryContentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardHeaderText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardHeaderRightLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderRightLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginRight: 2,
  },

  // Card 1: About Me
  bioContentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bioLabelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
    marginRight: 10,
  },
  bioContentText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 18,
  },

  // Card 2: Club Banner
  clubBannerBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  clubBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
  },
  clubShieldBox: {
    marginRight: 10,
  },
  clubShieldInner: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  clubCenterInfo: {
    flex: 1,
  },
  clubTitleText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  clubLevelPill: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  clubLevelPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  clubRightInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clubMembersCountText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Card 3: CP Banner
  cpBannerBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  cpBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
  },
  cpPartnerCol: {
    alignItems: 'center',
    flex: 1,
  },
  cpAvatarRing: {
    position: 'relative',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#FDA4AF',
  },
  cpAvatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },
  cpCheckCircle: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  cpPartnerNameText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
  },
  cpCenterBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
  },
  cpWingLeft: {
    marginRight: -4,
  },
  cpWingRight: {
    marginLeft: -4,
  },
  cpHeartBadgePill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  cpHeartLevelText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Card 4: Friends
  friendsCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  friendCardItem: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
  },
  friendWingedAvatarWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendAvatarHalo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  friendAvatarThumb: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
  },
  friendCardName: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 6,
    textAlign: 'center',
  },
  friendDaysBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 8,
    marginTop: 4,
  },
  friendDaysBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#475569',
  },
  friendProgressWrap: {
    width: '100%',
    marginTop: 6,
    paddingHorizontal: 2,
  },
  friendProgressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  friendProgressLeftText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
  },
  friendProgressRightText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
  },
  friendProgressBarTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  friendProgressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  friendStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
  },
  friendStatusPillText: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#4F46E5',
  },

  // Card 5: Supporter
  supporterHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  supporterMiniRing: {
    position: 'relative',
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
  },
  supporterMiniThumb: {
    width: '100%',
    height: '100%',
  },
  supporterMiniRankBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supporterMiniRankText: {
    fontSize: 7,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Card 6: Room
  liveRoomTag: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    marginLeft: 6,
  },
  liveRoomTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  activeRoomDesc: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
    marginTop: 4,
  },

  // Card 7: Badges (5-column Grid)
  badgesGridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  badgeGridItem: {
    width: (CARD_INNER_WIDTH - (8 * 4)) / 5,
    alignItems: 'center',
    marginVertical: 4,
  },
  badgeCircleShape: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  badgeLabelPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 4,
  },
  badgeLabelText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#475569',
  },

  // Card 8: Vehicles (4-column Grid)
  vehiclesGridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  vehicleGridItem: {
    width: (CARD_INNER_WIDTH - (8 * 3)) / 4,
    alignItems: 'center',
    marginVertical: 4,
  },
  vehicleThumbBox: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  vehicleTagPill: {
    position: 'absolute',
    top: 3,
    right: 3,
    backgroundColor: '#1E293B',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  vehicleTagText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  vehicleTitleText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
    marginTop: 4,
    textAlign: 'center',
  },

  // Card 9: Frames (4-column Grid)
  framesGridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  frameGridItem: {
    width: (CARD_INNER_WIDTH - (8 * 3)) / 4,
    alignItems: 'center',
    marginVertical: 4,
  },
  frameCircleOuter: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameCircleInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameTitleText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
    marginTop: 4,
    textAlign: 'center',
  },

  // Card 10: Gifts (4-column Grid)
  giftsGridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  giftGridItem: {
    width: (CARD_INNER_WIDTH - (8 * 3)) / 4,
    alignItems: 'center',
    marginVertical: 4,
  },
  giftThumbBox: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  giftCountPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
  },
  giftCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },

  // Floating Bottom Actions
  bottomBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    paddingTop: 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  inRoomActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 20,
  },
  inRoomActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  chatActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  chatActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7C3AED',
    marginLeft: 4,
  },
  callActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
  },
  callActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  followActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
  },
  followingActionBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  followActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  followingActionText: {
    color: '#374151',
  },
  // MEDAL STAGE MODAL STYLES
  medalModalOverlay: {
    flex: 1,
    backgroundColor: '#10061E',
  },
  medalModalTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  medalModalBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalModalTopTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FDE047',
    letterSpacing: 0.5,
  },
  medalPodiumContainer: {
    width: SCREEN_WIDTH,
    height: 310,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: 10,
  },
  medalPodiumImage: {
    position: 'absolute',
    bottom: 0,
    width: SCREEN_WIDTH * 0.85,
    height: 140,
  },
  medalBigImageWrap: {
    position: 'absolute',
    top: 10,
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalBigImage: {
    width: 190,
    height: 190,
  },
  medalStageTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FDE047',
    marginTop: 8,
    textAlign: 'center',
  },
  medalStageSubtitle: {
    fontSize: 13,
    color: '#CBD5E1',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  medalProgressBox: {
    width: SCREEN_WIDTH - 60,
    marginTop: 22,
  },
  medalProgressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  medalProgressLeft: {
    fontSize: 13,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  medalProgressRight: {
    fontSize: 13,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  medalProgressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#334155',
    overflow: 'hidden',
  },
  medalProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  medalNeedText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
  },
  medalOrnamentalDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: SCREEN_WIDTH - 80,
    marginVertical: 22,
  },
  medalDividerSideLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#33415555',
  },
  medalMilestonesChain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  medalChainArrowWrap: {
    paddingHorizontal: 2,
  },
  medalChainArrow: {
    fontSize: 18,
    color: '#F59E0B',
    fontWeight: '900',
  },
  medalMilestoneItem: {
    alignItems: 'center',
    padding: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
    minWidth: 80,
  },
  medalMilestoneItemActive: {
    borderColor: '#F59E0B',
    backgroundColor: '#F59E0B15',
  },
  medalMilestoneIcon: {
    width: 60,
    height: 60,
    marginBottom: 4,
  },
  medalMilestoneLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textAlign: 'center',
  },
  medalMilestoneLabelActive: {
    color: '#FDE047',
  },
  medalGoCenterBtn: {
    width: SCREEN_WIDTH - 60,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 26,
    shadowColor: '#F59E0B',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  medalGoCenterBtnGrad: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalGoCenterBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
