import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function RoomThreeDotModal({
  visible,
  onClose,
  canModerate = true,
  onReportRoom,
  onOpenSeatSettings,
  onLockSeats,
  onOpenThemeModal,
  onShareRoom,
  onOpenAdminSettings,
  onClearChat,
  onGatherFollowers,
  isGlobalRoomManager = false,
  onBanRoom,
  onToggleStealth,
  isStealthActive = false,
  bottomSafePadding = 16,
}) {
  if (!visible) return null;

  // Normal guest users only see Report & Share (matches media_1792691205454.png)
  const guestItems = [
    {
      id: 'report',
      label: 'Report',
      icon: 'alert-circle-outline',
      iconColor: '#8B5CF6', // Purple
      onPress: onReportRoom,
    },
    {
      id: 'share',
      label: 'Share',
      icon: 'share-variant-outline',
      iconColor: '#F43F5E', // Coral
      onPress: onShareRoom,
    },
  ];

  // Room Owner & Admins see full management suite
  const adminItems = [
    {
      id: 'mic_count',
      label: 'Number of Mic',
      icon: 'microphone-outline',
      iconColor: '#EC4899', // Pink
      onPress: onOpenSeatSettings,
    },
    {
      id: 'lock',
      label: 'Lock',
      icon: 'lock-outline',
      iconColor: '#F97316', // Orange
      onPress: onLockSeats,
    },
    {
      id: 'decorations',
      label: 'Room Decorations',
      icon: 'palette-outline',
      iconColor: '#A855F7', // Purple
      onPress: onOpenThemeModal,
    },
    {
      id: 'share',
      label: 'Share',
      icon: 'share-variant-outline',
      iconColor: '#F43F5E', // Coral
      onPress: onShareRoom,
    },
    {
      id: 'admin',
      label: 'Admin',
      icon: 'account-star-outline',
      iconColor: '#06B6D4', // Cyan
      onPress: onOpenAdminSettings,
    },
    {
      id: 'clear_chat',
      label: 'Clear comments history',
      icon: 'delete-outline',
      iconColor: '#F43F5E', // Red-Pink
      onPress: onClearChat,
    },
    {
      id: 'gather',
      label: 'Gather followers',
      icon: 'bullhorn-outline',
      iconColor: '#EAB308', // Yellow
      onPress: onGatherFollowers,
    },
    ...(isGlobalRoomManager ? [
      {
        id: 'stealth',
        label: isStealthActive ? 'Stealth Mode (Active 🕵️)' : 'Stealth Mode (Ghost Entry)',
        icon: isStealthActive ? 'eye-off' : 'eye-off-outline',
        iconColor: '#A855F7',
        onPress: onToggleStealth,
      },
      {
        id: 'ban_room',
        label: 'Terminate & Ban Room 🚫',
        icon: 'cancel',
        iconColor: '#EF4444',
        onPress: onBanRoom,
      },
    ] : []),
  ];

  const toolItems = canModerate ? adminItems : guestItems;

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

        <View style={[styles.sheetContainer, { paddingBottom: Math.max(bottomSafePadding, 20) }]}>
          {toolItems.map((item, index) => (
            <React.Fragment key={item.id}>
              <TouchableOpacity
                style={styles.toolRow}
                onPress={() => {
                  onClose();
                  item.onPress && item.onPress();
                }}
                activeOpacity={0.7}
              >
                <View style={styles.iconWrapper}>
                  <MaterialCommunityIcons name={item.icon} size={24} color={item.iconColor} />
                </View>
                <Text style={styles.toolLabel}>{item.label}</Text>
              </TouchableOpacity>
              {index < toolItems.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}

          {/* Bottom Cancel Button */}
          <View style={[styles.divider, { marginVertical: 8, height: 4, backgroundColor: '#F8FAFC' }]} />
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 16,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 20,
  },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    position: 'relative',
  },
  iconWrapper: {
    marginRight: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolLabel: {
    fontSize: 15.5,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#F1F5F9',
  },
  cancelBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 15.5,
    fontWeight: '600',
    color: '#94A3B8',
  },
});
