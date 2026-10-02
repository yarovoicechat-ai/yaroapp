import React, { useState, useEffect, useRef, useContext, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  Share,
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
  const [fetchedHost, setFetchedHost] = useState(null);

  useEffect(() => {
    const fetchHostById = async () => {
      const hid = route.params?.hostId || route.params?.id || route.params?.userId;
      if (hid && !route.params?.host?.name) {
        try {
          const res = await apiUtil.get(`/user/profile/${hid}`);
          if (res.data?.success && (res.data?.user || res.data?.data)) {
            setFetchedHost(res.data.user || res.data.data);
          }
        } catch (e) {
          console.log('[HostProfile] Fetch error:', e.message);
        }
      }
    };
    fetchHostById();
  }, [route.params?.hostId, route.params?.id, route.params?.userId]);

  const host = useMemo(() => {
    const value = fetchedHost || route.params?.host;
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }, [route.params?.host, fetchedHost]);
  const { user } = useContext(AuthContext);

  const handleShareHost = async () => {
    try {
      const targetHostId = host._id || host.id || host.userId || route.params?.hostId || '';
      const shareUrl = `https://yaroapp.in/user/${targetHostId}`;
      await Share.share({
        title: `${host.name || 'Host'}'s Profile on Yaro App`,
        message: `🌟 Check out ${host.name || 'Host'} on Yaro App! (ID: ${targetHostId})\n👇 Tap to view profile & connect: ${shareUrl}`,
        url: shareUrl,
      });
    } catch (e) {
      console.log('[HostProfile] Share error:', e.message);
    }
  };
  
  const [calling, setCalling] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const soundRef = useRef(null);
  const callInFlightRef = useRef(false);

  // UGC Moderation: Report & Block
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState('Inappropriate content');
  const [reportDescription, setReportDescription] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const REPORT_REASONS = [
    'Inappropriate content',
    'Harassment or bullying',
    'Spam or scam',
    'Underage user',
    'Hate speech',
    'Other',
  ];

  const handleBlockHost = () => {
    const targetHostId = host._id || host.id || host.userId;
    if (!targetHostId) return;

    Alert.alert(
      'Block User',
      `Are you sure you want to block ${host.name || 'this host'}? They will no longer be able to call or interact with you.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await apiUtil.post(`/user/block-contact/${targetHostId}`);
              if (res.data?.success) {
                AlertService.show('Blocked', `${host.name || 'User'} has been blocked.`, 'success');
                navigation.goBack();
              } else {
                AlertService.show('Error', res.data?.message || 'Could not block user', 'error');
              }
            } catch (err) {
              AlertService.show('Error', err.response?.data?.message || 'Failed to block user', 'error');
            }
          },
        },
      ]
    );
  };

  const handleSubmitReport = async () => {
    const targetHostId = host._id || host.id || host.userId;
    if (!targetHostId) return;

    try {
      setSubmittingReport(true);
      const res = await apiUtil.post('/user/report', {
        reportedUserId: targetHostId,
        reason: selectedReason,
        description: reportDescription || selectedReason,
        reportedType: 'host',
      });
      if (res.data?.success) {
        setReportModalVisible(false);
        setReportDescription('');
        AlertService.show('Report Received', 'Thank you. Our safety team will review this report within 24 hours.', 'success');
      } else {
        AlertService.show('Error', res.data?.message || 'Failed to submit report', 'error');
      }
    } catch (err) {
      AlertService.show('Error', err.response?.data?.message || 'Failed to submit report', 'error');
    } finally {
      setSubmittingReport(false);
    }
  };

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
    <ScreenBackgroundView style={[{ flex: 1, backgroundColor: '#F8FAFC' }]}>
      <ScreenBackgroundStatusBar translucent backgroundColor="transparent" barStyle="dark-content" animated />
      <LinearGradient colors={['#F8FAFC', '#F1F5F9', '#E2E8F0']} style={ScreenBackgroundStyleSheet.absoluteFillObject} />
      <View style={[styles.headerRow, { marginTop: topSafeInset + 8 }]}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={handleShareHost}
            accessibilityLabel="Share Host"
          >
            <Icon name="share" size={20} color="#6366F1" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => setReportModalVisible(true)}
            accessibilityLabel="Report Host"
          >
            <Icon name="flag" size={20} color="#F43F5E" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={handleBlockHost}
            accessibilityLabel="Block Host"
          >
            <Icon name="block" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}>
        <LinearGradient colors={['#EC4899', '#6366F1']} style={styles.avatarRing}>
          <Image source={getUserAvatar(host)} style={styles.avatar} />
        </LinearGradient>
        <Text style={styles.name}>{(typeof host.country === 'object' ? host.country?.flag : null) || '🌍'}  {host.name || 'Host'}</Text>
        <View style={styles.statusRow}><View style={styles.dot} /><Text style={styles.status}>{host.isOnline ? 'Online' : 'Available'}</Text></View>
        
        {/* Host Voice Preview Intro Player */}
        {Boolean(rawAudioPath) ? (
          <TouchableOpacity onPress={handleAudioPlayback} style={styles.audioPlayerBtn} activeOpacity={0.8}>
            <LinearGradient
              colors={isPlaying ? ['#6366F1', '#4F46E5'] : ['#FFFFFF', '#F8FAFC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.audioPlayerGradient}
            >
              <Icon name={isPlaying ? "pause" : "play-arrow"} size={22} color={isPlaying ? "#FFFFFF" : "#4F46E5"} />
              <Text style={[styles.audioPlayerText, isPlaying && { color: '#FFFFFF' }]}>
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
          <LinearGradient colors={['#FF6B00', '#FF2D87', '#C026D3']} style={styles.callButton}>
            {calling ? <ActivityIndicator color="#fff" /> : <Icon name="call" size={22} color="#fff" />}
            <Text style={styles.callText}>{calling ? 'Calling...' : 'Call Now'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* UGC Report User Modal */}
      <Modal
        visible={reportModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setReportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Report User</Text>
            <Text style={styles.modalSubTitle}>Select a reason for reporting {host.name || 'this host'}:</Text>

            <ScrollView style={{ maxHeight: 220, marginVertical: 10 }}>
              {REPORT_REASONS.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.reasonOption, selectedReason === r && styles.reasonOptionSelected]}
                  onPress={() => setSelectedReason(r)}
                >
                  <Text style={[styles.reasonText, selectedReason === r && styles.reasonTextSelected]}>{r}</Text>
                  {selectedReason === r && <Icon name="check" size={18} color="#4F46E5" />}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput
              style={styles.modalInput}
              placeholder="Additional details (optional)..."
              placeholderTextColor="#94A3B8"
              value={reportDescription}
              onChangeText={setReportDescription}
              multiline
              maxLength={200}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setReportModalVisible(false)}
                disabled={submittingReport}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSubmitReport}
                disabled={submittingReport}
              >
                {submittingReport ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalSubmitText}>Submit Report</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenBackgroundView>
  );
};

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  back: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerActionBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  content: { alignItems: 'center', paddingHorizontal: 28 },
  avatarRing: { width: 150, height: 150, borderRadius: 75, padding: 4, marginTop: 18, elevation: 4, shadowColor: '#EC4899', shadowOpacity: 0.2, shadowRadius: 10 },
  avatar: { width: '100%', height: '100%', borderRadius: 72 },
  name: { color: '#0F172A', fontSize: 24, fontWeight: '800', marginTop: 20 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 9 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginRight: 7 },
  status: { color: '#10B981', fontWeight: '700' },
  audioPlayerBtn: {
    width: '100%',
    marginTop: 20,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  audioPlayerGradient: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  audioPlayerText: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  bio: { color: '#475569', fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 24 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 20 },
  chip: {
    color: '#4F46E5',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#E0E7FF',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 16,
    margin: 4,
    fontWeight: '600',
    fontSize: 13,
  },
  callWrap: { width: '100%', marginTop: 32, borderRadius: 18, overflow: 'hidden', elevation: 3, shadowColor: '#FF2D87', shadowOpacity: 0.3, shadowRadius: 8 },
  callButton: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 18 },
  callText: { color: '#fff', fontSize: 16, fontWeight: '800', marginLeft: 9 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  modalTitle: { color: '#0F172A', fontSize: 18, fontWeight: '800', marginBottom: 4 },
  modalSubTitle: { color: '#64748B', fontSize: 13, marginBottom: 8 },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reasonOptionSelected: { backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#6366F1' },
  reasonText: { color: '#334155', fontSize: 14 },
  reasonTextSelected: { color: '#4F46E5', fontWeight: '700' },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    color: '#0F172A',
    padding: 12,
    fontSize: 13,
    minHeight: 60,
    textAlignVertical: 'top',
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  modalCancelBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, backgroundColor: '#F1F5F9' },
  modalCancelText: { color: '#64748B', fontSize: 14, fontWeight: '600' },
  modalSubmitBtn: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10, backgroundColor: '#E11D48' },
  modalSubmitText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});

export default HostProfile;
