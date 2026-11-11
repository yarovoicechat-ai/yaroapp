import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { apiUtil } from '../../utils/apiUtil';
import { getSocket } from '../../sockets';
import { normalizePKRoomId, roomPKView } from '../../utils/roomPkState';

export default function RoomPKPanel({ roomId, isOwner = false, bottomSafePadding = 16 }) {
  const [match, setMatch] = useState(null);
  const [visible, setVisible] = useState(false);
  const [opponents, setOpponents] = useState([]);
  const [history, setHistory] = useState([]);
  const [target, setTarget] = useState('');
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
    lastSnapshot.current = null;
    setMatch(null);
    setError('');
    const handleState = data => {
      if (!alive || !data?.roomIds?.includes(normalizePKRoomId(roomId))) return;
      requestSequence.current++;
      apply(data);
    };
    const poll = async () => {
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
    };
    poll();
    const interval = setInterval(poll, 3000);
    const clock = setInterval(() => setNow(Date.now()), 250);
    return () => { alive = false; clearInterval(interval); clearInterval(clock); attached?.off('room_pk:state', handleState); };
  }, [roomId, base, apply]);

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

  const sendInvite = value => {
    if (!String(value || '').trim()) { setError('Enter the other room ID or select a live room.'); return; }
    action('/invite', { targetRoomId: String(value).trim() });
  };
  const respond = decision => action(`/${match.id}/respond`, { decision });
  const inProgress = match && ['invited', 'active'].includes(match.status);
  const showResult = match?.status === 'finished' && now + offset - new Date(match.finishedAt).getTime() < 90000;

  const scoreCard = compact => {
    if (!match) return null;
    const scoreTotal = Math.max(1, Number(match.scores?.[0] || 0) + Number(match.scores?.[1] || 0));
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
      <Text testID="pk-timer" style={styles.timer}>
        {view.result ? `${view.result === 'WINNER' ? '🏆 ' : ''}${view.result}` : match.status === 'invited'
          ? `Invitation • ${view.timer}` : view.remaining ? `PK • ${view.timer}` : 'Calculating result…'}
      </Text>
      {!compact && <Text style={styles.caption}>Gift Coins determine the score • 5-minute PK</Text>}
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
            <View><Text style={styles.title}>ROOM PK</Text><Text style={styles.caption}>Room vs room • 5 minutes</Text></View>
            <TouchableOpacity onPress={() => setVisible(false)} accessibilityLabel="Close PK panel"><Icon name="close" color="#CBD5E1" size={26} /></TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {scoreCard(false)}
            {match?.status === 'invited' && <View style={styles.inviteCard}>
              <Text style={styles.body}>{view.side === 1 ? `${match.rooms?.[0]?.title} challenged your room!` : 'Waiting for the other room owner to accept…'}</Text>
              {isOwner && view.remaining > 0 && <View style={styles.actions}>
                {view.side === 1 ? <>
                  <TouchableOpacity testID="pk-decline" disabled={busy} style={styles.secondary} onPress={() => respond('decline')}><Text style={styles.body}>Decline</Text></TouchableOpacity>
                  <TouchableOpacity testID="pk-accept" disabled={busy} style={styles.primary} onPress={() => respond('accept')}><Text style={styles.primaryText}>Accept PK</Text></TouchableOpacity>
                </> : <TouchableOpacity testID="pk-cancel" disabled={busy} style={styles.secondary} onPress={() => respond('cancel')}><Text style={styles.body}>Cancel invitation</Text></TouchableOpacity>}
              </View>}
            </View>}
            {match?.status === 'active' && <Text style={styles.hint}>Send gifts to your room's seated speakers to support your team. The server closes scoring after 5 minutes.</Text>}
            {['declined', 'cancelled', 'expired'].includes(match?.status) && <Text style={styles.hint}>PK invitation {match.status}.</Text>}
            {Boolean(error) && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
            {busy && <ActivityIndicator color="#38BDF8" style={styles.loader} />}
            {!inProgress && <>
              <Text style={styles.sectionTitle}>Challenge a live room</Text>
              {!isOwner && <Text style={styles.hint}>Only the room owner can send or accept PK invitations.</Text>}
              {isOwner && <View style={styles.idRow}>
                <TextInput testID="pk-room-id" value={target} onChangeText={setTarget} placeholder="Other room ID" placeholderTextColor="#64748B"
                  autoCapitalize="none" style={styles.input} editable={!busy} />
                <TouchableOpacity testID="pk-send-invite" disabled={busy} style={styles.primary} onPress={() => sendInvite(target)}><Text style={styles.primaryText}>Invite</Text></TouchableOpacity>
              </View>}
              {loading && <ActivityIndicator color="#38BDF8" style={styles.loader} />}
              {!loading && !opponents.length && <Text style={styles.hint}>No available live rooms right now. Ask another room owner to come online.</Text>}
              {opponents.map(opponent => <TouchableOpacity key={opponent.id} disabled={!isOwner || busy} style={styles.opponent}
                onPress={() => sendInvite(opponent.id)}>
                {Boolean(opponent.coverImage) && <Image source={{ uri: opponent.coverImage }} style={styles.avatar} />}
                <View style={styles.teamCopy}><Text style={styles.teamName}>{opponent.title}</Text><Text style={styles.caption}>{opponent.hostName} • {opponent.id}</Text></View>
                {isOwner && <Text style={styles.inviteLink}>Invite</Text>}
              </TouchableOpacity>)}
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
});
