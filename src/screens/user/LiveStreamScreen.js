import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  ActivityIndicator,
  AppState,
  Alert,
  Dimensions,
  Image,
  Share,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
} from 'react-native-agora';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { apiUtil } from '../../utils/apiUtil';
import { useVoiceRoom } from '../../context/VoiceRoomContext';
import { getUserAvatar } from '../../utils/avatarUtil';
import { AlertService } from '../../utils/AlertService';

import LiveTopHeader from '../../components/live/LiveTopHeader';
import LiveGiftBanner from '../../components/live/LiveGiftBanner';
import LivePKBar from '../../components/live/LivePKBar';
import FloatingGameBannerWidget from '../../components/room/FloatingGameBannerWidget';
import LiveChatOverlay from '../../components/live/LiveChatOverlay';
import LiveFloatingSideBadges from '../../components/live/LiveFloatingSideBadges';
import LiveBottomControls from '../../components/live/LiveBottomControls';
import LiveGiftTrayModal from '../../components/live/LiveGiftTrayModal';
import LiveToolsBottomSheet from '../../components/live/LiveToolsBottomSheet';
import LiveGamesModal from '../../components/live/LiveGamesModal';
import LiveRoomGameView from '../../components/live/LiveRoomGameView';
import LiveChatInputModal from '../../components/live/LiveChatInputModal';
import LiveConnectionSheet from '../../components/live/LiveConnectionSheet';
import LiveRechargeSheet from '../../components/live/LiveRechargeSheet';
import LiveGuestRequestsSheet from '../../components/live/LiveGuestRequestsSheet';
import GiftContributionListModal from '../../components/live/GiftContributionListModal';
import LiveEndSummaryModal from '../../components/live/LiveEndSummaryModal';
import RoomLockModal from '../../components/room/RoomLockModal';
import { getSocket } from '../../sockets';
import { ARManager, ARFilterPanel, ARFaceMaskOverlay, useARSession, useARLifecycle } from '../../features/YaroAR';
import LiveVideoGrid from '../../components/live/LiveVideoGrid';
import GiftAnimationEngine from '../../components/gift/GiftAnimationEngine';
import { useGiftQueue } from '../../components/gift/hooks/useGiftQueue';
import { resolveGiftVisual } from '../../components/gift/giftMediaUtils';
import RoomEntryEffectEngine from '../../components/room/RoomEntryEffectEngine';
import { getEffect } from '../../features/YaroAR/effects/registry/effectRegistry';
import AgoraVideoView from '../../components/live/AgoraVideoView';

const { width, height } = Dimensions.get('window');
const guestUserId = guest => String(
  guest?.user?._id || guest?.user?.id || guest?.user?.userId ||
  (typeof guest?.user === 'string' ? guest.user : '') || guest?.id || guest?.userId || '',
);

export default function LiveStreamScreen({ navigation, route }) {
  const ar = useARSession();
  useARLifecycle();
  const [arPanelTab, setArPanelTab] = useState(null);
  const arUnbindRef = useRef(null);
  const arReleaseRef = useRef(Promise.resolve());
  const releaseAR = async () => {
    const unbind = arUnbindRef.current;
    arUnbindRef.current = null;
    if (unbind) arReleaseRef.current = unbind();
    await arReleaseRef.current;
  };
  const insets = useSafeAreaInsets();
  const { activeRoom, leaveRoom } = useVoiceRoom();
  const roomId = route.params?.roomId || route.params?.room?._id || route.params?.room?.id;
  const [room, setRoom] = useState(route.params?.room || {});
  const [rtc, setRtc] = useState(route.params?.rtc || null);
  const [previewReady, setPreviewReady] = useState(false);
  const [engineReady, setEngineReady] = useState(false);
  const [activeEntry, setActiveEntry] = useState(null);
  const giftQueue = useGiftQueue();
  const [connected, setConnected] = useState(false);
  const [remoteReady, setRemoteReady] = useState(false);
  const [error, setError] = useState('');
  const [muted, setMuted] = useState(false);
  const [camera, setCamera] = useState(true);
  const [connectionVisible, setConnectionVisible] = useState(false);
  const [requestPending, setRequestPending] = useState(false);
  const [mirrored, setMirrored] = useState(false);
  const [coinBalance, setCoinBalance] = useState(0);
  const [sendingGift, setSendingGift] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [rechargeVisible, setRechargeVisible] = useState(false);
  const [requestsVisible, setRequestsVisible] = useState(false);
  const [joinRequests, setJoinRequests] = useState([]);
  const [liveSocket, setLiveSocket] = useState(() => getSocket());
  useEffect(() => {
    const interval = setInterval(() => setLiveSocket(getSocket()), 500);
    return () => clearInterval(interval);
  }, []);

  // Live Stream Features & Interactivity State
  const [isFollowing, setIsFollowing] = useState(false);
  const [likeCount, setLikeCount] = useState(room.totalLikes || 0);
  const [hearts, setHearts] = useState([]);
  const [comboCount, setComboCount] = useState(0);
  const [comboEmoji, setComboEmoji] = useState('❤️');
  const [recentGift, setRecentGift] = useState(null);
  const [giftBanner, setGiftBanner] = useState(null);
  const [messages, setMessages] = useState([]);

  // Live Room In-Screen Games State
  const [gamesModalVisible, setGamesModalVisible] = useState(false);
  const [activeGame, setActiveGame] = useState(null);
  const [isGameMinimized, setIsGameMinimized] = useState(false);

  // PK Battle State - Default is false (active only during PK match)
  const [isPK, setIsPK] = useState(
    Boolean(
      route.params?.isPK ||
        room.isPKActive ||
        room.pkBattleActive ||
        room.pk?.isActive ||
        false,
    ),
  );
  const [leftScore, setLeftScore] = useState(room.leftScore || room.pk?.leftScore || 0);
  const [rightScore, setRightScore] = useState(room.rightScore || room.pk?.rightScore || 0);
  const [leftContributors, setLeftContributors] = useState(room.pk?.leftContributors || []);
  const [rightContributors, setRightContributors] = useState(room.pk?.rightContributors || []);
  const [pkSecondsRemaining, setPkSecondsRemaining] = useState(300);
  const [pkWinnerInfo, setPkWinnerInfo] = useState(null);
  const pkTimerIntervalRef = useRef(null);
  const pkTimeFormatted = `${String(Math.floor(pkSecondsRemaining / 60)).padStart(2, '0')}:${String(pkSecondsRemaining % 60).padStart(2, '0')}`;

  // New Modals State: Contribution Ranking & Live Ended Summary
  const [contributionModalVisible, setContributionModalVisible] = useState(false);
  const [endSummaryVisible, setEndSummaryVisible] = useState(false);
  const liveStartTime = useRef(Date.now());
  const [rivalUser, setRivalUser] = useState(
    room.rivalUser || {
      name: 'Rival Broadcaster',
      avatar: 'https://api.yaroapp.in/uploads/avatars/female_default.webp',
    },
  );
  const lastTapRef = useRef(0);

  // Modals Visibility
  const [giftModalVisible, setGiftModalVisible] = useState(false);
  const [toolsModalVisible, setToolsModalVisible] = useState(false);
  const [chatInputVisible, setChatInputVisible] = useState(false);
  const [liveLockModalVisible, setLiveLockModalVisible] = useState(false);

  const handleToggleLiveLock = async () => {
    setToolsModalVisible(false);

    if (room?.isPrivate) {
      try {
        const res = await apiUtil.post(`/live/rooms/${roomId}/lock`, { isLocked: false });
        if (res.data?.success) {
          setRoom(prev => ({ ...prev, isPrivate: false }));
          AlertService.show('Public Live', 'Your live stream is now public.', 'success');
        }
      } catch (err) {
        AlertService.show('Error', err.response?.data?.message || 'Failed to make live public', 'error');
      }
    } else {
      setLiveLockModalVisible(true);
    }
  };

  const handleLiveLockSuccess = async (pin) => {
    try {
      const res = await apiUtil.post(`/live/rooms/${roomId}/lock`, { isLocked: true, pin });
      if (res.data?.success) {
        setRoom(prev => ({ ...prev, isPrivate: true }));
        setLiveLockModalVisible(false);
        AlertService.show('Private Live 🔒', 'Your live stream is now private. Viewers must enter the password to join.', 'success');
      }
    } catch (err) {
      AlertService.show('Error', err.response?.data?.message || 'Failed to make live private', 'error');
    }
  };

  const engineRef = useRef(null);
  const rtcRef = useRef(route.params?.rtc || null);
  const closing = useRef(false);
  const captureStarted = useRef(false);
  const guestCamera = useRef(true);
  const guestMuted = useRef(false);
  const [guests, setGuests] = useState(room.guests || []);
  const roomRef = useRef(room);
  roomRef.current = room;
  const giftSendingRef = useRef(false);
  const seenGifts = useRef(new Set());
  useEffect(() => {
    seenGifts.current.clear();
    giftQueue.clearQueue();
    setActiveEntry(null);
  }, [roomId, giftQueue.clearQueue]);

  const refreshBalance = async () => {
    try {
      const response = await apiUtil.get('/user/profile');
      const profile = response.data?.data?.user || response.data?.data;
      setCoinBalance(Number(profile?.coins ?? profile?.diamonds ?? 0));
    } catch (_) { /* Keep the last confirmed balance while offline. */ }
  };
  const openRecharge = () => {
    setGiftModalVisible(false);
    setRechargeVisible(true);
  };
  const followHost = async () => {
    const hostId = room.host?.userId || room.host?._id;
    if (!hostId || followLoading) return;
    setFollowLoading(true);
    try {
      await apiUtil.post('/user/follow/' + encodeURIComponent(hostId));
      setIsFollowing(value => !value);
    } catch (e) { AlertService.show('Follow', e.response?.data?.message || 'Please try again.', 'error'); }
    finally { setFollowLoading(false); }
  };
  const closeConnection = () => {
    setConnectionVisible(false);
    if (!rtcRef.current?.isCoHost) {
      void releaseAR().catch(e => ARManager.update({ error: e.message }));
      engineRef.current?.stopPreview();
      captureStarted.current = false;
    }
  };
  const openConnection = async () => {
    if (!engineRef.current || !connected) return;
    if (Platform.OS === 'android') {
      const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA, PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ]);
      if (Object.values(result).some(value => value !== PermissionsAndroid.RESULTS.GRANTED)) {
        AlertService.show('Permission required', 'Allow camera and microphone to preview a connection.', 'info');
        return;
      }
    }
    if (closing.current || !engineRef.current) return;
    if (!arUnbindRef.current) arUnbindRef.current = ARManager.bind(engineRef.current, { inChannel: false });
    if (ARManager.getSnapshot().trackId === null) {
      engineRef.current.enableLocalVideo?.(true);
      engineRef.current.startPreview();
    }
    captureStarted.current = true;
    setConnectionVisible(true);
  };
  const requestConnection = () => {
    const socket = getSocket();
    if (!socket?.connected) {
      AlertService.show('Reconnecting', 'Please try again when connected.', 'info');
      return;
    }
    guestCamera.current = camera;
    guestMuted.current = muted;
    socket.emit('live:apply_join', { roomId });
    setRequestPending(true);
  };

  const receiveGift = (data) => {
    if (data.roomId && String(data.roomId) !== String(roomId)) return;
    const id = data.transactionId || data.id;
    if (id && seenGifts.current.has(id)) return;
    if (id) {
      seenGifts.current.add(id);
      if (seenGifts.current.size > 200)
        seenGifts.current.delete(seenGifts.current.values().next().value);
    }
    giftQueue.enqueue({
      ...data,
      quantity: data.quantity || data.gift?.quantity || 1,
      animationId: data.transactionId || data.id,
      receiver: data.receiver || {
        id: data.receiverId,
        name: roomRef.current?.host?.name || 'Broadcaster',
      },
    });
    const visual = resolveGiftVisual(data.gift || data);
    const quantity = data.quantity || data.gift?.quantity || 1;
    setComboCount(quantity);
    setComboEmoji(visual.giftIcon || '🎁');
    setGiftBanner({
      senderName: data.sender?.name,
      receiverName: data.receiver?.name || roomRef.current?.host?.name || 'Broadcaster',
      giftName: data.gift?.name,
    });
    setRecentGift({
      senderName: data.sender?.name,
      giftEmoji: visual.giftIcon || '🎁',
      giftImage: visual.giftImage,
      giftName: data.gift?.name || 'Gift',
      count: quantity,
    });
    setRoom((current) => ({
      ...current,
      totalDiamonds: data.totalDiamonds,
      topSupporters: data.topSupporters,
    }));
    setLeftScore(data.leftScore || 0);
    setRightScore(data.rightScore || 0);
    refreshBalance();
  };

  useEffect(() => {
    const socket = liveSocket;
    refreshBalance();
    if (!socket) return undefined;
    const join = () => socket.emit('live:join', { roomId });
    const handlers = {
      connect: join,
      'live:chat_message': message => setMessages(current => [...current.slice(-49), message]),
      'live:viewer_joined': data => setRoom(current => ({ ...current, viewerCount: data.viewerCount })),
      'live:viewer_left': data => setRoom(current => ({ ...current, viewerCount: data.viewerCount })),
      'live:like_update': data => setLikeCount(data.totalLikes),
      'live:gift_received': receiveGift,
      'entry:effect': data => {
        if (String(data.roomId) !== String(roomId)) return;
        setActiveEntry(previous => ({ ...data, queuedEntries: [...(previous?.queuedEntries || []), data].slice(-15) }));
      },
      'live:guest_media': data => {
        if (String(data.roomId) !== String(roomId)) return;
        setGuests(current => current.map(guest => guestUserId(guest) === String(data.userId)
          ? { ...guest, muted: data.muted, camera: data.camera } : guest));
        if (Number(data.agoraUid) === Number(rtcRef.current?.agoraUid) && data.muted === true) {
          engineRef.current?.muteLocalAudioStream(true);
          guestMuted.current = true;
          setMuted(true);
        }
      },
      'live:error': data => { setRequestPending(false); AlertService.show('Live', data.message, 'error'); },
      'live:guest_rejected': data => {
        if (data.roomId !== roomId) return;
        setRequestPending(false);
        AlertService.show('Connection request', 'The broadcaster declined your request.', 'info');
      },
      'live:join_request_received': data => {
        if (data.roomId !== roomId || !rtcRef.current?.isHost) return;
        setJoinRequests(current => [...current.filter(user => user.id !== data.user.id), data.user]);
        Alert.alert('Connection request', data.user.name + ' wants to join your live.', [
          { text: 'Decline', onPress: () => respondToRequest(data.user.id, false) },
          { text: 'Accept', onPress: () => respondToRequest(data.user.id, true) },
        ]);
      },
      'live:guest_accepted': async data => {
        if (data.roomId !== roomId || closing.current || !engineRef.current) return;
        await arReleaseRef.current;
        if (closing.current || !engineRef.current) return;
        const engine = engineRef.current;
        if (!arUnbindRef.current) arUnbindRef.current = ARManager.bind(engine, { inChannel: true });
        ARManager.channelPublishing(true);
        engine.renewToken(data.rtc.token);
        engine.setClientRole(ClientRoleType.ClientRoleBroadcaster);
        engine.updateChannelMediaOptions({ clientRoleType: ClientRoleType.ClientRoleBroadcaster,
          publishCameraTrack: guestCamera.current && ARManager.getSnapshot().trackId === null,
          ...(ARManager.getSnapshot().trackId !== null ? { publishCustomVideoTrack: true, customVideoTrackId: ARManager.getSnapshot().trackId } : {}),
          publishMicrophoneTrack: !guestMuted.current });
        if (ARManager.getSnapshot().trackId === null) engine.startPreview();
        captureStarted.current = true;
        rtcRef.current = { ...rtcRef.current, ...data.rtc };
        setRtc(rtcRef.current);
        setRequestPending(false); setConnectionVisible(false);
      },
      'live:guest_joined': data => {
        if (data.roomId && String(data.roomId) !== String(roomId)) return;
        setGuests(current => {
          const id = guestUserId(data.guest);
          const previous = current.find(guest => guestUserId(guest) === id);
          return [...current.filter(guest => guestUserId(guest) !== id), { ...previous, ...data.guest }];
        });
      },
      'live:guest_left': data => {
        if (data.roomId && String(data.roomId) !== String(roomId)) return;
        setGuests(current => current.filter(guest => guestUserId(guest) !== String(data.userId)));
      },
      'live:pk_started': data => {
        setIsPK(true);
        setPkWinnerInfo(null);
        if (data.rivalHost) setRivalUser(data.rivalHost);
        if (data.leftScore !== undefined) setLeftScore(data.leftScore);
        if (data.rightScore !== undefined) setRightScore(data.rightScore);
        if (data.leftContributors) setLeftContributors(data.leftContributors);
        if (data.rightContributors) setRightContributors(data.rightContributors);
        const duration = Number(data.durationSeconds) || 300;
        setPkSecondsRemaining(duration);
        if (pkTimerIntervalRef.current) clearInterval(pkTimerIntervalRef.current);
        pkTimerIntervalRef.current = setInterval(() => {
          setPkSecondsRemaining(prev => {
            if (prev <= 1) {
              clearInterval(pkTimerIntervalRef.current);
              if (rtcRef.current?.isHost) {
                socket.emit('live:pk_end', { roomId });
              }
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      },
      'live:pk_score_update': data => {
        if (data.leftScore !== undefined) setLeftScore(data.leftScore);
        if (data.rightScore !== undefined) setRightScore(data.rightScore);
        if (data.leftContributors !== undefined) setLeftContributors(data.leftContributors);
        if (data.rightContributors !== undefined) setRightContributors(data.rightContributors);
      },
      'live:pk_ended': data => {
        if (pkTimerIntervalRef.current) clearInterval(pkTimerIntervalRef.current);
        setIsPK(false);
        setLeftContributors([]);
        setRightContributors([]);
        const outcome = data?.winner === 'left'
          ? (isHost ? 'VICTORY 🏆' : 'HOST WON 🏆')
          : data?.winner === 'right'
          ? (isHost ? 'DEFEAT 💔' : 'RIVAL WON 👑')
          : 'DRAW MATCH 🤝';
        setPkWinnerInfo({
          outcome,
          winner: data?.winner,
          leftScore: data?.leftScore ?? leftScore,
          rightScore: data?.rightScore ?? rightScore,
        });
        setTimeout(() => {
          setPkWinnerInfo(null);
          setRivalUser(null);
          setLeftScore(0);
          setRightScore(0);
          setPkSecondsRemaining(300);
        }, 6000);
      },
      'live:pk_invitation_received': data => {
        if (!rtcRef.current?.isHost) return;
        const durText = data.durationSeconds ? `${Math.round(data.durationSeconds / 60)} min` : '5 min';
        Alert.alert(
          '⚔️ PK Battle Challenge',
          `${data.fromHost?.name || 'A Broadcaster'} challenged you to a ${durText} PK Battle!`,
          [
            {
              text: 'Decline',
              style: 'cancel',
              onPress: () => {
                socket.emit('live:pk_reject', { fromRoomId: data.fromRoomId, reason: 'Declined by host' });
              },
            },
            {
              text: 'Accept ⚔️',
              onPress: () => {
                setRivalUser(data.fromHost || null);
                socket.emit('live:pk_accept', {
                  roomId,
                  inviterRoomId: data.fromRoomId,
                  durationSeconds: data.durationSeconds || 300,
                });
                setIsPK(true);
              },
            },
          ]
        );
      },
      'live:pk_rejected': data => {
        AlertService.show('PK Challenge Declined', data?.reason || 'The broadcaster declined your PK challenge.', 'info');
      },
    };
    Object.entries(handlers).forEach(([event, handler]) => socket.on(event, handler));
    if (socket.connected) join();
    return () => {
      if (pkTimerIntervalRef.current) clearInterval(pkTimerIntervalRef.current);
      giftQueue.clearQueue();
      Object.entries(handlers).forEach(([event, handler]) => socket.off(event, handler));
      if (rtcRef.current?.isCoHost) socket.emit('live:leave_guest', { roomId });
      socket.emit('live:leave', { roomId });
    };
  }, [roomId, liveSocket]);

  const respondToRequest = (targetUserId, accept) => {
    const socket = getSocket();
    if (!socket?.connected) return;
    socket.emit(accept ? 'live:accept_guest' : 'live:reject_guest', { roomId, targetUserId });
    setJoinRequests(current => current.filter(user => user.id !== targetUserId));
  };

  const close = async () => {
    if (closing.current) return arReleaseRef.current;
    closing.current = true;
    giftQueue.clearQueue();
    setActiveEntry(null);
    const closingEngine = engineRef.current;
    await releaseAR();
    if (rtcRef.current?.isCoHost) getSocket()?.emit('live:leave_guest', { roomId });
    closingEngine?.stopPreview();
    closingEngine?.leaveChannel();
    captureStarted.current = false;
    setConnected(false);
    try {
      await apiUtil.post(
        `/live/rooms/${roomId}/${rtcRef.current?.isHost ? 'end' : 'leave'}`,
      );
    } catch (e) {
      /* Host heartbeat lease expires after disconnection. */
    }
  };

  useEffect(() => {
    let disposed = false;
    let timer;
    let connectionTimer;
    const setup = async () => {
      try {
        if (activeRoom) await leaveRoom(undefined, { navigateBack: false });
        // Create already returns the authenticated host's RTC credentials.
        // Viewers still join through the server to validate access/register a lease.
        const supplied = route.params?.rtc;
        const targetRoomId = roomId || route.params?.room?._id || route.params?.room?.id;
        const data = supplied?.isHost && supplied?.token && (route.params?.room?._id === targetRoomId || !targetRoomId)
          ? { room: route.params.room, rtc: supplied }
          : (await apiUtil.post(`/live/rooms/${targetRoomId}/join`, { pin: route.params?.pin })).data.data;
        rtcRef.current = data.rtc;
        if (disposed || closing.current) {
          await close();
          return;
        }
        setRoom(data.room);
        setGuests(data.room.guests || []);
        setRtc(data.rtc);
        if ((data.rtc.isHost || data.rtc.isCoHost) && Platform.OS === 'android' && !route.params?.permissionsGranted) {
          const result = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.CAMERA,
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          ]);
          if (
            Object.values(result).some(
              value => value !== PermissionsAndroid.RESULTS.GRANTED,
            )
          )
            throw new Error(
              'Camera and microphone permissions are required to go live.',
            );
        }
        if (disposed || closing.current) {
          await close();
          return;
        }
        await ARManager.waitForRelease();
        if (disposed || closing.current) return;
        const engine = createAgoraRtcEngine();
        engineRef.current = engine;
        const initialized = engine.initialize({
          appId: data.rtc.appId,
          channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
        });
        if (initialized < 0) throw new Error(`Video initialization failed (${initialized}).`);
        if (data.rtc.isHost || data.rtc.isCoHost) arUnbindRef.current = ARManager.bind(engine, { inChannel: true });
        engine.registerEventHandler({
          onJoinChannelSuccess: () => {
            clearTimeout(connectionTimer);
            if (!disposed && !closing.current) { setConnected(true); setError(''); }
            if (!disposed && data.rtc.isHost && route.params?.arEffectId) {
              void ARManager.select(route.params.arEffectId, route.params.arSettings).catch(e => ARManager.update({ error: e.message }));
            }
          },
          onFirstLocalVideoFrame: () => { if (!disposed && !closing.current) setPreviewReady(true); },
          onLocalVideoStateChanged: (_source, state, code) => {
            if (!disposed && !closing.current && state === 3) setError(`Camera video failed (${code}).`);
          },
          onUserJoined: (_connection, uid) => {
            if (!disposed && Number(uid) === Number(data.rtc.hostUid)) setRemoteReady(true);
          },
          onFirstRemoteVideoFrame: (_connection, uid) => {
            if (!disposed && Number(uid) === Number(data.rtc.hostUid)) setRemoteReady(true);
          },
          onUserOffline: (_connection, uid) => {
            if (!disposed && Number(uid) === Number(data.rtc.hostUid)) {
              setRemoteReady(false);
              setError('The host disconnected.');
            }
          },
          onError: code => {
            if (!disposed)
              setError(
                `Video connection error (${code}). Please leave and try again.`,
              );
          },
          onTokenPrivilegeWillExpire: async () => {
            try {
              const renewed = await apiUtil.post(`/live/rooms/${roomId}/join`);
              if (!disposed) engine.renewToken(renewed.data.data.rtc.token);
            } catch (e) {
              if (!disposed) {
                setError('This live has ended or access expired.');
                engine.leaveChannel();
              }
            }
          },
        });
        const enabled = engine.enableVideo();
        if (enabled < 0) throw new Error(`Video could not start (${enabled}).`);
        setEngineReady(true);
        const isHost = data.rtc.isHost;
        const publishing = isHost || data.rtc.isCoHost;
        if (publishing) {
          engine.startPreview();
          captureStarted.current = true;
        }
        const result = engine.joinChannel(
          data.rtc.token,
          data.rtc.channelName,
          data.rtc.agoraUid,
          {
            clientRoleType: publishing
              ? ClientRoleType.ClientRoleBroadcaster
              : ClientRoleType.ClientRoleAudience,
            publishCameraTrack: Boolean(publishing),
            publishMicrophoneTrack: Boolean(publishing),
            autoSubscribeAudio: true,
            autoSubscribeVideo: true,
          },
        );
        if (result < 0) throw new Error(`Unable to join live (${result}).`);
        connectionTimer = setTimeout(() => {
          if (!disposed && !closing.current) {
            setError('Live connection timed out. Check your connection and try again.');
            close();
          }
        }, 20000);
        const heartbeat = async () => {
          if (closing.current) return;
          try {
            const res = await apiUtil.post(`/live/rooms/${roomId}/heartbeat`);
            if (!disposed) setRoom(res.data.data);
          } catch (e) {
            if (
              !disposed &&
              [404, 410, 401, 403].includes(e.response?.status)
            ) {
              clearInterval(timer);
              engine.stopPreview();
              engine.leaveChannel();
              captureStarted.current = false;
              setConnected(false);
              setError('This live has ended.');
              setEndSummaryVisible(true);
            }
          }
        };
        if (!disposed) timer = setInterval(heartbeat, 15000);
      } catch (e) {
        clearTimeout(connectionTimer);
        close();
        engineRef.current?.stopPreview();
        engineRef.current?.leaveChannel();
        if (!disposed)
          setError(
            e.response?.data?.message ||
              e.message ||
              'Unable to connect to live.',
          );
      }
    };
    setup();
    const appState = AppState.addEventListener('change', state => {
      if (
        state !== 'active' &&
        (rtcRef.current?.isHost || captureStarted.current) &&
        captureStarted.current
      ) {
        close();
        engineRef.current?.stopPreview();
        engineRef.current?.leaveChannel();
        captureStarted.current = false;
        setConnected(false);
        setError('Live ended when the app left the foreground.');
      }
    });
    return () => {
      disposed = true;
      clearInterval(timer);
      clearTimeout(connectionTimer);
      appState.remove();
      close();
      const engine = engineRef.current;
      engineRef.current = null;
      if (engine) {
        void releaseAR().finally(() => {
          engine.stopPreview();
          engine.leaveChannel();
          engine.release();
        });
      }
    };
  }, [roomId]);

  useEffect(
    () =>
      navigation.addListener('beforeRemove', event => {
        if (!rtcRef.current?.isHost || closing.current) return;
        event.preventDefault();
        Alert.alert('End live?', 'Your broadcast will end for all viewers.', [
          { text: 'Keep live', style: 'cancel' },
          {
            text: 'End live',
            style: 'destructive',
            onPress: async () => {
              await close();
              setEndSummaryVisible(true);
            },
          },
        ]);
      }),
    [navigation],
  );

  const isHost = rtc?.isHost;

  // Interactivity Handlers
  const handleLike = () => {
    if (!getSocket()?.connected) return;
    getSocket().emit('live:like', { roomId, count: 1 });
    setLikeCount(prev => prev + 1);
    const heartColors = ['#F43F5E', '#EC4899', '#A855F7', '#38BDF8', '#F59E0B', '#10B981'];
    const randomColor = heartColors[Math.floor(Math.random() * heartColors.length)];
    setHearts(prev => [...prev.slice(-15), { id: 'heart-' + Date.now() + '-' + Math.random(), color: randomColor }]);
  };

  const handleHeartComplete = heartId => {
    setHearts(prev => prev.filter(h => h.id !== heartId));
  };

  const handleSendMessage = text => {
    const socket = getSocket();
    if (!socket?.connected) {
      AlertService.show('Reconnecting', 'Please wait for the live connection.', 'info');
      return;
    }
    socket.emit('live:chat', { roomId, text });
  };

  const handleSendGift = async ({ gift, quantity, receiver }) => {
    if (giftSendingRef.current) return;
    giftSendingRef.current = true;
    setSendingGift(true);
    try {
      const response = await apiUtil.post('/live/rooms/' + roomId + '/gift', {
        giftId: gift.id, quantity, target: receiver === rivalUser ? 'rival' : 'host',
      });
      setRoom(current => ({ ...current, totalDiamonds: response.data?.data?.totalDiamonds ?? current.totalDiamonds }));
      if (response.data?.data?.giftEvent) receiveGift(response.data.data.giftEvent);
      setGiftModalVisible(false);
      refreshBalance();
    } catch (e) {
      AlertService.show('Gift not sent', e.response?.data?.message || 'Please try again.', 'error');
    } finally { giftSendingRef.current = false; setSendingGift(false); }
  };

  const handleSayHi = () => {
    handleSendMessage('Hi there broadcaster! 👋');
  };

  const handleToggleMute = () => {
    if (!rtcRef.current?.isHost && !rtcRef.current?.isCoHost && !connectionVisible) return;
    engineRef.current?.muteLocalAudioStream(!muted);
    guestMuted.current = !muted;
    if (rtcRef.current?.isCoHost) getSocket()?.emit('live:guest_media', { roomId, muted: !muted, camera });
    setMuted(!muted);
  };

  const handleToggleCamera = async () => {
    if (rtcRef.current?.isHost) return;
    if (!rtcRef.current?.isCoHost && !connectionVisible) return;
    if (ARManager.getSnapshot().trackId !== null) {
      try {
        if (camera) await ARManager.pause(); else await ARManager.resume();
        if (rtcRef.current?.isHost || rtcRef.current?.isCoHost) {
          engineRef.current?.updateChannelMediaOptions({ publishCustomVideoTrack: !camera });
        }
        setCamera(!camera);
        guestCamera.current = !camera;
        if (rtcRef.current?.isCoHost) getSocket()?.emit('live:guest_media', { roomId, muted, camera: !camera });
      } catch (e) { AlertService.show('Camera', e.message || 'Could not change camera state.', 'error'); }
      return;
    }
    engineRef.current?.muteLocalVideoStream(camera);
    guestCamera.current = !camera;
    if (rtcRef.current?.isCoHost) getSocket()?.emit('live:guest_media', { roomId, muted, camera: !camera });
    setCamera(!camera);
  };

  const handleSwitchCamera = () => {
    void ARManager.switchCamera().catch(error => AlertService.show('Camera', error.message, 'error'));
  };

  const handleScreenDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 350) {
      handleLike();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  const handleTogglePK = async () => {
    const socket = getSocket();
    if (!socket?.connected) {
      AlertService.show('Reconnecting', 'Please wait for live connection.', 'info');
      return;
    }
    if (isPK) {
      socket.emit('live:pk_end', { roomId });
      setIsPK(false);
      AlertService.show('PK Battle', 'PK Battle ended.', 'info');
    } else {
      try {
        const res = await apiUtil.get('/live/rooms');
        const rawRooms = res.data?.data;
        const activeRooms = Array.isArray(rawRooms) ? rawRooms : rawRooms?.rooms || [];
        const otherRooms = activeRooms.filter(r => String(r._id) !== String(roomId) && r.status === 'live');
        if (otherRooms.length === 1) {
          const target = otherRooms[0];
          Alert.alert(
            '⚔️ PK Battle Duration',
            `Select duration to challenge ${target.host?.name || 'Broadcaster'}:`,
            [
              { text: '5 min', onPress: () => sendLivePKInvite(target._id, 300) },
              { text: '15 min', onPress: () => sendLivePKInvite(target._id, 900) },
              { text: '30 min', onPress: () => sendLivePKInvite(target._id, 1800) },
              { text: 'Cancel', style: 'cancel' },
            ]
          );
        } else if (otherRooms.length > 1) {
          const buttons = otherRooms.slice(0, 4).map(target => ({
            text: target.host?.name ? `${target.host.name}` : `Room ${String(target._id).slice(-4)}`,
            onPress: () => {
              Alert.alert(
                '⚔️ PK Battle Duration',
                `Select duration to challenge ${target.host?.name || 'Broadcaster'}:`,
                [
                  { text: '5 min', onPress: () => sendLivePKInvite(target._id, 300) },
                  { text: '15 min', onPress: () => sendLivePKInvite(target._id, 900) },
                  { text: '30 min', onPress: () => sendLivePKInvite(target._id, 1800) },
                  { text: 'Cancel', style: 'cancel' },
                ]
              );
            },
          }));
          buttons.push({ text: 'Cancel', style: 'cancel' });
          Alert.alert('⚔️ Select Broadcaster Opponent', 'Choose an active live broadcaster to challenge:', buttons);
        } else {
          AlertService.show('PK Battle', 'No other broadcaster is currently live for a PK challenge.', 'info');
        }
      } catch (err) {
        AlertService.show('PK Battle', err.response?.data?.message || 'Could not load available broadcasters.', 'error');
      }
    }
    setRequestsVisible(false);
  };

  const sendLivePKInvite = (targetRoomId, durationSeconds) => {
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit('live:pk_invite', { roomId, targetRoomId, durationSeconds, pkType: 'room' });
      AlertService.show('PK Match', `Challenged to ${Math.round(durationSeconds / 60)}-min PK Battle!`, 'info');
    }
  };

  const isHalfScreenGame = Boolean(activeGame && !isGameMinimized);
  const videoHeight = isHalfScreenGame ? height * 0.42 : isPK ? height * 0.44 : height;
  const multi = room.mode === 'multi';
  const muteGuest = guest => getSocket()?.emit('live:mute_guest', {
    roomId, targetUserId: guestUserId(guest),
  });
  const openUserProfile = userId => { if (userId) navigation.navigate('UserProfile', { userId }); };
  const reportHost = () => Alert.alert('Report broadcast', 'Report this broadcast for inappropriate content?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Report', onPress: async () => {
      try {
        await apiUtil.post('/user/report', { reportedUserId: room.host?._id || room.host?.id,
          reason: 'Inappropriate live content', description: `Live broadcast ${roomId}`, reportedType: 'user' });
        AlertService.show('Report submitted', 'Our safety team will review this broadcast.', 'success');
      } catch (e) { AlertService.show('Report', e.response?.data?.message || 'Could not send report.', 'error'); }
    } },
  ]);

  return (
    <View style={styles.screen}>
      {/* 1. Main Video Area (Single Host or PK Split Screen) */}
      <TouchableWithoutFeedback onPress={handleScreenDoubleTap}>
        <View style={[styles.videoContainer, { height: videoHeight }]}>
          {multi ? (
            <View style={{ position: 'absolute', top: insets.top + 95, left: 4, right: 4, height: height * 0.48 }}>
              <LiveVideoGrid count={room.seatCount || (room.maxGuests || 3) + 1} host={room.host} guests={guests}
                hostUid={rtc?.hostUid} localUid={rtc?.agoraUid} isHost={isHost} ready={engineReady}
                trackId={ar.trackId} frontCamera={ar.frontCamera} camera={camera}
                muted={muted} onMute={isHost || rtc?.isCoHost ? handleToggleMute : undefined}
                onCamera={rtc?.isCoHost ? handleToggleCamera : undefined}
                onJoin={!isHost && !rtc?.isCoHost ? openConnection : undefined} onMuteGuest={muteGuest} />
            </View>
          ) : isPK ? (
            <View style={styles.pkSplitRow}>
              {/* Left Stream: Broadcaster */}
              <View style={styles.streamHalf}>
                {rtc && engineReady && (isHost || connected) ? (
                  <>
                    <AgoraVideoView
                      key={`host-${isHost ? ar.trackId : rtc.hostUid}`}
                      style={StyleSheet.absoluteFill}
                      canvas={{ uid: isHost ? 0 : rtc.hostUid, ...(isHost ? { sourceType: ar.trackId === null ? 0 : 4, mirrorMode: ar.frontCamera ? 1 : 2 } : {}) }}
                    />
                    {isHost && (
                      <ARFaceMaskOverlay
                        effectId={ar.selectedId}
                        intensity={ar.intensity}
                        style={StyleSheet.absoluteFill}
                        compact
                      />
                    )}
                  </>
                ) : (
                  <View style={styles.avatarFallback}>
                    <Image source={getUserAvatar(room.host)} style={styles.streamFallbackAvatar} />
                    <Text style={styles.fallbackText}>{room.host?.name || 'Broadcaster'}</Text>
                  </View>
                )}
                {/* Broadcaster Name & Score Tag */}
                <View style={styles.streamTagLeft}>
                  <Text style={styles.starSmall}>⭐</Text>
                  <Text style={styles.streamScore}>{leftScore}</Text>
                </View>
              </View>

              {/* Right Stream: Rival Broadcaster */}
              <View style={styles.streamHalf}>
                <View style={styles.avatarFallback}>
                  <Image source={getUserAvatar(rivalUser)} style={styles.streamFallbackAvatar} />
                  <Text style={styles.fallbackText}>{rivalUser?.name || 'Rival broadcaster'}</Text>
                </View>
                {/* Rival Broadcaster Name & Score Tag */}
                <View style={styles.streamTagRight}>
                  <Text style={styles.streamTagHostText}>💖 {rivalUser?.name || 'Rival broadcaster'} 💖</Text>
                  <Text style={styles.streamScore}>⭐ {rightScore}</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={StyleSheet.absoluteFill}>
              {rtc && engineReady && (isHost || connected) ? (
                <>
                  <AgoraVideoView
                    key={`host-${isHost ? ar.trackId : rtc.hostUid}`}
                    style={StyleSheet.absoluteFill}
                    canvas={{ uid: isHost ? 0 : rtc.hostUid, ...(isHost ? { sourceType: ar.trackId === null ? 0 : 4, mirrorMode: ar.frontCamera ? 1 : 2 } : {}) }}
                  />
                  {isHost && (
                    <ARFaceMaskOverlay
                      effectId={ar.selectedId}
                      intensity={ar.intensity}
                      style={StyleSheet.absoluteFill}
                    />
                  )}
                </>
              ) : (
                <View style={[styles.avatarFallback, StyleSheet.absoluteFill]}>
                  <Image source={getUserAvatar(room.host)} style={styles.streamFallbackAvatarLarge} />
                  <Text style={styles.fallbackTextLarge}>{room.host?.name || 'Broadcaster'}</Text>
                </View>
              )}
            </View>
          )}

          {/* Ambient Dark/Gradient Overlay */}
          <LinearGradient
            colors={['rgba(0, 0, 0, 0.22)', 'transparent', 'rgba(0, 0, 0, 0.38)']}
            style={StyleSheet.absoluteFillObject}
            pointerEvents="none"
          />
        </View>
      </TouchableWithoutFeedback>

      {/* 2. Top Header Bar (Host Capsule, Coins, Supporters, Close) */}
      <View style={{ paddingTop: insets.top + 8 }}>
        <LiveTopHeader
          room={room}
          isHost={isHost}
          viewerCount={room.viewerCount || 0}
          diamonds={room.totalDiamonds || room.totalCoins || 0}
          hourlyRank={room.hourlyRank || 0}
          level={room.host?.level || 1}
          topSupporters={room.topSupporters || []}
          isFollowing={isFollowing}
          onFollow={followHost}
          onClose={() => navigation.goBack()}
          onPressHost={() => room.host?._id && navigation.navigate('UserProfile', { userId: room.host._id })}
          onPressSupporter={() => setContributionModalVisible(true)}
        />
      </View>

      {/* 3. Luxury Broadcast Gift Banner */}
      <LiveGiftBanner banner={giftBanner} />
      {!multi && guests.length > 0 && <View style={styles.guestVideos}>
        {guests.map(guest => {
          const local = Number(guest.agoraUid) === Number(rtc?.agoraUid);
          return <View key={guestUserId(guest) || guest.agoraUid} style={styles.guestVideo}>
          {guest.camera === false || (local && !camera)
            ? <View style={styles.avatarFallback}><Icon name="videocam-off-outline" size={28} color="#FFF" /></View>
            : <AgoraVideoView key={`${guest.agoraUid}-${local ? ar.trackId : 'remote'}`} zOrderMediaOverlay style={StyleSheet.absoluteFill}
              canvas={{ uid: local ? 0 : guest.agoraUid,
                ...(local ? { sourceType: ar.trackId === null ? 0 : 4, mirrorMode: ar.frontCamera ? 1 : 2 } : {}) }} />}
          {isHost && <TouchableOpacity style={styles.singleGuestMute} accessibilityLabel={`Mute ${guest.name || 'guest'}`} onPress={() => muteGuest(guest)}>
            <Icon name="mic-off" color="#FFF" size={18} />
          </TouchableOpacity>}
        </View>;
        })}
      </View>}

      {/* 4. PK Versus Bar */}
      {isPK && (
        <View style={styles.pkBarWrapper}>
          <View style={styles.gentlemanPill}>
            <Text style={styles.gentlemanText}>🕊️ Be Gentleman 🙏</Text>
          </View>
          <LivePKBar
            isPKActive={isPK}
            leftScore={leftScore}
            rightScore={rightScore}
            timeLeft={pkTimeFormatted}
            leftContributors={leftContributors}
            rightContributors={rightContributors}
          />
        </View>
      )}

      {/* PK Result Celebration Banner */}
      {Boolean(pkWinnerInfo) && (
        <View style={styles.pkResultBannerOverlay} pointerEvents="none">
          <LinearGradient
            colors={['#7C3AED', '#EC4899', '#EF4444']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.pkResultBannerCard}
          >
            <Text style={styles.pkResultOutcomeText}>{pkWinnerInfo.outcome}</Text>
            <Text style={styles.pkResultScoresText}>
              ⭐ {Number(pkWinnerInfo.leftScore || 0).toLocaleString()}  VS  ⭐ {Number(pkWinnerInfo.rightScore || 0).toLocaleString()}
            </Text>
          </LinearGradient>
        </View>
      )}

      {/* 5. Center Status / Connection Indicator */}
      {(!connected || (!isHost && !remoteReady) || !!error) && (
        <View style={styles.status} pointerEvents="none">
          {!error && !previewReady && <ActivityIndicator color="#FFF" size="large" />}
          <Text style={styles.message}>
            {error ||
              (connected
                ? 'Waiting for the host video…'
                : 'Connecting to live…')}
          </Text>
        </View>
      )}

      {/* 6. Lower Content OR Half-Screen Live Game */}
      {isHalfScreenGame ? (
        <View style={[styles.gameAreaContainer, { height: height * 0.58 }]}>
          <LiveRoomGameView
            game={activeGame}
            onClose={() => {
              setActiveGame(null);
              setIsGameMinimized(false);
            }}
            onMinimize={() => {
              setActiveGame(null);
              setIsGameMinimized(false);
            }}
            coinBalance={coinBalance}
            onUpdateCoinBalance={newBal => setCoinBalance(newBal)}
            onRecharge={openRecharge}
            onEmitGameWin={(amount, gameName) => {
              const winMsg = {
                id: 'game_win_' + Date.now(),
                senderId: 'game_system',
                senderName: 'Game Master',
                text: `🎉 Won ${amount.toLocaleString()} coins in ${gameName}!`,
                avatar: null,
                color: '#FFD700',
              };
              setMessages(prev => [...prev.slice(-40), winMsg]);
              getSocket()?.emit('live:chat_message', {
                roomId,
                text: `🎉 Won ${amount.toLocaleString()} coins in ${gameName}!`,
                type: 'game_win',
              });
            }}
          />
        </View>
      ) : (
        <>
          <View style={styles.lowerArea} pointerEvents="box-none">
            <LiveChatOverlay
              messages={messages}
              recentGift={recentGift}
              onSayHi={handleSayHi}
              onPressMessage={message => openUserProfile(message.senderId)}
            />

            <LiveFloatingSideBadges
              hearts={hearts}
              onHeartComplete={handleHeartComplete}
              comboCount={comboCount}
              comboEmoji={comboEmoji}
              onPressTask={() => AlertService.show('Live tasks', 'Live task rewards are currently unavailable.', 'info')}
              onPressEvent={() => setContributionModalVisible(true)}
            />

            {/* Dual Carousel Banner: Event + Direct Game (User Video Specification) */}
            <FloatingGameBannerWidget
              onSelectGame={game => {
                setActiveGame(game);
                setIsGameMinimized(false);
              }}
              style={styles.floatingGameBannerLive}
            />
          </View>

          {/* 7. Bottom Action Controls Bar */}
          <LiveBottomControls
            onOpenChat={() => setChatInputVisible(true)}
            onOpenPK={isHost ? () => setRequestsVisible(true) : rtc?.isCoHost ? () => setToolsModalVisible(true) : openConnection}
            onOpenGift={() => setGiftModalVisible(true)}
            onOpenTools={() => setToolsModalVisible(true)}
            onOpenGames={() => setGamesModalVisible(true)}
            bottomPadding={insets.bottom + 10}
          />
        </>
      )}


      {/* 8. Modals: Gift Tray, Basic Tools, Live Chat Input */}
      <LiveGiftTrayModal
        visible={giftModalVisible}
        onClose={() => setGiftModalVisible(false)}
        coinBalance={coinBalance}
        sending={sendingGift}
        hostUser={room.host || { name: room.title || 'Broadcaster' }}
        rivalUser={rivalUser}
        isPK={isPK}
        onSendGift={handleSendGift}
        onRecharge={openRecharge}
        bottomPadding={insets.bottom}
      />

      <LiveToolsBottomSheet
        visible={toolsModalVisible}
        onClose={() => setToolsModalVisible(false)}
        isHost={isHost}
        isCoHost={Boolean(rtc?.isCoHost)}
        isLocked={Boolean(room?.isPrivate)}
        muted={muted}
        camera={camera}
        onSwitchCamera={handleSwitchCamera}
        onToggleMute={handleToggleMute}
        onToggleCamera={handleToggleCamera}
        onLockRoom={handleToggleLiveLock}
        onShare={() => { setToolsModalVisible(false); Share.share({ message: 'Join my live on Yaro: https://yaroapp.in/room/' + roomId }); }}
        onReport={() => { setToolsModalVisible(false); reportHost(); }}
        onDailyTask={() => { setToolsModalVisible(false); AlertService.show('Live tasks', 'Live task rewards are currently unavailable.', 'info'); }}
        onEffects={() => { setToolsModalVisible(false); setArPanelTab('Effects'); }}
        onBeauty={() => { setToolsModalVisible(false); setArPanelTab('Beauty'); }}
        onGames={() => { setToolsModalVisible(false); setGamesModalVisible(true); }}
        bottomPadding={insets.bottom}
      />

      {/* Room Lock Modal for host to lock live stream with 4-digit PIN */}
      <RoomLockModal
        visible={liveLockModalVisible}
        mode="set_pin"
        roomId={roomId || room?._id || room?.id || room?.roomId || room?.channelName}
        isRoomLocked={Boolean(room?.isPrivate)}
        isLive={true}
        title="Private Live"
        onClose={() => setLiveLockModalVisible(false)}
        onSuccess={handleLiveLockSuccess}
        onUnlockRoom={handleToggleLiveLock}
      />

      {/* Live Games Selection Modal */}
      <LiveGamesModal
        visible={gamesModalVisible}
        onClose={() => setGamesModalVisible(false)}
        onSelectGame={game => {
          setActiveGame(game);
          setIsGameMinimized(false);
        }}
        coinBalance={coinBalance}
        onRecharge={openRecharge}
        bottomPadding={insets.bottom}
        roomType="live"
      />

      <LiveGuestRequestsSheet
        visible={requestsVisible}
        requests={joinRequests}
        onClose={() => setRequestsVisible(false)}
        onRespond={respondToRequest}
        isPK={isPK}
        onTogglePK={handleTogglePK}
        bottomPadding={insets.bottom}
      />

      <LiveRechargeSheet visible={rechargeVisible} onClose={() => setRechargeVisible(false)}
        onContinue={productId => { setRechargeVisible(false); navigation.navigate('Recharge', { productId }); }}
        bottomPadding={insets.bottom} />

      <LiveConnectionSheet
        visible={connectionVisible}
        onClose={closeConnection}
        camera={camera} muted={muted} mirrored={mirrored}
        beauty={getEffect(ar.selectedId)?.category === 'Beauty'}
        onBeauty={() => setArPanelTab('Beauty')}
        onEffects={() => setArPanelTab('Effects')}
        preview={
          <View style={StyleSheet.absoluteFill}>
            <AgoraVideoView style={StyleSheet.absoluteFill} canvas={{ uid: 0, sourceType: ar.trackId === null ? 0 : 4, mirrorMode: mirrored ? 1 : 2 }} />
            <ARFaceMaskOverlay effectId={ar.selectedId} intensity={ar.intensity} style={StyleSheet.absoluteFill} compact />
          </View>
        }
        onCamera={handleToggleCamera} onMute={handleToggleMute}
        onRotate={handleSwitchCamera} onMirror={() => setMirrored(value => !value)}
        pending={requestPending} onRequest={requestConnection} bottomPadding={insets.bottom}
      />

      <Modal visible={arPanelTab !== null} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setArPanelTab(null)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#0006' }}>
          <TouchableOpacity style={StyleSheet.absoluteFill} accessibilityLabel="Close AR effects" onPress={() => setArPanelTab(null)} />
          <View style={{ paddingBottom: insets.bottom + 8, paddingHorizontal: 8 }}>
            <ARFilterPanel key={arPanelTab || 'Effects'} initialTab={arPanelTab || 'Effects'} onClose={() => setArPanelTab(null)} />
          </View>
        </View>
      </Modal>

      <LiveChatInputModal
        visible={chatInputVisible}
        onClose={() => setChatInputVisible(false)}
        onSendMessage={handleSendMessage}
      />

      {/* 9. Contribution Ranking List Modal */}
      <GiftContributionListModal
        visible={contributionModalVisible}
        onClose={() => setContributionModalVisible(false)}
        roomId={roomId}
        hostId={room.host?._id || room.host}
      />

      <RoomEntryEffectEngine activeEntry={activeEntry} onComplete={id => {
        setActiveEntry(previous => {
          if (!previous || !id) return null;
          const remaining = (previous.queuedEntries || []).filter(entry => entry.entryId !== id);
          return remaining.length ? { ...remaining[remaining.length - 1], queuedEntries: remaining } : null;
        });
      }} />
      <GiftAnimationEngine animation={giftQueue.activeAnimation} onAnimationComplete={giftQueue.completeAnimation} fullScreen />

      {/* 10. Live Ended Summary Modal */}
      <LiveEndSummaryModal
        visible={endSummaryVisible}
        onReturnHome={() => {
          setEndSummaryVisible(false);
          navigation.navigate('MainTabs');
        }}
        host={room.host || { name: room.title || 'Host' }}
        durationText={formatDuration(Date.now() - liveStartTime.current)}
        income={room.totalDiamonds || room.totalCoins || 0}
        viewerCount={room.viewerCount || 0}
      />
    </View>
  );
}

function formatDuration(ms) {
  const totalSecs = Math.max(0, Math.floor(ms / 1000));
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${String(mins).padStart(2, '0')}min ${String(secs).padStart(2, '0')}s`;
}

const styles = StyleSheet.create({
  singleGuestMute: { position: 'absolute', bottom: 5, right: 5, padding: 7, backgroundColor: '#0009', borderRadius: 20 },
  guestVideos: { position: 'absolute', top: '22%', right: 10, gap: 8, zIndex: 12 },
  guestVideo: { width: 100, height: 140, borderRadius: 10, overflow: 'hidden' },
  screen: {
    flex: 1,
    backgroundColor: '#080B18',
    justifyContent: 'space-between',
  },
  videoContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    backgroundColor: '#0F172A',
    overflow: 'hidden',
  },
  pkSplitRow: {
    flex: 1,
    flexDirection: 'row',
  },
  streamHalf: {
    flex: 1,
    backgroundColor: '#1E293B',
    position: 'relative',
    overflow: 'hidden',
    borderRightWidth: 0.5,
    borderLeftWidth: 0.5,
    borderColor: '#334155',
  },
  avatarFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E1B4B',
  },
  streamFallbackAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#EC4899',
    marginBottom: 8,
  },
  fallbackText: {
    color: '#CBD5E1',
    fontWeight: '800',
    fontSize: 12,
  },
  streamFallbackAvatarLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#EC4899',
    marginBottom: 12,
  },
  fallbackTextLarge: {
    color: '#F8FAFC',
    fontWeight: '800',
    fontSize: 18,
  },
  streamTagLeft: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
  },
  streamTagRight: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    alignItems: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  streamTagHostText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },
  streamScore: {
    color: '#FEF08A',
    fontWeight: '900',
    fontSize: 10,
  },
  starSmall: {
    fontSize: 9,
  },
  pkBarWrapper: {
    marginTop: 30,
    zIndex: 15,
  },
  gentlemanPill: {
    alignSelf: 'center',
    backgroundColor: 'rgba(14, 165, 233, 0.35)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.6)',
  },
  gentlemanText: {
    color: '#E0F2FE',
    fontSize: 10,
    fontWeight: '800',
  },
  status: {
    position: 'absolute',
    top: '45%',
    left: 24,
    right: 24,
    alignItems: 'center',
    gap: 14,
    zIndex: 25,
  },
  message: {
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 23,
    backgroundColor: '#0008',
    padding: 16,
    borderRadius: 14,
  },
  lowerArea: {
    flex: 1,
    justifyContent: 'flex-end',
    position: 'relative',
    zIndex: 10,
  },
  gameAreaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 30,
  },
  floatingMiniGamePill: {
    position: 'absolute',
    right: 14,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#FF1493',
    shadowOpacity: 0.6,
    shadowRadius: 8,
    zIndex: 40,
  },
  miniGameGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  miniGameText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  miniGameLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00E676',
    borderWidth: 1,
    borderColor: '#FFF',
  },
  floatingGameBannerLive: {
    position: 'absolute',
    right: 8,
    bottom: 50,
    zIndex: 25,
  },
  pkResultBannerOverlay: {
    position: 'absolute',
    top: '32%',
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 100,
  },
  pkResultBannerCard: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
    elevation: 12,
    shadowColor: '#FF0080',
    shadowOpacity: 0.8,
    shadowRadius: 12,
  },
  pkResultOutcomeText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 6,
  },
  pkResultScoresText: {
    color: '#FEF08A',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
  },
});
