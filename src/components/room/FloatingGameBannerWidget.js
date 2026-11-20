import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { LIVE_GAMES_LIST } from '../live/LiveGamesModal';

// Per user specification: Only Greedy King is active. Events and other games removed.
export const GAME_BANNER_ITEMS = [
  {
    id: 'greedy-king',
    gameId: 'greedy-king',
    title: 'Greedy King',
    multiplier: '50x',
    available: true,
    bearEmoji: '👑',
    toolEmoji: '🦁',
    fruitRow: '👑🍉🍓',
    bgGradient: ['#B45309', '#78350F', '#451A03'],
    borderGradient: ['#FDE047', '#F59E0B'],
  },
];

export default function FloatingGameBannerWidget({
  onSelectGame,
  style,
}) {
  const gameScale = useRef(new Animated.Value(1)).current;
  const activeGameItem = GAME_BANNER_ITEMS[0];

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
      {/* SOLE GAME BANNER CARD: Greedy King (User Specification: No events, only Greedy King) */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleGamePress}
        style={styles.gameTouchArea}
        accessibilityLabel="Game Greedy King"
      >
        <Animated.View style={{ transform: [{ scale: gameScale }] }}>
          <LinearGradient
            colors={activeGameItem.bgGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gameCard}
          >
            {/* Multiplier Tag */}
            <View style={styles.multiplierTag}>
              <Text style={styles.multiplierText}>{activeGameItem.multiplier}</Text>
            </View>

            {/* King Character & Tool */}
            <View style={styles.bearRow}>
              <Text style={styles.bearEmoji}>{activeGameItem.bearEmoji}</Text>
              <Text style={styles.toolEmoji}>{activeGameItem.toolEmoji}</Text>
            </View>

            {/* Slot Fruit Row */}
            <View style={styles.fruitSlotContainer}>
              <Text style={styles.fruitText}>{activeGameItem.fruitRow}</Text>
            </View>

            {/* Title Pill */}
            <View style={styles.gameTitlePill}>
              <Text style={styles.gameTitlePillText} numberOfLines={1}>
                {activeGameItem.title}
              </Text>
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
  gameCard: {
    width: 66,
    height: 72,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FDE047',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 3,
    paddingHorizontal: 2,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 8,
  },
  multiplierTag: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#7C3AED',
    borderRadius: 6,
    paddingHorizontal: 3,
    paddingVertical: 0.5,
    borderWidth: 0.5,
    borderColor: '#C084FC',
  },
  multiplierText: {
    color: '#FFF',
    fontSize: 7.5,
    fontWeight: '900',
  },
  bearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    gap: 1,
  },
  bearEmoji: {
    fontSize: 20,
  },
  toolEmoji: {
    fontSize: 12,
  },
  fruitSlotContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: 6,
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderWidth: 0.8,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    marginVertical: 1,
  },
  fruitText: {
    fontSize: 9,
    letterSpacing: 0.5,
  },
  gameTitlePill: {
    backgroundColor: '#0284C7',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    width: '94%',
    alignItems: 'center',
  },
  gameTitlePillText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '800',
    textAlign: 'center',
  },
});
