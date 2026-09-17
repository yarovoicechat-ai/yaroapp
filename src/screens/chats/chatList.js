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
import { getAppTopSafeInset, getTabScreenBottomPadding } from '../../utils/safeAreaUtils';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';


const coinIcon = require('../../assets/coin.webp');

const INBOX_SUB_TABS = [
  { id: 'all_messages', label: 'All Messages', icon: 'chatbubbles-outline' },
  { id: 'calls', label: 'Calls', icon: 'call-outline' },
  { id: 'gifts', label: 'Gifts', icon: 'gift-outline' },
  { id: 'system', label: 'System', icon: 'shield-checkmark-outline' },
];

const DUMMY_MESSAGES_LIST = [
  {
    id: 'm1',
    name: 'Aanya',
    age: 22,
    verified: true,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    lastMessage: 'Hey! How was your day? 💜',
    time: '2m ago',
    unreadCount: 3,
    isOnline: true,
  },
  {
    id: 'm2',
    name: 'Mina',
    age: 21,
    verified: false,
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80',
    lastMessage: "Let's talk and be friends! 😊",
    time: '15m ago',
    unreadCount: 1,
    isOnline: true,
  },
  {
    id: 'm3',
    name: 'Daniel',
    age: 24,
    verified: true,
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
    lastMessage: 'New people, new stories... what brings you here? 😄',
    time: '1h ago',
    unreadCount: 2,
    isOnline: true,
  },
  {
    id: 'm4',
    name: 'Sophia',
    age: 20,
    verified: false,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    lastMessage: 'Here for real conversations 💜',
    time: '3h ago',
    unreadCount: 0,
    isOnline: true,
  },
  {
    id: 'm_voice_club',
    isSpecial: true,
    type: 'voice_club',
    title: 'Voice Club',
    snippet: '🔥 Tonight’s topic: Good People, Brighter Conversations!',
    time: '6h ago',
    unreadCount: 5,
    icon: 'mic',
  },
  {
    id: 'm_system_notice',
    isSpecial: true,
    type: 'system_notice',
    title: 'System Notice',
    snippet: 'Your profile has been verified ✅ Start chatting and meet more friends!',
    time: '1d ago',
    unreadCount: 0,
    icon: 'notifications',
  },
];

export default function ChatListScreen() {
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomTabBarPadding = getTabScreenBottomPadding(insets.bottom);
  const navigation = useNavigation();
  const [activeSubTab, setActiveSubTab] = useState('all_messages');

  const handleSubTabPress = (tabId) => {
    setActiveSubTab(tabId);
    if (tabId === 'calls') navigation.navigate('CallsScreen');
    else if (tabId === 'gifts') navigation.navigate('GiftsScreen');
    else if (tabId === 'system') navigation.navigate('SystemNoticeScreen');
  };

  const renderMessageCard = ({ item }) => {
    if (item.isSpecial) {
      return (
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.cardWrapper}
          onPress={() => {
            if (item.type === 'system_notice') navigation.navigate('SystemNoticeScreen');
          }}
        >
          <View style={[styles.specialIconBox, { backgroundColor: '#F3E8FF' }]}>
            <Icon name={item.icon} size={24} color="#8B5CF6" />
          </View>
          <View style={styles.cardMainContent}>
            <Text style={styles.userNameText}>{item.title}</Text>
            <Text style={styles.lastMsgSnippet} numberOfLines={1}>
              {item.snippet}
            </Text>
          </View>
          <View style={styles.cardRightMeta}>
            <Text style={styles.timeAgoText}>{item.time}</Text>
            {item.unreadCount > 0 ? (
              <View style={styles.unreadBadgePill}>
                <Text style={styles.unreadBadgeVal}>{item.unreadCount}</Text>
              </View>
            ) : (
              <Icon name="chevron-forward" size={18} color="#CBD5E1" />
            )}
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.cardWrapper}
        onPress={() => navigation.navigate('Chat', { otherUser: item })}
      >
        <View style={styles.avatarWrapper}>
          <Image source={{ uri: item.avatar }} style={styles.userAvatarImg} />
          {item.isOnline && <View style={styles.greenOnlineIndicator} />}
        </View>

        <View style={styles.cardMainContent}>
          <View style={styles.nameAgeBadgeRow}>
            <Text style={styles.userNameText}>{item.name}</Text>
            <Text style={styles.userAgeText}>{item.age}</Text>
            {item.verified && (
              <Icon name="checkmark-circle" size={16} color="#3B82F6" style={{ marginLeft: 4 }} />
            )}
          </View>
          <Text style={styles.lastMsgSnippet} numberOfLines={1}>
            {item.lastMessage}
          </Text>
        </View>

        <View style={styles.cardRightMeta}>
          <Text style={styles.timeAgoText}>{item.time}</Text>
          {item.unreadCount > 0 ? (
            <View style={styles.unreadBadgePill}>
              <Text style={styles.unreadBadgeVal}>{item.unreadCount}</Text>
            </View>
          ) : (
            <Icon name="chevron-forward" size={18} color="#CBD5E1" style={{ marginTop: 4 }} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" animated />
      <LinearGradient colors={['#F8FAFC', '#F1F5F9', '#E2E8F0']} style={StyleSheet.absoluteFillObject} />
      {/* 1. Top Header Bar */}
      <View style={[styles.topBarGroup, { paddingTop: topSafeInset + 4 }]}>
        <TouchableOpacity style={styles.langPillBtn} activeOpacity={0.8}>
          <Icon name="language-outline" size={17} color="#1E293B" />
          <Text style={styles.langPillValText}>English</Text>
          <Icon name="chevron-down" size={14} color="#64748B" />
        </TouchableOpacity>

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

          <TouchableOpacity
            style={styles.bellButtonCircle}
            onPress={() => navigation.navigate('Notifications')}
            activeOpacity={0.8}
          >
            <Icon name="notifications-outline" size={19} color="#1E293B" />
            <View style={styles.redBadgeDotSmall} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Main Title Row */}
      <View style={styles.mainTitleRow}>
        <View>
          <Text style={styles.mainHeaderTitle}>Inbox</Text>
          <Text style={styles.mainHeaderSubtitle}>Your messages & chats</Text>
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

      {/* 3. Sub-Tab Filter Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.subTabsScrollContent}
      >
        {INBOX_SUB_TABS.map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => handleSubTabPress(tab.id)}
              activeOpacity={0.8}
              style={[styles.subTabPillBtn, isActive && styles.subTabPillBtnActive]}
            >
              {isActive ? (
                <LinearGradient
                  colors={['#8B5CF6', '#6C5CE7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.subTabGradient}
                >
                  <Icon name={tab.icon} size={16} color="#FFF" style={{ marginRight: 6 }} />
                  <Text style={styles.subTabTextActive}>{tab.label}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.subTabInactiveInner}>
                  <Icon name={tab.icon} size={16} color="#64748B" style={{ marginRight: 6 }} />
                  <Text style={styles.subTabTextInactive}>{tab.label}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 4. Messages List */}
      <FlatList
        data={DUMMY_MESSAGES_LIST}
        renderItem={renderMessageCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContentContainer,
          { paddingBottom: bottomTabBarPadding },
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
    elevation: 2,
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
  subTabsScrollContent: { paddingHorizontal: 16, paddingVertical: 6, gap: 8 },
  subTabPillBtn: { borderRadius: 20, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },
  subTabPillBtnActive: { borderColor: 'transparent' },
  subTabGradient: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  subTabInactiveInner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  subTabTextActive: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  subTabTextInactive: { color: '#64748B', fontSize: 13, fontWeight: '600' },
  listContentContainer: { paddingHorizontal: 16, paddingTop: 10 },
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
  avatarWrapper: { position: 'relative', marginRight: 12 },
  userAvatarImg: { width: 48, height: 48, borderRadius: 24 },
  greenOnlineIndicator: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  specialIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardMainContent: { flex: 1 },
  nameAgeBadgeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  userNameText: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginRight: 6 },
  userAgeText: { fontSize: 13, fontWeight: '600', color: '#94A3B8' },
  lastMsgSnippet: { fontSize: 12.5, color: '#64748B', fontWeight: '500' },
  cardRightMeta: { alignItems: 'flex-end', justifyContent: 'center', marginLeft: 8 },
  timeAgoText: { fontSize: 11, color: '#94A3B8', marginBottom: 4 },
  unreadBadgePill: {
    backgroundColor: '#8B5CF6',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeVal: { color: '#FFFFFF', fontSize: 10.5, fontWeight: '900' },
});
