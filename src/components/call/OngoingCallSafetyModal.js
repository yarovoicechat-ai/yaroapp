import React from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function OngoingCallSafetyModal({
  visible,
  onClose,
  action,
  onActionChange,
  name,
  reasons,
  selectedReason,
  onSelectReason,
  details,
  onChangeDetails,
  submitting,
  onSubmitReport,
  onBlock,
  styles,
}) {
  if (!visible) return null;

  return (
    <View style={styles.safetyModalOverlay}>
      <View style={styles.safetyModalCard}>
        <View style={styles.safetyModalHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="shield-check" size={22} color="#f43f5e" />
            <Text style={styles.safetyModalTitle}>Safety & Moderation</Text>
          </View>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={22} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {action === 'report' ? (
          <View style={{ marginTop: 12 }}>
            <Text style={styles.safetySubtitle}>Why are you reporting this user?</Text>
            <View style={styles.reasonsList}>
              {reasons.map((reason) => (
                <TouchableOpacity
                  key={reason}
                  style={[styles.reasonChip, selectedReason === reason && styles.reasonChipActive]}
                  onPress={() => onSelectReason(reason)}
                >
                  <Text style={[styles.reasonChipText, selectedReason === reason && styles.reasonChipTextActive]}>
                    {reason}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.safetyInput}
              placeholder="Additional details (optional)..."
              placeholderTextColor="#64748b"
              value={details}
              onChangeText={onChangeDetails}
              multiline
              numberOfLines={3}
            />

            <View style={styles.safetyActionRow}>
              <TouchableOpacity style={styles.safetyCancelBtn} onPress={() => onActionChange(null)}>
                <Text style={styles.safetyCancelText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.safetySubmitBtn} onPress={onSubmitReport} disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.safetySubmitText}>Submit Report</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={{ marginTop: 14 }}>
            <Text style={styles.safetySubtitle}>Choose an action for this call with {name || 'user'}:</Text>

            <TouchableOpacity style={styles.safetyOptionBtn} onPress={() => onActionChange('report')}>
              <Icon name="flag-outline" size={22} color="#f59e0b" />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.safetyOptionTitle}>Report User</Text>
                <Text style={styles.safetyOptionSub}>Report offensive behavior, underage user, or policy violations</Text>
              </View>
              <Icon name="chevron-right" size={20} color="#64748b" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.safetyOptionBtn, { borderColor: 'rgba(244, 63, 94, 0.3)', backgroundColor: 'rgba(244, 63, 94, 0.08)' }]}
              onPress={onBlock}
            >
              <Icon name="account-cancel-outline" size={22} color="#f43f5e" />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={[styles.safetyOptionTitle, { color: '#f43f5e' }]}>Block User & End Call</Text>
                <Text style={styles.safetyOptionSub}>Immediately disconnect and block all future interactions</Text>
              </View>
              <Icon name="chevron-right" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}
