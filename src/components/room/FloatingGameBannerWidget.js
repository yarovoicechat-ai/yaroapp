import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AlertService from '../../utils/alertService';
import { LIVE_GAMES_LIST } from '../live/LiveGamesModal';

// Event / Promotion Banner items
const PROMO_EVENTS = [
  {
    id: 'iphone-18',
    tag: 'EVENT',
    title: "Win Hapi's",
    sub: 'iPhone 18pro',
    icon: 'cellphone-wireless',
    gradient: ['#7928CA', '#FF0080', '#FF4D4D'],
    badgeColor: '#FFD700',
  },
  {
    id: 'gift-star',
    tag: 'RANK',
    title: 'Level Up',
    sub: 'Gift Star ⭐',
    icon: 'star-shooting',
    gradient: ['#F59E0B', '#D97706', '#B45309'],
    badgeColor: '#FDE047',
  },
  {
    id: 'bd-king',
    tag: 'CONTEST',
    title: 'BD King',
    sub: '& Queen 👑',
    icon: 'crown',
    gradient: ['#06B6D4', '#3B82F6', '#8B5CF6'],
    badgeColor: '#67E8F9',
  },
  {
    id: 'wealth-fest',
    tag: 'SPECIAL',
    title: 'Super Coin',
    sub: 'Festival 💰',
    icon: 'cash-multiple',
    gradient: ['#EC4899', '#DB2777', '#9333EA'],
    badgeColor: '#F472B6',
  },
];

// Game Rotating Banner items (Matching the user video polar bear & slot design)
const GAME_BANNER_ITEMS = [
  {
    id: 'food-game',
    gameId: 'food-game',
    title: 'Food Game',
    multiplier: '50x',
    available: true,
    bearEmoji: '🐻',
    toolEmoji: '🍴',
    fruitRow: '🍋🍓🥭',
    bgGradient: ['#0284C7', '#0369A1', '#075985'],
    borderGradient: ['#38BDF8', '#0284C7'],
  },
  {
    id: 'greedy-baby',
    gameId: 'greedy-baby',
    title: 'Greedy Baby',
    multiplier: '50x',
    available: true,
    bearEmoji: '🐻',
    toolEmoji: '🍯',
    fruitRow: '🍉🍇🍎',
    bgGradient: ['#D97706', '#B45309', '#92400E'],
    borderGradient: ['#FBBF24', '#D97706'],
  },
  {
    id: 'lucky-777',
    gameId: 'lucky-777',
    title: 'Lucky 777',
    multiplier: '777x',
    available: false,
    bearEmoji: '🎰',
    toolEmoji: '🔥',
    fruitRow: '7️⃣ 7️⃣ 7️⃣',
    bgGradient: ['#7C3AED', '#5B21B6', '#4C1D95'],
    borderGradient: ['#C084FC', '#7C3AED'],
  },
  {
    id: 'teen-patti',
    gameId: 'teen-patti',
    title: 'Teen Patti',
    multiplier: '10x',
    available: false,
    bearEmoji: '🃏',
    toolEmoji: '👑',
    fruitRow: '♠️ ♥️ ♦️',
    bgGradient: ['#059669', '#047857', '#065F46'],
    borderGradient: ['#34D399', '#059669'],
  },
];

export default function FloatingGameBannerWidget({
  onSelectGame,
  onPressPromo,
  style,
}) {
  const [promoIdx, setPromoIdx] = useState(0);
  const [gameIdx, setGameIdx] = useState(0);

  const promoFade = useRef(new Animated.Value(1)).current;
  const gameScale = useRef(new Animated.Value(1)).current;

  // Auto rotate Promo Banner every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      Animated.sequence([
        Animated.timing(promoFade, { toValue: 0.3, duration: 250, useNativeDriver: true }),
        Animated.timing(promoFade, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
      setPromoIdx(prev => (prev + 1) % PROMO_EVENTS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [promoFade]);

  // Auto rotate Game Banner every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      Animated.sequence([
        Animated.timing(gameScale, { toValue: 0.88, duration: 200, useNativeDriver: true }),
        Animated.timing(gameScale, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
      setGameIdx(prev => (prev + 1) % GAME_BANNER_ITEMS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [gameScale]);

  const activePromo = PROMO_EVENTS[promoIdx];
  const activeGameItem = GAME_BANNER_ITEMS[gameIdx];

  // Handle Game Banner click:
  // If game is available, launch directly!
  // If game is coming soon, show "Coming Soon"!
  const handleGamePress = () => {
    if (activeGameItem.available) {
      // Find full game config from LIVE_GAMES_LIST
      const fullGame = LIVE_GAMES_LIST.find(g => g.id === activeGameItem.id) || {
        id: activeGameItem.id,
        gameId: activeGameItem.gameId,
        title: activeGameItem.title,
        gameUrl: `https://games.yaroapp.in/${activeGameItem.id}/`,
      };
      if (onSelectGame) {
        onSelectGame(fullGame);
      }
    } else {
      AlertService.show(
        'Coming Soon',
        `${activeGameItem.title} is coming soon in the next update! Stay tuned for thrilling rewards!`,
        'info'
      );
    }
  };

  const handlePromoPress = () => {
    if (onPressPromo) {
      onPressPromo(activePromo);
    } else {
      AlertService.show(
        activePromo.title + ' ' + activePromo.sub,
        'Join room events and support your favorite hosts to climb the leaderboard!',
        'info'
      );
    }
  };

  return (
    <View style={[styles.container, style]} pointerEvents="box-none">
      {/* 1. TOP EVENT BANNER CARD */}
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={handlePromoPress}
        style={styles.promoTouchArea}
        accessibilityLabel={`Promotion ${activePromo.title}`}
      >
        <Animated.View style={{ opacity: promoFade }}>
          <LinearGradient
            colors={activePromo.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.promoCard}
          >
            <View style={styles.promoBadge}>
              <Text style={styles.promoBadgeText}>{activePromo.tag}</Text>
            </View>
            <Text style={styles.promoTitle} numberOfLines={1}>
              {activePromo.title}
            </Text>
            <Text style={styles.promoSub} numberOfLines={1}>
              {activePromo.sub}
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* Promo Pagination Dots */}
        <View style={styles.dotsRow}>
          {PROMO_EVENTS.map((_, i) => (
            <View
              key={`promo-dot-${i}`}
              style={[
                styles.dot,
                i === promoIdx ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>
      </TouchableOpacity>

      {/* 2. BOTTOM GAME BANNER CARD (User Video Match) */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleGamePress}
        style={styles.gameTouchArea}
        accessibilityLabel={`Game ${activeGameItem.title}`}
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

            {/* Bear Character & Tool */}
            <View style={styles.bearRow}>
              <Text style={styles.bearEmoji}>{activeGameItem.bearEmoji}</Text>
              <Text style={styles.toolEmoji}>{activeGameItem.toolEmoji}</Text>
            </View>

            {/* Slot Fruit Row */}
            <View style={styles.fruitSlotContainer}>
              <Text style={styles.fruitText}>{activeGameItem.fruitRow}</Text>
            </View>

            {/* Status or Title Pill */}
            <View
              style={[
                styles.gameTitlePill,
                !activeGameItem.available && styles.comingSoonPill,
              ]}
            >
              <Text style={styles.gameTitlePillText} numberOfLines={1}>
                {activeGameItem.available ? activeGameItem.title : 'Coming Soon'}
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Game Pagination Dots */}
        <View style={styles.dotsRow}>
          {GAME_BANNER_ITEMS.map((_, i) => (
            <View
              key={`game-dot-${i}`}
              style={[
                styles.dot,
                i === gameIdx ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>
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
  // Promo card
  promoTouchArea: {
    alignItems: 'center',
    marginBottom: 10,
  },
  promoCard: {
    width: 62,
    height: 60,
    borderRadius: 12,
    paddingHorizontal: 4,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    elevation: 6,
    shadowColor: '#FF0080',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
  },
  promoBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginBottom: 2,
  },
  promoBadgeText: {
    color: '#FFD700',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  promoTitle: {
    color: '#FFF',
    fontSize: 8.5,
    fontWeight: '800',
    textAlign: 'center',
  },
  promoSub: {
    color: '#FFDF00',
    fontSize: 8,
    fontWeight: '900',
    textAlign: 'center',
  },
  // Game card
  gameTouchArea: {
    alignItems: 'center',
  },
  gameCard: {
    width: 62,
    height: 64,
    borderRadius: 14,
    paddingHorizontal: 3,
    paddingTop: 4,
    paddingBottom: 2,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    elevation: 8,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  multiplierTag: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#FF1493',
    paddingHorizontal: 3,
    paddingVertical: 0.5,
    borderRadius: 4,
    zIndex: 10,
  },
  multiplierText: {
    color: '#FFF',
    fontSize: 7,
    fontWeight: '900',
  },
  bearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  bearEmoji: {
    fontSize: 20,
  },
  toolEmoji: {
    fontSize: 12,
    marginLeft: -2,
  },
  fruitSlotContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 5,
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginTop: -2,
  },
  fruitText: {
    fontSize: 9,
    letterSpacing: 1,
  },
  gameTitlePill: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    width: '100%',
    alignItems: 'center',
  },
  comingSoonPill: {
    backgroundColor: '#DC2626',
  },
  gameTitlePillText: {
    color: '#FFF',
    fontSize: 7.5,
    fontWeight: '900',
  },
  // Pagination Dots
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    marginTop: 4,
  },
  dot: {
    height: 3.5,
    borderRadius: 2,
  },
  dotActive: {
    width: 8,
    backgroundColor: '#FFF',
  },
  dotInactive: {
    width: 3.5,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
});
