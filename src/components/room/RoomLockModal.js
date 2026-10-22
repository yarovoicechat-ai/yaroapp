import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { apiUtil } from '../../utils/apiUtil';
import { AlertService } from '../../utils/AlertService';

/**
 * RoomLockModal
 * Supports 3 modes matching official screenshots:
 * 1. 'not_purchased' (Prompt to buy Room Lock privilege)
 * 2. 'set_pin'       ("Please set 4 digits password" for room owner)
 * 3. 'enter_pin'     ("Please enter 4 digits password" for users joining locked room)
 */
export default function RoomLockModal({
  visible,
  onClose,
  mode = 'set_pin',
  roomId,
  onSuccess,
  onBuyLock,
}) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setPin('');
      setLoading(false);
      if (mode !== 'not_purchased') {
        setTimeout(() => inputRef.current?.focus(), 300);
      }
    }
  }, [visible, mode]);

  if (!visible) return null;

  const handleConfirm = async () => {
    if (mode === 'not_purchased') {
      onClose();
      if (onBuyLock) onBuyLock();
      return;
    }

    if (pin.length !== 4) {
      AlertService.show('Notice', 'Please enter a 4-digit password', 'info');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'set_pin') {
        const res = await apiUtil.post(`/voice-club/rooms/${roomId}/lock`, {
          isLocked: true,
          pin,
        });
        if (res.data?.success) {
          AlertService.show('Room Locked', '4-digit password set successfully!', 'success');
          if (onSuccess) onSuccess(pin);
          onClose();
        } else {
          AlertService.show('Notice', res.data?.message || 'Failed to set room lock', 'info');
        }
      } else if (mode === 'enter_pin') {
        const res = await apiUtil.post(`/voice-club/rooms/${roomId}/verify-pin`, { pin });
        if (res.data?.success && res.data?.valid) {
          if (onSuccess) onSuccess(pin);
          onClose();
        } else {
          AlertService.show('Access Denied', res.data?.message || 'Incorrect password', 'info');
          setPin('');
        }
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Operation failed';
      AlertService.show('Notice', msg, 'info');
    } finally {
      setLoading(false);
    }
  };

  const digits = [pin[0] || '', pin[1] || '', pin[2] || '', pin[3] || ''];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFillObject} />
        </TouchableWithoutFeedback>

        <View style={styles.dialogCard}>
          {/* Close Cross */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={22} color="#64748B" />
          </TouchableOpacity>

          {/* Title */}
          <Text style={styles.dialogTitle}>
            {mode === 'not_purchased' ? 'Room Lock' : 'Room lock'}
          </Text>

          {mode === 'not_purchased' ? (
            /* Not Purchased View */
            <View style={styles.bodyWrap}>
              <Text style={styles.notPurchasedText}>
                {"You haven't purchased Room Lock yet.\nConfirm to buy?"}
              </Text>

              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleConfirm}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#FFB703', '#FB8500']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.confirmGradient}
                >
                  <Text style={styles.confirmText}>OK</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelTextAllCaps}>CANCEL</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* PIN Entry View */
            <View style={styles.bodyWrap}>
              {/* 4 Box Digits with Direct Transparent Overlay Input */}
              <View style={styles.pinInputContainer}>
                <View style={styles.pinBoxesRow} pointerEvents="none">
                  {digits.map((digit, idx) => {
                    const isCurrent = idx === pin.length;
                    return (
                      <View
                        key={idx}
                        style={[
                          styles.pinBox,
                          digit ? styles.pinBoxFilled : null,
                          isCurrent ? styles.pinBoxActive : null,
                        ]}
                      >
                        <Text style={styles.pinDigitText}>
                          {digit ? '•' : ''}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                {/* Direct Full-Area Numeric Input */}
                <TextInput
                  ref={inputRef}
                  value={pin}
                  onChangeText={(text) => {
                    const clean = text.replace(/[^0-9]/g, '').slice(0, 4);
                    setPin(clean);
                  }}
                  keyboardType="number-pad"
                  maxLength={4}
                  caretHidden
                  style={styles.pinOverlayInput}
                  autoFocus
                />
              </View>

              {/* Subtitle */}
              <Text style={styles.subPromptText}>
                {mode === 'set_pin'
                  ? 'Please set 4 digits password'
                  : 'Please enter 4 digits password'}
              </Text>

              {/* Confirm Button */}
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleConfirm}
                disabled={loading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#FFB703', '#FB8500']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.confirmGradient}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.confirmText}>Confirm</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Cancel Link */}
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 36,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 16,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 10,
  },
  dialogTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 20,
    textAlign: 'center',
  },
  bodyWrap: {
    width: '100%',
    alignItems: 'center',
  },
  notPurchasedText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 26,
  },
  pinInputContainer: {
    width: '100%',
    height: 52,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  pinBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  pinBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinBoxActive: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  pinBoxFilled: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  pinDigitText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 32,
  },
  pinOverlayInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
    color: 'transparent',
    fontSize: 1,
  },
  subPromptText: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 22,
    textAlign: 'center',
  },
  confirmBtn: {
    width: '100%',
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 10,
  },
  confirmGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  cancelText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  cancelTextAllCaps: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
