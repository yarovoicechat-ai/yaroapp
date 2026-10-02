import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  StatusBar,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import InCallManager from 'react-native-incall-manager';
import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  RtcSurfaceView,
  VideoSourceType,
} from 'react-native-agora';
import { AuthContext } from '../../context/AuthProvider';
import { useCall } from '../../context/CallContext';
import { apiUtil } from '../../utils/apiUtil';
import { getSocket } from '../../sockets';
import { getUserAvatar } from '../../utils/avatarUtil';
import { getRoleAgoraCredentials } from '../../utils/callValidation';
import { AlertService } from '../../utils/AlertService';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';

const { width, height } = Dimensions.get('window');

export default function VideoCallScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 28);
  const { user, fetchUserProfile } = useContext(AuthContext);
  const { clearCall } = useCall();

  const {
    channelName = 'yaro_video_' + Date.now(),
    transactionId = '',
    name = 'Host',
    image = '',
    gender,
    agora = {},
    isCaller = false,
    maxMinutes = 15,
  } = route.params || {};

  const partnerId = route.params?.hostId || route.params?.userId || route.params?.meethiId || route.params?.targetId || '';
  const myId = user?.userId || user?.meethiId || user?.id || '';

  const [callDuration, setCallDuration] = useState(0);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [remoteUid, setRemoteUid] = useState(null);
  const [isChannelJoined, setIsChannelJoined] = useState(false);

  // Safety controls
  const [safetyModalVisible, setSafetyModalVisible] = useState(false);
  const [reportReason, setReportReason] = useState('Inappropriate behavior');
  const [reportDetails, setReportDetails] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const agoraEngineRef = useRef(null);
  const timerRef = useRef(null);
  const isLeavingRef = useRef(false);

  // Timer counting - only starts when remoteUid connects!
  useEffect(() => {
    if (!remoteUid) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [remoteUid]);

  // Format MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Socket listener for remote hangup / call end
  useEffect(() => {
    const sock = getSocket();
    if (!sock) return;

    const onCallEnded = (payload) => {
      if (!payload || !payload.transactionId || payload.transactionId === transactionId) {
        console.log('📞 Remote ended video call via socket');
        handleEndCall();
      }
    };

    sock.on('callEnded', onCallEnded);
    sock.on('endCall', onCallEnded);
    return () => {
      sock.off('callEnded', onCallEnded);
      sock.off('endCall', onCallEnded);
    };
  }, [transactionId]);

  // Initialize Agora Video Engine with Android runtime permissions
  useEffect(() => {
    let engine = null;

    const setupVideoCall = async () => {
      try {
        if (Platform.OS === 'android') {
          const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.CAMERA,
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          ]);
          const cameraGranted = granted[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED;
          const audioGranted = granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;
          if (!cameraGranted || !audioGranted) {
            console.warn('⚠️ Camera or Audio permissions not granted:', granted);
          }
        }

        InCallManager.start({ media: 'video', auto: true });
        InCallManager.setSpeakerphoneOn(true);

        const creds = getRoleAgoraCredentials(agora, isCaller);
        const appId = creds?.appId || agora?.appId || 'd23c897f9305450faa7809ffcf666e57';
        const token = creds?.token || (isCaller ? agora?.callerToken : agora?.hostToken) || agora?.token || '';
        const uid = creds?.uid !== undefined ? creds.uid : (isCaller ? agora?.callerAgoraUid : agora?.hostAgoraUid) || 0;

        console.log('🎥 Initializing Agora Video:', { appId, channelName, uid, hasToken: !!token });

        engine = createAgoraRtcEngine();
        agoraEngineRef.current = engine;

        engine.initialize({ appId, channelProfile: ChannelProfileType.ChannelProfileCommunication });
        engine.enableVideo();
        engine.enableAudio();
        engine.enableLocalVideo(true);
        engine.enableLocalAudio(true);
        engine.startPreview();

        engine.registerEventHandler({
          onJoinChannelSuccess: (connection, elapsed) => {
            console.log('✅ Video call channel joined:', connection.channelId, 'uid:', connection.localUid);
            setIsChannelJoined(true);
          },
          onUserJoined: (connection, uid, elapsed) => {
            console.log('👤 Remote user joined video:', uid);
            setRemoteUid(uid);
          },
          onUserOffline: (connection, uid, reason) => {
            console.log('👤 Remote user offline:', uid);
            setRemoteUid(null);
            handleEndCall();
          },
          onError: (err, msg) => {
            console.log('⚠️ Agora video error:', err, msg);
          },
        });

        engine.joinChannel(token, channelName, uid, {
          clientRoleType: ClientRoleType.ClientRoleBroadcaster,
          publishCameraTrack: true,
          publishMicrophoneTrack: true,
          autoSubscribeAudio: true,
          autoSubscribeVideo: true,
        });
      } catch (err) {
        console.log('Agora video initialization failed:', err?.message);
      }
    };

    setupVideoCall();

    return () => {
      try {
        InCallManager.stop();
        if (engine) {
          engine.stopPreview();
          engine.leaveChannel();
          engine.release();
        }
      } catch (e) {
        // ignore
      }
    };
  }, [agora, channelName, isCaller]);

  const toggleCamera = () => {
    const nextState = !isCameraOn;
    setIsCameraOn(nextState);
    if (agoraEngineRef.current) {
      agoraEngineRef.current.enableLocalVideo(nextState);
    }
  };

  const toggleSwitchCamera = () => {
    setIsFrontCamera(!isFrontCamera);
    if (agoraEngineRef.current) {
      agoraEngineRef.current.switchCamera();
    }
  };

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (agoraEngineRef.current) {
      agoraEngineRef.current.muteLocalAudioStream(nextMute);
    }
  };

  const toggleSpeaker = () => {
    const nextSpeaker = !isSpeakerOn;
    setIsSpeakerOn(nextSpeaker);
    InCallManager.setSpeakerphoneOn(nextSpeaker);
  };

  const handleEndCall = async () => {
    if (isLeavingRef.current) return;
    isLeavingRef.current = true;

    try {
      if (timerRef.current) clearInterval(timerRef.current);
      InCallManager.stop();
      if (agoraEngineRef.current) {
        agoraEngineRef.current.stopPreview();
        agoraEngineRef.current.leaveChannel();
        agoraEngineRef.current.release();
        agoraEngineRef.current = null;
      }

      if (transactionId) {
        getSocket()?.emit('endCall', { transactionId });
        await apiUtil.post('/call/end', { transactionId }).catch(() => null);
      }
    } catch (e) {
      console.log('End call cleanup notice:', e?.message);
    } finally {
      clearCall();
      fetchUserProfile?.();
      navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'MainTabs' }] }));
    }
  };

  const handleBlockUser = () => {
    const targetUserId = route.params?.hostId || route.params?.userId;
    if (!targetUserId) {
      handleEndCall();
      return;
    }

    Alert.alert(
      'Block & End Call',
      `Are you sure you want to block ${name}? This will immediately end the call.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiUtil.post(`/user/block-contact/${targetUserId}`);
              AlertService.show('Blocked', `${name} has been blocked.`, 'success');
            } finally {
              setSafetyModalVisible(false);
              handleEndCall();
            }
          },
        },
      ]
    );
  };

  const handleSubmitReport = async () => {
    const targetUserId = route.params?.hostId || route.params?.userId;
    if (!targetUserId) return;

    try {
      setSubmittingReport(true);
      await apiUtil.post('/user/report', {
        reportedUserId: targetUserId,
        reason: reportReason,
        description: reportDetails || reportReason,
        reportedType: 'call',
      });
      setSafetyModalVisible(false);
      AlertService.show('Report Submitted', 'Our moderation team will review this call recording.', 'success');
    } catch (e) {
      AlertService.show('Error', e?.message || 'Failed to submit report', 'error');
    } finally {
      setSubmittingReport(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Main Remote Video or Fallback Avatar */}
      <View style={StyleSheet.absoluteFillObject}>
        {remoteUid && agoraEngineRef.current ? (
          <RtcSurfaceView
            style={StyleSheet.absoluteFillObject}
            canvas={{ uid: remoteUid, sourceType: VideoSourceType.VideoSourceRemote }}
          />
        ) : (
          <View style={styles.remoteFallback}>
            <Image
              source={getUserAvatar({ image, gender: route.params?.gender }, route.params?.gender)}
              style={styles.remoteAvatar}
            />
            <Text style={styles.remoteConnectingText}>
              {remoteUid ? `${name} (Video Muted)` : `Connecting with ${name}...`}
            </Text>
          </View>
        )}
      </View>

      {/* Top Header Overlay */}
      <View style={[styles.topHeader, { paddingTop: topSafeInset + 8 }]}>
        <View style={styles.callMetaCard}>
          <Image
            source={getUserAvatar({ image, gender: route.params?.gender }, route.params?.gender)}
            style={styles.metaAvatar}
          />
          <View>
            <Text style={styles.metaName} numberOfLines={1}>
              {name} {partnerId ? `(ID: ${partnerId})` : ''}
            </Text>
            <Text style={styles.metaTimer}>
              {remoteUid ? `⏱ ${formatTime(callDuration)}` : 'Connecting...'}
            </Text>
          </View>
        </View>

        {Boolean(myId) && (
          <View style={styles.myIdPill}>
            <Text style={styles.myIdText}>
              {user?.role === 'host' ? 'Host' : 'You'}: {myId}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.safetyBtn}
          onPress={() => setSafetyModalVisible(true)}
        >
          <Icon name="shield-outline" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Floating Picture-in-Picture Local Video View */}
      {isCameraOn && (
        <View style={styles.localPipCard}>
          {agoraEngineRef.current ? (
            <RtcSurfaceView
              style={StyleSheet.absoluteFillObject}
              zOrderMediaOverlay={true}
              canvas={{ uid: 0, sourceType: VideoSourceType.VideoSourceCamera }}
            />
          ) : (
            <View style={styles.localFallback}>
              <Icon name="person" size={24} color="#CBD5E1" />
            </View>
          )}
          <TouchableOpacity style={styles.cameraFlipBtn} onPress={toggleSwitchCamera}>
            <Icon name="camera-reverse" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom Floating Control Bar */}
      <View style={[styles.bottomControlsBar, { paddingBottom: bottomPadding }]}>
        <TouchableOpacity
          style={[styles.controlCircle, !isCameraOn && styles.controlCircleOff]}
          onPress={toggleCamera}
        >
          <Icon name={isCameraOn ? 'videocam' : 'videocam-off'} size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlCircle, isMuted && styles.controlCircleOff]}
          onPress={toggleMute}
        >
          <Icon name={isMuted ? 'mic-off' : 'mic'} size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlCircle, !isSpeakerOn && styles.controlCircleOff]}
          onPress={toggleSpeaker}
        >
          <Icon name={isSpeakerOn ? 'volume-high' : 'volume-mute'} size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.endCallCircle}
          onPress={handleEndCall}
        >
          <Icon name="call" size={26} color="#FFFFFF" style={{ transform: [{ rotate: '135deg' }] }} />
        </TouchableOpacity>
      </View>

      {/* Safety & UGC Moderation Modal */}
      <Modal
        visible={safetyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSafetyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.safetyDialog}>
            <View style={styles.safetyHeader}>
              <Icon name="shield-checkmark" size={24} color="#7C3AED" />
              <Text style={styles.safetyTitle}>Safety & Moderation</Text>
            </View>

            <TouchableOpacity style={styles.dangerRow} onPress={handleBlockUser}>
              <Icon name="hand-left-outline" size={20} color="#EF4444" />
              <Text style={styles.dangerText}>Block User & End Call</Text>
            </TouchableOpacity>

            <Text style={styles.reportHeaderTitle}>Report Inappropriate Behavior</Text>
            {['Inappropriate content', 'Harassment', 'Spam/Scam', 'Underage user'].map((reason) => (
              <TouchableOpacity
                key={reason}
                style={[styles.reasonPill, reportReason === reason && styles.reasonPillActive]}
                onPress={() => setReportReason(reason)}
              >
                <Text style={[styles.reasonText, reportReason === reason && styles.reasonTextActive]}>
                  {reason}
                </Text>
              </TouchableOpacity>
            ))}

            <TextInput
              style={styles.reportInput}
              placeholder="Additional details (optional)..."
              placeholderTextColor="#94A3B8"
              value={reportDetails}
              onChangeText={setReportDetails}
            />

            <View style={styles.safetyActionsRow}>
              <TouchableOpacity
                style={styles.safetyCancelBtn}
                onPress={() => setSafetyModalVisible(false)}
              >
                <Text style={styles.safetyCancelText}>Dismiss</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.safetySubmitBtn}
                onPress={handleSubmitReport}
                disabled={submittingReport}
              >
                <Text style={styles.safetySubmitText}>
                  {submittingReport ? 'Submitting...' : 'Submit Report'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  remoteFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
  },
  remoteAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#7C3AED',
    marginBottom: 16,
  },
  remoteConnectingText: {
    fontSize: 16,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  topHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  callMetaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderRadius: 24,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  metaAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  metaName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    maxWidth: 140,
  },
  metaTimer: {
    color: '#38BDF8',
    fontSize: 11.5,
    fontWeight: '600',
  },
  myIdPill: {
    backgroundColor: 'rgba(124, 58, 237, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  myIdText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  safetyBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  localPipCard: {
    position: 'absolute',
    top: 100,
    right: 16,
    width: 105,
    height: 145,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#7C3AED',
    elevation: 8,
    backgroundColor: '#1E293B',
  },
  localFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraFlipBtn: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomControlsBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingTop: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
  },
  controlCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlCircleOff: {
    backgroundColor: 'rgba(239, 68, 68, 0.75)',
  },
  endCallCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  safetyDialog: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  safetyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  safetyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    padding: 12,
    gap: 10,
    marginBottom: 16,
  },
  dangerText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '700',
  },
  reportHeaderTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  reasonPill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    marginBottom: 6,
  },
  reasonPillActive: {
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#7C3AED',
  },
  reasonText: {
    fontSize: 13,
    color: '#475569',
  },
  reasonTextActive: {
    color: '#7C3AED',
    fontWeight: '700',
  },
  reportInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    fontSize: 13,
    color: '#0F172A',
    marginVertical: 10,
    minHeight: 46,
  },
  safetyActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  safetyCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  safetyCancelText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#64748B',
  },
  safetySubmitBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  safetySubmitText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
