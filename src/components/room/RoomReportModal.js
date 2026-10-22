import React from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export default function RoomReportModal({
  visible,
  onClose,
  targetUser,
  reasons,
  selectedReason,
  setSelectedReason,
  details,
  setDetails,
  submitting,
  onSubmit,
  bottomSafePadding,
  styles,
}) {
  return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => onClose()}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.menuSheet, { paddingBottom: bottomSafePadding + 20 }]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.menuSheetTitle}>Report User</Text>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 8 }}>
              Select a reason for reporting {targetUser?.name || 'this participant'}:
            </Text>

            <ScrollView style={{ maxHeight: 200, marginVertical: 8 }}>
              {reasons.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.ugcReasonItem,
                    selectedReason === r && styles.ugcReasonItemSelected
                  ]}
                  onPress={() => setSelectedReason(r)}
                >
                  <Text style={[styles.ugcReasonText, selectedReason === r && styles.ugcReasonTextSelected]}>
                    {r}
                  </Text>
                  {selectedReason === r && <MaterialIcons name="check" size={18} color="#03dcfe" />}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput
              style={[styles.editTextInput, { height: 60, textAlignVertical: 'top' }]}
              value={details}
              onChangeText={setDetails}
              placeholder="Additional details (optional)..."
              placeholderTextColor="#94A3B8"
              multiline
              maxLength={200}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
              <TouchableOpacity
                style={{ paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.08)' }}
                onPress={() => onClose()}
                disabled={submitting}
              >
                <Text style={{ color: '#fff', fontSize: 14 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10, backgroundColor: '#e11d48' }}
                onPress={onSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Submitting...</Text>
                ) : (
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Submit Report</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

  );
}
