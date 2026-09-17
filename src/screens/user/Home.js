import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  Alert,
  FlatList,
  Modal,
  Linking,
  View as ScreenBackgroundView,
  StatusBar as ScreenBackgroundStatusBar,
  StyleSheet as ScreenBackgroundStyleSheet
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { apiUtil, apiPublic, API_BASE_URL } from '../../utils/apiUtil';
import { RFValue } from 'react-native-responsive-fontsize';
import { AuthContext } from '../../context/AuthProvider';
import { useNavigation } from '@react-navigation/native';
import { getSocket, initSocket } from '../../sockets';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset, getTabScreenBottomPadding } from '../../utils/safeAreaUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingModal from '../../components/OnboardingModal';
import { requestAllCallPermissions } from '../../utils/permissions';
import { CALL_DIAMONDS_PER_MINUTE, hasCallStartIdentity } from '../../utils/callValidation';
import { normalizeLanguages } from '../../utils/hostPresentation';
import { getUserAvatar } from '../../utils/avatarUtil';
import { DUMMY_HOSTS, DUMMY_BANNERS } from '../../constants/dummyData';
import { AlertService } from '../../utils/AlertService';
const coinIcon = require('../../assets/coin.webp');

const { width, height } = Dimensions.get('window');
const LIVE_BANNERS_URL = 'https://api.mithichat.live/api/public/banners';

const CallAppUI = () => {
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomTabBarPadding = getTabScreenBottomPadding(insets.bottom);
  const [selectedTab, setSelectedTab] = useState('All');
  const [filterLanguage, setFilterLanguage] = useState('All');
  const [langModalVisible, setLangModalVisible] = useState(false);
  const flatListRef = useRef(null);
  const bannerFetchSeqRef = useRef(0);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [banners, setBanners] = useState(DUMMY_BANNERS);

  const [loading, setLoading] = useState(false);
  const [matching, setMatching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [diamonds, setDiamonds] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const { user, fetchUserProfile, hosts, setHosts } = useContext(AuthContext);
  const navigation = useNavigation();
  const { t } = useTranslation();
  const fetchUserProfileRef = useRef(fetchUserProfile);
  const lastNavTimeRef = useRef(0);
  const callInFlightRef = useRef(false);
  const matchInFlightRef = useRef(false);

  const handleNavigateHostProfile = useCallback((host) => {
    const now = Date.now();
    if (now - lastNavTimeRef.current < 800) return;
    lastNavTimeRef.current = now;
    navigation.navigate('HostProfile', { host });
  }, [navigation]);

  useEffect(() => {
    fetchUserProfileRef.current = fetchUserProfile;
  }, [fetchUserProfile]);

  const fetchUnreadNotifications = useCallback(async () => {
    try {
      const response = await apiUtil.get('/notifications?limit=1');
      setUnreadNotifications(Number(response.data?.data?.unreadCount) || 0);
    } catch (error) {
      console.log('Failed to fetch unread notifications:', error.response?.data || error.message);
    }
  }, []);

  const fetchBanners = useCallback(async () => {
    const currentSeq = ++bannerFetchSeqRef.current;
    try {
      // Management uploads are stored on the live backend. In development the
      // rest of the app may use a LAN server, but banners must still come from
      // the same source as the live management panel.
      const endpoints = __DEV__
        ? [LIVE_BANNERS_URL, '/public/banners']
        : ['/public/banners'];
      let response = null;
      let lastError = null;

      for (const endpoint of endpoints) {
        try {
          response = await apiPublic.get(endpoint);
          break;
        } catch (error) {
          lastError = error;
        }
      }

      if (currentSeq < bannerFetchSeqRef.current) return;
      if (!response) throw lastError || new Error('Banner service unavailable');

      const payload = response.data?.data;
      const items = Array.isArray(payload)
        ? payload
        : (payload?.banners || response.data?.banners || []);
      const now = Date.now();
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      const remoteBanners = items
        .filter(item => {
          if (item?.isActive === false) return false;
          if (item?.startDate && new Date(item.startDate).getTime() > endOfToday.getTime()) return false;
          if (item?.endDate && new Date(item.endDate).getTime() < startOfToday.getTime()) return false;
          return true;
        })
        .map((item, index) => {
          const rawImage = item?.imageUrl || item?.image || item?.url;
          let image = null;
          if (rawImage && typeof rawImage === 'string') {
            if (rawImage.startsWith('data:image')) {
              image = rawImage;
            } else if (rawImage.startsWith('http://') || rawImage.startsWith('https://')) {
              image = rawImage.startsWith('http://') ? rawImage.replace(/^http:\/\//, 'https://') : rawImage;
            } else {
              const base = API_BASE_URL.replace(/\/api\/?$/, '');
              image = `${base}${rawImage.startsWith('/') ? '' : '/'}${rawImage}`;
            }
          }
          const id = item?._id || item?.id || `banner-${index}`;
          return image && id ? { ...item, id: String(id), image } : null;
        })
        .filter(Boolean);

      if (remoteBanners.length) {
        setBanners(remoteBanners);
        try {
          const cacheable = remoteBanners.map(b => ({
            ...b,
            image: b.image && b.image.startsWith('data:') ? '' : b.image,
            imageUrl: b.imageUrl && b.imageUrl.startsWith('data:') ? '' : b.imageUrl
          })).filter(b => Boolean(b.image || b.imageUrl));
          if (cacheable.length) {
            await AsyncStorage.setItem('homeBannersCache', JSON.stringify(cacheable));
          }
        } catch (cacheErr) {
          console.log('Failed to cache banners in AsyncStorage:', cacheErr?.message || cacheErr);
        }
      } else {
        try {
          const cached = JSON.parse(await AsyncStorage.getItem('homeBannersCache') || '[]');
          if (cached.length) setBanners(cached);
        } catch (cacheErr) {
          console.log('Failed to read homeBannersCache:', cacheErr?.message || cacheErr);
        }
      }
    } catch (error) {
      console.log('Failed to fetch home banners:', error.response?.data || error.message);
      try {
        const cached = JSON.parse(await AsyncStorage.getItem('homeBannersCache') || '[]');
        if (cached.length) setBanners(cached);
      } catch (cacheErr) {
        console.log('Failed to read cached banners:', cacheErr?.message || cacheErr);
      }
    }
  }, []);

  const fetchHostsApi = useCallback(async () => {
    try {
      const res = await apiUtil.get('/user/hosts?limit=50');
      if (res.data?.success) {
        const fetchedData = res.data.data?.hostsData || res.data.data;
        const hostList = fetchedData?.hosts || (Array.isArray(fetchedData) ? fetchedData : []);
        if (Array.isArray(hostList) && hostList.length > 0) {
          setHosts(hostList);
        }
      }
    } catch (err) {
      console.log('Failed to fetch hosts via API fallback:', err?.message);
    }
  }, [setHosts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchUserProfile(), fetchBanners(), fetchUnreadNotifications(), fetchHostsApi()]);
      const socket = getSocket();
      if (socket) {
        socket.emit('requestHostsList', {
          tab: selectedTab,
          language: filterLanguage === 'All' ? undefined : filterLanguage,
        });
      }
    } finally {
      setRefreshing(false);
    }
  }, [selectedTab, filterLanguage, fetchBanners, fetchUserProfile, fetchUnreadNotifications, fetchHostsApi]);

  const showInsufficientDiamondsAlert = () => {
    AlertService.show(
      'Insufficient Diamonds',
      'Your Diamond balance is too low to start this call. Please recharge your Diamonds to continue.',
      'error',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Recharge Now', onPress: () => navigation.navigate('Recharge') },
      ]
    );
  };

  const handleStartCall = async (hostId, name, image) => {
    if (callInFlightRef.current) return;
    if (!hostId) {
      AlertService.show('Call failed', 'Invalid host selected', 'error');
      return;
    }
    const userDiamonds = Number(user?.diamonds || 0);
    console.log('[CALL] START REQUEST | BALANCE:', userDiamonds);

    if (userDiamonds < CALL_DIAMONDS_PER_MINUTE) {
      console.log('[CALL] INSUFFICIENT BALANCE | REJECTED ON FRONTEND');
      showInsufficientDiamondsAlert();
      return;
    }

    console.log('[CALL] BALANCE OK');
    try {
      callInFlightRef.current = true;
      setLoading(true);
      const res = await apiUtil.post('/call/start', { hostId });

      if (!res.data?.success || !hasCallStartIdentity(res.data?.data)) {
        const msg = res.data?.message || 'Failed to start call';
        const errCode = res.data?.data?.code || res.data?.data?.errorCode;
        if (errCode === 'INSUFFICIENT_DIAMONDS' || msg.includes('INSUFFICIENT_DIAMONDS') || msg.toLowerCase().includes('diamond')) {
          showInsufficientDiamondsAlert();
        } else {
          AlertService.show('Call failed', msg, 'error');
        }
        return;
      }

      const { channelName, transactionId, maxMinutes, expiresInSeconds, callRatePerMinute, agora } = res.data.data;

      navigation.navigate('OutGoing', {
        transactionId,
        channelName,
        maxMinutes,
        expiresInSeconds,
        callRatePerMinute,
        name: name || 'Host',
        image,
        isCaller: true,
        agora,
      });
    } catch (err) {
      console.log('Error starting call:', err.response?.data || err.message);
      const msg = err.response?.data?.message || err.message || 'Something went wrong';
      const errCode = err.response?.data?.data?.code || err.response?.data?.data?.errorCode;
      if (errCode === 'INSUFFICIENT_DIAMONDS' || msg.includes('INSUFFICIENT_DIAMONDS') || msg.toLowerCase().includes('diamond')) {
        showInsufficientDiamondsAlert();
      } else {
        AlertService.show('Call failed', msg, 'error');
      }
    } finally {
      callInFlightRef.current = false;
      setLoading(false);
    }
  };

  const handleRandomMatch = async () => {
    if (matchInFlightRef.current || callInFlightRef.current) return;
    const userDiamonds = Number(user?.diamonds || 0);
    console.log('[CALL] START REQUEST | BALANCE:', userDiamonds);

    if (userDiamonds < CALL_DIAMONDS_PER_MINUTE) {
      console.log('[CALL] INSUFFICIENT BALANCE | REJECTED ON FRONTEND');
      showInsufficientDiamondsAlert();
      return;
    }

    console.log('[CALL] BALANCE OK');
    try {
      matchInFlightRef.current = true;
      setMatching(true);
      const res = await apiUtil.post('/call/start', { randomMatch: true });
      if (!res.data?.success || !hasCallStartIdentity(res.data?.data)) {
        const msg = res.data?.message || 'No active host is available right now';
        const errCode = res.data?.data?.code || res.data?.data?.errorCode;
        if (errCode === 'INSUFFICIENT_DIAMONDS' || msg.includes('INSUFFICIENT_DIAMONDS') || msg.toLowerCase().includes('diamond')) {
          showInsufficientDiamondsAlert();
        } else {
          AlertService.show('No match', msg, 'error');
        }
        return;
      }

      const { channelName, transactionId, maxMinutes, expiresInSeconds, callRatePerMinute, agora, matchedHost } = res.data.data;
      navigation.navigate('OutGoing', {
        transactionId,
        channelName,
        maxMinutes,
        expiresInSeconds,
        callRatePerMinute,
        name: matchedHost?.name || 'Random Host',
        image: matchedHost?.image,
        gender: matchedHost?.gender,
        isCaller: true,
        agora,
      });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Could not connect to an active host';
      const errCode = err.response?.data?.data?.code || err.response?.data?.data?.errorCode;
      if (errCode === 'INSUFFICIENT_DIAMONDS' || msg.includes('INSUFFICIENT_DIAMONDS') || msg.toLowerCase().includes('diamond')) {
        showInsufficientDiamondsAlert();
      } else {
        AlertService.show('No match', msg, 'error');
      }
    } finally {
      matchInFlightRef.current = false;
      setMatching(false);
    }
  };

  useEffect(() => {
    requestAllCallPermissions().catch(err => console.log('Upfront permissions error:', err));
    fetchUserProfileRef.current();
    fetchBanners();
    fetchUnreadNotifications();
    fetchHostsApi();
  }, [fetchBanners, fetchUnreadNotifications, fetchHostsApi]);

  useEffect(() => {
    let cleanupFn;

    const setupSocketListeners = async () => {
      fetchHostsApi();
      const socket = await initSocket();
      if (!socket) return;

      console.log('✅ Socket ready in CallAppUI');

      const handleHostsList = data => {
        const hostList = data?.hosts || data;
        if (Array.isArray(hostList) && hostList.length > 0) {
          setHosts(hostList);
        }
      };

      const handleHostsUpdated = data => {
        const hostList = data?.hosts || data;
        if (Array.isArray(hostList) && hostList.length > 0) {
          setHosts(hostList);
        }
      };

      const handleNotification = data => {
        if (Number.isFinite(Number(data?.unreadCount))) {
          setUnreadNotifications(Number(data.unreadCount));
        } else {
          fetchUnreadNotifications();
        }
      };

      socket.on('hostsList', handleHostsList);
      socket.on('hostsUpdated', handleHostsUpdated);
      socket.on('notification:new', handleNotification);

      socket.emit('requestHostsList', {
        tab: selectedTab,
        language: filterLanguage === 'All' ? undefined : filterLanguage,
      });

      cleanupFn = () => {
        socket.off('hostsList', handleHostsList);
        socket.off('hostsUpdated', handleHostsUpdated);
        socket.off('notification:new', handleNotification);
      };
    };

    setupSocketListeners();
    return () => cleanupFn && cleanupFn();
  }, [user, selectedTab, filterLanguage, setHosts, fetchUnreadNotifications, fetchHostsApi]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchUserProfileRef.current();
      fetchBanners();
      fetchUnreadNotifications();
      fetchHostsApi();
    });
    return unsubscribe;
  }, [navigation, fetchBanners, fetchUnreadNotifications, fetchHostsApi]);

  useEffect(() => {
    setDiamonds(user?.diamonds || 0);
  }, [user]);

  const tabsConfig = [
    { key: 'All', label: 'All' },
    { key: 'Trending', label: 'Trending' },
    { key: 'Verified', label: 'Verified' },
    { key: 'New', label: 'New' }
  ];

  const renderUserCard = (host, index) => {
    const displayLanguages =
      normalizeLanguages(host?.languages, host?.language).join('  •  ') ||
      'Hindi  •  English';

    return (
      <TouchableOpacity
        key={host._id || index}
        style={styles.hostCardContainer}
        activeOpacity={0.9}
        onPress={() => handleNavigateHostProfile(host)}
      >
        {/* Avatar with Green Online Status Dot */}
        <View style={styles.hostAvatarWrapper}>
          <Image
            source={getUserAvatar(host)}
            style={styles.hostAvatarImg}
            resizeMode="cover"
          />
          <View style={styles.greenOnlineDot} />
        </View>

        {/* Host Details */}
        <View style={styles.hostMainInfo}>
          <View style={styles.hostNameBadgeRow}>
            <Text style={styles.hostNameTitle} numberOfLines={1}>
              {host.name}
            </Text>

            {/* Verified Purple Badge */}
            <Icon name="checkmark-circle" size={17} color="#6C5CE7" style={{ marginLeft: 5 }} />
          </View>

          <Text style={styles.hostLanguagesSub} numberOfLines={1}>
            {displayLanguages}
          </Text>
        </View>

        {/* Action Button: Circular Purple Phone Call Button */}
        <TouchableOpacity
          style={styles.purpleCallCircleBtn}
          activeOpacity={0.8}
          onPress={() => handleStartCall(host._id, host.name, host.image)}
        >
          <Icon name="call" size={20} color="#6C5CE7" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const bannerIndexRef = useRef(currentBannerIndex);
  useEffect(() => {
    bannerIndexRef.current = currentBannerIndex;
  }, [currentBannerIndex]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      let nextIndex = bannerIndexRef.current + 1;
      if (nextIndex >= banners.length) {
        nextIndex = 0;
      }
      if (flatListRef.current) {
        try {
          flatListRef.current.scrollToIndex({ index: nextIndex, animated: true });
        } catch (e) {
          // FlatList may not be ready
        }
        setCurrentBannerIndex(nextIndex);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [banners.length]);

  return (
    <ScreenBackgroundView style={[{ flex: 1, backgroundColor: '#F8FAFC' }]}>
      <ScreenBackgroundStatusBar translucent backgroundColor="transparent" barStyle="dark-content" animated />
      <LinearGradient colors={['#F8FAFC', '#F1F5F9', '#E2E8F0']} style={ScreenBackgroundStyleSheet.absoluteFillObject} />
      {/* Top Header matching reference design */}
      <View style={[styles.topBarContainer, { paddingTop: topSafeInset + 4 }]}>
        {/* Left: Language Dropdown Button */}
        <TouchableOpacity
          style={styles.langPillButton}
          onPress={() => setLangModalVisible(true)}
          activeOpacity={0.8}
        >
          <Icon name="language-outline" size={18} color="#1E293B" />
          <Text style={styles.langPillText}>Language</Text>
          <Icon name="chevron-down" size={15} color="#64748B" />
        </TouchableOpacity>

        {/* Right: Coin Balance & Notification Bell */}
        <View style={styles.headerRightActionsGroup}>
          <TouchableOpacity
            style={styles.coinBalancePillCard}
            onPress={() => navigation.navigate('Recharge')}
            activeOpacity={0.8}
          >
            <Image
              source={coinIcon}
              style={styles.coinIconImage}
              resizeMode="contain"
            />
            <Text style={styles.coinBalanceValText}>
              {diamonds > 0 ? diamonds.toLocaleString('en-US') : '1,250'}
            </Text>
            <View style={styles.plusIconBadgeBtn}>
              <Icon name="add" size={10} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bellButtonCircleBtn}
            onPress={() => navigation.navigate('Notifications')}
            activeOpacity={0.8}
          >
            <Icon name="notifications-outline" size={20} color="#1E293B" />
            {unreadNotifications > 0 ? (
              <View style={styles.redBadgeDotSmall} />
            ) : (
              <View style={styles.redBadgeDotSmall} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable Main Content */}
      <ScrollView
        style={styles.hostsScroll}
        contentContainerStyle={[styles.hostsScrollContent, { paddingBottom: bottomTabBarPadding + 16 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C5CE7" />
        }
      >
        {/* Hero Promo Banner matching reference design */}
        <View style={styles.heroPromoContainer}>
          <LinearGradient
            colors={['#2D1060', '#5B21B6', '#9333EA', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroPromoGradient}
          >
            {/* Left Content */}
            <View style={styles.promoLeftSection}>
              <Text style={styles.promoHeadingLine1}>Talk. Connect.</Text>
              <Text style={styles.promoHeadingLine2}>Make Friends!</Text>
              <Text style={styles.promoSubtitleText}>
                Call and meet amazing people from around the world.
              </Text>

              <TouchableOpacity
                style={styles.startCallingCtaBtn}
                activeOpacity={0.88}
                onPress={handleRandomMatch}
              >
                <Text style={styles.startCallingCtaText}>Start Calling</Text>
                <View style={styles.startCallingIconCircle}>
                  <Icon name="call" size={12} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Right Graphic / Image */}
            <View style={styles.promoRightGraphicSection}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80' }}
                style={styles.heroHostImage}
                resizeMode="cover"
              />

              {/* Speech Waveform Pill */}
              <View style={styles.floatingWaveformBadgePill}>
                <Icon name="stats-chart" size={12} color="#FFFFFF" />
              </View>

              {/* Floating Embellishments */}
              <Text style={styles.floatingHeartEmoji}>💖</Text>
              <Text style={styles.floatingStarEmoji}>⭐</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Filter Pills Bar matching reference design */}
        <View style={styles.filterPillsRowContainer}>
          {tabsConfig.map(tab => {
            const isActive = selectedTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.filterCategoryPill,
                  isActive ? styles.filterPillSolidActive : styles.filterPillOffwhiteInactive
                ]}
                onPress={() => setSelectedTab(tab.key)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterPillLabelText,
                    isActive ? styles.filterPillTextActiveWhite : styles.filterPillTextInactiveDark
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Loader */}
        {loading && <ActivityIndicator size="large" color="#6C5CE7" style={{ marginVertical: 15 }} />}

        {/* Hosts Listing matching reference design */}
        <View style={styles.hostsCardsListContainer}>
          {!loading && ((hosts && hosts.length > 0) ? hosts : DUMMY_HOSTS).map((host, index) => renderUserCard(host, index))}
        </View>
      </ScrollView>

      {/* Language Modal */}
      <Modal
        visible={langModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLangModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setLangModalVisible(false)}
        >
          <View style={styles.bottomSheetContent}>
            <LinearGradient
              colors={['#0e0a30', '#180f55']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={[
                styles.bottomSheetGradient,
                { paddingBottom: Math.max(24, (insets.bottom || 0) + 16) },
              ]}
            >
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>{t('profile.language') || 'Filter Language'}</Text>

              <ScrollView
                style={{ width: '100%' }}
                contentContainerStyle={styles.languageSheetScrollContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.languageGrid}>
                  {['All', 'English', 'Hindi', 'Bengali', 'Arabic', 'Urdu'].map(lang => (
                    <TouchableOpacity
                      key={lang}
                      style={[styles.glassCard, filterLanguage === lang && styles.glassCardActive]}
                      onPress={() => {
                        setFilterLanguage(lang);
                        setLangModalVisible(false);
                      }}
                    >
                      <Icon
                        name={lang === 'All' ? 'globe-outline' : 'language-outline'}
                        size={24}
                        color={filterLanguage === lang ? '#03dcfe' : 'rgba(255,255,255,0.6)'}
                      />
                      <Text style={[styles.glassCardText, filterLanguage === lang && styles.glassCardTextActive]}>
                        {lang === 'All' ? t('home.tabs.all') || 'All' : lang}
                      </Text>
                      {filterLanguage === lang && (
                        <View style={styles.selectedBadge}>
                          <Icon name="checkmark" size={12} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </LinearGradient>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Mandatory Onboarding Modal for New Users */}
      <OnboardingModal visible={Boolean(user && user.profileCompleted === false)} />
    </ScreenBackgroundView>
  );
};

const styles = StyleSheet.create({
  countryFlag: { fontSize: 15, marginRight: 5 },
  hostsScroll: {
    flex: 1,
  },
  hostsScrollContent: {
    paddingTop: 4,
  },

  // 1. Top Header Bar
  topBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  langPillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
    elevation: 2,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  langPillText: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '700',
  },
  headerRightActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  coinBalancePillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 20,
    paddingLeft: 8,
    paddingRight: 6,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 6,
    elevation: 2,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  coinIconImage: {
    width: 20,
    height: 20,
  },
  coinBalanceValText: {
    color: '#1E293B',
    fontSize: 13.5,
    fontWeight: '800',
  },
  plusIconBadgeBtn: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#6C5CE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellButtonCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    position: 'relative',
  },
  redBadgeDotSmall: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF2D55',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },

  // 2. Hero Promo Banner Card
  heroPromoContainer: {
    paddingHorizontal: 16,
    marginVertical: 10,
  },
  heroPromoGradient: {
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 140,
    overflow: 'hidden',
    position: 'relative',
  },
  promoLeftSection: {
    flex: 0.65,
    justifyContent: 'center',
    paddingRight: 6,
  },
  promoHeadingLine1: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  promoHeadingLine2: {
    color: '#FF70A6',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  promoSubtitleText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500',
    marginBottom: 12,
  },
  startCallingCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  startCallingCtaText: {
    color: '#4C1D95',
    fontSize: 12,
    fontWeight: '800',
  },
  startCallingIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#6C5CE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  promoRightGraphicSection: {
    flex: 0.35,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  heroHostImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  floatingWaveformBadgePill: {
    position: 'absolute',
    top: 2,
    right: -4,
    backgroundColor: '#EC4899',
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    elevation: 3,
  },
  floatingHeartEmoji: {
    position: 'absolute',
    left: -6,
    bottom: 12,
    fontSize: 16,
  },
  floatingStarEmoji: {
    position: 'absolute',
    top: 6,
    left: 2,
    fontSize: 14,
  },

  // 3. Filter Category Pills
  filterPillsRowContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginVertical: 10,
    gap: 10,
  },
  filterCategoryPill: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillSolidActive: {
    backgroundColor: '#6C5CE7',
    elevation: 4,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  filterPillOffwhiteInactive: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillLabelText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  filterPillTextActiveWhite: {
    color: '#FFFFFF',
  },
  filterPillTextInactiveDark: {
    color: '#475569',
  },

  // 4. Host Cards List (Clean Modern White Cards)
  hostsCardsListContainer: {
    paddingHorizontal: 16,
    marginTop: 4,
  },
  hostCardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 2,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  hostAvatarWrapper: {
    position: 'relative',
    marginRight: 14,
  },
  hostAvatarImg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F1F5F9',
  },
  greenOnlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  hostMainInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  hostNameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  hostNameTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  hostLanguagesSub: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
  },
  purpleCallCircleBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F0FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  bottomSheetContent: {
    width: '100%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    height: Dimensions.get('window').height * 0.5,
  },
  bottomSheetGradient: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
  },
  languageSheetScrollContent: {
    paddingBottom: 16,
  },
  sheetHandle: {
    width: 50,
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 2.5,
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
  },
  languageGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  glassCard: {
    width: (width - 60) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    position: 'relative',
  },
  glassCardActive: {
    backgroundColor: 'rgba(3, 220, 254, 0.12)',
    borderColor: '#03dcfe',
  },
  glassCardText: {
    marginTop: 8,
    fontSize: 14,
    color: '#fff',
    opacity: 0.7,
    fontWeight: '500',
  },
  glassCardTextActive: {
    opacity: 1,
    fontWeight: 'bold',
    color: '#03dcfe',
  },
  selectedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#03dcfe',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CallAppUI;
