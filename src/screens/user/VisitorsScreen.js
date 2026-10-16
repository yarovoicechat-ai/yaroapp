import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { apiUtil } from '../../utils/apiUtil';
import { AuthContext } from '../../context/AuthProvider';
import { getUserAvatar } from '../../utils/avatarUtil';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';
import SkeletonLoader from '../../components/SkeletonLoader';

const { width } = Dimensions.get('window');

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

export default function VisitorsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 24);
  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [visitors, setVisitors] = useState([]);
  const [totalVisitors, setTotalVisitors] = useState(0);
  const [canViewAll, setCanViewAll] = useState(false);

  const fetchVisitors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiUtil.get('/user/visitors');
      if (res.data?.success) {
        const data = res.data.data || {};
        setVisitors(Array.isArray(data.visitors) ? data.visitors : []);
        setTotalVisitors(data.totalVisitors || 0);
        setCanViewAll(Boolean(data.canViewAll));
      } else {
        setVisitors([]);
        setTotalVisitors(0);
        setCanViewAll(false);
      }
    } catch (err) {
      console.log('Error fetching profile visitors:', err?.message);
      setVisitors([]);
      setTotalVisitors(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVisitors();
  }, [fetchVisitors]);

  const renderVisitorItem = ({ item }) => {
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

  const renderTotalAndGate = () => {
    if (visitors.length === 0 && !loading) return null;

    const displayTotal = totalVisitors || visitors.length;

    return (
      <View style={styles.footerWrap}>
        {/* Total Strip */}
        <View style={styles.totalStrip}>
          <Text style={styles.totalStripText}>
            {displayTotal} Visitors in total
          </Text>
        </View>

        {/* Non-SVIP Gate Card (Shown when user is not SVIP and cannot view all) */}
        {!canViewAll && (
          <View style={styles.svipGateContainer}>
            {/* 3 Overlapping Avatar Preview Circles */}
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

            <Text style={styles.gateNoticeText}>
              Can only view 5 visitors
            </Text>
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

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topSafeInset + 6 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="chevron-back" size={26} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Visitors</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Content */}
      {loading ? (
        <View style={{ padding: 16 }}>
          <SkeletonLoader width="100%" height={64} borderRadius={12} style={{ marginBottom: 12 }} />
          <SkeletonLoader width="100%" height={64} borderRadius={12} style={{ marginBottom: 12 }} />
          <SkeletonLoader width="100%" height={64} borderRadius={12} style={{ marginBottom: 12 }} />
          <SkeletonLoader width="100%" height={64} borderRadius={12} style={{ marginBottom: 12 }} />
          <SkeletonLoader width="100%" height={64} borderRadius={12} style={{ marginBottom: 12 }} />
        </View>
      ) : (
        <FlatList
          data={visitors}
          keyExtractor={(item, index) => item._id || item.visitor?._id || String(index)}
          renderItem={renderVisitorItem}
          contentContainerStyle={{ paddingBottom: bottomPadding + 40 }}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={renderTotalAndGate}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="footsteps-outline" size={54} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No Visitors Yet</Text>
              <Text style={styles.emptySubtitle}>
                People who view your profile will appear here.
              </Text>
            </View>
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
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    padding: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
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
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F1F5F9',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
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
  subText: {
    fontSize: 13,
    color: '#64748B',
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
  },
});
