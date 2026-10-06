import React, { useCallback, useContext, useMemo, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { apiUtil } from '../../utils/apiUtil';
import { AuthContext } from '../../context/AuthProvider';
import { getUserAvatar } from '../../utils/avatarUtil';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';
import { AlertService } from '../../utils/AlertService';
import SvgaView from '../../components/SvgaView';
import {
  calculateWealthLevel,
  calculateWealthProgress,
  getWealthRewards,
  WEALTH_REWARDS,
  WEALTH_THRESHOLDS,
  generateWealthLevelRanges,
  calculateCharmLevel,
  calculateCharmProgress,
  getCharmRewards,
  CHARM_PACKAGES,
  CHARM_MILESTONES,
  CHARM_THRESHOLDS,
} from '../../utils/levelEngine';

const { width } = Dimensions.get('window');
const CARD_GAP = 10;
const HORIZONTAL_PADDING = 16;
const CARD_WIDTH = (width - HORIZONTAL_PADDING * 2 - CARD_GAP) / 2;

// Reward Icon / Artwork Component
const RewardThumbnail = ({ item, size = 60 }) => {
  const imageUrl = item?.imageUrl || item?.image;
  const animationUrl = item?.animationUrl;

  if (animationUrl || imageUrl) {
    return (
      <SvgaView
        source={animationUrl || imageUrl}
        style={{ width: size, height: size }}
        resizeMode="contain"
        fallbackImage={imageUrl}
      />
    );
  }

  // Fallback icon based on type
  let iconName = 'star-shooting';
  let iconColor = '#F59E0B';
  if (item?.type === 'frame') {
    iconName = 'circle-double';
    iconColor = '#EC4899';
  } else if (item?.type === 'badge') {
    iconName = 'shield-star';
    iconColor = '#F59E0B';
  } else if (item?.type === 'vehicle') {
    iconName = 'car-sports';
    iconColor = '#06B6D4';
  } else if (item?.type === 'custom_id') {
    iconName = 'card-account-details-star';
    iconColor = '#8B5CF6';
  } else if (item?.type === 'entrance') {
    iconName = 'weather-night';
    iconColor = '#EAB308';
  } else if (item?.type === 'profile_border') {
    iconName = 'border-outside';
    iconColor = '#10B981';
  } else if (item?.type === 'theme') {
    iconName = 'palette';
    iconColor = '#6366F1';
  } else if (item?.type === 'mic') {
    iconName = 'microphone-variant';
    iconColor = '#F43F5E';
  } else if (item?.type === 'room_skin') {
    iconName = 'home-modern';
    iconColor = '#A855F7';
  } else if (item?.type === 'party_set') {
    iconName = 'cake-variant';
    iconColor = '#EC4899';
  }

  return <MaterialCommunityIcons name={iconName} size={size * 0.7} color={iconColor} />;
};

export default function LevelJourney() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomSafePadding = getStackScreenBottomPadding(insets.bottom, 24);
  const { t } = useTranslation();
  const { user, fetchUserProfile, commitCanonicalUser } = useContext(AuthContext);

  const initialTab =
    route?.params?.initialTab === 'charm' || route?.params?.journeyType === 'charm'
      ? 'charm'
      : 'wealth';
  const [journeyType, setJourneyType] = useState(initialTab); // 'wealth' | 'charm'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Live status from backend
  const [serverStatus, setServerStatus] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedCharmMilestone, setSelectedCharmMilestone] = useState(1);
  const [selectedRange, setSelectedRange] = useState('r_1_9');

  // Modals
  const [previewItem, setPreviewItem] = useState(null);
  const [showHowToUpgrade, setShowHowToUpgrade] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);

  // Client calculation (derived from user data as source of truth)
  const currentWealthExp = Number(user?.wealthExp || 0);
  const currentCharmExp = Number(user?.charmExp || 0);

  const wealthProgress = useMemo(
    () => calculateWealthProgress(currentWealthExp),
    [currentWealthExp]
  );

  const charmProgress = useMemo(
    () => calculateCharmProgress(currentCharmExp),
    [currentCharmExp]
  );

  const isWealth = journeyType === 'wealth';
  const currentLevel = isWealth ? wealthProgress.level : charmProgress.level;
  const currentExp = isWealth ? wealthProgress.currentExp : charmProgress.currentExp;
  const nextLevelExp = isWealth ? wealthProgress.nextLevelExp : charmProgress.nextLevelExp;
  const remainingExp = isWealth ? wealthProgress.remainingExp : charmProgress.remainingExp;
  const progressPercent = isWealth ? wealthProgress.progressPercent : charmProgress.progressPercent;
  const tierName = isWealth ? wealthProgress.tier : charmProgress.tier;
  const tierBadgeIcon = isWealth ? wealthProgress.badgeIcon : charmProgress.badgeIcon;

  // Claimed rewards from server / user object
  const claimedList = useMemo(() => {
    return Array.isArray(user?.claimedLevelRewards) ? user.claimedLevelRewards : [];
  }, [user?.claimedLevelRewards]);

  // Load status from backend
  const loadStatus = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      if (fetchUserProfile) await fetchUserProfile();
      const res = await apiUtil.get('/level/me', { suppressGlobalError: true });
      if (res?.data?.success && res.data.data) {
        setServerStatus(res.data.data);
      }
    } catch (_) {
      // Fallback works automatically from client LevelEngine & user context
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchUserProfile]);

  useFocusEffect(
    useCallback(() => {
      loadStatus(false);
    }, [loadStatus])
  );

  // Dynamic Wealth Level Ranges
  const wealthRanges = useMemo(() => {
    return generateWealthLevelRanges(wealthProgress.level);
  }, [wealthProgress.level]);

  // Filtered Wealth Rewards based on active category
  const filteredWealthRewards = useMemo(() => {
    if (activeCategory === 'All') return WEALTH_REWARDS;
    return WEALTH_REWARDS.filter((r) => {
      if (activeCategory === 'Badge') return r.type === 'badge';
      if (activeCategory === 'Frame') return r.type === 'frame';
      if (activeCategory === 'Vehicle') return r.type === 'vehicle';
      if (activeCategory === 'Custom ID') return r.type === 'custom_id';
      if (activeCategory === 'Entrance') return r.type === 'entrance';
      if (activeCategory === 'Profile Border') return r.type === 'profile_border';
      if (activeCategory === 'Custom Theme') return r.type === 'theme';
      return true;
    });
  }, [activeCategory]);

  // Charm Rewards for selected milestone
  const charmPackageRewards = useMemo(() => {
    return CHARM_PACKAGES[selectedCharmMilestone] || [];
  }, [selectedCharmMilestone]);

  // Reward Status Helper: 'LOCKED' | 'UNLOCKED' | 'CLAIMED' | 'EQUIPPED'
  const getRewardState = useCallback(
    (item) => {
      if (!item) return 'LOCKED';
      const lvl = isWealth ? wealthProgress.level : charmProgress.level;
      const isLevelMet = lvl >= item.requiredLevel;

      if (!isLevelMet) return 'LOCKED';

      const grantKey = `${journeyType}:${item.id}`;
      const isClaimed = claimedList.includes(grantKey) || claimedList.includes(item.id);

      if (!isClaimed) return 'UNLOCKED'; // Unlocked but not yet claimed

      // Check if equipped
      const equippedFrame = user?.equippedFrame;
      const equippedBadge = user?.equippedBadge;
      const equippedEntrance = user?.equippedEntrance;
      const equippedVehicle = user?.equippedVehicle;
      const equippedBorder = user?.equippedProfileBorder;
      const equippedCustomId = user?.equippedCustomId;
      const equippedTheme = user?.equippedRoomTheme;
      const equippedMic = user?.equippedMicWave;

      if (
        (item.type === 'frame' && equippedFrame === item.name) ||
        (item.type === 'badge' && equippedBadge === item.name) ||
        (item.type === 'entrance' && equippedEntrance === item.name) ||
        (item.type === 'vehicle' && equippedVehicle === item.name) ||
        (item.type === 'profile_border' && equippedBorder === item.name) ||
        (item.type === 'custom_id' && equippedCustomId === item.name) ||
        (item.type === 'theme' && equippedTheme === item.id) ||
        (item.type === 'mic' && equippedMicWave === item.name)
      ) {
        return 'EQUIPPED';
      }

      return 'CLAIMED';
    },
    [isWealth, wealthProgress.level, charmProgress.level, journeyType, claimedList, user]
  );

  // Claim Reward Handler
  const handleClaimReward = async (item) => {
    if (!item) return;
    setClaimLoading(true);
    try {
      const res = await apiUtil.post('/level/claim', {
        rewardId: item.id,
        journeyType,
      });

      if (res?.data?.success) {
        AlertService.show(
          'Reward Claimed! 🎉',
          `${item.name} has been added to your inventory!`,
          'success'
        );
        if (fetchUserProfile) await fetchUserProfile();
        loadStatus(false);
        if (previewItem && previewItem.id === item.id) {
          setPreviewItem(null);
        }
      } else {
        AlertService.show('Claim Notice', res?.data?.message || 'Could not claim reward', 'info');
      }
    } catch (err) {
      AlertService.show(
        'Claim Error',
        err.response?.data?.message || err.message || 'Reward claim failed',
        'error'
      );
    } finally {
      setClaimLoading(false);
    }
  };

  // Equip / Unequip Reward Handler
  const handleEquipReward = async (item, shouldEquip = true) => {
    if (!item) return;
    setClaimLoading(true);
    try {
      const res = await apiUtil.post('/level/equip', {
        rewardId: item.id,
        journeyType,
        shouldEquip,
      });

      if (res?.data?.success) {
        if (res.data.data?.user && commitCanonicalUser) {
          await commitCanonicalUser(res.data.data.user);
        }
        AlertService.show(
          shouldEquip ? 'Equipped! 👑' : 'Unequipped',
          `${item.name} is now ${shouldEquip ? 'active' : 'unequipped'} on your profile!`,
          'success'
        );
        if (fetchUserProfile) await fetchUserProfile();
        loadStatus(false);
        if (previewItem && previewItem.id === item.id) {
          setPreviewItem(null);
        }
      } else {
        AlertService.show('Notice', res?.data?.message || 'Equip action failed', 'info');
      }
    } catch (err) {
      AlertService.show(
        'Equip Error',
        err.response?.data?.message || err.message || 'Could not update cosmetic',
        'error'
      );
    } finally {
      setClaimLoading(false);
    }
  };

  // Badges list for Wealth (milestone badges)
  const wealthBadges = useMemo(() => {
    return WEALTH_REWARDS.filter((r) => r.type === 'badge');
  }, []);

  return (
    <View style={styles.screen}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Background Gradient */}
      <LinearGradient
        colors={
          isWealth
            ? ['#0F0826', '#1E1038', '#1A0E2A', '#0B061A']
            : ['#1A072E', '#2D0B4E', '#1F0838', '#0D041A']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* TOP HEADER */}
      <View style={[styles.headerBar, { paddingTop: topSafeInset + 6 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.8}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Icon name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Level System</Text>
        </View>

        <TouchableOpacity
          onPress={() => setShowHowToUpgrade(true)}
          style={styles.helpHeaderBtn}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="help-circle-outline" size={22} color="#FBBF24" />
        </TouchableOpacity>
      </View>

      {/* SEGMENTED TAB SWITCHER [ 💎 Wealth ] [ 🌸 Charm ] */}
      <View style={styles.tabsContainer}>
        <View style={styles.tabTrack}>
          <TouchableOpacity
            style={[styles.tabButton, isWealth && styles.tabButtonActiveWealth]}
            onPress={() => setJourneyType('wealth')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={isWealth ? ['#F59E0B', '#D97706'] : ['transparent', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.tabButtonGradient}
            >
              <MaterialCommunityIcons
                name="diamond-stone"
                size={16}
                color={isWealth ? '#0F172A' : '#94A3B8'}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.tabButtonText, isWealth && styles.tabButtonTextActiveWealth]}>
                Wealth Level
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, !isWealth && styles.tabButtonActiveCharm]}
            onPress={() => setJourneyType('charm')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={!isWealth ? ['#EC4899', '#DB2777'] : ['transparent', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.tabButtonGradient}
            >
              <Text style={{ marginRight: 4, fontSize: 14 }}>🌸</Text>
              <Text style={[styles.tabButtonText, !isWealth && styles.tabButtonTextActiveCharm]}>
                Charm Level
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* MAIN SCROLLABLE CONTENT */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomSafePadding }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadStatus(true)}
            tintColor={isWealth ? '#F59E0B' : '#EC4899'}
          />
        }
      >
        {/* TOP PROFILE & PROGRESSION CARD */}
        <LinearGradient
          colors={
            isWealth
              ? ['#2C1A06', '#1F1204', '#150C03']
              : ['#2F0833', '#1F0624', '#140417']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.heroCard,
            { borderColor: isWealth ? 'rgba(245, 158, 11, 0.35)' : 'rgba(236, 72, 153, 0.35)' },
          ]}
        >
          {/* Ambient Glow */}
          <View
            style={[
              styles.heroAmbientGlow,
              { backgroundColor: isWealth ? 'rgba(245, 158, 11, 0.15)' : 'rgba(236, 72, 153, 0.15)' },
            ]}
          />

          {/* User Row */}
          <View style={styles.heroUserRow}>
            {/* Avatar with Ring */}
            <View style={styles.avatarRingWrapper}>
              <LinearGradient
                colors={isWealth ? ['#F59E0B', '#FBBF24', '#78350F'] : ['#EC4899', '#F472B6', '#701A75']}
                style={styles.avatarRingGradient}
              >
                <Image source={getUserAvatar(user)} style={styles.avatarInner} />
              </LinearGradient>
              <View
                style={[
                  styles.heroLevelPill,
                  { backgroundColor: isWealth ? '#F59E0B' : '#EC4899' },
                ]}
              >
                <Text style={styles.heroLevelPillText}>Lv.{currentLevel}</Text>
              </View>
            </View>

            {/* User Meta */}
            <View style={styles.heroMetaCol}>
              <View style={styles.heroTierBadgeRow}>
                <View
                  style={[
                    styles.heroTierBadge,
                    { backgroundColor: isWealth ? 'rgba(245, 158, 11, 0.2)' : 'rgba(236, 72, 153, 0.2)' },
                  ]}
                >
                  <Text style={styles.heroTierBadgeIcon}>{tierBadgeIcon}</Text>
                  <Text
                    style={[
                      styles.heroTierBadgeText,
                      { color: isWealth ? '#FBBF24' : '#F472B6' },
                    ]}
                  >
                    {tierName}
                  </Text>
                </View>
              </View>

              <Text style={styles.heroUserName} numberOfLines={1}>
                {user?.name || 'Yaro Explorer'}
              </Text>

              <Text
                style={[
                  styles.heroLevelTitle,
                  { color: isWealth ? '#FCD34D' : '#F9A8D4' },
                ]}
              >
                {isWealth ? `Wealth Lv.${currentLevel}` : `Charm Lv.${currentLevel}`}
              </Text>
            </View>

            {/* "How to upgrade?" Button */}
            <TouchableOpacity
              onPress={() => setShowHowToUpgrade(true)}
              style={styles.howToUpgradeBtn}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="lightning-bolt"
                size={14}
                color={isWealth ? '#F59E0B' : '#EC4899'}
              />
              <Text
                style={[
                  styles.howToUpgradeText,
                  { color: isWealth ? '#FBBF24' : '#F472B6' },
                ]}
              >
                How to upgrade?
              </Text>
            </TouchableOpacity>
          </View>

          {/* PROGRESS BAR SECTION (Reference exact format) */}
          <View style={styles.progressSection}>
            <View style={styles.progressLabelsRow}>
              <Text style={styles.currentExpLabel}>Current EXP:</Text>
              <Text
                style={[
                  styles.currentExpValue,
                  { color: isWealth ? '#FBBF24' : '#F472B6' },
                ]}
              >
                {currentExp.toLocaleString()} / {nextLevelExp.toLocaleString()}
              </Text>
            </View>

            <View style={styles.progressBarTrack}>
              <LinearGradient
                colors={isWealth ? ['#F59E0B', '#FBBF24'] : ['#EC4899', '#F472B6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
              />
            </View>

            <View style={styles.remainingExpRow}>
              <Text style={styles.remainingExpText}>
                Remaining: <Text style={{ fontWeight: '800', color: '#FFFFFF' }}>{remainingExp.toLocaleString()} EXP</Text> to reach next {isWealth ? 'Wealth' : 'Charm'} Level
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* WEALTH JOURNEY CONTENT */}
        {isWealth && (
          <View style={styles.journeyBody}>
            {/* 1. DYNAMIC LEVEL RANGES (Lv 1–9, Lv 10–19, Lv 20–29...) */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>WEALTH LEVEL RANGES</Text>
              <Text style={styles.sectionSubtitle}>Lv 1 – Lv 150</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.rangesScroll}
            >
              {wealthRanges.map((range) => {
                const isSelected = selectedRange === range.id;
                return (
                  <TouchableOpacity
                    key={range.id}
                    onPress={() => setSelectedRange(range.id)}
                    style={[
                      styles.rangePill,
                      range.isCurrent && styles.rangePillCurrent,
                      isSelected && styles.rangePillSelected,
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.rangePillText,
                        range.isCurrent && styles.rangePillTextCurrent,
                        isSelected && styles.rangePillTextSelected,
                      ]}
                    >
                      {range.label}
                    </Text>
                    {range.isCurrent && (
                      <View style={styles.rangeCurrentDot} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* 2. WEALTH BADGES SECTION (Milestones Lv.10 to Lv.140+) */}
            <View style={[styles.sectionHeaderRow, { marginTop: 22 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="shield-star" size={18} color="#F59E0B" style={{ marginRight: 6 }} />
                <Text style={styles.sectionTitle}>WEALTH BADGES</Text>
              </View>
              <Text style={styles.sectionSubtitle}>Milestone Medals</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.badgesScroll}
            >
              {wealthBadges.map((badge) => {
                const state = getRewardState(badge);
                const isUserCurrentTier =
                  wealthProgress.level >= badge.requiredLevel &&
                  wealthProgress.level < badge.requiredLevel + 10;

                return (
                  <TouchableOpacity
                    key={badge.id}
                    onPress={() => setPreviewItem(badge)}
                    style={[
                      styles.badgeCard,
                      state === 'LOCKED' && styles.cardLocked,
                      isUserCurrentTier && styles.cardCurrentTier,
                    ]}
                    activeOpacity={0.85}
                  >
                    {isUserCurrentTier && (
                      <View style={styles.currentTierRibbon}>
                        <Text style={styles.currentTierRibbonText}>CURRENT</Text>
                      </View>
                    )}

                    <View style={styles.badgeArtworkBox}>
                      <RewardThumbnail item={badge} size={54} />
                    </View>

                    <Text style={styles.badgeLevelText}>Lv.{badge.requiredLevel}</Text>
                    <Text style={styles.badgeNameText} numberOfLines={1}>
                      {badge.name.replace('Wealth ', '')}
                    </Text>

                    {/* Status Button */}
                    <View style={styles.badgeActionBox}>
                      {state === 'LOCKED' && (
                        <View style={styles.stateTagLocked}>
                          <Icon name="lock-closed" size={11} color="#94A3B8" />
                          <Text style={styles.stateTagTextLocked}>Lv.{badge.requiredLevel}</Text>
                        </View>
                      )}
                      {state === 'UNLOCKED' && (
                        <TouchableOpacity
                          style={styles.claimMiniBtn}
                          onPress={() => handleClaimReward(badge)}
                          disabled={claimLoading}
                        >
                          <Text style={styles.claimMiniBtnText}>Claim</Text>
                        </TouchableOpacity>
                      )}
                      {state === 'CLAIMED' && (
                        <TouchableOpacity
                          style={styles.equipMiniBtn}
                          onPress={() => handleEquipReward(badge, true)}
                          disabled={claimLoading}
                        >
                          <Text style={styles.equipMiniBtnText}>Equip</Text>
                        </TouchableOpacity>
                      )}
                      {state === 'EQUIPPED' && (
                        <View style={styles.stateTagEquipped}>
                          <Icon name="checkmark-circle" size={12} color="#10B981" />
                          <Text style={styles.stateTagTextEquipped}>Equipped</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* 3. REWARD CATEGORIES SWITCHER */}
            <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="gift-outline" size={18} color="#F59E0B" style={{ marginRight: 6 }} />
                <Text style={styles.sectionTitle}>WEALTH REWARDS</Text>
              </View>
              <Text style={styles.sectionSubtitle}>{filteredWealthRewards.length} Rewards</Text>
            </View>

            {/* Category Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryPillsScroll}
            >
              {[
                'All',
                'Badge',
                'Frame',
                'Vehicle',
                'Custom ID',
                'Entrance',
                'Profile Border',
                'Custom Theme',
              ].map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setActiveCategory(cat)}
                    style={[styles.catPill, isActive && styles.catPillActive]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.catPillText, isActive && styles.catPillTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* RESPONSIVE REWARDS GRID */}
            <View style={styles.rewardsGrid}>
              {filteredWealthRewards.map((item) => {
                const state = getRewardState(item);

                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => setPreviewItem(item)}
                    style={[styles.rewardGridCard, { width: CARD_WIDTH }]}
                    activeOpacity={0.85}
                  >
                    {/* Top Level Pill */}
                    <View style={styles.rewardCardTopRow}>
                      <View style={styles.rewardLevelReqPill}>
                        <Text style={styles.rewardLevelReqText}>Lv.{item.requiredLevel}</Text>
                      </View>
                      <Text style={styles.rewardDurationTag}>
                        {item.durationDays === 0 ? 'Permanent' : `${item.durationDays}d`}
                      </Text>
                    </View>

                    {/* Preview Artwork */}
                    <View style={styles.rewardArtContainer}>
                      <RewardThumbnail item={item} size={64} />
                    </View>

                    {/* Meta */}
                    <Text style={styles.rewardItemName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.rewardItemCategory} numberOfLines={1}>
                      {item.categoryName}
                    </Text>

                    {/* Action State Button */}
                    <View style={styles.rewardCardActionRow}>
                      {state === 'LOCKED' && (
                        <View style={styles.rewardActionLocked}>
                          <Icon name="lock-closed" size={12} color="#64748B" />
                          <Text style={styles.rewardActionLockedText}>Reach Lv.{item.requiredLevel}</Text>
                        </View>
                      )}
                      {state === 'UNLOCKED' && (
                        <TouchableOpacity
                          style={styles.rewardActionClaimBtn}
                          onPress={() => handleClaimReward(item)}
                          disabled={claimLoading}
                        >
                          <Text style={styles.rewardActionClaimText}>Claim Reward</Text>
                        </TouchableOpacity>
                      )}
                      {state === 'CLAIMED' && (
                        <TouchableOpacity
                          style={styles.rewardActionEquipBtn}
                          onPress={() => handleEquipReward(item, true)}
                          disabled={claimLoading}
                        >
                          <Text style={styles.rewardActionEquipText}>Equip</Text>
                        </TouchableOpacity>
                      )}
                      {state === 'EQUIPPED' && (
                        <TouchableOpacity
                          style={styles.rewardActionEquippedBtn}
                          onPress={() => handleEquipReward(item, false)}
                          disabled={claimLoading}
                        >
                          <Icon name="checkmark" size={13} color="#10B981" />
                          <Text style={styles.rewardActionEquippedText}>Equipped</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* CHARM JOURNEY CONTENT */}
        {!isWealth && (
          <View style={styles.journeyBody}>
            {/* 1. CHARM MILESTONES SELECTOR */}
            <View style={styles.sectionHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ marginRight: 6, fontSize: 16 }}>🌸</Text>
                <Text style={[styles.sectionTitle, { color: '#F472B6' }]}>CHARM MILESTONES</Text>
              </View>
              <Text style={styles.sectionSubtitle}>Select Level</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.charmMilestonesScroll}
            >
              {CHARM_MILESTONES.map((m) => {
                const isSelected = selectedCharmMilestone === m;
                const isPassed = charmProgress.level >= m;
                const isCurrent =
                  charmProgress.level >= m &&
                  (m === 150 || charmProgress.level < (CHARM_MILESTONES[CHARM_MILESTONES.indexOf(m) + 1] || 151));

                return (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setSelectedCharmMilestone(m)}
                    style={[
                      styles.charmMilestonePill,
                      isSelected && styles.charmMilestonePillSelected,
                      isCurrent && styles.charmMilestonePillCurrent,
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.charmMilestoneText,
                        isSelected && styles.charmMilestoneTextSelected,
                        isCurrent && styles.charmMilestoneTextCurrent,
                      ]}
                    >
                      Lv.{m}
                    </Text>
                    {isCurrent && (
                      <View style={styles.charmCurrentIndicator} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* 2. CHARM MILESTONE REWARD PACKAGE */}
            <View style={[styles.sectionHeaderRow, { marginTop: 20 }]}>
              <Text style={[styles.sectionTitle, { color: '#F472B6' }]}>
                LV.{selectedCharmMilestone} CHARM REWARD PACKAGE
              </Text>
              <Text style={styles.sectionSubtitle}>
                {charmPackageRewards.length} Exclusive Perks
              </Text>
            </View>

            <View style={styles.rewardsGrid}>
              {charmPackageRewards.map((reward) => {
                const state = getRewardState(reward);

                return (
                  <TouchableOpacity
                    key={reward.id}
                    onPress={() => setPreviewItem(reward)}
                    style={[styles.rewardGridCard, { width: CARD_WIDTH, borderColor: 'rgba(236, 72, 153, 0.25)' }]}
                    activeOpacity={0.85}
                  >
                    <View style={styles.rewardCardTopRow}>
                      <View style={[styles.rewardLevelReqPill, { backgroundColor: '#FCE7F3' }]}>
                        <Text style={[styles.rewardLevelReqText, { color: '#DB2777' }]}>
                          Lv.{reward.requiredLevel}
                        </Text>
                      </View>
                      <Text style={styles.rewardDurationTag}>
                        {reward.durationDays === 0 ? 'Permanent' : `${reward.durationDays}d`}
                      </Text>
                    </View>

                    <View style={styles.rewardArtContainer}>
                      <RewardThumbnail item={reward} size={64} />
                    </View>

                    <Text style={styles.rewardItemName} numberOfLines={1}>
                      {reward.name}
                    </Text>
                    <Text style={styles.rewardItemCategory} numberOfLines={1}>
                      {reward.categoryName}
                    </Text>

                    <View style={styles.rewardCardActionRow}>
                      {state === 'LOCKED' && (
                        <View style={styles.rewardActionLocked}>
                          <Icon name="lock-closed" size={12} color="#64748B" />
                          <Text style={styles.rewardActionLockedText}>Reach Lv.{reward.requiredLevel}</Text>
                        </View>
                      )}
                      {state === 'UNLOCKED' && (
                        <TouchableOpacity
                          style={[styles.rewardActionClaimBtn, { backgroundColor: '#EC4899' }]}
                          onPress={() => handleClaimReward(reward)}
                          disabled={claimLoading}
                        >
                          <Text style={styles.rewardActionClaimText}>Claim Reward</Text>
                        </TouchableOpacity>
                      )}
                      {state === 'CLAIMED' && (
                        <TouchableOpacity
                          style={[styles.rewardActionEquipBtn, { borderColor: '#EC4899' }]}
                          onPress={() => handleEquipReward(reward, true)}
                          disabled={claimLoading}
                        >
                          <Text style={[styles.rewardActionEquipText, { color: '#F472B6' }]}>Equip</Text>
                        </TouchableOpacity>
                      )}
                      {state === 'EQUIPPED' && (
                        <TouchableOpacity
                          style={styles.rewardActionEquippedBtn}
                          onPress={() => handleEquipReward(reward, false)}
                          disabled={claimLoading}
                        >
                          <Icon name="checkmark" size={13} color="#10B981" />
                          <Text style={styles.rewardActionEquippedText}>Equipped</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* MODAL 1: PREVIEW & EQUIP DETAIL MODAL */}
      <Modal
        visible={Boolean(previewItem)}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewItem(null)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setPreviewItem(null)}
          />
          <View style={styles.previewCard}>
            <TouchableOpacity
              onPress={() => setPreviewItem(null)}
              style={styles.modalCloseBtn}
              activeOpacity={0.7}
            >
              <Icon name="close" size={22} color="#94A3B8" />
            </TouchableOpacity>

            <Text style={styles.previewModalKicker}>
              {isWealth ? 'WEALTH' : 'CHARM'} LEVEL REWARD PREVIEW
            </Text>

            {/* Enlarged Artwork Container */}
            <View style={styles.enlargedArtworkBox}>
              <RewardThumbnail item={previewItem} size={110} />
            </View>

            <Text style={styles.previewTitleText}>{previewItem?.name}</Text>
            <Text style={styles.previewCategoryText}>
              {previewItem?.categoryName} •{' '}
              {previewItem?.durationDays === 0
                ? 'Permanent Reward'
                : `${previewItem?.durationDays} Days Duration`}
            </Text>

            {Boolean(previewItem?.description) && (
              <Text style={styles.previewDescText}>{previewItem?.description}</Text>
            )}

            {/* Requirement Status Box */}
            <View
              style={[
                styles.previewStatusBanner,
                getRewardState(previewItem) === 'LOCKED'
                  ? styles.previewStatusBannerLocked
                  : styles.previewStatusBannerUnlocked,
              ]}
            >
              <Icon
                name={
                  getRewardState(previewItem) === 'LOCKED'
                    ? 'lock-closed'
                    : 'checkmark-circle'
                }
                size={18}
                color={
                  getRewardState(previewItem) === 'LOCKED' ? '#94A3B8' : '#10B981'
                }
              />
              <Text
                style={[
                  styles.previewStatusBannerText,
                  {
                    color:
                      getRewardState(previewItem) === 'LOCKED'
                        ? '#CBD5E1'
                        : '#34D399',
                  },
                ]}
              >
                {getRewardState(previewItem) === 'LOCKED'
                  ? `Reach ${isWealth ? 'Wealth' : 'Charm'} Lv.${previewItem?.requiredLevel} to unlock this exclusive perk.`
                  : 'Reward is Unlocked and ready to use!'}
              </Text>
            </View>

            {/* CTA Actions */}
            <View style={styles.modalCtaRow}>
              {getRewardState(previewItem) === 'UNLOCKED' && (
                <TouchableOpacity
                  style={[
                    styles.modalPrimaryBtn,
                    { backgroundColor: isWealth ? '#F59E0B' : '#EC4899' },
                  ]}
                  onPress={() => handleClaimReward(previewItem)}
                  disabled={claimLoading}
                >
                  {claimLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalPrimaryBtnText}>Claim Reward</Text>
                  )}
                </TouchableOpacity>
              )}

              {getRewardState(previewItem) === 'CLAIMED' && (
                <TouchableOpacity
                  style={[
                    styles.modalPrimaryBtn,
                    { backgroundColor: isWealth ? '#F59E0B' : '#EC4899' },
                  ]}
                  onPress={() => handleEquipReward(previewItem, true)}
                  disabled={claimLoading}
                >
                  {claimLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalPrimaryBtnText}>Equip Now</Text>
                  )}
                </TouchableOpacity>
              )}

              {getRewardState(previewItem) === 'EQUIPPED' && (
                <TouchableOpacity
                  style={styles.modalUnequipBtn}
                  onPress={() => handleEquipReward(previewItem, false)}
                  disabled={claimLoading}
                >
                  <Text style={styles.modalUnequipBtnText}>Unequip</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: "HOW TO UPGRADE?" EXPLANATION MODAL */}
      <Modal
        visible={showHowToUpgrade}
        transparent
        animationType="slide"
        onRequestClose={() => setShowHowToUpgrade(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setShowHowToUpgrade(false)}
          />
          <View style={styles.upgradeGuideCard}>
            <View style={styles.guideHeaderRow}>
              <Text style={styles.guideTitleText}>How to Upgrade Level?</Text>
              <TouchableOpacity
                onPress={() => setShowHowToUpgrade(false)}
                style={styles.modalCloseBtn}
              >
                <Icon name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {/* Wealth Rules */}
              <View style={styles.guideSection}>
                <View style={styles.guideSectionTitleRow}>
                  <MaterialCommunityIcons name="diamond-stone" size={18} color="#F59E0B" />
                  <Text style={[styles.guideSectionTitle, { color: '#FBBF24' }]}>
                    Wealth Level Progression
                  </Text>
                </View>
                <Text style={styles.guideRuleDesc}>
                  Earn Wealth EXP by spending Diamonds across the Yaro Platform:
                </Text>

                <View style={styles.guidePillRow}>
                  <View style={styles.guidePill}>
                    <Text style={styles.guidePillEmoji}>🎁</Text>
                    <Text style={styles.guidePillTitle}>Send Gifts</Text>
                    <Text style={styles.guidePillSub}>1 💎 Spent = 1 EXP</Text>
                  </View>
                  <View style={styles.guidePill}>
                    <Text style={styles.guidePillEmoji}>📞</Text>
                    <Text style={styles.guidePillTitle}>Voice Calls</Text>
                    <Text style={styles.guidePillSub}>1 💎 Spent = 1 EXP</Text>
                  </View>
                </View>

                <View style={[styles.guidePillRow, { marginTop: 8 }]}>
                  <View style={styles.guidePill}>
                    <Text style={styles.guidePillEmoji}>🛍️</Text>
                    <Text style={styles.guidePillTitle}>Store Purchases</Text>
                    <Text style={styles.guidePillSub}>1 💎 Spent = 1 EXP</Text>
                  </View>
                  <View style={styles.guidePill}>
                    <Text style={styles.guidePillEmoji}>👑</Text>
                    <Text style={styles.guidePillTitle}>VIP & SVIP</Text>
                    <Text style={styles.guidePillSub}>1 💎 Spent = 1 EXP</Text>
                  </View>
                </View>
              </View>

              {/* Charm Rules */}
              <View style={[styles.guideSection, { marginTop: 18 }]}>
                <View style={styles.guideSectionTitleRow}>
                  <Text style={{ fontSize: 16 }}>🌸</Text>
                  <Text style={[styles.guideSectionTitle, { color: '#F472B6' }]}>
                    Charm Level Progression
                  </Text>
                </View>
                <Text style={styles.guideRuleDesc}>
                  Earn Charm EXP by receiving engagement, gifts, and hosting calls:
                </Text>

                <View style={styles.guidePillRow}>
                  <View style={styles.guidePill}>
                    <Text style={styles.guidePillEmoji}>💝</Text>
                    <Text style={styles.guidePillTitle}>Receive Gifts</Text>
                    <Text style={styles.guidePillSub}>1 💎 Gifted = 1 EXP</Text>
                  </View>
                  <View style={styles.guidePill}>
                    <Text style={styles.guidePillEmoji}>🎙️</Text>
                    <Text style={styles.guidePillTitle}>Receive Calls</Text>
                    <Text style={styles.guidePillSub}>Earn Coins & Minutes</Text>
                  </View>
                </View>

                <View style={[styles.guidePillRow, { marginTop: 8 }]}>
                  <View style={styles.guidePill}>
                    <Text style={styles.guidePillEmoji}>✨</Text>
                    <Text style={styles.guidePillTitle}>Room Interaction</Text>
                    <Text style={styles.guidePillSub}>Mic Time & Popularity</Text>
                  </View>
                  <View style={styles.guidePill}>
                    <Text style={styles.guidePillEmoji}>🎉</Text>
                    <Text style={styles.guidePillTitle}>Party Events</Text>
                    <Text style={styles.guidePillSub}>Host Voice Rooms</Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              onPress={() => setShowHowToUpgrade(false)}
              style={styles.guideDismissBtn}
              activeOpacity={0.85}
            >
              <Text style={styles.guideDismissBtnText}>Got It</Text>
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
    backgroundColor: '#0A0518',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  helpHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Segmented Tabs
  tabsContainer: {
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 12,
  },
  tabTrack: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 16,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    borderRadius: 13,
    overflow: 'hidden',
  },
  tabButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  tabButtonActiveWealth: {
    shadowColor: '#F59E0B',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  tabButtonActiveCharm: {
    shadowColor: '#EC4899',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  tabButtonText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
  tabButtonTextActiveWealth: {
    color: '#0F172A',
    fontWeight: '900',
  },
  tabButtonTextActiveCharm: {
    color: '#FFFFFF',
    fontWeight: '900',
  },

  scrollContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 6,
  },

  // Top Hero Progression Card
  heroCard: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 1.2,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 20,
  },
  heroAmbientGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    top: -60,
    right: -40,
  },
  heroUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarRingWrapper: {
    position: 'relative',
    marginRight: 14,
  },
  avatarRingGradient: {
    width: 66,
    height: 66,
    borderRadius: 22,
    padding: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 19.5,
  },
  heroLevelPill: {
    position: 'absolute',
    bottom: -6,
    alignSelf: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  heroLevelPillText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '900',
  },
  heroMetaCol: {
    flex: 1,
  },
  heroTierBadgeRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  heroTierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  heroTierBadgeIcon: {
    fontSize: 11,
    marginRight: 4,
  },
  heroTierBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  heroUserName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  heroLevelTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    marginTop: 2,
  },
  howToUpgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 0.8,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  howToUpgradeText: {
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 3,
  },

  // Progress Bar Details
  progressSection: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 0.8,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  progressLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 7,
  },
  currentExpLabel: {
    color: '#94A3B8',
    fontSize: 11.5,
    fontWeight: '700',
  },
  currentExpValue: {
    fontSize: 12,
    fontWeight: '900',
  },
  progressBarTrack: {
    height: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  remainingExpRow: {
    marginTop: 6,
  },
  remainingExpText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },

  // Sections
  journeyBody: {
    marginTop: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#FBBF24',
    fontSize: 11.5,
    fontWeight: '900',
    letterSpacing: 1,
  },
  sectionSubtitle: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },

  // Ranges Scroll
  rangesScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  rangePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  rangePillCurrent: {
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  rangePillSelected: {
    backgroundColor: '#F59E0B',
    borderColor: '#FBBF24',
  },
  rangePillText: {
    color: '#94A3B8',
    fontSize: 11.5,
    fontWeight: '700',
  },
  rangePillTextCurrent: {
    color: '#FBBF24',
    fontWeight: '800',
  },
  rangePillTextSelected: {
    color: '#0F172A',
    fontWeight: '900',
  },
  rangeCurrentDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FBBF24',
    marginLeft: 5,
  },

  // Wealth Badges Horizontal Scroll
  badgesScroll: {
    gap: 12,
    paddingVertical: 4,
  },
  badgeCard: {
    width: 115,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 18,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  cardLocked: {
    opacity: 0.65,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardCurrentTier: {
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  currentTierRibbon: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
  },
  currentTierRibbonText: {
    color: '#0F172A',
    fontSize: 7.5,
    fontWeight: '900',
  },
  badgeArtworkBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  badgeLevelText: {
    color: '#FBBF24',
    fontSize: 11.5,
    fontWeight: '900',
    marginTop: 2,
  },
  badgeNameText: {
    color: '#E2E8F0',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 2,
  },
  badgeActionBox: {
    marginTop: 8,
    width: '100%',
  },
  stateTagLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
  },
  stateTagTextLocked: {
    color: '#94A3B8',
    fontSize: 9.5,
    fontWeight: '700',
  },
  claimMiniBtn: {
    backgroundColor: '#F59E0B',
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  claimMiniBtnText: {
    color: '#0F172A',
    fontSize: 10,
    fontWeight: '900',
  },
  equipMiniBtn: {
    backgroundColor: 'transparent',
    paddingVertical: 3,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  equipMiniBtnText: {
    color: '#FBBF24',
    fontSize: 10,
    fontWeight: '800',
  },
  stateTagEquipped: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
  },
  stateTagTextEquipped: {
    color: '#34D399',
    fontSize: 9.5,
    fontWeight: '800',
  },

  // Category Pills
  categoryPillsScroll: {
    gap: 8,
    marginBottom: 14,
  },
  catPill: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 0.8,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  catPillActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#FBBF24',
  },
  catPillText: {
    color: '#94A3B8',
    fontSize: 11.5,
    fontWeight: '700',
  },
  catPillTextActive: {
    color: '#0F172A',
    fontWeight: '900',
  },

  // Responsive Rewards Grid
  rewardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  rewardGridCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.18)',
    marginBottom: 2,
  },
  rewardCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rewardLevelReqPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  rewardLevelReqText: {
    color: '#92400E',
    fontSize: 9.5,
    fontWeight: '900',
  },
  rewardDurationTag: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },
  rewardArtContainer: {
    width: '100%',
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  rewardItemName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  rewardItemCategory: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  rewardCardActionRow: {
    marginTop: 10,
  },
  rewardActionLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  rewardActionLockedText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
  },
  rewardActionClaimBtn: {
    backgroundColor: '#F59E0B',
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
  },
  rewardActionClaimText: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '900',
  },
  rewardActionEquipBtn: {
    backgroundColor: 'transparent',
    paddingVertical: 5.5,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  rewardActionEquipText: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '800',
  },
  rewardActionEquippedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  rewardActionEquippedText: {
    color: '#34D399',
    fontSize: 10.5,
    fontWeight: '800',
  },

  // Charm Milestones
  charmMilestonesScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  charmMilestonePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  charmMilestonePillSelected: {
    backgroundColor: '#EC4899',
    borderColor: '#F472B6',
  },
  charmMilestonePillCurrent: {
    borderColor: '#F43F5E',
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
  },
  charmMilestoneText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  charmMilestoneTextSelected: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  charmMilestoneTextCurrent: {
    color: '#F43F5E',
    fontWeight: '900',
  },
  charmCurrentIndicator: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#F43F5E',
    marginLeft: 5,
  },

  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(7, 3, 18, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  previewCard: {
    width: '100%',
    maxWidth: 350,
    backgroundColor: '#170E2E',
    borderRadius: 28,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  modalCloseBtn: {
    alignSelf: 'flex-end',
    padding: 4,
  },
  previewModalKicker: {
    color: '#FBBF24',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginTop: -8,
  },
  enlargedArtworkBox: {
    width: 140,
    height: 140,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  previewTitleText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  previewCategoryText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  previewDescText: {
    color: '#CBD5E1',
    fontSize: 11.5,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  previewStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    marginTop: 14,
    gap: 8,
    width: '100%',
  },
  previewStatusBannerLocked: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  previewStatusBannerUnlocked: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  previewStatusBannerText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  modalCtaRow: {
    width: '100%',
    marginTop: 16,
  },
  modalPrimaryBtn: {
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    width: '100%',
  },
  modalPrimaryBtnText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
  },
  modalUnequipBtn: {
    paddingVertical: 11,
    borderRadius: 14,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: '#94A3B8',
  },
  modalUnequipBtnText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '800',
  },

  // "How to upgrade" Guide Card
  upgradeGuideCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#160B2C',
    borderRadius: 26,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  guideHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  guideTitleText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },
  guideSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 0.8,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  guideSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  guideSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  guideRuleDesc: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 10,
  },
  guidePillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  guidePill: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
  },
  guidePillEmoji: {
    fontSize: 18,
    marginBottom: 2,
  },
  guidePillTitle: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
  },
  guidePillSub: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 1,
  },
  guideDismissBtn: {
    backgroundColor: '#7C3AED',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 14,
  },
  guideDismissBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
});
