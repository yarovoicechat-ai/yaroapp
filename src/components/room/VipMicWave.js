import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

const DEFAULT_WAVE_COLORS = ['#10B981', '#06B6D4', '#3B82F6'];

export default function VipMicWave({
  state = 'IDLE', // 'IDLE' | 'SPEAKING' | 'MUTED' | 'DISCONNECTED'
  waveColors = DEFAULT_WAVE_COLORS,
  intensity = 1.0,
  size = 64,
  children,
}) {
  const pulse1 = useRef(new Animated.Value(1)).current;
  const opacity1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(1)).current;
  const opacity2 = useRef(new Animated.Value(0)).current;
  const pulse3 = useRef(new Animated.Value(1)).current;
  const opacity3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let animLoop1 = null;
    let animLoop2 = null;
    let animLoop3 = null;
    let timer2 = null;
    let timer3 = null;

    if (state === 'SPEAKING') {
      const createRipple = (pulseVal, opacityVal, maxScale, peakOpacity) => {
        return Animated.loop(
          Animated.parallel([
            Animated.timing(pulseVal, {
              toValue: 1 + maxScale * intensity,
              duration: 1100,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(opacityVal, {
                toValue: peakOpacity,
                duration: 250,
                useNativeDriver: true,
              }),
              Animated.timing(opacityVal, {
                toValue: 0,
                duration: 850,
                useNativeDriver: true,
              }),
            ]),
          ])
        );
      };

      // Ring 1 (Immediate)
      animLoop1 = createRipple(pulse1, opacity1, 0.28, 0.85);
      animLoop1.start();

      // Ring 2 (Staggered by 350ms)
      timer2 = setTimeout(() => {
        animLoop2 = createRipple(pulse2, opacity2, 0.48, 0.65);
        animLoop2.start();
      }, 350);

      // Ring 3 (Staggered by 700ms)
      timer3 = setTimeout(() => {
        animLoop3 = createRipple(pulse3, opacity3, 0.68, 0.45);
        animLoop3.start();
      }, 700);
    } else {
      pulse1.setValue(1);
      opacity1.setValue(0);
      pulse2.setValue(1);
      opacity2.setValue(0);
      pulse3.setValue(1);
      opacity3.setValue(0);
    }

    return () => {
      if (timer2) clearTimeout(timer2);
      if (timer3) clearTimeout(timer3);
      if (animLoop1) animLoop1.stop();
      if (animLoop2) animLoop2.stop();
      if (animLoop3) animLoop3.stop();
    };
  }, [state, intensity, pulse1, opacity1, pulse2, opacity2, pulse3, opacity3]);

  const activeColors = Array.isArray(waveColors) && waveColors.length > 0 ? waveColors : DEFAULT_WAVE_COLORS;
  const primaryColor = activeColors[0] || '#10B981';
  const secondaryColor = activeColors[1] || primaryColor;
  const tertiaryColor = activeColors[2] || secondaryColor;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Outer Pulse Wave Ring 3 */}
      {state === 'SPEAKING' && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.waveRing,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderColor: tertiaryColor,
              backgroundColor: tertiaryColor + '12',
              opacity: opacity3,
              transform: [{ scale: pulse3 }],
            },
          ]}
        />
      )}

      {/* Mid Pulse Wave Ring 2 */}
      {state === 'SPEAKING' && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.waveRing,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderColor: secondaryColor,
              backgroundColor: secondaryColor + '16',
              opacity: opacity2,
              transform: [{ scale: pulse2 }],
            },
          ]}
        />
      )}

      {/* Inner Pulse Wave Ring 1 */}
      {state === 'SPEAKING' && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.waveRing,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderColor: primaryColor,
              backgroundColor: primaryColor + '20',
              opacity: opacity1,
              transform: [{ scale: pulse1 }],
            },
          ]}
        />
      )}

      {/* Base Avatar Speaking Glow Ring */}
      {state === 'SPEAKING' && (
        <View
          pointerEvents="none"
          style={[
            styles.baseGlowRing,
            {
              width: size + 2,
              height: size + 2,
              borderRadius: (size + 2) / 2,
              borderColor: primaryColor,
              shadowColor: primaryColor,
            },
          ]}
        />
      )}

      {/* Muted Ring */}
      {state === 'MUTED' && (
        <View
          pointerEvents="none"
          style={[
            styles.idleRing,
            {
              width: size + 4,
              height: size + 4,
              borderRadius: (size + 4) / 2,
              borderColor: 'rgba(239, 68, 68, 0.5)',
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
  },
  baseGlowRing: {
    position: 'absolute',
    borderWidth: 2.2,
    backgroundColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 5,
    elevation: 3,
  },
  idleRing: {
    position: 'absolute',
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  childWrap: {
    zIndex: 2,
  },
});
