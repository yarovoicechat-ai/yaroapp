import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  ImageBackground,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import SvgaView from '../SvgaView';
import AvatarWithFrame from '../AvatarWithFrame';
import IdentityDisplayName from '../identity/IdentityDisplayName';
import { resolveEntryAssets } from '../../utils/cosmeticResolver';

const { width, height } = Dimensions.get('window');

const DEFAULT_ENTRANCE_BANNER = require('../../assets/banner/default_entrance_banner.png');

export default function RoomEntryEffectEngine({ activeEntry, onComplete }) {
  const [current, setCurrent] = useState(null);
  const pending = useRef([]);
  const seen = useRef(new Set());
  const playing = useRef(false);
  const mounted = useRef(true);
  const completion = useRef(onComplete);
  completion.current = onComplete;

  // Coming Ride animation values (Full SVGA Ride / Coming Stage)
  const comingTranslateX = useRef(new Animated.Value(width)).current;
  const comingOpacity = useRef(new Animated.Value(0)).current;

  // Bullet Entrance banner values (RIGHT to LEFT fast motion)
  const bulletTranslateX = useRef(new Animated.Value(width + 30)).current;
  const bulletOpacity = useRef(new Animated.Value(0)).current;

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
    const duration = hasAnimation
      ? Math.max(3000, Math.min(12000, Number(visual.duration || visual.metadata?.duration) || 5000))
      : 3000;

    let motion;
    if (hasAnimation) {
      // COMING WALA: Pahle jaisa hi rahega (full SVGA ride, comingStage with large avatar)
      comingTranslateX.setValue(width);
      comingOpacity.setValue(0);
      motion = Animated.sequence([
        Animated.parallel([
          Animated.timing(comingTranslateX, {
            toValue: 0,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(comingOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(Math.max(1500, duration - 600)),
        Animated.timing(comingOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]);
    } else {
      // ENTRANCE: Right se Left jayega jaise bullet message jata hai lekin speed jyada hai
      // Fast in from right (width + 30 -> 14) in 380ms -> 2 seconds pause -> fast out to left (-width - 80) in 380ms
      bulletTranslateX.setValue(width + 30);
      bulletOpacity.setValue(1);
      motion = Animated.sequence([
        Animated.timing(bulletTranslateX, {
          toValue: 14,
          duration: 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(2000), // 2 SEC RUKTA HAI
        Animated.timing(bulletTranslateX, {
          toValue: -width - 80,
          duration: 380,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]);
    }

    motion.start(({ finished }) => {
      if (!finished || !mounted.current) return;
      completion.current?.(current.entryId);
      const next = pending.current.shift();
      playing.current = Boolean(next);
      setCurrent(next || null);
    });

    return () => motion.stop();
  }, [current, comingOpacity, comingTranslateX, bulletOpacity, bulletTranslateX]);

  if (!current) return null;

  const assets = resolveEntryAssets(current);
  const visual = assets.entry || assets.entrance;
  const hasAnimation = Boolean(visual?.animationUrl);
  const media = visual?.animationUrl || '';
  const settings = visual?.metadata || {};
  const user = current.user || {};
  const wealthLevel = user.wealthLevel ?? user.level ?? current.wealthLevel ?? 1;
  const nameEffect = user.nameEffect || current.vipExperience?.nameEffect;
  const colors = visual?.bannerColors || visual?.bgColors;
  const bannerColors = Array.isArray(colors) && colors.length >= 2
    ? colors : ['#117C9B', '#245E78', '#17394A'];

  // Check custom entrance from My Items
  const customEntrance = assets.entrance && !assets.entrance.isDefault ? assets.entrance : null;
  const entranceBgSource = (customEntrance?.imageUrl && !customEntrance.isDefault)
    ? { uri: customEntrance.imageUrl }
    : DEFAULT_ENTRANCE_BANNER;

  return (
    <View style={styles.overlay} pointerEvents="none">
      {/* 1. COMING WALA: Pahle jaisa hi rahega (full screen SVGA + comingStage with large avatar) */}
      {hasAnimation ? (
        <>
          {media ? (
            <Animated.View style={[styles.mediaStage, { opacity: comingOpacity }]} pointerEvents="none">
              <SvgaView
                key={current.entryId}
                source={media}
                style={StyleSheet.absoluteFillObject}
                loops={1}
                resizeMode="contain"
              />
            </Animated.View>
          ) : null}
          <Animated.View
            style={[
              styles.comingStage,
              { opacity: comingOpacity, transform: [{ translateX: comingTranslateX }] },
            ]}
            pointerEvents="none"
          >
            {settings.showAvatar === true ? (
              <View style={styles.largeAvatar}>
                <AvatarWithFrame user={user} size={76} showOnlineDot={false} />
              </View>
            ) : null}
            <LinearGradient
              colors={bannerColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.comingBanner}
            >
              <AvatarWithFrame user={user} size={32} showOnlineDot={false} />
              <View style={styles.copy}>
                <IdentityDisplayName
                  name={user.name || 'User'}
                  effect={nameEffect}
                  fontSize={14}
                  style={styles.comingName}
                />
                <Text style={styles.comingSubtitle} numberOfLines={1}>
                  {settings.comingText || 'is coming'}
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>
        </>
      ) : (
        /* 2. ENTRANCE: Right se Left bullet message (speed jyada, 2 sec pause, default/custom banner) */
        <Animated.View
          style={[
            styles.bulletEntranceContainer,
            {
              opacity: bulletOpacity,
              transform: [{ translateX: bulletTranslateX }],
            },
          ]}
          pointerEvents="none"
        >
          <ImageBackground
            source={entranceBgSource}
            style={styles.bulletBannerBg}
            imageStyle={styles.bulletBannerImageStyle}
            resizeMode="stretch"
          >
            {/* Wealth Level Pill on the Left */}
            <View style={styles.wealthBadge}>
              <Text style={styles.wealthGem}>💎</Text>
              <Text style={styles.wealthText}>Lv.{wealthLevel}</Text>
            </View>

            {/* Avatar with Frame */}
            <View style={styles.avatarWrap}>
              <AvatarWithFrame user={user} size={24} showOnlineDot={false} />
            </View>

            {/* User Name in Radiant Gold */}
            <IdentityDisplayName
              name={user.name || 'User'}
              effect={nameEffect}
              fontSize={13}
              style={styles.bulletName}
              numberOfLines={1}
            />

            {/* Entrance text: enter the room */}
            <Text style={styles.bulletActionText} numberOfLines={1}>
              enter the room
            </Text>
          </ImageBackground>
        </Animated.View>
      )}
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
  // COMING STAGE (Pahle jaisa hi)
  mediaStage: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999,
    elevation: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  comingStage: {
    position: 'absolute',
    top: Math.round(height * 0.33),
    left: Math.round(width * 0.13),
    width: Math.round(width * 0.74),
    zIndex: 100000,
    elevation: 10000,
  },
  largeAvatar: {
    alignSelf: 'center',
    marginBottom: 8,
  },
  comingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: '#F59E0B',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 8,
  },
  comingName: {
    flexShrink: 1,
    color: '#FFD700',
    fontWeight: '900',
    fontSize: 14.5,
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  comingSubtitle: {
    color: '#FEF08A',
    fontSize: 11.5,
    marginTop: 1.5,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // BULLET ENTRANCE BANNER (Right to Left bullet message, speed jyada, 2s pause)
  bulletEntranceContainer: {
    position: 'absolute',
    top: Math.round(height * 0.535),
    left: 0,
    zIndex: 100000,
    elevation: 10000,
  },
  bulletBannerBg: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 32,
    height: 40,
    minWidth: 260,
    maxWidth: Math.round(width * 0.92),
  },
  bulletBannerImageStyle: {
    borderRadius: 20,
  },
  wealthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(110, 231, 183, 0.7)',
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
  bulletName: {
    color: '#FFD700',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.2,
    maxWidth: Math.round(width * 0.34),
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  bulletActionText: {
    color: '#E0F2FE',
    fontSize: 12.5,
    fontWeight: '700',
    marginLeft: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
