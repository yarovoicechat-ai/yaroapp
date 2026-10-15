import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

/**
 * Shared Identity Badge Renderer for Yaro
 *
 * Renders Official ID badges, SVIP badges, VIP badges, and Unique Badges
 */
export default function IdentityBadge({
  type = 'official',
  label = 'OFFICIAL',
  vipLevel = null,
  isSvip = false,
  badgeColors = null,
  size = 'md',
  style,
}) {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  // Official badge configuration
  if (type === 'official') {
    const colors = badgeColors || ['#F59E0B', '#D97706'];
    return (
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.badgeBase,
          isSm ? styles.badgeSm : isLg ? styles.badgeLg : styles.badgeMd,
          style,
        ]}
      >
        <Text style={[styles.badgeText, isSm && styles.badgeTextSm, isLg && styles.badgeTextLg]}>
          👑 {label || 'OFFICIAL'}
        </Text>
      </LinearGradient>
    );
  }

  // SVIP / VIP badge configuration
  if (type === 'vip' || type === 'svip' || vipLevel) {
    const colors = isSvip
      ? ['#FF007A', '#7928CA', '#0070F3']
      : ['#FFE259', '#FFA751'];
    const title = isSvip
      ? `SVIP ${vipLevel || ''}`.trim()
      : `VIP ${vipLevel || ''}`.trim();

    return (
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.badgeBase,
          isSm ? styles.badgeSm : isLg ? styles.badgeLg : styles.badgeMd,
          style,
        ]}
      >
        <Text style={[styles.badgeText, isSm && styles.badgeTextSm, isLg && styles.badgeTextLg]}>
          {isSvip ? '⚡' : '👑'} {title}
        </Text>
      </LinearGradient>
    );
  }

  // Generic / Unique badge fallback
  const colors = badgeColors || ['#06B6D4', '#3B82F6'];
  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[
        styles.badgeBase,
        isSm ? styles.badgeSm : isLg ? styles.badgeLg : styles.badgeMd,
        style,
      ]}
    >
      <Text style={[styles.badgeText, isSm && styles.badgeTextSm, isLg && styles.badgeTextLg]}>
        💎 {label}
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  badgeBase: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  badgeSm: {
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  badgeMd: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
  },
  badgeLg: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#0F172A',
    fontWeight: '900',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  badgeTextSm: {
    fontSize: 8,
  },
  badgeTextLg: {
    fontSize: 12,
  },
});
