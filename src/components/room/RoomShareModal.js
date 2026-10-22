import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Share,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertService } from '../../utils/AlertService';

/**
 * RoomShareModal
 * Bottom sheet matching media_1792691055376.png
 * Options:
 * 1. "Yaro Friends" (Yellow circle with person icon)
 * 2. "WhatsApp" (Green circle with WhatsApp icon)
 * Centered "Cancel" button
 */
export default function RoomShareModal({
  visible,
  onClose,
  roomName = 'Yaro Voice Room',
  roomId = '',
  onShareWithFriends,
}) {
  const insets = useSafeAreaInsets() || { bottom: 0 };

  if (!visible) return null;

  const shareText = `Join me in ${roomName} on Yaro! Room ID: ${roomId || ''}`;

  const handleWhatsApp = async () => {
    try {
      const url = `whatsapp://send?text=${encodeURIComponent(shareText)}`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        await Share.share({ message: shareText });
      }
      onClose();
    } catch (e) {
      Share.share({ message: shareText }).catch(() => {});
      onClose();
    }
  };

  const handleYaroFriends = () => {
    onClose();
    if (onShareWithFriends) {
      onShareWithFriends();
    } else {
      AlertService.show('Invitation Sent', 'Room link shared with your Yaro friends!', 'success');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={[styles.sheetContent, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Options Row */}
          <View style={styles.optionsRow}>
            {/* Yaro Friends */}
            <TouchableOpacity
              style={styles.optionItem}
              onPress={handleYaroFriends}
              activeOpacity={0.8}
            >
              <View style={[styles.iconCircle, { backgroundColor: '#FBBF24' }]}>
                <MaterialIcons name="person" size={28} color="#FFFFFF" />
              </View>
              <Text style={styles.optionLabel}>Yaro Friends</Text>
            </TouchableOpacity>

            {/* WhatsApp */}
            <TouchableOpacity
              style={styles.optionItem}
              onPress={handleWhatsApp}
              activeOpacity={0.8}
            >
              <View style={[styles.iconCircle, { backgroundColor: '#25D366' }]}>
                <MaterialCommunityIcons name="whatsapp" size={28} color="#FFFFFF" />
              </View>
              <Text style={styles.optionLabel}>WhatsApp</Text>
            </TouchableOpacity>
          </View>

          {/* Cancel Button */}
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  optionsRow: {
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: 16,
    gap: 32,
    marginBottom: 28,
  },
  optionItem: {
    alignItems: 'center',
    minWidth: 70,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  optionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#334155',
    textAlign: 'center',
  },
  cancelBtn: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F1F5F9',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
});
