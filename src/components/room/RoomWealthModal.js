import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const SAMPLE_DAILY_WEALTH = [
  {
    id: 'w1',
    rank: 1,
    name: 'SuperStar',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
    gender: 'male',
    wealthLevel: 25,
    charmLevel: 23,
    level: 26,
    points: '26.8k',
    isCrown: true,
  },
  {
    id: 'w2',
    rank: 2,
    name: 'YaroKing',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120',
    gender: 'male',
    wealthLevel: 18,
    charmLevel: 20,
    level: 19,
    points: '15.4k',
    isCrown: false,
  },
  {
    id: 'w3',
    rank: 3,
    name: 'AuraQueen',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
    gender: 'female',
    wealthLevel: 14,
    charmLevel: 18,
    level: 15,
    points: '8.9k',
    isCrown: false,
  },
];

export default function RoomWealthModal({
  visible,
  onClose,
  onSelectUser,
  bottomSafePadding = 16,
}) {
  const [activeTab, setActiveTab] = useState('daily');

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={[styles.sheetContainer, { paddingBottom: bottomSafePadding + 16 }]}>
          <View style={styles.sheetHandle} />

          <Text style={styles.sheetTitle}>Room Wealth Leaderboard</Text>

          <View style={styles.tabsRow}>
            {['daily', 'weekly', 'total'].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView style={styles.userList} showsVerticalScrollIndicator={false}>
            {SAMPLE_DAILY_WEALTH.map((u) => (
              <TouchableOpacity
                key={u.id}
                style={styles.userRow}
                onPress={() => {
                  onClose();
                  onSelectUser && onSelectUser(u);
                }}
                activeOpacity={0.75}
              >
                <Text style={[styles.rankText, u.rank <= 3 && styles.topRankText]}>
                  #{u.rank}
                </Text>

                <Image source={{ uri: u.avatar }} style={styles.userAvatar} />

                <View style={styles.userInfoCol}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.userName} numberOfLines={1}>{u.name}</Text>
                    {u.isCrown && (
                      <MaterialCommunityIcons name="crown" size={14} color="#F59E0B" style={{ marginLeft: 4 }} />
                    )}
                  </View>
                  <Text style={styles.userSub}>Level {u.level} • {u.points} pts</Text>
                </View>

                <View style={styles.pointsPill}>
                  <Text style={styles.pointsText}>{u.points}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    width: '100%',
    backgroundColor: '#121424',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 16,
    maxHeight: 480,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#334155',
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 14,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#1E2338',
    borderRadius: 12,
    padding: 3,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: '#7C3AED',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  tabTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  userList: {
    maxHeight: 320,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  rankText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748B',
    width: 30,
    textAlign: 'center',
  },
  topRankText: {
    color: '#F59E0B',
  },
  userAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  userInfoCol: {
    flex: 1,
  },
  userName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },
  userSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  pointsPill: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A78BFA',
  },
});
