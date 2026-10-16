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
import { AlertService } from '../../utils/AlertService';
import { apiUtil } from '../../utils/apiUtil';
import { formatCompactBalance } from '../../utils/numberUtil';

const { width } = Dimensions.get('window');

// Fallback Nobility tiers matching screenshot 2
const FALLBACK_KING_TIERS = [
  {
    tierKey: 'knight',
    name: 'Knight',
    level: 1,
    title: 'Imperial Knight',
    coinsPrice: 99000,
    dailyRewardCoins: 1000,
    durationDays: 30,
    rewardCount: 7,
    totalRewards: 11,
    privilegeCount: 4,
    totalPrivileges: 13,
    heroBadgeUrl: 'https://cdn-icons-png.flaticon.com/512/2583/2583344.png',
    rewards: [
      { key: 'daily_coins', name: 'Daily coins', desc: 'Claim 1,000 coins every day upon login', icon: 'cash', unlocked: true, previewUrl: '' },
      { key: 'notification_broadcast', name: 'Broadcast', desc: 'App-wide banner when entering rooms', icon: 'megaphone', unlocked: true, previewUrl: '' },
      { key: 'kings_logo', name: 'Logo', desc: 'Exclusive Knight heraldic emblem on profile', icon: 'shield-star', unlocked: true, previewUrl: '' },
      { key: 'kings_badge', name: 'Kings badge', desc: 'Dynamic glowing 3D Knight nobility badge', icon: 'medal', unlocked: true, previewUrl: '' },
      { key: 'avatar_frame', name: 'Avatar frame', desc: 'Golden Winged Stag animated frame', icon: 'color-wand', unlocked: true, previewUrl: '' },
      { key: 'entry_effect', name: 'Entry effect', desc: 'Royal golden sports car arrival effect', icon: 'car-sport', unlocked: true, previewUrl: '' },
      { key: 'barrage', name: 'Barrage', desc: 'Golden bullet screen text in live party', icon: 'chatbubbles', unlocked: true, previewUrl: '' },
      { key: 'chat_bubble', name: 'Chat bubble', desc: 'Knight amber glass message bubble', icon: 'chatbubble-ellipses', unlocked: false, previewUrl: '' },
      { key: 'mic_seat_aura', name: 'Mic aura', desc: 'Floating golden aura when on mic seat', icon: 'radio', unlocked: false, previewUrl: '' },
      { key: 'profile_card', name: 'Profile theme', desc: 'Gold leaf prestige profile card background', icon: 'card', unlocked: false, previewUrl: '' },
      { key: 'custom_gift', name: 'Exclusive gift', desc: 'Send exclusive 3D animated nobility gifts', icon: 'gift', unlocked: false, previewUrl: '' },
    ],
    privileges: [
      { key: 'rank_the_top', name: 'Rank Top', desc: 'Priority pinning in room members and contributors', icon: 'trophy', unlocked: true },
      { key: 'colorful_nick', name: 'Color Nick', desc: 'Glowing animated gold nickname', icon: 'color-palette', unlocked: true },
      { key: 'more_visitors', name: 'Visitors', desc: 'View complete visitor footprints anonymously', icon: 'eye', unlocked: true },
      { key: 'unlimited_msg', name: 'Zero Cooldown', desc: 'Send room messages without cooldown delays', icon: 'flash', unlocked: true },
      { key: 'anti_kick', name: 'Anti-Kick', desc: 'Immune to room evictions and kicks', icon: 'shield-checkmark', unlocked: false },
      { key: 'vip_support', name: 'VIP Support', desc: '24/7 Priority Relationship Concierge', icon: 'headset', unlocked: false },
      { key: 'anti_tracking', name: 'Anti-Track', desc: 'Hide room presence and stealth browse', icon: 'glasses', unlocked: false },
      { key: 'unique_sid', name: 'Vanity SID', desc: 'Equip prestigious 3-digit nobility vanity ID', icon: 'key', unlocked: false },
      { key: 'room_lord', name: 'Secret Lord', desc: 'Authority over private hidden voice rooms', icon: 'lock-open', unlocked: false },
      { key: 'exp_speed', name: 'EXP Boost', desc: '2x Level EXP accelerator on gifts', icon: 'rocket', unlocked: false },
      { key: 'chat_immunity', name: 'Chat Immunity', desc: 'Immune to mute and chat restrictions', icon: 'volume-high', unlocked: false },
      { key: 'global_fanfare', name: 'Fanfare', desc: 'Soundtrack fanfare played when entering room', icon: 'musical-notes', unlocked: false },
      { key: 'noble_box', name: 'Noble Chest', desc: 'Monthly mystery chest containing rare frames', icon: 'cube', unlocked: false },
    ],
  },
  {
    tierKey: 'count',
    name: 'Count',
    level: 2,
    title: 'Royal Count',
    coinsPrice: 249000,
    dailyRewardCoins: 2500,
    durationDays: 30,
    rewardCount: 8,
    totalRewards: 11,
    privilegeCount: 6,
    totalPrivileges: 13,
    heroBadgeUrl: 'https://cdn-icons-png.flaticon.com/512/2583/2583319.png',
    rewards: [
      { key: 'daily_coins', name: 'Daily coins', desc: 'Claim 2,500 coins every day upon login', icon: 'cash', unlocked: true, previewUrl: '' },
      { key: 'notification_broadcast', name: 'Broadcast', desc: 'Count royal trumpet arrival announcement', icon: 'megaphone', unlocked: true, previewUrl: '' },
      { key: 'kings_logo', name: 'Logo', desc: 'Amethyst & Gold Count Coat of Arms', icon: 'shield-star', unlocked: true, previewUrl: '' },
      { key: 'kings_badge', name: 'Kings badge', desc: 'Shimmering Purple Crest Nobility Badge', icon: 'medal', unlocked: true, previewUrl: '' },
      { key: 'avatar_frame', name: 'Avatar frame', desc: 'Count Regal Amethyst Wings Frame', icon: 'color-wand', unlocked: true, previewUrl: '' },
      { key: 'entry_effect', name: 'Entry effect', desc: 'Supercar Phantom Entry with fireworks', icon: 'car-sport', unlocked: true, previewUrl: '' },
      { key: 'barrage', name: 'Barrage', desc: 'Purple neon bullet comments in room', icon: 'chatbubbles', unlocked: true, previewUrl: '' },
      { key: 'chat_bubble', name: 'Chat bubble', desc: 'Count Purple Velvet chat bubble', icon: 'chatbubble-ellipses', unlocked: true, previewUrl: '' },
      { key: 'mic_seat_aura', name: 'Mic aura', desc: 'Violet crystal pulsing mic aura', icon: 'radio', unlocked: false, previewUrl: '' },
      { key: 'profile_card', name: 'Profile theme', desc: 'Midnight amethyst nobility card theme', icon: 'card', unlocked: false, previewUrl: '' },
      { key: 'custom_gift', name: 'Exclusive gift', desc: 'Count Royal Crown 3D animated gift', icon: 'gift', unlocked: false, previewUrl: '' },
    ],
    privileges: [
      { key: 'rank_the_top', name: 'Rank Top', desc: 'Priority pinning in room members and contributors', icon: 'trophy', unlocked: true },
      { key: 'colorful_nick', name: 'Color Nick', desc: 'Dynamic purple-gold gradient nickname', icon: 'color-palette', unlocked: true },
      { key: 'more_visitors', name: 'Visitors', desc: 'View complete visitor footprints anonymously', icon: 'eye', unlocked: true },
      { key: 'unlimited_msg', name: 'Zero Cooldown', desc: 'Send room messages without cooldown delays', icon: 'flash', unlocked: true },
      { key: 'anti_kick', name: 'Anti-Kick', desc: 'Immune to room evictions and kicks', icon: 'shield-checkmark', unlocked: true },
      { key: 'vip_support', name: 'VIP Support', desc: 'Priority customer service queue', icon: 'headset', unlocked: true },
      { key: 'anti_tracking', name: 'Anti-Track', desc: 'Hide room presence and stealth browse', icon: 'glasses', unlocked: false },
      { key: 'unique_sid', name: 'Vanity SID', desc: 'Equip prestigious 3-digit nobility vanity ID', icon: 'key', unlocked: false },
      { key: 'room_lord', name: 'Secret Lord', desc: 'Authority over private hidden voice rooms', icon: 'lock-open', unlocked: false },
      { key: 'exp_speed', name: 'EXP Boost', desc: '2.5x Level EXP accelerator on gifts', icon: 'rocket', unlocked: false },
      { key: 'chat_immunity', name: 'Chat Immunity', desc: 'Immune to mute and chat restrictions', icon: 'volume-high', unlocked: false },
      { key: 'global_fanfare', name: 'Fanfare', desc: 'Soundtrack fanfare played when entering room', icon: 'musical-notes', unlocked: false },
      { key: 'noble_box', name: 'Noble Chest', desc: 'Monthly mystery chest containing rare frames', icon: 'cube', unlocked: false },
    ],
  },
  {
    tierKey: 'duke',
    name: 'Duke',
    level: 3,
    title: 'Sovereign Duke',
    coinsPrice: 499000,
    dailyRewardCoins: 6000,
    durationDays: 30,
    rewardCount: 9,
    totalRewards: 11,
    privilegeCount: 8,
    totalPrivileges: 13,
    heroBadgeUrl: 'https://cdn-icons-png.flaticon.com/512/2583/2583345.png',
    rewards: [
      { key: 'daily_coins', name: 'Daily coins', desc: 'Claim 6,000 coins every day upon login', icon: 'cash', unlocked: true, previewUrl: '' },
      { key: 'notification_broadcast', name: 'Broadcast', desc: 'Sovereign banner broadcast across the whole app', icon: 'megaphone', unlocked: true, previewUrl: '' },
      { key: 'kings_logo', name: 'Logo', desc: 'Ruby Duke Crest with Diamond Insignia', icon: 'shield-star', unlocked: true, previewUrl: '' },
      { key: 'kings_badge', name: 'Kings badge', desc: '3D Golden Lion & Eagle Duke Medal', icon: 'medal', unlocked: true, previewUrl: '' },
      { key: 'avatar_frame', name: 'Avatar frame', desc: 'Duke Imperial Golden Eagle Crown Frame', icon: 'color-wand', unlocked: true, previewUrl: '' },
      { key: 'entry_effect', name: 'Entry effect', desc: 'Golden Chariot & Dragon landing entry effect', icon: 'car-sport', unlocked: true, previewUrl: '' },
      { key: 'barrage', name: 'Barrage', desc: 'Crimson Red Laser bullet screen', icon: 'chatbubbles', unlocked: true, previewUrl: '' },
      { key: 'chat_bubble', name: 'Chat bubble', desc: 'Duke Ruby Blaze glass bubble', icon: 'chatbubble-ellipses', unlocked: true, previewUrl: '' },
      { key: 'mic_seat_aura', name: 'Mic aura', desc: 'Golden Winged mic pedestal aura', icon: 'radio', unlocked: true, previewUrl: '' },
      { key: 'profile_card', name: 'Profile theme', desc: 'Imperial Duke velvet theme', icon: 'card', unlocked: false, previewUrl: '' },
      { key: 'custom_gift', name: 'Exclusive gift', desc: 'Duke Sovereign Scepter 3D Gift', icon: 'gift', unlocked: false, previewUrl: '' },
    ],
    privileges: [
      { key: 'rank_the_top', name: 'Rank Top', desc: 'Priority pinning in room members and contributors', icon: 'trophy', unlocked: true },
      { key: 'colorful_nick', name: 'Color Nick', desc: 'Ruby Fire animated nickname', icon: 'color-palette', unlocked: true },
      { key: 'more_visitors', name: 'Visitors', desc: 'View complete visitor footprints anonymously', icon: 'eye', unlocked: true },
      { key: 'unlimited_msg', name: 'Zero Cooldown', desc: 'Send room messages without cooldown delays', icon: 'flash', unlocked: true },
      { key: 'anti_kick', name: 'Anti-Kick', desc: 'Immune to room evictions and kicks', icon: 'shield-checkmark', unlocked: true },
      { key: 'vip_support', name: 'VIP Support', desc: 'Direct WhatsApp Concierge Manager', icon: 'headset', unlocked: true },
      { key: 'anti_tracking', name: 'Anti-Track', desc: 'Full stealth mode across all rooms', icon: 'glasses', unlocked: true },
      { key: 'unique_sid', name: 'Vanity SID', desc: 'Equip rare 3-digit nobility vanity ID', icon: 'key', unlocked: true },
      { key: 'room_lord', name: 'Secret Lord', desc: 'Authority over private hidden voice rooms', icon: 'lock-open', unlocked: false },
      { key: 'exp_speed', name: 'EXP Boost', desc: '3x Level EXP accelerator on gifts', icon: 'rocket', unlocked: false },
      { key: 'chat_immunity', name: 'Chat Immunity', desc: 'Immune to mute and chat restrictions', icon: 'volume-high', unlocked: false },
      { key: 'global_fanfare', name: 'Fanfare', desc: 'Soundtrack fanfare played when entering room', icon: 'musical-notes', unlocked: false },
      { key: 'noble_box', name: 'Noble Chest', desc: 'Monthly mystery chest containing rare frames', icon: 'cube', unlocked: false },
    ],
  },
  {
    tierKey: 'prince',
    name: 'Prince',
    level: 4,
    title: 'Crown Prince',
    coinsPrice: 999000,
    dailyRewardCoins: 15000,
    durationDays: 30,
    rewardCount: 10,
    totalRewards: 11,
    privilegeCount: 11,
    totalPrivileges: 13,
    heroBadgeUrl: 'https://cdn-icons-png.flaticon.com/512/2583/2583342.png',
    rewards: [
      { key: 'daily_coins', name: 'Daily coins', desc: 'Claim 15,000 coins every day upon login', icon: 'cash', unlocked: true, previewUrl: '' },
      { key: 'notification_broadcast', name: 'Broadcast', desc: 'Royal herald horn fanfare across all servers', icon: 'megaphone', unlocked: true, previewUrl: '' },
      { key: 'kings_logo', name: 'Logo', desc: 'Crown Prince Golden Wing Crest', icon: 'shield-star', unlocked: true, previewUrl: '' },
      { key: 'kings_badge', name: 'Kings badge', desc: 'Rotating Diamond Crown Prince Seal', icon: 'medal', unlocked: true, previewUrl: '' },
      { key: 'avatar_frame', name: 'Avatar frame', desc: 'Crown Prince Platinum Dragon Frame', icon: 'color-wand', unlocked: true, previewUrl: '' },
      { key: 'entry_effect', name: 'Entry effect', desc: 'Supersonic Royal Jet entrance animation', icon: 'car-sport', unlocked: true, previewUrl: '' },
      { key: 'barrage', name: 'Barrage', desc: 'Electric Rainbow laser barrage', icon: 'chatbubbles', unlocked: true, previewUrl: '' },
      { key: 'chat_bubble', name: 'Chat bubble', desc: 'Platinum Prince crystal bubble', icon: 'chatbubble-ellipses', unlocked: true, previewUrl: '' },
      { key: 'mic_seat_aura', name: 'Mic aura', desc: 'Electric dragon aura circling mic seat', icon: 'radio', unlocked: true, previewUrl: '' },
      { key: 'profile_card', name: 'Profile theme', desc: 'Diamond encrusted prince profile theme', icon: 'card', unlocked: true, previewUrl: '' },
      { key: 'custom_gift', name: 'Exclusive gift', desc: 'Prince Pegasus 3D Animated Gift', icon: 'gift', unlocked: false, previewUrl: '' },
    ],
    privileges: [
      { key: 'rank_the_top', name: 'Rank Top', desc: 'Guaranteed top #1 placement in visitor lists', icon: 'trophy', unlocked: true },
      { key: 'colorful_nick', name: 'Color Nick', desc: 'Rainbow Aurora animated nickname', icon: 'color-palette', unlocked: true },
      { key: 'more_visitors', name: 'Visitors', desc: 'View complete visitor footprints anonymously', icon: 'eye', unlocked: true },
      { key: 'unlimited_msg', name: 'Zero Cooldown', desc: 'Zero cooldown everywhere', icon: 'flash', unlocked: true },
      { key: 'anti_kick', name: 'Anti-Kick', desc: 'Permanent anti-kick and kick protection', icon: 'shield-checkmark', unlocked: true },
      { key: 'vip_support', name: 'VIP Support', desc: 'Personal relationship manager', icon: 'headset', unlocked: true },
      { key: 'anti_tracking', name: 'Anti-Track', desc: 'Complete ghost mode across platform', icon: 'glasses', unlocked: true },
      { key: 'unique_sid', name: 'Vanity SID', desc: 'Equip 2 or 3-digit rare vanity ID', icon: 'key', unlocked: true },
      { key: 'room_lord', name: 'Secret Lord', desc: 'Enter locked rooms without password', icon: 'lock-open', unlocked: true },
      { key: 'exp_speed', name: 'EXP Boost', desc: '4x Level EXP accelerator', icon: 'rocket', unlocked: true },
      { key: 'chat_immunity', name: 'Chat Immunity', desc: 'Absolute immunity to mutes and kicks', icon: 'volume-high', unlocked: true },
      { key: 'global_fanfare', name: 'Fanfare', desc: 'Global orchestra arrival melody', icon: 'musical-notes', unlocked: false },
      { key: 'noble_box', name: 'Noble Chest', desc: 'Monthly legendary gift box', icon: 'cube', unlocked: false },
    ],
  },
  {
    tierKey: 'king',
    name: 'King',
    level: 5,
    title: 'Supreme King of Kings',
    coinsPrice: 1999000,
    dailyRewardCoins: 35000,
    durationDays: 30,
    rewardCount: 11,
    totalRewards: 11,
    privilegeCount: 13,
    totalPrivileges: 13,
    heroBadgeUrl: 'https://cdn-icons-png.flaticon.com/512/2583/2583434.png',
    rewards: [
      { key: 'daily_coins', name: 'Daily coins', desc: 'Claim 35,000 coins every day upon login', icon: 'cash', unlocked: true, previewUrl: '' },
      { key: 'notification_broadcast', name: 'Broadcast', desc: 'Supreme emperor app-wide golden fanfare banner', icon: 'megaphone', unlocked: true, previewUrl: '' },
      { key: 'kings_logo', name: 'Logo', desc: 'Imperial King of Kings Sun & Crown Emblem', icon: 'shield-star', unlocked: true, previewUrl: '' },
      { key: 'kings_badge', name: 'Kings badge', desc: 'Golden Winged Stag Imperial Crown Badge', icon: 'medal', unlocked: true, previewUrl: '' },
      { key: 'avatar_frame', name: 'Avatar frame', desc: 'Supreme King of Kings 3D Sovereign Frame', icon: 'color-wand', unlocked: true, previewUrl: '' },
      { key: 'entry_effect', name: 'Entry effect', desc: 'Golden Sovereign Yacht & Fireworks Entry', icon: 'car-sport', unlocked: true, previewUrl: '' },
      { key: 'barrage', name: 'Barrage', desc: 'Golden Dragon sovereign bullet comments', icon: 'chatbubbles', unlocked: true, previewUrl: '' },
      { key: 'chat_bubble', name: 'Chat bubble', desc: 'Supreme King 24K Liquid Gold Glass Bubble', icon: 'chatbubble-ellipses', unlocked: true, previewUrl: '' },
      { key: 'mic_seat_aura', name: 'Mic aura', desc: 'Golden Sovereign Sun Aura on mic seat', icon: 'radio', unlocked: true, previewUrl: '' },
      { key: 'profile_card', name: 'Profile theme', desc: '24K Solid Gold Imperial profile theme', icon: 'card', unlocked: true, previewUrl: '' },
      { key: 'custom_gift', name: 'Exclusive gift', desc: 'Supreme King of Kings Castle 3D Gift', icon: 'gift', unlocked: true, previewUrl: '' },
    ],
    privileges: [
      { key: 'rank_the_top', name: 'Rank Top', desc: 'Absolute #1 priority placement in all lists', icon: 'trophy', unlocked: true },
      { key: 'colorful_nick', name: 'Color Nick', desc: 'Custom RGB 24K Golden Dynamic Nickname', icon: 'color-palette', unlocked: true },
      { key: 'more_visitors', name: 'Visitors', desc: 'Unlimited full visitor log & trace logs', icon: 'eye', unlocked: true },
      { key: 'unlimited_msg', name: 'Zero Cooldown', desc: 'Zero cooldown platform-wide', icon: 'flash', unlocked: true },
      { key: 'anti_kick', name: 'Anti-Kick', desc: 'Supreme platform immunity against kicks', icon: 'shield-checkmark', unlocked: true },
      { key: 'vip_support', name: 'VIP Support', desc: 'Dedicated 24/7 executive relationship director', icon: 'headset', unlocked: true },
      { key: 'anti_tracking', name: 'Anti-Track', desc: 'Supreme ghost stealth invisibility', icon: 'glasses', unlocked: true },
      { key: 'unique_sid', name: 'Vanity SID', desc: 'Personal customized 2-digit Vanity ID', icon: 'key', unlocked: true },
      { key: 'room_lord', name: 'Secret Lord', desc: 'Unlimited entry to any room without password', icon: 'lock-open', unlocked: true },
      { key: 'exp_speed', name: 'EXP Boost', desc: '5x Supreme EXP Multiplier on all gifts', icon: 'rocket', unlocked: true },
      { key: 'chat_immunity', name: 'Chat Immunity', desc: 'Absolute platform immunity to bans & mutes', icon: 'volume-high', unlocked: true },
      { key: 'global_fanfare', name: 'Fanfare', desc: 'Full-screen cinematic royal fanfare on entry', icon: 'musical-notes', unlocked: true },
      { key: 'noble_box', name: 'Noble Chest', desc: 'Exclusive monthly Imperial Mystery Chest', icon: 'cube', unlocked: true },
    ],
  },
];

export default function KingOfKingsScreen() {
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 16);
  const navigation = useNavigation();
  const { user, fetchUserProfile } = useContext(AuthContext);

  const [tiers, setTiers] = useState(FALLBACK_KING_TIERS);
  const [activeTierKey, setActiveTierKey] = useState('knight');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);

  const loadKingPlans = async () => {
    try {
      setLoading(true);
      const res = await apiUtil.get('/king-plans', { suppressGlobalError: true });
      const payload = res?.data?.data || res?.data;
      if (res?.data?.success && Array.isArray(payload?.plans) && payload.plans.length > 0) {
        setTiers(payload.plans);
        if (!payload.plans.some((t) => t.tierKey === activeTierKey)) {
          setActiveTierKey(payload.plans[0].tierKey);
        }
      }
    } catch (_) {
      // Keep fallbacks
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKingPlans();
  }, []);

  const currentTier = tiers.find((t) => t.tierKey === activeTierKey) || tiers[0];
  const userCoins = user?.coins || 0;
  const isEquipped = Boolean(
    user?.equippedKingNobilityKey && user.equippedKingNobilityKey === currentTier.tierKey
  );

  const handlePurchase = async () => {
    if (userCoins < currentTier.coinsPrice) {
      AlertService.show(
        'Insufficient Coins',
        `You need ${currentTier.coinsPrice.toLocaleString()} coins to activate ${currentTier.name}. Please recharge.`,
        'warning'
      );
      return;
    }

    try {
      setIsPurchasing(true);
      const res = await apiUtil.post('/king-plans/purchase', { tierKey: currentTier.tierKey });
      if (res?.data?.success) {
        AlertService.show(
          'Nobility Crowned! 👑',
          `You have successfully activated ${currentTier.name} Nobility! All rewards & privileges are now unlocked.`,
          'success'
        );
        if (fetchUserProfile) await fetchUserProfile();
      } else {
        AlertService.show('Notice', res?.data?.message || 'Could not complete activation.', 'error');
      }
    } catch (err) {
      AlertService.show('Error', err?.response?.data?.message || err?.message || 'Transaction failed', 'error');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleClaimDaily = async () => {
    try {
      setIsClaiming(true);
      const res = await apiUtil.post('/king-plans/claim-daily');
      if (res?.data?.success) {
        AlertService.show('Coins Claimed! 🪙', `Claimed ${res.data.coinsAdded || currentTier.dailyRewardCoins} coins!`, 'success');
        if (fetchUserProfile) await fetchUserProfile();
      } else {
        AlertService.show('Notice', res?.data?.message || 'Daily coins already claimed today.', 'info');
      }
    } catch (err) {
      AlertService.show('Notice', err?.response?.data?.message || 'Claim unavailable right now.', 'info');
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Top Header Bar */}
      <View style={[styles.headerBar, { paddingTop: topSafeInset + 6 }]}>
        <TouchableOpacity
          style={styles.iconCircleBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="chevron-back" size={24} color="#FDE047" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>King of Kings</Text>

        <TouchableOpacity
          style={styles.iconCircleBtn}
          onPress={() => setShowRuleModal(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="help-circle-outline" size={24} color="#FDE047" />
        </TouchableOpacity>
      </View>

      {/* Nobility Tabs Row (Knight, Count, Duke, Prince, King) */}
      <View style={styles.tabsRow}>
        {tiers.map((t) => {
          const isActive = t.tierKey === activeTierKey;
          return (
            <TouchableOpacity
              key={t.tierKey}
              style={[styles.tabBtn, isActive && styles.tabBtnActive]}
              onPress={() => setActiveTierKey(t.tierKey)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabBtnText, isActive && styles.tabBtnTextActive]}>
                {t.name}
              </Text>
              {isActive && (
                <LinearGradient
                  colors={['#FDE047', '#EAB308']}
                  style={styles.tabActiveBar}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding + 85 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Crest Section: Golden Winged Stag Emblem */}
        <View style={styles.heroCrestSection}>
          <LinearGradient
            colors={['rgba(217, 119, 6, 0.25)', 'rgba(30, 20, 10, 0.4)', 'transparent']}
            style={styles.heroGlowGradient}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />

          <View style={styles.crestContainer}>
            {/* Crowned Golden Stag Insignia */}
            <View style={styles.crestCircleWrap}>
              <LinearGradient
                colors={['#FDE047', '#D97706', '#92400E']}
                style={styles.crestBorderGradient}
              >
                <View style={styles.crestInner}>
                  {currentTier.heroBadgeUrl ? (
                    <Image
                      source={{ uri: currentTier.heroBadgeUrl }}
                      style={styles.heroBadgeImg}
                      resizeMode="contain"
                    />
                  ) : (
                    <MaterialCommunityIcons name="shield-crown" size={68} color="#FDE047" />
                  )}
                </View>
              </LinearGradient>

              {/* Bottom Plaque Badge Ribbon */}
              <LinearGradient
                colors={['#CA8A04', '#78350F', '#451A03']}
                style={styles.plaqueRibbon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.plaqueRibbonText}>{currentTier.name.toUpperCase()}</Text>
              </LinearGradient>
            </View>

            <Text style={styles.heroTierTitle}>{currentTier.title}</Text>
            <Text style={styles.heroTierSubtitle}>
              Daily {formatCompactBalance(currentTier.dailyRewardCoins)} Coins • {currentTier.privilegeCount || currentTier.privileges?.filter(p => p.unlocked)?.length || 4} Unlocked Powers
            </Text>
          </View>
        </View>

        {/* Blue Crystalline Curved Divider (From Screenshot 2) */}
        <View style={styles.crystalDividerWrap}>
          <LinearGradient
            colors={['#0284C7', '#38BDF8', '#818CF8', '#38BDF8', '#0284C7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.crystalDividerLine}
          />
          <View style={styles.crystalDiamond}>
            <LinearGradient
              colors={['#38BDF8', '#1E40AF']}
              style={styles.crystalDiamondInner}
            />
          </View>
        </View>

        {/* Section 1: Reward (7/11) Asset Cards Grid */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>
              Reward ({currentTier.rewards?.filter((r) => r.unlocked)?.length || currentTier.rewardCount || 7}/{currentTier.rewards?.length || 11})
            </Text>
            <TouchableOpacity onPress={() => setShowRuleModal(true)}>
              <Text style={styles.sectionHintText}>Asset Rules ›</Text>
            </TouchableOpacity>
          </View>

          {/* Grid of 11 items */}
          <View style={styles.rewardsGrid}>
            {(currentTier.rewards || []).map((reward, idx) => {
              const isUnlocked = Boolean(reward.unlocked);
              return (
                <TouchableOpacity
                  key={reward.key || idx}
                  style={[styles.rewardCard, !isUnlocked && styles.rewardCardLocked]}
                  onPress={() => setSelectedAsset({ ...reward, type: 'reward' })}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={
                      isUnlocked
                        ? ['#3B240B', '#1E1306']
                        : ['#1E1E24', '#121216']
                    }
                    style={styles.rewardCardInner}
                  >
                    {/* Item Icon */}
                    <View style={[styles.rewardIconWrap, isUnlocked && styles.rewardIconWrapUnlocked]}>
                      <Icon
                        name={reward.icon || 'star'}
                        size={24}
                        color={isUnlocked ? '#FDE047' : '#64748B'}
                      />
                    </View>

                    {/* Reward Name */}
                    <Text
                      style={[styles.rewardNameText, isUnlocked && styles.rewardNameTextUnlocked]}
                      numberOfLines={1}
                    >
                      {reward.name}
                    </Text>

                    {/* Lock indicator */}
                    {!isUnlocked ? (
                      <View style={styles.lockBadge}>
                        <Icon name="lock-closed" size={10} color="#94A3B8" />
                      </View>
                    ) : (
                      <View style={styles.unlockedDot} />
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Section 2: Exclusive Privileges (4/13) Circular Badges */}
        <View style={[styles.sectionCard, { marginTop: 14 }]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>
              Exclusive privileges ({currentTier.privileges?.filter((p) => p.unlocked)?.length || currentTier.privilegeCount || 4}/{currentTier.privileges?.length || 13})
            </Text>
            <Text style={styles.sectionSub}>Progresses with nobility rank</Text>
          </View>

          <View style={styles.privilegesWrap}>
            {(currentTier.privileges || []).map((priv, idx) => {
              const isUnlocked = Boolean(priv.unlocked);
              return (
                <TouchableOpacity
                  key={priv.key || idx}
                  style={styles.privilegeItem}
                  onPress={() => setSelectedAsset({ ...priv, type: 'privilege' })}
                  activeOpacity={0.8}
                >
                  <View style={styles.privilegeCircleWrap}>
                    <LinearGradient
                      colors={
                        isUnlocked
                          ? ['#FDE047', '#D97706', '#78350F']
                          : ['#475569', '#334155', '#1E293B']
                      }
                      style={styles.privilegeBorder}
                    >
                      <View style={[styles.privilegeInner, !isUnlocked && styles.privilegeInnerLocked]}>
                        <Icon
                          name={priv.icon || 'ribbon-outline'}
                          size={22}
                          color={isUnlocked ? '#FEF08A' : '#64748B'}
                        />
                      </View>
                    </LinearGradient>

                    {!isUnlocked && (
                      <View style={styles.privilegeMiniLock}>
                        <Icon name="lock-closed" size={8} color="#FFFFFF" />
                      </View>
                    )}
                  </View>

                  <Text
                    style={[styles.privilegeText, isUnlocked && styles.privilegeTextUnlocked]}
                    numberOfLines={2}
                  >
                    {priv.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom Purchase / Claim Bar */}
      <View style={[styles.bottomBar, { paddingBottom: bottomPadding + 6 }]}>
        <View style={styles.bottomPriceCol}>
          <View style={styles.priceRow}>
            <Text style={styles.coinSymbol}>🪙</Text>
            <Text style={styles.priceText}>{formatCompactBalance(currentTier.coinsPrice)}</Text>
            <Text style={styles.priceDuration}>/ 30 days</Text>
          </View>
          <Text style={styles.balanceText}>
            Your Balance: 🪙 {formatCompactBalance(userCoins)}
          </Text>
        </View>

        <View style={styles.actionBtnsRow}>
          {isEquipped && (
            <TouchableOpacity
              style={styles.claimDailyBtn}
              onPress={handleClaimDaily}
              disabled={isClaiming}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#059669', '#10B981']}
                style={styles.claimDailyGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isClaiming ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Icon name="gift-outline" size={15} color="#FFFFFF" />
                    <Text style={styles.claimDailyBtnText}>Claim Daily</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.activateBtn}
            onPress={handlePurchase}
            disabled={isPurchasing}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#F59E0B', '#D97706', '#B45309']}
              style={styles.activateGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isPurchasing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.activateBtnText}>
                  {isEquipped ? 'Renew Nobility' : 'Activate Now'}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Asset Preview Modal */}
      <Modal
        visible={Boolean(selectedAsset)}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedAsset(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedAsset(null)}
        >
          <View style={styles.assetModalCard}>
            <LinearGradient
              colors={['#2A1807', '#150C03']}
              style={styles.assetModalGradient}
            >
              <View style={styles.assetModalIconCircle}>
                <Icon
                  name={selectedAsset?.icon || 'sparkles'}
                  size={36}
                  color="#FDE047"
                />
              </View>

              <Text style={styles.assetModalTitle}>{selectedAsset?.name}</Text>
              <Text style={styles.assetModalStatus}>
                {selectedAsset?.unlocked ? '✨ UNLOCKED IN THIS TIER' : '🔒 UNLOCKS IN HIGHER NOBILITY'}
              </Text>

              <Text style={styles.assetModalDesc}>{selectedAsset?.desc}</Text>

              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setSelectedAsset(null)}
              >
                <Text style={styles.modalCloseText}>Got It</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Nobility Rules Modal */}
      <Modal
        visible={showRuleModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRuleModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowRuleModal(false)}
        >
          <View style={styles.rulesModalCard}>
            <LinearGradient colors={['#1F1306', '#0C0702']} style={styles.rulesModalGradient}>
              <View style={styles.rulesHeader}>
                <Text style={styles.rulesTitle}>King of Kings Nobility Rules</Text>
                <TouchableOpacity onPress={() => setShowRuleModal(false)}>
                  <Icon name="close" size={22} color="#FDE047" />
                </TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 300 }}>
                <Text style={styles.ruleItem}>1. Nobility is valid for 30 days upon activation.</Text>
                <Text style={styles.ruleItem}>2. As your rank advances from Knight to King, you unlock more assets (up to 11/11) and exclusive privileges (up to 13/13).</Text>
                <Text style={styles.ruleItem}>3. Daily coins can be claimed once every 24 hours.</Text>
                <Text style={styles.ruleItem}>4. Custom Vanity IDs, Animated Badges, and Anti-Kick protections remain active throughout your subscription duration.</Text>
              </ScrollView>
            </LinearGradient>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0904',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: '#0F0904',
  },
  iconCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(253, 224, 71, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FDE047',
    letterSpacing: 0.5,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(217, 119, 6, 0.2)',
  },
  tabBtn: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    position: 'relative',
  },
  tabBtnActive: {},
  tabBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
  },
  tabBtnTextActive: {
    color: '#FDE047',
    fontWeight: '800',
  },
  tabActiveBar: {
    position: 'absolute',
    bottom: 0,
    height: 2.5,
    width: '80%',
    borderRadius: 2,
  },
  scrollContent: {
    paddingTop: 10,
  },
  heroCrestSection: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 16,
  },
  heroGlowGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  crestContainer: {
    alignItems: 'center',
  },
  crestCircleWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  crestBorderGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#F59E0B',
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
  crestInner: {
    width: '100%',
    height: '100%',
    borderRadius: 58,
    backgroundColor: '#2A1705',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadgeImg: {
    width: 76,
    height: 76,
  },
  plaqueRibbon: {
    position: 'absolute',
    bottom: -8,
    paddingHorizontal: 16,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE047',
    elevation: 4,
  },
  plaqueRibbonText: {
    color: '#FEF08A',
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 1,
  },
  heroTierTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FEF08A',
    marginTop: 6,
    textShadowColor: 'rgba(245, 158, 11, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  heroTierSubtitle: {
    fontSize: 12,
    color: '#FBBF24',
    marginTop: 2,
    fontWeight: '600',
  },
  crystalDividerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
    position: 'relative',
  },
  crystalDividerLine: {
    width: width - 40,
    height: 2,
    borderRadius: 1,
  },
  crystalDiamond: {
    position: 'absolute',
    width: 12,
    height: 12,
    transform: [{ rotate: '45deg' }],
    borderRadius: 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  crystalDiamondInner: {
    flex: 1,
  },
  sectionCard: {
    marginHorizontal: 14,
    backgroundColor: '#170E05',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.25)',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FDE047',
  },
  sectionHintText: {
    fontSize: 12,
    color: '#FBBF24',
    fontWeight: '600',
  },
  sectionSub: {
    fontSize: 11,
    color: '#94A3B8',
  },
  rewardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  rewardCard: {
    width: (width - 56) / 3,
    borderRadius: 12,
    overflow: 'hidden',
  },
  rewardCardLocked: {
    opacity: 0.65,
  },
  rewardCardInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.3)',
    borderRadius: 12,
    position: 'relative',
  },
  rewardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#271607',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  rewardIconWrapUnlocked: {
    borderWidth: 1,
    borderColor: '#D97706',
  },
  rewardNameText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    textAlign: 'center',
  },
  rewardNameTextUnlocked: {
    color: '#FEF08A',
    fontWeight: '700',
  },
  lockBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  unlockedDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  privilegesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 12,
  },
  privilegeItem: {
    width: (width - 76) / 4,
    alignItems: 'center',
    marginBottom: 6,
  },
  privilegeCircleWrap: {
    position: 'relative',
    marginBottom: 4,
  },
  privilegeBorder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privilegeInner: {
    width: '100%',
    height: '100%',
    borderRadius: 23,
    backgroundColor: '#2B1604',
    alignItems: 'center',
    justifyContent: 'center',
  },
  privilegeInnerLocked: {
    backgroundColor: '#1A1A22',
  },
  privilegeMiniLock: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#DC2626',
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privilegeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  privilegeTextUnlocked: {
    color: '#FEF08A',
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#140C04',
    borderTopWidth: 1,
    borderTopColor: 'rgba(217, 119, 6, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  bottomPriceCol: {
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinSymbol: {
    fontSize: 16,
    marginRight: 4,
  },
  priceText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FDE047',
  },
  priceDuration: {
    fontSize: 11,
    color: '#94A3B8',
    marginLeft: 3,
  },
  balanceText: {
    fontSize: 11,
    color: '#FBBF24',
    marginTop: 2,
    fontWeight: '500',
  },
  actionBtnsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  claimDailyBtn: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  claimDailyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    gap: 4,
  },
  claimDailyBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  activateBtn: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  activateGradient: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activateBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#381E02',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  assetModalCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D97706',
  },
  assetModalGradient: {
    padding: 22,
    alignItems: 'center',
  },
  assetModalIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#382008',
    borderWidth: 1.5,
    borderColor: '#FDE047',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  assetModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FEF08A',
    marginBottom: 4,
  },
  assetModalStatus: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F59E0B',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  assetModalDesc: {
    fontSize: 13,
    color: '#E2E8F0',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  modalCloseBtn: {
    backgroundColor: '#F59E0B',
    paddingVertical: 9,
    paddingHorizontal: 28,
    borderRadius: 18,
  },
  modalCloseText: {
    color: '#1E1306',
    fontWeight: '800',
    fontSize: 13,
  },
  rulesModalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D97706',
  },
  rulesModalGradient: {
    padding: 20,
  },
  rulesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(217,119,6,0.3)',
    paddingBottom: 8,
  },
  rulesTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FDE047',
  },
  ruleItem: {
    fontSize: 12.5,
    color: '#E2E8F0',
    lineHeight: 18,
    marginBottom: 8,
  },
});
