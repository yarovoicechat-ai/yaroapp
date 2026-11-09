import React, { useState, useCallback, useContext, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
  Modal,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset } from '../../utils/safeAreaUtils';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { apiUtil } from '../../utils/apiUtil';
import { AuthContext } from '../../context/AuthProvider';
import { AlertService } from '../../utils/AlertService';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 44) / 2;
const SLOT_SIZE = (width - 64) / 5;

// Built-in assets from mockup
const MEDAL_ASSETS = {
  svip8: require('../../assets/medals/medal_svip8.png'),
  svip9: require('../../assets/medals/medal_svip9.png'),
  svip10: require('../../assets/medals/medal_svip10.png'),
  gifts10m: require('../../assets/medals/medal_10m_gifts.png'),
  richMan: require('../../assets/medals/medal_rich_man.png'),
  anniversary: require('../../assets/medals/medal_1st_anniversary.png'),
  partyKing: require('../../assets/medals/medal_party_king.png'),
  lionThrone: require('../../assets/medals/medal_lion_throne.png'),
  headerCrown: require('../../assets/medals/medal_header_crown.png'),
  btnMyMedals: require('../../assets/medals/medal_btn_my_medals.png'),
  tier10m: require('../../assets/medals/medal_tier_10m.png'),
  tier40m: require('../../assets/medals/medal_tier_40m.png'),
  tier200m: require('../../assets/medals/medal_tier_200m.png'),
  podium: require('../../assets/medals/medal_podium.png'),
  tierIcon10m: require('../../assets/medals/tier_icon_10m.png'),
  tierIcon40m: require('../../assets/medals/tier_icon_40m.png'),
  tierIcon200m: require('../../assets/medals/tier_icon_200m.png'),
};

const MEDAL_CATALOG = {
  Achievement: [
    {
      id: 'svip8_honorable',
      name: 'SVIP8 Honorable Badge',
      category: 'Achievement',
      image: MEDAL_ASSETS.svip8,
      description: 'Supreme badge of honor awarded to royal nobility reaching SVIP Level 8.',
      howToGet: 'Reach SVIP Level 8 nobility status.',
      requirement: 'SVIP Level 8',
      tiers: [
        {
          tierId: 'svip8',
          name: 'SVIP8 Honorable Badge',
          subtitle: 'Reach SVIP Level 8 nobility status',
          badgeName: 'SVIP 8',
          target: 8,
          image: MEDAL_ASSETS.svip8,
        },
        {
          tierId: 'svip9',
          name: 'SVIP9 Honorable Badge',
          subtitle: 'Reach SVIP Level 9 nobility status',
          badgeName: 'SVIP 9',
          target: 9,
          image: MEDAL_ASSETS.svip9,
        },
        {
          tierId: 'svip10',
          name: 'SVIP10 Honorable Badge',
          subtitle: 'Reach SVIP Level 10 imperial nobility (Supreme Tier)',
          badgeName: 'SVIP 10',
          target: 10,
          image: MEDAL_ASSETS.svip10,
        },
      ],
    },
    {
      id: 'svip9_honorable',
      name: 'SVIP9 Honorable Badge',
      category: 'Achievement',
      image: MEDAL_ASSETS.svip9,
      description: 'A radiant golden winged crown crest bestowed upon esteemed SVIP 9 legends.',
      howToGet: 'Reach SVIP Level 9 nobility status.',
      requirement: 'SVIP Level 9',
      tiers: [
        {
          tierId: 'svip8',
          name: 'SVIP8 Honorable Badge',
          subtitle: 'Reach SVIP Level 8 nobility status',
          badgeName: 'SVIP 8',
          target: 8,
          image: MEDAL_ASSETS.svip8,
        },
        {
          tierId: 'svip9',
          name: 'SVIP9 Honorable Badge',
          subtitle: 'Reach SVIP Level 9 nobility status',
          badgeName: 'SVIP 9',
          target: 9,
          image: MEDAL_ASSETS.svip9,
        },
        {
          tierId: 'svip10',
          name: 'SVIP10 Honorable Badge',
          subtitle: 'Reach SVIP Level 10 imperial nobility (Supreme Tier)',
          badgeName: 'SVIP 10',
          target: 10,
          image: MEDAL_ASSETS.svip10,
        },
      ],
    },
    {
      id: 'svip10_honorable',
      name: 'SVIP10 Honorable Badge',
      category: 'Achievement',
      image: MEDAL_ASSETS.svip10,
      description: 'The pinnacle of honor. The monarch of SVIP 10 commands this royal emblem.',
      howToGet: 'Reach SVIP Level 10 nobility status.',
      requirement: 'SVIP Level 10',
      tiers: [
        {
          tierId: 'svip8',
          name: 'SVIP8 Honorable Badge',
          subtitle: 'Reach SVIP Level 8 nobility status',
          badgeName: 'SVIP 8',
          target: 8,
          image: MEDAL_ASSETS.svip8,
        },
        {
          tierId: 'svip9',
          name: 'SVIP9 Honorable Badge',
          subtitle: 'Reach SVIP Level 9 nobility status',
          badgeName: 'SVIP 9',
          target: 9,
          image: MEDAL_ASSETS.svip9,
        },
        {
          tierId: 'svip10',
          name: 'SVIP10 Honorable Badge',
          subtitle: 'Reach SVIP Level 10 imperial nobility (Supreme Tier)',
          badgeName: 'SVIP 10',
          target: 10,
          image: MEDAL_ASSETS.svip10,
        },
      ],
    },
    {
      id: '10m_gifts_received',
      name: '10M Gifts Received',
      category: 'Achievement',
      image: MEDAL_ASSETS.gifts10m,
      description: 'Overflowing diamond chest awarded for receiving 10,000,000 diamonds in room gifts.',
      howToGet: 'Receive 10M gifts in live audio rooms.',
      requirement: '10,000,000 Diamonds Received',
      tiers: [
        {
          tierId: '10m',
          name: 'Received Gifts',
          subtitle: '10000000 diamonds of gifts received',
          badgeName: '10M Received',
          target: 10000000,
          image: MEDAL_ASSETS.tier10m,
          icon: MEDAL_ASSETS.tierIcon10m,
        },
        {
          tierId: '40m',
          name: '40M Received',
          subtitle: '40000000 diamonds of gifts received',
          badgeName: '40M Received',
          target: 40000000,
          image: MEDAL_ASSETS.tier40m,
          icon: MEDAL_ASSETS.tierIcon40m,
        },
        {
          tierId: '200m',
          name: '200M Received',
          subtitle: '200000000 diamonds of gifts received (Sabse Bada Target)',
          badgeName: '200M Received',
          target: 200000000,
          image: MEDAL_ASSETS.tier200m,
          icon: MEDAL_ASSETS.tierIcon200m,
        },
      ],
    },
    {
      id: 'rich_man',
      name: 'Rich Man',
      category: 'Achievement',
      image: MEDAL_ASSETS.richMan,
      description: 'The golden champion trophy of wealth, distinction, and supreme generosity.',
      howToGet: 'Rank among top patron benefactors on the wealth board.',
      requirement: 'Top Wealth Patron',
      tiers: [
        {
          tierId: 'rich1',
          name: 'Rich Man (Silver)',
          subtitle: 'Send 1,000,000 diamonds in live audio rooms',
          badgeName: '1M Sent',
          target: 1000000,
          image: MEDAL_ASSETS.richMan,
        },
        {
          tierId: 'rich2',
          name: 'Rich Man (Gold)',
          subtitle: 'Send 5,000,000 diamonds in live audio rooms',
          badgeName: '5M Sent',
          target: 5000000,
          image: MEDAL_ASSETS.richMan,
        },
        {
          tierId: 'rich3',
          name: 'Supreme Tycoon',
          subtitle: 'Send 20,000,000 diamonds in live audio rooms (Sabse Bada Target)',
          badgeName: '20M Sent',
          target: 20000000,
          image: MEDAL_ASSETS.richMan,
        },
      ],
    },
    {
      id: '1st_anniversary_supporter',
      name: '1st Anniversary Supporter',
      category: 'Achievement',
      image: MEDAL_ASSETS.anniversary,
      description: 'Exclusive commemorative medal for founding community supporters.',
      howToGet: 'Participate during the 1st Anniversary festival.',
      requirement: '1st Anniversary Gala',
      tiers: [
        {
          tierId: 'anni1',
          name: '1st Anniversary Supporter',
          subtitle: 'Participate in the 1st Anniversary festival',
          badgeName: 'Anniversary',
          target: 1,
          image: MEDAL_ASSETS.anniversary,
        },
        {
          tierId: 'anni2',
          name: 'Anniversary Benefactor',
          subtitle: 'Send 10 exclusive Anniversary festival gifts (Supreme Tier)',
          badgeName: 'Anniversary VIP',
          target: 10,
          image: MEDAL_ASSETS.anniversary,
        },
      ],
    },
    {
      id: 'party_king',
      name: 'Party King',
      category: 'Achievement',
      image: MEDAL_ASSETS.partyKing,
      description: 'The electric disco party medal for premier room entertainers and music hosts.',
      howToGet: 'Host top-rated party rooms with active listeners.',
      requirement: 'Party Room Master',
      tiers: [
        {
          tierId: 'party1',
          name: 'Party Host',
          subtitle: 'Host 10 popular party rooms',
          badgeName: '10 Parties',
          target: 10,
          image: MEDAL_ASSETS.partyKing,
        },
        {
          tierId: 'party2',
          name: 'Disco Legend',
          subtitle: 'Host 50 popular party rooms',
          badgeName: '50 Parties',
          target: 50,
          image: MEDAL_ASSETS.partyKing,
        },
        {
          tierId: 'party3',
          name: 'Party King',
          subtitle: 'Host 200 popular party rooms (Sabse Bada Target)',
          badgeName: '200 Parties',
          target: 200,
          image: MEDAL_ASSETS.partyKing,
        },
      ],
    },
    {
      id: 'lion_throne',
      name: 'Lion Throne',
      category: 'Achievement',
      image: MEDAL_ASSETS.lionThrone,
      description: 'The supreme golden lion throne badge of room sovereignty and leadership.',
      howToGet: 'Attain royal nobility status in Voice Club.',
      requirement: 'Royal Sovereignty',
      tiers: [
        {
          tierId: 'lion1',
          name: 'Lion Knight',
          subtitle: 'Maintain 7-day room reign streak',
          badgeName: '7 Days',
          target: 7,
          image: MEDAL_ASSETS.lionThrone,
        },
        {
          tierId: 'lion2',
          name: 'Lion Sovereign',
          subtitle: 'Maintain 30-day room reign streak',
          badgeName: '30 Days',
          target: 30,
          image: MEDAL_ASSETS.lionThrone,
        },
        {
          tierId: 'lion3',
          name: 'Lion Emperor',
          subtitle: 'Rank #1 Monthly Room Sovereign (Sabse Bada Target)',
          badgeName: 'Rank #1',
          target: 1,
          image: MEDAL_ASSETS.lionThrone,
        },
      ],
    },
  ],
  Activity: [
    {
      id: 'anniversary_activity',
      name: '1st Anniversary Supporter',
      category: 'Activity',
      image: MEDAL_ASSETS.anniversary,
      description: 'Celebrated the glorious 1st anniversary gala of Yaro Voice Club.',
      howToGet: 'Participate in official anniversary gala events.',
      requirement: 'Anniversary Festival',
      tiers: [
        {
          tierId: 'anni1',
          name: '1st Anniversary Supporter',
          subtitle: 'Participate in official anniversary gala events',
          badgeName: 'Anniversary',
          target: 1,
          image: MEDAL_ASSETS.anniversary,
        },
        {
          tierId: 'anni2',
          name: 'Anniversary Benefactor',
          subtitle: 'Send 10 exclusive Anniversary festival gifts (Supreme Tier)',
          badgeName: 'Anniversary VIP',
          target: 10,
          image: MEDAL_ASSETS.anniversary,
        },
      ],
    },
    {
      id: 'party_king_activity',
      name: 'Party King',
      category: 'Activity',
      image: MEDAL_ASSETS.partyKing,
      description: 'The life of the party! Awarded for premier engagement in live club events.',
      howToGet: 'Participate in 20+ official club music sessions.',
      requirement: '20 Club Events',
      tiers: [
        {
          tierId: 'party1',
          name: 'Party Host',
          subtitle: 'Host 10 popular party rooms',
          badgeName: '10 Parties',
          target: 10,
          image: MEDAL_ASSETS.partyKing,
        },
        {
          tierId: 'party2',
          name: 'Disco Legend',
          subtitle: 'Host 50 popular party rooms',
          badgeName: '50 Parties',
          target: 50,
          image: MEDAL_ASSETS.partyKing,
        },
        {
          tierId: 'party3',
          name: 'Party King',
          subtitle: 'Host 200 popular party rooms (Sabse Bada Target)',
          badgeName: '200 Parties',
          target: 200,
          image: MEDAL_ASSETS.partyKing,
        },
      ],
    },
    {
      id: 'golden_mic_activity',
      name: 'Rich Man',
      category: 'Activity',
      image: MEDAL_ASSETS.richMan,
      description: 'Crowned winner of the monthly Voice Club talent contest.',
      howToGet: 'Win 1st place in official talent showcase.',
      requirement: 'Talent Contest Winner',
      tiers: [
        {
          tierId: 'rich1',
          name: 'Rich Man (Silver)',
          subtitle: 'Send 1,000,000 diamonds in live audio rooms',
          badgeName: '1M Sent',
          target: 1000000,
          image: MEDAL_ASSETS.richMan,
        },
        {
          tierId: 'rich2',
          name: 'Rich Man (Gold)',
          subtitle: 'Send 5,000,000 diamonds in live audio rooms',
          badgeName: '5M Sent',
          target: 5000000,
          image: MEDAL_ASSETS.richMan,
        },
        {
          tierId: 'rich3',
          name: 'Supreme Tycoon',
          subtitle: 'Send 20,000,000 diamonds in live audio rooms (Sabse Bada Target)',
          badgeName: '20M Sent',
          target: 20000000,
          image: MEDAL_ASSETS.richMan,
        },
      ],
    },
    {
      id: 'carnival_activity',
      name: 'SVIP9 Honorable Badge',
      category: 'Activity',
      image: MEDAL_ASSETS.svip9,
      description: 'Featured celebrity in the seasonal Carnival festival.',
      howToGet: 'Complete all Carnival quests.',
      requirement: 'Carnival Quest',
      tiers: [
        {
          tierId: 'svip8',
          name: 'SVIP8 Honorable Badge',
          subtitle: 'Reach SVIP Level 8 nobility status',
          badgeName: 'SVIP 8',
          target: 8,
          image: MEDAL_ASSETS.svip8,
        },
        {
          tierId: 'svip9',
          name: 'SVIP9 Honorable Badge',
          subtitle: 'Reach SVIP Level 9 nobility status',
          badgeName: 'SVIP 9',
          target: 9,
          image: MEDAL_ASSETS.svip9,
        },
        {
          tierId: 'svip10',
          name: 'SVIP10 Honorable Badge',
          subtitle: 'Reach SVIP Level 10 imperial nobility (Supreme Tier)',
          badgeName: 'SVIP 10',
          target: 10,
          image: MEDAL_ASSETS.svip10,
        },
      ],
    },
  ],
  Gift: [
    {
      id: '10m_gift_category',
      name: '10M Gifts Received',
      category: 'Gift',
      image: MEDAL_ASSETS.gifts10m,
      description: 'Awarded to legendary hosts who have received over 10,000,000 gifts.',
      howToGet: 'Receive 10,000,000 diamonds in room gifts.',
      requirement: '10M Diamonds Received',
      tiers: [
        {
          tierId: '10m',
          name: 'Received Gifts',
          subtitle: '10000000 diamonds of gifts received',
          badgeName: '10M Received',
          target: 10000000,
          image: MEDAL_ASSETS.tier10m,
          icon: MEDAL_ASSETS.tierIcon10m,
        },
        {
          tierId: '40m',
          name: '40M Received',
          subtitle: '40000000 diamonds of gifts received',
          badgeName: '40M Received',
          target: 40000000,
          image: MEDAL_ASSETS.tier40m,
          icon: MEDAL_ASSETS.tierIcon40m,
        },
        {
          tierId: '200m',
          name: '200M Received',
          subtitle: '200000000 diamonds of gifts received (Sabse Bada Target)',
          badgeName: '200M Received',
          target: 200000000,
          image: MEDAL_ASSETS.tier200m,
          icon: MEDAL_ASSETS.tierIcon200m,
        },
      ],
    },
    {
      id: 'rich_man_gift_category',
      name: 'Rich Man',
      category: 'Gift',
      image: MEDAL_ASSETS.richMan,
      description: 'A symbol of immense generosity and high gifting rank.',
      howToGet: 'Reach 1,000,000 diamonds sent in live rooms.',
      requirement: '1M Diamonds Sent',
      tiers: [
        {
          tierId: 'rich1',
          name: 'Rich Man (Silver)',
          subtitle: 'Send 1,000,000 diamonds in live audio rooms',
          badgeName: '1M Sent',
          target: 1000000,
          image: MEDAL_ASSETS.richMan,
        },
        {
          tierId: 'rich2',
          name: 'Rich Man (Gold)',
          subtitle: 'Send 5,000,000 diamonds in live audio rooms',
          badgeName: '5M Sent',
          target: 5000000,
          image: MEDAL_ASSETS.richMan,
        },
        {
          tierId: 'rich3',
          name: 'Supreme Tycoon',
          subtitle: 'Send 20,000,000 diamonds in live audio rooms (Sabse Bada Target)',
          badgeName: '20M Sent',
          target: 20000000,
          image: MEDAL_ASSETS.richMan,
        },
      ],
    },
    {
      id: 'lion_throne_gift_category',
      name: 'Lion Throne',
      category: 'Gift',
      image: MEDAL_ASSETS.lionThrone,
      description: 'The lion throne bestowed on the #1 gifting patron of the month.',
      howToGet: 'Win #1 spot on monthly patron leaderboard.',
      requirement: 'Rank #1 Monthly Gifter',
      tiers: [
        {
          tierId: 'lion1',
          name: 'Lion Knight',
          subtitle: 'Maintain 7-day room reign streak',
          badgeName: '7 Days',
          target: 7,
          image: MEDAL_ASSETS.lionThrone,
        },
        {
          tierId: 'lion2',
          name: 'Lion Sovereign',
          subtitle: 'Maintain 30-day room reign streak',
          badgeName: '30 Days',
          target: 30,
          image: MEDAL_ASSETS.lionThrone,
        },
        {
          tierId: 'lion3',
          name: 'Lion Emperor',
          subtitle: 'Rank #1 Monthly Room Sovereign (Sabse Bada Target)',
          badgeName: 'Rank #1',
          target: 1,
          image: MEDAL_ASSETS.lionThrone,
        },
      ],
    },
    {
      id: 'svip10_gift_category',
      name: 'SVIP10 Honorable Badge',
      category: 'Gift',
      image: MEDAL_ASSETS.svip10,
      description: 'Imperial badge of the supreme benefactor.',
      howToGet: 'Accumulate top lifetime gifting milestones.',
      requirement: 'Imperial Milestone',
      tiers: [
        {
          tierId: 'svip8',
          name: 'SVIP8 Honorable Badge',
          subtitle: 'Reach SVIP Level 8 nobility status',
          badgeName: 'SVIP 8',
          target: 8,
          image: MEDAL_ASSETS.svip8,
        },
        {
          tierId: 'svip9',
          name: 'SVIP9 Honorable Badge',
          subtitle: 'Reach SVIP Level 9 nobility status',
          badgeName: 'SVIP 9',
          target: 9,
          image: MEDAL_ASSETS.svip9,
        },
        {
          tierId: 'svip10',
          name: 'SVIP10 Honorable Badge',
          subtitle: 'Reach SVIP Level 10 imperial nobility (Supreme Tier)',
          badgeName: 'SVIP 10',
          target: 10,
          image: MEDAL_ASSETS.svip10,
        },
      ],
    },
  ],
  Active: [
    {
      id: 'party_king_active_category',
      name: 'Party King',
      category: 'Active',
      image: MEDAL_ASSETS.partyKing,
      description: 'Stay active in live voice rooms for 100+ hours.',
      howToGet: 'Spend 100 hours in voice chat rooms.',
      requirement: '100 Room Hours',
      tiers: [
        {
          tierId: 'party1',
          name: 'Party Host',
          subtitle: 'Host 10 popular party rooms',
          badgeName: '10 Parties',
          target: 10,
          image: MEDAL_ASSETS.partyKing,
        },
        {
          tierId: 'party2',
          name: 'Disco Legend',
          subtitle: 'Host 50 popular party rooms',
          badgeName: '50 Parties',
          target: 50,
          image: MEDAL_ASSETS.partyKing,
        },
        {
          tierId: 'party3',
          name: 'Party King',
          subtitle: 'Host 200 popular party rooms (Sabse Bada Target)',
          badgeName: '200 Parties',
          target: 200,
          image: MEDAL_ASSETS.partyKing,
        },
      ],
    },
    {
      id: 'lion_throne_active_category',
      name: 'Lion Throne',
      category: 'Active',
      image: MEDAL_ASSETS.lionThrone,
      description: 'Command the throne by checking in 30 consecutive days.',
      howToGet: 'Maintain 30-day consecutive check-in streak.',
      requirement: '30-Day Check-in',
      tiers: [
        {
          tierId: 'lion1',
          name: 'Lion Knight',
          subtitle: 'Maintain 7-day room reign streak',
          badgeName: '7 Days',
          target: 7,
          image: MEDAL_ASSETS.lionThrone,
        },
        {
          tierId: 'lion2',
          name: 'Lion Sovereign',
          subtitle: 'Maintain 30-day room reign streak',
          badgeName: '30 Days',
          target: 30,
          image: MEDAL_ASSETS.lionThrone,
        },
        {
          tierId: 'lion3',
          name: 'Lion Emperor',
          subtitle: 'Rank #1 Monthly Room Sovereign (Sabse Bada Target)',
          badgeName: 'Rank #1',
          target: 1,
          image: MEDAL_ASSETS.lionThrone,
        },
      ],
    },
    {
      id: 'svip8_active_category',
      name: 'SVIP8 Honorable Badge',
      category: 'Active',
      image: MEDAL_ASSETS.svip8,
      description: 'Active SVIP club nobility medal.',
      howToGet: 'Active SVIP member.',
      requirement: 'Active SVIP',
      tiers: [
        {
          tierId: 'svip8',
          name: 'SVIP8 Honorable Badge',
          subtitle: 'Reach SVIP Level 8 nobility status',
          badgeName: 'SVIP 8',
          target: 8,
          image: MEDAL_ASSETS.svip8,
        },
        {
          tierId: 'svip9',
          name: 'SVIP9 Honorable Badge',
          subtitle: 'Reach SVIP Level 9 nobility status',
          badgeName: 'SVIP 9',
          target: 9,
          image: MEDAL_ASSETS.svip9,
        },
        {
          tierId: 'svip10',
          name: 'SVIP10 Honorable Badge',
          subtitle: 'Reach SVIP Level 10 imperial nobility (Supreme Tier)',
          badgeName: 'SVIP 10',
          target: 10,
          image: MEDAL_ASSETS.svip10,
        },
      ],
    },
    {
      id: 'rich_man_active_category',
      name: 'Rich Man',
      category: 'Active',
      image: MEDAL_ASSETS.richMan,
      description: 'Active top contributor in room games and audio sessions.',
      howToGet: 'Win 50 room game rounds.',
      requirement: '50 Game Wins',
      tiers: [
        {
          tierId: 'rich1',
          name: 'Rich Man (Silver)',
          subtitle: 'Send 1,000,000 diamonds in live audio rooms',
          badgeName: '1M Sent',
          target: 1000000,
          image: MEDAL_ASSETS.richMan,
        },
        {
          tierId: 'rich2',
          name: 'Rich Man (Gold)',
          subtitle: 'Send 5,000,000 diamonds in live audio rooms',
          badgeName: '5M Sent',
          target: 5000000,
          image: MEDAL_ASSETS.richMan,
        },
        {
          tierId: 'rich3',
          name: 'Supreme Tycoon',
          subtitle: 'Send 20,000,000 diamonds in live audio rooms (Sabse Bada Target)',
          badgeName: '20M Sent',
          target: 20000000,
          image: MEDAL_ASSETS.richMan,
        },
      ],
    },
  ],
};

const TABS = ['Achievement', 'Activity', 'Gift', 'Active'];

export default function Medal() {
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const navigation = useNavigation();
  const { user, setUser } = useContext(AuthContext);

  // Screen View Mode: 'center' (Medal Center) or 'my_badge' (10 Slots View from user screenshot)
  const [viewMode, setViewMode] = useState('center');

  // Medal Center states
  const [activeTab, setActiveTab] = useState('Achievement'); // 'Achievement' | 'Activity' | 'Gift' | 'Active' | 'store'
  const [medals, setMedals] = useState([]); // owned
  const [storeMedals, setStoreMedals] = useState([]); // store catalog
  const [busy, setBusy] = useState(false);
  const [selectedMedal, setSelectedMedal] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);

  // 10 Badge Slots State for "My Badge" screen
  const [badgeSlots, setBadgeSlots] = useState(() => {
    const initial = Array(10).fill(null);
    return initial;
  });
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(null);
  const [showWearBadgeSheet, setShowWearBadgeSheet] = useState(false);
  const [activeTierIndex, setActiveTierIndex] = useState(0);

  const handleOpenMedalStage = (medal) => {
    setSelectedMedal(medal);
    const tiers = medal?.tiers || [];
    const foundIdx = tiers.findIndex(t => t.name === medal.name || t.badgeName === medal.name);
    setActiveTierIndex(foundIdx >= 0 ? foundIdx : 0);
    setViewMode('stage_detail');
  };

  const loadMedals = useCallback(async () => {
    try {
      const [inventory, catalog] = await Promise.all([
        apiUtil.get('/store/inventory'),
        apiUtil.get('/store/items', { params: { category: 'Badge', activeOnly: true } }),
      ]);
      const mapMedal = entry => {
        const item = entry.catalogItem || entry;
        const itemName = item.name || entry.name || 'Medal';
        const costPrice = item.priceOptions?.find(opt => opt.days === 30)?.diamonds ?? item.price ?? 15;
        return {
          ...entry,
          id: String(entry.itemId || item._id || entry._id || itemName),
          name: itemName,
          imageUrl: item.imageUrl || entry.imageUrl || '',
          description: item.desc || entry.description || 'Prestige Voice Club Medal',
          isOwned: Boolean(entry.catalogItem || entry.isOwned),
          isEquipped: user?.equippedBadge === itemName,
          price: costPrice,
          cost: `${costPrice} diamonds`,
          progress: item.validity || '30 Days',
        };
      };
      const owned = (inventory.data?.data?.items || [])
        .filter(entry => String(entry.catalogItem?.category || entry.category).toLowerCase() === 'badge')
        .map(mapMedal);
      setMedals(owned);

      // Initialize slot 1 with equipped badge if exists
      if (owned.length > 0) {
        const equippedOne = owned.find(m => m.name === user?.equippedBadge) || owned[0];
        if (equippedOne) {
          setBadgeSlots(prev => {
            const next = [...prev];
            next[0] = equippedOne;
            return next;
          });
        }
      }

      setStoreMedals((catalog.data?.data?.items || []).map(mapMedal));
    } catch (err) {
      console.warn('[Medals] Failed to load store/inventory:', err?.message || err);
    }
  }, [user?.equippedBadge]);

  useFocusEffect(
    useCallback(() => {
      loadMedals().catch(error => AlertService.error('Medals', error?.message || 'Could not load medals'));
    }, [loadMedals])
  );

  const handleEquipToggle = async (targetMedal) => {
    if (!targetMedal) return;
    setBusy(true);
    try {
      const isCurrentlyEquipped = user?.equippedBadge === targetMedal.name || targetMedal.isEquipped;
      const response = await apiUtil.post('/store/equip', {
        itemId: targetMedal.id,
        name: targetMedal.name,
        category: 'Badge',
        equipped: !isCurrentlyEquipped,
      });
      const updated = response.data?.data?.user || response.data?.data;
      if (updated) {
        setUser(prev => ({ ...prev, ...updated, equippedBadge: !isCurrentlyEquipped ? targetMedal.name : null }));
      } else {
        setUser(prev => ({ ...prev, equippedBadge: !isCurrentlyEquipped ? targetMedal.name : null }));
      }
      setMedals(prev =>
        prev.map(item => ({
          ...item,
          isEquipped: item.id === targetMedal.id ? !isCurrentlyEquipped : false,
        }))
      );
      if (selectedMedal && selectedMedal.id === targetMedal.id) {
        setSelectedMedal(prev => ({ ...prev, isEquipped: !isCurrentlyEquipped }));
      }
    } catch (error) {
      AlertService.error('Medals', error?.message || 'Could not update medal');
    } finally {
      setBusy(false);
    }
  };

  const buyMedal = (targetMedal) => {
    if (!targetMedal) return;
    AlertService.show(
      'Purchase Badge',
      `Unlock ${targetMedal.name} for ${targetMedal.cost || `${targetMedal.price || 15} diamonds`}?`,
      'info',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Buy',
          onPress: async () => {
            setBusy(true);
            try {
              const response = await apiUtil.post('/store/buy', { itemId: targetMedal.id, durationDays: 30 });
              if (response.data?.data?.remainingDiamonds !== undefined) {
                setUser(prev => ({ ...prev, diamonds: response.data.data.remainingDiamonds }));
              }
              await loadMedals();
              setShowDetailModal(false);
            } catch (error) {
              AlertService.error('Medals', error?.message || 'Could not buy medal');
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  };

  // Combine static category catalog with backend store items
  const currentTabMedals = useMemo(() => {
    if (activeTab === 'store' || activeTab === 'Medal Store') {
      return storeMedals;
    }
    const staticList = MEDAL_CATALOG[activeTab] || MEDAL_CATALOG.Achievement;
    return staticList.map(item => {
      const ownedMatch = medals.find(m => m.name === item.name || m.id === item.id);
      return {
        ...item,
        isOwned: Boolean(ownedMatch),
        isEquipped: user?.equippedBadge === item.name || Boolean(ownedMatch?.isEquipped),
        id: ownedMatch ? ownedMatch.id : item.id,
      };
    });
  }, [activeTab, medals, storeMedals, user?.equippedBadge]);

  const firstMedal = medals[0] || currentTabMedals[0] || null;

  // Equip a badge into a slot
  const handleSlotSelect = (slotIndex) => {
    setSelectedSlotIndex(slotIndex);
    setShowWearBadgeSheet(true);
  };

  const handleWearBadgeIntoSlot = async (badge) => {
    if (selectedSlotIndex === null) return;
    const nextSlots = [...badgeSlots];
    nextSlots[selectedSlotIndex] = badge;
    setBadgeSlots(nextSlots);
    setShowWearBadgeSheet(false);
    // Auto equip first slot badge
    if (selectedSlotIndex === 0) {
      await handleEquipToggle(badge);
    }
  };

  const handleRemoveBadgeFromSlot = (slotIndex) => {
    const nextSlots = [...badgeSlots];
    const removedBadge = nextSlots[slotIndex];
    nextSlots[slotIndex] = null;
    setBadgeSlots(nextSlots);
    if (slotIndex === 0 && removedBadge?.name === user?.equippedBadge) {
      handleEquipToggle(removedBadge);
    }
  };

  const handleSaveBadges = async () => {
    const activeOne = badgeSlots.find(Boolean);
    if (activeOne) {
      await handleEquipToggle(activeOne);
    }
    AlertService.show('Saved', 'Your badges have been saved successfully!', 'success');
    setViewMode('center');
  };

  // ==========================================
  // VIEW 3: "STAGE TARGET / TIER SHOWCASE" SCREEN (Mockup 10M / 40M / 200M)
  // ==========================================
  if (viewMode === 'stage_detail') {
    const currentMedal = selectedMedal || currentTabMedals[0];
    const tiers = currentMedal?.tiers || [
      {
        tierId: 'default',
        name: currentMedal?.name || 'Honor Medal',
        subtitle: currentMedal?.requirement || currentMedal?.description || 'Earn this medal by participating in Voice Club.',
        badgeName: currentMedal?.name || 'Medal',
        target: 10000000,
        image: currentMedal?.image || (currentMedal?.imageUrl ? { uri: currentMedal.imageUrl } : null),
      },
    ];
    const currentTier = tiers[activeTierIndex] || tiers[0];
    const targetValue = currentTier.target || 10000000;
    const userProgress = user?.diamondsReceived || 0;
    const progressPercent = Math.min(1, Math.max(0, userProgress / targetValue));
    const needValue = Math.max(0, targetValue - userProgress);

    return (
      <View style={s.container}>
        {/* Luxury Deep Dark Golden Glow Stage */}
        <LinearGradient
          colors={['#0B0415', '#160B26', '#0B0415', '#06020A']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={s.goldenWaveTop} />
        <View style={s.goldenWaveBottom} />

        {/* Top Header with Back button */}
        <View style={[s.stageHeader, { paddingTop: topSafeInset + 8 }]}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => setViewMode('center')}
            hitSlop={12}
            activeOpacity={0.7}
          >
            <Icon name="chevron-back" size={24} color="#F59E0B" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={s.stageScrollContent} showsVerticalScrollIndicator={false}>
          {/* Spotlight Pedestal Stage */}
          <View style={s.stagePodiumWrap}>
            {/* Ambient Halo Behind Medal */}
            <View style={s.stageHaloGlow} />

            {/* Featured Medal (Standing Proud on Stage) */}
            <View style={s.featuredMedalBox}>
              {currentTier.image ? (
                <Image source={currentTier.image} style={s.featuredMedalImg} resizeMode="contain" />
              ) : currentMedal?.imageUrl ? (
                <Image source={{ uri: currentMedal.imageUrl }} style={s.featuredMedalImg} resizeMode="contain" />
              ) : (
                <MaterialCommunityIcons name="shield-star" size={130} color="#F59E0B" />
              )}
            </View>

            {/* Glowing Golden Podium / Pedestal beneath medal */}
            <Image source={MEDAL_ASSETS.podium} style={s.stagePodiumImg} resizeMode="contain" />
          </View>

          {/* Title & Target Description */}
          <View style={s.stageInfoBlock}>
            <Text style={s.stageTitleText}>{currentTier.name}</Text>
            <Text style={s.stageDescText}>{currentTier.subtitle}</Text>
          </View>

          {/* Progress Bar & Need Text */}
          <View style={s.stageProgressBlock}>
            <View style={s.stageProgressLabels}>
              <Text style={s.stageProgressNum}>{userProgress.toLocaleString()}</Text>
              <Text style={s.stageProgressNum}>{targetValue.toLocaleString()}</Text>
            </View>
            <View style={s.stageProgressBarTrack}>
              <LinearGradient
                colors={['#FDE68A', '#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[s.stageProgressBarFill, { width: `${Math.max(5, progressPercent * 100)}%` }]}
              />
            </View>
            <Text style={s.stageNeedText}>Need: {needValue.toLocaleString()}</Text>
          </View>

          {/* Divider flourish */}
          <View style={s.stageFlourishDivider}>
            <View style={s.flourishLine} />
            <Text style={s.flourishDiamond}>◆</Text>
            <View style={s.flourishLine} />
          </View>

          {/* Tier Chain Progression (10M Received >> 40M Received >> 200M Received) */}
          {tiers.length > 1 && (
            <View style={s.stageTiersChainRow}>
              {tiers.map((t, index) => {
                const isActive = index === activeTierIndex;
                return (
                  <React.Fragment key={t.tierId || `tier-${index}`}>
                    {index > 0 && <Text style={s.tierArrowPip}>»</Text>}
                    <TouchableOpacity
                      style={[s.tierChainItem, isActive && s.tierChainItemActive]}
                      onPress={() => setActiveTierIndex(index)}
                      activeOpacity={0.8}
                    >
                      <View style={s.tierChainIconWrap}>
                        {t.icon ? (
                          <Image source={t.icon} style={s.tierChainIconImg} resizeMode="contain" />
                        ) : t.image ? (
                          <Image source={t.image} style={s.tierChainIconImg} resizeMode="contain" />
                        ) : (
                          <MaterialCommunityIcons name="shield-star" size={32} color={isActive ? "#F59E0B" : "#94A3B8"} />
                        )}
                      </View>
                      <Text style={[s.tierChainLabel, isActive && s.tierChainLabelActive]} numberOfLines={1}>
                        {t.badgeName || t.name}
                      </Text>
                    </TouchableOpacity>
                  </React.Fragment>
                );
              })}
            </View>
          )}

          {/* Actions: Wear / Buy */}
          <View style={s.stageActionWrap}>
            {currentMedal.isOwned || medals.some(m => m.name === currentMedal.name) ? (
              <TouchableOpacity
                style={[
                  s.stageEquipBtn,
                  (user?.equippedBadge === currentMedal.name || currentMedal.isEquipped) && s.stageEquipBtnActive,
                ]}
                onPress={() => handleEquipToggle(currentMedal)}
                activeOpacity={0.8}
              >
                <Text style={s.stageEquipBtnText}>
                  {user?.equippedBadge === currentMedal.name || currentMedal.isEquipped
                    ? 'Wearing'
                    : 'Wear on Profile'}
                </Text>
              </TouchableOpacity>
            ) : currentMedal.cost ? (
              <TouchableOpacity
                style={s.stageBuyBtn}
                onPress={() => buyMedal(currentMedal)}
                activeOpacity={0.8}
              >
                <Text style={s.stageBuyBtnText}>Unlock for {currentMedal.cost}</Text>
              </TouchableOpacity>
            ) : (
              <View style={s.stageLockedNotice}>
                <MaterialCommunityIcons name="lock-outline" size={16} color="#F59E0B" style={{ marginRight: 6 }} />
                <Text style={s.stageLockedNoticeText}>
                  Complete target to unlock this prestige badge
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  // ==========================================
  // VIEW 2: "MY BADGE" SCREEN (Mockup 2 & 3)
  // ==========================================
  if (viewMode === 'my_badge') {
    return (
      <View style={s.container}>
        {/* Luxury Dark Golden Glow Background */}
        <LinearGradient
          colors={['#10061E', '#180B26', '#0F0619', '#08030C']}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Golden Waves Aura Framing */}
        <View style={s.goldenWaveTop} />
        <View style={s.goldenWaveBottom} />

        {/* Top Header */}
        <View style={[s.myBadgeHeader, { paddingTop: topSafeInset + 8 }]}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => setViewMode('center')}
            hitSlop={12}
            activeOpacity={0.7}
          >
            <Icon name="chevron-back" size={24} color="#F59E0B" />
          </TouchableOpacity>

          {/* Title: Crown + "My Badge" */}
          <View style={s.myBadgeTitleWrap}>
            <MaterialCommunityIcons name="crown" size={18} color="#F59E0B" />
            <Text style={s.myBadgeTitleText}>My Badge</Text>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={s.saveBtn}
            onPress={handleSaveBadges}
            hitSlop={12}
            activeOpacity={0.7}
          >
            <Text style={s.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Section Header: —————— Current using badge —————— */}
        <View style={s.currentUsingSection}>
          <View style={s.dividerLine} />
          <Text style={s.currentUsingText}>Current using badge</Text>
          <View style={s.dividerLine} />
        </View>
        <Text style={s.currentUsingPip}>◆</Text>

        {/* 10 Badge Slots Grid (2 rows x 5 columns) */}
        <View style={s.slotsGridContainer}>
          {/* Row 1: Slots 1 to 5 */}
          <View style={s.slotsRow}>
            {[0, 1, 2, 3, 4].map(idx => {
              const slotBadge = badgeSlots[idx];
              const slotNumber = idx + 1;
              return (
                <TouchableOpacity
                  key={`slot-${idx}`}
                  style={[s.slotBox, slotBadge && s.slotBoxFilled]}
                  onPress={() => (slotBadge ? handleRemoveBadgeFromSlot(idx) : handleSlotSelect(idx))}
                  activeOpacity={0.75}
                >
                  {slotBadge ? (
                    <View style={s.slotBadgeFilledWrap}>
                      {slotBadge.image ? (
                        <Image source={slotBadge.image} style={s.slotBadgeImg} resizeMode="contain" />
                      ) : (
                        <MaterialCommunityIcons name="shield-star" size={26} color="#F59E0B" />
                      )}
                      <Text style={s.slotNumText}>{slotNumber}</Text>
                    </View>
                  ) : (
                    <>
                      <View style={s.slotPlusCircle}>
                        <Icon name="add" size={18} color="#F59E0B" />
                      </View>
                      <Text style={s.slotNumText}>{slotNumber}</Text>
                    </>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Row 2: Slots 6 to 10 */}
          <View style={s.slotsRow}>
            {[5, 6, 7, 8, 9].map(idx => {
              const slotBadge = badgeSlots[idx];
              const slotNumber = idx + 1;
              return (
                <TouchableOpacity
                  key={`slot-${idx}`}
                  style={[s.slotBox, slotBadge && s.slotBoxFilled]}
                  onPress={() => (slotBadge ? handleRemoveBadgeFromSlot(idx) : handleSlotSelect(idx))}
                  activeOpacity={0.75}
                >
                  {slotBadge ? (
                    <View style={s.slotBadgeFilledWrap}>
                      {slotBadge.image ? (
                        <Image source={slotBadge.image} style={s.slotBadgeImg} resizeMode="contain" />
                      ) : (
                        <MaterialCommunityIcons name="shield-star" size={26} color="#F59E0B" />
                      )}
                      <Text style={s.slotNumText}>{slotNumber}</Text>
                    </View>
                  ) : (
                    <>
                      <View style={s.slotPlusCircle}>
                        <Icon name="add" size={18} color="#F59E0B" />
                      </View>
                      <Text style={s.slotNumText}>{slotNumber}</Text>
                    </>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* "Wear Badge" Bottom Sheet (Mockup 3) */}
        <Modal
          visible={showWearBadgeSheet}
          transparent
          animationType="slide"
          onRequestClose={() => setShowWearBadgeSheet(false)}
        >
          <View style={s.sheetOverlay}>
            <TouchableOpacity
              style={s.sheetDismissArea}
              onPress={() => setShowWearBadgeSheet(false)}
              activeOpacity={1}
            />

            <View style={[s.wearBadgeSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
              {/* Sheet Drag Indicator */}
              <View style={s.sheetHandle} />

              {/* Title: Wear Badge */}
              <Text style={s.wearBadgeSheetTitle}>Wear Badge</Text>

              {medals.length === 0 ? (
                /* Empty state matching mockup 3 */
                <View style={s.emptyBadgeStateBox}>
                  <View style={s.emptyBoxIllustration}>
                    <MaterialCommunityIcons name="cube-outline" size={72} color="#D1D5DB" />
                    <View style={s.emptyBoxGlowRadiance}>
                      <Text style={{ fontSize: 18, color: '#E2E8F0' }}>✧</Text>
                    </View>
                  </View>
                  <Text style={s.emptyBadgeStateText}>You haven't got a badge yet.</Text>
                </View>
              ) : (
                /* Owned Badges Selection List */
                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 320 }}>
                  {medals.map(m => (
                    <TouchableOpacity
                      key={m.id + m.name}
                      style={s.wearBadgeOptionRow}
                      onPress={() => handleWearBadgeIntoSlot(m)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="shield-star" size={32} color="#F59E0B" />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={s.wearBadgeOptionName}>{m.name}</Text>
                        <Text style={s.wearBadgeOptionSub}>{m.description || 'Prestige Badge'}</Text>
                      </View>
                      <View style={s.wearBadgeSelectBtn}>
                        <Text style={s.wearBadgeSelectBtnText}>Wear</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // ==========================================
  // VIEW 1: "MEDAL CENTER" SCREEN (Mockup 1)
  // ==========================================
  return (
    <View style={s.container}>
      {/* Luxury Royal Palace Background */}
      <LinearGradient
        colors={['#10061E', '#1C0D30', '#130822', '#0A0312']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Floating Sparkles & Pillars Aura */}
      <View style={s.sparkleAuraTop} />
      <View style={s.sparkleAuraBottom} />

      {/* Top Header Bar */}
      <View style={[s.header, { paddingTop: topSafeInset + 8 }]}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={12}
          activeOpacity={0.7}
        >
          <Icon name="chevron-back" size={26} color="#F59E0B" />
        </TouchableOpacity>

        {/* Center Title with Royal Crown */}
        <View style={s.headerCenter}>
          <Image source={MEDAL_ASSETS.headerCrown} style={s.headerCrownImg} resizeMode="contain" />
          <Text style={s.headerTitle}>Medal Center</Text>
          <Text style={s.headerDiamondPip}>◆</Text>
        </View>

        {/* Top Right Help Rules Button */}
        <TouchableOpacity
          style={s.rulesBtn}
          onPress={() => setShowRulesModal(true)}
          hitSlop={12}
          activeOpacity={0.7}
        >
          <Icon name="help-circle-outline" size={24} color="#F59E0B" />
        </TouchableOpacity>
      </View>

      {/* Segmented Pill Tabs: Achievement | Activity | Gift | Active */}
      <View style={s.tabsWrapper}>
        <View style={s.tabsContainer}>
          {TABS.map((tab, idx) => {
            const isActive = activeTab === tab;
            return (
              <React.Fragment key={tab}>
                {idx > 0 && <View style={s.tabDivider} />}
                <TouchableOpacity
                  style={[s.tabItem, isActive && s.tabItemActive]}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.8}
                >
                  {isActive ? (
                    <LinearGradient
                      colors={['#FDE68A', '#F59E0B', '#D97706']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={s.activeTabGradient}
                    >
                      <Text style={s.activeTabText}>{tab}</Text>
                    </LinearGradient>
                  ) : (
                    <Text style={s.inactiveTabText}>{tab}</Text>
                  )}
                </TouchableOpacity>
              </React.Fragment>
            );
          })}
        </View>
      </View>

      {/* Quick Wear & Store Compatibility Bar */}
      <View style={s.compatRow}>
        <TouchableOpacity
          style={[s.compatBtn, activeTab === 'Achievement' && s.compatBtnActive]}
          onPress={() => (firstMedal ? handleEquipToggle(firstMedal) : null)}
          activeOpacity={0.7}
        >
          <Icon name="ribbon-outline" size={14} color="#F59E0B" style={{ marginRight: 4 }} />
          <Text style={s.compatBtnText}>Wear on Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.compatBtn, activeTab === 'store' && s.compatBtnActive]}
          onPress={() => setActiveTab(prev => (prev === 'store' ? 'Achievement' : 'store'))}
          activeOpacity={0.7}
        >
          <Icon name="cart-outline" size={14} color="#F59E0B" style={{ marginRight: 4 }} />
          <Text style={s.compatBtnText}>
            {activeTab === 'store' ? 'Achievement' : 'Medal Store'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 2-Column Medals Grid */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        <View style={s.grid}>
          {currentTabMedals.map(medal => {
            const isEquipped = user?.equippedBadge === medal.name || medal.isEquipped;
            return (
              <TouchableOpacity
                key={medal.id + medal.name}
                style={[s.card, isEquipped && s.cardEquipped]}
                onPress={() => {
                  if (activeTab === 'store' || activeTab === 'Medal Store') {
                    buyMedal(medal);
                  } else {
                    handleOpenMedalStage(medal);
                  }
                }}
                activeOpacity={0.82}
              >
                {/* Equipped Ribbon Badge */}
                {isEquipped && (
                  <View style={s.equippedPill}>
                    <Text style={s.equippedPillText}>Wearing</Text>
                  </View>
                )}

                {/* Medal Graphic */}
                <View style={s.medalImgWrap}>
                  {medal.image ? (
                    <Image source={medal.image} style={s.medalImg} resizeMode="contain" />
                  ) : medal.imageUrl ? (
                    <Image source={{ uri: medal.imageUrl }} style={s.medalImg} resizeMode="contain" />
                  ) : (
                    <MaterialCommunityIcons name="shield-star" size={54} color="#F59E0B" />
                  )}
                </View>

                {/* Medal Title */}
                <Text style={s.cardTitle} numberOfLines={2}>
                  {medal.name}
                </Text>

                {/* Star / Diamond pip */}
                <Text style={s.cardStarPip}>✦</Text>

                {/* Store Price Button (always rendered if cost exists) */}
                {medal.cost && (
                  <TouchableOpacity
                    style={s.storePricePill}
                    onPress={() => buyMedal(medal)}
                    activeOpacity={0.7}
                  >
                    <Text style={s.storePricePillText}>{medal.cost}</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Bottom Floating "My Medals" Button -> Opens "My Badge" view */}
      <View style={[s.bottomBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <TouchableOpacity
          style={s.myMedalsBtn}
          onPress={() => setViewMode('my_badge')}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={['#FDE68A', '#F59E0B', '#D97706', '#92400E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.myMedalsGradient}
          >
            <Text style={s.laurelLeaf}>🌿</Text>
            <Text style={s.myMedalsBtnText}>My Medals</Text>
            <Text style={s.laurelLeaf}>🌿</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Modal 1: Medal Detail Preview & Actions */}
      <Modal
        visible={showDetailModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <TouchableOpacity
              style={s.modalClose}
              onPress={() => setShowDetailModal(false)}
              hitSlop={10}
            >
              <Icon name="close" size={22} color="#CBD5E1" />
            </TouchableOpacity>

            {selectedMedal && (
              <>
                <View style={s.modalMedalGlow}>
                  {selectedMedal.image ? (
                    <Image source={selectedMedal.image} style={s.modalMedalImg} resizeMode="contain" />
                  ) : selectedMedal.imageUrl ? (
                    <Image source={{ uri: selectedMedal.imageUrl }} style={s.modalMedalImg} resizeMode="contain" />
                  ) : (
                    <MaterialCommunityIcons name="shield-star" size={90} color="#F59E0B" />
                  )}
                </View>

                <Text style={s.modalTitle}>{selectedMedal.name}</Text>
                <View style={s.categoryPill}>
                  <Text style={s.categoryPillText}>{selectedMedal.category || 'Achievement'} Medal</Text>
                </View>

                <Text style={s.modalDesc}>{selectedMedal.description}</Text>

                <View style={s.howToBox}>
                  <Text style={s.howToBoxHeader}>HOW TO OBTAIN</Text>
                  <Text style={s.howToBoxText}>{selectedMedal.howToGet || selectedMedal.requirement || 'Participate in Voice Club events.'}</Text>
                </View>

                <View style={s.modalActions}>
                  {selectedMedal.isOwned || medals.some(m => m.name === selectedMedal.name) ? (
                    <TouchableOpacity
                      style={[
                        s.equipActionBtn,
                        (user?.equippedBadge === selectedMedal.name || selectedMedal.isEquipped) && s.equipActionBtnActive,
                      ]}
                      onPress={() => handleEquipToggle(selectedMedal)}
                      disabled={busy}
                      activeOpacity={0.8}
                    >
                      <Text style={s.equipActionBtnText}>
                        {user?.equippedBadge === selectedMedal.name || selectedMedal.isEquipped
                          ? 'Take Off'
                          : 'Wear on Profile'}
                      </Text>
                    </TouchableOpacity>
                  ) : selectedMedal.cost || selectedMedal.price ? (
                    <TouchableOpacity
                      style={s.buyActionBtn}
                      onPress={() => buyMedal(selectedMedal)}
                      disabled={busy}
                      activeOpacity={0.8}
                    >
                      <Text style={s.buyActionBtnText}>
                        Buy for {selectedMedal.cost || `${selectedMedal.price || 15} diamonds`}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={s.lockedActionBtn}
                      onPress={() => {
                        setShowDetailModal(false);
                        if (selectedMedal.name?.includes('SVIP')) {
                          navigation.navigate('SVIP');
                        } else {
                          AlertService.show('Achievement Locked', selectedMedal.howToGet || 'Meet the requirement to unlock this medal.', 'info');
                        }
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={s.lockedActionBtnText}>
                        {selectedMedal.name?.includes('SVIP') ? 'View SVIP Perks' : 'Locked'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal 2: Medal Center Rules */}
      <Modal
        visible={showRulesModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRulesModal(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.myMedalsHeaderRow}>
              <Text style={s.modalTitle}>Medal Center Rules</Text>
              <TouchableOpacity onPress={() => setShowRulesModal(false)} hitSlop={10}>
                <Icon name="close" size={22} color="#CBD5E1" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 12 }}>
              <View style={s.ruleSection}>
                <Text style={s.ruleSectionTitle}>👑 Achievement Medals</Text>
                <Text style={s.ruleSectionText}>Honorable distinctions earned through noble SVIP milestones, high wealth ranks, and lifetime achievements.</Text>
              </View>

              <View style={s.ruleSection}>
                <Text style={s.ruleSectionTitle}>🎉 Activity Medals</Text>
                <Text style={s.ruleSectionText}>Limited-edition rewards granted by participating in festivals, anniversaries, and official Voice Club galas.</Text>
              </View>

              <View style={s.ruleSection}>
                <Text style={s.ruleSectionTitle}>💎 Gift Medals</Text>
                <Text style={s.ruleSectionText}>Prestigious treasures unlocked by reaching landmark diamond volumes sent or received in live audio rooms.</Text>
              </View>

              <View style={s.ruleSection}>
                <Text style={s.ruleSectionTitle}>⚡ Active Medals</Text>
                <Text style={s.ruleSectionText}>Rewarded to devoted club members who maintain check-in streaks, active room hours, and community contributions.</Text>
              </View>

              <View style={s.ruleSection}>
                <Text style={s.ruleSectionTitle}>✨ Medal Display</Text>
                <Text style={s.ruleSectionText}>Equip any unlocked medal via "My Medals" to show it off on your profile card, user bubble, and live room seat!</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0617',
  },
  sparkleAuraTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    backgroundColor: 'rgba(217, 119, 6, 0.06)',
  },
  sparkleAuraBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: 'rgba(147, 51, 234, 0.08)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCrownImg: {
    width: 140,
    height: 36,
    marginBottom: -4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  headerDiamondPip: {
    fontSize: 10,
    color: '#D97706',
    marginTop: 2,
  },
  rulesBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Segmented Tabs
  tabsWrapper: {
    paddingHorizontal: 16,
    marginTop: 6,
    marginBottom: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#201035',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.28)',
    padding: 3,
  },
  tabItem: {
    flex: 1,
    height: 38,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemActive: {
    overflow: 'hidden',
  },
  activeTabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E1000',
  },
  inactiveTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  tabDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },

  // Quick Action / Compatibility Bar
  compatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  compatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  compatBtnActive: {
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  compatBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FDE68A',
  },

  // Medals Grid
  scrollContent: {
    paddingHorizontal: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#1E0E35',
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.28)',
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  cardEquipped: {
    borderColor: '#F59E0B',
    backgroundColor: '#271244',
  },
  equippedPill: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#F59E0B',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 2,
  },
  equippedPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#1E1000',
  },
  medalImgWrap: {
    width: 100,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  medalImg: {
    width: '100%',
    height: '100%',
  },
  cardTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'center',
    minHeight: 32,
  },
  cardStarPip: {
    fontSize: 9,
    color: '#D97706',
    marginTop: 2,
  },
  storePricePill: {
    marginTop: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  storePricePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FDE68A',
  },

  // Fixed Bottom Bar & "My Medals" Button
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 10,
    backgroundColor: 'rgba(14, 6, 23, 0.92)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(245, 158, 11, 0.2)',
  },
  myMedalsBtn: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  myMedalsGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  myMedalsBtnText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1E0E00',
    marginHorizontal: 12,
    letterSpacing: 0.5,
  },
  laurelLeaf: {
    fontSize: 18,
  },

  // ==========================================
  // "MY BADGE" SCREEN STYLES (Mockup 2 & 3)
  // ==========================================
  goldenWaveTop: {
    position: 'absolute',
    top: -40,
    left: -40,
    right: -40,
    height: 180,
    borderBottomLeftRadius: 160,
    borderBottomRightRadius: 160,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(245, 158, 11, 0.35)',
    backgroundColor: 'rgba(217, 119, 6, 0.04)',
  },
  goldenWaveBottom: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    right: -40,
    height: 180,
    borderTopLeftRadius: 160,
    borderTopRightRadius: 160,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(245, 158, 11, 0.35)',
    backgroundColor: 'rgba(217, 119, 6, 0.04)',
  },
  myBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  myBadgeTitleWrap: {
    alignItems: 'center',
  },
  myBadgeTitleText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
    letterSpacing: 0.4,
  },
  saveBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F59E0B',
  },
  currentUsingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 36,
    marginTop: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(245, 158, 11, 0.3)',
  },
  currentUsingText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FDE68A',
    marginHorizontal: 10,
    letterSpacing: 0.3,
  },
  currentUsingPip: {
    textAlign: 'center',
    color: '#F59E0B',
    fontSize: 9,
    marginTop: 4,
    marginBottom: 20,
  },
  slotsGridContainer: {
    paddingHorizontal: 16,
  },
  slotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  slotBox: {
    width: SLOT_SIZE,
    height: SLOT_SIZE + 10,
    borderRadius: 16,
    backgroundColor: '#1E0E30',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  slotBoxFilled: {
    borderColor: '#F59E0B',
    backgroundColor: '#2A1444',
  },
  slotPlusCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.5)',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  slotNumText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FDE68A',
  },
  slotBadgeFilledWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotBadgeImg: {
    width: 38,
    height: 38,
    marginBottom: 2,
  },

  // "Wear Badge" Bottom Sheet
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheetDismissArea: {
    flex: 1,
  },
  wearBadgeSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 14,
  },
  wearBadgeSheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyBadgeStateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyBoxIllustration: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyBoxGlowRadiance: {
    position: 'absolute',
    top: -12,
  },
  emptyBadgeStateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  wearBadgeOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  wearBadgeOptionName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  wearBadgeOptionSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  wearBadgeSelectBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F59E0B',
  },
  wearBadgeSelectBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E1000',
  },

  // Modals Overlay & Card
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 2, 18, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#1E0E35',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 10,
  },
  modalClose: {
    position: 'absolute',
    top: 14,
    right: 14,
    padding: 4,
    zIndex: 2,
  },
  modalMedalGlow: {
    width: 140,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 10,
  },
  modalMedalImg: {
    width: '100%',
    height: '100%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  categoryPill: {
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 6,
    marginBottom: 10,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FDE68A',
  },
  modalDesc: {
    fontSize: 13,
    color: '#CBD5E1',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
  },
  howToBox: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    padding: 12,
    marginBottom: 18,
  },
  howToBoxHeader: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  howToBoxText: {
    fontSize: 12.5,
    color: '#F1F5F9',
    fontWeight: '600',
  },
  modalActions: {
    width: '100%',
  },
  equipActionBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  equipActionBtnActive: {
    backgroundColor: '#EF4444',
  },
  equipActionBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E1000',
  },
  buyActionBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyActionBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E1000',
  },
  lockedActionBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedActionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
  },

  // My Medals Sheet
  myMedalsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },

  // Rules Modal
  ruleSection: {
    marginBottom: 14,
  },
  ruleSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FDE68A',
    marginBottom: 4,
  },
  ruleSectionText: {
    fontSize: 12.5,
    color: '#CBD5E1',
    lineHeight: 18,
  },

  // Stage Detail / Tier Showcase Styles
  stageHeader: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  stageScrollContent: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  stagePodiumWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20,
    position: 'relative',
  },
  stageHaloGlow: {
    position: 'absolute',
    top: 30,
    width: 220,
    height: 180,
    borderRadius: 110,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  featuredMedalBox: {
    width: 280,
    height: 230,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    marginBottom: -30,
  },
  featuredMedalImg: {
    width: '100%',
    height: '100%',
  },
  stagePodiumImg: {
    width: 320,
    height: 100,
    zIndex: 1,
  },
  stageInfoBlock: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 22,
  },
  stageTitleText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8D066',
    letterSpacing: 0.6,
    marginBottom: 6,
    textAlign: 'center',
  },
  stageDescText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94A3B8',
    textAlign: 'center',
  },
  stageProgressBlock: {
    width: width - 64,
    marginBottom: 24,
  },
  stageProgressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  stageProgressNum: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  stageProgressBarTrack: {
    width: '100%',
    height: 7,
    borderRadius: 4,
    backgroundColor: '#262035',
    overflow: 'hidden',
    marginBottom: 8,
  },
  stageProgressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  stageNeedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    textAlign: 'center',
  },
  stageFlourishDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 160,
    marginBottom: 24,
  },
  flourishLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
  },
  flourishDiamond: {
    fontSize: 8,
    color: '#F59E0B',
    marginHorizontal: 8,
  },
  stageTiersChainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginBottom: 32,
    flexWrap: 'wrap',
  },
  tierArrowPip: {
    fontSize: 20,
    fontWeight: '800',
    color: '#D97706',
    marginHorizontal: 8,
  },
  tierChainItem: {
    alignItems: 'center',
    padding: 6,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  tierChainItemActive: {
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  tierChainIconWrap: {
    width: 68,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierChainIconImg: {
    width: '100%',
    height: '100%',
  },
  tierChainLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 4,
    maxWidth: 76,
    textAlign: 'center',
  },
  tierChainLabelActive: {
    color: '#FDE68A',
    fontWeight: '800',
  },
  stageActionWrap: {
    width: width - 64,
    alignItems: 'center',
  },
  stageEquipBtn: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageEquipBtnActive: {
    backgroundColor: '#10B981',
  },
  stageEquipBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E1000',
  },
  stageBuyBtn: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageBuyBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E1000',
  },
  stageLockedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  stageLockedNoticeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CBD5E1',
  },
});
