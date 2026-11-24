import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { apiUtil } from '../../utils/apiUtil';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function YouTubeSearchModal({
  visible,
  onClose,
  onSelectVideo,
  roomId,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState('');

  const fetchVideos = useCallback(async (query = '') => {
    setLoading(true);
    setError('');
    try {
      const q = String(query || '').trim();
      let res;
      try {
        res = await apiUtil.get(`/voice-club/youtube/search?q=${encodeURIComponent(q)}`);
      } catch (firstErr) {
        // Fallback to youtube/search
        res = await apiUtil.get(`/youtube/search?q=${encodeURIComponent(q)}`);
      }

      const list = res?.data?.data?.items || res?.data?.items || [];
      const items = Array.isArray(list) ? list : [];
      setVideos(items);
      if (items.length === 0 && q) {
        setError('No videos found for this search. Try searching another song or artist.');
      }
    } catch (err) {
      if (err?.code === 'ECONNABORTED' || String(err?.message || '').toLowerCase().includes('network')) {
        setError('Internet connection unavailable. Please check your network.');
      } else if (err?.response?.status === 403) {
        setError('YouTube search quota limit reached. Please try again shortly.');
      } else if (err?.response?.status === 500) {
        setError('Search service temporarily unavailable. Please try again.');
      } else {
        setError(err?.response?.data?.message || 'Unable to load YouTube videos. Tap Retry to try again.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      fetchVideos(searchQuery);
    }
  }, [visible, fetchVideos]);

  const handleSearchSubmit = () => {
    fetchVideos(searchQuery);
  };

  const handleClear = () => {
    setSearchQuery('');
    fetchVideos('');
  };

  const handleSelect = (video) => {
    if (!video?.videoId) return;
    onSelectVideo && onSelectVideo(video);
    onClose && onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Watch video together</Text>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={() => fetchVideos(searchQuery)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="refresh" size={22} color="#1E293B" />
          </TouchableOpacity>
        </View>

        {/* Search Bar Input */}
        <View style={styles.searchBarContainer}>
          <View style={styles.searchInputRow}>
            <Icon name="search" size={20} color="#94A3B8" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search Youtube Videos"
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {Boolean(searchQuery) && (
              <TouchableOpacity onPress={handleClear} style={{ padding: 4 }}>
                <Icon name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Section Heading */}
        <View style={styles.sectionHeadingRow}>
          <Text style={styles.sectionHeadingText}>
            {searchQuery.trim() ? 'Search results' : 'Trending'}
          </Text>
        </View>

        {/* Loading Spinner */}
        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#EF4444" />
            <Text style={styles.loadingText}>Searching YouTube...</Text>
          </View>
        )}

        {/* Error Alert */}
        {Boolean(error) && !loading && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => fetchVideos(searchQuery)} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Video Results List */}
        {!loading && (
          <ScrollView
            style={styles.videoList}
            contentContainerStyle={styles.videoListContent}
            showsVerticalScrollIndicator={false}
          >
            {videos.map((item) => (
              <TouchableOpacity
                key={item.videoId}
                style={styles.videoCard}
                onPress={() => handleSelect(item)}
                activeOpacity={0.8}
              >
                {/* Thumbnail with duration badge */}
                <View style={styles.thumbnailWrapper}>
                  <Image
                    source={{ uri: item.thumbnail || `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg` }}
                    style={styles.thumbnail}
                    resizeMode="cover"
                  />
                  <View style={styles.durationBadge}>
                    <Text style={styles.durationText}>{item.duration || '03:45'}</Text>
                  </View>
                </View>

                {/* Video Info: Title & Subtitle */}
                <View style={styles.videoInfo}>
                  <Text style={styles.videoTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.channelTitle} numberOfLines={1}>
                    {item.channelTitle || 'YouTube'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

            {videos.length === 0 && !error && (
              <View style={styles.emptyBox}>
                <MaterialCommunityIcons name="youtube" size={48} color="#CBD5E1" />
                <Text style={styles.emptyText}>No videos found</Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 44,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  refreshBtn: {
    padding: 4,
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 24,
    paddingHorizontal: 14,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    padding: 0,
  },
  sectionHeadingRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  sectionHeadingText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  videoList: {
    flex: 1,
  },
  videoListContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  videoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  thumbnailWrapper: {
    position: 'relative',
    width: 140,
    height: 84,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  videoInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: 19,
    marginBottom: 4,
  },
  channelTitle: {
    fontSize: 12,
    color: '#64748B',
  },
  loadingBox: {
    paddingTop: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  errorBox: {
    padding: 24,
    alignItems: 'center',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  retryText: {
    color: '#0F172A',
    fontWeight: 'bold',
  },
  emptyBox: {
    paddingTop: 80,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 8,
    color: '#94A3B8',
    fontSize: 14,
  },
});
