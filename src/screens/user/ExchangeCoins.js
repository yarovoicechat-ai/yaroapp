import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthProvider';
import { exchangeCoins } from '../../utils/apiUtil';
import { AlertService } from '../../utils/AlertService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';

const { width, height } = Dimensions.get('window');
const RF = (size) => Math.sqrt(width * width + height * height) * (size / 1000);
const WP = (percent) => (width * percent) / 100;
const HP = (percent) => (height * percent) / 100;

const ExchangePackages = [
  { id: 'ex_1k', coins: 1000, diamonds: 900, badge: '' },
  { id: 'ex_2k', coins: 2000, diamonds: 1800, badge: 'POPULAR' },
  { id: 'ex_5k', coins: 5000, diamonds: 4500, badge: '' },
  { id: 'ex_10k', coins: 10000, diamonds: 9000, badge: '' },
  { id: 'ex_20k', coins: 20000, diamonds: 18000, badge: 'BEST VALUE' },
  { id: 'ex_50k', coins: 50000, diamonds: 45000, badge: '' },
  { id: 'ex_100k', coins: 100000, diamonds: 90000, badge: '' },
  { id: 'ex_200k', coins: 200000, diamonds: 180000, badge: '' },
  { id: 'ex_500k', coins: 500000, diamonds: 450000, badge: '' },
];

const ExchangeCoins = () => {
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 24);
  const navigation = useNavigation();
  const { user, fetchUserProfile } = useContext(AuthContext);
  const [loadingPack, setLoadingPack] = useState(null);

  const handleExchange = async (pack) => {
    if ((user?.coins || 0) < pack.coins) {
      AlertService.show('Insufficient Beans', 'You do not have enough Beans to exchange for this package.', 'error');
      return;
    }

    setLoadingPack(pack.id);
    try {
      const res = await exchangeCoins(pack.coins);

      if (res.data.success) {
        AlertService.show(
          'Conversion Successful',
          `Successfully converted ${pack.coins.toLocaleString()} Beans for ${pack.diamonds.toLocaleString()} Diamonds!`,
          'success'
        );
        fetchUserProfile(); // Refresh user profile coins & diamonds balances
      } else {
        AlertService.show('Conversion Failed', res.data.message || 'Conversion failed', 'error');
      }
    } catch (err) {
      console.log('Exchange Beans Error:', err);
      AlertService.show('Error', err.response?.data?.message || 'Failed to complete conversion', 'error');
    } finally {
      setLoadingPack(null);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" animated />
      <LinearGradient
        colors={['#F8FAFC', '#F1F5F9', '#EEF2FF']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topSafeInset + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="chevron-left" size={26} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Exchange Beans to Diamonds</Text>
        <TouchableOpacity onPress={() => navigation.navigate('RechargeHistreoy')} style={styles.historyBtn}>
          <Text style={styles.historyBtnText}>History</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]} showsVerticalScrollIndicator={false}>
        {/* My Beans Balance Card */}
        <View style={styles.balanceCardContainer}>
          <LinearGradient
            colors={['#10B981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceCard}
          >
            <View style={styles.balanceHeaderRow}>
              <View style={styles.balanceLabelCol}>
                <Text style={styles.balanceLabel}>My Beans</Text>
                <Text style={styles.balanceCount}>{(user?.coins || 0).toLocaleString()}</Text>
              </View>
              <View style={styles.logoWrapper}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.05)']}
                  style={styles.logoGlowShape}
                >
                  <Icon name="grain" size={48} color="#FFFFFF" />
                </LinearGradient>
              </View>
            </View>

            <Text style={styles.balanceSubtext}>
              Convert earned Beans into Diamonds for gifting, room perks, and calls.
            </Text>

            <TouchableOpacity
              onPress={() => navigation.navigate('CoinHistory')}
              style={styles.historyLinkBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.historyLinkText}>History</Text>
              <Icon name="chevron-right" size={14} color="#FDE047" />
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Exchange Rate Banner */}
        <View style={styles.rateBannerContainer}>
          <View style={styles.rateBanner}>
            <Icon name="swap-horiz" size={20} color="#059669" style={styles.rateIcon} />
            <Text style={styles.rateText}>
              Exchange Rate: <Text style={styles.rateHighlight}>100 Beans = 90 Diamonds</Text>
            </Text>
          </View>
        </View>

        {/* Grid Title */}
        <Text style={styles.gridTitle}>Choose a Conversion Package</Text>

        {/* Packages Grid */}
        <View style={styles.packsGrid}>
          {ExchangePackages.map((pack) => {
            const hasEnough = (user?.coins || 0) >= pack.coins;
            const isBestValue = pack.badge === 'BEST VALUE';
            const isPopular = pack.badge === 'POPULAR';

            return (
              <View key={pack.id} style={styles.packCard}>
                {pack.badge ? (
                  <View style={[
                    styles.tagBadge,
                    isBestValue ? styles.bestValueTag : styles.popularTag
                  ]}>
                    <Text style={styles.tagBadgeText}>{pack.badge}</Text>
                  </View>
                ) : null}

                {/* Bean item count */}
                <View style={styles.valueRow}>
                  <Icon name="grain" size={14} color="#10B981" style={styles.itemIcon} />
                  <Text style={styles.valueText} numberOfLines={1}>{pack.coins.toLocaleString()}</Text>
                </View>
                <Text style={styles.valueSub}>Beans</Text>

                {/* Down Arrow */}
                <Icon name="arrow-downward" size={14} color="rgba(255,255,255,0.4)" style={styles.arrowIcon} />

                {/* Diamond item count */}
                <View style={styles.valueRow}>
                  <Icon name="diamond" size={12} color="#03dcfe" style={styles.itemIcon} />
                  <Text style={styles.valueTextCyan} numberOfLines={1}>
                    {pack.diamonds.toLocaleString()}
                  </Text>
                </View>
                <Text style={styles.valueSub}>Diamonds</Text>

                {/* Exchange action button */}
                <TouchableOpacity
                  disabled={loadingPack !== null}
                  onPress={() => handleExchange(pack)}
                  style={[
                    styles.exchangeBtn,
                    isPopular && styles.pinkExchangeBtn,
                    isBestValue && styles.goldExchangeBtn,
                    !hasEnough && styles.disabledBtn
                  ]}
                  activeOpacity={0.8}
                >
                  {loadingPack === pack.id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.exchangeBtnText}>Exchange</Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* Badges footer */}
        <View style={styles.footerSecure}>
          <View style={styles.secureBadgeRow}>
            <View style={styles.secureBadge}>
              <Icon name="verified-user" size={14} color="rgba(255, 255, 255, 0.4)" />
              <Text style={styles.secureBadgeText}>100% Secure</Text>
            </View>
            <View style={styles.secureBadge}>
              <Icon name="flash-on" size={14} color="rgba(255, 255, 255, 0.4)" />
              <Text style={styles.secureBadgeText}>Instant Credit</Text>
            </View>
            <View style={styles.secureBadge}>
              <Icon name="receipt" size={14} color="rgba(255, 255, 255, 0.4)" />
              <Text style={styles.secureBadgeText}>Exchange History</Text>
            </View>
          </View>
          <Text style={styles.footerSecureDesc}>
            Your transactions are safe and secure with us.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default ExchangeCoins;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  starOverlay1: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    opacity: 0.1,
  },
  starOverlay2: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    opacity: 0.05,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
    height: HP(7),
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  headerTitle: {
    color: '#0F172A',
    fontSize: RF(15),
    fontWeight: 'bold',
  },
  historyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  historyBtnText: {
    color: '#4F46E5',
    fontSize: RF(12),
    fontWeight: '600',
  },
  scrollContent: {
  },
  balanceCardContainer: {
    width: WP(92),
    alignSelf: 'center',
    marginTop: HP(1.5),
    marginBottom: HP(2),
  },
  balanceCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    elevation: 3,
    shadowColor: '#4F46E5',
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  balanceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceLabelCol: {
    flex: 1,
  },
  balanceLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: RF(12),
    fontWeight: '600',
  },
  balanceCount: {
    color: '#fff',
    fontSize: RF(28),
    fontWeight: 'bold',
    marginVertical: 2,
  },
  logoWrapper: {
    width: 68,
    height: 68,
    borderRadius: 34,
    overflow: 'hidden',
  },
  logoGlowShape: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceSubtext: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: RF(10.5),
    lineHeight: 16,
    marginBottom: 14,
  },
  historyLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  historyLinkText: {
    color: '#FDE047',
    fontSize: RF(11),
    fontWeight: 'bold',
    marginRight: 2,
  },
  rateBannerContainer: {
    width: WP(92),
    alignSelf: 'center',
    marginBottom: HP(2.5),
  },
  rateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 12,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  rateText: {
    color: '#334155',
    fontSize: RF(11.5),
    fontWeight: '600',
  },
  rateHighlight: {
    color: '#4F46E5',
    fontWeight: 'bold',
  },
  gridTitle: {
    color: '#0F172A',
    fontSize: RF(14),
    fontWeight: 'bold',
    marginBottom: 14,
    paddingHorizontal: WP(4),
    letterSpacing: 0.5,
  },
  packsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: WP(4),
    gap: 8,
  },
  packCard: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
    position: 'relative',
    marginVertical: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  tagBadge: {
    position: 'absolute',
    top: -8,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 2,
  },
  popularTag: {
    backgroundColor: '#ec4899',
  },
  bestValueTag: {
    backgroundColor: '#FF9800',
  },
  tagBadgeText: {
    color: '#fff',
    fontSize: RF(6.5),
    fontWeight: '900',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    color: '#0F172A',
    fontSize: RF(11.5),
    fontWeight: 'bold',
    maxWidth: WP(18),
  },
  valueSub: {
    color: '#64748B',
    fontSize: RF(8.5),
    fontWeight: '600',
    marginTop: 1,
  },
  arrowIcon: {
    marginVertical: 4,
  },
  exchangeBtn: {
    width: '100%',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#6366F1',
    borderRadius: 10,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  pinkExchangeBtn: {
    backgroundColor: '#FDF2F8',
    borderColor: '#EC4899',
  },
  goldExchangeBtn: {
    backgroundColor: '#FFFBEB',
    borderColor: '#F59E0B',
  },
  disabledBtn: {
    opacity: 0.4,
  },
  exchangeBtnText: {
    color: '#4F46E5',
    fontSize: RF(9.5),
    fontWeight: 'bold',
  },
  footerSecure: {
    width: WP(92),
    alignSelf: 'center',
    marginTop: HP(4),
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 18,
  },
  secureBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  secureBadgeText: {
    color: '#64748B',
    fontSize: RF(8.5),
    fontWeight: '600',
  },
  footerSecureDesc: {
    color: '#94A3B8',
    fontSize: RF(8.5),
    textAlign: 'center',
    lineHeight: 14,
  },
  rateIcon: {
    marginRight: 6,
  },
  itemIcon: {
    marginRight: 2,
  },
  valueTextCyan: {
    color: '#0284C7',
    fontSize: RF(11.5),
    fontWeight: 'bold',
    maxWidth: WP(18),
  },
});
