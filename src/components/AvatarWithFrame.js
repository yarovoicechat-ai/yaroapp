import React, { useMemo } from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getUserAvatar, getCachedAvatarSource } from '../utils/avatarUtil';
import { normalizeCosmeticAsset, resolveFrameAsset } from '../utils/cosmeticResolver';
import SvgaView from './SvgaView';
import { getRankFrame, HOLE_CONFIG } from './ranking/RankAvatar';

/**
 * Premium Avatar Component with Animated / Decorative Frame Overlays
 *
 * Supported Frame Types / Names:
 * - 'Rose frame' / 'rose': Romantic pink border with roses and sparkle gems
 * - 'Gold Angel Wings' / 'Galaxy Wings' / 'wings': Side wings with cosmic/golden ring
 * - 'Imperial Crown' / 'Golden Crown' / 'crown': Gleaming golden ring with royal crown
 * - 'Cyber Neon Frame' / 'Neon Rockstar' / 'neon': Cyan & violet high-tech neon borders
 * - 'Ruby Dragon Frame' / 'dragon': Fiery crimson flame ring
 * - 'Purple Crystal Frame' / 'crystal': Amethyst faceted crystal ring
 * - 'Sakura Blossom Frame' / 'sakura': Cherry blossom pastel flower ring
 * - Custom object: { name, previewColor, border, waveColors }
 */
function AvatarWithFrame({
  user,
  avatarSource,
  avatarUri,
  frame,
  rank,
  size = 80,
  showOnlineDot = true,
  isOnline = true,
  style,
}) {
  const rankNum = Number(rank || (typeof frame === 'string' && /top\s*1/i.test(frame) ? 1 : typeof frame === 'string' && /top\s*2/i.test(frame) ? 2 : typeof frame === 'string' && /top\s*3/i.test(frame) ? 3 : 0));
  const rankFrameSource = getRankFrame(rankNum);
  const resolvedFrame = useMemo(() => resolveFrameAsset(user, frame), [user, frame]);
  const frameName = String(resolvedFrame?.name || resolvedFrame?.id || '').toLowerCase();

  const uploadedFrame = useMemo(() => {
    const hasResolvedOverlay = Boolean(
      resolvedFrame?.animationUrl ||
      resolvedFrame?.frameOverlayUrl ||
      resolvedFrame?.overlayUrl ||
      resolvedFrame?.frameImageUrl ||
      resolvedFrame?.transparentImageUrl ||
      resolvedFrame?.imageUrl ||
      resolvedFrame?.image,
    );
    if (hasResolvedOverlay) return resolvedFrame;

    const inventoryList = Array.isArray(user?.storeInventory)
      ? user.storeInventory
      : Array.isArray(user?.inventory)
        ? user.inventory
        : Array.isArray(user?.activeAssets)
          ? user.activeAssets
          : [];

    if (!frameName || !inventoryList.length) return null;

    const searchKey = frameName.toLowerCase();
    const found = inventoryList.find((item) => {
      const idMatch =
        String(item?._id || '').toLowerCase() === searchKey ||
        String(item?.id || '').toLowerCase() === searchKey ||
        String(item?.itemId || '').toLowerCase() === searchKey ||
        String(item?.catalogItem?._id || '').toLowerCase() === searchKey ||
        String(item?.catalogItem?.id || '').toLowerCase() === searchKey;
      const nameMatch =
        String(item?.name || '').toLowerCase() === searchKey ||
        String(item?.catalogItem?.name || '').toLowerCase() === searchKey;
      const hasMedia = Boolean(
        item?.animationUrl ||
        item?.frameOverlayUrl ||
        item?.overlayUrl ||
        item?.frameImageUrl ||
        item?.imageUrl ||
        item?.image ||
        item?.catalogItem
      );
      return (idMatch || nameMatch) && hasMedia;
    });
    return found ? normalizeCosmeticAsset(found) : null;
  }, [resolvedFrame, frameName, user?.storeInventory, user?.inventory, user?.activeAssets]);

  const frameOverlaySource =
    uploadedFrame?.frameOverlayUrl ||
    uploadedFrame?.overlayUrl ||
    uploadedFrame?.frameImageUrl ||
    uploadedFrame?.transparentImageUrl ||
    uploadedFrame?.imageUrl ||
    uploadedFrame?.image ||
    null;

  // Resolve user avatar strictly - never let the frame image or SVGA become the user's avatar
  const frameAssetUrl = uploadedFrame?.imageUrl || null;
  const explicitAvatar =
    avatarSource ||
    (typeof avatarUri === 'string' && avatarUri
      ? getCachedAvatarSource(avatarUri)
      : avatarUri);
  let avatar = explicitAvatar || getUserAvatar(user);

  if (
    avatar &&
    typeof avatar === 'object' &&
    avatar.uri &&
    (
      (frameAssetUrl && avatar.uri === frameAssetUrl) ||
      avatar.uri.toLowerCase().endsWith('.svga')
    )
  ) {
    avatar = getUserAvatar(null, user?.gender);
  }

  const isDefaultFrame = ['default', 'default frame', 'none', 'no frame', 'null'].includes(frameName.trim());
  const hasFrame = Boolean(uploadedFrame?.animationUrl || frameOverlaySource || (resolvedFrame && frameName && !isDefaultFrame));

  // Render specific luxury frame ornament overlays (fallback when no asset file uploaded)
  const renderFrameDecorations = () => {
    if (!hasFrame || uploadedFrame?.animationUrl || frameOverlaySource) return null;

    // 1. ROSE FRAME
    if (frameName.includes('rose')) {
      return (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <View style={[styles.decorBadge, { top: -4, right: -2 }]}>
            <Text style={{ fontSize: Math.max(12, size * 0.22) }}>🌸</Text>
          </View>
          <View style={[styles.decorBadge, { bottom: -2, left: -2 }]}>
            <Text style={{ fontSize: Math.max(12, size * 0.22) }}>🌹</Text>
          </View>
        </View>
      );
    }

    // 2. WINGS FRAME
    if (frameName.includes('wing')) {
      const isGold = frameName.includes('gold');
      const wingColor = isGold ? '#F59E0B' : '#A855F7';
      const wingGrad = isGold ? ['#F59E0B', '#D97706'] : ['#C084FC', '#7C3AED'];

      return (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <LinearGradient
            colors={wingGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.wingLeftShape,
              {
                width: Math.max(16, size * 0.26),
                height: Math.max(26, size * 0.46),
                left: -Math.max(10, size * 0.16),
                top: (size - Math.max(26, size * 0.46)) / 2,
              },
            ]}
          />
          <LinearGradient
            colors={wingGrad}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[
              styles.wingRightShape,
              {
                width: Math.max(16, size * 0.26),
                height: Math.max(26, size * 0.46),
                right: -Math.max(10, size * 0.16),
                top: (size - Math.max(26, size * 0.46)) / 2,
              },
            ]}
          />
        </View>
      );
    }

    // 3. CROWN FRAME
    if (frameName.includes('crown')) {
      return (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <View style={[styles.decorBadge, { top: -Math.max(14, size * 0.22), alignSelf: 'center' }]}>
            <Text style={{ fontSize: Math.max(16, size * 0.28) }}>👑</Text>
          </View>
        </View>
      );
    }

    // 4. CYBER NEON / ROCKSTAR FRAME
    if (frameName.includes('neon') || frameName.includes('rockstar')) {
      return (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <View style={[styles.decorBadge, { top: -4, right: -4 }]}>
            <MaterialCommunityIcons name="lightning-bolt" size={Math.max(14, size * 0.22)} color="#06B6D4" />
          </View>
          <View style={[styles.decorBadge, { bottom: -4, left: -4 }]}>
            <MaterialCommunityIcons name="music-note" size={Math.max(14, size * 0.22)} color="#8B5CF6" />
          </View>
        </View>
      );
    }

    // 5. DRAGON FRAME
    if (frameName.includes('dragon')) {
      return (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <View style={[styles.decorBadge, { top: -6, alignSelf: 'center' }]}>
            <Text style={{ fontSize: Math.max(15, size * 0.25) }}>🔥</Text>
          </View>
        </View>
      );
    }

    // Unknown named frames still need a visible room representation. The
    // uploaded asset will take over automatically as soon as its URL arrives.
    return (
      <View
        style={[
          styles.genericFrameRing,
          {
            width: size + 8,
            height: size + 8,
            borderRadius: (size + 8) / 2,
            borderColor: resolvedFrame?.previewColor || resolvedFrame?.borderColor || '#FBBF24',
          },
        ]}
        pointerEvents="none"
      />
    );
  };

  // Keep the user's avatar at exactly `size`; only the frame artwork grows
  // around it. Asset scale may be supplied as a ratio (1.4) or a percentage
  // (140) by the panel/API. The resulting overlay always tracks avatar size.
  const configuredFrameScale =
    uploadedFrame?.frameScale ??
    uploadedFrame?.metadata?.frameScale ??
    resolvedFrame?.frameScale ??
    resolvedFrame?.metadata?.frameScale;
  const frameScaleText = String(configuredFrameScale ?? '').trim();
  const parsedFrameScale = Number(frameScaleText.replace(/%$/, ''));
  const normalizedFrameScale = frameScaleText.endsWith('%')
    ? parsedFrameScale / 100
    : parsedFrameScale > 3 && parsedFrameScale <= 300
      ? parsedFrameScale / 100
      : parsedFrameScale;
  const frameScale = Number.isFinite(normalizedFrameScale) && normalizedFrameScale > 0
    ? Math.min(2.5, Math.max(0.6, normalizedFrameScale))
    : 1.42;
  const frameSize = Math.max(1, Math.round(size * frameScale));

  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center', overflow: 'visible' }, style]}>
      {/* Inner Avatar Image - Pure Borderless Circle */}
      <View
        style={[
          styles.avatarCircleMask,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        <Image
          source={avatar}
          defaultSource={getUserAvatar(null, user?.gender)}
          resizeMethod="resize"
          fadeDuration={0}
          style={[
            styles.avatarImage,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
          resizeMode="cover"
        />
      </View>

      {/* Rank Frame or Uploaded frame overlay */}
      {rankFrameSource ? (
        (() => {
          const cfg = HOLE_CONFIG[rankNum] || { holeRatio: 0.62, aspect: 1.0 };
          const fW = Math.round(size / cfg.holeRatio);
          const fH = Math.round(fW * cfg.aspect);
          return (
            <Image
              source={rankFrameSource}
              style={{
                position: 'absolute',
                top: Math.round((size - fH) / 2),
                left: Math.round((size - fW) / 2),
                width: fW,
                height: fH,
                zIndex: 10,
              }}
              resizeMode="contain"
              pointerEvents="none"
            />
          );
        })()
      ) : (uploadedFrame?.animationUrl || (typeof frameOverlaySource === 'string' && frameOverlaySource.toLowerCase().includes('.svga'))) ? (
        <View
          style={{
            position: 'absolute',
            top: (size - frameSize) / 2,
            left: (size - frameSize) / 2,
            width: frameSize,
            height: frameSize,
            zIndex: 10,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          pointerEvents="none"
        >
          <SvgaView
            source={uploadedFrame?.animationUrl || frameOverlaySource}
            style={StyleSheet.absoluteFillObject}
            loops={0}
            resizeMode="contain"
          />
        </View>
      ) : frameOverlaySource ? (
        <Image
          source={typeof frameOverlaySource === 'string' ? { uri: frameOverlaySource } : frameOverlaySource}
          style={{
            position: 'absolute',
            top: (size - frameSize) / 2,
            left: (size - frameSize) / 2,
            width: frameSize,
            height: frameSize,
            zIndex: 10,
          }}
          resizeMode="contain"
          pointerEvents="none"
        />
      ) : null}

      {/* Frame Decorative Ornaments (Fallback) */}
      {renderFrameDecorations()}

      {/* Online Status Dot */}
      {showOnlineDot && (
        <View
          style={[
            styles.onlineDot,
            {
              width: Math.max(10, Math.round(size * 0.16)),
              height: Math.max(10, Math.round(size * 0.16)),
              borderRadius: Math.max(5, Math.round(size * 0.08)),
              backgroundColor: isOnline ? '#10B981' : '#94A3B8',
              bottom: 0,
              right: 0,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatarCircleMask: {
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    backgroundColor: '#F1F5F9',
  },
  decorBadge: {
    position: 'absolute',
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  genericFrameRing: {
    position: 'absolute',
    borderWidth: 2.5,
    backgroundColor: 'transparent',
    zIndex: 8,
  },
  wingLeftShape: {
    position: 'absolute',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    opacity: 0.95,
    zIndex: 5,
    transform: [{ rotate: '-18deg' }],
  },
  wingRightShape: {
    position: 'absolute',
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    opacity: 0.95,
    zIndex: 5,
    transform: [{ rotate: '18deg' }],
  },
  onlineDot: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 12,
  },
});

export default React.memo(AvatarWithFrame);
