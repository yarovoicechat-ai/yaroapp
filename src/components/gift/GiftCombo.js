import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

export default function GiftCombo({
  comboCount = 1,
  quantity = 1,
  giftName = 'Gift',
  giftIcon = '🌹',
}) {
  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const numPopAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (comboCount > 1) {
      // 1. Master Badge Spring Scale & Tilt
      scaleAnim.setValue(1.35);
      rotateAnim.setValue(-1);

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 3.5,
          tension: 90,
          useNativeDriver: true,
        }),
        Animated.spring(rotateAnim, {
          toValue: 0,
          friction: 4,
          tension: 70,
          useNativeDriver: true,
        }),
      ]).start();

      // 2. Number Pop Burst
      Animated.sequence([
        Animated.timing(numPopAnim, {
          toValue: 1.5,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.spring(numPopAnim, {
          toValue: 1,
          friction: 3,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();

      // 3. Glow Flash
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [comboCount]);

  if (comboCount <= 1) return null;

  const spin = rotateAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-10deg', '0deg', '10deg'],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }, { rotate: spin }],
        },
      ]}
      pointerEvents="none"
    >
      <LinearGradient
        colors={['#FF007A', '#F59E0B', '#EF4444']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Text style={styles.icon}>{giftIcon}</Text>

        <View style={styles.textCol}>
          <Text style={styles.qtyMultiplier}>
            x{quantity > 1 ? quantity : comboCount}
          </Text>
          <Text style={styles.giftNameText} numberOfLines={1}>
            {giftName}
          </Text>
          <View style={styles.comboRow}>
            <Text style={styles.comboLabel}>COMBO</Text>
            <Animated.Text
              style={[
                styles.comboNumber,
                { transform: [{ scale: numPopAnim }] },
              ]}
            >
              {comboCount < 10 ? `0${comboCount}` : comboCount}
            </Animated.Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 125,
    right: 14,
    zIndex: 998,
    shadowColor: '#FF007A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 10,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 22,
    gap: 8,
    borderWidth: 2,
    borderColor: '#FEF08A',
  },
  icon: {
    fontSize: 28,
  },
  textCol: {
    flexDirection: 'column',
  },
  qtyMultiplier: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  giftNameText: {
    color: '#FEF08A',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  comboRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  comboLabel: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  comboNumber: {
    color: '#FEF08A',
    fontSize: 19,
    fontWeight: '900',
    fontStyle: 'italic',
  },
});
