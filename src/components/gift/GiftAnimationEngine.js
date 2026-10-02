import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import GiftMedia from '../GiftMedia';
import { GIFT_RARITY_CONFIG, receiverPositionRegistry } from './constants/giftConfig';

const { width, height } = Dimensions.get('window');

// 16 radial burst particles for impact on avatar
const PARTICLES = Array.from({ length: 16 }, (_, i) => {
  const angle = (i * 22.5 * Math.PI) / 180;
  return {
    dx: Math.cos(angle) * 110,
    dy: Math.sin(angle) * 110,
    size: 6 + (i % 4) * 3,
    color: ['#F59E0B', '#EC4899', '#8B5CF6', '#38BDF8', '#10B981', '#F43F5E'][i % 6],
  };
});

export default function GiftAnimationEngine({ animation, onAnimationComplete }) {
  if (!animation) return null;

  const gift = animation.gift || {};
  const sender = animation.sender || {};
  const receivers = animation.receivers || (animation.receiver ? [animation.receiver] : []);
  const quantity = Number(animation.quantity || 1);
  const comboCount = Number(animation.comboCount || 1);

  const rarity = (gift.rarity || 'common').toLowerCase();
  const config = GIFT_RARITY_CONFIG[rarity] || GIFT_RARITY_CONFIG.common;

  // Receiver screen targeting
  const targetReceiver = receivers[0] || {};
  const targetCoords = receiverPositionRegistry.getTargetCenter(
    targetReceiver.id || targetReceiver._id || targetReceiver.userId
  );

  // Center Coordinates (Center Stage)
  const centerX = width * 0.5;
  const centerY = height * 0.42;

  // Recipient Avatar Coordinates
  const endX = targetCoords.x;
  const endY = targetCoords.y;

  // Animated values
  // 1. Center Stage Showcase
  const centerScale = useRef(new Animated.Value(0.2)).current;
  const centerOpacity = useRef(new Animated.Value(0)).current;
  const sunburstRotation = useRef(new Animated.Value(0)).current;
  const sunburstOpacity = useRef(new Animated.Value(0)).current;
  const bannerOpacity = useRef(new Animated.Value(0)).current;
  const bannerTranslateY = useRef(new Animated.Value(20)).current;

  // 2. Flight from Center to Recipient Avatar
  const flightProgress = useRef(new Animated.Value(0)).current;
  const flightScale = useRef(new Animated.Value(1.2)).current;
  const flightRotation = useRef(new Animated.Value(0)).current;
  const flightOpacity = useRef(new Animated.Value(1)).current;

  // 3. Impact on Recipient Avatar
  const impactScale = useRef(new Animated.Value(0.7)).current;
  const impactOpacity = useRef(new Animated.Value(0)).current;
  const particleProgress = useRef(new Animated.Value(0)).current;
  const receiverRingScale = useRef(new Animated.Value(0.5)).current;
  const receiverRingOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Reset all anim values
    centerScale.setValue(0.2);
    centerOpacity.setValue(0);
    sunburstRotation.setValue(0);
    sunburstOpacity.setValue(0);
    bannerOpacity.setValue(0);
    bannerTranslateY.setValue(20);

    flightProgress.setValue(0);
    flightScale.setValue(1.2);
    flightRotation.setValue(0);
    flightOpacity.setValue(1);

    impactScale.setValue(0.7);
    impactOpacity.setValue(0);
    particleProgress.setValue(0);
    receiverRingScale.setValue(0.5);
    receiverRingOpacity.setValue(0);

    // Continuous spin for radiant aura
    Animated.loop(
      Animated.timing(sunburstRotation, {
        toValue: 1,
        duration: 2500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // STAGE 1: Center Stage Pop & Showcase
    // STAGE 2: Fly from Center directly to Recipient's Avatar
    // STAGE 3: Absorbs into Avatar and disappears (gayab ho jaye) with clean sparkle particles
    Animated.sequence([
      // STAGE 1: Center Stage Pop & Showcase
      Animated.parallel([
        Animated.timing(centerOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(centerScale, {
          toValue: 1.25,
          friction: 3.5,
          tension: 75,
          useNativeDriver: true,
        }),
        Animated.timing(sunburstOpacity, {
          toValue: 0.85,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(bannerOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(bannerTranslateY, {
          toValue: 0,
          friction: 5,
          tension: 60,
          useNativeDriver: true,
        }),
      ]),

      // Showcase in center for viewer excitement
      Animated.delay(650),

      // STAGE 2: Fly from Center directly into Recipient's Avatar
      Animated.parallel([
        Animated.timing(bannerOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(sunburstOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(flightProgress, {
          toValue: 1,
          duration: 680,
          easing: Easing.bezier(0.22, 1, 0.36, 1),
          useNativeDriver: true,
        }),
        Animated.timing(flightScale, {
          toValue: 0.3,
          duration: 680,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(flightRotation, {
          toValue: 1,
          duration: 680,
          useNativeDriver: true,
        }),
      ]),

      // STAGE 3: Absorbs directly into Avatar and disappears!
      Animated.parallel([
        // Gift fades completely to 0 into avatar
        Animated.timing(flightOpacity, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        // Sparkle burst around recipient avatar
        Animated.timing(particleProgress, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),

      Animated.delay(300),
    ]).start(() => {
      onAnimationComplete && onAnimationComplete(animation.id);
    });
  }, [animation.id]);

  // Curved Flight Coordinates: (centerX, centerY) -> (endX, endY)
  const curX = flightProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [centerX - 40, endX - 40],
  });

  const curY = flightProgress.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [centerY - 40, Math.min(centerY, endY) - 45, endY - 40],
  });

  const flightTilt = flightRotation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '-15deg', '0deg'],
  });

  const sunburstSpin = sunburstRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const receiverNameText =
    receivers.length > 0 ? receivers.map((r) => r.name).join(', ') : 'Host';

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {/* 1. Center Stage Aura Glow & Sunburst */}
      <Animated.View
        style={[
          styles.centerSunburstWrapper,
          {
            left: centerX - 120,
            top: centerY - 120,
            opacity: sunburstOpacity,
            transform: [{ rotate: sunburstSpin }],
          },
        ]}
      >
        <LinearGradient
          colors={[config.glowColor || 'rgba(245, 158, 11, 0.6)', 'transparent']}
          style={styles.centerSunburstRay}
        />
      </Animated.View>

      {/* 2. Center Stage Announcement Banner */}
      <Animated.View
        style={[
          styles.centerAnnouncementWrapper,
          {
            left: 20,
            right: 20,
            top: centerY + 65,
            opacity: bannerOpacity,
            transform: [{ translateY: bannerTranslateY }],
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(15, 23, 42, 0.95)', 'rgba(30, 27, 75, 0.95)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.centerAnnouncementGradient}
        >
          <Text style={styles.bannerSender} numberOfLines={1}>
            {sender.name || 'User'}
          </Text>
          <Text style={styles.bannerAction}> sent </Text>
          <Text style={[styles.bannerGift, { color: config.borderColor || '#FACC15' }]} numberOfLines={1}>
            {gift.name || 'Gift'}
          </Text>
          <Text style={styles.bannerTo} numberOfLines={1}>
            {' '}to {receiverNameText}
          </Text>

          {comboCount > 1 && (
            <View style={styles.centerComboBadge}>
              <Text style={styles.centerComboText}>COMBO x{comboCount}</Text>
            </View>
          )}
        </LinearGradient>
      </Animated.View>

      {/* 3. The Gift Entity (Appears in Center, then flies smoothly to Recipient Avatar) */}
      <Animated.View
        style={[
          styles.flyingEntity,
          {
            opacity: Animated.multiply(centerOpacity, flightOpacity),
            transform: [
              { translateX: curX },
              { translateY: curY },
              { scale: Animated.multiply(centerScale, flightScale) },
              { rotate: flightTilt },
            ],
          },
        ]}
      >
        {/* Glow halo */}
        <View style={[styles.flightTrail, { shadowColor: config.borderColor || '#FACC15' }]} />

        {gift.animationUrl || gift.icon?.startsWith('http') ? (
          <GiftMedia
            source={gift.animationUrl || gift.icon}
            mediaType={gift.mediaType || 'image'}
            style={styles.flightMedia}
            resizeMode="contain"
          />
        ) : (
          <Text style={styles.flightEmoji}>{gift.icon || '🎁'}</Text>
        )}

        {quantity > 1 && (
          <View style={styles.flightQtyBadge}>
            <Text style={styles.flightQtyText}>x{quantity}</Text>
          </View>
        )}
      </Animated.View>

      {/* 4. Recipient Avatar Particle Sparkle Burst (Anchored directly at recipient avatar center) */}
      <Animated.View
        style={[
          styles.impactStage,
          {
            left: endX - 45,
            top: endY - 45,
            opacity: particleProgress.interpolate({
              inputRange: [0, 0.1, 0.8, 1],
              outputRange: [0, 1, 1, 0],
            }),
          },
        ]}
      >
        {/* Radial Particles Burst directly on Avatar */}
        {PARTICLES.map((p, idx) => {
          const posX = particleProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, p.dx],
          });
          const posY = particleProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, p.dy],
          });
          const pOpacity = particleProgress.interpolate({
            inputRange: [0, 0.6, 1],
            outputRange: [1, 1, 0],
          });

          return (
            <Animated.View
              key={`burst-p-${idx}`}
              style={[
                styles.burstParticle,
                {
                  width: p.size,
                  height: p.size,
                  borderRadius: p.size / 2,
                  backgroundColor: p.color,
                  opacity: pOpacity,
                  transform: [{ translateX: posX }, { translateY: posY }],
                },
              ]}
            />
          );
        })}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  centerSunburstWrapper: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 905,
  },
  centerSunburstRay: {
    width: 230,
    height: 230,
    borderRadius: 115,
  },
  centerAnnouncementWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 910,
  },
  centerAnnouncementGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  bannerSender: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  bannerAction: {
    color: '#94A3B8',
    fontSize: 11,
  },
  bannerGift: {
    fontSize: 12,
    fontWeight: '900',
  },
  bannerTo: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  centerComboBadge: {
    backgroundColor: '#FF007A',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 6,
  },
  centerComboText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  flyingEntity: {
    position: 'absolute',
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 915,
  },
  flightTrail: {
    position: 'absolute',
    width: 65,
    height: 65,
    borderRadius: 32.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 18,
    elevation: 8,
  },
  flightMedia: {
    width: 68,
    height: 68,
  },
  flightEmoji: {
    fontSize: 56,
  },
  flightQtyBadge: {
    position: 'absolute',
    bottom: -2,
    right: 2,
    backgroundColor: '#EC4899',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderWidth: 1.5,
    borderColor: '#0F172A',
  },
  flightQtyText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  impactStage: {
    position: 'absolute',
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 925,
  },
  burstParticle: {
    position: 'absolute',
    zIndex: 930,
  },
});
