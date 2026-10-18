import React from 'react';
import { ActivityIndicator, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const REPORT_REASONS = ['Inappropriate content', 'Harassment', 'Spam/Scam', 'Underage user'];

export default function VideoCallSafetyModal({
  visible,
  onClose,
  onBlock,
  selectedReason,
  onSelectReason,
  details,
  onChangeDetails,
  submitting,
  onSubmit,
  styles,
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.safetyDialog}>
          <View style={styles.safetyHeader}>
            <Icon name="shield-checkmark" size={24} color="#7C3AED" />
            <Text style={styles.safetyTitle}>Safety & Moderation</Text>
          </View>

          <TouchableOpacity style={styles.dangerRow} onPress={onBlock} activeOpacity={0.8}>
            <Icon name="hand-left-outline" size={20} color="#EF4444" />
            <Text style={styles.dangerText}>Block User & End Call</Text>
          </TouchableOpacity>

          <Text style={styles.reportHeaderTitle}>Report Inappropriate Behavior</Text>
          {REPORT_REASONS.map((reason) => (
            <TouchableOpacity
              key={reason}
              style={[styles.reasonOption, selectedReason === reason && styles.reasonOptionActive]}
              onPress={() => onSelectReason(reason)}
              activeOpacity={0.8}
            >
              <Icon
                name={selectedReason === reason ? 'radio-button-on' : 'radio-button-off'}
                size={18}
                color={selectedReason === reason ? '#7C3AED' : '#94A3B8'}
              />
              <Text style={styles.reasonText}>{reason}</Text>
            </TouchableOpacity>
          ))}

          <TextInput
            style={styles.reportInput}
            placeholder="Provide more context (optional)..."
            placeholderTextColor="#94A3B8"
            value={details}
            onChangeText={onChangeDetails}
            multiline
            maxLength={200}
          />

          <View style={styles.reportActionsRow}>
            <TouchableOpacity style={styles.cancelReportBtn} onPress={onClose}>
              <Text style={styles.cancelReportText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitReportBtn} onPress={onSubmit} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitReportText}>Submit Report</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
