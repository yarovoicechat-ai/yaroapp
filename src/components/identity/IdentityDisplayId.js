import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ToastAndroid } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import Icon from 'react-native-vector-icons/Ionicons';

/**
 * Identity Display ID Presentation Component
 *
 * Implements the Core Yaro Requirement:
 * - Permanent numeric user ID is authoritative and immutable.
 * - Active Official ID / Vanity ID is displayed during its valid entitlement period.
 * - When expired or revoked, automatically reverts to permanent numeric ID.
 * - Copying copies the effective ID (or permanent ID).
 */
export default function IdentityDisplayId({
  userId,
  officialDisplayId = null,
  isOfficial = false,
  customDisplayId = null,
  showCopy = true,
  fontSize = 12,
  style,
}) {
  const permanentIdStr = String(userId || '').trim();
  const effectiveId = (isOfficial && officialDisplayId)
    ? officialDisplayId
    : customDisplayId || permanentIdStr;

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
      <Text style={[styles.label, { fontSize }]}>ID: </Text>
      <View style={[styles.idBadge, isOfficial && styles.officialIdBadge]}>
        <Text style={[styles.idText, isOfficial && styles.officialIdText, { fontSize }]}>
          {effectiveId}
        </Text>
      </View>

      {showCopy && (
        <TouchableOpacity
          onPress={handleCopy}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.copyButton}
        >
          <Icon name="copy-outline" size={Math.max(12, fontSize)} color="#94A3B8" />
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
  label: {
    color: '#94A3B8',
    fontWeight: '600',
  },
  idBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  idText: {
    color: '#F8FAFC',
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  officialIdBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  officialIdText: {
    color: '#FBBF24',
  },
  copyButton: {
    marginLeft: 6,
    padding: 2,
  },
});
