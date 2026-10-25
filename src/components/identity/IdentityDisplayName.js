import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Text } from 'react-native';

// Smooth multicolour lettering, with colours flowing across the full name.
// Native text preserves font shaping, emoji and the user's original spelling.
export default function IdentityDisplayName({
  name = 'User', effect, vipTier, isOfficial = false, fontSize = 14,
  fontWeight = 'bold', numberOfLines = 1, style, isCrowded = false,
  disableAnimation = false,
}) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const sweep = useRef(new Animated.Value(0)).current;
  const config = effect?.config || effect || {};
  const supplied = config.colors || config.gradient;
  const [clock, setClock] = useState(Date.now());
  const expiresAt = config.expiresAt ? new Date(config.expiresAt).getTime() : null;
  const styled = config.enabled !== false && (!expiresAt || expiresAt > clock) && Boolean(supplied?.length || vipTier?.nameColor);
  const speed = Math.max(0.25, Math.min(3, Number(config.speed || config.animationSpeed) || 1));
  const rawBase = supplied?.[0] || vipTier?.nameColor || '#FFD700';
  const base = /^#?(000|111|222|000000|111827|0f172a|black)/i.test(String(rawBase).trim()) ? '#FFD700' : rawBase;
  const palette = config.animationColors?.length >= 2 ? config.animationColors
    : supplied?.length >= 4 ? supplied
    : ['#FFD700', '#FDE047', '#FEF08A', '#F59E0B', '#FBBF24', '#FFE66D', '#FFD700'];
  const text = String(name || '').trim();
  const prefix = config.prefixBadge || (isOfficial ? '\u{1F451}' : '');
  const fullName = prefix ? prefix + ' ' + text : text;
  const glyphs = Array.from(fullName);
  const preserveShaping = /[\u0300-\u036f\u0900-\u0dff\u200d]/.test(text);
  const animate = styled && !reduceMotion && !disableAnimation && config.animationType !== 'none';

  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled?.().then(value => {
      if (alive) setReduceMotion(value);
    }).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setReduceMotion);
    return () => { alive = false; subscription?.remove?.(); };
  }, []);

  useEffect(() => {
    if (!expiresAt || expiresAt <= clock) return undefined;
    const timer = setTimeout(() => setClock(Date.now()), Math.min(2147483647, expiresAt - clock + 10));
    return () => clearTimeout(timer);
  }, [expiresAt, clock]);

  useEffect(() => {
    sweep.setValue(0);
    if (!animate) return undefined;
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(sweep, { toValue: 1, duration: Math.round(4200 / speed), easing: Easing.linear, useNativeDriver: false }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [animate, speed, sweep]);

  const shineAt = (index, count) => {
    if (config.animationType === 'shimmer') {
      const start = 0.05 + (index / Math.max(1, count)) * 0.65;
      return sweep.interpolate({ inputRange: [0, start, start + 0.10, start + 0.22, 1],
        outputRange: [base, base, palette[1] || '#FFF', base, base], extrapolate: 'clamp' });
    }
    if (config.animationType === 'glow_pulse') {
      return sweep.interpolate({ inputRange: [0, 0.5, 1], outputRange: [palette[0] || base, palette[1] || '#FFF', palette[0] || base] });
    }
    const offset = Math.floor(index / Math.max(1, count) * palette.length);
    const rotated = palette.map((_, step) => palette[(step + offset) % palette.length]);
    return sweep.interpolate({
      inputRange: Array.from({ length: palette.length + 1 }, (_, step) => step / palette.length),
      outputRange: [...rotated, rotated[0]],
      extrapolate: 'clamp',
    });
  };
  const textStyle = [
    {
      fontSize,
      fontWeight,
      color: '#FFD700',
      textShadowColor: 'rgba(0, 0, 0, 0.9)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2.5,
    },
    style,
    styled && { color: base },
  ];
  // Compact rooms use one animated text run instead of one per letter.
  if (!animate || preserveShaping || isCrowded) {
    return <Animated.Text accessibilityLabel={text} numberOfLines={numberOfLines}
      style={[textStyle, animate && { color: shineAt(0, 1) }]}>{fullName}</Animated.Text>;
  }
  return (
    <Text accessibilityLabel={text} numberOfLines={numberOfLines} style={textStyle}>
      {glyphs.map((glyph, index) => (
        <Animated.Text key={index} style={{ color: shineAt(index, glyphs.length) }}>{glyph}</Animated.Text>
      ))}
    </Text>
  );
}
