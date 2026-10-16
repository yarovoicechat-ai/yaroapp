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

const formatTimeAgo = (dateInput) => {
  if (!dateInput) return 'Recently';
  const now = new Date();
  const past = new Date(dateInput);
  const diffMs = Math.max(0, now - past);
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 365) return `${diffDays} days ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};

export default function FollowersScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 24);
  const { user } = useContext(AuthContext);

  const rawInitial = route.params?.initialTab || 'following';
  const initialTab = String(rawInitial).toLowerCase();
  const [activeTab, setActiveTab] = useState(
    ['following', 'followers', 'visitors'].includes(initialTab) ? initialTab : 'following'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [usersList, setUsersList] = useState([]);
  const [totalVisitors, setTotalVisitors] = useState(0);
  const [canViewAllVisitors, setCanViewAllVisitors] = useState(false);
  const [followedSet, setFollowedSet] = useState(new Set());

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'visitors') {
        const res = await apiUtil.get('/user/visitors');
        if (res.data?.success) {
          const data = res.data.data || {};
          setUsersList(Array.isArray(data.visitors) ? data.visitors : []);
          setTotalVisitors(data.totalVisitors || 0);
          setCanViewAllVisitors(Boolean(data.canViewAll));
        } else {
          setUsersList([]);
          setTotalVisitors(0);
          setCanViewAllVisitors(false);
        }
      } else if (activeTab === 'following') {
        const res = await apiUtil.get('/user/following');
        if (res.data?.success) {
          const list = res.data.data?.users || res.data.data || [];
          setUsersList(Array.isArray(list) ? list : []);
          // Everyone in following is followed
          const ids = new Set((Array.isArray(list) ? list : []).map(u => String(u._id || u.id || u.userId)));
          setFollowedSet(ids);
        } else {
          setUsersList([]);
        }
      } else {
        // activeTab === 'followers'
        const res = await apiUtil.get('/user/followers');
        if (res.data?.success) {
          const list = res.data.data?.users || res.data.data || [];
          setUsersList(Array.isArray(list) ? list : []);
        } else {
          setUsersList([]);
        }
      }
    } catch (err) {
      console.log('Error fetching list:', err?.message);
      setUsersList([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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
      const res = await apiUtil.post(`/user/follow/${targetId}`);
      if (res?.data?.success) {
        AlertService.show(
          'Success',
          isCurrentlyFollowed ? 'Unfollowed user.' : 'Now following user!',
          'success'
        );
      }
    } catch (e) {
      // Revert on error
      setFollowedSet(prev => {
        const next = new Set(prev);
        if (isCurrentlyFollowed) next.add(targetId);
        else next.delete(targetId);
        return next;
      });
      AlertService.show('Notice', e.response?.data?.message || 'Could not update follow status', 'error');
    }
  };

  const filteredList = usersList.filter(item => {
    if (!searchQuery.trim()) return true;
    const targetObj = activeTab === 'visitors' ? (item.visitor || {}) : item;
    const name = (targetObj.name || '').toLowerCase();
    const id = String(targetObj.userId || targetObj.id || '');
    return name.includes(searchQuery.toLowerCase()) || id.includes(searchQuery);
  });

  const renderVisitorRow = ({ item }) => {
    const visitorUser = item.visitor || {};
    const timeAgo = formatTimeAgo(item.lastVisitedAt);
    const visitCount = item.visitCount || 1;

    return (
      <TouchableOpacity
        style={styles.visitorRow}
        activeOpacity={0.8}
        onPress={() => {
          const targetId = visitorUser.userId || visitorUser._id;
          if (targetId) {
            navigation.navigate('UserProfile', {
              userId: targetId,
              user: visitorUser,
            });
          }
        }}
      >
        <View style={styles.avatarWrap}>
          <Image source={getUserAvatar(visitorUser)} style={styles.avatar} />
          {visitorUser.isOnline && <View style={styles.onlineDot} />}
        </View>

        <View style={styles.infoWrap}>
          <Text style={styles.visitorName} numberOfLines={1}>
            {visitorUser.name || 'User'}
          </Text>
          <Text style={styles.subText} numberOfLines={1}>
            {timeAgo}· visit{' '}
            <Text style={styles.visitCountHighlight}>{visitCount}</Text>
            {' times'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderUserCard = ({ item }) => {
    const targetId = String(item._id || item.id || item.userId);
    const isFollowing = followedSet.has(targetId);

    return (
      <View style={styles.userCard}>
        <TouchableOpacity
          style={styles.userInfoRow}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('UserProfile', { userId: item.userId || item._id, user: item })}
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

  const renderVisitorFooter = () => {
    if (activeTab !== 'visitors' || (usersList.length === 0 && !loading)) return null;

    const displayTotal = totalVisitors || usersList.length;

    return (
      <View style={styles.footerWrap}>
        {/* Total Separator Strip */}
        <View style={styles.totalStrip}>
          <Text style={styles.totalStripText}>
            {displayTotal} Visitors in total
          </Text>
        </View>

        {/* Non-SVIP Gate Card */}
        {!canViewAllVisitors && (
          <View style={styles.svipGateContainer}>
            <View style={styles.overlappingCirclesRow}>
              <View style={[styles.overlapCircle, styles.circle1]}>
                <Image
                  source={require('../../assets/avtar.webp')}
                  style={styles.circleAvatarImg}
                />
              </View>
              <View style={[styles.overlapCircle, styles.circle2]}>
                <Image
                  source={require('../../assets/avtar.webp')}
                  style={styles.circleAvatarImg}
                />
              </View>
              <View style={[styles.overlapCircle, styles.circle3]}>
                <LinearGradient
                  colors={['#4D423F', '#2A2422']}
                  style={styles.circleCountGradient}
                >
                  <Text style={styles.circleCountText}>
                    {displayTotal > 5 ? `${displayTotal}` : '5+'}
                  </Text>
                </LinearGradient>
              </View>
            </View>

            <Text style={styles.gateNoticeText}>Can only view 5 visitors</Text>
            <Text style={styles.gateUpgradePrompt}>
              You can view more when you get SVIP
            </Text>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.getSvipButton}
              onPress={() => navigation.navigate('KingOfKings')}
            >
              <LinearGradient
                colors={['#FFE259', '#FFA751']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.getSvipGrad}
              >
                <Text style={styles.getSvipBtnText}>Get SVIP</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
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
          <Icon name="chevron-back" size={26} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {activeTab === 'visitors' ? 'Visitors' : 'Friends & Followers'}
        </Text>
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

      {/* Search Filter (only for following and followers) */}
      {activeTab !== 'visitors' && (
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
      )}

      {/* Content */}
      {loading ? (
        <View style={{ padding: 16 }}>
          <SkeletonLoader width="100%" height={64} borderRadius={16} style={{ marginBottom: 10 }} />
          <SkeletonLoader width="100%" height={64} borderRadius={16} style={{ marginBottom: 10 }} />
          <SkeletonLoader width="100%" height={64} borderRadius={16} style={{ marginBottom: 10 }} />
        </View>
      ) : (
        <FlatList
          data={filteredList}
          keyExtractor={(item, index) => item._id || item.id || String(index)}
          renderItem={activeTab === 'visitors' ? renderVisitorRow : renderUserCard}
          contentContainerStyle={{
            paddingBottom: bottomPadding + 30,
            ...(activeTab !== 'visitors' ? { paddingHorizontal: 16, paddingTop: 10 } : {}),
          }}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={renderVisitorFooter}
          ListEmptyComponent={
            <EmptyStateView
              icon={activeTab === 'visitors' ? 'footsteps-outline' : 'people-outline'}
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
    backgroundColor: '#FFFFFF',
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
    padding: 2,
  },
  headerTitle: {
    fontSize: 17.5,
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
    backgroundColor: '#F1F5F9',
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
  visitorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    backgroundColor: '#FFFFFF',
  },
  infoWrap: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  visitorName: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  visitCountHighlight: {
    color: '#F59E0B',
    fontWeight: '700',
  },
  footerWrap: {
    marginTop: 10,
    width: '100%',
  },
  totalStrip: {
    width: '100%',
    paddingVertical: 9,
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalStripText: {
    fontSize: 13,
    color: '#888888',
    fontWeight: '500',
  },
  svipGateContainer: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
  },
  overlappingCirclesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  overlapCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  circle1: {
    backgroundColor: '#3E3A39',
    zIndex: 1,
  },
  circle2: {
    backgroundColor: '#433E20',
    marginLeft: -16,
    zIndex: 2,
  },
  circle3: {
    backgroundColor: '#4D423F',
    marginLeft: -16,
    zIndex: 3,
  },
  circleAvatarImg: {
    width: '100%',
    height: '100%',
    opacity: 0.45,
  },
  circleCountGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleCountText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  gateNoticeText: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 6,
    fontWeight: '500',
  },
  gateUpgradePrompt: {
    fontSize: 14,
    color: '#D97706',
    fontWeight: '700',
    marginBottom: 20,
  },
  getSvipButton: {
    width: width * 0.85,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
  getSvipGrad: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  getSvipBtnText: {
    color: '#1E293B',
    fontSize: 15.5,
    fontWeight: '800',
  },
});
