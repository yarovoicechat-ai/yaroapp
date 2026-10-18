import React from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

const RULES = [
  {
    title: 'New User Welcome Reward (+100 Diamonds)',
    description: 'When a new user registers using your valid referral link/code, they receive +100 FREE Welcome Diamonds instantly!',
  },
  {
    title: 'Referrer Bonus (+50 Total Beans)',
    description: "The referrer receives +25 Beans on friend's signup + +25 Beans when friend completes 5 minutes (300s) of calls.",
  },
  {
    title: 'Maximum Reward Limit (50 Beans)',
    description: 'The maximum reward per referred friend is exactly 50 Beans (25 Beans on signup + 25 Beans on call milestone). No Diamonds are awarded.',
  },
  {
    title: 'Anti-Fraud & Self-Referral Policy',
    description: 'Self-referrals, fake accounts, or multiple registrations on the same device are automatically detected and blocked by security audits.',
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
              <Text style={styles.modalTitle}>Referral System Rules (à¤¨à¤¿à¤¯à¤®)</Text>
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
              <Text style={styles.modalDoneText}>I Understand (à¤¸à¤®à¤ à¤—à¤¯à¤¾)</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
