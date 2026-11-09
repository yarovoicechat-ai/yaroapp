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

const { width } = Dimensions.get('window');

// Default showcase collections strictly matching the new design
const SHOWCASE_BADGES = [
  { id: 'b1', name: 'VIP Legend', icon: 'crown', colors: ['#F59E0B', '#B45309'], sub: 'VIP Legend' },
  { id: 'b2', name: 'Top Speaker', icon: 'microphone-variant', colors: ['#8B5CF6', '#6D28D9'], sub: 'Top Speaker' },
  { id: 'b3', name: 'Room Star', icon: 'star-four-points', colors: ['#38BDF8', '#0284C7'], sub: 'Room Star' },
  { id: 'b4', name: '100-Day Streak', icon: 'fire', colors: ['#EF4444', '#B91C1C'], sub: '100-Day Streak', badgeNum: '100' },
  { id: 'b5', name: 'Royal Supporter', icon: 'heart-flash', colors: ['#EC4899', '#BE185D'], sub: 'Royal Supporter' },
];

const SHOWCASE_VEHICLES = [
  { id: 'v1', name: 'Galaxy Rider', icon: 'car-sports', colors: ['#8B5CF6', '#3B82F6'], sub: 'Galaxy Rider' },
  { id: 'v2', name: 'Golden Pegasus', icon: 'horse-variant-fast', colors: ['#F59E0B', '#D97706'], sub: 'Golden Pegasus' },
  { id: 'v3', name: 'Abyss Dragon', icon: 'motorbike', colors: ['#EF4444', '#7F1D1D'], sub: 'Abyss Dragon' },
  { id: 'v4', name: 'Moon Chariot', icon: 'shield-car', colors: ['#FBBF24', '#B45309'], sub: 'Moon Chariot' },
];

const SHOWCASE_FRAMES = [
  { id: 'f1', name: 'Celestial Crown', icon: 'crown-outline', colors: ['#F59E0B', '#D97706'], sub: 'Celestial Crown' },
  { id: 'f2', name: 'Galaxy Orbit', icon: 'orbit', colors: ['#A855F7', '#7C3AED'], sub: 'Galaxy Orbit' },
  { id: 'f3', name: 'Rose Elegance', icon: 'flower-tulip', colors: ['#E11D48', '#BE185D'], sub: 'Rose Elegance' },
  { id: 'f4', name: 'Ice Crystal', icon: 'snowflake', colors: ['#38BDF8', '#0284C7'], sub: 'Ice Crystal' },
];

const SHOWCASE_GIFTS = [
  { id: 'g1', name: 'Cosmic Castle', icon: 'castle', colors: ['#EC4899', '#8B5CF6'], sub: 'Cosmic Castle' },
  { id: 'g2', name: 'Diamond Heart', icon: 'diamond-stone', colors: ['#A855F7', '#EC4899'], sub: 'Diamond Heart' },
  { id: 'g3', name: 'Golden Lion', icon: 'crown', colors: ['#F59E0B', '#D97706'], sub: 'Golden Lion' },
  { id: 'g4', name: 'Love Hot Air Balloon', icon: 'heart', colors: ['#FB7185', '#F43F5E'], sub: 'Love Hot Air Balloon' },
  { id: 'g5', name: 'Shooting Star', icon: 'star-shooting', colors: ['#60A5FA', '#FBBF24'], sub: 'Shooting Star' },
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

  useEffect(() => {
    const fetchUserById = async () => {
      const uid = route.params?.userId ||
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
    const officialBadge = raw.officialBadge || identity.officialBadge || {};
    const uniqueIdBadge = raw.uniqueIdBadge || identity.uniqueIdBadge || {};

    const rawCurrentRoom = (raw.isInRoom && raw.currentRoomId) ? raw.currentRoomId : null;
    const cpPartner = (raw.cpPartner && (raw.cpPartner.name || raw.cpPartner.partnerName || raw.cpPartner._id)) ? raw.cpPartner : null;
    const family = (raw.family && (raw.family.name || raw.family._id)) ? raw.family : null;

    const showcase = raw.showcase || {};
    const tags = Array.isArray(raw.tags) && raw.tags.length > 0
      ? raw.tags
      : ['🎙️ Voice Host', '🔥 Active', '💎 VIP', '⭐ Top Gifter'];

    return {
      _id: raw._id || raw.id || raw.userId || fallbackId,
      userId: raw.userId || raw.id || fallbackId,
      displayId: raw.customDisplayId || raw.equippedCustomId || raw.uniqueId || raw.displayId || identity.displayId || raw.userId || fallbackId || '1002456',
      name: raw.name || raw.hostName || raw.userName || 'Black',
      avatar: raw.avatar || raw.coverImage || raw.image || null,
      isVerified: Boolean(raw.isProfileVerified || raw.isVerified !== false),
      eliteBadgeText: raw.verifiedTitle || raw.roleTitle || 'Elite Speaker',
      bio: raw.bio || raw.about || '🎙️ Voice lover · Group chat host · Good vibes only ✨\nMusic, late-night talks, and meeting amazing people here. 💜',
      followersCount: Number(raw.followersCount ?? (Array.isArray(raw.followers) ? raw.followers.length : 128600)),
      followingCount: Number(raw.followingCount ?? (Array.isArray(raw.following) ? raw.following.length : 678)),
      visitorsCount: Number(raw.visitorsCount ?? 42300),
      family: family || raw.family || { name: 'Black Empire' },
      cpPartner: cpPartner || raw.cpPartner || { name: 'Luna ♡' },
      friendsCount: Number(raw.friendsCount ?? 2158),
      supportersCount: Number(raw.supportersCount ?? 9642),
      tags,
      showcase,
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
      { text: 'Report User', onPress: () => AlertService.show('Reported', 'Report submitted for review.', 'info') },
      { text: 'Block User', style: 'destructive', onPress: () => AlertService.show('Blocked', `${targetUser.name} has been blocked.`, 'success') },
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
          nextState ? `You are now following ${targetUser.name}!` : `You unfollowed ${targetUser.name}`,
          'success'
        );
      }
    } catch (err) {
      setIsFollowing(!nextState);
      AlertService.show('Notice', err.response?.data?.message || 'Could not update follow status', 'error');
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
        room: {
          _id: String(targetUser.currentRoomId),
          roomId: String(targetUser.currentRoomId),
          title: targetUser.currentRoomTitle,
        },
      });
    } else {
      AlertService.show('Not In Room', `${targetUser.name} is not currently in any voice room.`, 'info');
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
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* Soft Pastel Lavender / Pink Backdrop Gradient */}
      <LinearGradient
        colors={['#EFE7F6', '#F8F1FD', '#FBF6FD', '#FFFFFF']}
        locations={[0, 0.25, 0.55, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Top Navigation Bar */}
      <View style={[styles.topNavBar, { paddingTop: topSafeInset + 6 }]}>
        <TouchableOpacity
          style={styles.navIconBtn}
          onPress={handleBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Icon name="chevron-back" size={26} color="#1E1B2E" />
        </TouchableOpacity>

        <View style={styles.topRightActions}>
          <TouchableOpacity
            style={styles.navIconBtn}
            onPress={handleShare}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Icon name="share-outline" size={23} color="#1E1B2E" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navIconBtn}
            onPress={handleMoreOptions}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Icon name="ellipsis-horizontal" size={24} color="#1E1B2E" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topSafeInset + 48, paddingBottom: bottomSafePadding + 70 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO SECTION: Glowing Waves + Golden Crown Avatar */}
        <View style={styles.heroSection}>
          {/* Subtle audio waveform graphics + mic in the aura */}
          <View style={styles.audioWaveAura}>
            <View style={styles.waveBarsLeft}>
              <View style={[styles.waveBar, { height: 16 }]} />
              <View style={[styles.waveBar, { height: 28 }]} />
              <View style={[styles.waveBar, { height: 42 }]} />
              <View style={[styles.waveBar, { height: 26 }]} />
              <View style={[styles.waveBar, { height: 14 }]} />
            </View>

            <View style={styles.micAuraCircle}>
              <Icon name="mic" size={24} color="#C084FC" />
            </View>
          </View>

          {/* AVATAR WITH MAJESTIC GOLDEN CROWN */}
          <View style={styles.avatarCrownContainer}>
            {/* Golden Tiara Crown on top of Avatar */}
            <View style={styles.goldenCrownWrap}>
              <LinearGradient
                colors={['#FDE047', '#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.crownBase}
              >
                <MaterialCommunityIcons name="crown" size={34} color="#FEF08A" />
              </LinearGradient>
              <View style={styles.crownRubyGem} />
            </View>

            {/* Circular Avatar */}
            <View style={styles.avatarOuterRing}>
              <Image
                source={getUserAvatar(targetUser)}
                style={styles.avatarImg}
              />
            </View>
          </View>

          {/* USER NAME + VERIFIED BLACK CHECKMARK */}
          <View style={styles.nameRow}>
            <Text style={styles.userNameText}>{targetUser.name}</Text>
            {targetUser.isVerified && (
              <MaterialIcons name="verified" size={20} color="#0F172A" style={styles.verifiedCheck} />
            )}
          </View>

          {/* BADGE PILLS ROW: Elite Speaker + ID Pill */}
          <View style={styles.identityPillsRow}>
            <LinearGradient
              colors={['#4C1D95', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.eliteBadgePill}
            >
              <MaterialCommunityIcons name="crown" size={13} color="#FBBF24" />
              <Text style={styles.eliteBadgeText}>{targetUser.eliteBadgeText}</Text>
            </LinearGradient>

            <TouchableOpacity
              style={styles.idPill}
              onPress={handleCopyId}
              activeOpacity={0.7}
            >
              <Text style={styles.idPillText}>ID: {targetUser.displayId}</Text>
              <Icon name="copy-outline" size={12} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* TAG PILLS ROW: Voice Host | Active | VIP | Top Gifter */}
          <View style={styles.tagPillsRow}>
            <View style={[styles.tagPill, { backgroundColor: '#FDF2F8', borderColor: '#FCE7F3' }]}>
              <Text style={[styles.tagPillText, { color: '#BE185D' }]}>🎙️ Voice Host</Text>
            </View>
            <View style={[styles.tagPill, { backgroundColor: '#FFF7ED', borderColor: '#FFEDD5' }]}>
              <Text style={[styles.tagPillText, { color: '#EA580C' }]}>🔥 Active</Text>
            </View>
            <View style={[styles.tagPill, { backgroundColor: '#FEFCE8', borderColor: '#FEF08A' }]}>
              <Text style={[styles.tagPillText, { color: '#CA8A04' }]}>💎 VIP</Text>
            </View>
            <View style={[styles.tagPill, { backgroundColor: '#FDF2F8', borderColor: '#FBCFE8' }]}>
              <Text style={[styles.tagPillText, { color: '#E11D48' }]}>⭐ Top Gifter</Text>
            </View>
          </View>

          {/* STATS ROW: Followers | Following | Visitors */}
          <View style={styles.statsRow}>
            <TouchableOpacity
              style={styles.statCol}
              onPress={() => navigation.navigate('Followers', { tab: 'followers' })}
              activeOpacity={0.7}
            >
              <Text style={styles.statNum}>{formatCompactBalance(targetUser.followersCount)}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>

            <View style={styles.statDivider} />

            <TouchableOpacity
              style={styles.statCol}
              onPress={() => navigation.navigate('Followers', { tab: 'following' })}
              activeOpacity={0.7}
            >
              <Text style={styles.statNum}>{formatCompactBalance(targetUser.followingCount)}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>

            <View style={styles.statDivider} />

            <TouchableOpacity
              style={styles.statCol}
              onPress={() => navigation.navigate('Visitors')}
              activeOpacity={0.7}
            >
              <Text style={styles.statNum}>{formatCompactBalance(targetUser.visitorsCount)}</Text>
              <Text style={styles.statLabel}>Visitors</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* "ABOUT ME" CARD */}
        <View style={styles.cardContainer}>
          <View style={styles.aboutHeaderRow}>
            <View style={styles.aboutTitleWrap}>
              <View style={styles.aboutIconCircle}>
                <Icon name="person" size={15} color="#9333EA" />
              </View>
              <Text style={styles.cardTitle}>About Me</Text>
            </View>

            {isOwnProfile && (
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => navigation.navigate('EditProfile')}
                activeOpacity={0.7}
              >
                <Icon name="pencil" size={13} color="#64748B" />
                <Text style={styles.editText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.bioText}>{targetUser.bio}</Text>
        </View>

        {/* 2X2 QUICK INFO GRID: Family | CP | Friends | Supporters */}
        <View style={styles.gridRowWrap}>
          {/* Card 1: Family */}
          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => navigation.navigate('Family')}
            activeOpacity={0.8}
          >
            <View style={styles.gridCardLeft}>
              <LinearGradient
                colors={['#7C3AED', '#581C87']}
                style={styles.gridIconCircle}
              >
                <MaterialCommunityIcons name="shield-crown" size={18} color="#FBBF24" />
              </LinearGradient>
              <View style={styles.gridTextCol}>
                <Text style={styles.gridTitle}>Family</Text>
                <Text style={styles.gridSub} numberOfLines={1}>{targetUser.family?.name || 'Black Empire'}</Text>
              </View>
            </View>
            <Icon name="chevron-forward" size={16} color="#94A3B8" />
          </TouchableOpacity>

          {/* Card 2: CP */}
          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => navigation.navigate('CpSpace')}
            activeOpacity={0.8}
          >
            <View style={styles.gridCardLeft}>
              <LinearGradient
                colors={['#F43F5E', '#EC4899']}
                style={styles.gridIconCircle}
              >
                <MaterialCommunityIcons name="heart-multiple" size={18} color="#FFFFFF" />
              </LinearGradient>
              <View style={styles.gridTextCol}>
                <Text style={styles.gridTitle}>CP</Text>
                <Text style={styles.gridSub} numberOfLines={1}>{targetUser.cpPartner?.name || 'Luna ♡'}</Text>
              </View>
            </View>
            <Icon name="chevron-forward" size={16} color="#94A3B8" />
          </TouchableOpacity>

          {/* Card 3: Friends */}
          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => navigation.navigate('Followers', { tab: 'friends' })}
            activeOpacity={0.8}
          >
            <View style={styles.gridCardLeft}>
              <LinearGradient
                colors={['#3B82F6', '#1D4ED8']}
                style={styles.gridIconCircle}
              >
                <MaterialCommunityIcons name="account-group" size={18} color="#FFFFFF" />
              </LinearGradient>
              <View style={styles.gridTextCol}>
                <Text style={styles.gridTitle}>Friends</Text>
                <Text style={styles.gridSub} numberOfLines={1}>{formatCompactBalance(targetUser.friendsCount)}</Text>
              </View>
            </View>
            <Icon name="chevron-forward" size={16} color="#94A3B8" />
          </TouchableOpacity>

          {/* Card 4: Supporters */}
          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => navigation.navigate('Ranking')}
            activeOpacity={0.8}
          >
            <View style={styles.gridCardLeft}>
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                style={styles.gridIconCircle}
              >
                <MaterialCommunityIcons name="shield-star" size={18} color="#FEF08A" />
              </LinearGradient>
              <View style={styles.gridTextCol}>
                <Text style={styles.gridTitle}>Supporters</Text>
                <Text style={styles.gridSub} numberOfLines={1}>{formatCompactBalance(targetUser.supportersCount)}</Text>
              </View>
            </View>
            <Icon name="chevron-forward" size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* SECTION 1: BADGES */}
        <View style={styles.showcaseCard}>
          <View style={styles.showcaseHeader}>
            <View style={styles.showcaseTitleLeft}>
              <View style={[styles.showcaseIconWrap, { backgroundColor: '#F3E8FF' }]}>
                <MaterialCommunityIcons name="star-circle" size={16} color="#9333EA" />
              </View>
              <Text style={styles.cardTitle}>Badges</Text>
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate('Medal')}
              style={styles.viewAllBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.viewAllText}>View All ({targetUser.showcase?.badgesCount || 25})</Text>
              <Icon name="chevron-forward" size={14} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.showcaseScroll}>
            {(targetUser.showcase?.badges?.length ? targetUser.showcase.badges : SHOWCASE_BADGES).map((b) => (
              <View key={b.id || b._id} style={styles.showcaseItem}>
                <LinearGradient colors={b.colors || ['#F59E0B', '#B45309']} style={styles.badgeIconCircle}>
                  <MaterialCommunityIcons name={b.icon || 'crown'} size={28} color="#FFFFFF" />
                  {b.badgeNum && (
                    <View style={styles.badgeNumTag}>
                      <Text style={styles.badgeNumTagText}>{b.badgeNum}</Text>
                    </View>
                  )}
                </LinearGradient>
                <Text style={styles.showcaseItemLabel} numberOfLines={1}>{b.name}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* SECTION 2: VEHICLES */}
        <View style={styles.showcaseCard}>
          <View style={styles.showcaseHeader}>
            <View style={styles.showcaseTitleLeft}>
              <View style={[styles.showcaseIconWrap, { backgroundColor: '#EDE9FE' }]}>
                <MaterialCommunityIcons name="car-sports" size={16} color="#7C3AED" />
              </View>
              <Text style={styles.cardTitle}>Vehicles</Text>
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate('Store')}
              style={styles.viewAllBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.viewAllText}>View All ({targetUser.showcase?.vehiclesCount || 18})</Text>
              <Icon name="chevron-forward" size={14} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.showcaseScroll}>
            {(targetUser.showcase?.vehicles?.length ? targetUser.showcase.vehicles : SHOWCASE_VEHICLES).map((v) => (
              <View key={v.id || v._id} style={styles.showcaseItem}>
                <LinearGradient colors={v.colors || ['#8B5CF6', '#3B82F6']} style={styles.vehicleIconCircle}>
                  <MaterialCommunityIcons name={v.icon || 'car-sports'} size={30} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.showcaseItemLabel} numberOfLines={1}>{v.name}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* SECTION 3: FRAMES */}
        <View style={styles.showcaseCard}>
          <View style={styles.showcaseHeader}>
            <View style={styles.showcaseTitleLeft}>
              <View style={[styles.showcaseIconWrap, { backgroundColor: '#EEF2FF' }]}>
                <MaterialCommunityIcons name="image-filter-frames" size={16} color="#4F46E5" />
              </View>
              <Text style={styles.cardTitle}>Frames</Text>
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate('Frame')}
              style={styles.viewAllBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.viewAllText}>View All ({targetUser.showcase?.framesCount || 32})</Text>
              <Icon name="chevron-forward" size={14} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.showcaseScroll}>
            {(targetUser.showcase?.frames?.length ? targetUser.showcase.frames : SHOWCASE_FRAMES).map((f) => (
              <View key={f.id || f._id} style={styles.showcaseItem}>
                <View style={styles.framePreviewWrap}>
                  <LinearGradient colors={f.colors || ['#F59E0B', '#D97706']} style={styles.frameBorderCircle}>
                    <View style={styles.frameInnerHole} />
                  </LinearGradient>
                </View>
                <Text style={styles.showcaseItemLabel} numberOfLines={1}>{f.name}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* SECTION 4: GIFTS */}
        <View style={styles.showcaseCard}>
          <View style={styles.showcaseHeader}>
            <View style={styles.showcaseTitleLeft}>
              <View style={[styles.showcaseIconWrap, { backgroundColor: '#FDF2F8' }]}>
                <MaterialCommunityIcons name="gift-outline" size={16} color="#DB2777" />
              </View>
              <Text style={styles.cardTitle}>Gifts</Text>
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate('GiftsScreen')}
              style={styles.viewAllBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.viewAllText}>View All ({targetUser.showcase?.giftsCount || 56})</Text>
              <Icon name="chevron-forward" size={14} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.showcaseScroll}>
            {(targetUser.showcase?.gifts?.length ? targetUser.showcase.gifts : SHOWCASE_GIFTS).map((g) => (
              <View key={g.id || g.giftId || g._id} style={styles.showcaseItem}>
                <LinearGradient colors={g.colors || ['#EC4899', '#8B5CF6']} style={styles.giftIconCircle}>
                  <MaterialCommunityIcons name={g.icon || 'gift'} size={28} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.showcaseItemLabel} numberOfLines={1}>{g.name}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* FLOATING BOTTOM ACTION BAR: Follow, Chat, Call (if not viewing own profile) */}
      {!isOwnProfile && (
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
            style={styles.followActionBtn}
            onPress={handleToggleFollow}
            disabled={followLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={isFollowing ? ['#6B7280', '#4B5563'] : ['#8B5CF6', '#EC4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.followGradient}
            >
              {followLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Icon name={isFollowing ? 'checkmark' : 'add'} size={18} color="#FFFFFF" />
                  <Text style={styles.followActionText}>{isFollowing ? 'Following' : 'Follow'}</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {targetUser.isHost && (
            <TouchableOpacity
              style={styles.callActionBtn}
              onPress={handleStartAudioCall}
              disabled={callingInProgress}
              activeOpacity={0.8}
            >
              <Icon name="call" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#FAF5FB',
  },
  topNavBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  navIconBtn: {
    padding: 6,
    borderRadius: 20,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scrollContent: {
    paddingHorizontal: 0,
  },

  /* Hero Section */
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    position: 'relative',
  },
  audioWaveAura: {
    position: 'absolute',
    top: 24,
    left: 20,
    right: 20,
    height: 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
    opacity: 0.6,
  },
  waveBarsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 10,
  },
  waveBar: {
    width: 3,
    backgroundColor: '#DDD6FE',
    borderRadius: 2,
  },
  micAuraCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },

  /* Avatar & Crown */
  avatarCrownContainer: {
    alignItems: 'center',
    position: 'relative',
    marginTop: 10,
    zIndex: 5,
  },
  goldenCrownWrap: {
    position: 'absolute',
    top: -24,
    zIndex: 10,
    alignItems: 'center',
  },
  crownBase: {
    width: 52,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  crownRubyGem: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#E11D48',
    position: 'absolute',
    bottom: 4,
    borderWidth: 1,
    borderColor: '#FEF08A',
  },
  avatarOuterRing: {
    width: 106,
    height: 106,
    borderRadius: 53,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    backgroundColor: '#DC2626',
    shadowColor: '#C084FC',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },

  /* Name & Check */
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 6,
  },
  userNameText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  verifiedCheck: {
    marginTop: 2,
  },

  /* Identity Pills: Crown Badge + ID Pill */
  identityPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  eliteBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 20,
    shadowColor: '#7C3AED',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  eliteBadgeText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },
  idPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  idPillText: {
    color: '#475569',
    fontSize: 11.5,
    fontWeight: '600',
  },

  /* Tags Row */
  tagPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 7,
    marginTop: 12,
  },
  tagPill: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 14,
    borderWidth: 1,
  },
  tagPillText: {
    fontSize: 11,
    fontWeight: '700',
  },

  /* Stats Row */
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 18,
    paddingVertical: 8,
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statNum: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },

  /* About Me Card */
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    shadowColor: '#C084FC',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  aboutHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  aboutTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aboutIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
  },
  editText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  bioText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#475569',
  },

  /* 2x2 Grid */
  gridRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 12,
    marginTop: 14,
    justifyContent: 'space-between',
  },
  gridCard: {
    width: (width - 40) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#C084FC',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  gridCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    flex: 1,
  },
  gridIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridTextCol: {
    flex: 1,
  },
  gridTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  gridSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1.5,
  },

  /* Showcase Sections */
  showcaseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    marginHorizontal: 16,
    marginTop: 12,
    paddingTop: 14,
    paddingBottom: 16,
    shadowColor: '#C084FC',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  showcaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  showcaseTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  showcaseIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  showcaseScroll: {
    paddingHorizontal: 14,
    gap: 12,
  },
  showcaseItem: {
    alignItems: 'center',
    width: 66,
  },
  showcaseItemLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
    marginTop: 7,
  },

  badgeIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  badgeNumTag: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  badgeNumTagText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '800',
  },

  vehicleIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },

  framePreviewWrap: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameBorderCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  frameInnerHole: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8FAFC',
  },

  giftIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },

  /* Floating Bottom Action Bar */
  bottomBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3E8FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingTop: 10,
    shadowColor: '#C084FC',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  inRoomActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  inRoomActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  chatActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  chatActionText: {
    color: '#7C3AED',
    fontSize: 13,
    fontWeight: '700',
  },
  followActionBtn: {
    flex: 1,
    marginHorizontal: 8,
  },
  followGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: 22,
  },
  followActionText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  callActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
});
