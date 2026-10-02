import React, { useCallback, useContext, useMemo, useState } from 'react';
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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { SvgaPlayer } from '@dasimems/react-native-svga';
import { apiUtil } from '../../utils/apiUtil';
import { AuthContext } from '../../context/AuthProvider';
import { getUserAvatar } from '../../utils/avatarUtil';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';

const { width } = Dimensions.get('window');

const getTierMeta = (lvl) => {
  const num = Number(lvl) || 1;
  if (num <= 10) {
    return {
      tier: 'Bronze Legion',
      badge: '🥉 Bronze',
      colors: ['#F59E0B', '#B45309'],
      bg: '#FEF3C7',
      text: '#92400E',
    };
  }
  if (num <= 25) {
    return {
      tier: 'Silver Knight',
      badge: '🥈 Silver',
      colors: ['#94A3B8', '#475569'],
      bg: '#F1F5F9',
      text: '#334155',
    };
  }
  if (num <= 50) {
    return {
      tier: 'Golden Monarch',
      badge: '👑 Gold',
      colors: ['#FBBF24', '#D97706'],
      bg: '#FEF9C3',
      text: '#854D0E',
    };
  }
  if (num <= 75) {
    return {
      tier: 'Diamond Sovereign',
      badge: '💎 Diamond',
      colors: ['#38BDF8', '#0284C7'],
      bg: '#E0F2FE',
      text: '#075985',
    };
  }
  if (num < 100) {
    return {
      tier: 'Celestial Cosmos',
      badge: '🌌 Celestial',
      colors: ['#A855F7', '#7E22CE'],
      bg: '#F3E8FF',
      text: '#6B21A8',
    };
  }
  return {
    tier: 'Mythic Overlord',
    badge: '🔥 Mythic (MAX)',
    colors: ['#EC4899', '#BE185D'],
    bg: '#FCE7F3',
    text: '#9D174D',
  };
};

// Fallback 100 Levels Ladder if backend has limited entries
const generateLadderFallback = () => {
  const list = [];
  for (let i = 1; i <= 100; i++) {
    const meta = getTierMeta(i);
    list.push({
      _id: `lvl-${i}`,
      level: i,
      name: `${meta.tier} Lv.${i}`,
      coinPerMinute: Math.min(100, 20 + Math.floor(i * 0.8)),
      minCalls: Math.max(0, (i - 1) * 5),
      minMinutes: Math.max(0, (i - 1) * 20),
      rewards: i % 10 === 0 ? [
        {
          name: `${meta.tier} Frame`,
          type: 'frame',
          durationDays: 30,
        },
        {
          name: `${meta.tier} Room Entry`,
          type: 'entry',
          durationDays: 30,
        },
      ] : [],
    });
  }
  return list;
};

const rewardDuration = (reward) =>
  Number(reward?.durationDays) === 0 ? 'Permanent' : `${Number(reward?.durationDays) || 30} days`;

const rewardArt = (reward, style) => {
  if (reward?.animationUrl && /\.svga(?:\?|$)/i.test(reward.animationUrl)) {
    return <SvgaPlayer source={reward.animationUrl} style={style} loops={0} />;
  }
  if (reward?.animationUrl || reward?.imageUrl) {
    return (
      <Image
        source={{ uri: reward.animationUrl || reward.imageUrl }}
        style={style}
        resizeMode="contain"
      />
    );
  }
  return (
    <MaterialCommunityIcons
      name={reward?.type === 'frame' ? 'circle-double' : 'star-shooting'}
      size={50}
      color="#A855F7"
    />
  );
};

export default function LevelJourney() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user, fetchUserProfile } = useContext(AuthContext);

  const currentLevel = Number(user?.level) || 1;
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('All'); // 'All' | 'Unlocked' | 'Upcoming'
  const [preview, setPreview] = useState(null);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    try {
      await fetchUserProfile();
      const response = await apiUtil.get('/store/levels', { suppressGlobalError: true });
      const items = response?.data?.data?.levels;
      if (Array.isArray(items) && items.length > 0) {
        setLevels([...items].sort((a, b) => Number(a.level) - Number(b.level)));
      } else {
        setLevels(generateLadderFallback());
      }
    } catch (_) {
      setLevels(generateLadderFallback());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchUserProfile]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const nextMilestone = useMemo(
    () => levels.find((item) => Number(item.level) > currentLevel),
    [levels, currentLevel]
  );

  const visibleLevels = useMemo(() => {
    return levels.filter((item) => {
      const lvl = Number(item.level);
      if (filter === 'Unlocked') return lvl <= currentLevel;
      if (filter === 'Upcoming') return lvl > currentLevel;
      return true;
    });
  }, [levels, filter, currentLevel]);

  const currentTierMeta = getTierMeta(currentLevel);

  return (
    <View style={styles.screen}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Hero Header */}
      <LinearGradient
        colors={['#0B0721', '#1C0D45', '#451B80', '#6D28D9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: getAppTopSafeInset(insets.top) + 8 }]}
      >
        <View style={styles.navRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            activeOpacity={0.8}
          >
            <Icon name="chevron-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>{t('level.title') || 'Level Progression'}</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('LevelHelp')}
            style={styles.backBtn}
            activeOpacity={0.8}
          >
            <Icon name="help-circle-outline" size={21} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* User Level Card */}
        <View style={styles.heroProfileRow}>
          <View style={styles.avatarGlowWrapper}>
            <LinearGradient
              colors={currentTierMeta.colors}
              style={styles.avatarBorderGradient}
            >
              <Image source={getUserAvatar(user)} style={styles.avatar} />
            </LinearGradient>
            <View style={styles.currentLevelPill}>
              <Text style={styles.currentLevelPillText}>Lv.{currentLevel}</Text>
            </View>
          </View>

          <View style={{ flex: 1 }}>
            <View style={styles.tierBadgeRow}>
              <View style={[styles.tierTag, { backgroundColor: currentTierMeta.bg }]}>
                <Text style={[styles.tierTagText, { color: currentTierMeta.text }]}>
                  {currentTierMeta.badge}
                </Text>
              </View>
            </View>

            <Text style={styles.heroUserName} numberOfLines={1}>
              {user?.name || 'Yaro Explorer'}
            </Text>
            <Text style={styles.heroTierTitle}>
              {currentTierMeta.tier}
            </Text>

            {nextMilestone ? (
              <View style={styles.progressContainer}>
                <View style={styles.progressBarBg}>
                  <LinearGradient
                    colors={currentTierMeta.colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.progressBarFill, { width: `${Math.min(100, Math.max(15, (currentLevel / Number(nextMilestone.level)) * 100))}%` }]}
                  />
                </View>
                <Text style={styles.progressText}>
                  Next: Level {nextMilestone.level} ({nextMilestone.minCalls || 0} calls / {nextMilestone.minMinutes || 0}m)
                </Text>
              </View>
            ) : (
              <Text style={styles.maxLevelText}>🏆 Maximum VIP Level Achieved</Text>
            )}
          </View>
        </View>

        {/* Earning Rate Banner */}
        <View style={styles.earningRateBanner}>
          <MaterialCommunityIcons name="diamond-stone" size={17} color="#67E8F9" />
          <Text style={styles.earningRateText}>
            Current Rate: <Text style={{ fontWeight: '900', color: '#FFFFFF' }}>{Math.min(100, 20 + Math.floor(currentLevel * 0.8))} Coins</Text> per minute of call
          </Text>
        </View>
      </LinearGradient>

      {/* Main Milestones List */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: getStackScreenBottomPadding(insets.bottom, 28) },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Next Target Card */}
        {nextMilestone && (
          <View style={styles.nextTargetCard}>
            <View style={styles.targetIconBox}>
              <MaterialCommunityIcons name="flag-checkered" size={24} color="#7C3AED" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.targetKicker}>UPCOMING MILESTONE · LV.{nextMilestone.level}</Text>
              <Text style={styles.targetTitle}>{nextMilestone.name || `Level ${nextMilestone.level}`}</Text>
              <Text style={styles.targetMeta}>
                Requires {nextMilestone.minCalls || 0} calls & {nextMilestone.minMinutes || 0} minutes talking time
              </Text>
            </View>
          </View>
        )}

        {/* Filter Navigation */}
        <View style={styles.filterSectionRow}>
          <Text style={styles.sectionHeaderTitle}>LEVEL JOURNEY</Text>
          <Text style={styles.sectionHeaderCount}>{levels.length} Milestones</Text>
        </View>

        <View style={styles.filterTabs}>
          {[
            { id: 'All', label: 'All Levels' },
            { id: 'Unlocked', label: `Unlocked (${currentLevel})` },
            { id: 'Upcoming', label: 'Upcoming' },
          ].map((item) => {
            const isSelected = filter === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => setFilter(item.id)}
                style={[styles.filterTabBtn, isSelected && styles.filterTabBtnActive]}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterTabText, isSelected && styles.filterTabTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text style={styles.loadingText}>Loading level ladder...</Text>
          </View>
        ) : (
          visibleLevels.map((lvl) => {
            const isUnlocked = Number(lvl.level) <= currentLevel;
            const isCurrent = Number(lvl.level) === currentLevel;
            const meta = getTierMeta(lvl.level);
            const rewards = Array.isArray(lvl.rewards) ? lvl.rewards : [];

            return (
              <View
                key={lvl._id || lvl.level}
                style={[
                  styles.levelCard,
                  isCurrent && styles.levelCardCurrent,
                  isUnlocked && styles.levelCardUnlocked,
                ]}
              >
                {/* Level Card Header */}
                <View style={styles.cardHeaderRow}>
                  {/* Level Badge Number */}
                  <LinearGradient
                    colors={isUnlocked ? meta.colors : ['#CBD5E1', '#94A3B8']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.levelBadgeCircle}
                  >
                    <Text style={styles.levelBadgeCircleText}>{lvl.level}</Text>
                  </LinearGradient>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.levelNameText}>{lvl.name || `Level ${lvl.level}`}</Text>
                      {isCurrent && (
                        <View style={styles.currentTag}>
                          <Text style={styles.currentTagText}>YOU ARE HERE</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.levelReqText}>
                      {Number(lvl.minCalls) || 0} calls  ·  {Number(lvl.minMinutes) || 0} minutes
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusPill,
                      isUnlocked ? styles.statusPillUnlocked : styles.statusPillLocked,
                    ]}
                  >
                    <Icon
                      name={isUnlocked ? 'checkmark-circle' : 'lock-closed'}
                      size={15}
                      color={isUnlocked ? '#10B981' : '#94A3B8'}
                    />
                    <Text
                      style={[
                        styles.statusPillText,
                        isUnlocked ? { color: '#047857' } : { color: '#64748B' },
                      ]}
                    >
                      {isUnlocked ? 'Unlocked' : 'Locked'}
                    </Text>
                  </View>
                </View>

                {/* Rates Row */}
                <View style={styles.ratesRow}>
                  <View style={styles.rateChip}>
                    <MaterialCommunityIcons name="diamond-stone" size={13} color="#7C3AED" />
                    <Text style={styles.rateChipText}>
                      {Number(lvl.coinPerMinute) || 20} coins / min
                    </Text>
                  </View>
                  <Text style={styles.tierChipLabel}>{meta.tier}</Text>
                </View>

                {/* Rewards List */}
                {rewards.length > 0 ? (
                  <View style={styles.rewardsSection}>
                    <Text style={styles.rewardsHeaderLabel}>EXCLUSIVE MILESTONE REWARDS</Text>
                    {rewards.map((reward, rIdx) => (
                      <TouchableOpacity
                        key={`${lvl.level}-${rIdx}`}
                        onPress={() => setPreview({ ...reward, level: lvl.level, isUnlocked })}
                        style={styles.rewardChip}
                        activeOpacity={0.8}
                      >
                        <MaterialCommunityIcons
                          name={reward.type === 'frame' ? 'circle-double' : 'star-shooting'}
                          size={18}
                          color="#7C3AED"
                        />
                        <Text style={styles.rewardChipName} numberOfLines={1}>
                          {reward.name}
                        </Text>
                        <Text style={styles.rewardChipDays}>{rewardDuration(reward)}</Text>
                        <Icon name="chevron-forward" size={15} color="#A78BFA" />
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Reward Preview Modal */}
      <Modal
        visible={Boolean(preview)}
        transparent
        animationType="fade"
        onRequestClose={() => setPreview(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.rewardModalCard}>
            <TouchableOpacity onPress={() => setPreview(null)} style={styles.modalCloseBtn}>
              <Icon name="close" size={22} color="#64748B" />
            </TouchableOpacity>

            <Text style={styles.modalKicker}>LEVEL {preview?.level} REWARD PREVIEW</Text>
            <View style={styles.modalArtBox}>
              {preview?.type === 'frame' && (
                <Image source={getUserAvatar(user)} style={styles.modalAvatarInner} />
              )}
              {rewardArt(preview, styles.modalAsset)}
            </View>

            <Text style={styles.modalRewardTitle}>{preview?.name}</Text>
            <Text style={styles.modalRewardSubtitle}>
              {preview?.type === 'frame' ? 'Avatar Frame' : 'Voice Room Entry Effect'} · {rewardDuration(preview)}
            </Text>

            <View style={[styles.modalStatusBox, preview?.isUnlocked ? styles.modalStatusBoxUnlocked : styles.modalStatusBoxLocked]}>
              <Icon
                name={preview?.isUnlocked ? 'checkmark-circle' : 'lock-closed'}
                size={18}
                color={preview?.isUnlocked ? '#10B981' : '#94A3B8'}
              />
              <Text
                style={[
                  styles.modalStatusText,
                  preview?.isUnlocked ? { color: '#047857' } : { color: '#475569' },
                ]}
              >
                {preview?.isUnlocked
                  ? 'Reward Unlocked! Go to My Items to equip.'
                  : `Reach Level ${preview?.level} to claim this exclusive reward.`}
              </Text>
            </View>

            {preview?.isUnlocked && (
              <TouchableOpacity
                onPress={() => {
                  setPreview(null);
                  navigation.navigate('MyItems');
                }}
                style={styles.modalEquipBtn}
                activeOpacity={0.85}
              >
                <Text style={styles.modalEquipBtnText}>Go to My Items</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  heroProfileRow: { flexDirection: 'row', alignItems: 'center' },
  avatarGlowWrapper: { position: 'relative', marginRight: 16 },
  avatarBorderGradient: {
    width: 76,
    height: 76,
    borderRadius: 26,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: { width: '100%', height: '100%', borderRadius: 23, backgroundColor: '#EEF2FF' },
  currentLevelPill: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  currentLevelPillText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  tierBadgeRow: { flexDirection: 'row', marginBottom: 4 },
  tierTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tierTagText: { fontSize: 10, fontWeight: '800' },
  heroUserName: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  heroTierTitle: { color: '#DDD6FE', fontSize: 13, fontWeight: '700', marginTop: 1 },
  progressContainer: { marginTop: 8 },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: { height: '100%', borderRadius: 3 },
  progressText: { color: '#C4B5FD', fontSize: 10, fontWeight: '700', marginTop: 4 },
  maxLevelText: { color: '#FDE047', fontSize: 11, fontWeight: '800', marginTop: 6 },
  earningRateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginTop: 18,
  },
  earningRateText: { color: '#E0E7FF', fontSize: 11, fontWeight: '600' },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  nextTargetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 2,
    shadowColor: '#7C3AED',
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  targetIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  targetKicker: { color: '#7C3AED', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  targetTitle: { color: '#0F172A', fontSize: 15, fontWeight: '900', marginTop: 2 },
  targetMeta: { color: '#64748B', fontSize: 11, marginTop: 2 },
  filterSectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionHeaderTitle: { color: '#64748B', fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  sectionHeaderCount: { color: '#7C3AED', fontSize: 11, fontWeight: '800' },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    padding: 3,
    marginBottom: 14,
  },
  filterTabBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 11,
  },
  filterTabBtnActive: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },
  filterTabText: { color: '#64748B', fontSize: 11, fontWeight: '700' },
  filterTabTextActive: { color: '#4F46E5', fontWeight: '900' },
  loadingBox: { alignItems: 'center', paddingVertical: 60 },
  loadingText: { color: '#64748B', fontSize: 13, marginTop: 10, fontWeight: '600' },
  levelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 3,
  },
  levelCardUnlocked: {
    borderColor: '#E2E8F0',
  },
  levelCardCurrent: {
    borderColor: '#8B5CF6',
    borderWidth: 2,
    elevation: 3,
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  levelBadgeCircle: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelBadgeCircleText: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  levelNameText: { color: '#0F172A', fontSize: 15, fontWeight: '800' },
  currentTag: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  currentTagText: { color: '#FFFFFF', fontSize: 8, fontWeight: '900' },
  levelReqText: { color: '#64748B', fontSize: 11, marginTop: 3 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusPillUnlocked: { backgroundColor: '#ECFDF5' },
  statusPillLocked: { backgroundColor: '#F1F5F9' },
  statusPillText: { fontSize: 10, fontWeight: '800' },
  ratesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  rateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rateChipText: { color: '#7C3AED', fontSize: 11, fontWeight: '800' },
  tierChipLabel: { color: '#94A3B8', fontSize: 10, fontWeight: '700' },
  rewardsSection: { marginTop: 10, gap: 6 },
  rewardsHeaderLabel: {
    color: '#8B5CF6',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 2,
  },
  rewardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FAF5FF',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  rewardChipName: { color: '#1E1B4B', fontSize: 11, fontWeight: '700', flex: 1 },
  rewardChipDays: { color: '#7C3AED', fontSize: 10, fontWeight: '800' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 10, 38, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  rewardModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 22,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  modalCloseBtn: { alignSelf: 'flex-end', padding: 4 },
  modalKicker: { color: '#7C3AED', fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  modalArtBox: {
    width: 160,
    height: 160,
    borderRadius: 24,
    backgroundColor: '#FAF5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
    overflow: 'hidden',
  },
  modalAvatarInner: { width: 84, height: 84, borderRadius: 42 },
  modalAsset: { width: 150, height: 150, position: 'absolute' },
  modalRewardTitle: { color: '#0F172A', fontSize: 18, fontWeight: '900', textAlign: 'center' },
  modalRewardSubtitle: { color: '#64748B', fontSize: 12, marginTop: 4, fontWeight: '600' },
  modalStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 14,
    marginTop: 14,
    width: '100%',
  },
  modalStatusBoxUnlocked: { backgroundColor: '#ECFDF5' },
  modalStatusBoxLocked: { backgroundColor: '#F8FAFC' },
  modalStatusText: { fontSize: 11, fontWeight: '600', flex: 1, lineHeight: 16 },
  modalEquipBtn: {
    backgroundColor: '#7C3AED',
    paddingVertical: 12,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    marginTop: 14,
  },
  modalEquipBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
});
