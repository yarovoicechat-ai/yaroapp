import React, { useState, useContext, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Platform,
  Dimensions,
  ScrollView,
  View as ScreenBackgroundView,
  StatusBar as ScreenBackgroundStatusBar,
  StyleSheet as ScreenBackgroundStyleSheet
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthProvider';
import { useTranslation } from 'react-i18next';
import { apiUtil } from '../../utils/apiUtil';
import AnimatedTitleLine from '../../components/AnimatedTitleLine';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';

const { width } = Dimensions.get('window');
const COIN_TO_INR_RATIO = 20;

const Earning = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 40);
  const { user, fetchUserProfile } = useContext(AuthContext);
  const [earnings, setEarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  const fetchEarnings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiUtil.get('/call/history');
      if (res.data?.success && res.data?.data?.calls) {
        const earningCalls = res.data.data.calls.filter(
          (call) => call.commission && call.commission > 0,
        );
        setEarnings(earningCalls);
      }
    } catch (err) {
      console.log('Error fetching earnings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserProfile();
    fetchEarnings();
  }, []);

  const formatDuration = (dur) => {
    if (!dur) return '00:00';
    const parts = dur.split(':');
    if (parts.length === 3) {
      const h = parseInt(parts[0], 10);
      const m = parts[1];
      const s = parts[2];
      return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
    }
    return dur;
  };

  const getEstimatedINR = () => {
    const coins = user?.coins || 0;
    return (coins / COIN_TO_INR_RATIO).toFixed(2);
  };

  const renderEarningItem = ({ item }) => {
    const isGift = (item.type || '').includes('gift');
    return (
      <View style={styles.earningCard}>
        <View style={styles.cardHeader}>
          <View style={styles.callerInfo}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {item.name ? item.name.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
            <Text style={styles.earningName} numberOfLines={1}>
              {item.name || 'Anonymous User'}
            </Text>
          </View>
          <View style={styles.coinBadge}>
            <Image
              source={require('../../assets/coin.webp')}
              style={styles.smallCoinIcon}
              resizeMode="contain"
            />
            <Text style={styles.earningCoins}>+{item.commission || 0}</Text>
          </View>
        </View>
        
        <View style={styles.cardDivider} />

        <View style={styles.cardFooter}>
          <View style={styles.footerDetail}>
            <Icon name={isGift ? "card-giftcard" : "schedule"} size={16} color={isGift ? "#FF2D87" : "#aaa"} />
            <Text style={[styles.footerDetailText, isGift && { color: '#FF2D87', fontWeight: '600' }]}>
              {isGift ? 'Gift Income' : formatDuration(item.duration)}
            </Text>
          </View>
          <View style={styles.footerDetail}>
            <Icon name="event" size={16} color="#aaa" />
            <Text style={styles.footerDetailText}>
              {item.date || (item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent')}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const EmptyList = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Icon name="account-balance-wallet" size={48} color="rgba(255,255,255,0.4)" />
      </View>
      <Text style={styles.emptyText}>
        {t('earning.no_earnings') || 'No earnings history found.'}
      </Text>
    </View>
  );

  return (
    <ScreenBackgroundView style={[{ flex: 1, backgroundColor: '#08031a' }]}>
      <ScreenBackgroundStatusBar translucent backgroundColor="transparent" barStyle="light-content" animated />
      <LinearGradient colors={['#08031a', '#050212', '#020108']} style={ScreenBackgroundStyleSheet.absoluteFillObject} />
      {/* Header */}
      <View style={[styles.header, { paddingTop: topSafeInset + 8 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back-ios" size={24} color="#fff" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t('profile.my_earnings') || 'My Earnings'}
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('RechargeHistreoy')}
          style={styles.recordButton}
        >
          <Text style={styles.recordText}>{t('earning.record') || 'Record'}</Text>
        </TouchableOpacity>
      </View>
      <AnimatedTitleLine />

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: bottomPadding }} showsVerticalScrollIndicator={false}>
        {/* Coin Balance Card */}
        <View style={styles.coinCardContainer}>
          <LinearGradient
            colors={['#1e1b4b', '#31108f']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.coinCard}
          >
            <View style={styles.glassOverlay} />
            <View style={styles.coinCardContent}>
              <View style={styles.balanceHeader}>
                <Text style={styles.myCoinsLabel}>{t('earning.my_coins') || 'Available Balance'}</Text>
                <View style={styles.goldBadge}>
                  <Icon name="stars" size={14} color="#FACC15" />
                  <Text style={styles.goldBadgeText}>Premium Host</Text>
                </View>
              </View>
              <View style={styles.balanceRow}>
                <Image
                  source={require('../../assets/coin.webp')}
                  style={styles.largeCoinIcon}
                  resizeMode="contain"
                />
                <Text style={styles.coinBalance}>{user?.coins || 0}</Text>
              </View>
              <View style={styles.conversionRow}>
                <Text style={styles.conversionLabel}>Estimated Value:</Text>
                <Text style={styles.conversionValue}>₹ {getEstimatedINR()}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* History Title */}
        <View style={styles.historyTitleRow}>
          <Icon name="history" size={20} color="#03dcfe" />
          <Text style={styles.historyTitle}>Call Income History</Text>
        </View>

        {/* Earnings List */}
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#03dcfe"
            style={{ marginTop: 40 }}
          />
        ) : (
          <FlatList
            data={earnings}
            renderItem={renderEarningItem}
            keyExtractor={(item, index) => `earning_${index}`}
            ListEmptyComponent={EmptyList}
            contentContainerStyle={styles.listContainer}
            scrollEnabled={false}
          />
        )}
      </ScrollView>

      {/* Withdrawal Button (Visible ONLY for Hosts) */}
      {user?.role === 'host' && (
        <View style={styles.withdrawalContainer}>
          <TouchableOpacity
            style={styles.withdrawalButton}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Withdrawal')}
          >
            <LinearGradient
              colors={['#2911fe', '#03dcfe']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.withdrawalGradient}
            >
              <Icon name="account-balance" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.withdrawalText}>{t('profile.withdraw') || 'Withdraw Earnings'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </ScreenBackgroundView>
  );
};

const styles = StyleSheet.create({
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
  },
  recordButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: 'rgba(3, 220, 254, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(3, 220, 254, 0.3)',
  },
  recordText: {
    color: '#03dcfe',
    fontSize: 14,
    fontWeight: '600',
  },

  // Coin Card
  coinCardContainer: {
    paddingHorizontal: 20,
    marginTop: 15,
    marginBottom: 20,
  },
  coinCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    elevation: 8,
    shadowColor: '#03dcfe',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  coinCardContent: {
    padding: 24,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  myCoinsLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  goldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(250, 204, 21, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: 'rgba(250, 204, 21, 0.3)',
  },
  goldBadgeText: {
    color: '#FACC15',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  coinBalance: {
    color: '#fff',
    fontSize: 38,
    fontWeight: '800',
    marginLeft: 12,
  },
  largeCoinIcon: {
    width: 48,
    height: 48,
  },
  conversionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    padding: 12,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  conversionLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
  },
  conversionValue: {
    color: '#03dcfe',
    fontSize: 18,
    fontWeight: '700',
  },

  // History Section
  historyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  historyTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
    letterSpacing: 0.5,
  },

  // List Container
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // Earning Card
  earningCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  callerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(3, 220, 254, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(3, 220, 254, 0.3)',
  },
  avatarInitial: {
    color: '#03dcfe',
    fontSize: 14,
    fontWeight: 'bold',
  },
  earningName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 217, 100, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(76, 217, 100, 0.3)',
  },
  smallCoinIcon: {
    width: 16,
    height: 16,
    marginRight: 4,
  },
  earningCoins: {
    color: '#4CD964',
    fontSize: 14,
    fontWeight: '700',
  },
  cardDivider: {
    height: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerDetailText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    marginLeft: 6,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    padding: 30,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 15,
    textAlign: 'center',
  },

  // Withdrawal Button
  withdrawalContainer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'android' ? 20 : 35,
    paddingTop: 10,
    backgroundColor: 'transparent',
  },
  withdrawalButton: {
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#2911fe',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  withdrawalGradient: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  withdrawalText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default Earning;
