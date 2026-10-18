import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function ChatSafetyMenu({ visible, onClose, top, onReport, onBlock, styles }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={onClose}>
        <View style={[styles.chatMenu, { top }]}>
          <TouchableOpacity style={styles.chatMenuItem} onPress={onReport}>
            <Icon name="flag" size={20} color="#facc15" />
            <Text style={styles.chatMenuText}>Report user</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.chatMenuItem} onPress={onBlock}>
            <Icon name="block" size={20} color="#ff3b30" />
            <Text style={styles.chatMenuText}>Block user</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
