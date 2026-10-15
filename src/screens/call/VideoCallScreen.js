import React, { useState, useEffect, useRef, useContext, useMemo } from 'react';
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
  FlatList,
  Animated,
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
  RtcTextureView,
  RenderModeType,
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
import { resolveGiftVisual } from '../../components/gift/giftMediaUtils';
import GiftMedia from '../../components/GiftMedia';

const { width, height } = Dimensions.get('window');
const VideoRenderer = Platform.OS === 'android' ? RtcTextureView : RtcSurfaceView;
const QUANTITIES = [1, 5, 10, 52, 99, 520];

export default function VideoCallScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 24);
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

  const partnerId =
    route.params?.hostId ||
    route.params?.userId ||
    route.params?.callerId ||
    route.params?.host?._id ||
    route.params?.meethiId ||
    '';
  const myId = user?.userId || user?.meethiId || user?.id || '';

  // Call States
  const [callDuration, setCallDuration] = useState(0);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [remoteUid, setRemoteUid] = useState(null);
  const [isChannelJoined, setIsChannelJoined] = useState(false);
  const [remoteVideoActive, setRemoteVideoActive] = useState(true);

  // Gift States
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [gifts, setGifts] = useState([]);
  const [loadingGifts, setLoadingGifts] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const [selectedGift, setSelectedGift] = useState(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [showQtyPicker, setShowQtyPicker] = useState(false);
  const [sendingGift, setSendingGift] = useState(false);
  const [activeGiftBanner, setActiveGiftBanner] = useState(null);

  // Safety Controls
  const [safetyModalVisible, setSafetyModalVisible] = useState(false);
  const [reportReason, setReportReason] = useState('Inappropriate behavior');
  const [reportDetails, setReportDetails] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const agoraEngineRef = useRef(null);
  const timerRef = useRef(null);
  const isLeavingRef = useRef(false);
  const giftBannerTimerRef = useRef(null);

  // Timer: starts once remoteUid is connected
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

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Socket: remote call ended & incoming gifts during video call
  useEffect(() => {
    const sock = getSocket();
    if (!sock) return;

    const onCallEnded = (payload) => {
      if (!payload || !payload.transactionId || payload.transactionId === transactionId) {
        console.log('📞 Remote ended video call via socket');
        handleEndCall();
      }
    };

    const onGiftReceived = (payload) => {
      console.log('🎁 In-call gift received:', payload);
      const giftData = payload?.gift || payload;
      setActiveGiftBanner({
        senderName: payload?.senderName || payload?.sender?.name || name || 'Partner',
        giftName: giftData?.name || 'Gift',
        giftImage: giftData?.image || giftData?.iconUrl || '',
        quantity: payload?.quantity || 1,
      });
      if (giftBannerTimerRef.current) clearTimeout(giftBannerTimerRef.current);
      giftBannerTimerRef.current = setTimeout(() => {
        setActiveGiftBanner(null);
      }, 3500);
    };

    sock.on('callEnded', onCallEnded);
    sock.on('endCall', onCallEnded);
    sock.on('giftReceived', onGiftReceived);
    sock.on('callGift', onGiftReceived);

    return () => {
      sock.off('callEnded', onCallEnded);
      sock.off('endCall', onCallEnded);
      sock.off('giftReceived', onGiftReceived);
      sock.off('callGift', onGiftReceived);
    };
  }, [transactionId, name]);

  // Dynamic Categories for Gifts
  const categories = useMemo(() => {
    const cats = gifts
      .map((g) => (typeof g.category === 'string' ? g.category.trim() : g.category?.name?.trim()))
      .filter(Boolean);
    return ['All', ...Array.from(new Set(cats))];
  }, [gifts]);

  const filteredGifts = useMemo(() => {
    if (activeTab.toLowerCase() === 'all') return gifts;
    return gifts.filter((g) => {
      const c = typeof g.category === 'string' ? g.category : g.category?.name || '';
      return c.toLowerCase() === activeTab.toLowerCase();
    });
  }, [activeTab, gifts]);

  const fetchGifts = async () => {
    setLoadingGifts(true);
    try {
      const res = await apiUtil.get('/gifts');
      if (res.data?.success) {
        setGifts(Array.isArray(res.data.data) ? res.data.data : []);
      } else {
        setGifts([]);
      }
    } catch (err) {
      console.log('Error fetching gifts:', err?.message);
      setGifts([]);
    } finally {
      setLoadingGifts(false);
    }
  };

  const openGiftModal = () => {
    setSelectedGift(null);
    setSelectedQuantity(1);
    setShowQtyPicker(false);
    setShowGiftModal(true);
    if (!gifts.length) {
      fetchGifts();
    }
  };

  const handleSendGift = async () => {
    if (!selectedGift) {
      AlertService.show('Select a gift', 'Please tap on a gift to select it.', 'info');
      return;
    }
    const costPerUnit = Number(selectedGift.price ?? selectedGift.cost ?? selectedGift.priceDiamonds ?? 0);
    const totalCost = costPerUnit * selectedQuantity;
    const balance = Number(user?.diamonds || 0);

    if (balance < totalCost) {
      Alert.alert(
        'Insufficient Diamonds',
        `You need ${totalCost.toLocaleString()} Diamonds to send this gift. Your balance is ${balance.toLocaleString()} Diamonds.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Recharge',
            onPress: () => {
              setShowGiftModal(false);
              navigation.navigate('Recharge');
            },
          },
        ]
      );
      return;
    }

    try {
      setSendingGift(true);
      const res = await apiUtil.post('/gifts/send', {
        requestId: `vg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        giftId: selectedGift._id || selectedGift.id,
        quantity: selectedQuantity,
        receiverId: partnerId,
        receiverIds: partnerId ? [partnerId] : [],
        callId: transactionId,
        currency: 'DIAMONDS',
      });

      if (res.data?.success) {
        fetchUserProfile?.();
        const visual = resolveGiftVisual(selectedGift);
        setActiveGiftBanner({
          senderName: 'You',
          giftName: selectedGift.name,
          giftImage: visual.giftImage,
          giftIcon: visual.giftIcon,
          quantity: selectedQuantity,
        });
        if (giftBannerTimerRef.current) clearTimeout(giftBannerTimerRef.current);
        giftBannerTimerRef.current = setTimeout(() => {
          setActiveGiftBanner(null);
        }, 3500);

        setShowGiftModal(false);
        setSelectedGift(null);
        setSelectedQuantity(1);
      } else {
        AlertService.show('Gift failed', res.data?.message || 'Could not send gift', 'error');
      }
    } catch (err) {
      AlertService.show('Failed', err.response?.data?.message || err.message || 'Could not send gift', 'error');
    } finally {
      setSendingGift(false);
    }
  };

  // Initialize Agora Video Engine
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

        engine.initialize({ appId });
        engine.enableVideo();
        engine.enableAudio();
        engine.setChannelProfile(ChannelProfileType.ChannelProfileCommunication);
        engine.setClientRole(ClientRoleType.ClientRoleBroadcaster);
        engine.enableLocalVideo(true);
        engine.enableLocalAudio(true);
        engine.startPreview();

        engine.registerEventHandler({
          onJoinChannelSuccess: (connection, elapsed) => {
            console.log('✅ Video call channel joined:', connection.channelId, 'uid:', connection.localUid);
            setIsChannelJoined(true);
          },
          onUserJoined: (connection, u, elapsed) => {
            console.log('👤 Remote user joined video:', u);
            setRemoteUid(u);
            setRemoteVideoActive(true);
          },
          onRemoteVideoStateChanged: (connection, u, state, reason, elapsed) => {
            console.log('🎥 Remote video state changed:', u, 'state:', state);
            if (state === 1 || state === 2) {
              setRemoteUid(u);
              setRemoteVideoActive(true);
            } else if (state === 0 || state === 3) {
              setRemoteVideoActive(false);
            }
          },
          onUserMuteVideo: (connection, u, muted) => {
            console.log('👤 Remote muted video:', u, muted);
            setRemoteVideoActive(!muted);
          },
          onUserOffline: (connection, u, reason) => {
            console.log('👤 Remote user offline:', u);
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
      } catch (_) {}
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
      if (giftBannerTimerRef.current) clearTimeout(giftBannerTimerRef.current);
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
    const targetUserId = partnerId || route.params?.hostId || route.params?.userId;
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
    const targetUserId = partnerId || route.params?.hostId || route.params?.userId;
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
        {remoteUid && remoteVideoActive && agoraEngineRef.current ? (
          <VideoRenderer
            style={StyleSheet.absoluteFillObject}
            canvas={{ uid: Number(remoteUid), renderMode: RenderModeType.RenderModeHidden }}
          />
        ) : (
          <View style={styles.remoteFallback}>
            <LinearGradient
              colors={['#100624', '#1E0E3E', '#090314']}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.remoteAvatarGlow}>
              <Image
                source={getUserAvatar({ image, gender: route.params?.gender }, route.params?.gender)}
                style={styles.remoteAvatar}
              />
            </View>
            <Text style={styles.remotePartnerName}>{name}</Text>
            <Text style={styles.remoteConnectingText}>
              {remoteUid ? (remoteVideoActive ? 'Video Connected' : 'Camera Muted') : `Connecting with ${name}...`}
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
          <View style={styles.metaInfoWrap}>
            <Text style={styles.metaName} numberOfLines={1}>
              {name}
            </Text>
            <View style={styles.metaTimerRow}>
              <View style={styles.liveGreenDot} />
              <Text style={styles.metaTimer}>
                {remoteUid ? formatTime(callDuration) : 'Connecting...'}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.safetyBtn}
          onPress={() => setSafetyModalVisible(true)}
          activeOpacity={0.8}
        >
          <Icon name="shield-checkmark-outline" size={19} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Floating Active Gift Animation Banner */}
      {activeGiftBanner && (
        <View style={styles.giftBannerFloating}>
          <LinearGradient
            colors={['rgba(255, 64, 129, 0.95)', 'rgba(124, 58, 237, 0.95)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.giftBannerGradient}
          >
            {activeGiftBanner.giftImage ? (
              <Image source={{ uri: activeGiftBanner.giftImage }} style={styles.giftBannerImage} resizeMode="contain" />
            ) : (
              <Text style={styles.giftBannerEmoji}>{activeGiftBanner.giftIcon || '🎁'}</Text>
            )}
            <View style={styles.giftBannerTextWrap}>
              <Text style={styles.giftBannerSender} numberOfLines={1}>
                {activeGiftBanner.senderName} sent
              </Text>
              <Text style={styles.giftBannerName} numberOfLines={1}>
                {activeGiftBanner.giftName} x{activeGiftBanner.quantity}
              </Text>
            </View>
          </LinearGradient>
        </View>
      )}

      {/* Floating Picture-in-Picture Local Video View */}
      {isCameraOn && (
        <View style={styles.localPipCard}>
          {agoraEngineRef.current ? (
            <VideoRenderer
              style={StyleSheet.absoluteFillObject}
              zOrderMediaOverlay={true}
              canvas={{ uid: 0, renderMode: RenderModeType.RenderModeHidden }}
            />
          ) : (
            <View style={styles.localFallback}>
              <Icon name="person" size={24} color="#CBD5E1" />
            </View>
          )}
          <TouchableOpacity style={styles.cameraFlipBtn} onPress={toggleSwitchCamera} activeOpacity={0.8}>
            <Icon name="camera-reverse" size={17} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom Floating Control Bar with GIFT Button */}
      <View style={[styles.bottomControlsBar, { paddingBottom: bottomPadding }]}>
        <View style={styles.controlsRow}>
          {/* Camera Toggle */}
          <TouchableOpacity
            style={[styles.controlCircle, !isCameraOn && styles.controlCircleOff]}
            onPress={toggleCamera}
            activeOpacity={0.8}
          >
            <Icon name={isCameraOn ? 'videocam' : 'videocam-off'} size={22} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Mic Toggle */}
          <TouchableOpacity
            style={[styles.controlCircle, isMuted && styles.controlCircleOff]}
            onPress={toggleMute}
            activeOpacity={0.8}
          >
            <Icon name={isMuted ? 'mic-off' : 'mic'} size={22} color="#FFFFFF" />
          </TouchableOpacity>

          {/* GIFT BUTTON (Center Spotlight) */}
          <TouchableOpacity
            style={styles.giftSpotlightBtn}
            onPress={openGiftModal}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#FF3366', '#FF007A', '#7928CA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.giftBtnGradient}
            >
              <Icon name="gift" size={26} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.giftBtnLabel}>Gift</Text>
          </TouchableOpacity>

          {/* Speaker Toggle */}
          <TouchableOpacity
            style={[styles.controlCircle, !isSpeakerOn && styles.controlCircleOff]}
            onPress={toggleSpeaker}
            activeOpacity={0.8}
          >
            <Icon name={isSpeakerOn ? 'volume-high' : 'volume-mute'} size={22} color="#FFFFFF" />
          </TouchableOpacity>

          {/* End Call Button */}
          <TouchableOpacity
            style={styles.endCallCircle}
            onPress={handleEndCall}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#EF4444', '#DC2626']}
              style={styles.endCallGradient}
            >
              <Icon name="call" size={24} color="#FFFFFF" style={{ transform: [{ rotate: '135deg' }] }} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* ROOM-STYLE FULL GIFT MODAL BOTTOM SHEET */}
      <Modal
        visible={showGiftModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGiftModal(false)}
      >
        <TouchableOpacity
          style={styles.giftModalBackdrop}
          activeOpacity={1}
          onPress={() => setShowGiftModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.giftModalSheet, { paddingBottom: Math.max(16, (insets.bottom || 0) + 12) }]}
          >
            <LinearGradient
              colors={['#160832', '#0F0524']}
              style={StyleSheet.absoluteFillObject}
            />

            {/* Modal Header */}
            <View style={styles.giftModalHeader}>
              <View style={styles.giftHeaderLeft}>
                <Text style={styles.giftModalTitle}>Send Gift to {name}</Text>
                <View style={styles.diamondBadge}>
                  <Image
                    source={require('../../assets/icons/diamond.png')}
                    style={styles.diamondIconSmall}
                    resizeMode="contain"
                  />
                  <Text style={styles.diamondBadgeText}>
                    {Number(user?.diamonds || 0).toLocaleString()}
                  </Text>
                </View>
              </View>

              <View style={styles.giftHeaderRight}>
                <TouchableOpacity
                  style={styles.rechargeBtnSmall}
                  onPress={() => {
                    setShowGiftModal(false);
                    navigation.navigate('Recharge');
                  }}
                  activeOpacity={0.8}
                >
                  <LinearGradient colors={['#9333EA', '#7C3AED']} style={styles.rechargeGradient}>
                    <Text style={styles.rechargeTextSmall}>+ Recharge</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowGiftModal(false)}
                  style={styles.giftCloseBtn}
                  activeOpacity={0.7}
                >
                  <Icon name="close" size={20} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Categories Navigation Bar */}
            <View style={styles.giftCategoriesBar}>
              {categories.map((tab) => {
                const isActive = activeTab.toLowerCase() === tab.toLowerCase();
                return (
                  <TouchableOpacity
                    key={tab}
                    style={[styles.catTab, isActive && styles.catTabActive]}
                    onPress={() => {
                      setActiveTab(tab);
                      setSelectedGift(null);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.catTabText, isActive && styles.catTabTextActive]}>
                      {tab}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Gifts Grid */}
            {loadingGifts ? (
              <ActivityIndicator size="large" color="#EC4899" style={{ marginVertical: 45 }} />
            ) : filteredGifts.length === 0 ? (
              <View style={styles.emptyGiftsWrap}>
                <Icon name="gift-outline" size={40} color="rgba(255,255,255,0.25)" />
                <Text style={styles.emptyGiftsText}>No gifts in this category</Text>
              </View>
            ) : (
              <FlatList
                data={filteredGifts}
                numColumns={4}
                keyExtractor={(item) => String(item._id || item.id)}
                contentContainerStyle={styles.giftsGridContent}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const isSelected = String(selectedGift?._id || selectedGift?.id) === String(item._id || item.id);
                  const visual = resolveGiftVisual(item);
                  const price = item.price ?? item.cost ?? item.priceDiamonds ?? 0;

                  return (
                    <TouchableOpacity
                      style={[styles.giftCard, isSelected && styles.giftCardSelected]}
                      onPress={() => setSelectedGift(item)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.giftThumbWrap}>
                        {visual.giftImage ? (
                          <GiftMedia source={visual.giftImage} mediaType={item.mediaType} style={styles.giftThumb} />
                        ) : (
                          <Text style={styles.giftEmoji}>{visual.giftIcon || '🎁'}</Text>
                        )}
                      </View>
                      <Text style={styles.giftItemName} numberOfLines={1}>{item.name}</Text>
                      <View style={styles.giftPriceRow}>
                        <Image
                          source={require('../../assets/icons/diamond.png')}
                          style={{ width: 11, height: 11, marginRight: 2 }}
                          resizeMode="contain"
                        />
                        <Text style={styles.giftItemPrice}>{price}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            )}

            {/* Modal Bottom Send Action Bar */}
            <View style={styles.giftModalBottomRow}>
              {/* Quantity Selector Button */}
              <View style={styles.qtyContainer}>
                <TouchableOpacity
                  style={styles.qtyPickerBtn}
                  onPress={() => setShowQtyPicker(!showQtyPicker)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.qtyPickerText}>x{selectedQuantity}</Text>
                  <Icon name={showQtyPicker ? 'chevron-down' : 'chevron-up'} size={15} color="#fff" />
                </TouchableOpacity>

                {showQtyPicker && (
                  <View style={styles.qtyMenu}>
                    {QUANTITIES.map((qty) => (
                      <TouchableOpacity
                        key={qty}
                        style={styles.qtyMenuItem}
                        onPress={() => {
                          setSelectedQuantity(qty);
                          setShowQtyPicker(false);
                        }}
                      >
                        <Text style={[styles.qtyMenuText, selectedQuantity === qty && styles.qtyMenuTextActive]}>
                          x{qty}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Main Send Button */}
              <TouchableOpacity
                style={[styles.sendGiftBtn, (!selectedGift || sendingGift) && styles.sendGiftBtnDisabled]}
                disabled={!selectedGift || sendingGift}
                onPress={handleSendGift}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={selectedGift ? ['#FF2E93', '#7928CA'] : ['#3A3050', '#251F35']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.sendGiftGradient}
                >
                  {sendingGift ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.sendGiftBtnText}>
                      Send ({selectedGift ? Number(selectedGift.price ?? selectedGift.cost ?? selectedGift.priceDiamonds ?? 0) * selectedQuantity : 0})
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Safety & UGC Moderation Modal */}
      <Modal
        visible={safetyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSafetyModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSafetyModalVisible(false)}
        >
          <View style={styles.safetyDialog}>
            <View style={styles.safetyHeader}>
              <Icon name="shield-checkmark" size={24} color="#7C3AED" />
              <Text style={styles.safetyTitle}>Safety & Moderation</Text>
            </View>

            <TouchableOpacity style={styles.dangerRow} onPress={handleBlockUser} activeOpacity={0.8}>
              <Icon name="hand-left-outline" size={20} color="#EF4444" />
              <Text style={styles.dangerText}>Block User & End Call</Text>
            </TouchableOpacity>

            <Text style={styles.reportHeaderTitle}>Report Inappropriate Behavior</Text>
            {['Inappropriate content', 'Harassment', 'Spam/Scam', 'Underage user'].map((reason) => (
              <TouchableOpacity
                key={reason}
                style={[styles.reasonOption, reportReason === reason && styles.reasonOptionActive]}
                onPress={() => setReportReason(reason)}
                activeOpacity={0.8}
              >
                <Icon
                  name={reportReason === reason ? 'radio-button-on' : 'radio-button-off'}
                  size={18}
                  color={reportReason === reason ? '#7C3AED' : '#94A3B8'}
                />
                <Text style={styles.reasonText}>{reason}</Text>
              </TouchableOpacity>
            ))}

            <TextInput
              style={styles.reportInput}
              placeholder="Provide more context (optional)..."
              placeholderTextColor="#94A3B8"
              value={reportDetails}
              onChangeText={setReportDetails}
              multiline
              maxLength={200}
            />

            <View style={styles.reportActionsRow}>
              <TouchableOpacity
                style={styles.cancelReportBtn}
                onPress={() => setSafetyModalVisible(false)}
              >
                <Text style={styles.cancelReportText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitReportBtn}
                onPress={handleSubmitReport}
                disabled={submittingReport}
              >
                {submittingReport ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitReportText}>Submit Report</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#090314',
  },
  remoteFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  remoteAvatarGlow: {
    width: 140,
    height: 140,
    borderRadius: 70,
    padding: 4,
    backgroundColor: 'rgba(124, 58, 237, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  remoteAvatar: {
    width: 132,
    height: 132,
    borderRadius: 66,
  },
  remotePartnerName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  remoteConnectingText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 14,
    fontWeight: '600',
  },

  // Top Header
  topHeader: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  callMetaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 24,
    backgroundColor: 'rgba(15, 6, 32, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    maxWidth: width * 0.72,
  },
  metaAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 9,
    borderWidth: 1.5,
    borderColor: '#7C3AED',
  },
  metaInfoWrap: {
    flexShrink: 1,
  },
  metaName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  metaTimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 5,
  },
  liveGreenDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  metaTimer: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11.5,
    fontWeight: '700',
  },
  safetyBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(15, 6, 32, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Local PiP
  localPipCard: {
    position: 'absolute',
    top: 96,
    right: 16,
    width: 104,
    height: 148,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#1E1B4B',
    borderWidth: 2,
    borderColor: '#7C3AED',
    elevation: 8,
    zIndex: 15,
  },
  localFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  cameraFlipBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Active Gift Banner
  giftBannerFloating: {
    position: 'absolute',
    top: 155,
    left: 20,
    zIndex: 25,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 10,
    maxWidth: width * 0.7,
  },
  giftBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 10,
  },
  giftBannerImage: {
    width: 38,
    height: 38,
  },
  giftBannerEmoji: {
    fontSize: 28,
  },
  giftBannerTextWrap: {
    flexShrink: 1,
  },
  giftBannerSender: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    fontWeight: '600',
  },
  giftBannerName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },

  // Bottom Controls
  bottomControlsBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 36,
    backgroundColor: 'rgba(15, 6, 34, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  controlCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlCircleOff: {
    backgroundColor: 'rgba(239, 68, 68, 0.45)',
  },
  giftSpotlightBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftBtnGradient: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#FF007A',
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  giftBtnLabel: {
    color: '#FF80BF',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
  },
  endCallCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  endCallGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Gift Modal
  giftModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  giftModalSheet: {
    backgroundColor: '#160832',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 16,
    paddingHorizontal: 16,
    maxHeight: height * 0.68,
    overflow: 'hidden',
  },
  giftModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  giftHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  giftModalTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  diamondBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 215, 0, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  diamondIconSmall: {
    width: 13,
    height: 13,
    marginRight: 4,
  },
  diamondBadgeText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '800',
  },
  giftHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rechargeBtnSmall: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  rechargeGradient: {
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  rechargeTextSmall: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },
  giftCloseBtn: {
    padding: 4,
  },

  // Categories
  giftCategoriesBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    paddingBottom: 8,
  },
  catTab: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  catTabActive: {
    backgroundColor: '#7C3AED',
  },
  catTabText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    fontWeight: '700',
  },
  catTabTextActive: {
    color: '#FFFFFF',
  },

  // Grid
  giftsGridContent: {
    paddingVertical: 4,
  },
  emptyGiftsWrap: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyGiftsText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    marginTop: 8,
  },
  giftCard: {
    flex: 1 / 4,
    margin: 4,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  giftCardSelected: {
    borderColor: '#EC4899',
    backgroundColor: 'rgba(236, 72, 153, 0.16)',
  },
  giftThumbWrap: {
    width: 46,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  giftThumb: {
    width: 44,
    height: 44,
  },
  giftEmoji: {
    fontSize: 28,
  },
  giftItemName: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  giftPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  giftItemPrice: {
    color: '#FFD700',
    fontSize: 10.5,
    fontWeight: '800',
  },

  // Bottom Send Row
  giftModalBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  qtyContainer: {
    position: 'relative',
  },
  qtyPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  qtyPickerText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  qtyMenu: {
    position: 'absolute',
    bottom: 42,
    left: 0,
    width: 80,
    backgroundColor: '#241042',
    borderRadius: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    zIndex: 30,
  },
  qtyMenuItem: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  qtyMenuText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '700',
  },
  qtyMenuTextActive: {
    color: '#EC4899',
    fontWeight: '900',
  },
  sendGiftBtn: {
    flex: 1,
    marginLeft: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },
  sendGiftBtnDisabled: {
    opacity: 0.5,
  },
  sendGiftGradient: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendGiftBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  // Safety Dialog
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  safetyDialog: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
  },
  safetyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  safetyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 14,
    marginBottom: 16,
  },
  dangerText: {
    color: '#DC2626',
    fontWeight: '800',
    fontSize: 14,
  },
  reportHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 4,
  },
  reasonOptionActive: {
    backgroundColor: '#F3E8FF',
  },
  reasonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  reportInput: {
    height: 70,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 10,
    fontSize: 13,
    color: '#1E293B',
    textAlignVertical: 'top',
    marginTop: 8,
    marginBottom: 14,
  },
  reportActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelReportBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cancelReportText: {
    color: '#64748B',
    fontWeight: '700',
    fontSize: 14,
  },
  submitReportBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
  },
  submitReportText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});
