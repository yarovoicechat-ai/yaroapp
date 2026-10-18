import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function RankingRulesModal({ visible, onClose, styles }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.infoModalCard}>
          <View style={styles.infoModalHeader}>
            <MaterialCommunityIcons name="trophy-award" size={26} color="#F59E0B" />
            <Text style={styles.infoModalTitle}>Ranking Rules & Rewards</Text>
          </View>
          <Text style={styles.infoModalDesc}>
            • <Text style={{ fontWeight: '700' }}>Honor:</Text> Points calculated from diamonds gifted in voice rooms & calls.{ '\n\n' }
            • <Text style={{ fontWeight: '700' }}>Charm:</Text> Beans received from fans & listeners.{ '\n\n' }
            • <Text style={{ fontWeight: '700' }}>Room:</Text> Total party room heat & active listener gifts.{ '\n\n' }
            • Top 3 champions receive exclusive Avatar Frames, Sovereign SVIP badges, and diamond bonuses at 23:59pm!
          </Text>
          <TouchableOpacity style={styles.infoModalCloseBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.infoModalCloseText}>Got It!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
