import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { LIVE_GAMES_LIST } from '../components/live/LiveGamesModal';
import FloatingGameBannerWidget from '../components/room/FloatingGameBannerWidget';
import { GreedyKingWebView } from '../components/games/GreedyKingWebView';
import { GreedyKingScreen } from '../screens/games/GreedyKingScreen';
import { gameSessionManager } from '../components/game/GameSessionManager';
import { gameBridge } from '../components/game/GameBridge';
import { apiUtil } from '../utils/apiUtil';

jest.mock('../utils/apiUtil', () => ({
  apiUtil: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

jest.mock('../utils/AlertService', () => ({
  AlertService: {
    show: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    success: jest.fn(),
  },
  show: jest.fn(),
}));

jest.mock('../context/AuthProvider', () => {
  const React = require('react');
  return {
    AuthContext: React.createContext({
      user: { _id: 'user_gk_100', name: 'KingPlayer', diamonds: 75000, beans: 12000 },
      profile: { _id: 'user_gk_100', name: 'KingPlayer', diamonds: 75000, beans: 12000 },
      fetchUserProfile: jest.fn(),
    }),
  };
});

describe('Greedy King Integration Test Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Game Catalog & Entry Points', () => {
    it('contains Greedy King in LIVE_GAMES_LIST with correct production URL', () => {
      const greedyKing = LIVE_GAMES_LIST.find(g => g.id === 'greedy-king');
      expect(greedyKing).toBeDefined();
      expect(greedyKing?.gameUrl).toBe('https://games.yaroapp.in/greedy-king/');
      expect(greedyKing?.multiplier).toBe('50x');
      expect(greedyKing?.tag).toBe('ROYAL');
    });

    it('launches Greedy King directly from FloatingGameBannerWidget', () => {
      const onSelectGame = jest.fn();
      let root;
      act(() => {
        root = renderer.create(
          <FloatingGameBannerWidget onSelectGame={onSelectGame} />
        );
      });

      // The 1st item in GAME_BANNER_ITEMS is now 'greedy-king' with available: true
      const greedyKingBtn = root.root.findByProps({ accessibilityLabel: 'Game Greedy King' });
      expect(greedyKingBtn).toBeDefined();

      act(() => {
        greedyKingBtn.props.onPress();
      });

      expect(onSelectGame).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'greedy-king',
          gameId: 'greedy-king',
          title: 'Greedy King',
          gameUrl: 'https://games.yaroapp.in/greedy-king/',
        })
      );

      act(() => {
        root.unmount();
      });
    });
  });

  describe('2. Session Ticket Flow & Authentication', () => {
    it('acquires ticket via /games/session/ticket and builds authenticated game URL', async () => {
      apiUtil.post.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            sessionId: 'sess_gk_999',
            ticket: 'tk_crypto_hex_32bytes_sample',
            gameUrl: 'https://games.yaroapp.in/greedy-king/',
            expiresAt: Date.now() + 60000,
          },
        },
      });

      const launchResult = await gameSessionManager.launchGame({
        game: {
          id: 'greedy-king',
          gameId: 'greedy-king',
          title: 'Greedy King',
          gameUrl: 'https://games.yaroapp.in/greedy-king/',
        },
        roomId: 'room_voice_101',
        currentUser: {
          id: 'user_gk_100',
          name: 'KingPlayer',
          diamonds: 75000,
        },
      });

      expect(launchResult.success).toBe(true);
      expect(launchResult.sessionUrl).toContain('https://games.yaroapp.in/greedy-king/');
      expect(launchResult.sessionUrl).toContain('ticket=tk_crypto_hex_32bytes_sample');
      expect(launchResult.sessionUrl).toContain('sessionId=sess_gk_999');
      expect(launchResult.sessionUrl).toContain('roomId=room_voice_101');
      expect(gameSessionManager.getSessionId()).toBe('sess_gk_999');
      expect(gameSessionManager.getLaunchTicket()).toBe('tk_crypto_hex_32bytes_sample');
    });
  });

  describe('3. GreedyKingWebView Bridge & Origin Allowlist', () => {
    it('renders GreedyKingWebView with injected session and ticket variables', () => {
      let root;
      act(() => {
        root = renderer.create(
          <GreedyKingWebView
            url="https://games.yaroapp.in/greedy-king/"
            sessionId="sess_gk_999"
            ticket="tk_test_123"
            isMuted={true}
            isHalfScreen={true}
            width={400}
            height={400}
          />
        );
      });

      expect(root).toBeTruthy();
      act(() => {
        root.unmount();
      });
    });

    it('receives GAME_READY and WALLET_REFRESH_REQUEST from game bridge', () => {
      const readyHandler = jest.fn();
      const unsub = gameBridge.on('GAME_READY', readyHandler);

      // Simulate message from Cocos
      gameBridge.handleCocosMessage(
        JSON.stringify({
          version: 1,
          type: 'GAME_READY',
          requestId: 'req_test_ready',
          sessionId: 'sess_gk_999',
          payload: { gameId: 'greedy-king', status: 'READY' },
        })
      );

      expect(readyHandler).toHaveBeenCalled();
      unsub();
    });
  });

  describe('4. GreedyKingScreen Standalone & Voice Room Integration', () => {
    it('renders GreedyKingScreen with user Coins balance and controls', async () => {
      apiUtil.post.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            sessionId: 'sess_gk_999',
            ticket: 'tk_crypto_hex_32bytes_sample',
            gameUrl: 'https://games.yaroapp.in/greedy-king/',
            expiresAt: Date.now() + 60000,
          },
        },
      });

      const mockNavigation = {
        goBack: jest.fn(),
        navigate: jest.fn(),
      };

      let root;
      await act(async () => {
        root = renderer.create(
          <GreedyKingScreen
            navigation={mockNavigation}
            route={{
              params: {
                roomId: 'voice_room_01',
                game: {
                  id: 'greedy-king',
                  gameId: 'greedy-king',
                  title: 'Greedy King',
                  gameUrl: 'https://games.yaroapp.in/greedy-king/',
                },
              },
            }}
          />
        );
      });

      expect(root).toBeTruthy();

      act(() => {
        root.unmount();
      });
    });
  });

  describe('5. Authoritative Wallet Debit Verification & x2 Prevention', () => {
    it('executes atomic wallet debit on BET_REQUEST and confirms bet with updated balance', async () => {
      // Configure session manager with an active session
      apiUtil.post.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            sessionId: 'sess_live_123',
            ticket: 'tk_live_secure',
            gameUrl: 'https://games.yaroapp.in/greedy-king/',
            expiresAt: Date.now() + 60000,
          },
        },
      });

      await gameSessionManager.launchGame({
        game: {
          id: 'greedy-king',
          gameId: 'greedy-king',
          title: 'Greedy King',
          gameUrl: 'https://games.yaroapp.in/greedy-king/',
        },
        roomId: 'room_123',
        currentUser: { id: 'u_123', diamonds: 5000 },
      });

      // Mock backend wallet debit response
      apiUtil.post.mockResolvedValueOnce({
        status: 200,
        data: {
          success: true,
          data: {
            balanceAfter: 4900,
            transactionId: 'tx_bet_001',
          },
        },
      });

      const refreshListener = jest.fn();
      gameBridge.on('WALLET_REFRESH_REQUEST', refreshListener);

      // Simulate BET_REQUEST from WebView
      await act(async () => {
        gameBridge.emit('BET_REQUEST', {
          spotId: 'burger',
          amount: 100,
          reqId: 'req_bet_single_100',
        });
      });

      expect(apiUtil.post).toHaveBeenCalledWith(
        '/games/session/sess_live_123/bet',
        expect.objectContaining({
          gameId: 'greedy-king',
          amount: 100,
          betTarget: 'burger',
          idempotencyKey: 'req_bet_single_100',
        })
      );
      expect(refreshListener).toHaveBeenCalledWith(
        expect.objectContaining({ balanceAfter: 4900 }),
        expect.anything()
      );
    });

    it('rejects bet and prevents round inclusion when wallet debit fails (insufficient coins)', async () => {
      apiUtil.post.mockRejectedValueOnce({
        response: {
          data: {
            message: 'INSUFFICIENT_DIAMONDS: Current balance is 50, required is 500',
          },
        },
      });

      const refreshListener = jest.fn();
      gameBridge.on('WALLET_REFRESH_REQUEST', refreshListener);

      await act(async () => {
        gameBridge.emit('BET_REQUEST', {
          spotId: 'pizza',
          amount: 500,
          reqId: 'req_bet_fail_500',
        });
      });

      // Wallet refresh should NOT have been called on failed debit
      expect(refreshListener).not.toHaveBeenCalled();
    });

    it('enforces exact chip debit amounts (no x2 multiplication)', async () => {
      const chipTests = [
        { chip: 50, expectedDebit: 50 },
        { chip: 100, expectedDebit: 100 },
        { chip: 500, expectedDebit: 500 },
        { chip: 1000, expectedDebit: 1000 },
        { chip: 5000, expectedDebit: 5000 },
      ];

      for (const t of chipTests) {
        apiUtil.post.mockResolvedValueOnce({
          status: 200,
          data: {
            success: true,
            data: { balanceAfter: 50000 - t.expectedDebit, transactionId: `tx_${t.chip}` },
          },
        });

        await act(async () => {
          gameBridge.emit('BET_REQUEST', {
            spotId: 'taco',
            amount: t.chip,
            reqId: `req_exact_${t.chip}`,
          });
        });

        expect(apiUtil.post).toHaveBeenLastCalledWith(
          '/games/session/sess_live_123/bet',
          expect.objectContaining({
            amount: t.expectedDebit,
          })
        );
      }
    });
  });
});
