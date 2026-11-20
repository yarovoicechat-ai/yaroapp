import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  BackHandler,
  Dimensions,
  LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GameHeader } from '../../components/game/GameHeader';
import { GreedyKingWebView } from '../../components/games/GreedyKingWebView';
import { GameLoading } from '../../components/game/GameLoading';
import { GameError } from '../../components/game/GameError';
import { gameSessionManager } from '../../components/game/GameSessionManager';
import { AuthContext } from '../../context/AuthProvider';

interface GreedyKingScreenProps {
  navigation: any;
  route: {
    params?: {
      roomId?: string;
      game?: any;
    };
  };
}

export const GreedyKingScreen: React.FC<GreedyKingScreenProps> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const { user, profile, updateCoins, fetchUserProfile } = (useContext(AuthContext) as any) || {};

  const roomId = route.params?.roomId || 'global_room';
  const game = route.params?.game || {
    id: 'greedy-king',
    gameId: 'greedy-king',
    title: 'Greedy King',
    category: 'Wheel',
    gameUrl: 'https://games.yaroapp.in/greedy-king/',
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionUrl, setSessionUrl] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [ticket, setTicket] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [dimensions, setDimensions] = useState({
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  });

  const coinsBalance = Number(
    profile?.coins ?? user?.coins ?? profile?.diamonds ?? user?.diamonds ?? user?.balance ?? 0
  );

  // Real-time synchronization of native wallet with game backend
  useEffect(() => {
    const unsubBet = gameBridge.on('BET_ACCEPTED', (payload: any) => {
      if (typeof payload?.balance === 'number' && updateCoins) {
        updateCoins(payload.balance);
      }
    });

    const unsubWin = gameBridge.on('ROUND_WIN', (payload: any) => {
      if (typeof payload?.balance === 'number' && updateCoins) {
        updateCoins(payload.balance);
      }
      fetchUserProfile?.();
    });

    const unsubRefresh = gameBridge.on('WALLET_REFRESH_REQUEST', () => {
      fetchUserProfile?.();
    });

    return () => {
      unsubBet();
      unsubWin();
      unsubRefresh();
    };
  }, [updateCoins, fetchUserProfile]);

  // Initialize game session on mount
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        setLoading(true);
        setError(null);

        const result = await gameSessionManager.launchGame({
          game,
          roomId,
          currentUser: {
            id: user?._id || user?.id || 'guest',
            name: profile?.name || user?.name || 'Player',
            diamonds: coinsBalance,
          },
        });

        if (!isMounted) return;

        if (result.success && result.sessionUrl) {
          setSessionUrl(result.sessionUrl);
          setSessionId(gameSessionManager.getSessionId());
          setTicket(gameSessionManager.getLaunchTicket());
          setLoading(false);
        } else {
          setError(result.error || 'Failed to initialize Greedy King session');
          setLoading(false);
        }
      } catch (err: any) {
        if (!isMounted) return;
        setError(err.message || 'Game initialization failed');
        setLoading(false);
      }
    }

    initSession();

    return () => {
      isMounted = false;
      // Do NOT destroy Agora RTC engine on screen unmount!
    };
  }, [roomId]);

  // Handle hardware Back button
  useEffect(() => {
    const onBackPress = () => {
      navigation.goBack();
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [navigation]);

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

  const handleClose = () => {
    navigation.goBack();
  };

  const handleMinimize = () => {
    navigation.goBack();
  };

  const handleRecharge = () => {
    navigation.navigate('Recharge');
  };

  return (
    <View onLayout={onLayout} style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0602" translucent />

      {/* Top Header */}
      <GameHeader
        game={game}
        coinsBalance={coinsBalance}
        isFullscreen={isFullscreen}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onToggleFullscreen={handleToggleFullscreen}
        onMinimize={handleMinimize}
        onClose={handleClose}
        onRecharge={handleRecharge}
      />

      {/* Game Content */}
      <View style={styles.webContainer}>
        {loading && <GameLoading />}

        {Boolean(error) && (
          <GameError
            error={error!}
            onRetry={() => {
              setError(null);
              setLoading(true);
              gameSessionManager.launchGame({
                game,
                roomId,
                currentUser: { id: user?._id || user?.id || 'guest', diamonds: coinsBalance },
              }).then(res => {
                if (res.success && res.sessionUrl) {
                  setSessionUrl(res.sessionUrl);
                  setSessionId(gameSessionManager.getSessionId());
                  setTicket(gameSessionManager.getLaunchTicket());
                  setLoading(false);
                } else {
                  setError(res.error || 'Retry failed');
                  setLoading(false);
                }
              });
            }}
            onClose={handleClose}
          />
        )}

        {!loading && !error && Boolean(sessionUrl) && (
          <GreedyKingWebView
            url={sessionUrl}
            sessionId={sessionId}
            ticket={ticket}
            isMuted={isMuted}
            isHalfScreen={!isFullscreen}
            width={dimensions.width}
            height={dimensions.height - 50}
            onClose={handleClose}
            onError={err => setError(err)}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0602',
  },
  webContainer: {
    flex: 1,
    backgroundColor: '#0D0602',
  },
});

export default GreedyKingScreen;
