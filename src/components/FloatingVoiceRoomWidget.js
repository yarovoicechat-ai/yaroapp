import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  PanResponder,
  Dimensions,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useVoiceRoom } from '../context/VoiceRoomContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const WIDGET_SIZE = 66;
const MARGIN = 12;

export default function FloatingVoiceRoomWidget() {
  const {
    activeRoom,
    isMinimized,
    maximizeRoom,
    leaveRoom,
    isMuted,
    toggleMic,
  } = useVoiceRoom();

  // Position state with PanResponder
  const pan = useRef(
    new Animated.ValueXY({
      x: SCREEN_WIDTH - WIDGET_SIZE - MARGIN,
      y: SCREEN_HEIGHT - 220,
    })
  ).current;

  // Pulse & Equalizer Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const bar1 = useRef(new Animated.Value(4)).current;
  const bar2 = useRef(new Animated.Value(10)).current;
  const bar3 = useRef(new Animated.Value(6)).current;

  // PanResponder to allow dragging anywhere on screen
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => {
        // Only take gesture if dragged more than 4 pixels
        return Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4;
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
      onPanResponderRelease: (_, gesture) => {
        pan.flattenOffset();

        // Check if it's a tap rather than a drag
        const distance = Math.hypot(gesture.dx, gesture.dy);
        if (distance < 6) {
          maximizeRoom && maximizeRoom();
          return;
        }

        // Clamp to screen boundaries with smooth snapping to nearest edge
        const currentX = pan.x._value;
        const currentY = pan.y._value;

        const targetX =
          currentX + WIDGET_SIZE / 2 > SCREEN_WIDTH / 2
            ? SCREEN_WIDTH - WIDGET_SIZE - MARGIN
            : MARGIN;

        const minY = Platform.OS === 'ios' ? 50 : 36;
        const maxY = SCREEN_HEIGHT - WIDGET_SIZE - 90;
        const targetY = Math.max(minY, Math.min(maxY, currentY));

        Animated.spring(pan, {
          toValue: { x: targetX, y: targetY },
          friction: 6,
          tension: 40,
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  useEffect(() => {
    if (isMinimized && activeRoom) {
      // Gentle breathing pulse animation
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      // Equalizer bars
      const eq = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(bar1, { toValue: 12, duration: 320, useNativeDriver: false }),
            Animated.timing(bar1, { toValue: 3, duration: 320, useNativeDriver: false }),
          ]),
          Animated.sequence([
            Animated.timing(bar2, { toValue: 5, duration: 260, useNativeDriver: false }),
            Animated.timing(bar2, { toValue: 15, duration: 260, useNativeDriver: false }),
          ]),
          Animated.sequence([
            Animated.timing(bar3, { toValue: 13, duration: 360, useNativeDriver: false }),
            Animated.timing(bar3, { toValue: 4, duration: 360, useNativeDriver: false }),
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

  const roomImage =
    activeRoom.coverImage ||
    activeRoom.roomImage ||
    activeRoom.avatar ||
    'https://api.yaroapp.in/uploads/avatars/female_default.webp';

  return (
    <Animated.View
      style={[
        styles.floatingContainer,
        {
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
          ],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <Animated.View
        style={[
          styles.circleBubble,
          { transform: [{ scale: pulseAnim }] },
        ]}
      >
        <LinearGradient
          colors={['#8B5CF6', '#EC4899', '#3B82F6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientRing}
        >
          <View style={styles.innerCircle}>
            <Image source={{ uri: roomImage }} style={styles.roomAvatar} />

            {/* Dark gradient overlay for contrast */}
            <LinearGradient
              colors={['transparent', 'rgba(15, 23, 42, 0.7)']}
              style={StyleSheet.absoluteFillObject}
            />

            {/* Live Equalizer indicator in bottom of circle */}
            <View style={styles.equalizerWrap}>
              <Animated.View style={[styles.eqBar, { height: bar1 }]} />
              <Animated.View style={[styles.eqBar, { height: bar2 }]} />
              <Animated.View style={[styles.eqBar, { height: bar3 }]} />
            </View>
          </View>
        </LinearGradient>

        {/* Live Green Status Dot */}
        <View style={styles.liveIndicator}>
          <View style={styles.innerLiveDot} />
        </View>

        {/* Small Exit / Close Button on top-right badge */}
        <TouchableOpacity
          style={styles.closeBadge}
          onPress={() => leaveRoom && leaveRoom()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.8}
        >
          <Icon name="close" size={11} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Small Mic Toggle on top-left badge */}
        <TouchableOpacity
          style={[styles.micBadge, !isMuted && styles.micActiveBadge]}
          onPress={() => toggleMic && toggleMic()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.8}
        >
          <Icon
            name={isMuted ? 'mic-off' : 'mic'}
            size={10}
            color={isMuted ? '#94A3B8' : '#22C55E'}
          />
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 99999,
    elevation: 20,
    width: WIDGET_SIZE,
    height: WIDGET_SIZE,
  },
  circleBubble: {
    width: WIDGET_SIZE,
    height: WIDGET_SIZE,
    borderRadius: WIDGET_SIZE / 2,
    position: 'relative',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 12,
  },
  gradientRing: {
    width: WIDGET_SIZE,
    height: WIDGET_SIZE,
    borderRadius: WIDGET_SIZE / 2,
    padding: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    width: '100%',
    height: '100%',
    borderRadius: (WIDGET_SIZE - 5) / 2,
    overflow: 'hidden',
    backgroundColor: '#1E1B4B',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomAvatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  equalizerWrap: {
    position: 'absolute',
    bottom: 6,
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 16,
    gap: 2.5,
  },
  eqBar: {
    width: 2.8,
    backgroundColor: '#38BDF8',
    borderRadius: 2,
  },
  liveIndicator: {
    position: 'absolute',
    bottom: 1,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerLiveDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#22C55E',
  },
  closeBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    elevation: 4,
  },
  micBadge: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    elevation: 4,
  },
  micActiveBadge: {
    backgroundColor: 'rgba(22, 101, 52, 0.95)',
    borderColor: '#22C55E',
  },
});
