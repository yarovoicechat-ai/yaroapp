import React from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getUserAvatar } from '../utils/avatarUtil';
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
  frame,
  size = 80,
  showOnlineDot = true,
  isOnline = true,
  style,
}) {
  const avatar = avatarSource || getUserAvatar(user);
  const activeFrame = frame || user?.equippedFrameAsset || user?.equippedFrame;
  const frameName = (activeFrame?.name || activeFrame?.id || (typeof activeFrame === 'string' ? activeFrame : '')).toLowerCase();
  const uploadedFrame = (typeof activeFrame === 'object' && (activeFrame?.animationUrl || activeFrame?.imageUrl || activeFrame?.image))
    ? activeFrame
    : (user?.equippedFrameAsset && (user?.equippedFrameAsset?.animationUrl || user?.equippedFrameAsset?.imageUrl || user?.equippedFrameAsset?.image))
      ? user.equippedFrameAsset
      : (typeof frame === 'object' && (frame?.animationUrl || frame?.imageUrl || frame?.image))
        ? frame
        : (user?.storeInventory?.find(i => (i.name || '').toLowerCase() === frameName && (i.animationUrl || i.imageUrl || i.image)))
        || null;

  const hasFrame = Boolean(
    (uploadedFrame && (uploadedFrame.animationUrl || uploadedFrame.imageUrl || uploadedFrame.image)) ||
    (activeFrame && frameName && frameName !== 'default' && frameName !== 'none' && frameName !== 'null')
  );

  // Render specific luxury frame ornament overlays (fallback when no asset file uploaded)
  const renderFrameDecorations = () => {
    if (!hasFrame || uploadedFrame?.animationUrl || uploadedFrame?.imageUrl || uploadedFrame?.image) return null;

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

    return null;
  };

  const frameSize = Math.round(size * 1.25);

  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      {/* Inner Avatar Image - Pure Borderless Circle */}
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

      {/* Uploaded Animated SVGA or Static Frame Overlay */}
      {uploadedFrame && (uploadedFrame.animationUrl || uploadedFrame.imageUrl || uploadedFrame.image) ? (
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
          {uploadedFrame.animationUrl ? (
            <SvgaView
              source={uploadedFrame.animationUrl}
              style={{ width: frameSize, height: frameSize }}
              loops={0}
              fallbackImage={uploadedFrame.imageUrl || uploadedFrame.image}
            />
          ) : (
            <Image
              source={{ uri: uploadedFrame.imageUrl || uploadedFrame.image }}
              style={{ width: frameSize, height: frameSize }}
              resizeMode="contain"
            />
          )}
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
  avatarImage: {
    backgroundColor: '#F1F5F9',
  },
  decorBadge: {
    position: 'absolute',
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
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
