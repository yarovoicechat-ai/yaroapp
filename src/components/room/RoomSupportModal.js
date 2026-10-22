import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
  Switch,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getStackScreenBottomPadding } from '../../utils/safeAreaUtils';
import { apiUtil } from '../../utils/apiUtil';
import { AlertService } from '../../utils/AlertService';

const { width } = Dimensions.get('window');

// 22 Levels of Target & Reward from the reference video
const SUPPORT_LEVELS = [
  { level: 1, roomCoins: '3M', roomVisitors: '≥ 20', ownerCoins: '450K' },
  { level: 2, roomCoins: '6M', roomVisitors: '≥ 50', ownerCoins: '900K' },
  { level: 3, roomCoins: '12M', roomVisitors: '≥ 75', ownerCoins: '1.80M' },
  { level: 4, roomCoins: '20M', roomVisitors: '≥ 100', ownerCoins: '3M' },
  { level: 5, roomCoins: '27M', roomVisitors: '≥ 130', ownerCoins: '4.05M' },
  { level: 6, roomCoins: '36M', roomVisitors: '≥ 170', ownerCoins: '5.40M' },
  { level: 7, roomCoins: '45M', roomVisitors: '≥ 210', ownerCoins: '6.75M' },
  { level: 8, roomCoins: '60M', roomVisitors: '≥ 260', ownerCoins: '9M' },
  { level: 9, roomCoins: '90M', roomVisitors: '≥ 320', ownerCoins: '13.50M' },
  { level: 10, roomCoins: '120M', roomVisitors: '≥ 380', ownerCoins: '18M' },
  { level: 11, roomCoins: '180M', roomVisitors: '≥ 450', ownerCoins: '30.60M' },
  { level: 12, roomCoins: '240M', roomVisitors: '≥ 500', ownerCoins: '40.80M' },
  { level: 13, roomCoins: '360M', roomVisitors: '≥ 600', ownerCoins: '72M' },
  { level: 14, roomCoins: '480M', roomVisitors: '≥ 800', ownerCoins: '96M' },
  { level: 15, roomCoins: '780M', roomVisitors: '≥ 1000', ownerCoins: '156M' },
  { level: 16, roomCoins: '1.14B', roomVisitors: '≥ 1250', ownerCoins: '228M' },
  { level: 17, roomCoins: '2B', roomVisitors: '≥ 2000', ownerCoins: '400M' },
  { level: 18, roomCoins: '3B', roomVisitors: '≥ 2000', ownerCoins: '600M' },
  { level: 19, roomCoins: '4B', roomVisitors: '≥ 2500', ownerCoins: '800M' },
  { level: 20, roomCoins: '5B', roomVisitors: '≥ 2500', ownerCoins: '1B' },
  { level: 21, roomCoins: '6.50B', roomVisitors: '≥ 3000', ownerCoins: '1.30B' },
  { level: 22, roomCoins: '9B', roomVisitors: '≥ 3000', ownerCoins: '1.80B' },
];

const RULES_LIST = [
  '1. Weekly Room Visitors and Weekly Room Coins are counted from Monday 00:00 to Sunday 23:59 (UTC + 5:30)',
  '2. Reaching the Room Level requires meeting both the Target for the recorded Room Coins and Room Visitors.',
  '3. Each user can only receive 1 reward per week.',
  '4. Room Support rewards will be sent out every Wednesday. If the user qualifies for the reward in the current week, the reward will be sent out on Wednesday of the following week.',
  "5. This has nothing to do with Apple or Google Play's policies, and is solely based on Yaro's internal Room Support program.",
];

export default function RoomSupportModal({ visible, onClose, roomId, canManageAutoSend = false }) {
  const insets = useSafeAreaInsets() || { top: 0, bottom: 0, left: 0, right: 0 };
  const bottomPadding = getStackScreenBottomPadding(insets?.bottom || 0, 20);

  const [supportData, setSupportData] = useState({
    thisWeek: { bonusCoins: 0, roomVisitors: 0, roomCoins: 0 },
    lastWeek: { bonusCoins: 0, roomVisitors: 0, roomCoins: 0 },
  });
  const [rewardSendSeconds, setRewardSendSeconds] = useState(0);
  const [weekCountdownSeconds, setWeekCountdownSeconds] = useState(0);
  const [autoSend, setAutoSend] = useState(true);
  const [loading, setLoading] = useState(false);
  const [updatingAutoSend, setUpdatingAutoSend] = useState(false);
  const [supportError, setSupportError] = useState('');

  const timerRef = useRef(null);

  // Format seconds to "3Day 15:25:21"
  const formatCountdown = (totalSec) => {
    if (totalSec <= 0) return '0Day 00:00:00';
    const days = Math.floor(totalSec / 86400);
    const rem = totalSec % 86400;
    const hours = String(Math.floor(rem / 3600)).padStart(2, '0');
    const mins = String(Math.floor((rem % 3600) / 60)).padStart(2, '0');
    const secs = String(rem % 60).padStart(2, '0');
    return `${days}Day ${hours}:${mins}:${secs}`;
  };

  const fetchSupportStats = useCallback(async () => {
    if (!roomId) return;
    setLoading(true);
    setSupportError('');
    try {
      const res = await apiUtil.get(`/voice-club/rooms/${roomId}/support`);
      if (!res.data?.success || !res.data?.data) {
        throw new Error(res.data?.message || 'Room Support information could not be loaded.');
      }
      if (res.data?.success && res.data?.data) {
        const { myRoom, rewardSendTimeSeconds, thisWeekCountdownSeconds, autoSendRewards } = res.data.data;
        if (myRoom) {
          setSupportData(myRoom);
        }
        if (typeof rewardSendTimeSeconds === 'number') {
          setRewardSendSeconds(rewardSendTimeSeconds);
        }
        if (typeof thisWeekCountdownSeconds === 'number') {
          setWeekCountdownSeconds(thisWeekCountdownSeconds);
        }
        if (typeof autoSendRewards === 'boolean') {
          setAutoSend(autoSendRewards);
        }
      }
    } catch (err) {
      console.warn('[RoomSupportModal] Fetch support stats notice:', err?.message);
      setSupportError(err.response?.data?.message || err.message || 'Room Support information could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    if (!visible) return;

    fetchSupportStats();

    timerRef.current = setInterval(() => {
      setRewardSendSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      setWeekCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visible, fetchSupportStats]);

  const handleToggleAutoSend = async (val) => {
    const previousValue = autoSend;
    setAutoSend(val);
    setUpdatingAutoSend(true);
    try {
      const response = await apiUtil.post(`/voice-club/rooms/${roomId}/support/toggle-auto-send`, { autoSend: val });
      if (!response.data?.success) throw new Error(response.data?.message || 'Could not update reward sending.');
    } catch (err) {
      console.warn('[RoomSupportModal] Toggle auto-send warning:', err?.message);
      setAutoSend(previousValue);
      AlertService.show('Room Support', err.response?.data?.message || err.message || 'Could not update reward sending.', 'warning');
    } finally {
      setUpdatingAutoSend(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        {/* Dismiss Touch Area */}
        <TouchableOpacity
          style={styles.backdropDismissArea}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Bottom Sheet Container */}
        <View style={[styles.sheetContainer, { paddingBottom: bottomPadding }]}>
          {/* Top Handle Grabber */}
          <View style={styles.sheetHandle} />

          {/* Header 3D Artwork + Title */}
          <View style={styles.heroArtworkSection}>
            <View style={styles.heroGraphicRow}>
              <Text style={{ fontSize: 44 }}>🎁</Text>
              <Text style={{ fontSize: 32, marginLeft: -10 }}>🎤</Text>
              <Text style={{ fontSize: 28, marginLeft: -8 }}>💎</Text>
            </View>
            <Text style={styles.heroTitleText}>Room Support</Text>
          </View>

          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={styles.sheetScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* SECTION 1: MY ROOM */}
            <View style={styles.sectionCard}>
              {/* Header Banner: My Room */}
              <LinearGradient
                colors={['#F97316', '#EA580C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.sectionHeaderBanner, { flexDirection: 'row', justifyContent: 'space-between' }]}
              >
                <Text style={styles.sectionHeaderText}>My Room</Text>
                <TouchableOpacity
                  style={styles.refreshButton}
                  onPress={fetchSupportStats}
                  disabled={loading}
                  accessibilityLabel="Refresh Room Support"
                >
                  {loading ? <ActivityIndicator size="small" color="#FFF" /> : <MaterialCommunityIcons name="refresh" size={18} color="#FFF" />}
                </TouchableOpacity>
              </LinearGradient>

              {supportError ? (
                <View style={styles.supportErrorBox} accessibilityRole="alert">
                  <Text style={styles.supportErrorText}>{supportError}</Text>
                  <TouchableOpacity onPress={fetchSupportStats} disabled={loading} accessibilityRole="button">
                    <Text style={styles.supportRetryText}>{loading ? 'Retrying…' : 'Retry'}</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {/* Table: Bonus Coins | Room Visitors | Room Coins */}
              <View style={styles.myRoomTable}>
                {/* Table Header */}
                <View style={styles.tableHeaderRow}>
                  <View style={styles.myRoomColLabel} />
                  <Text style={styles.myRoomColHeader}>Bonus Coins</Text>
                  <Text style={styles.myRoomColHeader}>Room Visitors</Text>
                  <Text style={styles.myRoomColHeader}>Room Coins</Text>
                </View>

                {/* Row 1: This week */}
                <View style={styles.tableDataRow}>
                  <Text style={styles.rowLabelText}>This week</Text>
                  <Text style={styles.cellValueText}>{supportData.thisWeek?.bonusCoins ?? 0}</Text>
                  <Text style={styles.cellValueText}>{supportData.thisWeek?.roomVisitors ?? 0}</Text>
                  <Text style={styles.cellValueText}>{supportData.thisWeek?.roomCoins ?? 0}</Text>
                </View>

                {/* Row 2: Last week */}
                <View style={styles.tableDataRow}>
                  <Text style={styles.rowLabelText}>Last week</Text>
                  <Text style={styles.cellValueText}>{supportData.lastWeek?.bonusCoins ?? 0}</Text>
                  <Text style={styles.cellValueText}>{supportData.lastWeek?.roomVisitors ?? 0}</Text>
                  <Text style={styles.cellValueText}>{supportData.lastWeek?.roomCoins ?? 0}</Text>
                </View>
              </View>

              {/* Reward Send Time + Auto Send Switch */}
              <View style={styles.rewardSendTimeRow}>
                <View style={styles.rewardSendTimeLeft}>
                  <Text style={{ fontSize: 16, marginRight: 6 }}>🎁</Text>
                  <Text style={styles.rewardSendTimeText}>
                    Reward send time: <Text style={styles.rewardSendTimeHighlight}>{formatCountdown(rewardSendSeconds)}</Text>
                  </Text>
                </View>
                {canManageAutoSend ? (
                  <Switch
                    value={autoSend}
                    onValueChange={handleToggleAutoSend}
                    disabled={updatingAutoSend}
                    trackColor={{ false: '#475569', true: '#F59E0B' }}
                    thumbColor={autoSend ? '#FFF' : '#94A3B8'}
                  />
                ) : null}
              </View>
            </View>

            {/* SECTION 2: TARGET & REWARD */}
            <View style={[styles.sectionCard, { marginTop: 16 }]}>
              {/* Header Banner: Target & Reward */}
              <LinearGradient
                colors={['#F97316', '#EA580C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.sectionHeaderBanner}
              >
                <Text style={styles.sectionHeaderText}>Target & Reward</Text>
              </LinearGradient>

              {/* 22 Level Table */}
              <View style={styles.levelTable}>
                {/* Level Table Header */}
                <View style={styles.levelTableHeaderRow}>
                  <Text style={[styles.levelHeaderCell, { width: 50, textAlign: 'center' }]}>Level</Text>
                  <View style={styles.levelHeaderGroupCol}>
                    <Text style={styles.levelHeaderGroupTitle}>Target</Text>
                    <View style={styles.levelHeaderSubRow}>
                      <Text style={[styles.levelHeaderSubCell, { flex: 1.2 }]}>Room Coins</Text>
                      <Text style={[styles.levelHeaderSubCell, { flex: 1 }]}>Room Visitor</Text>
                    </View>
                  </View>
                  <View style={[styles.levelHeaderGroupCol, { width: 90 }]}>
                    <Text style={styles.levelHeaderGroupTitle}>Reward</Text>
                    <Text style={styles.levelHeaderSubCell}>Owner Coins</Text>
                  </View>
                </View>

                {/* Level Rows 1 to 22 */}
                {SUPPORT_LEVELS.map((item, idx) => {
                  const isEven = idx % 2 === 0;
                  return (
                    <View
                      key={item.level}
                      style={[
                        styles.levelDataRow,
                        isEven ? styles.levelDataRowEven : styles.levelDataRowOdd,
                      ]}
                    >
                      <Text style={[styles.levelNumText, { width: 50, textAlign: 'center' }]}>{item.level}</Text>
                      <Text style={[styles.levelTargetText, { flex: 1.2 }]}>{item.roomCoins}</Text>
                      <Text style={[styles.levelVisitorText, { flex: 1 }]}>{item.roomVisitors}</Text>
                      <Text style={[styles.levelRewardText, { width: 90, textAlign: 'center' }]}>{item.ownerCoins}</Text>
                    </View>
                  );
                })}
              </View>

              {/* Countdown banner at bottom of table */}
              <View style={styles.weekCountdownRow}>
                <Text style={{ fontSize: 14, marginRight: 6 }}>⏱</Text>
                <Text style={styles.weekCountdownText}>
                  This week countdown: <Text style={styles.weekCountdownHighlight}>{formatCountdown(weekCountdownSeconds)}</Text>
                </Text>
              </View>
            </View>

            {/* SECTION 3: RULES */}
            <View style={[styles.sectionCard, { marginTop: 16 }]}>
              {/* Header Banner: Rules */}
              <LinearGradient
                colors={['#F97316', '#EA580C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.sectionHeaderBanner}
              >
                <Text style={styles.sectionHeaderText}>Rules</Text>
              </LinearGradient>

              {/* Rules List */}
              <View style={styles.rulesContent}>
                {RULES_LIST.map((rule, idx) => (
                  <Text key={idx} style={styles.ruleText}>
                    {rule}
                  </Text>
                ))}
              </View>
            </View>

            {/* Bottom Close Button */}
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#8B5CF6', '#6D28D9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.closeBtnGradient}
              >
                <Text style={styles.closeBtnText}>Close</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  backdropDismissArea: {
    flex: 1,
    width: '100%',
  },
  sheetContainer: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#130B26',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    elevation: 25,
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  heroArtworkSection: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  heroGraphicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  heroTitleText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(147, 51, 234, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  sheetScroll: {
    flexGrow: 1,
  },
  sheetScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  sectionCard: {
    backgroundColor: '#1E1438',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.3)',
    overflow: 'hidden',
  },
  sectionHeaderBanner: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  refreshButton: {
    minWidth: 28,
    minHeight: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportErrorBox: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFF7ED',
    borderBottomWidth: 1,
    borderBottomColor: '#FED7AA',
  },
  supportErrorText: {
    color: '#9A3412',
    fontSize: 12,
  },
  supportRetryText: {
    color: '#C2410C',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
  },
  myRoomTable: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  myRoomColLabel: {
    width: 80,
  },
  myRoomColHeader: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#CBD5E1',
    textAlign: 'center',
  },
  tableDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  rowLabelText: {
    width: 80,
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  cellValueText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: '#FBBF24',
    textAlign: 'center',
  },
  rewardSendTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#170E2E',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  rewardSendTimeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rewardSendTimeText: {
    fontSize: 12,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  rewardSendTimeHighlight: {
    color: '#F59E0B',
    fontWeight: '800',
  },
  levelTable: {
    paddingVertical: 4,
  },
  levelTableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#241845',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  levelHeaderCell: {
    fontSize: 12,
    fontWeight: '800',
    color: '#CBD5E1',
  },
  levelHeaderGroupCol: {
    flex: 2.2,
    alignItems: 'center',
  },
  levelHeaderGroupTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#CBD5E1',
    marginBottom: 2,
  },
  levelHeaderSubRow: {
    flexDirection: 'row',
    width: '100%',
  },
  levelHeaderSubCell: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    textAlign: 'center',
  },
  levelDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  levelDataRowEven: {
    backgroundColor: '#1E1438',
  },
  levelDataRowOdd: {
    backgroundColor: '#190F30',
  },
  levelNumText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#E2E8F0',
  },
  levelTargetText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'center',
  },
  levelVisitorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    textAlign: 'center',
  },
  levelRewardText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FBBF24',
  },
  weekCountdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#170E2E',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  weekCountdownText: {
    fontSize: 12,
    color: '#CBD5E1',
    fontWeight: '600',
  },
  weekCountdownHighlight: {
    color: '#F59E0B',
    fontWeight: '800',
  },
  rulesContent: {
    padding: 14,
    gap: 8,
  },
  ruleText: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 18,
  },
  closeBtn: {
    marginTop: 20,
    borderRadius: 24,
    overflow: 'hidden',
  },
  closeBtnGradient: {
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
