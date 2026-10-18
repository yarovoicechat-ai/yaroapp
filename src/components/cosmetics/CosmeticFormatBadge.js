import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getCosmeticFormatBadge } from './CosmeticAsset';

export default function CosmeticFormatBadge({ item, containerStyle, textStyle }) {
  const badge = getCosmeticFormatBadge(item);
  return (
    <View style={[styles.container, containerStyle, { backgroundColor: badge.bg }]}>
      <Text style={[styles.label, textStyle, { color: badge.color }]}>{badge.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
  },
});
