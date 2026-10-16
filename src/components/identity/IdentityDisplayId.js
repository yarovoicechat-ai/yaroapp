import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ToastAndroid,
  Image,
  Clipboard,
  Animated,
  Easing,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import SvgaView from '../SvgaView';

/**
 * Identity Display ID Presentation Component
 *
 * Requirements:
 * - Permanent numeric user ID is authoritative (e.g. 1000000002).
 * - Active Official ID / Vanity ID (e.g. 600002 or "VIP") has a shining animated golden royal badge.
 * - When user has a VIP Unique ID, plain boring text ("YARO ID: 12345") is NOT shown.
 * - Shimmer shine sweep animation runs across the unique ID badge.
 * - Copying copies the effective ID.
 */
export default function IdentityDisplayId({
  userId,
  officialDisplayId = null,
  isOfficial = false,
  customDisplayId = null,
  badgeUrl = null,
  badgeText = null,
  showBadge = true,
  showCopy = true,
  showPrefix = false,
  prefix = 'YARO ID: ',
  fontSize = 13,
  textColor,
  style,
}) {
  const permanentIdStr = String(userId || '').trim();
  const effectiveId = String(
    isOfficial && officialDisplayId
      ? officialDisplayId
      : customDisplayId || officialDisplayId || permanentIdStr
  ).trim();

  // Determine if user has a VIP / Vanity / Official ID
  const isVanity = Boolean(
    isOfficial ||
    customDisplayId ||
    (officialDisplayId && String(officialDisplayId) !== permanentIdStr) ||
    badgeUrl ||
    (badgeText && !['ID'].includes(String(badgeText).toUpperCase()))
  );

  // Shining Shimmer Sweep Animation
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isVanity) return;

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(1200),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [isVanity, shimmerAnim]);

  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-70, 150],
  });

  const handleCopy = () => {
    try {
      Clipboard.setString(effectiveId);
      if (ToastAndroid?.show) {
        ToastAndroid.show(`ID ${effectiveId} copied!`, ToastAndroid.SHORT);
      }
    } catch (_) {}
  };

  // 1. VIP / Vanity Unique ID Presentation (Shining Gold Capsule & Shimmer Sweep)
  if (isVanity) {
    return (
      <View style={[styles.outerRow, style]}>
        <View style={styles.vipBadgeContainer}>
          <LinearGradient
            colors={['#2A1805', '#160E03', '#2A1805']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.vipCapsuleGradient}
          >
            {/* Left Crown / Seal Badge */}
            {showBadge && (
              <View style={styles.vipIconWrap}>
                {badgeUrl ? (
                  <SvgaView source={badgeUrl} style={styles.customBadgeImg} resizeMode="contain" />
                ) : (
                  <LinearGradient
                    colors={['#FFE259', '#FFA751']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.miniCrownPill}
                  >
                    <MaterialCommunityIcons name="crown" size={11} color="#78350F" />
                    <Text style={styles.miniCrownText}>{badgeText || 'VIP'}</Text>
                  </LinearGradient>
                )}
              </View>
            )}

            {/* Glowing Golden ID Number */}
            <Text
              style={[
                styles.vipIdText,
                { fontSize: Math.max(12, fontSize) },
                textColor ? { color: textColor } : null,
              ]}
              numberOfLines={1}
            >
              {effectiveId}
            </Text>

            {/* Shimmer Sweep Animation Overlay */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.shimmerSweep,
                {
                  transform: [
                    { translateX: shimmerTranslateX },
                    { skewX: '-25deg' },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.65)', 'rgba(255,255,255,0)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.shimmerGradient}
              />
            </Animated.View>
          </LinearGradient>
        </View>

        {/* Copy Button */}
        {showCopy && (
          <TouchableOpacity
            onPress={handleCopy}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.copyButton}
          >
            <Icon name="copy-outline" size={Math.max(13, fontSize)} color="#F59E0B" />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // 2. Standard ID Presentation (when user has regular numeric ID)
  return (
    <View style={[styles.container, style]}>
      {showPrefix && (
        <Text style={[styles.prefixText, { fontSize }]}>{prefix}</Text>
      )}

      {showBadge && (
        <View style={styles.badgeWrapper}>
          {badgeUrl ? (
            <SvgaView source={badgeUrl} style={styles.customBadgeImg} resizeMode="contain" />
          ) : (
            <LinearGradient
              colors={['#64748B', '#475569']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.regularSealCircle}
            >
              <Text style={styles.regularSealText}>{badgeText || 'ID'}</Text>
            </LinearGradient>
          )}
        </View>
      )}

      <Text
        style={[
          styles.regularIdText,
          textColor ? { color: textColor } : null,
          { fontSize },
        ]}
        numberOfLines={1}
      >
        {effectiveId}
      </Text>

      {showCopy && (
        <TouchableOpacity
          onPress={handleCopy}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.copyButton}
        >
          <Icon name="copy-outline" size={Math.max(13, fontSize)} color="#94A3B8" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prefixText: {
    color: '#64748B',
    fontWeight: '600',
    marginRight: 4,
  },
  vipBadgeContainer: {
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#F59E0B',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
  },
  vipCapsuleGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2.5,
    paddingHorizontal: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  vipIconWrap: {
    marginRight: 5,
  },
  miniCrownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
  },
  miniCrownText: {
    color: '#78350F',
    fontSize: 9,
    fontWeight: '900',
    marginLeft: 2,
    letterSpacing: 0.3,
  },
  customBadgeImg: {
    width: 20,
    height: 20,
  },
  vipIdText: {
    color: '#FDE047',
    fontWeight: '900',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(245, 158, 11, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  shimmerSweep: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 45,
    height: '100%',
  },
  shimmerGradient: {
    flex: 1,
    width: '100%',
  },
  badgeWrapper: {
    marginRight: 5,
  },
  regularSealCircle: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  regularSealText: {
    color: '#F8FAFC',
    fontSize: 9,
    fontWeight: '700',
  },
  regularIdText: {
    color: '#64748B',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  copyButton: {
    marginLeft: 6,
    padding: 2,
  },
});
