import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

export default function RoomMessageNoticeModal({ visible, onClose, bottomSafePadding, styles }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.messageNoticesSheet, { paddingBottom: bottomSafePadding + 24 }]}>
          <View style={styles.messageNoticesHeader}>
            <Text style={styles.messageNoticesTitle}>Message</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Icon name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
          <Text style={{ color: '#94A3B8', textAlign: 'center', paddingVertical: 28 }}>
            No new messages or activity.
          </Text>
        </View>
      </View>
    </Modal>
  );
}
