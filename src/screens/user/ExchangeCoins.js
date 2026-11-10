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
  Image,
  TextInput,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthProvider';
import { exchangeCoins } from '../../utils/apiUtil';
import { AlertService } from '../../utils/AlertService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';
import { formatCompactBalance } from '../../utils/numberUtil';

const { width, height } = Dimensions.get('window');
const RF = (size) => Math.sqrt(width * width + height * height) * (size / 1000);
const WP = (percent) => (width * percent) / 100;
const HP = (percent) => (height * percent) / 100;

// 1. Beans to Coins Conversion — 9 Plans (200 Beans = 100 Coins, 200 Beans = ₹1)
const ExchangePackages = [
  { id: 'b2c_1', coins: 2000, diamonds: 1000, price: 10, badge: 'STARTER' },
  { id: 'b2c_2', coins: 4000, diamonds: 2000, price: 20, badge: 'POPULAR' },
  { id: 'b2c_3', coins: 10000, diamonds: 5000, price: 50, badge: 'HOT' },
  { id: 'b2c_4', coins: 20000, diamonds: 10000, price: 100, badge: 'VALUE' },
  { id: 'b2c_5', coins: 40000, diamonds: 20000, price: 200, badge: 'BEST VALUE' },
  { id: 'b2c_6', coins: 100000, diamonds: 50000, price: 500, badge: 'VIP PRO' },
  { id: 'b2c_7', coins: 200000, diamonds: 100000, price: 1000, badge: 'ROYAL' },
  { id: 'b2c_8', coins: 400000, diamonds: 200000, price: 2000, badge: 'SUPREME' },
  { id: 'b2c_9', coins: 1000000, diamonds: 500000, price: 5000, badge: 'WHALE' },
];

const ExchangeCoins = () => {
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 24);
  const navigation = useNavigation();
  const { user, fetchUserProfile } = useContext(AuthContext);
  const [loadingPack, setLoadingPack] = useState(null);
  const [calcBeans, setCalcBeans] = useState('20000');

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
          `Successfully converted ${pack.coins.toLocaleString()} Beans for ${pack.diamonds.toLocaleString()} Coins!`,
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
        <Text style={styles.headerTitle}>Exchange Beans to Coins</Text>
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
                <Text style={styles.balanceCount}>{formatCompactBalance(user?.coins || 0)}</Text>
                <Text style={{ color: '#FEF08A', fontSize: 13, fontWeight: '700', marginTop: 2 }}>
                  ≈ ₹{formatCompactBalance((user?.coins || 0) / 200)}
                </Text>
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
              Convert earned Beans into Coins for gifting, calls, and room perks (200 Beans = 100 Coins).
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
              Exchange Rate: <Text style={styles.rateHighlight}>200 Beans = 100 Coins (200 Beans = ₹1)</Text>
            </Text>
          </View>
        </View>

        {/* Beans Calculator */}
        <View style={styles.calcCardContainer}>
          <LinearGradient
            colors={['#0F172A', '#1E293B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.calcCard}
          >
            <View style={styles.calcHeaderRow}>
              <View style={styles.calcHeaderTitleGroup}>
                <Icon name="calculate" size={20} color="#10B981" style={{ marginRight: 6 }} />
                <Text style={styles.calcHeaderTitle}>Beans Calculator</Text>
              </View>
              <View style={styles.calcRateBadge}>
                <Text style={styles.calcRateBadgeText}>200 Beans = ₹1</Text>
              </View>
            </View>

            <Text style={styles.calcInputLabel}>Beans Quantity</Text>
            <View style={styles.calcInputWrapper}>
              <Image
                source={require('../../assets/icons/beans.png')}
                style={{ width: 22, height: 22, marginRight: 8 }}
                resizeMode="contain"
              />
              <TextInput
                style={styles.calcTextInput}
                keyboardType="numeric"
                value={calcBeans}
                onChangeText={(val) => setCalcBeans(val.replace(/[^0-9]/g, ''))}
                placeholder="Enter Beans Quantity"
                placeholderTextColor="#64748B"
              />
              {calcBeans ? (
                <TouchableOpacity onPress={() => setCalcBeans('')} style={styles.calcClearBtn}>
                  <Icon name="close" size={16} color="#94A3B8" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Quick Presets */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.calcPresetsScroll} contentContainerStyle={styles.calcPresetsContainer}>
              {['2000', '4000', '10000', '20000', '40000', '100000', '200000', '400000', '1000000'].map((preset) => (
                <TouchableOpacity
                  key={preset}
                  onPress={() => setCalcBeans(preset)}
                  style={[styles.calcPresetPill, calcBeans === preset && styles.calcPresetPillActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.calcPresetText, calcBeans === preset && styles.calcPresetTextActive]}>
                    {Number(preset).toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* 2 Output Cards */}
            <View style={styles.calcResultsGrid}>
              <View style={styles.calcResultBox}>
                <Text style={styles.calcResultLabel}>Coins Receive</Text>
                <View style={styles.calcResultRow}>
                  <Icon name="diamond" size={16} color="#38BDF8" style={{ marginRight: 4 }} />
                  <Text style={styles.calcResultCoinsText}>
                    {Math.floor((Number(calcBeans) || 0) / 2).toLocaleString()}
                  </Text>
                </View>
                <Text style={styles.calcResultSub}>200 Beans = 100 Coins</Text>
              </View>

              <View style={[styles.calcResultBox, { borderColor: '#10B981' }]}>
                <Text style={styles.calcResultLabel}>Withdrawal Value</Text>
                <View style={styles.calcResultRow}>
                  <Text style={styles.calcResultInrText}>
                    ₹{((Number(calcBeans) || 0) / 200).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                  </Text>
                </View>
                <Text style={styles.calcResultSub}>₹1 = 200 Beans</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Grid Title */}
        <Text style={styles.gridTitle}>Choose a Conversion Package (9 Plans)</Text>

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
                  <Image
                    source={require('../../assets/icons/beans.png')}
                    style={{ width: 14, height: 14, marginRight: 4 }}
                    resizeMode="contain"
                  />
                  <Text style={styles.valueText} numberOfLines={1}>{formatCompactBalance(pack.coins)}</Text>
                </View>
                <Text style={styles.valueSub}>Beans</Text>

                {/* Down Arrow */}
                <Icon name="arrow-downward" size={14} color="rgba(255,255,255,0.4)" style={styles.arrowIcon} />

                {/* Diamond item count */}
                <View style={styles.valueRow}>
                  <Icon name="diamond" size={12} color="#03dcfe" style={styles.itemIcon} />
                  <Text style={styles.valueTextCyan} numberOfLines={1}>
                    {formatCompactBalance(pack.diamonds)}
                  </Text>
                </View>
                <Text style={styles.valueSub}>Coins</Text>

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
                    <Text style={styles.exchangeBtnText}>₹{pack.price}</Text>
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
  calcCardContainer: {
    marginHorizontal: WP(4),
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  calcCard: {
    padding: 16,
    borderRadius: 20,
  },
  calcHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  calcHeaderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calcHeaderTitle: {
    color: '#F8FAFC',
    fontSize: RF(14),
    fontWeight: '800',
  },
  calcRateBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  calcRateBadgeText: {
    color: '#34D399',
    fontSize: RF(10),
    fontWeight: '700',
  },
  calcInputLabel: {
    color: '#94A3B8',
    fontSize: RF(11),
    fontWeight: '600',
    marginBottom: 6,
  },
  calcInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090D16',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
  },
  calcTextInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: RF(14),
    fontWeight: '700',
    paddingVertical: 0,
  },
  calcClearBtn: {
    padding: 4,
  },
  calcPresetsScroll: {
    marginTop: 10,
  },
  calcPresetsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  calcPresetPill: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  calcPresetPillActive: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  calcPresetText: {
    color: '#CBD5E1',
    fontSize: RF(10),
    fontWeight: '600',
  },
  calcPresetTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  calcResultsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  calcResultBox: {
    flex: 1,
    backgroundColor: '#090D16',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 14,
    padding: 12,
  },
  calcResultLabel: {
    color: '#94A3B8',
    fontSize: RF(10),
    fontWeight: '600',
  },
  calcResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  calcResultCoinsText: {
    color: '#38BDF8',
    fontSize: RF(16),
    fontWeight: '900',
  },
  calcResultInrText: {
    color: '#34D399',
    fontSize: RF(16),
    fontWeight: '900',
  },
  calcResultSub: {
    color: '#64748B',
    fontSize: RF(9),
    fontWeight: '500',
  },
});
