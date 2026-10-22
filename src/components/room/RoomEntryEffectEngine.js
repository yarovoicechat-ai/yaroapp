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
    const visualUrl = animationUrl || entry.image || entrance.image || entry.imageUrl || entrance.imageUrl || '';
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
    assetX.setValue(0);
    assetScale.setValue(1);
    assetOpacity.setValue(0);
    tasselY.setValue(-24);
    tasselOpacity.setValue(0);

    // Smoothly spring banner into position from the right
    Animated.spring(bannerX, {
      toValue: 0,
      friction: 7,
      tension: 45,
      useNativeDriver: true,
    }).start();

    const assetTimer = hasVisualAsset
      ? setTimeout(() => {
          setShowAsset(true);
          Animated.timing(assetOpacity, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }).start();
        }, 80)
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
      Math.max(3500, Number(entry.duration || entrance.duration || activeEntry.duration || 5000)),
    );
    const dismissTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(bannerOpacity, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(bannerX, {
          toValue: -width,
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
  const hasAvatarTassel = Boolean(
    tassel.name || tassel.animationUrl || tassel.imageUrl || tassel.image,
  );
  const user = currentEntry.user || {};
  const colors =
    Array.isArray(entry.bannerColors) && entry.bannerColors.length >= 2
      ? entry.bannerColors
      : ['#F59E0B', '#B45309', '#78350F'];
  const animationUrl = entry.animationUrl || entrance.animationUrl || '';
  const visualUrl = animationUrl || entry.image || entrance.image || entry.imageUrl || entrance.imageUrl || '';
  const isAnimatedAsset = Boolean(animationUrl);

  return (
    <View style={styles.overlay} pointerEvents="none">
      {/* 1. Full-Screen SVGA / Vehicle / Ride Animation Layer */}
      {showAsset && visualUrl ? (
        <Animated.View
          style={[
            styles.assetStage,
            {
              opacity: assetOpacity,
            },
          ]}
          pointerEvents="none"
        >
          <SvgaView
            source={visualUrl}
            style={isAnimatedAsset ? styles.fullScreenSvga : styles.staticAssetImage}
            loops={1}
            resizeMode="contain"
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
          <View style={styles.entryAvatarWrap}>
            <AvatarWithFrame
              user={user}
              frame={user.equippedFrameAsset || user.equippedFrame || null}
              size={44}
              showOnlineDot={false}
            />
            {showTassel && hasAvatarTassel ? (
              <Animated.View
                style={[
                  styles.tasselAvatarBadge,
                  {
                    opacity: tasselOpacity,
                    borderColor: tassel.previewColor || '#F59E0B',
                    transform: [{ translateY: tasselY }],
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="ribbon"
                  size={13}
                  color={tassel.previewColor || '#F59E0B'}
                />
              </Animated.View>
            ) : null}
          </View>
          <View style={styles.bannerText}>
            <View style={styles.bannerNameRow}>
              <Text style={styles.userName} numberOfLines={1}>{user.name || 'User'}</Text>
              <Text style={{ fontSize: 13 }}>{entry.icon || '👑'}</Text>
            </View>
            <Text style={styles.tagText} numberOfLines={1}>
              {currentEntry.tagText || entry.tagText || entrance.tagText || (entry.name ? `entered with ${entry.name}` : 'has joined the room')}
            </Text>
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99999,
    elevation: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  assetStage: {
    position: 'absolute',
    top: height * 0.22,
    left: 0,
    right: 0,
    height: height * 0.52,
    zIndex: 99999,
    elevation: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  fullScreenSvga: {
    width: '100%',
    height: '100%',
  },
  staticAssetImage: {
    width: width * 0.88,
    height: height * 0.45,
  },
  banner: {
    position: 'absolute',
    top: Math.max(68, height * 0.12),
    alignSelf: 'center',
    width: width - 32,
    maxWidth: 360,
    borderRadius: 22,
    overflow: 'visible',
    zIndex: 100000,
    elevation: 10000,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  bannerGradient: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(254, 240, 138, 0.75)',
  },
  entryAvatarWrap: {
    width: 44,
    height: 44,
    marginRight: 10,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tasselAvatarBadge: {
    position: 'absolute',
    top: -4,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#111827',
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100001,
    elevation: 10001,
  },
  bannerText: {
    flex: 1,
    minWidth: 0,
  },
  bannerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '900',
    letterSpacing: 0.3,
    maxWidth: '82%',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  tagText: {
    color: '#FEF3C7',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
