import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
} from 'react-native';

export default function RoomOnlineUsersModal({
  visible,
  onClose,
  onSelectUser,
  users = [],
  bottomSafePadding = 16,
}) {
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

          <Text style={styles.sheetTitle}>Online Members</Text>

          <ScrollView style={styles.userList} showsVerticalScrollIndicator={false}>
            {users.length === 0 && (
              <Text style={styles.emptyText}>Abhi koi live room member available nahi hai.</Text>
            )}
            {users.map((u) => (
              <TouchableOpacity
                key={String(u.id || u._id || u.userId)}
                style={styles.userRow}
                onPress={() => {
                  onClose();
                  onSelectUser && onSelectUser(u);
                }}
                activeOpacity={0.75}
              >
                <Image
                  source={{ uri: u.image || u.avatar || 'https://api.yaroapp.in/uploads/avatars/female_default.webp' }}
                  style={styles.userAvatar}
                />

                <View style={styles.userInfoCol}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.userName} numberOfLines={1}>{u.name}</Text>
                    {u.role === 'admin' && (
                      <View style={styles.adminBadge}>
                        <Text style={styles.adminBadgeText}>ADMIN</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.userSub}>Level {u.level}</Text>
                </View>

                <TouchableOpacity
                  style={styles.viewBtn}
                  onPress={() => {
                    onClose();
                    onSelectUser && onSelectUser(u);
                  }}
                >
                  <Text style={styles.viewBtnText}>Profile</Text>
                </TouchableOpacity>
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
    maxHeight: 460,
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
  userList: {
    maxHeight: 360,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  userInfoCol: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  userSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  adminBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 6,
  },
  adminBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#000',
  },
  viewBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.4)',
  },
  viewBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A78BFA',
  },
  emptyText: {
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 36,
  },
});
