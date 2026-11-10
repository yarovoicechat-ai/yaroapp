import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';

export default function SvipPrivilegeModal({ visible, onClose, privilege, styles }) {
  const s = styles ? { ...defaultStyles, ...styles } : defaultStyles;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.modalOverlay}>
        <View style={s.modalCard}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>{privilege?.title || 'VIP Privilege'}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Icon name="close" size={22} color="#94A3B8" />
            </TouchableOpacity>
          </View>
          <View style={s.modalIconWrap}>
            <LinearGradient colors={['#FBBF24', '#D97706']} style={s.modalIconGrad}>
              <Icon name={privilege?.icon || 'star'} size={32} color="#FFFFFF" />
            </LinearGradient>
          </View>
          <Text style={s.modalDesc}>{privilege?.description || 'Exclusive nobility privilege for VIP members.'}</Text>
          {privilege?.value ? (
            <View style={s.modalValueRow}>
              <Text style={s.modalValueLabel}>Tier Benefit:</Text>
              <Text style={s.modalValueText}>{privilege.value}</Text>
            </View>
          ) : null}
          <TouchableOpacity style={s.modalCloseBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={s.modalCloseText}>Got It</Text>
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
    maxWidth: 340,
    backgroundColor: '#1E1B4B',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    padding: 22,
    alignItems: 'center',
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
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    flex: 1,
  },
  modalIconWrap: {
    marginBottom: 16,
  },
  modalIconGrad: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  modalDesc: {
    fontSize: 14,
    color: '#CBD5E1',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  modalValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 20,
    gap: 6,
  },
  modalValueLabel: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  modalValueText: {
    fontSize: 13,
    color: '#FBBF24',
    fontWeight: '700',
  },
  modalCloseBtn: {
    width: '100%',
    backgroundColor: '#F59E0B',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
  },
});
