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

  const [activeTab, setActiveTab] = useState('Diamonds'); // 'Diamonds' or 'Coins'
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
      const res = await apiUtil.post('/payment/verify-google', {
        productId,
        purchaseToken,
        packageName: 'com.umangchatlive',
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
      AlertService.show('Insufficient Coins', 'You do not have enough coins to exchange for this package.', 'error');
      return;
    }

    AlertService.show(
      'Confirm Exchange',
      `Are you sure you want to exchange ${pack.coins.toLocaleString()} Coins for ${pack.diamonds.toLocaleString()} Diamonds?`,
      'info',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Exchange',
          onPress: async () => {
            setLoading(true);
            try {
              const res = await exchangeCoins(pack.coins);

              if (res.data.success) {
                AlertService.show(
                  'Exchange Successful 🎉',
                  `Exchanged ${pack.coins.toLocaleString()} Coins for ${pack.diamonds.toLocaleString()} Diamonds!`,
                  'success'
                );
                fetchUserProfile();
              } else {
                AlertService.show('Exchange Failed', res.data.message || 'Exchange failed', 'error');
              }
            } catch (err) {
              console.log('Exchange Error:', err);
              const errMsg = err.response?.data?.message || err.message || 'Failed to complete exchange';
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
              <Icon name={icon} size={16} color="rgba(255,255,255,0.5)" style={{ marginRight: 4 }} />
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
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" animated />
      <LinearGradient
        colors={['#060212', '#0e0423', '#030109']}
        style={StyleSheet.absoluteFillObject}
      />
      {/* Decorative stars */}
      <View style={styles.starOverlay1} />
      <View style={styles.starOverlay2} />

      {/* Header bar */}
      <View style={[styles.header, { paddingTop: topSafeInset + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wallet</Text>
        <TouchableOpacity
          style={[styles.historyBtnHeader, activeTab === 'Coins' && styles.historyBtnCoin]}
          onPress={() =>
            navigation.navigate(activeTab === 'Coins' ? 'ExchangeHistory' : 'RechargeHistreoy')
          }
          activeOpacity={0.8}
        >
          <Icon name="history" size={16} color={activeTab === 'Coins' ? '#FFD700' : '#d946ef'} style={{ marginRight: 4 }} />
          <Text style={[styles.historyTextHeader, activeTab === 'Coins' && { color: '#FFD700' }]}>
            {activeTab === 'Coins' ? 'Exchange History' : 'History'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Custom Tabs */}
      <View style={styles.tabBar}>
        {renderTabButton('Diamonds', 'Diamonds', 'diamond', '#03dcfe')}
        {renderTabButton('Coins', 'Coins', 'stars', '#FFD700')}
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
            {/* Coins Balance Card */}
            <View style={styles.balanceCardContainer}>
              <LinearGradient
                colors={['#1c0c3a', '#100524']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.balanceCard}
              >
                <View style={styles.balanceHeaderRow}>
                  <View style={styles.balanceLabelCol}>
                    <Text style={styles.balanceLabel}>My Coins</Text>
                    <View style={styles.balanceCountRow}>
                      <Text style={styles.balanceCount}>{(user?.coins || 0).toLocaleString()}</Text>
                      <Icon name="stars" size={24} color="#FFD700" style={styles.balanceIcon} />
                    </View>
                    <Text style={styles.balanceValue}>≈ ₹{((user?.coins || 0) / 20).toFixed(2)}</Text>
                  </View>

                  {/* Gorgeous Pedestal */}
                  <View style={styles.pedestalContainer}>
                    <View style={styles.pedestalRing3}>
                      <View style={styles.pedestalRing2}>
                        <View style={styles.pedestalRing1}>
                          <Image source={require('../../assets/coin.webp')} style={styles.pedestalCoinImg} />
                        </View>
                      </View>
                    </View>
                  </View>
                </View>

                <Text style={styles.balanceSubtext}>
                  Use coins to exchange for diamonds and enjoy premium features.
                </Text>

                <TouchableOpacity
                  onPress={() => navigation.navigate('CoinHistory')}
                  style={styles.historyBtn}
                  activeOpacity={0.7}
                >
                  <Icon name="history" size={14} color="#FFD700" style={styles.iconMarginRight} />
                  <Text style={styles.coinHistoryBtnText}>History</Text>
                  <Icon name="chevron-right" size={12} color="#FFD700" />
                </TouchableOpacity>
              </LinearGradient>
            </View>

            {/* Choose coin pack section */}
            <View style={styles.gridTitleContainer}>
              <Icon name="stars" size={16} color="#FFD700" style={styles.gridTitleIcon} />
              <Text style={styles.gridTitle}>Choose a Coin Package</Text>
              <View style={styles.titleLine} />
            </View>

            <View style={styles.packsGrid}>
              {CoinPacks.map((pack) => {
                const isPopular = pack.badge === 'POPULAR';
                const isBestValue = pack.badge === 'BEST VALUE';

                let btnColors = null;
                if (isPopular) btnColors = ['#ec4899', '#be185d'];
                if (isBestValue) btnColors = ['#ca8a04', '#a16207'];

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
                      <Icon name="stars" size={22} color="#FFD700" />
                      <Text style={styles.packLabelText}>{pack.coins.toLocaleString()}</Text>
                      <Text style={styles.packLabelSub}>Coins</Text>
                    </View>

                    <Icon name="keyboard-arrow-down" size={12} color="rgba(255,255,255,0.4)" style={styles.packArrow} />

                    <View style={styles.packBottom}>
                      <Image source={diamondIcon} style={{ width: 14, height: 14, marginRight: 4 }} resizeMode="contain" />
                      <Text style={styles.packDiamondsText}>{pack.diamonds.toLocaleString()}</Text>
                      <Text style={styles.packDiamondsSub}>Diamonds</Text>
                    </View>

                    {btnColors ? (
                      <LinearGradient colors={btnColors} style={styles.packButtonGradient}>
                        <Text style={styles.packButtonText}>Exchange</Text>
                      </LinearGradient>
                    ) : (
                      <View style={styles.packButtonBordered}>
                        <Text style={styles.packButtonTextBordered}>Exchange</Text>
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
    color: '#d946ef',
    fontSize: RF(11.5),
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    width: WP(92),
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
    padding: 4,
    alignSelf: 'center',
    marginVertical: HP(1.5),
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
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
    fontSize: RF(12),
    fontWeight: 'bold',
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
    borderColor: 'rgba(255, 255, 255, 0.08)',
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
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: RF(12),
    fontWeight: '600',
  },
  balanceCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    gap: 6,
  },
  balanceCount: {
    color: '#fff',
    fontSize: RF(30),
    fontWeight: 'bold',
  },
  balanceIcon: {
    marginTop: 2,
  },
  balanceValue: {
    color: '#d946ef',
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
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: RF(10.5),
    lineHeight: 16,
    marginBottom: 14,
  },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  historyBtnText: {
    color: '#03dcfe',
    fontSize: RF(11),
    fontWeight: 'bold',
    marginRight: 2,
  },
  coinHistoryBtnText: {
    color: '#FFD700',
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
    color: '#fff',
    fontSize: RF(13.5),
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  titleLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(124, 77, 255, 0.12)',
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
    position: 'relative',
    marginVertical: 6,
  },
  packCardPopular: {
    borderColor: 'rgba(236, 72, 153, 0.4)',
  },
  packCardBestValue: {
    borderColor: 'rgba(234, 179, 8, 0.4)',
  },
  popularTag: {
    position: 'absolute',
    top: -8,
    backgroundColor: '#d946ef',
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
    color: '#fff',
    fontSize: RF(12.5),
    fontWeight: 'bold',
    marginTop: 2,
  },
  packLabelSub: {
    color: 'rgba(255, 255, 255, 0.4)',
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
    color: '#fff',
    fontSize: RF(12.5),
    fontWeight: 'bold',
  },
  packDiamondsSub: {
    color: 'rgba(255, 255, 255, 0.4)',
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
    color: '#fff',
    fontSize: RF(10.5),
    fontWeight: 'bold',
  },
  packButtonBordered: {
    width: '100%',
    backgroundColor: 'rgba(124, 77, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(124, 77, 255, 0.3)',
    borderRadius: 10,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  packButtonTextBordered: {
    color: '#d946ef',
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
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  secureBadgeText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: RF(9.5),
    fontWeight: '600',
  },
  footerSecureDesc: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: RF(10),
    textAlign: 'center',
  },
  coinsInfoCards: {
    marginTop: 16,
    gap: 10,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
    padding: 12,
  },
  infoCardIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(217, 70, 239, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoCardTexts: {
    flex: 1,
  },
  infoCardTitle: {
    color: '#fff',
    fontSize: RF(12),
    fontWeight: 'bold',
  },
  infoCardDesc: {
    color: 'rgba(255, 255, 255, 0.5)',
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
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: RF(10),
  },
});
