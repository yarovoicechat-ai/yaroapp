import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export default function CreateActionModal({ visible, onClose }) {
  const navigation = useNavigation();

  const handleAction = (route, params) => {
    onClose();
    setTimeout(() => {
      navigation.navigate(route, params);
    }, 200);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.sheetContainer}>
          <View style={styles.handleBar} />
          <Text style={styles.sheetTitle}>Create & Connect</Text>
          <Text style={styles.sheetSubtitle}>Choose how you want to share with the Yaro community</Text>

          <View style={styles.cardsRow}>
            {/* 1. Voice Party */}
            <TouchableOpacity
              style={styles.actionCard}
              activeOpacity={0.88}
              onPress={() => handleAction('VoiceRoom', {})}
            >
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED']}
                style={styles.iconBox}
              >
                <Icon name="mic" size={28} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.cardTitle}>Voice Party</Text>
              <Text style={styles.cardSub}>Host a multi-speaker club room</Text>
            </TouchableOpacity>

            {/* 2. Live Stream */}
            <TouchableOpacity
              style={styles.actionCard}
              activeOpacity={0.88}
              onPress={() => handleAction('LiveStream', { isHost: true })}
            >
              <LinearGradient
                colors={['#EC4899', '#DB2777']}
                style={styles.iconBox}
              >
                <Icon name="videocam" size={28} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.cardTitle}>Go Live</Text>
              <Text style={styles.cardSub}>Start real-time video stream</Text>
            </TouchableOpacity>

            {/* 3. Short Video */}
            <TouchableOpacity
              style={styles.actionCard}
              activeOpacity={0.88}
              onPress={() => handleAction('UploadShort')}
            >
              <LinearGradient
                colors={['#06B6D4', '#0891B2']}
                style={styles.iconBox}
              >
                <Icon name="film" size={28} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.cardTitle}>Short Video</Text>
              <Text style={styles.cardSub}>Post a 60s video clip</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 20,
    paddingBottom: 32,
    alignItems: 'center',
  },
  handleBar: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  sheetSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 20,
    textAlign: 'center',
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 10,
    marginBottom: 20,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  iconBox: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3,
    textAlign: 'center',
  },
  cardSub: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 13,
  },
  cancelBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
});
