import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getUserAvatar } from '../../utils/avatarUtil';

export default function LivePKBar({
  isPKActive = true,
  leftScore = 140,
  rightScore = 3240,
  timeLeft = '04:33',
  leftContributors = [],
  rightContributors = [],
  onPressLeftSeat,
  onPressRightSeat,
}) {
  if (!isPKActive) return null;

  const total = (leftScore + rightScore) || 1;
  const leftPercent = Math.max(15, Math.min(85, Math.round((leftScore / total) * 100)));
  const rightPercent = 100 - leftPercent;

  const defaultLeft = [
    { id: 'l1', seat: 1, avatar: null },
    { id: 'l2', seat: 2, avatar: null },
    { id: 'l3', seat: 3, avatar: null },
  ];
  const defaultRight = [
    { id: 'r1', seat: 1, avatar: null },
    { id: 'r2', seat: 2, avatar: null },
    { id: 'r3', seat: 3, avatar: null },
  ];

  const leftSeats = leftContributors.length > 0 ? leftContributors : defaultLeft;
  const rightSeats = rightContributors.length > 0 ? rightContributors : defaultRight;

  return (
    <View style={styles.container}>
      {/* Dynamic Versus Progress Bar */}
      <View style={styles.barTrack}>
        <LinearGradient
          colors={['#EC4899', '#DB2777', '#BE185D']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.barLeft, { width: `${leftPercent}%` }]}
        />
        <LinearGradient
          colors={['#0284C7', '#0EA5E9', '#38BDF8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.barRight, { width: `${rightPercent}%` }]}
        />
        <View style={styles.vsGlowPoint} />
      </View>

      {/* Duel Detail Controls & Seat Rings */}
      <View style={styles.detailRow}>
        {/* Left Team: Score & Seats (3, 2, 1) */}
        <View style={styles.sideGroup}>
          <View style={styles.scorePillLeft}>
            <Text style={styles.starIcon}>⭐</Text>
            <Text style={styles.scoreTextLeft}>{Number(leftScore).toLocaleString()}</Text>
          </View>

          <View style={styles.seatsRow}>
            {leftSeats.slice(0, 3).map((item, idx) => (
              <TouchableOpacity
                key={item.id || idx}
                activeOpacity={0.8}
                onPress={() => onPressLeftSeat && onPressLeftSeat(item)}
                style={[styles.seatRing, styles.seatRingPink]}
              >
                {item.avatar ? (
                  <Image source={getUserAvatar(item)} style={styles.seatAvatar} />
                ) : (
                  <MaterialCommunityIcons name="armchair" size={12} color="#F472B6" />
                )}
                <Text style={styles.seatNum}>{item.seat || (idx + 1)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Center: PK Timer & VS Badge */}
        <View style={styles.centerBadge}>
          <LinearGradient
            colors={['#7C3AED', '#4338CA']}
            style={styles.vsGradient}
          >
            <Text style={styles.vsText}>PK</Text>
            <Text style={styles.timerText}>{timeLeft}</Text>
          </LinearGradient>
        </View>

        {/* Right Team: Seats (1, 2, 3) & Score */}
        <View style={[styles.sideGroup, { justifyContent: 'flex-end' }]}>
          <View style={styles.seatsRow}>
            {rightSeats.slice(0, 3).map((item, idx) => (
              <TouchableOpacity
                key={item.id || idx}
                activeOpacity={0.8}
                onPress={() => onPressRightSeat && onPressRightSeat(item)}
                style={[styles.seatRing, styles.seatRingBlue]}
              >
                {item.avatar ? (
                  <Image source={getUserAvatar(item)} style={styles.seatAvatar} />
                ) : (
                  <MaterialCommunityIcons name="armchair" size={12} color="#38BDF8" />
                )}
                <Text style={styles.seatNum}>{item.seat || (idx + 1)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.scorePillRight}>
            <Text style={styles.scoreTextRight}>{Number(rightScore).toLocaleString()}</Text>
            <Text style={styles.starIcon}>⭐</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    zIndex: 15,
  },
  barTrack: {
    height: 7,
    flexDirection: 'row',
    width: '100%',
    position: 'relative',
  },
  barLeft: {
    height: '100%',
  },
  barRight: {
    height: '100%',
  },
  vsGlowPoint: {
    position: 'absolute',
    top: -2,
    bottom: -2,
    width: 6,
    left: '50%',
    marginLeft: -3,
    backgroundColor: '#FFF',
    borderRadius: 3,
    shadowColor: '#FFF',
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: 4,
  },
  sideGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  scorePillLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(236, 72, 153, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.4)',
  },
  scoreTextLeft: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 11,
    marginLeft: 2,
  },
  scorePillRight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(14, 165, 233, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.4)',
  },
  scoreTextRight: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 11,
    marginRight: 2,
  },
  starIcon: {
    fontSize: 10,
  },
  seatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seatRing: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    position: 'relative',
  },
  seatRingPink: {
    borderColor: '#EC4899',
  },
  seatRingBlue: {
    borderColor: '#0EA5E9',
  },
  seatAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  seatNum: {
    position: 'absolute',
    bottom: -4,
    right: -2,
    fontSize: 7,
    fontWeight: '900',
    color: '#FFF',
    textShadowColor: '#000',
    textShadowRadius: 2,
  },
  centerBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  vsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  vsText: {
    color: '#FEF08A',
    fontWeight: '900',
    fontSize: 11,
  },
  timerText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 10,
  },
});
