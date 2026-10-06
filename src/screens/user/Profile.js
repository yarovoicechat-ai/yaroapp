import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Clipboard,
  StatusBar,
  Share,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset } from '../../utils/safeAreaUtils';
import { AuthContext } from '../../context/AuthProvider';
import { AlertService } from '../../utils/AlertService';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AvatarWithFrame from '../../components/AvatarWithFrame';

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

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const navigation = useNavigation();
  const { user, fetchUserProfile, equippedFrame, equippedMicWave } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('About'); // 'About' | 'Honor'

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const handleCopyId = () => {
    if (user?.userId) {
      Clipboard.setString(String(user.userId));
      AlertService.show('Success', 'User ID copied to clipboard!', 'success');
    }
  };

  const handleShareProfile = async () => {
    try {
      const shareId = user?.userId || user?._id || '';
      const shareUrl = `https://yaroapp.in/user/${shareId}`;
      await Share.share({
        title: `${user?.name || 'Yaro User'}'s Profile`,
        message: `👤 Connect with ${user?.name || 'Yaro User'} on Yaro App! (ID: ${shareId})\n👇 Tap to view profile: ${shareUrl}`,
        url: shareUrl,
      });
    } catch (e) {
      console.log('Share error:', e.message);
    }
  };

  return (
    <View style={styles.screenContainer}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" animated />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 30 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Cover Photo / Banner Area */}
        <View style={styles.coverArea}>
          <LinearGradient
            colors={['#1E1B4B', '#312E81', '#6D28D9', '#BE185D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.coverGradient}
          >
            {/* Ambient decorative circles */}
            <View pointerEvents="none" style={[styles.coverCircle, { top: -20, right: -10, width: 140, height: 140 }]} />
            <View pointerEvents="none" style={[styles.coverCircle, { bottom: 20, left: 30, width: 90, height: 90 }]} />

            {/* Header Navigation Bar overlay over Cover */}
            <View style={[styles.headerOverlay, { paddingTop: topSafeInset + 6 }]}>
              {/* Back Button */}
              <TouchableOpacity
                style={styles.headerIconBtn}
                onPress={() => navigation.goBack()}
                activeOpacity={0.8}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
              </TouchableOpacity>

              <Text style={styles.headerTitleText}>Profile</Text>

              <View style={styles.headerRightActions}>
                {/* Share Button */}
                <TouchableOpacity
                  style={[styles.headerIconBtn, { marginRight: 8 }]}
                  onPress={handleShareProfile}
                  activeOpacity={0.8}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name="share-social-outline" size={20} color="#FFFFFF" />
                </TouchableOpacity>

                {/* Edit Profile Icon (Top Right as requested) */}
                <TouchableOpacity
                  style={styles.editHeaderBtn}
                  onPress={() => navigation.navigate('EditProfile')}
                  activeOpacity={0.8}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name="pencil" size={17} color="#FFFFFF" />
                  <Text style={styles.editHeaderBtnText}>Edit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Profile Card Body (Overlapping Cover) */}
        <View style={styles.profileCard}>
          {/* Avatar Section with Frame */}
          <View style={styles.avatarSection}>
            <AvatarWithFrame
              user={user}
              frame={user?.equippedFrameAsset || equippedFrame || user?.equippedFrame || null}
              size={94}
              showOnlineDot={true}
              isOnline={true}
            />
          </View>

          {/* User Name & Badges */}
          <View style={styles.nameSection}>
            <View style={styles.nameRow}>
              <Text style={styles.userNameText} numberOfLines={1}>
                {user?.name || 'Yaro User'}
              </Text>
              {user?.isVerified && (
                <MaterialIcons
                  name="verified"
                  size={20}
                  color="#2563EB"
                  style={{ marginLeft: 6 }}
                />
              )}
              {/* Wealth Level */}
              <TouchableOpacity
                onPress={() => navigation.navigate('Level', { initialTab: 'wealth' })}
                style={[styles.levelBadge, { backgroundColor: '#F59E0B' }]}
                activeOpacity={0.8}
              >
                <Text style={styles.levelBadgeText}>💎 Lv.{user?.wealthLevel || user?.level || 1}</Text>
              </TouchableOpacity>
              {/* Charm Level */}
              <TouchableOpacity
                onPress={() => navigation.navigate('Level', { initialTab: 'charm' })}
                style={[styles.levelBadge, { backgroundColor: '#EC4899', marginLeft: 4 }]}
                activeOpacity={0.8}
              >
                <Text style={styles.levelBadgeText}>🌸 Lv.{user?.charmLevel || 1}</Text>
              </TouchableOpacity>
              {/* Equipped Medal / Badge */}
              {Boolean(user?.equippedBadge) && (
                <View style={[styles.levelBadge, { backgroundColor: '#7C3AED', marginLeft: 4 }]}>
                  <Text style={styles.levelBadgeText} numberOfLines={1}>🏅 {String(user.equippedBadge)}</Text>
                </View>
              )}
            </View>

            {/* ID Row with Copy Button & Custom ID styling */}
            <TouchableOpacity
              style={styles.idRow}
              onPress={handleCopyId}
              activeOpacity={0.7}
            >
              <Text style={styles.userIdText}>
                ID: {user?.userId || user?._id?.slice(-8) || '---'}
              </Text>
              {Boolean(user?.equippedCustomId) && (
                <View style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, marginLeft: 6, borderWidth: 0.8, borderColor: '#F59E0B' }}>
                  <Text style={{ color: '#D97706', fontSize: 10, fontWeight: '800' }}>⭐ {String(user.equippedCustomId)}</Text>
                </View>
              )}
              <Ionicons
                name="copy-outline"
                size={14}
                color="#64748B"
                style={{ marginLeft: 6 }}
              />
            </TouchableOpacity>

            {/* Tag Badges */}
            <View style={styles.tagsRow}>
              <View style={styles.genderTag}>
                <Text style={styles.genderTagText}>
                  {user?.gender === 'female' ? '♀' : '♂'} {user?.age || '22'}
                </Text>
              </View>

              <View style={styles.countryTag}>
                <Text style={styles.countryTagText}>
                  🌍 {typeof user?.country === 'object' ? `${user?.country?.name || ''} ${user?.country?.flag || ''}`.trim() || 'India 🇮🇳' : (user?.country || 'India 🇮🇳')}
                </Text>
              </View>

              <View style={styles.svipTag}>
                <Text style={styles.svipTagText}>👑 SVIP</Text>
              </View>

              {Boolean(user?.isHost || user?.role === 'host') && (
                <View style={styles.hostTag}>
                  <Text style={styles.hostTagText}>🎙️ Official Host</Text>
                </View>
              )}
            </View>
          </View>

          {/* Stats Bar: Following, Followers, Visitors (No Likes option) */}
          <View style={styles.statsBar}>
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => navigation.navigate('Followers', { initialTab: 'Following' })}
              activeOpacity={0.7}
            >
              <Text style={styles.statValue}>
                {user?.followingCount ?? (Array.isArray(user?.following) ? user.following.length : 45)}
              </Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>

            <View style={styles.statDivider} />

            <TouchableOpacity
              style={styles.statItem}
              onPress={() => navigation.navigate('Followers', { initialTab: 'Followers' })}
              activeOpacity={0.7}
            >
              <Text style={styles.statValue}>
                {formatCompactBalance(user?.followersCount || 120)}
              </Text>
              <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>

            <View style={styles.statDivider} />

            <TouchableOpacity
              style={styles.statItem}
              onPress={() => navigation.navigate('Followers', { initialTab: 'Visitors' })}
              activeOpacity={0.7}
            >
              <Text style={styles.statValue}>
                {formatCompactBalance(user?.visitorsCount || 350)}
              </Text>
              <Text style={styles.statLabel}>Visitors</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Switcher: About & Honor */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'About' && styles.tabBtnActive]}
            onPress={() => setActiveTab('About')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabBtnText, activeTab === 'About' && styles.tabBtnTextActive]}>
              About
            </Text>
            {activeTab === 'About' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'Honor' && styles.tabBtnActive]}
            onPress={() => setActiveTab('Honor')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabBtnText, activeTab === 'Honor' && styles.tabBtnTextActive]}>
              Honor 🎖️
            </Text>
            {activeTab === 'Honor' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        </View>

        {/* TAB 1: ABOUT */}
        {activeTab === 'About' ? (
          <View style={styles.tabBody}>
            {/* Status / Bio Card */}
            <View style={styles.infoCard}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="chatbubble-ellipses-outline" size={19} color="#7C3AED" />
                <Text style={styles.cardHeaderTitle}>About Me</Text>
              </View>
              <Text style={styles.bioText}>
                {user?.bio || 'Hey there! Welcome to my voice room. Passionate host, music lover & making friends globally 💕'}
              </Text>
            </View>

            {/* Basic Information Card */}
            <View style={styles.infoCard}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="person-outline" size={19} color="#2563EB" />
                <Text style={styles.cardHeaderTitle}>Basic Information</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Gender & Age</Text>
                <Text style={styles.detailVal}>
                  {user?.gender === 'female' ? 'Female' : 'Male'}, {user?.age || '22'} years
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Languages</Text>
                <Text style={styles.detailVal}>
                  {Array.isArray(user?.language) && user.language.length > 0 ? user.language.join(', ') : 'Hindi, English'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Region / Country</Text>
                <Text style={styles.detailVal}>
                  {typeof user?.country === 'object' ? `${user?.country?.name || ''} ${user?.country?.flag || ''}`.trim() || 'India 🇮🇳' : (user?.country || 'India 🇮🇳')}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Member Since</Text>
                <Text style={styles.detailVal}>Jan 2026</Text>
              </View>
            </View>

            {/* Wealth & Charm Level Cards */}
            <View style={styles.levelCardsRow}>
              <LinearGradient
                colors={['#FFFBEB', '#FEF3C7']}
                style={styles.levelCardHalf}
              >
                <View style={styles.levelCardTop}>
                  <Text style={{ fontSize: 24 }}>💎</Text>
                  <View style={[styles.miniBadge, { backgroundColor: '#F59E0B' }]}>
                    <Text style={styles.miniBadgeText}>Lv.{user?.level || 6}</Text>
                  </View>
                </View>
                <Text style={styles.levelCardTitle}>Wealth Level</Text>
                <Text style={styles.levelCardSub}>Top Gifter Tier</Text>
              </LinearGradient>

              <LinearGradient
                colors={['#FDF2F8', '#FCE7F3']}
                style={styles.levelCardHalf}
              >
                <View style={styles.levelCardTop}>
                  <Text style={{ fontSize: 24 }}>🌸</Text>
                  <View style={[styles.miniBadge, { backgroundColor: '#EC4899' }]}>
                    <Text style={styles.miniBadgeText}>Lv.8</Text>
                  </View>
                </View>
                <Text style={styles.levelCardTitle}>Charm Level</Text>
                <Text style={styles.levelCardSub}>Rising Star</Text>
              </LinearGradient>
            </View>

            {/* Talent Agency Card (If host/agency member) */}
            <View style={styles.infoCard}>
              <View style={styles.cardHeaderRow}>
                <MaterialCommunityIcons name="shield-crown-outline" size={20} color="#7C3AED" />
                <Text style={styles.cardHeaderTitle}>Talent Agency</Text>
              </View>
              <View style={styles.agencyRow}>
                <View style={styles.agencyIconCircle}>
                  <Text style={{ fontSize: 22 }}>👑</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.agencyNameText}>
                    {user?.agencyName || 'Yaro Royal Talent Club'}
                  </Text>
                  <Text style={styles.agencySubText}>
                    ID: {user?.agencyId || 'AG-89421'} • Certified
                  </Text>
                </View>
                <View style={styles.agencyStatusBadge}>
                  <Text style={styles.agencyStatusText}>Official</Text>
                </View>
              </View>
            </View>

            {/* Interest Badges */}
            <View style={styles.infoCard}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="sparkles-outline" size={19} color="#D97706" />
                <Text style={styles.cardHeaderTitle}>Interests & Tags</Text>
              </View>
              <View style={styles.interestChipsRow}>
                <View style={styles.interestChip}>
                  <Text style={styles.interestChipText}>🎵 Singing & Music</Text>
                </View>
                <View style={styles.interestChip}>
                  <Text style={styles.interestChipText}>🎤 Party Rooms</Text>
                </View>
                <View style={styles.interestChip}>
                  <Text style={styles.interestChipText}>💖 Heart-to-Heart</Text>
                </View>
                <View style={styles.interestChip}>
                  <Text style={styles.interestChipText}>☕ Late Night Chill</Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          /* TAB 2: HONOR */
          <View style={styles.tabBody}>
            {/* Honors & Medals Showcase */}
            <View style={styles.infoCard}>
              <View style={styles.cardHeaderRow}>
                <MaterialCommunityIcons name="trophy-award" size={21} color="#F59E0B" />
                <Text style={styles.cardHeaderTitle}>Honors & Badges</Text>
              </View>

              <View style={styles.honorGrid}>
                {/* 1. SVIP Honor */}
                <View style={styles.honorGridItem}>
                  <LinearGradient colors={['#FEF3C7', '#FDE68A']} style={styles.honorBadgeCircle}>
                    <Text style={{ fontSize: 26 }}>👑</Text>
                  </LinearGradient>
                  <Text style={styles.honorBadgeTitle}>King Noble</Text>
                  <Text style={styles.honorBadgeSub}>Active SVIP</Text>
                </View>

                {/* 2. Level Honor */}
                <View style={styles.honorGridItem}>
                  <LinearGradient colors={['#EDE9FE', '#DDD6FE']} style={styles.honorBadgeCircle}>
                    <Text style={{ fontSize: 26 }}>⭐</Text>
                  </LinearGradient>
                  <Text style={styles.honorBadgeTitle}>Lv.{user?.level || 6} Sovereign</Text>
                  <Text style={styles.honorBadgeSub}>Roadmap</Text>
                </View>

                {/* 3. Wealth Honor */}
                <View style={styles.honorGridItem}>
                  <LinearGradient colors={['#E0F2FE', '#BAE6FD']} style={styles.honorBadgeCircle}>
                    <Text style={{ fontSize: 26 }}>💎</Text>
                  </LinearGradient>
                  <Text style={styles.honorBadgeTitle}>Grand Patron</Text>
                  <Text style={styles.honorBadgeSub}>Top Gifter</Text>
                </View>

                {/* 4. Charm Honor */}
                <View style={styles.honorGridItem}>
                  <LinearGradient colors={['#FCE7F3', '#FBCFE8']} style={styles.honorBadgeCircle}>
                    <Text style={{ fontSize: 26 }}>🌹</Text>
                  </LinearGradient>
                  <Text style={styles.honorBadgeTitle}>Rose Star</Text>
                  <Text style={styles.honorBadgeSub}>Popular Voice</Text>
                </View>
              </View>
            </View>

            {/* Active Equipped Decor */}
            <View style={styles.infoCard}>
              <View style={styles.cardHeaderRow}>
                <MaterialCommunityIcons name="diamond-stone" size={20} color="#7C3AED" />
                <Text style={styles.cardHeaderTitle}>Active Equipped Decor</Text>
              </View>

              <View style={styles.decorItemsRow}>
                {/* Equipped Frame */}
                <TouchableOpacity
                  style={styles.decorItemCard}
                  onPress={() => navigation.navigate('MyItems')}
                  activeOpacity={0.8}
                >
                  <View style={styles.decorIconContainer}>
                    <Text style={{ fontSize: 28 }}>🌸</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.decorItemName}>{equippedFrame || user?.equippedFrame || 'Default'}</Text>
                    <Text style={styles.decorItemType}>Avatar Frame • Equipped</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                </TouchableOpacity>

                {/* Equipped Mic Wave */}
                <TouchableOpacity
                  style={styles.decorItemCard}
                  onPress={() => navigation.navigate('MyItems')}
                  activeOpacity={0.8}
                >
                  <View style={[styles.decorIconContainer, { backgroundColor: '#EDE9FE' }]}>
                    <Text style={{ fontSize: 28 }}>🎙️</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.decorItemName}>{equippedMicWave || 'Cyber Neon Wave'}</Text>
                    <Text style={styles.decorItemType}>Mic Soundwave • Equipped</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Fan Club & Room Ranking */}
            <View style={styles.infoCard}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="heart" size={19} color="#EC4899" />
                <Text style={styles.cardHeaderTitle}>Fan Club & Room King</Text>
              </View>

              <View style={styles.fanClubRow}>
                <View style={styles.fanClubIcon}>
                  <Text style={{ fontSize: 24 }}>💖</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.fanClubTitle}>Yaro Sweethearts Fan Club</Text>
                  <Text style={styles.fanClubSub}>Rank #4 this week • 45 active fans</Text>
                </View>
                <TouchableOpacity
                  style={styles.fanClubActionBtn}
                  onPress={() => navigation.navigate('FanClub')}
                >
                  <Text style={styles.fanClubActionText}>View</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Cover photo banner
  coverArea: {
    height: 220,
    width: '100%',
    position: 'relative',
  },
  coverGradient: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  coverCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 100,
    elevation: 10,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  editHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
    marginLeft: 5,
  },

  // Profile Card (Overlapping cover)
  profileCard: {
    marginHorizontal: 16,
    marginTop: -48,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingBottom: 18,
    elevation: 4,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: -48,
  },
  nameSection: {
    alignItems: 'center',
    marginTop: 10,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  userNameText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    maxWidth: 200,
  },
  levelBadge: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  levelBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  userIdText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  genderTag: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  genderTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7C3AED',
  },
  countryTag: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  countryTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4F46E5',
  },
  svipTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  svipTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  hostTag: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  hostTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },

  // Stats Bar (No Likes)
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    marginTop: 16,
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    position: 'relative',
    borderRadius: 12,
  },
  tabBtnActive: {
    backgroundColor: '#FAF5FF',
  },
  tabBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#7C3AED',
    fontWeight: '800',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 2,
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#7C3AED',
  },

  // Tab Body
  tabBody: {
    marginTop: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginLeft: 8,
  },
  bioText: {
    fontSize: 13.5,
    lineHeight: 20,
    color: '#334155',
    fontStyle: 'italic',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  detailKey: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  detailVal: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '700',
  },

  // Level Cards Row
  levelCardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  levelCardHalf: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  levelCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  miniBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  miniBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  levelCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 8,
  },
  levelCardSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },

  // Agency Row
  agencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5FF',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  agencyIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  agencyNameText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  agencySubText: {
    fontSize: 11,
    color: '#7C3AED',
    marginTop: 2,
    fontWeight: '600',
  },
  agencyStatusBadge: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  agencyStatusText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
  },

  // Interests Row
  interestChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestChip: {
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  interestChipText: {
    fontSize: 12,
    color: '#B45309',
    fontWeight: '700',
  },

  // Honors Grid
  honorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  honorGridItem: {
    width: (width - 64 - 12) / 2,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  honorBadgeCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  honorBadgeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  honorBadgeSub: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },

  // Equipped Decor
  decorItemsRow: {
    gap: 10,
  },
  decorItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  decorIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FCE7F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  decorItemName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  decorItemType: {
    fontSize: 11,
    color: '#7C3AED',
    marginTop: 2,
    fontWeight: '600',
  },

  // Fan club row
  fanClubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF2F8',
    padding: 12,
    borderRadius: 14,
  },
  fanClubIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FCE7F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fanClubTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  fanClubSub: {
    fontSize: 11,
    color: '#EC4899',
    marginTop: 2,
    fontWeight: '600',
  },
  fanClubActionBtn: {
    backgroundColor: '#EC4899',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  fanClubActionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
});
