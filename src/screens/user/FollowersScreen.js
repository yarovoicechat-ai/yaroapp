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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { apiUtil } from '../../utils/apiUtil';
import { AuthContext } from '../../context/AuthProvider';
import { getUserAvatar } from '../../utils/avatarUtil';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';
import EmptyStateView from '../../components/EmptyStateView';
import SkeletonLoader from '../../components/SkeletonLoader';
import { AlertService } from '../../utils/AlertService';

const { width } = Dimensions.get('window');
const TABS = [
  { id: 'following', label: 'Following' },
  { id: 'followers', label: 'Followers' },
  { id: 'visitors', label: 'Visitors' },
];

export default function FollowersScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 24);
  const { user } = useContext(AuthContext);

  const initialTab = route.params?.initialTab || 'following';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [usersList, setUsersList] = useState([]);
  const [followedSet, setFollowedSet] = useState(new Set());

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch hosts / users list from backend API
      const res = await apiUtil.get('/user/hosts?limit=40');
      if (res.data?.success) {
        const payload = res.data.data?.hostsData || res.data.data;
        const hosts = payload?.hosts || (Array.isArray(payload) ? payload : []);
        setUsersList(hosts);

        // Pre-populate followedSet from user.following if available
        const initialFollowed = new Set((user?.following || []).map(id => String(id._id || id)));
        setFollowedSet(initialFollowed);
      } else {
        setUsersList([]);
      }
    } catch (err) {
      console.log('Error fetching followers list:', err?.message);
      setUsersList([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers, activeTab]);

  const toggleFollow = async (targetUser) => {
    const targetId = String(targetUser._id || targetUser.id || targetUser.userId);
    const isCurrentlyFollowed = followedSet.has(targetId);

    // Optimistic toggle
    setFollowedSet(prev => {
      const next = new Set(prev);
      if (isCurrentlyFollowed) next.delete(targetId);
      else next.add(targetId);
      return next;
    });

    try {
      // Toggle follow API if endpoint exists, or log notice
      const res = await apiUtil.post(`/user/follow/${targetId}`).catch(() => null);
      if (res?.data?.success) {
        AlertService.show('Success', isCurrentlyFollowed ? 'Unfollowed user.' : 'Now following user!', 'info');
      }
    } catch (e) {
      // silently keep optimistic state
    }
  };

  const filteredUsers = usersList.filter(item => {
    if (!searchQuery.trim()) return true;
    const name = (item.name || '').toLowerCase();
    const id = String(item.userId || item.id || '');
    return name.includes(searchQuery.toLowerCase()) || id.includes(searchQuery);
  });

  const renderItem = ({ item }) => {
    const targetId = String(item._id || item.id || item.userId);
    const isFollowing = followedSet.has(targetId);

    return (
      <View style={styles.userCard}>
        <TouchableOpacity
          style={styles.userInfoRow}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('HostProfile', { host: item })}
        >
          <View style={styles.avatarWrap}>
            <Image source={getUserAvatar(item)} style={styles.avatar} />
            {item.isOnline && <View style={styles.onlineDot} />}
          </View>

          <View style={styles.userDetails}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>{item.name || 'User'}</Text>
              {item.isVerified && (
                <Icon name="checkmark-circle" size={15} color="#7C3AED" style={{ marginLeft: 4 }} />
              )}
            </View>
            <Text style={styles.subText} numberOfLines={1}>
              ID: {item.userId || item.id || 'N/A'} • {item.gender || 'User'}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.followBtn, isFollowing && styles.followingBtn]}
          activeOpacity={0.8}
          onPress={() => toggleFollow(item)}
        >
          <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
            {isFollowing ? 'Following' : '+ Follow'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const getEmptyMessage = () => {
    if (activeTab === 'following') return { title: 'No Following Yet', sub: 'Explore interesting hosts and clubs to start following people.' };
    if (activeTab === 'followers') return { title: 'No Followers Yet', sub: 'Share your profile and host voice rooms to gain followers.' };
    return { title: 'No Profile Visitors', sub: 'People who view your profile will appear here.' };
  };

  const emptyInfo = getEmptyMessage();

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
          <Icon name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Friends & Followers</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
              {isActive && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Search Filter */}
      <View style={styles.searchBar}>
        <Icon name="search-outline" size={17} color="#94A3B8" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder={`Search ${activeTab}...`}
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close-circle" size={16} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {loading ? (
        <View style={{ padding: 16 }}>
          <SkeletonLoader width="100%" height={68} borderRadius={16} style={{ marginBottom: 10 }} />
          <SkeletonLoader width="100%" height={68} borderRadius={16} style={{ marginBottom: 10 }} />
          <SkeletonLoader width="100%" height={68} borderRadius={16} style={{ marginBottom: 10 }} />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item, index) => item.id || item._id || String(index)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: bottomPadding }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyStateView
              icon="people-outline"
              title={emptyInfo.title}
              subtitle={emptyInfo.sub}
              actionText="Discover People"
              onAction={() => navigation.navigate('MainTabs', { screen: 'Home' })}
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  tabItemActive: {},
  tabLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#64748B',
  },
  tabLabelActive: {
    color: '#7C3AED',
    fontWeight: '700',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: '50%',
    height: 3,
    backgroundColor: '#7C3AED',
    borderRadius: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 6,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    paddingVertical: 0,
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
  },
  userInfoRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userDetails: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
    maxWidth: 160,
  },
  subText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  followBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: '#7C3AED',
    borderRadius: 20,
  },
  followingBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  followBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  followingBtnText: {
    color: '#64748B',
  },
});
