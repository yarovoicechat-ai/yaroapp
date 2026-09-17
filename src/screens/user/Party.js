import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  FlatList,
  View as ScreenBackgroundView,
  StatusBar as ScreenBackgroundStatusBar,
  StyleSheet as ScreenBackgroundStyleSheet
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset, getTabScreenBottomPadding } from '../../utils/safeAreaUtils';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const cardWidth = (width - 40) / 2;

const TOP_NAV_TABS = ['Follow', 'Explore', 'Nearby', 'Beauty', 'New'];

const COUNTRY_GROUPS = [
  { id: 'popular', type: 'pill', label: 'Popular' },
  { id: 'south_asia', type: 'flags', flags: ['🇮🇳', '🇵🇰', '🇧🇩'] },
  { id: 'americas', type: 'flags', flags: ['🇺🇸', '🇨🇦', '🇲🇽'] },
  { id: 'europe', type: 'flags', flags: ['🇬🇧', '🇩🇪', '🇫🇷'] },
  { id: 'middle_east', type: 'flags', flags: ['🇸🇦', '🇦🇪', '🇹🇷'] },
];

const DUMMY_PARTY_ROOMS = [
  {
    id: 'p1',
    title: 'Welcome guys ❤️',
    hostName: 'Aanya Sharma',
    coverImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    onlineCount: '267.1k',
    flag: '🇮🇳',
  },
  {
    id: 'p2',
    title: 'Hii... 💛',
    hostName: 'Priya Verma',
    coverImage: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop&q=80',
    onlineCount: '83k',
    flag: '🇮🇳',
  },
  {
    id: 'p3',
    title: "I'm new here please support 🥰",
    hostName: 'Simran Kaur',
    coverImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&auto=format&fit=crop&q=80',
    onlineCount: '48.9k',
    flag: '🇮🇳',
  },
  {
    id: 'p4',
    title: 'kindly support! 🙏',
    hostName: 'Sneha Patel',
    coverImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80',
    onlineCount: '52.3k',
    flag: '🇮🇳',
  },
  {
    id: 'p5',
    title: '🦋.·:*Samayra*:·.🦋',
    hostName: 'Samayra',
    coverImage: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80',
    onlineCount: '61.2k',
    flag: '🇮🇳',
  },
  {
    id: 'p6',
    title: "Welcome to my room, let's chat 💕",
    hostName: 'Ananya Roy',
    coverImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
    onlineCount: '91.4k',
    flag: '🇮🇳',
  },
];

export default function PartyScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomTabBarPadding = getTabScreenBottomPadding(insets.bottom);
  const [activeTab, setActiveTab] = useState('Explore');
  const [selectedCountryGroup, setSelectedCountryGroup] = useState('popular');

  const renderHeader = () => (
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

        {/* Right Action Icons: Search & VIP Crown Badge */}
        <View style={styles.rightIconsGroup}>
          <TouchableOpacity activeOpacity={0.8} style={styles.iconCircleBtn}>
            <Icon name="search" size={21} color="#1E293B" />
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.8} style={styles.crownBadgeBtn}>
            <Text style={{ fontSize: 18 }}>👑</Text>
            <View style={styles.newBadgeTag}>
              <Text style={styles.newBadgeText}>New</Text>
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
        {COUNTRY_GROUPS.map((group) => {
          const isSelected = selectedCountryGroup === group.id;
          if (group.type === 'pill') {
            return (
              <TouchableOpacity
                key={group.id}
                onPress={() => setSelectedCountryGroup(group.id)}
                activeOpacity={0.8}
                style={styles.popularPillBtn}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#6C5CE7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.popularPillGradient}
                >
                  <Text style={styles.popularPillText}>{group.label}</Text>
                </LinearGradient>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={group.id}
              onPress={() => setSelectedCountryGroup(group.id)}
              activeOpacity={0.8}
              style={[
                styles.countryGroupPill,
                isSelected && styles.countryGroupPillActive,
              ]}
            >
              <View style={styles.flagsRow}>
                {group.flags.map((flag, idx) => (
                  <Text key={idx} style={styles.flagEmoji}>
                    {flag}
                  </Text>
                ))}
              </View>
              <Icon name="chevron-down" size={14} color="#64748B" style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 3. Hero Promo Banner matching reference image */}
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
              source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80' }}
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
    </View>
  );

  const renderRoomCard = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.88}
      style={styles.cardContainer}
      onPress={() => {
        // Room click action
      }}
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
          <Text style={styles.flagIconText}>{item.flag}</Text>

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
      <FlatList
        data={DUMMY_PARTY_ROOMS}
        renderItem={renderRoomCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        ListHeaderComponent={renderHeader}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={[
          styles.listContentContainer,
          { paddingBottom: bottomTabBarPadding },
        ]}
        showsVerticalScrollIndicator={false}
      />
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
    paddingHorizontal: 16,
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
});
