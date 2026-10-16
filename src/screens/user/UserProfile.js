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

const { width } = Dimensions.get('window');

const formatCompactBalance = (value) => {
  const amount = Number(value) || 0;
  if (amount < 1000) return amount.toLocaleString('en-IN');
  if (amount < 100000) return (amount / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  const divisor = amount >= 1000000 ? 1000000 : 1000;
  const suffix = amount >= 1000000 ? 'M' : 'K';
  const compact = amount / divisor;
  return `${compact >= 100 ? compact.toFixed(0) : compact.toFixed(1).replace(/\.0$/, '')}${suffix}`;
};

export default function UserProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomSafePadding = getStackScreenBottomPadding(insets.bottom, 16);
  const { user: currentUser } = useContext(AuthContext);
  const [fetchedUser, setFetchedUser] = useState(null);
  const [activeTab, setActiveTab] = useState('Profile'); // 'Profile' | 'Moment'
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    const fetchUserById = async () => {
      const uid = route.params?.userId || route.params?.id;
      if (uid) {
        try {
          const res = await apiUtil.get(`/user/profile/${uid}`);
          if (res.data?.success && (res.data?.user || res.data?.data)) {
            setFetchedUser(res.data.user || res.data.data);
          }
        } catch (err) {
          console.log('[UserProfile] Profile fetch notice:', err.message);
        }
      }
    };
    fetchUserById();
  }, [route.params?.userId, route.params?.id]);

  const targetUser = useMemo(() => {
    const raw = fetchedUser || route.params?.user || route.params?.host || {};
    const fallbackId = route.params?.userId || route.params?.id || '1000000002';
    return {
      _id: raw._id || raw.id || raw.userId || fallbackId,
      userId: raw.userId || raw.id || fallbackId,
      displayId: raw.displayId || raw.customDisplayId || null,
      customDisplayId: raw.customDisplayId || raw.displayId || null,
      officialDisplayId: raw.officialDisplayId || null,
      isOfficial: Boolean(raw.isOfficial),
      badgeUrl: raw.officialBadgeUrl || raw.uniqueIdBadgeUrl || raw.badgeUrl || null,
      name: raw.name || raw.hostName || 'PIHU',
      avatar: raw.avatar || raw.coverImage || raw.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      image: raw.image || raw.avatar || raw.coverImage,
      equippedFrame: raw.equippedFrame || raw.frame || null,
      equippedFrameAsset: raw.equippedFrameAsset || null,
      gender: raw.gender || 'female',
      age: raw.age ?? 24,
      country: raw.country || 'India',
      level: raw.level ?? 35,
      wealthLevel: raw.wealthLevel ?? 35,
      charmLevel: raw.charmLevel ?? 36,
      svipLevel: raw.svipLevel ?? (raw.isSvip ? 3 : 3),
      isSvip: raw.isSvip !== undefined ? Boolean(raw.isSvip) : true,
      bio:
        raw.bio ||
        raw.about ||
        '^my husband💫JAFAR💫..🧿❤️\ndon\'t touch my id...\nकारण आम्ही एक पुरुषे आसक्त🥺\n❥Dıdıya - 🔥 SIMI ☠️\nBestie Piku🎀🧿👑💎🌍',
      followersCount: Number(raw.followersCount ?? 987),
      followingCount: Number(raw.followingCount ?? 1),
      visitorsCount: Number(raw.visitorsCount ?? 7700),
      // CP details if linked
      cpPartner: raw.cpPartner || {
        name: 'JAFAR',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
        svipLevel: 4,
        days: 345,
        cpLevel: 6,
      },
      // Club info
      club: raw.club || {
        name: 'JP CLUB',
        tag: 'JP',
        members: 131,
        maxMembers: 200,
        isLive: true,
      },
    };
  }, [route.params, fetchedUser]);

  const handleCopyId = () => {
    const idToCopy = targetUser.displayId || targetUser.userId;
    Clipboard.setString(String(idToCopy));
    AlertService.show('Success', `ID ${idToCopy} copied to clipboard!`, 'success');
  };

  const handleShare = async () => {
    try {
      const shareId = targetUser.displayId || targetUser.userId || targetUser._id;
      const shareUrl = `https://yaroapp.in/user/${shareId}`;
      await Share.share({
        title: `${targetUser.name}'s Profile on Yaro`,
        message: `👑 Connect with ${targetUser.name} on Yaro App! (ID: ${shareId})\n👇 Tap to view profile: ${shareUrl}`,
        url: shareUrl,
      });
    } catch (e) {
      console.log('Share error:', e.message);
    }
  };

  const handleToggleFollow = async () => {
    setFollowLoading(true);
    try {
      setIsFollowing((prev) => !prev);
      AlertService.show(
        isFollowing ? 'Unfollowed' : 'Following',
        isFollowing ? `You unfollowed ${targetUser.name}` : `You are now following ${targetUser.name}!`,
        'success'
      );
    } catch (err) {
      console.log('Follow error:', err.message);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleOpenChat = () => {
    navigation.navigate('Chat', {
      user: targetUser,
      chatUser: targetUser,
      conversationId: `conv_${targetUser._id}`,
    });
  };

  const handleFindMe = () => {
    AlertService.show('Find Me', `Locating active voice party room for ${targetUser.name}...`, 'info');
  };

  const handleEnterRoom = () => {
    AlertService.show('Party Room', `Joining ${targetUser.name}'s party room...`, 'info');
  };

  return (
    <View style={styles.screenContainer}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Top Floating Action Bar */}
      <View style={[styles.topActionBar, { paddingTop: topSafeInset + 6 }]}>
        <TouchableOpacity
          style={styles.iconCircleBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Right Action Icons & "In Room" Pill */}
        <View style={styles.topRightWrap}>
          <TouchableOpacity
            style={styles.inRoomPill}
            onPress={handleEnterRoom}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="waveform" size={16} color="#FEF08A" />
            <Text style={styles.inRoomText}>In Room</Text>
          </TouchableOpacity>

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
                { text: 'Report User', onPress: () => AlertService.show('Reported', 'Report submitted to moderators.', 'info') },
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
          { paddingTop: topSafeInset + 46, paddingBottom: bottomSafePadding + 75 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Background Ambience Banner */}
        <LinearGradient
          colors={['#291807', '#42240A', '#1C1005', '#120A03']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.bgAmbience}
        />

        {/* HERO SECTION: DUAL AVATARS WITH ORNATE SVIP CROWNS & CP HEART (Screenshot 2) */}
        <View style={styles.heroAvatarsContainer}>
          {/* Main User Avatar with Eagle Crown Frame */}
          <View style={styles.avatarEagleWrap}>
            <LinearGradient
              colors={['#FDE047', '#EAB308', '#92400E', '#78350F']}
              style={styles.goldenEagleCrownRing}
            >
              <Image source={{ uri: targetUser.avatar }} style={styles.mainAvatarImg} />
            </LinearGradient>

            {/* Eagle Top Crown Crest */}
            <View style={styles.crownTopEagle}>
              <MaterialCommunityIcons name="crown" size={20} color="#FDE047" />
            </View>

            {/* SVIP Plaque Ribbon at base */}
            <LinearGradient
              colors={['#CA8A04', '#78350F', '#451A03']}
              style={styles.avatarSvipPlaque}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.avatarSvipPlaqueText}>
                SVIP{targetUser.svipLevel || 3}
              </Text>
            </LinearGradient>
          </View>

          {/* Center CP Connector Heart with "Lv.6" */}
          {targetUser.cpPartner && (
            <View style={styles.cpCenterConnector}>
              <LinearGradient
                colors={['#FB7185', '#E11D48', '#881337']}
                style={styles.cpHeartBadge}
              >
                <MaterialCommunityIcons name="heart" size={14} color="#FFE4E6" />
                <Text style={styles.cpHeartText}>Lv.{targetUser.cpPartner.cpLevel || 6}</Text>
              </LinearGradient>
              <Text style={styles.cpRosesDecor}>🌹</Text>
            </View>
          )}

          {/* CP Partner Avatar (Purple Angel Wings / Sovereign Frame) */}
          {targetUser.cpPartner && (
            <View style={styles.avatarPartnerWrap}>
              <LinearGradient
                colors={['#C084FC', '#9333EA', '#581C87', '#3B0764']}
                style={styles.purpleWingsCrownRing}
              >
                <Image
                  source={{ uri: targetUser.cpPartner.avatar }}
                  style={styles.partnerAvatarImg}
                />
              </LinearGradient>

              {/* Purple Crown Crest */}
              <View style={styles.crownTopPurple}>
                <MaterialCommunityIcons name="crown" size={18} color="#E9D5FF" />
              </View>

              {/* SVIP4 Plaque Ribbon */}
              <LinearGradient
                colors={['#7E22CE', '#3B0764', '#1E1B4B']}
                style={styles.avatarSvipPlaque}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.avatarPartnerPlaqueText}>
                  SVIP{targetUser.cpPartner.svipLevel || 4}
                </Text>
              </LinearGradient>
            </View>
          )}
        </View>

        {/* User Nickname with Royal Shield & Sparkles */}
        <View style={styles.nameRow}>
          <MaterialCommunityIcons name="shield-star" size={18} color="#FBBF24" style={{ marginRight: 4 }} />
          <Text style={styles.userNameText}>
            💫{targetUser.name}💫
          </Text>
        </View>

        {/* ID Row: Golden ID Seal Badge + Copy + Online status */}
        <View style={styles.idStatusRow}>
          <IdentityDisplayId
            userId={targetUser.userId}
            officialDisplayId={targetUser.displayId || targetUser.officialDisplayId}
            isOfficial={targetUser.isOfficial || Boolean(targetUser.displayId)}
            customDisplayId={targetUser.customDisplayId || targetUser.displayId}
            badgeUrl={targetUser.badgeUrl}
            badgeText="ID"
            fontSize={13}
            textColor="#FDE047"
            showCopy={true}
          />
          <Text style={styles.onlineStatusText}>• Online 27 minutes ago</Text>
        </View>

        {/* Status Pills: SVIP, Wealth, Charm, Gender/Age, Country */}
        <View style={styles.statusPillsRow}>
          {/* SVIP Pill */}
          <LinearGradient
            colors={['#0D9488', '#115E59']}
            style={styles.statusPill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <MaterialCommunityIcons name="shield-crown" size={12} color="#5EEAD4" />
            <Text style={styles.statusPillText}>SVIP{targetUser.svipLevel || 3}</Text>
          </LinearGradient>

          {/* Wealth Level Pill */}
          <LinearGradient
            colors={['#059669', '#047857']}
            style={styles.statusPill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <MaterialCommunityIcons name="diamond-stone" size={12} color="#6EE7B7" />
            <Text style={styles.statusPillText}>Lv.{targetUser.wealthLevel || targetUser.level || 35}</Text>
          </LinearGradient>

          {/* Charm Level Pill */}
          <LinearGradient
            colors={['#16A34A', '#15803D']}
            style={styles.statusPill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <MaterialIcons name="stars" size={12} color="#86EFAC" />
            <Text style={styles.statusPillText}>Lv.{targetUser.charmLevel || 36}</Text>
          </LinearGradient>

          {/* Gender & Age Pill */}
          <View style={styles.genderPill}>
            <Text style={styles.genderPillText}>
              {targetUser.gender === 'female' ? '♀' : '♂'} {targetUser.age || 24}
            </Text>
          </View>

          {/* Country Flag */}
          <View style={styles.countryFlagPill}>
            <Text style={{ fontSize: 13 }}>🇮🇳</Text>
          </View>
        </View>

        {/* 7 MEDALS WALL / SHELF (From Screenshot 2) */}
        <View style={styles.medalsShelfContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.medalsScroll}
          >
            {/* Medal 1: Golden Verified Checkmark */}
            <View style={styles.medalItemWrap}>
              <LinearGradient colors={['#FDE047', '#D97706']} style={styles.medalCircle}>
                <MaterialIcons name="verified" size={24} color="#78350F" />
              </LinearGradient>
              <View style={styles.medalRibbonTiny} />
            </View>

            {/* Medal 2: Diamond Crystal Trophy */}
            <View style={styles.medalItemWrap}>
              <LinearGradient colors={['#93C5FD', '#3B82F6', '#1E40AF']} style={styles.medalCircle}>
                <MaterialCommunityIcons name="trophy-award" size={24} color="#EFF6FF" />
              </LinearGradient>
            </View>

            {/* Medal 3: Red Heart Gem (48M Received) */}
            <View style={styles.medalItemWrap}>
              <LinearGradient colors={['#FDA4AF', '#E11D48', '#881337']} style={styles.medalCircle}>
                <MaterialCommunityIcons name="heart-flash" size={22} color="#FFF1F2" />
              </LinearGradient>
              <Text style={styles.medalMiniSubText}>48M</Text>
            </View>

            {/* Medal 4: Emerald Star Badge (30) */}
            <View style={styles.medalItemWrap}>
              <LinearGradient colors={['#6EE7B7', '#059669', '#064E3B']} style={styles.medalCircle}>
                <Text style={styles.medalNumberText}>30</Text>
              </LinearGradient>
            </View>

            {/* Medal 5: Golden Eagle SVIP Medal */}
            <View style={styles.medalItemWrap}>
              <LinearGradient colors={['#FDE047', '#B45309', '#78350F']} style={styles.medalCircle}>
                <MaterialCommunityIcons name="shield-crown" size={22} color="#FEF08A" />
              </LinearGradient>
            </View>

            {/* Medal 6: Golden Eagle SVIP Medal */}
            <View style={styles.medalItemWrap}>
              <LinearGradient colors={['#FDE047', '#B45309', '#78350F']} style={styles.medalCircle}>
                <MaterialCommunityIcons name="crown" size={22} color="#FEF08A" />
              </LinearGradient>
            </View>

            {/* Medal 7: Golden Eagle SVIP Medal */}
            <View style={styles.medalItemWrap}>
              <LinearGradient colors={['#FDE047', '#B45309', '#78350F']} style={styles.medalCircle}>
                <MaterialCommunityIcons name="medal" size={22} color="#FEF08A" />
              </LinearGradient>
            </View>
          </ScrollView>
        </View>

        {/* Stats Row: Followers | Following | Visitors */}
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

        {/* TAB HEADERS: Profile vs Moment */}
        <View style={styles.tabsHeaderWrap}>
          <TouchableOpacity
            style={styles.tabNavBtn}
            onPress={() => setActiveTab('Profile')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabNavText, activeTab === 'Profile' && styles.tabNavTextActive]}>
              Profile
            </Text>
            {activeTab === 'Profile' && <View style={styles.tabActiveOrangeUnderline} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabNavBtn}
            onPress={() => setActiveTab('Moment')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabNavText, activeTab === 'Moment' && styles.tabNavTextActive]}>
              Moment
            </Text>
            {activeTab === 'Moment' && <View style={styles.tabActiveOrangeUnderline} />}
          </TouchableOpacity>
        </View>

        {/* TAB 1: PROFILE CONTENT */}
        {activeTab === 'Profile' ? (
          <View style={styles.tabBodyContent}>
            {/* About Me Section */}
            <View style={styles.contentSection}>
              <Text style={styles.sectionHeaderTitle}>About Me</Text>
              <View style={styles.bioCard}>
                <Text style={styles.bioLabel}>Bio</Text>
                <Text style={styles.bioBodyText}>{targetUser.bio}</Text>
              </View>
            </View>

            {/* Club Section */}
            <View style={styles.contentSection}>
              <Text style={styles.sectionHeaderTitle}>Club</Text>
              <TouchableOpacity activeOpacity={0.9} style={styles.clubCardWrap}>
                <LinearGradient
                  colors={['#F97316', '#EA580C', '#C2410C']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.clubCardGradient}
                >
                  <View style={styles.clubLeftCol}>
                    <View style={styles.clubLogoCircle}>
                      <MaterialCommunityIcons name="gamepad-circle" size={26} color="#38BDF8" />
                    </View>
                    <View style={styles.clubInfoCol}>
                      <Text style={styles.clubNameText}>{targetUser.club.name}</Text>
                      <View style={styles.clubTagBadge}>
                        <MaterialCommunityIcons name="shield" size={10} color="#38BDF8" />
                        <Text style={styles.clubTagText}>{targetUser.club.tag}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.clubRightCol}>
                    <Text style={styles.clubMembersText}>
                      👥 {targetUser.club.members}/{targetUser.club.maxMembers} ›
                    </Text>
                    {targetUser.club.isLive && (
                      <View style={styles.liveBadgePulse}>
                        <View style={styles.liveDot} />
                        <Text style={styles.liveBadgeText}>LIVE</Text>
                      </View>
                    )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* CP Section (Romantic Roses Banner) */}
            {targetUser.cpPartner && (
              <View style={styles.contentSection}>
                <View style={styles.cpHeaderRow}>
                  <Text style={styles.sectionHeaderTitle}>CP</Text>
                  <View style={styles.cpMicBadge}>
                    <MaterialCommunityIcons name="microphone" size={12} color="#FBBF24" />
                    <Text style={styles.cpMicText}>0 Follow • On Live</Text>
                  </View>
                </View>

                <View style={styles.cpBannerWrap}>
                  <LinearGradient
                    colors={['#F43F5E', '#E11D48', '#BE123C']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.cpBannerGradient}
                  >
                    {/* Floating Rose Petals Backdrop */}
                    <Text style={styles.roseBackgroundDeco}>🌹 🌸 🌹</Text>

                    {/* Left Partner: User */}
                    <View style={styles.cpPartnerCol}>
                      <View style={styles.cpPartnerAvatarWrap}>
                        <Image source={{ uri: targetUser.avatar }} style={styles.cpAvatarImg} />
                      </View>
                      <Text style={styles.cpPartnerNameText} numberOfLines={1}>
                        💫{targetUser.name}💫
                      </Text>
                    </View>

                    {/* Center Crest: 345 Days + Lv.6 Badge */}
                    <View style={styles.cpCenterCrestWrap}>
                      <LinearGradient
                        colors={['#FDA4AF', '#E11D48']}
                        style={styles.cpDaysPill}
                      >
                        <Text style={styles.cpDaysText}>{targetUser.cpPartner.days || 345} Days</Text>
                      </LinearGradient>

                      <LinearGradient
                        colors={['#FDE047', '#EAB308', '#CA8A04']}
                        style={styles.cpLevelRibbon}
                      >
                        <Text style={styles.cpLevelRibbonText}>
                          Lv.{targetUser.cpPartner.cpLevel || 6}
                        </Text>
                      </LinearGradient>
                    </View>

                    {/* Right Partner: JAFAR */}
                    <View style={styles.cpPartnerCol}>
                      <View style={styles.cpPartnerAvatarWrap}>
                        <Image
                          source={{ uri: targetUser.cpPartner.avatar }}
                          style={styles.cpAvatarImg}
                        />
                      </View>
                      <Text style={styles.cpPartnerNameText} numberOfLines={1}>
                        💫{targetUser.cpPartner.name}💫
                      </Text>
                    </View>
                  </LinearGradient>
                </View>
              </View>
            )}
          </View>
        ) : (
          /* TAB 2: MOMENT CONTENT */
          <View style={styles.momentTabContainer}>
            <MaterialCommunityIcons name="camera-iris" size={48} color="#64748B" />
            <Text style={styles.noMomentsText}>No public moments shared yet.</Text>
            <Text style={styles.noMomentsSub}>Check back later to see photos & party highlights!</Text>
          </View>
        )}
      </ScrollView>

      {/* FLOATING BOTTOM ACTION BAR: Find me | Follow | Chat (Screenshot 2) */}
      <View style={[styles.bottomActionBar, { paddingBottom: bottomSafePadding + 6 }]}>
        {/* Button 1: Find Me */}
        <TouchableOpacity
          style={styles.bottomNavAction}
          onPress={handleFindMe}
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
    backgroundColor: 'rgba(234, 179, 8, 0.25)',
    borderWidth: 1,
    borderColor: '#EAB308',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 14,
    gap: 4,
  },
  inRoomText: {
    color: '#FEF08A',
    fontSize: 11,
    fontWeight: '800',
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
  heroAvatarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 6,
    position: 'relative',
  },
  avatarEagleWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goldenEagleCrownRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    padding: 3.5,
    elevation: 8,
    shadowColor: '#F59E0B',
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  mainAvatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 46,
  },
  crownTopEagle: {
    position: 'absolute',
    top: -12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSvipPlaque: {
    position: 'absolute',
    bottom: -6,
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE047',
    elevation: 3,
  },
  avatarSvipPlaqueText: {
    color: '#FEF08A',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cpCenterConnector: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
    marginTop: -8,
  },
  cpHeartBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 12,
    gap: 3,
    borderWidth: 1,
    borderColor: '#FECDD3',
    elevation: 4,
  },
  cpHeartText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  cpRosesDecor: {
    fontSize: 12,
    marginTop: 2,
  },
  avatarPartnerWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  purpleWingsCrownRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    padding: 3.5,
    elevation: 8,
    shadowColor: '#A855F7',
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  partnerAvatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 46,
  },
  crownTopPurple: {
    position: 'absolute',
    top: -12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPartnerPlaqueText: {
    color: '#F5D0FE',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  userNameText: {
    fontSize: 19,
    fontWeight: '900',
    color: '#FEF08A',
    textShadowColor: 'rgba(245, 158, 11, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  idStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    gap: 6,
  },
  onlineStatusText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  statusPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 3,
  },
  statusPillText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
  },
  genderPill: {
    backgroundColor: '#EC4899',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  genderPillText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
  },
  countryFlagPill: {
    paddingHorizontal: 4,
    justifyContent: 'center',
  },
  medalsShelfContainer: {
    width: '100%',
    marginTop: 14,
    paddingHorizontal: 16,
  },
  medalsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: 10,
  },
  medalItemWrap: {
    alignItems: 'center',
    position: 'relative',
  },
  medalCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  medalRibbonTiny: {
    width: 6,
    height: 6,
    backgroundColor: '#EF4444',
    position: 'absolute',
    bottom: -2,
    borderRadius: 2,
  },
  medalMiniSubText: {
    position: 'absolute',
    bottom: -4,
    fontSize: 8,
    fontWeight: '900',
    color: '#FFFFFF',
    backgroundColor: '#BE123C',
    paddingHorizontal: 3,
    borderRadius: 4,
  },
  medalNumberText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: width - 32,
    marginTop: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.2)',
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statVal: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabsHeaderWrap: {
    flexDirection: 'row',
    width: width - 32,
    marginTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabNavBtn: {
    marginRight: 24,
    paddingBottom: 8,
    position: 'relative',
  },
  tabNavText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748B',
  },
  tabNavTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  tabActiveOrangeUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: '#F97316',
    borderRadius: 2,
  },
  tabBodyContent: {
    width: width - 32,
    marginTop: 12,
  },
  contentSection: {
    marginBottom: 16,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  bioCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  bioLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
    marginBottom: 4,
  },
  bioBodyText: {
    fontSize: 13,
    color: '#E2E8F0',
    lineHeight: 18,
  },
  clubCardWrap: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  clubCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  clubLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  clubLogoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
  },
  clubInfoCol: {},
  clubNameText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  clubTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 8,
    marginTop: 3,
    gap: 3,
    alignSelf: 'flex-start',
  },
  clubTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#38BDF8',
  },
  clubRightCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  clubMembersText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  liveBadgePulse: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 4,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFFFFF',
  },
  liveBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '900',
  },
  cpHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cpMicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  cpMicText: {
    fontSize: 10.5,
    color: '#FEF08A',
    fontWeight: '700',
  },
  cpBannerWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FB7185',
  },
  cpBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    position: 'relative',
  },
  roseBackgroundDeco: {
    position: 'absolute',
    opacity: 0.15,
    fontSize: 32,
    right: 20,
  },
  cpPartnerCol: {
    alignItems: 'center',
    maxWidth: 90,
  },
  cpPartnerAvatarWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    marginBottom: 4,
  },
  cpAvatarImg: {
    width: '100%',
    height: '100%',
  },
  cpPartnerNameText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cpCenterCrestWrap: {
    alignItems: 'center',
    gap: 4,
  },
  cpDaysPill: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  cpDaysText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  cpLevelRibbon: {
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 8,
    elevation: 3,
  },
  cpLevelRibbonText: {
    color: '#78350F',
    fontSize: 10,
    fontWeight: '900',
  },
  momentTabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noMomentsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 8,
  },
  noMomentsSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#120A03',
    borderTopWidth: 1,
    borderTopColor: 'rgba(217, 119, 6, 0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 8,
  },
  bottomNavAction: {
    alignItems: 'center',
    flex: 1,
  },
  bottomIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  bottomActionText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
