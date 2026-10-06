import React, { createContext, useContext, useState, useRef } from 'react';
import { navigationRef } from '../utils/navigationRef';
import { AlertService } from '../utils/AlertService';
import { getSocket, initSocket } from '../sockets';
import { apiUtil } from '../utils/apiUtil';
import { requestMicrophonePermission } from '../utils/permissions';
import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
} from 'react-native-agora';
import InCallManager from 'react-native-incall-manager';
import { generateAgoraRtcToken, AGORA_APP_ID, AGORA_APP_CERTIFICATE, AGORA_SECONDARY_CERTIFICATE } from '../utils/agoraTokenUtil';

const VoiceRoomContext = createContext();

export const VoiceRoomProvider = ({ children }) => {
  const [activeRoom, setActiveRoom] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentSeatIndex, setCurrentSeatIndex] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [bannedChatUsers, setBannedChatUsers] = useState([]);
  const [mutedUsers, setMutedUsers] = useState([]);
  const [seatCount, setSeatCount] = useState(8);
  const [onlineCount, setOnlineCount] = useState(1);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [joinedNotification, setJoinedNotification] = useState(null);

  const [seats, setSeats] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [activeEntryEffect, setActiveEntryEffect] = useState(null);
  const [activeVipEntry, setActiveVipEntry] = useState(null);
  const [currentRoomTheme, setCurrentRoomTheme] = useState(null);
  const [currentSeatSkin, setCurrentSeatSkin] = useState(null);

  // Agora State & Diagnostics
  const [agoraStatus, setAgoraStatus] = useState('disconnected'); // 'connecting' | 'connected' | 'error'
  const [agoraErrorMessage, setAgoraErrorMessage] = useState(null);

  // Music Player State
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [musicVolume, setMusicVolumeState] = useState(80);
  const [micVolume, setMicVolumeState] = useState(100);

  const socketRef = useRef(null);
  const activeRoomIdRef = useRef(null);
  const currentSeatIndexRef = useRef(null);
  const currentUserRef = useRef(null);
  const agoraEngineRef = useRef(null);
  const isAgoraConnectingRef = useRef(false);
  const reconnectHandlerRef = useRef(null);
  const seenJoinEventsRef = useRef(new Set());
  const entryFallbackTimersRef = useRef(new Map());

  // Sync ref with current seat
  currentSeatIndexRef.current = currentSeatIndex;

  const initAgoraVoice = async (roomId, currentUserId, isBroadcaster) => {
    if (isAgoraConnectingRef.current) return;
    isAgoraConnectingRef.current = true;
    setAgoraStatus('connecting');
    setAgoraErrorMessage(null);
    try {
      await requestMicrophonePermission();

      let creds = null;
      try {
        const res = await apiUtil.get(`/voice-club/rooms/${roomId}/agora-token?userId=${currentUserId || ''}`);
        if (res.data?.success && res.data?.data) {
          creds = res.data.data;
        }
      } catch (err) {
        console.warn('Agora token fetch notice:', err?.message);
      }

      const appId = creds?.appId || AGORA_APP_ID;
      const channelName = creds?.channelName || `voiceroom_${roomId}`;
      const uid = creds?.agoraUid || (currentUserId ? (parseInt(String(currentUserId).replace(/\D/g, '').slice(-8), 10) || 1000) : (Math.floor(Math.random() * 1e8) + 1000));
      
      let token = creds?.token || '';
      if (!token) {
        token = generateAgoraRtcToken({ appId, appCertificate: AGORA_APP_CERTIFICATE, channelName, uid });
        console.warn('🎙️ [VoiceRoom] Generated local signed Agora RTC token for channel:', channelName, 'UID:', uid);
      }

      let engine = agoraEngineRef.current;
      if (!engine) {
        engine = createAgoraRtcEngine();
        agoraEngineRef.current = engine;
        engine.initialize({ appId });
        engine.enableAudio();
        engine.enableLocalAudio(true);
        engine.setChannelProfile(ChannelProfileType.ChannelProfileCommunication);
        engine.setDefaultAudioRouteToSpeakerphone(true);
        engine.setEnableSpeakerphone(true);
      }

      engine.setDefaultAudioRouteToSpeakerphone(true);
      engine.setEnableSpeakerphone(true);

      engine.registerEventHandler({
        onJoinChannelSuccess: (conn) => {
          console.warn('🎙️ [VoiceRoom] Agora Voice joined successfully! Channel:', conn?.channelId, 'UID:', conn?.localUid);
          setAgoraStatus('connected');
          setAgoraErrorMessage(null);
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
        onError: (err, msg) => {
          console.error('🎙️ [VoiceRoom] Agora engine event:', err, msg);
          setAgoraErrorMessage(`Agora Code ${err}: ${msg || 'Error'}`);
          if (err === 109 || err === 110) {
            console.warn('🎙️ [VoiceRoom] Token auth error (109/110). Attempting retry with secondary certificate...');
            try {
              engine.leaveChannel();
              const secondaryToken = generateAgoraRtcToken({
                appId,
                appCertificate: AGORA_SECONDARY_CERTIFICATE,
                channelName,
                uid,
              });
              setTimeout(() => {
                const retryCode = engine.joinChannel(secondaryToken, channelName, uid, {
                  clientRoleType: ClientRoleType.ClientRoleBroadcaster,
                  publishMicrophoneTrack: true,
                  autoSubscribeAudio: true,
                });
                console.warn('🎙️ [VoiceRoom] Secondary token join result:', retryCode);
                if (retryCode !== 0) {
                  // Fallback to empty token
                  setTimeout(() => {
                    engine.joinChannel('', channelName, uid, {
                      clientRoleType: ClientRoleType.ClientRoleBroadcaster,
                      publishMicrophoneTrack: true,
                      autoSubscribeAudio: true,
                    });
                  }, 300);
                }
              }, 300);
            } catch (retryErr) {
              console.error('🎙️ [VoiceRoom] Token fallback retry failed:', retryErr);
            }
          }
        },
      });

      const joinRes = engine.joinChannel(token, channelName, uid, {
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
        publishMicrophoneTrack: Boolean(isBroadcaster),
        autoSubscribeAudio: true,
      });
      console.warn('🎙️ [VoiceRoom] joinChannel res code:', joinRes);

      if (isBroadcaster) {
        engine.muteLocalAudioStream(false);
      } else {
        engine.muteLocalAudioStream(true);
      }
    } catch (err) {
      console.warn('⚠️ Agora voice init warning:', err?.message);
      setAgoraStatus('error');
      setAgoraErrorMessage(err?.message || 'Init error');
    } finally {
      isAgoraConnectingRef.current = false;
    }
  };

  // Music Mixing Controls
  const startMusicMixing = (audioUri, trackName, fallbackUri = null) => {
    if (!audioUri) return;
    if (agoraEngineRef.current) {
      try {
        agoraEngineRef.current.startAudioMixing(audioUri, false, 1);
        agoraEngineRef.current.adjustAudioMixingPublishVolume(musicVolume);
        agoraEngineRef.current.adjustAudioMixingVolume(musicVolume);
        setIsMusicPlaying(true);
        setCurrentTrack(trackName || 'Audio Track');
        console.warn('🎵 [VoiceRoom] Started audio mixing for track:', trackName);
      } catch (err) {
        console.warn('⚠️ Start audio mixing error:', err?.message);
        if (fallbackUri && fallbackUri !== audioUri) {
          try {
            console.warn('🎵 [VoiceRoom] Retrying audio mixing with fallback URI:', fallbackUri);
            agoraEngineRef.current.startAudioMixing(fallbackUri, false, 1);
            agoraEngineRef.current.adjustAudioMixingPublishVolume(musicVolume);
            agoraEngineRef.current.adjustAudioMixingVolume(musicVolume);
            setIsMusicPlaying(true);
            setCurrentTrack(trackName || 'Audio Track');
          } catch (retryErr) {
            console.warn('⚠️ Audio mixing fallback also failed:', retryErr?.message);
          }
        }
      }
    }
  };

  const pauseMusicMixing = () => {
    if (agoraEngineRef.current) {
      try {
        agoraEngineRef.current.pauseAudioMixing();
        setIsMusicPlaying(false);
      } catch (err) {}
    }
  };

  const resumeMusicMixing = () => {
    if (agoraEngineRef.current) {
      try {
        agoraEngineRef.current.resumeAudioMixing();
        setIsMusicPlaying(true);
      } catch (err) {}
    }
  };

  const stopMusicMixing = () => {
    if (agoraEngineRef.current) {
      try {
        agoraEngineRef.current.stopAudioMixing();
        setIsMusicPlaying(false);
        setCurrentTrack(null);
      } catch (err) {}
    }
  };

  const setMusicVolume = (vol) => {
    const clamped = Math.max(0, Math.min(200, Math.round(vol)));
    setMusicVolumeState(clamped);
    if (agoraEngineRef.current) {
      try {
        agoraEngineRef.current.adjustAudioMixingPublishVolume(clamped);
        agoraEngineRef.current.adjustAudioMixingVolume(clamped);
      } catch (err) {}
    }
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
    sock.off('voice_room:reaction_received');
    sock.off('voice_room:error');
    sock.off('voice_room:theme_updated');
    sock.off('voice_room:seat_skin_updated');
    sock.off('voice_room:moved_to_audience');
    sock.off('voice_room:user_kicked');
    sock.off('voice_room:force_leave');
    sock.off('room:vip-entry');
    sock.off('vip:entry');
    sock.off('entry:effect');
    sock.off('room:entry');
    if (reconnectHandlerRef.current) {
      sock.off('connect', reconnectHandlerRef.current);
      reconnectHandlerRef.current = null;
    }
    entryFallbackTimersRef.current.forEach((timer) => clearTimeout(timer));
    entryFallbackTimersRef.current.clear();
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
    setActiveRoom(roomData);
    setIsMinimized(false);
    setOnlineUsers([]);
    setOnlineCount(1);
    seenJoinEventsRef.current.clear();
    entryFallbackTimersRef.current.forEach((timer) => clearTimeout(timer));
    entryFallbackTimersRef.current.clear();

    const roomId = String(roomData.id || roomData.roomId || ('room-' + Date.now()));
    activeRoomIdRef.current = roomId;
    currentUserRef.current = currentUser;

    const currentUserId = currentUser?.userId ? String(currentUser.userId) : (currentUser?._id ? String(currentUser._id) : null);
    const roomHostId = (roomData?.hostId || roomData?.hostUserId || roomData?.creatorId)
      ? String(roomData.hostId || roomData.hostUserId || roomData.creatorId)
      : null;

    const actuallyOwner = Boolean(
      userIsHost ||
      Boolean(roomData?.isSelfHost) ||
      (currentUserId && roomHostId && currentUserId === roomHostId)
    );

    setIsOwner(actuallyOwner);
    setSeatCount(customSeats);
    setAdmins([]);
    setBannedChatUsers([]);
    setMutedUsers([]);

    const hostObj = actuallyOwner
      ? {
          userId: currentUserId || '10000001',
          name: currentUser?.name || 'You (Host)',
          avatar: currentUser?.avatar || currentUser?.image || roomData.coverImage || 'https://api.yaroapp.in/uploads/avatars/female_default.webp',
          image: currentUser?.image || currentUser?.avatar || roomData.coverImage || '',
          gender: currentUser?.gender || 'male',
          level: currentUser?.level || 1,
          isCurrentUser: true,
          equippedFrame: currentUser?.equippedFrameAsset || currentUser?.equippedFrame || null,
          equippedFrameAsset: currentUser?.equippedFrameAsset || null,
        }
      : {
          userId: roomData.hostId || '10000099',
          name: roomData.hostName || 'Host',
          avatar: roomData.hostAvatar || roomData.coverImage || 'https://api.yaroapp.in/uploads/avatars/female_default.webp',
          image: roomData.hostAvatar || roomData.coverImage || '',
          gender: 'female',
          level: 1,
          equippedFrame: roomData.hostEquippedFrameAsset || roomData.hostEquippedFrame || null,
          equippedFrameAsset: roomData.hostEquippedFrameAsset || null,
        };

    const initialSeats = buildInitialSeats(customSeats, hostObj);
    setSeats(initialSeats);

    if (actuallyOwner) {
      setCurrentSeatIndex(0);
      setIsMuted(false);
    } else {
      setCurrentSeatIndex(null);
      setIsMuted(true);
    }

    initAgoraVoice(roomId, currentUserId, actuallyOwner);

    setChatMessages([
      {
        id: 'sys-rule-1',
        type: 'system',
        text: '🛡️ Room Guidelines: Please respect each other and chat in friendly manner. Abuse, sexual and violent contents are not allowed. All violators will be banned.',
      },
      {
        id: 'welcome-self-' + Date.now(),
        type: 'welcome',
        variant: 'self',
        targetUserName: currentUser?.name || (actuallyOwner ? 'Host' : 'Guest'),
        isOwner: actuallyOwner,
        roomHostName: actuallyOwner ? (currentUser?.name || 'Customer Service') : (roomData.hostName || 'Customer Service'),
        avatar: currentUser?.image || currentUser?.avatar || 'https://api.yaroapp.in/uploads/avatars/female_default.webp',
        equippedFrame: currentUser?.equippedFrameAsset || currentUser?.equippedFrame || null,
        timestamp: Date.now(),
      },
    ]);

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

    // Socket.IO Room Connection
    try {
      let sock = getSocket();
      if (!sock || !sock.connected) {
        sock = await initSocket();
      }

      if (sock) {
        socketRef.current = sock;
        detachSocketListeners(sock);

        // 1. Initial Synchronized Room State from Server
        sock.on('voice_room:state', (data) => {
          console.log('📡 [VoiceRoom] Initial state received from server:', data?.roomId);
          if (data?.seats && Array.isArray(data.seats) && data.seats.length > 0) {
            const mapped = mapSeatsWithCurrentUser(data.seats, currentUserId);
            setSeats(mapped);
            const mySeat = mapped.find((s) => s.user && (s.user.isCurrentUser || (s.seatIndex === 0 && actuallyOwner)));
            if (mySeat) {
              setCurrentSeatIndex(mySeat.seatIndex);
              setIsMuted(mySeat.isMuted);
            }
          }
          if (Array.isArray(data?.onlineUsers)) setOnlineUsers(data.onlineUsers);
          if (data?.onlineCount !== undefined) {
            setOnlineCount(data.onlineCount);
          }
          if (data && Object.prototype.hasOwnProperty.call(data, 'themeId')) {
            setCurrentRoomTheme(data.themeAsset || data.themeId || null);
          }
          if (data?.seatSkinAsset || data?.seatSkinId) {
            setCurrentSeatSkin(data.seatSkinAsset || data.seatSkinId);
          }
        });

        // 2. Real-Time Seat Change (Any user took or vacated a seat)
        sock.on('voice_room:seat_updated', (data) => {
          console.log('📡 [VoiceRoom] Real-time seat update:', data?.seatIndex, data?.user?.name);
          if (data?.seats && Array.isArray(data.seats)) {
            const mapped = mapSeatsWithCurrentUser(data.seats, currentUserId);
            setSeats(mapped);
            const mySeat = mapped.find((s) => s.user && s.user.isCurrentUser);
            if (mySeat) {
              setCurrentSeatIndex(mySeat.seatIndex);
            } else if (currentSeatIndexRef.current === data.seatIndex && !data.user) {
              setCurrentSeatIndex(null);
            }
          }
        });

        // 3. Mic Mute / Unmute
        sock.on('voice_room:seat_muted', (data) => {
          if (data?.seats) {
            setSeats(mapSeatsWithCurrentUser(data.seats, currentUserId));
          } else if (data?.seatIndex !== undefined) {
            setSeats((prev) => prev.map((s) => (s.seatIndex === data.seatIndex ? { ...s, isMuted: data.isMuted } : s)));
          }
          if (currentSeatIndexRef.current === data.seatIndex) {
            setIsMuted(data.isMuted);
          }
        });

        // 4. Seat Lock
        sock.on('voice_room:seat_locked', (data) => {
          if (data?.seats) {
            setSeats(mapSeatsWithCurrentUser(data.seats, currentUserId));
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

        // 5. User Joined Room
        sock.on('voice_room:user_joined', (data) => {
          console.log('📡 [VoiceRoom] User joined room:', data?.user?.name);
          if (data?.onlineCount !== undefined) setOnlineCount(data.onlineCount);
          if (data?.user?.userId) {
            setOnlineUsers((previous) => [
              ...previous.filter((person) => String(person.userId) !== String(data.user.userId)),
              data.user,
            ]);
          }
          const isSelf = Boolean(
            currentUserId &&
            (String(data?.user?.userId) === String(currentUserId) ||
             String(data?.user?.id) === String(currentUserId) ||
             String(data?.user?._id) === String(currentUserId))
          );
          const joinedUser = data?.user || {};
          const fallbackEntry =
            joinedUser.equippedEntryAsset ||
            joinedUser.equippedEntryEffect ||
            joinedUser.equippedEntry ||
            null;
          const fallbackEntrance =
            joinedUser.equippedEntranceAsset || joinedUser.equippedEntrance || null;
          if (fallbackEntry || fallbackEntrance) {
            const entryUserKey = String(
              joinedUser.userId || joinedUser.id || joinedUser._id || joinedUser.name || 'user',
            );
            const previousTimer = entryFallbackTimersRef.current.get(entryUserKey);
            if (previousTimer) clearTimeout(previousTimer);
            const fallbackTimer = setTimeout(() => {
              entryFallbackTimersRef.current.delete(entryUserKey);
              setActiveEntryEffect({
                entryId: `entry-fallback:${data.eventId || entryUserKey}:${Date.now()}`,
                roomId,
                userId: entryUserKey,
                user: joinedUser,
                hasEntry: true,
                entry: fallbackEntry,
                effect: fallbackEntry,
                entrance: fallbackEntrance,
                tassel:
                  joinedUser.equippedTasselAsset || joinedUser.equippedTassel || null,
                tagText: fallbackEntry?.tagText || fallbackEntry?.tag || 'HAS ENTERED',
                timestamp: Date.now(),
              });
            }, 1500);
            entryFallbackTimersRef.current.set(entryUserKey, fallbackTimer);
          }
          if (!isSelf && data?.user?.name) {
            const joinEventId =
              data.eventId ||
              `join:${data.user.userId || data.user.id || data.user.name}`;
            if (seenJoinEventsRef.current.has(joinEventId)) return;
            seenJoinEventsRef.current.add(joinEventId);
            if (seenJoinEventsRef.current.size > 200) {
              const first = seenJoinEventsRef.current.values().next().value;
              seenJoinEventsRef.current.delete(first);
            }
            setJoinedNotification({
              ...data.user,
              id: joinEventId,
              timestamp: Date.now(),
            });
            setChatMessages((prev) => [
              ...prev,
              {
                id: `welcome-${joinEventId}`,
                type: 'welcome',
                variant: 'joined',
                targetUserName: data.user.name,
                isOwner: false,
                roomHostName: actuallyOwner ? (currentUser?.name || 'Customer Service') : (roomData.hostName || 'Customer Service'),
                avatar: data.user.image || data.user.avatar || 'https://api.yaroapp.in/uploads/avatars/female_default.webp',
                equippedFrame: data.user.equippedFrameAsset || data.user.equippedFrame || null,
                timestamp: Date.now(),
              },
            ]);
          }
        });

        // 6. User Left Room
        sock.on('voice_room:user_left', (data) => {
          console.log('📡 [VoiceRoom] User left room:', data?.user?.name);
          if (data?.onlineCount !== undefined) setOnlineCount(data.onlineCount);
          if (data?.user?.userId) setOnlineUsers(previous => previous.filter(person => String(person.userId) !== String(data.user.userId)));
          if (data?.seats) {
            setSeats(mapSeatsWithCurrentUser(data.seats, currentUserId));
          }
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
            if (agoraEngineRef.current) {
              try {
                agoraEngineRef.current.muteLocalAudioStream(true);
                agoraEngineRef.current.setClientRole(ClientRoleType.ClientRoleAudience);
                agoraEngineRef.current.updateChannelMediaOptions({
                  clientRoleType: ClientRoleType.ClientRoleAudience,
                  publishMicrophoneTrack: false,
                  autoSubscribeAudio: true,
                });
              } catch (_) {}
            }
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
              return [...prev, msg];
            });
          }
        });

        // 8. Reconnect recovery: re-emit voice_room:join if connection was interrupted
        const reconnectHandler = () => {
          if (activeRoomIdRef.current) {
            console.log('📡 [VoiceRoom] Socket reconnected, re-joining room channel:', activeRoomIdRef.current);
            sock.emit('voice_room:join', {
              roomId: activeRoomIdRef.current,
              user: {
                id: currentUser?._id || currentUser?.id || '',
                userId: currentUserId || '10000001',
                name: currentUser?.name || (actuallyOwner ? 'Host' : 'Guest'),
                image: currentUser?.image || currentUser?.avatar || roomData.coverImage || '',
                avatar: currentUser?.image || currentUser?.avatar || roomData.coverImage || 'https://api.yaroapp.in/uploads/avatars/female_default.webp',
                gender: currentUser?.gender || 'male',
                level: currentUser?.level || 1,
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
        const acceptEntryEffect = (data, eventName) => {
          const entryUserKey = String(
            data?.user?.userId || data?.userId || data?.user?.id || data?.user?._id || '',
          );
          if (entryUserKey) {
            const fallbackTimer = entryFallbackTimersRef.current.get(entryUserKey);
            if (fallbackTimer) clearTimeout(fallbackTimer);
            entryFallbackTimersRef.current.delete(entryUserKey);
          }
          console.warn(`📡 [VoiceRoom] ${eventName} received in Context:`, data?.entryId, data?.user?.name);
          setActiveEntryEffect(data);
        };
        sock.on('entry:effect', (data) => {
          acceptEntryEffect(data, 'entry:effect');
        });
        sock.on('room:entry', (data) => {
          acceptEntryEffect(data, 'room:entry');
        });
        sock.on('room:vip-entry', (data) => {
          console.log('📡 [VoiceRoom] room:vip-entry received:', data?.vipId, data?.user?.name);
          // Modern VIP/KOK arrivals are already rendered by the full-screen entry engine.
          if (!data?.effect && !data?.entry) setActiveVipEntry(data);
        });
        sock.on('vip:entry', (data) => {
          setActiveVipEntry(data);
        });

        // Join room on server
        sock.emit('voice_room:join', {
          roomId,
          user: {
            id: currentUser?._id || currentUser?.id || '',
            userId: currentUserId || '10000001',
            name: currentUser?.name || (actuallyOwner ? 'Host' : 'Guest'),
            image: currentUser?.image || currentUser?.avatar || roomData.coverImage || '',
            avatar: currentUser?.image || currentUser?.avatar || roomData.coverImage || 'https://api.yaroapp.in/uploads/avatars/female_default.webp',
            gender: currentUser?.gender || 'male',
            level: currentUser?.level || 1,
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

    const currentUserId = currentUser?.userId ? String(currentUser.userId) : (currentUser?._id ? String(currentUser._id) : null);
    const roomId = activeRoomIdRef.current || activeRoom?.id || activeRoom?.roomId;

    setSeats((prev) => {
      // 1. Remove current user from ANY previous seat
      const cleaned = prev.map((s) => {
        if (s.user && (s.user.isCurrentUser || String(s.user.userId) === String(currentUserId) || s.user.name === (currentUser?.name || 'You'))) {
          return { ...s, user: null, isMuted: true };
        }
        return s;
      });

      // 2. Put user on new seat
      return cleaned.map((s) => {
        if (s.seatIndex === newSeatIndex) {
          return {
            ...s,
            user: {
              userId: currentUserId || '10000055',
              name: currentUser?.name || 'You',
              avatar: currentUser?.avatar || currentUser?.image || 'https://api.yaroapp.in/uploads/avatars/male_default.webp',
              image: currentUser?.image || currentUser?.avatar || '',
              gender: currentUser?.gender || 'male',
              level: currentUser?.level || 8,
              isCurrentUser: true,
              equippedFrame: currentUser?.equippedFrameAsset || currentUser?.equippedFrame || null,
              equippedFrameAsset: currentUser?.equippedFrameAsset || null,
            },
            isMuted: isMuted,
          };
        }
        return s;
      });
    });

    setCurrentSeatIndex(newSeatIndex);
    setIsMuted(false);

    if (agoraEngineRef.current) {
      try {
        agoraEngineRef.current.setClientRole(ClientRoleType.ClientRoleBroadcaster);
        agoraEngineRef.current.updateChannelMediaOptions({
          clientRoleType: ClientRoleType.ClientRoleBroadcaster,
          publishMicrophoneTrack: true,
          autoSubscribeAudio: true,
        });
        agoraEngineRef.current.enableLocalAudio(true);
        agoraEngineRef.current.muteLocalAudioStream(false);
      } catch (err) {
        console.warn('Agora takeSeat error:', err);
      }
    }

    // Emit real-time socket event
    const sock = socketRef.current || getSocket();
    if (sock && roomId) {
      sock.emit('voice_room:take_seat', {
        roomId,
        seatIndex: newSeatIndex,
        user: {
          id: currentUser?._id || currentUser?.id || '',
          userId: currentUserId || '10000055',
          name: currentUser?.name || 'You',
          image: currentUser?.image || currentUser?.avatar || '',
          avatar: currentUser?.image || currentUser?.avatar || 'https://api.yaroapp.in/uploads/avatars/male_default.webp',
          gender: currentUser?.gender || 'male',
          level: currentUser?.level || 8,
          equippedFrame: currentUser?.equippedFrameAsset || currentUser?.equippedFrame || null,
          equippedFrameAsset: currentUser?.equippedFrameAsset || null,
        },
      });
    }

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
        if (sock && roomId) {
          sock.emit('voice_room:lock_seat', { roomId, seatIndex: s.seatIndex, isLocked: true });
        }
        return { ...s, isLocked: true, user: null };
      })
    );
  };

  // Unlock all guest seats
  const unlockAllSeats = () => {
    const roomId = activeRoomIdRef.current || activeRoom?.id || activeRoom?.roomId;
    const sock = socketRef.current || getSocket();
    setSeats((prev) =>
      prev.map((s) => {
        if (s.seatIndex === 0) return s;
        if (sock && roomId) {
          sock.emit('voice_room:lock_seat', { roomId, seatIndex: s.seatIndex, isLocked: false });
        }
        return { ...s, isLocked: false };
      })
    );
  };

  // Vacate Seat
  const leaveSeat = (currentUser) => {
    const roomId = activeRoomIdRef.current || activeRoom?.id || activeRoom?.roomId;
    const currentUserId = currentUser?.userId ? String(currentUser.userId) : (currentUser?._id ? String(currentUser._id) : null);
    const seatIdx = currentSeatIndexRef.current;

    setSeats((prev) =>
      prev.map((s) => {
        if (s.user && (s.user.isCurrentUser || s.user.userId === currentUserId || s.user.name === (currentUser?.name || 'You'))) {
          return { ...s, user: null, isMuted: true };
        }
        return s;
      })
    );
    setCurrentSeatIndex(null);
    setIsMuted(true);

    if (agoraEngineRef.current) {
      try {
        agoraEngineRef.current.muteLocalAudioStream(true);
        agoraEngineRef.current.setClientRole(ClientRoleType.ClientRoleAudience);
        agoraEngineRef.current.updateChannelMediaOptions({
          clientRoleType: ClientRoleType.ClientRoleAudience,
          publishMicrophoneTrack: false,
          autoSubscribeAudio: true,
        });
      } catch (_) {}
    }

    const sock = socketRef.current || getSocket();
    if (sock && roomId) {
      sock.emit('voice_room:leave_seat', {
        roomId,
        seatIndex: seatIdx,
        user: { userId: currentUserId, name: currentUser?.name || 'You' },
      });
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
    try {
      InCallManager.stop();
      if (agoraEngineRef.current) {
        agoraEngineRef.current.muteLocalAudioStream(true);
        agoraEngineRef.current.leaveChannel();
        agoraEngineRef.current.release();
        agoraEngineRef.current = null;
      }
    } catch (_) {}

    const roomId = activeRoomIdRef.current || activeRoom?.id || activeRoom?.roomId;
    const sock = socketRef.current || getSocket();
    const resolvedCurrentUser = currentUser || currentUserRef.current;
    const userPayload = {
      userId: resolvedCurrentUser?.userId || resolvedCurrentUser?._id || resolvedCurrentUser?.id || 'guest',
      name: resolvedCurrentUser?.name || 'User',
    };

    if (sock && roomId) {
      if (currentSeatIndexRef.current !== null) {
        sock.emit('voice_room:leave_seat', {
          roomId,
          seatIndex: currentSeatIndexRef.current,
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
    setIsMinimized(false);
    setCurrentSeatIndex(null);
    setIsOwner(false);
    setSeats([]);
    setOnlineUsers([]);
    setOnlineCount(0);
    setChatMessages([]);
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
    setIsMuted((prev) => {
      const next = !prev;
      if (agoraEngineRef.current) {
        try {
          agoraEngineRef.current.muteLocalAudioStream(next);
          agoraEngineRef.current.updateChannelMediaOptions({
            publishMicrophoneTrack: !next,
          });
        } catch (_) {}
      }
      setSeats((seatList) =>
        seatList.map((s) => {
          if (s.seatIndex === seatIdx && s.user) {
            return { ...s, isMuted: next };
          }
          return s;
        })
      );
      const sock = socketRef.current || getSocket();
      if (sock && roomId && seatIdx !== null && seatIdx !== undefined) {
        sock.emit('voice_room:mute_seat', { roomId, seatIndex: seatIdx, isMuted: next });
      }
      return next;
    });
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
    if (sock && roomId && theme) {
      sock.emit('voice_room:update_theme', {
        roomId,
        themeId: theme.itemId || theme.id || theme._id,
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
    setChatMessages([
      { id: 'm-sys-' + Date.now(), type: 'system', text: '🧹 Chat has been cleared by Room Administrator.' },
    ]);
    AlertService.show('Chat Cleared', 'Room chat messages have been cleared', 'success');
  };

  // Toggle Admin Status
  const toggleAdmin = (targetUserId, targetName) => {
    setAdmins((prev) => {
      if (prev.includes(targetUserId)) {
        AlertService.show('Admin Removed', `${targetName} is no longer room admin`, 'info');
        return prev.filter((id) => id !== targetUserId);
      } else {
        AlertService.show('Admin Promoted', `${targetName} is now a Room Admin!`, 'success');
        return [...prev, targetUserId];
      }
    });
  };

  // Toggle Chat Ban
  const toggleChatBan = (targetUserId, targetName) => {
    setBannedChatUsers((prev) => {
      if (prev.includes(targetUserId)) {
        AlertService.show('Unbanned', `${targetName} can now chat again`, 'info');
        return prev.filter((id) => id !== targetUserId);
      } else {
        AlertService.show('Chat Banned', `${targetName} has been muted from room chat`, 'error');
        return [...prev, targetUserId];
      }
    });
  };

  // Force Mute/Unmute Mic of user
  const toggleMuteUser = (targetUserId, targetName) => {
    setMutedUsers((prev) => {
      const isCurrentlyMuted = prev.includes(targetUserId);
      const next = isCurrentlyMuted
        ? prev.filter((id) => id !== targetUserId)
        : [...prev, targetUserId];

      setSeats((seatList) =>
        seatList.map((s) => {
          if (s.user?.userId === targetUserId) {
            return { ...s, isMuted: !isCurrentlyMuted };
          }
          return s;
        })
      );

      AlertService.show('Mic Moderation', `${targetName}'s mic was ${isCurrentlyMuted ? 'Unmuted' : 'Muted'} by Admin`, 'warning');
      return next;
    });
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
        admins,
        bannedChatUsers,
        mutedUsers,
        seatCount,
        seats,
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
        broadcastChatMessage,
        broadcastReaction,
        agoraStatus,
        agoraErrorMessage,
        isMusicPlaying,
        currentTrack,
        musicVolume,
        micVolume,
        startMusicMixing,
        pauseMusicMixing,
        resumeMusicMixing,
        stopMusicMixing,
        setMusicVolume,
        setMicVolume,
        setRoomSeatCount,
        currentRoomTheme,
        currentSeatSkin,
        updateRoomTheme,
        updateRoomSeatSkin,
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
