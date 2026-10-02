import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
  Image,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';
import { AuthContext } from '../../context/AuthProvider';
import { AlertService } from '../../utils/AlertService';

const { width } = Dimensions.get('window');

const DAILY_TASKS_INITIAL = [
  {
    id: 'dt_1',
    title: 'Daily Check-in',
    desc: 'Log in to YaroApp today and claim your streak bonus',
    reward: '20 Beans',
    type: 'beans',
    progress: 1,
    target: 1,
    status: 'claimable',
    route: null,
  },
  {
    id: 'dt_2',
    title: 'Stay 5 Mins in Voice Room',
    desc: 'Join any active party voice room and listen for 5 mins',
    reward: '50 Beans',
    type: 'beans',
    progress: 3,
    target: 5,
    status: 'in_progress',
    route: 'Party',
  },
  {
    id: 'dt_3',
    title: 'Complete 1 Voice/Video Call',
    desc: 'Call or accept an incoming 1-on-1 call for at least 1 min',
    reward: '100 Beans',
    type: 'beans',
    progress: 0,
    target: 1,
    status: 'in_progress',
    route: 'OneToOne',
  },
  {
    id: 'dt_4',
    title: 'Send a Room Gift',
    desc: 'Send any gift in a voice room or 1-on-1 video call',
    reward: '15 Diamonds',
    type: 'diamonds',
    progress: 0,
    target: 1,
    status: 'in_progress',
    route: 'Party',
  },
  {
    id: 'dt_5',
    title: 'Follow 3 New Creators',
    desc: 'Follow 3 interesting hosts or creators today',
    reward: '30 Beans',
    type: 'beans',
    progress: 2,
    target: 3,
    status: 'in_progress',
    route: 'Home',
  },
];

const GROWTH_TASKS_INITIAL = [
  {
    id: 'gt_1',
    title: 'Profile Complete 100%',
    desc: 'Set avatar, nickname, bio, gender, and age',
    reward: '100 Diamonds',
    type: 'diamonds',
    progress: 1,
    target: 1,
    status: 'completed',
    route: 'EditProfile',
  },
  {
    id: 'gt_2',
    title: 'Reach Host Level 3',
    desc: 'Accumulate call minutes to unlock Bronze Host tier',
    reward: '300 Beans',
    type: 'beans',
    progress: 1,
    target: 3,
    status: 'in_progress',
    route: 'Level',
  },
  {
    id: 'gt_3',
    title: 'KYC Verified Host',
    desc: 'Verify your ID and face verification for instant withdrawals',
    reward: '200 Diamonds',
    type: 'diamonds',
    progress: 0,
    target: 1,
    status: 'in_progress',
    route: 'VerificationHub',
  },
  {
    id: 'gt_4',
    title: 'Invite 3 Friends',
    desc: 'Share your referral code and have 3 friends register',
    reward: '500 Beans',
    type: 'beans',
    progress: 1,
    target: 3,
    status: 'in_progress',
    route: 'InviteEarn',
  },
  {
    id: 'gt_5',
    title: 'Spend 30 Mins on Mic',
    desc: 'Grab a seat in any party room and interact on mic',
    reward: '250 Beans',
    type: 'beans',
    progress: 12,
    target: 30,
    status: 'in_progress',
    route: 'Party',
  },
];

const STREAK_DAYS = [
  { day: 1, reward: '+20', claimed: true },
  { day: 2, reward: '+30', claimed: true },
  { day: 3, reward: '+50', active: true },
  { day: 4, reward: '+50', locked: true },
  { day: 5, reward: '+80', locked: true },
  { day: 6, reward: '+100', locked: true },
  { day: 7, reward: '💎 +20', locked: true, special: true },
];

const TasksScreen = () => {
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 24);
  const navigation = useNavigation();
  const { user, fetchUserProfile } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState('daily');
  const [dailyTasks, setDailyTasks] = useState(DAILY_TASKS_INITIAL);
  const [growthTasks, setGrowthTasks] = useState(GROWTH_TASKS_INITIAL);

  const handleClaim = (taskId, isDaily) => {
    if (isDaily) {
      setDailyTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: 'completed' } : t))
      );
    } else {
      setGrowthTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: 'completed' } : t))
      );
    }
    AlertService.show('Reward Claimed! 🎉', 'Beans / Diamonds have been credited to your wallet.', 'success');
    if (fetchUserProfile) fetchUserProfile();
  };

  const handleAction = (task, isDaily) => {
    if (task.status === 'claimable') {
      handleClaim(task.id, isDaily);
    } else if (task.status === 'in_progress' && task.route) {
      navigation.navigate(task.route);
    }
  };

  const currentList = activeTab === 'daily' ? dailyTasks : growthTasks;

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* Top Header */}
      <View style={[styles.header, { paddingTop: topSafeInset + 8 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Task Center</Text>

        {/* Currency balances in header */}
        <View style={styles.headerCurrencies}>
          <View style={styles.currencyPill}>
            <MaterialCommunityIcons name="diamond-stone" size={14} color="#0284C7" />
            <Text style={styles.currencyText}>{user?.diamonds ?? 0}</Text>
          </View>
          <View style={[styles.currencyPill, styles.beansPill]}>
            <Text style={styles.beansEmoji}>🌰</Text>
            <Text style={[styles.currencyText, { color: '#047857' }]}>{user?.coins ?? 0}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Streak Check-in Hero */}
        <LinearGradient
          colors={['#4F46E5', '#7C3AED', '#9333EA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroTitle}>7-Day Daily Check-in</Text>
              <Text style={styles.heroSub}>Keep your streak alive to earn rare rewards</Text>
            </View>
            <View style={styles.streakBadge}>
              <Icon name="local-fire-department" size={18} color="#F59E0B" />
              <Text style={styles.streakBadgeText}>Day 3</Text>
            </View>
          </View>

          {/* 7 Day Circles Row */}
          <View style={styles.streakRow}>
            {STREAK_DAYS.map((item) => (
              <View key={item.day} style={styles.streakCol}>
                <View
                  style={[
                    styles.streakCircle,
                    item.claimed && styles.streakClaimed,
                    item.active && styles.streakActive,
                    item.locked && styles.streakLocked,
                  ]}
                >
                  {item.claimed ? (
                    <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                  ) : item.special ? (
                    <MaterialCommunityIcons name="diamond-stone" size={16} color="#FBBF24" />
                  ) : (
                    <Text
                      style={[
                        styles.streakRewardText,
                        item.active && { color: '#FFFFFF', fontWeight: 'bold' },
                      ]}
                    >
                      {item.reward}
                    </Text>
                  )}
                </View>
                <Text style={styles.streakDayLabel}>Day {item.day}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* Tab Switcher */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'daily' && styles.tabItemActive]}
            onPress={() => setActiveTab('daily')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabItemText,
                activeTab === 'daily' && styles.tabItemTextActive,
              ]}
            >
              Daily Tasks
            </Text>
            {activeTab === 'daily' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'growth' && styles.tabItemActive]}
            onPress={() => setActiveTab('growth')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabItemText,
                activeTab === 'growth' && styles.tabItemTextActive,
              ]}
            >
              Growth Tasks
            </Text>
            {activeTab === 'growth' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        </View>

        {/* Task Cards List */}
        <View style={styles.tasksList}>
          {currentList.map((task) => {
            const isCompleted = task.status === 'completed';
            const isClaimable = task.status === 'claimable';
            const progressRatio = Math.min(task.progress / task.target, 1);

            return (
              <View key={task.id} style={styles.taskCard}>
                <View style={styles.taskTopRow}>
                  <View style={styles.taskIconCircle}>
                    {task.type === 'diamonds' ? (
                      <MaterialCommunityIcons
                        name="diamond-stone"
                        size={22}
                        color="#0284C7"
                      />
                    ) : (
                      <Text style={{ fontSize: 18 }}>🌰</Text>
                    )}
                  </View>

                  <View style={styles.taskInfo}>
                    <View style={styles.taskTitleRow}>
                      <Text style={styles.taskTitle}>{task.title}</Text>
                      <View
                        style={[
                          styles.rewardTag,
                          task.type === 'diamonds'
                            ? styles.rewardTagDiamond
                            : styles.rewardTagBeans,
                        ]}
                      >
                        <Text
                          style={[
                            styles.rewardTagText,
                            task.type === 'diamonds'
                              ? { color: '#0369A1' }
                              : { color: '#047857' },
                          ]}
                        >
                          +{task.reward}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.taskDesc}>{task.desc}</Text>

                    {/* Progress Bar */}
                    <View style={styles.progressBarWrap}>
                      <View style={styles.progressBg}>
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${progressRatio * 100}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.progressText}>
                        {task.progress}/{task.target}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Bottom Action CTA */}
                <View style={styles.taskActionRow}>
                  <View />
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      isClaimable && styles.actionBtnClaim,
                      isCompleted && styles.actionBtnCompleted,
                    ]}
                    disabled={isCompleted}
                    onPress={() => handleAction(task, activeTab === 'daily')}
                    activeOpacity={0.8}
                  >
                    {isCompleted ? (
                      <View style={styles.actionBtnInnerRow}>
                        <Ionicons name="checkmark-circle" size={15} color="#94A3B8" />
                        <Text style={styles.actionBtnCompletedText}>Completed</Text>
                      </View>
                    ) : isClaimable ? (
                      <Text style={styles.actionBtnClaimText}>Claim</Text>
                    ) : (
                      <View style={styles.actionBtnInnerRow}>
                        <Text style={styles.actionBtnGoText}>Go</Text>
                        <Ionicons name="chevron-forward" size={13} color="#4F46E5" />
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

export default TasksScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerCurrencies: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currencyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    gap: 4,
  },
  beansPill: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  beansEmoji: {
    fontSize: 12,
  },
  currencyText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
  },
  scrollContent: {
    padding: 16,
  },
  heroCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroSub: {
    fontSize: 12,
    color: '#E0E7FF',
    marginTop: 2,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    gap: 2,
  },
  streakBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  streakRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  streakCol: {
    alignItems: 'center',
  },
  streakCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  streakClaimed: {
    backgroundColor: '#10B981',
  },
  streakActive: {
    backgroundColor: '#F59E0B',
    borderWidth: 2,
    borderColor: '#FEF3C7',
  },
  streakLocked: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  streakRewardText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  streakDayLabel: {
    fontSize: 10,
    color: '#E0E7FF',
    fontWeight: '500',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    position: 'relative',
    borderRadius: 10,
  },
  tabItemActive: {
    backgroundColor: '#EEF2FF',
  },
  tabItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  tabItemTextActive: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 2,
    width: 20,
    height: 3,
    backgroundColor: '#4F46E5',
    borderRadius: 2,
  },
  tasksList: {
    gap: 12,
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  taskTopRow: {
    flexDirection: 'row',
    gap: 12,
  },
  taskIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  rewardTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  rewardTagDiamond: {
    backgroundColor: '#E0F2FE',
  },
  rewardTagBeans: {
    backgroundColor: '#DCFCE7',
  },
  rewardTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  taskDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 8,
  },
  progressBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  taskActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnClaim: {
    backgroundColor: '#10B981',
  },
  actionBtnCompleted: {
    backgroundColor: '#F1F5F9',
  },
  actionBtnInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtnClaimText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionBtnGoText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4F46E5',
  },
  actionBtnCompletedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
});
