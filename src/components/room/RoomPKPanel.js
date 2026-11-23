import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
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
    if (openTrigger > 0) setVisible(true);
  }, [openTrigger]);

  // Main navigation: 'vote' | 'personal' | 'team' | 'history'
  const [activeTab, setActiveTab] = useState('personal');

  // Configuration state
  const [selectedDuration, setSelectedDuration] = useState(300); // 60, 180, 300, 600, 1800
  const [jackpotEnabled, setJackpotEnabled] = useState(false);
  const [selectedGift, setSelectedGift] = useState(null); // null = any gift counts
  const [personalTargetUserId, setPersonalTargetUserId] = useState('');

  const [crossRoomId, setCrossRoomId] = useState('');
  const handleCrossRoomInvite = (targetRoom) => {
    const raw = String(targetRoom || crossRoomId || '').trim();
    if (!raw) {
      setError('Enter Opponent Room ID.');
      return;
    }
    executeApi('/invite', {
      targetRoomId: raw,
      pkType: 'room',
      durationSeconds: selectedDuration,
    });
  };

  // Vote PK participants
  const [voteParticipantA, setVoteParticipantA] = useState(null);
  const [voteParticipantB, setVoteParticipantB] = useState(null);

  // Team PK rosters: Yellow Team (Team A) vs Blue Team (Team B)
  const [teamA, setTeamA] = useState([]);
  const [teamB, setTeamB] = useState([]);

  // Catalog & History state
  const [giftCatalog, setGiftCatalog] = useState([]);
  const [history, setHistory] = useState([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [votingBusy, setVotingBusy] = useState(false);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());
  const [offset, setOffset] = useState(0);

  const requestSequence = useRef(0);
  const currentRoom = useRef(roomId);
  currentRoom.current = roomId;
  const lastSnapshot = useRef(null);
  const base = `/voice-club/rooms/${encodeURIComponent(roomId || '')}/pk`;

  // Candidates inside the room (seats + audience, excluding current user)
  const roomCandidates = useMemo(() => {
    const map = new Map();
    const myIds = new Set([
      String(currentUser?._id || ''),
      String(currentUser?.id || ''),
      String(currentUser?.userId || ''),
    ].filter(Boolean));

    const isMe = (u) => [String(u?._id || ''), String(u?.id || ''), String(u?.userId || '')].some(id => id && myIds.has(id));

    // 1. Add seated users
    (roomSeats || []).forEach(seat => {
      if (seat?.user && !isMe(seat.user)) {
        const u = seat.user;
        const uid = String(u.userId || u._id || u.id || '');
        if (uid) {
          map.set(uid, {
            id: uid,
            _id: u._id || u.id,
            userId: u.userId || uid,
            name: u.name || `Mic #${(seat.seatIndex ?? 0) + 1}`,
            avatar: u.avatar || u.image || '',
            isSeated: true,
            seatIndex: seat.seatIndex ?? 0,
          });
        }
      }
    });

    // 2. Add audience users
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
            seatIndex: -1,
          });
        }
      }
    });

    return Array.from(map.values());
  }, [roomSeats, roomUsers, currentUser]);

  // Visual 10-seat representation (seats 1 through 10)
  const roomTenSeats = useMemo(() => {
    const result = [];
    for (let i = 0; i < 10; i++) {
      const seat = (roomSeats || []).find(s => s?.seatIndex === i);
      if (seat && seat.user) {
        result.push({
          seatNumber: i + 1,
          seatIndex: i,
          isEmpty: false,
          user: {
            id: String(seat.user._id || seat.user.id || seat.user.userId),
            userId: String(seat.user.userId || seat.user.id || seat.user._id),
            name: seat.user.name || `Mic #${i + 1}`,
            avatar: seat.user.avatar || seat.user.image || '',
            seatIndex: i,
          },
        });
      } else {
        result.push({
          seatNumber: i + 1,
          seatIndex: i,
          isEmpty: true,
          user: null,
        });
      }
    }
    return result;
  }, [roomSeats]);

  const applySnapshot = useCallback(data => {
    if (data && !data.roomIds?.includes(normalizePKRoomId(roomId))) return;
    const previous = lastSnapshot.current;
    if (data && previous?.id === data.id && new Date(previous.updatedAt).getTime() > new Date(data.updatedAt).getTime()) return;
    lastSnapshot.current = data;
    setMatch(data);
    if (data?.serverNow) setOffset(Number(data.serverNow) - Date.now());
  }, [roomId]);

  // Real-time Socket.IO listener and periodic sync
  useEffect(() => {
    if (!roomId) return;
    let alive = true;
    let attached = null;
    let inflight = false;
    lastSnapshot.current = null;
    setMatch(null);
    setError('');

    const handleState = payload => {
      if (alive && payload?.roomIds?.includes(normalizePKRoomId(roomId))) {
        requestSequence.current++;
        applySnapshot(payload);
      }
    };

    const syncState = async () => {
      if (inflight || !alive || AppState?.currentState === 'background') return;
      inflight = true;
      const socket = getSocket();
      if (socket && socket !== attached) {
        attached?.off('room_pk:state', handleState);
        attached = socket;
        socket.on('room_pk:state', handleState);
      }
      const seq = ++requestSequence.current;
      try {
        const response = await apiUtil.get(base);
        if (alive && seq === requestSequence.current) {
          applySnapshot(response.data?.data || null);
        }
      } catch (e) {
        // Silent failure for background polling
      } finally {
        inflight = false;
      }
    };

    syncState();
    const interval = setInterval(syncState, 15000);
    const foreground = AppState.addEventListener('change', state => {
      if (state === 'active') syncState();
    });

    return () => {
      alive = false;
      clearInterval(interval);
      foreground.remove();
      attached?.off('room_pk:state', handleState);
    };
  }, [roomId, base, applySnapshot]);

  // Ticking local clock for smooth countdown
  const isPKActive = Boolean(match);
  useEffect(() => {
    if (isPKActive || visible) {
      const clock = setInterval(() => {
        if (AppState?.currentState !== 'background') setNow(Date.now());
      }, 1000);
      return () => clearInterval(clock);
    }
  }, [isPKActive, visible]);

  // Fetch gift catalog and history when opening panel
  useEffect(() => {
    if (visible && roomId) {
      let alive = true;
      setLoading(true);
      Promise.allSettled([
        apiUtil.get('/gift/all'),
        apiUtil.get(`${base}/history`),
      ]).then(([giftRes, histRes]) => {
        if (!alive) return;
        if (giftRes.status === 'fulfilled') {
          const list = giftRes.value?.data?.data || giftRes.value?.data || [];
          setGiftCatalog(Array.isArray(list) ? list : []);
        }
        if (histRes.status === 'fulfilled') {
          setHistory(histRes.value?.data?.data || []);
        }
        setLoading(false);
      });
      return () => { alive = false; };
    }
  }, [visible, roomId, base]);

  const view = roomPKView(match, roomId, now, offset);

  // API Call helper
  const executeApi = async (endpoint, payload) => {
    if (busy || !isOwner) return;
    setBusy(true);
    setError('');
    const seq = ++requestSequence.current;
    const targetRoom = roomId;
    try {
      const response = await apiUtil.post(`${base}${endpoint}`, payload);
      if (currentRoom.current === targetRoom && seq === requestSequence.current) {
        applySnapshot(response.data?.data);
      }
    } catch (e) {
      if (currentRoom.current === targetRoom) {
        setError(e.response?.data?.message || e.message || 'PK operation failed. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  // 1. Start Vote PK
  const handleStartVotePK = () => {
    if (!voteParticipantA || !voteParticipantB) {
      setError('Please select both Side A and Side B participants for Vote PK.');
      return;
    }
    if (String(voteParticipantA.userId) === String(voteParticipantB.userId)) {
      setError('Side A and Side B must be different participants.');
      return;
    }
    executeApi('/create', {
      pkMode: 'vote',
      durationSeconds: selectedDuration,
      participantA: voteParticipantA,
      participantB: voteParticipantB,
      jackpotEnabled,
    });
  };

  // 2. Start Personal Gift PK
  const handleStartPersonalPK = (targetId) => {
    const rawVal = String(targetId || personalTargetUserId || '').trim();
    if (!rawVal) {
      setError('Enter or select an active user in this room for Personal PK.');
      return;
    }
    const foundInRoom = roomCandidates.some(c =>
      String(c.userId) === rawVal || String(c.id) === rawVal || String(c._id) === rawVal
    );
    if (!foundInRoom && roomCandidates.length > 0) {
      setError('User must be in this room for User PK.');
      return;
    }
    executeApi('/invite', {
      pkMode: 'personal',
      pkType: 'user',
      targetRoomId: rawVal,
      targetUserId: rawVal,
      durationSeconds: selectedDuration,
      selectedGiftId: selectedGift?._id || selectedGift?.id || null,
      jackpotEnabled,
    });
  };

  // 3. Start Team Gift PK
  const handleStartTeamPK = () => {
    if (!teamA.length || !teamB.length) {
      setError('Please assign at least one member to both Yellow Team and Blue Team.');
      return;
    }
    executeApi('/create', {
      pkMode: 'team',
      durationSeconds: selectedDuration,
      teamA,
      teamB,
      selectedGiftId: selectedGift?._id || selectedGift?.id || null,
      jackpotEnabled,
    });
  };

  // Cast Audience Vote
  const handleVote = async (side) => {
    if (votingBusy) return;
    setVotingBusy(true);
    setError('');
    try {
      const response = await apiUtil.post(`${base}/vote`, { side });
      applySnapshot(response.data?.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to submit vote. Only one vote per user.');
    } finally {
      setVotingBusy(false);
    }
  };

  // Host Cancel PK
  const handleCancelPK = () => {
    if (!match?.id) return;
    executeApi(`/${match.id}/cancel`, {});
  };

  // Team Seat Assignment Helpers
  const assignToTeam = (member, teamColor) => {
    const uid = String(member.userId || member.id);
    if (teamColor === 'yellow') {
      setTeamB(prev => prev.filter(m => String(m.userId || m.id) !== uid));
      setTeamA(prev => {
        if (prev.some(m => String(m.userId || m.id) === uid)) return prev;
        return [...prev, member];
      });
    } else {
      setTeamA(prev => prev.filter(m => String(m.userId || m.id) !== uid));
      setTeamB(prev => {
        if (prev.some(m => String(m.userId || m.id) === uid)) return prev;
        return [...prev, member];
      });
    }
  };

  const removeFromTeam = (memberId, teamColor) => {
    if (teamColor === 'yellow') {
      setTeamA(prev => prev.filter(m => String(m.userId || m.id) !== String(memberId)));
    } else {
      setTeamB(prev => prev.filter(m => String(m.userId || m.id) !== String(memberId)));
    }
  };

  const isPKLive = match && ['invited', 'active'].includes(match.status);
  const isPKFinished = match?.status === 'finished' && (now + offset - new Date(match.finishedAt).getTime()) < 120000;

  // Render Contributors helper
  const renderContributors = (contributors, alignRight = false) => {
    return (
      <View style={[styles.contributorsRow, alignRight && { justifyContent: 'flex-end' }]}>
        {(contributors || []).slice(0, 3).map((item, idx) => (
          <View key={idx} style={styles.contribWrap}>
            {Boolean(item.avatar) ? (
              <Image source={{ uri: item.avatar }} style={styles.contribAvatar} />
            ) : (
              <View style={[styles.contribAvatar, styles.contribPlaceholder]}>
                <Text style={styles.contribRankNum}>#{item.seat || idx + 1}</Text>
              </View>
            )}
            <View style={[styles.rankBadge, idx === 0 ? styles.rank1 : idx === 1 ? styles.rank2 : styles.rank3]}>
              <Text style={styles.rankBadgeText}>{idx + 1}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  // LIVE SCOREBOARD & BATTLE AREA
  const renderLiveScoreboard = (compact = false) => {
    if (!match) return null;
    const mode = match.pkMode || (match.pkType === 'room' ? 'room' : 'personal');
    const isVote = mode === 'vote';
    const isTeam = mode === 'team';

    const score0 = Number(isVote ? (match.votes?.[0] || 0) : (match.scores?.[0] || 0));
    const score1 = Number(isVote ? (match.votes?.[1] || 0) : (match.scores?.[1] || 0));
    const totalScore = Math.max(1, score0 + score1);
    const pct0 = Math.round((score0 / totalScore) * 100);
    const pct1 = 100 - pct0;

    const titleA = isTeam ? 'Yellow Team' : (match.participantA?.name || match.rooms?.[0]?.title || 'Side A');
    const titleB = isTeam ? 'Blue Team' : (match.participantB?.name || match.rooms?.[1]?.title || 'Side B');
    const avatarA = isTeam ? (match.teamA?.[0]?.avatar || '') : (match.participantA?.avatar || match.rooms?.[0]?.coverImage || '');
    const avatarB = isTeam ? (match.teamB?.[0]?.avatar || '') : (match.participantB?.avatar || match.rooms?.[1]?.coverImage || '');

    return (
      <View testID="pk-scoreboard" style={[styles.scoreCard, compact && styles.compactCard]}>
        {/* Top Header: Mode & Timer */}
        <View style={styles.scoreHeaderRow}>
          <View style={styles.modeBadge}>
            <Text style={styles.modeBadgeText}>
              {isVote ? '🗳️ VOTE PK' : isTeam ? '👥 TEAM PK' : '⚔️ PERSONAL PK'}
            </Text>
          </View>
          <Text style={styles.timerText}>{view.timer}</Text>
          {isOwner && (
            <TouchableOpacity onPress={handleCancelPK} style={styles.cancelSmallBtn} activeOpacity={0.7}>
              <Text style={styles.cancelSmallBtnText}>End PK</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Selected Gift Restriction Badge */}
        {Boolean(match.selectedGift?.name) && (
          <View style={styles.giftRuleBadge}>
            <Text style={styles.giftRuleText}>
              🎁 Only "{match.selectedGift.name}" counts towards PK points!
            </Text>
          </View>
        )}

        {/* Battle Teams Area */}
        <View style={styles.scoreTeams}>
          {/* Left Side */}
          <View style={[styles.teamBox, { borderLeftColor: '#F59E0B' }]}>
            <View style={styles.teamHeaderRow}>
              {Boolean(avatarA) ? (
                <Image source={{ uri: avatarA }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.placeholderAvatar]}>
                  <Text style={styles.placeholderAvatarText}>A</Text>
                </View>
              )}
              <View style={styles.teamCopy}>
                <Text numberOfLines={1} style={styles.teamName}>{titleA}</Text>
                <Text style={[styles.scoreValue, { color: '#F59E0B' }]}>
                  {score0.toLocaleString()} {isVote ? 'Votes' : '🪙'}
                </Text>
              </View>
            </View>

            {/* Individual Team Members (Team Mode) */}
            {isTeam && (
              <View style={styles.memberListWrap}>
                {(match.teamA || []).map((m, idx) => (
                  <View key={idx} style={styles.memberChip}>
                    <Text numberOfLines={1} style={styles.memberChipName}>
                      {m.name} {m.score > 0 ? `(${m.score})` : ''}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Left Top Contributors */}
            {!isVote && renderContributors(match.leftContributors, false)}

            {/* Vote Action Button (Vote Mode) */}
            {isVote && (
              <TouchableOpacity
                testID="pk-vote-side-0"
                disabled={votingBusy}
                onPress={() => handleVote(0)}
                style={[styles.voteActionBtn, { backgroundColor: '#F59E0B' }]}
              >
                <Text style={styles.voteActionBtnText}>Vote Side A</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* VS Divider */}
          <View style={styles.vsBox}>
            <Text style={styles.vsText}>VS</Text>
          </View>

          {/* Right Side */}
          <View style={[styles.teamBox, { borderRightColor: '#38BDF8' }]}>
            <View style={[styles.teamHeaderRow, { justifyContent: 'flex-end' }]}>
              <View style={[styles.teamCopy, { alignItems: 'flex-end' }]}>
                <Text numberOfLines={1} style={styles.teamName}>{titleB}</Text>
                <Text style={[styles.scoreValue, { color: '#38BDF8' }]}>
                  {score1.toLocaleString()} {isVote ? 'Votes' : '🪙'}
                </Text>
              </View>
              {Boolean(avatarB) ? (
                <Image source={{ uri: avatarB }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.placeholderAvatar]}>
                  <Text style={styles.placeholderAvatarText}>B</Text>
                </View>
              )}
            </View>

            {/* Individual Team Members (Team Mode) */}
            {isTeam && (
              <View style={[styles.memberListWrap, { justifyContent: 'flex-end' }]}>
                {(match.teamB || []).map((m, idx) => (
                  <View key={idx} style={styles.memberChip}>
                    <Text numberOfLines={1} style={styles.memberChipName}>
                      {m.name} {m.score > 0 ? `(${m.score})` : ''}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Right Top Contributors */}
            {!isVote && renderContributors(match.rightContributors, true)}

            {/* Vote Action Button (Vote Mode) */}
            {isVote && (
              <TouchableOpacity
                testID="pk-vote-side-1"
                disabled={votingBusy}
                onPress={() => handleVote(1)}
                style={[styles.voteActionBtn, { backgroundColor: '#0284C7' }]}
              >
                <Text style={styles.voteActionBtnText}>Vote Side B</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressLeft, { flex: pct0 }]} />
          <View style={[styles.progressRight, { flex: pct1 }]} />
        </View>

        {/* Winner Announcement when finished */}
        {match.status === 'finished' && (
          <View style={styles.resultBanner}>
            <Text style={styles.resultBannerTitle}>🏆 {view.winnerLabel || 'Draw'}!</Text>
            <Text style={styles.resultBannerSub}>
              {match.draw ? 'The battle ended in a tie.' : `${view.winnerLabel} won the PK!`}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <>
      {/* Floating Trigger Button when PK is not open */}
      <TouchableOpacity
        testID="pk-toggle-panel"
        style={styles.pkButton}
        onPress={() => setVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.pkButtonText}>
          {isPKLive ? `PK • ${view.timer}` : '⚔️ ROOM PK'}
        </Text>
      </TouchableOpacity>

      {/* Main PK Modal */}
      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <View style={styles.backdrop}>
          <View style={[styles.sheet, { paddingBottom: bottomSafePadding + 14 }]}>
            {/* Modal Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>ROOM PK</Text>
                <Text style={styles.caption}>Group Voice Chat Battle Arena</Text>
              </View>
              <TouchableOpacity testID="pk-close-panel" onPress={() => setVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Icon name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Top Navigation Tabs */}
            <View style={styles.tabRow}>
              <TouchableOpacity
                testID="pk-mode-user"
                style={[styles.tabBtn, activeTab === 'personal' && styles.tabBtnActive]}
                onPress={() => setActiveTab('personal')}
              >
                <Text style={[styles.tabBtnText, activeTab === 'personal' && styles.tabBtnTextActive]}>
                  Personal Gift
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="pk-mode-room"
                style={[styles.tabBtn, activeTab === 'team' && styles.tabBtnActive]}
                onPress={() => setActiveTab('team')}
              >
                <Text style={[styles.tabBtnText, activeTab === 'team' && styles.tabBtnTextActive]}>
                  Team Gift
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="pk-tab-vote"
                style={[styles.tabBtn, activeTab === 'vote' && styles.tabBtnActive]}
                onPress={() => setActiveTab('vote')}
              >
                <Text style={[styles.tabBtnText, activeTab === 'vote' && styles.tabBtnTextActive]}>
                  Vote PK
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="pk-tab-history"
                style={[styles.tabBtn, activeTab === 'history' && styles.tabBtnActive]}
                onPress={() => setActiveTab('history')}
              >
                <Text style={[styles.tabBtnText, activeTab === 'history' && styles.tabBtnTextActive]}>
                  History
                </Text>
              </TouchableOpacity>
            </View>

            {/* Live PK scoreboard if active */}
            {isPKLive && renderLiveScoreboard(false)}

            {/* Error Message */}
            {Boolean(error) && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              {/* TAB 1: PERSONAL GIFT PK SETUP */}
              {activeTab === 'personal' && !isPKLive && (
                <View>
                  <Text style={styles.sectionTitle}>1v1 In-Room Personal PK</Text>
                  <Text style={styles.hint}>
                    Challenge another user physically present in this room to a 1v1 gift battle.
                  </Text>

                  {/* Opponent User ID Input */}
                  <View style={styles.idRow}>
                    <TextInput
                      testID="pk-user-id"
                      value={personalTargetUserId}
                      onChangeText={setPersonalTargetUserId}
                      placeholder="Enter Room User ID"
                      placeholderTextColor="#64748B"
                      autoCapitalize="none"
                      style={styles.input}
                      editable={!busy}
                    />
                    <TouchableOpacity
                      testID="pk-send-invite"
                      disabled={busy || !isOwner}
                      style={styles.primary}
                      onPress={() => handleStartPersonalPK(personalTargetUserId)}
                    >
                      <Text style={styles.primaryText}>Start PK</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Room Candidates List */}
                  <Text style={styles.subSectionTitle}>Active Users in this Room</Text>
                  {!roomCandidates.length && (
                    <Text style={styles.emptyHint}>No other users in this room yet.</Text>
                  )}
                  {roomCandidates.map(candidate => (
                    <TouchableOpacity
                      key={candidate.id}
                      disabled={!isOwner || busy}
                      style={[
                        styles.candidateCard,
                        personalTargetUserId === String(candidate.userId) && styles.candidateCardSelected,
                      ]}
                      onPress={() => {
                        setPersonalTargetUserId(String(candidate.userId));
                        handleStartPersonalPK(candidate.userId);
                      }}
                    >
                      {Boolean(candidate.avatar) ? (
                        <Image source={{ uri: candidate.avatar }} style={styles.avatar} />
                      ) : (
                        <View style={[styles.avatar, styles.placeholderAvatar]}>
                          <Text style={styles.placeholderAvatarText}>U</Text>
                        </View>
                      )}
                      <View style={styles.candidateCopy}>
                        <Text style={styles.candidateName}>{candidate.name}</Text>
                        <Text style={styles.candidateSub}>
                          User ID: {candidate.userId} • {candidate.isSeated ? `Mic #${candidate.seatIndex + 1}` : 'Audience'}
                        </Text>
                      </View>
                      <Text style={styles.inviteLink}>Select</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* TAB 2: TEAM GIFT PK SETUP */}
              {activeTab === 'team' && !isPKLive && (
                <View>
                  <Text style={styles.sectionTitle}>Team Gift PK (Yellow vs Blue)</Text>
                  <Text style={styles.hint}>
                    Select mic seat users (1-10) to form the Yellow Team and Blue Team.
                  </Text>

                  {/* 10-Seat Visual Grid */}
                  <Text style={styles.subSectionTitle}>Room Mic Seats (1 - 10)</Text>
                  <View style={styles.seatGrid}>
                    {roomTenSeats.map(seat => {
                      const isYellow = teamA.some(m => String(m.userId || m.id) === String(seat.user?.userId));
                      const isBlue = teamB.some(m => String(m.userId || m.id) === String(seat.user?.userId));
                      return (
                        <View
                          key={seat.seatNumber}
                          style={[
                            styles.seatCard,
                            isYellow && styles.seatCardYellow,
                            isBlue && styles.seatCardBlue,
                          ]}
                        >
                          <Text style={styles.seatBadgeText}>#{seat.seatNumber}</Text>
                          {seat.isEmpty ? (
                            <Text style={styles.emptySeatText}>Empty</Text>
                          ) : (
                            <>
                              {Boolean(seat.user?.avatar) ? (
                                <Image source={{ uri: seat.user.avatar }} style={styles.seatAvatar} />
                              ) : (
                                <View style={[styles.seatAvatar, styles.placeholderAvatar]}>
                                  <Text style={styles.placeholderAvatarText}>M</Text>
                                </View>
                              )}
                              <Text numberOfLines={1} style={styles.seatUserName}>{seat.user?.name}</Text>
                              <View style={styles.seatActionRow}>
                                <TouchableOpacity
                                  style={[styles.teamMiniBtn, { backgroundColor: '#F59E0B' }]}
                                  onPress={() => assignToTeam(seat.user, 'yellow')}
                                >
                                  <Text style={styles.teamMiniBtnText}>+Y</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={[styles.teamMiniBtn, { backgroundColor: '#0284C7' }]}
                                  onPress={() => assignToTeam(seat.user, 'blue')}
                                >
                                  <Text style={styles.teamMiniBtnText}>+B</Text>
                                </TouchableOpacity>
                              </View>
                            </>
                          )}
                        </View>
                      );
                    })}
                  </View>

                  {/* Team Rosters Overview */}
                  <View style={styles.rostersRow}>
                    <View style={[styles.rosterColumn, { borderColor: '#F59E0B' }]}>
                      <Text style={[styles.rosterTitle, { color: '#F59E0B' }]}>
                        Yellow Team ({teamA.length})
                      </Text>
                      {teamA.map(m => (
                        <View key={m.userId} style={styles.rosterMemberRow}>
                          <Text numberOfLines={1} style={styles.rosterMemberName}>{m.name}</Text>
                          <TouchableOpacity onPress={() => removeFromTeam(m.userId, 'yellow')}>
                            <Icon name="close-circle" size={16} color="#FDA4AF" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>

                    <View style={[styles.rosterColumn, { borderColor: '#38BDF8' }]}>
                      <Text style={[styles.rosterTitle, { color: '#38BDF8' }]}>
                        Blue Team ({teamB.length})
                      </Text>
                      {teamB.map(m => (
                        <View key={m.userId} style={styles.rosterMemberRow}>
                          <Text numberOfLines={1} style={styles.rosterMemberName}>{m.name}</Text>
                          <TouchableOpacity onPress={() => removeFromTeam(m.userId, 'blue')}>
                            <Icon name="close-circle" size={16} color="#FDA4AF" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Start Team PK Button */}
                  <TouchableOpacity
                    testID="pk-start-team"
                    disabled={busy || !isOwner || !teamA.length || !teamB.length}
                    style={[styles.fullWidthBtn, (!teamA.length || !teamB.length) && styles.btnDisabled]}
                    onPress={handleStartTeamPK}
                  >
                    <Text style={styles.primaryText}>Start Team Gift PK</Text>
                  </TouchableOpacity>

                  {/* Challenge Opponent Room (Cross-Room PK) */}
                  <Text style={styles.subSectionTitle}>Challenge Opponent Room (Cross-Room PK)</Text>
                  <View style={styles.idRow}>
                    <TextInput
                      testID="pk-room-id"
                      value={crossRoomId}
                      onChangeText={setCrossRoomId}
                      placeholder="Enter Opponent Room ID"
                      placeholderTextColor="#64748B"
                      autoCapitalize="none"
                      style={styles.input}
                      editable={!busy}
                    />
                    <TouchableOpacity
                      testID="pk-send-invite-room"
                      disabled={busy || !isOwner}
                      style={styles.primary}
                      onPress={() => handleCrossRoomInvite(crossRoomId)}
                    >
                      <Text style={styles.primaryText}>Invite Room</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* TAB 3: VOTE PK SETUP */}
              {activeTab === 'vote' && !isPKLive && (
                <View>
                  <Text style={styles.sectionTitle}>Audience Vote PK</Text>
                  <Text style={styles.hint}>
                    Select two participants from the room. Audience members can vote for free!
                  </Text>

                  {/* Selected Participants Cards */}
                  <View style={styles.rostersRow}>
                    <View style={[styles.rosterColumn, { borderColor: '#F59E0B' }]}>
                      <Text style={[styles.rosterTitle, { color: '#F59E0B' }]}>Side A Participant</Text>
                      {voteParticipantA ? (
                        <View style={styles.rosterMemberRow}>
                          <Text numberOfLines={1} style={styles.rosterMemberName}>{voteParticipantA.name}</Text>
                          <TouchableOpacity onPress={() => setVoteParticipantA(null)}>
                            <Icon name="close-circle" size={16} color="#FDA4AF" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <Text style={styles.emptyHint}>Tap user below to assign</Text>
                      )}
                    </View>

                    <View style={[styles.rosterColumn, { borderColor: '#38BDF8' }]}>
                      <Text style={[styles.rosterTitle, { color: '#38BDF8' }]}>Side B Participant</Text>
                      {voteParticipantB ? (
                        <View style={styles.rosterMemberRow}>
                          <Text numberOfLines={1} style={styles.rosterMemberName}>{voteParticipantB.name}</Text>
                          <TouchableOpacity onPress={() => setVoteParticipantB(null)}>
                            <Icon name="close-circle" size={16} color="#FDA4AF" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <Text style={styles.emptyHint}>Tap user below to assign</Text>
                      )}
                    </View>
                  </View>

                  {/* Candidates List for Vote PK */}
                  <Text style={styles.subSectionTitle}>Select Participants from Room</Text>
                  {roomCandidates.map(c => (
                    <View key={c.id} style={styles.candidateCard}>
                      {Boolean(c.avatar) ? (
                        <Image source={{ uri: c.avatar }} style={styles.avatar} />
                      ) : (
                        <View style={[styles.avatar, styles.placeholderAvatar]}>
                          <Text style={styles.placeholderAvatarText}>V</Text>
                        </View>
                      )}
                      <View style={styles.candidateCopy}>
                        <Text style={styles.candidateName}>{c.name}</Text>
                        <Text style={styles.candidateSub}>User ID: {c.userId}</Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.teamMiniBtn, { backgroundColor: '#F59E0B', marginRight: 6 }]}
                        onPress={() => setVoteParticipantA(c)}
                      >
                        <Text style={styles.teamMiniBtnText}>Side A</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.teamMiniBtn, { backgroundColor: '#0284C7' }]}
                        onPress={() => setVoteParticipantB(c)}
                      >
                        <Text style={styles.teamMiniBtnText}>Side B</Text>
                      </TouchableOpacity>
                    </View>
                  ))}

                  {/* Start Vote PK Button */}
                  <TouchableOpacity
                    testID="pk-start-vote"
                    disabled={busy || !isOwner || !voteParticipantA || !voteParticipantB}
                    style={[styles.fullWidthBtn, (!voteParticipantA || !voteParticipantB) && styles.btnDisabled]}
                    onPress={handleStartVotePK}
                  >
                    <Text style={styles.primaryText}>Start Vote PK</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* COMMON CONTROLS: DURATION, GIFT SELECTION, JACKPOT TOGGLE (for Setup) */}
              {!isPKLive && activeTab !== 'history' && (
                <View style={styles.commonOptionsWrap}>
                  {/* Duration Selector */}
                  <Text style={styles.subSectionTitle}>Duration</Text>
                  <View style={styles.pillRow}>
                    {[60, 180, 300, 600, 1800].map(sec => {
                      const label = sec === 60 ? '1 Min' : sec === 180 ? '3 Min' : sec === 300 ? '5 Min' : sec === 600 ? '10 Min' : '30 Min';
                      const isSelected = selectedDuration === sec;
                      return (
                        <TouchableOpacity
                          key={sec}
                          style={[styles.optionPill, isSelected && styles.optionPillActive]}
                          onPress={() => setSelectedDuration(sec)}
                        >
                          <Text style={[styles.optionPillText, isSelected && styles.optionPillTextActive]}>
                            {label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Jackpot Mode Toggle */}
                  <View style={styles.toggleRow}>
                    <View>
                      <Text style={styles.toggleLabel}>Jackpot Mode</Text>
                      <Text style={styles.toggleSub}>Safe tracking mode (payouts disabled without approved rules)</Text>
                    </View>
                    <Switch
                      value={jackpotEnabled}
                      onValueChange={setJackpotEnabled}
                      trackColor={{ false: '#334155', true: '#38BDF8' }}
                      thumbColor={jackpotEnabled ? '#FFF' : '#94A3B8'}
                    />
                  </View>

                  {/* Gift Catalog Selector (For Personal and Team modes) */}
                  {activeTab !== 'vote' && (
                    <View style={styles.giftSelectorWrap}>
                      <Text style={styles.subSectionTitle}>
                        Contributory Gift {selectedGift ? `(Selected: ${selectedGift.name})` : '(Any Gift)'}
                      </Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.giftCatalogRow}>
                        <TouchableOpacity
                          style={[styles.giftCard, !selectedGift && styles.giftCardActive]}
                          onPress={() => setSelectedGift(null)}
                        >
                          <Text style={styles.anyGiftIcon}>✨</Text>
                          <Text style={styles.giftName}>Any Gift</Text>
                        </TouchableOpacity>
                        {giftCatalog.slice(0, 15).map(g => {
                          const isSel = selectedGift?._id === g._id || selectedGift?.id === g._id;
                          return (
                            <TouchableOpacity
                              key={g._id}
                              style={[styles.giftCard, isSel && styles.giftCardActive]}
                              onPress={() => setSelectedGift(g)}
                            >
                              <Image source={{ uri: g.icon || g.image || g.previewUrl }} style={styles.giftIcon} />
                              <Text numberOfLines={1} style={styles.giftName}>{g.name}</Text>
                              <Text style={styles.giftPrice}>{g.price || g.cost || 0} 🪙</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  )}
                </View>
              )}

              {/* TAB 4: HISTORY */}
              {activeTab === 'history' && (
                <View>
                  <Text style={styles.sectionTitle}>Room PK History</Text>
                  {!history.length && (
                    <Text style={styles.emptyHint}>No completed PK battles in this room yet.</Text>
                  )}
                  {history.map((h, idx) => (
                    <View key={idx} style={styles.historyRow}>
                      <View style={styles.historyHeader}>
                        <Text style={styles.historyMode}>
                          {(h.pkMode || h.pkType || 'PK').toUpperCase()} • {Math.round((h.durationSeconds || 300) / 60)}m
                        </Text>
                        <Text style={styles.historyDate}>
                          {h.finishedAt ? new Date(h.finishedAt).toLocaleDateString() : ''}
                        </Text>
                      </View>
                      <Text style={styles.historyScores}>
                        Score: {h.scores?.[0] ?? 0} - {h.scores?.[1] ?? 0}
                      </Text>
                      <Text style={styles.historyResult}>
                        Winner: {h.draw ? 'Draw' : (h.winnerRoomId || 'Decided')}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pkButton: {
    alignSelf: 'center',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    borderRadius: 18,
    backgroundColor: '#10233D',
    paddingHorizontal: 18,
    paddingVertical: 5,
    marginVertical: 4,
  },
  pkButtonText: { color: '#38BDF8', fontWeight: '900', fontSize: 13, fontStyle: 'italic' },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  sheet: {
    maxHeight: '90%',
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  title: { color: '#F8FAFC', fontWeight: '900', letterSpacing: 1.5, fontSize: 20 },
  caption: { color: '#94A3B8', fontSize: 11, marginTop: 2 },
  tabRow: { flexDirection: 'row', backgroundColor: '#1E293B', borderRadius: 12, padding: 3, marginBottom: 14 },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 9 },
  tabBtnActive: { backgroundColor: '#0284C7' },
  tabBtnText: { color: '#94A3B8', fontSize: 11, fontWeight: '700' },
  tabBtnTextActive: { color: '#FFF', fontWeight: '900' },
  scrollContent: { paddingBottom: 24 },
  sectionTitle: { color: '#E2E8F0', fontWeight: '800', fontSize: 15, marginBottom: 4 },
  subSectionTitle: { color: '#94A3B8', fontSize: 12, fontWeight: '700', marginTop: 12, marginBottom: 8 },
  hint: { color: '#64748B', fontSize: 12, lineHeight: 18, marginBottom: 10 },
  emptyHint: { color: '#64748B', fontSize: 12, fontStyle: 'italic', marginVertical: 8 },
  idRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  input: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    color: '#FFF',
    fontSize: 13,
  },
  primary: { backgroundColor: '#0284C7', borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center' },
  primaryText: { color: '#FFF', fontWeight: '800', fontSize: 13 },
  fullWidthBtn: {
    backgroundColor: '#0284C7',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 14,
  },
  btnDisabled: { opacity: 0.5 },
  candidateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  candidateCardSelected: { borderColor: '#38BDF8', backgroundColor: '#1E294B' },
  candidateCopy: { flex: 1, marginLeft: 10 },
  candidateName: { color: '#F1F5F9', fontSize: 13, fontWeight: '700' },
  candidateSub: { color: '#94A3B8', fontSize: 11, marginTop: 2 },
  inviteLink: { color: '#38BDF8', fontSize: 12, fontWeight: '800' },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#334155' },
  placeholderAvatar: { justifyContent: 'center', alignItems: 'center' },
  placeholderAvatarText: { color: '#94A3B8', fontWeight: '900', fontSize: 14 },
  seatGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  seatCard: {
    width: '18%',
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    minHeight: 80,
    justifyContent: 'space-between',
  },
  seatCardYellow: { borderColor: '#F59E0B', backgroundColor: '#2A2315' },
  seatCardBlue: { borderColor: '#38BDF8', backgroundColor: '#14253D' },
  seatBadgeText: { color: '#64748B', fontSize: 9, fontWeight: '800' },
  emptySeatText: { color: '#475569', fontSize: 10, marginVertical: 14 },
  seatAvatar: { width: 26, height: 26, borderRadius: 13 },
  seatUserName: { color: '#E2E8F0', fontSize: 9, fontWeight: '700', maxWidth: 50 },
  seatActionRow: { flexDirection: 'row', gap: 2, marginTop: 2 },
  teamMiniBtn: { borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  teamMiniBtnText: { color: '#FFF', fontSize: 8, fontWeight: '900' },
  rostersRow: { flexDirection: 'row', gap: 8, marginVertical: 10 },
  rosterColumn: { flex: 1, backgroundColor: '#1E293B', borderRadius: 10, borderWidth: 1, padding: 8, minHeight: 70 },
  rosterTitle: { fontSize: 11, fontWeight: '800', marginBottom: 6 },
  rosterMemberRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 3 },
  rosterMemberName: { color: '#CBD5E1', fontSize: 11, flex: 1 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  optionPill: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  optionPillActive: { backgroundColor: '#0284C7', borderColor: '#38BDF8' },
  optionPillText: { color: '#94A3B8', fontSize: 11, fontWeight: '700' },
  optionPillTextActive: { color: '#FFF', fontWeight: '900' },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 10,
    marginVertical: 10,
  },
  toggleLabel: { color: '#E2E8F0', fontSize: 13, fontWeight: '700' },
  toggleSub: { color: '#64748B', fontSize: 10, marginTop: 2, maxWidth: 240 },
  giftSelectorWrap: { marginTop: 6 },
  giftCatalogRow: { flexDirection: 'row', gap: 8, paddingVertical: 6 },
  giftCard: {
    width: 68,
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 6,
  },
  giftCardActive: { borderColor: '#EAB308', backgroundColor: '#282315' },
  giftIcon: { width: 34, height: 34, resizeMode: 'contain' },
  anyGiftIcon: { fontSize: 24, marginVertical: 4 },
  giftName: { color: '#E2E8F0', fontSize: 9, fontWeight: '700', marginTop: 4 },
  giftPrice: { color: '#EAB308', fontSize: 8, fontWeight: '800' },
  scoreCard: {
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 16,
    backgroundColor: '#15213B',
    padding: 12,
    marginBottom: 12,
  },
  compactCard: { paddingVertical: 7, marginHorizontal: 10, marginVertical: 5 },
  scoreHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modeBadge: { backgroundColor: '#1E293B', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  modeBadgeText: { color: '#38BDF8', fontSize: 10, fontWeight: '800' },
  timerText: { color: '#FDE047', fontSize: 14, fontWeight: '900' },
  cancelSmallBtn: { backgroundColor: '#EF4444', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  cancelSmallBtnText: { color: '#FFF', fontSize: 9, fontWeight: '800' },
  giftRuleBadge: { backgroundColor: '#2E2211', borderRadius: 6, padding: 6, marginBottom: 8 },
  giftRuleText: { color: '#FDE047', fontSize: 10, fontWeight: '700', textAlign: 'center' },
  scoreTeams: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  teamBox: { flex: 1, backgroundColor: '#0F172A', borderRadius: 10, padding: 8, borderWidth: 1, borderColor: '#334155' },
  teamHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  teamCopy: { flex: 1, minWidth: 0 },
  teamName: { color: '#F1F5F9', fontSize: 12, fontWeight: '800' },
  scoreValue: { fontSize: 14, fontWeight: '900', marginTop: 2 },
  vsBox: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center' },
  vsText: { color: '#FFF', fontSize: 11, fontWeight: '900', fontStyle: 'italic' },
  memberListWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
  memberChip: { backgroundColor: '#1E293B', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2 },
  memberChipName: { color: '#CBD5E1', fontSize: 9, maxWidth: 90 },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden', flexDirection: 'row', marginTop: 10 },
  progressLeft: { backgroundColor: '#F59E0B' },
  progressRight: { backgroundColor: '#0284C7' },
  voteActionBtn: { borderRadius: 6, paddingVertical: 6, marginTop: 8, alignItems: 'center' },
  voteActionBtnText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  resultBanner: { backgroundColor: '#1E293B', borderRadius: 8, padding: 8, marginTop: 10, alignItems: 'center' },
  resultBannerTitle: { color: '#FDE047', fontSize: 14, fontWeight: '900' },
  resultBannerSub: { color: '#E2E8F0', fontSize: 11, marginTop: 2 },
  error: { color: '#FDA4AF', fontSize: 12, marginVertical: 8 },
  contributorsRow: { flexDirection: 'row', gap: 4, marginTop: 6 },
  contribWrap: { position: 'relative' },
  contribAvatar: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderColor: '#38BDF8' },
  contribPlaceholder: { backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center', borderColor: '#475569' },
  contribRankNum: { color: '#64748B', fontSize: 8, fontWeight: '800' },
  rankBadge: { position: 'absolute', bottom: -2, right: -2, width: 10, height: 10, borderRadius: 5, justifyContent: 'center', alignItems: 'center' },
  rankBadgeText: { color: '#FFF', fontSize: 7, fontWeight: '900' },
  rank1: { backgroundColor: '#EAB308' },
  rank2: { backgroundColor: '#94A3B8' },
  rank3: { backgroundColor: '#B45309' },
  historyRow: { borderTopWidth: 1, borderColor: '#334155', paddingVertical: 8 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  historyMode: { color: '#38BDF8', fontSize: 11, fontWeight: '700' },
  historyDate: { color: '#64748B', fontSize: 10 },
  historyScores: { color: '#E2E8F0', fontSize: 12, fontWeight: '800', marginTop: 2 },
  historyResult: { color: '#FDE047', fontSize: 11, marginTop: 2 },
});
