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

export const GameHeader: React.FC<GameHeaderProps> = () => {
  // Redundant React Native toolbar removed to match authentic reference video.
  // The Cocos/HTML5 game renders its own top balance, audio mute, and close controls.
  return null;
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
