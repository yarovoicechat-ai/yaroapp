import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import SvgaView from '../SvgaView';
import AvatarWithFrame from '../AvatarWithFrame';
import IdentityDisplayName from '../identity/IdentityDisplayName';
import { resolveEntryAssets } from '../../utils/cosmeticResolver';

const { width, height } = Dimensions.get('window');

export default function RoomEntryEffectEngine({ activeEntry, onComplete }) {
  const [current, setCurrent] = useState(null);
  const pending = useRef([]);
  const seen = useRef(new Set());
  const playing = useRef(false);
  const mounted = useRef(true);
  const completion = useRef(onComplete);
  completion.current = onComplete;

  const translateX = useRef(new Animated.Value(-width * 0.85)).current;
  const bannerOpacity = useRef(new Animated.Value(0)).current;
  const mediaOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      pending.current = [];
    };
  }, []);

  useEffect(() => {
    if (!activeEntry) return;
    const id = String(
      activeEntry.entryId ||
      activeEntry.id ||
      ('join:' + (activeEntry.user?.userId || activeEntry.userId || 'u') + ':' + (activeEntry.timestamp || Date.now()))
    );
    if (seen.current.has(id)) return;
    seen.current.add(id);
    if (seen.current.size > 200) {
      const first = seen.current.values().next().value;
      seen.current.delete(first);
    }
    pending.current.push({ ...activeEntry, entryId: id });
    if (!playing.current) {
      playing.current = true;
      setCurrent(pending.current.shift());
    }
  }, [activeEntry]);

  useEffect(() => {
    if (!current) return;
    const assets = resolveEntryAssets(current);
    const visual = assets.entry || assets.entrance;
    const hasAnimation = Boolean(visual?.animationUrl);
    const mediaDuration = hasAnimation
      ? Math.max(3000, Math.min(12000, Number(visual.duration || visual.metadata?.duration) || 5000))
      : 0;

    translateX.setValue(-width * 0.85);
    bannerOpacity.setValue(0);
    mediaOpacity.setValue(0);

    // Floating entrance: floats in, pauses for 2 seconds, then smoothly disappears
    const bannerAnimation = Animated.sequence([
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(bannerOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(2000), // 2 seconds pause
      Animated.parallel([
        Animated.timing(bannerOpacity, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: -30,
          duration: 350,
          useNativeDriver: true,
        }),
      ]),
    ]);

    let overallAnimation;
    if (hasAnimation) {
      const mediaAnim = Animated.sequence([
        Animated.timing(mediaOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.delay(Math.max(0, mediaDuration - 550)),
        Animated.timing(mediaOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]);
      overallAnimation = Animated.parallel([bannerAnimation, mediaAnim]);
    } else {
      overallAnimation = bannerAnimation;
    }

    overallAnimation.start(({ finished }) => {
      if (!finished || !mounted.current) return;
      completion.current?.(current.entryId);
      const next = pending.current.shift();
      playing.current = Boolean(next);
      setCurrent(next || null);
    });

    return () => overallAnimation.stop();
  }, [current, bannerOpacity, mediaOpacity, translateX]);

  if (!current) return null;

  const assets = resolveEntryAssets(current);
  const visual = assets.entry || assets.entrance;
  const media = visual?.animationUrl || '';
  const settings = visual?.metadata || {};
  const user = current.user || {};
  const wealthLevel = user.wealthLevel ?? user.level ?? current.wealthLevel ?? 1;
  const nameEffect = user.nameEffect || current.vipExperience?.nameEffect;
  const actionText = settings.comingText || (media ? 'is coming' : 'enter the room');

  return (
    <View style={styles.overlay} pointerEvents="none">
      {/* FULL SCREEN SVGA RIDE / ENTRANCE ANIMATION */}
      {media ? (
        <Animated.View style={[styles.mediaStage, { opacity: mediaOpacity }]} pointerEvents="none">
          <SvgaView
            key={current.entryId}
            source={media}
            style={StyleSheet.absoluteFillObject}
            loops={1}
            resizeMode="contain"
          />
        </Animated.View>
      ) : null}

      {/* FLOATING ENTRANCE BANNER PILL: [Lv.X] [👑 / Avatar] [Name] enter the room */}
      <Animated.View
        style={[
          styles.bannerContainer,
          {
            opacity: bannerOpacity,
            transform: [{ translateX }],
          },
        ]}
        pointerEvents="none"
      >
        {media && settings.showAvatar === true ? (
          <View style={styles.largeAvatar}>
            <AvatarWithFrame user={user} size={76} showOnlineDot={false} />
          </View>
        ) : null}
        <LinearGradient
          colors={['rgba(8, 70, 85, 0.92)', 'rgba(14, 95, 115, 0.88)', 'rgba(6, 45, 55, 0.92)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.bannerPill}
        >
          {/* Emerald Green Wealth Level Badge */}
          <View style={styles.wealthBadge}>
            <Text style={styles.wealthGem}>💎</Text>
            <Text style={styles.wealthText}>Lv.{wealthLevel}</Text>
          </View>

          {/* Mini Avatar in Pill */}
          <View style={styles.avatarWrap}>
            <AvatarWithFrame user={user} size={24} showOnlineDot={false} />
          </View>

          {/* User Name */}
          <IdentityDisplayName
            name={user.name || 'User'}
            effect={nameEffect}
            fontSize={13}
            style={styles.name}
            numberOfLines={1}
          />

          {/* Action text */}
          <Text style={styles.actionText} numberOfLines={1}>
            {actionText}
          </Text>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999,
    elevation: 9999,
    pointerEvents: 'none',
  },
  mediaStage: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999,
    elevation: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  largeAvatar: {
    alignSelf: 'center',
    marginBottom: 8,
  },
  bannerContainer: {
    position: 'absolute',
    top: Math.round(height * 0.535),
    left: 14,
    maxWidth: width - 28,
    alignSelf: 'flex-start',
    zIndex: 100000,
    elevation: 10000,
  },
  bannerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: 'rgba(56, 189, 248, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  wealthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(110, 231, 183, 0.6)',
    marginRight: 6,
  },
  wealthGem: {
    fontSize: 9.5,
    marginRight: 2.5,
  },
  wealthText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  avatarWrap: {
    marginRight: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  crownIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  name: {
    color: '#FFD700',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.2,
    maxWidth: width * 0.36,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  actionText: {
    color: '#E0F2FE',
    fontSize: 12.5,
    fontWeight: '600',
    marginLeft: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
