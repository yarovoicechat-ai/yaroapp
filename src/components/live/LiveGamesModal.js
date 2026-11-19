import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

export const LIVE_GAMES_LIST = [
  {
    id: 'greedy-baby',
    title: 'Greedy Baby',
    subtitle: 'Fruit Wheel 50x Multiplier',
    description: 'Cocos Creator HTML5 fruit wheel with instant coin rewards!',
    icon: 'fruit-cherries',
    category: 'Wheel',
    tag: 'COCOS',
    tagColor: '#FF1493',
    multiplier: '50x',
    players: '3.8k',
    gradient: ['#FF416C', '#FF4B2B'],
    gameUrl: 'https://api.yaroapp.in/games/greedy-baby/index.html',
  },
  {
    id: 'lucky-wheel',
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
    gameUrl: 'https://api.yaroapp.in/games/lucky-wheel/index.html',
  },
  {
    id: 'teen-patti',
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
    gameUrl: 'https://api.yaroapp.in/games/teen-patti/index.html',
  },
  {
    id: 'lucky-7',
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
    gameUrl: 'https://api.yaroapp.in/games/lucky-7/index.html',
  },
  {
    id: 'crash',
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
    gameUrl: 'https://api.yaroapp.in/games/crash/index.html',
  },
  {
    id: 'ludo',
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
    gameUrl: 'https://api.yaroapp.in/games/ludo/index.html',
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
}) {
  const [selectedCategory, setSelectedCategory] = useState('All');

  if (!visible) return null;

  const filteredGames = LIVE_GAMES_LIST.filter(game => {
    if (selectedCategory === 'All') return true;
    if (selectedCategory === 'Hot') return game.tag === 'HOT' || game.tag === 'POPULAR';
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
                <Text style={styles.sheetTitle}>Live Game Center</Text>
                <Text style={styles.sheetSubtitle}>Play inside live room in half screen</Text>
              </View>
            </View>

            <View style={styles.headerRight}>
              {/* Coin Balance Chip */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onRecharge}
                style={styles.coinBalanceChip}
              >
                <Text style={styles.coinIcon}>🪙</Text>
                <Text style={styles.coinAmount}>
                  {Number(coinBalance || 0).toLocaleString()}
                </Text>
                <View style={styles.rechargePlus}>
                  <Text style={styles.rechargePlusText}>+</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
                accessibilityLabel="Close Games"
              >
                <Icon name="close" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Category Tabs */}
          <View style={styles.categoryTabsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryTabsContent}>
              {CATEGORIES.map(category => {
                const isActive = selectedCategory === category;
                return (
                  <TouchableOpacity
                    key={category}
                    activeOpacity={0.8}
                    onPress={() => setSelectedCategory(category)}
                    style={[styles.categoryTab, isActive && styles.categoryTabActive]}
                  >
                    <Text style={[styles.categoryTabText, isActive && styles.categoryTabTextActive]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Games List */}
          <ScrollView
            style={styles.gamesList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.gamesListContent}
          >
            {filteredGames.map(game => (
              <TouchableOpacity
                key={game.id}
                activeOpacity={0.85}
                onPress={() => {
                  onSelectGame(game);
                  onClose();
                }}
                style={styles.gameCard}
              >
                <LinearGradient
                  colors={game.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gameCardIconContainer}
                >
                  <MaterialCommunityIcons name={game.icon} size={32} color="#FFFFFF" />
                  <View style={[styles.gameCardTag, { backgroundColor: game.tagColor }]}>
                    <Text style={styles.gameCardTagText}>{game.tag}</Text>
                  </View>
                </LinearGradient>

                <View style={styles.gameCardDetails}>
                  <View style={styles.gameCardTitleRow}>
                    <Text style={styles.gameCardTitle}>{game.title}</Text>
                    <View style={styles.multiplierBadge}>
                      <Text style={styles.multiplierText}>{game.multiplier}</Text>
                    </View>
                  </View>
                  <Text style={styles.gameCardSubtitle} numberOfLines={1}>
                    {game.subtitle}
                  </Text>
                  <View style={styles.gameCardMetaRow}>
                    <View style={styles.playersBadge}>
                      <Text style={styles.playersDot}>●</Text>
                      <Text style={styles.playersText}>{game.players} playing</Text>
                    </View>
                    <Text style={styles.gameCardFeatureText}>Instant Payout</Text>
                  </View>
                </View>

                {/* Play Button */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    onSelectGame(game);
                    onClose();
                  }}
                  style={styles.playButton}
                >
                  <LinearGradient
                    colors={['#FF6B00', '#FF1493']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.playButtonGradient}
                  >
                    <Text style={styles.playButtonText}>Play</Text>
                    <Icon name="play" size={12} color="#FFF" />
                  </LinearGradient>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#12101F',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    maxHeight: '80%',
    minHeight: 460,
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
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
    backgroundColor: 'rgba(255,215,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  sheetSubtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coinBalanceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,215,0,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
    gap: 4,
  },
  coinIcon: {
    fontSize: 13,
  },
  coinAmount: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '700',
  },
  rechargePlus: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  rechargePlusText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 13,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTabsContainer: {
    paddingVertical: 10,
  },
  categoryTabsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  categoryTabActive: {
    backgroundColor: '#FF1493',
  },
  categoryTabText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '600',
  },
  categoryTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  gamesList: {
    flex: 1,
  },
  gamesListContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 12,
  },
  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  gameCardIconContainer: {
    width: 62,
    height: 62,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  gameCardTag: {
    position: 'absolute',
    top: -5,
    right: -5,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  gameCardTagText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
  },
  gameCardDetails: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  gameCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gameCardTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  multiplierBadge: {
    backgroundColor: 'rgba(255,215,0,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.4)',
  },
  multiplierText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '800',
  },
  gameCardSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 2,
  },
  gameCardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 10,
  },
  playersBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  playersDot: {
    color: '#00E676',
    fontSize: 8,
  },
  playersText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '500',
  },
  gameCardFeatureText: {
    color: '#FF80AB',
    fontSize: 11,
    fontWeight: '600',
  },
  playButton: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  playButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 4,
  },
  playButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
