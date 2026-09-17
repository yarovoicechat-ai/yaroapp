import React, { useEffect, useState, useRef, useContext, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Platform,
  PermissionsAndroid,
  Modal,
  FlatList,
  ActivityIndicator,
  Dimensions,
  NativeModules,
  AppState,
  BackHandler,
  StatusBar,
  Animated,
  PanResponder,
} from 'react-native';
import { CommonActions } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
} from 'react-native-agora';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { apiUtil } from '../../utils/apiUtil.js';
import { getSocket, initSocket } from '../../sockets';
import GiftMedia from '../../components/GiftMedia';
import { AuthContext } from '../../context/AuthProvider';
import { useCall } from '../../context/CallContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset } from '../../utils/safeAreaUtils';
import { AlertService } from '../../utils/AlertService';
import { getUserAvatar } from '../../utils/avatarUtil';
import {
  cancelIncomingCallNotification,
  showOngoingCallNotification,
  stopOngoingCallNotification,
} from '../../utils/CallNotificationService';
import InCallManager from 'react-native-incall-manager';
import { FloatingCallBridge } from '../../services/FloatingCallBridge';
import { getRoleAgoraCredentials } from '../../utils/callValidation';

const { width, height } = Dimensions.get('window');
const { CallPip } = NativeModules;

// Responsive layout scaling helpers
const RF = (size) => Math.sqrt(width * width + height * height) * (size / 1000);
const WP = (percent) => (width * percent) / 100;
const HP = (percent) => (height * percent) / 100;

const OnGoing = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const { channelName = '', transactionId = '', name = '', agora = {}, isCaller = false, image = '', maxMinutes = 0, gender = '' } = route.params || {};
  const { user, setUser, updateDiamonds, updateCoins, fetchUserProfile } = useContext(AuthContext);
  const { activeCall, setActiveCall, clearCall, globalAgoraEngineRef } = useCall();

  const [timer, setTimer] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isRemoteMuted, setIsRemoteMuted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [endReason, setEndReason] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);

  const agoraEngineRef = useRef(null);
  const isAgoraInitializingRef = useRef(false);
  const joinRequestedRef = useRef(false);
  const hasJoinedChannelRef = useRef(false);
  const [isChannelJoined, setIsChannelJoined] = useState(false);
  const timerRef = useRef(null);
  const elapsedSecondsRef = useRef(0);
  const isLeavingRef = useRef(false);
  const callEndedRef = useRef(false);
  const navigationTimerRef = useRef(null);
  const giftTimerRef = useRef(null);
  const callStartRef = useRef(null);
  const hasShownLowBalanceWarningRef = useRef(false);
  const inAppMinimizedRef = useRef(false);

  useEffect(() => {
    cancelIncomingCallNotification(transactionId, 'ongoing').catch(() => {});
  }, [transactionId]);

  const restoreCallView = () => {
    setIsMinimized(false);
    if (inAppMinimizedRef.current && navigation.canGoBack()) {
      inAppMinimizedRef.current = false;
      navigation.goBack();
    }
  };

  // Draggable floating overlay pan responder
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 4 || Math.abs(gestureState.dy) > 4;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    })
  ).current;

  // Maximum allowed call duration enforcement is authoritative from backend billing events.
  // Paid minute entitlement allows call to remain active even when remaining wallet balance reaches 0.

  // Low balance warning enforcement (500 diamonds remaining)
  useEffect(() => {
    const totalBalance = Number((user?.coins || 0) + (user?.diamonds || 0));
    if (isCaller && totalBalance <= 500 && totalBalance > 0 && !hasShownLowBalanceWarningRef.current && !callEnded) {
      hasShownLowBalanceWarningRef.current = true;
      AlertService.show(
        'Low Balance Warning',
        'Warning: Your balance is running low! Only 500 diamonds remaining. Please recharge soon.',
        'info'
      );
    }
  }, [user?.coins, user?.diamonds, isCaller, callEnded]);

  // Sync call data with CallContext for floating overlay
  useEffect(() => {
    if (callEnded) {
      setActiveCall(null);
      return;
    }

    setActiveCall({
      isMinimized,
      channelName,
      transactionId,
      name,
      image,
      timer,
      isMuted,
      callEnded,
      endReason,
      params: route.params,
      onToggleMute: () => setIsMuted(prev => !prev),
      onEndCall: () => endCall(),
      onExpand: restoreCallView,
    });
  }, [isMinimized, timer, isMuted, callEnded, endReason, channelName, transactionId, name, image]);

  // Stop floating call overlay bubble whenever OnGoing screen is active in full-screen mode (isMinimized === false)
  useEffect(() => {
    if (!isMinimized && !callEndedRef.current) {
      console.log('[ONGOING] OnGoing full-screen view active -> stopping floating overlay bubble');
      FloatingCallBridge.stopFloatingCall();
    }
  }, [isMinimized]);

  // Native Floating System Overlay Bubble Event Subscriptions
  useEffect(() => {
    if (callEnded) {
      FloatingCallBridge.stopFloatingCall();
      return;
    }

    const unsubscribe = FloatingCallBridge.subscribeEvents({
      onOpenCall: () => {
        console.log('[ONGOING] Floating call bubble tapped -> restoring full screen view');
        restoreCallView();
        FloatingCallBridge.stopFloatingCall();
      },
      onToggleMute: (newMuteState) => {
        const targetMute = newMuteState !== undefined ? newMuteState : !isMuted;
        setIsMuted(targetMute);
        if (agoraEngineRef.current) {
          agoraEngineRef.current.muteLocalAudioStream(targetMute);
        }
      },
      onToggleSpeaker: (newSpeakerState) => {
        const targetSpeaker = newSpeakerState !== undefined ? newSpeakerState : !isSpeakerOn;
        setIsSpeakerOn(targetSpeaker);
        if (agoraEngineRef.current) {
          agoraEngineRef.current.setEnableSpeakerphone(targetSpeaker);
        }
      },
      onEndCall: () => {
        endCall('Call ended from floating bubble');
      },
    });

    return () => {
      unsubscribe();
    };
  }, [callEnded, isMuted, isSpeakerOn]);

  // AppState listener for App Minimizing / Home Button
  useEffect(() => {
    const handleAppStateChange = async (nextAppState) => {
      console.log('[ FLOATING ] AppState change:', nextAppState);
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        if (!callEndedRef.current) {
          console.log('[ FLOATING ] App moved to background -> setting isMinimized true');
          setIsMinimized(true);
          setActiveCall({
            isMinimized: true,
            channelName,
            transactionId,
            name,
            image: (getUserAvatar(image || route.params, route?.params?.gender || 'neutral')?.uri || ''),
            timer,
            isMuted,
            callEnded,
            endReason,
            params: route.params,
            onToggleMute: () => setIsMuted(prev => !prev),
            onEndCall: () => endCall(),
            onExpand: restoreCallView,
          });
          const hasPerm = await FloatingCallBridge.hasOverlayPermission();
          console.log('[ FLOATING ] Overlay permission =', hasPerm);
          // Never open Android settings during a live call. The foreground
          // service keeps audio alive even when the optional bubble is absent.
          FloatingCallBridge.startFloatingCall({
            name: name || 'Meethi Voice',
            image: (getUserAvatar(image || route.params, route?.params?.gender || 'neutral')?.uri || ''),
            isMuted,
            isSpeaker: isSpeakerOn,
          });
        }
      } else if (nextAppState === 'active') {
        console.log('[ FLOATING ] App moved to foreground');
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [name, image, isMuted, isSpeakerOn, timer, callEnded, endReason, channelName, transactionId]);

  // Hardware back button minimizes call view without unmounting OnGoing screen
  useEffect(() => {
    const onBackPress = () => {
      if (!isMinimized && !callEndedRef.current) {
        console.log(`[CALL_DEBUG] BACK_BUTTON_MINIMIZE tx=${transactionId}`);
        setShowGiftModal(false);
        setIsMinimized(true);
        setActiveCall({
          isMinimized: true,
          channelName,
          transactionId,
          name,
          image: (getUserAvatar(image || route.params, route?.params?.gender || 'neutral')?.uri || ''),
          timer,
          isMuted,
          callEnded,
          endReason,
          params: route.params,
          onToggleMute: () => setIsMuted(prev => !prev),
          onEndCall: () => endCall(),
          onExpand: restoreCallView,
        });
        FloatingCallBridge.startFloatingCall({
          name: name || 'Meethi Voice',
          image: (getUserAvatar(image || route.params, route?.params?.gender || 'neutral')?.uri || ''),
          isMuted,
          isSpeaker: isSpeakerOn,
        });
        inAppMinimizedRef.current = true;
        navigation.push('MainTabs');
        return true;
      }
      return false;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [isMinimized, name, image, isMuted, isSpeakerOn, transactionId, timer, callEnded, endReason, channelName]);

  // Gift State
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [gifts, setGifts] = useState([]);
  const [loadingGifts, setLoadingGifts] = useState(false);

  // Custom UI Selection States
  const [activeTab, setActiveTab] = useState('All');
  const [selectedPopupGift, setSelectedPopupGift] = useState(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [showQtyDropdown, setShowQtyDropdown] = useState(false);
  const [activeGift, setActiveGift] = useState(null);

  // Dynamic Categories System: Automatically extracts ANY new category created in Admin Panel
  const categories = useMemo(() => {
    const defaults = ['All', 'Popular', 'Luxury', 'Romantic', 'Special'];
    if (!gifts || gifts.length === 0) return defaults;

    const customCats = gifts
      .map(g => g.category?.trim())
      .filter(c => c && !defaults.some(d => d.toLowerCase() === c.toLowerCase()));

    const uniqueCustom = Array.from(new Set(customCats));
    return [...defaults, ...uniqueCustom];
  }, [gifts]);

  const quantities = [1, 5, 10, 52, 99, 520, 1314];

  // Request Microphone Permissions
  const requestPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'Meethi App needs access to your microphone so you can talk in voice calls.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Microphone permission request error:', err);
        return false;
      }
    }
    return true;
  };

  // Safe Navigation Reset after call ends
  const resetToHome = () => {
    try { InCallManager.stop(); } catch (_) {}
    stopOngoingCallNotification().catch(() => {});
    if (navigationTimerRef.current) clearTimeout(navigationTimerRef.current);

    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        })
      );
    }
  };

  // End Call Logic
  const endCall = async (reason = 'Call Ended') => {
    if (isLeavingRef.current) return;
    isLeavingRef.current = true;
    callEndedRef.current = true;

    console.trace('[CALL] endCall invoked', {
      transactionId,
      reason,
      isCaller,
      isLeaving: isLeavingRef.current,
      callEnded: callEndedRef.current,
      durationSeconds: elapsedSecondsRef.current,
      balance: (user?.diamonds !== undefined ? user.diamonds : user?.coins) || 0,
    });
    if (reason === 'Call Ended' || reason === 'Call ended' || reason?.includes('manual') || reason?.includes('user')) {
      console.log('[BILLING] MANUAL HANGUP:', transactionId, 'Reason:', reason);
    } else {
      console.log('[BILLING] AUTO TERMINATION:', transactionId, 'Reason:', reason);
    }
    console.trace('[BILLING] endCall stack trace for reason:', reason);
    setCallEnded(true);
    setEndReason(reason);

    if (reason === 'INSUFFICIENT_DIAMONDS' || String(reason).toLowerCase().includes('insufficient')) {
      AlertService.show(
        'Diamonds Exhausted',
        'Aapka diamond balance khatam ho gaya hai. Call terminate kar di gayi hai.',
        'warning'
      );
    }

    try { InCallManager.stop(); } catch (_) {}
    stopOngoingCallNotification().catch(() => {});
    FloatingCallBridge.stopFloatingCall();
    console.log('[CALL] FLOATING SERVICE STOPPED');

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    try {
      if (agoraEngineRef.current) {
        console.log('[CALL] AGORA TEARDOWN & AUDIO MUTE');
        const eng = agoraEngineRef.current;
        agoraEngineRef.current = null;
        try { eng.muteLocalAudioStream(true); } catch (_) {}
        try { eng.muteAllRemoteAudioStreams(true); } catch (_) {}
        try { eng.disableAudio(); } catch (_) {}
        try { eng.leaveChannel(); } catch (_) {}
        try { eng.release(); } catch (_) {}
        console.log('[CALL] AGORA TEARDOWN COMPLETE');
      }
    } catch (e) {
      console.log('Error releasing Agora engine:', e);
    } finally {
      if (globalAgoraEngineRef) globalAgoraEngineRef.current = null;
      agoraEngineRef.current = null;
      joinRequestedRef.current = false;
      hasJoinedChannelRef.current = false;
      isAgoraInitializingRef.current = false;
      setIsChannelJoined(false);
    }

    const durationSeconds = elapsedSecondsRef.current;
    try {
      await apiUtil.post('/call/end', { transactionId, durationSeconds });
    } catch (err) {
      console.log('Error notifying backend of call end:', err.response?.data || err.message);
    }

    navigationTimerRef.current = setTimeout(() => {
      resetToHome();
    }, 1500);
  };

  // Initialize Agora Engine
  const initAgora = async () => {
    if (agoraEngineRef.current || globalAgoraEngineRef?.current || isAgoraInitializingRef.current || callEndedRef.current) {
      if (globalAgoraEngineRef?.current && !agoraEngineRef.current) {
        agoraEngineRef.current = globalAgoraEngineRef.current;
      }
      console.log('[CALL] REUSING EXISTING AGORA OR INITIALIZING IN PROGRESS');
      return;
    }
    isAgoraInitializingRef.current = true;
    try {
      console.log('[CALL] INITIALIZING AGORA');
      let parsedAgora = agora || {};
      if (typeof parsedAgora === 'string') {
        try { parsedAgora = JSON.parse(parsedAgora); } catch (_) { parsedAgora = {}; }
      }
      if (!parsedAgora || typeof parsedAgora !== 'object') {
        parsedAgora = {};
      }
      const credentials = getRoleAgoraCredentials(parsedAgora, isCaller);
      if (!credentials || !channelName) {
        console.error('[CALL] Missing role-specific Agora credentials or channel');
        endCall('Call connection failed');
        return;
      }

      let engine;
      try {
        engine = createAgoraRtcEngine();
        agoraEngineRef.current = engine;
        if (globalAgoraEngineRef) globalAgoraEngineRef.current = engine;
      } catch (engineCreateErr) {
        console.error('Failed to create Agora RTC Engine:', engineCreateErr);
        agoraEngineRef.current = null;
        endCall('Call setup error');
        return;
      }

      const agoraAppId = credentials.appId;
      try {
        engine.initialize({ appId: agoraAppId });
        console.log('[CALL] AGORA INITIALIZED WITH APP ID:', agoraAppId);

        engine.enableAudio();
        engine.setChannelProfile(ChannelProfileType.ChannelProfileCommunication);
        engine.setClientRole(ClientRoleType.ClientRoleBroadcaster);
        engine.setEnableSpeakerphone(isSpeakerOn);

        engine.addListener('onJoinChannelSuccess', (connection, elapsed) => {
          console.log('[CALL] AGORA JOIN CHANNEL SUCCESS:', connection?.channelId, 'UID:', connection?.localUid);
          if (callEndedRef.current || isLeavingRef.current) {
            console.log('[CALL] JOIN SUCCESS RECEIVED AFTER CALL ENDED / LEAVING -> LEAVING IMMEDIATELY');
            try { engine.leaveChannel(); } catch (_) {}
            return;
          }
          joinRequestedRef.current = false;
          hasJoinedChannelRef.current = true;
          setIsChannelJoined(true);
        });

        engine.addListener('onUserMuteAudio', (connection, remoteUid, muted) => {
          if (callEndedRef.current || isLeavingRef.current) return;
          const isMutedState = typeof remoteUid === 'boolean' ? remoteUid : muted;
          setIsRemoteMuted(Boolean(isMutedState));
        });

        engine.addListener('onUserOffline', (connection, remoteUid, reason) => {
          if (callEndedRef.current || isLeavingRef.current) return;
          endCall('Other user disconnected');
        });

        engine.addListener('onError', (err, msg) => {
          if (callEndedRef.current || isLeavingRef.current) return;
          console.log('Agora Engine Error:', err, msg);
          if (err === 109 || err === 110 || err === 1001) {
            console.error('Fatal Agora RTC Token or Connection Error:', err, msg);
            joinRequestedRef.current = false;
            hasJoinedChannelRef.current = false;
            endCall('Call connection failed');
          }
        });
      } catch (initErr) {
        console.error('Failed to configure Agora RTC Engine:', initErr);
        try { engine.release(); } catch (_) {}
        agoraEngineRef.current = null;
        endCall('Call setup error');
        return;
      }

      const tokenToUse = credentials.token;
      const uidToUse = credentials.uid;
      if (!joinRequestedRef.current && !hasJoinedChannelRef.current) {
        try {
          joinRequestedRef.current = true;
          const res = engine.joinChannel(tokenToUse, String(channelName), uidToUse, {
            clientRoleType: ClientRoleType.ClientRoleBroadcaster,
          });
          if (res !== undefined && res !== null && typeof res === 'number' && res < 0) {
            console.error('Agora joinChannel returned error code:', res);
            joinRequestedRef.current = false;
            hasJoinedChannelRef.current = false;
            endCall('Call connection failed');
            return;
          }
          console.log('[CALL] AGORA JOIN REQUESTED:', channelName, 'UID:', uidToUse);
        } catch (joinErr) {
          console.log('[CALL] AGORA JOIN CHANNEL REQUEST ERROR:', joinErr);
          joinRequestedRef.current = false;
          hasJoinedChannelRef.current = false;
          endCall('Call connection failed');
          return;
        }
      }

      try {
        InCallManager.start({ media: 'audio', auto: true });
        InCallManager.setForceSpeakerphoneOn(false);
      } catch (err) {
        console.warn('InCallManager start error:', err);
      }
      showOngoingCallNotification({ name }).catch(() => {});
    } catch (e) {
      console.log('Failed to initialize Agora Engine:', e);
      endCall('Call setup error');
    } finally {
      isAgoraInitializingRef.current = false;
    }
  };

  useEffect(() => {
    isLeavingRef.current = false;
    callEndedRef.current = false;

    const startTimerInterval = () => {
      if (!timerRef.current) {
        timerRef.current = setInterval(() => {
          if (callStartRef.current) {
            const startMs = new Date(callStartRef.current).getTime();
            if (!isNaN(startMs)) {
              const elapsed = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
              setTimer(elapsed);
              elapsedSecondsRef.current = elapsed;
              return;
            }
          }
          setTimer(prev => {
            const next = prev + 1;
            elapsedSecondsRef.current = next;
            return next;
          });
        }, 1000);
      }
    };

    // Status & profile polling fallback
    const statusPoll = setInterval(async () => {
      if (callEndedRef.current || !transactionId) return;
      try {
        const [res, profileRes] = await Promise.all([
          apiUtil.get(`/call/status/${transactionId}`),
          apiUtil.get('/user/profile').catch(() => null),
        ]);

        if (profileRes?.data?.data) {
          setUser(prev => ({ ...prev, ...profileRes.data.data }));
        }

        const statusData = res.data?.data;
        if (statusData?.callStart) {
          callStartRef.current = statusData.callStart;
          const startMs = new Date(statusData.callStart).getTime();
          if (!isNaN(startMs)) {
            const elapsed = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
            setTimer(elapsed);
            elapsedSecondsRef.current = elapsed;
          }
        }

        const status = statusData?.status;
        if (['ended', 'cancelled', 'missed', 'expired', 'rejected'].includes(status)) {
          console.log(`[CALL_DEBUG] STATUS_POLL_TERMINAL tx=${transactionId} status=${status}`);
          endCall('Call ended');
        }
      } catch (err) {
        // ignore poll errors
      }
    }, 5000);

    const pulseInterval = setInterval(() => {
      if (callEndedRef.current) return;
      apiUtil.post('/call/pulse', { transactionId }).catch(() => {});
    }, 15000);

    const handleCallEnded = data => {
      if (data?.transactionId && String(data.transactionId) !== String(transactionId)) return;
      console.log('Received callEnded event from socket:', data?.reason);
      endCall(data?.reason || 'Call Ended');
    };

    const handleCallConnected = data => {
      if (data?.transactionId && String(data.transactionId) === String(transactionId)) {
        console.log("Received callConnected event from socket", data);
        if (data?.callStart) {
          callStartRef.current = data.callStart;
          const startMs = new Date(data.callStart).getTime();
          if (!isNaN(startMs)) {
            const elapsed = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
            setTimer(elapsed);
            elapsedSecondsRef.current = elapsed;
          }
        }
        startTimerInterval();
      }
    };

    const handleGiftReceived = gift => {
      if (gift?.callId && String(gift.callId) !== String(transactionId)) return;
      setActiveGift(gift);
      if (giftTimerRef.current) clearTimeout(giftTimerRef.current);
      giftTimerRef.current = setTimeout(() => setActiveGift(null), 1800);
    };

    const handleBalanceUpdated = data => {
      console.log("[BILLING] Live balanceUpdated received on call screen:", data);
      if (data && (data.coins !== undefined || data.diamonds !== undefined)) {
        const newCoins = data.coins !== undefined ? data.coins : (user?.coins || 0);
        const newDiamonds = data.diamonds !== undefined ? data.diamonds : (user?.diamonds || 0);
        if (setUser) {
          setUser(prev => prev ? {
            ...prev,
            coins: newCoins,
            diamonds: newDiamonds,
          } : prev);
        }
        if (fetchUserProfile) fetchUserProfile();
        // Paid minute entitlement model: Balance reaching 0 after a minute charge MUST NOT
        // disconnect an active paid call. Backend processActiveCallBilling handles minute expiration.
      }
    };

    const handleGiftCatalogUpdated = data => {
      console.log("🎁 Real-time giftCatalogUpdated event received from socket:", data);
      fetchGifts();
    };

    const activeSocket = getSocket();
    const registerListeners = (sock) => {
      sock.on('callEnded', handleCallEnded);
      sock.on('callConnected', handleCallConnected);
      sock.on('giftReceived', handleGiftReceived);
      sock.on('balanceUpdated', handleBalanceUpdated);
      sock.on('giftCatalogUpdated', handleGiftCatalogUpdated);
      sock.emit('joinChannel', { transactionId });
      console.log("🔌 Socket listeners registered on OnGoing screen");
    };

    if (activeSocket) {
      registerListeners(activeSocket);
    } else {
      initSocket().then((sock) => {
        if (sock) registerListeners(sock);
      });
    }

    if (callStartRef.current) {
      startTimerInterval();
    }

    requestPermission().then(hasMicPermission => {
      if (callEndedRef.current) return;
      if (!hasMicPermission) {
        AlertService.show(
          'Microphone permission required',
          'Please allow microphone access to connect the voice call.',
          'error'
        );
        endCall('Microphone permission denied');
        return;
      }
      initAgora();
    });

    fetchGifts();

    return () => {
      clearInterval(statusPoll);
      clearInterval(pulseInterval);

      if (callEndedRef.current) {
        const sock = getSocket() || activeSocket;
        if (sock) {
          sock.off('callEnded', handleCallEnded);
          sock.off('callConnected', handleCallConnected);
          sock.off('giftReceived', handleGiftReceived);
          sock.off('balanceUpdated', handleBalanceUpdated);
          sock.off('giftCatalogUpdated', handleGiftCatalogUpdated);
          console.log("🧹 Socket listeners cleaned up on OnGoing screen");
        }
        if (timerRef.current) clearInterval(timerRef.current);
        if (navigationTimerRef.current) clearTimeout(navigationTimerRef.current);
        if (giftTimerRef.current) clearTimeout(giftTimerRef.current);
        if (agoraEngineRef.current) {
          console.log('[CALL] AGORA LEAVE & RELEASE ON UNMOUNT');
          const eng = agoraEngineRef.current;
          agoraEngineRef.current = null;
          try { eng.leaveChannel(); } catch (_) {}
          try { eng.release(); } catch (_) {}
          joinRequestedRef.current = false;
          hasJoinedChannelRef.current = false;
          isAgoraInitializingRef.current = false;
          setIsChannelJoined(false);
        }
      } else {
        console.log('[CALL] APP BACKGROUNDED / MINIMIZED -> KEEPING CALL ALIVE (NOT RELEASING AGORA)');
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionId]);

  // Toggle Mute
  const toggleMute = () => {
    if (agoraEngineRef.current) {
      agoraEngineRef.current.muteLocalAudioStream(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  // Toggle Speaker
  const toggleSpeaker = () => {
    if (agoraEngineRef.current) {
      agoraEngineRef.current.setEnableSpeakerphone(!isSpeakerOn);
      setIsSpeakerOn(!isSpeakerOn);
    }
  };

  // Format Timer
  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  // --- GIFTS LOGIC ---
  const fetchGifts = async () => {
    setLoadingGifts(true);
    try {
      const res = await apiUtil.get('/gift/all');
      if (res.data?.success) {
        setGifts(res.data.data || []);
        if (res.data.data?.length > 0) {
          setSelectedPopupGift(res.data.data[0]);
        }
      }
    } catch (err) {
      console.log("Error fetching gifts", err);
    } finally {
      setLoadingGifts(false);
    }
  };

  const handleSendGift = async (gift, quantity = 1) => {
    if (!gift) {
      AlertService.show('Error', 'Please select a gift first', 'error');
      return;
    }
    const cost = (gift.cost || 0) * quantity;
    const userBalance = Number((user?.diamonds || 0) + (user?.coins || 0));
    if (userBalance < cost) {
      AlertService.show('Insufficient Balance', 'Please recharge your wallet to send this gift.', 'error');
      return;
    }

    try {
      const res = await apiUtil.post('/gift/send', {
        giftId: gift._id,
        callId: transactionId,
        count: quantity,
      });

      if (res.data?.success) {
        if (fetchUserProfile) fetchUserProfile();
        setActiveGift(res.data.data);
        if (giftTimerRef.current) clearTimeout(giftTimerRef.current);
        giftTimerRef.current = setTimeout(() => setActiveGift(null), 1800);
        setShowGiftModal(false);

      } else {
        AlertService.show('Failed', res.data?.message || 'Could not send gift', 'error');
      }
    } catch (err) {
      AlertService.show('Failed', err.response?.data?.message || 'Could not send gift', 'error');
    }
  };

  const getFilteredGifts = () => {
    if (activeTab.toLowerCase() === 'all') return gifts;
    return gifts.filter((gift) => {
      const category = gift.category || 'Popular';
      return category.toLowerCase() === activeTab.toLowerCase();
    });
  };

  const renderPopupGiftItem = ({ item }) => {
    const isSelected = selectedPopupGift?._id === item._id;
    return (
      <TouchableOpacity
        style={[styles.popupGiftItem, isSelected && styles.selectedPopupGiftItem]}
        onPress={() => setSelectedPopupGift(item)}
        activeOpacity={0.8}
      >
        <GiftMedia
          source={item.icon}
          mediaType={item.mediaType}
          style={styles.popupGiftIcon}
          resizeMode="contain"
          fallbackSource={require('../../assets/avtar.webp')}
        />
        <View style={styles.popupGiftDetails}>
          <Text style={styles.popupGiftName}>{item.name}</Text>
          <View style={styles.popupGiftCostRow}>
            <Image source={require('../../assets/icons/diamond.png')} style={{ width: 14, height: 14, marginRight: 4 }} resizeMode="contain" />
            <Text style={styles.popupGiftCost}>{item.cost}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const previewGifts = [
    { _id: 'preview_rose', name: 'Rose', cost: 10, previewIcon: 'flower' },
    { _id: 'preview_kiss', name: 'Kiss', cost: 20, previewIcon: 'lipstick' },
    { _id: 'preview_heart', name: 'Heart', cost: 50, previewIcon: 'heart' },
    { _id: 'preview_star', name: 'Star', cost: 80, previewIcon: 'star-four-points' },
    { _id: 'preview_crown', name: 'Crown', cost: 100, previewIcon: 'crown' },
  ];
  const featuredGifts = [...gifts.slice(0, 5), ...previewGifts].slice(0, 5);

  const getInitials = value => (value || 'You')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('');

  if (isMinimized) {
    // When minimized, OnGoing pops off the React Navigation stack via navigation.goBack()
    // so MainTabs stays 100% active, focused, and clickable on native Android!
    // The draggable floating widget is rendered at root level by CallContext!
    return null;
  }

  return (
    <LinearGradient
      colors={['#080214', '#150630', '#040108']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.profileCard,
        {
          paddingTop: topSafeInset + 12,
          paddingBottom: Math.max(16, (insets.bottom || 0) + 12),
        },
      ]}
    >
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <Image
        source={require('../../assets/call_background/ongoingbg.png')}
        style={styles.callBackground}
        resizeMode="cover"
      />
      {/* Minimize control: minimizes call view in-app to floating call banner */}
      <TouchableOpacity
        onPress={() => {
          setShowGiftModal(false);
          setIsMinimized(true);
          setActiveCall({
            isMinimized: true,
            channelName,
            transactionId,
            name,
            image,
            timer,
            isMuted,
            callEnded,
            endReason,
            params: route.params,
            onToggleMute: () => setIsMuted(prev => !prev),
            onEndCall: () => endCall(),
            onExpand: restoreCallView,
          });
          FloatingCallBridge.startFloatingCall({
            name: name || 'Meethi Voice',
            image: (getUserAvatar(image || route.params, route?.params?.gender || 'neutral')?.uri || ''),
            isMuted,
            isSpeaker: isSpeakerOn,
          });
          inAppMinimizedRef.current = true;
        navigation.push('MainTabs');
        }}
        activeOpacity={0.8}
        style={[styles.minimizeFloating, { top: topSafeInset + 10 }]}
      >
        <Icon name="chevron-down" size={23} color="#fff" />
        <Text style={styles.minimizeFloatingText}>MINIMIZE</Text>
      </TouchableOpacity>

      {activeGift && (
        <View pointerEvents="none" style={styles.giftCelebrationOverlay}>
          <View style={styles.giftCelebrationGlow}>
            <GiftMedia
              source={activeGift.animationUrl || activeGift.icon}
              mediaType={activeGift.mediaType}
              style={styles.giftCelebrationMedia}
            />
          </View>
        </View>
      )}

      <View pointerEvents="none" style={styles.ambientBackdrop}>
        <View style={[styles.ambientOrb, styles.ambientOrbLeft]} />
        <View style={[styles.ambientOrb, styles.ambientOrbRight]} />
        <View style={styles.horizonGlow} />
      </View>

      {/* Participants */}
      <View style={styles.topInfoSection}>
        <View style={styles.dualAvatarsRow}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatarHalo, styles.cyanHalo]}>
              <View style={styles.avatarCore}>
                <Image source={getUserAvatar(user)} style={styles.avatarImage} />
              </View>
            </View>
            {isMuted && (
              <View style={styles.muteBadge}>
                <Icon name="microphone-off" size={12} color="#fff" />
              </View>
            )}
            <View style={styles.avatarNamePill}>
              <Text style={styles.avatarNameText} numberOfLines={1}>{user?.name || 'You'}</Text>
            </View>
          </View>

          <View style={styles.avatarContainer}>
            <View style={[styles.avatarHalo, styles.purpleHalo]}>
              <View style={styles.avatarCore}>
                <Image source={getUserAvatar(image || route.params, route?.params?.gender || 'neutral')} style={styles.avatarImage} />
              </View>
            </View>
            {isRemoteMuted && (
              <View style={styles.muteBadge}>
                <Icon name="microphone-off" size={12} color="#fff" />
              </View>
            )}
            <View style={styles.avatarNamePill}>
              <Text style={styles.avatarNameText} numberOfLines={1}>{name || 'Meethi Voice Chat'}</Text>
            </View>
          </View>
        </View>
        <Text style={styles.timerText}>{formatTime(timer)}</Text>
        <View style={styles.connectedRow}>
          <View style={[styles.connectedDot, callEnded && styles.endedDot]} />
          <Text style={[styles.connectedText, callEnded && styles.endedText]}>
            {callEnded ? endReason || 'Call Ended' : 'Connected'}
          </Text>
        </View>
      </View>

      {/* Call Ended Overlay */}
      {callEnded && (
        <View style={styles.callEndedOverlay}>
          <Text style={styles.callEndedText}>{endReason || "Call Ended"}</Text>
          <Text style={styles.callEndedSubText}>{formatTime(timer)}</Text>
        </View>
      )}

      {/* Featured gift carousel */}
      <View style={styles.quickGiftSection}>
        <View style={styles.quickGiftHeader}>
          <Text style={styles.quickGiftTitle}>Send a Gift</Text>
          <TouchableOpacity
            style={styles.quickGiftBalance}
            activeOpacity={0.8}
            onPress={() => {
              setShowGiftModal(true);
              if (gifts[0]) setSelectedPopupGift(gifts[0]);
            }}
          >
            <Image source={require('../../assets/icons/diamond.png')} style={{ width: 16, height: 16, marginRight: 4 }} resizeMode="contain" />
            <Text style={styles.quickGiftBalanceText}>{Number((user?.coins || 0) + (user?.diamonds || 0)).toLocaleString()}</Text>
          </TouchableOpacity>
        </View>

        {loadingGifts ? (
          <ActivityIndicator size="small" color="#03dcfe" style={styles.featuredGiftLoader} />
        ) : (
          <FlatList
            horizontal
            data={[...featuredGifts, { _id: 'more_btn', isMoreBtn: true }]}
            keyExtractor={item => item._id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredGiftRow}
            renderItem={({ item }) => item.isMoreBtn ? (
              <TouchableOpacity
                style={[styles.quickGiftBox, styles.quickGiftMoreBox]}
                onPress={() => {
                  setShowGiftModal(true);
                  if (gifts[0]) setSelectedPopupGift(gifts[0]);
                }}
              >
                <Icon name="gift-open-outline" size={32} color="#03dcfe" />
                <Text style={styles.quickGiftMoreText}>More</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.quickGiftBox}>
                <View style={styles.giftVisualWrap}>
                  {item.previewIcon ? (
                    <Icon
                      name={item.previewIcon}
                      size={WP(10)}
                      color={item.previewIcon === 'heart' ? '#ff315d' : item.previewIcon === 'lipstick' ? '#ff4cac' : '#ff334f'}
                    />
                  ) : (
                    <GiftMedia source={item.icon} mediaType={item.mediaType} style={styles.quickGiftIcon} />
                  )}
                </View>
                <Text style={styles.quickGiftName} numberOfLines={1}>{item.name}</Text>
                <View style={styles.quickGiftCostRow}>
                  <Image source={require('../../assets/icons/diamond.png')} style={{ width: 12, height: 12, marginRight: 3 }} resizeMode="contain" />
                  <Text style={styles.quickGiftCost}>{item.cost}</Text>
                </View>
                <TouchableOpacity
                  style={styles.quickGiftSendBtn}
                  disabled={Boolean(item.previewIcon)}
                  onPress={() => handleSendGift(item, 1)}
                  activeOpacity={0.8}
                >
                  <LinearGradient colors={['#0aaeff', '#9d22f5']} style={styles.quickGiftSendBtnGradient}>
                    <Text style={styles.quickGiftSendBtnText}>Send</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
        <View style={styles.giftPagerRow}>
          <Icon name="chevron-left" size={28} color="rgba(167,177,255,0.55)" />
          <View style={styles.giftPagerDots}>
            <View style={[styles.giftPagerDot, styles.giftPagerDotActive]} />
            <View style={styles.giftPagerDot} />
            <View style={styles.giftPagerDot} />
          </View>
          <TouchableOpacity
            onPress={() => {
              setShowGiftModal(true);
              if (gifts[0]) setSelectedPopupGift(gifts[0]);
            }}
          >
            <Icon name="chevron-right" size={28} color="#9c50ff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Control Buttons Bar (Mute, Cancel, Speaker) */}
      <View style={styles.controlBar}>
        {/* Mute Toggle */}
        <View style={styles.controlWrapper}>
          <TouchableOpacity
            onPress={toggleMute}
            activeOpacity={0.8}
            style={[styles.controlButton, styles.activeControl, isMuted && styles.inactiveControl]}
          >
            <Image
              source={require('../../assets/microphone.webp')}
              style={[styles.controlIcon, isMuted && styles.mutedIcon]}
            />
          </TouchableOpacity>
          <Text style={styles.controlLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
        </View>

        {/* End Call Button */}
        <View style={styles.controlWrapper}>
          <TouchableOpacity
            onPress={() => endCall()}
            activeOpacity={0.8}
            style={[styles.controlButton, styles.endCallButton]}
          >
            <Icon
              name="phone-hangup"
              size={28}
              color="#ffffff"
            />
          </TouchableOpacity>
          <Text style={styles.controlLabel}>End</Text>
        </View>

        {/* Speaker Toggle */}
        <View style={styles.controlWrapper}>
          <TouchableOpacity
            onPress={toggleSpeaker}
            activeOpacity={0.8}
            style={[styles.controlButton, isSpeakerOn ? styles.activeControl : styles.inactiveControl]}
          >
            <Image
              source={require('../../assets/volume.webp')}
              style={styles.controlIcon}
            />
          </TouchableOpacity>
          <Text style={styles.controlLabel}>Speaker</Text>
        </View>
      </View>

      {/* Full Tabbed Gift Modal */}
      <Modal
        visible={showGiftModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowGiftModal(false)}
      >
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={['#11052C', '#0E093D']}
            style={[styles.modalContent, { paddingBottom: Math.max(WP(4), (insets.bottom || 0) + 12) }]}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <Text style={styles.modalTitle}>Choose a Gift</Text>
                <View style={styles.modalCoinBadge}>
                  <Icon name="bitcoin" size={14} color="#FFD700" />
                  <Text style={styles.modalCoinBadgeText}>
                    {Number((user?.coins || 0) + (user?.diamonds || 0)).toLocaleString()}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowGiftModal(false)} style={styles.closeBtn} activeOpacity={0.7}>
                <Icon name="close-circle" size={24} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            </View>

            {/* Categories Navigation Bar */}
            <View style={styles.categoriesTabBar}>
              {categories.map((tab) => {
                const isActive = activeTab.toLowerCase() === tab.toLowerCase();
                return (
                  <TouchableOpacity
                    key={tab}
                    style={[styles.categoryTabButton, isActive && styles.categoryTabButtonActive]}
                    onPress={() => {
                      setActiveTab(tab);
                      const filtered = gifts.filter(g => (g.category || 'Popular').toLowerCase() === tab.toLowerCase());
                      if (filtered.length > 0) {
                        setSelectedPopupGift(filtered[0]);
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.categoryTabText, isActive && styles.categoryTabTextActive]}>
                      {tab}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Gift List Content */}
            {loadingGifts ? (
              <ActivityIndicator size="large" color="#03dcfe" style={styles.modalLoader} />
            ) : getFilteredGifts().length === 0 ? (
              <View style={styles.modalEmptyState}>
                <Icon name="gift-off-outline" size={40} color="rgba(255,255,255,0.3)" />
                <Text style={styles.modalEmptyText}>No gifts in this category</Text>
              </View>
            ) : (
              <FlatList
                data={getFilteredGifts()}
                numColumns={4}
                keyExtractor={(item) => item._id}
                renderItem={renderPopupGiftItem}
                contentContainerStyle={styles.popupGiftGrid}
                showsVerticalScrollIndicator={false}
              />
            )}

            {/* Modal Bottom Send Action Bar */}
            <View style={styles.modalBottomBar}>
              {/* Quantity Selector Button */}
              <View style={styles.quantityPickerContainer}>
                <TouchableOpacity
                  style={styles.quantityPickerBtn}
                  onPress={() => setShowQtyDropdown(!showQtyDropdown)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.quantityPickerText}>x{selectedQuantity}</Text>
                  <Icon name={showQtyDropdown ? "chevron-down" : "chevron-up"} size={16} color="#fff" />
                </TouchableOpacity>

                {/* Dropdown Options */}
                {showQtyDropdown && (
                  <View style={styles.qtyDropdownMenu}>
                    {quantities.map((qty) => (
                      <TouchableOpacity
                        key={qty}
                        style={styles.qtyDropdownItem}
                        onPress={() => {
                          setSelectedQuantity(qty);
                          setShowQtyDropdown(false);
                        }}
                      >
                        <Text style={[styles.qtyDropdownItemText, selectedQuantity === qty && styles.qtyDropdownItemActive]}>
                          x{qty}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Main Send Action Button */}
              <TouchableOpacity
                style={[styles.modalSendBtn, !selectedPopupGift && styles.modalSendBtnDisabled]}
                disabled={!selectedPopupGift}
                onPress={() => handleSendGift(selectedPopupGift, selectedQuantity)}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={selectedPopupGift ? ['#FF3366', '#CB11F5'] : ['#4A4A6A', '#2E2E48']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalSendBtnGradient}
                >
                  <Text style={styles.modalSendBtnText}>
                    Send ({selectedPopupGift ? selectedPopupGift.cost * selectedQuantity : 0})
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  profileCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  callBackground: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.28,
  },
  minimizeFloating: {
    position: 'absolute',
    right: WP(4),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: WP(3),
    paddingVertical: HP(0.8),
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    zIndex: 99,
  },
  minimizeFloatingText: {
    color: '#ffffff',
    fontSize: RF(10),
    fontWeight: '700',
    letterSpacing: 1,
    marginLeft: 2,
  },
  ambientBackdrop: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  ambientOrb: {
    position: 'absolute',
    borderRadius: 999,
  },
  ambientOrbLeft: {
    top: HP(15),
    left: -WP(30),
    width: WP(90),
    height: WP(90),
    backgroundColor: 'rgba(3,220,254,0.12)',
  },
  ambientOrbRight: {
    bottom: HP(20),
    right: -WP(30),
    width: WP(90),
    height: WP(90),
    backgroundColor: 'rgba(168,85,247,0.14)',
  },
  horizonGlow: {
    position: 'absolute',
    bottom: HP(30),
    left: WP(10),
    right: WP(10),
    height: HP(12),
    backgroundColor: 'rgba(255,51,102,0.08)',
    borderRadius: 80,
  },
  topInfoSection: {
    alignItems: 'center',
    marginTop: HP(4),
    width: '100%',
    zIndex: 10,
  },
  dualAvatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: WP(80),
    marginBottom: HP(2),
  },
  avatarContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  avatarHalo: {
    padding: 3,
    borderRadius: 999,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  cyanHalo: {
    borderColor: '#03dcfe',
    shadowColor: '#03dcfe',
  },
  purpleHalo: {
    borderColor: '#a855f7',
    shadowColor: '#a855f7',
  },
  avatarCore: {
    width: WP(22),
    height: WP(22),
    borderRadius: WP(11),
    overflow: 'hidden',
    backgroundColor: '#1a0933',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    color: '#ffffff',
    fontSize: RF(20),
    fontWeight: 'bold',
  },
  muteBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#ff4949',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#080214',
  },
  avatarNamePill: {
    marginTop: HP(1),
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: WP(3),
    paddingVertical: HP(0.5),
    borderRadius: 12,
    maxWidth: WP(32),
  },
  avatarNameText: {
    color: '#fff',
    fontSize: RF(11),
    fontWeight: '600',
    textAlign: 'center',
  },
  timerText: {
    fontSize: RF(24),
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 2,
    marginTop: HP(1),
    textShadowColor: 'rgba(3, 220, 254, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  connectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: HP(0.5),
    backgroundColor: 'rgba(3,220,254,0.08)',
    paddingHorizontal: WP(3),
    paddingVertical: HP(0.4),
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(3,220,254,0.2)',
  },
  connectedDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 6,
  },
  endedDot: {
    backgroundColor: '#ef4444',
  },
  connectedText: {
    color: '#67e8f9',
    fontSize: RF(10),
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  endedText: {
    color: '#fca5a5',
  },
  callEndedOverlay: {
    position: 'absolute',
    top: HP(40),
    alignSelf: 'center',
    backgroundColor: 'rgba(15, 7, 32, 0.9)',
    paddingHorizontal: WP(8),
    paddingVertical: HP(2.5),
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 51, 102, 0.4)',
    zIndex: 100,
  },
  callEndedText: {
    color: '#ff3366',
    fontSize: RF(18),
    fontWeight: 'bold',
  },
  callEndedSubText: {
    color: '#a7b1ff',
    fontSize: RF(12),
    marginTop: 4,
  },
  quickGiftSection: {
    width: WP(92),
    backgroundColor: 'rgba(25, 12, 45, 0.65)',
    borderRadius: 24,
    padding: WP(3.5),
    borderWidth: 1,
    borderColor: 'rgba(167, 177, 255, 0.15)',
    zIndex: 10,
  },
  quickGiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: HP(1.5),
    paddingHorizontal: WP(1),
  },
  quickGiftTitle: {
    color: '#ffffff',
    fontSize: RF(13),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  quickGiftBalance: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: WP(2.5),
    paddingVertical: HP(0.4),
    borderRadius: 12,
  },
  quickGiftBalanceText: {
    color: '#ffd700',
    fontSize: RF(11),
    fontWeight: 'bold',
  },
  featuredGiftRow: {
    alignItems: 'center',
    paddingRight: WP(2),
  },
  featuredGiftLoader: {
    marginVertical: HP(2),
  },
  quickGiftBox: {
    width: WP(20),
    alignItems: 'center',
    marginRight: WP(2.5),
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: WP(2),
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  quickGiftMoreBox: {
    justifyContent: 'center',
    backgroundColor: 'rgba(3, 220, 254, 0.08)',
    borderColor: 'rgba(3, 220, 254, 0.3)',
  },
  quickGiftMoreText: {
    color: '#03dcfe',
    fontSize: RF(10),
    fontWeight: '700',
    marginTop: 4,
  },
  giftVisualWrap: {
    width: WP(12),
    height: WP(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  quickGiftIcon: {
    width: WP(11),
    height: WP(11),
  },
  quickGiftName: {
    color: '#ffffff',
    fontSize: RF(9.5),
    fontWeight: '600',
    textAlign: 'center',
  },
  quickGiftCostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 6,
  },
  quickGiftCost: {
    color: '#67e8f9',
    fontSize: RF(9),
    fontWeight: 'bold',
  },
  quickGiftSendBtn: {
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden',
  },
  quickGiftSendBtnGradient: {
    paddingVertical: HP(0.4),
    alignItems: 'center',
  },
  quickGiftSendBtnText: {
    color: '#ffffff',
    fontSize: RF(9),
    fontWeight: 'bold',
  },
  giftPagerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: HP(1),
    paddingHorizontal: WP(2),
  },
  giftPagerDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  giftPagerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 3,
  },
  giftPagerDotActive: {
    width: 14,
    backgroundColor: '#03dcfe',
  },
  controlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: WP(85),
    zIndex: 10,
  },
  controlWrapper: {
    alignItems: 'center',
  },
  controlButton: {
    width: WP(15),
    height: WP(15),
    borderRadius: WP(7.5),
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  activeControl: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  inactiveControl: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  endCallButton: {
    width: WP(18),
    height: WP(18),
    borderRadius: WP(9),
    backgroundColor: '#ff3366',
  },
  controlIcon: {
    width: WP(7),
    height: WP(7),
    tintColor: '#ffffff',
  },
  mutedIcon: {
    tintColor: '#ef4444',
  },
  endIcon: {
    width: WP(8),
    height: WP(8),
    tintColor: '#ffffff',
  },
  controlLabel: {
    color: '#a7b1ff',
    fontSize: RF(10),
    fontWeight: '600',
    marginTop: HP(0.8),
  },
  minimizedWrapper: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : (StatusBar.currentHeight || 24) + 64,
    right: 14,
    zIndex: 999999,
    elevation: 999999,
  },
  floatingCallBarContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#3A6FF8',
    shadowColor: '#A33CFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 15,
  },
  floatingCallBarGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  floatingCallLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  floatingAvatarWrap: {
    position: 'relative',
    marginRight: 10,
  },
  floatingAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#03dcfe',
  },
  floatingInitials: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#3b0764',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 38,
    fontWeight: 'bold',
    fontSize: 14,
  },
  floatingStatusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
    borderWidth: 1.5,
    borderColor: '#1a0933',
  },
  floatingInfo: {
    flex: 1,
  },
  floatingName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  floatingTimer: {
    color: '#67e8f9',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  floatingCallRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  floatingActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  floatingActionMuted: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
  },
  floatingEndBtn: {
    backgroundColor: '#ff3366',
  },
  giftCelebrationOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 90,
  },
  giftCelebrationGlow: {
    width: WP(55),
    height: WP(55),
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftCelebrationMedia: {
    width: WP(50),
    height: WP(50),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: height * 0.55,
    minHeight: height * 0.45,
    padding: WP(4),
    borderWidth: 1,
    borderColor: 'rgba(167, 177, 255, 0.2)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: HP(1.5),
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: RF(16),
    fontWeight: 'bold',
    marginRight: WP(3),
  },
  modalCoinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: WP(2.5),
    paddingVertical: HP(0.4),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  modalCoinBadgeText: {
    color: '#FFD700',
    fontSize: RF(11),
    fontWeight: 'bold',
    marginLeft: 4,
  },
  closeBtn: {
    padding: 4,
  },
  categoriesTabBar: {
    flexDirection: 'row',
    marginBottom: HP(1.5),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    paddingBottom: HP(0.8),
  },
  categoryTabButton: {
    paddingHorizontal: WP(3.5),
    paddingVertical: HP(0.6),
    marginRight: WP(2),
    borderRadius: 14,
  },
  categoryTabButtonActive: {
    backgroundColor: 'rgba(3, 220, 254, 0.15)',
    borderWidth: 1,
    borderColor: '#03dcfe',
  },
  categoryTabText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: RF(11),
    fontWeight: '600',
  },
  categoryTabTextActive: {
    color: '#03dcfe',
    fontWeight: 'bold',
  },
  modalLoader: {
    marginVertical: HP(5),
  },
  modalEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: HP(4),
  },
  modalEmptyText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: RF(12),
    marginTop: 8,
  },
  popupGiftGrid: {
    paddingBottom: HP(2),
  },
  popupGiftItem: {
    width: (width * 0.92 - WP(8)) / 4 - 6,
    margin: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    padding: WP(1.5),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  selectedPopupGiftItem: {
    borderColor: '#CB11F5',
    backgroundColor: 'rgba(203, 17, 245, 0.18)',
  },
  popupGiftIcon: {
    width: WP(12),
    height: WP(12),
    marginBottom: 4,
  },
  popupGiftDetails: {
    alignItems: 'center',
  },
  popupGiftName: {
    color: '#ffffff',
    fontSize: RF(9.5),
    fontWeight: '600',
    textAlign: 'center',
  },
  popupGiftCostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  popupGiftCost: {
    color: '#FFD700',
    fontSize: RF(9),
    fontWeight: 'bold',
  },
  modalBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: HP(1),
    paddingTop: HP(1),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  quantityPickerContainer: {
    position: 'relative',
  },
  quantityPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: WP(3),
    paddingVertical: HP(1),
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  quantityPickerText: {
    color: '#ffffff',
    fontSize: RF(12),
    fontWeight: 'bold',
    marginRight: 6,
  },
  qtyDropdownMenu: {
    position: 'absolute',
    bottom: HP(5),
    left: 0,
    backgroundColor: '#190B38',
    borderRadius: 14,
    padding: 4,
    width: WP(20),
    borderWidth: 1,
    borderColor: 'rgba(203, 17, 245, 0.4)',
    elevation: 10,
    zIndex: 100,
  },
  qtyDropdownItem: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  qtyDropdownItemText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: RF(11),
  },
  qtyDropdownItemActive: {
    color: '#03dcfe',
    fontWeight: 'bold',
  },
  modalSendBtn: {
    flex: 1,
    marginLeft: WP(3),
    borderRadius: 18,
    overflow: 'hidden',
  },
  modalSendBtnDisabled: {
    opacity: 0.5,
  },
  modalSendBtnGradient: {
    paddingVertical: HP(1.2),
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSendBtnText: {
    color: '#ffffff',
    fontSize: RF(13),
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

export default OnGoing;
