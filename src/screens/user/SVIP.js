import React, { useState, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  AppState,
  Image,
  Modal,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import SvipPrivilegeModal from '../../components/membership/SvipPrivilegeModal';
import SvipHelpModal from '../../components/membership/SvipHelpModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { presentVipTier } from '../../utils/vipPlanPresentation';
import SvgaView from '../../components/SvgaView';
import AvatarWithFrame from '../../components/AvatarWithFrame';
import { AuthContext } from '../../context/AuthProvider';
import { AlertService } from '../../utils/AlertService';
import { apiUtil } from '../../utils/apiUtil';
import { formatCompactBalance } from '../../utils/numberUtil';

const { width } = Dimensions.get('window');

export default function SVIPScreen() {
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 16);
  const navigation = useNavigation();
  const { user, fetchUserProfile } = useContext(AuthContext);

  const [activeTierId, setActiveTierId] = useState(null);
  const [tiers, setTiers] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [planError, setPlanError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useFocusEffect(useCallback(() => {
    let active = true;
    let fetching = false;
    const fetchPlans = async () => {
      if (fetching || !active || AppState.currentState === 'background') return;
      fetching = true;
      try {
        const response = await apiUtil.get('/svip-plans', { suppressGlobalError: true, params: { refresh: reloadKey } });
        const plans = response?.data?.data?.plans;
        if (!Array.isArray(plans)) throw new Error('VIP plans could not be loaded.');
        if (active) {
          const next = plans.map(presentVipTier);
          setTiers(next);
          setActiveTierId(previous => next.some(tier => tier.id === previous) ? previous : next[0]?.id || null);
          setPlanError('');
        }
      } catch (error) {
        if (active) setPlanError('Could not refresh VIP plans. Pull down to retry.');
      } finally {
        fetching = false;
        if (active) { setLoadingPlans(false); setRefreshing(false); }
      }
    };
    void fetchPlans();
    const timer = setInterval(fetchPlans, 30000);
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') void fetchPlans(); });
    return () => { active = false; clearInterval(timer); subscription.remove(); };
  }, [reloadKey]));

  const refreshPlans = () => { setRefreshing(true); setReloadKey(previous => previous + 1); };
  const [selectedPrivilege, setSelectedPrivilege] = useState(null);
  const [selectedAssetPreview, setSelectedAssetPreview] = useState(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const currentTier = tiers.find(tier => tier.id === activeTierId) || tiers[0];
  const userCoins = Number(user?.coins ?? user?.diamonds ?? 0);
  const tierPrivileges = currentTier?.privileges || [];

  if (!currentTier) return (
    <View style={[styles.screen, { paddingTop: topSafeInset + 24, alignItems: 'center' }]}>
      <TouchableOpacity onPress={() => navigation.goBack()}><Text style={{ color: '#D4AF37', padding: 16 }}>Back</Text></TouchableOpacity>
      <Text style={styles.headerTitle}>VIP</Text>
      {loadingPlans ? <ActivityIndicator color="#D4AF37" /> : <>
        <Text style={{ color: '#CBD5E1', padding: 20 }}>{planError || 'No VIP plans are available yet.'}</Text>
        <TouchableOpacity onPress={refreshPlans}><Text style={{ color: '#D4AF37', padding: 16 }}>Retry</Text></TouchableOpacity>
      </>}
    </View>
  );

  const handlePurchase = async () => {
    if (userCoins < currentTier.price) {
      AlertService.show(
        'Insufficient Coins',
        `You need ${formatCompactBalance(currentTier.price)} Coins to activate ${currentTier.name}.`,
        'error'
      );
      navigation.navigate('Wallet');
      return;
    }

    setIsPurchasing(true);
    try {
      const res = await apiUtil.post('/svip-plans/purchase', {
        planIdOrSlug: currentTier.slug,
      });

      AlertService.show(
        'Royal Activation Successful! 👑',
        res?.data?.message || `Welcome to ${currentTier.name}! Nobility privileges are now active.`,
        'success'
      );

      if (fetchUserProfile) await fetchUserProfile();
    } catch (err) {
      AlertService.show(
        'Purchase Failed',
        err?.response?.data?.message || err?.message || 'Unable to complete transaction.',
        'error'
      );
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Dark Golden-Obsidian Luxury Background matching Screenshot 1 */}
      <LinearGradient
        colors={['#100A05', '#160E07', '#1D130A', '#0D0804']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Ambient Top Spotlight Cone */}
      <View style={styles.spotlightConeWrap} pointerEvents="none">
        <LinearGradient
          colors={['rgba(251, 191, 36, 0.28)', 'rgba(217, 119, 6, 0.08)', 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.spotlightCone}
        />
      </View>

      {/* Header matching Screenshot 1 */}
      <View style={[styles.header, { paddingTop: topSafeInset + 6 }]}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Icon name="chevron-back" size={26} color="#E2E8F0" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>VIP</Text>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => setShowHelpModal(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="help-circle-outline" size={24} color="#D4AF37" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.navigate('Setting')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="settings-outline" size={22} color="#D4AF37" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Horizontal Tabs: SVIP+ | SVIP1 | SVIP2 | SVIP3 | SVIP4 | SVIP5 */}
      <View style={styles.tierTabsContainer}>
        {tiers.map((tier) => {
          const isActive = tier.id === activeTierId;
          return (
            <TouchableOpacity
              key={tier.id}
              style={[styles.tierTab, isActive && styles.tierTabActive]}
              onPress={() => setActiveTierId(tier.id)}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 6, right: 6 }}
            >
              <Text style={[styles.tierTabText, isActive && styles.tierTabTextActive]}>
                {tier.tabLabel}
              </Text>
              {isActive && <View style={styles.tierActiveDot} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Scrollable Content */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding + 90 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshPlans} tintColor="#D4AF37" />}
      >
        {planError ? <Text style={{ color: '#FCA5A5', textAlign: 'center', padding: 10 }}>{planError}</Text> : null}
        <View style={styles.mascotEmblemContainer}>
          <View style={styles.heroBadgeBox}>
            {currentTier.badge?.animationUrl ? (
              <SvgaView
                source={currentTier.badge.animationUrl}
                fallbackImage={currentTier.badge.imageUrl}
                style={styles.heroBadgeSvga}
                loops={0}
              />
            ) : currentTier.badge?.imageUrl ? (
              <Image
                source={{ uri: currentTier.badge.imageUrl }}
                style={styles.heroBadgeImage}
                resizeMode="contain"
              />
            ) : (
              <Icon name="ribbon-outline" size={120} color="#FBBF24" />
            )}
          </View>
          <Text style={styles.ribbonText}>{currentTier.ribbonLabel}</Text>
        </View>

        {/* Dynamic Preview Cards Row for current tier */}
        <View style={styles.previewCardsOuterWrap}>
          <ScrollView
            horizontal
            nestedScrollEnabled={true}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.previewCardsScrollContent}
            style={styles.previewCardsScrollView}
          >
            {currentTier.entry && (
              <TouchableOpacity
                style={styles.previewCard}
                activeOpacity={0.85}
                onPress={() => setSelectedAssetPreview({
                  title: `${currentTier.name} VIP Entry`,
                  animationUrl: currentTier.entry.animationUrl,
                  imageUrl: currentTier.entry.imageUrl || currentTier.entry.previewUrl,
                })}
              >
                <View style={styles.previewCardInner}>
                  {currentTier.entry.imageUrl || currentTier.entry.previewUrl ? (
                    <Image
                      source={{ uri: currentTier.entry.imageUrl || currentTier.entry.previewUrl }}
                      style={{ width: 110, height: 95 }}
                      resizeMode="contain"
                    />
                  ) : (
                    <Icon name="car-sport" size={48} color="#FBBF24" />
                  )}
                  <View style={styles.previewPlayPill}>
                    <Icon name="play" size={10} color="#FFFFFF" style={{ marginRight: 3 }} />
                    <Text style={styles.previewPlayText}>Preview</Text>
                  </View>
                  <Text style={styles.previewCardLabel}>VIP Entry</Text>
                </View>
              </TouchableOpacity>
            )}
            {currentTier.frame && (
              <TouchableOpacity
                style={styles.previewCard}
                activeOpacity={0.85}
                onPress={() => setSelectedAssetPreview({
                  title: `${currentTier.name} VIP Frame`,
                  animationUrl: currentTier.frame.animationUrl,
                  imageUrl: currentTier.frame.imageUrl || currentTier.frame.previewUrl,
                })}
              >
                <View style={styles.previewCardInner}>
                  <AvatarWithFrame user={user} frame={currentTier.frame} size={80} frameScale={1.85} showOnlineDot={false} />
                  <View style={styles.previewPlayPill}>
                    <Icon name="play" size={10} color="#FFFFFF" style={{ marginRight: 3 }} />
                    <Text style={styles.previewPlayText}>Preview</Text>
                  </View>
                  <Text style={styles.previewCardLabel}>VIP Frame</Text>
                </View>
              </TouchableOpacity>
            )}
            {currentTier.badge && (
              <TouchableOpacity
                style={styles.previewCard}
                activeOpacity={0.85}
                onPress={() => setSelectedAssetPreview({
                  title: `${currentTier.name} Badge`,
                  animationUrl: currentTier.badge.animationUrl,
                  imageUrl: currentTier.badge.imageUrl,
                })}
              >
                <View style={styles.previewCardInner}>
                  {currentTier.badge.imageUrl ? (
                    <Image
                      source={{ uri: currentTier.badge.imageUrl }}
                      style={{ width: 80, height: 80 }}
                      resizeMode="contain"
                    />
                  ) : (
                    <Icon name="ribbon-outline" size={44} color="#FBBF24" />
                  )}
                  <View style={styles.previewPlayPill}>
                    <Icon name="play" size={10} color="#FFFFFF" style={{ marginRight: 3 }} />
                    <Text style={styles.previewPlayText}>Preview</Text>
                  </View>
                  <Text style={styles.previewCardLabel}>VIP Badge</Text>
                </View>
              </TouchableOpacity>
            )}
            {currentTier.chatBubble && (
              <TouchableOpacity
                style={styles.previewCard}
                activeOpacity={0.85}
                onPress={() => setSelectedAssetPreview({
                  title: `${currentTier.name} Bubble`,
                  animationUrl: currentTier.chatBubble.animationUrl,
                  imageUrl: currentTier.chatBubble.imageUrl,
                })}
              >
                <View style={styles.previewCardInner}>
                  {currentTier.chatBubble.imageUrl ? (
                    <Image
                      source={{ uri: currentTier.chatBubble.imageUrl }}
                      style={{ width: 95, height: 75 }}
                      resizeMode="contain"
                    />
                  ) : (
                    <Icon name="chatbubble-ellipses" size={44} color="#FBBF24" />
                  )}
                  <View style={styles.previewPlayPill}>
                    <Icon name="play" size={10} color="#FFFFFF" style={{ marginRight: 3 }} />
                    <Text style={styles.previewPlayText}>Preview</Text>
                  </View>
                  <Text style={styles.previewCardLabel}>Chat Bubble</Text>
                </View>
              </TouchableOpacity>
            )}
            {currentTier.tag && (
              <TouchableOpacity
                style={styles.previewCard}
                activeOpacity={0.85}
                onPress={() => setSelectedAssetPreview({
                  title: `${currentTier.name} Tag`,
                  animationUrl: currentTier.tag.animationUrl,
                  imageUrl: currentTier.tag.imageUrl,
                })}
              >
                <View style={styles.previewCardInner}>
                  {currentTier.tag.imageUrl ? (
                    <Image
                      source={{ uri: currentTier.tag.imageUrl }}
                      style={{ width: 85, height: 60 }}
                      resizeMode="contain"
                    />
                  ) : (
                    <Icon name="pricetag" size={44} color="#FBBF24" />
                  )}
                  <View style={styles.previewPlayPill}>
                    <Icon name="play" size={10} color="#FFFFFF" style={{ marginRight: 3 }} />
                    <Text style={styles.previewPlayText}>Preview</Text>
                  </View>
                  <Text style={styles.previewCardLabel}>VIP Tag</Text>
                </View>
              </TouchableOpacity>
            )}
            {currentTier.micWave && (
              <TouchableOpacity
                style={styles.previewCard}
                activeOpacity={0.85}
                onPress={() => setSelectedAssetPreview({
                  title: `${currentTier.name} Mic Wave`,
                  animationUrl: currentTier.micWave.animationUrl,
                  imageUrl: currentTier.micWave.imageUrl,
                })}
              >
                <View style={styles.previewCardInner}>
                  {currentTier.micWave.imageUrl ? (
                    <Image
                      source={{ uri: currentTier.micWave.imageUrl }}
                      style={{ width: 85, height: 85 }}
                      resizeMode="contain"
                    />
                  ) : (
                    <Icon name="mic" size={44} color="#FBBF24" />
                  )}
                  <View style={styles.previewPlayPill}>
                    <Icon name="play" size={10} color="#FFFFFF" style={{ marginRight: 3 }} />
                    <Text style={styles.previewPlayText}>Preview</Text>
                  </View>
                  <Text style={styles.previewCardLabel}>Mic Wave</Text>
                </View>
              </TouchableOpacity>
            )}
            {currentTier.profileCard && (
              <TouchableOpacity
                style={styles.previewCard}
                activeOpacity={0.85}
                onPress={() => setSelectedAssetPreview({
                  title: `${currentTier.name} Profile Card`,
                  animationUrl: currentTier.profileCard.animationUrl,
                  imageUrl: currentTier.profileCard.imageUrl,
                })}
              >
                <View style={styles.previewCardInner}>
                  {currentTier.profileCard.imageUrl ? (
                    <Image
                      source={{ uri: currentTier.profileCard.imageUrl }}
                      style={{ width: 95, height: 85 }}
                      resizeMode="contain"
                    />
                  ) : (
                    <Icon name="person" size={44} color="#FBBF24" />
                  )}
                  <View style={styles.previewPlayPill}>
                    <Icon name="play" size={10} color="#FFFFFF" style={{ marginRight: 3 }} />
                    <Text style={styles.previewPlayText}>Preview</Text>
                  </View>
                  <Text style={styles.previewCardLabel}>Profile Card</Text>
                </View>
              </TouchableOpacity>
            )}
            {currentTier.giftBroadcast && (
              <TouchableOpacity
                style={styles.previewCard}
                activeOpacity={0.85}
                onPress={() => setSelectedAssetPreview({
                  title: `${currentTier.name} Broadcast`,
                  animationUrl: currentTier.giftBroadcast.animationUrl,
                  imageUrl: currentTier.giftBroadcast.imageUrl,
                })}
              >
                <View style={styles.previewCardInner}>
                  {currentTier.giftBroadcast.imageUrl ? (
                    <Image
                      source={{ uri: currentTier.giftBroadcast.imageUrl }}
                      style={{ width: 95, height: 80 }}
                      resizeMode="contain"
                    />
                  ) : (
                    <Icon name="gift" size={44} color="#FBBF24" />
                  )}
                  <View style={styles.previewPlayPill}>
                    <Icon name="play" size={10} color="#FFFFFF" style={{ marginRight: 3 }} />
                    <Text style={styles.previewPlayText}>Preview</Text>
                  </View>
                  <Text style={styles.previewCardLabel}>Gift Broadcast</Text>
                </View>
              </TouchableOpacity>
            )}
            {currentTier.vipId && (
              <TouchableOpacity
                style={styles.previewCard}
                activeOpacity={0.85}
                onPress={() => setSelectedAssetPreview({
                  title: `${currentTier.name} VIP ID`,
                  animationUrl: currentTier.vipId.animationUrl,
                  imageUrl: currentTier.vipId.imageUrl,
                })}
              >
                <View style={styles.previewCardInner}>
                  {currentTier.vipId.imageUrl ? (
                    <Image
                      source={{ uri: currentTier.vipId.imageUrl }}
                      style={{ width: 85, height: 70 }}
                      resizeMode="contain"
                    />
                  ) : (
                    <Icon name="finger-print" size={44} color="#FBBF24" />
                  )}
                  <View style={styles.previewPlayPill}>
                    <Icon name="play" size={10} color="#FFFFFF" style={{ marginRight: 3 }} />
                    <Text style={styles.previewPlayText}>Preview</Text>
                  </View>
                  <Text style={styles.previewCardLabel}>VIP ID</Text>
                </View>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* Section Title: "5 Exclusive Privileges" matching Screenshot 1 */}
        <View style={styles.privilegesHeaderWrap}>
          <View style={styles.headerLine} />
          <Text style={styles.privilegesHeaderTitle}>
            {tierPrivileges.length} Exclusive Privileges
          </Text>
          <View style={styles.headerLine} />
        </View>

        {/* 3-Column Golden Hexagonal Grid matching Screenshot 1 */}
        <View style={styles.hexGrid}>
          {tierPrivileges.map((p, idx) => (
            <TouchableOpacity
              key={p.key || idx}
              style={styles.hexItemWrap}
              activeOpacity={0.8}
              onPress={() => setSelectedPrivilege(p)}
            >
              {/* Golden Hexagon Container */}
              <View style={styles.hexagonBorder}>
                <View style={styles.hexagonInner}>
                  <Icon name={p.icon} size={22} color="#FBBF24" />
                </View>
              </View>

              {/* Privilege Title */}
              <Text style={styles.hexLabel} numberOfLines={2}>
                {p.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Floating Sticky Bottom Activate Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(bottomPadding, 14) }]}>
        <View style={styles.priceCol}>
          <Text style={styles.priceSub}>Price</Text>
          <Text style={styles.priceMain}>
            {formatCompactBalance(currentTier.price)} Coins
            <Text style={styles.priceDuration}> / {currentTier.durationDays || 30}d</Text>
          </Text>
        </View>

        <TouchableOpacity
          style={styles.activateBtn}
          onPress={handlePurchase}
          disabled={isPurchasing}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={['#FBBF24', '#F59E0B', '#D97706']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.activateGradient}
          >
            {isPurchasing ? (
              <ActivityIndicator size="small" color="#0F172A" />
            ) : (
              <Text style={styles.activateBtnText}>Activate {currentTier.tabLabel}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Privilege Modal */}
      {selectedPrivilege && (
        <SvipPrivilegeModal
          visible={!!selectedPrivilege}
          privilege={selectedPrivilege}
          styles={styles}
          onClose={() => setSelectedPrivilege(null)}
        />
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <SvipHelpModal
          visible={showHelpModal}
          styles={styles}
          onClose={() => setShowHelpModal(false)}
        />
      )}

      {/* SVGA Full Preview Modal */}
      {selectedAssetPreview && (
        <Modal
          visible={!!selectedAssetPreview}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedAssetPreview(null)}
        >
          <View style={styles.assetPreviewOverlay}>
            <View style={styles.assetPreviewCard}>
              <View style={styles.assetPreviewHeader}>
                <Text style={styles.assetPreviewTitle}>{selectedAssetPreview.title}</Text>
                <TouchableOpacity onPress={() => setSelectedAssetPreview(null)} style={styles.assetPreviewCloseBtn}>
                  <Icon name="close" size={20} color="#E2E8F0" />
                </TouchableOpacity>
              </View>
              <View style={styles.assetPreviewContent}>
                <SvgaView
                  source={selectedAssetPreview.animationUrl}
                  fallbackImage={selectedAssetPreview.imageUrl}
                  style={{ width: 260, height: 240 }}
                  loops={0}
                />
              </View>
              <TouchableOpacity style={styles.assetPreviewDoneBtn} onPress={() => setSelectedAssetPreview(null)}>
                <Text style={styles.assetPreviewDoneText}>Close Preview</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0D0804',
  },
  spotlightConeWrap: {
    position: 'absolute',
    top: 0,
    left: width * 0.15,
    width: width * 0.7,
    height: 280,
    alignItems: 'center',
    zIndex: 1,
  },
  spotlightCone: {
    width: '100%',
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    zIndex: 10,
  },
  headerBtn: {
    padding: 4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tierTabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(251, 191, 36, 0.15)',
    zIndex: 20,
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  tierTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierTabActive: {},
  tierTabText: {
    color: '#94A3B8',
    fontSize: 12.5,
    fontWeight: '700',
  },
  tierTabTextActive: {
    color: '#FDE047',
    fontWeight: '900',
    fontSize: 13,
  },
  tierActiveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FDE047',
    marginTop: 3,
  },
  scrollContent: {
    alignItems: 'center',
    paddingTop: 16,
  },
  mascotEmblemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
    position: 'relative',
    zIndex: 5,
  },
  heroBadgeBox: {
    width: 170,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 10,
  },
  heroBadgeSvga: {
    width: 170,
    height: 160,
  },
  heroBadgeImage: {
    width: 165,
    height: 140,
  },
  mascotRingBorder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    padding: 5,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  mascotRingInner: {
    flex: 1,
    borderRadius: 65,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
  },
  mascotImage: {
    width: '100%',
    height: '100%',
  },
  ribbonBadge: {
    position: 'absolute',
    bottom: -10,
    paddingHorizontal: 28,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.7,
    shadowRadius: 6,
    elevation: 6,
  },
  ribbonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  previewCardsOuterWrap: {
    width: '100%',
    marginTop: 14,
    marginBottom: 16,
  },
  previewCardsScrollView: {
    width: '100%',
  },
  previewCardsScrollContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 12,
  },
  previewCard: {
    width: 110,
    height: 108,
    borderRadius: 18,
    backgroundColor: 'rgba(30, 20, 10, 0.85)',
    borderWidth: 1.2,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCardInner: {
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
    width: '100%',
  },
  tagImageWrap: {
    width: '100%',
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  tagCustomImage: {
    width: 96,
    height: 34,
  },
  tagPillPreview: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 6,
  },
  tagPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  bubbleImageWrap: {
    width: '100%',
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  bubbleCustomImage: {
    width: 96,
    height: 42,
  },
  bubblePreview: {
    width: '90%',
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#60A5FA',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginTop: 6,
    position: 'relative',
  },
  bubbleCornerGold: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 6,
    height: 6,
    backgroundColor: '#FDE047',
    borderRadius: 2,
  },
  bubblePreviewText: {
    color: '#E2E8F0',
    fontSize: 10,
    fontWeight: '700',
  },
  framePreviewWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    position: 'relative',
  },
  frameOuterRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2.5,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  frameInnerHole: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
  },
  frameAvatarImg: {
    width: '100%',
    height: '100%',
  },
  frameCrownIcon: {
    position: 'absolute',
    top: -6,
  },
  roomCardPreview: {
    width: '94%',
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE047',
    paddingHorizontal: 6,
    paddingVertical: 4,
    justifyContent: 'space-between',
    marginTop: 4,
  },
  roomCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roomCardIdText: {
    color: '#FDE047',
    fontSize: 9,
    fontWeight: '800',
  },
  roomCardWaveRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  roomCardWaveBar: {
    width: 3,
    backgroundColor: '#38BDF8',
    borderRadius: 1.5,
  },
  micThemeWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    position: 'relative',
  },
  micCircleGlow: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 5,
  },
  micWaveRingOuter: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.4)',
  },
  badgeOptionWrap: {
    width: 50,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  badgeOptionImage: {
    width: 48,
    height: 46,
  },
  previewCardLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  privilegesHeaderWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '90%',
    marginVertical: 14,
    gap: 10,
  },
  headerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(251, 191, 36, 0.3)',
  },
  privilegesHeaderTitle: {
    color: '#FDE047',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  hexGrid: {
    width: '92%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  hexItemWrap: {
    width: (width * 0.92 - 24) / 3,
    alignItems: 'center',
    marginVertical: 12,
  },
  hexagonBorder: {
    width: 62,
    height: 62,
    borderRadius: 18,
    backgroundColor: '#1E140A',
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  hexagonInner: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#140D06',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hexLabel: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 2,
    lineHeight: 14,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: 'rgba(18, 11, 6, 0.96)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(251, 191, 36, 0.25)',
  },
  priceCol: {
    justifyContent: 'center',
  },
  priceSub: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  priceMain: {
    color: '#FDE047',
    fontSize: 16,
    fontWeight: '900',
  },
  priceDuration: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  activateBtn: {
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 5,
  },
  activateGradient: {
    paddingHorizontal: 26,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activateBtnText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  previewPlayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 4,
    marginBottom: 2,
  },
  previewPlayText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
  },
  assetPreviewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  assetPreviewCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#181109',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(251, 191, 36, 0.4)',
    padding: 18,
    alignItems: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  assetPreviewHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  assetPreviewTitle: {
    color: '#FDE047',
    fontSize: 15,
    fontWeight: '800',
  },
  assetPreviewCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  assetPreviewContent: {
    width: '100%',
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 16,
  },
  assetPreviewDoneBtn: {
    width: '100%',
    backgroundColor: '#F59E0B',
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  assetPreviewDoneText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
  },
});
