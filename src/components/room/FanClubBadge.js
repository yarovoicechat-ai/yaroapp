import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export const BADGE_GRADES = {
  Bronze: {
    label: 'Bronze',
    colors: ['#D97706', '#92400E', '#78350F'],
    ribbonColors: ['#B45309', '#78350F'],
    textColor: '#FEF3C7',
    starColor: '#FDE68A',
  },
  Silver: {
    label: 'Silver',
    colors: ['#E2E8F0', '#94A3B8', '#64748B'],
    ribbonColors: ['#94A3B8', '#475569'],
    textColor: '#FFFFFF',
    starColor: '#F8FAFC',
  },
  Gold: {
    label: 'Gold',
    colors: ['#FBBF24', '#F59E0B', '#D97706'],
    ribbonColors: ['#F59E0B', '#B45309'],
    textColor: '#FFFBEB',
    starColor: '#FEF08A',
  },
  Platinum: {
    label: 'Platinum',
    colors: ['#818CF8', '#6366F1', '#4F46E5'],
    ribbonColors: ['#6366F1', '#3730A3'],
    textColor: '#EEF2FF',
    starColor: '#E0E7FF',
  },
  Diamond: {
    label: 'Diamond',
    colors: ['#F43F5E', '#E11D48', '#BE123C'],
    ribbonColors: ['#EC4899', '#9D174D'],
    textColor: '#FFF1F2',
    starColor: '#FFE4E6',
  },
};

/**
 * Returns exact badge metadata for a given EXP value:
 * 0 - 10k: Bronze 1
 * 10k - 20k: Bronze 2
 * 20k - 40k: Bronze 3
 * 40k - 70k: Silver 1
 * 70k - 110k: Silver 2
 * 110k - 170k: Silver 3
 * 170k - 240k: Gold 1
 * 240k - 350k: Gold 2
 * 350k - 500k: Gold 3
 * 500k - 700k: Platinum 1
 * 700k - 1M: Platinum 2
 * 1M - 1.5M: Platinum 3
 * 1.5M - 2.5M: Diamond 1
 * 2.5M - 10M (1CR): Diamond 2
 * 10M+ (or 2CR+): Diamond 3
 */
export function resolveFanBadge(exp = 0, fallbackBadge = null) {
  if (fallbackBadge && fallbackBadge.grade && fallbackBadge.stars) {
    return fallbackBadge;
  }
  const points = Math.max(0, Number(exp) || 0);

  if (points < 10000) return { grade: 'Bronze', subTier: 1, stars: 1, label: 'Bronze 1' };
  if (points < 20000) return { grade: 'Bronze', subTier: 2, stars: 2, label: 'Bronze 2' };
  if (points < 40000) return { grade: 'Bronze', subTier: 3, stars: 3, label: 'Bronze 3' };

  if (points < 70000) return { grade: 'Silver', subTier: 1, stars: 1, label: 'Silver 1' };
  if (points < 110000) return { grade: 'Silver', subTier: 2, stars: 2, label: 'Silver 2' };
  if (points < 170000) return { grade: 'Silver', subTier: 3, stars: 3, label: 'Silver 3' };

  if (points < 240000) return { grade: 'Gold', subTier: 1, stars: 1, label: 'Gold 1' };
  if (points < 350000) return { grade: 'Gold', subTier: 2, stars: 2, label: 'Gold 2' };
  if (points < 500000) return { grade: 'Gold', subTier: 3, stars: 3, label: 'Gold 3' };

  if (points < 700000) return { grade: 'Platinum', subTier: 1, stars: 1, label: 'Platinum 1' };
  if (points < 1000000) return { grade: 'Platinum', subTier: 2, stars: 2, label: 'Platinum 2' };
  if (points < 1500000) return { grade: 'Platinum', subTier: 3, stars: 3, label: 'Platinum 3' };

  if (points < 2500000) return { grade: 'Diamond', subTier: 1, stars: 1, label: 'Diamond 1' };
  if (points < 10000000) return { grade: 'Diamond', subTier: 2, stars: 2, label: 'Diamond 2' };
  return { grade: 'Diamond', subTier: 3, stars: 3, label: 'Diamond 3' };
}

/**
 * Fan Club Badge Medal Component matching screenshot
 */
export default function FanClubBadge({
  exp = 0,
  badge = null,
  size = 28,
  showLabel = false,
  style,
}) {
  const resolved = resolveFanBadge(exp, badge);
  const gradeConfig = BADGE_GRADES[resolved.grade] || BADGE_GRADES.Bronze;

  const starArray = Array.from({ length: resolved.stars });

  return (
    <View style={[styles.badgeWrap, style]}>
      {/* Medal Body */}
      <View style={{ width: size, height: size * 1.15, alignItems: 'center' }}>
        {/* Top Rosette / Medal Circle */}
        <LinearGradient
          colors={gradeConfig.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.medalCircle,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
        >
          {/* Inner Stars Row */}
          <View style={styles.starsRow}>
            {starArray.map((_, i) => (
              <MaterialCommunityIcons
                key={i}
                name="star"
                size={Math.max(7, Math.round(size * 0.32) - (starArray.length === 3 ? 1.5 : 0))}
                color={gradeConfig.starColor}
              />
            ))}
          </View>
        </LinearGradient>

        {/* Bottom Ribbon tails */}
        <LinearGradient
          colors={gradeConfig.ribbonColors}
          style={[
            styles.ribbonTail,
            {
              width: size * 0.65,
              height: size * 0.35,
              marginTop: -size * 0.15,
            },
          ]}
        />
      </View>

      {/* Optional Label Pill beside medal */}
      {showLabel && (
        <LinearGradient
          colors={gradeConfig.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.labelPill}
        >
          <Text style={[styles.labelText, { color: gradeConfig.textColor }]}>
            {resolved.label}
          </Text>
        </LinearGradient>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  medalCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
    zIndex: 2,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ribbonTail: {
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    zIndex: 1,
    opacity: 0.9,
  },
  labelPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 2,
  },
  labelText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
