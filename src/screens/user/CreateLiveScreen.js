import React, { useContext, useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import {
  createAgoraRtcEngine,
  RtcSurfaceView,
} from 'react-native-agora';
import { AuthContext } from '../../context/AuthProvider';
import { apiUtil } from '../../utils/apiUtil';
import { getUserAvatar } from '../../utils/avatarUtil';
import SelectLiveChannelModal from '../../components/live/SelectLiveChannelModal';

export default function CreateLiveScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [channel, setChannel] = useState('Dance');
  const [channelModalVisible, setChannelModalVisible] = useState(false);
  const [roomType, setRoomType] = useState('Ordinary Room'); // 'Ordinary Room' or 'Multi-guest Room'
  const [coverImage, setCoverImage] = useState(
    /^https:\/\//i.test(user?.avatar || user?.image || '')
      ? user.avatar || user.image
      : '',
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [beautyActive, setBeautyActive] = useState(true);
  const [cameraReady, setCameraReady] = useState(false);

  const engineRef = useRef(null);

  // Initialize camera preview on mount
  useEffect(() => {
    let mounted = true;

    async function initCameraPreview() {
      try {
        if (Platform.OS === 'android') {
          const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.CAMERA,
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          ]);
          if (
            granted[PermissionsAndroid.PERMISSIONS.CAMERA] !==
            PermissionsAndroid.RESULTS.GRANTED
          ) {
            return;
          }
        }

        const engine = createAgoraRtcEngine();
        engineRef.current = engine;
        // Temporary preview appId or fallback
        const res = await apiUtil.get('/live/rooms').catch(() => null);
        engine.initialize({ appId: '915509c2a6574fcfb454378f4803d21b' });
        engine.enableVideo();
        engine.startPreview();
        engine.setBeautyEffectOptions(true, {
          lighteningContrastLevel: 1,
          lighteningLevel: 0.7,
          smoothnessLevel: 0.5,
          rednessLevel: 0.1,
          sharpnessLevel: 0.3,
        });
        if (mounted) setCameraReady(true);
      } catch (err) {
        console.log('Camera preview error:', err?.message);
      }
    }

    initCameraPreview();

    return () => {
      mounted = false;
      try {
        engineRef.current?.stopPreview();
        engineRef.current?.release();
      } catch {}
    };
  }, []);

  const handleFlipCamera = () => {
    try {
      engineRef.current?.switchCamera();
    } catch {}
  };

  const handleToggleBeauty = () => {
    const nextState = !beautyActive;
    setBeautyActive(nextState);
    try {
      engineRef.current?.setBeautyEffectOptions(nextState, {
        lighteningContrastLevel: 1,
        lighteningLevel: nextState ? 0.7 : 0,
        smoothnessLevel: nextState ? 0.5 : 0,
        rednessLevel: nextState ? 0.1 : 0,
        sharpnessLevel: nextState ? 0.3 : 0,
      });
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
    if (busy) return;
    const finalTitle = title.trim() || `${user?.name || 'Live'}'s room`;
    setBusy(true);
    setError('');

    try {
      // Release local preview engine before joining main LiveStream screen
      try {
        engineRef.current?.stopPreview();
        engineRef.current?.release();
        engineRef.current = null;
      } catch {}

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
      navigation.navigate('LiveStream', {
        roomId: room._id,
        room,
        rtc,
        permissionsGranted: true,
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
        <RtcSurfaceView style={StyleSheet.absoluteFill} canvas={{ uid: 0 }} />
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

          <TouchableOpacity onPress={handleToggleBeauty} style={styles.controlItem}>
            <View
              style={[
                styles.controlCircle,
                beautyActive && styles.controlCircleActive,
              ]}
            >
              <MaterialCommunityIcons
                name="auto-fix"
                size={22}
                color={beautyActive ? '#FF1493' : '#FFFFFF'}
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
            onPress={handleToggleRoomType}
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
          disabled={busy}
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

        {/* Room Type Tag (Bottom Left) */}
        <TouchableOpacity
          onPress={handleToggleRoomType}
          style={styles.roomTypeBadge}
          activeOpacity={0.8}
        >
          <Icon name="lock-closed" size={13} color="#FF1493" />
          <Text style={styles.roomTypeBadgeText}>{roomType}</Text>
        </TouchableOpacity>
      </View>

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
    marginBottom: 20,
  },
  controlItem: {
    alignItems: 'center',
  },
  controlCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    marginBottom: 16,
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
});
