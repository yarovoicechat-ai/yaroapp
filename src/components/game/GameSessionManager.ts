import { AppState, AppStateStatus } from 'react-native';
import { apiUtil } from '../../utils/apiUtil';
import { getSocket } from '../../sockets';
import { gameBridge } from './GameBridge';
import {
  CocosToRnEventType,
  GameErrorPayload,
  GameResultPayload,
  PlayerActionPayload,
} from './GameBridgeTypes';

export type GameSessionState =
  | 'ROOM_ACTIVE'
  | 'CREATING_SESSION'
  | 'LOADING_GAME'
  | 'GAME_READY'
  | 'PLAYING'
  | 'MINIMIZED'
  | 'RECONNECTING'
  | 'COMPLETING'
  | 'EXITING'
  | 'ERROR';

export interface GameMetadata {
  id: string;
  gameId: string;
  title: string;
  category?: string;
  gameUrl: string;
  icon?: string;
  minBet?: number;
  maxBet?: number;
  multipliers?: number[];
  gradient?: string[];
}

export type StateChangeListener = (
  newState: GameSessionState,
  previousState: GameSessionState
) => void;

export class GameSessionManager {
  private currentState: GameSessionState = 'ROOM_ACTIVE';
  private previousState: GameSessionState = 'ROOM_ACTIVE';
  private activeGame: GameMetadata | null = null;
  private currentRoomId: string = '';
  private sessionId: string = '';
  private launchTicket: string = '';
  private stateListeners: Set<StateChangeListener> = new Set();
  private appStateSubscription: any = null;
  private bridgeUnsubscribers: (() => void)[] = [];

  constructor() {
    this.setupAppStateListener();
  }

  public getState(): GameSessionState {
    return this.currentState;
  }

  public getActiveGame(): GameMetadata | null {
    return this.activeGame;
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  public getLaunchTicket(): string {
    return this.launchTicket;
  }

  public onStateChange(listener: StateChangeListener): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  private setState(nextState: GameSessionState) {
    if (this.currentState === nextState) return;
    this.previousState = this.currentState;
    this.currentState = nextState;
    this.stateListeners.forEach(fn => {
      try {
        fn(this.currentState, this.previousState);
      } catch (err) {
        console.warn('[GameSessionManager] Listener error:', err);
      }
    });
  }

  /**
   * Launch game: Requests single-use ticket and sets up bridge
   */
  public async launchGame(params: {
    game: GameMetadata;
    roomId: string;
    currentUser: {
      id: string;
      name?: string;
      image?: string;
      diamonds?: number;
      coins?: number;
    };
  }): Promise<{ success: boolean; sessionUrl?: string; error?: string }> {
    try {
      this.activeGame = params.game;
      this.currentRoomId = params.roomId;
      this.setState('CREATING_SESSION');

      const gameId = params.game.gameId || params.game.id;

      // 1. Request launch ticket from backend (supports /games/session/ticket or /games/session)
      let response;
      const ticketBody = {
        gameId,
        roomId: params.roomId,
        userId: params.currentUser.id,
        userName: params.currentUser.name,
      };
      try {
        response = await apiUtil.post('/games/session/ticket', ticketBody);
      } catch {
        response = await apiUtil.post('/games/session', ticketBody);
      }

      const data = response?.data?.data || response?.data;
      if (!data?.ticket || !data?.sessionId) {
        throw new Error(response?.data?.message || 'Failed to acquire game ticket');
      }

      this.sessionId = data.sessionId;
      this.launchTicket = data.ticket;
      gameBridge.setSessionId(data.sessionId);

      // 2. Set up Bridge event listeners
      this.setupBridgeListeners();

      // 3. Connect Socket.IO to game session
      const socket = getSocket();
      if (socket) {
        socket.emit('game:authenticate', { ticket: data.ticket, userId: params.currentUser.id }, (res: any) => {
          if (res?.success) {
            console.log('[GameSessionManager] Socket authenticated for game session');
          }
        });
      }

      this.setState('LOADING_GAME');

      const separator = data.gameUrl.includes('?') ? '&' : '?';
      const sessionUrl = `${data.gameUrl}${separator}ticket=${encodeURIComponent(
        data.ticket
      )}&sessionId=${encodeURIComponent(data.sessionId)}&roomId=${encodeURIComponent(
        params.roomId
      )}&userId=${encodeURIComponent(params.currentUser.id)}&userName=${encodeURIComponent(
        params.currentUser.name || 'Player'
      )}`;

      return { success: true, sessionUrl };
    } catch (err: any) {
      console.error('[GameSessionManager] Launch error:', err);
      this.setState('ERROR');
      return { success: false, error: err.message || 'Game launch failed' };
    }
  }

  private setupBridgeListeners() {
    this.cleanupBridgeListeners();

    // GAME_READY
    const unsubReady = gameBridge.on('GAME_READY', () => {
      if (this.currentState === 'LOADING_GAME') {
        this.setState('GAME_READY');
        this.setState('PLAYING');
      }
    });

    // GAME_MINIMIZED
    const unsubMinimized = gameBridge.on('GAME_MINIMIZED', () => {
      this.minimizeGame();
    });

    // GAME_EXIT
    const unsubExit = gameBridge.on('GAME_EXIT', () => {
      this.exitGame();
    });

    // GAME_ERROR
    const unsubError = gameBridge.on<GameErrorPayload>('GAME_ERROR', payload => {
      console.warn('[GameSessionManager] Game reported error:', payload);
      if (payload?.fatal) {
        this.setState('ERROR');
      }
    });

    // BET_REQUEST: Authoritative YARO Wallet Debit (MANDATORY FINANCIAL CHECK)
    const unsubBet = gameBridge.on<{
      spotId: string;
      amount: number;
      playerId?: string;
      reqId?: string;
    }>('BET_REQUEST', async payload => {
      if (!payload?.amount || !this.sessionId) return;
      const amount = Number(payload.amount);
      const spotId = payload.spotId || 'general';
      const idempotencyKey = payload.reqId || `gk_bet_${this.sessionId}_${Date.now()}_${spotId}`;

      try {
        const res = await apiUtil.post(`/games/session/${this.sessionId}/bet`, {
          gameId: this.activeGame?.gameId || 'greedy-king',
          amount,
          betTarget: spotId,
          idempotencyKey,
        });

        const data = res?.data?.data || res?.data;
        if (data?.success || res?.status === 200) {
          const balanceAfter = data?.balanceAfter;
          const txId = data?.transactionId;

          // Notify Cocos WebView of successful authoritative debit
          gameBridge.sendToCocos('UPDATE_SETTINGS' as any, {
            action: 'BET_CONFIRMED',
            spotId,
            amount,
            balanceAfter,
            transactionId: txId,
          });

          // Trigger balance refresh across VoiceRoom and wallet displays
          gameBridge.emit('WALLET_REFRESH_REQUEST', { balanceAfter });
        } else {
          throw new Error(data?.message || 'Debit failed');
        }
      } catch (err: any) {
        const errMsg = err?.response?.data?.message || err?.message || 'Insufficient Coins';
        console.warn('[GameSessionManager] Wallet debit rejected:', errMsg);
        gameBridge.sendToCocos('UPDATE_SETTINGS' as any, {
          action: 'BET_REJECTED',
          spotId,
          amount,
          error: errMsg,
        });
      }
    });

    this.bridgeUnsubscribers.push(unsubReady, unsubMinimized, unsubExit, unsubError, unsubBet);
  }

  private cleanupBridgeListeners() {
    this.bridgeUnsubscribers.forEach(fn => fn());
    this.bridgeUnsubscribers = [];
  }

  /**
   * Minimize the active game
   */
  public minimizeGame(): void {
    if (this.currentState === 'PLAYING' || this.currentState === 'GAME_READY') {
      this.setState('MINIMIZED');
      gameBridge.pauseGame();
    }
  }

  /**
   * Restore minimized game back to half-screen
   */
  public restoreGame(): void {
    if (this.currentState === 'MINIMIZED') {
      this.setState('PLAYING');
      gameBridge.resumeGame();
    }
  }

  /**
   * Exit game session cleanly
   */
  public async exitGame(): Promise<void> {
    if (this.currentState === 'ROOM_ACTIVE' || this.currentState === 'EXITING') return;

    this.setState('EXITING');

    try {
      gameBridge.exitGame();

      // Notify backend that user left session
      if (this.sessionId) {
        await apiUtil.post(`/games/session/${this.sessionId}/leave`, {}).catch(() => {});
        const socket = getSocket();
        if (socket) {
          socket.emit('game:leave', { sessionId: this.sessionId });
        }
      }
    } finally {
      this.cleanupBridgeListeners();
      this.activeGame = null;
      this.sessionId = '';
      this.launchTicket = '';
      this.setState('ROOM_ACTIVE');
    }
  }

  /**
   * App state listener for background / foreground
   */
  private setupAppStateListener() {
    this.appStateSubscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (nextState === 'background' || nextState === 'inactive') {
          if (this.currentState === 'PLAYING') {
            gameBridge.pauseGame();
          }
        } else if (nextState === 'active') {
          if (this.currentState === 'PLAYING') {
            gameBridge.resumeGame();
          }
        }
      }
    );
  }

  public destroy(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    this.cleanupBridgeListeners();
    this.stateListeners.clear();
  }
}

export const gameSessionManager = new GameSessionManager();
