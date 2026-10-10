import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import SvgaView from '../SvgaView';
import AvatarWithFrame from '../AvatarWithFrame';
import { resolveEntryAssets } from '../../utils/cosmeticResolver';

const { width, height } = Dimensions.get('window');

export default function RoomEntryEffectEngine({ activeEntry, onComplete }) {
  const [currentEntry, setCurrentEntry] = useState(null);
  const [showAsset, setShowAsset] = useState(false);
  const [showTassel, setShowTassel] = useState(false);
  const playedIdsRef = useRef(new Set());
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const bannerX = useRef(new Animated.Value(-48)).current;
  const bannerOpacity = useRef(new Animated.Value(0)).current;
  const assetX = useRef(new Animated.Value(0)).current;
  const assetScale = useRef(new Animated.Value(1)).current;
  const assetOpacity = useRef(new Animated.Value(0)).current;
  const tasselY = useRef(new Animated.Value(-24)).current;
  const tasselOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!activeEntry) {
      return undefined;
    }
    const resolvedAssets = resolveEntryAssets(activeEntry);
    if (!resolvedAssets.entry && !resolvedAssets.entrance) return undefined;

    const entryId =
      activeEntry.entryId ||
      activeEntry.id ||
      `entry:${activeEntry.user?.userId || 'user'}:${activeEntry.timestamp || Date.now()}`;
    if (playedIdsRef.current.has(entryId)) return undefined;
    playedIdsRef.current.add(entryId);
    if (playedIdsRef.current.size > 100) {
      const first = playedIdsRef.current.values().next().value;
      playedIdsRef.current.delete(first);
    }

    const entry = resolvedAssets.entry || resolvedAssets.entrance || {};
    const entrance = resolvedAssets.entrance || {};
    const tassel = resolvedAssets.tassel || null;
    const animationUrl = entry.animationUrl || entrance.animationUrl || '';
    const imageUrl =
      entry.imageUrl ||
      entry.image ||
      entrance.imageUrl ||
      entrance.image ||
      '';
    const visualUrl = animationUrl || imageUrl;
    const isAnimatedAsset = Boolean(animationUrl);

    const hasVisualAsset = Boolean(visualUrl);
    const hasTassel = Boolean(
      tassel &&
        (tassel.name || tassel.animationUrl || tassel.imageUrl || tassel.image),
    );

    setCurrentEntry({
      ...activeEntry,
      entryId,
      hasEntry: true,
      entry,
      effect: entry,
      entrance,
      tassel,
    });
    setShowAsset(false);
    setShowTassel(false);
    bannerX.setValue(width + 20);
    bannerOpacity.setValue(1);
    assetX.setValue(isAnimatedAsset ? 0 : 40);
    assetScale.setValue(isAnimatedAsset ? 1 : 0.7);
    assetOpacity.setValue(0);
    tasselY.setValue(-24);
    tasselOpacity.setValue(0);

    Animated.timing(bannerX, {
      toValue: -width - 250,
      duration: 5500,
      useNativeDriver: true,
    }).start();

    const assetTimer = hasVisualAsset
      ? setTimeout(() => {
          setShowAsset(true);
          Animated.parallel([
            Animated.timing(assetX, {
              toValue: 0,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(assetScale, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(assetOpacity, {
              toValue: 1,
              duration: 450,
              useNativeDriver: true,
            }),
          ]).start();
        }, 100)
      : null;

    const tasselTimer = hasTassel
      ? setTimeout(() => {
          setShowTassel(true);
          Animated.parallel([
            Animated.timing(tasselY, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(tasselOpacity, {
              toValue: 1,
              duration: 450,
              useNativeDriver: true,
            }),
          ]).start();
        }, 850)
      : null;

    const duration = Math.min(
      12000,
      Math.max(2800, Number(entry.duration || entrance.duration || activeEntry.duration || 4500)),
    );
    const dismissTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(bannerOpacity, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(assetOpacity, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(tasselOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentEntry(null);
        setShowAsset(false);
        setShowTassel(false);
        onCompleteRef.current?.(entryId);
      });
    }, duration);

    return () => {
      if (assetTimer) clearTimeout(assetTimer);
      if (tasselTimer) clearTimeout(tasselTimer);
      clearTimeout(dismissTimer);
      bannerX.stopAnimation();
      bannerOpacity.stopAnimation();
      assetX.stopAnimation();
      assetScale.stopAnimation();
      assetOpacity.stopAnimation();
      tasselY.stopAnimation();
      tasselOpacity.stopAnimation();
    };
  }, [
    activeEntry,
    assetOpacity,
    assetScale,
    assetX,
    bannerOpacity,
    bannerX,
    tasselOpacity,
    tasselY,
  ]);

  if (!currentEntry) return null;

  const resolvedAssets = resolveEntryAssets(currentEntry);
  const entry = resolvedAssets.entry || resolvedAssets.entrance || {};
  const entrance = resolvedAssets.entrance || {};
  const tassel = resolvedAssets.tassel || {};
  const user = currentEntry.user || {};
  const colors =
    Array.isArray(entry.bannerColors) && entry.bannerColors.length >= 2
      ? entry.bannerColors
      : ['#7C3AED', '#4C1D95'];
  const animationUrl = entry.animationUrl || entrance.animationUrl || '';
  const imageUrl =
    entry.imageUrl ||
    entry.image ||
    entrance.imageUrl ||
    entrance.image ||
    '';
  const visualUrl = animationUrl || imageUrl;
  const isAnimatedAsset = Boolean(animationUrl);

  return (
    <View style={styles.overlay} pointerEvents="none">
      {/* 1. Full-Screen Edge-to-Edge SVGA / Vehicle / Ride Animation Layer */}
      {showAsset && visualUrl ? (
        <Animated.View
          style={[
            styles.assetStage,
            {
              opacity: assetOpacity,
              transform: isAnimatedAsset ? [] : [{ translateX: assetX }, { scale: assetScale }],
            },
          ]}
          pointerEvents="none"
        >
          <SvgaView
            source={visualUrl}
            style={isAnimatedAsset ? styles.fullScreenSvga : styles.staticAssetImage}
            loops={1}
            resizeMode="contain"
            fallbackImage={imageUrl || undefined}
          />
        </Animated.View>
      ) : null}

      {/* 2. Floating Top Banner (User Avatar + Frame + Name + Tag Text) */}
      <Animated.View
        style={[
          styles.banner,
          { opacity: bannerOpacity, transform: [{ translateX: bannerX }] },
        ]}
        pointerEvents="none"
      >
        <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.bannerGradient}>
          <AvatarWithFrame
            user={user}
            frame={user.equippedFrameAsset || user.equippedFrame || null}
            size={46}
            showOnlineDot={false}
          />
          <View style={styles.bannerText}>
            <Text style={styles.userName} numberOfLines={1}>{user.name || 'User'}</Text>
            <Text style={styles.tagText} numberOfLines={1}>
              {entry.tagText || currentEntry.tagText || entry.name || 'Entered the room'}
            </Text>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* 3. Floating Tassel Badge (If equipped) */}
      {showTassel ? (
        <Animated.View
          style={[
            styles.tasselCard,
            { opacity: tasselOpacity, transform: [{ translateY: tasselY }] },
          ]}
          pointerEvents="none"
        >
          <MaterialCommunityIcons
            name="ribbon"
            size={18}
            color={tassel.previewColor || '#F59E0B'}
          />
          <Text style={styles.tasselText} numberOfLines={1}>{tassel.name}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    zIndex: 9999,
    elevation: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assetStage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    zIndex: 9998,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreenSvga: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  staticAssetImage: {
    width: '100%',
    height: '100%',
  },
  banner: {
    position: 'absolute',
    top: 310,
    left: 0,
    borderRadius: 22,
    overflow: 'hidden',
    zIndex: 10000,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  bannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  bannerText: { flex: 1, marginLeft: 10 },
  userName: { color: '#FFF', fontSize: 14.5, fontWeight: '900', letterSpacing: 0.3 },
  tagText: { color: '#FEF3C7', fontSize: 11, fontWeight: '700', marginTop: 2, letterSpacing: 0.2 },
  tasselCard: {
    position: 'absolute',
    top: height * 0.08 + 64,
    maxWidth: width - 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(15,23,42,0.94)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.5)',
    zIndex: 10000,
    elevation: 20,
  },
  tasselText: { color: '#FDE68A', fontSize: 11, fontWeight: '700', maxWidth: width - 100 },
});
