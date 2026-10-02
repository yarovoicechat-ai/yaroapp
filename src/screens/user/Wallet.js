import React, { useState, useContext, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Image,
  ImageBackground,
  StatusBar,
  Platform,
} from 'react-native';

const diamondCardBg = require('../../assets/card/dimond_back_card.png');
const diamondIcon = require('../../assets/icons/diamond.png');
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';
import { AuthContext } from '../../context/AuthProvider';
import { apiUtil, exchangeCoins } from '../../utils/apiUtil';
import { AlertService } from '../../utils/AlertService';
import BillingService from '../../services/BillingService';
import { GOOGLE_PLAY_PRODUCTS } from '../../constants/googlePlayProducts';
import DeviceInfo from 'react-native-device-info';

const { width, height } = Dimensions.get('window');
const RF = (size) => Math.sqrt(width * width + height * height) * (size / 1000);
const WP = (percent) => (width * percent) / 100;
const HP = (percent) => (height * percent) / 100;

const CoinPacks = [
  { id: 'ex_1k', coins: 1000, diamonds: 900, price: 100, badge: '' },
  { id: 'ex_2k', coins: 2000, diamonds: 1800, price: 200, badge: 'POPULAR' },
  { id: 'ex_5k', coins: 5000, diamonds: 4500, price: 500, badge: '' },
  { id: 'ex_10k', coins: 10000, diamonds: 9000, price: 1000, badge: '' },
  { id: 'ex_20k', coins: 20000, diamonds: 18000, price: 2000, badge: 'BEST VALUE' },
  { id: 'ex_50k', coins: 50000, diamonds: 45000, price: 5000, badge: '' },
  { id: 'ex_100k', coins: 100000, diamonds: 90000, price: 10000, badge: '' },
  { id: 'ex_200k', coins: 200000, diamonds: 180000, price: 20000, badge: '' },
  { id: 'ex_500k', coins: 500000, diamonds: 450000, price: 50000, badge: '' },
];

const Wallet = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 42);
  const { user, fetchUserProfile } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState('Diamonds'); // 'Diamonds' or 'Beans'
  const [loading, setLoading] = useState(false);
  const [purchasingPackId, setPurchasingPackId] = useState(null);
  const [productsCatalog, setProductsCatalog] = useState(GOOGLE_PLAY_PRODUCTS);

  /**
   * Verify purchase token with backend and consume Google Play purchase
   */
  const verifyPurchaseWithBackend = useCallback(async (purchase) => {
    if (!purchase) return false;

    const purchaseToken = purchase.purchaseToken;
    const productId = purchase.productId || purchase.skus?.[0];

    if (!purchaseToken || !productId) {
      console.warn('[GP-BILLING] Missing purchaseToken or productId in purchase object:', purchase);
      return false;
    }

    const maskedToken = purchaseToken ? purchaseToken.substring(0, 8) + "..." + purchaseToken.slice(-6) : "N/A";
    console.log(`[GP-BILLING] VERIFY API START for productId: ${productId}, masked purchaseToken: ${maskedToken}`);
    console.log(`[GP-BILLING] VERIFY API URL: /payment/verify-google`);
    setLoading(true);

    try {
      const currentPackage = DeviceInfo.getBundleId() || 'yaro.vc.app';
      const res = await apiUtil.post('/payment/verify-google', {
        productId,
        purchaseToken,
        packageName: currentPackage,
      });

      console.log(`[GP-BILLING] VERIFY API RESPONSE STATUS: ${res.status}`);
      console.log(`[GP-BILLING] VERIFY API RESPONSE DATA:`, JSON.stringify(res.data || {}));

      if (res.data && res.data.success) {
        console.log(`[GP-BILLING] VERIFY SUCCESS for productId: ${productId}`);

        // Complete/consume transaction on Google Play Store
        console.log(`[GP-BILLING] COMPLETE PURCHASE START for SKU: ${productId}`);
        const completeSuccess = await BillingService.completePurchase(purchase);
        console.log(`[GP-BILLING] COMPLETE PURCHASE ${completeSuccess ? 'SUCCESS' : 'FAILED'} for SKU: ${productId}`);

        const diamondsAdded = res.data.diamondsAdded || GOOGLE_PLAY_PRODUCTS[productId]?.diamonds || 0;
        
        if (res.data.status === 'ALREADY_PROCESSED') {
          console.log('[GP-BILLING] Purchase was already processed previously');
        } else {
          AlertService.show(
            'Purchase Successful 🎉',
            `${diamondsAdded.toLocaleString()} Diamonds have been added to your wallet.`,
            'success'
          );
        }

        // Refresh user profile / balance from server
        console.log('[GP-BILLING] WALLET REFRESH START');
        await fetchUserProfile();
        console.log('[GP-BILLING] WALLET REFRESH SUCCESS');
        console.log(`[GP-BILLING] FINAL DIAMOND BALANCE: ${user?.diamonds}`);
        return true;
      } else if (res.data && res.data.status === 'PENDING') {
        console.log('[GP-BILLING] Purchase is PENDING on backend');
        AlertService.show(
          'Payment Pending ⏳',
          'Payment is pending. Your Diamonds will be added automatically after Google confirms the payment.',
          'info'
        );
        return false;
      } else {
        console.warn('[GP-BILLING] VERIFY FAILED:', res.data?.message);
        AlertService.show('Purchase Failed', res.data?.message || 'Payment verification failed', 'error');
        return false;
      }
    } catch (err) {
      console.error('[GP-BILLING] VERIFY FAILED with Exception:', err);
      
      const status = err.response?.status;
      const backendMessage = err.response?.data?.message;

      console.log(`[GP-BILLING] VERIFY API RESPONSE STATUS: ${status || 'NETWORK_ERROR'}`);
      console.log(`[GP-BILLING] VERIFY API RESPONSE DATA:`, JSON.stringify(err.response?.data || {}));

      // If backend returned a structured error response (e.g. 400 Bad Request with a clear message)
      if (err.response && backendMessage) {
        if (err.response.data?.status === 'ALREADY_PROCESSED') {
          await BillingService.completePurchase(purchase);
          await fetchUserProfile();
          return true;
        }

        AlertService.show('Verification Error', backendMessage, 'error');
      } else {
        // True network or server connectivity failure
        AlertService.show(
          'Verification Delay',
          'Payment received. We are verifying your purchase. Your Diamonds will be added shortly.',
          'info'
        );
      }
      return false;
    } finally {
      setLoading(false);
      setPurchasingPackId(null);
    }
  }, [fetchUserProfile, user?.diamonds]);

  /**
   * Handle purchase updates from BillingService listeners
   */
  const handlePurchaseSuccess = useCallback(async (purchase) => {
    console.log('[Wallet] Purchase successful callback received:', purchase);
    await verifyPurchaseWithBackend(purchase);
  }, [verifyPurchaseWithBackend]);

  const handlePurchasePending = useCallback(() => {
    setLoading(false);
    setPurchasingPackId(null);
    AlertService.show(
      'Payment Pending ⏳',
      'Payment is pending. Your Diamonds will be added automatically after Google confirms the payment.',
      'info'
    );
  }, []);

  const handlePurchaseError = useCallback((error) => {
    setLoading(false);
    setPurchasingPackId(null);
    console.log('[Wallet] Purchase error callback:', error);
    
    const errStr = typeof error === 'string' ? error : JSON.stringify(error || {});
    const isUserCancel = error?.code === 'E_USER_CANCELLED' || 
                         errStr.toLowerCase().includes('cancel') ||
                         errStr.toLowerCase().includes('user');

    const isDeveloperSigningError = error?.code === 'developer-error' || 
                                    errStr.toLowerCase().includes('signed correctly') ||
                                    errStr.toLowerCase().includes('not configured for billing');

    const isAlreadyOwned = error?.code === 'E_ALREADY_OWNED' || 
                           errStr.toLowerCase().includes('already own') ||
                           errStr.toLowerCase().includes('already_owned');

    if (isAlreadyOwned) {
      AlertService.show(
        'Completing Previous Purchase 🔄',
        'You have an unconsumed purchase for this item. Syncing and adding your Diamonds now...',
        'info'
      );
      BillingService.restorePurchases(verifyPurchaseWithBackend);
    } else if (isUserCancel) {
      console.log('[Wallet] User canceled purchase flow');
    } else if (isDeveloperSigningError) {
      AlertService.show(
        'Play Console Upload Required 📲',
        'Google Play requires this build to be uploaded to Google Play Console under Internal Testing track.\n\nAfter uploading app-release.apk to Internal Testing, install the app via the Play Store test link to enable test purchases.',
        'error'
      );
    } else {
      AlertService.show('Purchase Interrupted', 'Payment could not be completed. No Diamonds were deducted.', 'error');
    }
  }, [verifyPurchaseWithBackend]);

  /**
   * Initialize Billing & sync products / unfinished purchases on mount
   */
  useEffect(() => {
    fetchUserProfile();

    let isMounted = true;

    const loadBilling = async () => {
      if (Platform.OS === 'android') {
        // Setup billing listeners
        BillingService.setupListeners(
          handlePurchaseSuccess,
          handlePurchasePending,
          handlePurchaseError
        );

        // Fetch Play Store product catalog details
        const updatedCatalog = await BillingService.queryProducts();
        if (isMounted && updatedCatalog) {
          setProductsCatalog(updatedCatalog);
        }

        // Restore/re-verify any unfinished purchases
        await BillingService.restorePurchases(verifyPurchaseWithBackend);
      }
    };

    loadBilling();

    return () => {
      isMounted = false;
      if (Platform.OS === 'android') {
        BillingService.removeListeners();
      }
    };
  }, [fetchUserProfile, handlePurchaseSuccess, handlePurchasePending, handlePurchaseError, verifyPurchaseWithBackend]);

  const handleBuyDiamond = async (pack) => {
    if (!user) {
      AlertService.show('Authentication Required', 'Please log in to purchase diamonds.', 'error');
      return;
    }

    if (purchasingPackId || loading) {
      return; // Prevent duplicate taps
    }

    setPurchasingPackId(pack.productId);
    setLoading(true);

    try {
      await BillingService.buyProduct(pack.productId, user.userId || user._id);
    } catch (err) {
      console.error('[Wallet] handleBuyDiamond error:', err);
      setLoading(false);
      setPurchasingPackId(null);

      const errStr = typeof err === 'string' ? err : JSON.stringify(err || {});
      const isUserCancel = err?.code === 'E_USER_CANCELLED' || errStr.toLowerCase().includes('cancel');
      const isDeveloperSigningError = err?.code === 'developer-error' || errStr.toLowerCase().includes('signed correctly');
      const isAlreadyOwned = err?.code === 'E_ALREADY_OWNED' || 
                             errStr.toLowerCase().includes('already own') ||
                             errStr.toLowerCase().includes('already_owned');

      if (isAlreadyOwned) {
        AlertService.show(
          'Completing Previous Purchase 🔄',
          'You already own this item from a previous transaction. Syncing and crediting your Diamonds now...',
          'info'
        );
        await BillingService.restorePurchases(verifyPurchaseWithBackend);
      } else if (isDeveloperSigningError) {
        AlertService.show(
          'Play Console Upload Required 📲',
          'Google Play requires this build to be uploaded to Google Play Console under Internal Testing track.\n\nAfter uploading app-release.apk to Internal Testing, install the app via the Play Store test link to enable test purchases.',
          'error'
        );
      } else if (!isUserCancel) {
        AlertService.show('Error', err.message || 'Payment could not be processed', 'error');
      }
    }
  };

  const handleExchangeCoin = async (pack) => {
    if ((user?.coins || 0) < pack.coins) {
      AlertService.show('Insufficient Beans', 'You do not have enough Beans to exchange for this package.', 'error');
      return;
    }

    AlertService.show(
      'Confirm Conversion',
      `Are you sure you want to convert ${pack.coins.toLocaleString()} Beans into ${pack.diamonds.toLocaleString()} Diamonds?`,
      'info',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Convert',
          onPress: async () => {
            setLoading(true);
            try {
              const res = await exchangeCoins(pack.coins);

              if (res.data.success) {
                AlertService.show(
                  'Conversion Successful 🎉',
                  `Converted ${pack.coins.toLocaleString()} Beans to ${pack.diamonds.toLocaleString()} Diamonds!`,
                  'success'
                );
                fetchUserProfile();
              } else {
                AlertService.show('Conversion Failed', res.data.message || 'Conversion failed', 'error');
              }
            } catch (err) {
              console.log('Exchange Error:', err);
              const errMsg = err.response?.data?.message || err.message || 'Failed to complete conversion';
              const statusStr = err.response?.status ? ` (Status: ${err.response.status})` : '';
              AlertService.show('Error', `${errMsg}${statusStr}`, 'error');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderTabButton = (tabKey, label, icon, activeColor) => {
    const isActive = activeTab === tabKey;
    return (
      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => setActiveTab(tabKey)}
        activeOpacity={0.8}
      >
        {isActive ? (
          <LinearGradient
            colors={['#7c4dff', '#4f46e5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.tabButtonGradient}
          >
            <View style={styles.tabContentRow}>
              {tabKey === 'Diamonds' ? (
                <Image source={diamondIcon} style={{ width: 16, height: 16, marginRight: 4 }} resizeMode="contain" />
              ) : (
                <Icon name={icon} size={16} color={activeColor} style={{ marginRight: 4 }} />
              )}
              <Text style={styles.tabTextActive}>{label}</Text>
            </View>
          </LinearGradient>
        ) : (
          <View style={styles.tabContentRow}>
            {tabKey === 'Diamonds' ? (
              <Image source={diamondIcon} style={{ width: 16, height: 16, opacity: 0.6, marginRight: 4 }} resizeMode="contain" />
            ) : (
              <Icon name={icon} size={16} color="#64748B" style={{ marginRight: 4 }} />
            )}
            <Text style={styles.tabText}>{label}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const packList = Object.values(productsCatalog);

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" animated />
      <LinearGradient
        colors={['#F8FAFC', '#F1F5F9', '#E2E8F0']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header bar */}
      <View style={[styles.header, { paddingTop: topSafeInset + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="chevron-left" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wallet</Text>
        <TouchableOpacity
          style={[styles.historyBtnHeader, activeTab === 'Beans' && styles.historyBtnCoin]}
          onPress={() =>
            navigation.navigate(activeTab === 'Beans' ? 'ExchangeHistory' : 'RechargeHistreoy')
          }
          activeOpacity={0.8}
        >
          <Icon name="history" size={16} color={activeTab === 'Beans' ? '#D97706' : '#6C5CE7'} style={{ marginRight: 4 }} />
          <Text style={[styles.historyTextHeader, activeTab === 'Beans' && { color: '#D97706' }]}>
            {activeTab === 'Beans' ? 'Beans History' : 'History'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Custom Tabs */}
      <View style={styles.tabBar}>
        {renderTabButton('Diamonds', 'Diamonds', 'diamond', '#03dcfe')}
        {renderTabButton('Beans', 'Beans', 'grain', '#10B981')}
      </View>

      {loading && !purchasingPackId && (
        <View style={styles.fullLoader}>
          <ActivityIndicator size="large" color="#03dcfe" />
        </View>
      )}

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]} showsVerticalScrollIndicator={false}>
        {activeTab === 'Diamonds' ? (
          <View style={styles.tabBody}>
            {/* Diamonds Balance Card */}
            <View style={styles.balanceCardContainer}>
              <ImageBackground
                source={diamondCardBg}
                style={styles.balanceCard}
                imageStyle={{ borderRadius: 24 }}
                resizeMode="cover"
              >
                <View style={styles.balanceHeaderRow}>
                  <View style={styles.balanceLabelCol}>
                    <Text style={styles.balanceLabel}>My Diamonds</Text>
                    <View style={styles.balanceCountRow}>
                      <Text style={styles.balanceCount}>{(user?.diamonds || 0).toLocaleString()}</Text>
                      <Image source={diamondIcon} style={{ width: 24, height: 24, marginLeft: 6 }} resizeMode="contain" />
                    </View>
                    <Text style={styles.balanceValue}>≈ ₹{((user?.diamonds || 0) / 10).toFixed(2)}</Text>
                  </View>
                </View>

                <Text style={styles.balanceSubtext}>
                  Use diamonds to unlock premium features and enjoy exclusive benefits.
                </Text>

                <TouchableOpacity
                  onPress={() => navigation.navigate('RechargeHistreoy')}
                  style={styles.historyBtn}
                  activeOpacity={0.7}
                >
                  <Icon name="history" size={14} color="#03dcfe" style={styles.iconMarginRight} />
                  <Text style={styles.historyBtnText}>History</Text>
                  <Icon name="chevron-right" size={12} color="#03dcfe" />
                </TouchableOpacity>
              </ImageBackground>
            </View>

            {/* Choose diamond pack section */}
            <View style={styles.gridTitleContainer}>
              <Image source={diamondIcon} style={{ width: 18, height: 18, marginRight: 6 }} resizeMode="contain" />
              <Text style={styles.gridTitle}>Choose a Diamond Pack</Text>
              <View style={styles.titleLine} />
            </View>

            <View style={styles.packsGrid}>
              {packList.map((pack) => {
                const isPackLoading = purchasingPackId === pack.productId;
                const displayPrice = pack.localizedPrice || pack.formattedPrice || `₹${pack.priceInr}`;

                return (
                  <TouchableOpacity
                    key={pack.productId}
                    onPress={() => handleBuyDiamond(pack)}
                    disabled={loading || isPackLoading}
                    style={[
                      styles.packCard,
                      pack.isPopular && styles.packCardPopular,
                      (loading || isPackLoading) && { opacity: 0.7 },
                    ]}
                    activeOpacity={0.8}
                  >
                    {pack.isPopular && (
                      <View style={styles.popularTag}>
                        <Text style={styles.popularTagText}>POPULAR</Text>
                      </View>
                    )}

                    <View style={styles.packTop}>
                      <Image source={diamondIcon} style={{ width: 22, height: 22 }} resizeMode="contain" />
                      <Text style={styles.packLabelText}>{displayPrice}</Text>
                    </View>

                    <Icon name="keyboard-arrow-down" size={12} color="rgba(255,255,255,0.4)" style={styles.packArrow} />

                    <View style={styles.packBottom}>
                      <Image source={diamondIcon} style={{ width: 14, height: 14, marginRight: 4 }} resizeMode="contain" />
                      <Text style={styles.packDiamondsText}>{pack.diamonds.toLocaleString()}</Text>
                      <Text style={styles.packDiamondsSub}>Diamonds</Text>
                    </View>

                    <LinearGradient
                      colors={['#7c4dff', '#4f46e5']}
                      style={styles.packButtonGradient}
                    >
                      {isPackLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.packButtonText}>{displayPrice}</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Secure payments footer */}
            <View style={styles.footerSecure}>
              <View style={styles.secureBadgeRow}>
                <View style={styles.secureBadge}>
                  <Icon name="verified-user" size={14} color="#03dcfe" style={styles.iconMarginRight} />
                  <Text style={styles.secureBadgeText}>100% Secure Google Payments</Text>
                </View>
                <View style={styles.secureBadge}>
                  <Icon name="security" size={14} color="#03dcfe" style={styles.iconMarginRight} />
                  <Text style={styles.secureBadgeText}>SSL Secured</Text>
                </View>
                <View style={styles.secureBadge}>
                  <Icon name="payment" size={14} color="#03dcfe" style={styles.iconMarginRight} />
                  <Text style={styles.secureBadgeText}>Google Play Verified</Text>
                </View>
              </View>
              <Text style={styles.footerSecureDesc}>
                Your transactions are processed safely and securely via Google Play.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.tabBody}>
            {/* Beans Balance Card */}
            <View style={styles.balanceCardContainer}>
              <LinearGradient
                colors={['#ECFDF5', '#D1FAE5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.balanceCard, { borderColor: '#A7F3D0' }]}
              >
                <View style={styles.balanceHeaderRow}>
                  <View style={styles.balanceLabelCol}>
                    <Text style={[styles.balanceLabel, { color: '#065F46' }]}>My Beans</Text>
                    <View style={styles.balanceCountRow}>
                      <Text style={[styles.balanceCount, { color: '#047857' }]}>{(user?.coins || 0).toLocaleString()}</Text>
                      <Icon name="stars" size={24} color="#10B981" style={styles.balanceIcon} />
                    </View>
                    <Text style={[styles.balanceValue, { color: '#059669' }]}>≈ ₹{((user?.coins || 0) / 20).toFixed(2)}</Text>
                  </View>

                  {/* Gorgeous Pedestal */}
                  <View style={styles.pedestalContainer}>
                    <View style={[styles.pedestalRing3, { borderColor: 'rgba(16, 185, 129, 0.2)' }]}>
                      <View style={[styles.pedestalRing2, { borderColor: 'rgba(16, 185, 129, 0.4)' }]}>
                        <View style={[styles.pedestalRing1, { backgroundColor: '#10B981' }]}>
                          <Text style={{ fontSize: 22 }}>🌱</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>

                <Text style={[styles.balanceSubtext, { color: '#065F46' }]}>
                  Beans are earned through host calls, gifts received, and creator rewards. Convert Beans into Diamonds or withdraw to UPI/Bank.
                </Text>

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Withdrawal')}
                    style={[styles.historyBtn, { backgroundColor: '#10B981', borderColor: '#059669' }]}
                    activeOpacity={0.7}
                  >
                    <Icon name="account-balance-wallet" size={14} color="#FFF" style={styles.iconMarginRight} />
                    <Text style={[styles.coinHistoryBtnText, { color: '#FFF' }]}>Withdraw</Text>
                    <Icon name="chevron-right" size={12} color="#FFF" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => navigation.navigate('CoinHistory')}
                    style={[styles.historyBtn, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}
                    activeOpacity={0.7}
                  >
                    <Icon name="history" size={14} color="#047857" style={styles.iconMarginRight} />
                    <Text style={[styles.coinHistoryBtnText, { color: '#047857' }]}>History</Text>
                    <Icon name="chevron-right" size={12} color="#047857" />
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>

            {/* Choose bean conversion pack section */}
            <View style={styles.gridTitleContainer}>
              <Icon name="swap-horizontal-circle" size={18} color="#10B981" style={styles.gridTitleIcon} />
              <Text style={styles.gridTitle}>Convert Beans to Diamonds</Text>
              <View style={styles.titleLine} />
            </View>

            <View style={styles.packsGrid}>
              {CoinPacks.map((pack) => {
                const isPopular = pack.badge === 'POPULAR';
                const isBestValue = pack.badge === 'BEST VALUE';

                let btnColors = null;
                if (isPopular) btnColors = ['#059669', '#047857'];
                if (isBestValue) btnColors = ['#10B981', '#059669'];

                return (
                  <TouchableOpacity
                    key={pack.id}
                    onPress={() => handleExchangeCoin(pack)}
                    style={[
                      styles.packCard,
                      isPopular && styles.packCardPopular,
                      isBestValue && styles.packCardBestValue,
                    ]}
                    activeOpacity={0.8}
                  >
                    {pack.badge ? (
                      <View style={[
                        styles.popularTag,
                        isPopular && styles.pinkBadge,
                        isBestValue && styles.goldBadge,
                      ]}>
                        <Text style={styles.popularTagText}>{pack.badge}</Text>
                      </View>
                    ) : null}

                    <View style={styles.packTop}>
                      <Icon name="grain" size={20} color="#10B981" />
                      <Text style={styles.packLabelText}>{pack.coins.toLocaleString()}</Text>
                      <Text style={styles.packLabelSub}>Beans</Text>
                    </View>

                    <Icon name="keyboard-arrow-down" size={12} color="rgba(255,255,255,0.4)" style={styles.packArrow} />

                    <View style={styles.packBottom}>
                      <Image source={diamondIcon} style={{ width: 14, height: 14, marginRight: 4 }} resizeMode="contain" />
                      <Text style={styles.packDiamondsText}>{pack.diamonds.toLocaleString()}</Text>
                      <Text style={styles.packDiamondsSub}>Diamonds</Text>
                    </View>

                    {btnColors ? (
                      <LinearGradient colors={btnColors} style={styles.packButtonGradient}>
                        <Text style={styles.packButtonText}>Convert</Text>
                      </LinearGradient>
                    ) : (
                      <View style={[styles.packButtonBordered, { borderColor: '#10B981' }]}>
                        <Text style={[styles.packButtonTextBordered, { color: '#047857' }]}>Convert</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Three features secure panel for Coins tab */}
            <View style={styles.coinsInfoCards}>
              <View style={styles.infoCard}>
                <View style={styles.infoCardIconBg}>
                  <Icon name="verified-user" size={18} color="#d946ef" />
                </View>
                <View style={styles.infoCardTexts}>
                  <Text style={styles.infoCardTitle}>100% Secure</Text>
                  <Text style={styles.infoCardDesc}>Safe & trusted transactions</Text>
                </View>
              </View>

              <View style={styles.infoCard}>
                <View style={styles.infoCardIconBg}>
                  <Icon name="flash-on" size={18} color="#d946ef" />
                </View>
                <View style={styles.infoCardTexts}>
                  <Text style={styles.infoCardTitle}>Instant Credit</Text>
                  <Text style={styles.infoCardDesc}>Diamonds will be added instantly</Text>
                </View>
              </View>

              <View style={styles.infoCard}>
                <View style={styles.infoCardIconBg}>
                  <Icon name="receipt" size={18} color="#d946ef" />
                </View>
                <View style={styles.infoCardTexts}>
                  <Text style={styles.infoCardTitle}>Exchange History</Text>
                  <Text style={styles.infoCardDesc}>Track all your exchange activities</Text>
                </View>
              </View>
            </View>

            {/* Bottom lock sign description */}
            <View style={styles.bottomLockRow}>
              <Icon name="lock" size={12} color="rgba(255,255,255,0.4)" style={styles.iconMarginRight} />
              <Text style={styles.bottomLockText}>Your transactions are safe and secure with us.</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default Wallet;

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
  fullLoader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  backBtn: {
    padding: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: RF(18),
    fontWeight: 'bold',
  },
  historyBtnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(217, 70, 239, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(217, 70, 239, 0.3)',
  },
  historyBtnCoin: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  historyTextHeader: {
    color: '#6C5CE7',
    fontSize: RF(11.5),
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    width: WP(92),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 4,
    alignSelf: 'center',
    marginVertical: HP(1.5),
    elevation: 2,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  tabButton: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    overflow: 'hidden',
  },
  tabButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContentRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tabText: {
    fontSize: RF(12),
    color: '#64748B',
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontSize: RF(12),
    fontWeight: '800',
  },
  scrollContent: {
    paddingBottom: HP(4),
  },
  tabBody: {
    width: '100%',
    paddingHorizontal: WP(4),
  },
  balanceCardContainer: {
    width: '100%',
    marginBottom: HP(2.5),
  },
  balanceCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    elevation: 3,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
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
    color: '#64748B',
    fontSize: RF(12),
    fontWeight: '700',
  },
  balanceCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    gap: 6,
  },
  balanceCount: {
    color: '#0F172A',
    fontSize: RF(30),
    fontWeight: 'bold',
  },
  balanceIcon: {
    marginTop: 2,
  },
  balanceValue: {
    color: '#6C5CE7',
    fontSize: RF(13.5),
    fontWeight: 'bold',
  },
  pedestalContainer: {
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pedestalRing3: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 1.5,
    borderColor: 'rgba(217, 70, 239, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pedestalRing2: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1.5,
    borderColor: 'rgba(217, 70, 239, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pedestalRing1: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(217, 70, 239, 0.15)',
    borderWidth: 1.5,
    borderColor: '#d946ef',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#d946ef',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  pedestalCoinImg: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  balanceSubtext: {
    color: '#64748B',
    fontSize: RF(11),
    lineHeight: 16,
    marginBottom: 14,
  },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  historyBtnText: {
    color: '#6C5CE7',
    fontSize: RF(11),
    fontWeight: 'bold',
    marginRight: 2,
  },
  coinHistoryBtnText: {
    color: '#D97706',
    fontSize: RF(11),
    fontWeight: 'bold',
    marginRight: 2,
  },
  iconMarginRight: {
    marginRight: 4,
  },
  gridTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  gridTitleIcon: {
    marginTop: -2,
  },
  gridTitle: {
    color: '#0F172A',
    fontSize: RF(14),
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  titleLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
    marginLeft: 6,
  },
  packsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
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
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  packCardPopular: {
    borderColor: '#EC4899',
  },
  packCardBestValue: {
    borderColor: '#F59E0B',
  },
  popularTag: {
    position: 'absolute',
    top: -8,
    backgroundColor: '#EC4899',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 2,
  },
  pinkBadge: {
    backgroundColor: '#ec4899',
  },
  goldBadge: {
    backgroundColor: '#ca8a04',
  },
  popularTagText: {
    color: '#fff',
    fontSize: RF(7.5),
    fontWeight: '900',
  },
  packTop: {
    alignItems: 'center',
    marginBottom: 4,
  },
  packLabelText: {
    color: '#0F172A',
    fontSize: RF(12.5),
    fontWeight: '800',
    marginTop: 2,
  },
  packLabelSub: {
    color: '#94A3B8',
    fontSize: RF(8.5),
    fontWeight: '600',
  },
  packArrow: {
    marginVertical: 4,
  },
  packBottom: {
    alignItems: 'center',
    marginBottom: 8,
  },
  packDiamondsText: {
    color: '#0F172A',
    fontSize: RF(13),
    fontWeight: '800',
  },
  packDiamondsSub: {
    color: '#64748B',
    fontSize: RF(8.5),
    fontWeight: '600',
  },
  packButtonGradient: {
    width: '100%',
    borderRadius: 10,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 28,
  },
  packButtonText: {
    color: '#FFFFFF',
    fontSize: RF(10.5),
    fontWeight: 'bold',
  },
  packButtonBordered: {
    width: '100%',
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 10,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  packButtonTextBordered: {
    color: '#6C5CE7',
    fontSize: RF(10.5),
    fontWeight: 'bold',
  },
  footerSecure: {
    marginTop: 24,
    marginBottom: 10,
    alignItems: 'center',
  },
  secureBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  secureBadgeText: {
    color: '#64748B',
    fontSize: RF(9.5),
    fontWeight: '600',
  },
  footerSecureDesc: {
    color: '#94A3B8',
    fontSize: RF(9.5),
    textAlign: 'center',
    marginTop: 4,
  },
  coinsInfoCards: {
    marginTop: 16,
    gap: 10,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 12,
    elevation: 2,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  infoCardIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoCardTexts: {
    flex: 1,
  },
  infoCardTitle: {
    color: '#0F172A',
    fontSize: RF(12),
    fontWeight: '800',
  },
  infoCardDesc: {
    color: '#64748B',
    fontSize: RF(10),
    marginTop: 2,
  },
  bottomLockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  bottomLockText: {
    color: '#94A3B8',
    fontSize: RF(10),
  },
});
