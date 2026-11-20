import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { LIVE_GAMES_LIST } from '../live/LiveGamesModal';
import { apiUtil } from '../../utils/apiUtil';

// Per user specification: Only Greedy King is active. Events and other games removed.
export const GAME_BANNER_ITEMS = [
  {
    id: 'greedy-king',
    gameId: 'greedy-king',
    title: 'Greedy King',
    multiplier: '50x',
    available: true,
    badgeImage: require('../../assets/icons/greedy_king_badge.png'),
    bgGradient: ['#B45309', '#78350F', '#451A03'],
    borderGradient: ['#FDE047', '#F59E0B'],
  },
];

export default function FloatingGameBannerWidget({
  onSelectGame,
  style,
  roomType = 'voice', // 'voice' | 'live'
}) {
  const gameScale = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [isVisible, setIsVisible] = useState(true);
  const activeGameItem = GAME_BANNER_ITEMS[0];

  // Optional: check server visibility configuration
  useEffect(() => {
    let isMounted = true;
    const checkVisibility = async () => {
      try {
        const res = await apiUtil.get('/api/games/config');
        const gkConfig = res?.data?.data?.greedyKing;
        if (gkConfig && isMounted) {
          if (gkConfig.isHidden) {
            setIsVisible(false);
          } else if (roomType === 'voice' && gkConfig.showInVoiceRoom === false) {
            setIsVisible(false);
          } else if (roomType === 'live' && gkConfig.showInLiveRoom === false) {
            setIsVisible(false);
          } else if (gkConfig.showFloatingBanner === false) {
            setIsVisible(false);
          } else {
            setIsVisible(true);
          }
        }
      } catch {
        // Fallback: stay visible if server check fails
      }
    };

    checkVisibility();
    return () => {
      isMounted = false;
    };
  }, [roomType]);

  // Subtle breathing animation to attract players
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.04,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  if (!isVisible) {
    return null;
  }

  const handleGamePress = () => {
    const fullGame = LIVE_GAMES_LIST.find(g => g.id === activeGameItem.id) || {
      id: activeGameItem.id,
      gameId: activeGameItem.gameId,
      title: activeGameItem.title,
      gameUrl: 'https://games.yaroapp.in/greedy-king/',
    };
    if (onSelectGame) {
      onSelectGame(fullGame);
    }
  };

  return (
    <View style={[styles.container, style]} pointerEvents="box-none">
      {/* SOLE GAME BANNER CARD: Greedy King Badge (User Specification) */}
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={handleGamePress}
        style={styles.gameTouchArea}
        accessibilityLabel="Game Greedy King"
      >
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <LinearGradient
            colors={['#FFD700', '#F59E0B', '#B45309']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.badgeGlowBorder}
          >
            <View style={styles.badgeContainer}>
              <Image
                source={require('../../assets/icons/greedy_king_badge.png')}
                style={styles.badgeImage}
                resizeMode="cover"
              />

              {/* 50x Multiplier Pill */}
              <View style={styles.multiplierTag}>
                <Text style={styles.multiplierText}>{activeGameItem.multiplier}</Text>
              </View>

              {/* Glowing Bottom Title Bar */}
              <LinearGradient
                colors={['rgba(0,0,0,0.85)', 'rgba(20,10,35,0.95)']}
                style={styles.titleBar}
              >
                <Text style={styles.titleText} numberOfLines={1}>
                  Greedy King
                </Text>
              </LinearGradient>
            </View>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 68,
    zIndex: 30,
  },
  gameTouchArea: {
    width: 66,
    alignItems: 'center',
  },
  badgeGlowBorder: {
    width: 66,
    height: 74,
    borderRadius: 16,
    padding: 2,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.65,
    shadowRadius: 7,
    elevation: 9,
  },
  badgeContainer: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#1E1233',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  badgeImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  multiplierTag: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#7C3AED',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderWidth: 0.8,
    borderColor: '#C084FC',
    zIndex: 2,
  },
  multiplierText: {
    color: '#FFF',
    fontSize: 7.5,
    fontWeight: '900',
  },
  titleBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 215, 0, 0.4)',
  },
  titleText: {
    color: '#FFD700',
    fontSize: 7.5,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
});
