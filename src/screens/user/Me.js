import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Clipboard,
  Alert,
  StatusBar,
  Share,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset, getTabScreenBottomPadding } from '../../utils/safeAreaUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../../context/AuthProvider';
import { AlertService } from '../../utils/AlertService';
import { useTranslation } from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DeviceInfo from 'react-native-device-info';
import { apiUtil } from '../../utils/apiUtil';
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

export default function MeScreen() {
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomTabBarPadding = getTabScreenBottomPadding(insets.bottom);
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { user, fetchUserProfile, logout, loading, equippedFrame } = useContext(AuthContext);
  const [logoutLoading, setLogoutLoading] = useState(false);

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

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const deviceId = await DeviceInfo.getUniqueId();
      if (token) {
        try {
          await apiUtil.post(
            '/auth/user-logout',
            { deviceId, userFrom: 'app' },
            { headers: { Authorization: `Bearer ${token}` }, timeout: 5000 },
          );
        } catch (apiErr) {
          console.log('Server logout call notice:', apiErr.response?.data || apiErr.message);
        }
      }
      await logout();
      navigation
        .getParent()
        ?.reset({ index: 0, routes: [{ name: 'SignIn' }] });
    } catch (err) {
      console.log('❌ Logout error:', err.message);
      await logout();
      navigation
        .getParent()
        ?.reset({ index: 0, routes: [{ name: 'SignIn' }] });
    } finally {
      setLogoutLoading(false);
    }
  };

  const confirmLogout = () => {
    Alert.alert(
      t('profile.logout') || 'Logout',
      'Are you sure you want to log out of your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: handleLogout },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.screenContainer, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" animated />
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.loaderText}>Loading profile...</Text>
      </View>
    );
  }

  const isApprovedHost = Boolean(
    user?.isHost ||
    user?.hostStatus === 'approved' ||
    user?.role === 'host' ||
    user?.isApprovedHost ||
    user?.isHostApproved ||
    user?.hostingApproved ||
    user?.hostingStatus === 'approved'
  );
  const hasAgencyPrivilege = Boolean(
    user?.isAgency ||
    user?.role === 'agency' ||
    user?.isAgencyOwner ||
    user?.hasAgency ||
    user?.role === 'owner' ||
    user?.role === 'operator'
  );
  const hasBdPrivilege = Boolean(
    user?.isBd ||
    user?.role === 'bd' ||
    user?.role === 'admin' ||
    user?.role === 'superAdmin' ||
    user?.isBD
  );

  // 4 items in every line (Row 1: Tasks, Fan Club, Level, Apply Hosting)
  const serviceItems = [
    {
      id: 'tasks',
      label: 'Tasks',
      icon: (
        <View style={[styles.serviceIconCircle, { backgroundColor: '#ECFDF5' }]}>
          <Ionicons name="checkbox-outline" size={26} color="#10B981" />
        </View>
      ),
      onPress: () => navigation.navigate('Tasks'),
    },
    {
      id: 'fanClub',
      label: 'Fan Club',
      icon: (
        <View style={[styles.serviceIconCircle, { backgroundColor: '#FDF2F8' }]}>
          <Ionicons name="heart-outline" size={26} color="#EC4899" />
        </View>
      ),
      onPress: () => navigation.navigate('FanClub'),
    },
    {
      id: 'level',
      label: 'My Level',
      icon: (
        <View style={[styles.serviceIconCircle, { backgroundColor: '#FFFBEB' }]}>
          <MaterialCommunityIcons name="crown" size={26} color="#F59E0B" />
        </View>
      ),
      onPress: () => navigation.navigate('Level'),
    },
    ...(isApprovedHost
      ? [
          {
            id: 'dataCenter',
            label: 'Data Center',
            icon: (
              <View style={[styles.serviceIconCircle, { backgroundColor: '#EEF2FF' }]}>
                <MaterialIcons name="insights" size={26} color="#4F46E5" />
              </View>
            ),
            onPress: () => navigation.navigate('DataCenter'),
          },
        ]
      : [
          {
            id: 'applyHosting',
            label: 'Apply Hosting',
            icon: (
              <View style={[styles.serviceIconCircle, { backgroundColor: '#FDF2F8' }]}>
                <MaterialCommunityIcons name="microphone-variant" size={26} color="#EC4899" />
              </View>
            ),
            onPress: () => navigation.navigate('HostApply'),
          },
        ]),
    {
      id: 'verification',
      label: 'Verification',
      icon: (
        <View style={[styles.serviceIconCircle, { backgroundColor: '#EFF6FF' }]}>
          <MaterialIcons name="verified" size={26} color="#2563EB" />
        </View>
      ),
      onPress: () => navigation.navigate('VerificationHub'),
    },
    {
      id: 'idManage',
      label: 'ID Manage',
      icon: (
        <View style={[styles.serviceIconCircle, { backgroundColor: '#F0F9FF' }]}>
          <Ionicons name="id-card" size={26} color="#0284C7" />
        </View>
      ),
      onPress: () => navigation.navigate('IdManage'),
    },
    {
      id: 'medal',
      label: 'Medal',
      icon: (
        <View style={[styles.serviceIconCircle, { backgroundColor: '#FFFBEB' }]}>
          <MaterialCommunityIcons name="medal" size={26} color="#F59E0B" />
        </View>
      ),
      onPress: () => navigation.navigate('Medal'),
    },
    {
      id: 'store',
      label: 'Store',
      icon: (
        <View style={[styles.serviceIconCircle, { backgroundColor: '#FDF2F8' }]}>
          <Ionicons name="bag-handle" size={25} color="#EC4899" />
        </View>
      ),
      onPress: () => navigation.navigate('Store'),
    },
    {
      id: 'myItems',
      label: 'My Items',
      icon: (
        <View style={[styles.serviceIconCircle, { backgroundColor: '#F5F3FF' }]}>
          <Ionicons name="cube" size={26} color="#8B5CF6" />
        </View>
      ),
      onPress: () => navigation.navigate('MyItems'),
    },
    {
      id: 'callHistory',
      label: 'Call History',
      icon: (
        <View style={[styles.serviceIconCircle, { backgroundColor: '#F0FDF4' }]}>
          <Ionicons name="call" size={25} color="#16A34A" />
        </View>
      ),
      onPress: () => navigation.navigate('CallHistory'),
    },
    {
      id: 'blockedUsers',
      label: 'Blocked Users',
      icon: (
        <View style={[styles.serviceIconCircle, { backgroundColor: '#FEF2F2' }]}>
          <MaterialIcons name="block" size={26} color="#EF4444" />
        </View>
      ),
      onPress: () => navigation.navigate('Blacklist'),
    },
    {
      id: 'rules',
      label: 'Rules',
      icon: (
        <View style={[styles.serviceIconCircle, { backgroundColor: '#FFFBEB' }]}>
          <Ionicons name="document-text" size={25} color="#F59E0B" />
        </View>
      ),
      onPress: () => navigation.navigate('Rules'),
    },
    {
      id: 'helpSupport',
      label: 'Help & Support',
      icon: (
        <View style={[styles.serviceIconCircle, { backgroundColor: '#EFF6FF' }]}>
          <Ionicons name="headset" size={25} color="#2563EB" />
        </View>
      ),
      onPress: () => navigation.navigate('HelpAndSupport'),
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: (
        <View style={[styles.serviceIconCircle, { backgroundColor: '#F1F5F9' }]}>
          <Ionicons name="settings-outline" size={24} color="#475569" />
        </View>
      ),
      onPress: () => navigation.navigate('Setting'),
    },
    {
      id: 'logout',
      label: 'Logout',
      icon: (
        <View style={[styles.serviceIconCircle, { backgroundColor: '#F8FAFC' }]}>
          {logoutLoading ? (
            <ActivityIndicator size="small" color="#64748B" />
          ) : (
            <Ionicons name="log-out-outline" size={26} color="#64748B" />
          )}
        </View>
      ),
      onPress: confirmLogout,
    },
    ...(hasAgencyPrivilege
      ? [
          {
            id: 'agency',
            label: 'Agency Hub',
            icon: (
              <View style={[styles.serviceIconCircle, { backgroundColor: '#FAF5FF' }]}>
                <MaterialCommunityIcons name="shield-crown-outline" size={26} color="#7C3AED" />
              </View>
            ),
            onPress: () => navigation.navigate('AgencyDashboard'),
          },
        ]
      : []),
    ...(hasBdPrivilege
      ? [
          {
            id: 'bdPortal',
            label: 'BD Center',
            icon: (
              <View style={[styles.serviceIconCircle, { backgroundColor: '#FEF3C7' }]}>
                <MaterialCommunityIcons name="account-tie" size={26} color="#D97706" />
              </View>
            ),
            onPress: () => navigation.navigate('BDDashboard'),
          },
        ]
      : []),
  ];

  return (
    <View style={styles.screenContainer}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" animated />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: topSafeInset + 4,
            paddingBottom: bottomTabBarPadding + 20,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header: Title "Me" + Share button only (Settings icon removed as requested) */}
        <View style={styles.headerBar}>
          <View style={styles.headerSidePlaceholder} />
          <Text style={styles.headerTitle}>Me</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              style={styles.settingsHeaderBtn}
              onPress={handleShareProfile}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="share-social-outline" size={20} color="#1E293B" />
            </TouchableOpacity>
          </View>
        </View>

        {/* User Card (Soft Pastel Gradient - Tap navigates to full Profile) */}
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={() => navigation.navigate('Profile')}
          style={styles.userCardWrapper}
        >
          <LinearGradient
            colors={['#F3E8FF', '#EFF6FF', '#FCE7F3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.userCardGradient}
          >
            {/* Avatar Section with Frame */}
            <View style={styles.avatarSection}>
              <AvatarWithFrame
                user={user}
                frame={equippedFrame || user?.equippedFrame || 'Rose frame'}
                size={78}
                showOnlineDot={true}
                isOnline={true}
              />
            </View>

            {/* Info Section */}
            <View style={styles.userInfoSection}>
              <View style={styles.nameRow}>
                <Text style={styles.userNameText} numberOfLines={1}>
                  {user?.name || 'Yaro User'}
                </Text>
                {user?.isVerified && (
                  <MaterialIcons
                    name="verified"
                    size={18}
                    color="#2563EB"
                    style={{ marginLeft: 6 }}
                  />
                )}
                {/* Level badge */}
                <View style={styles.levelBadgeMini}>
                  <Text style={styles.levelBadgeMiniText}>Lv.{user?.level || 6}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.idRow}
                onPress={handleCopyId}
                activeOpacity={0.7}
              >
                <Text style={styles.userIdText}>ID: {user?.userId || user?._id?.slice(-8) || '---'}</Text>
                <Ionicons
                  name="copy-outline"
                  size={13}
                  color="#6B7280"
                  style={{ marginLeft: 5 }}
                />
              </TouchableOpacity>

              <Text style={styles.bioText} numberOfLines={2}>
                {user?.bio || 'Hey there! I am using Yaro.'}
              </Text>

              {/* Tag Badges Row */}
              <View style={styles.tagsRow}>
                <View style={styles.genderTag}>
                  <Text style={styles.genderTagText}>
                    {user?.gender === 'female' ? '♀' : '♂'} {user?.age || '22'}
                  </Text>
                </View>

                {user?.country && (
                  <View style={styles.countryTag}>
                    <Text style={styles.countryTagText}>
                      🌍 {user?.country}
                    </Text>
                  </View>
                )}

                <View style={styles.svipTag}>
                  <Text style={styles.svipTagText}>👑 SVIP</Text>
                </View>
              </View>
            </View>

            {/* Chevron Arrow */}
            <Ionicons
              name="chevron-forward"
              size={22}
              color="#9CA3AF"
              style={styles.chevronIcon}
            />
          </LinearGradient>
        </TouchableOpacity>

        {/* Stats Row: Following, Followers, Visitors (Likes option removed as requested) */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={styles.statCol}
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
            style={styles.statCol}
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
            style={styles.statCol}
            onPress={() => navigation.navigate('Followers', { initialTab: 'Visitors' })}
            activeOpacity={0.7}
          >
            <Text style={styles.statValue}>{formatCompactBalance(user?.visitorsCount || 350)}</Text>
            <Text style={styles.statLabel}>Visitors</Text>
          </TouchableOpacity>
        </View>

        {/* Dual Luxury Banners: VIP Center & King of Kings SVIP */}
        <View style={styles.vipDualRow}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('VIP')}
            style={styles.vipHalfCard}
          >
            <LinearGradient
              colors={['#4F46E5', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.vipCardInner}
            >
              <View style={styles.vipCardHeader}>
                <MaterialCommunityIcons name="crown" size={24} color="#FBBF24" />
                <View style={styles.vipMiniBadge}>
                  <Text style={styles.vipMiniBadgeText}>VIP 1-5</Text>
                </View>
              </View>
              <Text style={styles.vipCardTitle}>VIP Center</Text>
              <Text style={styles.vipCardSub}>+25% Beans Boost</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('SVIP')}
            style={styles.vipHalfCard}
          >
            <LinearGradient
              colors={['#2A1C13', '#160E09']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.vipCardInner, { borderColor: '#D4AF37', borderWidth: 1 }]}
            >
              <View style={styles.vipCardHeader}>
                <MaterialCommunityIcons name="shield-crown" size={24} color="#FBBF24" />
                <View style={[styles.vipMiniBadge, { backgroundColor: '#F59E0B' }]}>
                  <Text style={[styles.vipMiniBadgeText, { color: '#78350F' }]}>NOBLE</Text>
                </View>
              </View>
              <Text style={[styles.vipCardTitle, { color: '#FBBF24' }]}>King of Kings</Text>
              <Text style={styles.vipCardSub}>Supercar & Anti-Kick</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Currency Row: My Diamonds & My Beans */}
        <View style={styles.currencyCardsRow}>
          {/* Card 1: My Diamonds */}
          <TouchableOpacity
            style={styles.diamondsCard}
            activeOpacity={0.88}
            onPress={() => navigation.navigate('Wallet')}
          >
            <MaterialCommunityIcons
              name="diamond-stone"
              size={28}
              color="#0284C7"
              style={{ marginRight: 8 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardMainValue}>
                {formatCompactBalance(user?.diamondBalance || user?.diamonds || 5000)}
              </Text>
              <Text style={styles.cardSmallLabel}>Diamonds</Text>
            </View>
            <View style={styles.addCoinCircle}>
              <Ionicons name="add" size={18} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          {/* Card 2: My Beans */}
          <TouchableOpacity
            style={styles.beansCard}
            activeOpacity={0.88}
            onPress={() => navigation.navigate('Earning')}
          >
            <Text style={{ fontSize: 26, marginRight: 8 }}>🧅</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardMainValue, { color: '#065F46' }]}>
                {formatCompactBalance(user?.beanBalance || user?.beans || 10000)}
              </Text>
              <Text style={[styles.cardSmallLabel, { color: '#047857' }]}>
                My Beans
              </Text>
            </View>
            <View style={[styles.addCoinCircle, { backgroundColor: '#10B981' }]}>
              <Ionicons name="swap-horizontal" size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Services & Features Grid (Strictly 4 items per row) */}
        <View style={styles.servicesGridContainer}>
          <Text style={styles.servicesHeaderTitle}>Services & Features</Text>
          <View style={styles.servicesGrid}>
            {serviceItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.serviceItem}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                {item.icon}
                <Text style={styles.serviceItemLabel} numberOfLines={1}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#FAFAFC',
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  loaderText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 12,
    fontWeight: '600',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerSidePlaceholder: {
    width: 36,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  settingsHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // User Card (Clean soft pastel, no cover background)
  userCardWrapper: {
    width: '100%',
    borderRadius: 24,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#C084FC',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  userCardGradient: {
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(233, 213, 255, 0.7)',
  },
  avatarSection: {
    position: 'relative',
    marginRight: 14,
  },
  userInfoSection: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  userNameText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    maxWidth: 160,
  },
  levelBadgeMini: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 8,
    marginLeft: 4,
  },
  levelBadgeMiniText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  userIdText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  bioText: {
    fontSize: 12,
    lineHeight: 16,
    color: '#334155',
    marginTop: 3,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    flexWrap: 'wrap',
    gap: 6,
  },
  genderTag: {
    backgroundColor: '#F3E8FF',
    borderRadius: 12,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 0.8,
    borderColor: '#E9D5FF',
  },
  genderTagText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#7C3AED',
  },
  countryTag: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 0.8,
    borderColor: '#E2E8F0',
  },
  countryTagText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#334155',
  },
  svipTag: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 0.8,
    borderColor: '#FDE68A',
  },
  svipTagText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#B45309',
  },
  chevronIcon: {
    position: 'absolute',
    right: 14,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 14,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  statCol: {
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
    color: '#64748B',
    fontWeight: '600',
    marginTop: 3,
  },
  statDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#F1F5F9',
  },

  // Dual VIP / SVIP banners
  vipDualRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  vipHalfCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#7C3AED',
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  vipCardInner: {
    padding: 14,
    borderRadius: 20,
  },
  vipCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  vipMiniBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  vipMiniBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
  },
  vipCardTitle: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
  },
  vipCardSub: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 3,
  },

  // Currency Row
  currencyCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  diamondsCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E0F2FE',
    elevation: 1,
  },
  beansCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    elevation: 1,
  },
  cardMainValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0369A1',
  },
  cardSmallLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284C7',
    marginTop: 2,
  },
  addCoinCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Services Grid (Strictly 4 items per row: width '25%')
  servicesGridContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 8,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  servicesHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
    paddingHorizontal: 8,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  serviceItem: {
    width: '25%',
    alignItems: 'center',
    marginBottom: 18,
  },
  serviceIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  serviceItemLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
    paddingHorizontal: 2,
  },
});
