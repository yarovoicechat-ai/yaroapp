import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function VIPPerkModal({ visible, onClose, tier, perk, styles }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Included in {tier.name}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>
          <View style={[styles.perkIconCircle, { alignSelf: 'center', marginVertical: 14, backgroundColor: `${tier.color}18` }]}>
            <MaterialCommunityIcons name={perk?.icon || 'crown'} size={28} color={tier.color} />
          </View>
          <Text style={[styles.modalTitle, { textAlign: 'center' }]}>{perk?.title}</Text>
          <Text style={[styles.modalDesc, { textAlign: 'center', marginTop: 8 }]}>{perk?.desc}</Text>
          <TouchableOpacity style={styles.modalConfirmBtn} onPress={onClose}>
            <LinearGradient colors={tier.gradient} style={styles.modalConfirmGradient}>
              <Text style={styles.modalConfirmText}>Got it</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
