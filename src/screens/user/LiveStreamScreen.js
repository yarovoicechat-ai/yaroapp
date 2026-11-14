import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  ActivityIndicator,
  AppState,
  Alert,
  Dimensions,
  Image,
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

const { width, height } = Dimensions.get('window');

export default function LiveStreamScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { activeRoom, leaveRoom } = useVoiceRoom();
  const roomId = route.params?.roomId;
  const [room, setRoom] = useState(route.params?.room || {});
  const [rtc, setRtc] = useState(null);
  const [connected, setConnected] = useState(false);
  const [remoteReady, setRemoteReady] = useState(false);
  const [error, setError] = useState('');
  const [muted, setMuted] = useState(false);
  const [camera, setCamera] = useState(true);

  // Live Stream Features & Interactivity State
  const [isFollowing, setIsFollowing] = useState(false);
  const [likeCount, setLikeCount] = useState(9);
  const [hearts, setHearts] = useState([]);
  const [comboCount, setComboCount] = useState(0);
  const [comboEmoji, setComboEmoji] = useState('❤️');
  const [recentGift, setRecentGift] = useState({
    senderName: 'Rocky',
    giftEmoji: '🌹',
    count: 1,
  });
  const [giftBanner, setGiftBanner] = useState({
    senderName: 'THAKUR SAHAB',
    receiverName: 'AB',
    giftName: 'Lion King',
  });
  const [messages, setMessages] = useState([
    { id: '1', senderName: 'Priyanshu', text: 'Welcome to the live show!', level: 12, isSvip: false },
    { id: '2', senderName: 'Rocky', text: 'Hello everyone ❤️', level: 18, isSvip: false },
    { id: '3', senderName: 'VIP Master', text: 'yha bhut shor ha', level: 30, isSvip: true, svipLevel: 1 },
    { id: '4', senderName: 'Abhishek Kumar', text: 'I love you', level: 10, isSvip: false },
  ]);

  // PK Battle State - Default is false (active only during PK match)
  const [isPK, setIsPK] = useState(Boolean(route.params?.isPK || room.isPKActive || room.pkBattleActive || false));
  const [leftScore, setLeftScore] = useState(room.leftScore || 0);
  const [rightScore, setRightScore] = useState(room.rightScore || 0);
  const rivalUser = room.rivalUser || {
    name: 'Rival Broadcaster',
    avatar: 'https://api.yaroapp.in/uploads/avatars/female_default.webp',
  };

  // Modals Visibility
  const [giftModalVisible, setGiftModalVisible] = useState(false);
  const [toolsModalVisible, setToolsModalVisible] = useState(false);
  const [chatInputVisible, setChatInputVisible] = useState(false);

  const engineRef = useRef(null);
  const rtcRef = useRef(route.params?.rtc || null);
  const closing = useRef(false);
  const captureStarted = useRef(false);

  const close = async () => {
    if (closing.current) return;
    closing.current = true;
    engineRef.current?.stopPreview();
    engineRef.current?.leaveChannel();
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
    const setup = async () => {
      try {
        if (activeRoom) await leaveRoom(undefined, { navigateBack: false });
        const response = await apiUtil.post(`/live/rooms/${roomId}/join`);
        const data = response.data.data;
        rtcRef.current = data.rtc;
        if (disposed || closing.current) {
          await close();
          return;
        }
        setRoom(data.room);
        setRtc(data.rtc);
        if (data.rtc.isHost && Platform.OS === 'android') {
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
        const engine = createAgoraRtcEngine();
        engineRef.current = engine;
        engine.initialize({
          appId: data.rtc.appId,
          channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
        });
        engine.registerEventHandler({
          onJoinChannelSuccess: () => {
            if (!disposed && !closing.current) setConnected(true);
          },
          onUserJoined: (_connection, uid) => {
            if (!disposed && uid === data.rtc.hostUid) setRemoteReady(true);
          },
          onUserOffline: (_connection, uid) => {
            if (!disposed && uid === data.rtc.hostUid) {
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
        if (isHost) {
          engine.startPreview();
          captureStarted.current = true;
        }
        const result = engine.joinChannel(
          data.rtc.token,
          data.rtc.channelName,
          data.rtc.agoraUid,
          {
            clientRoleType: isHost
              ? ClientRoleType.ClientRoleBroadcaster
              : ClientRoleType.ClientRoleAudience,
            publishCameraTrack: isHost,
            publishMicrophoneTrack: isHost,
            autoSubscribeAudio: true,
            autoSubscribeVideo: true,
          },
        );
        if (result < 0) throw new Error(`Unable to join live (${result}).`);
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
            }
          }
        };
        await heartbeat();
        if (!disposed) timer = setInterval(heartbeat, 15000);
      } catch (e) {
        await close();
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
        rtcRef.current?.isHost &&
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
      appState.remove();
      close();
      const engine = engineRef.current;
      engineRef.current = null;
      if (engine) {
        engine.stopPreview();
        engine.leaveChannel();
        engine.release();
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
              navigation.dispatch(event.data.action);
            },
          },
        ]);
      }),
    [navigation],
  );

  const isHost = rtc?.isHost;

  // Interactivity Handlers
  const handleLike = () => {
    setLikeCount(prev => prev + 1);
    const heartColors = ['#F43F5E', '#EC4899', '#A855F7', '#38BDF8', '#F59E0B', '#10B981'];
    const randomColor = heartColors[Math.floor(Math.random() * heartColors.length)];
    setHearts(prev => [...prev.slice(-15), { id: 'heart-' + Date.now() + '-' + Math.random(), color: randomColor }]);
  };

  const handleHeartComplete = heartId => {
    setHearts(prev => prev.filter(h => h.id !== heartId));
  };

  const handleSendMessage = text => {
    const newMsg = {
      id: 'msg-' + Date.now(),
      senderName: isHost ? (room.host?.name || 'Broadcaster') : 'Me',
      text,
      level: 15,
      isSvip: false,
    };
    setMessages(prev => [...prev.slice(-30), newMsg]);
  };

  const handleSendGift = ({ gift, quantity, receiver }) => {
    setGiftModalVisible(false);
    setComboEmoji(gift.emoji || '🎁');
    setComboCount(prev => prev + quantity);
    setRecentGift({
      senderName: 'Me',
      giftEmoji: gift.emoji || '🎁',
      count: quantity,
    });
    setGiftBanner({
      senderName: 'Me',
      receiverName: receiver.name || 'Broadcaster',
      giftName: gift.name,
    });
    if (receiver.name === rivalUser.name) {
      setRightScore(prev => prev + gift.price * quantity);
    } else {
      setLeftScore(prev => prev + gift.price * quantity);
    }
  };

  const handleSayHi = () => {
    handleSendMessage('Hi there broadcaster! 👋');
  };

  const handleToggleMute = () => {
    engineRef.current?.muteLocalAudioStream(!muted);
    setMuted(!muted);
  };

  const handleToggleCamera = () => {
    engineRef.current?.muteLocalVideoStream(camera);
    setCamera(!camera);
  };

  const handleSwitchCamera = () => {
    engineRef.current?.switchCamera();
  };

  const handleTogglePK = () => {
    if (!isHost) {
      AlertService.show('Notice', 'Only the broadcaster can initiate PK Battle', 'info');
      return;
    }
    const next = !isPK;
    setIsPK(next);
    if (next) {
      AlertService.show('PK Battle', 'PK Battle started!', 'success');
    } else {
      AlertService.show('PK Battle', 'PK Battle ended.', 'info');
    }
  };

  const videoHeight = isPK ? height * 0.44 : height;

  return (
    <View style={styles.screen}>
      {/* 1. Main Video Area (Single Host or PK Split Screen) */}
      <View style={[styles.videoContainer, { height: videoHeight }]}>
        {isPK ? (
          <View style={styles.pkSplitRow}>
            {/* Left Stream: Broadcaster */}
            <View style={styles.streamHalf}>
              {rtc && connected && (isHost || remoteReady) ? (
                <RtcSurfaceView
                  style={StyleSheet.absoluteFill}
                  canvas={{ uid: isHost ? 0 : rtc.hostUid }}
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
            {rtc && connected && (isHost || remoteReady) ? (
              <RtcSurfaceView
                style={StyleSheet.absoluteFill}
                canvas={{ uid: isHost ? 0 : rtc.hostUid }}
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
          colors={['rgba(15, 23, 42, 0.75)', 'transparent', 'rgba(15, 23, 42, 0.9)']}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
      </View>

      {/* 2. Top Header Bar (Host Capsule, Diamonds, Supporters, Close) */}
      <View style={{ paddingTop: insets.top + 8 }}>
        <LiveTopHeader
          room={room}
          isHost={isHost}
          viewerCount={room.viewerCount || 0}
          diamonds={room.totalDiamonds || 103190}
          hourlyRank={36}
          level={9}
          isFollowing={isFollowing}
          onFollow={() => setIsFollowing(!isFollowing)}
          onClose={() => navigation.goBack()}
          onPressHost={() => {}}
        />
      </View>

      {/* 3. Luxury Broadcast Gift Banner */}
      <LiveGiftBanner banner={giftBanner} />

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
          {!error && <ActivityIndicator color="#FFF" size="large" />}
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
        onOpenPK={handleTogglePK}
        onOpenGift={() => setGiftModalVisible(true)}
        onOpenPromo={() => {}}
        onPressHeart={handleLike}
        onOpenTools={() => setToolsModalVisible(true)}
        likeCount={likeCount}
        bottomPadding={insets.bottom + 10}
      />

      {/* 8. Modals: Gift Tray, Basic Tools, Live Chat Input */}
      <LiveGiftTrayModal
        visible={giftModalVisible}
        onClose={() => setGiftModalVisible(false)}
        coinBalance={1000}
        hostUser={room.host || { name: room.title || 'Broadcaster' }}
        rivalUser={rivalUser}
        isPK={isPK}
        onSendGift={handleSendGift}
        onRecharge={() => {}}
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
        onShare={() => setToolsModalVisible(false)}
        onReport={() => setToolsModalVisible(false)}
        onDailyTask={() => setToolsModalVisible(false)}
        bottomPadding={insets.bottom}
      />

      <LiveChatInputModal
        visible={chatInputVisible}
        onClose={() => setChatInputVisible(false)}
        onSendMessage={handleSendMessage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
