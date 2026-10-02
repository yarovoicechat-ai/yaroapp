import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Image,
  Platform,
  View as ScreenBackgroundView,
  StatusBar as ScreenBackgroundStatusBar,
  StyleSheet as ScreenBackgroundStyleSheet
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { apiUtil } from '../../utils/apiUtil';
import { useTranslation } from 'react-i18next';
import AnimatedTitleLine from '../../components/AnimatedTitleLine';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';

import { getUserAvatar } from '../../utils/avatarUtil';
import avatar from '../../assets/avtar.webp';

const { width, height } = Dimensions.get('window');
const METRIC_MAP = {
  Time: 'time',
  Call: 'call',
  Coins: 'coins',
  Diamonds: 'diamonds'
};
const RANGE_MAP = {
  Daily: 'daily',
  Weekly: 'weekly',
  Monthly: 'monthly',
  'All Time': 'all'
};

// Wings SVG overlay for Rank 1 Podium (Golden Wings curve outward)
const WingsSvg = () => (
  <Svg width="140" height="60" viewBox="0 0 120 60" style={{ position: 'absolute', zIndex: -1, top: 12 }}>
    {/* Left Wing */}
    <Path
      d="M45,25 C30,5 12,18 8,28 C4,38 18,40 28,32 C38,24 42,27 45,25 Z"
      fill="rgba(250, 204, 21, 0.2)"
      stroke="#facc15"
      strokeWidth="1.5"
    />
    {/* Right Wing */}
    <Path
      d="M75,25 C90,5 108,18 112,28 C116,38 102,40 92,32 C82,24 78,27 75,25 Z"
      fill="rgba(250, 204, 21, 0.2)"
      stroke="#facc15"
      strokeWidth="1.5"
    />
  </Svg>
);

const Ranking = () => {
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 40);
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('Daily');
  const [activeMetric, setActiveMetric] = useState('Call');
  const [rankingData, setRankingData] = useState([]);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const tabs = ['Daily', 'Weekly', 'Monthly', 'All Time'];
  const metrics = [
    { key: 'Time', label: 'Time', icon: 'time-outline' },
    { key: 'Call', label: 'Call', icon: 'call-outline' },
    { key: 'Coins', label: 'Beans', icon: 'server-outline' },
    { key: 'Diamonds', label: 'Diamond', icon: 'diamond-outline' }
  ];

  const fetchRanking = useCallback(async () => {
    try {
      setLoading(true);
      const type = METRIC_MAP[activeMetric] || 'call';
      const range = RANGE_MAP[activeTab] || 'daily';

      const response = await apiUtil.get(`/call/ranking`, {
        params: { type, range },
      });

      if (response.data?.success) {
        setRankingData(Array.isArray(response.data.data) ? response.data.data : []);
        setCurrentUserRank(response.data.currentUser || null);
      } else {
        setRankingData([]);
        setCurrentUserRank(null);
      }
    } catch (error) {
      console.log('❌ Error fetching ranking:', error.response?.data || error.message);
      setRankingData([]);
      setCurrentUserRank(null);
    } finally {
      setLoading(false);
    }
  }, [activeMetric, activeTab]);

  useEffect(() => {
    fetchRanking();
  }, [fetchRanking]);

  const activeData = rankingData;

  // Safe split of podium top 3 and list
  const topThree = activeData.slice(0, 3);
  const remainingList = activeData.slice(3);

  // Rearrange for podium layout: Rank 2 on Left, Rank 1 in Center, Rank 3 on Right
  const podiumList = topThree.length === 3
    ? [topThree[1], topThree[0], topThree[2]]
    : topThree;

  const getMetricValue = (item) => item?.[METRIC_MAP[activeMetric]] ?? 0;

  const formatScore = (val) => {
    if (!val) return '0';
    if (typeof val === 'string') return val;
    if (val >= 1000) {
      return (val / 1000).toFixed(1) + 'K';
    }
    return String(val);
  };  return (
    <ScreenBackgroundView style={[{ flex: 1, backgroundColor: '#F8FAFC' }]}>
      <ScreenBackgroundStatusBar translucent backgroundColor="transparent" barStyle="dark-content" animated />
      <LinearGradient colors={['#F8FAFC', '#F1F5F9', '#E2E8F0']} style={ScreenBackgroundStyleSheet.absoluteFillObject} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topSafeInset + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('ranking.title') || 'Ranking'}</Text>
        <TouchableOpacity style={styles.helpButton}>
          <Icon name="help-circle-outline" size={24} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* Sub-tabs capsule selector (Daily, Weekly, Monthly, All Time) */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => {
          const isSelected = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={styles.tabItem}
              activeOpacity={0.8}
            >
              {isSelected && (
                <LinearGradient
                  colors={['#6366F1', '#4F46E5']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.tabHighlight}
                />
              )}
              <Text
                style={[
                  styles.tabText,
                  isSelected ? styles.tabTextActive : styles.tabTextInactive,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Filters/Metrics capsules row with dropdown arrows */}
      <View style={styles.filtersContainer}>
        {metrics.map((m) => {
          const isSelected = activeMetric === m.key;
          return (
            <TouchableOpacity
              key={m.key}
              onPress={() => setActiveMetric(m.key)}
              style={[
                styles.filterCapsule,
                isSelected && styles.filterCapsuleActive,
              ]}
              activeOpacity={0.8}
            >
              <Icon
                name={m.icon}
                size={14}
                color={isSelected ? '#6366F1' : '#64748B'}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.filterText,
                  isSelected ? styles.filterTextActive : styles.filterTextInactive,
                ]}
              >
                {m.label}
              </Text>
              <Icon
                name="chevron-down"
                size={10}
                color={isSelected ? '#6366F1' : '#94A3B8'}
                style={{ marginLeft: 4 }}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Updates Timer */}
      <View style={styles.timerWrap}>
        <Icon name="time-outline" size={14} color="#8B5CF6" style={{ marginRight: 4 }} />
        <Text style={styles.timerText}>Live ranking from verified transactions</Text>
      </View>w>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}>
        {/* Podium Top 3 */}
        {podiumList.length > 0 && (
          <View style={styles.podiumWrapper}>
          {podiumList.map((item, idx) => {
            const isRank1 = item?.rank === 1;
            const isRank2 = item?.rank === 2;
            const isRank3 = item?.rank === 3;

            let glowColor = '#0284C7';
            let platformColors = ['#E0F2FE', '#BAE6FD'];
            let badgeIcon = 'shield';
            let avatarSize = 60;

            if (isRank1) {
              glowColor = '#D97706';
              platformColors = ['#FEF3C7', '#FDE68A'];
              badgeIcon = 'crown';
              avatarSize = 76;
            } else if (isRank3) {
              glowColor = '#EA580C';
              platformColors = ['#FFEDD5', '#FED7AA'];
              badgeIcon = 'shield';
              avatarSize = 60;
            }

            return (
              <View
                key={idx}
                style={[
                  styles.podiumCol,
                  isRank1 && styles.podiumColCenter,
                ]}
              >
                {/* Avatar wrap */}
                <View style={styles.podiumAvatarWrap}>
                  {isRank1 && <WingsSvg />}

                  <LinearGradient
                    colors={isRank1 ? ['#facc15', '#ff3366'] : isRank2 ? ['#0ea5e9', '#03dcfe'] : ['#f97316', '#ff5500']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      width: avatarSize + 6,
                      height: avatarSize + 6,
                      borderRadius: (avatarSize + 6) / 2,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Image
                      source={getUserAvatar(item)}
                      style={{
                        width: avatarSize,
                        height: avatarSize,
                        borderRadius: avatarSize / 2,
                        backgroundColor: '#F1F5F9',
                      }}
                    />
                  </LinearGradient>

                  {/* Top Badge overlay */}
                  <View
                    style={[
                      styles.podiumBadge,
                      isRank1 ? styles.badgeGold : isRank2 ? styles.badgeBlue : styles.badgeOrange,
                    ]}
                  >
                    {isRank1 ? (
                      <Icon name="crown" size={8} color="#000" />
                    ) : (
                      <Text style={styles.badgeText}>{item?.rank}</Text>
                    )}
                  </View>
                </View>

                {/* Details */}
                <Text style={styles.podiumName} numberOfLines={1}>{item?.name}</Text>
                <View style={styles.scoreRow}>
                  <Icon name="star" size={11} color={glowColor} style={{ marginRight: 2 }} />
                  <Text style={[styles.podiumScore, { color: glowColor }]}>
                    {formatScore(getMetricValue(item))}
                  </Text>
                </View>

                {/* Cylinder Platform */}
                <LinearGradient
                  colors={platformColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={isRank1 ? styles.platformCenter : styles.platformSide}
                >
                  <View style={styles.platformValueCircle}>
                    <Text style={styles.platformValueText}>{item?.rank}</Text>
                  </View>
                </LinearGradient>
              </View>
            );
          })}
        </View>
        )}

        {/* Scrollable list (4-10) */}
        {loading && activeData.length === 0 ? (
          <ActivityIndicator size="large" color="#6366F1" style={{ marginTop: 30 }} />
        ) : (
          <View style={styles.listCard}>
            {activeData.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>No rankings recorded yet for this period.</Text>
              </View>
            ) : (
              remainingList.map((item, index) => {
                const rankNum = index + 4;
                return (
                  <View key={index} style={styles.rowItem}>
                    <Text style={styles.rowRank}>{rankNum}</Text>
                    <Image
                      source={getUserAvatar(item)}
                      style={styles.rowAvatar}
                    />
                    <View style={styles.rowDetails}>
                      <Text style={styles.rowName} numberOfLines={1}>{item.name || 'User'}</Text>
                      <View style={styles.rowScoreRow}>
                        <Icon name="star" size={12} color="#8B5CF6" style={{ marginRight: 3 }} />
                        <Text style={styles.rowScore}>
                          {formatScore(getMetricValue(item))}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity style={styles.addFriendBtn} activeOpacity={0.7}>
                      <Icon name="person-add" size={14} color="#6366F1" />
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky Bottom Rank Card */}
      {currentUserRank && <View style={styles.bottomSticky}>
        <LinearGradient
          colors={['#FFFFFF', '#F8FAFC']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.stickyInner}
        >
          <Text style={styles.stickyRank}>{currentUserRank.rank}</Text>
          <Image source={getUserAvatar(currentUserRank)} style={styles.stickyAvatar} />
          <View style={styles.stickyDetails}>
            <Text style={styles.stickyName}>You ({currentUserRank.name})</Text>
            <View style={styles.rowScoreRow}>
              <Icon name="star" size={11} color="#8B5CF6" style={{ marginRight: 3 }} />
              <Text style={styles.stickyScore}>{formatScore(getMetricValue(currentUserRank))}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.viewRankBtn} activeOpacity={0.7}>
            <Text style={styles.viewRankText}>View My Rank</Text>
            <Icon name="chevron-forward" size={12} color="#ff3366" style={{ marginLeft: 2 }} />
          </TouchableOpacity>
        </LinearGradient>
      </View>}
    </ScreenBackgroundView>
  );
};

const styles = StyleSheet.create({
  starOverlay1: {
    position: 'absolute',
    top: height * 0.15,
    left: width * 0.1,
    width: 2,
    height: 2,
    backgroundColor: '#fff',
    opacity: 0.3,
  },
  starOverlay2: {
    position: 'absolute',
    top: height * 0.45,
    right: width * 0.15,
    width: 2.5,
    height: 2.5,
    backgroundColor: '#fff',
    opacity: 0.4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  helpButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Tabs container (Daily, Weekly, Monthly, All Time)
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 24,
    marginHorizontal: 16,
    padding: 3,
    height: 46,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  tabItem: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    position: 'relative',
  },
  tabHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#fff',
  },
  tabTextInactive: {
    color: '#64748B',
  },

  // Filters Row
  filtersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  filterCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  filterCapsuleActive: {
    borderColor: '#6366F1',
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
  },
  filterText: {
    fontSize: 11,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#6366F1',
  },
  filterTextInactive: {
    color: '#64748B',
  },

  // Timer
  timerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  timerText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500',
  },

  // Scroll list container
  scrollContent: {
  },

  // Podium Layout
  podiumWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    height: 240,
    marginBottom: 20,
  },
  podiumCol: {
    flex: 1,
    alignItems: 'center',
  },
  podiumColCenter: {
    flex: 1.15,
    zIndex: 10,
    marginHorizontal: -8,
  },
  podiumAvatarWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  podiumBadge: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  badgeBlue: {
    top: 0,
    left: 0,
    backgroundColor: '#0ea5e9',
  },
  badgeGold: {
    top: -8,
    backgroundColor: '#facc15',
  },
  badgeOrange: {
    top: 0,
    right: 0,
    backgroundColor: '#f97316',
  },
  badgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '900',
  },
  podiumName: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 2,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  podiumScore: {
    fontSize: 10,
    fontWeight: '800',
  },
  platformSide: {
    width: '90%',
    height: 35,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  platformCenter: {
    width: '95%',
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: '#FCD34D',
  },
  platformValueCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  platformValueText: {
    color: '#0F172A',
    fontSize: 9,
    fontWeight: 'bold',
  },

  // List (Ranks 4-10)
  listCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 24,
    marginHorizontal: 16,
    padding: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  emptyWrap: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rowRank: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '700',
    width: 24,
  },
  rowAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 12,
  },
  rowDetails: {
    flex: 1,
  },
  rowName: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  rowScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowScore: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  addFriendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Sticky Bottom
  bottomSticky: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'transparent',
  },
  stickyInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  stickyRank: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: 'bold',
    width: 32,
    textAlign: 'center',
  },
  stickyAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#6366F1',
    marginRight: 12,
  },
  stickyDetails: {
    flex: 1,
  },
  stickyName: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  stickyScore: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  viewRankBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 51, 102, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 51, 102, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  viewRankText: {
    color: '#ff3366',
    fontSize: 10,
    fontWeight: '800',
  },
});

export default Ranking;
