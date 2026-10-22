import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function SelfSeatOptionsModal({ visible, onClose, isMuted, onLeaveSeat, onToggleMic, styles }) {
  return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => onClose()}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.selfSeatSheet}>
            <Text style={styles.selfSeatTitle}>Your Seat Options</Text>

            <TouchableOpacity
              style={styles.selfSeatActionBtn}
              onPress={() => {
                onClose();
                onLeaveSeat();
              }}
            >
              <MaterialCommunityIcons name="seat-passenger" size={20} color="#EF4444" style={{ marginRight: 8 }} />
              <Text style={[styles.selfSeatActionText, { color: '#EF4444' }]}>Leave Seat (Become Listener)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.selfSeatActionBtn}
              onPress={() => {
                onClose();
                onToggleMic();
              }}
            >
              <Icon name={isMuted ? 'mic' : 'mic-off'} size={20} color="#4F46E5" style={{ marginRight: 8 }} />
              <Text style={styles.selfSeatActionText}>{isMuted ? 'Turn Microphone Live' : 'Mute Microphone'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.selfSeatCancelBtn}
              onPress={() => onClose()}
            >
              <Text style={styles.selfSeatCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>



  );
}
