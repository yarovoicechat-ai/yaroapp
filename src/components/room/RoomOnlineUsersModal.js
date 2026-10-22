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
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getUserAvatar } from '../../utils/avatarUtil';

export default function RoomOnlineUsersModal({
  visible,
  onClose,
  onSelectUser,
  users = [],
  seats = [],
  roomOwnerId,
  admins = [],
  bottomSafePadding = 16,
}) {
  if (!visible) return null;

  // Build combined unique list of users (online users + all seated users)
  const userMap = new Map();

  // Add seated users first
  seats.forEach((seat) => {
    if (seat?.user) {
      const uid = String(seat.user.userId || seat.user._id || seat.user.id || '');
      if (uid) {
        userMap.set(uid, {
          ...seat.user,
          isSeated: true,
          seatIndex: seat.seatIndex,
        });
      }
    }
  });

  // Add online users
  users.forEach((u) => {
    const uid = String(u.userId || u._id || u.id || '');
    if (uid) {
      const existing = userMap.get(uid);
      userMap.set(uid, {
        ...u,
        ...(existing || {}),
      });
    }
  });

  const memberList = Array.from(userMap.values());

  const ownerIdStr = String(roomOwnerId || '');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={[styles.sheetContainer, { paddingBottom: Math.max(bottomSafePadding, 24) }]}>
          {/* Header Row: Room Member Title + Close Button */}
          <View style={styles.headerRow}>
            <Text style={styles.sheetTitle}>Room Member</Text>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Icon name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.userList} showsVerticalScrollIndicator={false}>
            {memberList.length === 0 && (
              <Text style={styles.emptyText}>No members currently in the room.</Text>
            )}

            {memberList.map((u) => {
              const uId = String(u.userId || u._id || u.id || '');
              const isOwner = Boolean(ownerIdStr && uId === ownerIdStr);
              const isAdmin = admins.some((adm) => String(adm) === uId);
              const isSeated = Boolean(
                u.isSeated ||
                seats.some((s) => s.user && String(s.user.userId || s.user._id || s.user.id) === uId)
              );
              const wealthLevel = u.wealthLevel ?? u.level ?? 1;
              const charmLevel = u.charmLevel ?? 1;
              const svipLevel = u.svipLevel ?? (u.isSvip ? 1 : null);

              return (
                <TouchableOpacity
                  key={uId || Math.random().toString()}
                  style={styles.userRow}
                  onPress={() => {
                    onClose();
                    onSelectUser && onSelectUser(u);
                  }}
                  activeOpacity={0.75}
                >
                  <Image
                    source={getUserAvatar({ avatar: u.avatar || u.image, image: u.image || u.avatar })}
                    style={styles.userAvatar}
                  />

                  <View style={styles.userInfoCol}>
                    {/* Row 1: Name + Role Badges (Owner, Admin, Seated) */}
                    <View style={styles.nameBadgesRow}>
                      <Text style={styles.userName} numberOfLines={1}>
                        {u.name || 'User'}
                      </Text>

                      {isOwner && (
                        <View style={styles.ownerBadge}>
                          <Text style={styles.roleBadgeText}>Owner</Text>
                        </View>
                      )}

                      {isAdmin && (
                        <View style={styles.adminBadge}>
                          <Text style={styles.roleBadgeText}>Admin</Text>
                        </View>
                      )}

                      {isSeated && (
                        <View style={styles.seatedBadge}>
                          <Text style={styles.roleBadgeText}>Seated</Text>
                        </View>
                      )}
                    </View>

                    {/* Row 2: SVIP, Lv, Charm, Club/Family Badges */}
                    <View style={styles.tagsRow}>
                      {!!svipLevel && (
                        <View style={styles.svipTag}>
                          <Text style={styles.svipTagText}>SVIP{svipLevel}</Text>
                        </View>
                      )}

                      <View style={styles.levelTag}>
                        <MaterialCommunityIcons name="star-four-points" size={10} color="#FFF" style={{ marginRight: 2 }} />
                        <Text style={styles.levelTagText}>Lv.{wealthLevel}</Text>
                      </View>

                      <View style={styles.charmTag}>
                        <MaterialCommunityIcons name="star" size={10} color="#FFF" style={{ marginRight: 2 }} />
                        <Text style={styles.charmTagText}>Lv.{charmLevel}</Text>
                      </View>

                      <View style={styles.clubTag}>
                        <Text style={styles.clubTagText}>LOVERS</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 16,
    paddingHorizontal: 20,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    position: 'relative',
    marginBottom: 8,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
  },
  closeBtn: {
    position: 'absolute',
    right: 0,
    top: 6,
    padding: 4,
  },
  userList: {
    marginTop: 6,
  },
  emptyText: {
    color: '#94A3B8',
    textAlign: 'center',
    marginVertical: 40,
    fontSize: 14,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F1F5F9',
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F1F5F9',
  },
  userInfoCol: {
    flex: 1,
    marginLeft: 14,
  },
  nameBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 5,
  },
  userName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    marginRight: 6,
    maxWidth: '65%',
  },
  ownerBadge: {
    backgroundColor: '#F97316',
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 6,
    marginRight: 5,
  },
  adminBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 6,
    marginRight: 5,
  },
  seatedBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 6,
    marginRight: 5,
  },
  roleBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  svipTag: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 8,
  },
  svipTagText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
  },
  levelTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16A34A',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 8,
  },
  levelTagText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
  },
  charmTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D9488',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 8,
  },
  charmTagText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
  },
  clubTag: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 8,
  },
  clubTagText: {
    color: '#38BDF8',
    fontSize: 9.5,
    fontWeight: '800',
  },
});
