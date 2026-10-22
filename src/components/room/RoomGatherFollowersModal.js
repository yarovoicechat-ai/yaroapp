import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

/**
 * RoomGatherFollowersModal
 * Matching media_1792691076423.png
 * "You can gather followers when you reach charm level 20."
 * [Get Charm Lv.20] (Yellow gradient button)
 * Cancel
 */
export default function RoomGatherFollowersModal({
  visible,
  onClose,
  onGetCharm,
}) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.dialogCard}>
          <Text style={styles.promptText}>
            You can gather followers when you reach charm level 20.
          </Text>

          {/* Yellow Action Button */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => {
              onClose();
              if (onGetCharm) onGetCharm();
            }}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#FFB703', '#FB8500']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              <Text style={styles.btnText}>Get Charm Lv.20</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Cancel */}
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 36,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 20,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  promptText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1E293B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 26,
  },
  actionBtn: {
    width: '100%',
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 14,
  },
  btnGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  cancelText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
});
