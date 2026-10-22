import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { apiUtil } from '../../utils/apiUtil';
import { AlertService } from '../../utils/AlertService';
import { getSocket } from '../../utils/socket';

export default function RoomAdminListModal({
  visible,
  onClose,
  roomId,
  isOwner = false,
  bottomSafePadding = 16,
}) {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    if (visible && roomId) {
      loadAdmins();
    }
  }, [visible, roomId]);

  const loadAdmins = async () => {
    if (!roomId) return;
    setLoading(true);
    try {
      const res = await apiUtil.get(`/voice-club/rooms/${roomId}/admins`);
      if (res.data?.success && Array.isArray(res.data?.data)) {
        setAdmins(res.data.data);
      } else {
        setAdmins([]);
      }
    } catch (err) {
      console.warn('[RoomAdminListModal] Load admins notice:', err?.message);
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAdmin = (adminUser) => {
    const adminId = String(adminUser.userId || adminUser._id || adminUser.id || '');
    const adminName = adminUser.name || 'User';

    Alert.alert(
      'Remove Admin',
      `Are you sure you want to remove ${adminName} as room admin?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setRemovingId(adminId);
            try {
              const sock = getSocket();
              if (sock) {
                sock.emit('voice_room:toggle_admin', {
                  roomId,
                  targetUserId: adminId,
                });
              }
              const res = await apiUtil.post(`/voice-club/rooms/${roomId}/admins/remove`, {
                targetUserId: adminId,
              });
              if (res.data?.success) {
                AlertService.show('Admin Removed', `${adminName} has been removed from room admins.`, 'success');
                setAdmins((prev) => prev.filter((a) => String(a.userId || a._id || a.id) !== adminId));
              }
            } catch (err) {
              AlertService.show('Notice', err?.response?.data?.message || err?.message || 'Could not remove admin', 'info');
            } finally {
              setRemovingId(null);
            }
          },
        },
      ]
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />

        <View style={[styles.sheet, { paddingBottom: Math.max(bottomSafePadding, 24) }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ width: 32 }} />
            <Text style={styles.title}>Admin</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <MaterialCommunityIcons name="close" size={22} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Admin List */}
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#F59E0B" />
              <Text style={styles.loadingText}>Loading administrators...</Text>
            </View>
          ) : admins.length === 0 ? (
            <View style={styles.emptyBox}>
              <MaterialCommunityIcons name="account-star-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>No administrators assigned yet.</Text>
            </View>
          ) : (
            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
              {admins.map((adm) => {
                const adminId = String(adm.userId || adm._id || adm.id || '');
                const wealthLv = adm.wealthLevel ?? adm.level ?? 1;
                const charmLv = adm.charmLevel ?? 0;
                const isRemoving = removingId === adminId;

                return (
                  <View key={adminId} style={styles.adminRow}>
                    {/* Avatar */}
                    <Image
                      source={{
                        uri: adm.avatar || adm.image || 'https://api.yaroapp.in/uploads/avatars/male_default.webp',
                      }}
                      style={styles.avatar}
                    />

                    {/* Info */}
                    <View style={styles.infoCol}>
                      <Text style={styles.name} numberOfLines={1}>{adm.name || 'User'}</Text>
                      <View style={styles.badgesRow}>
                        {/* Wealth Badge */}
                        <View style={styles.wealthBadge}>
                          <MaterialCommunityIcons name="star-four-points" size={9} color="#FFF" style={{ marginRight: 2 }} />
                          <Text style={styles.badgeText}>Lv.{wealthLv}</Text>
                        </View>
                        {/* Charm Badge */}
                        <View style={styles.charmBadge}>
                          <MaterialCommunityIcons name="star" size={9} color="#CBD5E1" style={{ marginRight: 2 }} />
                          <Text style={styles.badgeText}>Lv.{charmLv}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Red Minus Button (Remove Admin) */}
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => handleRemoveAdmin(adm)}
                      disabled={isRemoving}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      {isRemoving ? (
                        <ActivityIndicator size="small" color="#EF4444" />
                      ) : (
                        <View style={styles.redMinusCircle}>
                          <View style={styles.whiteMinusLine} />
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 16,
    paddingHorizontal: 20,
    minHeight: 280,
    maxHeight: '65%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F1F5F9',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  list: {
    flex: 1,
    paddingVertical: 8,
  },
  adminRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    marginRight: 12,
  },
  infoCol: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  wealthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
  },
  charmBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#94A3B8',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  removeBtn: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  redMinusCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whiteMinusLine: {
    width: 10,
    height: 2.5,
    backgroundColor: '#FFFFFF',
    borderRadius: 1.5,
  },
  loadingBox: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#94A3B8',
    fontSize: 13,
  },
  emptyBox: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 10,
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
});
