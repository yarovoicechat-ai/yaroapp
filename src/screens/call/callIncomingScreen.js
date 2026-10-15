import React, { useEffect, useRef, useContext, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../../context/AuthProvider';
import {
  StyleSheet,
  View,
  Image,
  Text,
  TouchableOpacity,
  Dimensions,
  PanResponder,
  Animated,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { getSocket } from '../../sockets';
import { apiUtil } from '../../utils/apiUtil';
import InCallManager from 'react-native-incall-manager';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { cancelIncomingCallNotification } from '../../utils/CallNotificationService';
import { AlertService } from '../../utils/AlertService';
import { getUserAvatar } from '../../utils/avatarUtil';
import { getValidOngoingCall } from '../../utils/callValidation';
import { getCallTiming, markCallLifecycle } from '../../utils/callLifecycle';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset } from '../../utils/safeAreaUtils';

const { width, height } = Dimensions.get('window');

const ChevronWave = ({ color, animValue }) => {
  const chevronOpacity1 = animValue.interpolate({
    inputRange: [0, 0.3, 0.6, 1],
    outputRange: [0.2, 1, 0.6, 0.2],
  });

  const chevronOpacity2 = animValue.interpolate({
    inputRange: [0, 0.3, 0.6, 1],
    outputRange: [0.2, 0.2, 1, 0.6],
  });

  const chevronOpacity3 = animValue.interpolate({
    inputRange: [0, 0.3, 0.6, 1],
    outputRange: [0.6, 0.2, 0.2, 1],
  });

  return (
    <View style={styles.chevronWave}>
      <Animated.View style={{ opacity: chevronOpacity3 }}>
        <Icon name="keyboard-arrow-up" size={16} color={color} />
      </Animated.View>
      <Animated.View style={[styles.middleChevron, { opacity: chevronOpacity2 }]}>
        <Icon name="keyboard-arrow-up" size={18} color={color} />
      </Animated.View>
      <Animated.View style={[styles.topChevron, { opacity: chevronOpacity1 }]}>
        <Icon name="keyboard-arrow-up" size={20} color={color} />
      </Animated.View>
    </View>
  );
};

const Incoming = ({ route }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const { user } = useContext(AuthContext);

  const {
    transactionId,
    channelName,
    agora = {},
    name,
    maxMinutes,
    callerImage,
    image,
    fromNotification,
    gender,
    createdAt,
    ringExpiresAt,
    isVideo,
    callType,
    callerId,
  } = route.params || {};

  const isVideoCall = isVideo === true || callType === 'video';
  const displayImage = callerImage || image;

  let parsedAgora = agora;
  if (typeof parsedAgora === 'string') {
    try {
      parsedAgora = JSON.parse(parsedAgora);
    } catch (_) {
      parsedAgora = agora || {};
    }
  }

  const animValue = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const acceptInFlightRef = useRef(false);
  const rejectInFlightRef = useRef(false);

  // Pulse animation for avatar and buttons
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.12,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const handleReject = async () => {
    if (!transactionId || rejectInFlightRef.current || acceptInFlightRef.current) return;
    rejectInFlightRef.current = true;
    try {
      InCallManager.stopRingtone();
    } catch (_) {}
    await cancelIncomingCallNotification(transactionId, 'rejected').catch(() => {});

    try {
      await apiUtil.post('/call/reject', { transactionId });
      navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'MainTabs' }] }));
    } catch (error) {
      console.log('Call reject failed:', error?.response?.status || error.message);
      rejectInFlightRef.current = false;
      navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'MainTabs' }] }));
    }
  };

  const handleAccept = async () => {
    if (!transactionId || acceptInFlightRef.current || rejectInFlightRef.current) return;
    acceptInFlightRef.current = true;
    try {
      InCallManager.stopRingtone();
    } catch (_) {}
    await cancelIncomingCallNotification(transactionId, 'accepting').catch(() => {});

    let acceptedCallData;
    try {
      const response = await apiUtil.post('/call/accept', { transactionId });
      acceptedCallData = response.data?.data;
      await markCallLifecycle(transactionId, 'accepted');
    } catch (error) {
      const status = Number(error?.response?.status || 0);
      if (status === 409 || status === 404) {
        await cancelIncomingCallNotification(transactionId, 'expired');
      }
      AlertService.show('Call Unavailable', 'This call is no longer active.', 'error');
      acceptInFlightRef.current = false;
      return;
    }

    let finalAgora = acceptedCallData?.agora || parsedAgora || agora || {};
    if (typeof finalAgora === 'string') {
      try {
        finalAgora = JSON.parse(finalAgora);
      } catch (_) {
        finalAgora = {};
      }
    }

    const ongoingCall = getValidOngoingCall(
      {
        transactionId: acceptedCallData?.transactionId || transactionId || '',
        channelName: acceptedCallData?.channelName || channelName || '',
        agora: finalAgora,
      },
      false
    );

    if (!ongoingCall) {
      AlertService.show('Call Error', 'Could not establish call connection.', 'error');
      acceptInFlightRef.current = false;
      return;
    }

    const isVideoCallTarget = isVideoCall || acceptedCallData?.isVideo === true || acceptedCallData?.callType === 'video';
    if (isVideoCallTarget) {
      navigation.replace('VideoCall', {
        ...ongoingCall,
        name: name || 'Caller',
        maxMinutes,
        isCaller: false,
        image: displayImage,
        gender,
        hostId: callerId,
      });
    } else {
      navigation.replace('OnGoing', {
        ...ongoingCall,
        name: name || 'Caller',
        maxMinutes,
        isCaller: false,
        image: displayImage,
      });
    }
  };

  // Pan Responders for swipe-up gestures (while keeping taps working!)
  const acceptPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) => gesture.dy < -15,
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy < -50) {
          handleAccept();
        }
      },
    })
  ).current;

  const rejectPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) => gesture.dy < -15,
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy < -50) {
          handleReject();
        }
      },
    })
  ).current;

  useEffect(() => {
    let timeoutId;
    Animated.loop(
      Animated.sequence([
        Animated.timing(animValue, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(animValue, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

    const safeBack = (state = 'ended', eventAt = Date.now()) => {
      cancelIncomingCallNotification(transactionId, state, eventAt).catch(() => {});
      try {
        InCallManager.stopRingtone();
      } catch (_) {}
      try {
        InCallManager.stop({ busytone: '_BUNDLE_' });
      } catch (_) {}
      navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'MainTabs' }] }));
    };

    const scheduleTimeout = (ringExpiresAtMs) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        verifyCallStatus(true);
      }, Math.max(0, ringExpiresAtMs - Date.now()));
    };

    const verifyCallStatus = async (expireWhenPending = false) => {
      if (!transactionId) return;
      try {
        const [[, acceptingStr], [, acceptedStr]] = await AsyncStorage.multiGet([
          'acceptingCall',
          'acceptedCall',
        ]);

        if (acceptingStr) {
          const accepting = JSON.parse(acceptingStr);
          if (String(accepting?.transactionId) === String(transactionId)) {
            try {
              InCallManager.stopRingtone();
            } catch (_) {}
            return;
          }
        }

        if (acceptedStr) {
          const accepted = JSON.parse(acceptedStr);
          if (String(accepted?.transactionId) === String(transactionId)) {
            try {
              InCallManager.stopRingtone();
            } catch (_) {}
            const targetScreen = isVideoCall ? 'VideoCall' : 'OnGoing';
            navigation.replace(targetScreen, {
              transactionId,
              channelName: accepted.channelName || channelName,
              agora: accepted.agora || parsedAgora,
              name: name || 'Caller',
              maxMinutes,
              isCaller: false,
              image: displayImage,
              gender,
              hostId: callerId,
            });
            return;
          }
        }

        const res = await apiUtil.get(`/call/status/${transactionId}`);
        if (res.data.success) {
          const { status: currentStatus, agora: fetchedAgora, channelName: fetchedChannel } = res.data.data;
          if (['ended', 'cancelled', 'rejected', 'missed', 'expired'].includes(currentStatus)) {
            safeBack(currentStatus);
            return;
          }
          if (['accepted', 'connecting', 'connected'].includes(currentStatus)) {
            try {
              InCallManager.stopRingtone();
            } catch (_) {}
            const targetScreen = isVideoCall ? 'VideoCall' : 'OnGoing';
            navigation.replace(targetScreen, {
              transactionId,
              channelName: fetchedChannel || channelName,
              agora: fetchedAgora || parsedAgora,
              name: name || 'Caller',
              maxMinutes,
              isCaller: false,
              image: displayImage,
              gender,
              hostId: callerId,
            });
            return;
          }
        }

        const timing = getCallTiming({
          createdAt: res.data.data.createdAt || createdAt,
          ringExpiresAt: res.data.data.ringExpiresAt || ringExpiresAt,
        });
        if (expireWhenPending && Date.now() >= timing.ringExpiresAtMs) {
          safeBack('expired', timing.ringExpiresAtMs);
          return;
        }
        scheduleTimeout(timing.ringExpiresAtMs);
      } catch (err) {
        if (expireWhenPending) {
          safeBack('expired');
        }
      }
    };

    verifyCallStatus();

    const { ringExpiresAtMs } = getCallTiming({ createdAt, ringExpiresAt });
    scheduleTimeout(ringExpiresAtMs);

    const handleCallEnded = ({ transactionId: endedTxn }) => {
      if (String(endedTxn) === String(transactionId)) {
        clearTimeout(timeoutId);
        safeBack();
      }
    };

    const activeSocket = getSocket();
    if (activeSocket) {
      activeSocket.on('callEnded', handleCallEnded);
      activeSocket.on('callCancelled', handleCallEnded);
      activeSocket.on('connect', verifyCallStatus);
    }

    return () => {
      clearTimeout(timeoutId);
      if (activeSocket) {
        activeSocket.off('callEnded', handleCallEnded);
        activeSocket.off('callCancelled', handleCallEnded);
        activeSocket.off('connect', verifyCallStatus);
      }
    };
  }, [transactionId, name, channelName, isVideoCall, displayImage, gender, callerId, createdAt, ringExpiresAt]);

  return (
    <LinearGradient
      colors={['#070214', '#110629', '#1C0B3B']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.screen,
        {
          paddingTop: topSafeInset + 14,
          paddingBottom: Math.max(28, (insets.bottom || 0) + 16),
        },
      ]}
    >
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Top Header & Call Type Badge */}
      <View style={styles.topBadgeContainer}>
        <LinearGradient
          colors={isVideoCall ? ['rgba(236,72,153,0.25)', 'rgba(124,58,237,0.25)'] : ['rgba(34,197,94,0.25)', 'rgba(14,165,233,0.25)']}
          style={styles.callTypePill}
        >
          <Icon
            name={isVideoCall ? 'videocam' : 'phone-in-talk'}
            size={18}
            color={isVideoCall ? '#F472B6' : '#4ADE80'}
          />
          <Text style={[styles.callTypeText, { color: isVideoCall ? '#F472B6' : '#4ADE80' }]}>
            {isVideoCall ? 'Incoming HD Video Call' : 'Incoming HD Voice Call'}
          </Text>
        </LinearGradient>
      </View>

      {/* Center Caller Profile */}
      <View style={styles.centerSection}>
        {/* Pulsing Avatar Container */}
        <View style={styles.avatarWrap}>
          <Animated.View
            style={[
              styles.avatarOuterRing,
              {
                borderColor: isVideoCall ? 'rgba(236,72,153,0.35)' : 'rgba(34,197,94,0.35)',
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />
          <View style={[styles.avatarInnerBorder, { borderColor: isVideoCall ? '#EC4899' : '#22C55E' }]}>
            <Image
              source={getUserAvatar(displayImage, gender)}
              style={styles.avatarImg}
              resizeMode="cover"
            />
          </View>
        </View>

        {/* Caller Info */}
        <View style={styles.infoBox}>
          <View style={styles.nameRow}>
            <Text style={styles.callerName} numberOfLines={1}>
              {name || 'Yaro User'}
            </Text>
            {gender === 'female' ? (
              <View style={[styles.genderBadge, { backgroundColor: '#F43F5E' }]}>
                <Text style={styles.genderSymbol}>♀</Text>
              </View>
            ) : gender === 'male' ? (
              <View style={[styles.genderBadge, { backgroundColor: '#0284C7' }]}>
                <Text style={styles.genderSymbol}>♂</Text>
              </View>
            ) : null}
          </View>

          {Boolean(callerId || route.params?.userId || route.params?.meethiId) && (
            <View style={styles.idChip}>
              <Text style={styles.idChipText}>
                ID: {callerId || route.params?.userId || route.params?.meethiId}
              </Text>
            </View>
          )}

          <View style={styles.liveCallingRow}>
            <View style={styles.pulseDot} />
            <Text style={styles.callingStatusText}>Calling you...</Text>
          </View>
        </View>
      </View>

      {/* Modern Slide / Tap Action Buttons */}
      <View style={styles.actionsBar}>
        {/* Decline Button */}
        <View style={styles.actionCol} {...rejectPan.panHandlers}>
          <ChevronWave color="#EF4444" animValue={animValue} />
          <TouchableOpacity
            onPress={handleReject}
            activeOpacity={0.85}
            style={styles.actionCircleBtn}
          >
            <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.actionBtnGradient}>
              <Icon name="call-end" size={28} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.actionLabel}>Decline</Text>
        </View>

        {/* Middle Visual Separator */}
        <View style={styles.middleDivider}>
          <View style={styles.dividerLine} />
          <Icon name="swap-vert" size={22} color="rgba(255,255,255,0.25)" />
          <View style={styles.dividerLine} />
        </View>

        {/* Accept Button */}
        <View style={styles.actionCol} {...acceptPan.panHandlers}>
          <ChevronWave color={isVideoCall ? '#EC4899' : '#22C55E'} animValue={animValue} />
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              onPress={handleAccept}
              activeOpacity={0.85}
              style={styles.actionCircleBtn}
            >
              <LinearGradient
                colors={isVideoCall ? ['#EC4899', '#7C3AED'] : ['#22C55E', '#16A34A']}
                style={styles.actionBtnGradient}
              >
                <Icon name={isVideoCall ? 'videocam' : 'call'} size={30} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
          <Text style={[styles.actionLabel, { color: isVideoCall ? '#F472B6' : '#4ADE80' }]}>
            Answer
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
};

export default Incoming;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  topBadgeContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  callTypePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  callTypeText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // Center Section
  centerSection: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  avatarWrap: {
    width: 170,
    height: 170,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarOuterRing: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 2,
  },
  avatarInnerBorder: {
    width: 136,
    height: 136,
    borderRadius: 68,
    padding: 3,
    borderWidth: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 64,
  },

  infoBox: {
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  callerName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  genderBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  genderSymbol: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  idChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: 10,
  },
  idChipText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11.5,
    fontWeight: '700',
  },
  liveCallingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  callingStatusText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 14,
    fontWeight: '600',
  },

  // Actions Bar
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 16,
  },
  actionCol: {
    alignItems: 'center',
  },
  actionCircleBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  actionBtnGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 8,
  },
  chevronWave: {
    alignItems: 'center',
    marginBottom: 8,
    height: 38,
    justifyContent: 'flex-end',
  },
  middleChevron: {
    marginTop: -8,
  },
  topChevron: {
    marginTop: -10,
  },
  middleDivider: {
    alignItems: 'center',
    marginBottom: 32,
    gap: 4,
  },
  dividerLine: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
});
