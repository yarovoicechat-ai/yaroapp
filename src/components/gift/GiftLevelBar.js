import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function GiftLevelBar({
  level = 3,
  currentExp = 900,
  targetExp = 1000,
  onPress,
}) {
  const needed = Math.max(0, targetExp - currentExp);
  const progressPercent = Math.min(100, Math.max(10, Math.round((currentExp / targetExp) * 100)));

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Level Badge */}
      <View style={styles.levelBadge}>
        <Text style={styles.levelText}>Lv.{level}</Text>
      </View>

      {/* Progress Bar Track */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
      </View>

      {/* Text Info */}
      <View style={styles.infoRow}>
        <Text style={styles.infoText} numberOfLines={1}>
          Need {needed.toLocaleString()} more diamonds to achieve Level {level + 1}.
        </Text>
        <MaterialCommunityIcons name="chevron-right" size={14} color="#EAB308" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(234, 179, 8, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.22)',
    borderRadius: 8,
    marginHorizontal: 12,
    marginVertical: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 8,
  },
  levelBadge: {
    backgroundColor: '#78350F',
    borderWidth: 1,
    borderColor: '#FACC15',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  levelText: {
    color: '#FACC15',
    fontSize: 9.5,
    fontWeight: '900',
  },
  progressTrack: {
    width: 60,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(51, 65, 85, 0.7)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#EAB308',
    borderRadius: 2.5,
  },
  infoRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2,
  },
  infoText: {
    color: '#FDE047',
    fontSize: 10,
    fontWeight: '600',
  },
});
