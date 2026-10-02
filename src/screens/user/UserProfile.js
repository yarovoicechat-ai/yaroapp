import React, { useState, useContext, useMemo } from 'react';
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
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AuthContext } from '../../context/AuthProvider';
import { AlertService } from '../../utils/AlertService';
import AvatarWithFrame from '../../components/AvatarWithFrame';
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
  const bottomSafePadding = getStackScreenBottomPadding(insets.bottom, 20);
  const { user: currentUser } = useContext(AuthContext);
  const [fetchedUser, setFetchedUser] = useState(null);

  useEffect(() => {
    const fetchUserById = async () => {
      const uid = route.params?.userId || route.params?.id;
      if (uid && (!route.params?.user?.name && !route.params?.host?.name)) {
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
    const fallbackId = route.params?.userId || route.params?.id || '10000001';
    return {
      _id: raw._id || raw.id || raw.userId || fallbackId,
      userId: raw.userId || raw.id || fallbackId,
      name: raw.name || raw.hostName || (fallbackId ? `User #${fallbackId}` : 'Voice Host'),
      avatar: raw.avatar || raw.coverImage || raw.image || 'https://api.yaroapp.in/uploads/avatars/female_default.webp',
      image: raw.image || raw.avatar || raw.coverImage,
      equippedFrame: raw.equippedFrame || raw.frame || 'Rose frame',
      equippedMicWave: raw.equippedMicWave || 'Cyber Neon Wave',
      gender: raw.gender || 'female',
      age: raw.age || '22',
      country: raw.country || 'India 🇮🇳',
      level: raw.level || 15,
      isVerified: Boolean(raw.isVerified ?? true),
      bio: raw.bio || raw.about || 'Welcome to my world! Let’s talk, laugh & enjoy great voice parties 💖',
      followersCount: raw.followersCount || 1240,
      followingCount: raw.followingCount || 86,
      visitorsCount: raw.visitorsCount || 540,
      languages: Array.isArray(raw.language) ? raw.language : ['Hindi', 'English'],
      isSvip: Boolean(raw.isSvip ?? true),
    };
  }, [route.params, fetchedUser]);

  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('About'); // 'About' | 'Honor'
  const [followLoading, setFollowLoading] = useState(false);

  const handleCopyId = () => {
    Clipboard.setString(String(targetUser.userId));
    AlertService.show('Success', 'User ID copied to clipboard!', 'success');
  };

  const handleShare = async () => {
    try {
      const shareId = targetUser.userId || targetUser._id;
      const shareUrl = `https://yaroapp.in/user/${shareId}`;
      await Share.share({
        title: `${targetUser.name}'s Profile on Yaro`,
        message: `👤 Connect with ${targetUser.name} on Yaro App! (ID: ${shareId})\n👇 Tap to view profile: ${shareUrl}`,
        url: shareUrl,
      });
    } catch (e) {
      console.log('Share error:', e.message);
    }
  };

  const handleToggleFollow = async () => {
    setFollowLoading(true);
    try {
      // Simulate follow API
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

  const handleStartCall = () => {
    navigation.navigate('OutGoing', {
      caller: targetUser,
      targetUserId: targetUser._id,
      targetUserName: targetUser.name,
      targetUserAvatar: targetUser.avatar,
    });
  };

  const handleOpenChat = () => {
    navigation.navigate('Chat', {
      user: targetUser,
      chatUser: targetUser,
      conversationId: `conv_${targetUser._id}`,
    });
  };

  const handleSendGift = () => {
    AlertService.show('Send Gift', `Gift tray opened for ${targetUser.name}!`, 'info');
  };

  const handleBlockUser = () => {
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${targetUser.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () => {
            AlertService.show('Blocked', `${targetUser.name} has been blocked.`, 'success');
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.screenContainer}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Top Floating Action Bar */}
      <View style={[styles.topActionBar, { paddingTop: topSafeInset + 6 }]}>
        <TouchableOpacity
          style={styles.iconCircleBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.topRightBtns}>
          <TouchableOpacity
            style={styles.iconCircleBtn}
            onPress={handleShare}
            activeOpacity={0.8}
          >
            <Ionicons name="share-social-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconCircleBtn}
            onPress={handleBlockUser}
            activeOpacity={0.8}
          >
            <MaterialIcons name="more-vert" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomSafePadding + 76 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Cover Photo Header */}
        <View style={styles.coverHeaderContainer}>
          <LinearGradient
            colors={['#1E1B4B', '#4338CA', '#7C3AED', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.coverGradient}
          >
            <View style={styles.coverDecorativeCircle1} />
            <View style={styles.coverDecorativeCircle2} />
          </LinearGradient>
        </View>

        {/* User Card Body */}
        <View style={styles.userCardBody}>
          {/* Avatar with Frame */}
          <View style={styles.avatarWrap}>
            <AvatarWithFrame
              user={targetUser}
              frame={targetUser.equippedFrame}
              size={90}
              showOnlineDot={true}
              isOnline={true}
            />
          </View>

          {/* User Name & Badges */}
          <View style={styles.nameHeaderRow}>
            <Text style={styles.userNameText} numberOfLines={1}>
              {targetUser.name}
            </Text>
            {targetUser.isVerified && (
              <MaterialIcons name="verified" size={20} color="#2563EB" style={{ marginLeft: 6 }} />
            )}
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>Lv.{targetUser.level}</Text>
            </View>
          </View>

          {/* ID Row */}
          <TouchableOpacity style={styles.idRow} onPress={handleCopyId} activeOpacity={0.7}>
            <Text style={styles.idText}>ID: {targetUser.userId}</Text>
            <Ionicons name="copy-outline" size={13} color="#64748B" style={{ marginLeft: 5 }} />
          </TouchableOpacity>

          {/* Tags Row */}
          <View style={styles.tagsRow}>
            <View style={styles.genderTag}>
              <Text style={styles.genderTagText}>
                {targetUser.gender === 'female' ? '♀' : '♂'} {targetUser.age}
              </Text>
            </View>

            <View style={styles.countryTag}>
              <Text style={styles.countryTagText}>{targetUser.country}</Text>
            </View>

            {targetUser.isSvip && (
              <View style={styles.svipTag}>
                <Text style={styles.svipTagText}>👑 SVIP Noble</Text>
              </View>
            )}
          </View>

          {/* Stats Bar (Following, Followers, Visitors) */}
          <View style={styles.statsBar}>
            <View style={styles.statCol}>
              <Text style={styles.statValue}>{targetUser.followingCount}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statValue}>{formatCompactBalance(targetUser.followersCount)}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statValue}>{formatCompactBalance(targetUser.visitorsCount)}</Text>
              <Text style={styles.statLabel}>Visitors</Text>
            </View>
          </View>
        </View>

        {/* Tab Selector: About vs Honor */}
        <View style={styles.tabSwitchContainer}>
          <TouchableOpacity
            style={[styles.tabSwitchBtn, activeTab === 'About' && styles.tabSwitchBtnActive]}
            onPress={() => setActiveTab('About')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabSwitchText, activeTab === 'About' && styles.tabSwitchTextActive]}>
              About
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabSwitchBtn, activeTab === 'Honor' && styles.tabSwitchBtnActive]}
            onPress={() => setActiveTab('Honor')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabSwitchText, activeTab === 'Honor' && styles.tabSwitchTextActive]}>
              Honor 🎖️
            </Text>
          </TouchableOpacity>
        </View>

        {/* TAB 1: ABOUT */}
        {activeTab === 'About' ? (
          <View style={styles.cardContainer}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color="#7C3AED" />
              <Text style={styles.cardHeaderTitle}>Personal Bio</Text>
            </View>
            <Text style={styles.bioText}>{targetUser.bio}</Text>

            <View style={styles.detailsList}>
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Gender & Age</Text>
                <Text style={styles.detailVal}>
                  {targetUser.gender === 'female' ? 'Female' : 'Male'}, {targetUser.age} yrs
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Languages</Text>
                <Text style={styles.detailVal}>{targetUser.languages.join(', ')}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Country</Text>
                <Text style={styles.detailVal}>{targetUser.country}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Yaro ID</Text>
                <Text style={styles.detailVal}>{targetUser.userId}</Text>
              </View>
            </View>

            {/* Interest Tags */}
            <View style={styles.interestsRow}>
              <View style={styles.interestChip}>
                <Text style={styles.interestChipText}>🎤 Voice Party Host</Text>
              </View>
              <View style={styles.interestChip}>
                <Text style={styles.interestChipText}>🎵 Pop & Acoustic</Text>
              </View>
              <View style={styles.interestChip}>
                <Text style={styles.interestChipText}>✨ Late Night Vibe</Text>
              </View>
            </View>
          </View>
        ) : (
          /* TAB 2: HONOR */
          <View style={styles.cardContainer}>
            <View style={styles.cardHeaderRow}>
              <MaterialCommunityIcons name="trophy-award" size={18} color="#F59E0B" />
              <Text style={styles.cardHeaderTitle}>Honors & Achievements</Text>
            </View>

            {/* Honor Badges Grid */}
            <View style={styles.honorGrid}>
              <View style={styles.honorItem}>
                <LinearGradient colors={['#FEF3C7', '#FDE68A']} style={styles.honorBadgeCircle}>
                  <Text style={{ fontSize: 22 }}>👑</Text>
                </LinearGradient>
                <Text style={styles.honorBadgeName}>Noble SVIP</Text>
                <Text style={styles.honorBadgeSub}>Active Status</Text>
              </View>

              <View style={styles.honorItem}>
                <LinearGradient colors={['#EDE9FE', '#DDD6FE']} style={styles.honorBadgeCircle}>
                  <Text style={{ fontSize: 22 }}>⭐</Text>
                </LinearGradient>
                <Text style={styles.honorBadgeName}>Lv.{targetUser.level} Star</Text>
                <Text style={styles.honorBadgeSub}>Elite Rank</Text>
              </View>

              <View style={styles.honorItem}>
                <LinearGradient colors={['#FCE7F3', '#FBCFE8']} style={styles.honorBadgeCircle}>
                  <Text style={{ fontSize: 22 }}>🌹</Text>
                </LinearGradient>
                <Text style={styles.honorBadgeName}>Top Charm</Text>
                <Text style={styles.honorBadgeSub}>Popular Host</Text>
              </View>

              <View style={styles.honorItem}>
                <LinearGradient colors={['#E0F2FE', '#BAE6FD']} style={styles.honorBadgeCircle}>
                  <Text style={{ fontSize: 22 }}>💎</Text>
                </LinearGradient>
                <Text style={styles.honorBadgeName}>Diamond Gifter</Text>
                <Text style={styles.honorBadgeSub}>Prestigious</Text>
              </View>
            </View>

            {/* Equipped Decor */}
            <View style={styles.equippedDecorBox}>
              <Text style={styles.decorHeaderTitle}>Active Equipment</Text>
              <View style={styles.decorRow}>
                <View style={styles.decorPill}>
                  <Text style={{ fontSize: 18 }}>🌸</Text>
                  <View>
                    <Text style={styles.decorPillTitle}>{targetUser.equippedFrame}</Text>
                    <Text style={styles.decorPillSub}>Avatar Frame</Text>
                  </View>
                </View>
                <View style={styles.decorPill}>
                  <Text style={{ fontSize: 18 }}>🎙️</Text>
                  <View>
                    <Text style={styles.decorPillTitle}>{targetUser.equippedMicWave}</Text>
                    <Text style={styles.decorPillSub}>Mic Soundwave</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Floating Bottom Action Bar (Follow, Chat, Gift, Call) */}
      <View style={[styles.bottomBarWrapper, { paddingBottom: bottomSafePadding + 10 }]}>
        {/* Follow Button */}
        <TouchableOpacity
          style={[styles.followBtn, isFollowing && styles.followBtnActive]}
          onPress={handleToggleFollow}
          activeOpacity={0.85}
          disabled={followLoading}
        >
          <Ionicons
            name={isFollowing ? 'checkmark' : 'add'}
            size={18}
            color={isFollowing ? '#7C3AED' : '#FFFFFF'}
          />
          <Text style={[styles.followBtnText, isFollowing && styles.followBtnTextActive]}>
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>

        {/* Chat Button */}
        <TouchableOpacity
          style={styles.chatActionBtn}
          onPress={handleOpenChat}
          activeOpacity={0.85}
        >
          <Ionicons name="chatbubble-ellipses" size={20} color="#7C3AED" />
          <Text style={styles.chatActionText}>Chat</Text>
        </TouchableOpacity>

        {/* Send Gift Button */}
        <TouchableOpacity
          style={styles.giftActionBtn}
          onPress={handleSendGift}
          activeOpacity={0.85}
        >
          <Text style={{ fontSize: 18 }}>🎁</Text>
          <Text style={styles.giftActionText}>Gift</Text>
        </TouchableOpacity>

        {/* Call Button */}
        <TouchableOpacity
          style={styles.callActionBtn}
          onPress={handleStartCall}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.callGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="call" size={18} color="#FFFFFF" />
            <Text style={styles.callActionText}>Call</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#FAFAFC',
  },
  scrollContent: {
    paddingBottom: 20,
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
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topRightBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  // Cover Photo
  coverHeaderContainer: {
    height: 170,
    width: '100%',
    overflow: 'hidden',
  },
  coverGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  coverDecorativeCircle1: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -30,
    right: -20,
  },
  coverDecorativeCircle2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    bottom: -20,
    left: 40,
  },

  // User Card Body
  userCardBody: {
    backgroundColor: '#FFFFFF',
    marginTop: -40,
    marginHorizontal: 16,
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#7C3AED',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  avatarWrap: {
    marginTop: -45,
    marginBottom: 8,
  },
  nameHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userNameText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    maxWidth: 220,
  },
  levelBadge: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 4,
  },
  levelBadgeText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  idText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  genderTag: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
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
    paddingVertical: 2.5,
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
    paddingVertical: 2.5,
    borderRadius: 12,
  },
  svipTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },

  // Stats Bar
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#E2E8F0',
  },

  // Tab Switch
  tabSwitchContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 4,
  },
  tabSwitchBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabSwitchBtnActive: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tabSwitchText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#64748B',
  },
  tabSwitchTextActive: {
    color: '#7C3AED',
    fontWeight: '800',
  },

  // Tab Cards
  cardContainer: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  bioText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
    marginBottom: 14,
  },
  detailsList: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailKey: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  detailVal: {
    fontSize: 12.5,
    color: '#0F172A',
    fontWeight: '700',
  },
  interestsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  interestChip: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  interestChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },

  // Honor Grid
  honorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginVertical: 10,
  },
  honorItem: {
    width: (width - 76) / 2,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  honorBadgeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  honorBadgeName: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  honorBadgeSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  equippedDecorBox: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
    marginTop: 6,
  },
  decorHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  decorRow: {
    flexDirection: 'row',
    gap: 10,
  },
  decorPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5FF',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    gap: 8,
  },
  decorPillTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#7C3AED',
  },
  decorPillSub: {
    fontSize: 9.5,
    color: '#9333EA',
  },

  // Bottom Action Bar
  bottomBarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingTop: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 24,
    gap: 4,
  },
  followBtnActive: {
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#C084FC',
  },
  followBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  followBtnTextActive: {
    color: '#7C3AED',
  },
  chatActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 24,
    gap: 4,
  },
  chatActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7C3AED',
  },
  giftActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 24,
    gap: 4,
  },
  giftActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D97706',
  },
  callActionBtn: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
  },
  callGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    gap: 6,
  },
  callActionText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
