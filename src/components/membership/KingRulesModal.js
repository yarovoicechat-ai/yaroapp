import React from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';

const RULES = [
  'Nobility is valid for 30 days upon activation.',
  'As your rank advances through Viscount, Count, Marquis, Duke, and King, you unlock the 15 royal privileges shown in the membership grid.',
  'Bonus coins are credited once on each paid activation. Membership privileges last for 30 days.',
  'Custom Vanity IDs, Animated Badges, and Anti-Kick protections remain active throughout your subscription duration.',
];

export default function KingRulesModal({ visible, onClose, styles }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.rulesModalCard}>
          <LinearGradient colors={['#1F1306', '#0C0702']} style={styles.rulesModalGradient}>
            <View style={styles.rulesHeader}>
              <Text style={styles.rulesTitle}>King of Kings Nobility Rules</Text>
              <TouchableOpacity onPress={onClose}>
                <Icon name="close" size={22} color="#FDE047" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              {RULES.map((rule, index) => <Text key={rule} style={styles.ruleItem}>{index + 1}. {rule}</Text>)}
            </ScrollView>
          </LinearGradient>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
