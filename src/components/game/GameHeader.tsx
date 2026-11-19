import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon from 'react-native-vector-icons/Ionicons';
import { GameMetadata } from './GameSessionManager';

interface GameHeaderProps {
  game: GameMetadata | null;
  coinsBalance: number;
  isFullscreen: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  onMinimize: () => void;
  onClose: () => void;
  onRecharge?: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  game,
  coinsBalance,
  isFullscreen,
  isMuted,
  onToggleMute,
  onToggleFullscreen,
  onMinimize,
  onClose,
  onRecharge,
}) => {
  return (
    <View style={styles.headerContainer}>
      {/* Left: Game Icon + Title */}
      <View style={styles.leftSection}>
        <LinearGradient
          colors={game?.gradient || ['#FF007F', '#7928CA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconBadge}
        >
          <MaterialCommunityIcons
            name={game?.icon || 'gamepad-variant'}
            size={16}
            color="#FFFFFF"
          />
        </LinearGradient>
        <View style={styles.titleWrap}>
          <Text style={styles.gameTitle} numberOfLines={1}>
            {game?.title || 'Live Game'}
          </Text>
          <View style={styles.badgeRow}>
            <Text style={styles.engineTag}>Cocos 3.8.x</Text>
          </View>
        </View>
      </View>

      {/* Center: Coins Balance Badge (Spending Currency) */}
      <TouchableOpacity
        onPress={onRecharge}
        activeOpacity={0.8}
        style={styles.balanceBadge}
        accessibilityLabel="Coins Balance"
      >
        <Text style={styles.coinIcon}>🪙</Text>
        <Text style={styles.balanceAmount}>{coinsBalance.toLocaleString()}</Text>
        {Boolean(onRecharge) && (
          <View style={styles.addIconWrap}>
            <Icon name="add" size={11} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>

      {/* Right Actions: Mute Audio, Minimize, Fullscreen, Close */}
      <View style={styles.actionsSection}>
        <TouchableOpacity
          onPress={onToggleMute}
          style={styles.actionBtn}
          accessibilityLabel={isMuted ? 'Unmute Game' : 'Mute Game'}
        >
          <MaterialCommunityIcons
            name={isMuted ? 'volume-variant-off' : 'volume-high'}
            size={18}
            color={isMuted ? '#94A3B8' : '#38BDF8'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onToggleFullscreen}
          style={styles.actionBtn}
          accessibilityLabel={isFullscreen ? 'Restore Half Screen' : 'Fullscreen'}
        >
          <MaterialCommunityIcons
            name={isFullscreen ? 'arrow-collapse' : 'arrow-expand'}
            size={17}
            color="#E2E8F0"
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onMinimize}
          style={styles.actionBtn}
          accessibilityLabel="Minimize Game"
        >
          <Icon name="remove-outline" size={18} color="#E2E8F0" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onClose}
          style={[styles.actionBtn, styles.closeBtn]}
          accessibilityLabel="Close Game"
        >
          <Icon name="close" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 6,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  titleWrap: {
    flexShrink: 1,
  },
  gameTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  engineTag: {
    fontSize: 9,
    fontWeight: '700',
    color: '#00F0FF',
    textTransform: 'uppercase',
  },
  balanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginHorizontal: 6,
  },
  coinIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  balanceAmount: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFD700',
  },
  addIconWrap: {
    marginLeft: 4,
    backgroundColor: '#FF007F',
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
});
