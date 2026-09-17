import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
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
      AlertService.show('Insufficient Coins', 'You do not have enough coins to exchange for this package.', 'error');
      return;
    }

    setLoadingPack(pack.id);
    try {
      const res = await exchangeCoins(pack.coins);

      if (res.data.success) {
        AlertService.show(
          'Exchange Successful',
          `Successfully exchanged ${pack.coins.toLocaleString()} Coins for ${pack.diamonds.toLocaleString()} Diamonds!`,
          'success'
        );
        fetchUserProfile(); // Refresh user profile coins & diamonds balances
      } else {
        AlertService.show('Exchange Failed', res.data.message || 'Exchange failed', 'error');
      }
    } catch (err) {
      console.log('Exchange Coins Error:', err);
      AlertService.show('Error', err.response?.data?.message || 'Failed to complete exchange', 'error');
    } finally {
      setLoadingPack(null);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#060212', '#0e0423', '#030109']}
        style={StyleSheet.absoluteFillObject}
      />
      {/* Space decorative overlays */}
      <View style={styles.starOverlay1} />
      <View style={styles.starOverlay2} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topSafeInset + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="chevron-left" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Exchange Coins to Diamonds</Text>
        <TouchableOpacity onPress={() => navigation.navigate('RechargeHistreoy')} style={styles.historyBtn}>
          <Text style={styles.historyBtnText}>History</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]} showsVerticalScrollIndicator={false}>
        {/* My Coins Balance Card */}
        <View style={styles.balanceCardContainer}>
          <LinearGradient
            colors={['#7c4dff', '#b512e6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceCard}
          >
            <View style={styles.balanceHeaderRow}>
              <View style={styles.balanceLabelCol}>
                <Text style={styles.balanceLabel}>My Coins</Text>
                <Text style={styles.balanceCount}>{(user?.coins || 0).toLocaleString()}</Text>
              </View>
              <View style={styles.logoWrapper}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.02)']}
                  style={styles.logoGlowShape}
                >
                  <Icon name="stars" size={48} color="#FFD700" />
                </LinearGradient>
              </View>
            </View>

            <Text style={styles.balanceSubtext}>
              Use coins to call, connect and enjoy premium features.
            </Text>

            <TouchableOpacity
              onPress={() => navigation.navigate('CoinHistory')}
              style={styles.historyLinkBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.historyLinkText}>History</Text>
              <Icon name="chevron-right" size={14} color="#03dcfe" />
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Exchange Rate Banner */}
        <View style={styles.rateBannerContainer}>
          <LinearGradient
            colors={['rgba(3, 220, 254, 0.12)', 'rgba(124, 77, 255, 0.12)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.rateBanner}
          >
            <Icon name="swap-horiz" size={20} color="#03dcfe" style={styles.rateIcon} />
            <Text style={styles.rateText}>
              Exchange Rate: <Text style={styles.rateHighlight}>100 Coins = 90 Diamonds</Text>
            </Text>
          </LinearGradient>
        </View>

        {/* Grid Title */}
        <Text style={styles.gridTitle}>Choose an Exchange Package</Text>

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

                {/* Coin item count */}
                <View style={styles.valueRow}>
                  <Icon name="stars" size={12} color="#FFD700" style={styles.itemIcon} />
                  <Text style={styles.valueText} numberOfLines={1}>{pack.coins.toLocaleString()}</Text>
                </View>
                <Text style={styles.valueSub}>Coins</Text>

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
    padding: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: RF(15),
    fontWeight: 'bold',
  },
  historyBtn: {
    padding: 4,
  },
  historyBtnText: {
    color: 'rgba(255, 255, 255, 0.7)',
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
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
    color: 'rgba(255, 255, 255, 0.7)',
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
    color: 'rgba(255, 255, 255, 0.55)',
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
    color: '#03dcfe',
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
    borderRadius: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(3, 220, 254, 0.2)',
  },
  rateText: {
    color: '#fff',
    fontSize: RF(11),
    fontWeight: '600',
  },
  rateHighlight: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  gridTitle: {
    color: '#fff',
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
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
    position: 'relative',
    marginVertical: 6,
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
    color: '#fff',
    fontSize: RF(11.5),
    fontWeight: 'bold',
    maxWidth: WP(18),
  },
  valueSub: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: RF(8.5),
    fontWeight: '600',
    marginTop: 1,
  },
  arrowIcon: {
    marginVertical: 4,
  },
  exchangeBtn: {
    width: '100%',
    backgroundColor: 'rgba(3, 220, 254, 0.15)',
    borderWidth: 1,
    borderColor: '#03dcfe',
    borderRadius: 10,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  pinkExchangeBtn: {
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
    borderColor: '#ec4899',
  },
  goldExchangeBtn: {
    backgroundColor: 'rgba(255, 152, 0, 0.15)',
    borderColor: '#FF9800',
  },
  disabledBtn: {
    opacity: 0.4,
  },
  exchangeBtnText: {
    color: '#fff',
    fontSize: RF(9.5),
    fontWeight: 'bold',
  },
  footerSecure: {
    width: WP(92),
    alignSelf: 'center',
    marginTop: HP(4),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
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
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: RF(8.5),
    fontWeight: '600',
  },
  footerSecureDesc: {
    color: 'rgba(255, 255, 255, 0.3)',
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
    color: '#03dcfe',
    fontSize: RF(11.5),
    fontWeight: 'bold',
    maxWidth: WP(18),
  },
});
