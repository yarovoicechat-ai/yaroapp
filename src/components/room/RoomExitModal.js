import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function RoomExitModal({
  visible,
  onClose,
  onKeepFloating,
  onLeaveCompletely,
}) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.dialogBox}>
          {/* Top Close Button */}
          <TouchableOpacity
            style={styles.cornerCloseBtn}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Icon name="close" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.dialogIconWrap}>
            <MaterialCommunityIcons name="broadcast" size={28} color="#A78BFA" />
          </View>
          <Text style={styles.dialogTitle}>Voice Room</Text>
          <Text style={styles.dialogSub}>
            Choose whether to keep listening in a floating circle or leave completely.
          </Text>

          {/* Circular Action Buttons Row */}
          <View style={styles.actionRow}>
            {/* Keep Circle Button */}
            <View style={styles.actionItem}>
              <TouchableOpacity
                style={styles.circleBtnWrap}
                onPress={() => {
                  onClose();
                  onKeepFloating && onKeepFloating();
                }}
                activeOpacity={0.75}
              >
                <View style={styles.keepCircle}>
                  <MaterialCommunityIcons
                    name="picture-in-picture-top-right"
                    size={30}
                    color="#C4B5FD"
                  />
                </View>
              </TouchableOpacity>
              <Text style={styles.actionTitle}>Keep</Text>
              <Text style={styles.actionSub}>Floating Window</Text>
            </View>

            {/* Leave Circle Button */}
            <View style={styles.actionItem}>
              <TouchableOpacity
                style={styles.circleBtnWrap}
                onPress={() => {
                  onClose();
                  onLeaveCompletely && onLeaveCompletely();
                }}
                activeOpacity={0.75}
              >
                <View style={styles.leaveCircle}>
                  <Icon name="exit-outline" size={28} color="#F87171" />
                </View>
              </TouchableOpacity>
              <Text style={styles.leaveActionTitle}>Leave</Text>
              <Text style={styles.actionSub}>Exit Room</Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  dialogBox: {
    width: '100%',
    maxWidth: 330,
    backgroundColor: 'rgba(24, 20, 48, 0.94)',
    borderRadius: 26,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    elevation: 16,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    position: 'relative',
  },
  cornerCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(139, 92, 246, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  dialogSub: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 36,
    width: '100%',
    paddingBottom: 6,
  },
  actionItem: {
    alignItems: 'center',
    minWidth: 90,
  },
  circleBtnWrap: {
    marginBottom: 8,
  },
  keepCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(139, 92, 246, 0.22)',
    borderWidth: 1.5,
    borderColor: 'rgba(167, 139, 250, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  leaveCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(248, 113, 113, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#C4B5FD',
    marginBottom: 2,
  },
  leaveActionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F87171',
    marginBottom: 2,
  },
  actionSub: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
});
