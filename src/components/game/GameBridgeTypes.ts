/**
 * YARO - Cocos Creator 3.8.x Typed Native Bridge Protocols & Definitions
 */

export const PROTOCOL_VERSION = 1;

export type RnToCocosEventType =
  | 'INIT_GAME'
  | 'JOIN_GAME'
  | 'EXIT_GAME'
  | 'PAUSE_GAME'
  | 'RESUME_GAME'
  | 'UPDATE_PLAYER'
  | 'UPDATE_SETTINGS';

export type CocosToRnEventType =
  | 'GAME_READY'
  | 'GAME_STARTED'
  | 'GAME_FINISHED'
  | 'GAME_MINIMIZED'
  | 'GAME_EXIT'
  | 'GAME_ERROR'
  | 'PLAYER_ACTION'
  | 'WALLET_REFRESH_REQUEST';

export interface BridgeMessage<T = Record<string, any>> {
  version: number;
  type: RnToCocosEventType | CocosToRnEventType;
  requestId: string;
  sessionId: string;
  payload: T;
  timestamp?: number;
}

export interface PlayerInfo {
  userId: string;
  userName: string;
  avatar?: string;
  coins: number; // Spending currency (Coins)
  isHost?: boolean;
}

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  vibrationEnabled: boolean;
  language: string;
}

export interface InitGamePayload {
  gameId: string;
  ticket: string; // Short-lived single-use ticket
  roomId: string;
  sessionId: string;
  player: PlayerInfo;
  settings: GameSettings;
  dimensions: {
    width: number;
    height: number;
    isHalfScreen: boolean;
  };
}

export interface PlayerActionPayload {
  action: 'BET' | 'SPIN' | 'CLEAR' | 'SELECT_ITEM' | 'CUSTOM';
  target?: string;
  amount?: number;
  roundNumber?: number;
  idempotencyKey?: string;
  data?: Record<string, any>;
}

export interface GameErrorPayload {
  code: string;
  message: string;
  fatal?: boolean;
}

export interface GameResultPayload {
  roundNumber: number;
  winningTarget: string;
  multiplier: number;
  wonAmount: number;
  newBalance: number;
}
