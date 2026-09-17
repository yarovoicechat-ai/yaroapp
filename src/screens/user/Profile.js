import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Clipboard,
  Alert,
  StatusBar,
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
import { getUserAvatar } from '../../utils/avatarUtil';

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

const ProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomTabBarPadding = getTabScreenBottomPadding(insets.bottom);
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { user, fetchUserProfile, logout, loading } = useContext(AuthContext);
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
        ?.reset({ index: 0, routes: [{ name: 'UmangLoginScreen' }] });
    } catch (err) {
      console.log('❌ Logout error:', err.message);
      await logout();
      navigation
        .getParent()
        ?.reset({ index: 0, routes: [{ name: 'UmangLoginScreen' }] });
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

  // 10 Grid services
  const serviceItems = [
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
      id: 'medal',
      label: 'Medal',
      icon: (
        <View style={[styles.serviceIconCircle, { backgroundColor: '#FFFBEB' }]}>
          <MaterialCommunityIcons name="medal" size={26} color="#F59E0B" />
        </View>
      ),
      onPress: () => navigation.navigate('Ranking'),
    },
    {
      id: 'store',
      label: 'Store',
      icon: (
        <View style={[styles.serviceIconCircle, { backgroundColor: '#FDF2F8' }]}>
          <Ionicons name="bag-handle" size={25} color="#EC4899" />
        </View>
      ),
      onPress: () => navigation.navigate('Wallet'),
    },
    {
      id: 'myItems',
      label: 'My Items',
      icon: (
        <View style={[styles.serviceIconCircle, { backgroundColor: '#F5F3FF' }]}>
          <Ionicons name="cube" size={26} color="#8B5CF6" />
        </View>
      ),
      onPress: () => navigation.navigate('Frame'),
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
      label: t('profile.settings') || 'Settings',
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
        {/* Header Title with Settings entry */}
        <View style={styles.headerBar}>
          <View style={styles.headerSidePlaceholder} />
          <Text style={styles.headerTitle}>{t('profile.title') || 'Profile'}</Text>
          <TouchableOpacity
            style={styles.settingsHeaderBtn}
            onPress={() => navigation.navigate('Setting')}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="settings-outline" size={20} color="#1E293B" />
          </TouchableOpacity>
        </View>

        {/* User Card (Soft Pastel Gradient) */}
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={() => navigation.navigate('EditProfile')}
          style={styles.userCardWrapper}
        >
          <LinearGradient
            colors={['#F3E8FF', '#EFF6FF', '#FCE7F3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.userCardGradient}
          >
            {/* Avatar Section */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarRing}>
                <Image
                  source={getUserAvatar(user)}
                  style={styles.avatarImg}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.onlineStatusDot} />
            </View>

            {/* Info Section */}
            <View style={styles.userInfoSection}>
              <View style={styles.nameRow}>
                <Text style={styles.userNameText} numberOfLines={1}>
                  {user?.name || 'Aisha Khan'}
                </Text>
                <MaterialIcons
                  name="verified"
                  size={18}
                  color="#2563EB"
                  style={{ marginLeft: 6 }}
                />
              </View>

              <TouchableOpacity
                style={styles.idRow}
                onPress={handleCopyId}
                activeOpacity={0.7}
              >
                <Text style={styles.userIdText}>ID: {user?.userId || '78654321'}</Text>
                <Ionicons
                  name="copy-outline"
                  size={13}
                  color="#6B7280"
                  style={{ marginLeft: 5 }}
                />
              </TouchableOpacity>

              <Text style={styles.bioText} numberOfLines={2}>
                {user?.bio || "Good Vibes Only ✨\nLet's talk, make friends 💜"}
              </Text>

              {/* Tag Badges Row */}
              <View style={styles.tagsRow}>
                <View style={styles.genderTag}>
                  <Text style={styles.genderTagText}>
                    {user?.gender === 'male' ? '♂' : '♀'} {user?.age || '22'}
                  </Text>
                </View>

                <View style={styles.countryTag}>
                  <Text style={styles.countryTagText}>
                    🇮🇳 {user?.country || 'India'}
                  </Text>
                </View>

                <View style={styles.zodiacTag}>
                  <Text style={styles.zodiacTagText}>
                    ♊ {user?.zodiac || 'Gemini'}
                  </Text>
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

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <Text style={styles.statValue}>
              {user?.followingCount ?? (Array.isArray(user?.following) ? user.following.length : 125)}
            </Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
          <View style={styles.statDivider} />

          <View style={styles.statCol}>
            <Text style={styles.statValue}>
              {user?.followersCount ? formatCompactBalance(user.followersCount) : '12.4K'}
            </Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statDivider} />

          <View style={styles.statCol}>
            <Text style={styles.statValue}>{user?.visitorsCount ?? 356}</Text>
            <Text style={styles.statLabel}>Visitors</Text>
          </View>
          <View style={styles.statDivider} />

          <View style={styles.statCol}>
            <Text style={styles.statValue}>
              {user?.likesCount ? formatCompactBalance(user.likesCount) : '8.9K'}
            </Text>
            <Text style={styles.statLabel}>Likes</Text>
          </View>
        </View>

        {/* VIP Member Banner */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('Wallet')}
          style={styles.vipBannerWrapper}
        >
          <LinearGradient
            colors={['#1E2AD2', '#4B18D6', '#9B13DF', '#DF1FD5']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.vipBanner}
          >
            <View style={styles.crownIconWrap}>
              <MaterialCommunityIcons name="crown" size={32} color="#FBBF24" />
            </View>

            <View style={styles.vipTextWrap}>
              <Text style={styles.vipTitle}>VIP Member</Text>
              <Text style={styles.vipSubtitle}>
                Unlock exclusive features and enjoy more fun!
              </Text>
            </View>

            <View style={styles.upgradeBtn}>
              <Text style={styles.upgradeBtnText}>Upgrade</Text>
              <Ionicons name="chevron-forward" size={13} color="#7C3AED" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* 3 Quick Action Cards Row */}
        <View style={styles.actionCardsRow}>
          {/* Card 1: My Diamonds */}
          <TouchableOpacity
            style={styles.diamondsCard}
            activeOpacity={0.88}
            onPress={() => navigation.navigate('Wallet')}
          >
            <MaterialCommunityIcons
              name="diamond-stone"
              size={32}
              color="#3B82F6"
              style={{ marginRight: 6 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardMainValue}>
                {formatCompactBalance(user?.diamonds ?? 1250)}
              </Text>
              <Text style={styles.cardSubLabel}>My Diamonds</Text>
            </View>
            <View style={styles.diamondPlusBtn}>
              <Ionicons name="add" size={18} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          {/* Card 2: Wallet */}
          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.88}
            onPress={() => navigation.navigate('Wallet')}
          >
            <Ionicons name="wallet" size={28} color="#0EA5E9" />
            <Text style={styles.actionCardLabel}>Wallet</Text>
          </TouchableOpacity>

          {/* Card 3: My Level */}
          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.88}
            onPress={() => navigation.navigate('Level')}
          >
            <View style={{ alignItems: 'center' }}>
              <MaterialCommunityIcons name="crown" size={26} color="#F59E0B" />
              <View style={styles.crownLevelPill}>
                <Text style={styles.crownLevelPillText}>Lv.{user?.level ?? 5}</Text>
              </View>
            </View>
            <Text style={styles.actionCardLabel}>My Level</Text>
          </TouchableOpacity>
        </View>

        {/* Services 10-Item Grid Container */}
        <View style={styles.servicesGridContainer}>
          <View style={styles.servicesGrid}>
            {serviceItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.serviceItem}
                activeOpacity={0.75}
                onPress={item.onPress}
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
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  loaderText: {
    color: '#6B7280',
    marginTop: 12,
    fontSize: 15,
  },
  headerBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    marginBottom: 6,
  },
  headerSidePlaceholder: {
    width: 36,
    height: 36,
  },
  settingsHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 0.3,
  },

  // User Card
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
  avatarRing: {
    width: 82,
    height: 82,
    borderRadius: 41,
    padding: 3,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(216, 180, 254, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F3F4F6',
  },
  onlineStatusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  userInfoSection: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 18,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userNameText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    maxWidth: width * 0.44,
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  userIdText: {
    fontSize: 12.5,
    color: '#4B5563',
    fontWeight: '500',
  },
  bioText: {
    fontSize: 12,
    lineHeight: 16,
    color: '#374151',
    marginTop: 3,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 7,
    flexWrap: 'wrap',
  },
  genderTag: {
    backgroundColor: '#FDF2F8',
    borderRadius: 12,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 0.8,
    borderColor: '#FBCFE8',
  },
  genderTagText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#DB2777',
  },
  countryTag: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 0.8,
    borderColor: '#E5E7EB',
  },
  countryTagText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#374151',
  },
  zodiacTag: {
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 0.8,
    borderColor: '#DDD6FE',
  },
  zodiacTagText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#7C3AED',
  },
  chevronIcon: {
    position: 'absolute',
    right: 14,
  },

  // Stats Row
  statsRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: 12,
    paddingHorizontal: 4,
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  statLabel: {
    fontSize: 11.5,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
  },

  // VIP Banner
  vipBannerWrapper: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    marginVertical: 8,
    elevation: 3,
    shadowColor: '#9333EA',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  vipBanner: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
  },
  crownIconWrap: {
    marginRight: 10,
  },
  vipTextWrap: {
    flex: 1,
  },
  vipTitle: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  vipSubtitle: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 11,
    marginTop: 2,
  },
  upgradeBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
  },
  upgradeBtnText: {
    color: '#7C3AED',
    fontWeight: '700',
    fontSize: 12.5,
    marginRight: 2,
  },

  // Quick Action Cards
  actionCardsRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
    marginVertical: 12,
  },
  diamondsCard: {
    flex: 1.35,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    paddingVertical: 12,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardMainValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  cardSubLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 1,
  },
  diamondPlusBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#D946EF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  actionCardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginTop: 6,
  },
  crownLevelPill: {
    backgroundColor: '#F43F5E',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginTop: -7,
  },
  crownLevelPillText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '800',
  },

  // Services Grid
  servicesGridContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    paddingVertical: 18,
    paddingHorizontal: 4,
    marginTop: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  serviceItem: {
    width: '20%',
    alignItems: 'center',
    marginVertical: 10,
  },
  serviceIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  serviceItemLabel: {
    fontSize: 10.5,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
    paddingHorizontal: 2,
  },
});

export default ProfileScreen;
