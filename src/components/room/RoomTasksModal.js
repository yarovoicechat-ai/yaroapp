import React, { useState, useEffect, useRef, useContext, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
  ActivityIndicator,
  Animated,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';
import { apiUtil } from '../../utils/apiUtil';
import { AlertService } from '../../utils/AlertService';
import { AuthContext } from '../../context/AuthProvider';

const { width } = Dimensions.get('window');

const CATEGORIES = ['All', 'Gifts', 'Followers', 'Visitors', 'Host'];

// Fallback initial task definitions (13 tasks matching the reference video)
const DEFAULT_TASKS = [
  // Gifts
  {
    id: 'task_gift_1',
    category: 'Gifts',
    title: 'Send a gift',
    description: 'Send at least one gift in your room today',
    target: 1,
    unit: 'count',
    progress: 0,
    reward: 2500,
    status: 'in_progress',
    iconType: 'gift',
  },
  {
    id: 'task_gift_10',
    category: 'Gifts',
    title: 'Send 10 gifts',
    description: 'Send gifts 10 times in your room today',
    target: 10,
    unit: 'count',
    progress: 0,
    reward: 7500,
    status: 'in_progress',
    iconType: 'gift-box',
  },
  {
    id: 'task_gift_new_3',
    category: 'Gifts',
    title: 'Gift 3 new users',
    description: 'Send gifts to 3 different new users in your room (joined in the last 7 days)',
    target: 3,
    unit: 'count',
    progress: 0,
    reward: 6000,
    status: 'in_progress',
    iconType: 'sparkles',
  },
  {
    id: 'task_gift_users_5',
    category: 'Gifts',
    title: '5 users send gifts',
    description: '5 different users (not new accounts) send gifts in your room today',
    target: 5,
    unit: 'count',
    progress: 0,
    reward: 9000,
    status: 'in_progress',
    iconType: 'sparkles',
  },
  {
    id: 'task_gift_new_send_3',
    category: 'Gifts',
    title: '3 new users send gifts',
    description: '3 different new users send gifts in your room today',
    target: 3,
    unit: 'count',
    progress: 0,
    reward: 2500,
    status: 'in_progress',
    iconType: 'sparkles',
  },

  // Followers
  {
    id: 'task_follow_1',
    category: 'Followers',
    title: 'Get 1 new follower',
    description: 'Gain 1 new follower today',
    target: 1,
    unit: 'count',
    progress: 0,
    reward: 1000,
    status: 'in_progress',
    iconType: 'users',
  },
  {
    id: 'task_follow_10',
    category: 'Followers',
    title: 'Get 10 new followers',
    description: 'Gain 10 new followers today',
    target: 10,
    unit: 'count',
    progress: 0,
    reward: 10000,
    status: 'in_progress',
    iconType: 'users',
  },
  {
    id: 'task_follow_new_3',
    category: 'Followers',
    title: '3 new users follow you',
    description: '3 different new users follow you today',
    target: 3,
    unit: 'count',
    progress: 0,
    reward: 4000,
    status: 'in_progress',
    iconType: 'sparkles',
  },

  // Visitors
  {
    id: 'task_visitors_10',
    category: 'Visitors',
    title: '10 unique visitors',
    description: '10 different users enter your room today',
    target: 10,
    unit: 'count',
    progress: 0,
    reward: 5000,
    status: 'in_progress',
    iconType: 'eyes',
  },
  {
    id: 'task_visitors_new_3',
    category: 'Visitors',
    title: '3 new visitors',
    description: '3 different new users enter your room today',
    target: 3,
    unit: 'count',
    progress: 0,
    reward: 3000,
    status: 'in_progress',
    iconType: 'sparkles',
  },

  // Host
  {
    id: 'task_mic_10',
    category: 'Host',
    title: 'On mic for 10 minutes',
    description: 'Stay on the mic in your room for 10 minutes today',
    target: 10,
    unit: 'minutes',
    progress: 0,
    reward: 2500,
    status: 'in_progress',
    iconType: 'mic',
  },
  {
    id: 'task_mic_30',
    category: 'Host',
    title: 'On mic for 30 minutes',
    description: 'Stay on the mic in your room for 30 minutes today',
    target: 30,
    unit: 'minutes',
    progress: 0,
    reward: 8000,
    status: 'in_progress',
    iconType: 'mic',
  },
  {
    id: 'task_mic_120',
    category: 'Host',
    title: 'On mic for 120 minutes',
    description: 'Stay on the mic in your room for 120 minutes today',
    target: 120,
    unit: 'minutes',
    progress: 0,
    reward: 18000,
    status: 'in_progress',
    iconType: 'mic',
  },
];

export default function RoomTasksModal({ visible, onClose, roomId }) {
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 24);
  const { fetchUserProfile } = useContext(AuthContext) || {};

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [tasks, setTasks] = useState(DEFAULT_TASKS);
  const [summary, setSummary] = useState({ total: 13, done: 0, claimable: 0, claimed: 0 });
  const [remainingSeconds, setRemainingSeconds] = useState(55539);
  const [loading, setLoading] = useState(false);
  const [claimingTaskId, setClaimingTaskId] = useState(null);

  const timerRef = useRef(null);

  // Format seconds into "15h 25m 39s"
  const formattedCountdown = useMemo(() => {
    const hours = Math.floor(remainingSeconds / 3600);
    const mins = Math.floor((remainingSeconds % 3600) / 60);
    const secs = remainingSeconds % 60;
    return `${hours}h ${mins}m ${secs}s`;
  }, [remainingSeconds]);

  // Fetch tasks when modal becomes visible
  useEffect(() => {
    if (!visible) return;

    fetchTasks();

    // Start 1-second countdown interval
    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => (prev > 0 ? prev - 1 : 86400));
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visible, roomId]);

  const fetchTasks = async () => {
    if (!roomId) return;
    setLoading(true);
    try {
      const res = await apiUtil.get(`/voice-club/rooms/${roomId}/tasks`);
      if (res.data?.success && res.data?.data) {
        const { tasks: remoteTasks, summary: remoteSummary, resetsInSeconds } = res.data.data;
        if (remoteTasks && remoteTasks.length > 0) {
          setTasks(remoteTasks);
        }
        if (remoteSummary) {
          setSummary(remoteSummary);
        }
        if (typeof resetsInSeconds === 'number') {
          setRemainingSeconds(resetsInSeconds);
        }
      }
    } catch (err) {
      console.warn('[RoomTasksModal] Fetch tasks notice:', err?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimReward = async (task) => {
    if (!roomId || !task?.id || task.status !== 'claimable') return;
    setClaimingTaskId(task.id);
    try {
      const res = await apiUtil.post(`/voice-club/rooms/${roomId}/tasks/${task.id}/claim`);
      if (res.data?.success) {
        AlertService.show('Reward Claimed! 🎉', `+${task.reward} coins added to your wallet!`, 'success');
        // Update local task state
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, status: 'claimed' } : t))
        );
        // Update summary counters
        setSummary((prev) => ({
          ...prev,
          claimable: Math.max(0, prev.claimable - 1),
          claimed: prev.claimed + 1,
        }));
        if (fetchUserProfile) fetchUserProfile();
      } else {
        AlertService.show('Notice', res.data?.message || 'Could not claim reward', 'info');
      }
    } catch (err) {
      AlertService.show('Notice', err?.response?.data?.message || err?.message || 'Failed to claim reward', 'info');
    } finally {
      setClaimingTaskId(null);
    }
  };

  const filteredTasks = useMemo(() => {
    if (selectedCategory === 'All') return tasks;
    return tasks.filter((t) => t.category === selectedCategory);
  }, [tasks, selectedCategory]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#E0E7FF" translucent />

        {/* Dreamy Sky Header Background */}
        <LinearGradient
          colors={['#C7D2FE', '#E0E7FF', '#F5F3FF', '#FFFFFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.headerHero, { paddingTop: topSafeInset + 8 }]}
        >
          {/* Top Bar: Back Button + Title */}
          <View style={styles.topNavRow}>
            <TouchableOpacity
              style={styles.backCircleBtn}
              onPress={onClose}
              activeOpacity={0.8}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="chevron-back" size={22} color="#1E1B4B" />
            </TouchableOpacity>

            <View style={styles.headerTitleWrap}>
              <Text style={styles.headerTitleText}>Room Tasks</Text>
              <View style={styles.headerSubRow}>
                <Text style={styles.headerSubText}>Complete daily goals and earn coins</Text>
              </View>
            </View>

            {/* Balancing placeholder */}
            <View style={{ width: 40 }} />
          </View>

          {/* Countdown Pill Badge */}
          <View style={styles.countdownBadge}>
            <Icon name="time-outline" size={15} color="#3B82F6" style={{ marginRight: 6 }} />
            <Text style={styles.countdownText}>Resets in {formattedCountdown}</Text>
          </View>

          {/* Stats Summary Bar (13 Total | 0 Done | 0 Claimable | 0 Claimed) */}
          <View style={styles.statsSummaryCard}>
            <View style={styles.statCol}>
              <Text style={styles.statNumDark}>{summary.total || 13}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statCol}>
              <Text style={styles.statNumGreen}>{summary.done || 0}</Text>
              <Text style={styles.statLabel}>Done</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statCol}>
              <Text style={styles.statNumAmber}>{summary.claimable || 0}</Text>
              <Text style={styles.statLabel}>Claimable</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statCol}>
              <Text style={styles.statNumSlate}>{summary.claimed || 0}</Text>
              <Text style={styles.statLabel}>Claimed</Text>
            </View>
          </View>

          {/* Category Pill Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryPillsContainer}
          >
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.categoryPillText, isSelected && styles.categoryPillTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </LinearGradient>

        {/* Task Cards List */}
        <ScrollView
          style={styles.cardsScrollView}
          contentContainerStyle={[styles.cardsScrollContent, { paddingBottom: bottomPadding + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          {loading && tasks.length === 0 ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#6366F1" />
              <Text style={styles.loadingText}>Loading room tasks...</Text>
            </View>
          ) : (
            filteredTasks.map((task) => {
              const isClaimed = task.status === 'claimed';
              const isClaimable = task.status === 'claimable' || (!isClaimed && task.progress >= task.target);
              const progressRatio = Math.min(1, (task.progress || 0) / (task.target || 1));
              const percent = Math.floor(progressRatio * 100);

              return (
                <View key={task.id} style={styles.taskCard}>
                  {/* Left Icon Container */}
                  <View style={styles.taskIconBox}>
                    {task.iconType === 'gift' || task.category === 'Gifts' ? (
                      <View style={styles.giftIconBg}>
                        <Text style={{ fontSize: 26 }}>🎁</Text>
                      </View>
                    ) : task.category === 'Followers' ? (
                      <View style={styles.followersIconBg}>
                        <MaterialCommunityIcons name="account-group" size={26} color="#3B82F6" />
                      </View>
                    ) : task.category === 'Visitors' ? (
                      <View style={styles.visitorsIconBg}>
                        <MaterialCommunityIcons name="eye-outline" size={26} color="#6366F1" />
                      </View>
                    ) : (
                      <View style={styles.hostIconBg}>
                        <MaterialCommunityIcons name="microphone-variant" size={26} color="#8B5CF6" />
                      </View>
                    )}
                  </View>

                  {/* Middle: Title, Desc, Progress */}
                  <View style={styles.taskContentBox}>
                    <Text style={styles.taskTitleText}>{task.title}</Text>
                    <Text style={styles.taskDescText}>{task.description}</Text>

                    {/* Progress Bar & Counter */}
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBarTrack}>
                        <LinearGradient
                          colors={['#818CF8', '#6366F1']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={[styles.progressBarFill, { width: `${percent}%` }]}
                        />
                      </View>
                      <View style={styles.progressValuesRow}>
                        <Text style={styles.progressLeftText}>
                          {task.progress}/{task.target}
                          {task.unit === 'minutes' ? ' minutes' : ''}
                        </Text>
                        <Text style={styles.progressRightText}>{percent}%</Text>
                      </View>
                    </View>
                  </View>

                  {/* Right: Reward Badge & Status Action */}
                  <View style={styles.taskRightBox}>
                    {/* Reward badge: 😊🪙 + 2500 */}
                    <View style={styles.rewardBadge}>
                      <Text style={styles.rewardCoinEmoji}>🪙</Text>
                      <Text style={styles.rewardAmountText}>+{task.reward}</Text>
                    </View>

                    {/* Status Action: Keep going! / Claim / Claimed */}
                    {isClaimed ? (
                      <View style={styles.claimedBadge}>
                        <Icon name="checkmark-circle" size={16} color="#10B981" />
                        <Text style={styles.claimedText}>Claimed</Text>
                      </View>
                    ) : isClaimable ? (
                      <TouchableOpacity
                        style={styles.claimBtn}
                        onPress={() => handleClaimReward(task)}
                        disabled={claimingTaskId === task.id}
                        activeOpacity={0.85}
                      >
                        <LinearGradient
                          colors={['#F59E0B', '#D97706']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.claimBtnGradient}
                        >
                          {claimingTaskId === task.id ? (
                            <ActivityIndicator size="small" color="#FFF" />
                          ) : (
                            <Text style={styles.claimBtnText}>Claim</Text>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.keepGoingText}>Keep going!</Text>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerHero: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E1B4B',
    letterSpacing: 0.3,
  },
  headerSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  headerSubText: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '600',
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  countdownText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E40AF',
  },
  statsSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#F1F5F9',
  },
  statNumDark: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  statNumGreen: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10B981',
  },
  statNumAmber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F59E0B',
  },
  statNumSlate: {
    fontSize: 18,
    fontWeight: '800',
    color: '#64748B',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2,
  },
  categoryPillsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
  },
  categoryPill: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryPillActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
  },
  cardsScrollView: {
    flex: 1,
  },
  cardsScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  loadingBox: {
    paddingVertical: 50,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  taskCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  taskIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  giftIconBg: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  followersIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  visitorsIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskContentBox: {
    flex: 1,
    marginRight: 10,
  },
  taskTitleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  taskDescText: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
    marginBottom: 8,
  },
  progressContainer: {
    width: '100%',
  },
  progressBarTrack: {
    width: '100%',
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#EDE9FE',
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  progressValuesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLeftText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  progressRightText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6366F1',
  },
  taskRightBox: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minWidth: 80,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE047',
    gap: 4,
  },
  rewardCoinEmoji: {
    fontSize: 12,
  },
  rewardAmountText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B45309',
  },
  keepGoingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 8,
  },
  claimBtn: {
    marginTop: 8,
    borderRadius: 14,
    overflow: 'hidden',
  },
  claimBtnGradient: {
    paddingHorizontal: 16,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  claimedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  claimedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
});
