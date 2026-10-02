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
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.dialogBox}>
          <View style={styles.dialogIconWrap}>
            <MaterialCommunityIcons name="broadcast" size={32} color="#8B5CF6" />
          </View>
          <Text style={styles.dialogTitle}>Voice Room</Text>
          <Text style={styles.dialogSub}>
            Do you want to keep listening in the background with a floating window, or exit the room completely?
          </Text>

          <View style={styles.dialogBtnRow}>
            {/* Keep Option */}
            <TouchableOpacity
              style={styles.keepBtn}
              onPress={() => {
                onClose();
                onKeepFloating && onKeepFloating();
              }}
              activeOpacity={0.85}
            >
              <LinearGradient colors={['#8B5CF6', '#6D28D9']} style={styles.keepGradient}>
                <MaterialCommunityIcons
                  name="picture-in-picture-top-right"
                  size={18}
                  color="#FFF"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.keepBtnText}>Keep (Floating)</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Leave Option */}
            <TouchableOpacity
              style={styles.leaveBtn}
              onPress={() => {
                onClose();
                onLeaveCompletely && onLeaveCompletely();
              }}
              activeOpacity={0.85}
            >
              <Icon name="exit-outline" size={18} color="#EF4444" style={{ marginRight: 6 }} />
              <Text style={styles.leaveBtnText}>Leave Room</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  dialogBox: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#1E2338',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  dialogIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 8,
  },
  dialogSub: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 22,
  },
  dialogBtnRow: {
    width: '100%',
    gap: 10,
  },
  keepBtn: {
    width: '100%',
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  keepGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keepBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  leaveBtn: {
    width: '100%',
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  leaveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },
});
