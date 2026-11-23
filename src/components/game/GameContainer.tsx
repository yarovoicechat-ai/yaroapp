import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  BackHandler,
  Dimensions,
  LayoutChangeEvent,
  TouchableOpacity,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GameWebView } from './GameWebView';
import { GameMetadata } from './GameSessionManager';

export interface GameContainerProps {
  game: GameMetadata | null;
  sessionUrl: string;
  sessionId: string;
  ticket: string;
  coinsBalance: number; // Spending Currency: Coins
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onRecharge?: () => void;
  onRefreshBalance?: () => void;
}

export const GameContainer: React.FC<GameContainerProps> = ({
  game,
  sessionUrl,
  sessionId,
  ticket,
  coinsBalance,
  isFullscreen: externalIsFullscreen,
  onToggleFullscreen,
  onClose,
  onMinimize,
  onRecharge,
  onRefreshBalance,
}) => {
  const insets = useSafeAreaInsets();
  const [internalFullscreen, setInternalFullscreen] = useState(false);
  const isFullscreen = externalIsFullscreen !== undefined ? externalIsFullscreen : internalFullscreen;
  const [isMuted, setIsMuted] = useState(true); // Default game audio to muted so Agora voice is uninterrupted
  const [dimensions, setDimensions] = useState({
    width: Dimensions.get('window').width,
    height: Math.round(Dimensions.get('window').height * 0.70),
  });

  const isGreedyKing = game?.id === 'greedy-king' || game?.gameId === 'greedy-king';

  // Handle hardware Back button on Android
  useEffect(() => {
    const onBackPress = () => {
      if (isFullscreen) {
        if (onToggleFullscreen) {
          onToggleFullscreen();
        } else {
          setInternalFullscreen(false);
        }
        return true;
      }
      onMinimize();
      return true;
    };

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    );
    return () => subscription.remove();
  }, [isFullscreen, onMinimize, onToggleFullscreen]);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setDimensions({ width, height });
    }
  }, []);

  const handleToggleFullscreen = () => {
    if (onToggleFullscreen) {
      onToggleFullscreen();
    } else {
      setInternalFullscreen(prev => !prev);
    }
  };

  const handleToggleMute = () => {
    setIsMuted(prev => !prev);
  };

  return (
    <View
      onLayout={onLayout}
      style={[
        styles.container,
        isFullscreen ? [styles.fullscreen, { paddingTop: insets.top }] : styles.halfScreen,
      ]}
    >
      {/* 1. Header Bar: Drag Pill, Title/Icon, Coins Badge + Quick Recharge, Mute, Fullscreen, Minimize, Close */}
      <View style={styles.headerBar}>
        {/* Centered Drag Handle Pill */}
        <View style={styles.dragPillWrap}>
          <View style={styles.dragPill} />
        </View>

        <View style={styles.headerRow}>
          {/* Left: Game Title & Icon */}
          <View style={styles.leftSection}>
            <View style={styles.iconBadge}>
              <MaterialCommunityIcons
                name={isGreedyKing ? 'crown' : ((game as any)?.icon || 'gamepad-variant')}
                size={16}
                color="#FFD700"
              />
            </View>
            <Text style={styles.gameTitle} numberOfLines={1}>
              {game?.title || 'Greedy King'}
            </Text>
          </View>

          {/* Center: Coin Balance + Recharge Button */}
          <TouchableOpacity
            style={styles.balanceBadge}
            onPress={onRecharge}
            activeOpacity={0.8}
            accessibilityLabel="Recharge Coins"
          >
            <Text style={styles.coinIcon}>🪙</Text>
            <Text style={styles.balanceText}>
              {Number(coinsBalance || 0).toLocaleString()}
            </Text>
            <View style={styles.plusIconWrap}>
              <MaterialCommunityIcons name="plus" size={11} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          {/* Right Actions: Mute Toggle, Fullscreen Toggle, Minimize, Close */}
          <View style={styles.rightActions}>
            <TouchableOpacity
              onPress={handleToggleMute}
              style={styles.circleActionBtn}
              accessibilityLabel={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              <MaterialCommunityIcons
                name={isMuted ? 'volume-off' : 'volume-high'}
                size={16}
                color={isMuted ? '#94A3B8' : '#00F0FF'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleToggleFullscreen}
              style={styles.circleActionBtn}
              accessibilityLabel={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              <MaterialCommunityIcons
                name={isFullscreen ? 'fullscreen-exit' : 'fullscreen'}
                size={16}
                color="#94A3B8"
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onMinimize}
              style={styles.circleActionBtn}
              accessibilityLabel="Minimize Game"
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              <MaterialCommunityIcons name="minus" size={17} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClose}
              style={[styles.circleActionBtn, styles.closeBtn]}
              accessibilityLabel="Close Game"
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              <MaterialCommunityIcons name="close" size={17} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 2. Reusable Cocos Creator WebView - Fits bottom-sheet container seamlessly */}
      <View style={styles.webContainer}>
        <GameWebView
          url={sessionUrl}
          sessionId={sessionId}
          ticket={ticket}
          isMuted={isMuted}
          isHalfScreen={!isFullscreen}
          width={dimensions.width}
          height={dimensions.height}
          onClose={onClose}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0B0716',
    overflow: 'hidden',
    zIndex: 100,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  halfScreen: {
    flex: 1,
    width: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  fullscreen: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    elevation: 50,
  },
  headerBar: {
    backgroundColor: '#0E0A1A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 6,
    paddingBottom: 6,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  dragPillWrap: {
    alignItems: 'center',
    marginBottom: 4,
  },
  dragPill: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  iconBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
    maxWidth: 95,
  },
  balanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.35)',
    borderRadius: 12,
    paddingHorizontal: 7,
    paddingVertical: 2,
    gap: 4,
    marginHorizontal: 4,
  },
  coinIcon: {
    fontSize: 11,
  },
  balanceText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFD700',
  },
  plusIconWrap: {
    backgroundColor: '#10B981',
    borderRadius: 6,
    width: 13,
    height: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  circleActionBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  webContainer: {
    flex: 1,
    backgroundColor: '#0B0716',
  },
});
