import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';
import { AuthContext } from '../../context/AuthProvider';
import { apiUtil } from '../../utils/apiUtil';
import EmptyStateView from '../../components/EmptyStateView';

const coinIcon = require('../../assets/coin.webp');

const GIFT_FILTER_TABS = [
  { id: 'all_gifts', label: 'All Gifts' },
  { id: 'received', label: 'Received', icon: 'gift-outline' },
  { id: 'sent', label: 'Sent', icon: 'send-outline' },
  { id: 'system', label: 'System', icon: 'shield-checkmark-outline' },
];

export default function GiftsScreen() {
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 24);
  const navigation = useNavigation();
  const { user, fetchUserProfile } = useContext(AuthContext);

  const [activeFilter, setActiveFilter] = useState('all_gifts');
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchGifts = useCallback(async () => {
    try {
      const res = await apiUtil.get('/gift/all');
      const data = res.data?.data || res.data || [];
      if (Array.isArray(data)) {
        const formatted = data.map((g, idx) => ({
          id: g._id || `gift_${idx}`,
          name: g.name || 'Special Gift',
          age: g.category || '',
          avatar: g.icon || g.image || 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400',
          giftName: g.name || 'Gift',
          giftEmoji: '🎁',
          price: String(g.coins || g.diamonds || 10),
          time: 'Active',
          type: 'all_gifts',
          quote: g.description || 'Interactive virtual gift',
        }));
        setGifts(formatted);
      }
    } catch (e) {
      console.log('Error fetching gifts:', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGifts();
    fetchUserProfile?.();
  }, [fetchGifts, fetchUserProfile]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchGifts(), fetchUserProfile?.()]);
    setRefreshing(false);
  };

  const filteredData = activeFilter === 'all_gifts'
    ? gifts
    : gifts.filter(g => g.type === activeFilter);

  const renderGiftItem = ({ item }) => (
    <View style={styles.cardWrapper}>
      <View style={styles.avatarWrapper}>
        <Image source={{ uri: item.avatar }} style={styles.userAvatarImg} />
      </View>

      <View style={styles.cardMainContent}>
        <View style={styles.nameAgeBadgeRow}>
          <Text style={styles.userNameText}>{item.name}</Text>
          {item.age ? <Text style={styles.userAgeText}>{item.age}</Text> : null}
        </View>
        <Text style={styles.giftSentNoticeText}>Virtual Gift</Text>
        <Text style={styles.giftQuoteText} numberOfLines={1}>
          {item.quote}
        </Text>
      </View>

      <View style={styles.giftDetailGraphicBox}>
        <Text style={{ fontSize: 24 }}>{item.giftEmoji}</Text>
        <View style={{ marginLeft: 6 }}>
          <Text style={styles.giftNameText}>{item.giftName}</Text>
          <View style={styles.giftPriceCoinRow}>
            <Image source={coinIcon} style={{ width: 13, height: 13, marginRight: 3 }} />
            <Text style={styles.giftCoinValText}>{item.price}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <LinearGradient colors={['#F8FAFC', '#F1F5F9', '#E2E8F0']} style={StyleSheet.absoluteFillObject} />
      {/* Top Header Bar */}
      <View style={[styles.topBarGroup, { paddingTop: topSafeInset + 4 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity
            style={styles.backBtnCircle}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Icon name="arrow-back" size={20} color="#1E293B" />
          </TouchableOpacity>
        </View>

        <View style={styles.rightActionsGroup}>
          <TouchableOpacity
            style={styles.coinBalancePillCard}
            onPress={() => navigation.navigate('Recharge')}
            activeOpacity={0.8}
          >
            <Image source={coinIcon} style={styles.coinIconImg} resizeMode="contain" />
            <Text style={styles.coinValText}>{Number(user?.diamonds || 0).toLocaleString()}</Text>
            <View style={styles.plusIconBadgeCircle}>
              <Icon name="add" size={10} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bellButtonCircle}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Icon name="notifications-outline" size={19} color="#1E293B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Title Row */}
      <View style={styles.mainTitleRow}>
        <View>
          <Text style={styles.mainHeaderTitle}>Gifts 🎁</Text>
          <Text style={styles.mainHeaderSubtitle}>Explore sendable gifts for voice rooms and live streams</Text>
        </View>

        <View style={styles.titleRightIcons}>
          <TouchableOpacity
            style={styles.actionCircleBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Search')}
          >
            <Icon name="search" size={20} color="#1E293B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScrollContent}
      >
        {GIFT_FILTER_TABS.map(tab => {
          const isActive = activeFilter === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveFilter(tab.id)}
              activeOpacity={0.8}
              style={[styles.filterPillBtn, isActive && styles.filterPillBtnActive]}
            >
              {isActive ? (
                <LinearGradient
                  colors={['#8B5CF6', '#6C5CE7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.filterGradient}
                >
                  {tab.icon && <Icon name={tab.icon} size={15} color="#FFF" style={{ marginRight: 6 }} />}
                  <Text style={styles.filterTextActive}>{tab.label}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.filterInactiveInner}>
                  {tab.icon && <Icon name={tab.icon} size={15} color="#64748B" style={{ marginRight: 6 }} />}
                  <Text style={styles.filterTextInactive}>{tab.label}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* List */}
      {loading ? (
        <ActivityIndicator size="large" color="#7C3AED" style={{ marginVertical: 32 }} />
      ) : (
        <FlatList
          data={filteredData}
          renderItem={renderGiftItem}
          keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C3AED" />}
          ListEmptyComponent={
            <EmptyStateView
              icon="gift-outline"
              title="No Gifts Available"
              subtitle="There are no gifts found under this category. Pull down to refresh."
              actionText="Refresh"
              onAction={onRefresh}
            />
          }
          contentContainerStyle={[
            styles.listContainer,
            { paddingBottom: bottomPadding },
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  topBarGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  langPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
    elevation: 2,
  },
  langPillValText: { color: '#1E293B', fontSize: 13, fontWeight: '700' },
  rightActionsGroup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  coinBalancePillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 20,
    paddingLeft: 8,
    paddingRight: 6,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 6,
    elevation: 2,
  },
  coinIconImg: { width: 18, height: 18 },
  coinValText: { color: '#1E293B', fontSize: 13, fontWeight: '800' },
  plusIconBadgeCircle: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: '#6C5CE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellButtonCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  redBadgeDotSmall: {
    position: 'absolute',
    top: 6,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF2D55',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  mainTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginVertical: 10,
  },
  mainHeaderTitle: { fontSize: 26, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
  mainHeaderSubtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  titleRightIcons: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  actionCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterScrollContent: { paddingHorizontal: 16, paddingVertical: 6, gap: 8 },
  filterPillBtn: { borderRadius: 20, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },
  filterPillBtnActive: { borderColor: 'transparent' },
  filterGradient: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  filterInactiveInner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  filterTextActive: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  filterTextInactive: { color: '#64748B', fontSize: 13, fontWeight: '600' },
  listContainer: { paddingHorizontal: 16, paddingTop: 10 },
  cardWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 3,
  },
  avatarWrapper: { marginRight: 12 },
  userAvatarImg: { width: 48, height: 48, borderRadius: 24 },
  cardMainContent: { flex: 1 },
  nameAgeBadgeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  userNameText: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginRight: 6 },
  userAgeText: { fontSize: 13, fontWeight: '600', color: '#94A3B8' },
  giftSentNoticeText: { fontSize: 11, color: '#64748B', fontWeight: '500' },
  giftQuoteText: { fontSize: 12, color: '#6C5CE7', fontWeight: '600', marginTop: 2 },
  giftDetailGraphicBox: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 8 },
  giftNameText: { fontSize: 11.5, fontWeight: '800', color: '#0F172A' },
  giftPriceCoinRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  giftCoinValText: { fontSize: 11, fontWeight: '800', color: '#D97706' },
  giftTimeAgoText: { fontSize: 9.5, color: '#94A3B8', marginTop: 2 },
  viewGiftPillBtn: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    marginLeft: 6,
  },
  viewGiftPillText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  backBtnCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
});
