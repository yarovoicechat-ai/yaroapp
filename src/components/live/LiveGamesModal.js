import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon from 'react-native-vector-icons/Ionicons';
import { apiUtil } from '../../utils/apiUtil';

const { width } = Dimensions.get('window');

export const LIVE_GAMES_LIST = [
  {
    id: 'greedy-king',
    gameId: 'greedy-king',
    title: 'Greedy King',
    subtitle: 'King Fruit Wheel & Royal 50x Multiplier',
    description: 'Yaro Greedy King with instant royal coin rewards & multiplayer live wheel!',
    icon: 'crown',
    badgeImage: require('../../assets/icons/greedy_king_badge.png'),
    category: 'Wheel',
    tag: 'ROYAL',
    tagColor: '#FFD700',
    multiplier: '50x',
    players: '5.2k',
    gradient: ['#F59E0B', '#EF4444', '#7C3AED'],
    gameUrl: 'https://games.yaroapp.in/greedy-king/',
  },
  {
    id: 'lucky-wheel',
    gameId: 'lucky-wheel',
    title: 'Lucky Wheel',
    subtitle: 'Colors & Multipliers',
    description: 'Cocos Creator Web wheel with 36x multipliers & live stats!',
    icon: 'tire',
    category: 'Wheel',
    tag: 'COCOS',
    tagColor: '#FFB800',
    multiplier: '36x',
    players: '2.5k',
    gradient: ['#8A2387', '#E94057', '#F27121'],
    gameUrl: 'https://games.yaroapp.in/lucky-wheel/',
  },
  {
    id: 'teen-patti',
    gameId: 'teen-patti',
    title: 'Teen Patti Live',
    subtitle: 'Player A vs Player B Cards',
    description: 'Cocos 2D 3-card table round with live predictions & odds!',
    icon: 'cards-playing-outline',
    category: 'Casino',
    tag: 'COCOS',
    tagColor: '#00E676',
    multiplier: '10x',
    players: '2.1k',
    gradient: ['#11998e', '#38ef7d'],
    gameUrl: 'https://games.yaroapp.in/teen-patti/',
  },
  {
    id: 'lucky-7',
    gameId: 'lucky-7',
    title: 'Lucky 7',
    subtitle: '7 Down · Lucky 7 · 7 Up',
    description: 'Cocos Web dice game! Predict 7 Down, Lucky 7, or 7 Up.',
    icon: 'dice-6',
    category: 'Casual',
    tag: 'COCOS',
    tagColor: '#2979FF',
    multiplier: '6x',
    players: '1.9k',
    gradient: ['#1A2980', '#26D0CE'],
    gameUrl: 'https://games.yaroapp.in/lucky-7/',
  },
  {
    id: 'crash',
    gameId: 'crash',
    title: 'Crash (Rocket)',
    subtitle: 'Cash Out Before Blast!',
    description: 'Cocos Creator rocket crash curve with real-time cashout!',
    icon: 'rocket-launch',
    category: 'Casual',
    tag: 'COCOS',
    tagColor: '#FF6D00',
    multiplier: '100x',
    players: '1.4k',
    gradient: ['#FF512F', '#DD2476'],
    gameUrl: 'https://games.yaroapp.in/crash/',
  },
  {
    id: 'ludo',
    gameId: 'ludo',
    title: 'Ludo Party',
    subtitle: 'Quick Dice Board Race',
    description: 'Cocos Creator multiplayer Ludo board game in half screen!',
    icon: 'grid-large',
    category: 'Casual',
    tag: 'COCOS',
    tagColor: '#AA00FF',
    multiplier: '4x',
    players: '960',
    gradient: ['#654ea3', '#eaafc8'],
    gameUrl: 'https://games.yaroapp.in/ludo/',
  },
];

const CATEGORIES = ['All', 'Hot', 'Wheel', 'Casino', 'Casual'];

export default function LiveGamesModal({
  visible,
  onClose,
  onSelectGame,
  coinBalance = 0,
  onRecharge,
  bottomPadding = 16,
  roomType = 'voice', // 'voice' | 'live'
}) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [gameConfig, setGameConfig] = useState(null);

  useEffect(() => {
    let isMounted = true;
    if (visible) {
      apiUtil
        .get('/games/config')
        .then((res) => {
          if (isMounted && res?.data?.data) {
            setGameConfig(res.data.data);
          }
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [visible]);

  if (!visible) return null;

  // Check server configuration for game visibility
  const gkConfig = gameConfig?.greedyKing;
  const isGkHidden = gkConfig
    ? Boolean(
        gkConfig.isHidden ||
        gkConfig.isActive === false ||
        (roomType === 'voice' && gkConfig.showInVoiceRoom === false) ||
        (roomType === 'live' && gkConfig.showInLiveRoom === false)
      )
    : false;

  const activeGames = isGkHidden
    ? []
    : LIVE_GAMES_LIST.filter(game => game.id === 'greedy-king');
  const filteredGames = activeGames.filter(game => {
    if (selectedCategory === 'All' || selectedCategory === 'Hot' || selectedCategory === 'Wheel') return true;
    return game.category === selectedCategory;
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={[styles.sheetContainer, { paddingBottom: bottomPadding + 14 }]}>
          {/* Sheet Handle */}
          <View style={styles.sheetHandle} />

          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconCircle}>
                <MaterialCommunityIcons name="gamepad-variant" size={24} color="#FFD700" />
              </View>
              <View>
                <Text style={styles.sheetTitle}>Game Center</Text>
                <Text style={styles.sheetSubtitle}>Play & Win Real Coins!</Text>
              </View>
            </View>

            {/* User Coin Balance Badge */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onRecharge}
              style={styles.balanceBadge}
            >
              <Text style={styles.coinIcon}>🪙</Text>
              <Text style={styles.balanceText}>{coinBalance.toLocaleString()}</Text>
              <View style={styles.plusIconWrap}>
                <Icon name="add" size={12} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Category Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {CATEGORIES.map(category => {
              const isSelected = selectedCategory === category;
              return (
                <TouchableOpacity
                  key={category}
                  onPress={() => setSelectedCategory(category)}
                  activeOpacity={0.8}
                  style={[
                    styles.categoryChip,
                    isSelected && styles.categoryChipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      isSelected && styles.categoryTextSelected,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Games Grid / Cards */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.gamesListScroll}
          >
            {filteredGames.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="gamepad-variant-outline" size={54} color="rgba(255,255,255,0.3)" />
                <Text style={styles.emptyTitle}>Games Currently Unavailable</Text>
                <Text style={styles.emptySubtitle}>
                  Games are temporarily closed by management. Please check back later!
                </Text>
              </View>
            ) : (
              filteredGames.map(game => (
                <TouchableOpacity
                  key={game.id}
                  activeOpacity={0.88}
                  onPress={() => {
                    onClose();
                    onSelectGame(game);
                  }}
                  style={styles.gameCard}
                >
                  <LinearGradient
                    colors={game.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gameCardGradient}
                  >
                    {/* Left Icon Area: Shows User's Official Royal Crowned Cat Badge */}
                    <View style={styles.gameIconCol}>
                      <View style={styles.gameIconCircle}>
                        {game.badgeImage ? (
                          <Image
                            source={game.badgeImage}
                            style={styles.gameBadgeImage}
                            resizeMode="contain"
                          />
                        ) : (
                          <MaterialCommunityIcons
                            name={game.icon}
                            size={28}
                            color="#FFFFFF"
                          />
                        )}
                      </View>
                      <View style={[styles.gameTagBadge, { backgroundColor: game.tagColor }]}>
                        <Text style={styles.gameTagText}>{game.tag}</Text>
                      </View>
                    </View>

                    {/* Middle Info */}
                    <View style={styles.gameInfoCol}>
                      <View style={styles.titleMultiplierRow}>
                        <Text style={styles.gameCardTitle} numberOfLines={1}>
                          {game.title}
                        </Text>
                        <View style={styles.multiplierBadge}>
                          <Text style={styles.multiplierText}>{game.multiplier}</Text>
                        </View>
                      </View>
                      <Text style={styles.gameCardSubtitle} numberOfLines={1}>
                        {game.subtitle}
                      </Text>
                      <Text style={styles.gameCardDesc} numberOfLines={2}>
                        {game.description}
                      </Text>

                      <View style={styles.playersRow}>
                        <MaterialCommunityIcons name="account-group" size={13} color="rgba(255,255,255,0.7)" />
                        <Text style={styles.playersText}>{game.players} playing now</Text>
                      </View>
                    </View>

                    {/* Right Play Arrow */}
                    <View style={styles.playBtnCol}>
                      <View style={styles.playCircleBtn}>
                        <Icon name="play" size={18} color="#0F172A" />
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  sheetSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  balanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  coinIcon: {
    fontSize: 13,
    marginRight: 4,
  },
  balanceText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFD700',
  },
  plusIconWrap: {
    marginLeft: 6,
    backgroundColor: '#FF007F',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 14,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  categoryChipSelected: {
    backgroundColor: '#FF007F',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  categoryTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  gamesListScroll: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  gameCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
  },
  gameCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  gameIconCol: {
    alignItems: 'center',
    marginRight: 12,
  },
  gameIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    overflow: 'hidden',
  },
  gameBadgeImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  gameTagBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  gameTagText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  gameInfoCol: {
    flex: 1,
    marginRight: 8,
  },
  titleMultiplierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  gameCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    flex: 1,
  },
  multiplierBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  multiplierText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFD700',
  },
  gameCardSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 2,
  },
  gameCardDesc: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 14,
    marginBottom: 4,
  },
  playersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  playersText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  playBtnCol: {
    justifyContent: 'center',
  },
  playCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 18,
  },
});
