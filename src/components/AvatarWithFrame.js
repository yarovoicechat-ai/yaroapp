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
  const activeFrame = frame || user?.equippedFrame;
  const frameName = (activeFrame?.name || activeFrame?.id || (typeof activeFrame === 'string' ? activeFrame : '')).toLowerCase();
  const uploadedFrame = (typeof activeFrame === 'object' && activeFrame)
    ? activeFrame
    : (user?.equippedFrameAsset && (user?.equippedFrameAsset?.name || '').toLowerCase() === frameName)
      ? user.equippedFrameAsset
      : (user?.storeInventory?.find(i => (i.name || '').toLowerCase() === frameName))
      || null;

  const hasFrame = Boolean(activeFrame && frameName !== 'default' && frameName !== 'none');

  // Ring dimensions proportional to avatar size
  const ringPadding = Math.max(3, Math.round(size * 0.05));
  const innerAvatarSize = size - ringPadding * 2;
  const borderRadius = size / 2;

  // Render specific luxury frame ornament overlays
  const renderFrameDecorations = () => {
    if (!hasFrame || uploadedFrame?.animationUrl || uploadedFrame?.imageUrl || uploadedFrame?.image) return null;

    // 1. ROSE FRAME (Pink Roses & Sparkle Accents)
    if (frameName.includes('rose')) {
      return (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          {/* Top-Right Blooming Flower */}
          <View style={[styles.decorBadge, { top: -6, right: -4 }]}>
            <Text style={{ fontSize: Math.max(12, size * 0.22) }}>🌸</Text>
          </View>
          {/* Bottom-Left Rose */}
          <View style={[styles.decorBadge, { bottom: -4, left: -4 }]}>
            <Text style={{ fontSize: Math.max(12, size * 0.22) }}>🌹</Text>
          </View>
          {/* Top-Left Sparkle */}
          <View style={[styles.decorBadge, { top: -2, left: -2 }]}>
            <Text style={{ fontSize: Math.max(9, size * 0.16) }}>✨</Text>
          </View>
          {/* Bottom-Right Gem */}
          <View style={[styles.decorBadge, { bottom: -2, right: -2 }]}>
            <Text style={{ fontSize: Math.max(9, size * 0.16) }}>💎</Text>
          </View>
        </View>
      );
    }

    // 2. WINGS FRAME (Gold Angel Wings / Galaxy Wings)
    if (frameName.includes('wing')) {
      const isGold = frameName.includes('gold');
      const wingColor = isGold ? '#F59E0B' : '#A855F7';
      const wingGrad = isGold ? ['#F59E0B', '#D97706'] : ['#C084FC', '#7C3AED'];

      return (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          {/* Left Wing */}
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
          {/* Right Wing */}
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
          {/* Top Halo / Star */}
          <View style={[styles.decorBadge, { top: -8, alignSelf: 'center' }]}>
            <MaterialCommunityIcons name="star-four-points" size={Math.max(14, size * 0.24)} color={wingColor} />
          </View>
        </View>
      );
    }

    // 3. CROWN FRAME (Golden Crown / Imperial Crown)
    if (frameName.includes('crown')) {
      return (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <View style={[styles.decorBadge, { top: -Math.max(14, size * 0.22), alignSelf: 'center' }]}>
            <Text style={{ fontSize: Math.max(16, size * 0.28) }}>👑</Text>
          </View>
          <View style={[styles.decorBadge, { bottom: -2, alignSelf: 'center' }]}>
            <MaterialCommunityIcons name="shield-star" size={Math.max(12, size * 0.18)} color="#F59E0B" />
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
          <View style={[styles.decorBadge, { bottom: -2, right: -2 }]}>
            <MaterialCommunityIcons name="fire" size={Math.max(13, size * 0.2)} color="#EF4444" />
          </View>
        </View>
      );
    }

    // 6. SAKURA BLOSSOM
    if (frameName.includes('sakura') || frameName.includes('blossom')) {
      return (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <View style={[styles.decorBadge, { top: -5, right: -3 }]}>
            <Text style={{ fontSize: Math.max(12, size * 0.2) }}>🌸</Text>
          </View>
          <View style={[styles.decorBadge, { bottom: -5, left: -3 }]}>
            <Text style={{ fontSize: Math.max(12, size * 0.2) }}>🌺</Text>
          </View>
        </View>
      );
    }

    // 7. CRYSTAL FRAME
    if (frameName.includes('crystal')) {
      return (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <View style={[styles.decorBadge, { top: -4, alignSelf: 'center' }]}>
            <MaterialCommunityIcons name="diamond-stone" size={Math.max(14, size * 0.22)} color="#A78BFA" />
          </View>
        </View>
      );
    }

    // DEFAULT FRAME EMBLEM
    return (
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <View style={[styles.decorBadge, { top: -5, right: -3 }]}>
          <Text style={{ fontSize: Math.max(10, size * 0.18) }}>✨</Text>
        </View>
      </View>
    );
  };

  // Get frame border colors
  const getGradientColors = () => {
    if (!hasFrame) {
      return ['#FFFFFF', '#FFFFFF'];
    }

    if (frameName.includes('rose')) {
      return ['#F43F5E', '#FDA4AF', '#E11D48', '#FB7185'];
    }
    if (frameName.includes('gold') || frameName.includes('crown')) {
      return ['#F59E0B', '#FDE68A', '#D97706', '#FEF3C7'];
    }
    if (frameName.includes('wing') || frameName.includes('galaxy')) {
      return ['#8B5CF6', '#C084FC', '#6366F1', '#E9D5FF'];
    }
    if (frameName.includes('neon') || frameName.includes('rockstar')) {
      return ['#06B6D4', '#3B82F6', '#8B5CF6', '#67E8F9'];
    }
    if (frameName.includes('dragon')) {
      return ['#EF4444', '#F97316', '#DC2626', '#FCD34D'];
    }
    if (frameName.includes('sakura')) {
      return ['#EC4899', '#FBCFE8', '#DB2777', '#F472B6'];
    }
    if (frameName.includes('crystal')) {
      return ['#8B5CF6', '#DDD6FE', '#7C3AED', '#A78BFA'];
    }

    // Fallback to activeFrame previewColor
    if (activeFrame?.previewColor) {
      return [activeFrame.previewColor, '#FFFFFF', activeFrame.previewColor];
    }
    return ['#7C3AED', '#A78BFA', '#6D28D9'];
  };

  return (
    <View style={[{ width: size, height: size }, style]}>
      {/* Outer Border / Luxury Frame Ring */}
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.outerRing,
          {
            width: size,
            height: size,
            borderRadius: borderRadius,
            padding: ringPadding,
            shadowColor: hasFrame ? getGradientColors()[0] : '#000',
            shadowOpacity: hasFrame ? 0.35 : 0.08,
            shadowRadius: hasFrame ? 6 : 3,
            elevation: hasFrame ? 6 : 2,
          },
        ]}
      >
        {/* Inner Avatar Image */}
        <Image
          source={avatar}
          style={[
            styles.avatarImage,
            {
              width: innerAvatarSize,
              height: innerAvatarSize,
              borderRadius: innerAvatarSize / 2,
            },
          ]}
          resizeMode="cover"
        />
      </LinearGradient>

      {/* Uploaded Animated or Static Frame Overlay */}
      {uploadedFrame && (uploadedFrame.animationUrl || uploadedFrame.imageUrl || uploadedFrame.image) ? (
        <View
          style={{
            position: 'absolute',
            top: (size - size * 1.25) / 2,
            left: (size - size * 1.25) / 2,
            width: Math.round(size * 1.25),
            height: Math.round(size * 1.25),
            zIndex: 10,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          pointerEvents="none"
        >
          {uploadedFrame.animationUrl ? (
            <SvgaView
              source={uploadedFrame.animationUrl}
              style={{ width: Math.round(size * 1.25), height: Math.round(size * 1.25) }}
              loops={0}
              fallbackImage={uploadedFrame.imageUrl || uploadedFrame.image}
            />
          ) : (
            <Image
              source={{ uri: uploadedFrame.imageUrl || uploadedFrame.image }}
              style={{ width: Math.round(size * 1.25), height: Math.round(size * 1.25) }}
              resizeMode="contain"
            />
          )}
        </View>
      ) : null}

      {/* Frame Decorative Ornaments (Flowers, Wings, Crowns) */}
      {renderFrameDecorations()}

      {/* Online Status Dot */}
      {showOnlineDot && (
        <View
          style={[
            styles.onlineDot,
            {
              width: Math.max(12, Math.round(size * 0.16)),
              height: Math.max(12, Math.round(size * 0.16)),
              borderRadius: Math.max(6, Math.round(size * 0.08)),
              backgroundColor: isOnline ? '#10B981' : '#94A3B8',
              bottom: Math.max(0, Math.round(size * 0.04)),
              right: Math.max(0, Math.round(size * 0.04)),
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  uploadedFrame: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  outerRing: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
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
  wingLeftShape: {
    position: 'absolute',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    opacity: 0.95,
    zIndex: 5,
    transform: [{ rotate: '-18deg' }],
    elevation: 4,
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
    elevation: 4,
  },
  onlineDot: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 12,
  },
});
