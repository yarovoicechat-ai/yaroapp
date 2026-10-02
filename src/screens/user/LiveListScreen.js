import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  Dimensions,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { apiUtil } from '../../utils/apiUtil';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';
import EmptyStateView from '../../components/EmptyStateView';
import SkeletonLoader from '../../components/SkeletonLoader';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 40) / 2;
const CATEGORIES = ['All', 'Chat 💬', 'Music 🎵', 'Gaming 🎮', 'PK Battle ⚔️'];

export default function LiveListScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 24);

  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [streams, setStreams] = useState([]);

  const fetchLiveStreams = useCallback(async () => {
    try {
      // Fetch online hosts / live streamers from API
      const res = await apiUtil.get('/user/hosts?limit=30');
      if (res.data?.success) {
        const payload = res.data.data?.hostsData || res.data.data;
        const hosts = payload?.hosts || (Array.isArray(payload) ? payload : []);

        const mapped = hosts.map((h, i) => ({
          id: h._id || String(i),
          title: `${h.name}'s Live Stream ✨`,
          hostName: h.name || 'Broadcaster',
          coverImage: h.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
          viewers: Math.floor(Math.random() * 80) + 12,
          category: CATEGORIES[(i % (CATEGORIES.length - 1)) + 1],
          hostObj: h,
        }));
        setStreams(mapped);
      } else {
        setStreams([]);
      }
    } catch (e) {
      setStreams([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveStreams();
  }, [fetchLiveStreams]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLiveStreams();
  };

  const filteredStreams = activeCategory === 'All'
    ? streams
    : streams.filter(s => s.category.toLowerCase().includes(activeCategory.toLowerCase()));

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => navigation.navigate('LiveStream', { isHost: false, host: item.hostObj })}
    >
      <Image source={{ uri: item.coverImage }} style={styles.cardCover} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Live Badge */}
      <View style={styles.liveBadge}>
        <View style={styles.redPulseDot} />
        <Text style={styles.liveText}>LIVE</Text>
      </View>

      {/* Viewers Pill */}
      <View style={styles.viewersPill}>
        <Icon name="eye" size={11} color="#FFFFFF" />
        <Text style={styles.viewersText}>{item.viewers}</Text>
      </View>

      {/* Bottom Info */}
      <View style={styles.bottomInfo}>
        <Text style={styles.streamTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.hostName} numberOfLines={1}>{item.hostName}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topSafeInset + 6 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="chevron-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Discovery</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Search')}
          style={styles.searchBtn}
        >
          <Icon name="search-outline" size={20} color="#0F172A" />
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <View style={styles.categoryRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.catBtn, activeCategory === item && styles.catBtnActive]}
              onPress={() => setActiveCategory(item)}
            >
              <Text style={[styles.catText, activeCategory === item && styles.catTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Streams Grid */}
      {loading ? (
        <View style={{ padding: 16, flexDirection: 'row', gap: 12 }}>
          <SkeletonLoader width={CARD_WIDTH} height={200} borderRadius={18} />
          <SkeletonLoader width={CARD_WIDTH} height={200} borderRadius={18} />
        </View>
      ) : (
        <FlatList
          data={filteredStreams}
          numColumns={2}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 14, paddingBottom: bottomPadding + 60 }}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C3AED" />}
          ListEmptyComponent={
            <EmptyStateView
              icon="videocam-outline"
              title="No Active Streams"
              subtitle="No broadcasters are currently live in this category. Be the first to start a live stream!"
              actionText="Go Live Now"
              onAction={() => navigation.navigate('LiveStream', { isHost: true })}
            />
          }
        />
      )}

      {/* Floating Go Live FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: bottomPadding + 10 }]}
        activeOpacity={0.88}
        onPress={() => navigation.navigate('LiveStream', { isHost: true })}
      >
        <LinearGradient
          colors={['#EC4899', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.fabGradient}
        >
          <Icon name="videocam" size={20} color="#FFFFFF" />
          <Text style={styles.fabText}>Start Live</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  searchBtn: {
    padding: 4,
  },
  categoryRow: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  catBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catBtnActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  catText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
  },
  catTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  card: {
    width: CARD_WIDTH,
    height: 220,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 14,
    position: 'relative',
    backgroundColor: '#1E293B',
  },
  cardCover: {
    width: '100%',
    height: '100%',
  },
  liveBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 10,
    gap: 4,
  },
  redPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  liveText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  viewersPill: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 10,
    gap: 4,
  },
  viewersText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '700',
  },
  bottomInfo: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
  },
  streamTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  hostName: {
    color: '#E2E8F0',
    fontSize: 11,
    marginTop: 2,
  },
  fab: {
    position: 'absolute',
    alignSelf: 'center',
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#EC4899',
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  fabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 8,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
