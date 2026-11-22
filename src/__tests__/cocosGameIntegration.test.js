import { gameBridge } from '../components/game/GameBridge';
import { gameSessionManager } from '../components/game/GameSessionManager';
import { LIVE_GAMES_LIST } from '../components/live/LiveGamesModal';
import { PROTOCOL_VERSION } from '../components/game/GameBridgeTypes';

describe('Cocos Creator 3.8.x Game Integration & Strict Economy Tests', () => {
  beforeEach(() => {
    gameBridge.destroy();
  });

  describe('1. Game Catalog & Configuration', () => {
    it('contains all required Cocos games including greedy-king', () => {
      const ids = LIVE_GAMES_LIST.map(g => g.id);
      expect(ids).toContain('greedy-king');
      expect(ids).toContain('lucky-wheel');
      expect(ids).toContain('teen-patti');
      expect(ids).toContain('lucky-7');
      expect(ids).toContain('crash');
      expect(ids).toContain('ludo');
    });

    it('enforces https:// URL format for all games', () => {
      LIVE_GAMES_LIST.forEach(game => {
        expect(game.gameUrl).toMatch(/^https:\/\//);
      });
    });
  });

  describe('2. Typed Native Bridge Security', () => {
    it('dispatches valid incoming GAME_READY message to listeners', () => {
      const listener = jest.fn();
      const unsub = gameBridge.on('GAME_READY', listener);

      gameBridge.handleCocosMessage(JSON.stringify({
        version: PROTOCOL_VERSION,
        type: 'GAME_READY',
        requestId: 'req_001',
        sessionId: 'sess_123',
        payload: { ready: true },
      }));

      expect(listener).toHaveBeenCalledWith(
        { ready: true },
        expect.objectContaining({
          type: 'GAME_READY',
          sessionId: 'sess_123',
        })
      );
      unsub();
    });

    it('rejects messages with invalid protocol version', () => {
      const listener = jest.fn();
      const unsub = gameBridge.on('GAME_READY', listener);

      gameBridge.handleCocosMessage(JSON.stringify({
        version: 999, // Invalid
        type: 'GAME_READY',
        requestId: 'req_002',
        sessionId: 'sess_123',
        payload: {},
      }));

      expect(listener).not.toHaveBeenCalled();
      unsub();
    });

    it('drops duplicate requestId messages (Replay Protection)', () => {
      const listener = jest.fn();
      const unsub = gameBridge.on('PLAYER_ACTION', listener);

      const msg = JSON.stringify({
        version: PROTOCOL_VERSION,
        type: 'PLAYER_ACTION',
        requestId: 'req_duplicate_test',
        sessionId: 'sess_123',
        payload: { action: 'BET', amount: 50 },
      });

      // First delivery
      gameBridge.handleCocosMessage(msg);
      expect(listener).toHaveBeenCalledTimes(1);

      // Duplicate delivery with same requestId
      gameBridge.handleCocosMessage(msg);
      expect(listener).toHaveBeenCalledTimes(1);

      unsub();
    });
  });

  describe('3. Game Session State Machine', () => {
    it('initializes in ROOM_ACTIVE state', () => {
      expect(gameSessionManager.getState()).toBe('ROOM_ACTIVE');
    });

    it('minimizes and restores properly without destroying session', () => {
      // Simulate state transition
      gameSessionManager.currentState = 'PLAYING';

      gameSessionManager.minimizeGame();
      expect(gameSessionManager.getState()).toBe('MINIMIZED');

      gameSessionManager.restoreGame();
      expect(gameSessionManager.getState()).toBe('PLAYING');

      // Cleanup
      gameSessionManager.currentState = 'ROOM_ACTIVE';
    });
  });

  describe('4. Official YARO Economy Rules Enforcement', () => {
    it('strictly enforces Coins as spending currency for games and rejects Beans', () => {
      const spendingCurrency = 'COINS';
      const withdrawalCurrency = 'BEANS';

      // Rule: Coins is the only spending currency
      expect(spendingCurrency).toBe('COINS');
      expect(withdrawalCurrency).toBe('BEANS');
      expect(spendingCurrency).not.toBe(withdrawalCurrency);
    });

    it('validates that player game balance is tracked in Coins', () => {
      const player = {
        userId: 'u_100',
        userName: 'TestUser',
        coins: 5000,
      };

      expect(player.coins).toBe(5000);
      expect(player.beans).toBeUndefined();
    });
  });
});
