import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { apiUtil } from '../../utils/apiUtil';
import { getUserAvatar } from '../../utils/avatarUtil';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function RoomInboxModal({
  visible,
  onClose,
  onOpenConversation,
}) {
  const [activeTab, setActiveTab] = useState('messages'); // 'messages' | 'notices'
  const [conversations, setConversations] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchInboxData = useCallback(async () => {
    try {
      setLoading(true);
      const [convRes, noticeRes] = await Promise.allSettled([
        apiUtil.get('/chat/conversations'),
        apiUtil.get('/chat/system-notices?page=1&limit=20'),
      ]);

      if (convRes.status === 'fulfilled' && convRes.value.data?.success) {
        const list = convRes.value.data.data?.conversations || convRes.value.data.data || [];
        setConversations(Array.isArray(list) ? list : []);
      }

      if (noticeRes.status === 'fulfilled' && noticeRes.value.data?.success) {
        const nList = noticeRes.value.data.data?.notices || noticeRes.value.data.data || [];
        setNotices(Array.isArray(nList) ? nList : []);
      }
    } catch (err) {
      console.warn('[RoomInboxModal] Failed to fetch data:', err?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      fetchInboxData();
    }
  }, [visible, fetchInboxData]);

  const renderConversationItem = ({ item }) => {
    const participant = item.user || item.participant || {};
    const unreadCount = Number(item.unreadCount || 0);
    const lastMessage = item.lastMessage?.text || item.lastMessage || 'Sent an attachment';
    const rawTime = item.updatedAt || item.lastMessage?.createdAt;
    const timeFormatted = rawTime ? new Date(rawTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

    return (
      <TouchableOpacity
        style={styles.chatRow}
        activeOpacity={0.75}
        onPress={() => {
          onClose();
          onOpenConversation && onOpenConversation(item);
        }}
      >
        <View style={styles.avatarWrap}>
          <Image
            source={getUserAvatar(participant, participant.gender)}
            style={styles.avatar}
          />
          {participant.isOnline && <View style={styles.onlineDot} />}
        </View>

        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.userName} numberOfLines={1}>
              {participant.name || 'User'}
            </Text>
            <Text style={styles.timeText}>{timeFormatted}</Text>
          </View>
          <View style={styles.chatSnippetRow}>
            <Text style={styles.snippetText} numberOfLines={1}>
              {lastMessage}
            </Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderNoticeItem = ({ item }) => (
    <View style={styles.noticeCard}>
      <View style={styles.noticeHeader}>
        <View style={styles.noticeIconWrap}>
          <MaterialCommunityIcons name="bell-ring-outline" size={16} color="#8B5CF6" />
        </View>
        <Text style={styles.noticeTitle} numberOfLines={1}>
          {item.title || 'System Notification'}
        </Text>
        <Text style={styles.timeText}>
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}
        </Text>
      </View>
      <Text style={styles.noticeBody}>{item.message || item.body || item.content || ''}</Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.backdropPress}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.sheetContainer}>
          <LinearGradient
            colors={['#1E1B4B', '#0F172A']}
            style={styles.gradientHeader}
          >
            {/* Drag Handle */}
            <View style={styles.dragBar} />

            {/* Header Row */}
            <View style={styles.headerRow}>
              <View style={styles.headerTitleWrap}>
                <MaterialCommunityIcons name="chat-outline" size={20} color="#C4B5FD" />
                <Text style={styles.sheetTitle}>Room Inbox</Text>
              </View>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Icon name="close" size={20} color="#CBD5E1" />
              </TouchableOpacity>
            </View>

            {/* Sub-tabs */}
            <View style={styles.tabRow}>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'messages' && styles.tabBtnActive]}
                onPress={() => setActiveTab('messages')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabBtnText,
                    activeTab === 'messages' && styles.tabBtnTextActive,
                  ]}
                >
                  Messages
                </Text>
                {conversations.some((c) => Number(c.unreadCount || 0) > 0) && (
                  <View style={styles.tabDot} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'notices' && styles.tabBtnActive]}
                onPress={() => setActiveTab('notices')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabBtnText,
                    activeTab === 'notices' && styles.tabBtnTextActive,
                  ]}
                >
                  System Notice
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Content List */}
          <View style={styles.contentWrap}>
            {loading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="small" color="#8B5CF6" />
                <Text style={styles.loadingText}>Loading inbox...</Text>
              </View>
            ) : activeTab === 'messages' ? (
              <FlatList
                data={conversations}
                keyExtractor={(item, index) => item._id || item.id || `conv_${index}`}
                renderItem={renderConversationItem}
                contentContainerStyle={styles.listPadding}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <MaterialCommunityIcons
                      name="chat-sleep-outline"
                      size={44}
                      color="#64748B"
                    />
                    <Text style={styles.emptyText}>No private messages yet</Text>
                    <Text style={styles.emptySubText}>
                      Messages you receive while in the room will appear here.
                    </Text>
                  </View>
                }
              />
            ) : (
              <FlatList
                data={notices}
                keyExtractor={(item, index) => item._id || item.id || `notice_${index}`}
                renderItem={renderNoticeItem}
                contentContainerStyle={styles.listPadding}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <MaterialCommunityIcons
                      name="bell-outline"
                      size={44}
                      color="#64748B"
                    />
                    <Text style={styles.emptyText}>No system notices</Text>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  backdropPress: {
    flex: 1,
  },
  sheetContainer: {
    height: SCREEN_HEIGHT * 0.62,
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  gradientHeader: {
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  dragBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'center',
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 10,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  tabBtnActive: {
    backgroundColor: '#8B5CF6',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
  },
  tabDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    marginLeft: 6,
  },
  contentWrap: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  listPadding: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#1E293B',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
    borderWidth: 1.5,
    borderColor: '#0F172A',
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    flex: 1,
    marginRight: 8,
  },
  timeText: {
    fontSize: 11,
    color: '#64748B',
  },
  chatSnippetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  snippetText: {
    fontSize: 12,
    color: '#94A3B8',
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 18,
    alignItems: 'center',
  },
  unreadText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  noticeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  noticeIconWrap: {
    marginRight: 6,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F1F5F9',
    flex: 1,
  },
  noticeBody: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 10,
  },
  emptySubText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 240,
  },
});

