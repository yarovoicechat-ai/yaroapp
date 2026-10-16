import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ToastAndroid, Image } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

/**
 * Identity Display ID Presentation Component
 *
 * Implements the Core Yaro Requirement:
 * - Permanent numeric user ID is authoritative and immutable (e.g. 1000000002).
 * - Active Official ID / Vanity ID (e.g. 600002 or "Official") is displayed with its animated badge during validity.
 * - When expired or revoked, automatically reverts to permanent numeric ID.
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
  fontSize = 13,
  textColor,
  style,
}) {
  const permanentIdStr = String(userId || '').trim();
  const effectiveId =
    isOfficial && officialDisplayId
      ? officialDisplayId
      : customDisplayId || officialDisplayId || permanentIdStr;

  const isVanity = Boolean(
    (isOfficial && officialDisplayId) ||
    customDisplayId ||
    (officialDisplayId && officialDisplayId !== permanentIdStr)
  );

  const handleCopy = () => {
    try {
      Clipboard.setString(effectiveId);
      if (ToastAndroid?.show) {
        ToastAndroid.show(`ID ${effectiveId} copied!`, ToastAndroid.SHORT);
      }
    } catch (_) {}
  };

  return (
    <View style={[styles.container, style]}>
      {/* Golden / Animated ID Seal Badge (from screenshot) */}
      {showBadge && (
        <View style={styles.badgeWrapper}>
          {badgeUrl ? (
            <Image source={{ uri: badgeUrl }} style={styles.customBadgeImg} resizeMode="contain" />
          ) : (
            <LinearGradient
              colors={isVanity ? ['#FDE047', '#EAB308', '#CA8A04', '#A16207'] : ['#475569', '#334155']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.goldenSealCircle}
            >
              <View style={styles.goldenSealInner}>
                <Text style={styles.sealIdText}>{badgeText || 'ID'}</Text>
              </View>
            </LinearGradient>
          )}
        </View>
      )}

      {/* Effective Display ID Text (Golden bold if vanity, neutral if permanent) */}
      <Text
        style={[
          styles.idText,
          isVanity && styles.vanityIdText,
          textColor ? { color: textColor } : null,
          { fontSize },
        ]}
        numberOfLines={1}
      >
        {effectiveId}
      </Text>

      {/* Copy Button */}
      {showCopy && (
        <TouchableOpacity
          onPress={handleCopy}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.copyButton}
        >
          <Icon
            name="copy-outline"
            size={Math.max(13, fontSize)}
            color={isVanity ? '#FBBF24' : '#94A3B8'}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeWrapper: {
    marginRight: 6,
  },
  customBadgeImg: {
    width: 22,
    height: 22,
  },
  goldenSealCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    padding: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
  },
  goldenSealInner: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    backgroundColor: '#78350F',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#FDE047',
  },
  sealIdText: {
    color: '#FEF08A',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  idText: {
    color: '#F8FAFC',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  vanityIdText: {
    color: '#FBBF24',
    textShadowColor: 'rgba(245, 158, 11, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  copyButton: {
    marginLeft: 6,
    padding: 2,
  },
});
