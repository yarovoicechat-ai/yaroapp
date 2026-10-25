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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AuthContext } from '../../context/AuthProvider';
import { AlertService } from '../../utils/AlertService';
import IdentityDisplayId from '../../components/identity/IdentityDisplayId';
import { apiUtil } from '../../utils/apiUtil';
import { formatCompactBalance } from '../../utils/numberUtil';
import { getUserAvatar } from '../../utils/avatarUtil';

const { width } = Dimensions.get('window');

// Prestige Medals strictly matching Screenshot 3
const PROFILE_MEDALS = [
  { id: 'm1', icon: 'shield-check', colors: ['#F59E0B', '#D97706'], label: 'Verified' },
  { id: 'm2', icon: 'crown', colors: ['#38BDF8', '#0284C7'], label: 'VIP' },
  { id: 'm3', icon: 'heart', colors: ['#EF4444', '#DC2626'], label: '40M' },
  { id: 'm4', icon: 'shield-star', colors: ['#10B981', '#059669'], label: '30' },
  { id: 'm5', icon: 'shield-crown', colors: ['#F59E0B', '#B45309'], label: 'SVIP' },
  { id: 'm6', icon: 'shield-crown', colors: ['#F59E0B', '#B45309'], label: 'SVIP' },
  { id: 'm7', icon: 'shield-crown', colors: ['#F59E0B', '#B45309'], label: 'SVIP' },
];

export default function UserProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomSafePadding = getStackScreenBottomPadding(insets.bottom, 16);
  const { user: currentUser } = useContext(AuthContext);

  const incomingUser = route.params?.user || route.params?.host || null;
  const [fetchedUser, setFetchedUser] = useState(incomingUser);
  const [activeTab, setActiveTab] = useState('Profile'); // 'Profile' | 'Moment'
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
        // Record profile visit
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
    const country = typeof raw.country === 'object' ? raw.country : {};

    const rawCurrentRoom = (raw.isInRoom && raw.currentRoomId) ? raw.currentRoomId : null;

    let lastOnlineText = 'Offline';
    if (raw.isOnline) {
      lastOnlineText = 'Online now';
    } else if (raw.lastOnline || raw.lastActiveAt) {
      const diffMinutes = Math.floor((Date.now() - new Date(raw.lastOnline || raw.lastActiveAt).getTime()) / 60000);
      if (diffMinutes < 1) lastOnlineText = 'Online just now';
      else if (diffMinutes < 60) lastOnlineText = `Online ${diffMinutes}m ago`;
      else if (diffMinutes < 1440) lastOnlineText = `Online ${Math.floor(diffMinutes / 60)}h ago`;
      else lastOnlineText = `Online ${Math.floor(diffMinutes / 1440)}d ago`;
    }

    const cpPartner = (raw.cpPartner && (raw.cpPartner.name || raw.cpPartner.partnerName || raw.cpPartner._id)) ? raw.cpPartner : null;
    const club = (raw.club && raw.club.name) ? raw.club : (raw.fanClub && raw.fanClub.name) ? raw.fanClub : null;

    const realBadges = Array.isArray(raw.equippedBadges) && raw.equippedBadges.length > 0
      ? raw.equippedBadges
      : Array.isArray(raw.honors) && raw.honors.length > 0
      ? raw.honors
      : Array.isArray(raw.badges) && raw.badges.length > 0
      ? raw.badges
      : [];

    return {
      _id: raw._id || raw.id || raw.userId || fallbackId,
      userId: raw.userId || raw.id || fallbackId,
      displayId: raw.customDisplayId || raw.equippedCustomId || raw.uniqueId || raw.displayId || identity.displayId || raw.meethiId || raw.userId || fallbackId || '—',
      customDisplayId: raw.customDisplayId || identity.customDisplayId || raw.equippedCustomId || raw.uniqueId || null,
      officialDisplayId: raw.officialDisplayId || (raw.isOfficial ? raw.displayId : null) || null,
      isOfficial: Boolean(raw.isOfficial || identity.isOfficial),
      badgeUrl: officialBadge.badgeUrl || uniqueIdBadge.badgeIconUrl || raw.officialBadgeUrl || raw.badgeUrl || null,
      uniqueIdBadge,
      isProfileVerified: Boolean(raw.isProfileVerified || raw.isVerified),
      verifiedTitle: raw.verifiedTitle || '',
      name: raw.name || raw.hostName || raw.userName || 'User',
      avatar: raw.avatar || raw.coverImage || raw.image || null,
      gender: raw.gender || '',
      age: raw.age ?? null,
      countryFlag: country.flag || raw.countryFlag || '',
      level: raw.level ?? 1,
      wealthLevel: raw.wealthLevel ?? raw.level ?? 1,
      charmLevel: raw.charmLevel ?? 1,
      vipLevel: Number(raw.vipLevel ?? identity.vipLevel ?? 0),
      svipLevel: Number(raw.svipLevel ?? identity.svipLevel ?? 0),
      isSvip: Boolean(raw.isSvip || (raw.svipLevel && Number(raw.svipLevel) > 0)),
      bio: raw.bio || raw.about || '',
      followersCount: Number(raw.followersCount ?? (Array.isArray(raw.followers) ? raw.followers.length : 0)),
      followingCount: Number(raw.followingCount ?? (Array.isArray(raw.following) ? raw.following.length : 0)),
      visitorsCount: Number(raw.visitorsCount ?? 0),
      cpPartner,
      club,
      badges: realBadges,
      isOnline: Boolean(raw.isOnline),
      lastOnlineText,
      currentRoomId: rawCurrentRoom,
      currentRoomTitle: raw.currentRoomTitle || (rawCurrentRoom ? `${raw.name || 'User'}'s Room` : ''),
      isInRoom: Boolean(rawCurrentRoom),
      isHost: Boolean(raw.isHost ?? (raw.role === 'host' || raw.callRate > 0)),
      callRate: raw.callRate || 20,
      videoCallRate: raw.videoCallRate || 35,
      role: raw.role || '',
      isStaff: Boolean(raw.role === 'admin' || raw.role === 'superAdmin' || raw.isGlobalRoomManager || raw.isStaff),
      equippedTag: raw.equippedTag || raw.equippedEntryTag || raw.equippedTagAsset?.name || null,
      equippedTagAsset: raw.equippedTagAsset || null,
      equippedBadge: raw.equippedBadge || raw.equippedBadgeAsset?.name || null,
      equippedBadgeAsset: raw.equippedBadgeAsset || null,
    };
  }, [route.params, fetchedUser]);

  const handleCopyId = () => {
    const idToCopy = targetUser.displayId || targetUser.userId;
    Clipboard.setString(String(idToCopy));
    AlertService.show('Success', `ID ${idToCopy} copied to clipboard!`, 'success');
  };

  const handleShare = async () => {
    try {
      const shareId = targetUser.displayId || targetUser.userId;
      const shareUrl = `https://yaroapp.in/user/${shareId}`;
      await Share.share({
        title: `${targetUser.name}'s Profile on Yaro`,
        message: `👑 Check out ${targetUser.name}'s profile on Yaro! (ID: ${shareId})\n👇 Tap to view: ${shareUrl}`,
        url: shareUrl,
      });
    } catch (e) {
      console.log('Share error:', e.message);
    }
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

  // Direct In-Room Jump Logic (Requested by user)
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

  // Voice Call Initiation (Requested by user for Hosts)
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

  // Video Call Initiation (Requested by user for Hosts)
  const handleStartVideoCall = async () => {
    if (callingInProgress) return;
    const userDiamonds = Number(currentUser?.diamonds || 0);
    if (userDiamonds < targetUser.videoCallRate) {
      Alert.alert('Insufficient Diamonds', 'Please recharge your diamonds to start a video call.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Recharge', onPress: () => navigation.navigate('Recharge') },
      ]);
      return;
    }

    try {
      setCallingInProgress(true);
      const res = await apiUtil.post('/call/start', {
        hostId: targetUser._id,
        isVideo: true,
        callType: 'video',
      });
      if (res.data?.success && res.data?.data) {
        navigation.navigate('OutGoing', {
          ...res.data.data,
          name: targetUser.name,
          image: targetUser.avatar,
          isCaller: true,
          isVideo: true,
        });
      } else {
        AlertService.show('Video Call Unavailable', res.data?.message || 'Unable to connect video call.', 'error');
      }
    } catch (err) {
      AlertService.show('Video Call Error', err.response?.data?.message || err.message, 'error');
    } finally {
      setCallingInProgress(false);
    }
  };

  return (
    <View style={styles.screenContainer}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Top Floating Action Bar with "In Room" Pill (Screenshot 3) */}
      <View style={[styles.topActionBar, { paddingTop: topSafeInset + 6 }]}>
        <TouchableOpacity
          style={styles.iconCircleBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Icon name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.topRightWrap}>
          {/* "🟡 In Room" Floating Badge that jumps directly into the room! */}
          {targetUser.isInRoom && (
            <TouchableOpacity
              style={styles.inRoomPill}
              onPress={handleEnterRoom}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="waveform" size={15} color="#FDE047" />
              <Text style={styles.inRoomText}>In Room</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.iconCircleBtn}
            onPress={handleShare}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="share-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconCircleBtn}
            onPress={() => {
              Alert.alert('User Options', targetUser.name, [
                { text: 'Report User', onPress: () => AlertService.show('Reported', 'Report submitted.', 'info') },
                { text: 'Block User', style: 'destructive', onPress: () => AlertService.show('Blocked', `${targetUser.name} blocked.`, 'success') },
                { text: 'Cancel', style: 'cancel' },
              ]);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="ellipsis-horizontal" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topSafeInset + 46, paddingBottom: bottomSafePadding + 85 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Warm Golden Sunset Ambience Background (Screenshot 3) */}
        <LinearGradient
          colors={['#78350F', '#B45309', '#F59E0B', '#1E140A']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.7 }}
          style={styles.bgAmbience}
        />

        {/* AVATAR HEADER: DUAL IF REAL CP PARTNER EXISTS, ELSE SINGLE HERO AVATAR */}
        {targetUser.cpPartner ? (
          <View style={styles.heroDualAvatarsContainer}>
            {/* Main User Avatar */}
            <View style={styles.avatarMainCol}>
              <View style={styles.avatarEagleFrameWrap}>
                <LinearGradient
                  colors={['#FDE047', '#EAB308', '#B45309']}
                  style={styles.avatarGoldBorder}
                >
                  <Image
                    source={getUserAvatar(targetUser)}
                    style={styles.mainAvatarImg}
                  />
                </LinearGradient>
                {targetUser.svipLevel > 0 && (
                  <LinearGradient
                    colors={['#CA8A04', '#F59E0B', '#B45309']}
                    style={styles.svipPlaque}
                  >
                    <Text style={styles.svipPlaqueText}>SVIP{targetUser.svipLevel}</Text>
                  </LinearGradient>
                )}
              </View>
            </View>

            {/* Center CP Heart Badge */}
            <View style={styles.cpCenterHeartBadge}>
              <LinearGradient
                colors={['#F43F5E', '#EC4899', '#DB2777']}
                style={styles.cpHeartPill}
              >
                <Text style={styles.cpHeartText}>💖 LV.{targetUser.cpPartner.cpLevel || 1}</Text>
              </LinearGradient>
            </View>

            {/* Right CP Partner Avatar */}
            <View style={styles.avatarPartnerCol}>
              <View style={styles.avatarCrownFrameWrap}>
                <LinearGradient
                  colors={['#A855F7', '#7C3AED', '#581C87']}
                  style={styles.avatarPurpleBorder}
                >
                  <Image
                    source={getUserAvatar(targetUser.cpPartner)}
                    style={styles.partnerAvatarImg}
                  />
                </LinearGradient>
                {targetUser.cpPartner.svipLevel > 0 && (
                  <LinearGradient
                    colors={['#7C3AED', '#A855F7', '#6D28D9']}
                    style={styles.partnerSvipPlaque}
                  >
                    <Text style={styles.partnerSvipText}>SVIP{targetUser.cpPartner.svipLevel}</Text>
                  </LinearGradient>
                )}
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.heroSingleAvatarContainer}>
            <View style={styles.avatarEagleFrameWrap}>
              <LinearGradient
                colors={['#FDE047', '#EAB308', '#B45309']}
                style={styles.singleAvatarGoldBorder}
              >
                <Image
                  source={getUserAvatar(targetUser)}
                  style={styles.singleAvatarImg}
                />
              </LinearGradient>
              {targetUser.svipLevel > 0 && (
                <LinearGradient
                  colors={['#CA8A04', '#F59E0B', '#B45309']}
                  style={styles.singleSvipPlaque}
                >
                  <Text style={styles.svipPlaqueText}>SVIP{targetUser.svipLevel}</Text>
                </LinearGradient>
              )}
            </View>
          </View>
        )}

        {/* User Name */}
        <View style={styles.nameRow}>
          <Text style={styles.userNameText}>{targetUser.name}</Text>
          {targetUser.isProfileVerified && (
            <MaterialIcons name="verified" size={18} color="#38BDF8" style={{ marginLeft: 5 }} />
          )}
        </View>

        {/* ID & Online Status */}
        <View style={styles.idStatusRow}>
          <TouchableOpacity style={styles.idCopyPill} onPress={handleCopyId} activeOpacity={0.8}>
            <Text style={styles.idIcon}>🆔</Text>
            <Text style={styles.idNumberText}>{targetUser.displayId}</Text>
            <Icon name="copy-outline" size={13} color="#FDE047" />
          </TouchableOpacity>
          <Text style={styles.onlineStatusText}>{targetUser.lastOnlineText}</Text>
        </View>

        {/* TAGS ROW */}
        <View style={styles.tagsRow}>
          {/* SVIP Tag */}
          {targetUser.svipLevel > 0 && (
            <LinearGradient colors={['#0D9488', '#115E59']} style={styles.tagPill}>
              <Text style={styles.tagPillText}>🦅 SVIP{targetUser.svipLevel}</Text>
            </LinearGradient>
          )}

          {/* Staff Tag */}
          {(targetUser.isStaff || targetUser.role === 'admin' || targetUser.role === 'superAdmin') && (
            <LinearGradient colors={['#DC2626', '#991B1B']} style={styles.tagPill}>
              <Text style={styles.tagPillText}>🛡️ Staff</Text>
            </LinearGradient>
          )}

          {/* Equipped Custom Tag */}
          {Boolean(targetUser.equippedTag) && (
            <LinearGradient
              colors={[targetUser.equippedTagAsset?.previewColor || '#D97706', '#78350F']}
              style={styles.tagPill}
            >
              <Text style={styles.tagPillText}>
                {targetUser.equippedTagAsset?.metadata?.tagText || targetUser.equippedTag}
              </Text>
            </LinearGradient>
          )}

          {/* Equipped Badge */}
          {Boolean(targetUser.equippedBadge) && (
            <LinearGradient colors={['#7C3AED', '#581C87']} style={styles.tagPill}>
              {targetUser.equippedBadgeAsset?.imageUrl ? (
                <Image
                  source={{ uri: targetUser.equippedBadgeAsset.imageUrl }}
                  style={{ width: 13, height: 13, marginRight: 3 }}
                  resizeMode="contain"
                />
              ) : null}
              <Text style={styles.tagPillText}>
                🏅 {targetUser.equippedBadgeAsset?.name || targetUser.equippedBadge}
              </Text>
            </LinearGradient>
          )}

          {/* Wealth Tag */}
          <LinearGradient colors={['#0284C7', '#0369A1']} style={styles.tagPill}>
            <Text style={styles.tagPillText}>💎 Lv.{targetUser.wealthLevel}</Text>
          </LinearGradient>

          {/* Charm Tag */}
          <LinearGradient colors={['#10B981', '#059669']} style={styles.tagPill}>
            <Text style={styles.tagPillText}>🌿 Lv.{targetUser.charmLevel}</Text>
          </LinearGradient>

          {/* Gender/Age */}
          {(targetUser.gender || targetUser.age) ? (
            <View style={styles.genderAgePill}>
              <Text style={styles.genderIcon}>{targetUser.gender === 'female' ? '♀' : '♂'}</Text>
              {targetUser.age ? <Text style={styles.genderAgeText}>{targetUser.age}</Text> : null}
            </View>
          ) : null}

          {/* Country Flag */}
          {Boolean(targetUser.countryFlag) && (
            <View style={styles.flagPill}>
              <Text style={{ fontSize: 13 }}>{targetUser.countryFlag}</Text>
            </View>
          )}
        </View>

        {/* PRESTIGE MEDALS SHELF (Only rendered if user has real badges) */}
        {targetUser.badges && targetUser.badges.length > 0 && (
          <View style={styles.medalsShelfContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.medalsScroll}>
              {targetUser.badges.map((badge, idx) => {
                const icon = badge.icon || badge.badgeIcon || badge.imageUrl;
                const isUrl = typeof icon === 'string' && (icon.startsWith('http') || icon.startsWith('/'));
                return (
                  <View key={badge.id || badge._id || idx} style={styles.medalCircleWrap}>
                    <LinearGradient
                      colors={badge.colors || ['#F59E0B', '#D97706']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.medalCircle}
                    >
                      {isUrl ? (
                        <Image source={{ uri: icon }} style={{ width: 18, height: 18 }} resizeMode="contain" />
                      ) : (
                        <MaterialCommunityIcons name={badge.icon || 'shield-check'} size={16} color="#FFFFFF" />
                      )}
                    </LinearGradient>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* FOLLOWERS / FOLLOWING / VISITORS STATS ROW (Screenshot 3) */}
        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <Text style={styles.statVal}>{formatCompactBalance(targetUser.followersCount)}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statVal}>{formatCompactBalance(targetUser.followingCount)}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statVal}>{formatCompactBalance(targetUser.visitorsCount)}</Text>
            <Text style={styles.statLabel}>Visitors</Text>
          </View>
        </View>

        {/* TAB HEADERS: Profile | Moment (Screenshot 3) */}
        <View style={styles.tabsHeaderWrap}>
          <TouchableOpacity
            style={styles.tabNavBtn}
            onPress={() => setActiveTab('Profile')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabNavText, activeTab === 'Profile' && styles.tabNavTextActive]}>
              Profile
            </Text>
            {activeTab === 'Profile' && <View style={styles.tabActiveUnderline} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabNavBtn}
            onPress={() => setActiveTab('Moment')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabNavText, activeTab === 'Moment' && styles.tabNavTextActive]}>
              Moment
            </Text>
            {activeTab === 'Moment' && <View style={styles.tabActiveUnderline} />}
          </TouchableOpacity>
        </View>

        {activeTab === 'Profile' ? (
          <View style={styles.tabBodyContent}>
            {/* About Me Section */}
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionTitle}>About Me</Text>
              <View style={styles.bioCard}>
                <Text style={styles.bioLabel}>Bio</Text>
                <Text style={[styles.bioContent, !targetUser.bio && { color: '#64748B', fontStyle: 'italic' }]}>
                  {targetUser.bio || 'No bio added yet.'}
                </Text>
              </View>
            </View>

            {/* Club Section */}
            {targetUser.club && (
              <View style={styles.sectionWrap}>
                <Text style={styles.sectionTitle}>Club</Text>
                <TouchableOpacity
                  style={styles.clubBanner}
                  onPress={() => AlertService.show('Club', `Viewing ${targetUser.club.name} details.`, 'info')}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#EA580C', '#F97316', '#FB923C']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.clubBannerGradient}
                  >
                    <View style={styles.clubLeft}>
                      <View style={styles.clubLogoBox}>
                        <MaterialCommunityIcons name="shield-airplane" size={24} color="#38BDF8" />
                      </View>
                      <View>
                        <Text style={styles.clubNameText}>{targetUser.club.name}</Text>
                        <View style={styles.clubMiniPill}>
                          <Text style={styles.clubMiniPillText}>🛡️ {targetUser.club.name?.slice(0, 4) || 'CLUB'}</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.clubRight}>
                      <View style={styles.clubMembersRow}>
                        <Icon name="people" size={14} color="#FFFFFF" />
                        <Text style={styles.clubMembersText}>
                          {targetUser.club.membersCount || 1}/{targetUser.club.maxMembers || 200}
                        </Text>
                        <Icon name="chevron-forward" size={16} color="#FFFFFF" />
                      </View>
                      {targetUser.club.isLive && (
                        <View style={styles.clubLiveBadge}>
                          <Text style={styles.clubLiveBadgeText}>LIVE</Text>
                        </View>
                      )}
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* CP Section */}
            {targetUser.cpPartner && (
              <View style={styles.sectionWrap}>
                <Text style={styles.sectionTitle}>CP</Text>
                <View style={styles.cpBannerWrap}>
                  <LinearGradient
                    colors={['#FB7185', '#F43F5E', '#E11D48']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.cpBannerGradient}
                  >
                    {/* Left Partner */}
                    <View style={styles.cpPartnerCol}>
                      <Image
                        source={getUserAvatar(targetUser)}
                        style={styles.cpAvatar}
                      />
                      <Text style={styles.cpName} numberOfLines={1}>{targetUser.name}</Text>
                    </View>

                    {/* Center Ribbon */}
                    <View style={styles.cpCenterCol}>
                      <View style={styles.cpDaysPill}>
                        <Text style={styles.cpDaysText}>{targetUser.cpPartner.days || 1} Days</Text>
                      </View>
                      <LinearGradient
                        colors={['#FDE047', '#EAB308']}
                        style={styles.cpLvBadge}
                      >
                        <Text style={styles.cpLvText}>Lv.{targetUser.cpPartner.cpLevel || 1}</Text>
                      </LinearGradient>
                    </View>

                    {/* Right Partner */}
                    <View style={styles.cpPartnerCol}>
                      <Image
                        source={getUserAvatar(targetUser.cpPartner)}
                        style={styles.cpAvatar}
                      />
                      <Text style={styles.cpName} numberOfLines={1}>{targetUser.cpPartner.name}</Text>
                    </View>
                  </LinearGradient>
                </View>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.momentTabContainer}>
            <MaterialCommunityIcons name="camera-iris" size={48} color="#64748B" />
            <Text style={styles.noMomentsText}>No public moments shared yet.</Text>
          </View>
        )}
      </ScrollView>

      {/* FLOATING BOTTOM ACTION BAR: Find me | Follow | Chat + Voice/Video for Hosts (Screenshot 3) */}
      <View style={[styles.bottomActionBar, { paddingBottom: Math.max(bottomSafePadding, 12) }]}>
        {/* Button 1: Find Me (Navigates directly to their active voice room!) */}
        <TouchableOpacity
          style={styles.bottomNavAction}
          onPress={handleEnterRoom}
          activeOpacity={0.8}
        >
          <View style={[styles.bottomIconCircle, { backgroundColor: 'rgba(250, 204, 21, 0.15)' }]}>
            <MaterialCommunityIcons name="radar" size={22} color="#FACC15" />
          </View>
          <Text style={[styles.bottomActionText, { color: '#FACC15' }]}>Find me</Text>
        </TouchableOpacity>

        {/* Button 2: Follow */}
        <TouchableOpacity
          style={styles.bottomNavAction}
          onPress={handleToggleFollow}
          disabled={followLoading}
          activeOpacity={0.8}
        >
          <View style={[styles.bottomIconCircle, { backgroundColor: isFollowing ? 'rgba(34, 197, 94, 0.15)' : 'rgba(168, 85, 247, 0.15)' }]}>
            <Icon
              name={isFollowing ? 'checkmark-circle' : 'person-add'}
              size={20}
              color={isFollowing ? '#22C55E' : '#A855F7'}
            />
          </View>
          <Text style={[styles.bottomActionText, { color: isFollowing ? '#22C55E' : '#A855F7' }]}>
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>

        {/* Button 3: Chat */}
        <TouchableOpacity
          style={styles.bottomNavAction}
          onPress={handleOpenChat}
          activeOpacity={0.8}
        >
          <View style={[styles.bottomIconCircle, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
            <MaterialCommunityIcons name="chat" size={22} color="#22C55E" />
          </View>
          <Text style={[styles.bottomActionText, { color: '#22C55E' }]}>Chat</Text>
        </TouchableOpacity>

        {/* Host Options: Audio Call and Video Call (Requested by user) */}
        {targetUser.isHost && (
          <>
            <TouchableOpacity
              style={styles.bottomNavAction}
              onPress={handleStartAudioCall}
              disabled={callingInProgress}
              activeOpacity={0.8}
            >
              <View style={[styles.bottomIconCircle, { backgroundColor: 'rgba(56, 189, 248, 0.2)' }]}>
                <Icon name="call" size={20} color="#38BDF8" />
              </View>
              <Text style={[styles.bottomActionText, { color: '#38BDF8' }]}>
                Call 💎{targetUser.callRate}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bottomNavAction}
              onPress={handleStartVideoCall}
              disabled={callingInProgress}
              activeOpacity={0.8}
            >
              <View style={[styles.bottomIconCircle, { backgroundColor: 'rgba(236, 72, 153, 0.2)' }]}>
                <Icon name="videocam" size={20} color="#EC4899" />
              </View>
              <Text style={[styles.bottomActionText, { color: '#EC4899' }]}>
                Video 💎{targetUser.videoCallRate}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#0F0904',
  },
  topActionBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 99,
  },
  iconCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topRightWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inRoomPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(180, 83, 9, 0.85)',
    borderWidth: 1,
    borderColor: '#FDE047',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 5,
  },
  inRoomText: {
    color: '#FEF08A',
    fontSize: 12,
    fontWeight: '900',
  },
  scrollContent: {
    alignItems: 'center',
  },
  bgAmbience: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 380,
  },
  heroDualAvatarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    gap: 12,
  },
  heroSingleAvatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    marginBottom: 6,
  },
  singleAvatarGoldBorder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    padding: 3,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  singleAvatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 45,
  },
  singleSvipPlaque: {
    position: 'absolute',
    bottom: -8,
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEF08A',
  },
  avatarMainCol: {
    alignItems: 'center',
  },
  avatarEagleFrameWrap: {
    position: 'relative',
    alignItems: 'center',
  },
  avatarGoldBorder: {
    width: 86,
    height: 86,
    borderRadius: 43,
    padding: 3,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  mainAvatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  svipPlaque: {
    position: 'absolute',
    bottom: -8,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEF08A',
  },
  svipPlaqueText: {
    color: '#0F172A',
    fontSize: 10,
    fontWeight: '900',
  },
  cpCenterHeartBadge: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cpHeartPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  cpHeartText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  avatarPartnerCol: {
    alignItems: 'center',
  },
  avatarCrownFrameWrap: {
    position: 'relative',
    alignItems: 'center',
  },
  avatarPurpleBorder: {
    width: 86,
    height: 86,
    borderRadius: 43,
    padding: 3,
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  partnerAvatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  partnerSvipPlaque: {
    position: 'absolute',
    bottom: -8,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  partnerSvipText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 18,
  },
  nameSparkle: {
    fontSize: 14,
  },
  userNameText: {
    color: '#FDE047',
    fontSize: 18,
    fontWeight: '900',
  },
  idStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  idCopyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  idIcon: {
    fontSize: 12,
  },
  idNumberText: {
    color: '#FDE047',
    fontSize: 13,
    fontWeight: '800',
  },
  onlineStatusText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 16,
  },
  tagPill: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 10,
  },
  tagPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  genderAgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DB2777',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 2,
  },
  genderIcon: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  genderAgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  flagPill: {
    paddingHorizontal: 4,
  },
  medalsShelfContainer: {
    marginVertical: 12,
    width: '100%',
  },
  medalsScroll: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalCircleWrap: {
    alignItems: 'center',
  },
  medalCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 3,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '92%',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 6,
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statVal: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabsHeaderWrap: {
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 10,
  },
  tabNavBtn: {
    paddingVertical: 10,
    marginRight: 24,
    position: 'relative',
  },
  tabNavText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
  },
  tabNavTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  tabActiveUnderline: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#F97316',
    borderRadius: 2,
  },
  tabBodyContent: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  sectionWrap: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  bioCard: {
    backgroundColor: '#1E140A',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.15)',
  },
  bioLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  bioContent: {
    color: '#F1F5F9',
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '600',
  },
  clubBanner: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  clubBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  clubLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  clubLogoBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clubNameText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  clubMiniPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  clubMiniPillText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  clubRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  clubMembersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  clubMembersText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  clubLiveBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  clubLiveBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  cpBannerWrap: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  cpBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  cpPartnerCol: {
    alignItems: 'center',
    gap: 4,
    maxWidth: 90,
  },
  cpAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cpName: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  cpCenterCol: {
    alignItems: 'center',
    gap: 4,
  },
  cpDaysPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  cpDaysText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  cpLvBadge: {
    paddingHorizontal: 8,
    paddingVertical: 1.5,
    borderRadius: 8,
  },
  cpLvText: {
    color: '#0F172A',
    fontSize: 10,
    fontWeight: '900',
  },
  momentTabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  noMomentsText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: 'rgba(15, 9, 4, 0.98)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(251, 191, 36, 0.2)',
  },
  bottomNavAction: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  bottomIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomActionText: {
    fontSize: 10,
    fontWeight: '800',
  },
});
