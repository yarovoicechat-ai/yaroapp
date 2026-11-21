import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { LIVE_GAMES_LIST } from '../live/LiveGamesModal';
import { apiUtil } from '../../utils/apiUtil';

// Per user specification: Only Greedy King is active. Events and other games removed.
export const GAME_BANNER_ITEMS = [
  {
    id: 'greedy-king',
    gameId: 'greedy-king',
    title: 'Greedy King',
    available: true,
    badgeImage: require('../../assets/icons/greedy_king_badge.png'),
  },
];

export default function FloatingGameBannerWidget({
  onSelectGame,
  style,
  roomType = 'voice', // 'voice' | 'live'
}) {
  const [isVisible, setIsVisible] = useState(true);
  const activeGameItem = GAME_BANNER_ITEMS[0];

  // Check server visibility configuration
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
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={handleGamePress}
        style={styles.badgeTouchArea}
        accessibilityLabel="Game Greedy King"
      >
        <Image
          source={require('../../assets/icons/greedy_king_badge.png')}
          style={styles.badgeImage}
          resizeMode="contain"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 56,
    zIndex: 30,
  },
  badgeTouchArea: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeImage: {
    width: 54,
    height: 54,
    borderRadius: 10,
  },
});
