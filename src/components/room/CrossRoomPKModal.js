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
  isOwner = false,
  currentUser = null,
}) {
  const [targetRoomId, setTargetRoomId] = useState('');
  const [selectedDurationSec, setSelectedDurationSec] = useState(300);
  const [opponents, setOpponents] = useState([]);
  const [loadingOpponents, setLoadingOpponents] = useState(false);
  const [match, setMatch] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());

  const base = `/voice-club/rooms/${encodeURIComponent(roomId || '')}/pk`;

  // Fetch state & live opponents
  const fetchStateAndOpponents = useCallback(async () => {
    if (!roomId) return;
    try {
      const [pkRes, oppRes] = await Promise.allSettled([
        apiUtil.get(base),
        apiUtil.get(`${base}/opponents`),
      ]);
      if (pkRes.status === 'fulfilled' && pkRes.value?.data?.data) {
        const pkData = pkRes.value.data.data;
        if (pkData.pkType === 'room') {
          setMatch(pkData);
        } else {
          setMatch(null);
        }
      }
      if (oppRes.status === 'fulfilled') {
        const oppList = oppRes.value?.data?.data || [];
        setOpponents(Array.isArray(oppList) ? oppList : []);
      }
    } catch {
      // Ignore background sync errors
    } finally {
      setLoadingOpponents(false);
    }
  }, [roomId, base]);

  useEffect(() => {
    if (!visible) return;
    setLoadingOpponents(true);
    fetchStateAndOpponents();

    const interval = setInterval(() => {
      fetchStateAndOpponents();
      setNow(Date.now());
    }, 5000);

    const sock = getSocket();
    const handleState = (payload) => {
      if (payload && payload.pkType === 'room') {
        setMatch(payload);
      }
    };
    if (sock) {
      sock.on('room_pk:state', handleState);
    }

    return () => {
      clearInterval(interval);
      if (sock) sock.off('room_pk:state', handleState);
    };
  }, [visible, fetchStateAndOpponents]);

  // Execute Room PK actions
  const executeApi = async (endpoint, payload) => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const res = await apiUtil.post(`${base}${endpoint}`, payload);
      if (res?.data?.data) {
        setMatch(res.data.data);
      }
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Room PK failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleInvite = (targetId) => {
    const cleanId = String(targetId || targetRoomId).trim();
    if (!cleanId) {
      setError('Please enter or select an Opponent Room ID.');
      return;
    }
    executeApi('/invite', {
      pkType: 'room',
      pkMode: 'room',
      targetRoomId: cleanId,
      durationSeconds: selectedDurationSec,
    });
  };

  const handleRespond = (decision) => {
    if (!match?.id && !match?._id) return;
    const matchId = match.id || match._id;
    executeApi(`/${matchId}/respond`, { decision });
  };

  const handleCancel = () => {
    if (!match?.id && !match?._id) return;
    const matchId = match.id || match._id;
    executeApi(`/${matchId}/cancel`, { matchId });
  };

  const isPKLive = Boolean(match && match.status === 'active');
  const isInvited = Boolean(match && match.status === 'invited');
  const isFinished = Boolean(match && match.status === 'finished');

  const myUserId = String(currentUser?._id || currentUser?.id || currentUser?.userId || '');
  const isChallenger = match?.invitedBy === myUserId;

  const view = roomPKView(match, roomId, now, 0);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.dismissOverlay} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.titleWrap}>
              <Text style={styles.headerTitle}>Room PK 🏆</Text>
              <Text style={styles.headerSubtitle}>Cross-Room Battle (Room vs Room)</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={28} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Error Message */}
          {Boolean(error) && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" style={{ marginRight: 6 }} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* 1. ACTIVE LIVE ROOM PK SCOREBOARD */}
            {isPKLive && (
              <View style={styles.activeScoreboardCard}>
                <View style={styles.liveBadgeRow}>
                  <Text style={styles.liveBadgeText}>🔴 LIVE ROOM BATTLE</Text>
                  <Text style={styles.liveTimerText}>{view.timer}</Text>
                </View>

                <View style={styles.vsRow}>
                  {/* Room A (Our Room) */}
                  <View style={styles.roomCol}>
                    <Image
                      source={{ uri: match.rooms?.[0]?.cover || 'https://via.placeholder.com/80' }}
                      style={styles.roomAvatar}
                    />
                    <Text style={styles.roomName} numberOfLines={1}>
                      {match.rooms?.[0]?.name || 'Our Room'}
                    </Text>
                    <Text style={[styles.roomScore, { color: '#F59E0B' }]}>
                      {match.scores?.[0] || 0}
                    </Text>
                  </View>

                  <Text style={styles.vsText}>VS</Text>

                  {/* Room B (Opponent Room) */}
                  <View style={styles.roomCol}>
                    <Image
                      source={{ uri: match.rooms?.[1]?.cover || 'https://via.placeholder.com/80' }}
                      style={styles.roomAvatar}
                    />
                    <Text style={styles.roomName} numberOfLines={1}>
                      {match.rooms?.[1]?.name || 'Opponent Room'}
                    </Text>
                    <Text style={[styles.roomScore, { color: '#38BDF8' }]}>
                      {match.scores?.[1] || 0}
                    </Text>
                  </View>
                </View>

                {isOwner && (
                  <TouchableOpacity
                    style={styles.endBattleBtn}
                    onPress={handleCancel}
                    disabled={busy}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.endBattleBtnText}>End Room PK</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* 2. INVITATION / CHALLENGE CARD */}
            {isInvited && (
              <View style={styles.inviteCard}>
                <Text style={styles.inviteCardTitle}>
                  {isChallenger ? '⏳ Challenge Sent' : '⚔️ Incoming Room PK Challenge!'}
                </Text>
                <Text style={styles.inviteCardSub}>
                  {isChallenger
                    ? `Waiting for opponent Room to accept or decline the challenge... (Expires in ${view.timer})`
                    : `Another room has challenged your room to a Room PK Battle!`}
                </Text>

                <View style={styles.inviteActionsRow}>
                  {!isChallenger ? (
                    <>
                      <TouchableOpacity
                        style={[styles.inviteActionBtn, { backgroundColor: '#10B981' }]}
                        onPress={() => handleRespond('accept')}
                        disabled={busy}
                      >
                        <Text style={styles.inviteBtnText}>Accept Challenge</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.inviteActionBtn, { backgroundColor: '#EF4444' }]}
                        onPress={() => handleRespond('decline')}
                        disabled={busy}
                      >
                        <Text style={styles.inviteBtnText}>Decline</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity
                      style={[styles.inviteActionBtn, { backgroundColor: '#64748B' }]}
                      onPress={handleCancel}
                      disabled={busy}
                    >
                      <Text style={styles.inviteBtnText}>Cancel Challenge</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* 3. FINISHED RESULT CARD */}
            {isFinished && (
              <View style={styles.finishedCard}>
                <Text style={styles.finishedTitle}>🏆 BATTLE FINISHED</Text>
                <Text style={styles.finishedResult}>{view.result || 'Match Completed'}</Text>
                <View style={styles.vsRow}>
                  <Text style={[styles.roomScore, { color: '#F59E0B' }]}>{match.scores?.[0] || 0}</Text>
                  <Text style={styles.vsText}>VS</Text>
                  <Text style={[styles.roomScore, { color: '#38BDF8' }]}>{match.scores?.[1] || 0}</Text>
                </View>
              </View>
            )}

            {/* 4. SETUP FORM: Opponent Input & Duration */}
            {!isPKLive && !isInvited && (
              <>
                {/* Duration Picker */}
                <Text style={styles.sectionLabel}>Match Duration:</Text>
                <View style={styles.durationRow}>
                  {DURATION_CHOICES.map(d => {
                    const isSelected = selectedDurationSec === d.sec;
                    return (
                      <TouchableOpacity
                        key={d.sec}
                        style={[styles.durationChip, isSelected && styles.durationChipActive]}
                        onPress={() => setSelectedDurationSec(d.sec)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.durationChipText, isSelected && styles.durationChipTextActive]}>
                          {d.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Direct Room ID Invite */}
                <Text style={styles.sectionLabel}>Challenge by Room ID:</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter Opponent Room ID (e.g. 100000002)"
                    placeholderTextColor="#64748B"
                    value={targetRoomId}
                    onChangeText={setTargetRoomId}
                    keyboardType="number-pad"
                  />
                  <TouchableOpacity
                    style={styles.challengeBtn}
                    onPress={() => handleInvite(targetRoomId)}
                    disabled={busy || !targetRoomId.trim()}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#8B5CF6', '#6D28D9']}
                      style={styles.challengeBtnGrad}
                    >
                      {busy ? (
                        <ActivityIndicator color="#FFF" size="small" />
                      ) : (
                        <Text style={styles.challengeBtnText}>Invite</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                {/* Live Opponent Rooms List */}
                <Text style={[styles.sectionLabel, { marginTop: 18 }]}>Live Active Rooms:</Text>
                {loadingOpponents ? (
                  <View style={styles.loadingBox}>
                    <ActivityIndicator size="small" color="#8B5CF6" />
                    <Text style={styles.loadingText}>Searching live rooms...</Text>
                  </View>
                ) : opponents.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Ionicons name="radio-outline" size={28} color="#475569" style={{ marginBottom: 6 }} />
                    <Text style={styles.emptyText}>No other public rooms currently live.</Text>
                    <Text style={styles.emptySubtext}>Enter any Room ID above to challenge directly.</Text>
                  </View>
                ) : (
                  <View style={styles.opponentsList}>
                    {opponents.map((opp, idx) => (
                      <View key={opp.roomId || opp.id || idx} style={styles.opponentItem}>
                        <Image
                          source={{ uri: opp.cover || opp.avatar || 'https://via.placeholder.com/50' }}
                          style={styles.oppCover}
                        />
                        <View style={styles.oppInfo}>
                          <Text style={styles.oppName} numberOfLines={1}>{opp.name || `Room ${opp.roomId}`}</Text>
                          <Text style={styles.oppId}>ID: {opp.roomId || opp.id}</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.quickChallengeBtn}
                          onPress={() => handleInvite(opp.roomId || opp.id)}
                          disabled={busy}
                          activeOpacity={0.8}
                        >
                          <LinearGradient
                            colors={['#EF4444', '#DC2626']}
                            style={styles.quickChallengeGrad}
                          >
                            <Text style={styles.quickChallengeText}>Battle ⚔️</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  dismissOverlay: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'android' ? 24 : 36,
    maxHeight: SCREEN_HEIGHT * 0.78,
    borderTopWidth: 1.5,
    borderColor: '#38BDF8',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleWrap: {
    flex: 1,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  scrollArea: {
    maxHeight: SCREEN_HEIGHT * 0.65,
  },
  sectionLabel: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 6,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  durationChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  durationChipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#38BDF8',
  },
  durationChipText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  durationChipTextActive: {
    color: '#FFF',
    fontWeight: '800',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFF',
    fontSize: 13,
  },
  challengeBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  challengeBtnGrad: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  loadingBox: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 6,
  },
  emptyBox: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    marginVertical: 4,
  },
  emptyText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
  },
  emptySubtext: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  opponentsList: {
    gap: 8,
    marginBottom: 16,
  },
  opponentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  oppCover: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 10,
  },
  oppInfo: {
    flex: 1,
  },
  oppName: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  oppId: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  quickChallengeBtn: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  quickChallengeGrad: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  quickChallengeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },

  // Active Live Scoreboard
  activeScoreboardCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EF4444',
    padding: 14,
    marginBottom: 16,
  },
  liveBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  liveBadgeText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '800',
  },
  liveTimerText: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '800',
  },
  vsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  roomCol: {
    alignItems: 'center',
    flex: 1,
  },
  roomAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#38BDF8',
    marginBottom: 6,
  },
  roomName: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    maxWidth: 100,
    textAlign: 'center',
  },
  roomScore: {
    fontSize: 20,
    fontWeight: '900',
    marginTop: 4,
  },
  vsText: {
    color: '#EF4444',
    fontSize: 20,
    fontWeight: '900',
    marginHorizontal: 10,
  },
  endBattleBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  endBattleBtnText: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '700',
  },

  // Invite Card
  inviteCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#F59E0B',
    padding: 14,
    marginBottom: 16,
  },
  inviteCardTitle: {
    color: '#FCD34D',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  inviteCardSub: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  inviteActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inviteActionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  inviteBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },

  // Finished Card
  finishedCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#10B981',
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  finishedTitle: {
    color: '#34D399',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  finishedResult: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
});
