import { RefObject } from 'react';
import { WebView } from 'react-native-webview';
import {
  BridgeMessage,
  CocosToRnEventType,
  InitGamePayload,
  PROTOCOL_VERSION,
  RnToCocosEventType,
} from './GameBridgeTypes';

type EventListener<T = any> = (payload: T, message: BridgeMessage<T>) => void;

export class GameBridge {
  private webViewRef: RefObject<WebView> | null = null;
  private sessionId: string = '';
  private listeners: Map<string, Set<EventListener>> = new Map();
  private processedRequestIds: Set<string> = new Set();
  private lastMessageTimestamp: number = 0;
  private rateLimitWindowMs: number = 100; // max 10 messages per sec
  private messageCountInWindow: number = 0;

  private cleanupTimer: any = null;

  constructor() {
    // Clear old processed requestIds periodically
    this.cleanupTimer = setInterval(() => {
      if (this.processedRequestIds.size > 200) {
        this.processedRequestIds.clear();
      }
    }, 60000);
    this.cleanupTimer?.unref?.();
  }

  public setWebViewRef(ref: RefObject<WebView> | null) {
    this.webViewRef = ref;
  }

  public setSessionId(id: string) {
    this.sessionId = id;
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Send a validated message from React Native to Cocos WebView
   */
  public sendToCocos<T = any>(type: RnToCocosEventType, payload: T): boolean {
    if (!this.webViewRef?.current) {
      return false;
    }

    const message: BridgeMessage<T> = {
      version: PROTOCOL_VERSION,
      type,
      requestId: `rn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      sessionId: this.sessionId,
      payload,
      timestamp: Date.now(),
    };

    const serialized = JSON.stringify(message);
    const injectedJs = `
      (function() {
        if (window.__YARO_COCOS_RECEIVER__ && typeof window.__YARO_COCOS_RECEIVER__ === 'function') {
          window.__YARO_COCOS_RECEIVER__(${JSON.stringify(serialized)});
        } else {
          window.dispatchEvent(new CustomEvent('yaro:message', { detail: ${JSON.stringify(serialized)} }));
        }
      })();
      true;
    `;

    try {
      this.webViewRef.current.injectJavaScript(injectedJs);
      return true;
    } catch (err) {
      console.warn('[GameBridge] Error injecting message to Cocos:', err);
      return false;
    }
  }

  /**
   * Handle incoming raw message from Cocos WebView onMessage
   */
  public handleCocosMessage(rawData: string): void {
    const now = Date.now();
    if (now - this.lastMessageTimestamp < this.rateLimitWindowMs) {
      this.messageCountInWindow++;
      if (this.messageCountInWindow > 15) {
        console.warn('[GameBridge] Rate limit exceeded, dropping message');
        return;
      }
    } else {
      this.lastMessageTimestamp = now;
      this.messageCountInWindow = 1;
    }

    let parsed: any;
    try {
      parsed = JSON.parse(rawData);
    } catch {
      console.warn('[GameBridge] Received non-JSON message from WebView');
      return;
    }

    if (!parsed || typeof parsed !== 'object') return;

    // Validate protocol version
    if (parsed.version !== PROTOCOL_VERSION) {
      console.warn(`[GameBridge] Unsupported protocol version: ${parsed.version}`);
      return;
    }

    // Validate requestId to prevent duplicate processing
    if (parsed.requestId) {
      if (this.processedRequestIds.has(parsed.requestId)) {
        console.warn(`[GameBridge] Duplicate requestId dropped: ${parsed.requestId}`);
        return;
      }
      this.processedRequestIds.add(parsed.requestId);
    }

    const message = parsed as BridgeMessage;

    // Dispatch to registered listeners
    const handlers = this.listeners.get(message.type);
    if (handlers && handlers.size > 0) {
      handlers.forEach(fn => {
        try {
          fn(message.payload, message);
        } catch (err) {
          console.error(`[GameBridge] Handler error for ${message.type}:`, err);
        }
      });
    }
  }

  /**
   * Register listener for Cocos events
   */
  public on<T = any>(eventType: CocosToRnEventType | string, listener: EventListener<T>): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(listener);

    return () => {
      this.off(eventType, listener);
    };
  }

  /**
   * Remove listener
   */
  public off<T = any>(eventType: CocosToRnEventType | string, listener: EventListener<T>): void {
    const set = this.listeners.get(eventType);
    if (set) {
      set.delete(listener);
    }
  }

  /**
   * Initialize Cocos Game with player and settings
   */
  public initializeGame(payload: InitGamePayload): boolean {
    this.sessionId = payload.sessionId;
    return this.sendToCocos('INIT_GAME', payload);
  }

  /**
   * Pause game (e.g. when minimized or app goes to background)
   */
  public pauseGame(): boolean {
    return this.sendToCocos('PAUSE_GAME', {});
  }

  /**
   * Resume game (e.g. restored from minimize or app foreground)
   */
  public resumeGame(): boolean {
    return this.sendToCocos('RESUME_GAME', {});
  }

  /**
   * Exit game session cleanly
   */
  public exitGame(): boolean {
    return this.sendToCocos('EXIT_GAME', {});
  }

  /**
   * Update player spending Coins balance to Cocos UI
   */
  public updatePlayerBalance(newCoins: number): boolean {
    return this.sendToCocos('UPDATE_PLAYER', { coins: newCoins });
  }

  /**
   * Clean up bridge
   */
  public destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.listeners.clear();
    this.processedRequestIds.clear();
    this.webViewRef = null;
  }
}

export const gameBridge = new GameBridge();
