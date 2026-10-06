import React, { useMemo } from 'react';
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

export default function RoomWealthModal({
  visible,
  onClose,
  onSelectUser,
  users = [],
  bottomSafePadding = 16,
}) {
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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.sheetContainer, { paddingBottom: bottomSafePadding + 16 }]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Live Room Wealth</Text>
          <ScrollView style={styles.userList} showsVerticalScrollIndicator={false}>
            {rankedUsers.length === 0 && (
              <Text style={styles.emptyText}>Live wealth data abhi available nahi hai.</Text>
            )}
            {rankedUsers.map((member) => (
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
                    Level {member.level || 1} • {member.points.toLocaleString()} pts
                  </Text>
                </View>
                <View style={styles.pointsPill}>
                  <Text style={styles.pointsText}>{member.points.toLocaleString()}</Text>
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
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  sheetContainer: { width: '100%', backgroundColor: '#121424', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 12, paddingHorizontal: 16, maxHeight: 480, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#334155', alignSelf: 'center', marginBottom: 12 },
  sheetTitle: { fontSize: 16, fontWeight: '800', color: '#FFF', textAlign: 'center', marginBottom: 14 },
  userList: { maxHeight: 350 },
  userRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  rankText: { fontSize: 14, fontWeight: '800', color: '#64748B', width: 30, textAlign: 'center' },
  topRankText: { color: '#F59E0B' },
  userAvatar: { width: 42, height: 42, borderRadius: 21, marginRight: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  userInfoCol: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  userName: { fontSize: 13, fontWeight: '700', color: '#FFF', maxWidth: '85%' },
  crown: { marginLeft: 4 },
  userSub: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  pointsPill: { backgroundColor: 'rgba(124,58,237,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  pointsText: { fontSize: 12, fontWeight: '700', color: '#A78BFA' },
  emptyText: { color: '#94A3B8', textAlign: 'center', paddingVertical: 36 },
});
