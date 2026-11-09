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

const PROFILE_ASSETS = {
  crownWreath: require('../../assets/profile_avatar_crown_wreath.png'),
  honorMedals: require('../../assets/profile_honor_medals.png'),
  clubBanner: require('../../assets/profile_club_banner.png'),
  cpBanner: require('../../assets/profile_cp_banner.png'),
  friendsPreview: require('../../assets/profile_friends_preview.png'),
  supportersPreview: require('../../assets/profile_supporters_preview.png'),
  badgesPreview: require('../../assets/profile_badges_preview.png'),
  vehiclesPreview: require('../../assets/profile_vehicles_preview.png'),
  framesPreview: require('../../assets/profile_frames_preview.png'),
  giftsPreview: require('../../assets/profile_gifts_preview.png'),
  headerCrown: require('../../assets/medals/medal_header_crown.png'),
};

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
        '1000000002',
      name: raw.name || raw.hostName || raw.userName || 'Black',
      avatar: raw.avatar || raw.coverImage || raw.image || null,
      country: raw.country || { flag: '🇬🇧', name: 'United Kingdom' },
      isVerified: Boolean(raw.isProfileVerified || raw.isVerified !== false),
      roleBadgeText: raw.roleBadgeText || raw.verifiedTitle || 'Country Manager',
      bio: raw.bio || raw.about || 'Owner of ✔ D A B H A I M A R T I C L U B 🔥',
      followersCount: Number(
        raw.followersCount ?? (Array.isArray(raw.followers) ? raw.followers.length : 150000)
      ),
      followingCount: Number(
        raw.followingCount ?? (Array.isArray(raw.following) ? raw.following.length : 150000)
      ),
      visitorsCount: Number(raw.visitorsCount ?? 150000),
      svipLevel: Number(raw.svipLevel || 1),
      wealthLevel: Number(raw.wealthLevel || 15),
      charmLevel: Number(raw.charmLevel || 15),
      family: family || { name: 'BASTI AGENCY', level: 25, memberCount: 156000 },
      cpPartner: cpPartner || { name: 'Nisha ♡', partnerName: 'Aftab', level: 13 },
      friendsCount: Number(raw.friendsCount ?? 3),
      supportersCount: Number(raw.supportersCount ?? 3),
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

      {/* Light Soft Background for Cards Area */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#F8F9FD' }]} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomSafePadding + 90 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ======================================================== */}
        {/* 1. HERO SECTION: Royal Dark Black/Gold Curved Canopy */}
        {/* ======================================================== */}
        <View style={styles.heroSectionWrap}>
          {/* Deep dark luxury gradient */}
          <LinearGradient
            colors={['#0F0619', '#1A0C2B', '#140A22', '#0A0312']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Watermark Royal Crown in background */}
          <Image
            source={PROFILE_ASSETS.headerCrown}
            style={styles.heroBackgroundCrownWatermark}
            resizeMode="contain"
          />

          {/* Top Navigation Bar inside Hero */}
          <View style={[styles.topNavBar, { paddingTop: topSafeInset + 6 }]}>
            <TouchableOpacity
              style={styles.navIconBtn}
              onPress={handleBack}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.7}
            >
              <Icon name="chevron-back" size={26} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Centered Golden YARO Brand */}
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

          {/* Avatar Crown Wreath Container */}
          <View style={styles.avatarWreathContainer}>
            <Image
              source={PROFILE_ASSETS.crownWreath}
              style={styles.crownWreathImg}
              resizeMode="contain"
            />
            <View style={styles.avatarInnerCircle}>
              <Image
                source={getUserAvatar(targetUser)}
                style={styles.avatarImg}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* User Name + Country Flag + Verified Shield */}
          <View style={styles.nameRow}>
            <Text style={styles.countryFlagText}>{targetUser.country?.flag || '🇬🇧'}</Text>
            <Text style={styles.userNameText} numberOfLines={1}>
              {targetUser.name || 'Black'}
            </Text>
            <MaterialIcons name="verified" size={19} color="#F59E0B" style={styles.verifiedCheck} />
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

          {/* Role Badge: ✔ Country Manager */}
          <View style={styles.roleBadgeRow}>
            <MaterialCommunityIcons
              name="shield-check"
              size={14}
              color="#F59E0B"
              style={{ marginRight: 4 }}
            />
            <Text style={styles.roleBadgeText}>
              {targetUser.roleBadgeText || 'Country Manager'}
            </Text>
          </View>

          {/* 5 Pill Tags Row */}
          <View style={styles.pillBadgesRow}>
            <LinearGradient
              colors={['#FDE68A', '#F59E0B', '#D97706']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.svipPill}
            >
              <Text style={styles.svipPillText}>SVIP {targetUser.svipLevel || 1}</Text>
            </LinearGradient>

            <View style={styles.nicknamePill}>
              <Text style={styles.nicknamePillText}>{targetUser.name || 'Black'}</Text>
            </View>

            <View style={styles.officialPill}>
              <Text style={styles.officialPillText}>OFFICIAL</Text>
            </View>

            <View style={styles.wealthLevelPill}>
              <Text style={styles.wealthLevelPillText}>
                Lev. {targetUser.wealthLevel || 15}
              </Text>
            </View>

            <View style={styles.charmLevelPill}>
              <Text style={styles.charmLevelPillText}>
                Lev. {targetUser.charmLevel || 15}
              </Text>
            </View>
          </View>

          {/* 8 Honor Medals Row */}
          <View style={styles.honorMedalsRowWrap}>
            <Image
              source={PROFILE_ASSETS.honorMedals}
              style={styles.honorMedalsImg}
              resizeMode="contain"
            />
          </View>

          {/* Stats Row: Followers | Following | Visitors */}
          <View style={styles.statsRow}>
            <TouchableOpacity
              style={styles.statCol}
              onPress={() => navigation.navigate('Followers', { tab: 'followers' })}
              activeOpacity={0.7}
            >
              <Text style={styles.statNum}>
                {formatCompactBalance(targetUser.followersCount || 150000)}
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
                {formatCompactBalance(targetUser.followingCount || 150000)}
              </Text>
              <Text style={styles.statLabel}>Followings</Text>
            </TouchableOpacity>

            <View style={styles.statDivider} />

            <TouchableOpacity
              style={styles.statCol}
              onPress={() => navigation.navigate('Visitors')}
              activeOpacity={0.7}
            >
              <Text style={styles.statNum}>
                {formatCompactBalance(targetUser.visitorsCount || 150000)}
              </Text>
              <Text style={styles.statLabel}>Visitors</Text>
            </TouchableOpacity>
          </View>

          {/* Golden Convex Bottom Arch Trim */}
          <View style={styles.goldenArchTrim} />
        </View>

        {/* ======================================================== */}
        {/* 2. CONTENT CARDS (NO MOMENT TAB - AS REQUESTED!) */}
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
              <Text style={styles.bioContentText} numberOfLines={2}>
                {targetUser.bio || 'Owner of ✔ D A B H A I M A R T I C L U B 🔥'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Card 2: Club (Golden Agency Banner) */}
          <View style={styles.luxuryContentCard}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardHeaderText}>Club</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Family')}
              activeOpacity={0.8}
              style={styles.bannerImgBtn}
            >
              <Image
                source={PROFILE_ASSETS.clubBanner}
                style={styles.bannerCardImg}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          {/* Card 3: CP (Couple / Partner) */}
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
              activeOpacity={0.8}
              style={styles.bannerImgBtn}
            >
              <Image
                source={PROFILE_ASSETS.cpBanner}
                style={styles.bannerCardImg}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          {/* Card 4: Friend (3) */}
          <View style={styles.luxuryContentCard}>
            <TouchableOpacity
              style={styles.cardHeaderRow}
              onPress={() => navigation.navigate('Followers', { tab: 'friends' })}
              activeOpacity={0.7}
            >
              <Text style={styles.cardHeaderText}>Friend (3)</Text>
              <Icon name="chevron-forward" size={17} color="#94A3B8" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('Followers', { tab: 'friends' })}
              activeOpacity={0.85}
              style={styles.bannerImgBtn}
            >
              <Image
                source={PROFILE_ASSETS.friendsPreview}
                style={styles.friendsCardImg}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          {/* Card 5: Supporter */}
          <TouchableOpacity
            style={styles.luxuryContentCard}
            onPress={() => navigation.navigate('Ranking')}
            activeOpacity={0.8}
          >
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardHeaderText}>Supporter</Text>
              <View style={styles.supporterAvatarsRight}>
                <Image
                  source={PROFILE_ASSETS.supportersPreview}
                  style={styles.supportersPreviewImg}
                  resizeMode="contain"
                />
                <Icon name="chevron-forward" size={17} color="#94A3B8" style={{ marginLeft: 6 }} />
              </View>
            </View>
          </TouchableOpacity>

          {/* Card 6: Room */}
          <TouchableOpacity
            style={styles.luxuryContentCard}
            onPress={handleEnterRoom}
            activeOpacity={0.8}
          >
            <View style={styles.cardHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.cardHeaderText}>Room</Text>
                {targetUser.isInRoom && (
                  <View style={styles.liveRoomTag}>
                    <Text style={styles.liveRoomTagText}>LIVE</Text>
                  </View>
                )}
              </View>
              <Icon name="chevron-forward" size={17} color="#94A3B8" />
            </View>
            {targetUser.isInRoom && (
              <Text style={styles.activeRoomDesc} numberOfLines={1}>
                {targetUser.currentRoomTitle || `${targetUser.name}'s Live Club`}
              </Text>
            )}
          </TouchableOpacity>

          {/* Card 7: Badge (16) -> Navigates to Medal Center! */}
          <View style={styles.luxuryContentCard}>
            <TouchableOpacity
              style={styles.cardHeaderRow}
              onPress={() => navigation.navigate('Medal')}
              activeOpacity={0.7}
            >
              <Text style={styles.cardHeaderText}>Badge (16)</Text>
              <Icon name="chevron-forward" size={17} color="#94A3B8" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('Medal')}
              activeOpacity={0.85}
              style={styles.bannerImgBtn}
            >
              <Image
                source={PROFILE_ASSETS.badgesPreview}
                style={styles.badgesCardImg}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          {/* Card 8: Vehicle (14) -> Navigates to Store */}
          <View style={styles.luxuryContentCard}>
            <TouchableOpacity
              style={styles.cardHeaderRow}
              onPress={() => navigation.navigate('Store', { category: 'Vehicle' })}
              activeOpacity={0.7}
            >
              <Text style={styles.cardHeaderText}>Vehicle (14)</Text>
              <Icon name="chevron-forward" size={17} color="#94A3B8" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('Store', { category: 'Vehicle' })}
              activeOpacity={0.85}
              style={styles.bannerImgBtn}
            >
              <Image
                source={PROFILE_ASSETS.vehiclesPreview}
                style={styles.vehiclesCardImg}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          {/* Card 9: Frame (12) -> Navigates to Store */}
          <View style={styles.luxuryContentCard}>
            <TouchableOpacity
              style={styles.cardHeaderRow}
              onPress={() => navigation.navigate('Store', { category: 'Frames' })}
              activeOpacity={0.7}
            >
              <Text style={styles.cardHeaderText}>Frame (12)</Text>
              <Icon name="chevron-forward" size={17} color="#94A3B8" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('Store', { category: 'Frames' })}
              activeOpacity={0.85}
              style={styles.bannerImgBtn}
            >
              <Image
                source={PROFILE_ASSETS.framesPreview}
                style={styles.framesCardImg}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          {/* Card 10: Gift (203) -> Navigates to Gifts / Store */}
          <View style={styles.luxuryContentCard}>
            <TouchableOpacity
              style={styles.cardHeaderRow}
              onPress={() => navigation.navigate('GiftsScreen')}
              activeOpacity={0.7}
            >
              <Text style={styles.cardHeaderText}>Gift (203)</Text>
              <Icon name="chevron-forward" size={17} color="#94A3B8" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('GiftsScreen')}
              activeOpacity={0.85}
              style={styles.bannerImgBtn}
            >
              <Image
                source={PROFILE_ASSETS.giftsPreview}
                style={styles.giftsCardImg}
                resizeMode="contain"
              />
            </TouchableOpacity>
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
      ) : (
        <View style={[styles.bottomBarContainer, { paddingBottom: bottomSafePadding + 8 }]}>
          <TouchableOpacity
            style={styles.editProfileFullBtn}
            onPress={() => navigation.navigate('EditProfile')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#FDE68A', '#F59E0B', '#D97706']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.editProfileGradient}
            >
              <Icon name="pencil" size={18} color="#1E1000" style={{ marginRight: 6 }} />
              <Text style={styles.editProfileBtnText}>Edit Profile</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#0F0619',
  },
  heroSectionWrap: {
    width: '100%',
    paddingBottom: 24,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0F0619',
  },
  heroBackgroundCrownWatermark: {
    position: 'absolute',
    top: 40,
    right: -20,
    width: 200,
    height: 160,
    opacity: 0.12,
  },
  topNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  navIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
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
    color: '#F59E0B',
    letterSpacing: 2,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarWreathContainer: {
    width: 140,
    height: 110,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: 4,
    marginBottom: 6,
  },
  crownWreathImg: {
    position: 'absolute',
    width: 136,
    height: 104,
    zIndex: 2,
  },
  avatarInnerCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#F59E0B',
    zIndex: 1,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  countryFlagText: {
    fontSize: 16,
    marginRight: 6,
  },
  userNameText: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  verifiedCheck: {
    marginLeft: 6,
  },
  yaroIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  yaroIdText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#CBD5E1',
    letterSpacing: 0.4,
  },
  roleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FDE68A',
  },
  pillBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  svipPill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
  },
  svipPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E1000',
  },
  nicknamePill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  nicknamePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FDE68A',
  },
  officialPill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  officialPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  wealthLevelPill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  wealthLevelPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  charmLevelPill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: '#7C3AED',
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  charmLevelPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  honorMedalsRowWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  honorMedalsImg: {
    width: width - 48,
    height: 36,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statNum: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11.5,
    color: '#94A3B8',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  goldenArchTrim: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(245, 158, 11, 0.4)',
  },

  /* Cards content container */
  cardsContentWrap: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  luxuryContentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardHeaderText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#1E293B',
  },
  cardHeaderRightLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderRightLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginRight: 2,
  },
  bioContentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 2,
  },
  bioLabelText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#94A3B8',
    marginRight: 12,
  },
  bioContentText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#334155',
    lineHeight: 18,
  },
  bannerImgBtn: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  bannerCardImg: {
    width: width - 60,
    height: (width - 60) * (48 / 445),
  },
  friendsCardImg: {
    width: width - 60,
    height: (width - 60) * (75 / 445),
  },
  supporterAvatarsRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  supportersPreviewImg: {
    width: 90,
    height: 26,
  },
  liveRoomTag: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#EF4444',
  },
  liveRoomTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  activeRoomDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  badgesCardImg: {
    width: width - 60,
    height: (width - 60) * (71 / 445),
  },
  vehiclesCardImg: {
    width: width - 60,
    height: (width - 60) * (36 / 445),
  },
  framesCardImg: {
    width: width - 60,
    height: (width - 60) * (39 / 445),
  },
  giftsCardImg: {
    width: width - 60,
    height: (width - 60) * (86 / 445),
  },

  /* Bottom Bar */
  bottomBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 10,
  },
  chatActionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FAF5FF',
    borderWidth: 1.2,
    borderColor: '#DDD6FE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7C3AED',
    marginLeft: 6,
  },
  followActionBtn: {
    flex: 1.5,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  followGradient: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  followActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  callActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inRoomActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8B5CF6',
  },
  inRoomActionText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  editProfileFullBtn: {
    width: '100%',
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
  },
  editProfileGradient: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editProfileBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E1000',
  },
});
