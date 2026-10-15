import React, { useEffect, useState, useContext, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Animated,
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

const { width } = Dimensions.get('window');

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
  const pulseAnim = useRef(new Animated.Value(1)).current;

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

  // Pulse animation for avatar
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

  // Load User Balance from backend API
  useEffect(() => {
    let isMounted = true;
    const fetchBalance = async () => {
      try {
        const res = await apiUtil.get('/user/profile');
        if (isMounted && res.data?.success) {
          const uData = res.data.data?.user || res.data.data;
          if (uData) {
            const liveDiamonds =
              uData.diamonds !== undefined
                ? uData.diamonds
                : uData.coins !== undefined
                ? uData.coins
                : 0;
            setBalance(liveDiamonds);
          }
        }
      } catch (err) {
        console.log('Error loading balance for outgoing screen', err);
      }
    };
    fetchBalance();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleMicToggle = () => {
    setMicOn(!micOn);
  };

  const handleSpeakerToggle = () => {
    const nextSpeaker = !speakerOn;
    setSpeakerOn(nextSpeaker);
    try {
      InCallManager.setSpeakerphoneOn(nextSpeaker);
    } catch (_) {}
  };

  const handleEndCall = async () => {
    console.log('📞 Call ended');
    try {
      InCallManager.stop({ busytone: '_BUNDLE_' });
    } catch (_) {}
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
      const res = await apiUtil.get(`/call/status/${transactionId}`);
      if (res.data.success) {
        const { status: currentStatus, agora: fetchedAgora, channelName: fetchedChannel } = res.data.data;

        if (['accepted', 'connecting', 'connected', 'ongoing'].includes(currentStatus)) {
          if (noAnswerTimerRef.current) clearTimeout(noAnswerTimerRef.current);
          try {
            InCallManager.stop();
          } catch (_) {}
          setStatus('Accepted ✅');
          const ongoingCall = getValidOngoingCall(
            {
              transactionId,
              channelName: fetchedChannel || channelName,
              agora: fetchedAgora || agora,
            },
            true
          );
          if (!ongoingCall) {
            setStatus('Connection failed');
            handleEndCall();
            return;
          }
          const isVideoCallTarget = isVideoCall || res.data.data?.isVideo === true || res.data.data?.callType === 'video';
          if (isVideoCallTarget) {
            navigation.replace('VideoCall', {
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
            navigation.replace('OnGoing', {
              ...ongoingCall,
              name: name || 'User',
              maxMinutes,
              isCaller: true,
              image,
            });
          }
        } else if (['ended', 'cancelled', 'rejected', 'missed', 'expired'].includes(currentStatus)) {
          if (noAnswerTimerRef.current) clearTimeout(noAnswerTimerRef.current);
          try {
            InCallManager.stop({ busytone: '_BUNDLE_' });
          } catch (_) {}
          setStatus(currentStatus.toUpperCase() + ' ⏹️');
          setTimeout(() => {
            navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'MainTabs' }] }));
          }, 1500);
        }
      }
    } catch (err) {
      console.error('API Call status check failed:', err.message);
    }
  };

  useEffect(() => {
    try {
      InCallManager.start({ media: isVideoCall ? 'video' : 'audio', ringback: '_BUNDLE_' });
    } catch (err) {
      console.warn('InCallManager start error:', err);
    }

    const { ringExpiresAtMs } = getCallTiming({ createdAt, ringExpiresAt });
    noAnswerTimerRef.current = setTimeout(async () => {
      try {
        InCallManager.stop({ busytone: '_BUNDLE_' });
      } catch (_) {}
      setStatus('No answer');
      await verifyCallStatus();
    }, Math.max(0, ringExpiresAtMs - Date.now() + 1500));

    if (transactionId) {
      verifyCallStatus();
    }

    let activeSocket = getSocket();

    const handleConnect = () => {
      verifyCallStatus();
    };

    const onCallAccepted = (payload) => {
      if (!payload || payload.transactionId !== transactionId) return;
      if (noAnswerTimerRef.current) clearTimeout(noAnswerTimerRef.current);

      try {
        InCallManager.stop();
      } catch (_) {}
      setStatus('Accepted ✅');

      const ongoingCall = getValidOngoingCall(
        {
          transactionId: payload.transactionId,
          channelName: payload.channelName,
          agora: payload.agora,
        },
        true
      );
      if (!ongoingCall) {
        setStatus('Connection failed');
        handleEndCall();
        return;
      }
      const isVideoCallTarget = isVideoCall || payload?.isVideo === true || payload?.callType === 'video';
      if (isVideoCallTarget) {
        navigation.replace('VideoCall', {
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
        navigation.replace('OnGoing', {
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
        try {
          InCallManager.stop({ busytone: '_BUNDLE_' });
        } catch (_) {}
        setStatus('Rejected ❌');
        setTimeout(() => {
          navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'MainTabs' }] }));
        }, 1500);
      }
    };

    const onCallEnded = ({ transactionId: endedTxn }) => {
      if (endedTxn === transactionId) {
        if (noAnswerTimerRef.current) clearTimeout(noAnswerTimerRef.current);
        try {
          InCallManager.stop({ busytone: '_BUNDLE_' });
        } catch (_) {}
        setStatus('Ended ⏹️');
        setTimeout(() => {
          navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'MainTabs' }] }));
        }, 1500);
      }
    };

    const registerListeners = (sock) => {
      sock.on('connect', handleConnect);
      sock.on('callAccepted', onCallAccepted);
      sock.on('callRejected', onCallRejected);
      sock.on('callEnded', onCallEnded);
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
        sock.off('connect', handleConnect);
        sock.off('callAccepted', onCallAccepted);
        sock.off('callRejected', onCallRejected);
        sock.off('callEnded', onCallEnded);
      }
    };
  }, [transactionId, navigation, agora, name, maxMinutes, image, createdAt, ringExpiresAt, isVideoCall]);

  const targetHostId = hostId || route.params?.userId || route.params?.meethiId || route.params?.host?.userId;

  return (
    <LinearGradient
      colors={['#070214', '#110629', '#1C0B3B']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.screen,
        {
          paddingTop: topSafeInset + 14,
          paddingBottom: Math.max(24, (insets.bottom || 0) + 16),
        },
      ]}
    >
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Top Header & Call Type Badge */}
      <View style={styles.topBadgeContainer}>
        <LinearGradient
          colors={
            isVideoCall
              ? ['rgba(236,72,153,0.25)', 'rgba(124,58,237,0.25)']
              : ['rgba(14,165,233,0.25)', 'rgba(124,58,237,0.25)']
          }
          style={styles.callTypePill}
        >
          <Icon
            name={isVideoCall ? 'videocam' : 'phone'}
            size={18}
            color={isVideoCall ? '#F472B6' : '#38BDF8'}
          />
          <Text style={[styles.callTypeText, { color: isVideoCall ? '#F472B6' : '#38BDF8' }]}>
            {isVideoCall ? 'Outgoing HD Video Call' : 'Outgoing HD Voice Call'}
          </Text>
        </LinearGradient>
      </View>

      {/* Center Section: Avatar & Host Info */}
      <View style={styles.centerSection}>
        {/* Radar Pulsing Avatar */}
        <View style={styles.avatarWrap}>
          <Animated.View
            style={[
              styles.avatarRadarRing,
              {
                borderColor: isVideoCall ? 'rgba(236,72,153,0.35)' : 'rgba(56,189,248,0.35)',
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />
          <View
            style={[
              styles.avatarInnerBorder,
              { borderColor: isVideoCall ? '#EC4899' : '#38BDF8' },
            ]}
          >
            <Image
              source={getUserAvatar(image || callerImage, gender)}
              style={styles.avatarImg}
              resizeMode="cover"
            />
          </View>
        </View>

        {/* Host Name & Badges */}
        <View style={styles.infoBox}>
          <View style={styles.nameRow}>
            <Text style={styles.callerName} numberOfLines={1}>
              {name || 'Host'}
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

          {Boolean(targetHostId) && (
            <View style={styles.idChip}>
              <Text style={styles.idChipText}>Host ID: {targetHostId}</Text>
            </View>
          )}

          <View style={styles.statusLiveRow}>
            <View style={styles.pulseDot} />
            <Text style={styles.statusLiveText}>{status}</Text>
          </View>
        </View>

        {/* Cost & Balance Glass Card */}
        <View style={styles.costCardContainer}>
          <View style={styles.costCardCol}>
            <Text style={styles.costCardLabel}>Call Rate</Text>
            <View style={styles.costValRow}>
              <Text style={styles.costValNumber}>{callRatePerMinute}</Text>
              <Image
                source={require('../../assets/icons/diamond.png')}
                style={styles.diamondIcon}
                resizeMode="contain"
              />
              <Text style={styles.costValUnit}>/ min</Text>
            </View>
          </View>

          <View style={styles.costCardDivider} />

          <View style={styles.costCardCol}>
            <Text style={styles.costCardLabel}>Your Balance</Text>
            <View style={styles.costValRow}>
              <Text style={styles.costValNumber}>
                {typeof balance === 'number' && !isNaN(balance)
                  ? balance.toLocaleString()
                  : balance || 0}
              </Text>
              <Image
                source={require('../../assets/icons/diamond.png')}
                style={styles.diamondIcon}
                resizeMode="contain"
              />
              <TouchableOpacity
                onPress={() => navigation.navigate('Recharge')}
                style={styles.rechargeChip}
                activeOpacity={0.8}
              >
                <Text style={styles.rechargeChipText}>+ Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Bottom Controls Bar */}
      <View style={styles.bottomBar}>
        {/* Mute Button */}
        <View style={styles.controlItem}>
          <TouchableOpacity
            onPress={handleMicToggle}
            activeOpacity={0.8}
            style={[styles.controlBtn, !micOn && styles.controlBtnActive]}
          >
            <Icon
              name={micOn ? 'mic' : 'mic-off'}
              size={24}
              color={micOn ? 'rgba(255, 255, 255, 0.85)' : '#38BDF8'}
            />
          </TouchableOpacity>
          <Text style={styles.controlLabel}>{micOn ? 'Mute' : 'Muted'}</Text>
        </View>

        {/* End Call Button */}
        <View style={styles.controlItem}>
          <TouchableOpacity
            onPress={handleEndCall}
            activeOpacity={0.85}
            style={styles.endCallBtn}
          >
            <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.endCallGradient}>
              <Icon name="call-end" size={30} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
          <Text style={[styles.controlLabel, { color: '#EF4444' }]}>Cancel</Text>
        </View>

        {/* Speaker Button */}
        <View style={styles.controlItem}>
          <TouchableOpacity
            onPress={handleSpeakerToggle}
            activeOpacity={0.8}
            style={[styles.controlBtn, speakerOn && styles.controlBtnActive]}
          >
            <Icon
              name={speakerOn ? 'volume-up' : 'volume-mute'}
              size={24}
              color={speakerOn ? '#38BDF8' : 'rgba(255, 255, 255, 0.85)'}
            />
          </TouchableOpacity>
          <Text style={styles.controlLabel}>{speakerOn ? 'Speaker' : 'Ear'}</Text>
        </View>
      </View>

      {/* Security Footer Notice */}
      <View style={styles.securityFooter}>
        <Icon name="lock" size={13} color="rgba(255, 255, 255, 0.4)" />
        <Text style={styles.securityText}>End-to-end Encrypted • 100% Private</Text>
      </View>
    </LinearGradient>
  );
};

export default OutGoing;

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
    marginBottom: 18,
  },
  avatarRadarRing: {
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
    marginBottom: 20,
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
  statusLiveRow: {
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
  statusLiveText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 14,
    fontWeight: '700',
  },

  // Cost Card
  costCardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: width - 48,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  costCardCol: {
    flex: 1,
    alignItems: 'center',
  },
  costCardDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  costCardLabel: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 3,
  },
  costValRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  costValNumber: {
    color: '#FFD700',
    fontSize: 15,
    fontWeight: '900',
  },
  diamondIcon: {
    width: 13,
    height: 13,
    marginHorizontal: 3,
  },
  costValUnit: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    fontWeight: '700',
  },
  rechargeChip: {
    marginLeft: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#7C3AED',
  },
  rechargeChipText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },

  // Bottom Controls Bar
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 16,
  },
  controlItem: {
    alignItems: 'center',
  },
  controlBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlBtnActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.25)',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
  },
  endCallBtn: {
    width: 66,
    height: 66,
    borderRadius: 33,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#EF4444',
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  endCallGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlLabel: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 7,
  },

  // Security Footer
  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  securityText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
    fontWeight: '600',
  },
});
