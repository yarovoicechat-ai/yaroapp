import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiUtil, apiPublic } from '../../utils/apiUtil';
import { AuthContext } from '../../context/AuthProvider';
import { getUserAvatar } from '../../utils/avatarUtil';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';
import EmptyStateView from '../../components/EmptyStateView';
import SkeletonLoader from '../../components/SkeletonLoader';

const { width } = Dimensions.get('window');
const RECENT_SEARCHES_KEY = '@yaro_recent_searches';
const TABS = ['All', 'Users', 'Rooms'];
const POPULAR_TAGS = ['Party 🎵', 'Music 🎶', 'Chat 💬', 'Hindi 🇮🇳', 'Gaming 🎮', 'Dosti 💕'];

export default function SearchScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 24);
  const { user } = useContext(AuthContext);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [userResults, setUserResults] = useState([]);
  const [roomResults, setRoomResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Load recent search queries
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
        if (raw) setRecentSearches(JSON.parse(raw));
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const saveRecentSearch = async (query) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    try {
      const updated = [
        trimmed,
        ...recentSearches.filter((item) => item.toLowerCase() !== trimmed.toLowerCase()),
      ].slice(0, 10);
      setRecentSearches(updated);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
  };

  const clearRecentSearches = async () => {
    try {
      setRecentSearches([]);
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (e) {
      // ignore
    }
  };

  const executeSearch = useCallback(
    async (queryText) => {
      const q = (queryText !== undefined ? queryText : searchQuery).trim();
      if (!q) {
        setUserResults([]);
        setRoomResults([]);
        setHasSearched(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      setHasSearched(true);
      saveRecentSearch(q);

      try {
        // 1. Try unified public search (covers users by name, username, meethiId, phone, numeric ID, and active rooms)
        let usersList = [];
        let hostsList = [];
        let realRooms = [];

        try {
          const publicRes = await apiPublic.get(`/public/search?q=${encodeURIComponent(q)}&limit=30`);
          if (publicRes?.data?.success && publicRes.data.data) {
            usersList = publicRes.data.data.users || [];
            hostsList = publicRes.data.data.hosts || [];
            realRooms = publicRes.data.data.rooms || [];
          }
        } catch (e) {
          console.log('Public search fallback needed:', e?.message);
        }

        // If public search returned empty or had an issue, fallback to authenticated endpoints
        if (usersList.length === 0 && hostsList.length === 0 && realRooms.length === 0) {
          const [usersRes, hostsRes, roomsRes] = await Promise.all([
            apiUtil.get(`/user?search=${encodeURIComponent(q)}&limit=30`).catch(() => null),
            apiUtil.get(`/user/hosts?search=${encodeURIComponent(q)}&limit=30`).catch(() => null),
            apiUtil.get(`/voice-room/rooms?search=${encodeURIComponent(q)}&limit=30`).catch(() => null),
          ]);

          if (hostsRes?.data?.success) {
            const payload = hostsRes.data.data?.hostsData || hostsRes.data.data;
            hostsList = payload?.hosts || (Array.isArray(payload) ? payload : []);
          }
          if (usersRes?.data?.success) {
            const payload = usersRes.data.data?.usersData || usersRes.data.data;
            usersList = payload?.users || (Array.isArray(payload) ? payload : []);
          }
          if (roomsRes?.data?.success) {
            realRooms = roomsRes.data.data?.rooms || [];
          }
        }

        const userMap = new Map();

        // 1. Process hosts
        hostsList.forEach((h) => {
          const key = String(h.userId || h._id || h.id);
          userMap.set(key, { ...h, isHost: true, role: 'host' });
        });

        // 2. Process general users
        usersList.forEach((u) => {
          const key = String(u.userId || u._id || u.id);
          if (!userMap.has(key)) {
            userMap.set(key, u);
          }
        });

        const currentUserId = String(user?.userId || user?._id || user?.id || '');
        const qLower = q.toLowerCase();

        // Map and rank results: exact ID or name matches appear first!
        const finalUsers = Array.from(userMap.values())
          .map((item) => {
            const itemUserId = String(item.userId || item._id || item.id || '');
            return {
              ...item,
              isMe: Boolean(currentUserId && itemUserId === currentUserId),
            };
          })
          .sort((a, b) => {
            const aId = String(a.userId || '');
            const bId = String(b.userId || '');
            const aName = (a.name || '').toLowerCase();
            const bName = (b.name || '').toLowerCase();

            // Exact ID match gets highest priority
            if (aId === q) return -1;
            if (bId === q) return 1;
            // ID starts with query
            if (aId.startsWith(q) && !bId.startsWith(q)) return -1;
            if (!aId.startsWith(q) && bId.startsWith(q)) return 1;
            // Exact Name match
            if (aName === qLower && bName !== qLower) return -1;
            if (bName === qLower && aName !== qLower) return 1;
            return 0;
          });

        setUserResults(finalUsers);
        setRoomResults(realRooms);
      } catch (err) {
        console.log('Search query error:', err?.message);
        setUserResults([]);
        setRoomResults([]);
      } finally {
        setLoading(false);
      }
    },
    [searchQuery, user]
  );

  // Live auto-search debounce as user types
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setUserResults([]);
      setRoomResults([]);
      setHasSearched(false);
      setLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      executeSearch(trimmed);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery, executeSearch]);

  const handleSelectRecent = (keyword) => {
    // Strip emojis if popular tag
    const cleanWord = keyword.replace(/[^\w\s\u0900-\u097F]/gi, '').trim();
    setSearchQuery(cleanWord || keyword);
    executeSearch(cleanWord || keyword);
  };

  const navigateToUserProfile = (item) => {
    const isHost = item.role === 'host' || item.isHost;
    if (isHost) {
      navigation.navigate('HostProfile', { host: item });
    } else {
      navigation.navigate('UserProfile', { user: item });
    }
  };

  const renderUserItem = ({ item }) => {
    const isHost = item.role === 'host' || item.isHost;
    const displayId = item.userId || item.meethiId || item.id || 'N/A';

    return (
      <TouchableOpacity
        style={styles.userCard}
        activeOpacity={0.88}
        onPress={() => navigateToUserProfile(item)}
      >
        <View style={styles.avatarWrap}>
          <Image source={getUserAvatar(item)} style={styles.avatarImg} />
          {item.isOnline && <View style={styles.onlineDot} />}
        </View>

        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.userName} numberOfLines={1}>
              {item.name || 'User'}
            </Text>
            {item.isVerified && (
              <Icon name="checkmark-circle" size={15} color="#7C3AED" style={{ marginLeft: 4 }} />
            )}
            {item.isMe && (
              <View style={styles.youBadge}>
                <Text style={styles.youBadgeText}>You 👤</Text>
              </View>
            )}
            {isHost && (
              <View style={styles.hostBadge}>
                <Text style={styles.hostBadgeText}>Host 👑</Text>
              </View>
            )}
          </View>
          <Text style={styles.userSub} numberOfLines={1}>
            ID: <Text style={styles.idHighlight}>{displayId}</Text>
            {item.userName && String(item.userName) !== String(displayId) ? ` • @${item.userName}` : ''}
            {item.gender ? ` • ${item.gender}` : ''}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.profileBtn}
          onPress={() => navigateToUserProfile(item)}
        >
          <Text style={styles.profileBtnText}>View</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderRoomItem = ({ item }) => {
    const hostId = item.hostId || item.id || item.roomId;
    return (
      <TouchableOpacity
        style={styles.roomCard}
        activeOpacity={0.88}
        onPress={() => navigation.navigate('VoiceRoom', { room: item })}
      >
        <View style={styles.roomIconBox}>
          {item.coverImage ? (
            <Image source={{ uri: item.coverImage }} style={styles.roomCover} />
          ) : (
            <Icon name="mic" size={24} color="#7C3AED" />
          )}
        </View>
        <View style={styles.roomInfo}>
          <Text style={styles.roomTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.roomSub} numberOfLines={1}>
            Host: {item.hostName} (ID: {hostId}) • {item.category || 'Chat 💬'}
          </Text>
        </View>
        <View style={styles.roomBadge}>
          <Icon name="people" size={13} color="#10B981" />
          <Text style={styles.roomCount}>{item.onlineCount || 1}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderAllTabContent = () => {
    const hasRooms = roomResults.length > 0;
    const hasUsers = userResults.length > 0;

    if (!hasRooms && !hasUsers) {
      return (
        <EmptyStateView
          icon="search-outline"
          title="No Results Found"
          subtitle={`We couldn't find anything matching "${searchQuery}". Try searching with a different name or ID.`}
          actionText="Search Again"
          onAction={() => setSearchQuery('')}
        />
      );
    }

    return (
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: bottomPadding }}
        showsVerticalScrollIndicator={false}
      >
        {/* Real Rooms Section */}
        {hasRooms && (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Voice Rooms</Text>
              <Text style={styles.sectionCount}>{roomResults.length}</Text>
            </View>
            {roomResults.map((item, idx) => (
              <View key={item.id || item.roomId || String(idx)}>
                {renderRoomItem({ item })}
              </View>
            ))}
          </View>
        )}

        {/* Users & Hosts Section */}
        {hasUsers && (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Users & Hosts</Text>
              <Text style={styles.sectionCount}>{userResults.length}</Text>
            </View>
            {userResults.map((item, idx) => (
              <View key={item.userId || item._id || item.id || String(idx)}>
                {renderUserItem({ item })}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />

      {/* Header Search Bar */}
      <View style={[styles.headerBar, { paddingTop: topSafeInset + 6 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>

        <View style={styles.inputWrap}>
          <Icon name="search-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.textInput}
            placeholder="Search by name, ID, or room..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={() => executeSearch()}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setHasSearched(false);
                setUserResults([]);
                setRoomResults([]);
              }}
            >
              <Icon name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity onPress={() => executeSearch()} style={styles.searchSubmitBtn}>
          <Text style={styles.searchSubmitText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          let count = 0;
          if (hasSearched) {
            if (tab === 'Users') count = userResults.length;
            if (tab === 'Rooms') count = roomResults.length;
            if (tab === 'All') count = userResults.length + roomResults.length;
          }
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, isActive && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab}
                {hasSearched ? ` (${count})` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content Area */}
      {loading ? (
        <View style={{ padding: 16 }}>
          <SkeletonLoader width="100%" height={70} borderRadius={16} style={{ marginBottom: 12 }} />
          <SkeletonLoader width="100%" height={70} borderRadius={16} style={{ marginBottom: 12 }} />
          <SkeletonLoader width="100%" height={70} borderRadius={16} style={{ marginBottom: 12 }} />
        </View>
      ) : !hasSearched ? (
        <ScrollView style={styles.recentSection} keyboardShouldPersistTaps="handled">
          {recentSearches.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <View style={styles.recentHeader}>
                <Text style={styles.recentTitle}>Recent Searches</Text>
                <TouchableOpacity onPress={clearRecentSearches}>
                  <Text style={styles.clearRecentText}>Clear</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.tagsRow}>
                {recentSearches.map((tag, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.tagPill}
                    onPress={() => handleSelectRecent(tag)}
                  >
                    <Icon name="time-outline" size={13} color="#64748B" style={{ marginRight: 5 }} />
                    <Text style={styles.tagText}>{tag}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Popular Discovery Tags */}
          <View>
            <View style={styles.recentHeader}>
              <Text style={styles.recentTitle}>Popular Categories</Text>
            </View>
            <View style={styles.tagsRow}>
              {POPULAR_TAGS.map((tag, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.popularTagPill}
                  onPress={() => handleSelectRecent(tag)}
                >
                  <Text style={styles.popularTagText}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      ) : activeTab === 'All' ? (
        renderAllTabContent()
      ) : (
        <FlatList
          data={activeTab === 'Rooms' ? roomResults : userResults}
          keyExtractor={(item, index) => item.id || item.roomId || item.userId || item._id || String(index)}
          renderItem={activeTab === 'Rooms' ? renderRoomItem : renderUserItem}
          contentContainerStyle={{ padding: 16, paddingBottom: bottomPadding }}
          ListEmptyComponent={
            <EmptyStateView
              icon="search-outline"
              title="No Results Found"
              subtitle={`We couldn't find any ${activeTab.toLowerCase()} matching "${searchQuery}".`}
              actionText="Search Again"
              onAction={() => setSearchQuery('')}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    paddingRight: 10,
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 42,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 0,
  },
  searchSubmitBtn: {
    marginLeft: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  searchSubmitText: {
    color: '#7C3AED',
    fontSize: 14,
    fontWeight: '700',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 8,
  },
  tabBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
  },
  tabBtnActive: {
    backgroundColor: '#7C3AED',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  recentSection: {
    flex: 1,
    padding: 16,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recentTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#334155',
  },
  clearRecentText: {
    fontSize: 12.5,
    color: '#94A3B8',
    fontWeight: '600',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  tagText: {
    fontSize: 12.5,
    color: '#475569',
    fontWeight: '500',
  },
  popularTagPill: {
    backgroundColor: '#F5F3FF',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  popularTagText: {
    fontSize: 12.5,
    color: '#7C3AED',
    fontWeight: '600',
  },
  sectionWrap: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7C3AED',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarImg: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  userName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
    maxWidth: 140,
  },
  hostBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    marginLeft: 6,
  },
  hostBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#D97706',
  },
  youBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    marginLeft: 6,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  youBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#4338CA',
  },
  userSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  idHighlight: {
    fontWeight: '700',
    color: '#0F172A',
  },
  profileBtn: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    backgroundColor: '#F3E8FF',
    borderRadius: 12,
  },
  profileBtnText: {
    color: '#7C3AED',
    fontSize: 12.5,
    fontWeight: '700',
  },
  roomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 1,
  },
  roomIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  roomCover: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  roomInfo: {
    flex: 1,
    marginLeft: 12,
  },
  roomTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  roomSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  roomBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 4,
  },
  roomCount: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
  },
});
