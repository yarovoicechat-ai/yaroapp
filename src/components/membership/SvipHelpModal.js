import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const RULES = [
  'VIP tiers are purchased using diamonds and remain active for the configured validity period.',
  'Your permanent account numeric ID is never overwritten or affected by temporary VIP display tags.',
  'When your VIP expires, benefits automatically stop and your profile safely reverts to default styling.',
  'VIP grants immunity from public room kicks, high-priority entry notifications, and exclusive privileges.',
];

export default function SvipHelpModal({ visible, onClose, styles }) {
  const s = styles ? { ...defaultStyles, ...styles } : defaultStyles;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.modalOverlay}>
        <View style={s.modalCard}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>VIP Nobility Rules</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Icon name="close" size={22} color="#94A3B8" />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 300, marginVertical: 12 }}>
            {RULES.map((rule, index) => (
              <Text key={rule} style={s.helpRuleText}>{index + 1}. {rule}</Text>
            ))}
          </ScrollView>
          <TouchableOpacity style={s.modalCloseBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={s.modalCloseText}>Understood</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const defaultStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#1E1B4B',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    padding: 22,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  helpRuleText: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 20,
    marginBottom: 10,
  },
  modalCloseBtn: {
    width: '100%',
    backgroundColor: '#F59E0B',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  modalCloseText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
  },
});
