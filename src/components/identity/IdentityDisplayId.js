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
 * - Active Official ID / Vanity ID (e.g. 600002 or "BLACK") has an animated text treatment.
 * - When user has a VIP Unique ID, plain boring text ("YARO ID: 12345") is NOT shown.
 * - The ID text has no background; uploaded badge art is rendered separately.
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

  // Sanitize badgeUrl so that avatar frames are never displayed as ID badges
  const isFrameAsset = Boolean(badgeUrl && /frame/i.test(String(badgeUrl)));
  const cleanBadgeUrl = isFrameAsset ? null : badgeUrl;
  const hasSvgaBadge = Boolean(showBadge && cleanBadgeUrl);

  // Determine if user has a VIP / Vanity / Official ID
  const isVanity = Boolean(
    isOfficial ||
    customDisplayId ||
    (officialDisplayId && String(officialDisplayId) !== permanentIdStr) ||
    cleanBadgeUrl ||
    (badgeText && !['ID'].includes(String(badgeText).toUpperCase()))
  );

  // Animate the ID letters themselves. Keep the badge as a separate asset and
  // leave the area behind the ID transparent.
  const idColorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isVanity) return;

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(idColorAnim, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(idColorAnim, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [isVanity, idColorAnim]);

  const animatedIdColor = idColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#111827', '#D4AF37'],
  });

  const handleCopy = () => {
    try {
      Clipboard.setString(effectiveId);
      if (ToastAndroid?.show) {
        ToastAndroid.show(`ID ${effectiveId} copied!`, ToastAndroid.SHORT);
      }
    } catch (_) {}
  };

  // 1. VIP / Vanity Unique ID Presentation
  if (isVanity) {
    return (
      <View style={[styles.outerRow, style]}>
        {hasSvgaBadge ? (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={showCopy ? handleCopy : undefined}
            style={styles.vipIconWrap}
          >
            <SvgaView source={cleanBadgeUrl} style={styles.customBadgeImg} resizeMode="contain" />
          </TouchableOpacity>
        ) : showBadge && badgeText ? (
          <MaterialCommunityIcons
            name="crown"
            size={Math.max(18, fontSize + 4)}
            color="#D4AF37"
            style={styles.vipIconWrap}
          />
        ) : null}

        {/* When SVGA badge is shown, do NOT render plain ID text after it */}
        {!hasSvgaBadge && (
          <Animated.Text
            style={[
              styles.vipIdText,
              { fontSize: Math.max(14, fontSize + 2), color: animatedIdColor },
            ]}
            numberOfLines={1}
          >
            {effectiveId}
          </Animated.Text>
        )}

        {/* Copy Button */}
        {showCopy && (
          <TouchableOpacity
            onPress={handleCopy}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.copyButton}
          >
            <Icon name="copy-outline" size={Math.max(15, fontSize + 2)} color="#F59E0B" />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // 2. Standard ID Presentation (when user has regular numeric ID)
  return (
    <View style={[styles.container, style]}>
      {showPrefix && !hasSvgaBadge && (
        <Text style={[styles.prefixText, { fontSize }]}>{prefix}</Text>
      )}

      {showBadge && (
        <View style={styles.badgeWrapper}>
          {hasSvgaBadge ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={showCopy ? handleCopy : undefined}
            >
              <SvgaView source={cleanBadgeUrl} style={styles.customBadgeImg} resizeMode="contain" />
            </TouchableOpacity>
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

      {/* When SVGA badge is shown, do NOT render plain ID text after it */}
      {!hasSvgaBadge && (
        <Text
          style={[
            styles.regularIdText,
            textColor ? { color: textColor } : null,
            { fontSize: fontSize + 1 },
          ]}
          numberOfLines={1}
        >
          {effectiveId}
        </Text>
      )}

      {showCopy && (
        <TouchableOpacity
          onPress={handleCopy}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.copyButton}
        >
          <Icon name="copy-outline" size={Math.max(15, fontSize + 2)} color="#94A3B8" />
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
  vipIconWrap: {
    marginRight: 5,
    justifyContent: 'center',
  },
  customBadgeImg: {
    width: 58,
    height: 20,
  },
  vipIdText: {
    fontWeight: '900',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(212, 175, 55, 0.55)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  badgeWrapper: {
    marginRight: 5,
  },
  regularSealCircle: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  regularSealText: {
    color: '#F8FAFC',
    fontSize: 10,
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
