import React from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const RULES = [
  'SVIP tiers are purchased using diamonds and remain active for the configured validity period.',
  'Your permanent account numeric ID is never overwritten or affected by temporary SVIP display tags.',
  'When your SVIP expires, benefits automatically stop and your profile safely reverts to default styling.',
  'SVIP grants immunity from public room kicks, high-priority entry notifications, and exclusive privileges.',
];

export default function SvipHelpModal({ visible, onClose, styles }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>SVIP Nobility Rules</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={22} color="#94A3B8" />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 300, marginVertical: 12 }}>
            {RULES.map((rule, index) => (
              <Text key={rule} style={styles.helpRuleText}>{index + 1}. {rule}</Text>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
            <Text style={styles.modalCloseText}>Understood</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
