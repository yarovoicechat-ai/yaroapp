import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Modal,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthProvider';
import { getUserAvatar } from '../../utils/avatarUtil';
import { AlertService } from '../../utils/AlertService';
import { apiUtil } from '../../utils/apiUtil';
import { formatCompactBalance } from '../../utils/numberUtil';

const { width } = Dimensions.get('window');

// Default fallback tiers if offline
const FALLBACK_TIERS = [
  {
    id: 'vip-plus',
    slug: 'vip-plus',
    level: 0,
    name: 'VIP+',
    title: 'VIP+ Lynx',
    price: 49000,
    originalPrice: 75000,
    discountPercent: 35,
    discount: '35% OFF',
    durationDays: 30,
    rechargeThreshold: 50000,
    svipTagConfig: { text: 'VIP+', bgGradient: ['#3B82F6', '#1D4ED8'], enabled: true },
    svipBubbleConfig: { bubbleName: 'VIP+ Frost Blue', bgGradient: ['#1E3A8A', '#1E40AF'], textColor: '#FFF', borderColor: '#60A5FA', enabled: true },
    privileges: [
      { key: 'rank_the_top', title: 'Rank the Top', description: 'Pin your profile to the top of room visitor lists.', icon: 'trophy', value: 'Top #1 Priority' },
      { key: 'colorful_nickname', title: 'Colorful Nickname', description: 'Dynamic gradient and animated colors for your nickname.', icon: 'palette', value: 'Gradient' },
      { key: 'view_more_visitors', title: 'View More Visitors', description: 'Unlock full visitor history without limits.', icon: 'eye', value: 'Unlimited' },
      { key: 'special_room_entry', title: 'Special Room Entry', description: 'Luxury animated sports car entrance notice.', icon: 'car-sport', value: '3D Car' },
      { key: 'unlimited_message', title: 'Unlimited Message', description: 'Zero cooldown in voice party rooms.', icon: 'chatbubbles', value: 'Zero Cooldown' },
    ],
  },
  {
    id: 'svip-1-knight',
    slug: 'svip-1-knight',
    level: 1,
    name: 'SVIP 1 Knight',
    title: 'SVIP 1 Knight',
    price: 99000,
    originalPrice: 150000,
    discountPercent: 34,
    discount: '34% OFF',
    durationDays: 30,
    rechargeThreshold: 100000,
    svipTagConfig: { text: 'SVIP 1', bgGradient: ['#F59E0B', '#D97706'], enabled: true },
    svipBubbleConfig: { bubbleName: 'Knight Amber Glass', bgGradient: ['#3A1F04', '#78350F'], textColor: '#FFF', borderColor: '#F59E0B', enabled: true },
    privileges: [
      { key: 'rank_the_top', title: 'Rank the Top', description: 'Pin your profile to the top of room visitor lists.', icon: 'trophy', value: 'Top #1 Priority' },
      { key: 'colorful_nickname', title: 'Colorful Nickname', description: 'Dynamic gradient and animated colors for your nickname.', icon: 'palette', value: 'Gradient' },
      { key: 'view_more_visitors', title: 'View More Visitors', description: 'Unlock full visitor history without limits.', icon: 'eye', value: 'Unlimited' },
      { key: 'special_room_entry', title: 'Special Room Entry', description: 'Luxury animated sports car entrance notice.', icon: 'car-sport', value: '3D Car' },
      { key: 'unlimited_message', title: 'Unlimited Message', description: 'Zero cooldown in voice party rooms.', icon: 'chatbubbles', value: 'Zero Cooldown' },
      { key: 'unlock_more_room_mic', title: 'Unlock More Room Mic', description: 'Expand owned rooms to 25 mic seats.', icon: 'mic', value: '25 Mic Seats' },
      { key: 'send_pictures_private_chat', title: 'Send Pictures', description: 'Send high-resolution photos in 1-on-1 chats.', icon: 'images', value: 'HD Photos' },
      { key: 'modify_profile_gender', title: 'Modify Profile Gender', description: 'Flexible gender editing.', icon: 'transgender', value: 'Flexible' },
    ],
  },
  {
    id: 'svip-2-count',
    slug: 'svip-2-count',
    level: 2,
    name: 'SVIP 2 Count',
    title: 'SVIP 2 Count',
    price: 180000,
    originalPrice: 270000,
    discountPercent: 33,
    discount: '33% OFF',
    durationDays: 30,
    rechargeThreshold: 250000,
    svipTagConfig: { text: 'SVIP 2', bgGradient: ['#A855F7', '#7C3AED'], enabled: true },
    svipBubbleConfig: { bubbleName: 'Count Amethyst', bgGradient: ['#3B0764', '#581C87'], textColor: '#FFF', borderColor: '#C084FC', enabled: true },
    privileges: [
      { key: 'rank_the_top', title: 'Rank the Top', description: 'Pin your profile to the top of room visitor lists.', icon: 'trophy', value: 'Top #1 Priority' },
      { key: 'colorful_nickname', title: 'Colorful Nickname', description: 'Dynamic gradient and animated colors for your nickname.', icon: 'palette', value: 'Gradient' },
      { key: 'view_more_visitors', title: 'View More Visitors', description: 'Unlock full visitor history without limits.', icon: 'eye', value: 'Unlimited' },
      { key: 'special_room_entry', title: 'Special Room Entry', description: 'Luxury animated sports car entrance notice.', icon: 'car-sport', value: '3D Car' },
      { key: 'hide_last_online', title: 'Hide Last Online', description: 'Keep last-active timestamp private.', icon: 'time', value: 'Stealth' },
      { key: 'profile_vehicle', title: 'Profile Vehicle', description: 'Equip animated luxury vehicle on profile card.', icon: 'airplane', value: 'Luxury Ride' },
      { key: 'anti_tracking', title: 'Anti-Tracking', description: 'Prevent tracking which room you are visiting.', icon: 'shield-checkmark', value: 'Ghost' },
      { key: 'send_pictures_chat_room', title: 'Send Pictures in Room', description: 'Post media photos into room feeds.', icon: 'camera', value: 'Room Feeds' },
    ],
  },
  {
    id: 'svip-3-duke',
    slug: 'svip-3-duke',
    level: 3,
    name: 'SVIP 3 Duke',
    title: 'SVIP 3 Duke',
    price: 360000,
    originalPrice: 540000,
    discountPercent: 33,
    discount: '33% OFF',
    durationDays: 30,
    rechargeThreshold: 500000,
    svipTagConfig: { text: 'SVIP 3', bgGradient: ['#EC4899', '#DB2777'], enabled: true },
    svipBubbleConfig: { bubbleName: 'Duke Velvet Rose', bgGradient: ['#500724', '#831843'], textColor: '#FFF', borderColor: '#F472B6', enabled: true },
    privileges: [
      { key: 'rank_the_top', title: 'Rank the Top', description: 'Pin your profile to the top of room visitor lists.', icon: 'trophy', value: 'Top #1 Priority' },
      { key: 'colorful_nickname', title: 'Colorful Nickname', description: 'Dynamic gradient colors.', icon: 'palette', value: 'Gradient' },
      { key: 'anti_kick', title: 'Anti-Kick', description: 'Full immunity against kicks and evictions.', icon: 'shield', value: 'Full Immunity' },
      { key: 'gif_avatar', title: 'GIF Avatar', description: 'Upload dynamic GIF profile photos.', icon: 'film', value: 'Animated GIF' },
      { key: 'level_experience_speed', title: 'EXP Speed', description: 'Accelerated EXP boost multiplier.', icon: 'flash', value: '+50% EXP' },
      { key: 'svip_customized_gift', title: 'SVIP Gift', description: 'Exclusive 3D luxury gifts.', icon: 'gift', value: 'Exclusive' },
    ],
  },
  {
    id: 'svip-4-prince',
    slug: 'svip-4-prince',
    level: 4,
    name: 'SVIP 4 Prince',
    title: 'SVIP 4 Prince',
    price: 750000,
    originalPrice: 1125000,
    discountPercent: 33,
    discount: '33% OFF',
    durationDays: 30,
    rechargeThreshold: 1000000,
    svipTagConfig: { text: 'SVIP 4', bgGradient: ['#EF4444', '#DC2626'], enabled: true },
    svipBubbleConfig: { bubbleName: 'Prince Ruby Blaze', bgGradient: ['#450A0A', '#7F1D1D'], textColor: '#FFF', borderColor: '#F87171', enabled: true },
    privileges: [
      { key: 'rank_the_top', title: 'Rank the Top', description: 'Pin your profile to top.', icon: 'trophy', value: 'Top #1' },
      { key: 'anti_kick', title: 'Anti-Kick', description: 'Full immunity against kicks.', icon: 'shield', value: 'Full Immunity' },
      { key: 'upgrade_app_wide_notification', title: 'App-wide Notice', description: 'Broadcast arrival notice.', icon: 'megaphone', value: 'Global Banner' },
      { key: 'unique_3_digit_sid', title: 'Unique 3-digit SID', description: 'Equip rare 3-digit SID.', icon: 'key', value: '3-Digit SID' },
      { key: 'anti_ban_from_chatting', title: 'Anti-ban Chat', description: 'Chat muting immunity.', icon: 'volume-high', value: 'Chat Immunity' },
      { key: 'badge_svip_achievement', title: 'SVIP Achievement', description: 'Prestige winged insignia.', icon: 'medal', value: 'Prestige Medal' },
    ],
  },
  {
    id: 'svip-5-king',
    slug: 'svip-5-king',
    level: 5,
    name: 'SVIP 5 King',
    title: 'SVIP 5 King',
    price: 1500000,
    originalPrice: 2250000,
    discountPercent: 33,
    discount: '33% OFF',
    durationDays: 30,
    rechargeThreshold: 2000000,
    svipTagConfig: { text: 'SVIP 5', bgGradient: ['#FBBF24', '#D97706'], enabled: true },
    svipBubbleConfig: { bubbleName: 'Imperial King Gold', bgGradient: ['#422006', '#713F12'], textColor: '#FFF', borderColor: '#FBBF24', enabled: true },
    privileges: [
      { key: 'rank_the_top', title: 'Rank the Top', description: 'Permanent top contributor priority.', icon: 'trophy', value: 'Top #1' },
      { key: 'unique_3_digit_sid', title: '3-digit SID', description: 'Exclusive 3-digit vanity number.', icon: 'key', value: '3-Digit SID' },
      { key: 'anonymous_ranking', title: 'Anonymous Ranking', description: 'Mask username on public rankings.', icon: 'glasses', value: 'Incognito' },
      { key: 'customized_start_up_page', title: 'Custom Startup', description: 'Personalized noble greeting.', icon: 'sparkles', value: 'Noble Welcome' },
      { key: 'exclusive_customer_service', title: 'VIP Support', description: '24/7 dedicated relationship manager.', icon: 'headset', value: '24/7 Priority' },
    ],
  },
  {
    id: 'svip-9-king-of-kings',
    slug: 'svip-9-king-of-kings',
    level: 9,
    name: 'SVIP 9 King of Kings',
    title: 'SVIP 9 King of Kings',
    price: 5000000,
    originalPrice: 8000000,
    discountPercent: 37,
    discount: '37% OFF',
    durationDays: 30,
    rechargeThreshold: 10000000,
    svipTagConfig: { text: 'KING OF KINGS', bgGradient: ['#FF0080', '#7928CA', '#0070F3'], enabled: true },
    svipBubbleConfig: { bubbleName: 'Rainbow Emperor Shimmer', bgGradient: ['#3B0764', '#581C87'], textColor: '#FFF', borderColor: '#EC4899', enabled: true },
    privileges: [
      { key: 'unique_2_digit_sid', title: '2-digit SID', description: 'Crown of crowns: 2-digit vanity ID.', icon: 'diamond', value: '2-Digit SID' },
      { key: 'room_secret_lord', title: 'Room Secret Lord', description: 'Master control over secret private rooms.', icon: 'keypad', value: 'Lord Authority' },
      { key: 'anti_kick', title: 'Anti-Kick', description: 'Absolute immunity across platform.', icon: 'shield', value: 'Absolute' },
      { key: 'exclusive_customer_service', title: 'VIP Support', description: 'Executive 1-on-1 concierge.', icon: 'headset', value: '24/7 Executive' },
      { key: 'upgrade_app_wide_notification', title: 'App-wide Notice', description: 'Supreme arrival fanfare.', icon: 'megaphone', value: 'Supreme Fanfare' },
    ],
  },
];

export default function SVIPScreen() {
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 16);
  const navigation = useNavigation();
  const { user, fetchUserProfile } = useContext(AuthContext);

  const [tiers, setTiers] = useState(FALLBACK_TIERS);
  const [activeTierId, setActiveTierId] = useState(FALLBACK_TIERS[0].id);
  const [selectedPrivilege, setSelectedPrivilege] = useState(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch published plans dynamically from backend
  const loadSvipPlans = async () => {
    try {
      setLoading(true);
      const res = await apiUtil.get('/svip-plans', { suppressGlobalError: true });
      const plans = res?.data?.data?.plans || res?.data?.plans;
      if (Array.isArray(plans) && plans.length > 0) {
        const formatted = plans.map((p) => ({
          ...p,
          id: p.slug || p._id,
          title: p.name,
          discount: p.discountPercent ? `${p.discountPercent}% OFF` : '30% OFF',
        }));
        setTiers(formatted);
        if (!formatted.some((t) => t.id === activeTierId)) {
          setActiveTierId(formatted[0].id);
        }
      }
    } catch (_) {
      // Keep fallback tiers
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSvipPlans();
  }, []);

  const currentTier = tiers.find((t) => t.id === activeTierId || t.slug === activeTierId) || tiers[0];
  const userCurrentDiamonds = user?.diamonds || 0;
  const isCurrentlyActive = Boolean(
    user?.equippedSvipId &&
    (user.equippedSvipId === currentTier.slug || user.equippedSvipId === currentTier.id)
  );

  // Wealth refill progress calculation
  const currentMonthWealth = user?.wealthExp || user?.coins || 120000;
  const targetThreshold = currentTier.rechargeThreshold || 250000;
  const progressRatio = Math.min(1, Math.max(0, currentMonthWealth / targetThreshold));

  const handlePurchase = async () => {
    const cost = currentTier.price;

    if (userCurrentDiamonds < cost) {
      AlertService.show(
        'Insufficient Diamonds',
        `You need ${formatCompactBalance(cost)} 💎 to activate ${currentTier.name}. Please recharge your balance.`,
        'error'
      );
      navigation.navigate('Wallet');
      return;
    }

    setIsPurchasing(true);
    try {
      // Server-authoritative purchase transaction
      const res = await apiUtil.post('/svip-plans/purchase', {
        planIdOrSlug: currentTier.slug || currentTier.id,
      });

      AlertService.show(
        'Royal Activation Successful! 👑',
        res?.message || `Welcome to ${currentTier.name}! Nobility privileges are now active.`,
        'success'
      );

      if (fetchUserProfile) await fetchUserProfile();
      loadSvipPlans();
    } catch (err) {
      AlertService.show(
        'Purchase Failed',
        err?.message || 'Unable to complete SVIP transaction. Please check your diamond balance.',
        'error'
      );
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Deep Obsidian-Chocolate Noble Gradient Background */}
      <LinearGradient
        colors={['#170F0A', '#1E140D', '#2A1C13', '#160E09']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Top Header */}
      <View style={[styles.header, { paddingTop: topSafeInset + 6 }]}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="chevron-back" size={26} color="#E2E8F0" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>SVIP Nobility</Text>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => setShowHelpModal(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="help-circle-outline" size={24} color="#D4AF37" />
          </TouchableOpacity>
        </View>
      </View>

      {/* User Info Bar */}
      <View style={styles.userInfoRow}>
        <View style={styles.avatarBorder}>
          <Image source={getUserAvatar(user)} style={styles.userAvatar} />
        </View>
        <View style={styles.userTextWrap}>
          <Text style={styles.userName} numberOfLines={1}>
            {user?.name || 'Yaro Noble'}
          </Text>
          <Text style={styles.userStatus}>
            {isCurrentlyActive ? `${currentTier.name} • Active` : 'Nobility inactive'}
          </Text>
        </View>
      </View>

      {/* Horizontal SVIP Tier Selector Tabs */}
      <View style={styles.tierTabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tierScroll}>
          {tiers.map((tier) => {
            const isActive = (tier.id === activeTierId || tier.slug === activeTierId);
            return (
              <TouchableOpacity
                key={tier.id || tier.slug}
                style={[styles.tierTab, isActive && styles.tierTabActive]}
                onPress={() => setActiveTierId(tier.id || tier.slug)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tierTabText, isActive && styles.tierTabTextActive]}>
                  {tier.level === 0 ? 'VIP+' : `SVIP ${tier.level}`}
                </Text>
                {isActive && <View style={styles.tierTabUnderline} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Scrollable Content with Safe Bottom Padding */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding + 110 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Large Hero Badge / Animation Card */}
        <View style={styles.heroCrestWrap}>
          <View style={styles.crestAuraGlow} />

          <View style={styles.crestCircleOuter}>
            {/* Top Crown */}
            <View style={styles.crestCrown}>
              <MaterialCommunityIcons name="crown" size={40} color="#FBBF24" />
            </View>

            {/* Crest Shield with Outstretched Golden Wings */}
            <View style={styles.crestWingRow}>
              {/* Left Wing */}
              <View style={styles.leftWingWrap}>
                <MaterialCommunityIcons
                  name="feather"
                  size={50}
                  color="#FBBF24"
                  style={{ transform: [{ rotate: '-40deg' }, { scaleX: -1 }] }}
                />
              </View>

              {/* Center Stag Shield / Uploaded Hero Badge */}
              <View style={styles.crestShield}>
                {currentTier.heroBadgeUrl ? (
                  <Image
                    source={{ uri: currentTier.heroBadgeUrl }}
                    style={{ width: 56, height: 56 }}
                    resizeMode="contain"
                  />
                ) : (
                  <LinearGradient
                    colors={['#FDE68A', '#F59E0B', '#B45309', '#78350F']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.crestShieldGrad}
                  >
                    <Text style={styles.levelBadgeText}>{currentTier.level === 0 ? '+' : currentTier.level}</Text>
                    <Text style={styles.levelBadgeSub}>{currentTier.level === 0 ? 'VIP' : 'SVIP'}</Text>
                  </LinearGradient>
                )}
              </View>

              {/* Right Wing */}
              <View style={styles.rightWingWrap}>
                <MaterialCommunityIcons
                  name="feather"
                  size={50}
                  color="#FBBF24"
                  style={{ transform: [{ rotate: '40deg' }] }}
                />
              </View>
            </View>

            {/* Royal Name Ribbon */}
            <LinearGradient
              colors={['#1E3A8A', '#2563EB', '#1D4ED8', '#1E40AF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.crestRibbon}
            >
              <Text style={styles.crestRibbonText}>{currentTier.name}</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Side-by-Side: SVIP Tag & SVIP Bubble Preview Cards */}
        <View style={styles.tagBubbleRow}>
          {/* SVIP Tag Preview Card */}
          <View style={styles.previewCard}>
            <Text style={styles.previewCardTitle}>SVIP Tag</Text>
            <View style={styles.previewTagBox}>
              <LinearGradient
                colors={currentTier.svipTagConfig?.bgGradient || ['#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.svipTagPill}
              >
                <Text style={styles.svipTagPillText}>
                  👑 {currentTier.svipTagConfig?.text || `SVIP ${currentTier.level}`}
                </Text>
              </LinearGradient>
            </View>
          </View>

          {/* SVIP Bubble Preview Card */}
          <View style={styles.previewCard}>
            <Text style={styles.previewCardTitle}>SVIP Bubble</Text>
            <View style={styles.previewBubbleBox}>
              <LinearGradient
                colors={currentTier.svipBubbleConfig?.bgGradient || ['#3B0764', '#581C87']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.svipBubbleItem,
                  { borderColor: currentTier.svipBubbleConfig?.borderColor || '#C084FC' },
                ]}
              >
                <Text style={styles.svipBubbleMsg} numberOfLines={1}>
                  Chat in voice room ✨
                </Text>
              </LinearGradient>
            </View>
          </View>
        </View>

        {/* Monthly Value / Refill Progress Toward Next Tier */}
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.progressTitle}>Monthly Value Progress</Text>
              <Text style={styles.progressSubtitle}>
                {currentMonthWealth.toLocaleString()} / {targetThreshold.toLocaleString()} 💎
              </Text>
            </View>
            <TouchableOpacity
              style={styles.refillButton}
              onPress={() => navigation.navigate('Wallet')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                style={styles.refillGrad}
              >
                <Text style={styles.refillText}>Refill 💎</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${progressRatio * 100}%` }]} />
          </View>
        </View>

        {/* Section Divider: Exclusive Privileges */}
        <View style={styles.sectionDividerWrap}>
          <View style={styles.flourishTitleRow}>
            <Text style={styles.flourishChar}>༺ ──</Text>
            <Text style={styles.flourishTitle}>
              Exclusive Privileges ({currentTier.privileges?.length || 0})
            </Text>
            <Text style={styles.flourishChar}>── ༻</Text>
          </View>
        </View>

        {/* 4-Column Circular Privileges Grid */}
        <View style={styles.privilegesGrid}>
          {(currentTier.privileges || []).map((p, idx) => (
            <TouchableOpacity
              key={p.key || `priv_${idx}`}
              style={styles.privilegeItem}
              activeOpacity={0.8}
              onPress={() => setSelectedPrivilege(p)}
            >
              <View style={styles.privilegeCircleBorder}>
                <LinearGradient
                  colors={['#2B1B11', '#1B110B']}
                  style={styles.privilegeCircleInner}
                >
                  <Icon name={p.icon || 'star'} size={24} color="#FBBF24" />
                </LinearGradient>
              </View>

              <Text style={styles.privilegeLabel} numberOfLines={2}>
                {p.title}
              </Text>

              {p.value ? (
                <Text style={styles.privilegeValueBadge} numberOfLines={1}>
                  {p.value}
                </Text>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Fixed Sticky Bottom Purchase Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(bottomPadding, 16) }]}>
        <LinearGradient
          colors={['rgba(26, 17, 11, 0.98)', 'rgba(18, 12, 8, 1)']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.bottomTopBorder} />

        <View style={styles.bottomBarContent}>
          {/* Price details */}
          <View style={styles.priceInfoCol}>
            <View style={styles.purchasePriceRow}>
              <Text style={styles.purchaseLabel}>Price</Text>
              <Text style={styles.priceMainText}>
                {formatCompactBalance(currentTier.price)} 💎
              </Text>
              <Text style={styles.perDaysText}>/{currentTier.durationDays || 30}d</Text>
            </View>

            {currentTier.originalPrice ? (
              <Text style={styles.originalPriceText}>
                Original: {formatCompactBalance(currentTier.originalPrice)} 💎
              </Text>
            ) : null}
          </View>

          {/* Activate Button with Discount Badge */}
          <View style={styles.activateWrapper}>
            <View style={styles.pinnedDiscountBadge}>
              <Text style={styles.pinnedDiscountText}>{currentTier.discount || '30% OFF'}</Text>
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
                  <Text style={styles.activateBtnText}>
                    {isCurrentlyActive ? 'Extend SVIP' : 'Activate Now'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Privilege Detail Modal */}
      <Modal
        visible={!!selectedPrivilege}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPrivilege(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedPrivilege?.title}</Text>
              <TouchableOpacity onPress={() => setSelectedPrivilege(null)}>
                <Icon name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalIconWrap}>
              <LinearGradient colors={['#FBBF24', '#D97706']} style={styles.modalIconGrad}>
                <Icon name={selectedPrivilege?.icon || 'star'} size={32} color="#FFFFFF" />
              </LinearGradient>
            </View>

            <Text style={styles.modalDesc}>
              {selectedPrivilege?.description || 'Exclusive nobility privilege for SVIP members.'}
            </Text>

            {selectedPrivilege?.value ? (
              <View style={styles.modalValueRow}>
                <Text style={styles.modalValueLabel}>Tier Benefit:</Text>
                <Text style={styles.modalValueText}>{selectedPrivilege.value}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setSelectedPrivilege(null)}
            >
              <Text style={styles.modalCloseText}>Got It</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Help Modal */}
      <Modal
        visible={showHelpModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowHelpModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>SVIP Nobility Rules</Text>
              <TouchableOpacity onPress={() => setShowHelpModal(false)}>
                <Icon name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 300, marginVertical: 12 }}>
              <Text style={styles.helpRuleText}>
                1. SVIP tiers are purchased using diamonds and remain active for the configured validity period.
              </Text>
              <Text style={styles.helpRuleText}>
                2. Your permanent account numeric ID is never overwritten or affected by temporary SVIP display tags.
              </Text>
              <Text style={styles.helpRuleText}>
                3. When your SVIP expires, benefits automatically stop and your profile safely reverts to default styling.
              </Text>
              <Text style={styles.helpRuleText}>
                4. SVIP grants immunity from public room kicks, high-priority entry notifications, and exclusive privileges.
              </Text>
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowHelpModal(false)}
            >
              <Text style={styles.modalCloseText}>Understood</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#160E09',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FDE68A',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  headerRight: {
    flexDirection: 'row',
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  avatarBorder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    padding: 2,
    marginRight: 12,
  },
  userAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  userTextWrap: {
    flex: 1,
  },
  userName: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  userStatus: {
    color: '#FBBF24',
    fontSize: 11,
    marginTop: 2,
  },
  tierTabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 4,
  },
  tierScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tierTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
  },
  tierTabActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  tierTabText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  tierTabTextActive: {
    color: '#FBBF24',
    fontWeight: '900',
  },
  tierTabUnderline: {
    position: 'absolute',
    bottom: -5,
    width: 20,
    height: 3,
    backgroundColor: '#F59E0B',
    borderRadius: 2,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  heroCrestWrap: {
    alignItems: 'center',
    marginVertical: 16,
  },
  crestAuraGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  crestCircleOuter: {
    alignItems: 'center',
  },
  crestCrown: {
    marginBottom: -10,
    zIndex: 10,
  },
  crestWingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftWingWrap: {
    marginRight: -10,
  },
  rightWingWrap: {
    marginLeft: -10,
  },
  crestShield: {
    width: 80,
    height: 90,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FDE68A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  crestShieldGrad: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelBadgeText: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '900',
  },
  levelBadgeSub: {
    color: '#FFFBEB',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  crestRibbon: {
    marginTop: -10,
    paddingHorizontal: 20,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  crestRibbonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  tagBubbleRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 10,
  },
  previewCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  previewCardTitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  previewTagBox: {
    height: 36,
    justifyContent: 'center',
  },
  svipTagPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  svipTagPillText: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '900',
  },
  previewBubbleBox: {
    height: 36,
    justifyContent: 'center',
    width: '100%',
  },
  svipBubbleItem: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
  },
  svipBubbleMsg: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
  },
  progressContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 10,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  progressTitle: {
    color: '#FDE68A',
    fontSize: 12,
    fontWeight: '800',
  },
  progressSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  refillButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  refillGrad: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  refillText: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '900',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 3,
  },
  sectionDividerWrap: {
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 12,
  },
  flourishTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flourishChar: {
    color: '#D4AF37',
    fontSize: 12,
  },
  flourishTitle: {
    color: '#FDE68A',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  privilegesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  privilegeItem: {
    width: (width - 62) / 4,
    alignItems: 'center',
    marginBottom: 12,
  },
  privilegeCircleBorder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    padding: 2,
    marginBottom: 6,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  privilegeCircleInner: {
    flex: 1,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privilegeLabel: {
    color: '#E2E8F0',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 12,
  },
  privilegeValueBadge: {
    color: '#F59E0B',
    fontSize: 8,
    fontWeight: '800',
    marginTop: 2,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  bottomTopBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.3)',
  },
  bottomBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceInfoCol: {
    flex: 1,
  },
  purchasePriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  purchaseLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  priceMainText: {
    color: '#FBBF24',
    fontSize: 18,
    fontWeight: '900',
  },
  perDaysText: {
    color: '#94A3B8',
    fontSize: 11,
  },
  originalPriceText: {
    color: '#64748B',
    fontSize: 10,
    textDecorationLine: 'line-through',
    marginTop: 1,
  },
  activateWrapper: {
    position: 'relative',
  },
  pinnedDiscountBadge: {
    position: 'absolute',
    top: -10,
    right: 0,
    zIndex: 10,
    backgroundColor: '#EF4444',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pinnedDiscountText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
  },
  activateBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  activateGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 130,
  },
  activateBtnText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#1E140D',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#D4AF37',
    padding: 20,
    alignItems: 'center',
  },
  modalHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#FDE68A',
    fontSize: 16,
    fontWeight: '900',
  },
  modalIconWrap: {
    marginBottom: 14,
  },
  modalIconGrad: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDesc: {
    color: '#E2E8F0',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  modalValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  modalValueLabel: {
    color: '#94A3B8',
    fontSize: 12,
  },
  modalValueText: {
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalCloseBtn: {
    width: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: 'bold',
  },
  helpRuleText: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10,
  },
});
