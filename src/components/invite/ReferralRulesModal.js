import React from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

const RULES = [
  {
    title: 'New User Welcome Bonus (+5 Coins)',
    description: 'Every newly registered user receives 5 FREE Welcome Coins guaranteed upon signing up on Yaro!',
  },
  {
    title: 'Step 1: Sign-Up Reward (+3 Coins)',
    description: 'When your friend installs Yaro and signs up with your referral link or code, you receive +3 Coins immediately!',
  },
  {
    title: 'Step 2: Recharge Reward (+2 Coins)',
    description: 'When your invited friend completes their recharge in Yaro, you receive an additional +2 Coins bonus!',
  },
  {
    title: 'Total Reward (5 Coins per Friend)',
    description: 'You earn up to 5 Coins total per referred friend (3 Coins on signup + 2 Coins on recharge). Friends also receive 5 Welcome Coins!',
  },
  {
    title: 'Anti-Fraud & Fair Play Policy',
    description: 'Self-referrals, duplicate accounts, or multiple registrations on the same device are strictly prohibited and automatically blocked by security filters.',
  },
];

export default function ReferralRulesModal({ visible, onClose, bottomInset, styles }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { paddingBottom: Math.max(18, (bottomInset || 0) + 12) }]}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleRow}>
              <Icon name="gavel" size={20} color="#D97706" style={{ marginRight: 6 }} />
              <Text style={styles.modalTitle}>Referral System Rules</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <Icon name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {RULES.map((rule, index) => (
              <View key={rule.title} style={styles.ruleItem}>
                <View style={styles.ruleNumBadge}><Text style={styles.ruleNumText}>{index + 1}</Text></View>
                <View style={styles.ruleTextWrap}>
                  <Text style={styles.ruleItemTitle}>{rule.title}</Text>
                  <Text style={styles.ruleItemDesc}>{rule.description}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.modalDoneBtn} onPress={onClose} activeOpacity={0.85}>
            <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.modalDoneGradient}>
              <Text style={styles.modalDoneText}>I Understand</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
