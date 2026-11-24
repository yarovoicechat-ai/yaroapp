import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Linking,
  DeviceEventEmitter,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon from 'react-native-vector-icons/Ionicons';
import { clearAuthSession } from '../utils/authSession';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function BanModal() {
  const [visible, setVisible] = useState(false);
  const [banData, setBanData] = useState(null);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('AUTH_BANNED_EVENT', (data) => {
      if (data) {
        setBanData(data);
        setVisible(true);
      }
    });

    const logoutSub = DeviceEventEmitter.addListener('AUTH_SESSION_EXPIRED_EVENT', () => {
      // Keep visible if caused by ban
    });

    return () => {
      sub.remove();
      logoutSub.remove();
    };
  }, []);

  if (!visible || !banData) return null;

  const targetType = banData.targetType || (banData.code === 'DEVICE_BANNED' ? 'DEVICE' : 'USER');
  const banType = banData.banType || banData.data?.banType || 'permanent';
  const reason = banData.reason || banData.data?.reason || banData.message || 'Suspended by platform administration';
  const bannedUntil = banData.bannedUntil || banData.data?.bannedUntil;
  const remainingTime = banData.remainingTime || banData.data?.remainingTime;

  const isPermanent = String(banType).toLowerCase() === 'permanent' || !bannedUntil;

  const handleAcknowledge = async () => {
    setVisible(false);
    if (targetType === 'USER') {
      await clearAuthSession({ notify: true });
    }
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@yaroapp.in?subject=Account%20Appeal').catch(() => {});
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header Icon */}
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons
              name={targetType === 'DEVICE' ? 'cellphone-lock' : 'account-cancel'}
              size={44}
              color="#EF4444"
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>
            {targetType === 'DEVICE' ? 'Device Restricted' : 'Account Suspended'}
          </Text>

          {/* Ban Type Badge */}
          <View style={styles.badgeRow}>
            <View style={[styles.badge, isPermanent ? styles.permBadge : styles.tempBadge]}>
              <Text style={[styles.badgeText, isPermanent ? styles.permText : styles.tempText]}>
                {isPermanent ? 'Permanent Suspension' : 'Temporary Suspension'}
              </Text>
            </View>
          </View>

          {/* Reason Box */}
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Reason for Restriction:</Text>
            <Text style={styles.reasonText}>{reason}</Text>
          </View>

          {/* Expiry Box for Temporary Ban */}
          {!isPermanent && (
            <View style={styles.expiryBox}>
              <View style={styles.expiryRow}>
                <Icon name="time-outline" size={16} color="#F59E0B" style={{ marginRight: 6 }} />
                <Text style={styles.expiryLabel}>Suspension Expires:</Text>
              </View>
              <Text style={styles.expiryValue}>
                {bannedUntil ? new Date(bannedUntil).toLocaleString() : 'Pending'}
              </Text>
              {remainingTime && (
                <Text style={styles.remainingText}>Remaining: {remainingTime}</Text>
              )}
            </View>
          )}

          {/* Explanation */}
          <Text style={styles.footerNote}>
            {targetType === 'DEVICE'
              ? 'This device installation has been restricted from accessing YARO services due to platform safety violations.'
              : 'Your account access has been restricted. You will be automatically restored once the suspension duration expires.'}
          </Text>

          {/* Action Buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.supportBtn}
              onPress={handleContactSupport}
              activeOpacity={0.8}
            >
              <Text style={styles.supportBtnText}>Contact Support</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={handleAcknowledge}
              activeOpacity={0.8}
            >
              <Text style={styles.closeBtnText}>I Understand</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: Math.min(SCREEN_WIDTH - 40, 380),
    backgroundColor: '#13111C',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    padding: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  badgeRow: {
    marginBottom: 16,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  permBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  permText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  tempBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  tempText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  infoBox: {
    width: '100%',
    backgroundColor: '#1E1B2E',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  infoLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '500',
    lineHeight: 18,
  },
  expiryBox: {
    width: '100%',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  expiryLabel: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '600',
  },
  expiryValue: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 2,
  },
  remainingText: {
    fontSize: 11,
    color: '#FCD34D',
    fontWeight: '500',
  },
  footerNote: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  supportBtn: {
    flex: 1,
    backgroundColor: '#1E1B2E',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  supportBtnText: {
    color: '#E5E7EB',
    fontSize: 13,
    fontWeight: '600',
  },
  closeBtn: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
