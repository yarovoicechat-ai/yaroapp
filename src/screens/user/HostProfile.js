import React, { useState, useEffect, useRef, useContext, useMemo } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView,
  View as ScreenBackgroundView,
  StatusBar as ScreenBackgroundStatusBar,
  StyleSheet as ScreenBackgroundStyleSheet
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { apiUtil, API_BASE_URL } from '../../utils/apiUtil';
import { AlertService } from '../../utils/AlertService';
import { AuthContext } from '../../context/AuthProvider';
import Sound from 'react-native-sound';
import { CALL_DIAMONDS_PER_MINUTE, hasCallStartIdentity } from '../../utils/callValidation';
import { isValidAudioPath, normalizeLanguages, resolveAudioUrl } from '../../utils/hostPresentation';

// Enable playing audio in silent mode (iOS)
import { getUserAvatar } from '../../utils/avatarUtil';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';

Sound.setCategory('Playback');

const HostProfile = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 40);
  const route = useRoute();
  const host = useMemo(() => {
    const value = route.params?.host;
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }, [route.params?.host]);
  const { user } = useContext(AuthContext);
  
  const [calling, setCalling] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const soundRef = useRef(null);
  const callInFlightRef = useRef(false);

  const languageList = normalizeLanguages(host.languages, host.language);

  const showInsufficientDiamondsAlert = () => {
    AlertService.show(
      'Insufficient Diamonds',
      'Your Diamond balance is too low to start this call. Please recharge your Diamonds to continue.',
      'error',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Recharge Now', onPress: () => navigation.navigate('Recharge') },
      ]
    );
  };

  const startCall = async () => {
    if (callInFlightRef.current) return;
    const targetHostId = host._id || host.id || host.userId;
    if (!targetHostId) {
      AlertService.show('Call unavailable', 'Invalid host profile information.', 'error');
      return;
    }

    const userDiamonds = Number(user?.diamonds || 0);
    console.log('[CALL] START REQUEST | BALANCE:', userDiamonds);

    if (userDiamonds < CALL_DIAMONDS_PER_MINUTE) {
      console.log('[CALL] INSUFFICIENT BALANCE | REJECTED ON FRONTEND');
      showInsufficientDiamondsAlert();
      return;
    }

    console.log('[CALL] BALANCE OK');
    try {
      callInFlightRef.current = true;
      setCalling(true);
      const response = await apiUtil.post('/call/start', { hostId: targetHostId });
      if (!response.data?.success || !hasCallStartIdentity(response.data?.data)) {
        const msg = response.data?.message || 'Failed to start call.';
        const errCode = response.data?.data?.code || response.data?.data?.errorCode;
        if (errCode === 'INSUFFICIENT_DIAMONDS' || msg.includes('INSUFFICIENT_DIAMONDS') || msg.toLowerCase().includes('diamond')) {
          showInsufficientDiamondsAlert();
        } else {
          AlertService.show('Call unavailable', msg, 'error');
        }
        return;
      }
      navigation.navigate('OutGoing', {
        ...response.data.data,
        name: host.name || 'Host',
        image: host.image,
        isCaller: true,
      });
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Please try again.';
      const errCode = error.response?.data?.data?.code || error.response?.data?.data?.errorCode;
      if (errCode === 'INSUFFICIENT_DIAMONDS' || msg.includes('INSUFFICIENT_DIAMONDS') || msg.toLowerCase().includes('diamond')) {
        showInsufficientDiamondsAlert();
      } else {
        AlertService.show('Call unavailable', msg, 'error');
      }
    } finally {
      callInFlightRef.current = false;
      setCalling(false);
    }
  };

  const getRawHostAudioPath = (hostObj) => {
    if (!hostObj || typeof hostObj !== 'object') return null;
    const candidates = [
      hostObj.audio,
      hostObj.audioURL,
      hostObj.voiceAudioUrl,
      hostObj.voiceUrl,
      hostObj.voice,
      hostObj.introAudio,
    ];
    return candidates.find(isValidAudioPath)?.trim() || null;
  };
  const rawAudioPath = getRawHostAudioPath(host);

  const getAudioUrl = audioPath => resolveAudioUrl(audioPath, API_BASE_URL);

  useEffect(() => {
    console.log('[VOICE INTRO] HOST ID:', host?.userId || host?._id);
    console.log('[VOICE INTRO] AUDIO FIELDS:', {
      audio: host?.audio,
      audioURL: host?.audioURL,
      voiceAudioUrl: host?.voiceAudioUrl,
      voiceUrl: host?.voiceUrl,
      voice: host?.voice,
      introAudio: host?.introAudio,
    });
    console.log('[VOICE INTRO] RAW AUDIO PATH:', rawAudioPath);
    console.log('[VOICE INTRO] RESOLVED URL:', getAudioUrl(rawAudioPath));
  }, [host, rawAudioPath]);

  const handleAudioPlayback = () => {
    const audioUrl = getAudioUrl(rawAudioPath);
    console.log('[VOICE INTRO] INITIATING PLAYBACK FOR URL:', audioUrl);
    if (!audioUrl) {
      AlertService.show('Audio Preview', 'This host has not uploaded an audio intro.', 'error');
      return;
    }

    if (isPlaying) {
      if (soundRef.current) {
        try {
          soundRef.current.stop(() => {
            try { soundRef.current?.release(); } catch (_) {}
            soundRef.current = null;
            setIsPlaying(false);
          });
        } catch (_) {
          setIsPlaying(false);
          soundRef.current = null;
        }
      }
      return;
    }

    if (soundRef.current) {
      try { soundRef.current.stop(); soundRef.current.release(); } catch (_) {}
      soundRef.current = null;
    }

    setIsPlaying(true);
    try {
      // Pass null for basePath so react-native-sound handles full HTTP/HTTPS network URLs on Android correctly
      const s = new Sound(audioUrl, null, err => {
        if (err) {
          console.log('[VOICE INTRO] FAILED TO LOAD AUDIO:', err);
          setIsPlaying(false);
          soundRef.current = null;
          AlertService.show('Playback Error', 'Failed to play host voice intro.', 'error');
          return;
        }
        console.log('[VOICE INTRO] AUDIO PREPARED SUCCESSFULLY, STARTING PLAYBACK');
        s.play((success) => {
          setIsPlaying(false);
          try { s.release(); } catch (_) {}
          soundRef.current = null;
          if (!success) {
            console.log('[VOICE INTRO] PLAYBACK DISRUPTED / FAILED DURING PLAYBACK');
          } else {
            console.log('[VOICE INTRO] PLAYBACK COMPLETED SUCCESSFULLY');
          }
        });
      });
      soundRef.current = s;
    } catch (e) {
      console.log('[VOICE INTRO] SOUND INITIALIZATION EXCEPTION:', e);
      setIsPlaying(false);
      soundRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        try {
          soundRef.current.stop();
          soundRef.current.release();
        } catch (_) {}
      }
    };
  }, []);

  return (
    <ScreenBackgroundView style={[{ flex: 1, backgroundColor: '#08031a' }]}>
      <ScreenBackgroundStatusBar translucent backgroundColor="transparent" barStyle="light-content" animated />
      <LinearGradient colors={['#08031a', '#050212', '#020108']} style={ScreenBackgroundStyleSheet.absoluteFillObject} />
      <TouchableOpacity style={[styles.back, { marginTop: topSafeInset + 8 }]} onPress={() => navigation.goBack()}>
        <Icon name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}>
        <LinearGradient colors={['#d946ef', '#03dcfe']} style={styles.avatarRing}>
          <Image source={getUserAvatar(host)} style={styles.avatar} />
        </LinearGradient>
        <Text style={styles.name}>{(typeof host.country === 'object' ? host.country?.flag : null) || '🌍'}  {host.name || 'Host'}</Text>
        <View style={styles.statusRow}><View style={styles.dot} /><Text style={styles.status}>{host.isOnline ? 'Online' : 'Available'}</Text></View>
        
        {/* Host Voice Preview Intro Player */}
        {Boolean(rawAudioPath) ? (
          <TouchableOpacity onPress={handleAudioPlayback} style={styles.audioPlayerBtn} activeOpacity={0.8}>
            <LinearGradient
              colors={isPlaying ? ['#a855f7', '#d946ef'] : ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.03)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.audioPlayerGradient}
            >
              <Icon name={isPlaying ? "pause" : "play-arrow"} size={22} color={isPlaying ? "#fff" : "#03dcfe"} />
              <Text style={[styles.audioPlayerText, isPlaying && { color: '#fff' }]}>
                {isPlaying ? "Voice Intro: Playing..." : "Listen to Host Voice Intro"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : null}

        <Text style={styles.bio}>{host.bio || "Hello! Let's have a great conversation."}</Text>
        <View style={styles.chips}>
          {languageList.map((language, index) => <Text key={`${language}-${index}`} style={styles.chip}>{language}</Text>)}
        </View>
        <TouchableOpacity onPress={startCall} disabled={calling} style={styles.callWrap}>
          <LinearGradient colors={['#ff6b00', '#ff2d87', '#c026d3']} style={styles.callButton}>
            {calling ? <ActivityIndicator color="#fff" /> : <Icon name="call" size={22} color="#fff" />}
            <Text style={styles.callText}>{calling ? 'Calling...' : 'Call Now'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </ScreenBackgroundView>
  );
};

const styles = StyleSheet.create({
  back: { margin: 18, width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  content: { alignItems: 'center', paddingHorizontal: 28 },
  avatarRing: { width: 150, height: 150, borderRadius: 75, padding: 4, marginTop: 18 },
  avatar: { width: '100%', height: '100%', borderRadius: 72 },
  name: { color: '#fff', fontSize: 25, fontWeight: '800', marginTop: 20 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 9 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ade80', marginRight: 7 },
  status: { color: '#4ade80', fontWeight: '700' },
  audioPlayerBtn: {
    width: '100%',
    marginTop: 20,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  audioPlayerGradient: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  audioPlayerText: {
    color: '#03dcfe',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  bio: { color: 'rgba(255,255,255,0.72)', fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 24 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 20 },
  chip: { color: '#03dcfe', backgroundColor: 'rgba(3,220,254,0.12)', paddingHorizontal: 13, paddingVertical: 7, borderRadius: 16, margin: 4 },
  callWrap: { width: '100%', marginTop: 32, borderRadius: 18, overflow: 'hidden' },
  callButton: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 18 },
  callText: { color: '#fff', fontSize: 16, fontWeight: '800', marginLeft: 9 },
});

export default HostProfile;
