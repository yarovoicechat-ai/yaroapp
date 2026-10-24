import React, { useState, useEffect, useCallback, useContext } from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset, getTabScreenBottomPadding } from '../../utils/safeAreaUtils';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { apiUtil } from '../../utils/apiUtil';
import { getUserAvatar } from '../../utils/avatarUtil';
import { AuthContext } from '../../context/AuthProvider';
import { resolveGiftVisual } from '../../components/gift/giftMediaUtils';

const diamondIcon = require('../../assets/icons/diamond.png');

const INBOX_SUB_TABS = [
  { id: 'all_messages', label: 'All Messages', icon: 'chatbubbles-outline' },
  { id: 'calls', label: 'Calls', icon: 'call-outline' },
  { id: 'gifts', label: 'Gifts', icon: 'gift-outline' },
];

const SYSTEM_NOTICE_ENTRY = {
  id: 'm_system_notice',
  isSpecial: true,
  type: 'system_notice',
  title: 'System Notice',
  snippet: 'Official notifications, announcements and safety tips',
  time: '',
  unreadCount: 0,
  icon: 'notifications',
};

const LUCKY_REWARD_BAG_ENTRY = {
  id: 'm_lucky_reward_bag',
  isSpecial: true,
  actionTab: 'gifts',
  type: 'lucky_reward_bag',
  title: 'Lucky Reward Bag',
  snippet: 'Open your gift box and check received rewards',
  time: '',
  unreadCount: 0,
  icon: 'card-giftcard',
};

export default function ChatListScreen() {
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomTabBarPadding = getTabScreenBottomPadding(insets.bottom);
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  const [activeSubTab, setActiveSubTab] = useState('all_messages');
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [calls, setCalls] = useState([]);
  const [loadingCalls, setLoadingCalls] = useState(false);
  const [giftHistory, setGiftHistory] = useState([]);
  const [loadingGifts, setLoadingGifts] = useState(false);
  const [systemNotices, setSystemNotices] = useState([]);
  const [loadingNotices, setLoadingNotices] = useState(false);

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiUtil.get('/chat/conversations');
      const list = res.data?.data?.conversations || res.data?.data || [];
      if (Array.isArray(list)) {
        setConversations(list);
      } else {
        setConversations([]);
      }
    } catch (e) {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCalls = useCallback(async () => {
    try {
      setLoadingCalls(true);
      const res = await apiUtil.get('/call/history?days=7');
      const callData = res.data?.data?.calls || res.data?.data || [];
      if (Array.isArray(callData)) {
        setCalls(callData);
      } else {
        setCalls([]);
      }
    } catch (e) {
      setCalls([]);
    } finally {
      setLoadingCalls(false);
    }
  }, []);

  const fetchGiftHistory = useCallback(async () => {
    try {
      setLoadingGifts(true);
      const [sentResponse, receivedResponse] = await Promise.all([
        apiUtil.get('/gifts/sent', { params: { limit: 50 } }),
        apiUtil.get('/gifts/received', { params: { limit: 50 } }),
      ]);
      const sent = sentResponse.data?.data?.transactions || [];
      const received = receivedResponse.data?.data?.transactions || [];
      const mapped = [
        ...sent.map((transaction) => {
          const gift = transaction.giftId || {};
          const receiver = transaction.receiverId || {};
          const visual = resolveGiftVisual(gift);
          return {
            id: String(transaction._id),
            type: 'sent',
            name: receiver.name || 'Recipient',
            avatar: receiver.image || receiver.avatar,
            giftName: gift.name || transaction.meta?.giftName || 'Gift',
            giftEmoji: visual.giftIcon,
            giftImage: visual.giftImage,
            price: Number(transaction.totalDiamonds || transaction.totalPrice || 0),
            createdAt: transaction.createdAt,
          };
        }),
        ...received.map((transaction) => {
          const gift = transaction.giftId || {};
          const sender = transaction.senderId || {};
          const visual = resolveGiftVisual(gift);
          return {
            id: String(transaction._id),
            type: 'received',
            name: sender.name || 'Sender',
            avatar: sender.image || sender.avatar,
            giftName: gift.name || transaction.meta?.giftName || 'Gift',
            giftEmoji: visual.giftIcon,
            giftImage: visual.giftImage,
            price: Number(transaction.totalDiamonds || transaction.totalPrice || 0),
            createdAt: transaction.createdAt,
          };
        }),
      ].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setGiftHistory(mapped);
    } catch (error) {
      console.log('Failed to fetch gift history:', error?.message || error);
      setGiftHistory([]);
    } finally {
      setLoadingGifts(false);
    }
  }, []);

  const fetchSystemNotices = useCallback(async () => {
    try {
      setLoadingNotices(true);
      const response = await apiUtil.get('/notifications', { params: { limit: 50, type: 'system' } });
      const notices = (response.data?.data?.notifications || []).filter(
        (notice) => String(notice?.type || '').toLowerCase() === 'system',
      );
      const mapped = Array.isArray(notices) ? notices.map((notice) => ({
        id: String(notice._id || notice.id),
        type: notice.type,
        title: notice.title || 'Notification',
        badge: notice.isRead ? null : 'New',
        subtitle: notice.message || notice.content || '',
        time: notice.createdAt ? new Date(notice.createdAt).toLocaleString() : '',
        icon: notice.type === 'transaction'
          ? 'gift-outline'
          : notice.type === 'follow'
          ? 'person-add-outline'
          : 'notifications-outline',
        iconColor: notice.type === 'transaction'
          ? '#D97706'
          : notice.type === 'follow'
          ? '#EC4899'
          : '#6C5CE7',
        iconBg: notice.type === 'transaction'
          ? '#FEF3C7'
          : notice.type === 'follow'
          ? '#FDF2F8'
          : '#F3E8FF',
      })) : [];
      setSystemNotices(mapped);
    } catch (error) {
      console.log('Failed to fetch system notices:', error?.message || error);
      setSystemNotices([]);
    } finally {
      setLoadingNotices(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
    fetchCalls();
  }, [fetchConversations, fetchCalls]);

  const handleSubTabPress = (tabId) => {
    setActiveSubTab(tabId);
    if (tabId === 'calls' && calls.length === 0) {
      fetchCalls();
    }
    if (tabId === 'gifts') fetchGiftHistory();
    if (tabId === 'system') fetchSystemNotices();
  };

  // Render conversation row
  const renderMessageCard = ({ item }) => {
    if (item.isSpecial) {
      return (
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.cardWrapper}
          onPress={() => {
            if (item.id === 'm_system_notice') {
              navigation.navigate('SystemNoticeScreen');
              return;
            }
            if (item.actionTab) {
              handleSubTabPress(item.actionTab);
            }
          }}
        >
          <View style={[styles.specialIconBox, { backgroundColor: item.actionTab ? '#FEF3C7' : '#F3E8FF' }]}>
            <Icon name={item.icon} size={24} color={item.actionTab ? '#D97706' : '#8B5CF6'} />
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

    const other = (item.participants || []).find(p => String(p?._id || p?.userId) !== String(user?._id || user?.userId)) || item.otherUser || item;
    const lastMsg = typeof item.lastMessage === 'string' ? item.lastMessage : (item.lastMessage?.content || item.lastMessage?.text || 'Tap to chat');
    const senderName = other?.name || 'User';

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.cardWrapper}
        onPress={() => navigation.navigate('Chat', { conversationId: item._id, otherUser: other })}
      >
        <View style={styles.avatarWrapper}>
          <Image source={getUserAvatar(other)} style={styles.userAvatarImg} />
          {other?.isOnline && <View style={styles.greenOnlineIndicator} />}
        </View>

        <View style={styles.cardMainContent}>
          <View style={styles.nameAgeBadgeRow}>
            <Text style={styles.userNameText}>{senderName}</Text>
            {other?.age ? <Text style={styles.userAgeText}>{other.age}</Text> : null}
            {other?.isHost && (
              <Icon name="checkmark-circle" size={16} color="#3B82F6" style={{ marginLeft: 4 }} />
            )}
          </View>
          <Text style={styles.lastMsgSnippet} numberOfLines={1}>
            {lastMsg}
          </Text>
        </View>

        <View style={styles.cardRightMeta}>
          <Icon name="chevron-forward" size={18} color="#CBD5E1" style={{ marginTop: 4 }} />
        </View>
      </TouchableOpacity>
    );
  };

  // Render call log row
  const renderCallCard = ({ item }) => {
    const isIncoming = (item.type || '').toLowerCase().includes('in');
    const isMissed = (item.type || '').toLowerCase().includes('miss');
    const callerName = item.name || item.callerName || 'Unknown Caller';
    const callerImg = item.image ? { uri: item.image } : (item.callerImage ? { uri: item.callerImage } : require('../../assets/avtar.webp'));
    const durationText = item.duration || item.timing || '1-on-1 Call';

    return (
      <View style={styles.cardWrapper}>
        <View style={styles.avatarWrapper}>
          <Image source={callerImg} style={styles.userAvatarImg} />
          <View
            style={[
              styles.callTypeDot,
              { backgroundColor: isMissed ? '#EF4444' : isIncoming ? '#22C55E' : '#3B82F6' },
            ]}
          >
            <Icon
              name={isMissed ? 'close' : isIncoming ? 'arrow-down-outline' : 'arrow-up-outline'}
              size={10}
              color="#FFFFFF"
            />
          </View>
        </View>

        <View style={styles.cardMainContent}>
          <View style={styles.nameAgeBadgeRow}>
            <Text style={styles.userNameText}>{callerName}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon
              name="call-outline"
              size={13}
              color={isMissed ? '#EF4444' : '#64748B'}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.lastMsgSnippet, isMissed && { color: '#EF4444' }]}>
              {durationText}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.callBackBtn}
          onPress={() => {
            navigation.navigate('OneToOne', { hostId: item.hostId || item.id });
          }}
        >
          <Icon name="call" size={16} color="#6C5CE7" />
        </TouchableOpacity>
      </View>
    );
  };

  // Render gift item
  const renderGiftCard = ({ item }) => {
    return (
      <View style={styles.cardWrapper}>
        <View style={styles.avatarWrapper}>
          <Image source={getUserAvatar({ avatar: item.avatar, image: item.avatar })} style={styles.userAvatarImg} />
        </View>

        <View style={styles.cardMainContent}>
          <View style={styles.nameAgeBadgeRow}>
            <Text style={styles.userNameText}>{item.name}</Text>
            <Text style={styles.giftDirectionPill}>
              {item.type === 'received' ? 'Received' : 'Sent'}
            </Text>
          </View>
          <Text style={styles.lastMsgSnippet}>
            {item.type === 'received' ? 'Sent you' : 'You sent'} {item.giftName || 'a gift'}
          </Text>
        </View>

        <View style={styles.giftRightBadge}>
          {item.giftImage ? (
            <Image source={{ uri: item.giftImage }} style={{ width: 28, height: 28 }} resizeMode="contain" />
          ) : item.giftEmoji ? (
            <Text style={{ fontSize: 24 }}>{item.giftEmoji}</Text>
          ) : (
            <Icon name="gift-outline" size={24} color="#D97706" />
          )}
          <View style={styles.giftCoinsWrap}>
            <Image source={diamondIcon} style={{ width: 12, height: 12, marginRight: 3 }} resizeMode="contain" />
            <Text style={styles.giftCoinsVal}>{item.price}</Text>
          </View>
        </View>
      </View>
    );
  };

  // Render system notice card
  const renderSystemCard = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.cardWrapper}
        activeOpacity={0.8}
        onPress={() => {
          if (item.type === 'follow') {
            navigation.navigate('Followers', { initialTab: 'followers' });
          }
        }}
      >
        <View style={[styles.specialIconBox, { backgroundColor: item.iconBg }]}>
          <Icon name={item.icon} size={22} color={item.iconColor} />
        </View>

        <View style={styles.cardMainContent}>
          <View style={styles.nameAgeBadgeRow}>
            <Text style={styles.userNameText}>{item.title}</Text>
            {item.badge && (
              <View style={styles.newBadgePill}>
                <Text style={styles.newBadgeText}>{item.badge}</Text>
              </View>
            )}
          </View>
          <Text style={styles.lastMsgSnippet} numberOfLines={2}>
            {item.subtitle}
          </Text>
        </View>

        <View style={styles.cardRightMeta}>
          <Text style={styles.timeAgoText}>{item.time}</Text>
          <Icon name="chevron-forward" size={16} color="#CBD5E1" />
        </View>
      </TouchableOpacity>
    );
  };

  const listData = [LUCKY_REWARD_BAG_ENTRY, SYSTEM_NOTICE_ENTRY, ...conversations];

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" animated />
      <LinearGradient colors={['#F8FAFC', '#F1F5F9', '#E2E8F0']} style={StyleSheet.absoluteFillObject} />

      {/* Main Title Row - Top header removed as requested */}
      <View style={[styles.mainTitleRow, { paddingTop: topSafeInset + 8 }]}>
        <View>
          <Text style={styles.mainHeaderTitle}>
            {activeSubTab === 'all_messages'
              ? 'Inbox'
              : activeSubTab === 'calls'
              ? 'Call Logs'
              : activeSubTab === 'gifts'
              ? 'Gift Box'
              : 'System Notices'}
          </Text>
          <Text style={styles.mainHeaderSubtitle}>
            {activeSubTab === 'all_messages'
              ? 'Your messages & chats'
              : activeSubTab === 'calls'
              ? 'Recent voice & video calls'
              : activeSubTab === 'gifts'
              ? 'Gifts received & sent'
              : 'Official updates & alerts'}
          </Text>
        </View>

        <View style={styles.titleRightIcons}>
          <TouchableOpacity
            style={styles.actionCircleBtn}
            activeOpacity={0.8}
            onPress={() => {
              if (activeSubTab === 'calls') navigation.navigate('CallHistory');
              else if (activeSubTab === 'gifts') navigation.navigate('GiftsScreen');
              else if (activeSubTab === 'system') navigation.navigate('SystemNoticeScreen');
            }}
          >
            <Icon name={activeSubTab === 'all_messages' ? 'search' : 'open-outline'} size={20} color="#1E293B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. Sub-Tab Filter Pills */}
      <View style={{ height: 48 }}>
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
      </View>

      {/* 4. Active Tab Content Rendering */}
      {activeSubTab === 'all_messages' && (
        <FlatList
          data={listData}
          renderItem={renderMessageCard}
          keyExtractor={(item) => item.id || item._id || String(Math.random())}
          ListFooterComponent={
            conversations.length === 0 && !loading ? (
              <View style={styles.emptyStateContainer}>
                <Icon name="chatbubble-ellipses-outline" size={42} color="#94A3B8" />
                <Text style={styles.emptyStateTitle}>No Active Conversations</Text>
                <Text style={styles.emptyStateSubtitle}>
                  Connect with people through voice calls and party rooms to chat!
                </Text>
              </View>
            ) : null
          }
          contentContainerStyle={[
            styles.listContentContainer,
            { paddingBottom: bottomTabBarPadding },
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}

      {activeSubTab === 'calls' && (
        <FlatList
          data={calls}
          renderItem={renderCallCard}
          keyExtractor={(item, index) => item.id || item._id || String(index)}
          ListEmptyComponent={
            loadingCalls ? (
              <ActivityIndicator size="small" color="#6C5CE7" style={{ marginTop: 40 }} />
            ) : (
              <View style={styles.emptyStateContainer}>
                <Icon name="call-outline" size={42} color="#94A3B8" />
                <Text style={styles.emptyStateTitle}>No Call Logs Yet</Text>
                <Text style={styles.emptyStateSubtitle}>
                  Start a 1-to-1 voice or video call with hosts to see your history here!
                </Text>
                <TouchableOpacity
                  style={styles.primaryActionBtn}
                  onPress={() => navigation.navigate('OneToOne')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryActionBtnText}>Find Hosts to Call</Text>
                </TouchableOpacity>
              </View>
            )
          }
          contentContainerStyle={[
            styles.listContentContainer,
            { paddingBottom: bottomTabBarPadding },
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}

      {activeSubTab === 'gifts' && (
        <FlatList
          data={giftHistory}
          renderItem={renderGiftCard}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            loadingGifts ? <ActivityIndicator size="small" color="#6C5CE7" style={{ marginTop: 40 }} /> : (
              <View style={styles.emptyStateContainer}>
                <Icon name="gift-outline" size={42} color="#94A3B8" />
                <Text style={styles.emptyStateTitle}>No Gifts Yet</Text>
                <Text style={styles.emptyStateSubtitle}>Real gifts you send or receive will appear here.</Text>
              </View>
            )
          }
          contentContainerStyle={[
            styles.listContentContainer,
            { paddingBottom: bottomTabBarPadding },
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}

      {activeSubTab === 'system' && (
        <FlatList
          data={systemNotices}
          renderItem={renderSystemCard}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            loadingNotices ? <ActivityIndicator size="small" color="#6C5CE7" style={{ marginTop: 40 }} /> : (
              <View style={styles.emptyStateContainer}>
                <Icon name="notifications-outline" size={42} color="#94A3B8" />
                <Text style={styles.emptyStateTitle}>No Notifications Yet</Text>
                <Text style={styles.emptyStateSubtitle}>Account updates and messages from Yaro will appear here.</Text>
              </View>
            )
          }
          contentContainerStyle={[
            styles.listContentContainer,
            { paddingBottom: bottomTabBarPadding },
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
  subTabPillBtn: { borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },
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
    elevation: 2,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  avatarWrapper: { position: 'relative', marginRight: 12 },
  userAvatarImg: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E2E8F0' },
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
  callTypeDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  callBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  giftDirectionPill: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#8B5CF6',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  giftRightBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  giftCoinsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 2,
  },
  giftCoinsVal: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
  },
  newBadgePill: {
    backgroundColor: '#8B5CF6',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 44,
    paddingHorizontal: 24,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#334155',
    marginTop: 12,
  },
  emptyStateSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  primaryActionBtn: {
    backgroundColor: '#6C5CE7',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 16,
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
