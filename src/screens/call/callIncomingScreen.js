import React, { useEffect, useRef } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
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
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { getSocket, initSocket } from "../../sockets";
import { apiUtil } from "../../utils/apiUtil";
import InCallManager from 'react-native-incall-manager';
import Icon from "react-native-vector-icons/MaterialIcons";
import { cancelIncomingCallNotification } from '../../utils/CallNotificationService';
import { AlertService } from '../../utils/AlertService';
import { getUserAvatar } from '../../utils/avatarUtil';
import { getValidOngoingCall } from '../../utils/callValidation';
import { getCallTiming, markCallLifecycle } from '../../utils/callLifecycle';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset } from '../../utils/safeAreaUtils';

const { width, height } = Dimensions.get('window');
const RF = (size) => Math.sqrt(width * width + height * height) * (size / 1000);
const WP = (percent) => (width * percent) / 100;
const HP = (percent) => (height * percent) / 100;

const ChevronWave = ({ color, animValue }) => {
  const chevronOpacity1 = animValue.interpolate({
    inputRange: [0, 0.3, 0.6, 1],
    outputRange: [0.2, 1, 0.6, 0.2]
  });

  const chevronOpacity2 = animValue.interpolate({
    inputRange: [0, 0.3, 0.6, 1],
    outputRange: [0.2, 0.2, 1, 0.6]
  });

  const chevronOpacity3 = animValue.interpolate({
    inputRange: [0, 0.3, 0.6, 1],
    outputRange: [0.6, 0.2, 0.2, 1]
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

  // Params from socket payload
  const { transactionId, channelName, agora = {}, name, maxMinutes, callerImage, image, fromNotification, gender, createdAt, ringExpiresAt } = route.params || {};
  const displayImage = callerImage || image; // Prioritize callerImage

  let parsedAgora = agora;
  if (typeof parsedAgora === 'string') {
    try { parsedAgora = JSON.parse(parsedAgora); } catch (_) { parsedAgora = agora || {}; }
  }

  // Animation values for Chevron Waves
  const animValue = useRef(new Animated.Value(0)).current;
  const acceptInFlightRef = useRef(false);
  const rejectInFlightRef = useRef(false);

  const handleReject = async () => {
    if (!transactionId || rejectInFlightRef.current || acceptInFlightRef.current) return;
    rejectInFlightRef.current = true;
    try { InCallManager.stopRingtone(); } catch (_) {}
    await cancelIncomingCallNotification(transactionId, 'rejected').catch(() => {});

    try {
      await apiUtil.post('/call/reject', { transactionId });
      console.log('[CALL] REJECT', transactionId);
      navigation.dispatch(
        CommonActions.reset({ index: 0, routes: [{ name: 'MainTabs' }] })
      );
    } catch (error) {
      console.log('Call reject failed:', error?.response?.status || error.message);
      rejectInFlightRef.current = false;
    }
  };

  const handleAccept = async () => {
    if (!transactionId || acceptInFlightRef.current || rejectInFlightRef.current) return;
    acceptInFlightRef.current = true;
    try { InCallManager.stopRingtone(); } catch (_) {}
    await cancelIncomingCallNotification(transactionId, 'accepting').catch(() => {});

    let acceptedCallData;
    try {
      const response = await apiUtil.post('/call/accept', { transactionId });
      acceptedCallData = response.data?.data;
      await markCallLifecycle(transactionId, 'accepted');
      console.log('[CALL] ACCEPT', transactionId);
    } catch (error) {
      const status = Number(error?.response?.status || 0);
      if (status === 409 || status === 404) {
        await cancelIncomingCallNotification(transactionId, 'expired');
      }
      AlertService.show('Call Unavailable', 'This call is no longer available.', 'error');
      acceptInFlightRef.current = false;
      return;
    }

    let finalAgora = acceptedCallData?.agora || parsedAgora || agora || {};
    if (typeof finalAgora === 'string') {
      try { finalAgora = JSON.parse(finalAgora); } catch (_) { finalAgora = {}; }
    }

    const ongoingCall = getValidOngoingCall({
      transactionId: acceptedCallData?.transactionId || transactionId || '',
      channelName: acceptedCallData?.channelName || channelName || '',
      agora: finalAgora,
    }, false);
    if (!ongoingCall) {
      AlertService.show('Call Error', 'Could not establish call connection.', 'error');
      acceptInFlightRef.current = false;
      return;
    }

    navigation.replace('OnGoing', {
      ...ongoingCall,
      name: name || 'Caller',
      maxMinutes,
      isCaller: false,
      image: displayImage,
    });
  };

  // Setup pan responders for swiping up
  const acceptPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dy < -50) {
          handleAccept();
        }
      },
      onPanResponderRelease: () => {},
    })
  ).current;

  const rejectPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dy < -50) {
          handleReject();
        }
      },
      onPanResponderRelease: () => {},
    })
  ).current;

  useEffect(() => {
    let mounted = true;
    let timeoutId;
    // Chevron Wave looping animation
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
        })
      ])
    ).start();

    // Helper for safe navigation to prevent app exit
    const safeBack = (state = 'ended', eventAt = Date.now()) => {
      cancelIncomingCallNotification(transactionId, state, eventAt).catch(() => {});
      try { InCallManager.stopRingtone(); } catch (_) {}
      try { InCallManager.stop({ busytone: '_BUNDLE_' }); } catch (_) {}
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        })
      );
    };

    const scheduleTimeout = ringExpiresAtMs => {
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
            console.log("⚡ Call is currently being accepted. Transitioning to OnGoing screen...");
            try { InCallManager.stopRingtone(); } catch (_) {}
            return;
          }
        }

        if (acceptedStr) {
          const accepted = JSON.parse(acceptedStr);
          if (String(accepted?.transactionId) === String(transactionId)) {
            console.log("⚡ Call was already accepted. Replacing screen with OnGoing...");
            try { InCallManager.stopRingtone(); } catch (_) {}
            navigation.replace("OnGoing", {
              transactionId,
              channelName: accepted.channelName || channelName,
              agora: accepted.agora || parsedAgora,
              name: name || 'Caller',
              maxMinutes,
              isCaller: false,
              image: displayImage,
            });
            return;
          }
        }

        console.log("🔍 Checking call status on Incoming screen...");
        const res = await apiUtil.get(`/call/status/${transactionId}`);
        if (res.data.success) {
          const { status: currentStatus, agora: fetchedAgora, channelName: fetchedChannel } = res.data.data;
          console.log("📡 API Call status on Incoming:", currentStatus);
          if (['ended', 'cancelled', 'rejected', 'missed', 'expired'].includes(currentStatus)) {
            console.log("❌ Call is not active anymore. Exiting incoming screen.");
            safeBack(currentStatus);
            return;
          }
          if (['accepted', 'connecting', 'connected'].includes(currentStatus)) {
            console.log("⚡ Call status is already accepted/connected. Transitioning to OnGoing...");
            try { InCallManager.stopRingtone(); } catch (_) {}
            navigation.replace("OnGoing", {
              transactionId,
              channelName: fetchedChannel || channelName,
              agora: fetchedAgora || parsedAgora,
              name: name || 'Caller',
              maxMinutes,
              isCaller: false,
              image: displayImage,
            });
            return;
          }
        }

        const timing = getCallTiming({
          createdAt: res.data.data.createdAt || createdAt,
          ringExpiresAt: res.data.data.ringExpiresAt || ringExpiresAt,
        });
        if (expireWhenPending && Date.now() >= timing.ringExpiresAtMs) {
          console.log('[TIMEOUT] INCOMING_EXPIRED tx=', transactionId);
          const timeoutSocket = getSocket();
          if (timeoutSocket?.connected) {
            timeoutSocket.emit('missedCall', { transactionId });
          }
          safeBack('expired', timing.ringExpiresAtMs);
          return;
        }
        scheduleTimeout(timing.ringExpiresAtMs);
      } catch (err) {
        console.error('Failed to verify call status on Incoming screen:', err.message);
        if (expireWhenPending) {
          safeBack('expired');
        }
      }
    };

    verifyCallStatus();

    const { ringExpiresAtMs } = getCallTiming({ createdAt, ringExpiresAt });
    scheduleTimeout(ringExpiresAtMs);

    // 🛑 Listener for Caller Cancellation
    const handleCallEnded = ({ transactionId: endedTxn }) => {
      if (String(endedTxn) === String(transactionId)) {
        console.log('Caller hung up');
        clearTimeout(timeoutId);
        safeBack();
      }
    };

    let activeSocket = getSocket();

    const registerListeners = (sock) => {
      sock.on('callEnded', handleCallEnded);
      sock.on('callCancelled', handleCallEnded);
      sock.on('connect', verifyCallStatus);
      console.log("🔌 Socket listeners registered immediately on Incoming screen");
    };

    if (activeSocket) {
      registerListeners(activeSocket);
    } else {
      initSocket().then((sock) => {
        if (mounted && sock) registerListeners(sock);
      });
    }

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      InCallManager.stopRingtone();
      cancelIncomingCallNotification(transactionId).catch(() => {});
      const sock = getSocket() || activeSocket;
      if (sock) {
        sock.off('callEnded', handleCallEnded);
        sock.off('callCancelled', handleCallEnded);
        sock.off('connect', verifyCallStatus);
        console.log("🧹 Socket listeners cleaned up on Incoming screen");
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, transactionId, fromNotification]);



  return (
    <LinearGradient
      colors={['#060212', '#0e0423', '#030109']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.profileCard,
        {
          paddingTop: topSafeInset + 16,
          paddingBottom: Math.max(24, (insets.bottom || 0) + 20),
        },
      ]}
    >
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      {/* Title Header with design lines */}
      <View style={styles.headerContainer}>
        <View style={styles.headerDividerLine} />
        <View style={styles.headerDiamond} />
        <Text style={styles.headerTitleText}>Incoming Call</Text>
        <View style={styles.headerDiamond} />
        <View style={styles.headerDividerLine} />
      </View>

      <View style={styles.mainContent}>
        {/* Equalizer Wave and Avatar row */}
        <View style={styles.avatarRowContainer}>
          {/* Left Equalizer */}
          <View style={styles.equalizerWave}>
            {[10, 16, 24, 32, 24, 16, 10].map((h, i) => (
              <View key={`l-${i}`} style={[styles.equalizerBar, { height: h }]} />
            ))}
          </View>

          {/* Central Avatar */}
          <View style={styles.avatarGlowContainer}>
            <View style={styles.avatarBorderOuter}>
              <Image
                source={getUserAvatar(displayImage, gender)}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* Right Equalizer */}
          <View style={styles.equalizerWave}>
            {[10, 16, 24, 32, 24, 16, 10].map((h, i) => (
              <View key={`r-${i}`} style={[styles.equalizerBar, { height: h }]} />
            ))}
          </View>
        </View>

        {/* User Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.nameRow}>
            <Text style={styles.callerNameText}>{name || "User"}</Text>
            {gender !== "male" && (
              <View style={styles.genderBadge}>
                <Text style={styles.genderSymbol}>♀</Text>
              </View>
            )}
          </View>

          <View style={styles.statusRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.statusText}>Online</Text>
          </View>

          <Text style={styles.callStatusText}>Calling you...</Text>

          {/* Breathing dots */}
          <View style={styles.dotsRow}>
            <View style={styles.breathingDot} />
            <View style={[styles.breathingDot, styles.breathingDotMid]} />
            <View style={[styles.breathingDot, styles.breathingDotEnd]} />
          </View>
        </View>
      </View>

      {/* Swipe Actions Panel */}
      <View style={styles.actionsContainer}>
        {/* Decline Slider button */}
        <View style={styles.sliderButtonWrapper}>
          <ChevronWave color="#e53935" animValue={animValue} />
          <View {...rejectPan.panHandlers}>
            <TouchableOpacity
              onPress={handleReject}
              activeOpacity={0.85}
              style={[styles.circleButton, styles.declineGlow]}
            >
              <LinearGradient
                colors={['#e35d5b', '#e53935']}
                style={styles.buttonGradient}
              >
                <Icon name="call-end" size={26} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
          <Text style={styles.actionLabel}>Slide up to decline</Text>
        </View>

        {/* Connecting visual arrows in middle */}
        <View style={styles.middleArrowsContainer}>
          <Icon name="double-arrow" size={18} color="rgba(124, 77, 255, 0.4)" />
        </View>

        {/* Answer Slider button */}
        <View style={styles.sliderButtonWrapper}>
          <ChevronWave color="#03dcfe" animValue={animValue} />
          <View {...acceptPan.panHandlers}>
            <TouchableOpacity
              onPress={handleAccept}
              activeOpacity={0.85}
              style={[styles.circleButton, styles.acceptGlow]}
            >
              <LinearGradient
                colors={['#7c4dff', '#03dcfe']}
                style={styles.buttonGradient}
              >
                <Icon name="call" size={26} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
          <Text style={styles.actionLabel}>Slide up to answer</Text>
        </View>
      </View>
    </LinearGradient>
  );
};

export default Incoming;

const styles = StyleSheet.create({
  profileCard: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    paddingHorizontal: 20,
  },
  headerDividerLine: {
    height: 1,
    backgroundColor: "rgba(124, 77, 255, 0.3)",
    flex: 1,
  },
  headerDiamond: {
    width: 6,
    height: 6,
    backgroundColor: "#03dcfe",
    transform: [{ rotate: "45deg" }],
  },
  headerTitleText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: RF(14),
    fontWeight: "bold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  mainContent: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    width: "100%",
  },
  avatarRowContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    width: "100%",
    marginBottom: HP(4),
  },
  equalizerWave: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    width: WP(20),
  },
  equalizerBar: {
    width: 2.5,
    backgroundColor: "#d946ef",
    borderRadius: 1.5,
    opacity: 0.6,
  },
  avatarGlowContainer: {
    shadowColor: "#7c4dff",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  avatarBorderOuter: {
    height: 150,
    width: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 2.5,
    borderColor: "#03dcfe",
    justifyContent: "center",
    alignItems: "center",
    padding: 6,
  },
  avatarImage: {
    height: "100%",
    width: "100%",
    borderRadius: 70,
  },
  detailsContainer: {
    alignItems: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 4,
  },
  callerNameText: {
    color: "#ffffff",
    fontSize: RF(24),
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  genderBadge: {
    backgroundColor: "#ec4899",
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  genderSymbol: {
    color: "#fff",
    fontSize: RF(10),
    fontWeight: "bold",
    marginTop: -1,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: HP(2),
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10b981",
  },
  statusText: {
    color: "#10b981",
    fontSize: RF(12),
    fontWeight: "600",
  },
  callStatusText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: RF(13),
    fontWeight: "500",
    marginBottom: 8,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  breathingDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#03dcfe",
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: WP(10),
  },
  sliderButtonWrapper: {
    alignItems: "center",
    flex: 0.45,
  },
  chevronWave: {
    alignItems: "center",
    justifyContent: "center",
    height: 40,
    marginBottom: 10,
  },
  circleButton: {
    width: 66,
    height: 66,
    borderRadius: 33,
    overflow: "hidden",
  },
  buttonGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  declineGlow: {
    shadowColor: "#e53935",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  acceptGlow: {
    shadowColor: "#03dcfe",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  actionLabel: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: RF(11),
    fontWeight: "bold",
    marginTop: 10,
    textAlign: "center",
  },
  middleArrowsContainer: {
    justifyContent: "center",
    alignItems: "center",
    height: 66,
    flex: 0.1,
  },
  middleChevron: {
    marginTop: -6,
  },
  topChevron: {
    marginTop: -6,
  },
  breathingDotMid: {
    opacity: 0.6,
  },
  breathingDotEnd: {
    opacity: 0.3,
  },
});
