import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import SvgaView from '../SvgaView';
import { resolveEntryAssets } from '../../utils/cosmeticResolver';

const SVIP4_BADGE = require('../../assets/svip/svip4_badge.png');
const SVIP3_TAG = require('../../assets/svip/svip3_tag.png');

const { width, height } = Dimensions.get('window');

/**
 * Calculates responsive font size so names of any length fit within
 * the available width without clipping, fading, ellipses (...), or overflow.
 *
 * Examples:
 * - "WEB" -> 22px
 * - "WEB DUNIYA" -> 18px
 * - "WEB DUNIYA OFFICIAL" -> 15px
 * - "WEB DUNIYA OFFICIAL KING OF KING" -> 11.5px
 */
const getFittedNameFontSize = (name) => {
  if (!name) return 18;
  const charCount = Array.from(name).length;
  if (charCount <= 7) return 22;
  if (charCount <= 12) return 18;
  if (charCount <= 18) return 15;
  if (charCount <= 25) return 13;
  return 11.5;
};

export default function VipFloatingEntryEngine({
  vipEntryEvent,
  onComplete,
}) {
  const [currentEntry, setCurrentEntry] = useState(null);
  const queueRef = useRef([]);
  const isPlayingRef = useRef(false);
  const playedIdsRef = useRef(new Set());

  // Animation values
  const containerScale = useRef(new Animated.Value(0.4)).current;
  const containerOpacity = useRef(new Animated.Value(0)).current;
  const containerTranslateY = useRef(new Animated.Value(-60)).current;
  const avatarPulse = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.5)).current;
  const tagSlide = useRef(new Animated.Value(20)).current;

  const processNextInQueue = useCallback(() => {
    if (queueRef.current.length === 0) {
      isPlayingRef.current = false;
      setCurrentEntry(null);
      if (onComplete) onComplete();
      return;
    }

    const nextEntry = queueRef.current.shift();
    isPlayingRef.current = true;
    setCurrentEntry(nextEntry);

    // Reset animation values
    containerScale.setValue(0.4);
    containerOpacity.setValue(0);
    containerTranslateY.setValue(-60);
    avatarPulse.setValue(1);
    glowOpacity.setValue(0.5);
    tagSlide.setValue(20);

    // 1. Entrance animation: Spring drop + scale up
    Animated.parallel([
      Animated.spring(containerScale, {
        toValue: 1.0,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(containerOpacity, {
        toValue: 1.0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(containerTranslateY, {
        toValue: 0,
        friction: 7,
        tension: 45,
        useNativeDriver: true,
      }),
      Animated.spring(tagSlide, {
        toValue: 0,
        friction: 5,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Pulse effect on avatar container
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(avatarPulse, { toValue: 1.06, duration: 700, useNativeDriver: true }),
        Animated.timing(avatarPulse, { toValue: 1.0, duration: 700, useNativeDriver: true }),
      ])
    );
    pulseLoop.start();

    // 3. Glow breathing
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, { toValue: 0.95, duration: 500, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 0.45, duration: 500, useNativeDriver: true }),
      ])
    );
    glowLoop.start();

    // Hold display for 3.2 seconds then exit smoothly
    const timer = setTimeout(() => {
      pulseLoop.stop();
      glowLoop.stop();

      Animated.parallel([
        Animated.timing(containerOpacity, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(containerTranslateY, {
          toValue: -80,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(containerScale, {
          toValue: 0.85,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start(() => {
        processNextInQueue();
      });
    }, 3200);

    return () => clearTimeout(timer);
  }, [onComplete]);

  // Queue incoming entry events
  useEffect(() => {
    if (!vipEntryEvent || !vipEntryEvent.entryId) return;

    // Deduplication check
    if (playedIdsRef.current.has(vipEntryEvent.entryId)) {
      return;
    }
    playedIdsRef.current.add(vipEntryEvent.entryId);

    // Limit memory set
    if (playedIdsRef.current.size > 80) {
      const arr = Array.from(playedIdsRef.current);
      playedIdsRef.current = new Set(arr.slice(arr.length - 40));
    }

    queueRef.current.push(vipEntryEvent);

    if (!isPlayingRef.current) {
      processNextInQueue();
    }
  }, [vipEntryEvent, processNextInQueue]);

  if (!currentEntry) return null;

  const user = currentEntry.user || {};
  const vipExp = currentEntry.vipExperience || {};
  const userName = String(user.name || 'VIP Member');
  const userAvatar = user.avatar || user.image || 'https://api.yaroapp.in/uploads/avatars/female_default.webp';
  const entryTagText = currentEntry.tagText || vipExp.entryTag || '👑 VIP HAS ENTERED';
  const crownIcon = vipExp.crown || '👑';

  const nameFontSize = getFittedNameFontSize(userName);

  const nameGlow = vipExp.nameEffect?.glowColor || '#F59E0B';
  const nameGradient = (vipExp.nameEffect?.gradient?.length)
    ? vipExp.nameEffect.gradient
    : ['#FDE047', '#EAB308', '#CA8A04'];

  const tagGradient = vipExp.isSvip
    ? ['#7C3AED', '#A855F7', '#C084FC']
    : ['#B45309', '#F59E0B', '#FBBF24'];

  const resolvedAssets = resolveEntryAssets(currentEntry);
  const entry = resolvedAssets?.entry || resolvedAssets?.entrance || currentEntry.entry || currentEntry.effect || {};
  const entrance = resolvedAssets?.entrance || currentEntry.entrance || {};
  const animationUrl = entry.animationUrl || entrance.animationUrl || currentEntry.animationUrl || '';
  const visualUrl =
    animationUrl ||
    entry.imageUrl ||
    entry.image ||
    entrance.imageUrl ||
    entrance.image ||
    currentEntry.imageUrl ||
    currentEntry.image ||
    vipExp.entryAnimation ||
    '';

  return (
    <View style={styles.fullscreenOverlay} pointerEvents="none">
      {/* 1. Dramatic Full-Screen Atmospheric Dimming & Radial Glow */}
      <Animated.View style={[styles.fullScreenBackdrop, { opacity: containerOpacity }]}>
        <LinearGradient
          colors={['rgba(15, 23, 42, 0.78)', 'rgba(30, 27, 75, 0.85)', 'rgba(0, 0, 0, 0.72)']}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      {/* 2. Full-Screen SVGA / Vehicle / Ride Animation Layer */}
      {visualUrl ? (
        <Animated.View style={[styles.fullScreenSvgaWrap, { opacity: containerOpacity }]}>
          <SvgaView
            source={visualUrl}
            style={StyleSheet.absoluteFillObject}
            loops={1}
            resizeMode="cover"
          />
        </Animated.View>
      ) : null}

      <Animated.View
        style={[
          styles.entryContainer,
          {
            opacity: containerOpacity,
            transform: [
              { translateY: containerTranslateY },
              { scale: containerScale },
            ],
          },
        ]}
      >
        {/* ✨ VIP HEADER BANNER & SPARKLES ✨ */}
        <Animated.View style={[styles.headerBannerWrap, { opacity: glowOpacity }]}>
          <Text style={styles.sparkleText}>✨ ✨ ✨</Text>
        </Animated.View>

        {/* CIRCULAR AVATAR CONTAINER WITH ENTRY FRAME */}
        <Animated.View
          style={[
            styles.avatarFrameOuter,
            {
              transform: [{ scale: avatarPulse }],
              shadowColor: nameGlow,
            },
          ]}
        >
          {/* Circular Frame Gradient Border */}
          <LinearGradient
            colors={nameGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarBorderGradient}
          >
            {/* Perfectly Clipped Circular Avatar */}
            <View style={styles.avatarClipCircle}>
              <Image
                source={{ uri: userAvatar }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            </View>
          </LinearGradient>

          {/* Floating Crown / VIP Badge on top */}
          <View style={styles.floatingCrownBadge}>
            <Text style={styles.crownEmoji}>{crownIcon}</Text>
          </View>
        </Animated.View>

        {/* VISUALLY CONNECTED VIP NAME DISPLAY WITH AUTO-SCALING */}
        <View style={styles.nameAreaContainer}>
          <Text
            style={[
              styles.vipNameText,
              {
                fontSize: nameFontSize,
                lineHeight: Math.round(nameFontSize * 1.25),
                textShadowColor: nameGlow,
              },
            ]}
          >
            {userName}
          </Text>
        </View>

        {/* VIP TITLE / ENTRY TAG PILL */}
        <Animated.View
          style={[
            styles.tagWrap,
            {
              transform: [{ translateY: tagSlide }],
            },
          ]}
        >
          {currentEntry?.svipLevel === 3 || currentEntry?.tagText?.includes('SVIP 3') || entryTagText?.includes('SVIP 3') || entryTagText?.includes('WOLF') ? (
            <Image source={SVIP3_TAG} style={{ width: 140, height: 46 }} resizeMode="contain" />
          ) : currentEntry?.svipLevel === 4 || currentEntry?.tagText?.includes('SVIP 4') || entryTagText?.includes('SVIP 4') || entryTagText?.includes('TIGER') ? (
            <View style={{ alignItems: 'center' }}>
              <Image source={SVIP4_BADGE} style={{ width: 100, height: 85 }} resizeMode="contain" />
            </View>
          ) : (
            <LinearGradient
              colors={tagGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.tagGradientPill}
            >
              <Text style={styles.tagIcon}>{crownIcon}</Text>
              <Text style={styles.tagLabelText}>
                {entryTagText}
              </Text>
            </LinearGradient>
          )}
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreenBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99998,
    elevation: 9998,
  },
  fullScreenSvgaWrap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999,
    elevation: 9999,
  },
  fullscreenOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100000,
    elevation: 10000,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: height * 0.16,
  },
  entryContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: width - 32,
    maxWidth: 360,
  },
  headerBannerWrap: {
    marginBottom: 6,
  },
  sparkleText: {
    fontSize: 18,
    color: '#FDE047',
    letterSpacing: 6,
  },
  avatarFrameOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.85,
    shadowRadius: 14,
    elevation: 16,
  },
  avatarBorderGradient: {
    width: 96,
    height: 96,
    borderRadius: 48,
    padding: 3.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarClipCircle: {
    width: 89,
    height: 89,
    borderRadius: 44.5,
    backgroundColor: '#0F172A',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 1,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  floatingCrownBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 14,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: '#FDE047',
  },
  crownEmoji: {
    fontSize: 16,
  },
  nameAreaContainer: {
    marginTop: 10,
    width: '100%',
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vipNameText: {
    color: '#FFFFFF',
    fontWeight: '900',
    textAlign: 'center',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    letterSpacing: 0.5,
  },
  tagWrap: {
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagGradientPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 8,
  },
  tagIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  tagLabelText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
