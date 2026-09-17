import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  Platform,
  ActivityIndicator,
  View as ScreenBackgroundView,
  StatusBar as ScreenBackgroundStatusBar,
  StyleSheet as ScreenBackgroundStyleSheet
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import IonIcon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { apiUtil } from '../../utils/apiUtil';
import { AuthContext } from '../../context/AuthProvider';
import { useTranslation } from 'react-i18next';
import AnimatedTitleLine from '../../components/AnimatedTitleLine';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';

import { getUserAvatar } from '../../utils/avatarUtil';
import avatar from '../../assets/avtar.webp';
import coinIcon from '../../assets/coin.webp';

const { width, height } = Dimensions.get('window');

const Level = () => {
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 40);
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();

  const [levelData, setLevelData] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(user?.level || 6);
  const [isPromoActive, setIsPromoActive] = useState(true);
  const [promoDaysLeft, setPromoDaysLeft] = useState(7);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalCalls: 0,
    targetCalls: 0,
    totalTime: 0,
    targetTime: 0,
    totalCoins: 0,
    targetCoins: 0,
    totalDiamonds: 0,
    targetDiamonds: 0
  });

  useEffect(() => {
    if (user) {
      fetchHostLevels();
    }
  }, [user]);
  const fetchHostLevels = async () => {
    try {
      const response = await apiUtil.get('/call/level');

      console.log("CALL LEVEL API =", JSON.stringify(response.data, null, 2));
      console.log("currentLevel =", response.data?.data?.currentLevel);
      console.log("Auth User Level =", user?.level);

      if (response.data && response.data.success && response.data.data) {
        const data = response.data.data;
        setLevelData(data.levelData || []);
        setCurrentLevel(
          data.currentLevel ?? user?.level ?? 6
        );
        setIsPromoActive(data.isPromoActive ?? true);
        setPromoDaysLeft(data.promoDaysLeft ?? 7);

        setStats({
          totalCalls: data.totalCalls !== undefined && data.totalCalls !== null ? Number(data.totalCalls) : 0,
          targetCalls: data.targetCalls !== undefined && data.targetCalls !== null ? Number(data.targetCalls) : 150,
          totalTime: data.totalMinutes !== undefined && data.totalMinutes !== null ? Number(data.totalMinutes) : 0,
          targetTime: data.targetTime !== undefined && data.targetTime !== null ? Number(data.targetTime) : 150,
          totalCoins: data.totalCoins !== undefined && data.totalCoins !== null ? Number(data.totalCoins) : 8420,
          targetCoins: data.targetCoins !== undefined && data.targetCoins !== null ? Number(data.targetCoins) : 10000,
          totalDiamonds: data.totalDiamonds !== undefined && data.totalDiamonds !== null ? Number(data.totalDiamonds) : 1250,
          targetDiamonds: data.targetDiamonds !== undefined && data.targetDiamonds !== null ? Number(data.targetDiamonds) : 2000
        });
      } else {
        throw new Error('API response success is false or data is empty');
      }
    } catch (error) {
      console.log('Error fetching host levels:', error.message);
      // On error: zero out stats so stale mock values don’t mislead the user
      setCurrentLevel(1);
      setStats({
        totalCalls: 0,
        targetCalls: 0,
        totalTime: 0,
        targetTime: 0,
        totalCoins: 0,
        targetCoins: 0,
        totalDiamonds: 0,
        targetDiamonds: 0
      });
      // Fallback level data — level 0 excluded (promo only)
      setLevelData([
        { level: 1, name: 'Basic', minCalls: 80, minMinutes: 120, coinPerMinute: 25, status: 'current' },
        { level: 2, name: 'Copper', minCalls: 110, minMinutes: 200, coinPerMinute: 30, status: 'locked' },
        { level: 3, name: 'Bronze', minCalls: 160, minMinutes: 330, coinPerMinute: 36, status: 'locked' },
        { level: 4, name: 'Silver', minCalls: 220, minMinutes: 500, coinPerMinute: 42, status: 'locked' },
        { level: 5, name: 'Gold', minCalls: 300, minMinutes: 700, coinPerMinute: 48, status: 'locked' },
        { level: 6, name: 'Platinum', minCalls: 400, minMinutes: 950, coinPerMinute: 54, status: 'locked' },
        { level: 7, name: 'Diamond', minCalls: 500, minMinutes: 1200, coinPerMinute: 60, status: 'locked' },
        { level: 8, name: 'Grand Master', minCalls: 600, minMinutes: 1500, coinPerMinute: 66, status: 'locked' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getPercentage = () => {
    const cCalls = stats.totalCalls || 0;
    const tCalls = stats.targetCalls || 1;
    const cTime = stats.totalTime || 0;
    const tTime = stats.targetTime || 1;
    const cCoins = stats.totalCoins || 0;
    const tCoins = stats.targetCoins || 1;
    const cDiamonds = stats.totalDiamonds || 0;
    const tDiamonds = stats.targetDiamonds || 1;

    const p1 = cCalls / tCalls;
    const p2 = cTime / tTime;
    const p3 = cCoins / tCoins;
    const p4 = cDiamonds / tDiamonds;
    const avg = (p1 + p2 + p3 + p4) / 4;
    const result = Math.min(Math.floor(avg * 100), 100);
    return isNaN(result) ? 0 : result;
  };

  // Rendering a single metric bar in the list
  const renderMetricRow = (icon, label, current, target, color, iconColor) => {
    const safeCurrent = Number(current) || 0;
    const safeTarget = Number(target) || 1;
    const ratio = Math.min(safeCurrent / safeTarget, 1);
    const percentWidth = `${isNaN(ratio) ? 0 : ratio * 100}%`;
    return (
      <View style={styles.metricRow}>
        <View style={styles.metricLabelRow}>
          <View style={styles.metricNameWrap}>
            <IonIcon name={icon} size={15} color={iconColor} style={{ marginRight: 6 }} />
            <Text style={styles.metricLabel}>{label}</Text>
          </View>
          <Text style={styles.metricValues}>{`${safeCurrent.toLocaleString()} / ${safeTarget.toLocaleString()}`}</Text>
        </View>
        <View style={styles.progressRowContainer}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: percentWidth, backgroundColor: color }]} />
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <ScreenBackgroundView style={[{ flex: 1, backgroundColor: '#F8FAFC' }, { justifyContent: 'center', alignItems: 'center' }]}>
        <ScreenBackgroundStatusBar backgroundColor="#FFFFFF" barStyle="light-content" animated />
        <LinearGradient colors={['#08031a', '#050212', '#020108']} style={ScreenBackgroundStyleSheet.absoluteFillObject} />
        <ActivityIndicator size="large" color="#03dcfe" />
      </ScreenBackgroundView>
    );
  }

  const completionPercent = getPercentage();

  return (
    <ScreenBackgroundView style={[{ flex: 1, backgroundColor: '#08031a' }]}>
      <ScreenBackgroundStatusBar translucent backgroundColor="transparent" barStyle="dark-content" animated />
      <LinearGradient colors={['#08031a', '#050212', '#020108']} style={ScreenBackgroundStyleSheet.absoluteFillObject} />
      {/* Decorative stars overlay */}
      <View style={styles.starOverlay1} />
      <View style={styles.starOverlay2} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topSafeInset + 8 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <IonIcon name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('level.title') || 'Level'}</Text>
        <TouchableOpacity style={styles.helpButton} onPress={() => navigation.navigate('LevelHelp')}>
          <IonIcon name="help-circle-outline" size={24} color="#FFD700" />
        </TouchableOpacity>
      </View>
      <AnimatedTitleLine />

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]} showsVerticalScrollIndicator={false}>
        {/* 🌟 7-Day New Host Promo Banner */}
        <View style={{ marginBottom: 14 }}>
          <LinearGradient
            colors={['#FFD700', '#FF8C00', '#FF2D87']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ borderRadius: 16, padding: 1.5 }}
          >
            <LinearGradient
              colors={['rgba(30, 15, 60, 0.95)', 'rgba(15, 5, 30, 0.95)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                borderRadius: 15,
                paddingHorizontal: 14,
                paddingVertical: 12,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255, 215, 0, 0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                <Icon name="local-fire-department" size={22} color="#FFD700" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#FFD700', fontSize: 13, fontWeight: 'bold' }}>
                  {isPromoActive ? '🎁 7-Day New Host Welcome Offer' : '⭐ Standard Host Level'}
                </Text>
                <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 11, marginTop: 2, lineHeight: 15 }}>
                  {isPromoActive
                    ? `You are at Level 3 (Bronze) for your first 7 days! (${promoDaysLeft} days remaining). After 7 days, your level will start from Level 1 based on performance.`
                    : 'Your level is calculated based on completed call minutes & total calls.'}
                </Text>
              </View>
            </LinearGradient>
          </LinearGradient>
        </View>

        {/* Unified Glassmorphic Info Card */}
        <View style={styles.cardWrapper}>
          <LinearGradient
            colors={['#03dcfe', '#d946ef']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardBorder}
          >
            <LinearGradient
              colors={['rgba(23, 11, 78, 0.85)', 'rgba(7, 6, 40, 0.85)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardBody}
            >
              {/* Left Column: Avatar Circular Progress and level stars */}
              <View style={styles.leftCol}>
                <View style={styles.progressRingWrapper}>
                  {/* Outer circle layout */}
                  <LinearGradient
                    colors={['#d946ef', '#03dcfe']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.progressRingBorder}
                  >
                    <Image
                      source={getUserAvatar(user)}
                      style={styles.profileAvatar}
                    />
                  </LinearGradient>
                  {/* Progress percent badge below */}
                  <View style={styles.percentBadge}>
                    <Text style={styles.percentText}>{completionPercent}%</Text>
                  </View>
                </View>

                <Text style={styles.voiceChatTitle}>Yaro Voice Chat</Text>

                {/* Level Hex Badge */}
                <View style={styles.levelBadgeWrap}>
                  <LinearGradient
                    colors={['#8b5cf6', '#d946ef']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.levelBadgeHex}
                  >
                    <Text style={styles.levelBadgeText}>Lv. {currentLevel}</Text>
                  </LinearGradient>

                  {/* Glowing Stars */}
                  <View style={styles.starsRow}>
                    <IonIcon name="star" size={8} color="#facc15" />
                    <IonIcon name="star" size={8} color="#facc15" style={{ marginHorizontal: 2 }} />
                    <IonIcon name="star" size={8} color="#facc15" />
                  </View>
                </View>

                <Text style={styles.upgradeCaption}>
                  {(() => {
                    const maxLevel = levelData.reduce((max, l) => Math.max(max, l.level), 0);
                    if (levelData.length > 0 && currentLevel < maxLevel) {
                      return `You are close to Level ${currentLevel + 1} 💪`;
                    }
                    return 'You are at the top level! 🏆';
                  })()}
                </Text>
              </View>

              {/* Right Column: Bars */}
              <View style={styles.rightCol}>
                {renderMetricRow('call-outline', 'Total Calls', stats.totalCalls, stats.targetCalls, '#d946ef', '#a855f7')}
                {renderMetricRow('time-outline', 'Total Time (Min)', stats.totalTime, stats.targetTime, '#3b82f6', '#3b82f6')}
              </View>
            </LinearGradient>
          </LinearGradient>
        </View>

        {/* How to Upgrade Button */}
        <TouchableOpacity style={styles.howToUpgradeBtn} activeOpacity={0.8} onPress={() => navigation.navigate('LevelHelp')}>
          <LinearGradient
            colors={['#03dcfe', '#2911fe']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.howToUpgradeGradient}
          >
            <Text style={styles.howToUpgradeText}>How To Upgrade ?</Text>
            <IonIcon name="chevron-forward" size={16} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Benefits Section Title */}
        <View style={styles.sectionTitleRow}>
          <IonIcon name="sparkles" size={14} color="#d946ef" style={{ marginRight: 6 }} />
          <Text style={styles.sectionTitle}>Current Level Benefits</Text>
        </View>

        {/* Benefits Items Columns horizontal list */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.benefitsScroll}
          contentContainerStyle={styles.benefitsContent}
        >
          <View style={styles.benefitCard}>
            <Image source={coinIcon} style={styles.benefitIconImage} />
            <Text style={styles.benefitVal}>
              {(() => {
                const currentLvl = levelData.find(l => l.level === currentLevel);
                return currentLvl?.coinPerMinute != null
                  ? `+${currentLvl.coinPerMinute} Coins/Min`
                  : '-';
              })()}
            </Text>
            <Text style={styles.benefitName}>Earning Rate</Text>
          </View>

          <View style={styles.benefitCard}>
            <LinearGradient colors={['#8b5cf6', '#d946ef']} style={styles.benefitIconBadge}>
              <Text style={styles.benefitBadgeText}>Lv. {currentLevel}</Text>
            </LinearGradient>
            <Text style={styles.benefitVal}>Level {currentLevel}</Text>
            <Text style={styles.benefitName}>Badge</Text>
          </View>

          <View style={styles.benefitCard}>
            <View style={styles.benefitFrameOutline}>
              <IonIcon name="person-outline" size={14} color="#a855f7" />
            </View>
            <Text style={styles.benefitVal}>Silver</Text>
            <Text style={styles.benefitName}>Frame</Text>
          </View>

          <View style={styles.benefitCard}>
            <IonIcon name="trophy-outline" size={24} color="#facc15" style={styles.benefitIcon} />
            <Text style={styles.benefitVal}>Ranking</Text>
            <Text style={styles.benefitName}>Priority</Text>
          </View>

          <View style={styles.benefitCard}>
            <IonIcon name="wallet-outline" size={24} color="#10b981" style={styles.benefitIcon} />
            <Text style={styles.benefitVal}>₹20,000</Text>
            <Text style={styles.benefitName}>Withdrawal Limit</Text>
          </View>

          <View style={styles.benefitCard}>
            <IonIcon name="headset-outline" size={24} color="#ff3366" style={styles.benefitIcon} />
            <Text style={styles.benefitVal}>Priority</Text>
            <Text style={styles.benefitName}>Support</Text>
          </View>
        </ScrollView>

        {/* Levels Grid Table */}
        <View style={styles.tableOuter}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.01)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.tableInner}
          >
            {/* Table Header Row */}
            <LinearGradient
              colors={['#8b5cf6', '#d946ef']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.tableHeaderRow}
            >
              <Text style={[styles.headerCell, { flex: 0.7 }]}>Level</Text>
              <Text style={[styles.headerCell, { flex: 1.2 }]}>Total Calls</Text>
              <Text style={[styles.headerCell, { flex: 1.2 }]}>Total Time</Text>
              <Text style={[styles.headerCell, { flex: 1.1 }]}>Coin/Min</Text>
              <Text style={[styles.headerCell, { flex: 1.3 }]}>Status</Text>
            </LinearGradient>

            {/* Table Rows */}
            {levelData.map((item, idx) => {
              const isCurrent = item.status === 'current';
              const isCompleted = item.status === 'completed';
              const isLocked = item.status === 'locked';

              return (
                <View
                  key={item.level ?? idx}
                  style={[
                    styles.tableRow,
                    isCurrent && styles.tableRowCurrent,
                  ]}
                >
                  {/* Level Badge Cell */}
                  <View style={[styles.cellWrapper, { flex: 0.7 }]}>
                    <LinearGradient
                      colors={isCurrent ? ['#facc15', '#f97316'] : isCompleted ? ['#8b5cf6', '#d946ef'] : ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.rowLevelBadge}
                    >
                      <Text style={styles.rowLevelBadgeText}>{item.level}</Text>
                    </LinearGradient>
                  </View>

                  {/* Calls Cell */}
                  <Text style={[styles.cellText, { flex: 1.2 }, isCurrent && styles.textCurrent]}>
                    {isCurrent
                      ? `${stats.totalCalls}/${stats.targetCalls}`
                      : item.minCalls != null
                        ? item.minCalls.toLocaleString()
                        : '-'}
                  </Text>

                  {/* Time Cell */}
                  <Text style={[styles.cellText, { flex: 1.2 }, isCurrent && styles.textCurrent]}>
                    {isCurrent
                      ? `${stats.totalTime}/${stats.targetTime}`
                      : item.minMinutes != null
                        ? `${item.minMinutes.toLocaleString()} Min`
                        : '-'}
                  </Text>

                  {/* Coin / Min Cell */}
                  <Text style={[styles.cellTextCoin, { flex: 1.1 }, isCurrent && styles.textCurrent]}>
                    {isLocked
                      ? '-'
                      : item.coinPerMinute != null
                        ? `${item.coinPerMinute}`
                        : '-'}
                  </Text>

                  {/* Status Cell */}
                  <View style={[styles.cellWrapper, { flex: 1.3 }]}>
                    {isCompleted && (
                      <View style={styles.statusCompleted}>
                        <Text style={styles.statusCompletedText}>Completed</Text>
                        <IonIcon name="checkmark-circle-outline" size={10} color="#10b981" style={{ marginLeft: 3 }} />
                      </View>
                    )}
                    {isCurrent && (
                      <View style={styles.statusCurrent}>
                        <Text style={styles.statusCurrentText}>In Progress</Text>
                        <IonIcon name="time-outline" size={10} color="#f97316" style={{ marginLeft: 3 }} />
                      </View>
                    )}
                    {isLocked && (
                      <View style={styles.statusLocked}>
                        <Text style={styles.statusLockedText}>Locked</Text>
                        <IonIcon name="lock-closed-outline" size={10} color="rgba(255,255,255,0.3)" style={{ marginLeft: 3 }} />
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </LinearGradient>
        </View>

        {/* Footer encouragement banner */}
        <View style={styles.footerBanner}>
          <LinearGradient
            colors={['rgba(23, 11, 78, 0.45)', 'rgba(7, 6, 40, 0.45)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.footerBannerInner}
          >
            <LinearGradient
              colors={['#0ea5e9', '#d946ef']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.footerBorderOverlay}
            />
            <View style={styles.footerLeft}>
              <IonIcon name="trophy" size={24} color="#facc15" />
            </View>
            <View style={styles.footerMiddle}>
              <Text style={styles.footerTextTitle}>Keep going! You're doing great 🔥</Text>
              <Text style={styles.footerTextSubtitle}>Complete the requirements and unlock higher earnings.</Text>
            </View>
            <TouchableOpacity style={styles.footerButton}>
              <Text style={styles.footerBtnText}>View All Levels</Text>
              <IonIcon name="chevron-forward" size={10} color="#fff" style={{ marginLeft: 3 }} />
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </ScrollView>
    </ScreenBackgroundView>
  );
};

const styles = StyleSheet.create({
  starOverlay1: {
    position: 'absolute',
    top: height * 0.2,
    left: width * 0.15,
    width: 2,
    height: 2,
    backgroundColor: '#fff',
    opacity: 0.25,
  },
  starOverlay2: {
    position: 'absolute',
    top: height * 0.6,
    right: width * 0.2,
    width: 2.5,
    height: 2.5,
    backgroundColor: '#fff',
    opacity: 0.35,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  helpButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
  },

  // Info Card
  cardWrapper: {
    width: '100%',
    marginBottom: 20,
  },
  cardBorder: {
    borderRadius: 24,
    padding: 1.5,
  },
  cardBody: {
    flexDirection: 'row',
    borderRadius: 22.5,
    padding: 16,
    alignItems: 'center',
  },
  leftCol: {
    width: '44%',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.06)',
    paddingRight: 8,
  },
  progressRingWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  progressRingBorder: {
    width: 82,
    height: 82,
    borderRadius: 41,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#070628',
  },
  percentBadge: {
    position: 'absolute',
    bottom: -6,
    backgroundColor: '#0c0628',
    borderWidth: 1.5,
    borderColor: '#03dcfe',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  percentText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  voiceChatTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 8,
  },
  levelBadgeWrap: {
    alignItems: 'center',
    marginBottom: 4,
  },
  levelBadgeHex: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  starsRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  upgradeCaption: {
    color: '#a855f7',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },

  rightCol: {
    width: '56%',
    paddingLeft: 12,
  },
  metricRow: {
    marginBottom: 12,
  },
  metricLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  metricNameWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricLabel: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 10,
    fontWeight: '600',
  },
  metricValues: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  progressRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarBg: {
    flex: 1,
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2.5,
    marginRight: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  metricTargetLevel: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 9,
    fontWeight: '700',
  },

  // Upgrade Button
  howToUpgradeBtn: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
  },
  howToUpgradeGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  howToUpgradeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    marginRight: 6,
  },

  // Benefits Title
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },

  // Benefits Scroll
  benefitsScroll: {
    marginBottom: 20,
  },
  benefitsContent: {
    paddingRight: 16,
  },
  benefitCard: {
    width: 90,
    height: 94,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  benefitIconImage: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  benefitIconBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  benefitBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  benefitFrameOutline: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitIcon: {
    marginBottom: 2,
  },
  benefitVal: {
    color: '#facc15',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 6,
    marginBottom: 2,
  },
  benefitName: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 8,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Table Outer
  tableOuter: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 20,
  },
  tableInner: {
    flex: 1,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 12,
  },
  headerCell: {
    flex: 1,
    color: '#fff',
    fontWeight: '800',
    fontSize: 11,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  tableRowCurrent: {
    backgroundColor: 'rgba(3, 220, 254, 0.05)',
    borderLeftWidth: 3,
    borderLeftColor: '#facc15',
  },
  cellWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowLevelBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowLevelBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
  },
  cellText: {
    flex: 1,
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '600',
  },
  cellTextCoin: {
    flex: 1,
    color: '#facc15',
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '800',
  },
  textCurrent: {
    color: '#fff',
    fontWeight: 'bold',
  },

  // Status pills
  statusCompleted: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  statusCompletedText: {
    color: '#10b981',
    fontSize: 8,
    fontWeight: '800',
  },
  statusCurrent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  statusCurrentText: {
    color: '#f97316',
    fontSize: 8,
    fontWeight: '800',
  },
  statusLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  statusLockedText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 8,
    fontWeight: '800',
  },

  // Footer Banner
  footerBanner: {
    width: '100%',
    marginBottom: 40,
  },
  footerBannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 12,
  },
  footerBorderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    padding: 1,
    pointerEvents: 'none',
  },
  footerLeft: {
    marginRight: 10,
  },
  footerMiddle: {
    flex: 1,
  },
  footerTextTitle: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 2,
  },
  footerTextSubtitle: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 8,
    fontWeight: '600',
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  footerBtnText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '800',
  },
});

export default Level;
