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
  useWindowDimensions,
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
import { ARManager, ARPreview, ARFilterPanel, ARFaceMaskOverlay, useARLifecycle, useARSession } from '../../features/YaroAR';
import AgoraClientService from '../../services/agoraService';
import { useVoiceRoom } from '../../context/VoiceRoomContext';
import LiveVideoGrid from '../../components/live/LiveVideoGrid';
import RoomLockModal from '../../components/room/RoomLockModal';
import AvatarSourceModal from '../../components/profile/AvatarSourceModal';
import { requestCameraAndCapture, requestGalleryAndSelect } from '../../utils/verificationMedia';
import { uploadToCloudinary } from '../../utils/cloudinaryUtil';
import { AlertService } from '../../utils/AlertService';

export default function CreateLiveScreen({ navigation, route }) {
  const ar = useARSession();
  const { user } = useContext(AuthContext);
  const { activeRoom } = useVoiceRoom();
  const insets = useSafeAreaInsets();
  const { height: viewportHeight } = useWindowDimensions();
  const [infoBottom, setInfoBottom] = useState(0);
  const [controlsHeight, setControlsHeight] = useState(70);
  const [bottomHeight, setBottomHeight] = useState(190);
  const [title, setTitle] = useState('');
  const [channel, setChannel] = useState('');
  const [channelModalVisible, setChannelModalVisible] = useState(false);
  const [roomType, setRoomType] = useState('Ordinary Room'); // 'Ordinary Room' or 'Multi-guest Room'
  const [roomTypeModalVisible, setRoomTypeModalVisible] = useState(false);
  const [isPrivateLive, setIsPrivateLive] = useState(false);
  const [livePin, setLivePin] = useState('');
  const [lockModalVisible, setLockModalVisible] = useState(false);
  const [coverPickerVisible, setCoverPickerVisible] = useState(false);
  const [coverImage, setCoverImage] = useState(
    /^https:\/\//i.test(user?.avatar || user?.image || '')
      ? user.avatar || user.image
      : '',
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [cameraReady, setCameraReady] = useState(false);
  const [arTab, setArTab] = useState(route?.params?.arTab || null);
  const [seatCount, setSeatCount] = useState(4);
  const controlsTop = infoBottom || insets.top + 190;
  const gridTop = controlsTop + controlsHeight + 8;
  const gridHeight = Math.max(80, viewportHeight - bottomHeight - gridTop - 12);

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
        if (activeRoom) {
          setError('Leave your voice room before opening the live camera.');
          return;
        }
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
        const initialized=engine.initialize({ appId: config.appId });
        if (initialized < 0) throw new Error(`Camera initialization failed (${initialized}).`);
        engine.registerEventHandler?.({
          onLocalVideoStateChanged: (_source, state, code) => {
            if (mounted && state === 3) {
              setCameraReady(false);
              setError(`Camera video failed (${code}). Check camera permission and try again.`);
            }
          },
          onError: code => {
            if (mounted) setError(`Camera engine error (${code}).`);
          },
        });
        const enabled=engine.enableVideo();
        if (enabled < 0) throw new Error(`Video could not start (${enabled}).`);
        arUnbindRef.current=ARManager.bind(engine);
        const preview=engine.startPreview();
        if (preview < 0) throw new Error(`Camera preview failed (${preview}).`);
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
  }, [releasePreview, activeRoom]));

  const handleFlipCamera = () => {
    void ARManager.switchCamera().catch(error => setError(error.message));
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

  const handleTogglePrivateLive = () => {
    if (isPrivateLive) {
      setIsPrivateLive(false);
      setLivePin('');
      AlertService.show('Notice', 'Private live lock turned off. Your live room is now public.', 'info');
    } else {
      setLockModalVisible(true);
    }
  };

  const handleSelectCover = async (source) => {
    setCoverPickerVisible(false);
    try {
      const captured = source === 'camera'
        ? await requestCameraAndCapture('front')
        : await requestGalleryAndSelect();
      if (!captured?.uri) return;

      setCoverImage(captured.uri);

      try {
        const cloudUrl = await uploadToCloudinary(captured, 'live_cover');
        if (cloudUrl) {
          setCoverImage(cloudUrl);
          return;
        }
      } catch (_) {}

      const formData = new FormData();
      formData.append('file', {
        uri: captured.uri,
        type: captured.type || 'image/jpeg',
        name: captured.name || `cover_${Date.now()}.jpg`,
      });
      const res = await apiUtil.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.url || res.data?.data?.url) {
        setCoverImage(res.data.url || res.data.data.url);
      }
    } catch (err) {
      if (err?.message && !err.message.includes('cancel')) {
        AlertService.show('Cover Photo', err.message || 'Could not select cover image', 'error');
      }
    }
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
        seatCount: mode === 'multi' ? seatCount : 2,
        coverImage,
        country: user?.country || 'India',
        isPrivate: isPrivateLive,
        pin: isPrivateLive ? livePin : '',
      });

      const { room, rtc } = res.data.data;
      const arSettings=ARManager.getSnapshot();
      const arEffectId=arSettings.selectedId;
      await releasePreview();
      setCameraReady(false);
      navigation.navigate('LiveStream', {
        roomId: room._id,
        room,
        rtc,
        permissionsGranted: true,
        arEffectId,
        arSettings: arEffectId ? { intensity: arSettings.intensity, beautyIntensity: arSettings.beautyIntensity, adjustments: arSettings.adjustments, frontCamera: arSettings.frontCamera } : undefined,
      });
    } catch (e) {
      setError(
        e.response?.data?.message || e.message || 'Could not start live.',
      );
    } finally {
      setBusy(false);
    }
  };

  const renderCameraControls = () => (
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
          setArTab((value) => (value === 'Beauty' ? null : 'Beauty'));
        }}
        style={styles.controlItem}
      >
        <View style={styles.controlCircle}>
          <MaterialCommunityIcons name="auto-fix" size={22} color="#FFFFFF" />
        </View>
        <Text style={styles.controlLabel}>Beauty</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          setArTab((value) => (value === 'Effects' ? null : 'Effects'));
        }}
        style={styles.controlItem}
      >
        <View style={styles.controlCircle}>
          <MaterialCommunityIcons name="creation" size={22} color="#FFFFFF" />
        </View>
        <Text style={styles.controlLabel}>Effects</Text>
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
  );

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* 1. Full-screen Camera Preview Background */}
      {roomType === 'Multi-guest Room' ? (
        <View testID="multi-live-preview" style={[styles.multiPreview, { top: gridTop, height: gridHeight }]}>
          <LiveVideoGrid count={seatCount} host={user} hostUid={0} localUid={0} isHost ready={cameraReady}
            trackId={ar.trackId} frontCamera={ar.frontCamera} />
        </View>
      ) : cameraReady ? (
        <View style={StyleSheet.absoluteFill}>
          <ARPreview style={StyleSheet.absoluteFill} />
          <ARFaceMaskOverlay
            effectId={ar.selectedId}
            intensity={ar.intensity}
            style={StyleSheet.absoluteFill}
          />
        </View>
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
      <View testID="live-info-card" style={styles.floatingCard}
        onLayout={({ nativeEvent: { layout } }) => setInfoBottom(layout.y + layout.height + 12)}>
        {/* Cover Box */}
        <TouchableOpacity
          onPress={() => setCoverPickerVisible(true)}
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

      {roomType === 'Multi-guest Room' && <View testID="multi-live-controls"
        onLayout={({ nativeEvent: { layout } }) => setControlsHeight(layout.height)}
        style={{ position: 'absolute', top: controlsTop, left: 20, right: 20, zIndex: 11 }}>{renderCameraControls()}</View>}

      {/* 4. Bottom Controls Area */}
      <View testID="live-start-bottom" onLayout={({ nativeEvent: { layout } }) => setBottomHeight(layout.height)}
        style={[styles.bottomArea, { paddingBottom: insets.bottom + 16 }]}>
        {roomType !== 'Multi-guest Room' && renderCameraControls()}

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

        {/* Room Type & Lock Control Row */}
        <View style={styles.bottomPillRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setRoomTypeModalVisible(true)}
            style={styles.roomTypeBottomPill}
          >
            <Icon
              name={roomType === 'Ordinary Room' ? 'videocam' : 'people'}
              size={18}
              color="#FF1493"
            />
            <Text style={styles.roomTypeBottomText}>{roomType}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleTogglePrivateLive}
            style={[
              styles.roomTypeBottomPill,
              isPrivateLive && { borderColor: '#A855F7', backgroundColor: 'rgba(168, 85, 247, 0.25)' },
            ]}
          >
            <Icon
              name={isPrivateLive ? 'lock-closed' : (user?.canPrivateLive ? 'lock-open-outline' : 'lock-closed-outline')}
              size={18}
              color={isPrivateLive ? '#C084FC' : (user?.canPrivateLive ? '#94A3B8' : '#64748B')}
            />
            <Text style={[styles.roomTypeBottomText, isPrivateLive && { color: '#E9D5FF', fontWeight: 'bold' }]}>
              {isPrivateLive ? 'Private 🔒' : (user?.canPrivateLive ? 'Public Live' : 'Private (Locked)')}
            </Text>
          </TouchableOpacity>
        </View>

      </View>

      {/* AR Studio / Beauty / Effects Bottom Sheet Modal */}
      <Modal
        visible={arTab !== null}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setArTab(null)}
      >
        <View style={styles.arModalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            accessibilityLabel="Close AR effects"
            onPress={() => setArTab(null)}
          />
          <View style={[styles.arSheetContainer, { paddingBottom: insets.bottom + 8 }]}>
            {arTab && (
              <ARFilterPanel
                key={arTab}
                initialTab={arTab}
                onClose={() => setArTab(null)}
                showTabs={false}
                compact
              />
            )}
          </View>
        </View>
      </Modal>

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
            <View style={styles.featureTabs}>
              {[4, 6, 9].map(count => (
                <TouchableOpacity key={count} style={styles.featureTab} accessibilityLabel={`${count} video boxes`}
                  onPress={() => { setSeatCount(count); setRoomType('Multi-guest Room'); setRoomTypeModalVisible(false); }}>
                  <Text style={[styles.controlLabel, roomType === 'Multi-guest Room' && seatCount === count && { color: '#FF72BD' }]}>{count} boxes</Text>
                </TouchableOpacity>
              ))}
            </View>

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
                  {seatCount} video boxes including the host. Host approves join requests.
                </Text>
              </View>
              <Icon
                name={roomType === 'Multi-guest Room' ? 'checkmark-circle' : 'ellipse-outline'}
                size={22}
                color={roomType === 'Multi-guest Room' ? '#A855F7' : '#64748B'}
              />
            </TouchableOpacity>

            {/* Private Live Option Card */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setRoomTypeModalVisible(false);
                handleTogglePrivateLive();
              }}
              style={[
                styles.roomTypeOption,
                isPrivateLive && { borderColor: '#A855F7', backgroundColor: 'rgba(168, 85, 247, 0.12)' },
              ]}
            >
              <View style={[styles.roomTypeIconWrap, { backgroundColor: isPrivateLive ? 'rgba(168, 85, 247, 0.25)' : 'rgba(148, 163, 184, 0.15)' }]}>
                <Icon name="lock-closed" size={24} color={isPrivateLive ? '#A855F7' : '#94A3B8'} />
              </View>
              <View style={styles.roomTypeInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.roomTypeOptionTitle}>Private Live</Text>
                  {user?.canPrivateLive ? (
                    <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 }}>
                      <Text style={{ color: '#10B981', fontSize: 10, fontWeight: '700' }}>ENABLED</Text>
                    </View>
                  ) : (
                    <View style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 }}>
                      <Text style={{ color: '#EF4444', fontSize: 10, fontWeight: '700' }}>ADMIN ONLY</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.roomTypeOptionSub}>
                  {user?.canPrivateLive
                    ? (isPrivateLive ? 'Protected with 4-digit PIN. Tap to change or remove.' : 'Set a 4-digit PIN. Only authorized viewers can enter.')
                    : 'Option requires activation by Admin Panel for your user ID.'}
                </Text>
              </View>
              <Icon
                name={isPrivateLive ? 'checkmark-circle' : 'lock-closed-outline'}
                size={22}
                color={isPrivateLive ? '#A855F7' : '#64748B'}
              />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Room Lock Modal for setting 4-digit PIN */}
      <RoomLockModal
        visible={lockModalVisible}
        mode="set_pin"
        isLive={true}
        title="Private Live"
        onClose={() => setLockModalVisible(false)}
        onSuccess={(pin) => {
          setIsPrivateLive(true);
          setLivePin(pin);
          AlertService.show('Private Live Enabled 🔒', '4-digit password set successfully. Viewers must enter this password to join your live stream.', 'success');
        }}
      />

      {/* 5. Select Live Channel Modal */}
      <SelectLiveChannelModal
        visible={channelModalVisible}
        onClose={() => setChannelModalVisible(false)}
        selectedChannel={channel}
        onSelectChannel={c => setChannel(c)}
      />

      {/* 6. Live Cover Source Modal */}
      <AvatarSourceModal
        visible={coverPickerVisible}
        onClose={() => setCoverPickerVisible(false)}
        onSelectSource={handleSelectCover}
        styles={styles}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContentCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    alignItems: 'center',
  },
  modalHandleBar: {
    width: 44,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#CBD5E1',
    marginBottom: 16,
  },
  modalHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  modalSubheading: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 20,
  },
  modalOptionsGrid: {
    width: '100%',
    gap: 12,
  },
  modalTile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalTileIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  modalTileTextWrap: {
    flex: 1,
  },
  modalTileTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  modalTileDesc: {
    fontSize: 12,
    color: '#64748B',
  },
  modalCancelButton: {
    marginTop: 16,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748B',
  },
  multiPreview: { position: 'absolute', left: 8, right: 8 },
  featureTabs: { flexDirection: 'row', paddingVertical: 10, justifyContent: 'space-around' },
  featureTab: { paddingHorizontal: 5, paddingVertical: 8, alignItems: 'center' },
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
  bottomPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  roomTypeBottomPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
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
  arModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  arSheetContainer: {
    paddingHorizontal: 8,
  },
});
