import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Image,
  StatusBar,
  Platform,
  View as ScreenBackgroundView,
  StatusBar as ScreenBackgroundStatusBar,
  StyleSheet as ScreenBackgroundStyleSheet
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';
import { apiUtil } from '../../utils/apiUtil';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { RFValue } from 'react-native-responsive-fontsize';
import { AuthContext } from '../../context/AuthProvider';

const { width, height } = Dimensions.get('window');
const coinImg = require('../../assets/coin.webp');

const TYPE_CONFIG = {
  gift_sent: { label: 'Gift Sent', icon: 'card-giftcard', color: '#FF4B4B', sign: '-' },
  gift_received: { label: 'Gift Received', icon: 'card-giftcard', color: '#10B981', sign: '+' },
  call: { label: 'Audio/Video Call', icon: 'call', color: '#3B82F6', sign: '-' },
  call_earning: { label: 'Call Earning', icon: 'call', color: '#10B981', sign: '+' },
  message: { label: 'Chat Message', icon: 'chat', color: '#A855F7', sign: '-' },
  recharge: { label: 'Beans Recharge', icon: 'account-balance-wallet', color: '#10B981', sign: '+' },
  default: { label: 'Transaction', icon: 'swap-horiz', color: '#F59E0B', sign: '-' },
};

const formatDate = (iso) => {
  if (!iso) return '---';
  const d = new Date(iso);
  return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;
};

const formatTime = (iso) => {
  if (!iso) return '---';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const CoinHistory = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 24);
  const { user } = useContext(AuthContext);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      let res;
      try {
        res = await apiUtil.get('/user/coin-history');
      } catch {
        res = await apiUtil.get('/user/recharge-history');
      }
      if (res.data.success) {
        setHistory(res.data.data.history || res.data.data.transactions || []);
      }
    } catch (err) {
      console.log('CoinHistory fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const stats = history.reduce(
    (acc, item) => {
      if (!item) return acc;
      const type = (item.type || '').toString().toLowerCase();
      const amt = Number(item.coinsSpent || item.coins || 0);
      if (type.includes('gift') && type.includes('sent')) acc.gift += amt;
      else if (type.includes('call') && !type.includes('earning')) acc.call += amt;
      else if (type.includes('message')) acc.message += amt;
      acc.totalSpent += amt;
      return acc;
    },
    { gift: 0, call: 0, message: 0, totalSpent: 0 }
  );

  const filtered = activeFilter === 'all'
    ? history
    : history.filter(item => (item.type || '').toLowerCase().includes(activeFilter));

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'gift', label: 'Gifts' },
    { key: 'call', label: 'Calls' },
    { key: 'message', label: 'Messages' },
  ];

  return (
    <ScreenBackgroundView style={[{ flex: 1, backgroundColor: '#F8FAFC' }]}>
      <LinearGradient colors={['#F8FAFC', '#F1F5F9', '#E2E8F0']} style={ScreenBackgroundStyleSheet.absoluteFillObject} />
      <ScreenBackgroundStatusBar barStyle="dark-content" backgroundColor="transparent" translucent animated />
      <View style={[styles.container, { paddingTop: topSafeInset + 8 }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Beans History</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}>
          {/* Main Gold Hero Card */}
          <View style={styles.heroCardContainer}>
            <LinearGradient
              colors={['#FFD700', '#FFA500', '#FF8C00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCardBorder}
            >
              <LinearGradient
                colors={['#FFFBEB', '#FEF3C7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroCard}
              >
                <View style={styles.heroCardRow}>
                  <View>
                    <Text style={styles.heroSub}>Current Beans Balance</Text>
                    <View style={styles.heroBalanceRow}>
                      <Text style={styles.heroBalanceText}>{(user?.coins || 0).toLocaleString()}</Text>
                      <Image source={coinImg} style={styles.heroCoinIcon} resizeMode="contain" />
                    </View>
                  </View>
                  <View style={styles.totalBadge}>
                    <Text style={styles.totalBadgeLbl}>Total Activity</Text>
                    <Text style={styles.totalBadgeVal}>{history.length} Records</Text>
                  </View>
                </View>

                <View style={styles.heroDivider} />

                {/* Sub Stats Row */}
                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <View style={[styles.statDot, { backgroundColor: '#FF6B6B' }]} />
                    <Text style={styles.statBoxLbl}>Gifts</Text>
                    <Text style={styles.statBoxVal}>{stats.gift}</Text>
                  </View>
                  <View style={styles.statBoxDivider} />
                  <View style={styles.statBox}>
                    <View style={[styles.statDot, { backgroundColor: '#3B82F6' }]} />
                    <Text style={styles.statBoxLbl}>Calls</Text>
                    <Text style={styles.statBoxVal}>{stats.call}</Text>
                  </View>
                  <View style={styles.statBoxDivider} />
                  <View style={styles.statBox}>
                    <View style={[styles.statDot, { backgroundColor: '#A855F7' }]} />
                    <Text style={styles.statBoxLbl}>Messages</Text>
                    <Text style={styles.statBoxVal}>{stats.message}</Text>
                  </View>
                </View>
              </LinearGradient>
            </LinearGradient>
          </View>

          {/* Filter Pills */}
          <View style={styles.filterRow}>
            {filters.map(f => {
              const isActive = activeFilter === f.key;
              return (
                <TouchableOpacity
                  key={f.key}
                  style={styles.filterTabWrap}
                  onPress={() => setActiveFilter(f.key)}
                  activeOpacity={0.8}
                >
                  {isActive ? (
                    <LinearGradient
                      colors={['#FF8C00', '#FF2D87']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.filterTabActiveGradient}
                    >
                      <Text style={styles.filterTextActive}>{f.label}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.filterTabInactive}>
                      <Text style={styles.filterText}>{f.label}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Section Header */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeaderTitle}>Recent Transactions</Text>
            <Text style={styles.sectionHeaderCount}>{filtered.length} items</Text>
          </View>

          {/* Transaction Cards List */}
          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color="#FFD700" />
              <Text style={styles.loadingText}>Loading history...</Text>
            </View>
          ) : filtered.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Image source={coinImg} style={{ width: 44, height: 44, opacity: 0.5 }} resizeMode="contain" />
              </View>
              <Text style={styles.emptyTitle}>No Transactions Yet</Text>
              <Text style={styles.emptySubtitle}>Your coin activity history will appear here.</Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {filtered.map((item, idx) => {
                const typeKey = (item.type || 'default').toLowerCase().replace(' ', '_');
                const config = TYPE_CONFIG[typeKey] || TYPE_CONFIG.default;
                const coinsAmt = item.coinsSpent || item.coins || 0;
                const isCredit = config.sign === '+';

                return (
                  <View key={idx} style={styles.txCard}>
                    {/* Left Icon Accent */}
                    <View style={[styles.txIconWrap, { backgroundColor: config.color + '1A', borderColor: config.color + '44' }]}>
                      <Icon name={config.icon} size={RFValue(18)} color={config.color} />
                    </View>

                    {/* Middle Details */}
                    <View style={styles.txDetailsCol}>
                      <Text style={styles.txTitle}>{config.label}</Text>
                      <View style={styles.txMetaRow}>
                        <Text style={styles.txMetaText}>{formatDate(item.createdAt || item.date)}</Text>
                        <View style={styles.txMetaDot} />
                        <Text style={styles.txMetaText}>{formatTime(item.createdAt || item.date)}</Text>
                      </View>
                    </View>

                    {/* Right Amount Column */}
                    <View style={styles.txAmountCol}>
                      <View style={styles.txAmountRow}>
                        <Text style={[styles.txAmountText, { color: isCredit ? '#10B981' : '#FF6B6B' }]}>
                          {config.sign}{coinsAmt.toLocaleString()}
                        </Text>
                        <Image source={coinImg} style={styles.txCoinIcon} resizeMode="contain" />
                      </View>
                      <Text style={styles.txStatusText}>{isCredit ? 'Received' : 'Spent'}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>
    </ScreenBackgroundView>
  );
};

export default CoinHistory;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: width * 0.04,
    height: 48,
    marginBottom: 8,
  },
  backButton: {
    padding: 6,
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#0F172A',
    fontSize: RFValue(17),
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: width * 0.04,
    paddingBottom: 40,
  },
  heroCardContainer: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  heroCardBorder: {
    padding: 1.5,
    borderRadius: 20,
  },
  heroCard: {
    padding: 16,
    borderRadius: 19,
  },
  heroCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroSub: {
    fontSize: RFValue(11),
    color: '#78350F',
    marginBottom: 2,
    fontWeight: '600',
  },
  heroBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroBalanceText: {
    fontSize: RFValue(24),
    fontWeight: 'bold',
    color: '#92400E',
    marginRight: 8,
  },
  heroCoinIcon: {
    width: 26,
    height: 26,
  },
  totalBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'flex-end',
  },
  totalBadgeLbl: {
    fontSize: RFValue(10),
    color: '#92400E',
    fontWeight: '500',
  },
  totalBadgeVal: {
    fontSize: RFValue(12),
    fontWeight: 'bold',
    color: '#B45309',
    marginTop: 1,
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(180, 83, 9, 0.15)',
    marginVertical: 14,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginBottom: 4,
  },
  statBoxLbl: {
    fontSize: RFValue(10),
    color: '#78350F',
    marginBottom: 2,
    fontWeight: '500',
  },
  statBoxVal: {
    fontSize: RFValue(13),
    fontWeight: 'bold',
    color: '#1E293B',
  },
  statBoxDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(180, 83, 9, 0.15)',
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  filterTabWrap: {
    flex: 1,
  },
  filterTabActiveGradient: {
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterTabInactive: {
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterTextActive: {
    color: '#ffffff',
    fontSize: RFValue(12),
    fontWeight: 'bold',
  },
  filterText: {
    color: '#64748B',
    fontSize: RFValue(12),
    fontWeight: '600',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderTitle: {
    fontSize: RFValue(13),
    fontWeight: 'bold',
    color: '#0F172A',
  },
  sectionHeaderCount: {
    fontSize: RFValue(11),
    color: '#64748B',
    fontWeight: '500',
  },
  centered: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#64748B',
    fontSize: RFValue(12),
    marginTop: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: RFValue(14),
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: RFValue(11),
    color: '#64748B',
  },
  listContainer: {
    gap: 10,
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  txIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txDetailsCol: {
    flex: 1,
  },
  txTitle: {
    fontSize: RFValue(13),
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 3,
  },
  txMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  txMetaText: {
    fontSize: RFValue(10.5),
    color: '#64748B',
  },
  txMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 6,
  },
  txAmountCol: {
    alignItems: 'flex-end',
  },
  txAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  txAmountText: {
    fontSize: RFValue(14),
    fontWeight: 'bold',
    marginRight: 4,
  },
  txCoinIcon: {
    width: 16,
    height: 16,
  },
  txStatusText: {
    fontSize: RFValue(10),
    color: '#94A3B8',
  },
});
