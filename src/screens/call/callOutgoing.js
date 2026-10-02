import React, { useEffect, useState, useContext, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import InCallManager from 'react-native-incall-manager';
import { getSocket, initSocket } from '../../sockets';
import { apiUtil } from '../../utils/apiUtil';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AuthContext } from '../../context/AuthProvider';
import { getUserAvatar } from '../../utils/avatarUtil';
import { getValidOngoingCall } from '../../utils/callValidation';
import { getCallTiming } from '../../utils/callLifecycle';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset } from '../../utils/safeAreaUtils';

const { width, height } = Dimensions.get('window');
const RF = (size) => Math.sqrt(width * width + height * height) * (size / 1000);
const WP = (percent) => (width * percent) / 100;
const HP = (percent) => (height * percent) / 100;

const OutGoing = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);

  const {
    transactionId,
    channelName,
    maxMinutes,
    callRatePerMinute = 100,
    name,
    agora,
    callerImage,
    image,
    gender,
    createdAt,
    ringExpiresAt,
    isVideo,
    callType,
    hostId,
    host,
  } = route.params || {};
  const isVideoCall = isVideo === true || callType === 'video';
  const noAnswerTimerRef = useRef(null);

  const [status, setStatus] = useState('Ringing...');
  const [micOn, setMicOn] = useState(true);
  const [speakerOn, setSpeakerOn] = useState(false);
  const [balance, setBalance] = useState(() => {
    if (route.params?.diamonds !== undefined) return route.params.diamonds;
    if (route.params?.balance !== undefined) return route.params.balance;
    if (user?.diamonds !== undefined) return user.diamonds;
    if (user?.coins !== undefined) return user.coins;
    return 0;
  });

  // Load User Balance from backend API fallback
  useEffect(() => {
    let isMounted = true;
    const fetchBalance = async () => {
      try {
        const res = await apiUtil.get('/user/profile');
        if (isMounted && res.data?.success) {
          const uData = res.data.data?.user || res.data.data;
          if (uData) {
            const liveDiamonds = uData.diamonds !== undefined ? uData.diamonds : (uData.coins !== undefined ? uData.coins : 0);
            setBalance(liveDiamonds);
          }
        }
      } catch (err) {
        console.log("Error loading balance for outgoing screen", err);
      }
    };
    fetchBalance();
    return () => { isMounted = false; };
  }, []);

  // Button Handlers
  const handleMicToggle = () => {
    setMicOn(!micOn);
  };

  const handleSpeakerToggle = () => {
    setSpeakerOn(!speakerOn);
  };

  const handleEndCall = async () => {
    console.log('📞 Call ended');
    try { InCallManager.stop({ busytone: '_BUNDLE_' }); } catch (_) {}
    const activeSocket = getSocket();
    if (transactionId) {
      activeSocket?.emit('endCall', { transactionId });
      try {
        await apiUtil.post('/call/end', { transactionId });
      } catch (error) {
        console.log('Call end API fallback:', error.response?.data || error.message);
      }
    }
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'MainTabs' }] }));
  };

  // Verify call status via API fallback
  const verifyCallStatus = async () => {
    if (!transactionId) return;
    try {
      console.log("🔍 Checking call status via API fallback...");
      const res = await apiUtil.get(`/call/status/${transactionId}`);
      if (res.data.success) {
        const { status: currentStatus, agora: fetchedAgora, channelName: fetchedChannel } = res.data.data;
        console.log("📡 API Call status:", currentStatus);
        
        if (['accepted', 'connecting', 'connected', 'ongoing'].includes(currentStatus)) {
          if (noAnswerTimerRef.current) clearTimeout(noAnswerTimerRef.current);
          console.log("🚀 Call already accepted! Transitioning to Ongoing/VideoCall screen...");
          try { InCallManager.stop(); } catch (_) {}
          setStatus("Accepted ✅");
          const ongoingCall = getValidOngoingCall({
            transactionId,
            channelName: fetchedChannel || channelName,
            agora: fetchedAgora || agora,
          }, true);
          if (!ongoingCall) {
            setStatus('Connection failed');
            handleEndCall();
            return;
          }
          const isVideoCallTarget = isVideoCall || res.data.data?.isVideo === true || res.data.data?.callType === 'video';
          if (isVideoCallTarget) {
            navigation.replace("VideoCall", {
              ...ongoingCall,
              name: name || 'User',
              maxMinutes,
              isCaller: true,
              image,
              gender,
              hostId: hostId || host?._id,
              host: host || { name, image, _id: hostId },
            });
          } else {
            navigation.replace("OnGoing", {
              ...ongoingCall,
              name: name || 'User',
              maxMinutes,
              isCaller: true,
              image,
            });
          }
        } else if (['ended', 'cancelled', 'rejected', 'missed', 'expired'].includes(currentStatus)) {
          if (noAnswerTimerRef.current) clearTimeout(noAnswerTimerRef.current);
          console.log("❌ Call already ended/rejected! Resetting to MainTabs...");
          try { InCallManager.stop({ busytone: '_BUNDLE_' }); } catch (_) {}
          setStatus(currentStatus.toUpperCase() + ' ⏹️');
          setTimeout(() => {
            navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'MainTabs' }] }));
          }, 1500);
        }
      }
    } catch (err) {
      console.error("API Call status check failed:", err.message);
    }
  };

  useEffect(() => {
    try { InCallManager.start({ media: isVideoCall ? 'video' : 'audio', ringback: '_BUNDLE_' }); } catch (err) { console.warn('InCallManager start error:', err); }

    // Backend owns expiry. The caller only reconciles UI from the server deadline.
    const { ringExpiresAtMs } = getCallTiming({ createdAt, ringExpiresAt });
    noAnswerTimerRef.current = setTimeout(async () => {
      try { InCallManager.stop({ busytone: '_BUNDLE_' }); } catch (_) {}
      setStatus('No answer');
      await verifyCallStatus();
    }, Math.max(0, ringExpiresAtMs - Date.now() + 1_500));

    if (transactionId) {
      verifyCallStatus();
    }

    let activeSocket = getSocket();

    const handleConnect = () => {
      console.log("🔌 Socket connected/reconnected on OutGoing screen. Verifying status...");
      verifyCallStatus();
    };

    const onCallAccepted = (payload) => {
      console.log("📞 callAccepted RECEIVED", payload);
      if (!payload || payload.transactionId !== transactionId) return;
      if (noAnswerTimerRef.current) clearTimeout(noAnswerTimerRef.current);

      try { InCallManager.stop(); } catch (_) {}
      setStatus("Accepted ✅");

      const ongoingCall = getValidOngoingCall({
        transactionId: payload.transactionId,
        channelName: payload.channelName,
        agora: payload.agora,
      }, true);
      if (!ongoingCall) {
        setStatus('Connection failed');
        handleEndCall();
        return;
      }
      const isVideoCallTarget = isVideoCall || payload?.isVideo === true || payload?.callType === 'video';
      if (isVideoCallTarget) {
        navigation.replace("VideoCall", {
          ...ongoingCall,
          name: name || 'User',
          maxMinutes,
          isCaller: true,
          image,
          gender,
          hostId: hostId || host?._id,
          host: host || { name, image, _id: hostId },
        });
      } else {
        navigation.replace("OnGoing", {
          ...ongoingCall,
          name: name || 'User',
          maxMinutes,
          isCaller: true,
          image,
        });
      }
    };

    const onCallRejected = ({ transactionId: rejectedTxn }) => {
      if (rejectedTxn === transactionId) {
        if (noAnswerTimerRef.current) clearTimeout(noAnswerTimerRef.current);
        try { InCallManager.stop({ busytone: '_BUNDLE_' }); } catch (_) {}
        setStatus('Rejected ❌');
        setTimeout(() => {
          navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'MainTabs' }] }));
        }, 1500);
      }
    };

    const onCallEnded = ({ transactionId: endedTxn }) => {
      if (endedTxn === transactionId) {
        if (noAnswerTimerRef.current) clearTimeout(noAnswerTimerRef.current);
        try { InCallManager.stop({ busytone: '_BUNDLE_' }); } catch (_) {}
        setStatus('Ended ⏹️');
        setTimeout(() => {
          navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'MainTabs' }] }));
        }, 1500);
      }
    };

    const registerListeners = (sock) => {
      sock.on("connect", handleConnect);
      sock.on("callAccepted", onCallAccepted);
      sock.on("callRejected", onCallRejected);
      sock.on("callEnded", onCallEnded);
      console.log("🔌 Socket listeners registered immediately on OutGoing screen");
    };

    if (activeSocket) {
      registerListeners(activeSocket);
    } else {
      initSocket().then((sock) => {
        if (sock) registerListeners(sock);
      });
    }

    return () => {
      if (noAnswerTimerRef.current) clearTimeout(noAnswerTimerRef.current);
      InCallManager.stop();
      const sock = getSocket() || activeSocket;
      if (sock) {
        sock.off("connect", handleConnect);
        sock.off("callAccepted", onCallAccepted);
        sock.off("callRejected", onCallRejected);
        sock.off("callEnded", onCallEnded);
        console.log("🧹 Socket listeners cleaned up on OutGoing screen");
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    transactionId,
    navigation,
    agora,
    name,
    maxMinutes,
    image,
    createdAt,
    ringExpiresAt,
  ]);

  return (
    <LinearGradient
      colors={['#060212', '#0e0423', '#030109']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.profileCard,
        {
          paddingTop: topSafeInset + 8,
          paddingBottom: Math.max(12, insets.bottom || 0),
        },
      ]}
    >
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      {/* Header bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleEndCall} style={styles.backBtn}>
          <Icon name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Outgoing Call</Text>
        <TouchableOpacity style={styles.reportBtn}>
          <Icon name="info-outline" size={16} color="#d946ef" style={styles.reportIcon} />
          <Text style={styles.reportText}>Report</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.mainContent}>
        {/* Equalizer Wave and Avatar row */}
        <View style={styles.avatarRowContainer}>
          {/* Left Equalizer */}
          <View style={styles.equalizerWave}>
            {[12, 20, 28, 38, 28, 20, 12].map((h, i) => (
              <View key={`l-${i}`} style={[styles.equalizerBar, { height: h }]} />
            ))}
          </View>

          {/* Central Avatar */}
          <View style={styles.avatarGlowContainer}>
            <View style={styles.avatarBorderOuter}>
              <Image
                source={getUserAvatar(image || callerImage, gender)}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* Right Equalizer */}
          <View style={styles.equalizerWave}>
            {[12, 20, 28, 38, 28, 20, 12].map((h, i) => (
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

          {Boolean(hostId || route.params?.userId || route.params?.meethiId || route.params?.host?.userId) && (
            <Text style={styles.targetIdBadge}>
              Host ID: {hostId || route.params?.userId || route.params?.meethiId || route.params?.host?.userId}
            </Text>
          )}

          {Boolean(user?.userId || user?.meethiId || user?.id) && (
            <Text style={styles.myIdBadge}>
              {user?.role === 'host' ? 'My Host ID' : 'My ID'}: {user?.userId || user?.meethiId || user?.id}
            </Text>
          )}

          <View style={styles.statusRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.statusText}>Online</Text>
          </View>

          <Text style={styles.callStatusText}>Calling...</Text>
        </View>

        {/* Cost and Balance Panel */}
        <View style={styles.panelCardContainer}>
          <LinearGradient
            colors={['rgba(124, 77, 255, 0.2)', 'rgba(3, 220, 254, 0.2)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.panelCardBorder}
          >
            <View style={styles.panelCard}>
              {/* Cost column */}
              <View style={styles.panelCol}>
                <Icon name="phone" size={18} color="rgba(255, 255, 255, 0.5)" />
                <Text style={styles.panelLabel}>Call Cost</Text>
                <View style={styles.panelValueRow}>
                  <Text style={styles.panelValueYellow}>{callRatePerMinute}</Text>
                  <Image source={require('../../assets/icons/diamond.png')} style={styles.diamondIconSmall} resizeMode="contain" />
                  <Text style={styles.panelValueSub}>/ min</Text>
                </View>
              </View>

              <View style={styles.panelDivider} />

              {/* Balance column */}
              <View style={styles.panelCol}>
                <Icon name="account-balance-wallet" size={18} color="rgba(255, 255, 255, 0.5)" />
                <Text style={styles.panelLabel}>Your Balance</Text>
                <View style={styles.panelValueRow}>
                  <Text style={styles.panelValueWhite}>
                    {typeof balance === 'number' && !isNaN(balance) ? balance.toLocaleString() : (balance || 0)}
                  </Text>
                  <Image source={require('../../assets/icons/diamond.png')} style={styles.diamondIconSmall} resizeMode="contain" />
                  <TouchableOpacity style={styles.addCoinsBtn}>
                    <Icon name="add-circle" size={16} color="#03dcfe" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Feature Badges Row */}
        <View style={styles.featureBadgesRow}>
          <View style={styles.featureBadge}>
            <View style={styles.badgeIconBg}>
              <Icon name="hd" size={16} color="#03dcfe" />
            </View>
            <View style={styles.badgeTexts}>
              <Text style={styles.badgeTitle}>High Quality</Text>
              <Text style={styles.badgeSub}>Crystal Clear Voice</Text>
            </View>
          </View>

          <View style={styles.featureBadge}>
            <View style={styles.badgeIconBg}>
              <Icon name="lock" size={15} color="#03dcfe" />
            </View>
            <View style={styles.badgeTexts}>
              <Text style={styles.badgeTitle}>Secure Call</Text>
              <Text style={styles.badgeSub}>End-to-end Encrypted</Text>
            </View>
          </View>

          <View style={styles.featureBadge}>
            <View style={styles.badgeIconBg}>
              <Icon name="mic-off" size={15} color="#03dcfe" />
            </View>
            <View style={styles.badgeTexts}>
              <Text style={styles.badgeTitle}>No Recording</Text>
              <Text style={styles.badgeSub}>100% Private</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Control buttons row */}
      <View style={styles.controlBar}>
        {/* Mute Button */}
        <View style={styles.controlWrapper}>
          <TouchableOpacity
            onPress={handleMicToggle}
            activeOpacity={0.8}
            style={[styles.controlButton, !micOn ? styles.controlActive : styles.controlInactive]}
          >
            <Icon name={micOn ? "mic" : "mic-off"} size={22} color={micOn ? "rgba(255, 255, 255, 0.8)" : "#03dcfe"} />
          </TouchableOpacity>
          <Text style={styles.controlLabel}>Mute</Text>
        </View>

        {/* Cancel Button */}
        <View style={styles.controlWrapper}>
          <TouchableOpacity
            onPress={handleEndCall}
            activeOpacity={0.8}
            style={[styles.controlButton, styles.endCallButton]}
          >
            <Icon name="call-end" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.controlLabel}>Cancel</Text>
        </View>

        {/* Speaker Button */}
        <View style={styles.controlWrapper}>
          <TouchableOpacity
            onPress={handleSpeakerToggle}
            activeOpacity={0.8}
            style={[styles.controlButton, speakerOn ? styles.controlActive : styles.controlInactive]}
          >
            <Icon name={speakerOn ? "volume-up" : "volume-mute"} size={22} color={speakerOn ? "#03dcfe" : "rgba(255, 255, 255, 0.8)"} />
          </TouchableOpacity>
          <Text style={styles.controlLabel}>Speaker</Text>
        </View>
      </View>

      {/* Bottom Ringing Banner Bar */}
      <View style={styles.bottomBannerContainer}>
        <LinearGradient
          colors={['rgba(124, 77, 255, 0.1)', 'rgba(3, 220, 254, 0.1)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.bottomBanner}
        >
          <View style={styles.bannerLeftRow}>
            <View style={styles.phoneIconBg}>
              <Icon name="phone" size={14} color="#03dcfe" />
            </View>
            <View style={styles.bannerTexts}>
              <Text style={styles.bannerTitleText}>Using 6 diamonds per minute</Text>
              <Text style={styles.bannerSubText}>Call will be connected once accepted.</Text>
            </View>
          </View>

          <View style={styles.bannerRightRow}>
            <Text style={styles.bannerTimer}>00:00</Text>
            <Text style={styles.bannerStatusText}>{status}</Text>
          </View>
        </LinearGradient>
      </View>
    </LinearGradient>
  );
};

export default OutGoing;

const styles = StyleSheet.create({
  profileCard: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
    height: HP(6),
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: RF(15),
    fontWeight: 'bold',
  },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(217, 70, 239, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(217, 70, 239, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  reportText: {
    color: '#d946ef',
    fontSize: RF(10),
    fontWeight: 'bold',
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
    marginBottom: HP(3),
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
    shadowColor: "#03dcfe",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 12,
  },
  avatarBorderOuter: {
    height: 140,
    width: 140,
    borderRadius: 70,
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
    borderRadius: 65,
  },
  detailsContainer: {
    alignItems: "center",
    marginBottom: HP(3),
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
    fontSize: RF(22),
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
  targetIdBadge: {
    color: '#03dcfe',
    fontSize: RF(13),
    fontWeight: '700',
    backgroundColor: 'rgba(3, 220, 254, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(3, 220, 254, 0.25)',
  },
  myIdBadge: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: RF(11),
    fontWeight: '600',
    marginBottom: 6,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: HP(1),
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
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: RF(13),
    fontWeight: "500",
  },
  panelCardContainer: {
    width: WP(92),
    marginBottom: HP(3),
  },
  panelCardBorder: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  panelCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(10, 5, 28, 0.85)',
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  panelCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  panelDivider: {
    width: 1,
    height: HP(5),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  panelLabel: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: RF(10),
    fontWeight: '600',
    marginTop: 2,
  },
  panelValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  panelValueYellow: {
    color: '#FFD700',
    fontSize: RF(18),
    fontWeight: 'bold',
  },
  panelValueWhite: {
    color: '#fff',
    fontSize: RF(18),
    fontWeight: 'bold',
  },
  panelValueSub: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: RF(11),
    fontWeight: '600',
  },
  addCoinsBtn: {
    marginLeft: 4,
  },
  featureBadgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: WP(92),
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    padding: 10,
  },
  featureBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeIconBg: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(3, 220, 254, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeTexts: {
    justifyContent: 'center',
  },
  badgeTitle: {
    color: '#fff',
    fontSize: RF(9.5),
    fontWeight: 'bold',
  },
  badgeSub: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: RF(7.5),
    fontWeight: '600',
    marginTop: 1,
  },
  controlBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: WP(8),
    width: '100%',
    marginBottom: HP(3),
  },
  controlWrapper: {
    alignItems: 'center',
  },
  controlButton: {
    height: 52,
    width: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  controlActive: {
    backgroundColor: 'rgba(3, 220, 254, 0.2)',
    borderWidth: 1.5,
    borderColor: '#03dcfe',
    shadowColor: '#03dcfe',
  },
  controlInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
  },
  endCallButton: {
    height: 64,
    width: 64,
    borderRadius: 32,
    backgroundColor: '#e53935',
    shadowColor: '#e53935',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  controlLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: RF(11),
    fontWeight: '600',
    marginTop: HP(0.5),
  },
  bottomBannerContainer: {
    width: WP(92),
    marginBottom: HP(2),
  },
  bottomBanner: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(3, 220, 254, 0.15)',
  },
  bannerLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phoneIconBg: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(3, 220, 254, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerTexts: {
    justifyContent: 'center',
  },
  bannerTitleText: {
    color: '#fff',
    fontSize: RF(10.5),
    fontWeight: 'bold',
  },
  bannerSubText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: RF(8.5),
    fontWeight: '600',
    marginTop: 1,
  },
  bannerRightRow: {
    alignItems: 'flex-end',
  },
  bannerTimer: {
    color: '#03dcfe',
    fontSize: RF(12),
    fontWeight: 'bold',
  },
  bannerStatusText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: RF(8.5),
    fontWeight: '600',
    marginTop: 1,
  },
  reportIcon: {
    marginRight: 2,
  },
  panelValueIcon: {
    marginLeft: 4,
  },
  diamondIconSmall: {
    width: 14,
    height: 14,
    marginLeft: 4,
  },
});
