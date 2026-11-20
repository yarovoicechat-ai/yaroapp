import React, { useRef, useEffect, useState, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { gameBridge } from '../game/GameBridge';
import { GameLoading } from '../game/GameLoading';
import { GameError } from '../game/GameError';

export interface GreedyKingWebViewProps {
  url?: string;
  sessionId: string;
  ticket: string;
  isMuted?: boolean;
  isHalfScreen?: boolean;
  width?: number;
  height?: number;
  onGameReady?: () => void;
  onError?: (err: string) => void;
  onClose?: () => void;
}

const TRUSTED_ORIGINS = [
  'https://games.yaroapp.in*',
  'https://game-api.yaroapp.in*',
  'https://api.yaroapp.in*',
  'https://yaroapp.in*',
  'http://localhost*',
];

const INJECTED_INIT_SCRIPT = `
(function() {
  window.__IS_YARO_NATIVE__ = true;
  window.__IS_GREEDY_KING__ = true;

  window.sendToNative = function(type, payload, requestId) {
    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        version: 1,
        type: type,
        requestId: requestId || ('req_gk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7)),
        sessionId: window.__YARO_SESSION_ID__ || '',
        payload: payload || {},
        timestamp: Date.now()
      }));
    }
  };

  window.adaptCocosViewport = function(w, h, isHalf) {
    var canvas = document.getElementById('GameCanvas') || document.querySelector('canvas');
    if (canvas) {
      canvas.style.width = '100%';
      canvas.style.height = '100%';
    }
    window.dispatchEvent(new Event('resize'));
  };

  window.setGameMuted = function(muted) {
    var audios = document.querySelectorAll('audio, video');
    audios.forEach(function(a) { a.muted = muted; });
  };
})();
true;
`;

export const GreedyKingWebView: React.FC<GreedyKingWebViewProps> = ({
  url = 'https://games.yaroapp.in/greedy-king/',
  sessionId,
  ticket,
  isMuted = true,
  isHalfScreen = false,
  width = 0,
  height = 0,
  onGameReady,
  onError,
  onClose,
}) => {
  const webViewRef = useRef<WebView>(null);
  const [activeUrl, setActiveUrl] = useState(url);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);

  useEffect(() => {
    setActiveUrl(url);
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
    if (typeof webViewRef.current?.injectJavaScript === 'function') {
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
    if (typeof webViewRef.current?.injectJavaScript === 'function' && width > 0 && height > 0) {
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
      console.warn('[GreedyKingWebView] onMessage parsing error:', err);
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
          console.warn('[GreedyKingWebView] WebView error:', nativeEvent.description);
          // If games.yaroapp.in fails (DNS or network), fallback to api.yaroapp.in static hosting
          if (activeUrl.includes('games.yaroapp.in') && !activeUrl.includes('api.yaroapp.in')) {
            const fallback = activeUrl.replace('https://games.yaroapp.in/', 'https://api.yaroapp.in/games/');
            console.log('[GreedyKingWebView] Retrying with production host fallback:', fallback);
            setActiveUrl(fallback);
            return;
          }
          setLoading(false);
          setErrorState(nativeEvent.description || 'Failed to load Greedy King');
          onError?.(nativeEvent.description);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          if (nativeEvent.statusCode >= 400) {
            console.warn('[GreedyKingWebView] HTTP error:', nativeEvent.statusCode);
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
        originWhitelist={TRUSTED_ORIGINS}
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
    backgroundColor: '#0D0602',
    overflow: 'hidden',
  },
  webView: {
    flex: 1,
    backgroundColor: '#0D0602',
  },
});

export default GreedyKingWebView;
