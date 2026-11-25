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
  ImageBackground,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const calcBadgeBlankImg = require('../../assets/calculator/calc_badge_blank.png');

export default function FloatingCalculatorWidget({
  activeSession,
  onPress,
}) {
  // Positioned on the right side by default matching video
  const pan = useRef(new Animated.ValueXY({ x: SCREEN_WIDTH - 176, y: SCREEN_HEIGHT * 0.52 })).current;
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

  // Crucial: completely vanish when session is not active
  if (!activeSession || activeSession.status !== 'active') return null;

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const countdownText = mins >= 1 ? `${mins}m ${secs}s` : `${secs}s`;

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
        activeOpacity={0.9}
        onPress={onPress}
        style={styles.touchArea}
      >
        {/* Hexagonal Ribbon Banner from user assets */}
        <View style={styles.ribbonBadgeContainer}>
          <ImageBackground
            source={calcBadgeBlankImg}
            style={styles.ribbonBadgeBg}
            resizeMode="stretch"
          >
            <Text style={styles.ribbonBadgeText} numberOfLines={1}>
              {activeSession.theme || 'Calculator ranking'}
            </Text>
          </ImageBackground>
        </View>

        {/* Floating Card Body */}
        <LinearGradient
          colors={['#1E224F', '#141838', '#0C0E28']}
          style={styles.cardGradient}
        >
          {activeSession.topCharming ? (
            <View style={styles.rankedUserContent}>
              <Image
                source={
                  activeSession.topCharming.avatar
                    ? { uri: activeSession.topCharming.avatar }
                    : require('../../assets/avtar.webp')
                }
                style={styles.avatarMini}
              />
              <Text style={styles.rankRoleText}>Top charming</Text>
              <Text style={styles.userNameMini} numberOfLines={1}>
                {activeSession.topCharming.name}
              </Text>
              <View style={styles.scorePill}>
                <Text style={styles.scorePillText}>⭐ {activeSession.topCharming.score}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptyContent}>
              <Text style={styles.noRankingText}>
                No current ranking
              </Text>
            </View>
          )}

          {/* Stats Footer Bar */}
          <View style={styles.statsBar}>
            <Text style={styles.statsBarText} numberOfLines={1}>
              {activeSession.totalScore || 0} Total • ⏱️ {countdownText}
            </Text>
          </View>
        </LinearGradient>
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
    width: 156,
    minHeight: 168,
    position: 'relative',
    paddingTop: 12,
  },
  ribbonBadgeContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  ribbonBadgeBg: {
    width: 142,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  ribbonBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cardGradient: {
    borderRadius: 20,
    borderWidth: 1.8,
    borderColor: '#38BDF8',
    paddingTop: 26,
    paddingHorizontal: 8,
    paddingBottom: 8,
    minHeight: 156,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 12,
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  noRankingText: {
    color: '#E0E7FF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    opacity: 0.95,
  },
  rankedUserContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  avatarMini: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    marginBottom: 4,
  },
  rankRoleText: {
    color: '#C084FC',
    fontSize: 10,
    fontWeight: '700',
  },
  userNameMini: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
    maxWidth: 120,
    textAlign: 'center',
    marginTop: 1,
  },
  scorePill: {
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 3,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.5)',
  },
  scorePillText: {
    color: '#FCD34D',
    fontSize: 10,
    fontWeight: '800',
  },
  statsBar: {
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 6,
    alignItems: 'center',
    marginTop: 6,
  },
  statsBarText: {
    color: '#E0E7FF',
    fontSize: 10,
    fontWeight: '700',
  },
});
