import React, { useRef, useEffect, useState, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { gameBridge } from './GameBridge';
import { GameLoading } from './GameLoading';
import { GameError } from './GameError';

interface GameWebViewProps {
  url: string;
  sessionId: string;
  ticket: string;
  isMuted: boolean;
  isHalfScreen: boolean;
  width: number;
  height: number;
  onGameReady?: () => void;
  onError?: (err: string) => void;
  onClose?: () => void;
}

const INJECTED_INIT_SCRIPT = `
(function() {
  window.__IS_YARO_NATIVE__ = true;

  // 1. Native Message Bridge
  window.sendToNative = function(type, payload, requestId) {
    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        version: 1,
        type: type,
        requestId: requestId || ('req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7)),
        sessionId: window.__YARO_SESSION_ID__ || '',
        payload: payload || {},
        timestamp: Date.now()
      }));
    }
  };

  // 2. Viewport and Cocos Resolution Adaptation
  window.adaptCocosViewport = function(w, h, isHalf) {
    var canvas = document.getElementById('GameCanvas') || document.querySelector('canvas');
    if (canvas) {
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.objectFit = 'contain';
    }
    var container = document.getElementById('Cocos3dGameContainer') || document.getElementById('GameDiv');
    if (container) {
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.display = 'flex';
      container.style.justifyContent = 'center';
      container.style.alignItems = 'center';
      container.style.overflow = 'hidden';
    }
    if (window.cc && window.cc.view) {
      try {
        // Policy: 3 is SHOW_ALL (ensures full 720x1280 scene and bottom chips fit in viewport)
        // 4 is FIXED_WIDTH (used in full-screen)
        window.cc.view.setDesignResolutionSize(720, 1280, isHalf ? 3 : 4);
      } catch (e) {}
    }
    window.dispatchEvent(new Event('resize'));
  };

  // Poll for Cocos view readiness to apply scaling immediately
  var ccPollTimer = setInterval(function() {
    if (window.cc && window.cc.view) {
      try {
        window.cc.view.setDesignResolutionSize(720, 1280, 3);
        clearInterval(ccPollTimer);
      } catch (e) {}
    }
  }, 200);

  // 3. Audio Control
  window.setGameMuted = function(muted) {
    var audios = document.querySelectorAll('audio, video');
    audios.forEach(function(a) { a.muted = muted; });
  };

  // 4. Spot Click Debouncing (Fixes Chip Amount x2 Bug)
  var lastSpotClickTimes = {};
  var mgrPollTimer = setInterval(function() {
    if (window.gameManager && typeof window.gameManager._onSpotClicked === 'function') {
      var origSpotClick = window.gameManager._onSpotClicked;
      window.gameManager._onSpotClicked = function(spot) {
        var now = Date.now();
        var key = spot && spot.spotId ? spot.spotId : 'general';
        if (lastSpotClickTimes[key] && (now - lastSpotClickTimes[key] < 450)) {
          console.warn('[YARO] Dropped duplicate spot click:', key);
          return;
        }
        lastSpotClickTimes[key] = now;
        return origSpotClick.apply(this, arguments);
      };
      clearInterval(mgrPollTimer);
    }
  }, 200);

  // 5. Intercept WebSocket for Authoritative YARO Wallet Debit
  if (typeof WebSocket !== 'undefined' && !window.__WS_INTERCEPTED__) {
    window.__WS_INTERCEPTED__ = true;
    var origSend = WebSocket.prototype.send;
    WebSocket.prototype.send = function(data) {
      try {
        var str = typeof data === 'string' ? data : '';
        if (str && str.indexOf('PLACE_BET') !== -1) {
          var parsed = JSON.parse(str);
          if (parsed.type === 'PLACE_BET') {
            var spotId = parsed.spotId;
            var amount = Number(parsed.amount);
            var reqId = 'req_bet_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

            // Request wallet debit from YaroApp Native
            window.sendToNative('BET_REQUEST', {
              spotId: spotId,
              amount: amount,
              playerId: parsed.playerId,
              reqId: reqId
            }, reqId);
          }
        }
      } catch (err) {}
      return origSend.apply(this, arguments);
    };
  }

  // 6. Handle Native Messages (BET_CONFIRMED, BET_REJECTED)
  window.__YARO_COCOS_RECEIVER__ = function(serialized) {
    try {
      var msg = JSON.parse(serialized);
      if (msg && msg.payload) {
        var action = msg.payload.action;
        if (action === 'BET_CONFIRMED') {
          if (window.gameManager && typeof msg.payload.balanceAfter === 'number') {
            window.gameManager._balance = msg.payload.balanceAfter;
            if (window.gameManager.ui) {
              window.gameManager.ui.setBalance(msg.payload.balanceAfter, true);
            }
          }
        } else if (action === 'BET_REJECTED') {
          if (window.gameManager) {
            window.gameManager._balance = (window.gameManager._balance || 0) + (msg.payload.amount || 0);
            if (window.gameManager.ui) {
              window.gameManager.ui.setBalance(window.gameManager._balance, true);
            }
            if (window.gameManager.baby) {
              window.gameManager.baby.setDialogue(msg.payload.error || "Not enough coins! Please recharge. 💰");
            }
          }
        }
      }
    } catch (e) {}
  };
})();
true;
`;

export const GameWebView: React.FC<GameWebViewProps> = ({
  url,
  sessionId,
  ticket,
  isMuted,
  isHalfScreen,
  width,
  height,
  onGameReady,
  onError,
  onClose,
}) => {
  const getNormalizedUrl = (rawUrl: string) => {
    if (!rawUrl) return '';
    if (rawUrl.includes('games.yaroapp.in')) {
      return rawUrl.replace('https://games.yaroapp.in/', 'https://api.yaroapp.in/games/');
    }
    return rawUrl;
  };

  const webViewRef = useRef<WebView>(null);
  const [activeUrl, setActiveUrl] = useState(() => getNormalizedUrl(url));
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);

  useEffect(() => {
    setActiveUrl(getNormalizedUrl(url));
  }, [url]);

  // Bind webViewRef to bridge
  useEffect(() => {
    gameBridge.setWebViewRef(webViewRef);
    gameBridge.setSessionId(sessionId);

    const unsubReady = gameBridge.on('GAME_READY', () => {
      setLoading(false);
      onGameReady?.();
    });

    return () => {
      unsubReady();
      gameBridge.setWebViewRef(null);
    };
  }, [sessionId, onGameReady]);

  // Handle Mute changes
  useEffect(() => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (typeof window.setGameMuted === 'function') {
          window.setGameMuted(${isMuted});
        }
        true;
      `);
    }
  }, [isMuted]);

  // Handle Viewport Resize (Half-screen vs Fullscreen)
  useEffect(() => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (typeof window.adaptCocosViewport === 'function') {
          window.adaptCocosViewport(${width}, ${height}, ${isHalfScreen});
        }
        true;
      `);
    }
  }, [width, height, isHalfScreen]);

  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      gameBridge.handleCocosMessage(event.nativeEvent.data);
    } catch (err) {
      console.warn('[GameWebView] onMessage parsing error:', err);
    }
  }, []);

  const handleRetry = () => {
    setErrorState(null);
    setLoading(true);
    webViewRef.current?.reload();
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: activeUrl }}
        injectedJavaScriptBeforeContentLoaded={`
          window.__YARO_SESSION_ID__ = "${sessionId}";
          window.__YARO_TICKET__ = "${ticket}";
          ${INJECTED_INIT_SCRIPT}
        `}
        onMessage={handleMessage}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('[GameWebView] WebView error:', nativeEvent.description);
          // If games.yaroapp.in fails (DNS or network), fallback to api.yaroapp.in static hosting
          if (activeUrl.includes('games.yaroapp.in') && !activeUrl.includes('api.yaroapp.in')) {
            const fallback = activeUrl.replace('https://games.yaroapp.in/', 'https://api.yaroapp.in/games/');
            console.log('[GameWebView] Retrying with production host fallback:', fallback);
            setActiveUrl(fallback);
            return;
          }
          setLoading(false);
          setErrorState(nativeEvent.description || 'Failed to load Cocos game');
          onError?.(nativeEvent.description);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          const reqUrl = nativeEvent.url || '';
          // Ignore subresource 404s (e.g. favicon.ico, telemetry, font-awesome webfonts) so main game is never blocked
          const isMainDoc = reqUrl.includes('/greedy-king') && !reqUrl.includes('.png') && !reqUrl.includes('.jpg') && !reqUrl.includes('.jpeg') && !reqUrl.includes('.ico') && !reqUrl.includes('.css') && !reqUrl.includes('.woff');
          if (!isMainDoc && !reqUrl.endsWith('/greedy-king/')) {
            console.warn('[GameWebView] Ignored subresource HTTP error:', nativeEvent.statusCode, reqUrl);
            return;
          }
          if (nativeEvent.statusCode >= 400) {
            console.warn('[GameWebView] HTTP error:', nativeEvent.statusCode, reqUrl);
            if (activeUrl.includes('games.yaroapp.in') && !activeUrl.includes('api.yaroapp.in')) {
              const fallback = activeUrl.replace('https://games.yaroapp.in/', 'https://api.yaroapp.in/games/');
              setActiveUrl(fallback);
              return;
            }
            setLoading(false);
            setErrorState(`HTTP Error ${nativeEvent.statusCode}`);
          }
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        mixedContentMode="compatibility"
        hardwareAccelerationAndroidEnabled={true}
        androidLayerType="hardware"
        originWhitelist={['*']}
        style={styles.webView}
      />

      {loading && !errorState && <GameLoading />}

      {Boolean(errorState) && (
        <GameError
          error={errorState!}
          onRetry={handleRetry}
          onClose={() => onClose?.()}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    overflow: 'hidden',
  },
  webView: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
});
