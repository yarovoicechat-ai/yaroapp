import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import FanClubBadge from './FanClubBadge';

const { width } = Dimensions.get('window');

const BADGE_ROWS = [
  {
    gradeName: 'Bronze (I–III)',
    expDesc: '0 ~ 40K Exp',
    badges: [
      { exp: 5000, label: 'Bronze 1 (0-10k)' },
      { exp: 15000, label: 'Bronze 2 (10k-20k)' },
      { exp: 30000, label: 'Bronze 3 (20k-40k)' },
    ],
  },
  {
    gradeName: 'Silver (I–III)',
    expDesc: '40K ~ 170K Exp',
    badges: [
      { exp: 55000, label: 'Silver 1 (40k-70k)' },
      { exp: 90000, label: 'Silver 2 (70k-110k)' },
      { exp: 140000, label: 'Silver 3 (110k-170k)' },
    ],
  },
  {
    gradeName: 'Gold (I–III)',
    expDesc: '170K ~ 500K Exp',
    badges: [
      { exp: 200000, label: 'Gold 1 (170k-240k)' },
      { exp: 300000, label: 'Gold 2 (240k-350k)' },
      { exp: 420000, label: 'Gold 3 (350k-500k)' },
    ],
  },
  {
    gradeName: 'Platinum (I–III)',
    expDesc: '500K ~ 1.5M Exp',
    badges: [
      { exp: 600000, label: 'Platinum 1 (500k-700k)' },
      { exp: 850000, label: 'Platinum 2 (700k-1M)' },
      { exp: 1250000, label: 'Platinum 3 (1M-1.5M)' },
    ],
  },
  {
    gradeName: 'Diamond (I–III)',
    expDesc: '1.5M ~ 2CR+ Exp',
    badges: [
      { exp: 2000000, label: 'Diamond 1 (1.5M-2.5M)' },
      { exp: 5000000, label: 'Diamond 2 (2.5M-1CR)' },
      { exp: 15000000, label: 'Diamond 3 (1CR-2CR+)' },
    ],
  },
];

export default function FanClubIntroModal({ visible, onClose, topSafeInset = 35 }) {
  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Golden Header matching screenshot */}
        <View style={[styles.header, { paddingTop: topSafeInset + 8 }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Icon name="chevron-back" size={26} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Group introduction</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          style={styles.scrollBody}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Title */}
          <Text style={styles.sectionTitleCenter}>Group introduction</Text>

          {/* Section 1: What is group? */}
          <Text style={styles.itemHeading}>What is group?</Text>
          <Text style={styles.itemBody}>
            Group is formed by room owner and room members. If you join a group, you will
            achieve group member badge, and will get attention from room owner. You also can
            know more friends.
          </Text>

          {/* Section 2: How to join the group? */}
          <Text style={styles.itemHeading}>How to join the group?</Text>
          <Text style={styles.itemBody}>
            Click &quot;Fan Club&quot; in the live room, click &quot;Join&quot; to join the group
            and become group member.
          </Text>

          {/* Section 3: Group privilege */}
          <Text style={styles.itemHeading}>Group privilege</Text>
          <Text style={styles.itemBody}>
            Different Exp will achieve different badge. Exp increases with gift sending (1
            Diamond = 1 Exp) and staying in the room (1 Min = 10 Exp).
          </Text>

          {/* Badge Table Container (Exact Layout from screenshot) */}
          <View style={styles.tableCard}>
            {/* Table Header */}
            <View style={styles.tableHeaderRow}>
              <View style={styles.colGrade}>
                <Text style={styles.tableHeaderText}>Grade</Text>
              </View>
              <View style={styles.colBadge}>
                <Text style={styles.tableHeaderText}>Badge</Text>
              </View>
            </View>

            {/* Table Rows */}
            {BADGE_ROWS.map((row, idx) => (
              <View
                key={row.gradeName}
                style={[
                  styles.tableDataRow,
                  idx % 2 === 1 && { backgroundColor: '#F8FAFC' },
                ]}
              >
                <View style={styles.colGrade}>
                  <Text style={styles.gradeTitleText}>{row.gradeName}</Text>
                  <Text style={styles.gradeExpSubtitle}>{row.expDesc}</Text>
                </View>

                <View style={[styles.colBadge, styles.badgesRow]}>
                  {row.badges.map((b) => (
                    <View key={b.label} style={styles.badgeItemWrap}>
                      <FanClubBadge exp={b.exp} size={34} />
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>

          {/* Footer Note */}
          <Text style={styles.footerNote}>More privileges coming soon</Text>
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 20,
  },
  sectionTitleCenter: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 20,
  },
  itemHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 14,
    marginBottom: 6,
  },
  itemBody: {
    fontSize: 13.5,
    color: '#475569',
    lineHeight: 21,
  },
  tableCard: {
    marginTop: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
  },
  tableHeaderText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  tableDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  colGrade: {
    width: '42%',
    justifyContent: 'center',
  },
  colBadge: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeTitleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  gradeExpSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    gap: 8,
  },
  badgeItemWrap: {
    alignItems: 'center',
  },
  footerNote: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 24,
  },
});
