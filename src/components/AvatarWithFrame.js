import React from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getUserAvatar } from '../utils/avatarUtil';
import { normalizeCosmeticAsset, resolveFrameAsset } from '../utils/cosmeticResolver';
import SvgaView from './SvgaView';

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
export default function AvatarWithFrame({
  user,
  avatarSource,
  avatarUri,
  frame,
  size = 80,
  showOnlineDot = true,
  isOnline = true,
  style,
}) {
  const resolvedFrame = resolveFrameAsset(user, frame);
  const frameName = String(resolvedFrame?.name || resolvedFrame?.id || '').toLowerCase();
  const inventoryFrame = normalizeCosmeticAsset(
    user?.storeInventory?.find(
      (item) =>
        String(item?.name || '').toLowerCase() === frameName &&
        (item?.animationUrl || item?.imageUrl || item?.image || item?.catalogItem),
    ),
  );
  // Frame imageUrl/image is a store cover. Only animationUrl is the actual
  // overlay asset, so an opaque cover can never hide the user's avatar.
  const uploadedFrame = resolvedFrame?.animationUrl
    ? resolvedFrame
    : inventoryFrame?.animationUrl
      ? inventoryFrame
      : null;

  // Resolve user avatar strictly - never let the frame image or SVGA become the user's avatar
  const frameAssetUrl = uploadedFrame?.imageUrl || null;
  const explicitAvatar =
    avatarSource ||
    (typeof avatarUri === 'string' && avatarUri
      ? { uri: avatarUri }
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

  const hasFrame = Boolean(
    uploadedFrame?.animationUrl ||
    (resolvedFrame && frameName && frameName !== 'default' && frameName !== 'none' && frameName !== 'null')
  );

  // Render specific luxury frame ornament overlays (fallback when no asset file uploaded)
  const renderFrameDecorations = () => {
    if (!hasFrame || uploadedFrame?.animationUrl) return null;

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

  // Frame art is always laid out against the avatar's logical size, not the
  // uploaded file's pixel dimensions. `contain` in SvgaView then preserves the
  // source aspect ratio for square, wide, or tall PNG/GIF/WebP/SVGA assets.
  const requestedFrameScale = Number(
    uploadedFrame?.frameScale || uploadedFrame?.metadata?.frameScale || resolvedFrame?.frameScale || 1.42,
  );
  const frameScale = Number.isFinite(requestedFrameScale)
    ? Math.min(1.8, Math.max(1.2, requestedFrameScale))
    : 1.42;
  const frameSize = Math.round(size * frameScale);

  const getFrameColor = () => {
    if (frameName.includes('rose') || frameName.includes('sakura') || frameName.includes('pink')) return '#EC4899';
    if (frameName.includes('wing') || frameName.includes('gold') || frameName.includes('crown') || frameName.includes('king') || frameName.includes('royal')) return '#F59E0B';
    if (frameName.includes('neon') || frameName.includes('cyber') || frameName.includes('rockstar')) return '#06B6D4';
    if (frameName.includes('dragon') || frameName.includes('ruby') || frameName.includes('fire')) return '#EF4444';
    if (frameName.includes('crystal') || frameName.includes('purple')) return '#A855F7';
    return resolvedFrame?.previewColor || resolvedFrame?.borderColor || '#F59E0B';
  };

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

      {/* Luxury Circular Frame Border (Always present when user has an active frame) */}
      {hasFrame && (
        <View
          style={[
            styles.circularFrameRing,
            {
              width: size + 4,
              height: size + 4,
              borderRadius: (size + 4) / 2,
              borderColor: getFrameColor(),
              borderWidth: Math.max(2.5, Math.round(size * 0.05)),
            },
          ]}
          pointerEvents="none"
        />
      )}

      {/* Uploaded Animated SVGA or Static Frame Overlay */}
      {uploadedFrame?.animationUrl ? (
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
            source={uploadedFrame.animationUrl}
            style={StyleSheet.absoluteFillObject}
            loops={0}
            resizeMode="contain"
          />
        </View>
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
  circularFrameRing: {
    position: 'absolute',
    backgroundColor: 'transparent',
    zIndex: 9,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 4,
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
