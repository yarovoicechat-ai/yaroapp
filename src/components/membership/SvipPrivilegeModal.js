import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';

export default function SvipPrivilegeModal({ visible, onClose, privilege, styles }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{privilege?.title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={22} color="#94A3B8" />
            </TouchableOpacity>
          </View>
          <View style={styles.modalIconWrap}>
            <LinearGradient colors={['#FBBF24', '#D97706']} style={styles.modalIconGrad}>
              <Icon name={privilege?.icon || 'star'} size={32} color="#FFFFFF" />
            </LinearGradient>
          </View>
          <Text style={styles.modalDesc}>{privilege?.description || 'Exclusive nobility privilege for SVIP members.'}</Text>
          {privilege?.value ? (
            <View style={styles.modalValueRow}>
              <Text style={styles.modalValueLabel}>Tier Benefit:</Text>
              <Text style={styles.modalValueText}>{privilege.value}</Text>
            </View>
          ) : null}
          <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
            <Text style={styles.modalCloseText}>Got It</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
