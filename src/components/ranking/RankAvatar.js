import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getUserAvatar } from '../../utils/avatarUtil';

export const RANK_FRAMES = {
  1: require('../../assets/ranks/rank_top1.png'),
  2: require('../../assets/ranks/rank_top2.png'),
  3: require('../../assets/ranks/rank_top3.png'),
};

export const getRankFrame = (rank) => {
  const r = Number(rank);
  if (r === 1) return RANK_FRAMES[1];
  if (r === 2) return RANK_FRAMES[2];
  if (r === 3) return RANK_FRAMES[3];
  return null;
};

// Precise inner hole ratios measured from asset geometry
export const HOLE_CONFIG = {
  1: { holeRatio: 0.581, aspect: 928 / 1000 },
  2: { holeRatio: 0.623, aspect: 1.0 },
  3: { holeRatio: 0.649, aspect: 1.0 },
};

/**
 * High-Definition Avatar with Top 1, Top 2, Top 3 Luxury Rank Frames
 */
export default function RankAvatar({
  rank,
  user,
  avatarSource,
  size = 60,
  isPlaceholder = false,
  style,
  avatarStyle,
}) {
  const rankNum = Number(rank);
  const frameSource = getRankFrame(rankNum);
  const config = HOLE_CONFIG[rankNum] || { holeRatio: 0.62, aspect: 1.0 };

  const frameW = Math.round(size / config.holeRatio);
  const frameH = Math.round(frameW * config.aspect);
  const frameTop = Math.round((size - frameH) / 2);
  const frameLeft = Math.round((size - frameW) / 2);

  const resolvedAvatar = avatarSource || getUserAvatar(user);

  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      {/* Circular Avatar Clip */}
      <View
        style={[
          styles.avatarCircle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
          avatarStyle,
        ]}
      >
        {isPlaceholder ? (
          <View style={[styles.placeholderBox, { width: size, height: size }]}>
            <MaterialCommunityIcons name="account" size={Math.round(size * 0.55)} color="#64748B" />
          </View>
        ) : (
          <Image
            source={resolvedAvatar}
            style={{ width: size, height: size, borderRadius: size / 2 }}
            resizeMode="cover"
          />
        )}
      </View>

      {/* Rank Frame Overlay */}
      {frameSource ? (
        <Image
          source={frameSource}
          style={{
            position: 'absolute',
            top: frameTop,
            left: frameLeft,
            width: frameW,
            height: frameH,
            zIndex: 10,
          }}
          resizeMode="contain"
          pointerEvents="none"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  avatarCircle: {
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderBox: {
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
