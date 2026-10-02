import React, { useEffect, useState, useContext, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  Modal,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import IonIcon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { apiUtil } from '../../utils/apiUtil';
import { AuthContext } from '../../context/AuthProvider';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';
import { getUserAvatar } from '../../utils/avatarUtil';
import AvatarWithFrame from '../../components/AvatarWithFrame';
import { AlertService } from '../../utils/AlertService';
import { SvgaPlayer } from '@dasimems/react-native-svga';

const { width } = Dimensions.get('window');

// 100-Level Generator supporting all tiers up to Lv 100
const generate100Levels = () => {
  const list = [];
  for (let i = 1; i <= 100; i++) {
    let tier = 'Bronze';
    let tierColor = '#D97706';
    let gradientColors = ['#2D1F10', '#1C1309'];
    let title = `Bronze Scout ${i}`;
    let badge = 'Bronze Star';
    let frame = null;
    let entry = null;
    let uniqueId = null;

    if (i <= 10) {
      tier = 'Bronze';
      tierColor = '#F59E0B';
      gradientColors = ['#2C1A0E', '#180E07'];
      title = i === 10 ? 'Bronze Star Champion' : `Bronze Scout Lv.${i}`;
      badge = i >= 6 ? 'Bronze Sovereign' : 'Bronze Scout';
      if (i === 10) frame = 'Bronze Halo Frame';
    } else if (i <= 25) {
      tier = 'Silver';
      tierColor = '#94A3B8';
      gradientColors = ['#1E293B', '#0F172A'];
      title = i === 25 ? 'Silver Templar Legend' : `Silver Knight Lv.${i}`;
      badge = i >= 20 ? 'Silver Templar' : 'Silver Knight';
      if (i === 15) frame = 'Silver Wing Frame';
      if (i === 20) entry = 'Silver Chariot Entry';
    } else if (i <= 50) {
      tier = 'Gold';
      tierColor = '#FBBF24';
      gradientColors = ['#38240D', '#1D1206'];
      title = i === 50 ? 'Imperial Gold Monarch' : `Gold Master Lv.${i}`;
      badge = i >= 40 ? 'Gold Sovereign' : 'Gold Monarch';
      if (i === 30) frame = 'Golden Phoenix Frame';
      if (i === 40) uniqueId = '6-Digit Lucky ID';
      if (i === 50) {
        frame = 'Imperial Gold Dragon';
        entry = 'Golden Dragon Entry';
      }
    } else if (i <= 75) {
      tier = 'Diamond';
      tierColor = '#38BDF8';
      gradientColors = ['#082F49', '#031726'];
      title = i === 75 ? 'Supreme Diamond Overlord' : `Diamond Lord Lv.${i}`;
      badge = i >= 65 ? 'Diamond Sovereign' : 'Diamond Overlord';
      if (i === 60) frame = 'Diamond Crown Frame';
      if (i === 65) uniqueId = '5-Digit Lucky ID';
      if (i === 75) {
        frame = 'Brilliant Diamond Ring';
        entry = 'Diamond Hypercar Entry';
      }
    } else if (i <= 99) {
      tier = 'Celestial';
      tierColor = '#A855F7';
      gradientColors = ['#2E1065', '#170638'];
      title = i === 99 ? 'Celestial Cosmos Emperor' : `Celestial Astral Lv.${i}`;
      badge = i >= 90 ? 'Celestial Cosmos' : 'Celestial Emperor';
      if (i === 80) frame = 'Celestial Nebula Frame';
      if (i === 85) uniqueId = '5-Digit Gold ID';
      if (i === 90) entry = 'Pegasus Astral Warp';
    } else {
      // Level 100 MAX
      tier = 'Mythic';
      tierColor = '#EC4899';
      gradientColors = ['#500724', '#260210'];
      title = 'Mythic Sovereign Lv.100 (MAX)';
      badge = 'Mythic Sovereign 👑';
      frame = 'Mythic Eternal Frame';
      entry = 'Cyber Mythic Battleship';
      uniqueId = 'Custom 4-Digit Royal Crown ID';
    }

    const expRequired = Math.round(50 * Math.pow(1.08, i - 1));
    const bonusRate = Math.min(250, 10 + i * 2.5);

    list.push({
      level: i,
      tier,
      tierColor,
      gradientColors,
      title,
      badge,
      frame,
      entry,
      uniqueId,
      expRequired,
      bonusRate: Math.round(bonusRate),
    });
  }
  return list;
};

const TIERS_SUMMARY = [
  { id: 'Bronze', label: 'Bronze', range: 'Lv 1-10', color: '#F59E0B', icon: 'shield' },
  { id: 'Silver', label: 'Silver', range: 'Lv 11-25', color: '#94A3B8', icon: 'shield-outline' },
  { id: 'Gold', label: 'Gold', range: 'Lv 26-50', color: '#FBBF24', icon: 'crown' },
  { id: 'Diamond', label: 'Diamond', range: 'Lv 51-75', color: '#38BDF8', icon: 'diamond-stone' },
  { id: 'Celestial', label: 'Celestial', range: 'Lv 76-99', color: '#A855F7', icon: 'star-circle' },
  { id: 'Mythic', label: 'Mythic', range: 'Lv 100', color: '#EC4899', icon: 'trophy' },
];

function LevelScreen() {
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomSafePadding = getStackScreenBottomPadding(insets.bottom);
  const navigation = useNavigation();
  const { user, equippedFrame } = useContext(AuthContext);

  const [currentLevel, setCurrentLevel] = useState(6);
  const [currentExp, setCurrentExp] = useState(83);
  const [selectedTier, setSelectedTier] = useState('All');
  const [selectedRange, setSelectedRange] = useState('Lv 1-20');
  const [claimedTasks, setClaimedTasks] = useState([]);
  const [configuredLevels, setConfiguredLevels] = useState([]);
  const [selectedReward, setSelectedReward] = useState(null);

  useEffect(() => {
    if (user?.level) setCurrentLevel(Number(user.level) || 6);
  }, [user]);

  useEffect(() => {
    let active = true;
    apiUtil.get('/store/levels', { suppressGlobalError: true })
      .then((response) => {
        const levelData = response?.data?.data?.levels || [];
        if (active && Array.isArray(levelData)) setConfiguredLevels(levelData);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  const allLevels = useMemo(() => {
    const generated = generate100Levels();
    if (!configuredLevels.length) return generated;
    const byLevel = new Map(configuredLevels.map(level => [Number(level.level), level]));
    return generated.map(level => {
      const configured = byLevel.get(level.level);
      if (!configured) return level;
      const rewards = Array.isArray(configured.rewards) ? configured.rewards : [];
      const frameReward = rewards.find(reward => reward.type === 'frame');
      const entryReward = rewards.find(reward => reward.type === 'entry');
      return {
        ...level,
        title: configured.name || level.title,
        bonusRate: Number(configured.coinPerMinute) || level.bonusRate,
        rewards,
        frame: frameReward?.name || null,
        frameDurationDays: frameReward?.durationDays,
        entry: entryReward?.name || null,
        entryDurationDays: entryReward?.durationDays,
      };
    });
  }, [configuredLevels]);

  // Filter levels based on selected range or tier
  const displayedLevels = useMemo(() => {
    if (selectedTier !== 'All') {
      return allLevels.filter((lvl) => lvl.tier === selectedTier);
    }
    if (selectedRange === 'Lv 1-20') return allLevels.slice(0, 20);
    if (selectedRange === 'Lv 21-40') return allLevels.slice(20, 40);
    if (selectedRange === 'Lv 41-60') return allLevels.slice(40, 60);
    if (selectedRange === 'Lv 61-80') return allLevels.slice(60, 80);
    if (selectedRange === 'Lv 81-100') return allLevels.slice(80, 100);
    return allLevels;
  }, [allLevels, selectedTier, selectedRange]);

  const currentLevelObj = useMemo(() => {
    return allLevels.find((l) => l.level === currentLevel) || allLevels[5];
  }, [allLevels, currentLevel]);

  const nextLevelObj = useMemo(() => {
    return allLevels.find((l) => l.level === currentLevel + 1) || allLevels[6];
  }, [allLevels, currentLevel]);

  const progressPercent = Math.min(100, Math.round((currentExp / (nextLevelObj.expRequired || 150)) * 100));

  const handleClaimTask = (taskId, expReward) => {
    if (claimedTasks.includes(taskId)) return;
    setClaimedTasks((prev) => [...prev, taskId]);
    setCurrentExp((prev) => prev + expReward);
    AlertService.show('XP Claimed!', `+${expReward} Level EXP added to your profile! 🚀`, 'success');
  };

  return (
    <View style={styles.screenContainer}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Background Gradient */}
      <LinearGradient
        colors={['#0F0C20', '#181232', '#0A0815']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Top Header Bar */}
      <View style={[styles.headerBar, { paddingTop: topSafeInset + 6 }]}>
        <TouchableOpacity
          style={styles.backBtnCircle}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <IonIcon name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>100-Level System</Text>
        <TouchableOpacity
          style={styles.helpBtnCircle}
          onPress={() => navigation.navigate('LevelHelp')}
          activeOpacity={0.8}
        >
          <IonIcon name="help-circle-outline" size={22} color="#CBD5E1" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomSafePadding + 30 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO LEVEL CARD */}
        <LinearGradient
          colors={['#2E1065', '#3B0764', '#1E1B4B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroTopRow}>
            {/* User Avatar with Frame */}
            <View style={styles.heroAvatarWrap}>
              <AvatarWithFrame
                user={user}
                frame={equippedFrame || 'Rose frame'}
                size={76}
                showOnlineDot={false}
              />
              <View style={styles.heroCrownBadge}>
                <Text style={{ fontSize: 13 }}>👑</Text>
              </View>
            </View>

            {/* User Info */}
            <View style={styles.heroInfoCol}>
              <View style={styles.heroLevelBadgeRow}>
                <LinearGradient
                  colors={['#F59E0B', '#D97706']}
                  style={styles.heroLevelPill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.heroLevelPillText}>Lv.{currentLevel}</Text>
                </LinearGradient>
                <Text style={styles.heroTierTitle}>{currentLevelObj.title}</Text>
              </View>
              <Text style={styles.heroUserNameText} numberOfLines={1}>
                {user?.name || 'Yaro Host'}
              </Text>
              <Text style={styles.heroBonusText}>
                +<Text style={styles.heroBonusVal}>{currentLevelObj.bonusRate} Beans/min</Text> Call Rate Boost
              </Text>
            </View>
          </View>

          {/* EXP PROGRESS BAR */}
          <View style={styles.progressContainer}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>Current Progress</Text>
              <Text style={styles.progressExpValue}>
                {currentExp} / {nextLevelObj.expRequired} EXP ({progressPercent}%)
              </Text>
            </View>
            <View style={styles.progressBarBg}>
              <LinearGradient
                colors={['#EC4899', '#8B5CF6', '#38BDF8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
              />
            </View>
            <Text style={styles.nextLevelTip}>
              Reach Level {currentLevel + 1} to unlock exclusive badges and call multiplier!
            </Text>
          </View>
        </LinearGradient>

        {/* PRIVILEGES HIGHLIGHT CAROUSEL */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Level Privileges</Text>
          <Text style={styles.sectionSub}>Exclusive Prestige Unlocks</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.privilegesScroll}>
          <LinearGradient colors={['#1E1B4B', '#312E81']} style={styles.privilegeCard}>
            <View style={[styles.privilegeIconWrap, { backgroundColor: '#4C1D95' }]}>
              <MaterialCommunityIcons name="badge-account-horizontal" size={26} color="#A78BFA" />
            </View>
            <Text style={styles.privilegeTitle}>Badge Tag</Text>
            <Text style={styles.privilegeDesc}>Glowing custom tags displayed beside your name.</Text>
          </LinearGradient>

          <LinearGradient colors={['#1E1B4B', '#312E81']} style={styles.privilegeCard}>
            <View style={[styles.privilegeIconWrap, { backgroundColor: '#831843' }]}>
              <MaterialCommunityIcons name="circle-double" size={26} color="#F472B6" />
            </View>
            <Text style={styles.privilegeTitle}>Animated Frame</Text>
            <Text style={styles.privilegeDesc}>Opulent floral & angelic frames for your avatar.</Text>
          </LinearGradient>

          <LinearGradient colors={['#1E1B4B', '#312E81']} style={styles.privilegeCard}>
            <View style={[styles.privilegeIconWrap, { backgroundColor: '#78350F' }]}>
              <MaterialCommunityIcons name="racing-helmet" size={26} color="#FDE047" />
            </View>
            <Text style={styles.privilegeTitle}>Grand Entry</Text>
            <Text style={styles.privilegeDesc}>Chariots & dragons announcing your voice room entry.</Text>
          </LinearGradient>

          <LinearGradient colors={['#1E1B4B', '#312E81']} style={styles.privilegeCard}>
            <View style={[styles.privilegeIconWrap, { backgroundColor: '#064E3B' }]}>
              <MaterialCommunityIcons name="shield-star" size={26} color="#34D399" />
            </View>
            <Text style={styles.privilegeTitle}>Unique ID</Text>
            <Text style={styles.privilegeDesc}>Prestige 6-digit & 5-digit gold numbers.</Text>
          </LinearGradient>
        </ScrollView>

        {/* TIER SELECTOR CHIPS */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Progression Ladder</Text>
          <Text style={styles.sectionSub}>1 to 100 Levels</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tierChipsScroll}>
          <TouchableOpacity
            style={[styles.tierChip, selectedTier === 'All' && styles.tierChipActive]}
            onPress={() => setSelectedTier('All')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tierChipText, selectedTier === 'All' && styles.tierChipTextActive]}>
              All Tiers
            </Text>
          </TouchableOpacity>
          {TIERS_SUMMARY.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.tierChip, selectedTier === t.id && styles.tierChipActive]}
              onPress={() => setSelectedTier(t.id)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tierChipText, selectedTier === t.id && { color: t.color, fontWeight: '800' }]}>
                {t.label} ({t.range})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* LEVEL RANGE FILTER (WHEN 'ALL' IS SELECTED) */}
        {selectedTier === 'All' && (
          <View style={styles.rangeTabsRow}>
            {['Lv 1-20', 'Lv 21-40', 'Lv 41-60', 'Lv 61-80', 'Lv 81-100'].map((range) => (
              <TouchableOpacity
                key={range}
                style={[styles.rangeTabBtn, selectedRange === range && styles.rangeTabBtnActive]}
                onPress={() => setSelectedRange(range)}
                activeOpacity={0.8}
              >
                <Text style={[styles.rangeTabText, selectedRange === range && styles.rangeTabTextActive]}>
                  {range}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* 100-LEVEL CARDS LIST */}
        <View style={styles.levelsList}>
          {displayedLevels.map((item) => {
            const isUnlocked = item.level <= currentLevel;
            const isCurrent = item.level === currentLevel;

            return (
              <LinearGradient
                key={item.level}
                colors={item.gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.levelCard,
                  isCurrent && styles.levelCardCurrent,
                ]}
              >
                {/* Left: Level Badge & Status */}
                <View style={styles.levelCardLeft}>
                  <View style={[styles.levelCircle, { borderColor: item.tierColor }]}>
                    <Text style={[styles.levelCircleText, { color: item.tierColor }]}>
                      {item.level}
                    </Text>
                  </View>
                  <View style={styles.levelCardDetails}>
                    <View style={styles.levelCardHeaderRow}>
                      <Text style={styles.levelCardTitle}>{item.title}</Text>
                      {isCurrent && (
                        <View style={styles.currentBadgePill}>
                          <Text style={styles.currentBadgeText}>YOU</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.levelCardExp}>
                      {item.expRequired} EXP Needed  •  +{item.bonusRate} Beans/min
                    </Text>

                    {/* Unlocks Showcase Row */}
                    <View style={styles.unlocksRow}>
                      {item.badge && (
                        <View style={styles.unlockPill}>
                          <Text style={styles.unlockPillText}>🏷️ {item.badge}</Text>
                        </View>
                      )}
                      {item.frame && (
                        <TouchableOpacity onPress={() => setSelectedReward(item.rewards?.find(reward => reward.type === 'frame') || { type: 'frame', name: item.frame })} style={[styles.unlockPill, { backgroundColor: 'rgba(236, 72, 153, 0.2)' }]}>
                          <Text style={[styles.unlockPillText, { color: '#F472B6' }]}>🌸 {item.frame}{item.frameDurationDays !== undefined ? ` · ${item.frameDurationDays === 0 ? 'Permanent' : `${item.frameDurationDays} days`}` : ''}</Text>
                        </TouchableOpacity>
                      )}
                      {item.entry && (
                        <TouchableOpacity onPress={() => setSelectedReward(item.rewards?.find(reward => reward.type === 'entry') || { type: 'entry', name: item.entry })} style={[styles.unlockPill, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
                          <Text style={[styles.unlockPillText, { color: '#FBBF24' }]}>🏎️ {item.entry}{item.entryDurationDays !== undefined ? ` · ${item.entryDurationDays === 0 ? 'Permanent' : `${item.entryDurationDays} days`}` : ''}</Text>
                        </TouchableOpacity>
                      )}
                      {item.uniqueId && (
                        <View style={[styles.unlockPill, { backgroundColor: 'rgba(56, 189, 248, 0.2)' }]}>
                          <Text style={[styles.unlockPillText, { color: '#38BDF8' }]}>👑 {item.uniqueId}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {/* Right: Lock / Unlocked Status Icon */}
                <View style={styles.levelCardRight}>
                  {isUnlocked ? (
                    <View style={styles.unlockedIconCircle}>
                      <IonIcon name="checkmark" size={16} color="#10B981" />
                    </View>
                  ) : (
                    <View style={styles.lockedIconCircle}>
                      <IonIcon name="lock-closed" size={14} color="#64748B" />
                    </View>
                  )}
                </View>
              </LinearGradient>
            );
          })}
        </View>

        {/* DAILY EXP QUESTS / SPEED-UP */}
        <View style={styles.questsContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Daily EXP Tasks</Text>
            <Text style={styles.sectionSub}>Level up faster</Text>
          </View>

          {[
            { id: 'q1', title: 'Daily Check-in', desc: 'Login to YaroApp today', exp: 10, icon: 'calendar' },
            { id: 'q2', title: 'Talk on 1-to-1 Call', desc: 'Complete 3 minutes of voice call', exp: 25, icon: 'call' },
            { id: 'q3', title: 'Voice Room Party', desc: 'Stay in any voice party room for 10 min', exp: 35, icon: 'headset' },
            { id: 'q4', title: 'Send Lucky Gift', desc: 'Send any gift to your favorite host', exp: 50, icon: 'gift' },
          ].map((task) => {
            const isClaimed = claimedTasks.includes(task.id);
            return (
              <View key={task.id} style={styles.taskCard}>
                <View style={styles.taskLeftRow}>
                  <View style={styles.taskIconBox}>
                    <IonIcon name={task.icon} size={20} color="#A78BFA" />
                  </View>
                  <View>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    <Text style={styles.taskDesc}>{task.desc}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.claimBtn, isClaimed && styles.claimBtnDone]}
                  onPress={() => handleClaimTask(task.id, task.exp)}
                  disabled={isClaimed}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.claimBtnText, isClaimed && styles.claimBtnTextDone]}>
                    {isClaimed ? 'Claimed ✓' : `+${task.exp} EXP`}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </ScrollView>
      <Modal visible={Boolean(selectedReward)} transparent animationType="fade" onRequestClose={() => setSelectedReward(null)}>
        <View style={styles.rewardModalOverlay}>
          <View style={styles.rewardModalCard}>
            <TouchableOpacity onPress={() => setSelectedReward(null)} style={styles.rewardModalClose}>
              <IonIcon name="close" size={22} color="#CBD5E1" />
            </TouchableOpacity>
            <View style={styles.rewardModalPreview}>
              {selectedReward?.type === 'frame' && <Image source={getUserAvatar(user)} style={styles.rewardModalAvatar} />}
              {selectedReward?.animationUrl && /\.svga(?:\?|$)/i.test(selectedReward.animationUrl) ? (
                <SvgaPlayer source={selectedReward.animationUrl} style={styles.rewardModalAsset} loops={0} />
              ) : selectedReward?.animationUrl || selectedReward?.imageUrl ? (
                <Image source={{ uri: selectedReward.animationUrl || selectedReward.imageUrl }} style={styles.rewardModalAsset} resizeMode="contain" />
              ) : (
                <MaterialCommunityIcons name={selectedReward?.type === 'frame' ? 'circle-double' : 'car-sports'} size={72} color="#C084FC" />
              )}
            </View>
            <Text style={styles.rewardModalTitle}>{selectedReward?.name}</Text>
            <Text style={styles.rewardModalDuration}>{selectedReward?.durationDays === 0 ? 'Permanent reward' : selectedReward?.durationDays ? `${selectedReward.durationDays} days after unlock` : 'Level reward preview'}</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export { LevelScreen as LegacyLevelScreen };
export { default } from './LevelJourney';

const styles = StyleSheet.create({
  rewardModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  rewardModalCard: {
    width: '100%',
    borderRadius: 22,
    backgroundColor: '#1E1B4B',
    padding: 20,
    alignItems: 'center',
  },
  rewardModalClose: {
    alignSelf: 'flex-end',
  },
  rewardModalPreview: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardModalAvatar: {
    width: 116,
    height: 116,
    borderRadius: 58,
  },
  rewardModalAsset: {
    width: 180,
    height: 180,
    position: 'absolute',
  },
  rewardModalTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  rewardModalDuration: {
    color: '#C4B5FD',
    fontSize: 12,
    marginTop: 5,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#0F0C20',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtnCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  helpBtnCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  // Hero Card
  heroCard: {
    borderRadius: 24,
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(168, 85, 247, 0.4)',
    elevation: 8,
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    marginBottom: 20,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroAvatarWrap: {
    position: 'relative',
    marginRight: 14,
  },
  heroCrownBadge: {
    position: 'absolute',
    top: -8,
    right: -4,
  },
  heroInfoCol: {
    flex: 1,
  },
  heroLevelBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroLevelPill: {
    paddingHorizontal: 9,
    paddingVertical: 2.5,
    borderRadius: 10,
  },
  heroLevelPillText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  heroTierTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E9D5FF',
  },
  heroUserNameText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
  },
  heroBonusText: {
    fontSize: 12,
    color: '#CBD5E1',
    marginTop: 3,
  },
  heroBonusVal: {
    color: '#FDE047',
    fontWeight: '800',
  },

  // Progress Bar
  progressContainer: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    color: '#C084FC',
    fontWeight: '700',
  },
  progressExpValue: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  nextLevelTip: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 6,
    lineHeight: 15,
  },

  // Section Headers
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sectionSub: {
    fontSize: 11.5,
    color: '#94A3B8',
  },

  // Privileges Carousel
  privilegesScroll: {
    marginBottom: 20,
  },
  privilegeCard: {
    width: 150,
    borderRadius: 18,
    padding: 14,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  privilegeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  privilegeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  privilegeDesc: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 15,
  },

  // Tier Chips
  tierChipsScroll: {
    marginBottom: 12,
  },
  tierChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tierChipActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#A855F7',
  },
  tierChipText: {
    fontSize: 12.5,
    color: '#CBD5E1',
    fontWeight: '600',
  },
  tierChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // Range Tabs
  rangeTabsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    padding: 3,
    marginBottom: 14,
  },
  rangeTabBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 11,
  },
  rangeTabBtnActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.8)',
  },
  rangeTabText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  rangeTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Levels List
  levelsList: {
    gap: 10,
    marginBottom: 20,
  },
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  levelCardCurrent: {
    borderColor: '#A855F7',
    borderWidth: 1.5,
  },
  levelCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  levelCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  levelCircleText: {
    fontSize: 14,
    fontWeight: '900',
  },
  levelCardDetails: {
    flex: 1,
  },
  levelCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  levelCardTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  currentBadgePill: {
    backgroundColor: '#EC4899',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  currentBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  levelCardExp: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  unlocksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 5,
  },
  unlockPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  unlockPillText: {
    fontSize: 10,
    color: '#CBD5E1',
    fontWeight: '600',
  },
  levelCardRight: {
    marginLeft: 10,
  },
  unlockedIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Daily Tasks
  questsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    padding: 12,
    marginTop: 10,
  },
  taskLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  taskIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  taskDesc: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  claimBtn: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  claimBtnDone: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  claimBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  claimBtnTextDone: {
    color: '#94A3B8',
  },
});
