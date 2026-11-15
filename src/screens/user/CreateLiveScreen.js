import React, { useCallback, useContext, useState, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  PermissionsAndroid,
  Platform,
  StatusBar,
  Share,
  AppState,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import {
  createAgoraRtcEngine,
} from 'react-native-agora';
import { AuthContext } from '../../context/AuthProvider';
import { apiUtil } from '../../utils/apiUtil';
import { getUserAvatar } from '../../utils/avatarUtil';
import SelectLiveChannelModal from '../../components/live/SelectLiveChannelModal';
import { ARManager, ARPreview, ARFilterPanel, useARLifecycle } from '../../features/YaroAR';
import AgoraClientService from '../../services/agoraService';

export default function CreateLiveScreen({ navigation, route }) {
  const { user } = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [channel, setChannel] = useState('Dance');
  const [channelModalVisible, setChannelModalVisible] = useState(false);
  const [roomType, setRoomType] = useState('Ordinary Room'); // 'Ordinary Room' or 'Multi-guest Room'
  const [roomTypeModalVisible, setRoomTypeModalVisible] = useState(false);
  const [coverImage, setCoverImage] = useState(
    /^https:\/\//i.test(user?.avatar || user?.image || '')
      ? user.avatar || user.image
      : '',
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [cameraReady, setCameraReady] = useState(false);
  const arTab = route?.params?.arTab || 'Beauty';

  const engineRef = useRef(null);
  const arUnbindRef = useRef(null);
  const releasePreview = useCallback(async () => {
    const engine=engineRef.current;
    engineRef.current=null;
    const unbind=arUnbindRef.current;
    arUnbindRef.current=null;
    if(unbind) await unbind();
    try { engine?.stopPreview(); engine?.release(); } catch {}
  }, []);
  useARLifecycle();

  // Initialize camera preview on mount
  useFocusEffect(useCallback(() => {
    let mounted = true;
    const lifecycle=AppState.addEventListener('change', state => {
      if (ARManager.getSnapshot().trackId !== null) return;
      const engine=engineRef.current;
      if (!engine) return;
      if (state === 'active') { engine.enableLocalVideo(true); engine.startPreview(); }
      else { engine.stopPreview(); engine.enableLocalVideo(false); }
    });

    async function initCameraPreview() {
      try {
        if (Platform.OS === 'android') {
          const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.CAMERA,
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          ]);
          if (Object.values(granted).some(value => value !== PermissionsAndroid.RESULTS.GRANTED)) {
            if(mounted) setError('Camera and microphone permissions are required to start live.');
            return;
          }
        }

        const config=await AgoraClientService.getActiveAgoraConfig();
        await ARManager.waitForRelease();
        if(!mounted) return;
        const engine = createAgoraRtcEngine();
        engineRef.current = engine;
        engine.initialize({ appId: config.appId });
        engine.enableVideo();
        arUnbindRef.current=ARManager.bind(engine);
        engine.startPreview();
        if (mounted) setCameraReady(true);
      } catch (err) {
        if(mounted) setError(err?.message || 'Camera preview unavailable.');
      }
    }

    initCameraPreview();

    return () => {
      mounted = false;
      lifecycle.remove();
      setCameraReady(false);
      void releasePreview().catch(err=>setError(err.message));
    };
  }, [releasePreview]));

  const handleFlipCamera = () => {
    if(ARManager.getSnapshot().trackId!==null) {
      setError('Reset AR before switching the camera.');
      return;
    }
    try {
      engineRef.current?.switchCamera();
    } catch {}
  };


  const handleShare = async () => {
    try {
      await Share.share({
        message: `Watch my live stream on YARO: ${user?.name || 'Live Broadcaster'}!`,
      });
    } catch {}
  };

  const handleToggleRoomType = () => {
    setRoomType(prev =>
      prev === 'Ordinary Room' ? 'Multi-guest Room' : 'Ordinary Room',
    );
  };

  const start = async () => {
    if (busy || !cameraReady) return;
    const finalTitle = title.trim() || `${user?.name || 'Live'}'s room`;
    setBusy(true);
    setError('');

    try {
      const mode = roomType === 'Multi-guest Room' ? 'multi' : 'single';
      const res = await apiUtil.post('/live/rooms', {
        title: finalTitle,
        category: 'Live',
        channel,
        mode,
        coverImage,
        country: user?.country || 'India',
      });

      const { room, rtc } = res.data.data;
      const arEffectId=ARManager.getSnapshot().selectedId;
      await releasePreview();
      setCameraReady(false);
      navigation.navigate('LiveStream', {
        roomId: room._id,
        room,
        rtc,
        permissionsGranted: true,
        arEffectId,
      });
    } catch (e) {
      setError(
        e.response?.data?.message || e.message || 'Could not start live.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* 1. Full-screen Camera Preview Background */}
      {cameraReady ? (
        <ARPreview style={StyleSheet.absoluteFill} />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.cameraPlaceholder]}>
          <Image
            source={getUserAvatar(user)}
            style={styles.placeholderAvatar}
            blurRadius={20}
          />
          <View style={styles.placeholderDarkMask} />
        </View>
      )}

      {/* Gradient Vignette Overlay */}
      <LinearGradient
        colors={['rgba(0,0,0,0.7)', 'transparent', 'rgba(0,0,0,0.85)']}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* 2. Top Header Bar: Back & Location */}
      <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.circleIconButton}
        >
          <Icon name="chevron-back" size={26} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.locationButton}>
          <LinearGradient
            colors={['#FF007F', '#FF1493']}
            style={styles.locationGradient}
          >
            <Icon name="location" size={15} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* 3. Floating Info Card (Top Area) */}
      <View style={styles.floatingCard}>
        {/* Cover Box */}
        <TouchableOpacity
          onPress={() => {
            // Toggle cover or profile photo
            setCoverImage(user?.avatar || user?.image || '');
          }}
          activeOpacity={0.8}
          style={styles.coverBox}
        >
          {coverImage ? (
            <Image source={{ uri: coverImage }} style={styles.coverImage} />
          ) : (
            <>
              <Icon name="add" size={28} color="#FFFFFF" />
              <Text style={styles.coverText}>Live cover</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Input & Channel Column */}
        <View style={styles.cardRightCol}>
          <View style={styles.titleRow}>
            <Text style={styles.liveTitleLabel}>Live title</Text>
            <TouchableOpacity onPress={() => setTitle('')}>
              <Icon name="close" size={18} color="#CBD5E1" />
            </TouchableOpacity>
          </View>

          <TextInput
            value={title}
            onChangeText={setTitle}
            maxLength={80}
            placeholder="Write a title for the live"
            placeholderTextColor="#94A3B8"
            style={styles.titleInput}
          />

          <TouchableOpacity
            onPress={() => setChannelModalVisible(true)}
            style={styles.channelRow}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="format-list-bulleted"
              size={18}
              color="#CBD5E1"
            />
            <Text style={styles.channelText} numberOfLines={1}>
              {channel ? channel : 'Select live content'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Error Message if any */}
      {!!error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* 4. Bottom Controls Area */}
      <View style={[styles.bottomArea, { paddingBottom: insets.bottom + 16 }]}>
        {/* Row of 4 Circular Control Icons */}
        <View style={styles.controlsRow}>
          <TouchableOpacity onPress={handleFlipCamera} style={styles.controlItem}>
            <View style={styles.controlCircle}>
              <MaterialCommunityIcons
                name="camera-flip-outline"
                size={22}
                color="#FFFFFF"
              />
            </View>
            <Text style={styles.controlLabel}>Flip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              // Beauty filter trigger
            }}
            style={styles.controlItem}
          >
            <View style={styles.controlCircle}>
              <MaterialCommunityIcons
                name="auto-fix"
                size={22}
                color="#FFFFFF"
              />
            </View>
            <Text style={styles.controlLabel}>Beauty</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleShare} style={styles.controlItem}>
            <View style={styles.controlCircle}>
              <Icon name="share-social-outline" size={22} color="#FFFFFF" />
            </View>
            <Text style={styles.controlLabel}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setRoomTypeModalVisible(true)}
            style={styles.controlItem}
          >
            <View style={styles.controlCircle}>
              <MaterialCommunityIcons
                name="shape-outline"
                size={22}
                color="#FFFFFF"
              />
            </View>
            <Text style={styles.controlLabel}>Room type</Text>
          </TouchableOpacity>
        </View>

        {/* Start Live Button */}
        <TouchableOpacity
          disabled={busy || !cameraReady}
          onPress={start}
          activeOpacity={0.85}
          style={styles.startLiveButton}
        >
          <LinearGradient
            colors={['#FF007F', '#B000FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.startLiveGradient}
          >
            {busy ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.startLiveText}>Start live</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Room Type Bottom Indicator (matching Reference Screenshot) */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setRoomTypeModalVisible(true)}
          style={styles.roomTypeBottomPill}
        >
          <Icon
            name={roomType === 'Ordinary Room' ? 'lock-closed' : 'people'}
            size={18}
            color="#FF1493"
          />
          <Text style={styles.roomTypeBottomText}>{roomType}</Text>
        </TouchableOpacity>

        <ARFilterPanel key={arTab} initialTab={arTab} />
      </View>

      {/* Room Type Selector Modal */}
      <Modal
        visible={roomTypeModalVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setRoomTypeModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setRoomTypeModalVisible(false)}
          />
          <View style={[styles.roomTypeSheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Select Room Type</Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setRoomType('Ordinary Room');
                setRoomTypeModalVisible(false);
              }}
              style={[
                styles.roomTypeOption,
                roomType === 'Ordinary Room' && styles.roomTypeOptionSelected,
              ]}
            >
              <View style={[styles.roomTypeIconWrap, { backgroundColor: 'rgba(255, 20, 147, 0.15)' }]}>
                <Icon name="lock-closed" size={24} color="#FF1493" />
              </View>
              <View style={styles.roomTypeInfo}>
                <Text style={styles.roomTypeOptionTitle}>Ordinary Room (Single Live)</Text>
                <Text style={styles.roomTypeOptionSub}>
                  Host + 1 Guest Co-Host max. Viewers must apply, host approves.
                </Text>
              </View>
              <Icon
                name={roomType === 'Ordinary Room' ? 'checkmark-circle' : 'ellipse-outline'}
                size={22}
                color={roomType === 'Ordinary Room' ? '#FF1493' : '#64748B'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setRoomType('Multi-guest Room');
                setRoomTypeModalVisible(false);
              }}
              style={[
                styles.roomTypeOption,
                roomType === 'Multi-guest Room' && styles.roomTypeOptionSelected,
              ]}
            >
              <View style={[styles.roomTypeIconWrap, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
                <Icon name="people" size={24} color="#A855F7" />
              </View>
              <View style={styles.roomTypeInfo}>
                <Text style={styles.roomTypeOptionTitle}>Multi-guest Room (Multi Live)</Text>
                <Text style={styles.roomTypeOptionSub}>
                  Host + up to 6 Guest Co-Hosts. Viewers must apply, host approves.
                </Text>
              </View>
              <Icon
                name={roomType === 'Multi-guest Room' ? 'checkmark-circle' : 'ellipse-outline'}
                size={22}
                color={roomType === 'Multi-guest Room' ? '#A855F7' : '#64748B'}
              />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 5. Select Live Channel Modal */}
      <SelectLiveChannelModal
        visible={channelModalVisible}
        onClose={() => setChannelModalVisible(false)}
        selectedChannel={channel}
        onSelectChannel={c => setChannel(c)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  cameraPlaceholder: {
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderAvatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderDarkMask: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  circleIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  locationGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingCard: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    zIndex: 10,
  },
  coverBox: {
    width: 86,
    height: 86,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 14,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverText: {
    fontSize: 11,
    color: '#CBD5E1',
    marginTop: 4,
    fontWeight: '600',
  },
  cardRightCol: {
    flex: 1,
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  liveTitleLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  titleInput: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    paddingVertical: 4,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
  },
  channelText: {
    fontSize: 12,
    color: '#CBD5E1',
    fontWeight: '600',
  },
  errorBox: {
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
    padding: 10,
    borderRadius: 8,
    zIndex: 10,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  bottomArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  controlItem: {
    alignItems: 'center',
  },
  controlCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  controlCircleActive: {
    backgroundColor: '#FFFFFF',
  },
  controlLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  startLiveButton: {
    width: '100%',
    borderRadius: 26,
    overflow: 'hidden',
    marginBottom: 10,
  },
  startLiveGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
  },
  startLiveText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  roomTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  roomTypeBadgeText: {
    color: '#FF69B4',
    fontSize: 11,
    fontWeight: '700',
  },
  roomTypeBottomPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 4,
  },
  roomTypeBottomText: {
    color: '#FF1493',
    fontSize: 14,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  roomTypeSheet: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#64748B',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  roomTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  roomTypeOptionSelected: {
    borderColor: '#FF1493',
    backgroundColor: 'rgba(255, 20, 147, 0.08)',
  },
  roomTypeIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  roomTypeInfo: {
    flex: 1,
  },
  roomTypeOptionTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
  },
  roomTypeOptionSub: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 16,
  },
});
