import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { apiUtil } from '../../utils/apiUtil';

const { height } = Dimensions.get('window');

export default function GiftHistoryModal({ visible, onClose }) {
  const [activeTab, setActiveTab] = useState('sent'); // 'sent' | 'received'
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchHistory = useCallback(
    async (pageNum = 1, shouldAppend = false) => {
      try {
        setLoading(true);
        const endpoint = activeTab === 'sent' ? '/gifts/sent' : '/gifts/received';
        const res = await apiUtil.get(`${endpoint}?page=${pageNum}&limit=15`);
        const data = res.data?.data;
        const items = data?.items || [];

        if (shouldAppend) {
          setHistoryItems((prev) => [...prev, ...items]);
        } else {
          setHistoryItems(items);
        }

        const totalPages = data?.pagination?.pages || 1;
        setHasMore(pageNum < totalPages);
        setPage(pageNum);
      } catch (err) {
        console.log('[GiftHistoryModal] Error fetching gift history:', err.message);
      } finally {
        setLoading(false);
      }
    },
    [activeTab]
  );

  useEffect(() => {
    if (visible) {
      setPage(1);
      fetchHistory(1, false);
    }
  }, [visible, activeTab, fetchHistory]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchHistory(page + 1, true);
    }
  };

  const renderItem = ({ item }) => {
    const isSent = activeTab === 'sent';
    const otherParty = isSent ? item.receiver : item.sender;
    const dateFormatted = item.createdAt
      ? new Date(item.createdAt).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '';

    return (
      <View style={styles.historyCard}>
        <View style={styles.giftIconWrap}>
          <Text style={styles.giftIconEmoji}>
            {item.gift?.icon || '🎁'}
          </Text>
        </View>

        <View style={styles.midCol}>
          <Text style={styles.giftTitle} numberOfLines={1}>
            {item.gift?.name || 'Gift'} x{item.quantity}
          </Text>
          <Text style={styles.partyText} numberOfLines={1}>
            {isSent ? 'To: ' : 'From: '}
            <Text style={styles.partyName}>{otherParty?.name || 'User'}</Text>
          </Text>
          <Text style={styles.dateText}>{dateFormatted}</Text>
        </View>

        <View style={styles.rightCol}>
          <Text style={[styles.diamondsAmount, isSent ? styles.diamondsSpent : styles.diamondsEarned]}>
            {isSent ? '-' : '+'}
            {(item.totalDiamonds ?? item.totalPrice ?? 0)?.toLocaleString()}
          </Text>
          <Text style={styles.diamondsUnit}>💎 Diamonds</Text>
        </View>
      </View>
    );
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.dismissOverlay} activeOpacity={1} onPress={onClose} />

        <View style={styles.sheetContainer}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.sheetTitle}>Gift History</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Icon name="close" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Tabs: Sent vs Received */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'sent' && styles.tabItemActive]}
              onPress={() => setActiveTab('sent')}
            >
              <Text style={[styles.tabText, activeTab === 'sent' && styles.tabTextActive]}>
                Sent Gifts
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'received' && styles.tabItemActive]}
              onPress={() => setActiveTab('received')}
            >
              <Text style={[styles.tabText, activeTab === 'received' && styles.tabTextActive]}>
                Received Gifts
              </Text>
            </TouchableOpacity>
          </View>

          {/* List */}
          {loading && historyItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="small" color="#EC4899" />
              <Text style={styles.emptyText}>Loading history...</Text>
            </View>
          ) : historyItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyText}>No {activeTab} gifts recorded yet</Text>
            </View>
          ) : (
            <FlatList
              data={historyItems}
              keyExtractor={(item, index) => item.id || `hist-${index}`}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.3}
              showsVerticalScrollIndicator={false}
              ListFooterComponent={
                loading && historyItems.length > 0 ? (
                  <ActivityIndicator size="small" color="#EC4899" style={{ marginVertical: 10 }} />
                ) : null
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  dismissOverlay: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.72,
    minHeight: 380,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 20,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  sheetTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    alignItems: 'center',
  },
  tabItemActive: {
    backgroundColor: 'rgba(236, 72, 153, 0.2)',
    borderWidth: 1,
    borderColor: '#EC4899',
  },
  tabText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    gap: 10,
  },
  giftIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1E1B4B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftIconEmoji: {
    fontSize: 22,
  },
  midCol: {
    flex: 1,
  },
  giftTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  partyText: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  partyName: {
    color: '#38BDF8',
    fontWeight: '600',
  },
  dateText: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 2,
  },
  rightCol: {
    alignItems: 'flex-end',
  },
  diamondsAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
  diamondsSpent: {
    color: '#F59E0B',
  },
  diamondsEarned: {
    color: '#10B981',
  },
  diamondsUnit: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },
  emptyContainer: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyEmoji: {
    fontSize: 32,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
  },
});
