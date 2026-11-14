import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  useWindowDimensions,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Linking,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { apiUtil } from '../../utils/apiUtil';
import {
  getAppTopSafeInset,
  getTabScreenBottomPadding,
} from '../../utils/safeAreaUtils';
import { getUserAvatar } from '../../utils/avatarUtil';

export default function LiveListScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [category, setCategory] = useState('Live');
  const [rooms, setRooms] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const fetchRooms = useCallback(async () => {
    try {
      const res = await apiUtil.get('/live/rooms');
      setRooms(res.data.data || []);
      setError('');
    } catch (e) {
      setError(
        e.response?.data?.message ||
          'Unable to load live rooms. Pull down to retry.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      fetchRooms();
      apiUtil
        .get('/public/banners?placement=home')
        .then(res => {
          const payload = res.data?.data;
          setBanners(Array.isArray(payload) ? payload : payload?.banners || []);
        })
        .catch(() => {});
      const timer = setInterval(fetchRooms, 15000);
      return () => clearInterval(timer);
    }, [fetchRooms]),
  );
  const filtered = rooms.filter(
    room =>
      (category === 'Live' ||
        category === 'New' ||
        room.category === category) &&
      `${room.title} ${room.host?.name || ''}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  if (category === 'New')
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  // Rows allow a full-width panel-managed banner after the first two live cards.
  const rows = [];
  for (let i = 0; i < filtered.length; i += 2) {
    rows.push({ id: filtered[i]._id, rooms: filtered.slice(i, i + 2) });
    if (i === 0 && banners[0]) rows.push({ id: 'banner', banner: banners[0] });
  }
  const cardWidth = (width - 18) / 2;
  return (
    <View style={styles.screen}>
      <View
        style={[
          styles.header,
          { paddingTop: getAppTopSafeInset(insets.top) + 10 },
        ]}
      >
        <View style={styles.tabs}>
          {['Live', 'New', 'Beauty', 'PK'].map(item => (
            <TouchableOpacity
              key={item}
              onPress={() => setCategory(item)}
              style={styles.tab}
            >
              <Text
                style={[styles.tabText, item === category && styles.active]}
              >
                {item}
              </Text>
              {item === category && <View style={styles.underline} />}
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          accessibilityLabel="Rankings"
          onPress={() => navigation.navigate('Ranking')}
        >
          <Icon name="trophy" size={26} color="#F9C400" />
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityLabel="Search live rooms"
          onPress={() => setSearchOpen(!searchOpen)}
        >
          <Icon name="search-outline" size={27} color="#111" />
        </TouchableOpacity>
      </View>
      {searchOpen && (
        <TextInput
          autoFocus
          style={styles.search}
          value={search}
          onChangeText={setSearch}
          placeholder="Search live rooms or hosts"
          placeholderTextColor="#94A3B8"
        />
      )}
      <LinearGradient
        colors={['#DF18CF', '#EF4444', '#211365', '#C914B4', '#45C51D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.strip}
      />
      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color="#E11D48" />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={item => item.id}
          contentContainerStyle={{
            paddingTop: 6,
            paddingBottom: getTabScreenBottomPadding(insets.bottom) + 20,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchRooms();
              }}
              tintColor="#E11D48"
            />
          }
          ListHeaderComponent={
            error ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {error}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="videocam-outline" size={46} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Be the first to go live</Text>
              <Text style={styles.emptyText}>
                Start your live room from the centre tab.
              </Text>
              <TouchableOpacity
                style={styles.create}
                onPress={() => navigation.navigate('CreateLive')}
              >
                <Text style={{ color: '#FFF', fontWeight: '700' }}>
                  Create Live Room
                </Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) =>
            item.banner ? (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => {
                  const url =
                    item.banner.linkUrl ||
                    item.banner.redirectUrl ||
                    item.banner.link;
                  if (/^https?:\/\//i.test(url || ''))
                    Linking.openURL(url).catch(() => {});
                }}
              >
                <Image
                  source={{ uri: item.banner.image || item.banner.imageUrl }}
                  style={styles.banner}
                />
              </TouchableOpacity>
            ) : (
              <View style={styles.row}>
                {item.rooms.map(room => (
                  <TouchableOpacity
                    key={room._id}
                    style={[
                      styles.card,
                      { width: cardWidth, height: cardWidth * 1.48 },
                    ]}
                    onPress={() =>
                      navigation.navigate('LiveStream', {
                        roomId: room._id,
                        room,
                      })
                    }
                  >
                    <Image
                      source={getUserAvatar(
                        room.coverImage || room.host?.image,
                      )}
                      style={StyleSheet.absoluteFill}
                      resizeMode="cover"
                    />
                    <LinearGradient
                      colors={['transparent', '#0009']}
                      style={styles.shade}
                    />
                    <View style={styles.live}>
                      <Text style={styles.liveText}>LIVE</Text>
                    </View>
                    <View style={styles.viewers}>
                      <Icon name="eye" size={11} color="#FFF" />
                      <Text style={styles.liveText}>
                        {room.viewerCount || 0}
                      </Text>
                    </View>
                    <View style={styles.host}>
                      <Image
                        source={getUserAvatar(room.host)}
                        style={styles.avatar}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.name} numberOfLines={1}>
                          {room.host?.name || 'Live host'}
                        </Text>
                        <Text style={styles.roomTitle} numberOfLines={1}>
                          {room.title}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )
          }
        />
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 17,
    paddingBottom: 20,
    gap: 20,
  },
  tabs: { flexDirection: 'row', flex: 1, gap: 20 },
  tab: { position: 'relative' },
  tabText: { fontSize: 17, fontWeight: '800', color: '#111' },
  active: { color: '#111' },
  underline: {
    height: 3,
    width: 20,
    borderRadius: 3,
    backgroundColor: '#E11D48',
    alignSelf: 'center',
    marginTop: 4,
  },
  strip: { height: 12 },
  search: {
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderRadius: 12,
    color: '#111',
  },
  row: { flexDirection: 'row', gap: 6, paddingHorizontal: 6 },
  card: { overflow: 'hidden', marginBottom: 6, backgroundColor: '#334155' },
  shade: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%' },
  host: {
    position: 'absolute',
    bottom: 12,
    left: 9,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: { width: 26, height: 26, borderRadius: 13 },
  name: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  roomTitle: { color: '#E2E8F0', fontSize: 10, marginTop: 2 },
  live: {
    position: 'absolute',
    top: 9,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
    backgroundColor: '#E11D48',
  },
  liveText: { color: '#FFF', fontWeight: '800', fontSize: 9 },
  viewers: {
    position: 'absolute',
    top: 9,
    right: 8,
    backgroundColor: '#0006',
    borderRadius: 8,
    padding: 4,
    gap: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  banner: {
    width: '100%',
    height: 110,
    marginVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  empty: { alignItems: 'center', padding: 48, paddingTop: 90 },
  emptyTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 20,
  },
  emptyText: { color: '#64748B', textAlign: 'center', marginTop: 9 },
  create: {
    backgroundColor: '#E11D48',
    padding: 15,
    borderRadius: 15,
    marginTop: 22,
  },
  error: { color: '#DC2626', padding: 18 },
});
