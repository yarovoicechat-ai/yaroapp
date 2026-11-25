import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
  Platform,
  Switch,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { apiUtil } from '../../utils/apiUtil';
import { getSocket } from '../../sockets';
import { normalizePKRoomId, roomPKView } from '../../utils/roomPkState';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const DURATION_CHOICES = [
  { label: '1m', sec: 60 },
  { label: '3m', sec: 180 },
  { label: '5m', sec: 300 },
  { label: '10m', sec: 600 },
  { label: '30m', sec: 1800 },
];

export default function CrossRoomPKModal({
  visible,
  onClose,
  roomId,
  roomName = 'Our Room',
  roomCover = '',
  isOwner = false,
  currentUser = null,
  onChatMessage,
}) {
  const [match, setMatch] = useState(null);
  const [matching, setMatching] = useState(false);
  const [lootingMode, setLootingMode] = useState(true);
  const [oppositeVoice, setOppositeVoice] = useState(false);
  const [showInviteSheet, setShowInviteSheet] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showSettingsSheet, setShowSettingsSheet] = useState(false);

  // Invite form state
  const [targetRoomId, setTargetRoomId] = useState('');
  const [selectedDurationSec, setSelectedDurationSec] = useState(600); // 10m default
  const [opponents, setOpponents] = useState([]);
  const [records, setRecords] = useState([]);
  const [selectedRecordIndex, setSelectedRecordIndex] = useState(0);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());
  const [secondsLeft, setSecondsLeft] = useState(600);

  const base = `/voice-club/rooms/${encodeURIComponent(roomId || '')}/pk`;

  // Fetch current PK state
  const syncState = useCallback(async () => {
    if (!roomId) return;
    try {
      const res = await apiUtil.get(base);
      if (res?.data?.data) {
        const pkData = res.data.data;
        if (pkData.pkType === 'room') {
          setMatch(pkData);
          if (pkData.status === 'active' || pkData.status === 'invited') {
            setMatching(false);
          }
        } else {
          setMatch(null);
        }
      }
    } catch {
      // Ignore background sync errors
    }
  }, [roomId, base]);

  useEffect(() => {
    syncState();
    const interval = setInterval(() => {
      syncState();
      setNow(Date.now());
    }, 4000);

    const sock = getSocket();
    const handleState = (payload) => {
      if (payload && payload.pkType === 'room') {
        setMatch(payload);
        if (payload.status === 'active' || payload.status === 'invited') {
          setMatching(false);
        }
      }
    };
    if (sock) sock.on('room_pk:state', handleState);

    return () => {
      clearInterval(interval);
      if (sock) sock.off('room_pk:state', handleState);
    };
  }, [syncState]);

  // Live countdown
  useEffect(() => {
    if (match && match.status === 'active' && match.endsAt) {
      const update = () => {
        const remaining = Math.max(0, Math.floor((new Date(match.endsAt).getTime() - Date.now()) / 1000));
        setSecondsLeft(remaining);
      };
      update();
      const t = setInterval(update, 1000);
      return () => clearInterval(t);
    }
  }, [match]);

  // Fetch opponents when invite sheet opens
  useEffect(() => {
    if (showInviteSheet) {
      apiUtil.get(`${base}/opponents`).then((res) => {
        const list = res?.data?.data || [];
        setOpponents(Array.isArray(list) ? list : []);
      }).catch(() => {});
    }
  }, [showInviteSheet, base]);

  // Fetch history when record modal opens
  useEffect(() => {
    if (showRecordModal) {
      apiUtil.get(`${base}/history`).then((res) => {
        const list = res?.data?.data || [];
        setRecords(Array.isArray(list) ? list : []);
      }).catch(() => {});
    }
  }, [showRecordModal, base]);

  // API Call helper
  const executeApi = async (endpoint, payload) => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const res = await apiUtil.post(`${base}${endpoint}`, payload);
      if (res?.data?.data) {
        setMatch(res.data.data);
      }
      return res?.data?.data;
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Room PK failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  // Match PK Handler (Auto-Match from video)
  const handleMatchPK = async () => {
    setMatching(true);
    setError('');
    try {
      const res = await apiUtil.post(`${base}/match`);
      if (res?.data?.data) {
        if (res.data.data.status === 'active' || res.data.data.status === 'invited') {
          setMatch(res.data.data);
          setMatching(false);
        }
      }
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Matching failed');
      setMatching(false);
    }
  };

  // Cancel Match
  const handleCancelMatch = async () => {
    setMatching(false);
    try {
      await apiUtil.post(`${base}/match/cancel`);
    } catch {}
  };

  // Invite PK Handler
  const handleSendInvite = async (targetId) => {
    const cleanId = String(targetId || targetRoomId).trim();
    if (!cleanId) {
      setError('Please enter or select a Room ID.');
      return;
    }
    const res = await executeApi('/invite', {
      pkType: 'room',
      pkMode: 'room',
      targetRoomId: cleanId,
      durationSeconds: selectedDurationSec,
    });
    if (res) {
      setShowInviteSheet(false);
      setTargetRoomId('');
    }
  };

  // Respond to invite
  const handleRespond = (decision) => {
    if (!match?.id && !match?._id) return;
    const matchId = match.id || match._id;
    executeApi(`/${matchId}/respond`, { decision });
  };

  // End Room PK
  const handleEndPK = () => {
    if (!match?.id && !match?._id) return;
    const matchId = match.id || match._id;
    executeApi(`/${matchId}/cancel`, { matchId });
    setShowSettingsSheet(false);
  };

  // Opposite Voice Toggle
  const handleToggleOppositeVoice = (val) => {
    setOppositeVoice(val);
    const msg = `The opposite voice in Room PK: ${val ? 'on' : 'off'}`;
    if (onChatMessage) onChatMessage(msg);
  };

  const isPKLive = Boolean(match && match.status === 'active');
  const isInvited = Boolean(match && match.status === 'invited');
  const view = roomPKView(match, roomId, now, 0);

  const scoreA = Number(match?.scores?.[0] || 0);
  const scoreB = Number(match?.scores?.[1] || 0);
  const totalScore = scoreA + scoreB;
  const leftPct = totalScore === 0 ? 50 : Math.max(15, Math.min(85, Math.round((scoreA / totalScore) * 100)));

  if (!visible && !isPKLive && !matching) return null;

  return (
    <>
      {/* ============================================================== */}
      {/* 1. IN-ROOM FLOATING / EMBEDDED CARD (MATCHING VIDEO EXACTLY)   */}
      {/* ============================================================== */}
      <View style={styles.inRoomCardWrapper} pointerEvents="box-none">
        {/* Top Floating Pill: ⚔️ PK */}
        <TouchableOpacity
          style={styles.topPkPill}
          activeOpacity={0.85}
          onPress={() => isPKLive ? setShowSettingsSheet(true) : null}
        >
          <LinearGradient
            colors={['#8B5CF6', '#3B82F6', '#F59E0B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.topPkPillGrad}
          >
            <Text style={styles.topPkPillText}>⚔️ PK</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* ---------------- A. SETUP CARD (IDLE STATE) ---------------- */}
        {!isPKLive && !matching && !isInvited && (
          <View style={styles.mainCard}>
            {/* Top IDs row */}
            <View style={styles.cardHeaderRow}>
              <Text style={styles.roomIdHeader}>ID:{roomId}</Text>
              <Text style={styles.roomIdHeader}>ID:Waiting</Text>
            </View>

            {/* Buttons Row: Match PK (Yellow) | Invite PK (Blue) */}
            <View style={styles.buttonsRow}>
              <TouchableOpacity
                style={styles.actionBtnCapsule}
                onPress={handleMatchPK}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#FDE047', '#F59E0B', '#D97706']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.actionBtnGrad}
                >
                  <Text style={styles.matchBtnText}>Match PK</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtnCapsule}
                onPress={() => setShowInviteSheet(true)}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#38BDF8', '#0284C7', '#0369A1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.actionBtnGrad}
                >
                  <Text style={styles.inviteBtnText}>Invite PK</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Looting Mode Switch Row */}
            <View style={styles.lootingRow}>
              <Text style={styles.lootingText}>Whether to enable looting mode</Text>
              <Switch
                trackColor={{ false: '#475569', true: '#F59E0B' }}
                thumbColor={lootingMode ? '#FFFFFF' : '#CBD5E1'}
                onValueChange={setLootingMode}
                value={lootingMode}
                style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
              />
            </View>

            {/* Record Pill on Bottom Right */}
            <TouchableOpacity
              style={styles.recordPillBtn}
              onPress={() => setShowRecordModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.recordPillText}>Record</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ---------------- B. MATCHING STATE (SPINNER) ---------------- */}
        {matching && !isPKLive && (
          <View style={styles.mainCard}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.roomIdHeader}>ID:{roomId}</Text>
              <Text style={styles.roomIdHeader}>ID:Waiting</Text>
            </View>

            <View style={styles.matchingCenterRow}>
              <View style={styles.matchingLeftCol}>
                <Text style={styles.matchingRoomTitle} numberOfLines={1}>{roomName}</Text>
              </View>

              <View style={styles.spinnerCol}>
                <ActivityIndicator size="small" color="#38BDF8" />
                <Text style={styles.spinnerText}>Matching</Text>
              </View>

              <View style={styles.matchingRightCol}>
                <Text style={styles.matchingSubtitle}>Matching room pk...</Text>
              </View>
            </View>

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.cancelMatchBtn}
              onPress={handleCancelMatch}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#8B5CF6', '#6D28D9']}
                style={styles.cancelMatchGrad}
              >
                <Text style={styles.cancelMatchText}>Cancel</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Record Pill */}
            <TouchableOpacity
              style={styles.recordPillBtn}
              onPress={() => setShowRecordModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.recordPillText}>Record</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ---------------- C. INCOMING INVITE STATE ---------------- */}
        {isInvited && !isPKLive && (
          <View style={styles.mainCard}>
            <Text style={styles.inviteNoticeTitle}>⚔️ Incoming Room PK Challenge!</Text>
            <Text style={styles.inviteNoticeSub}>
              {match.rooms?.[1]?.name || 'Opponent Room'} has invited your room to battle!
            </Text>
            <View style={styles.inviteResponseRow}>
              <TouchableOpacity
                style={[styles.respBtn, { backgroundColor: '#10B981' }]}
                onPress={() => handleRespond('accept')}
              >
                <Text style={styles.respBtnText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.respBtn, { backgroundColor: '#EF4444' }]}
                onPress={() => handleRespond('decline')}
              >
                <Text style={styles.respBtnText}>Decline</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ---------------- D. LIVE BATTLE CARD (MATCHING VIDEO) ---------------- */}
        {isPKLive && (
          <TouchableOpacity
            style={styles.liveBattleCard}
            activeOpacity={0.92}
            onPress={() => setShowSettingsSheet(true)}
          >
            {/* Top Timer Countdown */}
            <View style={styles.liveTimerRow}>
              <Text style={styles.liveTimerDigits}>{secondsLeft}s</Text>
            </View>

            {/* Realtime Prize Pool Badge */}
            <View style={styles.prizePoolBadge}>
              <Text style={styles.prizePoolText}>Realtime Prize Pool: 💎 0</Text>
            </View>

            {/* Room Info Row */}
            <View style={styles.battleTeamsRow}>
              {/* Left Room */}
              <View style={styles.teamColLeft}>
                <Text style={styles.teamRoomId}>ID:{match.rooms?.[0]?.userId || roomId}</Text>
                <View style={styles.teamNameRow}>
                  <Image
                    source={{ uri: match.rooms?.[0]?.coverImage || roomCover || 'https://via.placeholder.com/40' }}
                    style={styles.teamAvatar}
                  />
                  <Text style={styles.teamRoomName} numberOfLines={1}>
                    {match.rooms?.[0]?.title || roomName}
                  </Text>
                </View>
              </View>

              {/* Right Room */}
              <View style={styles.teamColRight}>
                <Text style={styles.teamRoomId}>ID:{match.rooms?.[1]?.userId || 'Opponent'}</Text>
                <View style={[styles.teamNameRow, { justifyContent: 'flex-end' }]}>
                  <Text style={styles.teamRoomName} numberOfLines={1}>
                    {match.rooms?.[1]?.title || 'Opponent Room'}
                  </Text>
                  <Image
                    source={{ uri: match.rooms?.[1]?.coverImage || 'https://via.placeholder.com/40' }}
                    style={styles.teamAvatar}
                  />
                </View>
              </View>
            </View>

            {/* Split Progress Bar with Lightning Star */}
            <View style={styles.progressBarContainer}>
              <View style={[styles.yellowProgress, { width: `${leftPct}%` }]}>
                <Text style={styles.scoreTextLeft}>{scoreA}</Text>
              </View>
              <View style={[styles.blueProgress, { width: `${100 - leftPct}%` }]}>
                <Text style={styles.scoreTextRight}>{scoreB}</Text>
              </View>
              <View style={[styles.centerLightning, { left: `${leftPct - 4}%` }]}>
                <Ionicons name="flash" size={16} color="#FDE047" />
              </View>
            </View>

            {/* Top 3 Supporters Slots */}
            <View style={styles.supportersRow}>
              {/* Left Top 3 (Yellow) */}
              <View style={styles.supportersColLeft}>
                <Text style={styles.supporterLabel}>Top3 supporter</Text>
                <View style={styles.avatarSlotsRow}>
                  <View style={styles.yellowSlot} />
                  <View style={styles.yellowSlot} />
                  <View style={styles.yellowSlot} />
                </View>
              </View>

              {/* Right Top 3 (Blue) */}
              <View style={styles.supportersColRight}>
                <Text style={styles.supporterLabel}>Top3 supporter</Text>
                <View style={styles.avatarSlotsRow}>
                  <View style={styles.blueSlot} />
                  <View style={styles.blueSlot} />
                  <View style={styles.blueSlot} />
                </View>
              </View>
            </View>

            {/* Record Pill on Bottom Right */}
            <TouchableOpacity
              style={styles.recordPillBtn}
              onPress={() => setShowRecordModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.recordPillText}>Record</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      </View>

      {/* ============================================================== */}
      {/* 2. LIVE ROOM PK SETTINGS BOTTOM SHEET (FROM VIDEO)            */}
      {/* ============================================================== */}
      <Modal visible={showSettingsSheet} transparent animationType="slide" onRequestClose={() => setShowSettingsSheet(false)}>
        <View style={styles.sheetOverlay}>
          <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={() => setShowSettingsSheet(false)} />
          <View style={styles.settingsSheetContainer}>
            {/* Opposite Voice Switch Row */}
            <View style={styles.settingItemRow}>
              <View style={styles.settingTextCol}>
                <Text style={styles.settingTitle}>Opposite Voice</Text>
                <Text style={styles.settingDesc}>
                  Turn on the switch can hear the opposite room voice(all mic)
                </Text>
              </View>
              <Switch
                trackColor={{ false: '#475569', true: '#8B5CF6' }}
                thumbColor={oppositeVoice ? '#FFFFFF' : '#CBD5E1'}
                onValueChange={handleToggleOppositeVoice}
                value={oppositeVoice}
              />
            </View>

            {/* End Room PK Button */}
            {isOwner && (
              <TouchableOpacity
                style={styles.endPkCapsuleBtn}
                onPress={handleEndPK}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#6D28D9']}
                  style={styles.endPkGrad}
                >
                  <Ionicons name="power" size={18} color="#FFF" style={{ marginRight: 6 }} />
                  <Text style={styles.endPkBtnText}>Room PK</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* ============================================================== */}
      {/* 3. INVITE ROOM PK MODAL (DIRECT ID + LIVE ROOMS)              */}
      {/* ============================================================== */}
      <Modal visible={showInviteSheet} transparent animationType="slide" onRequestClose={() => setShowInviteSheet(false)}>
        <View style={styles.sheetOverlay}>
          <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={() => setShowInviteSheet(false)} />
          <View style={styles.inviteSheetContainer}>
            <View style={styles.inviteHeader}>
              <Text style={styles.inviteHeaderTitle}>Invite Room to Battle ⚔️</Text>
              <TouchableOpacity onPress={() => setShowInviteSheet(false)}>
                <Ionicons name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Match Duration */}
            <Text style={styles.subSectionTitle}>Match Duration:</Text>
            <View style={styles.durationRow}>
              {DURATION_CHOICES.map(d => (
                <TouchableOpacity
                  key={d.sec}
                  style={[styles.durationChip, selectedDurationSec === d.sec && styles.durationChipActive]}
                  onPress={() => setSelectedDurationSec(d.sec)}
                >
                  <Text style={[styles.durationChipText, selectedDurationSec === d.sec && styles.durationChipTextActive]}>
                    {d.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Direct Room ID Input */}
            <Text style={styles.subSectionTitle}>Enter Opponent Room ID:</Text>
            <View style={styles.inputGroup}>
              <TextInput
                style={styles.inputField}
                placeholder="e.g. 100000002"
                placeholderTextColor="#64748B"
                value={targetRoomId}
                onChangeText={setTargetRoomId}
                keyboardType="number-pad"
              />
              <TouchableOpacity
                style={styles.sendInviteBtn}
                onPress={() => handleSendInvite(targetRoomId)}
                disabled={busy || !targetRoomId.trim()}
              >
                <Text style={styles.sendInviteBtnText}>Invite</Text>
              </TouchableOpacity>
            </View>

            {/* Live Opponents List */}
            <Text style={[styles.subSectionTitle, { marginTop: 12 }]}>Live Public Rooms:</Text>
            <ScrollView style={{ maxHeight: 200 }}>
              {opponents.length === 0 ? (
                <Text style={styles.noRoomsText}>No other live public rooms. Enter Room ID above to challenge.</Text>
              ) : (
                opponents.map((opp) => (
                  <View key={opp.id || opp.roomId} style={styles.oppItemRow}>
                    <Image source={{ uri: opp.cover || opp.avatar || 'https://via.placeholder.com/40' }} style={styles.oppAvatar} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.oppItemName} numberOfLines={1}>{opp.name}</Text>
                      <Text style={styles.oppItemId}>ID: {opp.roomId || opp.id}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.oppChallengeBtn}
                      onPress={() => handleSendInvite(opp.roomId || opp.id)}
                    >
                      <Text style={styles.oppChallengeBtnText}>Battle</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ============================================================== */}
      {/* 4. ROOM PK RECORD MODAL (MATCHING VIDEO EXACTLY)              */}
      {/* ============================================================== */}
      <Modal visible={showRecordModal} transparent animationType="fade" onRequestClose={() => setShowRecordModal(false)}>
        <View style={styles.recordOverlay}>
          <View style={styles.recordModalCard}>
            {/* Header with Date Dropdown */}
            <View style={styles.recordHeader}>
              <Text style={styles.recordTitle}>Room PK Record</Text>
              <View style={styles.dateDropdown}>
                <Text style={styles.dateDropdownText}>11/25 2:53 AM</Text>
                <Ionicons name="caret-down" size={14} color="#38BDF8" style={{ marginLeft: 4 }} />
              </View>
            </View>

            <Text style={styles.recordNotice}>Only supports querying records within 2 month</Text>

            {/* Record Match Card */}
            <View style={styles.recordMatchCard}>
              <View style={styles.recordMatchRow}>
                {/* Left Team (Our Room) */}
                <View style={styles.recordTeamCol}>
                  <Image
                    source={{ uri: roomCover || 'https://via.placeholder.com/60' }}
                    style={styles.recordAvatar}
                  />
                  <View style={styles.defeatBanner}>
                    <Text style={styles.bannerText}>Defeat</Text>
                  </View>
                  <Text style={styles.recordTeamName} numberOfLines={1}>{roomName}</Text>
                  <Text style={styles.recordTeamId}>ID:{roomId}</Text>
                  <View style={styles.recordScoreRow}>
                    <Text style={styles.pkBadgeIcon}>PK</Text>
                    <Text style={styles.recordScoreNum}>338</Text>
                  </View>
                </View>

                {/* Center VS */}
                <Text style={styles.recordVsText}>VS</Text>

                {/* Right Team (Opponent) */}
                <View style={styles.recordTeamCol}>
                  <Image
                    source={{ uri: 'https://via.placeholder.com/60' }}
                    style={styles.recordAvatar}
                  />
                  <View style={styles.victoryBanner}>
                    <Text style={styles.bannerText}>Victory</Text>
                  </View>
                  <Text style={styles.recordTeamName} numberOfLines={1}>sukoon_ki_duniya_</Text>
                  <Text style={styles.recordTeamId}>ID:927856102</Text>
                  <View style={styles.recordScoreRow}>
                    <Text style={styles.pkBadgeIcon}>PK</Text>
                    <Text style={styles.recordScoreNum}>412</Text>
                  </View>
                </View>
              </View>

              {/* Supporter Item */}
              <View style={styles.supporterItemRow}>
                <Text style={styles.crownRank}>👑</Text>
                <Image
                  source={require('../../assets/avtar.webp')}
                  style={styles.supporterAvatar}
                />
                <Text style={styles.supporterName} numberOfLines={1}>black</Text>
                <Text style={styles.diamondScore}>💎 338</Text>
              </View>

              {/* Bottom Total Bar */}
              <View style={styles.recordFooter}>
                <Text style={styles.footerLabel}>👤 Supporter Num: 1</Text>
                <Text style={styles.footerLabel}>💎 Total: 338</Text>
              </View>
            </View>

            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeRecordBtn}
              onPress={() => setShowRecordModal(false)}
            >
              <Text style={styles.closeRecordBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // In-room Card Wrapper (positioned right above chat)
  inRoomCardWrapper: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 125,
    zIndex: 9990,
    alignItems: 'center',
  },
  topPkPill: {
    marginBottom: -10,
    zIndex: 10,
  },
  topPkPillGrad: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C084FC',
  },
  topPkPillText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  mainCard: {
    width: '100%',
    backgroundColor: 'rgba(20, 26, 60, 0.94)',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    paddingTop: 18,
    paddingHorizontal: 14,
    paddingBottom: 10,
    position: 'relative',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  roomIdHeader: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  actionBtnCapsule: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  actionBtnGrad: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchBtnText: {
    color: '#78350F',
    fontSize: 15,
    fontWeight: '900',
  },
  inviteBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  lootingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 60,
  },
  lootingText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    fontWeight: '500',
  },
  recordPillBtn: {
    position: 'absolute',
    right: 10,
    bottom: 8,
    backgroundColor: '#7C3AED',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 12,
  },
  recordPillText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },

  // Matching Mode
  matchingCenterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  matchingLeftCol: {
    flex: 1,
  },
  matchingRoomTitle: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  spinnerCol: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  spinnerText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  matchingRightCol: {
    flex: 1,
    alignItems: 'flex-end',
  },
  matchingSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
  cancelMatchBtn: {
    width: 100,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    alignSelf: 'center',
    marginTop: 6,
  },
  cancelMatchGrad: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelMatchText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },

  // Live Battle Card
  liveBattleCard: {
    width: '100%',
    backgroundColor: 'rgba(20, 26, 60, 0.94)',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    paddingTop: 16,
    paddingHorizontal: 12,
    paddingBottom: 10,
    position: 'relative',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 12,
  },
  liveTimerRow: {
    alignItems: 'center',
    marginTop: -4,
  },
  liveTimerDigits: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '900',
  },
  prizePoolBadge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  prizePoolText: {
    color: '#E0E7FF',
    fontSize: 11,
    fontWeight: '700',
  },
  battleTeamsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  teamColLeft: {
    flex: 1,
  },
  teamColRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  teamRoomId: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  teamNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 6,
  },
  teamRoomName: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    maxWidth: 90,
  },
  progressBarContainer: {
    width: '100%',
    height: 18,
    borderRadius: 9,
    flexDirection: 'row',
    overflow: 'hidden',
    position: 'relative',
    marginVertical: 6,
  },
  yellowProgress: {
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    paddingLeft: 8,
  },
  blueProgress: {
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  scoreTextLeft: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '900',
  },
  scoreTextRight: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '900',
  },
  centerLightning: {
    position: 'absolute',
    top: 1,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingRight: 60,
    marginTop: 2,
  },
  supportersColLeft: {},
  supportersColRight: {
    alignItems: 'flex-end',
  },
  supporterLabel: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '600',
    marginBottom: 2,
  },
  avatarSlotsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  yellowSlot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F59E0B',
    opacity: 0.7,
  },
  blueSlot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0284C7',
    opacity: 0.7,
  },

  // Settings Sheet
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetBackdrop: {
    flex: 1,
  },
  settingsSheetContainer: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    borderTopWidth: 1.5,
    borderColor: '#38BDF8',
  },
  settingItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  settingTextCol: {
    flex: 1,
    paddingRight: 14,
  },
  settingTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  settingDesc: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 16,
  },
  endPkCapsuleBtn: {
    width: 160,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  endPkGrad: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  endPkBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },

  // Invite Sheet
  inviteSheetContainer: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: SCREEN_HEIGHT * 0.7,
    borderTopWidth: 1.5,
    borderColor: '#38BDF8',
  },
  inviteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  inviteHeaderTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  subSectionTitle: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  durationChip: {
    flex: 1,
    paddingVertical: 7,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    alignItems: 'center',
  },
  durationChipActive: {
    backgroundColor: '#0284C7',
  },
  durationChipText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  durationChipTextActive: {
    color: '#FFF',
  },
  inputGroup: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  inputField: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFF',
    fontSize: 13,
  },
  sendInviteBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
  },
  sendInviteBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  noRoomsText: {
    color: '#64748B',
    fontSize: 11,
    marginVertical: 10,
  },
  oppItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 8,
    borderRadius: 10,
    marginBottom: 6,
  },
  oppAvatar: {
    width: 34,
    height: 34,
    borderRadius: 6,
    marginRight: 8,
  },
  oppItemName: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  oppItemId: {
    color: '#94A3B8',
    fontSize: 10,
  },
  oppChallengeBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  oppChallengeBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },

  // Record Modal
  recordOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  recordModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#0F172A',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    padding: 18,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  recordTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  dateDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dateDropdownText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  recordNotice: {
    color: '#64748B',
    fontSize: 10,
    marginBottom: 14,
  },
  recordMatchCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  recordMatchRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 12,
  },
  recordTeamCol: {
    alignItems: 'center',
    flex: 1,
  },
  recordAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  defeatBanner: {
    backgroundColor: '#475569',
    paddingHorizontal: 8,
    paddingVertical: 1,
    borderRadius: 6,
    marginTop: -8,
  },
  victoryBanner: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 1,
    borderRadius: 6,
    marginTop: -8,
  },
  bannerText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },
  recordTeamName: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
    maxWidth: 90,
  },
  recordTeamId: {
    color: '#94A3B8',
    fontSize: 9,
  },
  recordScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  pkBadgeIcon: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '900',
    marginRight: 4,
  },
  recordScoreNum: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '900',
  },
  recordVsText: {
    color: '#EF4444',
    fontSize: 18,
    fontWeight: '900',
  },
  supporterItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    padding: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  crownRank: {
    fontSize: 14,
    marginRight: 6,
  },
  supporterAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 6,
  },
  supporterName: {
    color: '#FFF',
    fontSize: 11,
    flex: 1,
  },
  diamondScore: {
    color: '#C084FC',
    fontSize: 11,
    fontWeight: '800',
  },
  recordFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  footerLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  closeRecordBtn: {
    backgroundColor: '#334155',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeRecordBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // Incoming Invite Notice
  inviteNoticeTitle: {
    color: '#FDE047',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  inviteNoticeSub: {
    color: '#CBD5E1',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 10,
  },
  inviteResponseRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  respBtn: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 10,
  },
  respBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
