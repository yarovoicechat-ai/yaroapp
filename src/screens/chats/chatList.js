import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset, getTabScreenBottomPadding } from '../../utils/safeAreaUtils';
import Icon from 'react-native-vector-icons/Ionicons';
import { apiUtil } from '../../utils/apiUtil';
import { getUserAvatar } from '../../utils/avatarUtil';
import { AuthContext } from '../../context/AuthProvider';
import useInboxMessages from '../../hooks/useInboxMessages';
import { formatConversationTime } from '../../utils/chatTimeUtil';

const monthlyCardFloatImg = require('../../assets/card/monthly_card_float.png');

const OFFICIAL_CHANNELS = [
  {
    id: 'official_event',
    title: 'Event',
    subtitle: '[Activity]',
    time: '9:07 AM',
    unreadCount: 9,
    iconName: 'flash',
    iconBg: '#8B5CF6',
    route: 'EventScreen',
  },
  {
    id: 'official_reward_assistant',
    title: 'Reward Assistant',
    subtitle: 'Rewards received! Check...',
    time: '3:00 AM',
    unreadCount: 10,
    iconName: 'gift',
    iconBg: '#F59E0B',
    route: 'RewardAssistantScreen',
  },
  {
    id: 'official_yaro',
    title: 'Yaro Official',
    subtitle: '[Notification]',
    time: '3:00 AM',
    unreadCount: 7,
    iconName: 'megaphone',
    iconBg: '#7C3AED',
    route: 'YaroOfficialScreen',
  },
  {
    id: 'official_team_black',
    title: 'Team Black',
    subtitle: '[Notification]',
    time: 'Yesterday',
    unreadCount: 0,
    iconName: 'home',
    iconBg: '#C2410C',
    route: 'TeamBlackScreen',
  },
];

export default function ChatListScreen({ embedded = false, onNavigate, onClose } = {}) {
  const insets = useSafeAreaInsets();
  const topSafeInset = embedded ? 0 : getAppTopSafeInset(insets.top);
  const bottomTabBarPadding = embedded ? 16 : getTabScreenBottomPadding(insets.bottom);
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const openScreen = (name, params) => (onNavigate ? onNavigate(name, params) : navigation.navigate(name, params));
  const { user } = useContext(AuthContext);

  const [mainTab, setMainTab] = useState('chats'); // 'chats' | 'contacts'
  const [searchQuery, setSearchQuery] = useState('');

  const { conversations, loading, refresh: fetchConversations } = useInboxMessages();

  // Contacts counts summary (friends, followers, following)
  const [contactsSummary, setContactsSummary] = useState({
    friendsCount: 2,
    followersCount: 17,
    followingCount: 42,
  });

  const fetchContactsSummary = useCallback(async () => {
    try {
      const res = await apiUtil.get('/user/contacts-summary');
      if (res.data?.success && res.data?.data) {
        setContactsSummary(res.data.data);
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (isFocused) {
      fetchConversations();
      fetchContactsSummary();
    }
  }, [isFocused, fetchConversations, fetchContactsSummary]);

  // Filtered direct conversations
  const filteredConversations = (conversations || []).filter((conv) => {
    if (!searchQuery.trim()) return true;
    const other = (conv.participants || []).find(
      (p) => String(p?._id || p?.userId) !== String(user?._id || user?.userId)
    ) || conv.otherUser || conv;
    const name = String(other?.name || '').toLowerCase();
    const q = searchQuery.trim().toLowerCase();
    return name.includes(q);
  });

  // Render Official Channel Row
  const renderOfficialChannel = (item) => (
    <TouchableOpacity
      key={item.id}
      activeOpacity={0.75}
      style={styles.chatRow}
      onPress={() => openScreen(item.route)}
    >
      <View style={[styles.avatarBox, { backgroundColor: item.iconBg }]}>
        <Icon name={item.iconName} size={24} color="#FFFFFF" />
      </View>
      <View style={styles.chatRowCenter}>
        <Text style={styles.titleText}>{item.title}</Text>
        <Text style={styles.subtitleText} numberOfLines={1}>
          {item.subtitle}
        </Text>
      </View>
      <View style={styles.chatRowRight}>
        <Text style={styles.timeText}>{item.time}</Text>
        {item.unreadCount > 0 ? (
          <View style={styles.badgePill}>
            <Text style={styles.badgeText}>{item.unreadCount}</Text>
          </View>
        ) : (
          <View style={{ height: 20 }} />
        )}
      </View>
    </TouchableOpacity>
  );

  // Render Direct Conversation Row
  const renderConversationItem = ({ item }) => {
    const other = (item.participants || []).find(
      (p) => String(p?._id || p?.userId) !== String(user?._id || user?.userId)
    ) || item.otherUser || item;
    const lastMsg =
      typeof item.lastMessage === 'string'
        ? item.lastMessage
        : item.lastMessage?.content || item.lastMessage?.text || '[Share]';
    const senderName = other?.name || 'User';

    const lastMsgTimeRaw =
      item.lastMessage?.createdAt ||
      item.lastMessage?.sentAt ||
      item.lastMessage?.updatedAt ||
      item.updatedAt ||
      item.createdAt;
    const conversationTime = formatConversationTime(lastMsgTimeRaw) || 'Recently';

    return (
      <TouchableOpacity
        activeOpacity={0.75}
        style={styles.chatRow}
        onPress={() =>
          openScreen('Chat', {
            conversationId: item._id,
            otherUser: other,
            lastMessageTime: lastMsgTimeRaw,
          })
        }
      >
        <View style={styles.avatarBox}>
          <Image source={getUserAvatar(other)} style={styles.avatarImg} />
          {other?.isOnline && <View style={styles.onlineDot} />}
        </View>

        <View style={styles.chatRowCenter}>
          <View style={styles.nameRow}>
            <Text style={styles.titleText} numberOfLines={1}>
              {senderName}
            </Text>
            {other?.isHost && (
              <Icon name="checkmark-circle" size={15} color="#3B82F6" style={{ marginLeft: 4 }} />
            )}
          </View>
          <Text style={styles.subtitleText} numberOfLines={1}>
            {lastMsg}
          </Text>
        </View>

        <View style={styles.chatRowRight}>
          <Text style={styles.timeText}>{conversationTime}</Text>
          {Number(item.unreadCount) > 0 ? (
            <View style={styles.badgePill}>
              <Text style={styles.badgeText}>
                {Number(item.unreadCount) > 99 ? '99+' : Number(item.unreadCount)}
              </Text>
            </View>
          ) : (
            <View style={{ height: 20 }} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Contacts View matching media_1795650517843_43c65be8.jpg
  const renderContactsView = () => (
    <ScrollView
      contentContainerStyle={[styles.contactsContent, { paddingBottom: bottomTabBarPadding + 80 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Family group */}
      <TouchableOpacity
        style={styles.contactCard}
        activeOpacity={0.8}
        onPress={() => openScreen('TeamBlackScreen')}
      >
        <View style={styles.contactLeft}>
          <View style={[styles.contactIconCircle, { backgroundColor: '#FDF2F8' }]}>
            <Text style={{ fontSize: 22 }}>🏠</Text>
          </View>
          <Text style={styles.contactCardTitle}>Family group</Text>
        </View>
        <Icon name="chevron-forward" size={18} color="#CBD5E1" />
      </TouchableOpacity>

      {/* 2. Friends */}
      <TouchableOpacity
        style={styles.contactCard}
        activeOpacity={0.8}
        onPress={() => openScreen('FriendsScreen')}
      >
        <View style={styles.contactLeft}>
          <View style={[styles.contactIconCircle, { backgroundColor: '#EFF6FF' }]}>
            <Icon name="people" size={22} color="#3B82F6" />
          </View>
          <Text style={styles.contactCardTitle}>Friends</Text>
        </View>
        <View style={styles.contactRightRow}>
          <Text style={styles.contactCountText}>{contactsSummary.friendsCount}</Text>
          <Icon name="chevron-forward" size={18} color="#CBD5E1" />
        </View>
      </TouchableOpacity>

      {/* 3. Followers */}
      <TouchableOpacity
        style={styles.contactCard}
        activeOpacity={0.8}
        onPress={() => openScreen('Followers', { initialTab: 'followers' })}
      >
        <View style={styles.contactLeft}>
          <View style={[styles.contactIconCircle, { backgroundColor: '#F5F3FF' }]}>
            <Icon name="person-add" size={20} color="#8B5CF6" />
          </View>
          <Text style={styles.contactCardTitle}>Followers</Text>
        </View>
        <View style={styles.contactRightRow}>
          <Text style={styles.contactCountText}>{contactsSummary.followersCount}</Text>
          <Icon name="chevron-forward" size={18} color="#CBD5E1" />
        </View>
      </TouchableOpacity>

      {/* 4. Following */}
      <TouchableOpacity
        style={styles.contactCard}
        activeOpacity={0.8}
        onPress={() => openScreen('Followers', { initialTab: 'following' })}
      >
        <View style={styles.contactLeft}>
          <View style={[styles.contactIconCircle, { backgroundColor: '#FFFBEB' }]}>
            <Icon name="star" size={20} color="#F59E0B" />
          </View>
          <Text style={styles.contactCardTitle}>Following</Text>
        </View>
        <View style={styles.contactRightRow}>
          <Text style={styles.contactCountText}>{contactsSummary.followingCount}</Text>
          <Icon name="chevron-forward" size={18} color="#CBD5E1" />
        </View>
      </TouchableOpacity>

      {/* 5. Family */}
      <TouchableOpacity
        style={styles.contactCard}
        activeOpacity={0.8}
        onPress={() => openScreen('FamilyScreen')}
      >
        <View style={styles.contactLeft}>
          <View style={[styles.contactIconCircle, { backgroundColor: '#ECFDF5' }]}>
            <Icon name="home" size={20} color="#10B981" />
          </View>
          <Text style={styles.contactCardTitle}>Family</Text>
        </View>
        <Icon name="chevron-forward" size={18} color="#CBD5E1" />
      </TouchableOpacity>

      {/* Floating Monthly Card Widget */}
      <TouchableOpacity
        style={styles.floatingMonthlyCard}
        activeOpacity={0.85}
        onPress={() => openScreen('Store')}
      >
        <Image
          source={monthlyCardFloatImg}
          style={styles.monthlyCardImg}
          resizeMode="contain"
        />
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <View style={[styles.container, { paddingTop: topSafeInset }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F1FA" />

      {/* Top Tabs & Search Pill Header */}
      <View style={styles.topHeader}>
        <View style={styles.tabsRow}>
          {/* Chats Tab */}
          <TouchableOpacity
            style={styles.tabBtn}
            activeOpacity={0.8}
            onPress={() => setMainTab('chats')}
          >
            <Text style={[styles.tabBtnText, mainTab === 'chats' && styles.tabBtnTextActive]}>
              Chats
            </Text>
            {mainTab === 'chats' && <View style={styles.tabUnderline} />}
          </TouchableOpacity>

          {/* Contacts Tab */}
          <TouchableOpacity
            style={styles.tabBtn}
            activeOpacity={0.8}
            onPress={() => setMainTab('contacts')}
          >
            <Text style={[styles.tabBtnText, mainTab === 'contacts' && styles.tabBtnTextActive]}>
              Contacts
            </Text>
            {mainTab === 'contacts' && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        </View>

        {/* Right Search Bar or Add Contact icon */}
        <View style={styles.rightSearchRow}>
          <View style={styles.searchPill}>
            <Icon name="search" size={16} color="#7C3AED" style={{ marginRight: 6 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {mainTab === 'contacts' && (
            <TouchableOpacity
              style={styles.addContactBtn}
              activeOpacity={0.7}
              onPress={() => openScreen('Search')}
            >
              <Icon name="person-add-outline" size={22} color="#1E293B" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {mainTab === 'contacts' ? (
        renderContactsView()
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => String(item._id || item.id)}
          renderItem={renderConversationItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomTabBarPadding + 20 }}
          ListHeaderComponent={
            <View>
              {/* Chatlist Subheader Row */}
              <View style={styles.chatlistSubheader}>
                <Text style={styles.chatlistTitle}>Chatlist</Text>
                <TouchableOpacity activeOpacity={0.7} onPress={() => setSearchQuery('')}>
                  <Text style={styles.allBtnText}>All</Text>
                </TouchableOpacity>
              </View>

              {/* Official System Channels */}
              {OFFICIAL_CHANNELS.map(renderOfficialChannel)}
            </View>
          }
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator size="small" color="#7C3AED" style={{ marginTop: 24 }} />
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topHeader: {
    height: 54,
    backgroundColor: '#F4F1FA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabBtn: {
    paddingVertical: 8,
    marginRight: 20,
    position: 'relative',
    alignItems: 'center',
  },
  tabBtnText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#64748B',
  },
  tabBtnTextActive: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 2,
    width: 22,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#7C3AED',
  },
  rightSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 36,
    width: 140,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    paddingVertical: 0,
  },
  addContactBtn: {
    marginLeft: 10,
    padding: 4,
  },
  chatlistSubheader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  chatlistTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  allBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  avatarBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
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
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  chatRowCenter: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  titleText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  subtitleText: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  chatRowRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 4,
  },
  badgePill: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EC4899',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  contactsContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  contactCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  contactRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactCountText: {
    fontSize: 14,
    color: '#94A3B8',
    marginRight: 8,
  },
  floatingMonthlyCard: {
    position: 'absolute',
    right: 16,
    bottom: 20,
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthlyCardImg: {
    width: 84,
    height: 84,
  },
});
