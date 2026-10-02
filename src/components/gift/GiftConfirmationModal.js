import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';

export default function GiftConfirmationModal({
  visible,
  gift,
  quantity = 1,
  receivers = [],
  totalDiamonds = 0,
  currentBalance = 0,
  onConfirm,
  onCancel,
}) {
  if (!visible || !gift) return null;

  const cost = Number(totalDiamonds || 0);
  const remaining = Math.max(0, currentBalance - cost);
  const receiverNames = receivers.length > 0
    ? receivers.map((r) => r.name).join(', ')
    : 'Selected User';

  const singlePrice = Number(gift.price !== undefined ? gift.price : (gift.cost || 0));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <LinearGradient
            colors={['#1E1B4B', '#0F172A']}
            style={styles.cardGradient}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Confirm Gift Send</Text>
              <Text style={styles.headerSubtitle}>
                Please confirm before sending this high-value gift
              </Text>
            </View>

            {/* Gift Info */}
            <View style={styles.giftPreviewBox}>
              <Text style={styles.giftIcon}>{gift.icon || '🎁'}</Text>
              <View style={styles.giftDetails}>
                <Text style={styles.giftName}>{gift.name}</Text>
                <Text style={styles.giftPrice}>
                  💎 {singlePrice.toLocaleString()} Diamonds each
                </Text>
              </View>
            </View>

            {/* Summary Details */}
            <View style={styles.summaryTable}>
              <View style={styles.row}>
                <Text style={styles.label}>To:</Text>
                <Text style={styles.value} numberOfLines={1}>{receiverNames}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Quantity:</Text>
                <Text style={styles.value}>x{quantity}</Text>
              </View>

              <View style={[styles.row, styles.highlightRow]}>
                <Text style={styles.highlightLabel}>Total Cost:</Text>
                <Text style={styles.highlightValue}>
                  💎 {cost.toLocaleString()} Diamonds
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.row}>
                <Text style={styles.subLabel}>Current Balance:</Text>
                <Text style={styles.subValue}>💎 {currentBalance.toLocaleString()} Diamonds</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.subLabel}>Remaining Balance:</Text>
                <Text style={[styles.subValue, { color: '#10B981' }]}>
                  💎 {remaining.toLocaleString()} Diamonds
                </Text>
              </View>
            </View>

            {/* Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onCancel}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelText}>CANCEL</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sendBtn}
                onPress={onConfirm}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#EC4899', '#BE185D']}
                  style={styles.sendGradient}
                >
                  <Text style={styles.sendText}>CONFIRM & SEND</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  cardGradient: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 11.5,
    textAlign: 'center',
  },
  giftPreviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    padding: 12,
    borderRadius: 14,
    marginBottom: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  giftIcon: {
    fontSize: 36,
  },
  giftDetails: {
    flex: 1,
  },
  giftName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  giftPrice: {
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  summaryTable: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 18,
    gap: 7,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: '#94A3B8',
    fontSize: 12,
  },
  value: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '600',
    maxWidth: '65%',
  },
  highlightRow: {
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  highlightLabel: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  highlightValue: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '900',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 4,
  },
  subLabel: {
    color: '#64748B',
    fontSize: 11,
  },
  subValue: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: 'rgba(51, 65, 85, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  sendBtn: {
    flex: 1.5,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sendGradient: {
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
