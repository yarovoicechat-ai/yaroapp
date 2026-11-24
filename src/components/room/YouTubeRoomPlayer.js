import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Dimensions,
  Image,
  Linking,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getSocket } from '../../sockets';
import { apiUtil } from '../../utils/apiUtil';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PLAYER_HEIGHT = Math.round((SCREEN_WIDTH * 9) / 16);

function formatTime(secs) {
  if (!secs || isNaN(secs) || secs < 0) return '00:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function YouTubeRoomPlayer({
  roomId,
  isHost = false,
  currentUser = null,
  onOpenSearch,
  onClosePlayer,
}) {
  const webViewRef = useRef(null);
  const [session, setSession] = useState(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playerReady, setPlayerReady] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [embedError, setEmbedError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const controlsTimeoutRef = useRef(null);
  const lastSyncTimeRef = useRef(0);
  const currentRoomIdRef = useRef(roomId);
  currentRoomIdRef.current = roomId;

  // Auto-hide controls overlay after 4.5 seconds
  const pokeControls = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 4500);
  }, []);

  // Hardware back button handler: when in fullscreen, exit fullscreen instead of leaving room
  useEffect(() => {
    if (!isFullscreen) return;
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      setIsFullscreen(false);
      return true; // Prevent default room exit
    });
    return () => backHandler.remove();
  }, [isFullscreen]);

  // Fetch initial session state
  const syncWithServer = useCallback(async () => {
    if (!roomId) return;
    try {
      const res = await apiUtil.get(`/voice-club/rooms/${roomId}/watch`);
      const data = res?.data?.data || res?.data;
      if (data && data.videoId) {
        setSession(data);
        setIsPlaying(data.status === 'playing');
        if (typeof data.expectedCurrentTime === 'number') {
          setCurrentTime(data.expectedCurrentTime);
        }
      }
    } catch {
      // Ignore background sync errors
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  // Socket.IO real-time synchronization
  useEffect(() => {
    if (!roomId) return;
    let alive = true;
    syncWithServer();

    const socket = getSocket();
    if (!socket) return;

    const handleVideoSelected = (data) => {
      if (!alive || !data?.videoId) return;
      setSession(data);
      setEmbedError(false);
      setIsPlaying(true);
      setCurrentTime(0);
      setLoading(true);
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(`
          if (window.player && window.player.loadVideoById) {
            window.player.loadVideoById('${data.videoId}', 0);
            window.player.playVideo();
          }
          true;
        `);
      }
    };

    const handlePlaybackUpdated = (data) => {
      if (!alive || !data) return;
      if (data.action === 'play') {
        setIsPlaying(true);
        if (webViewRef.current) {
          webViewRef.current.injectJavaScript(`
            if (window.player && window.player.playVideo) window.player.playVideo();
            true;
          `);
        }
      } else if (data.action === 'pause') {
        setIsPlaying(false);
        if (webViewRef.current) {
          webViewRef.current.injectJavaScript(`
            if (window.player && window.player.pauseVideo) window.player.pauseVideo();
            true;
          `);
        }
      } else if (data.action === 'seek') {
        setCurrentTime(data.currentTime || 0);
        if (webViewRef.current) {
          webViewRef.current.injectJavaScript(`
            if (window.player && window.player.seekTo) window.player.seekTo(${data.currentTime || 0}, true);
            true;
          `);
        }
      }
    };

    const handleSessionClosed = () => {
      if (!alive) return;
      setSession(null);
      onClosePlayer && onClosePlayer();
    };

    const handleSyncState = (data) => {
      if (!alive || !data) return;
      setSession(data);
      if (data.status === 'playing') setIsPlaying(true);
      else if (data.status === 'paused') setIsPlaying(false);
    };

    socket.on('roomWatch:videoSelected', handleVideoSelected);
    socket.on('roomWatch:playbackUpdated', handlePlaybackUpdated);
    socket.on('roomWatch:sessionClosed', handleSessionClosed);
    socket.on('roomWatch:syncState', handleSyncState);

    // Initial sync request
    socket.emit('roomWatch:requestSync', { roomId });

    return () => {
      alive = false;
      socket.off('roomWatch:videoSelected', handleVideoSelected);
      socket.off('roomWatch:playbackUpdated', handlePlaybackUpdated);
      socket.off('roomWatch:sessionClosed', handleSessionClosed);
      socket.off('roomWatch:syncState', handleSyncState);
    };
  }, [roomId, syncWithServer, onClosePlayer]);

  // Play / Pause toggle
  const handleTogglePlayPause = async () => {
    pokeControls();
    const nextAction = isPlaying ? 'pause' : 'play';
    setIsPlaying(!isPlaying);

    // Direct local player command
    if (webViewRef.current) {
      if (nextAction === 'play') {
        webViewRef.current.injectJavaScript('if (window.player && window.player.playVideo) window.player.playVideo(); true;');
      } else {
        webViewRef.current.injectJavaScript('if (window.player && window.player.pauseVideo) window.player.pauseVideo(); true;');
      }
    }

    // Broadcast through socket & backend API
    try {
      const socket = getSocket();
      if (socket) {
        socket.emit(`roomWatch:${nextAction}`, { roomId, currentTime });
      }
      await apiUtil.post(`/voice-club/rooms/${roomId}/watch/playback`, {
        action: nextAction,
        currentTime,
      });
    } catch {
      // Ignore
    }
  };

  // Seek by offset (+10s / -10s)
  const handleSeekOffset = (seconds) => {
    pokeControls();
    const maxDur = duration || session?.durationSeconds || 9999;
    const target = Math.max(0, Math.min(currentTime + seconds, maxDur));
    setCurrentTime(target);

    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`if (window.player && window.player.seekTo) window.player.seekTo(${target}, true); true;`);
    }

    try {
      const socket = getSocket();
      if (socket) {
        socket.emit('roomWatch:seek', { roomId, currentTime: target });
      }
      apiUtil.post(`/voice-club/rooms/${roomId}/watch/playback`, {
        action: 'seek',
        currentTime: target,
      });
    } catch {
      // Ignore
    }
  };

  // Direct Seek to specific second (from Progress Bar touch/scrub)
  const handleSeekTo = (targetSeconds) => {
    pokeControls();
    const maxDur = duration || session?.durationSeconds || 9999;
    const target = Math.max(0, Math.min(targetSeconds, maxDur));
    setCurrentTime(target);

    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`if (window.player && window.player.seekTo) window.player.seekTo(${target}, true); true;`);
    }

    try {
      const socket = getSocket();
      if (socket) {
        socket.emit('roomWatch:seek', { roomId, currentTime: target });
      }
      apiUtil.post(`/voice-club/rooms/${roomId}/watch/playback`, {
        action: 'seek',
        currentTime: target,
      });
    } catch {
      // Ignore
    }
  };

  // Close Watch Session
  const handleClose = async () => {
    if (!isHost) {
      setIsFullscreen(false);
      onClosePlayer && onClosePlayer();
      return;
    }

    try {
      const socket = getSocket();
      if (socket) socket.emit('roomWatch:close', { roomId });
      await apiUtil.post(`/voice-club/rooms/${roomId}/watch/close`, {});
    } catch {
      // Ignore
    } finally {
      setIsFullscreen(false);
      setSession(null);
      onClosePlayer && onClosePlayer();
    }
  };

  // Handle suggested video clicks inside player without leaving room
  const handleSuggestedVideoSelected = useCallback(async (newVideoId) => {
    if (!newVideoId || newVideoId === session?.videoId) return;
    setEmbedError(false);
    setIsPlaying(true);
    setCurrentTime(0);
    setLoading(true);

    webViewRef.current?.injectJavaScript(`
      if (window.player && window.player.loadVideoById) {
        window.player.loadVideoById('${newVideoId}', 0);
        window.player.playVideo();
      }
      true;
    `);

    const newSessionData = {
      videoId: newVideoId,
      videoTitle: 'Suggested Video',
      channelTitle: 'YouTube',
      status: 'playing',
      currentTime: 0,
      selectedBy: currentUser?.name || 'Room Member',
    };
    setSession(prev => ({ ...(prev || {}), ...newSessionData }));

    try {
      const socket = getSocket();
      if (socket) {
        socket.emit('roomWatch:selectVideo', { roomId, videoData: newSessionData });
      }
      await apiUtil.post(`/voice-club/rooms/${roomId}/watch/select`, newSessionData);
    } catch (err) {
      console.warn('[YouTubeRoomPlayer] failed to sync suggested video selection:', err);
    }
  }, [session?.videoId, currentUser, roomId]);

  // Handle messages from WebView
  const handleMessage = (event) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.event === 'onSelectSuggestedVideo' && msg.videoId) {
        handleSuggestedVideoSelected(msg.videoId);
      } else if (msg.event === 'onReady') {
        setPlayerReady(true);
        setLoading(false);
        if (msg.duration) setDuration(msg.duration);
        if (session?.expectedCurrentTime && session.expectedCurrentTime > 0) {
          webViewRef.current?.injectJavaScript(`
            if (window.player && window.player.seekTo) window.player.seekTo(${session.expectedCurrentTime}, true);
            true;
          `);
        }
      } else if (msg.event === 'onCurrentTime') {
        setCurrentTime(msg.currentTime || 0);
        if (msg.duration && !duration) setDuration(msg.duration);

        // Drift check for normal members (non-host)
        if (!isHost && session?.status === 'playing') {
          const now = Date.now();
          if (now - lastSyncTimeRef.current > 6000) {
            lastSyncTimeRef.current = now;
            const elapsed = (now - new Date(session.lastUpdatedAt).getTime()) / 1000;
            const expected = (session.currentTime || 0) + elapsed;
            const drift = Math.abs((msg.currentTime || 0) - expected);
            if (drift > 3 && expected < (duration || 9999)) {
              webViewRef.current?.injectJavaScript(`
                if (window.player && window.player.seekTo) window.player.seekTo(${expected}, true);
                true;
              `);
            }
          }
        }
      } else if (msg.event === 'onStateChange') {
        // 1 = PLAYING, 2 = PAUSED, 0 = ENDED
        if (msg.videoId && msg.videoId !== session?.videoId) {
          handleSuggestedVideoSelected(msg.videoId);
        }
        if (msg.data === 1) setIsPlaying(true);
        else if (msg.data === 2) setIsPlaying(false);
        else if (msg.data === 0) {
          setIsPlaying(false);
        }
      } else if (msg.event === 'onError') {
        const code = Number(msg.code);
        let errorMsg = 'Playback error occurred';
        let isRestricted = false;

        if (code === 2) {
          errorMsg = 'Invalid video ID or parameter.';
        } else if (code === 5) {
          errorMsg = 'HTML5 player playback error. Please try again.';
        } else if (code === 100) {
          errorMsg = 'This video is unavailable, removed or private.';
          isRestricted = true;
        } else if (code === 101 || code === 150) {
          errorMsg = 'This video cannot be played inside YARO. Open it on YouTube.';
          isRestricted = true;
        } else if (code === 153) {
          errorMsg = 'Client identity / referrer check required (Error 153). Open it on YouTube.';
          isRestricted = true;
        } else {
          errorMsg = `Playback error code: ${code}`;
        }

        setErrorMessage(errorMsg);
        setEmbedError(isRestricted);
        setLoading(false);
      }
    } catch {
      // Ignore non-json messages
    }
  };

  // Fallback if no active video selected
  if (!session?.videoId) {
    return (
      <View style={styles.placeholderContainer}>
        <View style={styles.placeholderContent}>
          <MaterialCommunityIcons name="youtube" size={42} color="#EF4444" />
          <Text style={styles.placeholderTitle}>YouTube Watch Together</Text>
          <Text style={styles.placeholderSub}>Watch and listen to YouTube videos with room members in real time</Text>
          {Boolean(isHost) && (
            <TouchableOpacity style={styles.searchPromptBtn} onPress={onOpenSearch} activeOpacity={0.85}>
              <Icon name="search" size={16} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.searchPromptText}>Search Video</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // HTML content for YouTube IFrame Player
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; background-color: #000; }
          html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
          #player { width: 100%; height: 100%; }
        </style>
      </head>
      <body>
        <div id="player"></div>
        <script>
          var tag = document.createElement('script');
          tag.src = "https://www.youtube.com/iframe_api";
          var firstScriptTag = document.getElementsByTagName('script')[0];
          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

          var player;
          function onYouTubeIframeAPIReady() {
            try {
              player = new YT.Player('player', {
                videoId: '${session.videoId}',
                playerVars: {
                  autoplay: 1,
                  controls: 1,
                  fs: 0,
                  rel: 0,
                  playsinline: 1,
                  origin: 'https://yaroapp.in',
                  enablejsapi: 1,
                  widget_referrer: 'https://yaroapp.in'
                },
                events: {
                  'onReady': onPlayerReady,
                  'onStateChange': onPlayerStateChange,
                  'onError': onPlayerError
                }
              });
            } catch (err) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                event: 'onError',
                code: 5
              }));
            }
          }

          function onPlayerReady(event) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              event: 'onReady',
              duration: player.getDuration()
            }));
            player.playVideo();
          }

          function onPlayerStateChange(event) {
            var currentVid = '';
            try {
              if (player && player.getVideoUrl) {
                var url = player.getVideoUrl();
                var m = url && url.match(/v=([\w-]{11})/);
                if (m && m[1]) currentVid = m[1];
              }
            } catch(e) {}

            window.ReactNativeWebView.postMessage(JSON.stringify({
              event: 'onStateChange',
              data: event.data,
              currentTime: player && player.getCurrentTime ? player.getCurrentTime() : 0,
              videoId: currentVid
            }));
          }

          function onPlayerError(event) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              event: 'onError',
              code: event.data
            }));
          }

          setInterval(function() {
            if (player && player.getCurrentTime) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                event: 'onCurrentTime',
                currentTime: player.getCurrentTime(),
                duration: player.getDuration()
              }));
            }
          }, 1000);
        </script>
      </body>
    </html>
  `;

  const totalDur = duration || session?.durationSeconds || 0;
  const progressPercent = totalDur > 0 ? Math.min(100, Math.max(0, (currentTime / totalDur) * 100)) : 0;

  return (
    <View style={isFullscreen ? styles.fullscreenContainer : styles.playerContainer}>
      {isFullscreen && <StatusBar hidden={true} />}

      {/* Native YouTube WebView */}
      {!embedError ? (
        <View style={styles.webContainer}>
          <WebView
            ref={webViewRef}
            source={{
              html: htmlContent,
              baseUrl: 'https://yaroapp.in',
            }}
            originWhitelist={['*']}
            style={styles.webView}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            domStorageEnabled
            mixedContentMode="always"
            androidLayerType="hardware"
            allowsFullscreenVideo={true}
            userAgent="Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
            onMessage={handleMessage}
            scrollEnabled={false}
            bounces={false}
            setSupportMultipleWindows={false}
            onShouldStartLoadWithRequest={(request) => {
              const { url } = request;
              if (!url) return true;

              // 1. Core origins and blank pages
              if (
                url === 'about:blank' ||
                url.startsWith('https://yaroapp.in') ||
                url.startsWith('data:') ||
                url.startsWith('blob:')
              ) {
                return true;
              }

              // 2. YouTube iframe API, embed frames, video stream chunks, and assets MUST be allowed
              if (
                url.includes('/iframe_api') ||
                url.includes('/embed/') ||
                url.includes('/s/player/') ||
                url.includes('googlevideo.com') ||
                url.includes('ytimg.com') ||
                url.includes('ggpht.com') ||
                url.includes('youtube-nocookie.com') ||
                url.includes('doubleclick.net') ||
                url.includes('google.com/generate_204') ||
                url.includes('/api/stats/')
              ) {
                return true;
              }

              // 3. User clicked a video link / suggested video (e.g. watch?v=... or youtu.be/...)
              const ytWatchMatch = url.match(/(?:watch\?.*v=|youtu\.be\/)([\w-]{11})/);
              if (ytWatchMatch && ytWatchMatch[1]) {
                const newId = ytWatchMatch[1];
                if (newId !== session?.videoId) {
                  handleSuggestedVideoSelected(newId);
                }
                return false; // Prevent navigating away to external YouTube website
              }

              // 4. Block external navigation away from YARO (channels, external links, apps)
              if (
                url.startsWith('intent:') ||
                url.startsWith('vnd.youtube:') ||
                url.includes('/channel/') ||
                url.includes('/user/') ||
                url.includes('/c/') ||
                url.includes('accounts.google.com')
              ) {
                return false;
              }

              return true;
            }}
          />

          {/* Invisible Touch Layer to Toggle Custom Overlay Controls */}
          <TouchableWithoutFeedback onPress={pokeControls}>
            <View style={styles.touchCaptureLayer} />
          </TouchableWithoutFeedback>
        </View>
      ) : (
        /* Non-embeddable error card */
        <View style={styles.embedErrorContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={36} color="#EF4444" />
          <Text style={styles.embedErrorTitle}>Playback Restricted</Text>
          <Text style={styles.embedErrorSub}>{errorMessage || 'This video cannot be played inside YARO. Open it on YouTube.'}</Text>
          <View style={styles.embedErrorActions}>
            <TouchableOpacity
              style={styles.openYtBtn}
              onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${session.videoId}`)}
            >
              <Text style={styles.openYtText}>Open in YouTube</Text>
            </TouchableOpacity>
            {Boolean(isHost) && (
              <TouchableOpacity style={styles.changeVideoBtn} onPress={onOpenSearch}>
                <Text style={styles.changeVideoText}>Pick Another</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Loading overlay */}
      {loading && (
        <View style={styles.playerLoadingOverlay} pointerEvents="none">
          <ActivityIndicator size="small" color="#FFF" />
          <Text style={styles.playerLoadingText}>Connecting YouTube...</Text>
        </View>
      )}

      {/* Controls Overlay (Shown on tap, auto-hides after 4.5s) */}
      {showControls && (
        <View style={styles.controlsOverlay} pointerEvents="box-none">
          {/* Top Bar */}
          <View style={styles.topControlBar}>
            {isFullscreen ? (
              <TouchableOpacity
                style={styles.topRoundBtn}
                onPress={() => setIsFullscreen(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Icon name="arrow-back" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <View style={styles.watchingTogetherBadge}>
                <View style={styles.liveRedDot} />
                <Text style={styles.watchingTogetherText}>Watching Together</Text>
              </View>
            )}

            <View style={styles.topTitleWrapper}>
              <Text style={styles.topVideoTitle} numberOfLines={1}>
                {session.videoTitle || session.title || 'YouTube Video'}
              </Text>
            </View>

            <View style={styles.topActionsRow}>
              {/* Search Video */}
              {Boolean(isHost) && (
                <TouchableOpacity
                  style={styles.topRoundBtn}
                  onPress={onOpenSearch}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Icon name="search" size={17} color="#FFFFFF" />
                </TouchableOpacity>
              )}

              {/* Toggle Fullscreen Button */}
              <TouchableOpacity
                style={styles.topRoundBtn}
                onPress={() => setIsFullscreen(!isFullscreen)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons
                  name={isFullscreen ? 'fullscreen-exit' : 'fullscreen'}
                  size={20}
                  color="#FFFFFF"
                />
              </TouchableOpacity>

              {/* Close Button */}
              <TouchableOpacity
                style={styles.topRoundBtn}
                onPress={handleClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="close" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Center Playback Controls (Rewind 10s, Play/Pause, Forward 10s) */}
          {Boolean(isHost) && (
            <View style={styles.centerControlsRow} pointerEvents="box-none">
              <TouchableOpacity
                style={styles.centerSkipBtn}
                onPress={() => handleSeekOffset(-10)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="rewind-10" size={30} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.centerPlayPauseBtn}
                onPress={handleTogglePlayPause}
                activeOpacity={0.85}
              >
                <Icon name={isPlaying ? 'pause' : 'play'} size={28} color="#FFFFFF" style={{ marginLeft: isPlaying ? 0 : 3 }} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.centerSkipBtn}
                onPress={() => handleSeekOffset(10)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="fast-forward-10" size={30} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}

          {/* Bottom Scrubber & Time Bar */}
          <View style={styles.bottomBarContainer} pointerEvents="box-none">
            {/* Scrubber Progress Bar Track */}
            <TouchableOpacity
              style={styles.progressBarTouchArea}
              activeOpacity={isHost ? 1 : 0.9}
              onPress={(e) => {
                if (!isHost) return;
                const clickX = e.nativeEvent.locationX;
                const barWidth = isFullscreen ? SCREEN_WIDTH - 32 : SCREEN_WIDTH - 32;
                if (barWidth > 0 && totalDur > 0) {
                  const ratio = Math.max(0, Math.min(1, clickX / barWidth));
                  handleSeekTo(ratio * totalDur);
                }
              }}
            >
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                <View style={[styles.progressBarThumb, { left: `${Math.max(0, progressPercent - 2)}%` }]} />
              </View>
            </TouchableOpacity>

            {/* Time & Fullscreen Row */}
            <View style={styles.timeInfoRow}>
              <Text style={styles.timeLabel}>
                {formatTime(currentTime)} / {formatTime(totalDur)}
              </Text>

              <TouchableOpacity
                onPress={() => setIsFullscreen(!isFullscreen)}
                style={styles.bottomFullscreenBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons
                  name={isFullscreen ? 'fullscreen-exit' : 'fullscreen'}
                  size={19}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  playerContainer: {
    width: SCREEN_WIDTH,
    height: PLAYER_HEIGHT,
    backgroundColor: '#000000',
    position: 'relative',
    overflow: 'hidden',
  },
  fullscreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
    zIndex: 99999,
  },
  webContainer: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: '#000000',
  },
  touchCaptureLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    zIndex: 5,
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.40)',
    justifyContent: 'space-between',
    padding: 12,
    zIndex: 10,
  },
  topControlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  watchingTogetherBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  liveRedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    marginRight: 5,
  },
  watchingTogetherText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  topTitleWrapper: {
    flex: 1,
    marginHorizontal: 8,
  },
  topVideoTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  topActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topRoundBtn: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: 16,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  centerSkipBtn: {
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 22,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPlayPauseBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(239, 68, 68, 0.90)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#EF4444',
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  bottomBarContainer: {
    width: '100%',
  },
  progressBarTouchArea: {
    width: '100%',
    paddingVertical: 8,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    position: 'relative',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#EF4444',
    borderRadius: 2,
  },
  progressBarThumb: {
    position: 'absolute',
    top: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EF4444',
  },
  timeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -2,
  },
  timeLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  bottomFullscreenBtn: {
    padding: 4,
  },
  playerLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 15,
  },
  playerLoadingText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 8,
  },
  embedErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 16,
  },
  embedErrorTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
  },
  embedErrorSub: {
    color: '#94A3B8',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  embedErrorActions: {
    flexDirection: 'row',
    gap: 10,
  },
  openYtBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  openYtText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  changeVideoBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  changeVideoText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  placeholderContainer: {
    width: SCREEN_WIDTH - 24,
    alignSelf: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginVertical: 6,
    padding: 16,
  },
  placeholderContent: {
    alignItems: 'center',
  },
  placeholderTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 6,
  },
  placeholderSub: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  searchPromptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  searchPromptText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
