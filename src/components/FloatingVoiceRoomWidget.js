import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useVoiceRoom } from '../context/VoiceRoomContext';

export default function FloatingVoiceRoomWidget() {
  const {
    activeRoom,
    isMinimized,
    maximizeRoom,
    leaveRoom,
    isMuted,
    toggleMic,
  } = useVoiceRoom();

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const bar1 = useRef(new Animated.Value(4)).current;
  const bar2 = useRef(new Animated.Value(12)).current;
  const bar3 = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    if (isMinimized && activeRoom) {
      // Pulse animation
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      // Equalizer bars animation
      const eq = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(bar1, { toValue: 14, duration: 300, useNativeDriver: false }),
            Animated.timing(bar1, { toValue: 4, duration: 300, useNativeDriver: false }),
          ]),
          Animated.sequence([
            Animated.timing(bar2, { toValue: 6, duration: 250, useNativeDriver: false }),
            Animated.timing(bar2, { toValue: 16, duration: 250, useNativeDriver: false }),
          ]),
          Animated.sequence([
            Animated.timing(bar3, { toValue: 14, duration: 350, useNativeDriver: false }),
            Animated.timing(bar3, { toValue: 5, duration: 350, useNativeDriver: false }),
          ]),
        ])
      );
      eq.start();

      return () => {
        pulse.stop();
        eq.stop();
      };
    }
  }, [isMinimized, activeRoom]);

  if (!activeRoom || !isMinimized) {
    return null;
  }

  const handleConfirmLeave = () => {
    Alert.alert(
      'Leave Room',
      'Do you want to leave this voice party room?',
      [
        { text: 'Keep Playing', style: 'cancel' },
        { text: 'Leave Room', style: 'destructive', onPress: leaveRoom },
      ]
    );
  };

  return (
    <Animated.View style={[styles.floatingContainer, { transform: [{ scale: pulseAnim }] }]}>
      <TouchableOpacity
        style={styles.touchableCard}
        activeOpacity={0.9}
        onPress={maximizeRoom}
      >
        <LinearGradient
          colors={['#1E1B4B', '#312E81', '#4338CA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientCard}
        >
          {/* Avatar with pulse ring */}
          <View style={styles.avatarWrapper}>
            <Image
              source={{ uri: activeRoom.coverImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200' }}
              style={styles.avatarImg}
            />
            <View style={styles.liveDot} />
          </View>

          {/* Room Title & Equalizer */}
          <View style={styles.infoWrapper}>
            <View style={styles.topRow}>
              <View style={styles.partyBadge}>
                <Text style={styles.partyBadgeText}>LIVE PARTY</Text>
              </View>
              {/* Animated Sound Wave Equalizer */}
              <View style={styles.equalizer}>
                <Animated.View style={[styles.eqBar, { height: bar1 }]} />
                <Animated.View style={[styles.eqBar, { height: bar2 }]} />
                <Animated.View style={[styles.eqBar, { height: bar3 }]} />
              </View>
            </View>
            <Text style={styles.roomTitle} numberOfLines={1}>
              {activeRoom.title || activeRoom.hostName || 'Voice Room'}
            </Text>
          </View>

          {/* Quick Controls */}
          <View style={styles.controlsRow}>
            {/* Quick Mic Toggle */}
            <TouchableOpacity
              style={[styles.miniControlBtn, !isMuted && styles.micActiveBtn]}
              onPress={(e) => {
                e.stopPropagation();
                toggleMic();
              }}
              activeOpacity={0.7}
            >
              <Icon
                name={isMuted ? 'mic-off' : 'mic'}
                size={14}
                color={isMuted ? '#94A3B8' : '#22C55E'}
              />
            </TouchableOpacity>

            {/* Quick Leave Button */}
            <TouchableOpacity
              style={styles.miniCloseBtn}
              onPress={(e) => {
                e.stopPropagation();
                handleConfirmLeave();
              }}
              activeOpacity={0.7}
            >
              <Icon name="close" size={14} color="#CBD5E1" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    bottom: 84, // Pinned right above bottom tab bar
    right: 14,
    left: 14,
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#4338CA',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  touchableCard: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  gradientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  avatarImg: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  liveDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#1E1B4B',
  },
  infoWrapper: {
    flex: 1,
    marginRight: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  partyBadge: {
    backgroundColor: 'rgba(244, 63, 94, 0.25)',
    borderWidth: 1,
    borderColor: '#F43F5E',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    marginRight: 8,
  },
  partyBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FDA4AF',
    letterSpacing: 0.5,
  },
  equalizer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 16,
    gap: 2,
  },
  eqBar: {
    width: 3,
    backgroundColor: '#38BDF8',
    borderRadius: 2,
  },
  roomTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniControlBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micActiveBtn: {
    backgroundColor: 'rgba(34, 197, 94, 0.25)',
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  miniCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
