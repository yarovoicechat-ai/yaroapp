import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { AppState, NativeModules } from 'react-native';
import { navigationRef } from '../utils/navigationRef';
import { AlertService } from '../utils/AlertService';
import { getSocket, initSocket } from '../sockets';
import { apiUtil } from '../utils/apiUtil';
import { requestMicrophonePermission } from '../utils/permissions';
import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  AudioMixingStateType,
  AudioMixingReasonType,
} from 'react-native-agora';
import InCallManager from 'react-native-incall-manager';
import { AgoraClientService } from '../services/agoraService';

const normalizeRoomId = (id) => {
  const clean = String(id || '').trim();
  if (/^10000\d{3}$/.test(clean)) {
    const lastDigits = clean.slice(5);
    return `100000000${lastDigits}`.slice(-10);
  }
  return clean;
};

const VoiceRoomContext = createContext();

export const VoiceRoomProvider = ({ children }) => {
  const [activeRoom, setActiveRoom] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentSeatIndex, setCurrentSeatIndex] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isGlobalRoomManager, setIsGlobalRoomManager] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [bannedChatUsers, setBannedChatUsers] = useState([]);
  const [mutedUsers, setMutedUsers] = useState([]);
  const [locallyMutedUsers, setLocallyMutedUsers] = useState([]);
  const [seatCount, setSeatCount] = useState(8);
  const [onlineCount, setOnlineCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [joinedNotification, setJoinedNotification] = useState(null);

  const [seats, setSeats] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [activeEntryEffect, setActiveEntryEffect] = useState(null);
  const nameEffectHandlerRef = useRef(null);
  const [activeVipEntry, setActiveVipEntry] = useState(null);
  const [currentRoomTheme, setCurrentRoomTheme] = useState(null);
  const [currentSeatSkin, setCurrentSeatSkin] = useState(null);
  const [showSeatCharm, setShowSeatCharm] = useState(false);

  // Agora State & Diagnostics
  const [agoraStatus, setAgoraStatus] = useState('disconnected'); // 'connecting' | 'connected' | 'error'
  const [agoraErrorMessage, setAgoraErrorMessage] = useState(null);

  // Music Player State
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isMusicLoading, setIsMusicLoading] = useState(false);
  const [musicEnhancementStatus, setMusicEnhancementStatus] = useState(null);
  const musicIntentRef = useRef("stopped");
  const [musicVolume, setMusicVolumeState] = useState(500);
  const [bassLevel, setBassLevelState] = useState(6);
  const [micVolume, setMicVolumeState] = useState(100);
  const [speakerphoneEnabled, setSpeakerphoneEnabledState] = useState(true);
  const onSongEndedCallbackRef = useRef(null);
  const isSwitchingTrackRef = useRef(false);
  const volumeThrottleTimerRef = useRef(null);

  // Speaking Indicators & Live Requests & Reactions State
  const [speakingSeatIndices, setSpeakingSeatIndices] = useState(new Set());
  const [pendingLiveRequests, setPendingLiveRequests] = useState([]);
  const [lastReaction, setLastReaction] = useState(null);

  const socketRef = useRef(null);
  const activeRoomIdRef = useRef(null);
  const currentSeatIndexRef = useRef(null);
  const currentUserRef = useRef(null);
  const agoraEngineRef = useRef(null);
  const agoraInitSessionRef = useRef(null);
  const roomSessionRef = useRef(0);
  const agoraRetryTimerRef = useRef(null);
  const agoraTokenRetryInFlightRef = useRef(false);
  const agoraTokenRetrySessionRef = useRef(null);
  const agoraAuthRefreshTimerRef = useRef(null);
  const agoraAuthRefreshInFlightRef = useRef(false);
  const agoraAuthRefreshQueuedRef = useRef(false);
  const agoraAuthForceRejoinQueuedRef = useRef(false);
  const agoraAuthRefreshAttemptsRef = useRef(0);
  const agoraPublisherAuthorizedRef = useRef(false);
  const agoraCredentialsRef = useRef(null);
  const reconnectHandlerRef = useRef(null);
  const seenJoinEventsRef = useRef(new Set());
  const seenLeaveEventsRef = useRef(new Set());
  const recentJoinUsersRef = useRef(new Map());
  const recentEntryUsersRef = useRef(new Map());
  const roomMemberIdsRef = useRef(new Set());
  const hasRoomMemberSnapshotRef = useRef(false);

  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;
  const desiredLocalAudioRef = useRef({ isOnSeat: false, isMuted: true });
  const musicSwitchTimerRef = useRef(null);
  const musicSwitchRequestRef = useRef(0);
  const musicLoadTimeoutRef = useRef(null);
  const musicFailureHandlerRef = useRef(null);
  const musicSelectionRef = useRef(null);
  const musicVolumeRef = useRef(musicVolume);
  musicVolumeRef.current = musicVolume;
  const bassLevelRef = useRef(bassLevel);
  const musicEnhancedRef = useRef(false);
  const musicEnhanceRequestRef = useRef(0);
  const musicEnhanceHandlerRef = useRef(null);
  const musicPendingEnhancementRef = useRef(null);

  const currentSeatsRef = useRef(seats);
  currentSeatsRef.current = seats;

  const currentLocalUidRef = useRef(null);
  const lastVolumeReportTimeRef = useRef(0);
  const syncLocalMicStateRef = useRef(null);

  // Sync ref with current seat
  currentSeatIndexRef.current = currentSeatIndex;

  // AppState Listener (Background / Foreground transition safety)
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      console.log('📡 [VoiceRoomContext] AppState change:', nextAppState);
      if (nextAppState === 'active' && activeRoomIdRef.current) {
        // App returned to foreground - reconcile audio & socket
        const sock = socketRef.current || getSocket();
        if (sock) {
          if (!sock.connected) {
            console.log('📡 [VoiceRoomContext] Reconnecting socket on app foreground...');
            sock.connect();
          } else {
            // Re-sync room state silently
            sock.emit('voice_room:join', {
              roomId: activeRoomIdRef.current,
              user: currentUserRef.current,
              isHost: isOwner,
              customSeats: seatCount,
            });
          }
        }

        // Reconcile Agora audio stream
        syncLocalMicStateRef.current?.(currentSeatIndexRef.current !== null, isMutedRef.current);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isOwner, seatCount]);

  const scheduleAgoraAuthorizationRefresh = (delayMs = 350) => {
    if (!activeRoomIdRef.current || !agoraEngineRef.current) return;
    if (agoraAuthRefreshTimerRef.current) clearTimeout(agoraAuthRefreshTimerRef.current);
    agoraAuthRefreshTimerRef.current = setTimeout(() => {
      agoraAuthRefreshTimerRef.current = null;
      const credentials = agoraCredentialsRef.current;
      if (credentials?.roomId && credentials?.roomSessionId) {
        const forceRejoin = agoraAuthForceRejoinQueuedRef.current;
        agoraAuthForceRejoinQueuedRef.current = false;
        refreshAgoraAuthorization(credentials.roomId, credentials.roomSessionId, forceRejoin).catch(() => {});
      }
    }, delayMs);
  };

  const fetchRoomAgoraToken = async (roomId) => {
    const endpoints = [
      `/voiceclub/rooms/${encodeURIComponent(roomId)}/agora-token`,
      `/voice-club/rooms/${encodeURIComponent(roomId)}/agora-token`,
      `/rooms/${encodeURIComponent(roomId)}/agora-token`,
    ];
    let lastErr = null;
    for (const ep of endpoints) {
      try {
        const res = await apiUtil.get(ep);
        if (res.data?.success && res.data?.data) {
          return res.data.data;
        }
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr || new Error('Could not authorize room voice');
  };

  const syncLocalMicState = (isOnSeat, shouldMute) => {
    const engine = agoraEngineRef.current;
    const normalizedMute = Boolean(shouldMute);
    desiredLocalAudioRef.current = { isOnSeat: Boolean(isOnSeat), isMuted: normalizedMute };
    isMutedRef.current = normalizedMute;
    const canPublish = Boolean(isOnSeat && !normalizedMute);
    const role = isOnSeat
      ? ClientRoleType.ClientRoleBroadcaster
      : ClientRoleType.ClientRoleAudience;
    if (engine) {
      try {
        engine.setClientRole(role);
        engine.enableLocalAudio(true);
        engine.muteLocalAudioStream(!canPublish);
        engine.updateChannelMediaOptions({
          clientRoleType: role,
          publishMicrophoneTrack: canPublish,
          autoSubscribeAudio: true,
        });
      } catch (agoraErr) {
        console.warn('Agora microphone sync notice:', agoraErr?.message || agoraErr);
      }
    }
  };
  syncLocalMicStateRef.current = syncLocalMicState;

  const refreshAgoraAuthorization = async (roomId, roomSessionId, forceRejoin = false) => {
    if (agoraAuthRefreshInFlightRef.current) {
      agoraAuthRefreshQueuedRef.current = true;
      if (forceRejoin) agoraAuthForceRejoinQueuedRef.current = true;
      return;
    }
    const engine = agoraEngineRef.current;
    const credentials = agoraCredentialsRef.current;
    const isCurrentSession = () => (
      roomSessionRef.current === roomSessionId && activeRoomIdRef.current === roomId &&
      agoraEngineRef.current === engine
    );
    if (!engine || !credentials || !isCurrentSession()) return;

    agoraAuthRefreshInFlightRef.current = true;
    try {
      const refreshed = await fetchRoomAgoraToken(roomId);
      if (!refreshed?.token) throw new Error('The server did not provide a room voice token. Please leave and rejoin the room.');
      if (
        String(refreshed.appId || '') !== String(credentials.appId) ||
        String(refreshed.channelName || '') !== String(credentials.channelName) ||
        Number(refreshed.agoraUid) !== Number(credentials.uid)
      ) {
        throw new Error('Room voice settings changed. Leave and rejoin the room to reconnect safely.');
      }
      if (!isCurrentSession()) return;

      agoraPublisherAuthorizedRef.current = true;
      credentials.token = refreshed.token;

      const desired = desiredLocalAudioRef.current;
      const renewResult = engine.renewToken(refreshed.token);
      if (renewResult !== 0 && forceRejoin) {
        try { engine.leaveChannel(); } catch (_) {}
        const canPublish = Boolean(desired.isOnSeat && !desired.isMuted);
        const role = desired.isOnSeat
          ? ClientRoleType.ClientRoleBroadcaster
          : ClientRoleType.ClientRoleAudience;
        const joinResult = engine.joinChannel(refreshed.token, credentials.channelName, credentials.uid, {
          clientRoleType: role,
          publishMicrophoneTrack: canPublish,
          autoSubscribeAudio: true,
        });
        if (joinResult !== 0) throw new Error(`Agora reconnect error (${joinResult})`);
        engine.muteLocalAudioStream(!canPublish);
        engine.enableLocalAudio(true);
      } else {
        syncLocalMicState(desired.isOnSeat, desired.isMuted);
      }

      if (Boolean(desired.isOnSeat && !desired.isMuted) === agoraPublisherAuthorizedRef.current) {
        agoraAuthRefreshAttemptsRef.current = 0;
      } else if (agoraAuthRefreshAttemptsRef.current < 2) {
        agoraAuthRefreshAttemptsRef.current += 1;
        scheduleAgoraAuthorizationRefresh(500);
      }
    } catch (error) {
      if (isCurrentSession()) {
        const message = error?.response?.data?.message || error?.message || 'Room voice authorization could not be refreshed.';
        console.warn('Agora room authorization refresh notice:', message);
        setAgoraErrorMessage(message);
        if (error?.response?.status === 401 || error?.response?.status === 403) setAgoraStatus('error');
      }
      throw error;
    } finally {
      agoraAuthRefreshInFlightRef.current = false;
      if (agoraAuthRefreshQueuedRef.current) {
        agoraAuthRefreshQueuedRef.current = false;
        scheduleAgoraAuthorizationRefresh(150);
      }
    }
  };

  const initAgoraVoice = async (roomId, roomSessionId) => {
    if (agoraInitSessionRef.current === roomSessionId) return;
    const isCurrentSession = () => (
      roomSessionRef.current === roomSessionId && activeRoomIdRef.current === roomId
    );
    agoraInitSessionRef.current = roomSessionId;
    setAgoraStatus('connecting');
    setAgoraErrorMessage(null);
    try {
      await requestMicrophonePermission();
      if (!isCurrentSession()) return;

      let creds = null;
      try {
        creds = await fetchRoomAgoraToken(roomId);
      } catch (err) {
        console.warn('Agora token fetch notice:', err?.message);
        throw new Error(err?.response?.data?.message || 'Could not authorize room voice. Check your connection and rejoin the room.');
      }
      if (!isCurrentSession()) return;

      if (!creds?.token || !creds?.appId || !creds?.channelName || !Number.isInteger(Number(creds?.agoraUid))) {
        throw new Error('The server did not provide valid room voice credentials. Please leave and rejoin the room.');
      }
      const appId = String(creds.appId);
      const channelName = String(creds.channelName);
      const uid = Number(creds.agoraUid);
      if (uid <= 0) throw new Error('The server returned an invalid voice identity. Please leave and rejoin the room.');
      const isPublisherAuthorized = creds.isPublisher !== false;
      agoraPublisherAuthorizedRef.current = isPublisherAuthorized;
      agoraCredentialsRef.current = { appId, channelName, uid, token: creds.token, roomId, roomSessionId };
      currentLocalUidRef.current = uid;
      
      const token = creds.token;

      const { engine } = AgoraClientService.prepareEngineForAppId(appId, createAgoraRtcEngine);
      agoraEngineRef.current = engine;
      engine.initialize({ appId });
      engine.enableAudio();
      engine.enableLocalAudio(true);
      engine.setChannelProfile(ChannelProfileType.ChannelProfileLiveBroadcasting);
      engine.setDefaultAudioRouteToSpeakerphone(true);
      engine.setEnableSpeakerphone(true);
      engine.muteAllRemoteAudioStreams(false);
      engine.adjustPlaybackSignalVolume(100);
      engine.adjustRecordingSignalVolume(micVolume || 100);
      engine.enableAudioVolumeIndication(200, 3, true);

      engine.registerEventHandler({
        onJoinChannelSuccess: (conn) => {
          if (!isCurrentSession() || agoraEngineRef.current !== engine) {
            try { engine.muteLocalAudioStream(true); } catch (_) {}
            try { engine.leaveChannel(); } catch (_) {}
            return;
          }
          console.warn('🎙️ [VoiceRoom] Agora Voice joined successfully! Channel:', conn?.channelId, 'UID:', conn?.localUid);
          setAgoraStatus('connected');
          setAgoraErrorMessage(null);
          const desired = desiredLocalAudioRef.current;
          syncLocalMicState(desired.isOnSeat, desired.isMuted);
          try {
            engine.enableAudioVolumeIndication(200, 3, true);
          } catch (_) {}
        },
        onAudioVolumeIndication: (conn, speakers, totalVolume) => {
          if (!isCurrentSession() || agoraEngineRef.current !== engine) return;
          const now = Date.now();
          if (now - lastVolumeReportTimeRef.current < 180) return;
          lastVolumeReportTimeRef.current = now;

          const activeIndices = new Set();
          const currentSeat = currentSeatIndexRef.current;
          const currentMuted = isMutedRef.current;

          if (Array.isArray(speakers)) {
            speakers.forEach((spk) => {
              const vol = spk?.volume || 0;
              const spkUid = spk?.uid;
              if (vol > 12) {
                if ((spkUid === 0 || spkUid === currentLocalUidRef.current) && currentSeat !== null && !currentMuted) {
                  activeIndices.add(currentSeat);
                } else if (spkUid > 0) {
                  const matchedSeat = currentSeatsRef.current.find((s) => {
                    if (!s.user) return false;
                    const uIdStr = String(s.user.userId || s.user._id || s.user.id || '');
                    const uNumeric = Number(uIdStr);
                    const legacyNumeric = parseInt(uIdStr.replace(/\D/g, '').slice(-8), 10);
                    return uNumeric === spkUid || legacyNumeric === spkUid || Number(s.user.agoraUid) === spkUid;
                  });
                  if (matchedSeat && !matchedSeat.isMuted) {
                    activeIndices.add(matchedSeat.seatIndex);
                  }
                }
              }
            });
          }

          setSpeakingSeatIndices((prev) => {
            if (prev.size === activeIndices.size && [...prev].every((x) => activeIndices.has(x))) {
              return prev;
            }
            return activeIndices;
          });
        },
        onUserJoined: (conn, remoteUid) => {
          console.warn('🎙️ [VoiceRoom] Remote speaker joined voice channel:', remoteUid);
        },
        onUserOffline: (conn, remoteUid, reason) => {
          console.warn('🎙️ [VoiceRoom] Remote speaker offline from channel:', remoteUid, reason);
        },
        onUserMuteAudio: (conn, remoteUid, muted) => {
          console.warn('🎙️ [VoiceRoom] Remote user audio mute state:', remoteUid, muted);
        },
        onAudioMixingStateChanged: (state, reason) => {
          if (!isCurrentSession() || agoraEngineRef.current !== engine || musicIntentRef.current === 'stopped') return;
          // Events from the old track must not change the pending selection.
          if (musicSwitchTimerRef.current) return;
          if (state === AudioMixingStateType.AudioMixingStateStopped && reason === AudioMixingReasonType.AudioMixingReasonAllLoopsCompleted) {
            if (isSwitchingTrackRef.current) return;
            const advance = musicIntentRef.current === 'playing' && !isSwitchingTrackRef.current;
            musicIntentRef.current = 'stopped';
            setIsMusicPlaying(false);
            setIsMusicLoading(false);
            setCurrentTrack(null);
            if (advance) onSongEndedCallbackRef.current?.();
          } else if (state === AudioMixingStateType.AudioMixingStatePlaying) {
            clearTimeout(musicLoadTimeoutRef.current);
            musicFailureHandlerRef.current = null;
            if (musicIntentRef.current === 'paused') {
              isSwitchingTrackRef.current = false;
              setIsMusicLoading(false);
              setIsMusicPlaying(false);
              try {
                if (engine.pauseAudioMixing() < 0) stopMusicMixing();
              } catch (_) { stopMusicMixing(); }
              const pending = musicPendingEnhancementRef.current;
              musicPendingEnhancementRef.current = null;
              pending?.();
              return;
            }
            setIsMusicPlaying(true);
            setIsMusicLoading(false);
            isSwitchingTrackRef.current = false;
            const pending = musicPendingEnhancementRef.current;
            musicPendingEnhancementRef.current = null;
            pending?.();
          } else if (state === AudioMixingStateType.AudioMixingStatePaused) {
            if (musicIntentRef.current !== 'paused') return;
            clearTimeout(musicLoadTimeoutRef.current);
            isSwitchingTrackRef.current = false;
            setIsMusicPlaying(false);
            setIsMusicLoading(false);
          } else if (state === AudioMixingStateType.AudioMixingStateFailed) {
            clearTimeout(musicLoadTimeoutRef.current);
            if (musicFailureHandlerRef.current) {
              musicFailureHandlerRef.current();
              return;
            }
            musicIntentRef.current = 'stopped';
            isSwitchingTrackRef.current = false;
            setIsMusicPlaying(false);
            setIsMusicLoading(false);
            setCurrentTrack(null);
          }
        },
        onError: (err, msg) => {
          if (!isCurrentSession() || agoraEngineRef.current !== engine) return;
          console.error('🎙️ [VoiceRoom] Agora engine event:', err, msg);
          setAgoraErrorMessage(`Agora Code ${err}: ${msg || 'Error'}`);
          if (err === 109 || err === 110) {
            if (agoraTokenRetryInFlightRef.current) return;
            if (agoraTokenRetrySessionRef.current === roomSessionId) {
              setAgoraStatus('error');
              setAgoraErrorMessage(`Agora rejected the refreshed room token (code ${err}). Leave and rejoin the room or contact support.`);
              return;
            }
            agoraTokenRetrySessionRef.current = roomSessionId;
            agoraTokenRetryInFlightRef.current = true;
            setAgoraStatus('connecting');
            setAgoraErrorMessage('Refreshing room voice authorization…');
            refreshAgoraAuthorization(roomId, roomSessionId, true)
              .catch((retryError) => {
                if (!isCurrentSession() || agoraEngineRef.current !== engine) return;
                const message = retryError?.response?.data?.message || retryError?.message || 'Room voice authorization failed. Please leave and rejoin the room.';
                setAgoraStatus('error');
                setAgoraErrorMessage(message);
                AlertService.show('Room voice disconnected', message, 'warning');
              })
              .finally(() => { agoraTokenRetryInFlightRef.current = false; });
          }
        },
      });

      const desired = desiredLocalAudioRef.current;
      const canPublish = Boolean(desired.isOnSeat && !desired.isMuted);
      const initialRole = desired.isOnSeat
        ? ClientRoleType.ClientRoleBroadcaster
        : ClientRoleType.ClientRoleAudience;
      const joinRes = engine.joinChannel(token, channelName, uid, {
        clientRoleType: initialRole,
        publishMicrophoneTrack: canPublish,
        autoSubscribeAudio: true,
      });
      console.warn('🎙️ [VoiceRoom] joinChannel res code:', joinRes);
      if (joinRes !== 0) throw new Error(`Agora could not join the room voice channel (code ${joinRes}).`);

      engine.enableLocalAudio(true);
      engine.muteLocalAudioStream(!canPublish);
      engine.muteAllRemoteAudioStreams(false);
    } catch (err) {
      console.warn('⚠️ Agora voice init warning:', err?.message);
      if (isCurrentSession()) {
        setAgoraStatus('error');
        setAgoraErrorMessage(err?.message || 'Init error');
      }
    } finally {
      if (agoraInitSessionRef.current === roomSessionId) {
        agoraInitSessionRef.current = null;
      }
    }
  };

  // Music Mixing Controls
  const canControlRoomMusic = () => {
    const currentUserId = String(
      currentUserRef.current?.userId || currentUserRef.current?._id || currentUserRef.current?.id || '',
    ).trim();
    return Boolean(
      activeRoomIdRef.current &&
      (isOwner || isGlobalRoomManager || (currentUserId && admins.some((id) => String(id) === currentUserId))),
    );
  };

  const startMusicMixing = (audioUri, trackName, fallbackUri = null, startPosition = 0, intent = 'playing') => {
    if (!canControlRoomMusic()) return;
    if (!audioUri || !agoraEngineRef.current) {
      AlertService.show('Music unavailable', 'Please select an audio file while room audio is connected.', 'warning');
      return;
    }
    const engine = agoraEngineRef.current;
    clearTimeout(musicSwitchTimerRef.current);
    clearTimeout(musicLoadTimeoutRef.current);
    NativeModules.MusicAudioProcessor?.cancel?.();
    const requestId = ++musicSwitchRequestRef.current;
    musicEnhanceRequestRef.current += 1;
    musicEnhancedRef.current = false;
    musicPendingEnhancementRef.current = null;
    musicSelectionRef.current = { audioUri, trackName, fallbackUri, startPosition };
    musicFailureHandlerRef.current = null;
    musicIntentRef.current = intent;
    isSwitchingTrackRef.current = true;
    setIsMusicLoading(true);
    setIsMusicPlaying(false);
    setCurrentTrack(trackName || 'Audio Track');
    setMusicEnhancementStatus('preparing');
    try { engine.stopAudioMixing(); } catch (_) {}

    let playbackUri = audioUri;
    let started = false;
    let retried = false;
    let lastPosition = startPosition;
    const isActive = () => requestId === musicSwitchRequestRef.current && agoraEngineRef.current === engine && musicIntentRef.current !== 'stopped';
    const schedule = (callback) => {
      clearTimeout(musicSwitchTimerRef.current);
      musicSwitchTimerRef.current = setTimeout(() => {
        musicSwitchTimerRef.current = null;
        if (isActive()) callback();
      }, 600);
    };
    const recover = () => {
      if (!isActive()) return;
      clearTimeout(musicLoadTimeoutRef.current);
      musicFailureHandlerRef.current = null;
      if (!retried && canControlRoomMusic()) {
        retried = true;
        musicEnhancedRef.current = false;
        musicPendingEnhancementRef.current = null;
        setMusicEnhancementStatus('unavailable');
        schedule(() => startTrack(fallbackUri || audioUri, lastPosition));
        try { engine.stopAudioMixing(); } catch (_) {}
      } else {
        stopMusicMixing();
        AlertService.show('Unable to play this song', 'Please select another song or check access to the audio file.', 'warning');
      }
    };
    const startTrack = (uri, position = startPosition) => {
      started = true;
      lastPosition = position;
      musicFailureHandlerRef.current = recover;
      musicLoadTimeoutRef.current = setTimeout(recover, 8000);
      try {
        const result = engine.startAudioMixing(uri, false, 1, Math.max(0, Math.round(position)));
        if (typeof result === 'number' && result < 0) throw new Error('Audio mixing could not start (' + result + ')');
        const selected = Math.max(0, Math.min(500, Number(musicVolumeRef.current) || 0));
        const safeVol = musicEnhancedRef.current ? Math.round(selected / 5) : Math.min(100, selected);
        engine.adjustAudioMixingPublishVolume(safeVol);
        engine.adjustAudioMixingPlayoutVolume(safeVol);
      } catch (error) {
        console.warn('Audio mixing start error:', error?.message);
        recover();
      }
    };
    const applyEnhanced = (uri, enhancementId) => {
      if (!isActive() || enhancementId !== musicEnhanceRequestRef.current) return;
      if (isSwitchingTrackRef.current) {
        musicPendingEnhancementRef.current = () => applyEnhanced(uri, enhancementId);
        return;
      }
      let position = lastPosition;
      try { position = Math.max(0, engine.getAudioMixingCurrentPosition()); } catch (_) {}
      musicEnhancedRef.current = true;
      setMusicEnhancementStatus('ready');
      isSwitchingTrackRef.current = true;
      setIsMusicLoading(true);
      clearTimeout(musicLoadTimeoutRef.current);
      schedule(() => startTrack(uri, position));
      try { engine.stopAudioMixing(); } catch (_) {}
    };
    const prepareEnhancement = async () => {
      const enhancementId = ++musicEnhanceRequestRef.current;
      musicPendingEnhancementRef.current = null;
      setMusicEnhancementStatus('preparing');
      try {
        if (!NativeModules.MusicAudioProcessor?.prepare) throw new Error('Music enhancement requires the latest Android app.');
        let uri;
        try { uri = await NativeModules.MusicAudioProcessor.prepare(audioUri, bassLevelRef.current); }
        catch (error) {
          if (!isActive() || enhancementId !== musicEnhanceRequestRef.current) return;
          if (!fallbackUri || fallbackUri === audioUri) throw error;
          uri = await NativeModules.MusicAudioProcessor.prepare(fallbackUri, bassLevelRef.current);
        }
        if (!isActive() || enhancementId !== musicEnhanceRequestRef.current) return;
        if (!started) {
          playbackUri = uri;
          musicEnhancedRef.current = true;
          setMusicEnhancementStatus('ready');
        } else applyEnhanced(uri, enhancementId);
      } catch (error) {
        if (!isActive() || enhancementId !== musicEnhanceRequestRef.current) return;
        setMusicEnhancementStatus('unavailable');
        console.warn('Background music enhancement:', error?.message);
      }
    };
    musicEnhanceHandlerRef.current = prepareEnhancement;
    // Original audio starts without waiting for decoding or bass processing.
    schedule(() => {
      if (!canControlRoomMusic()) { stopMusicMixing(); return; }
      startTrack(playbackUri);
    });
    prepareEnhancement();
  };
  const pauseMusicMixing = () => {
    if (!canControlRoomMusic()) return;
    musicIntentRef.current = "paused";
    setIsMusicPlaying(false);
    if (isSwitchingTrackRef.current) return;
    if (agoraEngineRef.current) {
      try {
        const result = agoraEngineRef.current.pauseAudioMixing();
        if (result < 0) stopMusicMixing();
      } catch (err) { stopMusicMixing(); }
    }
  };

  const resumeMusicMixing = () => {
    if (!canControlRoomMusic()) return;
    musicIntentRef.current = "playing";
    if (isSwitchingTrackRef.current) return;
    if (agoraEngineRef.current) {
      try {
        const result = agoraEngineRef.current.resumeAudioMixing();
        if (result < 0) throw new Error('Resume failed');
        setIsMusicPlaying(true);
      } catch (err) {
        const selection = musicSelectionRef.current;
        if (selection) startMusicMixing(selection.audioUri, selection.trackName, selection.fallbackUri);
        else stopMusicMixing();
      }
    } else {
      stopMusicMixing();
    }
  };

  const stopMusicMixing = () => {
    NativeModules.MusicAudioProcessor?.cancel?.();
    musicEnhanceRequestRef.current += 1;
    musicEnhanceHandlerRef.current = null;
    musicPendingEnhancementRef.current = null;
    musicEnhancedRef.current = false;
    setMusicEnhancementStatus(null);
    musicSelectionRef.current = null;
    clearTimeout(musicLoadTimeoutRef.current);
    musicFailureHandlerRef.current = null;
    musicIntentRef.current = "stopped";
    setIsMusicLoading(false);
    setIsMusicPlaying(false);
    setCurrentTrack(null);
    musicSwitchRequestRef.current += 1;
    isSwitchingTrackRef.current = false;
    if (musicSwitchTimerRef.current) {
      clearTimeout(musicSwitchTimerRef.current);
      musicSwitchTimerRef.current = null;
    }
    if (agoraEngineRef.current) {
      try {
        agoraEngineRef.current.stopAudioMixing();
        setIsMusicPlaying(false);
        setCurrentTrack(null);
      } catch (err) {}
    }
  };

  const setMusicVolume = (vol) => {
    if (!canControlRoomMusic()) return;
    const safeVol = Math.max(0, Math.min(500, Math.round(vol)));
    musicVolumeRef.current = safeVol;
    setMusicVolumeState(safeVol);
    if (agoraEngineRef.current) {
      if (volumeThrottleTimerRef.current) clearTimeout(volumeThrottleTimerRef.current);
      volumeThrottleTimerRef.current = setTimeout(() => {
        try {
          const volume = musicEnhancedRef.current ? Math.round(safeVol / 5) : Math.min(100, safeVol);
          agoraEngineRef.current?.adjustAudioMixingPublishVolume(volume);
          agoraEngineRef.current?.adjustAudioMixingPlayoutVolume(volume);
        } catch (err) {}
      }, 50);
    }
  };

  const setBassLevel = (level) => {
    const clamped = Math.max(-15, Math.min(15, Math.round(level)));
    if (clamped === bassLevelRef.current) return;
    bassLevelRef.current = clamped;
    setBassLevelState(clamped);
    const selection = musicSelectionRef.current;
    if (selection && musicIntentRef.current !== 'stopped') {
      return musicEnhanceHandlerRef.current?.();
    }
  };

  const getMusicProgress = React.useCallback(() => {
    const engine = agoraEngineRef.current;
    if (!engine || musicIntentRef.current === 'stopped' || isSwitchingTrackRef.current) return { position: 0, duration: 0 };
    try {
      return { position: Math.max(0, engine.getAudioMixingCurrentPosition()), duration: Math.max(0, engine.getAudioMixingDuration()) };
    } catch (_) { return { position: 0, duration: 0 }; }
  }, []);

  const registerOnSongEnded = (callback) => {
    onSongEndedCallbackRef.current = callback;
  };

  const seekMusicMixing = (position) => {
    const engine = agoraEngineRef.current;
    if (!canControlRoomMusic() || !engine || isSwitchingTrackRef.current || musicIntentRef.current === 'stopped') return false;
    try {
      const duration = engine.getAudioMixingDuration();
      if (duration <= 0 || !Number.isFinite(position)) return false;
      const target = Math.max(0, Math.min(duration - 1, Math.round(position)));
      return engine.setAudioMixingPosition(target) === 0;
    } catch (_) { return false; }
  };

  const setMicVolume = (vol) => {
    const clamped = Math.max(0, Math.min(200, Math.round(vol)));
    setMicVolumeState(clamped);
    if (agoraEngineRef.current) {
      try {
        agoraEngineRef.current.adjustRecordingSignalVolume(clamped);
      } catch (err) {}
    }
  };

  const setSpeakerphoneEnabled = (enabled) => {
    const next = Boolean(enabled);
    setSpeakerphoneEnabledState(next);
    try {
      agoraEngineRef.current?.setEnableSpeakerphone(next);
      agoraEngineRef.current?.setDefaultAudioRouteToSpeakerphone(next);
      InCallManager.setForceSpeakerphoneOn(next);
      InCallManager.setSpeakerphoneOn(next);
    } catch (err) {
      console.warn('Speaker route update notice:', err?.message || err);
    }
  };

  const getSeatConfig = (seatSetting) => {
    const val = Number(seatSetting) || 8;
    if (val === 15 || val === 17) {
      return { bottomCount: 15, totalCount: 17, seatsPerRow: 5, isCompact: true };
    }
    if (val === 10 || val === 12) {
      return { bottomCount: 10, totalCount: 12, seatsPerRow: 5, isCompact: true };
    }
    // Default: 8 bottom seats (Top 2 seats + Bottom 8 seats = 10 total)
    return { bottomCount: 8, totalCount: 10, seatsPerRow: 4, isCompact: false };
  };

  // Set Room Seat Layout Count (8, 10, 15)
  const setRoomSeatCount = (newCount) => {
    const config = getSeatConfig(newCount);
    const validCount = config.bottomCount;
    setSeatCount(validCount);
    setSeats((prev) => {
      const currentHost = prev[0]?.user;
      const newSeats = buildInitialSeats(validCount, currentHost);
      prev.forEach((oldSeat, idx) => {
        if (idx < newSeats.length && oldSeat.user && idx !== 0) {
          newSeats[idx].user = oldSeat.user;
          newSeats[idx].isMuted = oldSeat.isMuted;
        }
      });
      return newSeats;
    });

    const sock = socketRef.current || getSocket();
    const roomId = activeRoomIdRef.current;
    if (sock && roomId) {
      sock.emit('voice_room:update_seat_count', { roomId, seatCount: validCount });
    }
  };

  const detachSocketListeners = (sock) => {
    if (!sock) return;
    sock.off('voice_room:state');
    sock.off('voice_room:seat_updated');
    sock.off('voice_room:seat_muted');
    sock.off('voice_room:seat_locked');
    sock.off('voice_room:user_joined');
    sock.off('voice_room:user_left');
    sock.off('voice_room:chat_message');
    sock.off('voice_room:chat_cleared');
    sock.off('voice_room:reaction_received');
    sock.off('voice_room:error');
    sock.off('voice_room:theme_updated');
    sock.off('voice_room:seat_skin_updated');
    sock.off('voice_room:seat_charm_updated');
    sock.off('voice_room:moved_to_audience');
    sock.off('voice_room:user_kicked');
    sock.off('voice_room:force_leave');
    sock.off('voice_room:all_seats_locked');
    sock.off('voice_room:details_updated');
    sock.off('voice_room:live_seat_request');
    sock.off('voice_room:live_request_submitted');
    sock.off('voice_room:live_request_approved');
    sock.off('voice_room:live_request_rejected');
    sock.off('voice_room:moderation_state');
    sock.off('voice_room:manager_role_updated');
    sock.off('voice_room:force_mute');
    sock.off('room:vip-entry');
    sock.off('vip:entry');
    sock.off('entry:effect');
    if (nameEffectHandlerRef.current) {
      sock.off('identity:name-effect-updated', nameEffectHandlerRef.current);
      nameEffectHandlerRef.current = null;
    }
    sock.off('room:entry');
    if (reconnectHandlerRef.current) {
      sock.off('connect', reconnectHandlerRef.current);
      reconnectHandlerRef.current = null;
    }
  };

  // Generate empty seats
  const buildInitialSeats = (count, hostUser) => {
    const config = getSeatConfig(count);
    const totalCount = config.totalCount;
    const arr = [];
    // Seat 0 is Host
    arr.push({
      seatIndex: 0,
      isHost: true,
      user: hostUser || null,
      isMuted: false,
      isLocked: false,
    });

    for (let i = 1; i < totalCount; i++) {
      arr.push({
        seatIndex: i,
        isHost: false,
        user: null,
        isMuted: true,
        isLocked: false,
      });
    }
    return arr;
  };

  // Enter Room with Real-Time Socket Connection
  const enterRoom = async (roomData, userIsHost = false, customSeats = 8, currentUser = null) => {
    const roomId = String(roomData?.id || roomData?.roomId || '');
    const currentUserId = currentUser?.userId
      ? String(currentUser.userId)
      : (currentUser?._id || currentUser?.id)
        ? String(currentUser._id || currentUser.id)
        : null;
    if (!roomId || !currentUserId) {
      AlertService.show('Room unavailable', 'Could not identify the room or your account.', 'error');
      return false;
    }

    const roomSessionId = ++roomSessionRef.current;

    setActiveRoom(roomData);
    setIsMinimized(false);
    setOnlineUsers([]);
    setOnlineCount(0);
    seenJoinEventsRef.current.clear();
    seenLeaveEventsRef.current.clear();
    recentJoinUsersRef.current.clear();
    recentEntryUsersRef.current.clear();
    roomMemberIdsRef.current.clear();
    hasRoomMemberSnapshotRef.current = false;

    activeRoomIdRef.current = roomId;
    currentUserRef.current = currentUser;

    const roomHostId = (roomData?.hostId || roomData?.hostUserId || roomData?.creatorId)
      ? String(roomData.hostId || roomData.hostUserId || roomData.creatorId)
      : null;

    const actuallyOwner = Boolean(
      userIsHost ||
      Boolean(roomData?.isSelfHost) ||
      (currentUserId && roomHostId && (
        String(currentUserId) === String(roomHostId) ||
        normalizeRoomId(currentUserId) === normalizeRoomId(roomHostId)
      )) ||
      (currentUserId && (
        String(currentUserId) === String(roomId) ||
        normalizeRoomId(currentUserId) === normalizeRoomId(roomId)
      )) ||
      (currentUserId && (roomData?.ownerId || roomData?.owner?._id) && (
        String(currentUserId) === String(roomData.ownerId || roomData.owner?._id)
      ))
    );

    setIsOwner(actuallyOwner);
    setIsGlobalRoomManager(Boolean(currentUser?.isGlobalRoomManager));
    setSeatCount(customSeats);
    setAdmins([]);
    setBannedChatUsers([]);
    setMutedUsers([]);
    setLocallyMutedUsers([]);

    try {
      InCallManager.start({ media: 'audio', auto: false, ringback: '' });
      InCallManager.setKeepScreenOn(true);
      InCallManager.setForceSpeakerphoneOn(speakerphoneEnabled);
      InCallManager.setSpeakerphoneOn(speakerphoneEnabled);
    } catch (inCallErr) {
      console.warn('InCallManager start notice:', inCallErr?.message);
    }

    const hostObj = actuallyOwner
      ? {
          userId: currentUserId,
          name: currentUser?.name || 'You (Host)',
          avatar: currentUser?.avatar || currentUser?.image || roomData.coverImage || 'https://api.yaroapp.in/uploads/avatars/female_default.webp',
          image: currentUser?.image || currentUser?.avatar || roomData.coverImage || '',
          gender: currentUser?.gender,
          level: currentUser?.level,
          isCurrentUser: true,
          equippedFrame: currentUser?.equippedFrameAsset || currentUser?.equippedFrame || null,
          equippedFrameAsset: currentUser?.equippedFrameAsset || null,
        }
      : null;

    desiredLocalAudioRef.current = { isOnSeat: actuallyOwner, isMuted: !actuallyOwner };
    isMutedRef.current = !actuallyOwner;
    const initialSeats = buildInitialSeats(customSeats, hostObj);
    setSeats(initialSeats);

    if (actuallyOwner) {
      setCurrentSeatIndex(0);
      setIsMuted(false);
    } else {
      setCurrentSeatIndex(null);
      setIsMuted(true);
    }

    agoraPublisherAuthorizedRef.current = false;
    agoraCredentialsRef.current = null;
    agoraTokenRetrySessionRef.current = null;
    agoraAuthRefreshAttemptsRef.current = 0;
    if (agoraAuthRefreshTimerRef.current) {
      clearTimeout(agoraAuthRefreshTimerRef.current);
      agoraAuthRefreshTimerRef.current = null;
    }
    initAgoraVoice(roomId, roomSessionId);

    setChatMessages([]);
    roomMemberIdsRef.current.clear();
    hasRoomMemberSnapshotRef.current = false;

    // Helper to tag current user's seat
    const mapSeatsWithCurrentUser = (rawSeats, myUserId) => {
      if (!Array.isArray(rawSeats)) return [];
      return rawSeats.map((s) => ({
        ...s,
        user: s.user
          ? {
              ...s.user,
              isCurrentUser: Boolean(
                myUserId &&
                (String(s.user.userId) === String(myUserId) ||
                 (s.user.id && String(s.user.id) === String(myUserId)))
              ),
            }
          : null,
      }));
    };
    const isCurrentRoomEvent = (payload) => {
      if (!payload?.roomId) return true;
      const targetId = normalizeRoomId(payload.roomId);
      const candidates = [
        roomId,
        roomData?.id,
        roomData?.roomId,
        roomData?.channelName,
        roomData?._id,
        activeRoomIdRef.current,
      ].filter(Boolean).map(normalizeRoomId);
      return candidates.includes(targetId);
    };

    // Socket.IO Room Connection
    try {
      let sock = getSocket();
      if (!sock || !sock.connected) {
        sock = await initSocket();
      }

      if (roomSessionRef.current !== roomSessionId || activeRoomIdRef.current !== roomId) {
        return false;
      }

      if (sock) {
        socketRef.current = sock;
        detachSocketListeners(sock);

        // 1. Initial Synchronized Room State from Server
        sock.on('voice_room:state', (data) => {
          if (!isCurrentRoomEvent(data)) return;
          console.log('📡 [VoiceRoom] Initial state received from server:', data?.roomId);
          const hasServerOwnership = typeof data?.isOwner === 'boolean' || typeof data?.isHost === 'boolean';
          const serverSaysOwner = hasServerOwnership
            ? Boolean(data.isOwner ?? data.isHost)
            : Boolean(actuallyOwner ||
            (data?.hostUser?.userId && currentUserId && (
              String(data.hostUser.userId) === String(currentUserId) ||
              normalizeRoomId(data.hostUser.userId) === normalizeRoomId(currentUserId)
            ))
          );
          setIsOwner(serverSaysOwner);
          setIsGlobalRoomManager(Boolean(data?.isGlobalRoomManager));
          setAdmins(Array.isArray(data?.admins) ? data.admins.map(String) : []);
          setBannedChatUsers(Array.isArray(data?.bannedChatUsers) ? data.bannedChatUsers.map(String) : []);
          setMutedUsers(Array.isArray(data?.mutedUsers) ? data.mutedUsers.map(String) : []);
          if (!serverSaysOwner && currentUserId) {
            setChatMessages((prev) => {
              if (prev.some((m) => m.type === 'welcome')) return prev;
              const hostName = data?.hostUser?.name || roomData.hostName || 'Host';
              const hostAvatar = data?.hostUser?.avatar || data?.hostUser?.image || roomData.coverImage || 'https://api.yaroapp.in/uploads/avatars/male_default.webp';
              return [
                ...prev,
                {
                  id: `welcome-initial-${Date.now()}`,
                  type: 'welcome',
                  variant: 'joined',
                  targetUserId: currentUserId,
                  targetUserName: currentUser?.name || 'Friend',
                  isOwner: false,
                  roomHostName: hostName,
                  avatar: hostAvatar,
                  equippedFrame: null,
                  timestamp: Date.now(),
                },
              ];
            });
          }
          if (data?.seats && Array.isArray(data.seats) && data.seats.length > 0) {
            const mapped = mapSeatsWithCurrentUser(data.seats, currentUserId);
            setSeats(mapped);
            const mySeat = mapped.find((s) => s.user && (s.user.isCurrentUser || (s.seatIndex === 0 && serverSaysOwner)));
            if (mySeat) {
              setCurrentSeatIndex(mySeat.seatIndex);
              const forceMuted = !data?.isGlobalRoomManager && (data?.mutedUsers || []).map(String).includes(String(currentUserId));
              const shouldMute = Boolean(mySeat.isMuted || forceMuted);
              setIsMuted(shouldMute);
              syncLocalMicState(true, shouldMute);
            } else {
              setCurrentSeatIndex(null);
              setIsMuted(true);
              syncLocalMicState(false, true);
              scheduleAgoraAuthorizationRefresh();
            }
          }
          if (data?.coverImage) {
            setActiveRoom((prev) => (prev ? { ...prev, coverImage: data.coverImage } : prev));
          }
          if (data?.title) {
            setActiveRoom((prev) => (prev ? { ...prev, title: data.title } : prev));
          }
          if (data && Object.prototype.hasOwnProperty.call(data, 'about')) {
            setActiveRoom((prev) => (prev ? { ...prev, about: data.about || '' } : prev));
          }
          if (data?.uniqueId || data?.displayRoomId || data?.badgeUrl || data?.uniqueIdBadge) {
            setActiveRoom((prev) => (prev ? {
              ...prev,
              uniqueId: data.uniqueId || prev?.uniqueId,
              displayRoomId: data.displayRoomId || data.uniqueId || prev?.displayRoomId,
              badgeUrl: data.badgeUrl || data.uniqueIdBadge?.badgeIconUrl || prev?.badgeUrl,
              uniqueIdBadge: data.uniqueIdBadge || prev?.uniqueIdBadge,
            } : prev));
          }
          if (Array.isArray(data?.onlineUsers)) {
            setOnlineUsers(data.onlineUsers);
            roomMemberIdsRef.current = new Set(data.onlineUsers.flatMap((person) =>
              [person?.userId, person?.id, person?._id].filter(Boolean).map(String)
            ));
            hasRoomMemberSnapshotRef.current = true;
          }
          if (data?.onlineCount !== undefined) {
            setOnlineCount(data.onlineCount);
          }
          if (data && Object.prototype.hasOwnProperty.call(data, 'themeId')) {
            setCurrentRoomTheme(data.themeAsset || data.themeId || null);
          }
          if (data?.seatSkinAsset || data?.seatSkinId) {
            setCurrentSeatSkin(data.seatSkinAsset || data.seatSkinId);
          }
          if (data && typeof data.showSeatCharm === 'boolean') {
            setShowSeatCharm(data.showSeatCharm);
          } else {
            setShowSeatCharm(false);
          }
        });

        sock.on('voice_room:manager_role_updated', (data) => {
          setIsGlobalRoomManager(Boolean(data?.isGlobalRoomManager));
        });

        // 1.1 Reaction received broadcast
        sock.on('voice_room:reaction_received', (data) => {
          console.log('📡 [VoiceRoom] Reaction received:', data?.emoji, data?.user);
          if (data?.emoji) {
            setLastReaction({
              id: data.id || ('react-' + Date.now() + Math.random()),
              emoji: data.emoji,
              user: data.user || 'Guest',
              timestamp: Date.now(),
            });
          }
        });

        // 1.2 All seats locked broadcast
        sock.on('voice_room:all_seats_locked', (data) => {
          if (!isCurrentRoomEvent(data)) return;
          if (data?.seats && Array.isArray(data.seats)) {
            const mapped = mapSeatsWithCurrentUser(data.seats, currentUserId);
            setSeats(mapped);
            const mySeat = mapped.find((s) => s.user && s.user.isCurrentUser);
            if (mySeat) {
              setCurrentSeatIndex(mySeat.seatIndex);
            } else if (currentSeatIndexRef.current !== null && currentSeatIndexRef.current !== undefined) {
              setCurrentSeatIndex(null);
              setIsMuted(true);
              syncLocalMicState(false, true);
              scheduleAgoraAuthorizationRefresh();
            }
          }
        });

        // 1.3 Room Details (DP / Title / About) updated broadcast
        sock.on('voice_room:details_updated', (data) => {
          if (!isCurrentRoomEvent(data)) return;
          console.log('📡 [VoiceRoom] Room details updated from server:', data);
          if (data) {
            setActiveRoom((prev) => (prev ? {
              ...prev,
              coverImage: data.coverImage || prev.coverImage,
              title: data.title || prev.title,
              about: typeof data.about === 'string' ? data.about : prev.about,
              seatCount: data.seatCount || prev.seatCount,
              isLocked: typeof data.isLocked === 'boolean' ? data.isLocked : prev.isLocked,
              mode: data.mode || prev.mode,
              hasPin: typeof data.hasPin === 'boolean' ? data.hasPin : prev.hasPin,
            } : prev));
          }
        });

        // 1.4 Co-Host Live Seat Requests & Decisions
        sock.on('voice_room:live_seat_request', (data) => {
          console.log('📡 [VoiceRoom] Live seat request received from:', data?.requester?.name);
          setPendingLiveRequests((prev) => [...prev.filter((r) => r.requestId !== data.requestId), data]);
        });

        sock.on('voice_room:live_request_submitted', (data) => {
          AlertService.show('Application Sent', data?.message || 'Application sent to Host! Waiting for approval.', 'info');
        });

        sock.on('voice_room:live_request_approved', (data) => {
          console.log('📡 [VoiceRoom] Live request approved:', data);
          if (data?.targetUserId && currentUserId && String(data.targetUserId) === String(currentUserId)) {
            setCurrentSeatIndex(data.seatIndex);
            setIsMuted(false);
            syncLocalMicState(true, false);
            AlertService.show('Approved! 🎉', `Host approved your application for Live seat #${data.seatIndex + 1}!`, 'success');
          }
        });

        sock.on('voice_room:live_request_rejected', (data) => {
          console.log('📡 [VoiceRoom] Live request rejected:', data);
          if (data?.targetUserId && currentUserId && String(data.targetUserId) === String(currentUserId)) {
            AlertService.show('Application Declined', data?.message || 'Your application was declined by the room host.', 'warning');
          }
        });

        // 2. Real-Time Seat Change (Any user took or vacated a seat)
        sock.on('voice_room:seat_updated', (data) => {
          if (!isCurrentRoomEvent(data)) return;
          console.log('📡 [VoiceRoom] Real-time seat update:', data?.seatIndex, data?.user?.name);
          if (data?.seats && Array.isArray(data.seats)) {
            const mapped = mapSeatsWithCurrentUser(data.seats, currentUserId);
            setSeats(mapped);
            const mySeat = mapped.find((s) => s.user && s.user.isCurrentUser);
            if (mySeat) {
              setCurrentSeatIndex(mySeat.seatIndex);
              const isServerMuted = !isGlobalRoomManager && mutedUsers.some((id) => String(id) === String(currentUserId));
              const shouldMute = Boolean(mySeat.isMuted || isServerMuted);
              setIsMuted(shouldMute);
              syncLocalMicState(true, shouldMute);
            } else if (currentSeatIndexRef.current !== null && currentSeatIndexRef.current !== undefined) {
              setCurrentSeatIndex(null);
              setIsMuted(true);
              syncLocalMicState(false, true);
              scheduleAgoraAuthorizationRefresh();
            }
          }
        });

        // 3. Mic Mute / Unmute
        sock.on('voice_room:seat_muted', (data) => {
          if (!isCurrentRoomEvent(data)) return;
          if (data?.seats) {
            setSeats(mapSeatsWithCurrentUser(data.seats, currentUserId));
          } else if (data?.seatIndex !== undefined) {
            setSeats((prev) => prev.map((s) => (s.seatIndex === data.seatIndex ? { ...s, isMuted: data.isMuted } : s)));
          }
          if (currentSeatIndexRef.current === data.seatIndex) {
            setIsMuted(data.isMuted);
            syncLocalMicState(true, Boolean(data.isMuted));
            scheduleAgoraAuthorizationRefresh();
          }
        });

        sock.on('voice_room:moderation_state', (data) => {
          if (!isCurrentRoomEvent(data)) return;
          if (Array.isArray(data?.admins)) setAdmins(data.admins.map(String));
          if (Array.isArray(data?.bannedChatUsers)) setBannedChatUsers(data.bannedChatUsers.map(String));
          if (Array.isArray(data?.mutedUsers)) setMutedUsers(data.mutedUsers.map(String));
        });

        sock.on('voice_room:force_mute', (data) => {
          if (!isCurrentRoomEvent(data)) return;
          if (!data?.targetUserId || String(data.targetUserId) !== String(currentUserId)) return;
          if (data.isMuted) {
            setIsMuted(true);
            syncLocalMicState(currentSeatIndexRef.current !== null, true);
            scheduleAgoraAuthorizationRefresh();
          }
        });

        // 4. Seat Lock
        sock.on('voice_room:seat_locked', (data) => {
          if (!isCurrentRoomEvent(data)) return;
          if (data?.seats) {
            const mapped = mapSeatsWithCurrentUser(data.seats, currentUserId);
            setSeats(mapped);
            const mySeat = mapped.find((s) => s.user && s.user.isCurrentUser);
            if (mySeat) {
              setCurrentSeatIndex(mySeat.seatIndex);
            } else if (currentSeatIndexRef.current !== null && currentSeatIndexRef.current !== undefined) {
              setCurrentSeatIndex(null);
              setIsMuted(true);
              syncLocalMicState(false, true);
              scheduleAgoraAuthorizationRefresh();
            }
          }
        });

        // 4.1 Real-time Room Theme Updated (All users update instantly)
        sock.on('voice_room:theme_updated', (data) => {
          console.log('📡 [VoiceRoom] Room theme updated:', data?.themeId);
          if (data && Object.prototype.hasOwnProperty.call(data, 'themeId')) {
            setCurrentRoomTheme(data.themeAsset || data.themeId || null);
          }
        });

        // 4.2 Real-time Seat Skin Updated (All seats update instantly)
        sock.on('voice_room:seat_skin_updated', (data) => {
          console.log('📡 [VoiceRoom] Room seat skin updated:', data?.seatSkinId);
          if (data && Object.prototype.hasOwnProperty.call(data, 'seatSkinId')) {
            setCurrentSeatSkin(data.seatSkinAsset || data.seatSkinId || null);
          }
        });

        // 4.3 Real-time Seat Charm (Flower 🌸) Updated
        sock.on('voice_room:seat_charm_updated', (data) => {
          console.log('📡 [VoiceRoom] Room seat charm updated:', data?.showSeatCharm);
          if (data && typeof data.showSeatCharm === 'boolean') {
            setShowSeatCharm(data.showSeatCharm);
          }
        });

        // 5. User Joined Room
        sock.on('voice_room:user_joined', (data) => {
          if (!isCurrentRoomEvent(data)) return;
          console.log('📡 [VoiceRoom] User joined room:', data?.user?.name);
          if (data?.onlineCount !== undefined) setOnlineCount(data.onlineCount);
          const joinedUserIds = new Set(
            [data?.user?.userId, data?.user?.id, data?.user?._id].filter(Boolean).map(String),
          );
          joinedUserIds.forEach((id) => roomMemberIdsRef.current.add(id));
          if (joinedUserIds.size) {
            setOnlineUsers((previous) => [
              ...previous.filter((person) => ![
                person?.userId,
                person?.id,
                person?._id,
              ].filter(Boolean).some((id) => joinedUserIds.has(String(id)))),
              data.user,
            ]);
          }
          const isSelf = Boolean(
            currentUserId &&
            (String(data?.user?.userId) === String(currentUserId) ||
             String(data?.user?.id) === String(currentUserId) ||
             String(data?.user?._id) === String(currentUserId))
          );
          if (!isSelf && data?.user?.name) {
            const joinEventId =
              data.eventId ||
              `join:${data.user.userId || data.user.id || data.user.name}`;
            const joinedUserKey = String(data.user.userId || data.user.id || data.user._id || data.user.name);
            const now = Date.now();
            const lastAnnouncementAt = recentJoinUsersRef.current.get(joinedUserKey) || 0;
            if (seenJoinEventsRef.current.has(joinEventId) || now - lastAnnouncementAt < 3000) return;
            seenJoinEventsRef.current.add(joinEventId);
            recentJoinUsersRef.current.set(joinedUserKey, now);
            if (seenJoinEventsRef.current.size > 200) {
              const first = seenJoinEventsRef.current.values().next().value;
              seenJoinEventsRef.current.delete(first);
            }
            if (recentJoinUsersRef.current.size > 200) {
              const first = recentJoinUsersRef.current.keys().next().value;
              recentJoinUsersRef.current.delete(first);
            }
            // User requirement: Do NOT show welcome greeting card to existing occupants in room.
          } else if (isSelf && !actuallyOwner) {
            // User requirement: Welcome greeting card & "Come on mic" banner is ONLY shown to the user who joins!
            setChatMessages((prev) => {
              if (prev.some((m) => m.type === 'welcome')) return prev;
              const joinEventId = data?.eventId || `join-self-${Date.now()}`;
              return [
                ...prev,
                {
                  id: `welcome-${joinEventId}`,
                  type: 'welcome',
                  variant: 'joined',
                  targetUserId: currentUserId,
                  targetUserName: currentUser?.name || data?.user?.name || 'Friend',
                  isOwner: false,
                  roomHostName: roomData.hostName || 'Host',
                  avatar: roomData.coverImage || 'https://api.yaroapp.in/uploads/avatars/male_default.webp',
                  equippedFrame: null,
                  timestamp: Date.now(),
                },
              ];
            });
          }
        });

        // 6. User Left Room
        sock.on('voice_room:user_left', (data) => {
          if (!isCurrentRoomEvent(data)) return;
          const leaveEventId = String(data?.eventId || '');
          if (leaveEventId && seenLeaveEventsRef.current.has(leaveEventId)) return;
          if (leaveEventId) {
            seenLeaveEventsRef.current.add(leaveEventId);
            if (seenLeaveEventsRef.current.size > 200) {
              seenLeaveEventsRef.current.delete(seenLeaveEventsRef.current.values().next().value);
            }
          }
          console.log('📡 [VoiceRoom] User left room:', data?.user?.name);
          if (data?.onlineCount !== undefined) setOnlineCount(data.onlineCount);
          const leavingUserIds = new Set(
            [data?.user?.userId, data?.user?.id, data?.user?._id].filter(Boolean).map(String),
          );
          leavingUserIds.forEach((id) => roomMemberIdsRef.current.delete(id));
          const leavingUserName = String(data?.user?.name || '');
          const matchesLeavingUser = (value) => {
            const ids = [value?.userId, value?.user?.userId, value?.user?.id, value?.user?._id]
              .filter(Boolean).map(String);
            return ids.some((id) => leavingUserIds.has(id)) || Boolean(
              !leavingUserIds.size && leavingUserName &&
              String(value?.user?.name || value?.targetUserName || value?.name || '') === leavingUserName
            );
          };
          if (leavingUserIds.size) {
            setOnlineUsers((previous) => previous.filter((person) => ![
              person?.userId,
              person?.id,
              person?._id,
            ].filter(Boolean).some((id) => leavingUserIds.has(String(id)))));
          }
          if (data?.seats) {
            setSeats(mapSeatsWithCurrentUser(data.seats, currentUserId));
          }
          setChatMessages((previous) => previous.filter((message) =>
            message.type !== 'welcome' || !(
              leavingUserIds.has(String(message.targetUserId || '')) ||
              (!message.targetUserId && leavingUserName && message.targetUserName === leavingUserName)
            )
          ));
          setJoinedNotification((previous) => previous && !matchesLeavingUser(previous) ? previous : null);
          setActiveEntryEffect((previous) => previous && !matchesLeavingUser(previous) ? previous : null);
          setActiveVipEntry((previous) => previous && !matchesLeavingUser(previous) ? previous : null);
          if (!data?.announcementSent && data?.user?.name && (!currentUserId || String(data.user.userId) !== String(currentUserId))) {
            setChatMessages((prev) => [
              ...prev,
              {
                id: 'sys-leave-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
                type: 'system',
                text: `🚶 ${data.user.name} left the room`,
                timestamp: Date.now(),
              },
            ]);
          }
        });

        // 6.1 Moved to Audience by Admin/Host (User stays in room, mic muted)
        sock.on('voice_room:moved_to_audience', (data) => {
          if (data?.targetUserId && currentUserId && String(data.targetUserId) === String(currentUserId)) {
            setCurrentSeatIndex(null);
            setIsMuted(true);
            syncLocalMicState(false, true);
            scheduleAgoraAuthorizationRefresh();
            AlertService.show('Moved to Audience', 'Aapko host ne seat se hatakar audience me move kiya hai. Aap room me bane rahenge.', 'info');
          }
        });

        // 6.2 Kicked from Room with 24 Hours Ban
        sock.on('voice_room:user_kicked', (data) => {
          if (data?.targetUserId && currentUserId && String(data.targetUserId) === String(currentUserId)) {
            AlertService.show('Banned from Room', 'Aapko is room se 24 ghante ke liye ban kar diya gaya hai.', 'error');
            leaveRoom(currentUserRef.current);
          }
        });

        sock.on('voice_room:force_leave', (data) => {
          AlertService.show('Notice', data?.reason || 'Room session closed', 'warning');
          leaveRoom(currentUserRef.current);
        });

        // 7. Chat Message Broadcast
        sock.on('voice_room:chat_message', (msg) => {
          if (msg) {
            // Ignore redundant text-based gift messages if any
            if (msg.type === 'gift' && !msg.giftImage && !msg.transactionId) {
              return;
            }
            setChatMessages((prev) => {
              if (prev.some((m) => m.id === msg.id)) return prev;
              if (msg.type === 'system') {
                const recentSame = prev.slice(-3).find(
                  (m) => m.type === 'system' && m.text === msg.text && Math.abs((m.timestamp || 0) - (msg.timestamp || Date.now())) < 4000
                );
                if (recentSame) return prev;
              }
              return [...prev, msg];
            });
          }
        });
        sock.on('voice_room:chat_cleared', (data) => {
          if (!isCurrentRoomEvent(data)) return;
          setChatMessages([]);
        });

        // 8. Reconnect recovery: re-emit voice_room:join if connection was interrupted
        const reconnectHandler = () => {
          if (activeRoomIdRef.current) {
            console.log('📡 [VoiceRoom] Socket reconnected, re-joining room channel:', activeRoomIdRef.current);
            sock.emit('voice_room:join', {
              roomId: activeRoomIdRef.current,
              user: {
                id: currentUser?._id || currentUser?.id || '',
                userId: currentUserId,
                name: currentUser?.name || (actuallyOwner ? 'Host' : 'Guest'),
                image: currentUser?.image || currentUser?.avatar || roomData.coverImage || '',
                avatar: currentUser?.image || currentUser?.avatar || roomData.coverImage || 'https://api.yaroapp.in/uploads/avatars/female_default.webp',
                gender: currentUser?.gender,
                level: currentUser?.level,
              },
              isHost: actuallyOwner,
              customSeats,
              roomTitle: roomData.title,
            });
          }
        };
        reconnectHandlerRef.current = reconnectHandler;
        sock.on('connect', reconnectHandler);

        // 9. Error notifications
        sock.on('voice_room:error', (err) => {
          if (err?.message) {
            AlertService.show('Voice Room', err.message, 'warning');
          }
        });

        // 10. Room Entry & VIP Entry effects
        const rememberEntryEvent = (data) => {
          const userKeys = [...new Set([
            data?.user?.userId,
            data?.userId,
            data?.user?.id,
            data?.user?._id,
          ].filter(Boolean).map(String))];
          const entryId = String(data?.entryId || data?.id || '');
          const eventKey = entryId ? `event:${entryId}` : '';
          const now = Date.now();
          const hasSeenEvent = eventKey && recentEntryUsersRef.current.has(eventKey);
          const hasRecentUserEvent = userKeys.some((key) => {
            const seenAt = recentEntryUsersRef.current.get(key) || 0;
            return seenAt && now - seenAt < 400;
          });
          if (hasSeenEvent || (!eventKey && hasRecentUserEvent)) return false;
          userKeys.forEach((key) => recentEntryUsersRef.current.set(key, now));
          if (eventKey) recentEntryUsersRef.current.set(eventKey, now);
          if (recentEntryUsersRef.current.size > 200) {
            const first = recentEntryUsersRef.current.keys().next().value;
            recentEntryUsersRef.current.delete(first);
          }
          return true;
        };
        const acceptEntryEffect = (data, eventName) => {
          if (!isCurrentRoomEvent(data)) return;
          const userKeys = [data?.user?.userId, data?.userId, data?.user?.id, data?.user?._id]
            .filter(Boolean).map(String);
          if (!rememberEntryEvent(data)) return;
          console.warn(`📡 [VoiceRoom] ${eventName} received in Context:`, data?.entryId, data?.user?.name);
          if (data?.user) {
            const entryUserIds = [data.user.userId, data.userId, data.user.id, data.user._id].filter(Boolean).map(String);
            entryUserIds.forEach((id) => roomMemberIdsRef.current.add(id));
            setOnlineUsers((prev) => {
              const exists = prev.some((p) =>
                entryUserIds.includes(String(p?.userId || p?.id || p?._id || ''))
              );
              return exists ? prev : [...prev, data.user];
            });
          }
          // Preserve socket bursts that React may batch into a single render.
          setActiveEntryEffect(previous => ({
            ...data,
            queuedEntries: [...(previous?.queuedEntries || []), data].slice(-100),
          }));
        };
        const handleNameEffectUpdated = (data) => {
          const keys = [data?.userId, data?.userObjectId].filter(Boolean).map(String);
          if (!keys.length) return;
          const matches = value => [value?.userId, value?.id, value?._id, value?.senderId]
            .some(id => keys.includes(String(id)));
          const patch = value => matches(value) ? { ...value, nameEffect: data.nameEffect } : value;
          setOnlineUsers(previous => previous.map(patch));
          setSeats(previous => previous.map(seat => ({ ...seat, user: seat.user ? patch(seat.user) : null })));
          setChatMessages(previous => previous.map(patch));
        };
        nameEffectHandlerRef.current = handleNameEffectUpdated;
        sock.on('identity:name-effect-updated', handleNameEffectUpdated);
        sock.on('entry:effect', (data) => {
          acceptEntryEffect(data, 'entry:effect');
        });
        sock.on('room:entry', (data) => {
          acceptEntryEffect(data, 'room:entry');
        });
        sock.on('room:vip-entry', (data) => {
          console.log('📡 [VoiceRoom] room:vip-entry received:', data?.vipId, data?.user?.name);
          if (data?.effect || data?.entry || data?.entrance) {
            acceptEntryEffect(data, 'room:vip-entry');
            return;
          }
          if (!rememberEntryEvent(data)) return;
        });
        sock.on('vip:entry', (data) => {
          if (data?.effect || data?.entry || data?.entrance) {
            acceptEntryEffect(data, 'vip:entry');
            return;
          }
          if (!rememberEntryEvent(data)) return;
        });

        // Join room on server
        sock.emit('voice_room:join', {
          roomId,
          user: {
            id: currentUser?._id || currentUser?.id || '',
            userId: currentUserId,
            name: currentUser?.name || (actuallyOwner ? 'Host' : 'Guest'),
            image: currentUser?.image || currentUser?.avatar || roomData.coverImage || '',
            avatar: currentUser?.image || currentUser?.avatar || roomData.coverImage || 'https://api.yaroapp.in/uploads/avatars/female_default.webp',
            gender: currentUser?.gender,
            level: currentUser?.level,
            equippedFrame: currentUser?.equippedFrameAsset || currentUser?.equippedFrame || null,
            equippedFrameAsset: currentUser?.equippedFrameAsset || null,
            equippedEntry: currentUser?.equippedEntryAsset || currentUser?.equippedEntry || null,
            equippedEntryAsset: currentUser?.equippedEntryAsset || null,
            equippedTassel: currentUser?.equippedTasselAsset || currentUser?.equippedTassel || null,
            equippedTasselAsset: currentUser?.equippedTasselAsset || null,
            equippedEntrance: currentUser?.equippedEntranceAsset || currentUser?.equippedEntrance || null,
            equippedEntranceAsset: currentUser?.equippedEntranceAsset || null,
          },
          isHost: actuallyOwner,
          customSeats,
          roomTitle: roomData.title,
        });

        sock.emit('voice_room:subscribe_gifts', { roomId });
      }
    } catch (err) {
      console.warn('VoiceRoom socket initialization error:', err);
    }
  };

  // Take or Change Seat with Real-Time Broadcast
  const takeSeat = async (newSeatIndex, currentUser) => {
    const targetSeat = seats.find((s) => s.seatIndex === newSeatIndex);
    if (targetSeat?.isLocked) {
      AlertService.show('Seat Locked', 'This seat is locked by the host', 'warning');
      return false;
    }

    try {
      await requestMicrophonePermission();
    } catch (permErr) {
      console.warn('Microphone permission check on take seat:', permErr?.message || permErr);
    }

    const currentUserId = currentUser?.userId ? String(currentUser.userId) : (currentUser?._id || currentUser?.id ? String(currentUser._id || currentUser.id) : null);
    if (!currentUserId) {
      AlertService.show('Seat unavailable', 'Could not identify your account.', 'error');
      return false;
    }
    const roomId = activeRoomIdRef.current || activeRoom?.id || activeRoom?.roomId;
    const sock = socketRef.current || getSocket();
    if (!sock || !roomId) {
      AlertService.show('Seat unavailable', 'The room connection is not ready. Please try again.', 'warning');
      return false;
    }
    sock.emit('voice_room:take_seat', {
        roomId,
        seatIndex: newSeatIndex,
        user: {
          id: currentUser?._id || currentUser?.id || '',
          userId: currentUserId,
          name: currentUser?.name || 'You',
          image: currentUser?.image || currentUser?.avatar || '',
          avatar: currentUser?.image || currentUser?.avatar || 'https://api.yaroapp.in/uploads/avatars/male_default.webp',
          gender: currentUser?.gender,
          level: currentUser?.level,
          equippedFrame: currentUser?.equippedFrameAsset || currentUser?.equippedFrame || null,
          equippedFrameAsset: currentUser?.equippedFrameAsset || null,
        },
      });

    return true;
  };

  // Lock single seat
  const lockSeat = (seatIndex) => {
    if (seatIndex === 0) return;
    const roomId = activeRoomIdRef.current || activeRoom?.id || activeRoom?.roomId;
    setSeats((prev) =>
      prev.map((s) => {
        if (s.seatIndex === seatIndex) {
          return { ...s, isLocked: true, user: null };
        }
        return s;
      })
    );
    const sock = socketRef.current || getSocket();
    if (sock && roomId) {
      sock.emit('voice_room:lock_seat', { roomId, seatIndex, isLocked: true });
    }
  };

  // Unlock single seat
  const unlockSeat = (seatIndex) => {
    const roomId = activeRoomIdRef.current || activeRoom?.id || activeRoom?.roomId;
    setSeats((prev) =>
      prev.map((s) => {
        if (s.seatIndex === seatIndex) {
          return { ...s, isLocked: false };
        }
        return s;
      })
    );
    const sock = socketRef.current || getSocket();
    if (sock && roomId) {
      sock.emit('voice_room:lock_seat', { roomId, seatIndex, isLocked: false });
    }
  };

  // Toggle seat lock
  const toggleSeatLock = (seatIndex) => {
    const seat = seats.find((s) => s.seatIndex === seatIndex);
    if (!seat) return;
    if (seat.isLocked) {
      unlockSeat(seatIndex);
    } else {
      lockSeat(seatIndex);
    }
  };

  // Lock all guest seats
  const lockAllSeats = () => {
    const roomId = activeRoomIdRef.current || activeRoom?.id || activeRoom?.roomId;
    const sock = socketRef.current || getSocket();
    setSeats((prev) =>
      prev.map((s) => {
        if (s.seatIndex === 0) return s;
        return { ...s, isLocked: true, user: null };
      })
    );
    if (sock && roomId) {
      sock.emit('voice_room:lock_all_seats', { roomId, isLocked: true });
    }
  };

  // Unlock all guest seats
  const unlockAllSeats = () => {
    const roomId = activeRoomIdRef.current || activeRoom?.id || activeRoom?.roomId;
    const sock = socketRef.current || getSocket();
    setSeats((prev) =>
      prev.map((s) => {
        if (s.seatIndex === 0) return s;
        return { ...s, isLocked: false };
      })
    );
    if (sock && roomId) {
      sock.emit('voice_room:lock_all_seats', { roomId, isLocked: false });
    }
  };

  // Toggle lock all seats
  const toggleLockAllSeats = () => {
    const hasAnyUnlocked = seats.some((s) => s.seatIndex !== 0 && !s.isLocked);
    if (hasAnyUnlocked) {
      lockAllSeats();
    } else {
      unlockAllSeats();
    }
  };

  // Co-Host Live Seat Application
  const applyLiveSeat = async (seatIndex, user) => {
    const roomId = activeRoomIdRef.current || activeRoom?.id || activeRoom?.roomId;
    const sock = socketRef.current || getSocket();
    const resolvedUser = user || currentUserRef.current;
    if (!sock || !roomId) {
      AlertService.show('Seat unavailable', 'The room connection is not ready. Please try again.', 'warning');
      return false;
    }
    try {
      const microphoneGranted = await requestMicrophonePermission();
      if (!microphoneGranted) {
        AlertService.show(
          'Microphone permission needed',
          'Allow microphone access before applying for a live seat so you can speak after approval.',
          'warning',
        );
        return false;
      }
    } catch (permissionError) {
      AlertService.show('Microphone unavailable', permissionError?.message || 'Could not request microphone access.', 'error');
      return false;
    }
    if (sock && roomId) {
      sock.emit('voice_room:apply_live_seat', {
        roomId,
        seatIndex,
        user: {
          userId: resolvedUser?.userId || resolvedUser?._id || resolvedUser?.id,
          name: resolvedUser?.name || 'Guest',
          image: resolvedUser?.image || resolvedUser?.avatar || '',
        },
      });
      return true;
    }
    return false;
  };

  // Owner Response to Live Seat Application
  const respondLiveRequest = (requestId, approved) => {
    const roomId = activeRoomIdRef.current || activeRoom?.id || activeRoom?.roomId;
    const sock = socketRef.current || getSocket();
    if (sock && roomId && requestId) {
      sock.emit('voice_room:respond_live_request', {
        roomId,
        requestId,
        approved: Boolean(approved),
      });
      setPendingLiveRequests((prev) => prev.filter((r) => r.requestId !== requestId));
    }
  };

  // Vacate Seat
  const leaveSeat = (currentUser) => {
    const roomId = activeRoomIdRef.current || activeRoom?.id || activeRoom?.roomId;
    const currentUserId = currentUser?.userId
      ? String(currentUser.userId)
      : (currentUser?._id || currentUser?.id ? String(currentUser._id || currentUser.id) : null);
    const seatIdx = currentSeatIndexRef.current;

    setSeats((prev) =>
      prev.map((s) => {
        if (s.user && (s.user.isCurrentUser || String(s.user.userId) === String(currentUserId))) {
          return { ...s, user: null, isMuted: true };
        }
        return s;
      })
    );
    setCurrentSeatIndex(null);
    setIsMuted(true);
    syncLocalMicState(false, true);

    const sock = socketRef.current || getSocket();
    if (sock && roomId) {
      sock.emit('voice_room:leave_seat', {
        roomId,
        seatIndex: seatIdx,
        user: { userId: currentUserId, name: currentUser?.name || 'You' },
      });
      scheduleAgoraAuthorizationRefresh();
    }
  };

  // Minimize (Keep in Floating Mode)
  const minimizeRoom = () => {
    setIsMinimized(true);
    if (navigationRef.current) {
      if (navigationRef.current.canGoBack()) {
        navigationRef.current.goBack();
      } else {
        navigationRef.current.navigate('MainTabs');
      }
    }
  };

  // Maximize (Restore from Floating Mode)
  const maximizeRoom = () => {
    setIsMinimized(false);
    if (navigationRef.current && activeRoom) {
      navigationRef.current.navigate('VoiceRoom', { room: activeRoom });
    }
  };

  // Leave completely
  const leaveRoom = (currentUser) => {
    const leavingSeatIndex = currentSeatIndexRef.current;
    // Invalidate pending permission/token requests and delayed retries before teardown.
    roomSessionRef.current += 1;
    agoraInitSessionRef.current = null;
    if (agoraRetryTimerRef.current) {
      clearTimeout(agoraRetryTimerRef.current);
      agoraRetryTimerRef.current = null;
    }
    if (agoraAuthRefreshTimerRef.current) {
      clearTimeout(agoraAuthRefreshTimerRef.current);
      agoraAuthRefreshTimerRef.current = null;
    }
    agoraAuthRefreshQueuedRef.current = false;
    agoraAuthForceRejoinQueuedRef.current = false;
    agoraPublisherAuthorizedRef.current = false;
    agoraCredentialsRef.current = null;
    if (musicSwitchTimerRef.current) {
      clearTimeout(musicSwitchTimerRef.current);
      musicSwitchTimerRef.current = null;
    }
    musicSwitchRequestRef.current += 1;
    musicIntentRef.current = "stopped";
    clearTimeout(musicLoadTimeoutRef.current);
    musicFailureHandlerRef.current = null;
    setIsMusicLoading(false);
    musicSelectionRef.current = null;
    isSwitchingTrackRef.current = false;
    musicEnhanceRequestRef.current += 1;
    musicEnhanceHandlerRef.current = null;
    musicPendingEnhancementRef.current = null;
    musicEnhancedRef.current = false;
    setMusicEnhancementStatus(null);
    NativeModules.MusicAudioProcessor?.cancel?.();
    if (volumeThrottleTimerRef.current) {
      clearTimeout(volumeThrottleTimerRef.current);
      volumeThrottleTimerRef.current = null;
    }
    desiredLocalAudioRef.current = { isOnSeat: false, isMuted: true };
    isMutedRef.current = true;
    currentSeatIndexRef.current = null;

    try {
      InCallManager.setKeepScreenOn(false);
      InCallManager.stop();
    } catch (_) {}

    const engine = agoraEngineRef.current;
    agoraEngineRef.current = null;
    if (engine) {
      try { engine.muteLocalAudioStream(true); } catch (_) {}
      try { engine.enableLocalAudio(false); } catch (_) {}
      try { engine.leaveChannel(); } catch (_) {}
      try { engine.release(); } catch (_) {}
    }
    setAgoraStatus('disconnected');
    setAgoraErrorMessage(null);

    const roomId = activeRoomIdRef.current || activeRoom?.id || activeRoom?.roomId;
    const sock = socketRef.current || getSocket();
    const resolvedCurrentUser = currentUser || currentUserRef.current;
    const userPayload = {
      userId: resolvedCurrentUser?.userId || resolvedCurrentUser?._id || resolvedCurrentUser?.id || 'guest',
      name: resolvedCurrentUser?.name || 'User',
    };

    if (sock && roomId) {
      if (leavingSeatIndex !== null) {
        sock.emit('voice_room:leave_seat', {
          roomId,
          seatIndex: leavingSeatIndex,
          user: userPayload,
        });
      }

      sock.emit('voice_room:leave', {
        roomId,
        user: userPayload,
      });
      detachSocketListeners(sock);
      socketRef.current = null;
    }
    activeRoomIdRef.current = null;
    setActiveRoom(null);
    roomMemberIdsRef.current.clear();
    hasRoomMemberSnapshotRef.current = false;
    setIsMinimized(false);
    setCurrentSeatIndex(null);
    setIsMuted(true);
    setIsOwner(false);
    setIsGlobalRoomManager(false);
    setSeats([]);
    setOnlineUsers([]);
    setOnlineCount(0);
    setChatMessages([]);
    setAdmins([]);
    setBannedChatUsers([]);
    setMutedUsers([]);
    setLocallyMutedUsers([]);
    setActiveEntryEffect(null);
    setActiveVipEntry(null);
    setIsMusicPlaying(false);
    setCurrentTrack(null);
    if (navigationRef.current) {
      if (navigationRef.current.canGoBack()) {
        navigationRef.current.goBack();
      } else {
        navigationRef.current.navigate('MainTabs');
      }
    }
  };

  // Toggle Mute
  const toggleMic = (currentUser) => {
    const roomId = activeRoomIdRef.current || activeRoom?.id || activeRoom?.roomId;
    const seatIdx = currentSeatIndexRef.current;
    if (seatIdx === null || seatIdx === undefined) return;
    const currentUserId = String(currentUser?.userId || currentUser?._id || currentUser?.id || '');
    if (!isGlobalRoomManager && mutedUsers.some((id) => String(id) === currentUserId)) {
      setIsMuted(true);
      syncLocalMicState(true, true);
      AlertService.show('Mic Muted by Admin', 'A room admin has muted your microphone.', 'warning');
      return;
    }

    const next = !isMuted;
    setIsMuted(next);
    syncLocalMicState(true, next);
    setSeats((seatList) => seatList.map((s) =>
      s.seatIndex === seatIdx && s.user ? { ...s, isMuted: next } : s
    ));
    const sock = socketRef.current || getSocket();
    if (sock && roomId) {
      sock.emit('voice_room:mute_seat', { roomId, seatIndex: seatIdx, isMuted: next });
    }
  };

  // Send real-time chat message via socket
  const broadcastChatMessage = (msg, extraBubble = null) => {
    const roomId = activeRoomIdRef.current || activeRoom?.id || activeRoom?.roomId;
    const sock = socketRef.current || getSocket();
    if (sock && roomId && msg) {
      const enrichedMsg = {
        ...msg,
        chatBubble: extraBubble || msg.chatBubble || currentUserRef.current?.equippedChatBubbleAsset || currentUserRef.current?.equippedChatBubble || null,
        chatBubbleId: msg.chatBubbleId || currentUserRef.current?.equippedChatBubble || null,
      };
      sock.emit('voice_room:send_chat', { roomId, message: enrichedMsg });
    }
  };

  // Update Room Theme (Owner Only - updates real time for all users)
  const updateRoomTheme = (theme) => {
    const roomId = activeRoomIdRef.current || activeRoom?.id || activeRoom?.roomId;
    const sock = socketRef.current || getSocket();
    if (theme) {
      setCurrentRoomTheme(theme);
    }
    if (sock && roomId && theme) {
      const themeId = theme.itemId || theme.id || theme._id || 'default';
      sock.emit('voice_room:update_theme', {
        roomId,
        themeId,
        themeAsset: theme,
      });
    }
  };

  // Update Room Seat Skin (Owner Only - updates real time for all seats)
  const updateRoomSeatSkin = (seatSkin) => {
    const roomId = activeRoomIdRef.current || activeRoom?.id || activeRoom?.roomId;
    const sock = socketRef.current || getSocket();
    if (sock && roomId && seatSkin) {
      const skinId = seatSkin.itemId || seatSkin.id || seatSkin._id;
      setCurrentSeatSkin(seatSkin);
      sock.emit('voice_room:update_seat_skin', {
        roomId,
        seatSkinId: skinId,
        seatSkinAsset: seatSkin,
      });
    }
  };

  // Update Room Seat Charm / Flower 🌸 Visibility (Tool toggle - updates real time)
  const updateSeatCharm = (visible) => {
    const nextVal = Boolean(visible);
    setShowSeatCharm(nextVal);
    const roomId = activeRoomIdRef.current || activeRoom?.id || activeRoom?.roomId;
    const sock = socketRef.current || getSocket();
    if (sock && roomId) {
      sock.emit('voice_room:update_seat_charm', {
        roomId,
        showSeatCharm: nextVal,
      });
    }
  };

  // Send real-time reaction via socket
  const broadcastReaction = (emoji, userName) => {
    const roomId = activeRoomIdRef.current || activeRoom?.id || activeRoom?.roomId;
    const sock = socketRef.current || getSocket();
    if (sock && roomId && emoji) {
      sock.emit('voice_room:reaction', { roomId, emoji, user: userName });
    }
  };

  // Clear Chat
  const clearChat = () => {
    const roomId = activeRoomIdRef.current || activeRoom?.id || activeRoom?.roomId;
    const sock = socketRef.current || getSocket();
    if (!roomId || !sock) {
      AlertService.show('Chat unavailable', 'The room connection is not ready. Please try again.', 'warning');
      return;
    }
    AlertService.show(
      'Clear room chat?',
      'This clears the messages currently shown to everyone in the room. Saved private and system messages are not affected.',
      'warning',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear chat', style: 'destructive', onPress: () => sock.emit('voice_room:clear_chat', { roomId }) },
      ],
    );
  };

  // Toggle Admin Status
  const toggleAdmin = (targetUserId, targetName) => {
    const targetId = String(targetUserId || '');
    const roomId = activeRoomIdRef.current || activeRoom?.id || activeRoom?.roomId;
    const sock = socketRef.current || getSocket();
    if (!targetId || !roomId || !sock) return;
    sock.emit('voice_room:toggle_admin', { roomId, targetUserId: targetId });
    AlertService.show('Room Admin', `${targetName || 'User'} admin access update sent.`, 'info');
  };

  // Toggle Chat Ban
  const toggleChatBan = (targetUserId, targetName) => {
    const targetId = String(targetUserId || '');
    const roomId = activeRoomIdRef.current || activeRoom?.id || activeRoom?.roomId;
    const sock = socketRef.current || getSocket();
    if (!targetId || !roomId || !sock) return;
    sock.emit('voice_room:toggle_chat_ban', { roomId, targetUserId: targetId });
    AlertService.show('Room Chat', `${targetName || 'User'} chat access update sent.`, 'info');
  };

  // Force Mute/Unmute Mic of user
  const toggleMuteUser = (targetUserId, targetName) => {
    const targetId = String(targetUserId || '');
    if (!targetId) return;
    const actorId = String(currentUserRef.current?.userId || currentUserRef.current?._id || currentUserRef.current?.id || '');
    const isModerator = isOwner || admins.some((id) => String(id) === actorId);
    if (isModerator) {
      const roomId = activeRoomIdRef.current || activeRoom?.id || activeRoom?.roomId;
      const sock = socketRef.current || getSocket();
      if (!roomId || !sock) return;
      sock.emit('voice_room:toggle_user_mute', { roomId, targetUserId: targetId });
      return;
    }

    const isCurrentlyMuted = locallyMutedUsers.some((id) => String(id) === targetId);
    const nextMuted = !isCurrentlyMuted;
    setLocallyMutedUsers((prev) => nextMuted
      ? [...prev.filter((id) => String(id) !== targetId), targetId]
      : prev.filter((id) => String(id) !== targetId)
    );
    const targetSeat = seats.find((seat) => String(seat.user?.userId || seat.user?.id || seat.user?._id || '') === targetId);
    const rawUid = targetSeat?.user?.agoraUid || targetSeat?.user?.numericUserId || targetId.replace(/\D/g, '').slice(-8);
    const remoteUid = Number(rawUid) || 1000;
    try {
      agoraEngineRef.current?.muteRemoteAudioStream(remoteUid, nextMuted);
    } catch (_) {}
    AlertService.show('Room Audio', `${targetName || 'User'} is ${nextMuted ? 'muted' : 'audible'} for you.`, 'info');
  };

  // Remove from seat to audience (stays in room, can take seat again)
  const removeFromSeat = (targetUserId, targetName) => {
    setSeats((prev) =>
      prev.map((s) => {
        if (s.user && (String(s.user.userId) === String(targetUserId) || String(s.user._id) === String(targetUserId) || String(s.user.id) === String(targetUserId))) {
          return { ...s, user: null, isMuted: true };
        }
        return s;
      })
    );
    const roomId = activeRoomIdRef.current || activeRoom?.id || activeRoom?.roomId;
    const sock = socketRef.current || getSocket();
    if (sock && roomId) {
      sock.emit('voice_room:kick_from_seat', { roomId, targetUserId, targetName });
    }
    AlertService.show('Moved to Audience', `${targetName} was moved to audience`, 'info');
  };

  // Kick from seat (alias for removeFromSeat)
  const kickFromSeat = removeFromSeat;

  // Kick from room with 24 Hours Ban (user cannot re-join for 24 hours)
  const kickFromRoom24h = (targetUserId, targetName) => {
    setSeats((prev) =>
      prev.map((s) => {
        if (s.user && (String(s.user.userId) === String(targetUserId) || String(s.user._id) === String(targetUserId) || String(s.user.id) === String(targetUserId))) {
          return { ...s, user: null, isMuted: true };
        }
        return s;
      })
    );
    setOnlineUsers((prev) => prev.filter((u) => String(u.userId) !== String(targetUserId)));
    setChatMessages((prev) => [
      ...prev,
      { id: 'kick-' + Date.now(), type: 'system', text: `🚫 ${targetName} was kicked from the room by Administrator (24 Hours Ban).` },
    ]);

    const roomId = activeRoomIdRef.current || activeRoom?.id || activeRoom?.roomId;
    const sock = socketRef.current || getSocket();
    if (sock && roomId) {
      sock.emit('voice_room:kick_user', { roomId, targetUserId, targetName, ban24h: true });
    }
    AlertService.show('Kicked (24h Ban)', `${targetName} has been kicked and banned for 24 hours`, 'error');
  };

  const kickFromRoom = kickFromRoom24h;

  // Update room settings (title, cover, about, seats, lock)
  const updateRoomDetails = (updatedData) => {
    setActiveRoom((prev) => ({ ...prev, ...updatedData }));
    const roomId = activeRoomIdRef.current || activeRoom?.id || activeRoom?.roomId;
    const sock = socketRef.current || getSocket();
    if (sock && roomId) {
      sock.emit('voice_room:update_details', {
        roomId,
        ...updatedData,
      });
    }
    if (updatedData.seatCount) {
      setSeatCount(updatedData.seatCount);
      setSeats((prev) => {
        const count = updatedData.seatCount;
        if (prev.length === count) return prev;
        if (prev.length < count) {
          const added = [];
          for (let i = prev.length; i < count; i++) {
            added.push({ seatIndex: i, isHost: false, user: null, isMuted: true });
          }
          return [...prev, ...added];
        } else {
          return prev.slice(0, count);
        }
      });
    }
  };

  return (
    <VoiceRoomContext.Provider
      value={{
        activeRoom,
        isMinimized,
        isMuted,
        currentSeatIndex,
        isOwner,
        isGlobalRoomManager,
        admins,
        bannedChatUsers,
        mutedUsers,
        locallyMutedUsers,
        seatCount,
        seats,
        speakingSeatIndices,
        pendingLiveRequests,
        lastReaction,
        onlineCount,
        onlineUsers,
        joinedNotification,
        setJoinedNotification,
        activeEntryEffect,
        setActiveEntryEffect,
        activeVipEntry,
        setActiveVipEntry,
        chatMessages,
        enterRoom,
        updateRoomDetails,
        takeSeat,
        leaveSeat,
        applyLiveSeat,
        respondLiveRequest,
        minimizeRoom,
        maximizeRoom,
        leaveRoom,
        toggleMic,
        clearChat,
        toggleAdmin,
        toggleChatBan,
        toggleMuteUser,
        kickFromSeat,
        removeFromSeat,
        kickFromRoom,
        kickFromRoom24h,
        setChatMessages,
        lockSeat,
        unlockSeat,
        toggleSeatLock,
        lockAllSeats,
        unlockAllSeats,
        toggleLockAllSeats,
        broadcastChatMessage,
        broadcastReaction,
        agoraStatus,
        agoraErrorMessage,
        isMusicPlaying,
        isMusicLoading,
        musicEnhancementStatus,
        getMusicProgress,
        seekMusicMixing,
        currentTrack,
        musicVolume,
        bassLevel,
        micVolume,
        speakerphoneEnabled,
        startMusicMixing,
        pauseMusicMixing,
        resumeMusicMixing,
        stopMusicMixing,
        setMusicVolume,
        setBassLevel,
        registerOnSongEnded,
        setMicVolume,
        setSpeakerphoneEnabled,
        setRoomSeatCount,
        currentRoomTheme,
        currentSeatSkin,
        updateRoomTheme,
        updateRoomSeatSkin,
        showSeatCharm,
        setShowSeatCharm,
        updateSeatCharm,
      }}
    >
      {children}
    </VoiceRoomContext.Provider>
  );
};

export const useVoiceRoom = () => {
  const context = useContext(VoiceRoomContext);
  if (!context) {
    throw new Error('useVoiceRoom must be used within a VoiceRoomProvider');
  }
  return context;
};
