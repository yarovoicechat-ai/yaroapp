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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  RtcSurfaceView,
} from 'react-native-agora';
import Icon from 'react-native-vector-icons/Ionicons';
import { apiUtil } from '../../utils/apiUtil';
import { useVoiceRoom } from '../../context/VoiceRoomContext';

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
  return (
    <View style={styles.screen}>
      {rtc && connected && (isHost || remoteReady) && (
        <RtcSurfaceView
          style={StyleSheet.absoluteFill}
          canvas={{ uid: isHost ? 0 : rtc.hostUid }}
        />
      )}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.host}>
          <Text style={styles.name}>
            {room.host?.name || room.title || 'Live'}
          </Text>
          <Text style={styles.meta}>
            LIVE · {room.viewerCount || 0} viewers
          </Text>
        </View>
        <TouchableOpacity
          accessibilityLabel="Leave live"
          style={styles.control}
          onPress={() => navigation.goBack()}
        >
          <Icon name="close" size={26} color="#FFF" />
        </TouchableOpacity>
      </View>
      {(!connected || (!isHost && !remoteReady) || !!error) && (
        <View style={styles.status}>
          {!error && <ActivityIndicator color="#FFF" />}
          <Text style={styles.message}>
            {error ||
              (connected
                ? 'Waiting for the host video…'
                : 'Connecting to live…')}
          </Text>
        </View>
      )}
      {isHost && connected && (
        <View style={[styles.controls, { bottom: insets.bottom + 24 }]}>
          <TouchableOpacity
            accessibilityLabel="Switch camera"
            style={styles.control}
            onPress={() => engineRef.current?.switchCamera()}
          >
            <Icon name="camera-reverse" size={26} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel={muted ? 'Unmute microphone' : 'Mute microphone'}
            style={styles.control}
            onPress={() => {
              engineRef.current?.muteLocalAudioStream(!muted);
              setMuted(!muted);
            }}
          >
            <Icon name={muted ? 'mic-off' : 'mic'} size={26} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel={camera ? 'Turn camera off' : 'Turn camera on'}
            style={styles.control}
            onPress={() => {
              engineRef.current?.muteLocalVideoStream(camera);
              setCamera(!camera);
            }}
          >
            <Icon
              name={camera ? 'videocam' : 'videocam-off'}
              size={26}
              color="#FFF"
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#080B18' },
  header: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  host: {
    padding: 12,
    borderRadius: 20,
    backgroundColor: '#0008',
    maxWidth: '80%',
  },
  name: { color: '#FFF', fontWeight: '800', fontSize: 17 },
  meta: { color: '#FDA4AF', fontWeight: '700', marginTop: 4 },
  control: {
    backgroundColor: '#0008',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  status: {
    position: 'absolute',
    top: '45%',
    left: 24,
    right: 24,
    alignItems: 'center',
    gap: 14,
  },
  message: {
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 23,
    backgroundColor: '#0008',
    padding: 16,
    borderRadius: 14,
  },
  controls: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 20,
  },
});
