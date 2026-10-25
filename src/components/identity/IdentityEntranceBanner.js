import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import IdentityDisplayName from './IdentityDisplayName';
import IdentityBadge from './IdentityBadge';
import SvgaView from '../SvgaView';

// Global in-memory event deduplication cache
const PROCESSED_EVENT_IDS = new Map();
const DEDUPLICATION_WINDOW_MS = 60 * 1000; // 60 seconds

function isEventDuplicate(eventId) {
  if (!eventId) return false;
  const now = Date.now();

  // Prune stale entries
  for (const [id, timestamp] of PROCESSED_EVENT_IDS.entries()) {
    if (now - timestamp > DEDUPLICATION_WINDOW_MS) {
      PROCESSED_EVENT_IDS.delete(id);
    }
  }

  if (PROCESSED_EVENT_IDS.has(eventId)) {
    return true; // Already played
  }

  PROCESSED_EVENT_IDS.set(eventId, now);
  return false;
}

/**
 * Deduplicated Live Room Entrance Announcement Banner
 *
 * Prevents repeated playback from socket reconnects, tab switches, or re-renders.
 */
export default function IdentityEntranceBanner({
  event,
  onDismiss,
  duration = 4000,
}) {
  const [visible, setVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!event) return;

    // Stable event ID deduplication
    const eventId = event.eventId || event.id || `${event.userId}_${event.timestamp || Date.now()}`;
    if (isEventDuplicate(eventId)) {
      return;
    }

    setVisible(true);

    // Slide in
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 80,
        friction: 9,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss after duration
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -120,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setVisible(false);
        onDismiss?.();
      });
    }, duration);

    return () => clearTimeout(timer);
  }, [event]);

  if (!visible || !event) return null;

  const isSvip = Boolean(event.isSvip || event.svipTier);
  const isOfficial = Boolean(event.isOfficial);

  const gradientColors = isSvip
    ? ['#7928CA', '#FF0080', '#0070F3']
    : isOfficial
      ? ['#F59E0B', '#D97706', '#B45309']
      : ['#3B82F6', '#1E40AF', '#172554'];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
      pointerEvents="none"
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.bannerContent}
      >
        {event.entranceSvga ? (
          <View style={styles.svgaWrapper}>
            <SvgaView source={event.entranceSvga} style={StyleSheet.absoluteFillObject} loops={1} />
          </View>
        ) : null}

        <View style={styles.textContainer}>
          <View style={styles.badgeRow}>
            {isOfficial ? (
              <IdentityBadge type="official" label="OFFICIAL" size="sm" />
            ) : isSvip ? (
              <IdentityBadge type="svip" vipLevel={event.svipTier?.level || event.vipLevel} isSvip size="sm" />
            ) : null}
            <Text style={styles.enteredText}>Entered the room</Text>
          </View>

          <IdentityDisplayName
            name={event.name || event.userName || 'VIP Guest'}
            effect={event.nameEffect}
            vipTier={event.svipTier || event.vipTier}
            fontSize={13}
            fontWeight="900"
          />
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  svgaWrapper: {
    width: 36,
    height: 36,
    marginRight: 8,
  },
  textContainer: {
    flexShrink: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  enteredText: {
    color: '#FEF08A',
    fontSize: 10.5,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
