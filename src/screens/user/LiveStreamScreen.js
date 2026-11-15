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
  RtcSurfaceView,
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
import LiveChatOverlay from '../../components/live/LiveChatOverlay';
import LiveFloatingSideBadges from '../../components/live/LiveFloatingSideBadges';
import LiveBottomControls from '../../components/live/LiveBottomControls';
import LiveGiftTrayModal from '../../components/live/LiveGiftTrayModal';
import LiveToolsBottomSheet from '../../components/live/LiveToolsBottomSheet';
import LiveChatInputModal from '../../components/live/LiveChatInputModal';
import LiveConnectionSheet from '../../components/live/LiveConnectionSheet';
import LiveRechargeSheet from '../../components/live/LiveRechargeSheet';
import LiveGuestRequestsSheet from '../../components/live/LiveGuestRequestsSheet';
import GiftContributionListModal from '../../components/live/GiftContributionListModal';
import LiveEndSummaryModal from '../../components/live/LiveEndSummaryModal';
import { getSocket } from '../../sockets';
import { ARManager, ARFilterPanel, useARSession, useARLifecycle } from '../../features/YaroAR';

const { width, height } = Dimensions.get('window');

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
  const roomId = route.params?.roomId;
  const [room, setRoom] = useState(route.params?.room || {});
  const [rtc, setRtc] = useState(route.params?.rtc || null);
  const [previewReady, setPreviewReady] = useState(false);
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

  // Live Stream Features & Interactivity State
  const [isFollowing, setIsFollowing] = useState(false);
  const [likeCount, setLikeCount] = useState(room.totalLikes || 0);
  const [hearts, setHearts] = useState([]);
  const [comboCount, setComboCount] = useState(0);
  const [comboEmoji, setComboEmoji] = useState('❤️');
  const [recentGift, setRecentGift] = useState(null);
  const [giftBanner, setGiftBanner] = useState(null);
  const [messages, setMessages] = useState([]);

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

  const refreshBalance = async () => {
    try {
      const response = await apiUtil.get('/user/profile');
      const profile = response.data?.data?.user || response.data?.data;
      setCoinBalance(Number(profile?.diamonds || 0));
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

  useEffect(() => {
    const socket = getSocket();
    refreshBalance();
    if (!socket) return undefined;
    const join = () => socket.emit('live:join', { roomId });
    if (socket.connected) {
      join();
    }
    const handlers = {
      connect: join,
      'live:chat_message': message => setMessages(current => [...current.slice(-49), message]),
      'live:viewer_joined': data => setRoom(current => ({ ...current, viewerCount: data.viewerCount })),
      'live:viewer_left': data => setRoom(current => ({ ...current, viewerCount: data.viewerCount })),
      'live:like_update': data => setLikeCount(data.totalLikes),
      'live:gift_received': data => {
        setComboCount(data.gift?.quantity || 1);
        setComboEmoji(data.gift?.icon || data.gift?.image || '🎁');
        setGiftBanner({ senderName: data.sender?.name, receiverName: roomRef.current?.host?.name || 'Broadcaster', giftName: data.gift?.name });
        setRecentGift({ senderName: data.sender?.name, giftEmoji: data.gift?.icon || data.gift?.image || '🎁', count: data.gift?.quantity });
        setRoom(current => ({ ...current, totalDiamonds: data.totalDiamonds, topSupporters: data.topSupporters }));
        setLeftScore(data.leftScore || 0); setRightScore(data.rightScore || 0);
        refreshBalance();
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
      'live:guest_joined': data => setGuests(current => [...current.filter(g => g.id !== data.guest.id), data.guest]),
      'live:guest_left': data => setGuests(current => current.filter(g => (g.id || g.user?._id || g.user) !== data.userId)),
      'live:pk_started': data => {
        setIsPK(true);
        if (data.rivalHost) setRivalUser(data.rivalHost);
        if (data.leftScore !== undefined) setLeftScore(data.leftScore);
        if (data.rightScore !== undefined) setRightScore(data.rightScore);
      },
      'live:pk_score_update': data => {
        if (data.leftScore !== undefined) setLeftScore(data.leftScore);
        if (data.rightScore !== undefined) setRightScore(data.rightScore);
      },
      'live:pk_ended': () => {
        setIsPK(false);
        setRivalUser(null);
        setLeftScore(0);
        setRightScore(0);
      },
      'live:pk_invitation_received': data => {
        if (!rtcRef.current?.isHost) return;
        Alert.alert(
          '⚔️ PK Battle Challenge',
          `${data.fromHost?.name || 'A Broadcaster'} challenged you to a PK Battle!`,
          [
            { text: 'Decline', style: 'cancel' },
            {
              text: 'Accept ⚔️',
              onPress: () => {
                socket.emit('live:pk_accept', {
                  roomId,
                  inviterRoomId: data.fromRoomId,
                });
                setIsPK(true);
              },
            },
          ],
        );
      },
    };
    Object.entries(handlers).forEach(([event, handler]) => socket.on(event, handler));
    if (socket.connected) join();
    return () => {
      Object.entries(handlers).forEach(([event, handler]) => socket.off(event, handler));
      if (rtcRef.current?.isCoHost) socket.emit('live:leave_guest', { roomId });
      socket.emit('live:leave', { roomId });
    };
  }, [roomId]);

  const respondToRequest = (targetUserId, accept) => {
    const socket = getSocket();
    if (!socket?.connected) return;
    socket.emit(accept ? 'live:accept_guest' : 'live:reject_guest', { roomId, targetUserId });
    setJoinRequests(current => current.filter(user => user.id !== targetUserId));
  };

  const close = async () => {
    if (closing.current) return arReleaseRef.current;
    closing.current = true;
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
        const data = supplied?.isHost && supplied?.token && route.params?.room?._id === roomId
          ? { room: route.params.room, rtc: supplied }
          : (await apiUtil.post(`/live/rooms/${roomId}/join`)).data.data;
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
        engine.initialize({
          appId: data.rtc.appId,
          channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
        });
        if (data.rtc.isHost || data.rtc.isCoHost) arUnbindRef.current = ARManager.bind(engine, { inChannel: true });
        engine.registerEventHandler({
          onJoinChannelSuccess: () => {
            clearTimeout(connectionTimer);
            if (!disposed && !closing.current) { setConnected(true); setError(''); }
            if (!disposed && data.rtc.isHost && route.params?.arEffectId) {
              void ARManager.select(route.params.arEffectId).catch(e => ARManager.update({ error: e.message }));
            }
          },
          onFirstLocalVideoFrame: () => { if (!disposed && !closing.current) setPreviewReady(true); },
          onUserJoined: (_connection, uid) => {
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
        engine.enableVideo();
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
    engineRef.current?.muteLocalAudioStream(!muted);
    setMuted(!muted);
  };

  const handleToggleCamera = async () => {
    if (ARManager.getSnapshot().trackId !== null) {
      try {
        if (camera) await ARManager.pause(); else await ARManager.resume();
        if (rtcRef.current?.isHost || rtcRef.current?.isCoHost) {
          engineRef.current?.updateChannelMediaOptions({ publishCustomVideoTrack: !camera });
        }
        setCamera(!camera);
      } catch (e) { AlertService.show('Camera', e.message || 'Could not change camera state.', 'error'); }
      return;
    }
    engineRef.current?.muteLocalVideoStream(camera);
    setCamera(!camera);
  };

  const handleSwitchCamera = () => {
    if (ar.trackId !== null) {
      AlertService.show('Camera', 'Reset AR before switching the camera.', 'info');
      return;
    }
    engineRef.current?.switchCamera();
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
        const activeRooms = res.data?.data?.rooms || [];
        const otherRooms = activeRooms.filter(r => r._id !== roomId && r.status === 'live');
        if (otherRooms.length > 0) {
          const target = otherRooms[0];
          socket.emit('live:pk_invite', { roomId, targetRoomId: target._id });
          AlertService.show('PK Match', `Challenged ${target.host?.name || 'Broadcaster'} to PK Battle!`, 'info');
        } else {
          // If no other host is live right now, simulate/toggle local PK match
          setIsPK(true);
          setLeftScore(0);
          setRightScore(0);
          AlertService.show('PK Battle', 'PK Battle mode activated!', 'info');
        }
      } catch (err) {
        setIsPK(true);
      }
    }
    setRequestsVisible(false);
  };

  const videoHeight = isPK ? height * 0.44 : height;

  return (
    <View style={styles.screen}>
      {/* 1. Main Video Area (Single Host or PK Split Screen) */}
      <TouchableWithoutFeedback onPress={handleScreenDoubleTap}>
        <View style={[styles.videoContainer, { height: videoHeight }]}>
          {isPK ? (
            <View style={styles.pkSplitRow}>
              {/* Left Stream: Broadcaster */}
              <View style={styles.streamHalf}>
                {rtc && ((isHost && !error) || (connected && remoteReady)) ? (
                  <RtcSurfaceView
                    style={StyleSheet.absoluteFill}
                    canvas={{ uid: isHost ? 0 : rtc.hostUid, ...(isHost && ar.trackId !== null ? { sourceType: 4 } : {}) }}
                  />
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
                  <Text style={styles.fallbackText}>{rivalUser.name}</Text>
                </View>
                {/* Rival Broadcaster Name & Score Tag */}
                <View style={styles.streamTagRight}>
                  <Text style={styles.streamTagHostText}>💖 {rivalUser.name} 💖</Text>
                  <Text style={styles.streamScore}>⭐ {rightScore}</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={StyleSheet.absoluteFill}>
              {rtc && ((isHost && !error) || (connected && remoteReady)) ? (
                <RtcSurfaceView
                  style={StyleSheet.absoluteFill}
                  canvas={{ uid: isHost ? 0 : rtc.hostUid, ...(isHost && ar.trackId !== null ? { sourceType: 4 } : {}) }}
                />
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

      {/* 2. Top Header Bar (Host Capsule, Diamonds, Supporters, Close) */}
      <View style={{ paddingTop: insets.top + 8 }}>
        <LiveTopHeader
          room={room}
          isHost={isHost}
          viewerCount={room.viewerCount || 0}
          diamonds={room.totalDiamonds || 0}
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
      {guests.length > 0 && <View style={styles.guestVideos}>
        {guests.map(guest => <RtcSurfaceView key={guest.id || guest.agoraUid}
          style={styles.guestVideo} canvas={{ uid: guest.agoraUid === rtc?.agoraUid ? 0 : guest.agoraUid, ...(guest.agoraUid === rtc?.agoraUid && ar.trackId !== null ? { sourceType: 4 } : {}) }} />)}
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
            timeLeft="04:33"
          />
        </View>
      )}

      {/* 5. Center Status / Connection Indicator */}
      {(!connected || (!isHost && !remoteReady) || !!error) && (
        <View style={styles.status}>
          {!error && !previewReady && <ActivityIndicator color="#FFF" size="large" />}
          <Text style={styles.message}>
            {error ||
              (connected
                ? 'Waiting for the host video…'
                : 'Connecting to live…')}
          </Text>
        </View>
      )}

      {/* 6. Lower Content: Floating Badges (Right) + Live Chat Stream (Left) */}
      <View style={styles.lowerArea} pointerEvents="box-none">
        <LiveChatOverlay
          messages={messages}
          recentGift={recentGift}
          onSayHi={handleSayHi}
          onPressMessage={() => {}}
        />

        <LiveFloatingSideBadges
          hearts={hearts}
          onHeartComplete={handleHeartComplete}
          comboCount={comboCount}
          comboEmoji={comboEmoji}
          onPressTask={() => {}}
          onPressEvent={() => {}}
        />
      </View>

      {/* 7. Bottom Action Controls Bar */}
      <LiveBottomControls
        onOpenChat={() => setChatInputVisible(true)}
        onOpenPK={isHost ? () => setRequestsVisible(true) : openConnection}
        onOpenGift={() => setGiftModalVisible(true)}
        bottomPadding={insets.bottom + 10}
      />

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
        muted={muted}
        camera={camera}
        onSwitchCamera={handleSwitchCamera}
        onToggleMute={handleToggleMute}
        onToggleCamera={handleToggleCamera}
        onShare={() => { setToolsModalVisible(false); Share.share({ message: 'Join my live on Yaro: https://yaroapp.in/room/' + roomId }); }}
        onReport={() => setToolsModalVisible(false)}
        onDailyTask={() => setToolsModalVisible(false)}
        onEffects={() => { setToolsModalVisible(false); setArPanelTab('Effects'); }}
        onBeauty={() => { setToolsModalVisible(false); setArPanelTab('Beauty'); }}
        bottomPadding={insets.bottom}
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
        beauty={Boolean(ar.selectedId)} onBeauty={() => setArPanelTab('Beauty')}
        onEffects={() => setArPanelTab('Effects')}
        preview={<RtcSurfaceView style={StyleSheet.absoluteFill} canvas={{ uid: 0, sourceType: ar.trackId === null ? 0 : 4, mirrorMode: mirrored ? 1 : 2 }} />}
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

      {/* 10. Live Ended Summary Modal */}
      <LiveEndSummaryModal
        visible={endSummaryVisible}
        onReturnHome={() => {
          setEndSummaryVisible(false);
          navigation.navigate('MainTabs');
        }}
        host={room.host || { name: room.title || 'Host' }}
        durationText={formatDuration(Date.now() - liveStartTime.current)}
        income={room.totalDiamonds || 0}
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
});
