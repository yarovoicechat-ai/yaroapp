import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  Platform,
  ActivityIndicator,
  PermissionsAndroid,
  NativeModules,
  Alert,
  Linking,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

let DocumentPicker = null;
try {
  DocumentPicker = require('@react-native-documents/picker');
} catch (_) {}

const { LocalMusicModule } = NativeModules;
const { width } = Dimensions.get('window');

const PRESET_SONGS = [
  {
    id: 's1',
    title: 'Club Party Beats 2026 🎧',
    artist: 'DJ Yaro Live',
    duration: '03:45',
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    icon: 'music-clef-treble',
  },
  {
    id: 's2',
    title: 'Lofi Chill Vibes ☕',
    artist: 'Night Owl Club',
    duration: '04:12',
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    icon: 'headphones',
  },
  {
    id: 's3',
    title: 'Bollywood Party Remix 💃',
    artist: 'Desi Club Mix',
    duration: '03:20',
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    icon: 'fire',
  },
  {
    id: 's4',
    title: 'Deep Bass EDM Blast 🔊',
    artist: 'Electro Wave',
    duration: '03:55',
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    icon: 'speaker-wireless',
  },
  {
    id: 's5',
    title: 'Romantic Acoustic Melodies 🎸',
    artist: 'Yaro Stars',
    duration: '04:30',
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    icon: 'guitar-acoustic',
  },
];

const isLikelyRecording = (title = '', path = '') => {
  const t = (title || '').toLowerCase();
  const p = (path || '').toLowerCase();
  const combined = `${t} ${p}`;

  const excluded = [
    '/recording',
    '/recordings',
    '/record/',
    '/records/',
    '/sound_recorder',
    '/soundrecorder',
    '/voice recorder',
    '/voicerecorder',
    '/voice_recorder',
    '/callrecordings',
    '/call recordings',
    '/call_recordings',
    '/call_rec',
    '/callrec',
    '/call/',
    '/calls/',
    '/standard recordings',
    '/whatsapp',
    '/telegram',
    '/voicenotes',
    '/voice notes',
    '/voice_notes',
    '/ringtones',
    '/ringtone',
    '/notifications',
    '/notification',
    '/alarms',
    '/alarm',
    'standard recording',
    'voice recording',
    'audio recording',
    'call recording',
    'sound recording',
    'voice note',
    'voicenote',
    'voice memo',
    'voicememo',
  ];

  for (const kw of excluded) {
    if (combined.includes(kw)) return true;
  }

  const prefixes = [
    'rec_', 'rec-', 'rec ', 'recording',
    'call_', 'call-', 'call ',
    'voice_', 'voice-', 'voice ',
    'aud-', 'ptt-', 'snd_',
    'phone-ringtone', 'facebook_ringtone'
  ];
  for (const pre of prefixes) {
    if (t.startsWith(pre)) return true;
  }

  if (p.endsWith('.amr') || p.endsWith('.3gp') || p.endsWith('.opus') || p.endsWith('.awb')) {
    return true;
  }

  return false;
};

export default function RoomMusicModal({
  visible,
  onClose,
  isMusicPlaying = false,
  currentTrack = null,
  musicVolume = 100,
  micVolume = 100,
  onPlayTrack,
  onPauseTrack,
  onResumeTrack,
  onStopTrack,
  onSetMusicVolume,
  onSetMicVolume,
  bottomSafePadding = 16,
}) {
  const [activeTab, setActiveTab] = useState('local'); // 'presets' | 'local'
  const [deviceSongs, setDeviceSongs] = useState([]);
  const [loadingDeviceSongs, setLoadingDeviceSongs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [repeatMode, setRepeatMode] = useState('all'); // 'off' | 'all' | 'one'
  const isScanningRef = useRef(false);
  const hasScannedRef = useRef(false);

  // Scan phone storage audio using native module
  const scanDeviceMusic = useCallback(async () => {
    if (isScanningRef.current) return;
    isScanningRef.current = true;
    setLoadingDeviceSongs(true);
    try {
      if (Platform.OS === 'android') {
        const isApi33OrHigher = Number(Platform.Version) >= 33;
        const perm = isApi33OrHigher
          ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO
          : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

        let hasPerm = await PermissionsAndroid.check(perm);
        if (!hasPerm) {
          const res = await PermissionsAndroid.request(perm, {
            title: 'Storage / Audio Permission',
            message: 'App needs permission to list music from your phone storage.',
            buttonPositive: 'Allow',
            buttonNegative: 'Deny',
          });
          hasPerm = res === PermissionsAndroid.RESULTS.GRANTED;
        }

        if (!hasPerm) {
          Alert.alert(
            'Music Permission Required',
            'Phone se music scan karne ke liye audio/storage permission zaroori hai. Settings me ja kar permission allow karein.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
          setLoadingDeviceSongs(false);
          isScanningRef.current = false;
          return;
        }

        if (LocalMusicModule && LocalMusicModule.getAudioFiles) {
          const files = await LocalMusicModule.getAudioFiles();
          if (Array.isArray(files)) {
            const formatted = files
              .filter((f) => !isLikelyRecording(f.title, f.path || f.uri || f.contentUri))
              .map((f) => ({
                id: f.id || 'dev-' + Math.random().toString(36).substr(2, 6),
                title: f.title || 'Audio Track',
                artist: f.artist || 'Phone Storage',
                duration: f.duration || 'Local',
                uri: f.uri || f.contentUri || f.path,
                contentUri: f.contentUri || f.uri,
                path: f.path || '',
                icon: 'cellphone-sound',
                isLocal: true,
              }));
            setDeviceSongs(formatted);
          }
        } else {
          console.warn('LocalMusicModule native bridge not detected');
        }
      }
    } catch (err) {
      console.warn('Device music scan error:', err);
      Alert.alert(
        'Scan Error',
        'Device music scan me issue aaya: ' + (err?.message || 'Storage error')
      );
    } finally {
      setLoadingDeviceSongs(false);
      isScanningRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (visible && !hasScannedRef.current) {
      hasScannedRef.current = true;
      scanDeviceMusic();
    }
  }, [visible, scanDeviceMusic]);

  // Current active playlist depending on tab
  const currentList = useMemo(() => {
    const list = activeTab === 'local' ? deviceSongs : PRESET_SONGS;
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(
      (s) =>
        (s.title && s.title.toLowerCase().includes(q)) ||
        (s.artist && s.artist.toLowerCase().includes(q))
    );
  }, [activeTab, deviceSongs, searchQuery]);

  // Play a selected song
  const handleSelectSong = (song) => {
    if (!song) return;
    if (onPlayTrack) {
      onPlayTrack(song.uri, song.title, song.path || song.contentUri);
    }
  };

  // Next Track (⏩ आगे)
  const handleNextTrack = () => {
    if (currentList.length === 0) return;
    const currentIndex = currentList.findIndex((s) => s.title === currentTrack);
    let nextIndex = 0;
    if (currentIndex >= 0) {
      nextIndex = (currentIndex + 1) % currentList.length;
    }
    const nextSong = currentList[nextIndex];
    if (nextSong) {
      handleSelectSong(nextSong);
    }
  };

  // Previous Track (⏪ पीछे)
  const handlePrevTrack = () => {
    if (currentList.length === 0) return;
    const currentIndex = currentList.findIndex((s) => s.title === currentTrack);
    let prevIndex = currentList.length - 1;
    if (currentIndex > 0) {
      prevIndex = currentIndex - 1;
    }
    const prevSong = currentList[prevIndex];
    if (prevSong) {
      handleSelectSong(prevSong);
    }
  };

  // One-Button Song Change (🔀 एक बटन से गाना बदलें / Random)
  const handleQuickChangeTrack = () => {
    if (currentList.length === 0) return;
    if (currentList.length === 1) {
      handleSelectSong(currentList[0]);
      return;
    }
    const currentIndex = currentList.findIndex((s) => s.title === currentTrack);
    let randIndex = Math.floor(Math.random() * currentList.length);
    if (randIndex === currentIndex) {
      randIndex = (currentIndex + 1) % currentList.length;
    }
    const randSong = currentList[randIndex];
    if (randSong) {
      handleSelectSong(randSong);
    }
  };

  // Repeat toggle (🔁 बंद -> सभी -> एक)
  const toggleRepeatMode = () => {
    if (repeatMode === 'off') setRepeatMode('all');
    else if (repeatMode === 'all') setRepeatMode('one');
    else setRepeatMode('off');
  };

  // Pick individual file from file manager fallback
  const handlePickCustomFile = async () => {
    try {
      if (DocumentPicker && DocumentPicker.pick) {
        const results = await DocumentPicker.pick({
          type: [DocumentPicker.types.audio],
        });
        if (results && results.length > 0) {
          const file = results[0];
          const customSong = {
            id: 'dev-' + Date.now(),
            title: file.name || 'Phone Audio',
            artist: 'My Phone 📱',
            duration: 'Local',
            uri: file.uri,
            icon: 'cellphone-sound',
            isLocal: true,
          };
          setDeviceSongs((prev) => [customSong, ...prev]);
          handleSelectSong(customSong);
        }
      }
    } catch (_) {}
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={styles.backdropDismissArea}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.sheetContainer, { paddingBottom: bottomSafePadding + 16 }]} pointerEvents="auto">
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.titleRow}>
              <MaterialCommunityIcons name="music-box-multiple" size={24} color="#C084FC" />
              <Text style={styles.sheetTitle}>Room Music Lounge 🎵</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <MaterialCommunityIcons name="close" size={22} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Now Playing Bar with Next / Prev / Repeat & Change Song Button */}
          <View style={styles.nowPlayingCard}>
            <View style={styles.nowPlayingLeftCol}>
              <View style={styles.nowPlayingIconBox}>
                <MaterialCommunityIcons
                  name={isMusicPlaying ? 'music-note' : 'music-note-off'}
                  size={22}
                  color={isMusicPlaying ? '#22C55E' : '#94A3B8'}
                />
              </View>
              <View style={styles.nowPlayingInfo}>
                <Text style={styles.nowPlayingTitle} numberOfLines={1}>
                  {currentTrack || (isMusicPlaying ? 'Music Playing' : 'No track selected')}
                </Text>
                <Text style={styles.nowPlayingStatus}>
                  {isMusicPlaying ? '🔊 Live to all room listeners' : 'Select any song to play'}
                </Text>
              </View>
            </View>

            {/* Playback Controls (Prev, Play/Pause, Next, Repeat) */}
            <View style={styles.playbackControlsRow}>
              {/* Prev */}
              <TouchableOpacity
                style={styles.controlPillBtn}
                onPress={handlePrevTrack}
                activeOpacity={0.75}
              >
                <MaterialCommunityIcons name="skip-previous" size={22} color="#E2E8F0" />
              </TouchableOpacity>

              {/* Play / Pause */}
              {isMusicPlaying ? (
                <TouchableOpacity
                  style={[styles.controlPillBtn, styles.pauseBtn]}
                  onPress={onPauseTrack}
                  activeOpacity={0.75}
                >
                  <MaterialCommunityIcons name="pause" size={22} color="#FFF" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.controlPillBtn, styles.playBtn]}
                  onPress={() => {
                    if (currentTrack && onResumeTrack) onResumeTrack();
                    else handleNextTrack();
                  }}
                  activeOpacity={0.75}
                >
                  <MaterialCommunityIcons name="play" size={22} color="#FFF" />
                </TouchableOpacity>
              )}

              {/* Next */}
              <TouchableOpacity
                style={styles.controlPillBtn}
                onPress={handleNextTrack}
                activeOpacity={0.75}
              >
                <MaterialCommunityIcons name="skip-next" size={22} color="#E2E8F0" />
              </TouchableOpacity>

              {/* Repeat Mode */}
              <TouchableOpacity
                style={[styles.controlPillBtn, repeatMode !== 'off' && styles.repeatActiveBtn]}
                onPress={toggleRepeatMode}
                activeOpacity={0.75}
              >
                <MaterialCommunityIcons
                  name={repeatMode === 'one' ? 'repeat-once' : repeatMode === 'all' ? 'repeat' : 'repeat-off'}
                  size={19}
                  color={repeatMode !== 'off' ? '#A78BFA' : '#64748B'}
                />
              </TouchableOpacity>
            </View>

            {/* Quick One-Tap Change Song Button */}
            <TouchableOpacity
              style={styles.quickChangeBtn}
              onPress={handleQuickChangeTrack}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#8B5CF6', '#EC4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.quickChangeGradient}
              >
                <MaterialCommunityIcons name="shuffle-variant" size={16} color="#FFF" />
                <Text style={styles.quickChangeText}>गाना बदलें (Change Song)</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Volume Section (0 to 200% Capacity) */}
          <View style={styles.volumeCard}>
            {/* Music Volume (0 - 200%) */}
            <View style={styles.volumeRow}>
              <View style={styles.volumeLabelCol}>
                <View style={styles.volumeIconRow}>
                  <MaterialCommunityIcons name="volume-high" size={16} color="#A78BFA" />
                  <Text style={styles.volumeLabel}>Music Volume: <Text style={{ color: musicVolume > 100 ? '#F59E0B' : '#FFF', fontWeight: '800' }}>{musicVolume}%</Text></Text>
                  {musicVolume > 100 && (
                    <View style={styles.boostBadge}>
                      <Text style={styles.boostBadgeText}>200% BOOST</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => onSetMusicVolume && onSetMusicVolume(Math.max(0, musicVolume - 10))}
                >
                  <MaterialCommunityIcons name="minus" size={15} color="#FFF" />
                </TouchableOpacity>

                <View style={styles.volumeBar}>
                  <View
                    style={[
                      styles.volumeBarFill,
                      {
                        width: `${Math.min(100, (musicVolume / 200) * 100)}%`,
                        backgroundColor: musicVolume > 100 ? '#F59E0B' : '#8B5CF6',
                      },
                    ]}
                  />
                </View>

                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => onSetMusicVolume && onSetMusicVolume(Math.min(200, musicVolume + 10))}
                >
                  <MaterialCommunityIcons name="plus" size={15} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick volume presets */}
            <View style={styles.quickVolRow}>
              {[50, 100, 150, 200].map((v) => (
                <TouchableOpacity
                  key={`vol-preset-${v}`}
                  style={[styles.volPresetPill, musicVolume === v && styles.volPresetPillActive]}
                  onPress={() => onSetMusicVolume && onSetMusicVolume(v)}
                >
                  <Text style={[styles.volPresetText, musicVolume === v && styles.volPresetTextActive]}>
                    {v}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Mic Volume (0 - 200%) */}
            <View style={[styles.volumeRow, { marginTop: 10 }]}>
              <View style={styles.volumeLabelCol}>
                <View style={styles.volumeIconRow}>
                  <MaterialCommunityIcons name="microphone" size={16} color="#34D399" />
                  <Text style={styles.volumeLabel}>Mic Volume: <Text style={{ color: micVolume > 100 ? '#10B981' : '#FFF', fontWeight: '800' }}>{micVolume}%</Text></Text>
                  {micVolume > 100 && (
                    <View style={[styles.boostBadge, { backgroundColor: 'rgba(16, 185, 129, 0.25)', borderColor: '#10B981' }]}>
                      <Text style={[styles.boostBadgeText, { color: '#34D399' }]}>200% BOOST</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => onSetMicVolume && onSetMicVolume(Math.max(0, micVolume - 10))}
                >
                  <MaterialCommunityIcons name="minus" size={15} color="#FFF" />
                </TouchableOpacity>

                <View style={styles.volumeBar}>
                  <View
                    style={[
                      styles.volumeBarFill,
                      {
                        width: `${Math.min(100, (micVolume / 200) * 100)}%`,
                        backgroundColor: micVolume > 100 ? '#10B981' : '#059669',
                      },
                    ]}
                  />
                </View>

                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => onSetMicVolume && onSetMicVolume(Math.min(200, micVolume + 10))}
                >
                  <MaterialCommunityIcons name="plus" size={15} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* 2 Tabs: Local Songs (Phone Storage) & Preset Songs */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'local' && styles.tabButtonActive]}
              onPress={() => setActiveTab('local')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="cellphone"
                size={18}
                color={activeTab === 'local' ? '#FFF' : '#94A3B8'}
              />
              <Text style={[styles.tabButtonText, activeTab === 'local' && styles.tabButtonTextActive]}>
                Local Songs ({deviceSongs.length}) 📱
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'presets' && styles.tabButtonActive]}
              onPress={() => setActiveTab('presets')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="playlist-music"
                size={18}
                color={activeTab === 'presets' ? '#FFF' : '#94A3B8'}
              />
              <Text style={[styles.tabButtonText, activeTab === 'presets' && styles.tabButtonTextActive]}>
                Presets ({PRESET_SONGS.length}) 🎧
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search bar & Refresh row */}
          <View style={styles.searchRefreshRow}>
            <View style={styles.searchInputWrap}>
              <MaterialCommunityIcons name="magnify" size={18} color="#94A3B8" />
              <TextInput
                style={styles.searchInput}
                placeholder={activeTab === 'local' ? 'Search phone songs...' : 'Search club presets...'}
                placeholderTextColor="#64748B"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <MaterialCommunityIcons name="close-circle" size={16} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            {activeTab === 'local' && (
              <TouchableOpacity
                style={styles.refreshScanBtn}
                onPress={scanDeviceMusic}
                disabled={loadingDeviceSongs}
              >
                {loadingDeviceSongs ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <MaterialCommunityIcons name="refresh" size={18} color="#FFF" />
                )}
              </TouchableOpacity>
            )}

            {activeTab === 'local' && (
              <TouchableOpacity
                style={styles.pickFileSmallBtn}
                onPress={handlePickCustomFile}
              >
                <MaterialCommunityIcons name="folder-plus" size={18} color="#C084FC" />
              </TouchableOpacity>
            )}
          </View>

          {/* Song List */}
          <ScrollView
            style={styles.songsScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 16 }}
          >
            {loadingDeviceSongs ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#8B5CF6" />
                <Text style={styles.loadingText}>Scanning phone storage for audio tracks...</Text>
              </View>
            ) : currentList.length === 0 ? (
              <View style={styles.emptyBox}>
                <MaterialCommunityIcons name="music-note-off" size={40} color="#64748B" />
                <Text style={styles.emptyTitle}>
                  {activeTab === 'local' ? 'No phone audio found' : 'No presets found'}
                </Text>
                <Text style={styles.emptySub}>
                  {activeTab === 'local'
                    ? 'Check if audio files exist on your phone or tap the folder icon to browse.'
                    : 'Try a different search query'}
                </Text>
                {activeTab === 'local' && (
                  <TouchableOpacity
                    style={styles.scanNowBtn}
                    onPress={scanDeviceMusic}
                  >
                    <Text style={styles.scanNowBtnText}>🔄 Scan Phone Again</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              currentList.map((song) => {
                const isPlayingThis = isMusicPlaying && currentTrack === song.title;
                return (
                  <TouchableOpacity
                    key={song.id}
                    style={[styles.songItem, isPlayingThis && styles.songItemActive]}
                    activeOpacity={0.8}
                    onPress={() => handleSelectSong(song)}
                  >
                    <View style={[styles.songIconWrap, isPlayingThis && styles.songIconWrapActive]}>
                      <MaterialCommunityIcons
                        name={isPlayingThis ? 'volume-high' : (song.icon || 'music')}
                        size={20}
                        color={isPlayingThis ? '#A78BFA' : 'rgba(255, 255, 255, 0.7)'}
                      />
                    </View>

                    <View style={styles.songMetaCol}>
                      <Text style={[styles.songTitle, isPlayingThis && styles.songTitleActive]} numberOfLines={1}>
                        {song.title}
                      </Text>
                      <Text style={styles.songArtist}>
                        {song.artist} • {song.duration}
                      </Text>
                    </View>

                    <View style={styles.playActionBtn}>
                      <MaterialCommunityIcons
                        name={isPlayingThis ? 'pause-circle' : 'play-circle'}
                        size={26}
                        color={isPlayingThis ? '#A78BFA' : '#FFF'}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  backdropDismissArea: {
    flex: 1,
    width: '100%',
  },
  sheetContainer: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 16,
    paddingTop: 16,
    maxHeight: '88%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    elevation: 25,
    zIndex: 100,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetTitle: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '800',
  },
  nowPlayingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  nowPlayingLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nowPlayingIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  nowPlayingInfo: {
    flex: 1,
  },
  nowPlayingTitle: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  nowPlayingStatus: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  playbackControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  controlPillBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    backgroundColor: '#22C55E',
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  pauseBtn: {
    backgroundColor: '#EF4444',
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  repeatActiveBtn: {
    backgroundColor: 'rgba(167, 139, 250, 0.25)',
    borderWidth: 1,
    borderColor: '#A78BFA',
  },
  quickChangeBtn: {
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  quickChangeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    gap: 6,
  },
  quickChangeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  volumeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  volumeLabelCol: {
    flex: 1,
  },
  volumeIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  volumeLabel: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
  },
  boostBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  boostBadgeText: {
    color: '#F59E0B',
    fontSize: 8.5,
    fontWeight: '900',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepperBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  volumeBar: {
    width: 74,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  volumeBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  quickVolRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
    marginBottom: 2,
    gap: 6,
  },
  volPresetPill: {
    flex: 1,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  volPresetPillActive: {
    borderColor: '#A78BFA',
    backgroundColor: 'rgba(167, 139, 250, 0.2)',
  },
  volPresetText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },
  volPresetTextActive: {
    color: '#FFF',
    fontWeight: '800',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    padding: 3,
    marginBottom: 10,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: '#7C3AED',
  },
  tabButtonText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  tabButtonTextActive: {
    color: '#FFF',
  },
  searchRefreshRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 38,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 12,
    paddingVertical: 0,
  },
  refreshScanBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(124, 58, 237, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickFileSmallBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.4)',
  },
  songsScroll: {
    maxHeight: 250,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  songItemActive: {
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  songIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  songIconWrapActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
  },
  songMetaCol: {
    flex: 1,
  },
  songTitle: {
    color: '#FFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  songTitleActive: {
    color: '#C084FC',
  },
  songArtist: {
    color: '#94A3B8',
    fontSize: 10.5,
    marginTop: 2,
  },
  playActionBtn: {
    paddingLeft: 8,
  },
  loadingBox: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 10,
  },
  emptyBox: {
    paddingVertical: 26,
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
  },
  emptySub: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  scanNowBtn: {
    marginTop: 12,
    backgroundColor: '#7C3AED',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  scanNowBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
