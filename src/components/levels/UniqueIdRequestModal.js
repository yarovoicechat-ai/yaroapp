import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { apiUtil } from '../../utils/apiUtil';
import { AlertService } from '../../utils/AlertService';

export default function UniqueIdRequestModal({
  visible,
  onClose,
  item,
  journeyType = 'wealth',
  user,
  onSuccess,
}) {
  const [requestedId, setRequestedId] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState(null);
  const [isAvailable, setIsAvailable] = useState(null);

  if (!visible || !item) return null;

  const handleCheckAvailability = async () => {
    const clean = requestedId.trim();
    if (!clean) {
      AlertService.show('Notice', 'Please enter a number ID to check', 'info');
      return;
    }

    setChecking(true);
    setAvailabilityMessage(null);
    try {
      const res = await apiUtil.get(`/level/check-unique-id/${clean}`);
      const available = res?.data?.data?.available ?? false;
      setIsAvailable(available);
      setAvailabilityMessage(
        available
          ? `✓ ID "${clean}" is FREE and available!`
          : `✗ ID "${clean}" is already taken by another user.`
      );
    } catch {
      setAvailabilityMessage('Could not verify ID at this time.');
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async () => {
    const clean = requestedId.trim();
    if (!clean) {
      AlertService.show('Enter ID', 'Please enter your desired Unique Number ID (e.g. 77777)', 'info');
      return;
    }

    setLoading(true);
    try {
      const res = await apiUtil.post('/level/request-unique-id', {
        levelType: journeyType,
        levelNumber: item.requiredLevel,
        requestedId: clean,
        badgeName: item.name || 'VIP Unique ID',
      });

      if (res?.data?.success) {
        AlertService.show(
          'Request Submitted! 🎉',
          `Your request for Unique ID "${clean}" has been sent to management. Once approved, it will be assigned to your account!`,
          'success'
        );
        if (onSuccess) onSuccess();
        onClose();
      } else {
        AlertService.show(
          'Request Notice',
          res?.data?.message || 'Could not submit request',
          'error'
        );
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Request failed';
      AlertService.show('ID Unavailable', errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
        <View style={styles.card}>
          {/* Close button */}
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <Icon name="close" size={20} color="#94A3B8" />
          </TouchableOpacity>

          {/* Crown Icon */}
          <LinearGradient
            colors={['#F59E0B', '#D97706']}
            style={styles.crownCircle}
          >
            <Text style={styles.crownEmoji}>👑</Text>
          </LinearGradient>

          <Text style={styles.title}>Choose Your Unique ID</Text>
          <Text style={styles.subTitle}>
            Unlocked via {journeyType === 'charm' ? '💖 Charm' : '💎 Wealth'} Level {item.requiredLevel} Perk
          </Text>

          {/* Preview Badge */}
          <View style={styles.previewContainer}>
            <Text style={styles.previewLabel}>LIVE ID PREVIEW</Text>
            <View style={styles.previewBadge}>
              <Text style={styles.previewBadgeText}>
                👑 {requestedId.trim() || 'Enter Desired ID'}
              </Text>
            </View>
            <Text style={styles.previewUserText}>Assigned to: {user?.name || 'You'}</Text>
          </View>

          {/* Input Box */}
          <View style={styles.inputWrap}>
            <Text style={styles.inputPrefix}>ID #</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 77777, 88888, 9999"
              placeholderTextColor="#64748B"
              value={requestedId}
              onChangeText={(text) => {
                setRequestedId(text);
                setIsAvailable(null);
                setAvailabilityMessage(null);
              }}
              keyboardType="numeric"
              maxLength={12}
              autoFocus
            />
            <TouchableOpacity
              onPress={handleCheckAvailability}
              disabled={checking || !requestedId.trim()}
              style={styles.checkBtn}
            >
              {checking ? (
                <ActivityIndicator size="small" color="#F59E0B" />
              ) : (
                <Text style={styles.checkBtnText}>Check</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Availability Feedback */}
          {availabilityMessage && (
            <Text
              style={[
                styles.availabilityText,
                { color: isAvailable ? '#10B981' : '#EF4444' },
              ]}
            >
              {availabilityMessage}
            </Text>
          )}

          <Text style={styles.noteText}>
            🔒 Once submitted, management verifies that this ID is not already owned. Upon approval, your profile ID is updated automatically!
          </Text>

          {/* Action Buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, (!requestedId.trim() || loading) && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={!requestedId.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#0F172A" />
              ) : (
                <Text style={styles.submitBtnText}>Submit Request 🚀</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#161329',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    elevation: 20,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    padding: 6,
    zIndex: 10,
  },
  crownCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    elevation: 6,
  },
  crownEmoji: {
    fontSize: 28,
  },
  title: {
    fontSize: 19,
    fontWeight: '900',
    color: '#F8FAFC',
    textAlign: 'center',
  },
  subTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
    marginTop: 4,
    textAlign: 'center',
  },
  previewContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 14,
  },
  previewLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 6,
  },
  previewBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  previewBadgeText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FDE68A',
    letterSpacing: 1.2,
  },
  previewUserText: {
    fontSize: 11,
    color: '#CBD5E1',
    marginTop: 6,
    fontWeight: '500',
  },
  inputWrap: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    paddingHorizontal: 12,
  },
  inputPrefix: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F59E0B',
    marginRight: 6,
  },
  input: {
    flex: 1,
    height: 46,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  checkBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: 8,
  },
  checkBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F59E0B',
  },
  availabilityText: {
    fontSize: 11.5,
    fontWeight: '700',
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  noteText: {
    fontSize: 10.5,
    color: '#94A3B8',
    lineHeight: 14,
    marginTop: 10,
    marginBottom: 16,
    textAlign: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '700',
  },
  submitBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
  },
});
