import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Image,
  StatusBar,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Circle, Defs, Stop, G, LinearGradient as SvgGradient } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';
import { AuthContext } from '../../context/AuthProvider';
import { getUserAvatar } from '../../utils/avatarUtil';
import { apiUtil } from '../../utils/apiUtil';
import { AlertService } from '../../utils/AlertService';

const { width } = Dimensions.get('window');

// Category Themes
const THEMES = {
  Honor: {
    name: 'Honor',
    gradient: ['#047857', '#059669', '#10B981'],
    accent: '#34D399',
    unitIcon: '🪙',
    unitName: 'Beans',
    desc: 'Top Gifters & Wealth Nobles Leaderboard',
  },
  Charm: {
    name: 'Charm',
    gradient: ['#4C1D95', '#6D28D9', '#8B5CF6'],
    accent: '#C084FC',
    unitIcon: '🪙',
    unitName: 'Charm',
    desc: 'Celebrity Hosts & Most Popular Voices',
  },
  Room: {
    name: 'Room',
    gradient: ['#92400E', '#B45309', '#F59E0B'],
    accent: '#FDE047',
    unitIcon: '🪙',
    unitName: 'Room Heat',
    desc: 'Top Party Lounges & Active Voice Clubs',
  },
};

// High-fidelity fallback / demo data matching user's screenshots
const SAMPLE_RANKINGS = {
  Honor: [
    { id: '1', rank: 1, name: 'Kelvin🖤', level: 5, score: 97000, scoreText: '97K', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces' },
    { id: '2', rank: 2, name: 'Diwani🖤', level: 14, score: 87500, scoreText: '87.50K', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=faces' },
    { id: '3', rank: 3, name: 'Avish...', level: 5, score: 65000, scoreText: '65K', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop&crop=faces' },
    { id: '4', rank: 4, name: 'Ridoy Chowdhury', level: 5, score: 24000, scoreText: '24K', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces' },
    { id: '5', rank: 5, name: 'Sandeep Yadav', level: 3, score: 12000, scoreText: '12K', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces' },
    { id: '6', rank: 6, name: 'Justin', level: 35, score: 10000, scoreText: '10K', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&h=200&fit=crop&crop=faces' },
    { id: '7', rank: 7, name: 'nasrin akter', level: 3, score: 6000, scoreText: '6000', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=faces' },
    { id: '8', rank: 8, name: 'Royal Prince', level: 8, score: 4500, scoreText: '4.5K', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=faces' },
    { id: '9', rank: 9, name: 'Sweet Angel', level: 12, score: 3800, scoreText: '3.8K', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces' },
    { id: '10', rank: 10, name: 'Voice Star', level: 6, score: 2500, scoreText: '2.5K', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=faces' },
  ],
  Charm: [
    { id: '1', rank: 1, name: 'Avish...', level: 5, score: 119000, scoreText: '119K', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop&crop=faces' },
    { id: '2', rank: 2, name: 'Shahid', level: 1, score: 60000, scoreText: '60K', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=faces' },
    { id: '3', rank: 3, name: 'Diwani🖤', level: 14, score: 29000, scoreText: '29K', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=faces' },
    { id: '4', rank: 4, name: 'Baby doll 🥻', level: 3, score: 25000, scoreText: '25K', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces' },
    { id: '5', rank: 5, name: 'CS_THE END.', level: 27, score: 21000, scoreText: '21K', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces' },
    { id: '6', rank: 6, name: 'Nasrin Akther', level: 6, score: 18000, scoreText: '18K', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=faces' },
    { id: '7', rank: 7, name: 'Kelvin🖤', level: 5, score: 17500, scoreText: '17.50K', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces' },
    { id: '8', rank: 8, name: 'Moon Light', level: 9, score: 14000, scoreText: '14K', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces' },
    { id: '9', rank: 9, name: 'Heart Hacker', level: 4, score: 11000, scoreText: '11K', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&h=200&fit=crop&crop=faces' },
    { id: '10', rank: 10, name: 'Queen Bee', level: 16, score: 9500, scoreText: '9.5K', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=faces' },
  ],
  Room: [
    { id: '1', rank: 1, name: 'Romantic s...', level: 5, score: 178000, scoreText: '178K', isRoom: true, avatar: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=200&h=200&fit=crop' },
    { id: '2', rank: 2, name: 'Welcome ne...', level: 1, score: 61000, scoreText: '61K', isRoom: true, avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop' },
    { id: '3', rank: 3, name: 'YouFun Hel...', level: 27, score: 37000, scoreText: '37K', isRoom: true, avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&h=200&fit=crop', isSvip: true },
    { id: '4', rank: 4, name: 'Nasrin Akther', level: 6, score: 20500, scoreText: '20.50K', isRoom: true, avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop' },
    { id: '5', rank: 5, name: 'Zunish world', level: 2, score: 11000, scoreText: '11K', isRoom: true, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop' },
    { id: '6', rank: 6, name: 'DUKASH...', level: 14, score: 11000, scoreText: '11K', isRoom: true, avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop' },
    { id: '7', rank: 7, name: 'Dosto ke duneya', level: 22, score: 5000, scoreText: '5000', isRoom: true, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop' },
    { id: '8', rank: 8, name: 'Club 99 Music', level: 15, score: 4200, scoreText: '4.2K', isRoom: true, avatar: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=200&h=200&fit=crop' },
    { id: '9', rank: 9, name: 'Midnight Chill', level: 7, score: 3100, scoreText: '3.1K', isRoom: true, avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop' },
    { id: '10', rank: 10, name: 'Desi Mehfil', level: 11, score: 2800, scoreText: '2.8K', isRoom: true, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop' },
  ],
};

// Crown Frame for Rank 1 Podium
const GoldenLaurelCrownSvg = () => (
  <Svg width="124" height="124" viewBox="0 0 120 120" style={styles.svgFrameAbsolute}>
    <Defs>
      <SvgGradient id="goldGlow" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#FFFBEB" />
        <Stop offset="30%" stopColor="#FDE047" />
        <Stop offset="70%" stopColor="#F59E0B" />
        <Stop offset="100%" stopColor="#B45309" />
      </SvgGradient>
    </Defs>
    {/* Crown On Top */}
    <Path
      d="M48,16 L53,8 L60,14 L67,8 L72,16 L68,20 L52,20 Z"
      fill="url(#goldGlow)"
      stroke="#78350F"
      strokeWidth="0.8"
    />
    <Circle cx="60" cy="9" r="2.2" fill="#EF4444" />
    <Circle cx="52" cy="11" r="1.6" fill="#3B82F6" />
    <Circle cx="68" cy="11" r="1.6" fill="#10B981" />
    {/* Laurel Leaves Surround Outer Circle */}
    <Circle cx="60" cy="62" r="41" fill="none" stroke="url(#goldGlow)" strokeWidth="3" />
    <Circle cx="60" cy="62" r="44.5" fill="none" stroke="rgba(253, 224, 71, 0.4)" strokeWidth="1" strokeDasharray="3 3" />
    {/* Left Leaves */}
    <Path d="M22,46 Q16,56 21,68 Q27,58 22,46 Z" fill="url(#goldGlow)" />
    <Path d="M19,65 Q17,76 25,84 Q28,73 19,65 Z" fill="url(#goldGlow)" />
    {/* Right Leaves */}
    <Path d="M98,46 Q104,56 99,68 Q93,58 98,46 Z" fill="url(#goldGlow)" />
    <Path d="M101,65 Q103,76 95,84 Q92,73 101,65 Z" fill="url(#goldGlow)" />
  </Svg>
);

// Blue Wings Frame for Rank 2 Podium
const BlueWingsSvg = () => (
  <Svg width="112" height="112" viewBox="0 0 100 100" style={styles.svgFrameAbsolute}>
    <Defs>
      <SvgGradient id="blueGlow" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#E0F2FE" />
        <Stop offset="50%" stopColor="#38BDF8" />
        <Stop offset="100%" stopColor="#0284C7" />
      </SvgGradient>
    </Defs>
    <Circle cx="50" cy="50" r="34" fill="none" stroke="url(#blueGlow)" strokeWidth="3" />
    {/* Left Ice Wing */}
    <Path d="M18,34 Q8,44 14,58 Q22,48 18,34 Z" fill="url(#blueGlow)" />
    <Path d="M14,54 Q10,66 20,74 Q24,62 14,54 Z" fill="url(#blueGlow)" />
    {/* Right Ice Wing */}
    <Path d="M82,34 Q92,44 86,58 Q78,48 82,34 Z" fill="url(#blueGlow)" />
    <Path d="M86,54 Q90,66 80,74 Q76,62 86,54 Z" fill="url(#blueGlow)" />
  </Svg>
);

// Purple Crystal Butterfly Wings Frame for Rank 3 Podium
const PurpleCrystalSvg = () => (
  <Svg width="112" height="112" viewBox="0 0 100 100" style={styles.svgFrameAbsolute}>
    <Defs>
      <SvgGradient id="purpleGlow" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#F5F3FF" />
        <Stop offset="50%" stopColor="#C084FC" />
        <Stop offset="100%" stopColor="#7E22CE" />
      </SvgGradient>
    </Defs>
    <Circle cx="50" cy="50" r="34" fill="none" stroke="url(#purpleGlow)" strokeWidth="3" />
    {/* Left Butterfly Wing */}
    <Path d="M18,36 Q10,48 16,60 Q24,50 18,36 Z" fill="url(#purpleGlow)" />
    <Path d="M16,58 Q12,70 22,76 Q25,65 16,58 Z" fill="url(#purpleGlow)" />
    {/* Right Butterfly Wing */}
    <Path d="M82,36 Q90,48 84,60 Q76,50 82,36 Z" fill="url(#purpleGlow)" />
    <Path d="M84,58 Q88,70 78,76 Q75,65 84,58 Z" fill="url(#purpleGlow)" />
  </Svg>
);

// Level Badge Component (Matches hexagon badge from screenshot e.g. Lv.5 gold, Lv.14 green, Lv.27 cyan)
const LevelBadge = ({ level = 1, type = 'wealth' }) => {
  const isCharm = type === 'charm';
  const colors = isCharm
    ? level >= 20
      ? ['#701A75', '#A21CAF', '#E879F9']
      : level >= 10
        ? ['#831843', '#BE185D', '#F472B6']
        : ['#9D174D', '#DB2777', '#FBCFE8']
    : level >= 50
      ? ['#7C2D12', '#D97706', '#FDE047']
      : level >= 20
        ? ['#1E3A8A', '#2563EB', '#60A5FA']
        : ['#78350F', '#B45309', '#F59E0B'];

  return (
    <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.levelBadgePill}>
      <MaterialCommunityIcons
        name={isCharm ? 'flower' : 'diamond-stone'}
        size={11}
        color="#FFF"
        style={{ marginRight: 2 }}
      />
      <Text style={styles.levelBadgeText}>Lv.{level}</Text>
    </LinearGradient>
  );
};

export default function Ranking() {
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 70);
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);

  const [activeCategory, setActiveCategory] = useState('Honor'); // 'Honor' | 'Charm' | 'Room'
  const [activePeriod, setActivePeriod] = useState('Daily'); // 'Daily' | 'Weekly' | 'Monthly'
  const [rankingData, setRankingData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [infoModalVisible, setInfoModalVisible] = useState(false);

  const currentTheme = THEMES[activeCategory] || THEMES.Honor;

  // Fetch ranking from backend API with fallback to high-fidelity seed data
  const fetchRanking = useCallback(async () => {
    try {
      setLoading(true);
      const metric = activeCategory === 'Honor' ? 'diamonds' : activeCategory === 'Charm' ? 'coins' : 'call';
      const range = activePeriod.toLowerCase();
      const res = await apiUtil.get('/call/ranking', { params: { type: metric, range } });

      if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        const mapped = res.data.data.map((item, index) => ({
          id: String(item.id || item._id || index + 1),
          rank: index + 1,
          name: item.name || 'Yaro User',
          level: activeCategory === 'Charm' ? (item.charmLevel || item.level || 1) : (item.wealthLevel || item.level || 1),
          score: item[metric] || item.coins || item.diamonds || 0,
          scoreText: formatScore(item[metric] || item.coins || item.diamonds || 0),
          avatar: item.image || item.avatar || null,
        }));
        setRankingData(mapped);
      } else {
        // Fallback to high-fidelity live demo dataset
        setRankingData(SAMPLE_RANKINGS[activeCategory] || SAMPLE_RANKINGS.Honor);
      }
    } catch (_) {
      // Fallback
      setRankingData(SAMPLE_RANKINGS[activeCategory] || SAMPLE_RANKINGS.Honor);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, activePeriod]);

  useEffect(() => {
    fetchRanking();
  }, [fetchRanking]);

  // Date range calculation
  const periodDateText = useMemo(() => {
    const today = new Date();
    const d = today.getDate();
    const m = today.getMonth() + 1;
    const y = today.getFullYear();
    if (activePeriod === 'Daily') {
      return `Today (${m}/${d}/${y}) 00:00am ~ 23:59pm`;
    }
    if (activePeriod === 'Weekly') {
      return `This Week (${m}/${Math.max(1, d - 6)} ~ ${m}/${d}) 00:00am ~ 23:59pm`;
    }
    return `This Month (${m}/1 ~ ${m}/30) 00:00am ~ 23:59pm`;
  }, [activePeriod]);

  const formatScore = (num) => {
    if (!num) return '0';
    if (typeof num === 'string') return num;
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace('.0', '') + 'K';
    return String(num);
  };

  // Top 3 for podium
  const rank1 = rankingData.find((r) => r.rank === 1) || rankingData[0];
  const rank2 = rankingData.find((r) => r.rank === 2) || rankingData[1];
  const rank3 = rankingData.find((r) => r.rank === 3) || rankingData[2];

  // Ranks 4+
  const listRanks = rankingData.filter((r) => r.rank > 3);

  // Self User Stats
  const selfUserRank = useMemo(() => {
    const myId = String(user?.id || user?._id || user?.userId || '');
    const found = rankingData.find((item) => String(item.id) === myId);
    if (found) return found;
    return {
      rank: 99,
      isUnranked: true,
      name: user?.name || 'You',
      level: user?.level || 6,
      score: 1250,
      scoreText: '1.25K',
      avatar: user?.avatar || user?.image,
    };
  }, [rankingData, user]);

  return (
    <View style={styles.screen}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Dynamic Background Gradient */}
      <LinearGradient
        colors={currentTheme.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Decorative ambient particle glow */}
      <View style={[styles.ambientGlow, { backgroundColor: currentTheme.accent }]} />

      {/* Header Bar */}
      <View style={[styles.header, { paddingTop: topSafeInset + 4 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerIconBtn}
          activeOpacity={0.8}
        >
          <Icon name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>

        {/* 1. Category Switcher (Honor | Charm | Room) */}
        <View style={styles.categoryPillContainer}>
          {['Honor', 'Charm', 'Room'].map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setActiveCategory(cat)}
                style={[styles.categoryBtn, isActive && styles.categoryBtnActive]}
                activeOpacity={0.85}
              >
                <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Info Rules Button */}
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={() => setInfoModalVisible(true)}
          activeOpacity={0.8}
        >
          <Icon name="help-circle-outline" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* 2. Sub-Tabs: Daily | Weekly | Monthly */}
      <View style={styles.periodTabsRow}>
        {['Daily', 'Weekly', 'Monthly'].map((period) => {
          const isActive = activePeriod === period;
          return (
            <TouchableOpacity
              key={period}
              onPress={() => setActivePeriod(period)}
              style={styles.periodTabItem}
              activeOpacity={0.8}
            >
              <Text style={[styles.periodTabText, isActive && styles.periodTabTextActive]}>
                {period}
              </Text>
              {isActive && <View style={styles.periodTabUnderline} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 3. Time Window Badge */}
      <View style={styles.timeWindowBadge}>
        <Icon name="time-outline" size={13} color="rgba(255,255,255,0.85)" style={{ marginRight: 5 }} />
        <Text style={styles.timeWindowText}>{periodDateText}</Text>
      </View>

      {/* Main Scroll Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding + 85 }]}
      >
        {/* ============================================================== */}
        {/* PODIUM TOP 3 CONTENDERS                                        */}
        {/* ============================================================== */}
        <View style={styles.podiumContainer}>
          {/* TOP 2 (LEFT) */}
          {rank2 && (
            <View style={styles.podiumColSide}>
              <View style={styles.podiumAvatarWrap}>
                <BlueWingsSvg />
                <Image source={getUserAvatar(rank2)} style={styles.avatarImgSide} />
                <LinearGradient colors={['#0284C7', '#38BDF8']} style={styles.ribbonBadgeSide}>
                  <Text style={styles.ribbonText}>TOP2</Text>
                </LinearGradient>
              </View>
              <Text style={styles.podiumUserName} numberOfLines={1}>{rank2.name}</Text>
              <LevelBadge level={rank2.level || 1} type={activeCategory === 'Charm' ? 'charm' : 'wealth'} />
              <View style={styles.podiumScorePill}>
                <Text style={styles.coinIcon}>{currentTheme.unitIcon}</Text>
                <Text style={styles.podiumScoreText}>{rank2.scoreText}</Text>
              </View>
            </View>
          )}

          {/* TOP 1 (CENTER - ELEVATED) */}
          {rank1 && (
            <View style={styles.podiumColCenter}>
              <View style={styles.podiumAvatarWrapCenter}>
                <GoldenLaurelCrownSvg />
                <Image source={getUserAvatar(rank1)} style={styles.avatarImgCenter} />
                <LinearGradient colors={['#DC2626', '#EF4444', '#F87171']} style={styles.ribbonBadgeCenter}>
                  <Text style={styles.crownGlyph}>👑</Text>
                  <Text style={styles.ribbonTextCenter}>TOP1</Text>
                </LinearGradient>
              </View>
              <Text style={styles.podiumUserNameCenter} numberOfLines={1}>{rank1.name}</Text>
              <LevelBadge level={rank1.level || 5} type={activeCategory === 'Charm' ? 'charm' : 'wealth'} />
              <View style={styles.podiumScorePillCenter}>
                <Text style={styles.coinIcon}>{currentTheme.unitIcon}</Text>
                <Text style={styles.podiumScoreTextCenter}>{rank1.scoreText}</Text>
              </View>
            </View>
          )}

          {/* TOP 3 (RIGHT) */}
          {rank3 && (
            <View style={styles.podiumColSide}>
              <View style={styles.podiumAvatarWrap}>
                <PurpleCrystalSvg />
                <Image source={getUserAvatar(rank3)} style={styles.avatarImgSide} />
                <LinearGradient colors={['#7E22CE', '#C084FC']} style={styles.ribbonBadgeSide}>
                  <Text style={styles.ribbonText}>TOP3</Text>
                </LinearGradient>
              </View>
              <Text style={styles.podiumUserName} numberOfLines={1}>{rank3.name}</Text>
              <LevelBadge level={rank3.level || 1} type={activeCategory === 'Charm' ? 'charm' : 'wealth'} />
              <View style={styles.podiumScorePill}>
                <Text style={styles.coinIcon}>{currentTheme.unitIcon}</Text>
                <Text style={styles.podiumScoreText}>{rank3.scoreText}</Text>
              </View>
            </View>
          )}
        </View>

        {/* 3D PODIUM STAGE BLOCKS (Center #1 tall, Left #2 medium, Right #3 step) */}
        <View style={styles.stageRow}>
          {/* Block 2 (Blue) */}
          <View style={styles.stageBlock2}>
            <LinearGradient
              colors={['#7DD3FC', '#38BDF8', '#0284C7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.stageGradient2}
            >
              <View style={styles.stageHighlightTop} />
              <Text style={styles.stageNumber2}>2</Text>
            </LinearGradient>
          </View>

          {/* Block 1 (Golden - Tallest) */}
          <View style={styles.stageBlock1}>
            <LinearGradient
              colors={['#FEF08A', '#FACC15', '#EAB308', '#CA8A04']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.stageGradient1}
            >
              <View style={styles.stageHighlightTop} />
              <Text style={styles.stageNumber1}>1</Text>
            </LinearGradient>
          </View>

          {/* Block 3 (Purple) */}
          <View style={styles.stageBlock3}>
            <LinearGradient
              colors={['#E9D5FF', '#C084FC', '#9333EA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.stageGradient3}
            >
              <View style={styles.stageHighlightTop} />
              <Text style={styles.stageNumber3}>3</Text>
            </LinearGradient>
          </View>
        </View>

        {/* ============================================================== */}
        {/* WHITE SHEET CARD: RANKS 4 TO 10+                               */}
        {/* ============================================================== */}
        <View style={styles.ranksSheetContainer}>
          {loading ? (
            <ActivityIndicator color={currentTheme.accent} size="large" style={{ marginVertical: 40 }} />
          ) : listRanks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No additional rankings recorded for this period.</Text>
            </View>
          ) : (
            listRanks.map((item, index) => {
              const rankNum = item.rank || index + 4;
              return (
                <View key={`rank-${item.id || index}`} style={styles.rankRowItem}>
                  {/* Rank Number */}
                  <View style={styles.rankNumCol}>
                    <Text style={styles.rankNumText}>{rankNum}</Text>
                  </View>

                  {/* User Avatar */}
                  <Image source={getUserAvatar(item)} style={styles.rowAvatarImg} />

                  {/* Details (Name + Level Badge) */}
                  <View style={styles.rowDetailsCol}>
                    <Text style={styles.rowUserName} numberOfLines={1}>
                      {item.name || 'Yaro User'}
                    </Text>
                    <View style={styles.rowBadgeRow}>
                      <LevelBadge level={item.level || 3} type={activeCategory === 'Charm' ? 'charm' : 'wealth'} />
                      {item.isSvip && (
                        <View style={styles.svipMiniPill}>
                          <Text style={styles.svipMiniText}>SVIP 1</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Score Pill */}
                  <View style={styles.rowScoreWrap}>
                    <Text style={styles.rowCoinIcon}>{currentTheme.unitIcon}</Text>
                    <Text style={styles.rowScoreValue}>{item.scoreText}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* ============================================================== */}
      {/* 4. STICKY FLOATING "SELF" RANK BAR (BOTTOM OF SCREEN)          */}
      {/* ============================================================== */}
      <View style={[styles.selfBottomBar, { paddingBottom: insets.bottom + 8 }]}>
        <LinearGradient
          colors={['#FFFFFF', '#F8FAFC']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.selfBarInner}
        >
          {/* Self Rank Badge */}
          <View style={styles.selfRankBadge}>
            <Text style={styles.selfRankText}>
              {selfUserRank.isUnranked ? '99+' : `#${selfUserRank.rank}`}
            </Text>
          </View>

          {/* Self Avatar */}
          <View style={styles.selfAvatarWrap}>
            <Image
              source={getUserAvatar(selfUserRank)}
              style={styles.selfAvatarImg}
            />
          </View>

          {/* Self Details */}
          <View style={styles.selfDetailsCol}>
            <View style={styles.selfNameRow}>
              <Text style={styles.selfNameText} numberOfLines={1}>
                {user?.name || 'You'}
              </Text>
              <View style={styles.selfMeTag}>
                <Text style={styles.selfMeTagText}>ME</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <LevelBadge
                level={activeCategory === 'Charm' ? (user?.charmLevel || 1) : (user?.wealthLevel || user?.level || 1)}
                type={activeCategory === 'Charm' ? 'charm' : 'wealth'}
              />
              <Text style={styles.selfDistanceHint}>
                {selfUserRank.isUnranked ? 'Send gifts to enter Top 10!' : 'Keep shining! ⭐'}
              </Text>
            </View>
          </View>

          {/* Self Score */}
          <View style={styles.selfScoreCol}>
            <View style={styles.selfScoreRow}>
              <Text style={styles.rowCoinIcon}>{currentTheme.unitIcon}</Text>
              <Text style={styles.selfScoreValue}>{selfUserRank.scoreText}</Text>
            </View>
            <TouchableOpacity
              style={styles.boostBtn}
              activeOpacity={0.8}
              onPress={() => AlertService.show('Leaderboard Boost', 'Send gifts in rooms or host your party to level up your rank!', 'info')}
            >
              <Text style={styles.boostBtnText}>Boost 🚀</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      {/* Rules & Rewards Modal */}
      <Modal visible={infoModalVisible} transparent animationType="fade" onRequestClose={() => setInfoModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.infoModalCard}>
            <View style={styles.infoModalHeader}>
              <MaterialCommunityIcons name="trophy-award" size={26} color="#F59E0B" />
              <Text style={styles.infoModalTitle}>Ranking Rules & Rewards</Text>
            </View>
            <Text style={styles.infoModalDesc}>
              • <Text style={{ fontWeight: '700' }}>Honor:</Text> Points calculated from diamonds gifted in voice rooms & calls.{'\n\n'}
              • <Text style={{ fontWeight: '700' }}>Charm:</Text> Beans received from fans & listeners.{'\n\n'}
              • <Text style={{ fontWeight: '700' }}>Room:</Text> Total party room heat & active listener gifts.{'\n\n'}
              • Top 3 champions receive exclusive Avatar Frames, Sovereign SVIP badges, and diamond bonuses at 23:59pm!
            </Text>
            <TouchableOpacity
              style={styles.infoModalCloseBtn}
              onPress={() => setInfoModalVisible(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.infoModalCloseText}>Got It!</Text>
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
    backgroundColor: '#0F172A',
  },
  ambientGlow: {
    position: 'absolute',
    top: -80,
    alignSelf: 'center',
    width: width * 1.2,
    height: 280,
    borderRadius: (width * 1.2) / 2,
    opacity: 0.15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    zIndex: 20,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryPillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
    borderRadius: 24,
    padding: 3,
  },
  categoryBtn: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 20,
  },
  categoryBtnActive: {
    backgroundColor: '#FFFFFF',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  categoryText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13.5,
    fontWeight: '700',
  },
  categoryTextActive: {
    color: '#0F172A',
    fontWeight: '900',
  },
  periodTabsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 36,
    paddingVertical: 8,
  },
  periodTabItem: {
    alignItems: 'center',
    paddingVertical: 4,
    position: 'relative',
  },
  periodTabText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '700',
  },
  periodTabTextActive: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  periodTabUnderline: {
    position: 'absolute',
    bottom: -1,
    width: 24,
    height: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 1.5,
  },
  timeWindowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
    marginTop: 4,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  timeWindowText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '600',
  },
  scrollContent: {
    paddingTop: 8,
  },

  // Podium Architecture
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 14,
    marginBottom: -8,
    zIndex: 10,
  },
  podiumColSide: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 6,
  },
  podiumColCenter: {
    flex: 1.25,
    alignItems: 'center',
    marginBottom: 14,
    zIndex: 15,
  },
  podiumAvatarWrap: {
    width: 86,
    height: 86,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 6,
  },
  podiumAvatarWrapCenter: {
    width: 104,
    height: 104,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 8,
  },
  svgFrameAbsolute: {
    position: 'absolute',
    zIndex: 2,
  },
  avatarImgSide: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#F1F5F9',
  },
  avatarImgCenter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F1F5F9',
  },
  ribbonBadgeSide: {
    position: 'absolute',
    bottom: -4,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 10,
    zIndex: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  ribbonBadgeCenter: {
    position: 'absolute',
    bottom: -6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 2.5,
    borderRadius: 11,
    zIndex: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#FDE047',
  },
  crownGlyph: {
    fontSize: 9,
    marginRight: 2,
  },
  ribbonText: {
    color: '#FFF',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  ribbonTextCenter: {
    color: '#FFF',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  podiumUserName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 3,
    maxWidth: 90,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  podiumUserNameCenter: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '900',
    marginBottom: 4,
    maxWidth: 110,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.55)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 4,
  },
  podiumScorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 10,
    marginTop: 4,
  },
  podiumScorePillCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 11,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(253, 224, 71, 0.35)',
  },
  coinIcon: {
    fontSize: 11,
    marginRight: 4,
  },
  podiumScoreText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  podiumScoreTextCenter: {
    color: '#FDE047',
    fontSize: 12,
    fontWeight: '900',
  },

  // 3D Podium Stage
  stageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: '100%',
    paddingHorizontal: 12,
    marginBottom: -24,
    zIndex: 5,
  },
  stageBlock2: {
    flex: 1,
    height: 105,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 10,
    overflow: 'hidden',
  },
  stageGradient2: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stageBlock1: {
    flex: 1.25,
    height: 135,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    marginHorizontal: 4,
    overflow: 'hidden',
    zIndex: 6,
    elevation: 6,
  },
  stageGradient1: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stageBlock3: {
    flex: 1,
    height: 85,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 18,
    overflow: 'hidden',
  },
  stageGradient3: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stageHighlightTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  stageNumber2: {
    fontSize: 48,
    fontWeight: '900',
    color: 'rgba(2, 132, 199, 0.5)',
  },
  stageNumber1: {
    fontSize: 64,
    fontWeight: '900',
    color: 'rgba(202, 138, 4, 0.55)',
  },
  stageNumber3: {
    fontSize: 42,
    fontWeight: '900',
    color: 'rgba(147, 51, 234, 0.5)',
  },

  // White Curved Sheet (Ranks 4+)
  ranksSheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 36,
    paddingHorizontal: 16,
    minHeight: 380,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  rankRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rankNumCol: {
    width: 28,
    alignItems: 'center',
    marginRight: 10,
  },
  rankNumText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '800',
  },
  rowAvatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rowDetailsCol: {
    flex: 1,
  },
  rowUserName: {
    color: '#0F172A',
    fontSize: 13.5,
    fontWeight: '800',
    marginBottom: 4,
  },
  rowBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  levelBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 8,
  },
  levelBadgeText: {
    color: '#FFF',
    fontSize: 9.5,
    fontWeight: '800',
  },
  svipMiniPill: {
    backgroundColor: '#064E3B',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  svipMiniText: {
    color: '#34D399',
    fontSize: 9,
    fontWeight: '900',
  },
  rowScoreWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowCoinIcon: {
    fontSize: 13,
    marginRight: 4,
  },
  rowScoreValue: {
    color: '#0F172A',
    fontSize: 13.5,
    fontWeight: '800',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 13,
  },

  // Sticky Floating "Self" Rank Bar
  selfBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  selfBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  selfRankBadge: {
    width: 38,
    alignItems: 'center',
    marginRight: 4,
  },
  selfRankText: {
    color: '#D97706',
    fontSize: 15,
    fontWeight: '900',
  },
  selfAvatarWrap: {
    marginRight: 10,
  },
  selfAvatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#F59E0B',
    backgroundColor: '#F1F5F9',
  },
  selfDetailsCol: {
    flex: 1,
  },
  selfNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  selfNameText: {
    color: '#0F172A',
    fontSize: 13.5,
    fontWeight: '800',
    marginRight: 6,
  },
  selfMeTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  selfMeTagText: {
    color: '#B45309',
    fontSize: 8.5,
    fontWeight: '900',
  },
  selfDistanceHint: {
    color: '#64748B',
    fontSize: 10,
    marginLeft: 6,
  },
  selfScoreCol: {
    alignItems: 'flex-end',
  },
  selfScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  selfScoreValue: {
    color: '#0F172A',
    fontSize: 13.5,
    fontWeight: '900',
  },
  boostBtn: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 10,
  },
  boostBtnText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  infoModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    elevation: 20,
  },
  infoModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  infoModalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  infoModalDesc: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 20,
  },
  infoModalCloseBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  infoModalCloseText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
