import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import SvipPrivilegeModal from '../../components/membership/SvipPrivilegeModal';
import SvipHelpModal from '../../components/membership/SvipHelpModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthProvider';
import { AlertService } from '../../utils/AlertService';
import { apiUtil } from '../../utils/apiUtil';
import { formatCompactBalance } from '../../utils/numberUtil';
import { getUserAvatar } from '../../utils/avatarUtil';

const { width } = Dimensions.get('window');

// 28 Official Nobility Privileges strictly matching Screenshot 1
const ALL_NOBILITY_PRIVILEGES = [
  { key: 'rank_the_top', title: 'Rank the Top', icon: 'arrow-up-circle-outline', desc: 'Pin your profile to the top of room visitors and ranking boards.' },
  { key: 'colorful_nickname', title: 'Colorful Nickname', icon: 'color-palette-outline', desc: 'Unlock shimmering colorful gradient nickname across all rooms.' },
  { key: 'view_more_visitors', title: 'View More visitors', icon: 'search-outline', desc: 'View up to 1,000 visitors who visited your profile.' },
  { key: 'special_room_entry', title: 'Special Room Entry', icon: 'car-sport-outline', desc: 'Animated sports car and dragon room entrance banner.' },
  { key: 'unlimited_message', title: 'Unlimited message', icon: 'chatbubbles-outline', desc: 'Send unlimited chat messages with zero room cooldown.' },
  { key: 'unlock_more_room_mic', title: 'Unlock More Room Mic', icon: 'mic-circle-outline', desc: 'Unlock 25+ microphone seats in your personal rooms.' },
  { key: 'send_pictures_private_chat', title: 'Send pictures in private chat', icon: 'image-outline', desc: 'Send HD pictures and media in private messages.' },
  { key: 'modify_profile_gender', title: 'Modify Profile Gender', icon: 'swap-horizontal-outline', desc: 'Freedom to change profile gender identity anytime.' },
  { key: 'hide_last_online', title: 'Hide Last Online', icon: 'time-outline', desc: 'Hide your last seen and active online status.' },
  { key: 'profile_vehicle', title: 'Profile Vehicle', icon: 'car-outline', desc: 'Equip exclusive 3D luxury sports car on profile card.' },
  { key: 'anti_tracking', title: 'Anti-Tracking', icon: 'shield-outline', desc: 'Prevent others from tracking which voice room you are in.' },
  { key: 'send_pictures_chat_room', title: 'Send Pictures in Chat Room', icon: 'images-outline', desc: 'Post photos and memes directly into room public chat.' },
  { key: 'customized_profile_bg', title: 'Customized Profile Background', icon: 'card-outline', desc: 'Upload custom animated themes and covers for your profile.' },
  { key: 'gif_avatar', title: 'Gif Avatar', icon: 'play-circle-outline', desc: 'Set animated GIF / MP4 profile picture.' },
  { key: 'level_exp_speedup', title: 'Level experience speed up', icon: 'trending-up-outline', desc: 'Earn 1.5x to 3x level experience points on all activities.' },
  { key: 'svip_customized_gift', title: 'SVIP Customized Gift', icon: 'gift-outline', desc: 'Design your own custom luxury animated gift.' },
  { key: 'id_freeze_protection', title: '15-day Special ID freeze', icon: 'lock-closed-outline', desc: 'Freeze vanity display ID for 15 days upon expiration.' },
  { key: 'hide_online_status', title: 'Hide Online Status', icon: 'eye-off-outline', desc: 'Browse the entire application completely invisible.' },
  { key: 'anti_kick', title: 'Anti-Kick', icon: 'exit-outline', desc: 'Immunity against room kicks from ordinary moderators.' },
  { key: 'upgrade_app_notification', title: 'Upgrade App-wide Notification', icon: 'megaphone-outline', desc: 'App-wide golden broadcast marquee when entering or gifting.' },
  { key: 'unique_3_digit_sid', title: 'Unique 3-digit SID', icon: 'keypad-outline', desc: 'Claim prestigious 3-digit vanity display ID.' },
  { key: 'unban_account', title: 'Unban Account', icon: 'refresh-circle-outline', desc: 'One-time priority appeal and unban privilege.' },
  { key: 'anti_ban_chatting', title: 'Anti-ban from Chatting', icon: 'chatbox-ellipses-outline', desc: 'Protection against automated chat flood restrictions.' },
  { key: 'badge_svip_achievement', title: 'Badge of SVIP Achievement', icon: 'ribbon-outline', desc: 'Permanent shiny metal SVIP medal in profile showcase.' },
  { key: 'anonymous_ranking', title: 'Anonymous Ranking', icon: 'glasses-outline', desc: 'Hide username on daily, weekly, and monthly contributor boards.' },
  { key: 'customized_start_page', title: 'Customized Start-up Page', icon: 'phone-portrait-outline', desc: 'Noble startup splash screen greeting.' },
  { key: 'ban_account_power', title: 'Ban Account', icon: 'hammer-outline', desc: 'Report with 5x priority moderation review.' },
  { key: 'unique_2_digit_sid', title: 'Unique 2-digit SID', icon: 'finger-print-outline', desc: 'Super rare 2-digit vanity ID reserve.' },
  { key: 'room_secret_lord', title: 'Room Secret Lord', icon: 'eye-outline', desc: 'Stealth room entrance without alerting regular guests.' },
];

// Dedicated SVIP Assets
const SVIP4_BADGE = require('../../assets/svip/svip4_badge.png');
const SVIP5_BADGE = require('../../assets/svip/svip5_badge.png');
const VIP4_CHAT_BUBBLE = require('../../assets/svip/chat_bubble_vip4.png');
const SVIP3_TAG = require('../../assets/svip/svip3_tag.png');

// Dedicated SVIP Tiers (SVIP+ to SVIP 5)
const SVIP_TIERS = [
  {
    id: 'vip-plus',
    slug: 'vip-plus',
    level: 0,
    tabLabel: 'SVIP+',
    ribbonLabel: 'SVIP+',
    name: 'VIP+ Lynx',
    price: 49000,
    originalPrice: 75000,
    discount: '35% OFF',
    tagText: 'VIP+',
    tagColors: ['#3B82F6', '#1D4ED8'],
    bubbleColors: ['#1E3A8A', '#1E40AF'],
    previewOptions: ['tag', 'bubble'],
    privilegeKeys: [
      'rank_the_top', 'colorful_nickname', 'view_more_visitors',
      'special_room_entry', 'unlimited_message', 'unlock_more_room_mic',
      'send_pictures_private_chat', 'modify_profile_gender', 'hide_last_online',
      'profile_vehicle', 'anti_tracking', 'send_pictures_chat_room',
      'customized_profile_bg', 'gif_avatar', 'level_exp_speedup',
      'svip_customized_gift', 'id_freeze_protection', 'hide_online_status',
      'anti_kick', 'upgrade_app_notification', 'unique_3_digit_sid',
      'unban_account', 'anti_ban_chatting', 'badge_svip_achievement',
      'anonymous_ranking', 'customized_start_page', 'ban_account_power',
      'unique_2_digit_sid', 'room_secret_lord'
    ],
  },
  {
    id: 'svip-1',
    slug: 'svip-1',
    level: 1,
    tabLabel: 'SVIP1',
    ribbonLabel: 'SVIP 1',
    name: 'SVIP 1 Knight',
    price: 99000,
    originalPrice: 150000,
    discount: '34% OFF',
    tagText: 'SVIP 1',
    tagColors: ['#F59E0B', '#D97706'],
    bubbleColors: ['#451A03', '#78350F'],
    frameColors: ['#F59E0B', '#FBBF24'],
    previewOptions: ['tag', 'bubble', 'frame'], // "SVIP 1 Me ek Option Frame Ka Add HO Jayega"
    privilegeKeys: [
      'rank_the_top', 'colorful_nickname', 'view_more_visitors',
      'special_room_entry', 'unlimited_message', 'unlock_more_room_mic',
      'send_pictures_private_chat', 'modify_profile_gender', 'hide_last_online',
      'profile_vehicle', 'anti_tracking', 'send_pictures_chat_room',
      'customized_profile_bg', 'gif_avatar', 'level_exp_speedup',
      'svip_customized_gift', 'id_freeze_protection', 'hide_online_status',
      'anti_kick', 'upgrade_app_notification', 'unique_3_digit_sid',
      'unban_account', 'anti_ban_chatting', 'badge_svip_achievement',
      'anonymous_ranking', 'customized_start_page', 'ban_account_power',
      'unique_2_digit_sid', 'room_secret_lord'
    ],
  },
  {
    id: 'svip-2',
    slug: 'svip-2',
    level: 2,
    tabLabel: 'SVIP2',
    ribbonLabel: 'SVIP 2',
    name: 'SVIP 2 Count',
    price: 180000,
    originalPrice: 270000,
    discount: '33% OFF',
    tagText: 'SVIP 2',
    tagColors: ['#A855F7', '#7C3AED'],
    bubbleColors: ['#3B0764', '#581C87'],
    frameColors: ['#C084FC', '#A855F7'],
    previewOptions: ['tag', 'bubble', 'frame'], // "SVIP2 me 1 Jaisa Hi Rahega"
    privilegeKeys: [
      'rank_the_top', 'colorful_nickname', 'view_more_visitors',
      'special_room_entry', 'unlimited_message', 'unlock_more_room_mic',
      'send_pictures_private_chat', 'modify_profile_gender', 'hide_last_online',
      'profile_vehicle', 'anti_tracking', 'send_pictures_chat_room',
      'customized_profile_bg', 'gif_avatar', 'level_exp_speedup',
      'svip_customized_gift', 'id_freeze_protection', 'hide_online_status',
      'anti_kick', 'upgrade_app_notification', 'unique_3_digit_sid',
      'unban_account', 'anti_ban_chatting', 'badge_svip_achievement',
      'anonymous_ranking', 'customized_start_page', 'ban_account_power',
      'unique_2_digit_sid', 'room_secret_lord'
    ],
  },
  {
    id: 'svip-3',
    slug: 'svip-3',
    level: 3,
    tabLabel: 'SVIP3',
    ribbonLabel: 'SVIP 3',
    name: 'SVIP 3 Duke',
    price: 350000,
    originalPrice: 500000,
    discount: '30% OFF',
    tagText: 'SVIP 3',
    tagImage: SVIP3_TAG, // "svip 3 wala tag hai"
    tagColors: ['#06B6D4', '#0284C7'],
    bubbleColors: ['#082F49', '#0369A1'],
    frameColors: ['#38BDF8', '#0284C7'],
    roomCardColors: ['#1E1B4B', '#4338CA'],
    previewOptions: ['tag', 'bubble', 'frame', 'room_card'], // "SVIP 3 Me Room Personal Card Add Hoga"
    privilegeKeys: [
      'rank_the_top', 'colorful_nickname', 'view_more_visitors',
      'special_room_entry', 'unlimited_message', 'unlock_more_room_mic',
      'send_pictures_private_chat', 'modify_profile_gender', 'hide_last_online',
      'profile_vehicle', 'anti_tracking', 'send_pictures_chat_room',
      'customized_profile_bg', 'gif_avatar', 'level_exp_speedup',
      'svip_customized_gift', 'id_freeze_protection', 'hide_online_status',
      'anti_kick', 'upgrade_app_notification', 'unique_3_digit_sid',
      'unban_account', 'anti_ban_chatting', 'badge_svip_achievement',
      'anonymous_ranking', 'customized_start_page', 'ban_account_power',
      'unique_2_digit_sid', 'room_secret_lord'
    ],
  },
  {
    id: 'svip-4',
    slug: 'svip-4',
    level: 4,
    tabLabel: 'SVIP4',
    ribbonLabel: 'SVIP 4',
    name: 'SVIP 4 Monarch',
    price: 700000,
    originalPrice: 1000000,
    discount: '30% OFF',
    heroBadge: SVIP4_BADGE, // "SVIP Me ye Badge Rakho"
    tagText: 'SVIP 4',
    tagColors: ['#EF4444', '#DC2626'],
    bubbleImage: VIP4_CHAT_BUBBLE, // "vip 4 wala chat Bubble hai"
    bubbleColors: ['#450A0A', '#7F1D1D'],
    frameColors: ['#F43F5E', '#E11D48'],
    roomCardColors: ['#4C0519', '#881337'],
    micColors: ['#EF4444', '#F59E0B', '#DC2626'],
    previewOptions: ['tag', 'bubble', 'frame', 'room_card', 'mic_theme'], // "SVIP 4 Me Luxury Mic Theme Ye option Add Hoga"
    privilegeKeys: [
      'rank_the_top', 'colorful_nickname', 'view_more_visitors',
      'special_room_entry', 'unlimited_message', 'unlock_more_room_mic',
      'send_pictures_private_chat', 'modify_profile_gender', 'hide_last_online',
      'profile_vehicle', 'anti_tracking', 'send_pictures_chat_room',
      'customized_profile_bg', 'gif_avatar', 'level_exp_speedup',
      'svip_customized_gift', 'id_freeze_protection', 'hide_online_status',
      'anti_kick', 'upgrade_app_notification', 'unique_3_digit_sid',
      'unban_account', 'anti_ban_chatting', 'badge_svip_achievement',
      'anonymous_ranking', 'customized_start_page', 'ban_account_power',
      'unique_2_digit_sid', 'room_secret_lord'
    ],
  },
  {
    id: 'svip-5',
    slug: 'svip-5',
    level: 5,
    tabLabel: 'SVIP5',
    ribbonLabel: 'SVIP 5',
    name: 'SVIP 5 Sovereign Supreme',
    price: 1500000,
    originalPrice: 2250000,
    discount: '33% OFF',
    heroBadge: SVIP5_BADGE, // Sovereign Lion Crest Badge
    badgeImage: SVIP5_BADGE, // "SVIP 5 Me Niche Bhi Badge Option Add Hoga"
    tagText: 'SVIP 5',
    tagColors: ['#F59E0B', '#D97706'],
    bubbleColors: ['#4C1D95', '#7C3AED'],
    frameColors: ['#FDE047', '#EAB308'],
    roomCardColors: ['#3B0764', '#1E1B4B'],
    micColors: ['#FDE047', '#EAB308', '#CA8A04', '#A855F7'],
    badgeColors: ['#FBBF24', '#D97706', '#78350F'],
    previewOptions: ['tag', 'bubble', 'frame', 'room_card', 'mic_theme', 'badge'], // "SVIP 5 Me Niche Bhi Badge Option Add Hoga"
    privilegeKeys: [
      'rank_the_top', 'colorful_nickname', 'view_more_visitors',
      'special_room_entry', 'unlimited_message', 'unlock_more_room_mic',
      'send_pictures_private_chat', 'modify_profile_gender', 'hide_last_online',
      'profile_vehicle', 'anti_tracking', 'send_pictures_chat_room',
      'customized_profile_bg', 'gif_avatar', 'level_exp_speedup',
      'svip_customized_gift', 'id_freeze_protection', 'hide_online_status',
      'anti_kick', 'upgrade_app_notification', 'unique_3_digit_sid',
      'unban_account', 'anti_ban_chatting', 'badge_svip_achievement',
      'anonymous_ranking', 'customized_start_page', 'ban_account_power',
      'unique_2_digit_sid', 'room_secret_lord'
    ],
  },
];

export default function SVIPScreen() {
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 16);
  const navigation = useNavigation();
  const { user, fetchUserProfile } = useContext(AuthContext);

  const [activeTierId, setActiveTierId] = useState('vip-plus');
  const [selectedPrivilege, setSelectedPrivilege] = useState(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const currentTier = SVIP_TIERS.find((t) => t.id === activeTierId) || SVIP_TIERS[0];
  const userDiamonds = Number(user?.diamonds || 0);

  // Filter privileges active for current tier
  const tierPrivileges = ALL_NOBILITY_PRIVILEGES.filter((p) =>
    currentTier.privilegeKeys.includes(p.key)
  );

  const handlePurchase = async () => {
    if (userDiamonds < currentTier.price) {
      AlertService.show(
        'Insufficient Diamonds',
        `You need ${formatCompactBalance(currentTier.price)} 💎 to activate ${currentTier.name}.`,
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

        <Text style={styles.headerTitle}>SVIP</Text>

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
        {SVIP_TIERS.map((tier) => {
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
      >
        {/* Noble Mascot Emblem Ring / Hero Badge ("SVIP Me ye Badge Rakho") */}
        <View style={styles.mascotEmblemContainer}>
          {currentTier.heroBadge ? (
            <View style={styles.heroBadgeBox}>
              <Image
                source={currentTier.heroBadge}
                style={styles.heroBadgeImage}
                resizeMode="contain"
              />
            </View>
          ) : (
            <>
              {/* Metallic Silver/Gold Medallion Ring */}
              <LinearGradient
                colors={['#E2E8F0', '#94A3B8', '#CBD5E1', '#64748B']}
                style={styles.mascotRingBorder}
              >
                <LinearGradient
                  colors={['#1E3A8A', '#172554', '#0F172A']}
                  style={styles.mascotRingInner}
                >
                  {/* Lynx / Noble Mascot Portrait */}
                  <Image
                    source={getUserAvatar(user)}
                    style={styles.mascotImage}
                    resizeMode="cover"
                  />
                </LinearGradient>
              </LinearGradient>

              {/* Curved 3D Metallic Blue/Gold Ribbon */}
              <LinearGradient
                colors={['#1E40AF', '#2563EB', '#3B82F6', '#1E3A8A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ribbonBadge}
              >
                <Text style={styles.ribbonText}>{currentTier.ribbonLabel}</Text>
              </LinearGradient>
            </>
          )}
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
            {/* 1. SVIP Tag */}
            {currentTier.previewOptions?.includes('tag') && (
              <View style={styles.previewCard}>
                <View style={styles.previewCardInner}>
                  {currentTier.tagImage ? (
                    <View style={styles.tagImageWrap}>
                      <Image source={currentTier.tagImage} style={styles.tagCustomImage} resizeMode="contain" />
                    </View>
                  ) : (
                    <LinearGradient
                      colors={currentTier.tagColors || ['#3B82F6', '#1D4ED8']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.tagPillPreview}
                    >
                      <Text style={styles.tagPillText}>🐱 {currentTier.tagText}</Text>
                    </LinearGradient>
                  )}
                  <Text style={styles.previewCardLabel}>SVIP Tag</Text>
                </View>
              </View>
            )}

            {/* 2. SVIP Bubble */}
            {currentTier.previewOptions?.includes('bubble') && (
              <View style={styles.previewCard}>
                <View style={styles.previewCardInner}>
                  {currentTier.bubbleImage ? (
                    <View style={styles.bubbleImageWrap}>
                      <Image source={currentTier.bubbleImage} style={styles.bubbleCustomImage} resizeMode="contain" />
                    </View>
                  ) : (
                    <LinearGradient
                      colors={currentTier.bubbleColors || ['#1E3A8A', '#1E40AF']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.bubblePreview}
                    >
                      <View style={styles.bubbleCornerGold} />
                      <Text style={styles.bubblePreviewText}>Chat ✨</Text>
                    </LinearGradient>
                  )}
                  <Text style={styles.previewCardLabel}>SVIP Bubble</Text>
                </View>
              </View>
            )}

            {/* 3. Frame ("SVIP 1 Me ek Option Frame Ka Add HO Jayega", "SVIP2 me 1 Jaisa Hi Rahega") */}
            {currentTier.previewOptions?.includes('frame') && (
              <View style={styles.previewCard}>
                <View style={styles.previewCardInner}>
                  <View style={styles.framePreviewWrap}>
                    <LinearGradient
                      colors={currentTier.frameColors || ['#F59E0B', '#FBBF24']}
                      style={styles.frameOuterRing}
                    >
                      <View style={styles.frameInnerHole}>
                        <Image source={getUserAvatar(user)} style={styles.frameAvatarImg} resizeMode="cover" />
                      </View>
                    </LinearGradient>
                    <MaterialCommunityIcons name="crown" size={13} color="#FDE047" style={styles.frameCrownIcon} />
                  </View>
                  <Text style={styles.previewCardLabel}>Frame</Text>
                </View>
              </View>
            )}

            {/* 4. Room Personal Card ("SVIP 3 Me Room Personal Card Add Hoga") */}
            {currentTier.previewOptions?.includes('room_card') && (
              <View style={styles.previewCard}>
                <View style={styles.previewCardInner}>
                  <LinearGradient
                    colors={currentTier.roomCardColors || ['#1E1B4B', '#4338CA']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.roomCardPreview}
                  >
                    <View style={styles.roomCardTopRow}>
                      <MaterialCommunityIcons name="home-sound-in-out" size={14} color="#FDE047" />
                      <Text style={styles.roomCardIdText}>ID: 8888</Text>
                    </View>
                    <View style={styles.roomCardWaveRow}>
                      <View style={[styles.roomCardWaveBar, { height: 6 }]} />
                      <View style={[styles.roomCardWaveBar, { height: 11 }]} />
                      <View style={[styles.roomCardWaveBar, { height: 8 }]} />
                      <View style={[styles.roomCardWaveBar, { height: 12 }]} />
                    </View>
                  </LinearGradient>
                  <Text style={styles.previewCardLabel}>Room Card</Text>
                </View>
              </View>
            )}

            {/* 5. Luxury Mic Theme ("SVIP 4 Me Luxury Mic Theme Ye option Add Hoga") */}
            {currentTier.previewOptions?.includes('mic_theme') && (
              <View style={styles.previewCard}>
                <View style={styles.previewCardInner}>
                  <View style={styles.micThemeWrap}>
                    <LinearGradient
                      colors={currentTier.micColors || ['#EF4444', '#F59E0B']}
                      style={styles.micCircleGlow}
                    >
                      <MaterialCommunityIcons name="microphone-variant" size={16} color="#FFF" />
                    </LinearGradient>
                    <View style={styles.micWaveRingOuter} />
                  </View>
                  <Text style={styles.previewCardLabel}>Luxury Mic</Text>
                </View>
              </View>
            )}

            {/* 6. Badge ("SVIP 5 Me Niche Bhi Badge Option Add Hoga") */}
            {currentTier.previewOptions?.includes('badge') && (
              <View style={styles.previewCard}>
                <View style={styles.previewCardInner}>
                  <View style={styles.badgeOptionWrap}>
                    <Image
                      source={currentTier.badgeImage || SVIP5_BADGE}
                      style={styles.badgeOptionImage}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={styles.previewCardLabel}>Badge</Text>
                </View>
              </View>
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
            {formatCompactBalance(currentTier.price)} 💎
            <Text style={styles.priceDuration}> / 30d</Text>
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
          onClose={() => setSelectedPrivilege(null)}
        />
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <SvipHelpModal
          visible={showHelpModal}
          onClose={() => setShowHelpModal(false)}
        />
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
    height: 145,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 10,
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
});
