import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, AppState } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { apiUtil } from '../../utils/apiUtil';
import { getSocket } from '../../sockets';
import { normalizePKRoomId, roomPKView } from '../../utils/roomPkState';

export default function RoomPKPanel({
  roomId,
  isOwner = false,
  bottomSafePadding = 16,
  openTrigger = 0,
  roomUsers = [],
  roomSeats = [],
  currentUser = null,
}) {
  const [match, setMatch] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (openTrigger > 0) {
      setVisible(true);
    }
  }, [openTrigger]);
  const [opponents, setOpponents] = useState([]);
  const [history, setHistory] = useState([]);
  const [targetUserId, setTargetUserId] = useState('');
  const [targetRoomId, setTargetRoomId] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(300);
  const [selectedType, setSelectedType] = useState('user');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());
  const [offset, setOffset] = useState(0);
  const requestSequence = useRef(0);
  const currentRoom = useRef(roomId);
  currentRoom.current = roomId;
  const lastSnapshot = useRef(null);
  const lastInvite = useRef('');
  const base = `/voice-club/rooms/${encodeURIComponent(roomId || '')}/pk`;

  // Candidates in the same room for User PK (seated users + online users, excluding self)
  const roomCandidates = useMemo(() => {
    const map = new Map();
    const myIds = new Set([
      String(currentUser?._id || ''),
      String(currentUser?.id || ''),
      String(currentUser?.userId || ''),
    ].filter(Boolean));

    const isMe = (u) => [String(u?._id || ''), String(u?.id || ''), String(u?.userId || '')].some(id => id && myIds.has(id));

    // 1. Add seated users in the room
    (roomSeats || []).forEach(seat => {
      if (seat?.user && !isMe(seat.user)) {
        const u = seat.user;
        const uid = String(u.userId || u._id || u.id || '');
        if (uid) {
          map.set(uid, {
            id: uid,
            _id: u._id || u.id,
            userId: u.userId || uid,
            name: u.name || `Mic #${seat.seatIndex + 1}`,
            avatar: u.avatar || u.image || '',
            isSeated: true,
            seatIndex: seat.seatIndex,
          });
        }
      }
    });

    // 2. Add online users in the room
    const rawOnline = Array.isArray(roomUsers) ? roomUsers : Object.values(roomUsers || {});
    rawOnline.forEach(u => {
      if (u && !isMe(u)) {
        const uid = String(u.userId || u._id || u.id || '');
        if (uid && !map.has(uid)) {
          map.set(uid, {
            id: uid,
            _id: u._id || u.id,
            userId: u.userId || uid,
            name: u.name || 'Member',
            avatar: u.avatar || u.image || '',
            isSeated: false,
          });
        }
      }
    });

    return Array.from(map.values());
  }, [roomSeats, roomUsers, currentUser]);

  const apply = useCallback(data => {
    if (data && !data.roomIds?.includes(normalizePKRoomId(roomId))) return;
    const previous = lastSnapshot.current;
    if (data && previous?.id === data.id && new Date(previous.updatedAt).getTime() > new Date(data.updatedAt).getTime()) return;
    lastSnapshot.current = data;
    setMatch(data);
    if (data?.serverNow) setOffset(Number(data.serverNow) - Date.now());
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return undefined;
    let alive = true;
    let attached = null;
    let fetching = false;
    lastSnapshot.current = null;
    setMatch(null);
    setError('');
    const handleState = data => {
      if (!alive || !data?.roomIds?.includes(normalizePKRoomId(roomId))) return;
      requestSequence.current++;
      apply(data);
    };
    const poll = async () => {
      if (fetching || !alive || AppState.currentState === 'background') return;
      fetching = true;
      const socket = getSocket();
      if (socket && socket !== attached) {
        attached?.off('room_pk:state', handleState);
        attached = socket;
        socket.on('room_pk:state', handleState);
      }
      const sequence = ++requestSequence.current;
      try {
        const response = await apiUtil.get(base);
        if (alive && sequence === requestSequence.current) apply(response.data?.data || null);
      } catch { /* Socket updates remain available; retry silently on next poll. */ }
      finally { fetching = false; }
    };
    poll();
    const interval = setInterval(poll, 15000);
    const foreground = AppState.addEventListener('change', state => { if (state === 'active') poll(); });
    return () => { alive = false; clearInterval(interval); foreground.remove(); attached?.off('room_pk:state', handleState); };
  }, [roomId, base, apply]);

  const hasMatch = Boolean(match);
  useEffect(() => {
    if (!hasMatch && !visible) return undefined;
    const clock = setInterval(() => { if (AppState.currentState !== 'background') setNow(Date.now()); }, 1000);
    return () => clearInterval(clock);
  }, [hasMatch, visible]);

  const view = roomPKView(match, roomId, now, offset);
  useEffect(() => {
    if (isOwner && match?.status === 'invited' && view.side === 1 && lastInvite.current !== match.id) {
      lastInvite.current = match.id;
      setVisible(true);
    }
  }, [match?.id, match?.status, view.side, isOwner]);

  useEffect(() => {
    if (!visible || !roomId) return undefined;
    let alive = true;
    setLoading(true);
    Promise.allSettled([apiUtil.get(`${base}/opponents`), apiUtil.get(`${base}/history`)]).then(results => {
      if (!alive) return;
      if (results[0].status === 'fulfilled') setOpponents(results[0].value.data?.data || []);
      if (results[1].status === 'fulfilled') setHistory(results[1].value.data?.data || []);
      if (results.every(result => result.status === 'rejected')) setError('Could not load PK rooms. Please reopen to retry.');
      setLoading(false);
    });
    return () => { alive = false; };
  }, [visible, roomId, base]);

  const action = async (endpoint, body) => {
    if (busy || !isOwner) return;
    setBusy(true);
    setError('');
    const sequence = ++requestSequence.current;
    const requestedRoom = roomId;
    try {
      const response = await apiUtil.post(`${base}${endpoint}`, body);
      if (currentRoom.current === requestedRoom && sequence === requestSequence.current) apply(response.data?.data);
    } catch (failure) {
      if (currentRoom.current === requestedRoom) setError(failure.response?.data?.message || failure.message || 'PK request failed. Please try again.');
    } finally { setBusy(false); }
  };

  const sendUserInvite = value => {
    const rawVal = String(value || '').trim();
    if (!rawVal) { setError('Enter User ID of an active user in this room.'); return; }

    const foundInRoom = roomCandidates.some(c =>
      String(c.userId) === rawVal ||
      String(c.id) === rawVal ||
      String(c._id) === rawVal
    );
    if (!foundInRoom && roomCandidates.length > 0) {
      setError('User must be in this room for User PK.');
      return;
    }

    action('/invite', {
      targetUserId: rawVal,
      targetRoomId: rawVal,
      durationSeconds: selectedDuration,
      pkType: 'user',
    });
  };

  const sendRoomInvite = value => {
    const rawVal = String(value || '').trim();
    if (!rawVal) { setError('Enter Opponent Room ID.'); return; }

    action('/invite', {
      targetRoomId: rawVal,
      durationSeconds: selectedDuration,
      pkType: 'room',
    });
  };

  const sendInvite = value => {
    if (selectedType === 'user') {
      sendUserInvite(value);
    } else {
      sendRoomInvite(value);
    }
  };
  const respond = decision => action(`/${match.id}/respond`, { decision });
  const inProgress = match && ['invited', 'active'].includes(match.status);
  const showResult = match?.status === 'finished' && now + offset - new Date(match.finishedAt).getTime() < 90000;

  const scoreCard = compact => {
    if (!match) return null;
    const scoreTotal = Math.max(1, Number(match.scores?.[0] || 0) + Number(match.scores?.[1] || 0));
    const durationMin = Math.round((match.durationSeconds || 300) / 60);
    const pkTypeLabel = match.pkType === 'user' ? 'User PK' : 'Room PK';

    return <View testID="pk-scoreboard" style={[styles.scoreCard, compact && styles.compactCard]}>
      <View style={styles.scoreTeams}>
        {[0, 1].map(side => <View key={side} style={styles.team}>
          {Boolean(match.rooms?.[side]?.coverImage) && <Image source={{ uri: match.rooms[side].coverImage }} style={styles.avatar} />}
          <View style={styles.teamCopy}>
            <Text numberOfLines={1} style={styles.teamName}>{match.rooms?.[side]?.title || `Room ${side + 1}`}</Text>
            <Text style={[styles.score, { color: side ? '#67E8F9' : '#FDA4AF' }]}>{Number(match.scores?.[side] || 0).toLocaleString()}</Text>
          </View>
        </View>)}
      </View>
      <View style={styles.progressTrack}>
        <View style={{ flex: Math.max(0.01, Number(match.scores?.[0] || 0) / scoreTotal), backgroundColor: '#F43F5E' }} />
        <View style={{ flex: Math.max(0.01, Number(match.scores?.[1] || 0) / scoreTotal), backgroundColor: '#06B6D4' }} />
      </View>

      {/* Top 1, Top 2, Top 3 Contributors - ONLY Avatars, NO Names */}
      <View style={styles.contributorsRow}>
        <View style={styles.sideContributors}>
          {(match.leftContributors && match.leftContributors.length > 0
            ? match.leftContributors
            : [{ avatar: null }, { avatar: null }, { avatar: null }]
          ).slice(0, 3).map((item, idx) => (
            <View key={idx} style={[styles.contribAvatarWrap, styles.contribLeftWrap]}>
              {item.avatar ? (
                <Image source={{ uri: item.avatar }} style={styles.contribAvatar} />
              ) : (
                <View style={[styles.contribAvatar, styles.contribPlaceholder]}>
                  <Text style={styles.contribRankNum}>{idx + 1}</Text>
                </View>
              )}
              <View style={[styles.rankBadge, idx === 0 ? styles.rank1 : idx === 1 ? styles.rank2 : styles.rank3]}>
                <Text style={styles.rankBadgeText}>{idx + 1}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.sideContributors, { justifyContent: 'flex-end' }]}>
          {(match.rightContributors && match.rightContributors.length > 0
            ? match.rightContributors
            : [{ avatar: null }, { avatar: null }, { avatar: null }]
          ).slice(0, 3).map((item, idx) => (
            <View key={idx} style={[styles.contribAvatarWrap, styles.contribRightWrap]}>
              {item.avatar ? (
                <Image source={{ uri: item.avatar }} style={styles.contribAvatar} />
              ) : (
                <View style={[styles.contribAvatar, styles.contribPlaceholder]}>
                  <Text style={styles.contribRankNum}>{idx + 1}</Text>
                </View>
              )}
              <View style={[styles.rankBadge, idx === 0 ? styles.rank1 : idx === 1 ? styles.rank2 : styles.rank3]}>
                <Text style={styles.rankBadgeText}>{idx + 1}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <Text testID="pk-timer" style={styles.timer}>
        {view.result ? `${view.result === 'WINNER' ? '🏆 ' : ''}${view.result}` : match.status === 'invited'
          ? `Invitation • ${view.timer}` : view.remaining ? `PK • ${view.timer}` : 'Calculating result…'}
      </Text>
      {!compact && <Text style={styles.caption}>Gift Coins determine the score • {durationMin}-min {pkTypeLabel}</Text>}
    </View>;
  };

  return <>
    {inProgress || showResult ? <TouchableOpacity testID="room-pk-open" activeOpacity={0.85} onPress={() => setVisible(true)}>{scoreCard(true)}</TouchableOpacity>
      : <TouchableOpacity testID="room-pk-open" style={styles.pkButton} onPress={() => setVisible(true)}>
        <Text style={styles.pkButtonText}>PK</Text>
      </TouchableOpacity>}
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setVisible(false)}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setVisible(false)} accessibilityLabel="Close PK" />
        <View style={[styles.sheet, { paddingBottom: bottomSafePadding + 16 }]}>
          <View style={styles.header}>
            <View><Text style={styles.title}>PK BATTLE</Text><Text style={styles.caption}>Room PK & User PK</Text></View>
            <TouchableOpacity onPress={() => setVisible(false)} accessibilityLabel="Close PK panel"><Icon name="close" color="#CBD5E1" size={26} /></TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {scoreCard(false)}
            {match?.status === 'invited' && <View style={styles.inviteCard}>
              <Text style={styles.body}>
                {match.pkType === 'user'
                  ? (view.side === 1 || String(currentUser?._id || currentUser?.id) === String(match.rooms?.[1]?.ownerId)
                      ? `${match.rooms?.[0]?.title || 'Host'} challenged you to ${Math.round((match.durationSeconds || 300) / 60)}-min User PK!`
                      : 'Waiting for challenged user to accept…')
                  : (view.side === 1
                      ? `${match.rooms?.[0]?.title} challenged you to ${Math.round((match.durationSeconds || 300) / 60)}-min Room PK!`
                      : 'Waiting for the other room owner to accept…')
                }
              </Text>
              {view.remaining > 0 && <View style={styles.actions}>
                {(view.side === 1 || String(currentUser?._id || currentUser?.id) === String(match.rooms?.[1]?.ownerId)) ? <>
                  <TouchableOpacity testID="pk-decline" disabled={busy} style={styles.secondary} onPress={() => respond('decline')}><Text style={styles.body}>Decline</Text></TouchableOpacity>
                  <TouchableOpacity testID="pk-accept" disabled={busy} style={styles.primary} onPress={() => respond('accept')}><Text style={styles.primaryText}>Accept PK</Text></TouchableOpacity>
                </> : (isOwner ? <TouchableOpacity testID="pk-cancel" disabled={busy} style={styles.secondary} onPress={() => respond('cancel')}><Text style={styles.body}>Cancel invitation</Text></TouchableOpacity> : null)}
              </View>}
            </View>}
            {match?.status === 'active' && <Text style={styles.hint}>Send gifts to your team to support your side. Top 3 senders are ranked above.</Text>}
            {['declined', 'cancelled', 'expired'].includes(match?.status) && <Text style={styles.hint}>PK invitation {match.status}.</Text>}
            {Boolean(error) && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
            {busy && <ActivityIndicator color="#38BDF8" style={styles.loader} />}
            {!inProgress && <>
              <Text style={styles.sectionTitle}>PK Battle Settings</Text>

              {/* PK Mode Options: Room PK vs User PK */}
              <View style={styles.selectorGroup}>
                <Text style={styles.selectorLabel}>Battle Mode</Text>
                <View style={styles.pillRow}>
                  <TouchableOpacity
                    testID="pk-mode-room"
                    style={[styles.optionPill, selectedType === 'room' && styles.optionPillActive]}
                    onPress={() => setSelectedType('room')}
                  >
                    <Icon name="people" size={14} color={selectedType === 'room' ? '#FFF' : '#94A3B8'} style={{ marginRight: 4 }} />
                    <Text style={[styles.optionPillText, selectedType === 'room' && styles.optionPillTextActive]}>Room PK</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    testID="pk-mode-user"
                    style={[styles.optionPill, selectedType === 'user' && styles.optionPillActive]}
                    onPress={() => setSelectedType('user')}
                  >
                    <Icon name="person" size={14} color={selectedType === 'user' ? '#FFF' : '#94A3B8'} style={{ marginRight: 4 }} />
                    <Text style={[styles.optionPillText, selectedType === 'user' && styles.optionPillTextActive]}>User PK</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* PK Duration Options: 5 min, 15 min, 30 min */}
              <View style={styles.selectorGroup}>
                <Text style={styles.selectorLabel}>PK Duration</Text>
                <View style={styles.pillRow}>
                  {[
                    { label: '5 min', seconds: 300 },
                    { label: '15 min', seconds: 900 },
                    { label: '30 min', seconds: 1800 },
                  ].map(opt => (
                    <TouchableOpacity
                      key={opt.seconds}
                      style={[styles.optionPill, selectedDuration === opt.seconds && styles.optionPillActive]}
                      onPress={() => setSelectedDuration(opt.seconds)}
                    >
                      <Icon name="time-outline" size={14} color={selectedDuration === opt.seconds ? '#FFF' : '#94A3B8'} style={{ marginRight: 4 }} />
                      <Text style={[styles.optionPillText, selectedDuration === opt.seconds && styles.optionPillTextActive]}>{opt.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {selectedType === 'user' ? (
                <>
                  <Text style={styles.sectionTitle}>Challenge User in Room (User PK)</Text>
                  <Text style={styles.hint}>User PK is a 1v1 battle with an active user in this room.</Text>
                  {isOwner && (
                    <View style={styles.idRow}>
                      <TextInput
                        testID="pk-user-id"
                        value={targetUserId}
                        onChangeText={setTargetUserId}
                        placeholder="Enter Room User ID"
                        placeholderTextColor="#64748B"
                        autoCapitalize="none"
                        keyboardType="numeric"
                        style={styles.input}
                        editable={!busy}
                      />
                      <TouchableOpacity
                        testID="pk-send-invite"
                        disabled={busy}
                        style={styles.primary}
                        onPress={() => sendUserInvite(targetUserId)}
                      >
                        <Text style={styles.primaryText}>Invite User</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {roomCandidates.length === 0 ? (
                    <Text style={styles.hint}>No other users in this room right now. Invite friends to join your room first.</Text>
                  ) : (
                    roomCandidates.map(candidate => (
                      <TouchableOpacity
                        key={candidate.id}
                        disabled={!isOwner || busy}
                        style={styles.opponent}
                        onPress={() => {
                          setTargetUserId(String(candidate.userId));
                          sendUserInvite(String(candidate.userId));
                        }}
                      >
                        {Boolean(candidate.avatar) ? (
                          <Image source={{ uri: candidate.avatar }} style={styles.avatar} />
                        ) : (
                          <View style={[styles.avatar, styles.avatarPlaceholder]}>
                            <Icon name="person" size={18} color="#94A3B8" />
                          </View>
                        )}
                        <View style={styles.teamCopy}>
                          <Text style={styles.teamName}>{candidate.name}</Text>
                          <Text style={styles.caption}>
                            {candidate.isSeated ? `Mic #${candidate.seatIndex + 1}` : 'In Room'} • User ID: {candidate.userId}
                          </Text>
                        </View>
                        {isOwner && <Text style={styles.inviteLink}>Invite</Text>}
                      </TouchableOpacity>
                    ))
                  )}
                </>
              ) : (
                <>
                  <Text style={styles.sectionTitle}>Challenge Opponent Room (Room PK)</Text>
                  {!isOwner && <Text style={styles.hint}>Only the host can send or accept PK invitations with other live rooms.</Text>}
                  {isOwner && (
                    <View style={styles.idRow}>
                      <TextInput
                        testID="pk-room-id"
                        value={targetRoomId}
                        onChangeText={setTargetRoomId}
                        placeholder="Enter Opponent Room ID"
                        placeholderTextColor="#64748B"
                        autoCapitalize="none"
                        style={styles.input}
                        editable={!busy}
                      />
                      <TouchableOpacity
                        testID="pk-send-invite-room"
                        disabled={busy}
                        style={styles.primary}
                        onPress={() => sendRoomInvite(targetRoomId)}
                      >
                        <Text style={styles.primaryText}>Invite Room</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {loading && <ActivityIndicator color="#38BDF8" style={styles.loader} />}
                  {!loading && !opponents.length && (
                    <Text style={styles.hint}>No active opponent rooms available right now. Invite another host to start a live session.</Text>
                  )}
                  {opponents.map(opponent => {
                    const opponentRoomId = opponent.id || opponent.roomId || '';
                    return (
                      <TouchableOpacity
                        key={opponent.id}
                        disabled={!isOwner || busy}
                        style={styles.opponent}
                        onPress={() => {
                          setTargetRoomId(opponentRoomId);
                          sendRoomInvite(opponentRoomId);
                        }}
                      >
                        {Boolean(opponent.coverImage) && <Image source={{ uri: opponent.coverImage }} style={styles.avatar} />}
                        <View style={styles.teamCopy}>
                          <Text style={styles.teamName}>{opponent.title || opponent.hostName}</Text>
                          <Text style={styles.caption}>{opponent.hostName} • Room ID: {opponentRoomId}</Text>
                        </View>
                        {isOwner && <Text style={styles.inviteLink}>Invite</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </>
              )}
            </>}
            {history.length > 0 && <><Text style={styles.sectionTitle}>Recent results</Text>
              {history.map(record => {
                const result = roomPKView(record, roomId).result;
                return <View key={record.id} style={styles.historyRow}>
                  <Text numberOfLines={1} style={styles.historyTitle}>{record.rooms?.map(room => room.title).join(' vs ')}</Text>
                  <Text style={[styles.historyResult, { color: result === 'WINNER' ? '#FDE047' : result === 'DRAW' ? '#CBD5E1' : '#FDA4AF' }]}>{result} • {record.scores?.join(' : ')}</Text>
                </View>;
              })}
            </>}
          </ScrollView>
        </View>
      </View>
    </Modal>
  </>;
}

const styles = StyleSheet.create({
  pkButton: { alignSelf: 'center', borderWidth: 1.5, borderColor: '#38BDF8', borderRadius: 18, backgroundColor: '#10233D', paddingHorizontal: 23, paddingVertical: 5, marginVertical: 5 },
  pkButtonText: { color: '#38BDF8', fontWeight: '900', fontSize: 16, fontStyle: 'italic' },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.65)' },
  sheet: { maxHeight: '85%', backgroundColor: '#0F172A', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 18, borderWidth: 1, borderColor: '#334155' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  title: { color: '#F8FAFC', fontWeight: '900', letterSpacing: 2, fontSize: 23 },
  caption: { color: '#94A3B8', fontSize: 11, marginTop: 4 },
  scoreCard: { borderWidth: 1, borderColor: '#475569', borderRadius: 16, backgroundColor: '#15213B', padding: 12, marginBottom: 8 },
  compactCard: { paddingVertical: 7, marginHorizontal: 10, marginVertical: 5 },
  scoreTeams: { flexDirection: 'row', gap: 10 },
  team: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7, minWidth: 0 },
  teamCopy: { flex: 1, minWidth: 0 },
  teamName: { color: '#F1F5F9', fontSize: 12, fontWeight: '700' },
  score: { fontSize: 22, fontWeight: '900' },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#334155' },
  avatarPlaceholder: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#334155', alignItems: 'center', justifyContent: 'center' },
  progressTrack: { height: 5, borderRadius: 4, overflow: 'hidden', flexDirection: 'row', marginTop: 6 },
  timer: { color: '#FDE047', fontSize: 12, fontWeight: '900', textAlign: 'center', marginTop: 5 },
  inviteCard: { padding: 12, backgroundColor: '#1E293B', borderRadius: 12, marginVertical: 8 },
  body: { color: '#E2E8F0', fontSize: 13 },
  hint: { color: '#94A3B8', fontSize: 12, lineHeight: 19, marginVertical: 10 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  primary: { backgroundColor: '#0284C7', borderRadius: 10, paddingHorizontal: 18, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#FFF', fontWeight: '800', fontSize: 13 },
  secondary: { borderWidth: 1, borderColor: '#475569', borderRadius: 10, padding: 12 },
  sectionTitle: { color: '#E2E8F0', fontWeight: '800', fontSize: 15, marginTop: 17, marginBottom: 10 },
  idRow: { flexDirection: 'row', gap: 8 },
  input: { flex: 1, minWidth: 0, backgroundColor: '#1E293B', borderColor: '#334155', borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, color: '#FFF' },
  opponent: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 12, backgroundColor: '#1E293B', borderRadius: 12, marginTop: 8 },
  inviteLink: { color: '#38BDF8', fontSize: 12, fontWeight: '800' },
  error: { color: '#FDA4AF', fontSize: 12, marginVertical: 10 },
  loader: { marginVertical: 12 },
  historyRow: { borderTopWidth: 1, borderColor: '#334155', paddingVertical: 10 },
  historyTitle: { color: '#E2E8F0', fontSize: 12 },
  historyResult: { fontSize: 12, marginTop: 4, fontWeight: '700' },
  // Contributors Row (Top 1, Top 2, Top 3 - Only Avatars)
  contributorsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingHorizontal: 4 },
  sideContributors: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  contribAvatarWrap: { position: 'relative', width: 28, height: 28 },
  contribLeftWrap: {},
  contribRightWrap: {},
  contribAvatar: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: '#38BDF8' },
  contribPlaceholder: { backgroundColor: '#1E293B', alignItems: 'center', justifyContent: 'center', borderColor: '#475569' },
  contribRankNum: { color: '#64748B', fontSize: 10, fontWeight: '800' },
  rankBadge: { position: 'absolute', bottom: -2, right: -2, width: 13, height: 13, borderRadius: 6.5, alignItems: 'center', justifyContent: 'center' },
  rankBadgeText: { color: '#FFF', fontSize: 8, fontWeight: '900' },
  rank1: { backgroundColor: '#EAB308' },
  rank2: { backgroundColor: '#94A3B8' },
  rank3: { backgroundColor: '#B45309' },
  // Selectors for Mode & Duration
  selectorGroup: { marginBottom: 14 },
  selectorLabel: { color: '#94A3B8', fontSize: 12, fontWeight: '700', marginBottom: 6 },
  pillRow: { flexDirection: 'row', gap: 8 },
  optionPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  optionPillActive: { backgroundColor: '#0284C7', borderColor: '#38BDF8' },
  optionPillText: { color: '#94A3B8', fontSize: 12, fontWeight: '700' },
  optionPillTextActive: { color: '#FFF', fontWeight: '900' },
});
