import React, { useState, useContext, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  FlatList,
  Modal,
  TextInput,
  View as ScreenBackgroundView,
  StatusBar as ScreenBackgroundStatusBar,
  StyleSheet as ScreenBackgroundStyleSheet,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset, getTabScreenBottomPadding } from '../../utils/safeAreaUtils';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthProvider';
import { useVoiceRoom } from '../../context/VoiceRoomContext';
import { AlertService } from '../../utils/AlertService';
import { apiUtil } from '../../utils/apiUtil';
import { getUserAvatar } from '../../utils/avatarUtil';
import { requestCameraAndCapture, requestGalleryAndSelect } from '../../utils/verificationMedia';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { countries } from '../../constants/countries';

const { width } = Dimensions.get('window');
const cardWidth = (width - 44) / 2;

const TOP_NAV_TABS = ['Follow', 'Explore', 'Nearby', 'Beauty', 'New'];
const SEAT_OPTIONS = [8, 10, 12, 15];

const POPULAR_COUNTRY_CHIPS = [
  { id: 'all', name: '', label: '🔥 All / Popular', flag: '🔥' },
  { id: 'in', name: 'India', label: 'India', flag: '🇮🇳' },
  { id: 'pk', name: 'Pakistan', label: 'Pakistan', flag: '🇵🇰' },
  { id: 'bd', name: 'Bangladesh', label: 'Bangladesh', flag: '🇧🇩' },
  { id: 'ae', name: 'United Arab Emirates', label: 'UAE', flag: '🇦🇪' },
  { id: 'sa', name: 'Saudi Arabia', label: 'Saudi', flag: '🇸🇦' },
  { id: 'us', name: 'United States', label: 'USA', flag: '🇺🇸' },
  { id: 'gb', name: 'United Kingdom', label: 'UK', flag: '🇬🇧' },
  { id: 'more', name: 'MORE', label: 'More 🌐', flag: '🌐' },
];
const CATEGORY_TAGS = ['Chat 💬', 'Music 🎵', 'Dating 💖', 'Gaming 🎮', 'Chill ☕'];

export default function PartyScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomTabBarPadding = getTabScreenBottomPadding(insets.bottom);
  const { user } = useContext(AuthContext);
  const { enterRoom } = useVoiceRoom();

  const [activeTab, setActiveTab] = useState('Explore');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  // Go Live Room Creation Modal State
  const [goLiveModalVisible, setGoLiveModalVisible] = useState(false);
  const [roomTitleInput, setRoomTitleInput] = useState('');
  const [roomAboutInput, setRoomAboutInput] = useState('');
  const [selectedCover, setSelectedCover] = useState(user?.avatar || 'https://api.yaroapp.in/uploads/avatars/female_default.webp');
  const [selectedSeatCount, setSelectedSeatCount] = useState(8);
  const [selectedCategory, setSelectedCategory] = useState('Music 🎵');
  const [roomMode, setRoomMode] = useState('Public');

  // Real rooms state - No dummy data
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [roomsError, setRoomsError] = useState(false);
  const roomFetchSeq = useRef(0);
  const visibleRooms = selectedCountry
    ? rooms.filter((room) => {
        const c = String(room?.country || '').trim().toLowerCase();
        const sc = selectedCountry.trim().toLowerCase();
        if ((sc === 'india' || sc === 'in') && (!c || c === 'india' || c === 'in')) return true;
        return c === sc || c.includes(sc);
      })
    : rooms;

  // Fetch real active rooms from backend
  const fetchRooms = useCallback(async () => {
    const requestId = ++roomFetchSeq.current;
    try {
      setLoadingRooms(true);
      setRoomsError(false);
      setRooms([]);
      const res = await apiUtil.get('/voice-room/rooms', { params: selectedCountry ? { country: selectedCountry } : {} });
      if (requestId !== roomFetchSeq.current) return;
      const list = res.data?.data?.rooms || res.data?.data || [];
      if (Array.isArray(list)) {
        setRooms(list);
      } else {
        setRooms([]);
      }
    } catch (err) {
      if (requestId !== roomFetchSeq.current) return;
      console.log('Error fetching active rooms:', err?.message);
      setRoomsError(true);
      setRooms([]);
    } finally {
      if (requestId === roomFetchSeq.current) setLoadingRooms(false);
    }
  }, [selectedCountry]);

  useFocusEffect(useCallback(() => { fetchRooms(); }, [fetchRooms]));

  // Direct room entry on click - No annoying popups!
  const handleRoomCardPress = (roomItem) => {
    enterRoom(roomItem, roomItem.isSelfHost, roomItem.seatCount || 8, user);
    navigation.navigate('VoiceRoom', { room: roomItem });
  };

  const launchRoomWithConfig = (config) => {
    const myUserId = String(user?.userId || user?.meethiId || user?._id || '10000001');
    const finalTitle = config.title || (user?.name ? `${user.name}'s Party Club 🎶` : 'My Voice Party 🎵');

    // Room ID and User ID are strictly the same!
    const newRoom = {
      id: myUserId,
      roomId: myUserId,
      channelName: myUserId,
      title: finalTitle,
      about: config.about || 'Welcome to my party! Grab a seat and chat 💕',
      hostName: user?.name || 'You',
      hostId: myUserId,
      country: user?.country?.name || '',
      coverImage: config.coverImage || selectedCover || user?.avatar || user?.image,
      onlineCount: '1',
      flag: '🇮🇳',
      category: config.category || 'Music 🎵',
      mode: config.mode || 'Public',
      seatCount: config.seatCount || 8,
      isSelfHost: true,
    };
    newRoom.flag = user?.country?.flag || newRoom.flag;

    // Sync to backend & save locally so subsequent taps open directly
    apiUtil.post('/voice-room/my-room', newRoom).catch(() => null);
    AsyncStorage.setItem(`@yaro_room_created_${myUserId}`, JSON.stringify(newRoom)).catch(() => null);

    setRooms((prev) => [newRoom, ...prev.filter((r) => r.id !== myUserId)]);
    enterRoom(newRoom, true, newRoom.seatCount, user);
    navigation.navigate('VoiceRoom', { room: newRoom });
  };

  // First time room create, then direct room opening!
  const handleOpenGoLive = async () => {
    const myUserId = String(user?.userId || user?.meethiId || user?._id || '10000001');

    try {
      // 1. Check local storage if room already created
      const stored = await AsyncStorage.getItem(`@yaro_room_created_${myUserId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        launchRoomWithConfig(parsed);
        return;
      }

      // 2. Check backend if room already exists
      const res = await apiUtil.get('/voice-room/my-room');
      if (res.data?.success && res.data?.data?.exists && res.data?.data?.room) {
        const existingRoom = res.data.data.room;
        await AsyncStorage.setItem(`@yaro_room_created_${myUserId}`, JSON.stringify(existingRoom));
        launchRoomWithConfig(existingRoom);
        return;
      }
    } catch (_) {}

    // First time only: show creation modal
    setRoomTitleInput(user?.name ? `${user.name}'s Party Club 🎶` : 'Late Night Chitchat ❤️');
    setRoomAboutInput('Welcome everyone! Jump on a seat, chat, send gifts & enjoy!');
    setSelectedCover(user?.avatar || user?.image || 'https://api.yaroapp.in/uploads/avatars/female_default.webp');
    setGoLiveModalVisible(true);
  };

  const handleCreateRoom = async () => {
    const finalTitle = roomTitleInput.trim() || (user?.name ? `${user.name}'s Party Club 🎶` : 'My Voice Party 🎵');
    const finalAbout = roomAboutInput.trim() || 'Welcome to my party! Grab a seat and chat 💕';
    const config = {
      title: finalTitle,
      about: finalAbout,
      coverImage: selectedCover,
      category: selectedCategory,
      mode: roomMode,
      seatCount: selectedSeatCount,
    };

    setGoLiveModalVisible(false);
    launchRoomWithConfig(config);
  };

  const renderTopNavAndFilters = () => (
    <View style={styles.headerContainer}>
      {/* 1. Top Bar Navigation Tabs & Right Action Icons */}
      <View style={[styles.topNavRow, { paddingTop: topSafeInset + 4 }]}>
        {/* Left Tabs */}
        <View style={styles.leftTabsGroup}>
          {TOP_NAV_TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.8}
                style={styles.tabButton}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab}
                </Text>
                {isActive && <View style={styles.activeIndicator} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Right Action Icons: Search, HD Trophy (Leaderboard), & VIP Crown Badge */}
        <View style={styles.rightIconsGroup}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.iconCircleBtn}
            onPress={() => navigation.navigate('Search')}
          >
            <Icon name="search" size={20} color="#1E293B" />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.trophyIconBtn}
            onPress={() => navigation.navigate('Ranking')}
          >
            <Image
              source={require('../../assets/icons/trophy_hd.png')}
              style={styles.trophyIconImg}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.crownBadgeBtn}
            onPress={() => navigation.navigate('SVIP')}
          >
            <Text style={{ fontSize: 18 }}>👑</Text>
            <View style={styles.newBadgeTag}>
              <Text style={styles.newBadgeText}>SVIP</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Country / Filter Chips Row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterChipsScroll}
      >
        {POPULAR_COUNTRY_CHIPS.map((chip) => {
          const isSelected = chip.name === 'MORE'
            ? false
            : (!selectedCountry && !chip.name) || (selectedCountry && chip.name && selectedCountry.toLowerCase() === chip.name.toLowerCase());

          return (
            <TouchableOpacity
              key={chip.id}
              onPress={() => {
                if (chip.id === 'more') {
                  setCountryPickerVisible(true);
                } else {
                  setSelectedCountry(chip.name);
                }
              }}
              activeOpacity={0.8}
              style={[
                styles.countryGroupPill,
                isSelected && styles.countryGroupPillActive,
              ]}
            >
              {isSelected ? (
                <LinearGradient
                  colors={['#8B5CF6', '#6C5CE7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[StyleSheet.absoluteFillObject, { borderRadius: 20 }]}
                />
              ) : null}
              <Text style={{ fontSize: 13, marginRight: 4 }}>{chip.flag}</Text>
              <Text
                style={{
                  color: isSelected ? '#FFFFFF' : '#475569',
                  fontSize: 12,
                  fontWeight: isSelected ? '900' : '700',
                }}
              >
                {chip.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Selected Country Active Filter Badge */}
      {selectedCountry ? (
        <View style={{ marginHorizontal: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity
            onPress={() => setSelectedCountry('')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#EDE9FE',
              borderRadius: 12,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderWidth: 1,
              borderColor: '#DDD6FE',
            }}
            activeOpacity={0.7}
          >
            <Text style={{ color: '#6D28D9', fontSize: 11, fontWeight: '800' }}>
              Filtering: {selectedCountry} Rooms
            </Text>
            <Icon name="close-circle" size={15} color="#6D28D9" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
          <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '600' }}>
            {visibleRooms.length} room{visibleRooms.length === 1 ? '' : 's'} live
          </Text>
        </View>
      ) : null}
    </View>
  );

  const renderPromoBanner = () => (
    <View style={styles.bannerContainer}>
      <LinearGradient
        colors={['#2D0B5A', '#6B11A1', '#C026D3', '#F43F5E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bannerGradient}
      >
        {/* Left Text & CTA */}
        <View style={styles.bannerLeftContent}>
          <Text style={styles.bannerTitleLine1}>Meet Amazing Voices</Text>
          <Text style={styles.bannerTitleLine2}>
            From <Text style={styles.pinkHighlight}>Around the World</Text>
          </Text>
          <Text style={styles.bannerSubtext}>Chat  •  Make Friends  •  Have Fun</Text>

          <TouchableOpacity activeOpacity={0.85} style={styles.exploreCtaBtn}>
            <LinearGradient
              colors={['#FF2D55', '#E11D48']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.exploreCtaGradient}
            >
              <Text style={styles.exploreCtaText}>Start Exploring</Text>
              <Icon name="chevron-forward" size={14} color="#FFF" style={{ marginLeft: 2 }} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Right Hero Image Graphic */}
        <View style={styles.bannerRightGraphic}>
          <Image
            source={{ uri: 'https://api.yaroapp.in/uploads/avatars/female_default.webp' }}
            style={styles.heroHeadphoneImg}
            resizeMode="cover"
          />
          {/* Floating Vibes Badge */}
          <View style={styles.goodVibesBadge}>
            <Text style={styles.goodVibesText}>Good Vibes Only! 💕</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const renderRoomCard = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.88}
      style={styles.cardContainer}
      onPress={() => handleRoomCardPress(item)}
    >
      <Image source={{ uri: item.coverImage }} style={styles.cardCoverImg} resizeMode="cover" />
      
      {/* Bottom Gradient overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0, 0, 0, 0.4)', 'rgba(0, 0, 0, 0.88)']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Top Left: Online Status Dot */}
      <View style={styles.onlineDotOverlay}>
        <View style={styles.greenDotInner} />
      </View>

      {/* Bottom Information Overlay */}
      <View style={styles.cardBottomOverlay}>
        {/* Title / Status */}
        <Text style={styles.roomStatusTitle} numberOfLines={1}>
          {item.title}
        </Text>

        {/* Bottom Row: Flag on Left, Listener Count on Right */}
        <View style={styles.cardFooterRow}>
          <Text style={styles.flagIconText}>
            {typeof item.flag === 'string'
              ? item.flag
              : (item.flag && typeof item.flag === 'object'
                  ? item.flag.flag || item.flag.name || '🇮🇳'
                  : (typeof item.country === 'object'
                      ? item.country?.flag || item.country?.name || '🇮🇳'
                      : (typeof item.country === 'string' && item.country ? item.country : '🇮🇳')))}
          </Text>

          <View style={styles.listenersGroup}>
            <Text style={{ fontSize: 11, marginRight: 2 }}>🔥</Text>
            <Text style={styles.listenerValText}>{item.onlineCount}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenBackgroundView style={[{ flex: 1, backgroundColor: '#F8FAFC' }]}>
      <ScreenBackgroundStatusBar translucent backgroundColor="transparent" barStyle="dark-content" animated />
      <LinearGradient colors={['#F8FAFC', '#F1F5F9', '#E2E8F0']} style={ScreenBackgroundStyleSheet.absoluteFillObject} />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContentContainer,
          { paddingBottom: bottomTabBarPadding + 64 },
        ]}
      >
        {/* 1. Top Nav Tabs & Country Filter Chips */}
        {renderTopNavAndFilters()}

        {/* 2. First 4 Rooms Grid (before banner) */}
        {loadingRooms && rooms.length === 0 ? (
          <ActivityIndicator size="large" color="#7C3AED" style={{ marginVertical: 55 }} />
        ) : visibleRooms.length > 0 ? (
          <View style={styles.roomsGridContainer}>
            {visibleRooms.slice(0, 4).map((item) => renderRoomCard({ item }))}
          </View>
        ) : (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40, paddingHorizontal: 24, backgroundColor: '#FFFFFF', marginHorizontal: 16, borderRadius: 24, borderWidth: 1, borderColor: '#F1F5F9', elevation: 1 }}>
            <Text style={{ fontSize: 44, marginBottom: 8 }}>
              {selectedCountry ? (countries.find(c => c.name.toLowerCase() === selectedCountry.toLowerCase())?.flag || '🌍') : '🎙️'}
            </Text>
            <Text style={{ fontSize: 17, fontWeight: '800', color: '#1E293B', marginTop: 4, textAlign: 'center' }}>
              {roomsError
                ? 'Could Not Load Rooms'
                : selectedCountry
                  ? `No Active Rooms in ${selectedCountry}`
                  : 'No Active Voice Rooms'}
            </Text>
            <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 6, lineHeight: 19 }}>
              {roomsError
                ? 'Check your internet connection and try again.'
                : selectedCountry
                  ? `Be the first host to start a party in ${selectedCountry}! Invite friends and talk.`
                  : 'Start your own voice room now and meet amazing people!'}
            </Text>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
              <TouchableOpacity
                onPress={handleOpenGoLive}
                style={{
                  backgroundColor: '#7C3AED',
                  borderRadius: 14,
                  paddingHorizontal: 18,
                  paddingVertical: 11,
                  elevation: 2,
                }}
                activeOpacity={0.85}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 }}>
                  Start {selectedCountry ? `${selectedCountry} ` : ''}Party 🚀
                </Text>
              </TouchableOpacity>

              {selectedCountry ? (
                <TouchableOpacity
                  onPress={() => setSelectedCountry('')}
                  style={{
                    backgroundColor: '#EEF2FF',
                    borderRadius: 14,
                    paddingHorizontal: 14,
                    paddingVertical: 11,
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: '#4F46E5', fontWeight: '800', fontSize: 13 }}>Show All</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        )}

        {/* 3. Promo Banner after 4 rooms */}
        {renderPromoBanner()}

        {/* 4. Remaining Rooms Grid (after banner) */}
        {visibleRooms.length > 4 && (
          <View style={styles.roomsGridContainer}>
            {visibleRooms.slice(4).map((item) => renderRoomCard({ item }))}
          </View>
        )}
      </ScrollView>

      {/* Modern Searchable Country Picker Modal */}
      <Modal visible={countryPickerVisible} transparent animationType="slide" onRequestClose={() => setCountryPickerVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.65)', justifyContent: 'flex-end' }}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setCountryPickerVisible(false)} activeOpacity={1} />
          <View style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            padding: 20,
            paddingBottom: Math.max(20, bottomTabBarPadding + 14),
            maxHeight: '80%',
          }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#CBD5E1', alignSelf: 'center', marginBottom: 14 }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ color: '#0F172A', fontSize: 20, fontWeight: '900' }}>Select Country</Text>
                <Text style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>Explore voice rooms from around the world</Text>
              </View>
              <TouchableOpacity
                onPress={() => setCountryPickerVisible(false)}
                style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}
              >
                <Icon name="close" size={18} color="#475569" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#F8FAFC',
              borderRadius: 14,
              borderWidth: 1,
              borderColor: '#E2E8F0',
              paddingHorizontal: 12,
              marginTop: 14,
              marginBottom: 10,
            }}>
              <Icon name="search" size={18} color="#94A3B8" />
              <TextInput
                value={countrySearch}
                onChangeText={setCountrySearch}
                placeholder="Search country name..."
                placeholderTextColor="#94A3B8"
                style={{ flex: 1, color: '#0F172A', paddingVertical: 10, paddingHorizontal: 8, fontSize: 13, fontWeight: '600' }}
              />
              {countrySearch.length > 0 && (
                <TouchableOpacity onPress={() => setCountrySearch('')}>
                  <Icon name="close-circle" size={16} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            {/* Reset to All Countries */}
            <TouchableOpacity
              onPress={() => { setSelectedCountry(''); setCountryPickerVisible(false); }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: !selectedCountry ? '#EEF2FF' : '#F8FAFC',
                borderWidth: 1,
                borderColor: !selectedCountry ? '#6366F1' : '#E2E8F0',
                borderRadius: 14,
                padding: 12,
                marginBottom: 8,
              }}
            >
              <Text style={{ fontSize: 18, marginRight: 10 }}>🔥</Text>
              <Text style={{ color: !selectedCountry ? '#4F46E5' : '#0F172A', fontSize: 14, fontWeight: '800', flex: 1 }}>All Countries (Popular)</Text>
              {!selectedCountry && <Icon name="checkmark-circle" size={20} color="#6366F1" />}
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false}>
              {countries
                .filter(c => c.name.toLowerCase().includes(countrySearch.trim().toLowerCase()))
                .map(c => {
                  const isCur = selectedCountry && selectedCountry.toLowerCase() === c.name.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={c.id || c.name}
                      onPress={() => { setSelectedCountry(c.name); setCountryPickerVisible(false); setCountrySearch(''); }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: isCur ? '#EEF2FF' : '#FFFFFF',
                        borderBottomWidth: 1,
                        borderBottomColor: '#F8FAFC',
                        paddingVertical: 12,
                        paddingHorizontal: 8,
                        borderRadius: 10,
                      }}
                    >
                      <Text style={{ fontSize: 20, marginRight: 12 }}>{c.flag}</Text>
                      <Text style={{ color: isCur ? '#4F46E5' : '#1E293B', fontSize: 15, fontWeight: isCur ? '800' : '600', flex: 1 }}>{c.name}</Text>
                      <Text style={{ color: '#94A3B8', fontSize: 12, marginRight: 10 }}>{c.code}</Text>
                      <Icon name={isCur ? 'checkmark-circle' : 'chevron-forward'} size={18} color={isCur ? '#6366F1' : '#CBD5E1'} />
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* FLOATING "GO LIVE" BUTTON (JUST ABOVE BOTTOM TAB BAR) */}
      <View
        pointerEvents="box-none"
        style={[styles.floatingGoLiveWrapper, { bottom: bottomTabBarPadding + 14 }]}
      >
        <TouchableOpacity
          activeOpacity={0.88}
          style={styles.floatingGoLiveBtn}
          onPress={handleOpenGoLive}
        >
          <LinearGradient
            colors={['#EC4899', '#8B5CF6', '#6366F1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.floatingGoLiveGradient}
          >
            <View style={styles.floatingLivePulseDot}>
              <MaterialCommunityIcons name="broadcast" size={20} color="#FFF" />
            </View>
            <Text style={styles.floatingGoLiveText}>Go Live</Text>
            <Icon name="chevron-forward" size={16} color="rgba(255,255,255,0.85)" style={{ marginLeft: 3 }} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* ============================================================== */}
      {/* GO LIVE: CREATE VOICE PARTY ROOM MODAL                          */}
      {/* ============================================================== */}
      <Modal
        visible={goLiveModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setGoLiveModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { paddingBottom: bottomTabBarPadding + 20 }]}>
            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalTitleBadge}>
                <MaterialCommunityIcons name="broadcast" size={20} color="#EC4899" />
                <Text style={styles.modalSheetTitle}>Start Your Voice Room</Text>
              </View>
              <TouchableOpacity onPress={() => setGoLiveModalVisible(false)} style={styles.closeModalBtn}>
                <Icon name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Room Name */}
              <Text style={styles.inputFieldLabel}>Room Name *</Text>
              <TextInput
                style={styles.textInputField}
                placeholder="Give your room a catchy title..."
                placeholderTextColor="#94A3B8"
                value={roomTitleInput}
                onChangeText={setRoomTitleInput}
              />

              {/* Room About / Topic */}
              <Text style={styles.inputFieldLabel}>Room Announcement / About</Text>
              <TextInput
                style={[styles.textInputField, { height: 60, textAlignVertical: 'top' }]}
                placeholder="What's this room about? (e.g. Hindi songs, chill chit-chat)"
                placeholderTextColor="#94A3B8"
                multiline
                value={roomAboutInput}
                onChangeText={setRoomAboutInput}
              />

              {/* Cover Image Manual Upload */}
              <Text style={styles.inputFieldLabel}>Room Cover Photo</Text>
              <View style={styles.manualUploadAvatarBox}>
                <Image
                  source={{ uri: selectedCover || user?.avatar || 'https://api.yaroapp.in/uploads/avatars/female_default.webp' }}
                  style={styles.manualUploadAvatarPreview}
                />
                <View style={styles.manualUploadActionsCol}>
                  <Text style={styles.manualUploadTitle}>Custom Cover Photo</Text>
                  <Text style={styles.manualUploadSub}>Pick from gallery or capture with camera</Text>
                  <View style={styles.uploadBtnRow}>
                    <TouchableOpacity
                      style={styles.uploadMiniBtn}
                      activeOpacity={0.8}
                      onPress={async () => {
                        try {
                          const picked = await requestGalleryAndSelect();
                          if (picked?.uri) {
                            setSelectedCover(picked.uri);
                            AlertService.show('Cover Selected', 'Cover image selected from gallery', 'success');
                          }
                        } catch (e) {
                          AlertService.show('Upload Error', e?.message || 'Failed to select image', 'error');
                        }
                      }}
                    >
                      <Icon name="images-outline" size={16} color="#6366F1" style={{ marginRight: 5 }} />
                      <Text style={styles.uploadMiniBtnText}>Gallery</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.uploadMiniBtn}
                      activeOpacity={0.8}
                      onPress={async () => {
                        try {
                          const captured = await requestCameraAndCapture('back');
                          if (captured?.uri) {
                            setSelectedCover(captured.uri);
                            AlertService.show('Photo Captured', 'New cover photo captured', 'success');
                          }
                        } catch (e) {
                          AlertService.show('Camera Error', e?.message || 'Failed to capture photo', 'error');
                        }
                      }}
                    >
                      <Icon name="camera-outline" size={16} color="#EC4899" style={{ marginRight: 5 }} />
                      <Text style={styles.uploadMiniBtnText}>Camera</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Number of Seats Selector */}
              <Text style={styles.inputFieldLabel}>Number of Speaker Seats</Text>
              <View style={styles.chipsRow}>
                {SEAT_OPTIONS.map((count) => {
                  const isSelected = selectedSeatCount === count;
                  return (
                    <TouchableOpacity
                      key={count}
                      onPress={() => setSelectedSeatCount(count)}
                      style={[styles.seatChip, isSelected && styles.seatChipActive]}
                      activeOpacity={0.75}
                    >
                      <MaterialCommunityIcons
                        name="seat-recline-normal"
                        size={16}
                        color={isSelected ? '#7C3AED' : '#64748B'}
                      />
                      <Text style={[styles.seatChipText, isSelected && styles.seatChipTextActive]}>
                        {count} Seats
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Room Category Tag */}
              <Text style={styles.inputFieldLabel}>Room Category Tag</Text>
              <View style={styles.chipsRow}>
                {CATEGORY_TAGS.map((tag) => {
                  const isSelected = selectedCategory === tag;
                  return (
                    <TouchableOpacity
                      key={tag}
                      onPress={() => setSelectedCategory(tag)}
                      style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}>
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Room Privacy / Mode */}
              <Text style={styles.inputFieldLabel}>Room Access Mode</Text>
              <View style={styles.chipsRow}>
                {['Public', 'Friends Only', 'VIP'].map((mode) => {
                  const isSelected = roomMode === mode;
                  return (
                    <TouchableOpacity
                      key={mode}
                      onPress={() => setRoomMode(mode)}
                      style={[styles.seatChip, isSelected && styles.seatChipActive]}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.seatChipText, isSelected && styles.seatChipTextActive]}>
                        {mode === 'Public' ? '🌐 Public' : mode === 'Friends Only' ? '👥 Friends' : '🔒 VIP'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Go Live Submit Button */}
              <TouchableOpacity
                style={styles.submitGoLiveBtn}
                onPress={handleCreateRoom}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#EC4899', '#8B5CF6', '#6366F1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitGoLiveGradient}
                >
                  <MaterialCommunityIcons name="broadcast" size={20} color="#FFF" style={{ marginRight: 6 }} />
                  <Text style={styles.submitGoLiveText}>Launch Room (Go Live Now)</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenBackgroundView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingBottom: 8,
  },
  // 1. Top Nav Row
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  leftTabsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  tabButton: {
    alignItems: 'center',
    position: 'relative',
    paddingVertical: 4,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -2,
    width: 22,
    height: 3,
    backgroundColor: '#6C5CE7',
    borderRadius: 2,
  },
  rightIconsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trophyIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.25,
    shadowRadius: 2.5,
  },
  trophyIconImg: {
    width: 25,
    height: 25,
  },
  crownBadgeBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  newBadgeTag: {
    position: 'absolute',
    bottom: -4,
    backgroundColor: '#FF2D55',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
  },
  newBadgeText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '800',
  },

  // 2. Country / Filter Chips Row
  filterChipsScroll: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    alignItems: 'center',
  },
  popularPillBtn: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 2,
  },
  popularPillGradient: {
    paddingHorizontal: 18,
    paddingVertical: 7,
  },
  popularPillText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  countryGroupPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  countryGroupPillActive: {
    borderColor: '#6C5CE7',
    backgroundColor: '#F5F3FF',
  },
  flagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  flagEmoji: {
    fontSize: 14,
  },

  // 3. Hero Banner Card
  bannerContainer: {
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  bannerGradient: {
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 145,
    overflow: 'hidden',
  },
  bannerLeftContent: {
    flex: 0.65,
    justifyContent: 'center',
  },
  bannerTitleLine1: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  bannerTitleLine2: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  pinkHighlight: {
    color: '#FF6584',
  },
  bannerSubtext: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 12,
  },
  exploreCtaBtn: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
  },
  exploreCtaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  exploreCtaText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  bannerRightGraphic: {
    flex: 0.35,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  heroHeadphoneImg: {
    width: 95,
    height: 95,
    borderRadius: 47.5,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  goodVibesBadge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  goodVibesText: {
    color: '#BE185D',
    fontSize: 9,
    fontWeight: '800',
  },

  // 4. Party Rooms Grid
  listContentContainer: {
    paddingHorizontal: 0,
    paddingTop: 4,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cardContainer: {
    width: cardWidth,
    height: 220,
    borderRadius: 20,
    marginBottom: 14,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    position: 'relative',
    elevation: 4,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  cardCoverImg: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  onlineDotOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  greenDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
  },
  cardBottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
  },
  roomStatusTitle: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flagIconText: {
    fontSize: 15,
  },
  listenersGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listenerValText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  // Go Live Header & Modal Styles
  goLiveHeaderBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  goLiveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  goLiveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalSheetTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginLeft: 8,
  },
  closeModalBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputFieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 10,
  },
  textInputField: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  coversScroll: {
    marginBottom: 4,
  },
  coverThumbnailWrap: {
    width: 60,
    height: 60,
    borderRadius: 14,
    marginRight: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  coverThumbnailActive: {
    borderColor: '#EC4899',
  },
  coverThumbnailImg: {
    width: '100%',
    height: '100%',
  },
  selectedCoverCheck: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EC4899',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  seatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  seatChipActive: {
    backgroundColor: '#F5F3FF',
    borderColor: '#7C3AED',
  },
  seatChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginLeft: 4,
  },
  seatChipTextActive: {
    color: '#7C3AED',
    fontWeight: '700',
  },
  categoryChip: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryChipActive: {
    backgroundColor: '#FDF2F8',
    borderColor: '#EC4899',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  categoryChipTextActive: {
    color: '#EC4899',
    fontWeight: '700',
  },
  submitGoLiveBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 20,
    marginBottom: 8,
  },
  submitGoLiveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  submitGoLiveText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  roomsGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 4,
  },

  /* Floating Go Live FAB (Just Above Bottom Tab Bar, on Right Side) */
  floatingGoLiveWrapper: {
    position: 'absolute',
    right: 18,
    alignItems: 'flex-end',
    zIndex: 999,
  },
  floatingGoLiveBtn: {
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  floatingGoLiveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 11,
  },
  floatingLivePulseDot: {
    marginRight: 6,
  },
  floatingGoLiveText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  manualUploadAvatarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 6,
    marginBottom: 16,
  },
  manualUploadAvatarPreview: {
    width: 68,
    height: 68,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  manualUploadActionsCol: {
    flex: 1,
    marginLeft: 12,
  },
  manualUploadTitle: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '700',
  },
  manualUploadSub: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
    marginBottom: 8,
  },
  uploadBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  uploadMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  uploadMiniBtnText: {
    color: '#1E293B',
    fontSize: 11,
    fontWeight: '700',
  },
  roomCardModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  roomCardModalCover: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
  },
  roomCardModalInfo: {
    flex: 1,
    marginLeft: 14,
  },
  roomCardModalTitle: {
    color: '#1E293B',
    fontSize: 16,
    fontWeight: '800',
  },
  roomCardModalHost: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  roomCardModalBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  roomCardModalCategory: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  roomCardModalCategoryText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
  },
  roomCardModalHotness: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  roomCardModalHotnessText: {
    color: '#D97706',
    fontSize: 11,
    fontWeight: '700',
  },
  roomCardAboutBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  roomCardAboutText: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 18,
  },
  joinRoomPrimaryBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 10,
  },
  joinRoomPrimaryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  joinRoomPrimaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  roomSecondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 11,
  },
  roomSecondaryBtnText: {
    color: '#6366F1',
    fontSize: 13,
    fontWeight: '700',
  },
  dismissRoomModalBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  dismissRoomModalText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
});
