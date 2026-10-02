import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

export default function SkeletonLoader({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.85],
  });

  return (
    <View style={[{ width, height, borderRadius, overflow: 'hidden', backgroundColor: '#E2E8F0' }, style]}>
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: '#CBD5E1',
            opacity,
          },
        ]}
      />
    </View>
  );
}

export function HostCardSkeleton() {
  return (
    <View style={skeletonStyles.card}>
      <SkeletonLoader width={56} height={56} borderRadius={28} />
      <View style={{ flex: 1, marginLeft: 14 }}>
        <SkeletonLoader width="65%" height={16} borderRadius={6} style={{ marginBottom: 8 }} />
        <SkeletonLoader width="40%" height={12} borderRadius={4} />
      </View>
      <SkeletonLoader width={42} height={42} borderRadius={21} />
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
});
