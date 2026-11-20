import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  BackHandler,
  Dimensions,
  LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GameHeader } from './GameHeader';
import { GameWebView } from './GameWebView';
import { GameControls } from './GameControls';
import { GameMetadata, gameSessionManager } from './GameSessionManager';
import { gameBridge } from './GameBridge';

interface GameContainerProps {
  game: GameMetadata | null;
  sessionUrl: string;
  sessionId: string;
  ticket: string;
  coinsBalance: number; // Spending Currency: Coins
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
  onClose,
  onMinimize,
  onRecharge,
  onRefreshBalance,
}) => {
  const insets = useSafeAreaInsets();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Default game audio to muted so Agora voice is uninterrupted
  const [dimensions, setDimensions] = useState({
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.5,
  });

  // Handle hardware Back button on Android
  useEffect(() => {
    const onBackPress = () => {
      if (isFullscreen) {
        setIsFullscreen(false);
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
  }, [isFullscreen, onMinimize]);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setDimensions({ width, height });
  }, []);

  const handleToggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
  };

  const handleToggleMute = () => {
    setIsMuted(prev => !prev);
  };

  const handleClearBets = () => {
    gameBridge.sendToCocos('UPDATE_SETTINGS', { action: 'CLEAR_BETS' });
  };

  return (
    <View
      onLayout={onLayout}
      style={[
        styles.container,
        isFullscreen ? [styles.fullscreen, { paddingTop: insets.top }] : styles.halfScreen,
      ]}
    >
      {/* 1. Game Top Header */}
      <GameHeader
        game={game}
        coinsBalance={coinsBalance}
        isFullscreen={isFullscreen}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onToggleFullscreen={handleToggleFullscreen}
        onMinimize={onMinimize}
        onClose={onClose}
        onRecharge={onRecharge}
      />

      {/* 2. Reusable Cocos Creator WebView - Takes full available height without clipping */}
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
  },
  fullscreen: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    elevation: 50,
  },
  webContainer: {
    flex: 1,
    backgroundColor: '#0B0716',
  },
});
