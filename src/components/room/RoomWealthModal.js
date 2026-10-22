import React, { useState, useMemo } from 'react';
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { formatCompactBalance } from '../../utils/numberUtil';

export default function RoomWealthModal({
  visible,
  onClose,
  onSelectUser,
  users = [],
  bottomSafePadding = 16,
}) {
  const [activeTab, setActiveTab] = useState('Daily'); // 'Daily' | 'Weekly' | 'Monthly'

  const rankedUsers = useMemo(
    () =>
      [...users]
        .sort(
          (a, b) =>
            Number(b.wealthPoints || b.points || b.diamonds || 0) -
            Number(a.wealthPoints || a.points || a.diamonds || 0),
        )
        .map((member, index) => ({
          ...member,
          rank: index + 1,
          points: Number(member.wealthPoints || member.points || member.diamonds || 0),
        })),
    [users],
  );

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.sheetContainer, { paddingBottom: Math.max(bottomSafePadding, 24) }]}>
          {/* Header Title */}
          <Text style={styles.sheetTitle}>Contribution</Text>

          {/* 3 Tabs: Daily | Weekly | Monthly */}
          <View style={styles.tabsRow}>
            {['Daily', 'Weekly', 'Monthly'].map((tab) => {
              const isActive = activeTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={styles.tabBtn}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tabBtnText, isActive && styles.activeTabBtnText]}>
                    {tab}
                  </Text>
                  {isActive && <View style={styles.activeTabIndicator} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* List or Empty State (matching Screenshot 7) */}
          <ScrollView style={styles.userList} showsVerticalScrollIndicator={false}>
            {rankedUsers.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconBox}>
                  <MaterialCommunityIcons name="treasure-chest" size={54} color="#CBD5E1" />
                </View>
                <Text style={styles.emptySubtitle}>Come take on the ranking list</Text>
              </View>
            ) : (
              rankedUsers.map((member) => (
                <TouchableOpacity
                  key={String(member.id || member._id || member.userId)}
                  style={styles.userRow}
                  onPress={() => {
                    onClose?.();
                    onSelectUser?.(member);
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.rankText, member.rank <= 3 && styles.topRankText]}>
                    #{member.rank}
                  </Text>
                  <Image
                    source={{
                      uri:
                        member.image ||
                        member.avatar ||
                        'https://api.yaroapp.in/uploads/avatars/female_default.webp',
                    }}
                    style={styles.userAvatar}
                  />
                  <View style={styles.userInfoCol}>
                    <View style={styles.nameRow}>
                      <Text style={styles.userName} numberOfLines={1}>{member.name || 'User'}</Text>
                      {member.rank === 1 && (
                        <MaterialCommunityIcons
                          name="crown"
                          size={14}
                          color="#F59E0B"
                          style={styles.crown}
                        />
                      )}
                    </View>
                    <Text style={styles.userSub}>
                      Level {member.level ?? '—'} • {formatCompactBalance(member.points)} pts
                    </Text>
                  </View>
                  <View style={styles.pointsPill}>
                    <Text style={styles.pointsText}>{formatCompactBalance(member.points)}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 16,
    paddingHorizontal: 20,
    minHeight: 380,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 20,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 14,
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 10,
  },
  tabBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignItems: 'center',
    position: 'relative',
  },
  tabBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#94A3B8',
  },
  activeTabBtnText: {
    color: '#F59E0B',
    fontWeight: '700',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: -1,
    width: '80%',
    height: 3,
    backgroundColor: '#F59E0B',
    borderRadius: 2,
  },
  userList: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconBox: {
    width: 80,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F1F5F9',
  },
  rankText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#94A3B8',
    width: 32,
    textAlign: 'center',
  },
  topRankText: {
    color: '#F59E0B',
    fontWeight: '900',
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginHorizontal: 10,
    backgroundColor: '#F1F5F9',
  },
  userInfoCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    maxWidth: '85%',
  },
  crown: {
    marginLeft: 4,
  },
  userSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  pointsPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pointsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
  },
});
