import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';


const coinIcon = require('../../assets/coin.webp');

const GIFT_FILTER_TABS = [
  { id: 'all_gifts', label: 'All Gifts' },
  { id: 'received', label: 'Received', icon: 'gift-outline' },
  { id: 'sent', label: 'Sent', icon: 'send-outline' },
  { id: 'system', label: 'System', icon: 'shield-checkmark-outline' },
];

const DUMMY_GIFTS_LIST = [
  {
    id: 'g1',
    name: 'Aanya',
    age: 22,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    quote: '“Hope this makes you smile 💜”',
    giftName: 'Rose Bouquet',
    price: 299,
    time: '2 min ago',
    giftEmoji: '💐',
    type: 'received',
  },
  {
    id: 'g2',
    name: 'Mina',
    age: 21,
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80',
    quote: '“You’re amazing just the way you are! ♡”',
    giftName: 'Love Heart',
    price: 99,
    time: '20 min ago',
    giftEmoji: '💖',
    type: 'received',
  },
  {
    id: 'g3',
    name: 'Sophia',
    age: 20,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    quote: '“A little hug for you 🤍”',
    giftName: 'Teddy Bear',
    price: 199,
    time: '1 hour ago',
    giftEmoji: '🧸',
    type: 'received',
  },
  {
    id: 'g4',
    name: 'Daniel',
    age: 24,
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
    quote: '“Keep shining ✨”',
    giftName: 'Diamond',
    price: 499,
    time: '3 hours ago',
    giftEmoji: '💎',
    type: 'sent',
  },
  {
    id: 'g5',
    name: 'Aanya',
    age: 22,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    quote: '“Let’s go on more adventures together! 💜”',
    giftName: 'Sports Car',
    price: 999,
    time: '6 hours ago',
    giftEmoji: '🏎️',
    type: 'received',
  },
  {
    id: 'g6',
    name: 'Mina',
    age: 21,
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80',
    quote: '“You’re a king 👑”',
    giftName: 'Crown',
    price: 599,
    time: '1 day ago',
    giftEmoji: '👑',
    type: 'received',
  },
];

export default function GiftsScreen() {
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 24);
  const navigation = useNavigation();
  const [activeFilter, setActiveFilter] = useState('all_gifts');

  const filteredData = activeFilter === 'all_gifts'
    ? DUMMY_GIFTS_LIST
    : DUMMY_GIFTS_LIST.filter(item => item.type === activeFilter);

  const renderGiftItem = ({ item }) => (
    <View style={styles.cardWrapper}>
      <View style={styles.avatarWrapper}>
        <Image source={{ uri: item.avatar }} style={styles.userAvatarImg} />
      </View>

      <View style={styles.cardMainContent}>
        <View style={styles.nameAgeBadgeRow}>
          <Text style={styles.userNameText}>{item.name}</Text>
          <Text style={styles.userAgeText}>{item.age}</Text>
        </View>
        <Text style={styles.giftSentNoticeText}>sent you a gift</Text>
        <Text style={styles.giftQuoteText} numberOfLines={1}>
          {item.quote}
        </Text>
      </View>

      <View style={styles.giftDetailGraphicBox}>
        <Text style={{ fontSize: 26 }}>{item.giftEmoji}</Text>
        <View style={{ marginLeft: 6 }}>
          <Text style={styles.giftNameText}>{item.giftName}</Text>
          <View style={styles.giftPriceCoinRow}>
            <Image source={coinIcon} style={{ width: 13, height: 13, marginRight: 3 }} />
            <Text style={styles.giftCoinValText}>{item.price}</Text>
          </View>
          <Text style={styles.giftTimeAgoText}>{item.time}</Text>
        </View>
      </View>

      <TouchableOpacity activeOpacity={0.8} style={styles.viewGiftPillBtn}>
        <Text style={styles.viewGiftPillText}>View</Text>
      </TouchableOpacity>
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
          <TouchableOpacity style={styles.langPillBtn} activeOpacity={0.8}>
            <Icon name="language-outline" size={17} color="#1E293B" />
            <Text style={styles.langPillValText}>English</Text>
            <Icon name="chevron-down" size={14} color="#64748B" />
          </TouchableOpacity>
        </View>

        <View style={styles.rightActionsGroup}>
          <TouchableOpacity
            style={styles.coinBalancePillCard}
            onPress={() => navigation.navigate('Recharge')}
            activeOpacity={0.8}
          >
            <Image source={coinIcon} style={styles.coinIconImg} resizeMode="contain" />
            <Text style={styles.coinValText}>120</Text>
            <View style={styles.plusIconBadgeCircle}>
              <Icon name="add" size={10} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.bellButtonCircle} activeOpacity={0.8}>
            <Icon name="notifications-outline" size={19} color="#1E293B" />
            <View style={styles.redBadgeDotSmall} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Title Row */}
      <View style={styles.mainTitleRow}>
        <View>
          <Text style={styles.mainHeaderTitle}>Gifts 🎁</Text>
          <Text style={styles.mainHeaderSubtitle}>Gifts you received from special people</Text>
        </View>

        <View style={styles.titleRightIcons}>
          <TouchableOpacity style={styles.actionCircleBtn} activeOpacity={0.8}>
            <Icon name="search" size={20} color="#1E293B" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCircleBtn} activeOpacity={0.8}>
            <Icon name="options-outline" size={20} color="#1E293B" />
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
      <FlatList
        data={filteredData}
        renderItem={renderGiftItem}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.listContainer,
          { paddingBottom: bottomPadding },
        ]}
        showsVerticalScrollIndicator={false}
      />
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
