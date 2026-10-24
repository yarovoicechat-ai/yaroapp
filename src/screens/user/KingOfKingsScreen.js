import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  useWindowDimensions,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import KingAssetPreviewModal from '../../components/membership/KingAssetPreviewModal';
import KingRulesModal from '../../components/membership/KingRulesModal';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthProvider';
import { AlertService } from '../../utils/AlertService';
import { apiUtil } from '../../utils/apiUtil';
import { formatCompactBalance } from '../../utils/numberUtil';



// Dedicated Nobility Assets
const VISCOUNT_BADGE = require('../../assets/king/viscount_badge.png');

// Fallback Nobility tiers matching screenshot 2
const FALLBACK_KING_TIERS = [
  {
    tierKey: 'viscount',
    name: 'Viscount',
    level: 1,
    title: 'Imperial Viscount',
    coinsPrice: 99000,
    bonusCoins: 1000,
    durationDays: 30,
    rewardCount: 7,
    totalRewards: 11,
    privilegeCount: 4,
    totalPrivileges: 13,
    heroBadgeUrl: 'https://cdn-icons-png.flaticon.com/512/2583/2583344.png',
    rewards: [
      { key: 'activation_bonus', name: 'Activation bonus', desc: 'Receive 1,000 coins once on activation', icon: 'cash', unlocked: true, previewUrl: '' },
      { key: 'notification_broadcast', name: 'Broadcast', desc: 'App-wide banner when entering rooms', icon: 'megaphone', unlocked: true, previewUrl: '' },
      { key: 'kings_logo', name: 'Logo', desc: 'Exclusive Viscount heraldic emblem on profile', icon: 'shield-star', unlocked: true, previewUrl: '' },
      { key: 'kings_badge', name: 'Kings badge', desc: 'Dynamic glowing 3D Viscount nobility badge', icon: 'medal', unlocked: true, previewUrl: '' },
      { key: 'avatar_frame', name: 'Avatar frame', desc: 'Golden Winged Stag animated frame', icon: 'color-wand', unlocked: true, previewUrl: '' },
      { key: 'entry_effect', name: 'Entry effect', desc: 'Royal golden sports car arrival effect', icon: 'car-sport', unlocked: true, previewUrl: '' },
      { key: 'barrage', name: 'Barrage', desc: 'Golden bullet screen text in live party', icon: 'chatbubbles', unlocked: true, previewUrl: '' },
      { key: 'chat_bubble', name: 'Chat bubble', desc: 'Viscount amber glass message bubble', icon: 'chatbubble-ellipses', unlocked: false, previewUrl: '' },
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
    bonusCoins: 2500,
    durationDays: 30,
    rewardCount: 8,
    totalRewards: 11,
    privilegeCount: 6,
    totalPrivileges: 13,
    heroBadge: VISCOUNT_BADGE,
    heroBadgeUrl: '/king/viscount_badge.png',
    rewards: [
      { key: 'activation_bonus', name: 'Activation bonus', desc: 'Receive 2,500 coins once on activation', icon: 'cash', unlocked: true, previewUrl: '' },
      { key: 'notification_broadcast', name: 'Broadcast', desc: 'Count royal trumpet arrival announcement', icon: 'megaphone', unlocked: true, previewUrl: '' },
      { key: 'kings_logo', name: 'Logo', desc: 'Amethyst & Gold Count Coat of Arms', icon: 'shield-star', unlocked: true, previewUrl: '' },
      { key: 'kings_badge', name: 'Kings badge', desc: 'Shimmering Purple & Gold Count Nobility Badge', icon: 'medal', unlocked: true, previewUrl: '', image: VISCOUNT_BADGE },
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
    tierKey: 'marquis',
    name: 'Marquis',
    level: 3,
    title: 'Sovereign Marquis',
    coinsPrice: 499000,
    bonusCoins: 6000,
    durationDays: 30,
    rewardCount: 9,
    totalRewards: 11,
    privilegeCount: 8,
    totalPrivileges: 13,
    heroBadgeUrl: 'https://cdn-icons-png.flaticon.com/512/2583/2583345.png',
    rewards: [
      { key: 'activation_bonus', name: 'Activation bonus', desc: 'Receive 6,000 coins once on activation', icon: 'cash', unlocked: true, previewUrl: '' },
      { key: 'notification_broadcast', name: 'Broadcast', desc: 'Sovereign banner broadcast across the whole app', icon: 'megaphone', unlocked: true, previewUrl: '' },
      { key: 'kings_logo', name: 'Logo', desc: 'Ruby Marquis Crest with Diamond Insignia', icon: 'shield-star', unlocked: true, previewUrl: '' },
      { key: 'kings_badge', name: 'Kings badge', desc: '3D Golden Lion & Eagle Marquis Medal', icon: 'medal', unlocked: true, previewUrl: '' },
      { key: 'avatar_frame', name: 'Avatar frame', desc: 'Marquis Imperial Golden Eagle Crown Frame', icon: 'color-wand', unlocked: true, previewUrl: '' },
      { key: 'entry_effect', name: 'Entry effect', desc: 'Golden Chariot & Dragon landing entry effect', icon: 'car-sport', unlocked: true, previewUrl: '' },
      { key: 'barrage', name: 'Barrage', desc: 'Crimson Red Laser bullet screen', icon: 'chatbubbles', unlocked: true, previewUrl: '' },
      { key: 'chat_bubble', name: 'Chat bubble', desc: 'Marquis Ruby Blaze glass bubble', icon: 'chatbubble-ellipses', unlocked: true, previewUrl: '' },
      { key: 'mic_seat_aura', name: 'Mic aura', desc: 'Golden Winged mic pedestal aura', icon: 'radio', unlocked: true, previewUrl: '' },
      { key: 'profile_card', name: 'Profile theme', desc: 'Imperial Marquis velvet theme', icon: 'card', unlocked: false, previewUrl: '' },
      { key: 'custom_gift', name: 'Exclusive gift', desc: 'Marquis Sovereign Scepter 3D Gift', icon: 'gift', unlocked: false, previewUrl: '' },
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
    tierKey: 'duke',
    name: 'Duke',
    level: 4,
    title: 'Crown Duke',
    coinsPrice: 999000,
    bonusCoins: 15000,
    durationDays: 30,
    rewardCount: 10,
    totalRewards: 11,
    privilegeCount: 11,
    totalPrivileges: 13,
    heroBadgeUrl: 'https://cdn-icons-png.flaticon.com/512/2583/2583342.png',
    rewards: [
      { key: 'activation_bonus', name: 'Activation bonus', desc: 'Receive 15,000 coins once on activation', icon: 'cash', unlocked: true, previewUrl: '' },
      { key: 'notification_broadcast', name: 'Broadcast', desc: 'Royal herald horn fanfare across all servers', icon: 'megaphone', unlocked: true, previewUrl: '' },
      { key: 'kings_logo', name: 'Logo', desc: 'Crown Duke Golden Wing Crest', icon: 'shield-star', unlocked: true, previewUrl: '' },
      { key: 'kings_badge', name: 'Kings badge', desc: 'Rotating Diamond Crown Duke Seal', icon: 'medal', unlocked: true, previewUrl: '' },
      { key: 'avatar_frame', name: 'Avatar frame', desc: 'Crown Duke Platinum Dragon Frame', icon: 'color-wand', unlocked: true, previewUrl: '' },
      { key: 'entry_effect', name: 'Entry effect', desc: 'Supersonic Royal Jet entrance animation', icon: 'car-sport', unlocked: true, previewUrl: '' },
      { key: 'barrage', name: 'Barrage', desc: 'Electric Rainbow laser barrage', icon: 'chatbubbles', unlocked: true, previewUrl: '' },
      { key: 'chat_bubble', name: 'Chat bubble', desc: 'Platinum Duke crystal bubble', icon: 'chatbubble-ellipses', unlocked: true, previewUrl: '' },
      { key: 'mic_seat_aura', name: 'Mic aura', desc: 'Electric dragon aura circling mic seat', icon: 'radio', unlocked: true, previewUrl: '' },
      { key: 'profile_card', name: 'Profile theme', desc: 'Diamond encrusted duke profile theme', icon: 'card', unlocked: true, previewUrl: '' },
      { key: 'custom_gift', name: 'Exclusive gift', desc: 'Duke Pegasus 3D Animated Gift', icon: 'gift', unlocked: false, previewUrl: '' },
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
    bonusCoins: 35000,
    durationDays: 30,
    rewardCount: 11,
    totalRewards: 11,
    privilegeCount: 13,
    totalPrivileges: 13,
    heroBadgeUrl: 'https://cdn-icons-png.flaticon.com/512/2583/2583434.png',
    rewards: [
      { key: 'activation_bonus', name: 'Activation bonus', desc: 'Receive 35,000 coins once on activation', icon: 'cash', unlocked: true, previewUrl: '' },
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

// Reference layout: exactly 15 privileges, displayed in five rows of three.
const ROYAL_PRIVILEGES = [
  {key: 'kings_badge', name: 'Aristocracy Badge', icon: 'ribbon', desc: 'Exclusive nobility badge on your profile.', level: 1},
  {key: 'exclusive_gifts', name: 'Aristocracy Gifts', icon: 'gift', desc: 'Exclusive gifts for nobility members.', level: 1},
  {key: 'room_list_badge', name: 'Room List Badge', icon: 'home', desc: 'Nobility badge on the room list.', level: 1},
  {key: 'rank_the_top', name: 'Ranking Surprise', icon: 'podium', desc: 'Priority position in the room member list.', level: 1},
  {key: 'entry_effect', name: 'Dazzling Entry', icon: 'sparkles', desc: 'Enter the room with a dazzling effect.', level: 1},
  {key: 'chat_bubble', name: 'Room Text Bubble', icon: 'chatbubble-ellipses', desc: 'Exclusive text bubble in the room.', level: 2},
  {key: 'profile_card', name: 'Profile Cover', icon: 'person-circle', desc: 'Exclusive nobility profile cover.', level: 2},
  {key: 'coloured_message', name: 'Coloured Message', icon: 'chatbubbles', desc: 'Send coloured messages in the room.', level: 2},
  {key: 'mic_seat_aura', name: 'Unique Voice Wave', icon: 'radio', desc: 'A unique voice wave while speaking on mic.', level: 3},
  {key: 'room_theme', name: 'Room Theme', icon: 'color-palette', desc: 'Exclusive nobility theme for your room.', level: 3},
  {key: 'apply_mic', name: 'Apply Mic', icon: 'mic', desc: 'Apply for a mic when the seat is locked.', level: 3},
  {key: 'vehicle', name: 'Vehicle', icon: 'car-sport', desc: 'Arrive in the room with a special vehicle.', level: 4},
  {key: 'colorful_nick', name: 'Coloured Mic Name', icon: 'text', desc: 'A coloured name while on the mic.', level: 4},
  {key: 'room_lock', name: 'Room Lock', icon: 'lock-closed', desc: 'Set a password for friends to enter your room.', level: 5},
  {key: 'store_discount', name: 'Store Discount', icon: 'pricetags', desc: 'Member discounts in the store.', level: 5},
];

export default function KingOfKingsScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 16);
  const navigation = useNavigation();
  const { user, fetchUserProfile } = useContext(AuthContext);

  const [tiers, setTiers] = useState(FALLBACK_KING_TIERS);
  const [activeTierKey, setActiveTierKey] = useState('viscount');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);

  const touchStartX = useRef(0);
  const handleTouchStart = (e) => {
    touchStartX.current = e.nativeEvent.pageX;
  };
  const handleTouchEnd = (e) => {
    const dx = e.nativeEvent.pageX - touchStartX.current;
    if (Math.abs(dx) > 35) {
      const currentIndex = tiers.findIndex((t) => (t.tierKey === activeTierKey) || (t.slug === activeTierKey));
      if (dx < 0 && currentIndex < tiers.length - 1) {
        // Swipe left -> next nobility rank
        setActiveTierKey(tiers[currentIndex + 1].tierKey || tiers[currentIndex + 1].slug);
      } else if (dx > 0 && currentIndex > 0) {
        // Swipe right -> previous nobility rank
        setActiveTierKey(tiers[currentIndex - 1].tierKey || tiers[currentIndex - 1].slug);
      }
    }
  };

  const loadKingPlans = async () => {
    try {
      setLoading(true);
      const res = await apiUtil.get('/king-plans', { suppressGlobalError: true });
      const payload = res?.data?.data || res?.data;
      if (res?.data?.success && Array.isArray(payload?.plans) && payload.plans.length > 0) {
        const enriched = payload.plans.map((raw) => {
          const mapBenefit = item => ({...item, name: item.name || item.title, desc: item.desc || item.description, unlocked: item.unlocked ?? item.isEnabled});
          const p = {...raw, tierKey: raw.tierKey || raw.slug, level: raw.level || raw.tierLevel, coinsPrice: raw.coinsPrice ?? raw.priceCoins, bonusCoins: raw.bonusCoins ?? raw.totalReturnCoins ?? 0,
            rewards: (raw.rewards || []).map(item => ['daily_free_coins', 'daily_coins', 'activation_bonus'].includes(item.key) ? {...mapBenefit(item), key: 'activation_bonus', name: 'Activation bonus', desc: 'Bonus coins credited once when you activate this membership.'} : mapBenefit(item)),
            privileges: (raw.privileges || []).map(mapBenefit)};
          const isViscount = (p.tierKey === 'viscount' || p.slug === 'viscount' || p.tierKey === 'count' || p.slug === 'count' || p.level === 2);
          const rankName = isViscount ? 'Viscount' : (p.name || ['Knight', 'Viscount', 'Duke', 'Prince', 'King'][(p.level || 1) - 1] || 'Nobility');
          return {
            ...p,
            tierKey: isViscount ? 'viscount' : p.tierKey,
            name: rankName,
            title: isViscount ? 'Royal Viscount' : (rankName + ' Nobility'),
            heroBadge: isViscount ? VISCOUNT_BADGE : p.heroBadge,
          };
        });
        setTiers(enriched);
        if (!enriched.some((t) => t.tierKey === activeTierKey)) {
          setActiveTierKey(enriched[0].tierKey);
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
  const referencePrivileges = ROYAL_PRIVILEGES.map(item => ({...item, unlocked: (currentTier.level || currentTier.tierLevel || 1) >= item.level}));
  const userCoins = user?.coins || 0;
  const isEquipped = Boolean(
    (user?.equippedKingTierId || user?.equippedKingNobilityKey) === currentTier.tierKey && new Date(user?.kingExpiresAt || 0).getTime() > Date.now()
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
      const res = await apiUtil.post('/king-plans/purchase', { planIdOrSlug: currentTier.slug || currentTier.tierKey });
      if (res?.data?.success) {
        AlertService.show(
          'Nobility Crowned!',
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

        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}><Text style={styles.headerTitle}>King of Kings</Text>{loading && <ActivityIndicator size="small" color="#E9C889" />}</View>

        <TouchableOpacity
          style={styles.iconCircleBtn}
          onPress={() => setShowRuleModal(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="help-circle-outline" size={24} color="#FDE047" />
        </TouchableOpacity>
      </View>

      {/* Nobility Tabs Row (Viscount, Count, Marquis, Duke, King) */}
      <View style={styles.tabsRowContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          {tiers.map((t) => {
            const isActive = (t.tierKey === activeTierKey) || (t.slug === activeTierKey);
            return (
              <TouchableOpacity
                key={t.tierKey || t.slug}
                style={[styles.tabBtn, isActive && styles.tabBtnActive]}
                onPress={() => setActiveTierKey(t.tierKey || t.slug)}
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
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={styles.royalHero}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <View style={styles.royalEmblem}>
            {currentTier.heroBadge ? (
              <View style={styles.heroBadgeBox}>
                <Image
                  source={currentTier.heroBadge}
                  style={styles.heroBadgeImage}
                  resizeMode="contain"
                />
              </View>
            ) : (
              <LinearGradient colors={['#FFE5A4', '#BA7B38', '#57371F']} style={styles.emblemOuter}>
                <View style={styles.emblemInner}>
                  <MaterialCommunityIcons name="shield-crown" size={76} color="#F5D49A" />
                </View>
              </LinearGradient>
            )}
            <Text style={styles.emblemLevel}>NOBILITY {currentTier.level || tiers.indexOf(currentTier) + 1}</Text>
          </View>
          <View style={styles.heroDetails}>
            <Text style={styles.eyebrow}>THE ROYAL COLLECTION</Text>
            <Text style={styles.royalTitle}>{currentTier.name}</Text>
            <Text style={styles.royalSubtitle}>{currentTier.title}</Text>
            <View style={styles.dailyPill}>
              <Icon name="gift-outline" size={14} color="#E9C889" />
              <Text style={styles.dailyPillText}>{formatCompactBalance(currentTier.bonusCoins)} bonus coins</Text>
            </View>
            <Text style={styles.heroDuration}>{currentTier.durationDays || 30} days • bonus paid once</Text>
          </View>
        </View>

        {/* Nobility Tier Indicators ("encator add karo") */}
        <View style={styles.tierIndicatorWrap}>
          {tiers.map((t, idx) => {
            const isActive = (t.tierKey === activeTierKey) || (t.slug === activeTierKey);
            return (
              <TouchableOpacity
                key={t.tierKey || t.slug || idx}
                onPress={() => setActiveTierKey(t.tierKey || t.slug)}
                activeOpacity={0.8}
                hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
              >
                <LinearGradient
                  colors={isActive ? ['#FDE047', '#EAB308', '#D97706'] : ['rgba(255, 255, 255, 0.28)', 'rgba(255, 255, 255, 0.15)']}
                  style={[styles.indicatorDot, isActive && styles.indicatorDotActive]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.benefitsPanel}>
          <View style={styles.panelHeading}>
            <View>
              <Text style={styles.panelEyebrow}>YOUR NOBILITY, ELEVATED</Text>
              <Text style={styles.panelTitle}>Royal privileges</Text>
            </View>
            <View style={styles.countPill}><Text style={styles.countText}>{referencePrivileges.filter(item => item.unlocked).length}/15</Text></View>
          </View>
          <Text style={styles.panelDescription}>Discover everything included with {currentTier.name}. Tap a benefit to explore.</Text>
          {[{items: referencePrivileges, type: 'privilege'}].map(section => (
            <View key={section.type}>
              <View style={styles.benefitGrid}>
                {section.items.map((item, index) => <TouchableOpacity
                  key={item.key || index}
                  accessibilityRole="button"
                  accessibilityLabel={item.name + (item.unlocked ? ', included in this rank' : ', available at a higher rank')}
                  onPress={() => setSelectedAsset({...item, type: section.type})}
                  activeOpacity={0.7}
                  style={[styles.benefitTile, {width: (width - 64) / 3}]}
                >
                  <LinearGradient colors={item.unlocked ? ['#F7DFAB', '#D7A75F'] : ['#E8E4DD', '#D8D3CA']} style={styles.benefitIcon}>
                    <Icon name={item.icon === 'shield-star' ? 'shield-checkmark' : (item.icon || 'sparkles')} size={25} color={item.unlocked ? '#795021' : '#999388'} />
                    {!item.unlocked && <View style={styles.benefitLock}><Icon name="lock-closed" size={9} color="#FFFFFF" /></View>}
                  </LinearGradient>
                  <Text style={[styles.benefitName, !item.unlocked && styles.benefitNameLocked]} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.benefitDescription} numberOfLines={3}>{item.desc}</Text>
                </TouchableOpacity>)}
              </View>
            </View>
          ))}
          <TouchableOpacity style={styles.rulesLink} onPress={() => setShowRuleModal(true)}><Text style={styles.rulesLinkText}>Membership rules & details</Text><Icon name="chevron-forward" size={14} color="#98703C" /></TouchableOpacity>
        </View>
      </ScrollView>

      {/* Floating Bottom Purchase / Claim Bar */}
      <View style={[styles.bottomBar, { paddingBottom: bottomPadding + 6 }]}>
        <View style={styles.bottomPriceCol}>
          <View style={styles.priceRow}>
            <Icon name="ellipse" size={13} color="#E9C889" style={styles.coinSymbol} />
            <Text style={styles.priceText}>{formatCompactBalance(currentTier.coinsPrice)}</Text>
            <Text style={styles.priceDuration}>/ {currentTier.durationDays || 30} days</Text>
          </View>
          <Text style={styles.balanceText}>
            Your Balance: {formatCompactBalance(userCoins)} coins
          </Text>
        </View>

        <View style={styles.actionBtnsRow}>

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
            <KingAssetPreviewModal
        visible={Boolean(selectedAsset)}
        onClose={() => setSelectedAsset(null)}
        asset={selectedAsset}
        styles={styles}
      />

      {/* Nobility Rules Modal */}
            <KingRulesModal
        visible={showRuleModal}
        onClose={() => setShowRuleModal(false)}
        styles={styles}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  royalHero: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 18, paddingBottom: 12, gap: 18},
  royalEmblem: {alignItems: 'center', justifyContent: 'center'},
  heroBadgeBox: {
    width: 128,
    height: 128,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 8,
  },
  heroBadgeImage: {
    width: 128,
    height: 128,
  },
  tierIndicatorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 16,
    gap: 8,
  },
  indicatorDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  indicatorDotActive: {
    width: 24,
    height: 7,
    borderRadius: 3.5,
    shadowColor: '#FDE047',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  emblemOuter: {width: 112, height: 124, borderRadius: 36, padding: 2, transform: [{rotate: '-4deg'}]},
  emblemInner: {flex: 1, backgroundColor: '#241D2D', borderRadius: 34, alignItems: 'center', justifyContent: 'center'},
  emblemImage: {width: 106, height: 112},
  emblemLevel: {color: '#D4B77E', fontSize: 8, fontWeight: '800', letterSpacing: 1.8, marginTop: 8},
  heroDetails: {flex: 1},
  eyebrow: {color: '#B59F82', fontSize: 8, letterSpacing: 1.5, fontWeight: '700'},
  royalTitle: {fontSize: 32, fontWeight: '800', color: '#F9E6C0', marginTop: 5},
  royalSubtitle: {fontSize: 12, color: '#BAA9C8', marginTop: 2},
  dailyPill: {flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12},
  dailyPillText: {color: '#E9C889', fontSize: 12, fontWeight: '700', flexShrink: 1},
  heroDuration: {color: '#9E91AC', fontSize: 10, marginTop: 7},
  benefitsPanel: {backgroundColor: '#FCF8F0', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 20, paddingTop: 25, paddingBottom: 24, minHeight: 500},
  panelHeading: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  panelEyebrow: {fontSize: 8, letterSpacing: 1.8, color: '#A1845A', fontWeight: '800'},
  panelTitle: {fontSize: 23, fontWeight: '800', color: '#32283B', marginTop: 5},
  countPill: {paddingHorizontal: 12, paddingVertical: 7, backgroundColor: '#EFE2C9', borderRadius: 14},
  countText: {color: '#8A612C', fontSize: 12, fontWeight: '800'},
  panelDescription: {fontSize: 11, lineHeight: 17, color: '#9B9082', marginTop: 10, marginBottom: 24},
  benefitSectionTitle: {fontSize: 12, fontWeight: '800', color: '#75614A', marginTop: 18, marginBottom: 18},
  benefitGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 12},
  benefitTile: {alignItems: 'center', paddingBottom: 16},
  benefitIcon: {width: 52, height: 55, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#EDD6AD'},
  benefitLock: {position: 'absolute', bottom: -3, right: -3, backgroundColor: '#A49B8F', borderRadius: 8, padding: 3},
  benefitName: {fontSize: 11, fontWeight: '700', color: '#4A3C2E', textAlign: 'center', minHeight: 28},
  benefitNameLocked: {color: '#9B948A'},
  benefitDescription: {fontSize: 9, lineHeight: 13, color: '#A29788', textAlign: 'center', marginTop: 3},
  rulesLink: {flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingTop: 18, borderTopWidth: 1, borderTopColor: '#EDE3D3', marginTop: 10},
  rulesLinkText: {fontSize: 11, color: '#98703C'},
  container: {
    flex: 1,
    backgroundColor: '#191321',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: '#191321',
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
  tabsRowContainer: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(217, 119, 6, 0.2)',
    paddingVertical: 2,
  },
  tabsScrollContent: {
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 6,
  },
  tabBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    position: 'relative',
  },
  tabBtnActive: {backgroundColor: 'rgba(232,199,140,0.09)', borderRadius: 12},
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
    height: 3,
    width: '85%',
    borderRadius: 2,
  },
  scrollContent: {
    paddingTop: 10,
  },
  heroCrestSection: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 14,
  },
  heroGlowGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  crestContainer: {
    alignItems: 'center',
  },
  heroBadgeBox: {
    width: 220,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.75,
    shadowRadius: 20,
    elevation: 12,
    marginBottom: 6,
  },
  heroBadgeImage: {
    width: 215,
    height: 195,
  },
  tierIndicatorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#334155',
  },
  indicatorDotActive: {
    width: 26,
    height: 8,
    borderRadius: 4,
    shadowColor: '#FDE047',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
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
    width: '90%',
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
    width: '30%',
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
    width: '22%',
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
    backgroundColor: '#211929',
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
    flexDirection: 'column',
    alignItems: 'stretch',
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
