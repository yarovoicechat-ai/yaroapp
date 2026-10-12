import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, apiPublic } from '../utils/apiUtil';

const LIVE_BANNERS_URL = 'https://api.yaroapp.in/api/public/banners';
const CARD_WIDTH = Dimensions.get('window').width - 32;

const normalizeBanner = (item, index) => {
  const rawImage = item?.imageUrl || item?.image || item?.url;
  if (!rawImage || typeof rawImage !== 'string') return null;
  const image = rawImage.startsWith('http://')
    ? rawImage.replace(/^http:\/\//, 'https://')
    : rawImage.startsWith('https://') || rawImage.startsWith('data:image')
      ? rawImage
      : `${API_BASE_URL.replace(/\/api\/?$/, '')}${rawImage.startsWith('/') ? '' : '/'}${rawImage}`;
  return { ...item, id: String(item?._id || item?.id || `banner-${index}`), image };
};

export default function AdminBannerCarousel({ placement }) {
  const navigation = useNavigation();
  const listRef = useRef(null);
  const [banners, setBanners] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const fetchId = useRef(0);
  const bannersRef = useRef([]);
  const activeIndexRef = useRef(0);
  const cacheKey = `adminBannersCache:${placement}`;

  useEffect(() => { bannersRef.current = banners; }, [banners]);
  useEffect(() => { activeIndexRef.current = activeIndex; }, [activeIndex]);

  const fetchBanners = useCallback(async () => {
    const requestId = ++fetchId.current;
    try {
      const endpoints = __DEV__
        ? [`${LIVE_BANNERS_URL}?placement=${placement}`, `/public/banners?placement=${placement}`]
        : [`/public/banners?placement=${placement}`];
      let response = null;
      let lastError = null;
      for (const endpoint of endpoints) {
        try {
          response = await apiPublic.get(endpoint);
          break;
        } catch (error) {
          lastError = error;
        }
      }
      if (!response) throw lastError || new Error('Banner service unavailable');
      if (requestId !== fetchId.current) return;

      const payload = response.data?.data;
      const items = Array.isArray(payload) ? payload : (payload?.banners || response.data?.banners || []);
      const selected = items
        .filter(item => {
          const itemPlacements = Array.isArray(item?.placements) && item.placements.length
            ? item.placements
            : [item?.placement || 'home'];
          return itemPlacements.includes(placement) && item?.isActive !== false;
        })
        .map(normalizeBanner)
        .filter(Boolean);
      setBanners(selected);
      setActiveIndex(0);
      activeIndexRef.current = 0;
      if (selected.length) {
        const cacheable = selected.filter(item => !item.image.startsWith('data:'));
        await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheable));
      } else {
        await AsyncStorage.removeItem(cacheKey);
      }
    } catch (error) {
      console.log(`[BANNERS:${placement}] Fetch failed:`, error?.message || error);
      try {
        const cached = JSON.parse(await AsyncStorage.getItem(cacheKey) || '[]');
        if (fetchId.current === requestId && Array.isArray(cached)) setBanners(cached);
      } catch (_) {}
    }
  }, [cacheKey, placement]);

  useFocusEffect(useCallback(() => {
    fetchBanners();
    const refreshInterval = setInterval(fetchBanners, 60_000);
    const slideInterval = setInterval(() => {
      const currentBanners = bannersRef.current;
      if (currentBanners.length <= 1) return;
      const nextIndex = (activeIndexRef.current + 1) % currentBanners.length;
      activeIndexRef.current = nextIndex;
      setActiveIndex(nextIndex);
      try { listRef.current?.scrollToIndex({ index: nextIndex, animated: true }); } catch (_) {}
    }, 5_000);
    return () => {
      clearInterval(refreshInterval);
      clearInterval(slideInterval);
    };
  }, [fetchBanners]));

  const openBanner = async (banner) => {
    const type = String(banner?.targetType || '').toLowerCase();
    const url = banner?.linkUrl || banner?.link;
    if (type === 'external' && url) {
      try { await Linking.openURL(url); } catch (error) { console.log('Could not open banner URL:', error?.message); }
      return;
    }
    const screen = type === 'internal' ? banner?.targetScreen : (banner?.targetScreen || banner?.link);
    if (screen) {
      try { navigation.navigate(screen); } catch (error) { console.log('Could not open banner screen:', error?.message); }
    }
  };

  if (!banners.length) return null;

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={banners}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH}
        decelerationRate="fast"
        disableIntervalMomentum
        keyExtractor={item => item.id}
        getItemLayout={(_, index) => ({ length: CARD_WIDTH, offset: CARD_WIDTH * index, index })}
        onMomentumScrollEnd={(event) => {
          const nextIndex = Math.round(event.nativeEvent.contentOffset.x / CARD_WIDTH);
          const boundedIndex = Math.max(0, Math.min(nextIndex, banners.length - 1));
          activeIndexRef.current = boundedIndex;
          setActiveIndex(boundedIndex);
        }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.9}
            onPress={() => openBanner(item)}
            accessibilityRole="button"
            accessibilityLabel={item.title || 'Promotion banner'}
          >
            <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
            <LinearGradient
              colors={['transparent', 'rgba(15, 10, 34, 0.08)', 'rgba(15, 10, 34, 0.78)']}
              locations={[0, 0.42, 1]}
              style={StyleSheet.absoluteFillObject}
            />
            {item.title ? <Text style={styles.title} numberOfLines={2}>{item.title}</Text> : null}
          </TouchableOpacity>
        )}
      />
      {banners.length > 1 ? (
        <View style={styles.dots}>
          {banners.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => {
                activeIndexRef.current = index;
                listRef.current?.scrollToIndex({ index, animated: true });
                setActiveIndex(index);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Show banner ${index + 1}`}
              style={[styles.dot, activeIndex === index && styles.activeDot]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginHorizontal: 16, marginTop: 12, marginBottom: 10 },
  card: {
    width: CARD_WIDTH,
    height: 148,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#EDE9FE',
  },
  image: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  title: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.65)',
    textShadowRadius: 5,
  },
  dots: { flexDirection: 'row', alignSelf: 'center', gap: 6, paddingTop: 9 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#C4B5FD' },
  activeDot: { width: 18, backgroundColor: '#7C3AED' },
});
