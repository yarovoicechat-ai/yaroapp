import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { formatCompactBalance } from '../../utils/numberUtil';

export default function VIPActivationConfirmModal({ visible, onClose, tier, packageOption, onConfirm, styles }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Confirm VIP Activation</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>
          <Text style={styles.modalDesc}>
            You are activating <Text style={{ fontWeight: '700', color: '#0F172A' }}>{tier.name}</Text> for{' '}
            <Text style={{ fontWeight: '700', color: '#0F172A' }}>{packageOption.title}</Text>.
          </Text>
          <View style={styles.modalCostRow}>
            <Text style={styles.modalCostLabel}>Total Price:</Text>
            <View style={styles.modalCostVal}>
              <MaterialCommunityIcons name="diamond-stone" size={18} color="#0284C7" />
              <Text style={styles.modalCostText}>{formatCompactBalance(packageOption.diamonds)} Diamonds</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.modalConfirmBtn} onPress={onConfirm} activeOpacity={0.88}>
            <LinearGradient colors={['#4F46E5', '#6366F1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.modalConfirmGradient}>
              <Text style={styles.modalConfirmText}>Confirm & Pay</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
