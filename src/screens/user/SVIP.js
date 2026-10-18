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

// Dedicated SVIP Tiers (Strictly NO King of Kings mixed here)
const SVIP_TIERS = [
  {
    id: 'vip-plus',
    slug: 'vip-plus',
    level: 0,
    tabLabel: 'VIP+',
    ribbonLabel: 'VIP+',
    name: 'VIP+ Lynx',
    price: 49000,
    originalPrice: 75000,
    discount: '35% OFF',
    tagText: 'VIP+',
    tagColors: ['#3B82F6', '#1D4ED8'],
    bubbleColors: ['#1E3A8A', '#1E40AF'],
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
    tagColors: ['#06B6D4', '#0284C7'],
    bubbleColors: ['#082F49', '#0369A1'],
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

      {/* Horizontal Tabs: VIP+ | SVIP1 | SVIP2 | SVIP3 matching Screenshot 1 */}
      <View style={styles.tierTabsContainer}>
        {SVIP_TIERS.map((tier) => {
          const isActive = tier.id === activeTierId;
          return (
            <TouchableOpacity
              key={tier.id}
              style={[styles.tierTab, isActive && styles.tierTabActive]}
              onPress={() => setActiveTierId(tier.id)}
              activeOpacity={0.8}
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
        {/* Noble Mascot Emblem Ring matching Screenshot 1 */}
        <View style={styles.mascotEmblemContainer}>
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
                source={require('../../assets/images/user1.png')}
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
        </View>

        {/* Two Preview Cards: SVIP Tag & SVIP Bubble matching Screenshot 1 */}
        <View style={styles.tagBubbleRow}>
          {/* Card 1: SVIP Tag */}
          <View style={styles.previewCard}>
            <View style={styles.previewCardInner}>
              <LinearGradient
                colors={currentTier.tagColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.tagPillPreview}
              >
                <Text style={styles.tagPillText}>🐱 {currentTier.tagText}</Text>
              </LinearGradient>
              <Text style={styles.previewCardLabel}>SVIP Tag</Text>
            </View>
          </View>

          {/* Card 2: SVIP Bubble */}
          <View style={styles.previewCard}>
            <View style={styles.previewCardInner}>
              <LinearGradient
                colors={currentTier.bubbleColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.bubblePreview}
              >
                <View style={styles.bubbleCornerGold} />
                <Text style={styles.bubblePreviewText}>Chat ✨</Text>
              </LinearGradient>
              <Text style={styles.previewCardLabel}>SVIP Bubble</Text>
            </View>
          </View>
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
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(251, 191, 36, 0.15)',
    zIndex: 10,
  },
  tierTab: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  tierTabActive: {},
  tierTabText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
  },
  tierTabTextActive: {
    color: '#FDE047',
    fontWeight: '900',
  },
  tierActiveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FDE047',
    marginTop: 4,
  },
  scrollContent: {
    alignItems: 'center',
    paddingTop: 16,
  },
  mascotEmblemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    position: 'relative',
    zIndex: 5,
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
  tagBubbleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    width: '92%',
    marginTop: 20,
    marginBottom: 20,
  },
  previewCard: {
    flex: 1,
    height: 105,
    borderRadius: 18,
    backgroundColor: 'rgba(30, 20, 10, 0.75)',
    borderWidth: 1.2,
    borderColor: 'rgba(251, 191, 36, 0.25)',
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
  tagPillPreview: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 8,
  },
  tagPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  bubblePreview: {
    width: '84%',
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#60A5FA',
    justifyContent: 'center',
    paddingHorizontal: 8,
    marginTop: 8,
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
    fontSize: 10.5,
    fontWeight: '700',
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
