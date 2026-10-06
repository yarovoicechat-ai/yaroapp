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
import GiftMedia from '../GiftMedia';

const { width, height } = Dimensions.get('window');
const PREMIUM_TYPES = new Set(['SPECIAL', 'CENTER_STAGE', 'FULL_SCREEN', 'VIP', 'LUXURY']);

const firstReceiver = (animation) =>
  animation?.receivers?.[0] || animation?.receiver || null;

export default function GiftAnimationEngine({ animation, onAnimationComplete }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.72)).current;
  const translateY = useRef(new Animated.Value(34)).current;
  const ribbonOpacity = useRef(new Animated.Value(0)).current;
  const onCompleteRef = useRef(onAnimationComplete);
  onCompleteRef.current = onAnimationComplete;

  const gift = animation?.gift || {};
  const animationType = String(animation?.animationType || gift.animationType || 'NORMAL').toUpperCase();
  const animationUrl = gift.animationUrl || gift.mediaUrl || animation?.animationUrl || '';
  const fallbackImage = gift.image || gift.giftImage || gift.previewUrl || '';
  const visualUrl = animationUrl || (PREMIUM_TYPES.has(animationType) ? fallbackImage : '');
  const animationId = animation?.id || animation?.animationId || null;

  useEffect(() => {
    if (!animation || !animationId) return undefined;

    if (!visualUrl) {
      const noVisualTimer = setTimeout(() => onCompleteRef.current?.(animationId), 0);
      return () => clearTimeout(noVisualTimer);
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
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 7,
          tension: 52,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: enterDuration,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(ribbonOpacity, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(holdDuration),
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: exitDuration,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1.08,
          duration: exitDuration,
          useNativeDriver: true,
        }),
        Animated.timing(ribbonOpacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]),
    ]);

    sequence.start(({ finished }) => {
      if (finished) onCompleteRef.current?.(animationId);
    });

    return () => sequence.stop();
  }, [
    animation,
    animationId,
    gift.duration,
    opacity,
    ribbonOpacity,
    scale,
    translateY,
    visualUrl,
  ]);

  if (!animation || !visualUrl) return null;

  const receiver = firstReceiver(animation);
  const quantity = Number(animation.quantity || 1);
  const senderName = animation.sender?.name || 'User';
  const receiverName = receiver?.name || 'Host';

  return (
    <View style={styles.overlay} pointerEvents="none">
      <Animated.View
        style={[
          styles.mediaStage,
          {
            opacity,
            transform: [{ translateY }, { scale }],
          },
        ]}
      >
        <GiftMedia
          source={visualUrl}
          mediaType={gift.mediaType}
          style={styles.media}
          resizeMode="contain"
          fallbackSource={fallbackImage ? { uri: fallbackImage } : undefined}
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
            <Text style={styles.quantityText}>×{quantity}</Text>
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
  media: {
    width,
    height: height * 0.67,
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
  sender: {
    maxWidth: width * 0.2,
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  action: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '600',
  },
  giftName: {
    maxWidth: width * 0.22,
    color: '#FEF08A',
    fontSize: 11,
    fontWeight: '900',
  },
  receiver: {
    maxWidth: width * 0.18,
    color: '#BAE6FD',
    fontSize: 11,
    fontWeight: '800',
  },
  quantityPill: {
    marginLeft: 7,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#FDE047',
  },
  quantityText: {
    color: '#4C1D95',
    fontSize: 10,
    fontWeight: '900',
  },
});
