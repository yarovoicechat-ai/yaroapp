import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

export default function VipMicWave({
  state = 'IDLE', // 'IDLE' | 'SPEAKING' | 'MUTED' | 'DISCONNECTED'
  waveColors = ['#F59E0B', '#FBBF24', '#D97706'],
  intensity = 1.0,
  size = 64,
  children,
}) {
  const pulse1 = useRef(new Animated.Value(1)).current;
  const opacity1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(1)).current;
  const opacity2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let animLoop1;
    let animLoop2;

    if (state === 'SPEAKING') {
      // Loop pulse rings
      animLoop1 = Animated.loop(
        Animated.parallel([
          Animated.timing(pulse1, {
            toValue: 1 + 0.35 * intensity,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacity1, { toValue: 0.8, duration: 250, useNativeDriver: true }),
            Animated.timing(opacity1, { toValue: 0, duration: 650, useNativeDriver: true }),
          ]),
        ])
      );

      animLoop2 = Animated.loop(
        Animated.sequence([
          Animated.delay(350),
          Animated.parallel([
            Animated.timing(pulse2, {
              toValue: 1 + 0.45 * intensity,
              duration: 900,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(opacity2, { toValue: 0.6, duration: 250, useNativeDriver: true }),
              Animated.timing(opacity2, { toValue: 0, duration: 650, useNativeDriver: true }),
            ]),
          ]),
        ])
      );

      animLoop1.start();
      animLoop2.start();
    } else {
      pulse1.setValue(1);
      opacity1.setValue(0);
      pulse2.setValue(1);
      opacity2.setValue(0);
    }

    return () => {
      if (animLoop1) animLoop1.stop();
      if (animLoop2) animLoop2.stop();
    };
  }, [state, intensity, pulse1, opacity1, pulse2, opacity2]);

  const primaryColor = waveColors[0] || '#F59E0B';
  const secondaryColor = waveColors[1] || primaryColor;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Outer Pulse Wave Ring 2 */}
      {state === 'SPEAKING' && (
        <Animated.View
          style={[
            styles.waveRing,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderColor: secondaryColor,
              opacity: opacity2,
              transform: [{ scale: pulse2 }],
            },
          ]}
        />
      )}

      {/* Inner Pulse Wave Ring 1 */}
      {state === 'SPEAKING' && (
        <Animated.View
          style={[
            styles.waveRing,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderColor: primaryColor,
              opacity: opacity1,
              transform: [{ scale: pulse1 }],
            },
          ]}
        />
      )}

      {/* Static subtle highlight for IDLE */}
      {state === 'IDLE' && (
        <View
          style={[
            styles.idleRing,
            {
              width: size + 4,
              height: size + 4,
              borderRadius: (size + 4) / 2,
              borderColor: 'rgba(255, 255, 255, 0.15)',
            },
          ]}
        />
      )}

      {/* Muted Ring */}
      {state === 'MUTED' && (
        <View
          style={[
            styles.idleRing,
            {
              width: size + 4,
              height: size + 4,
              borderRadius: (size + 4) / 2,
              borderColor: 'rgba(239, 68, 68, 0.4)',
            },
          ]}
        />
      )}

      {/* Avatar or Child Content */}
      <View style={styles.childWrap}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  waveRing: {
    position: 'absolute',
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  idleRing: {
    position: 'absolute',
    borderWidth: 1.2,
    backgroundColor: 'transparent',
  },
  childWrap: {
    zIndex: 2,
  },
});
