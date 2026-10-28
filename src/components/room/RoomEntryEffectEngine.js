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
import { resolveEntryAssets, resolveAssetUrl } from '../../utils/cosmeticResolver';

const { width, height } = Dimensions.get('window');

const DEFAULT_ENTRANCE_BANNER = require('../../assets/banner/default_entrance_banner.png');

export default function RoomEntryEffectEngine({ activeEntry, onComplete }) {
  const [current, setCurrent] = useState(null);
  const pending = useRef([]);
  const seen = useRef(new Set());
  const playing = useRef(false);
  const mounted = useRef(true);
  const completion = useRef(onComplete);
  const mediaFinished = useRef(() => {});
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
    for (const event of activeEntry.queuedEntries || [activeEntry]) {
      const id = String(
        event.entryId ||
        event.id ||
        ('join:' + (event.user?.userId || event.userId || 'u') + ':' + (event.timestamp || Date.now()))
      );
      if (seen.current.has(id)) continue;
      seen.current.add(id);
      if (seen.current.size > 200) {
        const first = seen.current.values().next().value;
        seen.current.delete(first);
      }
      pending.current.push({ ...event, entryId: id });
    }
    if (!playing.current && pending.current.length) {
      playing.current = true;
      setCurrent(pending.current.shift());
    }
  }, [activeEntry]);

  useEffect(() => {
    if (!current) return;
    const assets = resolveEntryAssets(current);
    const entryAsset = assets.entry;
    const isRide = Boolean(entryAsset?.animationUrl && !entryAsset.isDefault);
    const rideSvga = isRide && /\.svga(?:[?#]|$)/i.test(entryAsset.animationUrl);
    const entranceSvga = !assets.entrance?.isDefault && /\.svga(?:[?#]|$)/i.test(assets.entrance?.animationUrl || '');
    const waiting = new Set([...(rideSvga ? ['ride'] : []), ...(entranceSvga ? ['entrance'] : [])]);
    let motionDone = false;
    let completed = false;
    const duration = isRide
      ? Math.max(3000, Math.min(12000, Number(entryAsset?.duration || entryAsset?.metadata?.duration) || 5000))
      : 3000;

    const finishEntry = () => {
      if (completed || !motionDone || waiting.size || !mounted.current) return;
      completed = true;
      clearTimeout(safetyTimer);
      completion.current?.(current.entryId);
      const next = pending.current.shift();
      playing.current = Boolean(next);
      setCurrent(next || null);
    };

    // Absolute safety timeout: if native playback events drop or delay, queue is never blocked
    const safetyTimer = setTimeout(() => {
      if (completed || !mounted.current) return;
      waiting.clear();
      motionDone = true;
      finishEntry();
    }, duration + 600);

    mediaFinished.current = (id, kind) => {
      if (id !== current.entryId) return;
      waiting.delete(kind);
      finishEntry();
    };

    bulletTranslateX.setValue(width + 30);
    bulletOpacity.setValue(1);
    const entranceMotion = Animated.sequence([
      Animated.timing(bulletTranslateX, {
        toValue: 8, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(bulletOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]);
    comingTranslateX.setValue(width);
    comingOpacity.setValue(0);
    const motion = isRide ? Animated.parallel([
      entranceMotion,
      Animated.sequence([
        Animated.parallel([
          Animated.timing(comingTranslateX, {
            toValue: 0, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true,
          }),
          Animated.timing(comingOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]),
        Animated.delay(Math.max(1500, duration - 600)),
        Animated.timing(comingOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]),
    ]) : entranceMotion;

    motion.start(({ finished }) => {
      if (!finished || !mounted.current) return;
      motionDone = true;
      finishEntry();
    });

    return () => {
      completed = true;
      clearTimeout(safetyTimer);
      motion.stop();
    };
  }, [current, comingOpacity, comingTranslateX, bulletOpacity, bulletTranslateX]);

  if (!current) return null;

  const assets = resolveEntryAssets(current);
  // The ride and entrance share a join event and animate together.
  // Entry Ride: Has SVGA ride vehicle animation -> renders full screen SVGA + comingStage ("is coming")
  // Entrance: Has horizontal bullet banner -> renders fast flying bullet strip ("enter the room") with NO comingStage!
  const entryAsset = assets.entry;
  const entranceAsset = assets.entrance;
  const resolvedRideMedia = resolveAssetUrl(entryAsset?.animationUrl);
  const isRide = Boolean(resolvedRideMedia && !entryAsset.isDefault);
  const rideMedia = entryAsset?.animationUrl || resolvedRideMedia;
  const settings = entryAsset?.metadata || {};
  const user = current.user || {};
  const wealthLevel = user.wealthLevel ?? user.level ?? current.wealthLevel ?? 1;
  const nameEffect = user.nameEffect || current.vipExperience?.nameEffect;
  const colors = entryAsset?.bannerColors || entryAsset?.bgColors;
  const bannerColors = Array.isArray(colors) && colors.length >= 2
    ? colors : ['#117C9B', '#245E78', '#17394A'];

  // Check custom entrance from My Items
  const customEntrance = entranceAsset && !entranceAsset.isDefault ? entranceAsset : null;
  const resolvedEntranceImg = resolveAssetUrl(customEntrance?.imageUrl);
  const entranceBgSource = (resolvedEntranceImg && !customEntrance?.isDefault)
    ? { uri: resolvedEntranceImg }
    : DEFAULT_ENTRANCE_BANNER;
  const resolvedEntranceAnim = resolveAssetUrl(customEntrance?.animationUrl);
  const isEntranceSvga = Boolean(resolvedEntranceAnim && /\.svga(?:[?#]|$)/i.test(resolvedEntranceAnim));

  return (
    <View style={styles.overlay} pointerEvents="none">
      {/* 1. ENTRY EFFECT (RIDE): Full screen SVGA ride + comingStage ("is coming") */}
      {isRide ? (
        <>
          {rideMedia ? (
            <View style={styles.mediaStage} pointerEvents="none" collapsable={false}>
              <SvgaView
                key={current.entryId}
                source={rideMedia}
                style={{ width, height }}
                loops={1}
                autoPlay
                muteBuiltInAudio
                scaleMode="aspectFit"
                onFinish={() => mediaFinished.current(current.entryId, 'ride')}
                onError={(error) => {
                  console.warn('[RoomEntry] Ride playback failed:', error, rideMedia);
                  mediaFinished.current(current.entryId, 'ride');
                }}
              />
            </View>
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
      ) : null}
      { /* 2. ENTRANCE EFFECT: Floating bullet banner (Speed jyada, 2 sec pause, Right to Left) with NO comingStage! */ }
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
          {isEntranceSvga ? (
            <View style={styles.bulletBannerWrap}>
              <SvgaView
                key={current.entryId}
                source={entranceAsset?.animationUrl || resolvedEntranceAnim}
                style={StyleSheet.absoluteFillObject}
                loops={1}
                autoPlay
                muteBuiltInAudio
                scaleMode="fill"
                onFinish={() => mediaFinished.current(current.entryId, 'entrance')}
                onError={(error) => {
                  console.warn('[RoomEntry] Entrance playback failed:', error, customEntrance?.animationUrl);
                  mediaFinished.current(current.entryId, 'entrance');
                }}
              />
              <View style={styles.bulletInnerContent}>
                <View style={styles.wealthBadge}>
                  <Text style={styles.wealthGem}>💎</Text>
                  <Text style={styles.wealthText}>Lv.{wealthLevel}</Text>
                </View>
                <View style={styles.avatarWrap}>
                  <AvatarWithFrame user={user} size={24} showOnlineDot={false} />
                </View>
                <IdentityDisplayName
                  name={user.name || 'User'}
                  effect={nameEffect}
                  fontSize={13}
                  style={styles.bulletName}
                  numberOfLines={1}
                />
                <Text style={styles.bulletActionText} numberOfLines={1}>
                  enter the room
                </Text>
              </View>
            </View>
          ) : (
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
          )}
        </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    width,
    height,
    zIndex: 99999,
    elevation: 9999,
    pointerEvents: 'none',
  },
  // COMING STAGE (Pahle jaisa hi)
  mediaStage: {
    position: 'absolute',
    left: 0,
    top: 0,
    width,
    height,
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

  // Entrance slides in from the bullet-message side and holds for two seconds.
  bulletEntranceContainer: {
    position: 'absolute',
    top: Math.round(height * 0.535),
    left: 0,
    zIndex: 100000,
    elevation: 10000,
  },
  bulletBannerWrap: {
    height: 52,
    width: width - 16,
    maxWidth: width - 16,
    borderRadius: 26,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
  },
  bulletInnerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 32,
    zIndex: 2,
  },
  bulletBannerBg: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 32,
    height: 52,
    width: width - 16,
    maxWidth: width - 16,
  },
  bulletBannerImageStyle: {
    borderRadius: 26,
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
    width: 44,
    height: 44,
    marginRight: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bulletName: {
    color: '#FFD700',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.2,
    maxWidth: Math.round(width * 0.34),
    flexShrink: 1,
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
