import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

export default function InsufficientBalanceModal({
  visible,
  requiredDiamonds = 0,
  availableDiamonds = 0,
  onTopUp,
  onCancel,
}) {
  if (!visible) return null;

  const req = Number(requiredDiamonds || 0);
  const avail = Number(availableDiamonds || 0);
  const shortage = Math.max(0, req - avail);

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
            <View style={styles.iconCircle}>
              <Text style={{ fontSize: 32 }}>💎</Text>
            </View>

            <Text style={styles.title}>Not Enough Diamonds</Text>
            <Text style={styles.subtitle}>
              You need {shortage.toLocaleString()} more Diamonds to send this gift.
            </Text>

            <View style={styles.statsCard}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Required:</Text>
                <Text style={styles.statRequired}>{req.toLocaleString()} 💎</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Available:</Text>
                <Text style={styles.statAvailable}>{avail.toLocaleString()} 💎</Text>
              </View>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onCancel}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelText}>CANCEL</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.topUpBtn}
                onPress={onTopUp}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#F59E0B', '#D97706']}
                  style={styles.topUpGradient}
                >
                  <Text style={styles.topUpText}>RECHARGE NOW</Text>
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
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  cardGradient: {
    padding: 22,
    alignItems: 'center',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    marginBottom: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
  },
  statsCard: {
    width: '100%',
    backgroundColor: 'rgba(30, 41, 59, 0.55)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 6,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  statRequired: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '800',
  },
  statAvailable: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
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
  topUpBtn: {
    flex: 1.4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  topUpGradient: {
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topUpText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
});
