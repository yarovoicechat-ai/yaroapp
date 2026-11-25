import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function FloatingCalculatorWidget({
  activeSession,
  onPress,
}) {
  const pan = useRef(new Animated.ValueXY({ x: 16, y: SCREEN_HEIGHT * 0.45 })).current;
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!activeSession || activeSession.status !== 'active') {
      setSecondsLeft(0);
      return;
    }
    const update = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((activeSession.endsAt - now) / 1000));
      setSecondsLeft(diff);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 4 || Math.abs(gestureState.dy) > 4;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    })
  ).current;

  if (!activeSession || activeSession.status !== 'active') return null;

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const countdownText =
    activeSession.status === 'ended'
      ? 'End'
      : mins >= 1
      ? `${mins}m ${secs}s`
      : `${secs}s`;

  return (
    <Animated.View
      style={[
        styles.floatingContainer,
        {
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={onPress}
        style={styles.touchArea}
      >
        {/* Top Mini Ribbon Badge */}
        <View style={styles.ribbonBadgeContainer}>
          <LinearGradient
            colors={['#8B5CF6', '#3B82F6', '#9333EA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ribbonBadge}
          >
            <Text style={styles.ribbonBadgeText} numberOfLines={1}>
              {activeSession.theme || 'Calculator'}
            </Text>
          </LinearGradient>
        </View>

        {/* Floating Card Body */}
        <View style={styles.cardBody}>
          {activeSession.topCharming ? (
            <View style={styles.topUserRow}>
              <Image
                source={
                  activeSession.topCharming.avatar
                    ? { uri: activeSession.topCharming.avatar }
                    : require('../../assets/avtar.webp')
                }
                style={styles.avatarMini}
              />
              <View style={styles.userInfoCol}>
                <Text style={styles.userNameMini} numberOfLines={1}>
                  {activeSession.topCharming.name}
                </Text>
                <Text style={styles.userScoreMini}>
                  ⭐ {activeSession.topCharming.score}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.noRankingText} numberOfLines={1}>
              No current ranking
            </Text>
          )}

          {/* Countdown & Total Bar */}
          <View style={styles.statsBar}>
            <Text style={styles.statsBarText}>
              {activeSession.totalScore || 0} Total • ⏱️ {countdownText}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 9999,
  },
  touchArea: {
    width: 146,
    borderRadius: 16,
    backgroundColor: '#382D5C',
    borderWidth: 1.5,
    borderColor: '#7C67B8',
    paddingTop: 16,
    paddingHorizontal: 8,
    paddingBottom: 6,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
    position: 'relative',
  },
  ribbonBadgeContainer: {
    position: 'absolute',
    top: -10,
    alignSelf: 'center',
    zIndex: 2,
  },
  ribbonBadge: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C084FC',
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ribbonBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  cardBody: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  topUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  avatarMini: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#F59E0B',
    marginRight: 6,
  },
  userInfoCol: {
    maxWidth: 90,
  },
  userNameMini: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  userScoreMini: {
    color: '#FCD34D',
    fontSize: 9,
    fontWeight: '800',
  },
  noRankingText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    fontWeight: '600',
    marginVertical: 4,
    textAlign: 'center',
  },
  statsBar: {
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 6,
    paddingVertical: 2,
    alignItems: 'center',
    marginTop: 2,
  },
  statsBarText: {
    color: '#E0E7FF',
    fontSize: 9,
    fontWeight: '700',
  },
});
