import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, AccessibilityInfo, Platform } from 'react-native';
import Svg, { Text as SvgText, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

/**
 * Shared Identity Display Name Renderer for Yaro
 *
 * Supports:
 * - Solid colors
 * - Multi-color Linear Gradients (SVG hardware-accelerated)
 * - Neon glow & intense text shadows
 * - Shimmer & rainbow color cycles
 * - VIP / SVIP Prefix emblems (👑, ⚡, 💎, 🌈)
 * - Reduced-motion accessibility fallback
 * - Crowded room performance optimization mode
 */
export default function IdentityDisplayName({
  name = 'User',
  effect,
  vipTier,
  isOfficial = false,
  fontSize = 14,
  fontWeight = 'bold',
  numberOfLines = 1,
  style,
  isCrowded = false,
  disableAnimation = false,
}) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [colorCycleIndex, setColorCycleIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((enabled) => {
        if (isMounted) setReduceMotion(enabled);
      })
      .catch(() => {});

    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (enabled) => {
      setReduceMotion(enabled);
    });

    return () => {
      isMounted = false;
      if (typeof sub?.remove === 'function') sub.remove();
    };
  }, []);

  // Resolve active effect configuration
  const effectConfig = effect?.config || effect || {};
  const colors = effectConfig.colors && effectConfig.colors.length > 0
    ? effectConfig.colors
    : vipTier?.nameColor
      ? [vipTier.nameColor, '#FFD700']
      : null;

  const animationType = effectConfig.animationType || 'none';
  const prefixBadge = effectConfig.prefixBadge || (isOfficial ? '👑' : null);
  const glowColor = effectConfig.glowColor || null;
  const shadowColor = effectConfig.shadowColor || 'rgba(0,0,0,0.5)';

  // Continuous subtle color cycle only when appropriate and not crowded
  const isAnimated = (animationType === 'rainbow' || animationType === 'gradient_scroll') &&
    !reduceMotion &&
    !disableAnimation &&
    !isCrowded &&
    colors &&
    colors.length > 1;

  useEffect(() => {
    if (!isAnimated) return;
    const interval = setInterval(() => {
      setColorCycleIndex((prev) => (prev + 1) % colors.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [isAnimated, colors]);

  const cleanName = String(name || '').trim();
  const fullText = prefixBadge ? `${prefixBadge} ${cleanName}` : cleanName;

  // 1. If multi-color gradient is present, render via React Native SVG for crisp performance
  if (colors && colors.length >= 2 && !isCrowded) {
    const rotatedColors = isAnimated
      ? [...colors.slice(colorCycleIndex), ...colors.slice(0, colorCycleIndex)]
      : colors;

    const approxWidth = Math.max(80, fullText.length * (fontSize * 0.72) + 24);
    const approxHeight = fontSize * 1.5;

    return (
      <View style={[styles.svgContainer, { height: approxHeight, maxWidth: approxWidth }, style]}>
        <Svg height={approxHeight} width="100%">
          <Defs>
            <SvgLinearGradient id="identityGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              {rotatedColors.map((color, idx) => (
                <Stop
                  key={`stop_${idx}`}
                  offset={`${(idx / (rotatedColors.length - 1)) * 100}%`}
                  stopColor={color}
                />
              ))}
            </SvgLinearGradient>
          </Defs>
          <SvgText
            fill="url(#identityGradient)"
            fontSize={fontSize}
            fontWeight={fontWeight}
            x="0"
            y={fontSize * 1.05}
          >
            {fullText}
          </SvgText>
        </Svg>
      </View>
    );
  }

  // 2. Solid color or Crowded mode fallback: native <Text> with neon textShadow
  const primaryColor = colors ? colors[0] : '#FFFFFF';
  const textShadowStyle = glowColor
    ? {
        textShadowColor: glowColor,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: isCrowded ? 4 : 8,
      }
    : {
        textShadowColor: shadowColor,
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
      };

  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        {
          color: primaryColor,
          fontSize,
          fontWeight,
        },
        textShadowStyle,
        style,
      ]}
    >
      {fullText}
    </Text>
  );
}

const styles = StyleSheet.create({
  svgContainer: {
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
