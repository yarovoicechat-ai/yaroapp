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
  const translateX = useRef(new Animated.Value(width)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; pending.current = []; };
  }, []);

  useEffect(() => {
    if (!activeEntry) return;
    const id = String(activeEntry.entryId || activeEntry.id ||
      ('join:' + activeEntry.user?.userId + ':' + activeEntry.timestamp));
    if (seen.current.has(id)) return;
    seen.current.add(id);
    if (seen.current.size > 160) seen.current.delete(seen.current.values().next().value);
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
      ? Math.max(2000, Math.min(12000, Number(visual.duration || visual.metadata?.duration) || 5000))
      : 4500;
    translateX.setValue(width);
    opacity.setValue(0);
    let motion;
    if (hasAnimation) {
      motion = Animated.sequence([
        Animated.parallel([
          Animated.timing(translateX, { toValue: 0, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        ]),
        Animated.delay(duration),
        Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]);
    } else {
      opacity.setValue(1);
      motion = Animated.timing(translateX, {
        toValue: -width, duration, easing: Easing.linear, useNativeDriver: true,
      });
    }
    motion.start(({ finished }) => {
      if (!finished || !mounted.current) return;
      completion.current?.(current.entryId);
      const next = pending.current.shift();
      playing.current = Boolean(next);
      setCurrent(next || null);
    });
    return () => motion.stop();
  }, [current, opacity, translateX]);

  if (!current) return null;
  const assets = resolveEntryAssets(current);
  const visual = assets.entry || assets.entrance;
  const media = visual?.animationUrl || '';
  const settings = visual?.metadata || {};
  const user = current.user || {};
  const colors = visual?.bannerColors || visual?.bgColors;
  const bannerColors = Array.isArray(colors) && colors.length >= 2
    ? colors : ['#117C9B', '#245E78', '#17394A'];
  const nameEffect = user.nameEffect || current.vipExperience?.nameEffect;

  return (
    <View style={styles.overlay} pointerEvents="none">
      {media ? (
        <Animated.View style={[styles.mediaStage, { opacity }]}>
          <SvgaView key={current.entryId} source={media} style={StyleSheet.absoluteFillObject} loops={1} resizeMode="contain" />
        </Animated.View>
      ) : null}
      <Animated.View style={[
        styles.bannerStage, media && styles.comingStage,
        { opacity, transform: [{ translateX }] },
      ]}>
        {media && settings.showAvatar === true ? (
          <View style={styles.largeAvatar}>
            <AvatarWithFrame user={user} size={76} showOnlineDot={false} />
          </View>
        ) : null}
        <LinearGradient colors={bannerColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.banner}>
          <AvatarWithFrame user={user} size={32} showOnlineDot={false} />
          <View style={styles.copy}>
            <IdentityDisplayName name={user.name || 'User'} effect={nameEffect} fontSize={14} style={styles.name} />
            <Text style={styles.subtitle} numberOfLines={1}>
              {media ? (settings.comingText || 'is coming') : 'entered the room'}
            </Text>
          </View>
          {!media ? <Text style={styles.level}>Lv.{user.wealthLevel ?? user.level ?? 1}</Text> : null}
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 9999, elevation: 99 },
  mediaStage: { position: 'absolute', top: height * 0.17, bottom: height * 0.12, left: 0, right: 0 },
  bannerStage: { position: 'absolute', top: height * 0.55, left: 12, width: width - 24 },
  comingStage: { top: height * 0.33, left: width * 0.13, width: width * 0.74 },
  banner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 22, borderWidth: 1, borderColor: 'rgba(142,225,255,0.8)' },
  largeAvatar: { alignSelf: 'center', marginBottom: 8 },
  copy: { flex: 1, minWidth: 0, marginHorizontal: 8 },
  name: { flexShrink: 1, color: '#FFF1A8' },
  subtitle: { color: '#FFFFFF', fontSize: 11, marginTop: 1 },
  level: { color: '#FFF1A8', fontWeight: '700', fontSize: 11 },
});
