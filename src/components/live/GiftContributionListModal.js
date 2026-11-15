import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { apiUtil } from '../../utils/apiUtil';
import { getUserAvatar } from '../../utils/avatarUtil';

const TABS = ['Daily', 'Weekly', 'Monthly', 'Overall'];

export default function GiftContributionListModal({
  visible,
  onClose,
  roomId,
  hostId,
}) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('Daily');
  const [loading, setLoading] = useState(false);
  const [contributors, setContributors] = useState([]);
  const [totalDiamonds, setTotalDiamonds] = useState(0);

  useEffect(() => {
    if (!visible) return;
    fetchRankings();
  }, [visible, activeTab, roomId, hostId]);

  const fetchRankings = async () => {
    setLoading(true);
    try {
      const range =
        activeTab === 'Daily'
          ? 'daily'
          : activeTab === 'Weekly'
          ? 'weekly'
          : activeTab === 'Monthly'
          ? 'monthly'
          : 'overall';
      const res = await apiUtil.get('/live/ranking', {
        params: { type: 'diamonds', range, roomId, hostId },
      });
      const list = res.data?.data || [];
      setContributors(list);
      const total = list.reduce(
        (acc, item) => acc + (Number(item.diamonds || item.score || 0)),
        0,
      );
      setTotalDiamonds(total);
    } catch {
      setContributors([]);
      setTotalDiamonds(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Icon name="chevron-back" size={26} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Gift contribution list</Text>
          <View style={styles.backButton} />
        </View>

        {/* Tabs */}
        <View style={styles.tabsRow}>
          {TABS.map(tab => {
            const isSelected = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={styles.tabButton}
              >
                <Text
                  style={[
                    styles.tabText,
                    isSelected && styles.tabTextSelected,
                  ]}
                >
                  {tab}
                </Text>
                {isSelected && <View style={styles.tabUnderline} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Diamond Total Summary */}
        <View style={styles.diamondBar}>
          <Text style={styles.diamondScore}>
            {totalDiamonds} <Text style={{ color: '#00BFFF' }}>💎</Text>
          </Text>
        </View>

        {/* Contributor List */}
        {loading ? (
          <ActivityIndicator color="#E11D48" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={contributors}
            keyExtractor={(item, index) => item.id || String(index)}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingBottom: insets.bottom + 20,
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon name="diamond-outline" size={48} color="#CBD5E1" />
                <Text style={styles.emptyText}>No contributions yet</Text>
                <Text style={styles.emptySub}>
                  Send gifts to support the host and appear on the leaderboard!
                </Text>
              </View>
            }
            renderItem={({ item, index }) => (
              <View style={styles.contributorRow}>
                <Text
                  style={[
                    styles.rankNumber,
                    index === 0 && { color: '#F59E0B' },
                    index === 1 && { color: '#94A3B8' },
                    index === 2 && { color: '#B45309' },
                  ]}
                >
                  {index + 1}
                </Text>
                <Image
                  source={getUserAvatar(item)}
                  style={styles.avatar}
                />
                <View style={styles.infoCol}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.name || 'Anonymous'}
                  </Text>
                  <Text style={styles.levelBadge}>
                    Lv.{item.level || 1}
                  </Text>
                </View>
                <View style={styles.scoreBadge}>
                  <Text style={styles.scoreText}>
                    {item.diamonds || item.score || 0} 💎
                  </Text>
                </View>
              </View>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tabButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextSelected: {
    fontWeight: '800',
    color: '#0F172A',
  },
  tabUnderline: {
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#E11D48',
    marginTop: 6,
  },
  diamondBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  diamondScore: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 6,
    textAlign: 'center',
    maxWidth: 240,
  },
  contributorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F1F5F9',
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: '900',
    width: 28,
    textAlign: 'center',
    color: '#64748B',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginHorizontal: 12,
  },
  infoCol: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  levelBadge: {
    fontSize: 11,
    color: '#E11D48',
    marginTop: 2,
    fontWeight: '600',
  },
  scoreBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2563EB',
  },
});
