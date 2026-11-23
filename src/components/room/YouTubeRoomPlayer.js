import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getSocket } from '../../sockets';
import { apiUtil } from '../../utils/apiUtil';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
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
  const [embedError, setEmbedError] = useState(false);
  const [loading, setLoading] = useState(true);

  const controlsTimeoutRef = useRef(null);
  const lastSyncTimeRef = useRef(0);
  const currentRoomIdRef = useRef(roomId);
  currentRoomIdRef.current = roomId;

  // Auto-hide controls overlay after 4 seconds
  const pokeControls = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 4500);
  }, []);

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

  // Host Action: Play / Pause toggle
  const handleTogglePlayPause = async () => {
    if (!isHost) return;
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

  // Host Action: Seek by offset (+10s / -10s)
  const handleSeekOffset = (seconds) => {
    if (!isHost) return;
    pokeControls();
    const target = Math.max(0, Math.min(currentTime + seconds, duration || 9999));
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

  // Host Action: Close Watch Session
  const handleClose = async () => {
    if (!isHost) {
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
      setSession(null);
      onClosePlayer && onClosePlayer();
    }
  };

  // Handle messages from WebView
  const handleMessage = (event) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.event === 'onReady') {
        setPlayerReady(true);
        setLoading(false);
        if (msg.duration) setDuration(msg.duration);
        // If late joiner, sync to expected time
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
        if (msg.data === 1) setIsPlaying(true);
        else if (msg.data === 2) setIsPlaying(false);
        else if (msg.data === 0) {
          setIsPlaying(false);
          // If queue has next video and is host, play next
        }
      } else if (msg.event === 'onError') {
        // 101 or 150 = owner does not allow embedding
        if (msg.code === 101 || msg.code === 150 || msg.code === 5) {
          setEmbedError(true);
          setLoading(false);
        }
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
          {isHost && (
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
          * { margin: 0; padding: 0; box-sizing: border-box; background-color: #000; overflow: hidden; }
          html, body { width: 100%; height: 100%; }
          #player { width: 100%; height: 100%; pointer-events: none; }
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
            player = new YT.Player('player', {
              videoId: '${session.videoId}',
              playerVars: {
                autoplay: 1,
                controls: 0,
                rel: 0,
                showinfo: 0,
                modestbranding: 1,
                playsinline: 1,
                fs: 0,
                iv_load_policy: 3,
                disablekb: 1
              },
              events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange,
                'onError': onPlayerError
              }
            });
          }

          function onPlayerReady(event) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              event: 'onReady',
              duration: player.getDuration()
            }));
            player.playVideo();
          }

          function onPlayerStateChange(event) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              event: 'onStateChange',
              data: event.data,
              currentTime: player.getCurrentTime()
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

  return (
    <View style={styles.playerContainer}>
      {/* YouTube WebView */}
      {!embedError ? (
        <WebView
          ref={webViewRef}
          source={{ html: htmlContent }}
          style={styles.webView}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          domStorageEnabled
          onMessage={handleMessage}
          scrollEnabled={false}
          bounces={false}
        />
      ) : (
        /* Non-embeddable error card */
        <View style={styles.embedErrorContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={36} color="#EF4444" />
          <Text style={styles.embedErrorTitle}>Embedding restricted by YouTube</Text>
          <Text style={styles.embedErrorSub}>The creator of this video does not allow playback in third-party apps.</Text>
          <View style={styles.embedErrorActions}>
            <TouchableOpacity
              style={styles.openYtBtn}
              onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${session.videoId}`)}
            >
              <Text style={styles.openYtText}>Open in YouTube</Text>
            </TouchableOpacity>
            {isHost && (
              <TouchableOpacity style={styles.changeVideoBtn} onPress={onOpenSearch}>
                <Text style={styles.changeVideoText}>Pick Another</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Loading overlay */}
      {loading && (
        <View style={styles.playerLoadingOverlay}>
          <ActivityIndicator size="small" color="#FFF" />
          <Text style={styles.playerLoadingText}>Connecting YouTube...</Text>
        </View>
      )}

      {/* Touch capture layer to toggle controls */}
      <TouchableOpacity
        style={styles.touchOverlay}
        activeOpacity={1}
        onPress={pokeControls}
      >
        {/* Watching Together Badge */}
        <View style={styles.watchingTogetherBadge}>
          <View style={styles.liveRedDot} />
          <Text style={styles.watchingTogetherText}>Watching Together</Text>
        </View>

        {/* CONTROLS OVERLAY (Shown on tap) */}
        {showControls && (
          <View style={styles.controlsOverlay}>
            {/* Top Bar: Title & Channel & Close */}
            <View style={styles.topBar}>
              <View style={styles.topInfo}>
                <Text style={styles.topVideoTitle} numberOfLines={1}>
                  {session.videoTitle || 'YouTube Video'}
                </Text>
                <Text style={styles.topChannelTitle} numberOfLines={1}>
                  {session.channelTitle || 'YouTube'}
                </Text>
              </View>
              {isHost && (
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={handleClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Icon name="close" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>

            {/* Center Controls: Prev (-10s), Play/Pause, Next (+10s) */}
            {isHost && (
              <View style={styles.centerControlsRow}>
                <TouchableOpacity
                  style={styles.skipBtn}
                  onPress={() => handleSeekOffset(-10)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="rewind-10" size={28} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.playPauseCircle}
                  onPress={handleTogglePlayPause}
                  activeOpacity={0.85}
                >
                  <Icon
                    name={isPlaying ? 'pause' : 'play'}
                    size={30}
                    color="#FFFFFF"
                    style={!isPlaying ? { marginLeft: 3 } : null}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.skipBtn}
                  onPress={() => handleSeekOffset(10)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="fast-forward-10" size={28} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}

            {/* Bottom Bar: Search, Time, YouTube Logo */}
            <View style={styles.bottomBar}>
              {isHost && (
                <TouchableOpacity
                  style={styles.bottomSearchBtn}
                  onPress={onOpenSearch}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Icon name="search" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              )}

              {/* Time pill */}
              <View style={styles.timePill}>
                <Text style={styles.timeText}>
                  {formatTime(currentTime)} / {formatTime(duration || session.durationSeconds)}
                </Text>
              </View>

              {/* YouTube Logo */}
              <View style={styles.ytLogoContainer}>
                <MaterialCommunityIcons name="youtube" size={22} color="#EF4444" />
                <Text style={styles.ytLogoText}>YouTube</Text>
              </View>
            </View>
          </View>
        )}
      </TouchableOpacity>
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
  webView: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
  },
  touchOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  watchingTogetherBadge: {
    position: 'absolute',
    top: 8,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    zIndex: 20,
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
  controlsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'space-between',
    padding: 10,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 120, // space for badge
  },
  topInfo: {
    flex: 1,
  },
  topVideoTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  topChannelTitle: {
    color: '#CBD5E1',
    fontSize: 10,
  },
  closeBtn: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 14,
    padding: 4,
    marginLeft: 8,
  },
  centerControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 36,
  },
  skipBtn: {
    padding: 6,
  },
  playPauseCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomSearchBtn: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 14,
    padding: 6,
  },
  timePill: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  ytLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  ytLogoText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 3,
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
  // Placeholder card when no video selected
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
