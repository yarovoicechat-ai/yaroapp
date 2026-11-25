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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const calcRibbonBannerImg = require('../../assets/calculator/calc_ribbon_banner.png');

export default function FloatingCalculatorWidget({
  activeSession,
  onPress,
}) {
  // Default position: right side, middle-lower screen like video
  const pan = useRef(new Animated.ValueXY({ x: SCREEN_WIDTH - 175, y: SCREEN_HEIGHT * 0.52 })).current;
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

  // IMPORTANT: Hide immediately when session ends or is inactive
  if (!activeSession || activeSession.status !== 'active') {
    return null;
  }

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
        {/* Top Header Hexagon Ribbon Banner */}
        <View style={styles.ribbonBadgeContainer} pointerEvents="none">
          <ImageBackground
            source={calcRibbonBannerImg}
            style={styles.ribbonBg}
            imageStyle={styles.ribbonBgImg}
            resizeMode="contain"
          >
            <Text style={styles.ribbonBadgeText} numberOfLines={1}>
              {activeSession.theme || 'Calculator'}
            </Text>
          </ImageBackground>
        </View>

        {/* Floating Card Body */}
        <View style={styles.cardBody}>
          {activeSession.topCharming ? (
            <View style={styles.rankingContent}>
              <Image
                source={
                  activeSession.topCharming.avatar
                    ? { uri: activeSession.topCharming.avatar }
                    : require('../../assets/avtar.webp')
                }
                style={styles.avatarMain}
              />
              <Text style={styles.rankingRoleText}>Top charming</Text>
              <Text style={styles.userNameText} numberOfLines={1}>
                {activeSession.topCharming.name}
              </Text>
              <View style={styles.scorePill}>
                <Text style={styles.scorePillText}>
                  ⭐ {activeSession.topCharming.score}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptyContent}>
              <Text style={styles.noRankingText}>
                No current ranking
              </Text>
            </View>
          )}

          {/* Bottom Countdown & Stats Bar */}
          <View style={styles.statsBar}>
            <Text style={styles.statsBarText} numberOfLines={1}>
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
    width: 156,
    height: 172,
    borderRadius: 18,
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    paddingTop: 24,
    paddingHorizontal: 8,
    paddingBottom: 8,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 14,
    position: 'relative',
    justifyContent: 'space-between',
  },
  ribbonBadgeContainer: {
    position: 'absolute',
    top: -16,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  ribbonBg: {
    width: 144,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  ribbonBgImg: {
    resizeMode: 'contain',
  },
  ribbonBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  cardBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  emptyContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noRankingText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 18,
  },
  rankingContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMain: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    marginBottom: 4,
  },
  rankingRoleText: {
    color: '#93C5FD',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  userNameText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    maxWidth: 120,
    textAlign: 'center',
  },
  scorePill: {
    backgroundColor: 'rgba(147, 51, 234, 0.45)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 2,
    borderWidth: 1,
    borderColor: '#A855F7',
  },
  scorePillText: {
    color: '#FDE047',
    fontSize: 10,
    fontWeight: '800',
  },
  statsBar: {
    width: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 0.8,
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  statsBarText: {
    color: '#BAE6FD',
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
  },
});
