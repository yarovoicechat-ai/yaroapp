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
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SvgaPlayer } from '@dasimems/react-native-svga';

const { width, height } = Dimensions.get('window');

export default function RoomEntryEffectEngine({
  activeEntry,
  onComplete,
}) {
  const [currentEntry, setCurrentEntry] = useState(null);

  // Animation values
  const bannerTranslateX = useRef(new Animated.Value(-width)).current;
  const bannerOpacity = useRef(new Animated.Value(0)).current;
  const avatarScale = useRef(new Animated.Value(0.3)).current;
  const avatarPulse = useRef(new Animated.Value(1)).current;
  const particleTranslateY = useRef(new Animated.Value(40)).current;
  const particleOpacity = useRef(new Animated.Value(0)).current;
  const rideTranslateX = useRef(new Animated.Value(-width * 1.3)).current;
  const rideOpacity = useRef(new Animated.Value(0)).current;

  // Track entry IDs to avoid replay
  const playedIdsRef = useRef(new Set());

  const playEntryAnimation = useCallback((entry) => {
    if (!entry || playedIdsRef.current.has(entry.entryId)) return;
    playedIdsRef.current.add(entry.entryId);

    // Limit set size to avoid memory bloat
    if (playedIdsRef.current.size > 100) {
      const arr = Array.from(playedIdsRef.current);
      playedIdsRef.current = new Set(arr.slice(arr.length - 50));
    }

    setCurrentEntry(entry);

    const animType = (entry.effect?.animationType || 'BANNER').toUpperCase();
    const duration = entry.effect?.duration || 3000;

    // Reset values
    bannerTranslateX.setValue(-width);
    bannerOpacity.setValue(0);
    avatarScale.setValue(0.3);
    avatarPulse.setValue(1);
    particleTranslateY.setValue(40);
    particleOpacity.setValue(0);
    rideTranslateX.setValue(-width * 1.3);
    rideOpacity.setValue(0);

    const hasRide = Boolean(entry.effect?.animationUrl || entry.effect?.image || entry.effect?.imageUrl);
    if (hasRide) {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(rideOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.spring(rideTranslateX, { toValue: 0, friction: 6, tension: 40, useNativeDriver: true }),
        ]),
        Animated.delay(Math.max(1000, duration - 1500)),
        Animated.parallel([
          Animated.timing(rideTranslateX, { toValue: width * 1.3, duration: 450, useNativeDriver: true }),
          Animated.timing(rideOpacity, { toValue: 0, duration: 450, useNativeDriver: true }),
        ]),
      ]).start();
    }

    if (animType === 'CENTER_AVATAR' || animType === 'VIP_ENTRANCE') {
      // Scale up center avatar + glowing pulse + slide in banner
      Animated.sequence([
        Animated.parallel([
          Animated.spring(avatarScale, {
            toValue: 1.1,
            friction: 4,
            tension: 60,
            useNativeDriver: true,
          }),
          Animated.timing(bannerOpacity, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.spring(bannerTranslateX, {
            toValue: 0,
            friction: 6,
            useNativeDriver: true,
          }),
        ]),
        Animated.spring(avatarScale, {
          toValue: 1.0,
          friction: 3,
          useNativeDriver: true,
        }),
      ]).start();

      // Continuous subtle pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(avatarPulse, { toValue: 1.08, duration: 600, useNativeDriver: true }),
          Animated.timing(avatarPulse, { toValue: 1.0, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      // BANNER, PARTICLES, SPECIAL_EVENT
      Animated.parallel([
        Animated.spring(bannerTranslateX, {
          toValue: 0,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(bannerOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(particleOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(particleTranslateY, {
          toValue: -20,
          duration: duration - 400,
          useNativeDriver: true,
        }),
      ]).start();
    }

    // Auto dismiss after duration
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(bannerTranslateX, {
          toValue: width,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(bannerOpacity, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(avatarScale, {
          toValue: 0.2,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(rideOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentEntry(null);
        onComplete && onComplete(entry.entryId);
      });
    }, duration);

    return () => clearTimeout(timer);
  }, [bannerTranslateX, bannerOpacity, avatarScale, avatarPulse, particleTranslateY, particleOpacity, rideTranslateX, rideOpacity, onComplete]);

  useEffect(() => {
    if (activeEntry && activeEntry.effect) {
      playEntryAnimation(activeEntry);
    }
  }, [activeEntry, playEntryAnimation]);

  if (!currentEntry || !currentEntry.effect) return null;

  const effect = currentEntry.effect;
  const user = currentEntry.user || {};
  const tagText = currentEntry.tagText || effect.tagText || 'VIP ENTRY';
  const colors = effect.bannerColors && effect.bannerColors.length >= 2
    ? effect.bannerColors
    : ['#F59E0B', '#B45309'];
  const animType = (effect.animationType || 'BANNER').toUpperCase();

  return (
    <View style={styles.overlayContainer} pointerEvents="none">
      {/* 0. Flying Ride Animation / SVGA / Image (Supercar, Dragon, Spaceship, etc.) */}
      {(effect.animationUrl || effect.image || effect.imageUrl) ? (
        <Animated.View
          style={[
            styles.rideContainer,
            {
              transform: [{ translateX: rideTranslateX }],
              opacity: rideOpacity,
            },
          ]}
        >
          {effect.animationUrl && /\.svga(?:\?|$)/i.test(effect.animationUrl) ? (
            <SvgaPlayer source={effect.animationUrl} style={styles.svgaRide} loops={1} />
          ) : (
            <Image
              source={{ uri: effect.animationUrl || effect.image || effect.imageUrl }}
              style={styles.imageRide}
              resizeMode="contain"
            />
          )}
        </Animated.View>
      ) : null}

      {/* 1. Center Avatar Reveal for CENTER_AVATAR & VIP_ENTRANCE */}
      {(animType === 'CENTER_AVATAR' || animType === 'VIP_ENTRANCE') && (
        <Animated.View
          style={[
            styles.centerAvatarBox,
            {
              transform: [{ scale: Animated.multiply(avatarScale, avatarPulse) }],
              opacity: bannerOpacity,
            },
          ]}
        >
          {/* Outer Glowing Ring */}
          <LinearGradient
            colors={colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarGlowRing}
          >
            <Image
              source={{
                uri: user.avatar || 'https://api.yaroapp.in/uploads/avatars/female_default.webp',
              }}
              style={styles.centerAvatarImg}
            />
          </LinearGradient>

          {/* Floating Crown/Icon on top */}
          <View style={styles.centerAvatarBadge}>
            <Text style={{ fontSize: 16 }}>{effect.icon || '👑'}</Text>
          </View>
        </Animated.View>
      )}

      {/* 2. Floating Star Particles for PARTICLES */}
      {animType === 'PARTICLES' && (
        <Animated.View
          style={[
            styles.particlesOverlay,
            {
              opacity: particleOpacity,
              transform: [{ translateY: particleTranslateY }],
            },
          ]}
        >
          <Text style={[styles.particleStar, { left: width * 0.2, top: 40 }]}>✨</Text>
          <Text style={[styles.particleStar, { left: width * 0.5, top: 20 }]}>⭐</Text>
          <Text style={[styles.particleStar, { left: width * 0.8, top: 50 }]}>✨</Text>
          <Text style={[styles.particleStar, { left: width * 0.35, top: 70 }]}>💎</Text>
        </Animated.View>
      )}

      {/* 3. Sliding Banner (Shown for all types, positioned near top of room) */}
      <Animated.View
        style={[
          styles.bannerWrapper,
          {
            transform: [{ translateX: bannerTranslateX }],
            opacity: bannerOpacity,
          },
        ]}
      >
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.bannerGradient}
        >
          {/* User Avatar with Mini Badge */}
          <View style={styles.bannerAvatarBox}>
            <Image
              source={{
                uri: user.avatar || 'https://api.yaroapp.in/uploads/avatars/female_default.webp',
              }}
              style={styles.bannerAvatar}
            />
            <View style={styles.miniIconBadge}>
              <Text style={{ fontSize: 9 }}>{effect.icon || '👑'}</Text>
            </View>
          </View>

          {/* User Name & Entry Tag */}
          <View style={styles.bannerInfo}>
            <View style={styles.bannerTitleRow}>
              <Text style={styles.bannerUserName} numberOfLines={1}>
                {user.name || 'User'}
              </Text>
              <View style={styles.levelTag}>
                <Text style={styles.levelTagText}>Lv.{user.level || 1}</Text>
              </View>
            </View>

            <View style={styles.tagBadge}>
              <Text style={styles.tagText} numberOfLines={1}>
                {tagText}
              </Text>
            </View>
          </View>

          {/* Right Effect Icon or Preview Thumbnail */}
          <View style={styles.effectIconWrap}>
            {effect.image || effect.imageUrl ? (
              <Image
                source={{ uri: effect.image || effect.imageUrl }}
                style={styles.bannerEffectThumb}
                resizeMode="contain"
              />
            ) : (
              <Text style={{ fontSize: 24 }}>{effect.icon || '⚡'}</Text>
            )}
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: height * 0.12,
  },
  bannerWrapper: {
    width: width - 24,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  bannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  bannerAvatarBox: {
    position: 'relative',
    marginRight: 10,
  },
  bannerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#1E293B',
  },
  miniIconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 1.5,
    borderWidth: 1,
    borderColor: '#FACC15',
  },
  bannerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  bannerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bannerUserName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    maxWidth: 160,
  },
  levelTag: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 0.8,
    borderColor: '#FDE047',
  },
  levelTagText: {
    color: '#FDE047',
    fontSize: 9,
    fontWeight: '800',
  },
  tagBadge: {
    marginTop: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  tagText: {
    color: '#FFFBEB',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  effectIconWrap: {
    marginLeft: 8,
  },
  centerAvatarBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  avatarGlowRing: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 14,
    elevation: 12,
  },
  centerAvatarImg: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    backgroundColor: '#0F172A',
  },
  centerAvatarBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 3,
    borderWidth: 1.5,
    borderColor: '#FACC15',
  },
  particlesOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  particleStar: {
    position: 'absolute',
    fontSize: 20,
  },
  rideContainer: {
    width: width * 0.85,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    zIndex: 9998,
  },
  svgaRide: {
    width: '100%',
    height: '100%',
  },
  imageRide: {
    width: '100%',
    height: '100%',
  },
  bannerEffectThumb: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
});
