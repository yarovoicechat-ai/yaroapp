import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import GiftMedia from '../GiftMedia';
import { receiverPositionRegistry } from './constants/giftConfig';
import { resolveGiftVisual } from './giftMediaUtils';

const { width, height } = Dimensions.get('window');
const PREMIUM_TYPES = new Set(['SPECIAL', 'CENTER_STAGE', 'FULL_SCREEN', 'VIP', 'LUXURY']);

const firstReceiver = (animation) => animation?.receivers?.[0] || animation?.receiver || null;

export default function GiftAnimationEngine({ animation, onAnimationComplete }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.72)).current;
  const translateY = useRef(new Animated.Value(34)).current;
  const ribbonOpacity = useRef(new Animated.Value(0)).current;
  const flightOpacity = useRef(new Animated.Value(0)).current;
  const flightScale = useRef(new Animated.Value(0.85)).current;
  const flightX = useRef(new Animated.Value(width / 2 - 26)).current;
  const flightY = useRef(new Animated.Value(height * 0.55 - 26)).current;
  const burstOpacity = useRef(new Animated.Value(0)).current;
  const burstScale = useRef(new Animated.Value(0.2)).current;
  const onCompleteRef = useRef(onAnimationComplete);
  onCompleteRef.current = onAnimationComplete;

  const nestedGift = animation?.gift && typeof animation.gift === 'object' ? animation.gift : {};
  const gift = {
    ...nestedGift,
    animationUrl: nestedGift.animationUrl || animation?.animationUrl || animation?.giftAnimationUrl,
    mediaUrl: nestedGift.mediaUrl || animation?.mediaUrl,
    image: nestedGift.image || animation?.giftImage || animation?.image,
    giftImage: nestedGift.giftImage || animation?.giftImage,
    icon: nestedGift.icon || animation?.giftIcon || animation?.icon,
    name: nestedGift.name || animation?.giftName || animation?.name,
    mediaType: nestedGift.mediaType || animation?.mediaType,
  };
  const animationType = String(animation?.animationType || gift.animationType || 'NORMAL').toUpperCase();
  const animationUrl = gift.animationUrl || gift.mediaUrl || animation?.animationUrl || '';
  const giftVisual = resolveGiftVisual(gift);
  const visualUrl = animationUrl || (PREMIUM_TYPES.has(animationType) ? giftVisual.giftImage : '');
  const animationId = animation?.id || animation?.animationId || null;
  const receiver = firstReceiver(animation);
  const receiverId = receiver?.id || receiver?._id || receiver?.userId || receiver?.name;
  const target = receiverPositionRegistry.getTargetCenter(receiverId) || {
    x: width / 2,
    y: height * 0.28,
  };
  const targetX = Math.max(8, Math.min(width - 60, target.x - 26));
  const targetY = Math.max(24, Math.min(height - 72, target.y - 26));
  const isFlightAnimation = !PREMIUM_TYPES.has(animationType);
  const flightSource = giftVisual.giftImage || animationUrl;
  const hasAnyVisual = Boolean(visualUrl || flightSource || giftVisual.giftIcon);

  useEffect(() => {
    if (!animation || !animationId) return undefined;

    if (!hasAnyVisual) {
      const noVisualTimer = setTimeout(() => onCompleteRef.current?.(animationId), 0);
      return () => clearTimeout(noVisualTimer);
    }

    if (isFlightAnimation) {
      flightOpacity.setValue(1);
      flightScale.setValue(0.85);
      flightX.setValue(width / 2 - 26);
      flightY.setValue(height * 0.55 - 26);
      burstOpacity.setValue(0);
      burstScale.setValue(0.2);

      const flight = Animated.parallel([
        Animated.timing(flightX, {
          toValue: targetX,
          duration: 760,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(flightY, {
          toValue: targetY,
          duration: 760,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(flightScale, { toValue: 1.15, duration: 250, useNativeDriver: true }),
          Animated.timing(flightScale, { toValue: 0.65, duration: 510, useNativeDriver: true }),
        ]),
      ]);
      let arrivalAnimation = null;

      flight.start(({ finished }) => {
        if (!finished) return;
        arrivalAnimation = Animated.sequence([
          Animated.delay(500),
          Animated.timing(burstOpacity, { toValue: 1, duration: 1, useNativeDriver: true }),
          Animated.parallel([
            Animated.timing(flightOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
            Animated.timing(flightScale, { toValue: 0.15, duration: 220, useNativeDriver: true }),
            Animated.timing(burstOpacity, { toValue: 0, duration: 360, useNativeDriver: true }),
            Animated.timing(burstScale, { toValue: 1.75, duration: 360, useNativeDriver: true }),
          ]),
        ]);
        arrivalAnimation.start(({ finished: completed }) => {
          if (completed) onCompleteRef.current?.(animationId);
        });
      });

      return () => {
        flight.stop();
        arrivalAnimation?.stop();
        flightOpacity.stopAnimation();
        flightScale.stopAnimation();
        flightX.stopAnimation();
        flightY.stopAnimation();
        burstOpacity.stopAnimation();
        burstScale.stopAnimation();
      };
    }

    opacity.setValue(0);
    scale.setValue(0.72);
    translateY.setValue(34);
    ribbonOpacity.setValue(0);

    const requestedDuration = Number(animation.duration || gift.duration || 4200);
    const duration = Math.min(12000, Math.max(2400, requestedDuration));
    const enterDuration = 360;
    const exitDuration = 360;
    const holdDuration = Math.max(1200, duration - enterDuration - exitDuration);
    const sequence = Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 7, tension: 52, useNativeDriver: true }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: enterDuration,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(ribbonOpacity, { toValue: 1, duration: 260, useNativeDriver: true }),
      ]),
      Animated.delay(holdDuration),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: exitDuration, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1.08, duration: exitDuration, useNativeDriver: true }),
        Animated.timing(ribbonOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]),
    ]);

    sequence.start(({ finished }) => {
      if (finished) onCompleteRef.current?.(animationId);
    });
    return () => sequence.stop();
  }, [
    animation,
    animationId,
    burstOpacity,
    burstScale,
    flightOpacity,
    flightScale,
    flightX,
    flightY,
    gift.duration,
    hasAnyVisual,
    isFlightAnimation,
    opacity,
    ribbonOpacity,
    scale,
    targetX,
    targetY,
    translateY,
  ]);

  if (!animation) return null;

  const quantity = Number(animation.quantity || 1);
  const senderName = animation.sender?.name || 'User';
  const receiverName = receiver?.name || 'Host';

  if (isFlightAnimation) {
    return (
      <View style={styles.overlay} pointerEvents="none">
        <Animated.View
          style={[
            styles.flightVisual,
            {
              opacity: flightOpacity,
              transform: [{ translateX: flightX }, { translateY: flightY }, { scale: flightScale }],
            },
          ]}
        >
          {flightSource ? (
            <GiftMedia
              source={flightSource}
              mediaType={gift.mediaType}
              style={styles.flightImage}
              resizeMode="contain"
              repeat
              muted
            />
          ) : giftVisual.giftIcon ? (
            <Text style={styles.flightEmoji}>{giftVisual.giftIcon}</Text>
          ) : (
            <MaterialCommunityIcons name="gift" size={44} color="#FDE68A" />
          )}
          {quantity > 1 ? (
            <View style={styles.flightQuantity}>
              <Text style={styles.flightQuantityText}>x{quantity}</Text>
            </View>
          ) : null}
        </Animated.View>
        <Animated.View
          style={[
            styles.burst,
            {
              left: target.x - 30,
              top: target.y - 30,
              opacity: burstOpacity,
              transform: [{ scale: burstScale }],
            },
          ]}
        >
          <MaterialCommunityIcons name="star-four-points" size={40} color="#FDE68A" />
        </Animated.View>
      </View>
    );
  }

  if (!visualUrl) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      <Animated.View style={[styles.mediaStage, { opacity, transform: [{ translateY }, { scale }] }]}>
        <GiftMedia
          source={visualUrl}
          mediaType={gift.mediaType}
          style={styles.media}
          resizeMode="contain"
          fallbackSource={giftVisual.giftImage ? { uri: giftVisual.giftImage } : undefined}
          repeat
          muted
        />
      </Animated.View>
      <Animated.View style={[styles.ribbonWrap, { opacity: ribbonOpacity }]}>
        <LinearGradient
          colors={['rgba(49,17,82,0.94)', 'rgba(190,24,93,0.96)', 'rgba(79,70,229,0.94)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.ribbon}
        >
          <Text style={styles.sender} numberOfLines={1}>{senderName}</Text>
          <Text style={styles.action}> sent </Text>
          <Text style={styles.giftName} numberOfLines={1}>{gift.name || 'Gift'}</Text>
          <Text style={styles.action}> to </Text>
          <Text style={styles.receiver} numberOfLines={1}>{receiverName}</Text>
          <View style={styles.quantityPill}>
            <Text style={styles.quantityText}>x{quantity}</Text>
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10400,
    elevation: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaStage: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: height * 0.16,
    height: height * 0.67,
    alignItems: 'center',
    justifyContent: 'center',
  },
  media: { width, height: height * 0.67 },
  flightVisual: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flightImage: { width: 52, height: 52 },
  flightEmoji: { fontSize: 42, textAlign: 'center' },
  flightQuantity: {
    position: 'absolute',
    right: -8,
    bottom: -3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#4C1D95',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  flightQuantityText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  burst: {
    position: 'absolute',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ribbonWrap: {
    position: 'absolute',
    top: height * 0.68,
    maxWidth: width - 28,
    borderRadius: 18,
    overflow: 'hidden',
  },
  ribbon: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.38)',
    borderRadius: 18,
  },
  sender: { maxWidth: width * 0.2, color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  action: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '600' },
  giftName: { maxWidth: width * 0.22, color: '#FEF08A', fontSize: 11, fontWeight: '900' },
  receiver: { maxWidth: width * 0.18, color: '#BAE6FD', fontSize: 11, fontWeight: '800' },
  quantityPill: { marginLeft: 7, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10, backgroundColor: '#FDE047' },
  quantityText: { color: '#4C1D95', fontSize: 10, fontWeight: '900' },
});
