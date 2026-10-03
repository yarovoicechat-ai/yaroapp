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
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import SvgaView from '../SvgaView';
import AvatarWithFrame from '../AvatarWithFrame';

const { width, height } = Dimensions.get('window');

/**
 * Sequential Room Entry Orchestrator
 *
 * Requirements:
 * 1. If user ID has equipped Entry effect and is using it:
 *    - Step 1: Entry Effect Banner appears immediately (Pahle Entry).
 *    - Step 2: Tassel Ornament appears (Fir Tassle).
 *    - Step 3: Exactly 1 second after Tassel, Entrance Ride sweeps across the room (1 sec bad Entrance).
 * 2. Borderless avatars with active frames across the banners.
 */
export default function RoomEntryEffectEngine({
  activeEntry,
  onComplete,
}) {
  const [currentEntry, setCurrentEntry] = useState(null);
  const [showTassel, setShowTassel] = useState(false);
  const [showEntrance, setShowEntrance] = useState(false);

  // Animation values - Stage 1: Entry Banner
  const bannerTranslateX = useRef(new Animated.Value(-width)).current;
  const bannerOpacity = useRef(new Animated.Value(0)).current;
  const avatarScale = useRef(new Animated.Value(0.3)).current;
  const avatarPulse = useRef(new Animated.Value(1)).current;

  // Animation values - Stage 2: Tassel
  const tasselTranslateY = useRef(new Animated.Value(-60)).current;
  const tasselOpacity = useRef(new Animated.Value(0)).current;
  const tasselSwing = useRef(new Animated.Value(0)).current;

  // Animation values - Stage 3: Entrance (Ride / Supercar / SVGA)
  const rideTranslateX = useRef(new Animated.Value(-width * 1.4)).current;
  const rideOpacity = useRef(new Animated.Value(0)).current;

  // Track entry IDs to avoid replay loops
  const playedIdsRef = useRef(new Set());

  const playSequentialEntry = useCallback((entryData) => {
    if (!entryData || playedIdsRef.current.has(entryData.entryId)) return;
    playedIdsRef.current.add(entryData.entryId);

    if (playedIdsRef.current.size > 80) {
      const arr = Array.from(playedIdsRef.current);
      playedIdsRef.current = new Set(arr.slice(arr.length - 40));
    }

    const entryEffect = entryData.entry || entryData.effect || null;
    const tasselEffect = entryData.tassel || null;
    const entranceEffect = entryData.entrance || null;

    setCurrentEntry(entryData);
    setShowTassel(false);
    setShowEntrance(false);

    // Reset initial values
    bannerTranslateX.setValue(-width);
    bannerOpacity.setValue(0);
    avatarScale.setValue(0.3);
    avatarPulse.setValue(1);
    tasselTranslateY.setValue(-60);
    tasselOpacity.setValue(0);
    tasselSwing.setValue(0);
    rideTranslateX.setValue(-width * 1.4);
    rideOpacity.setValue(0);

    // ==========================================
    // STAGE 1 (PAHLE): ENTRY EFFECT (Immediate)
    // ==========================================
    Animated.parallel([
      Animated.spring(bannerTranslateX, {
        toValue: 0,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(bannerOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(avatarScale, {
        toValue: 1.0,
        friction: 4,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse avatar during entry
    Animated.loop(
      Animated.sequence([
        Animated.timing(avatarPulse, { toValue: 1.06, duration: 550, useNativeDriver: true }),
        Animated.timing(avatarPulse, { toValue: 1.0, duration: 550, useNativeDriver: true }),
      ])
    ).start();

    // ==========================================
    // STAGE 2 (FIR): TASSEL EFFECT (After 1.6s)
    // ==========================================
    const tasselTimer = setTimeout(() => {
      setShowTassel(true);

      Animated.parallel([
        Animated.spring(tasselTranslateY, {
          toValue: 0,
          friction: 5,
          tension: 45,
          useNativeDriver: true,
        }),
        Animated.timing(tasselOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();

      // Gentle swaying pendulum motion for the tassel
      Animated.loop(
        Animated.sequence([
          Animated.timing(tasselSwing, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(tasselSwing, { toValue: -1, duration: 1200, useNativeDriver: true }),
          Animated.timing(tasselSwing, { toValue: 0, duration: 600, useNativeDriver: true }),
        ])
      ).start();

      // =========================================================
      // STAGE 3 (1 SEC BAD): ENTRANCE RIDE (Exactly 1s after Tassel)
      // =========================================================
      const entranceTimer = setTimeout(() => {
        setShowEntrance(true);

        Animated.sequence([
          Animated.parallel([
            Animated.timing(rideOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
            Animated.spring(rideTranslateX, {
              toValue: 0,
              friction: 6,
              tension: 38,
              useNativeDriver: true,
            }),
          ]),
          Animated.delay(1600),
          Animated.parallel([
            Animated.timing(rideTranslateX, {
              toValue: width * 1.4,
              duration: 450,
              useNativeDriver: true,
            }),
            Animated.timing(rideOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
          ]),
        ]).start();
      }, 1000); // Exactly 1 second delay after tassel

      return () => clearTimeout(entranceTimer);
    }, 1600);

    // ==========================================
    // CLEANUP & DISMISSAL (After full sequence)
    // ==========================================
    const totalDuration = 5600;
    const dismissTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(bannerTranslateX, { toValue: width, duration: 350, useNativeDriver: true }),
        Animated.timing(bannerOpacity, { toValue: 0, duration: 350, useNativeDriver: true }),
        Animated.timing(tasselOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(rideOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => {
        setCurrentEntry(null);
        setShowTassel(false);
        setShowEntrance(false);
        onComplete && onComplete(entryData.entryId);
      });
    }, totalDuration);

    return () => {
      clearTimeout(tasselTimer);
      clearTimeout(dismissTimer);
    };
  }, [bannerTranslateX, bannerOpacity, avatarScale, avatarPulse, tasselTranslateY, tasselOpacity, tasselSwing, rideTranslateX, rideOpacity, onComplete]);

  useEffect(() => {
    if (activeEntry && (activeEntry.hasEntry || activeEntry.entry || activeEntry.effect)) {
      playSequentialEntry(activeEntry);
    }
  }, [activeEntry, playSequentialEntry]);

  if (!currentEntry) return null;

  const entry = currentEntry.entry || currentEntry.effect || {};
  const tassel = currentEntry.tassel || {};
  const entrance = currentEntry.entrance || {};
  const user = currentEntry.user || {};

  const colors = entry.bannerColors && Array.isArray(entry.bannerColors) && entry.bannerColors.length >= 2
    ? entry.bannerColors
    : ['#7C3AED', '#4C1D95'];

  const tagText = entry.tagText || currentEntry.tagText || '👑 VIP HAS ENTERED';

  const tasselRotate = tasselSwing.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-12deg', '0deg', '12deg'],
  });

  return (
    <View style={styles.overlayContainer} pointerEvents="none">
      {/* 1. STAGE 1: ENTRY BANNER (Top) */}
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
          {/* Avatar with Frame (Borderless Circle) */}
          <View style={styles.avatarHolder}>
            <AvatarWithFrame
              user={user}
              avatarSource={{ uri: user.avatar || 'https://api.yaroapp.in/uploads/avatars/female_default.webp' }}
              frame={user.equippedFrameAsset || user.equippedFrame || null}
              size={46}
              showOnlineDot={false}
            />
          </View>

          {/* User Name & Entry Tag */}
          <View style={styles.bannerInfo}>
            <View style={styles.bannerTitleRow}>
              <Text style={styles.bannerUserName} numberOfLines={1}>
                {user.name || 'VIP User'}
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

          {/* Right Entry Icon or Thumbnail */}
          <View style={styles.rightIconBox}>
            {entry.image || entry.imageUrl ? (
              <Image
                source={{ uri: entry.image || entry.imageUrl }}
                style={styles.entryThumb}
                resizeMode="contain"
              />
            ) : (
              <Text style={{ fontSize: 24 }}>{entry.icon || '👑'}</Text>
            )}
          </View>
        </LinearGradient>
      </Animated.View>

      {/* 2. STAGE 2: TASSEL ORNAMENT (Fir Tassel) */}
      {showTassel && (
        <Animated.View
          style={[
            styles.tasselFloatingCard,
            {
              transform: [{ translateY: tasselTranslateY }, { rotate: tasselRotate }],
              opacity: tasselOpacity,
            },
          ]}
        >
          <LinearGradient
            colors={['#1E293B', '#0F172A', '#020617']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.tasselCardGradient}
          >
            {/* Dangling Silk Tassel */}
            <View style={[styles.tasselPillBadge, { backgroundColor: tassel.previewColor || '#F59E0B' }]}>
              <MaterialCommunityIcons name="ribbon" size={18} color="#FFFFFF" />
            </View>

            <View style={styles.tasselTextWrap}>
              <Text style={styles.tasselNameText} numberOfLines={1}>
                {tassel.name || 'Imperial Silk Tassel'}
              </Text>
              <Text style={styles.tasselSubText}>
                🌸 {user.name || 'User'} activated {tassel.tag || 'Mic Tassel Ornament'}
              </Text>
            </View>

            {tassel.animationUrl ? (
              <View style={styles.tasselAssetBox}>
                <SvgaView
                  source={tassel.animationUrl}
                  style={{ width: 34, height: 34 }}
                  loops={0}
                  fallbackImage={tassel.image}
                />
              </View>
            ) : null}
          </LinearGradient>
        </Animated.View>
      )}

      {/* 3. STAGE 3: ENTRANCE RIDE (1 Sec Bad Entrance) */}
      {showEntrance && (
        <Animated.View
          style={[
            styles.rideContainer,
            {
              transform: [{ translateX: rideTranslateX }],
              opacity: rideOpacity,
            },
          ]}
        >
          {entrance.animationUrl ? (
            <SvgaView
              source={entrance.animationUrl}
              style={styles.rideAsset}
              loops={1}
              fallbackImage={entrance.image}
            />
          ) : (
            <View style={styles.rideStaticCard}>
              <Image
                source={{ uri: entrance.image || 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=400' }}
                style={styles.rideImage}
                resizeMode="contain"
              />
              <LinearGradient
                colors={['rgba(245, 158, 11, 0.9)', 'rgba(217, 119, 6, 0.9)']}
                style={styles.rideBannerPill}
              >
                <MaterialIcons name="sports-motorsports" size={16} color="#FFFFFF" />
                <Text style={styles.rideBannerText} numberOfLines={1}>
                  {entrance.name || 'Luxury Supercar Entrance'}
                </Text>
              </LinearGradient>
            </View>
          )}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: height * 0.11,
  },
  bannerWrapper: {
    width: width - 24,
    borderRadius: 24,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 10,
    marginBottom: 10,
  },
  bannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  avatarHolder: {
    marginRight: 10,
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
  rightIconBox: {
    marginLeft: 8,
  },
  entryThumb: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  tasselFloatingCard: {
    width: width - 36,
    borderRadius: 18,
    marginTop: 6,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
    alignSelf: 'center',
  },
  tasselCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.5)',
  },
  tasselPillBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  tasselTextWrap: {
    flex: 1,
  },
  tasselNameText: {
    color: '#FDE047',
    fontSize: 12,
    fontWeight: '800',
  },
  tasselSubText: {
    color: '#E2E8F0',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  tasselAssetBox: {
    marginLeft: 6,
  },
  rideContainer: {
    width: width * 0.9,
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    zIndex: 9998,
  },
  rideAsset: {
    width: '100%',
    height: '100%',
  },
  rideStaticCard: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rideImage: {
    width: width * 0.85,
    height: 140,
  },
  rideBannerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: -10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  rideBannerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
