import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  Platform,
  View as ScreenBackgroundView,
  StatusBar as ScreenBackgroundStatusBar,
  StyleSheet as ScreenBackgroundStyleSheet
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { RFValue } from 'react-native-responsive-fontsize';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';

const { width } = Dimensions.get('window');

const LEVEL_RULES = [
  { level: 1, name: 'Basic', calls: 80, minutes: 120, rate: 25, badgeColor: '#94A3B8' },
  { level: 2, name: 'Copper', calls: 110, minutes: 200, rate: 30, badgeColor: '#B45309' },
  { level: 3, name: 'Bronze', calls: 160, minutes: 330, rate: 36, badgeColor: '#CD7F32', isPromo: true },
  { level: 4, name: 'Silver', calls: 220, minutes: 500, rate: 42, badgeColor: '#94A3B8' },
  { level: 5, name: 'Gold', calls: 300, minutes: 700, rate: 48, badgeColor: '#EAB308' },
  { level: 6, name: 'Platinum', calls: 400, minutes: 950, rate: 54, badgeColor: '#38BDF8' },
  { level: 7, name: 'Diamond', calls: 500, minutes: 1200, rate: 60, badgeColor: '#A855F7' },
  { level: 8, name: 'Grand Master', calls: 600, minutes: 1500, rate: 66, badgeColor: '#EC4899' },
];

const LevelHelp = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 24);

  return (
    <ScreenBackgroundView style={[{ flex: 1, backgroundColor: '#F8FAFC' }]}>
      <ScreenBackgroundStatusBar backgroundColor="#FFFFFF" barStyle="dark-content" animated />
      <LinearGradient colors={['#08031a', '#050212', '#020108']} style={ScreenBackgroundStyleSheet.absoluteFillObject} />
      <ScreenBackgroundStatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={[styles.container, { paddingTop: topSafeInset }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Level Upgrade Guide</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}>
          {/* 🌟 New Host 7-Day Offer Banner */}
          <LinearGradient
            colors={['#FFD700', '#FF8C00', '#FF2D87']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.promoBorder}
          >
            <LinearGradient
              colors={['rgba(28, 14, 54, 0.95)', 'rgba(12, 5, 26, 0.95)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.promoCard}
            >
              <View style={styles.promoHeaderRow}>
                <View style={styles.fireIconWrap}>
                  <Icon name="local-fire-department" size={24} color="#FFD700" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.promoTitle}>🎁 New Host 7-Day Welcome Level</Text>
                  <Text style={styles.promoDesc}>
                    All new hosts are automatically granted <Text style={styles.boldGold}>Level 3 (Bronze)</Text> for their first 7 days!
                  </Text>
                </View>
              </View>

              <View style={styles.promoDivider} />

              <Text style={styles.promoNote}>
                ⚡ After 7 days, your level will automatically update based on your actual performance (calls & minutes) starting from Level 1.
              </Text>
            </LinearGradient>
          </LinearGradient>

          {/* How to Upgrade Section */}
          <View style={styles.sectionHeader}>
            <Icon name="trending-up" size={20} color="#03dcfe" style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>How to Upgrade Your Level</Text>
          </View>

          <View style={styles.stepsContainer}>
            <View style={styles.stepCard}>
              <View style={[styles.stepNumBadge, { backgroundColor: '#3B82F6' }]}>
                <Text style={styles.stepNumText}>1</Text>
              </View>
              <View style={styles.stepInfo}>
                <Text style={styles.stepTitle}>Receive Voice & Video Calls</Text>
                <Text style={styles.stepSub}>Accept incoming calls to increase your completed call count.</Text>
              </View>
            </View>

            <View style={styles.stepCard}>
              <View style={[styles.stepNumBadge, { backgroundColor: '#A855F7' }]}>
                <Text style={styles.stepNumText}>2</Text>
              </View>
              <View style={styles.stepInfo}>
                <Text style={styles.stepTitle}>Accumulate Call Duration</Text>
                <Text style={styles.stepSub}>Engage in longer conversations to build total active call minutes.</Text>
              </View>
            </View>

            <View style={styles.stepCard}>
              <View style={[styles.stepNumBadge, { backgroundColor: '#10B981' }]}>
                <Text style={styles.stepNumText}>3</Text>
              </View>
              <View style={styles.stepInfo}>
                <Text style={styles.stepTitle}>Earn Higher Coins Per Minute</Text>
                <Text style={styles.stepSub}>As you advance to higher levels, your earning rate per minute increases up to 66 Coins/Min!</Text>
              </View>
            </View>
          </View>

          {/* Complete Level Rates Table */}
          <View style={styles.sectionHeader}>
            <Icon name="stars" size={20} color="#FFD700" style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>Level Earnings & Requirements</Text>
          </View>

          <View style={styles.tableCard}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.thText, { flex: 1.2 }]}>Level</Text>
              <Text style={[styles.thText, { flex: 1 }]}>Min Calls</Text>
              <Text style={[styles.thText, { flex: 1 }]}>Min Time</Text>
              <Text style={[styles.thText, { flex: 1.2, textAlign: 'right' }]}>Rate / Min</Text>
            </View>

            {LEVEL_RULES.map((item, idx) => (
              <View key={idx} style={[styles.tableBodyRow, item.isPromo && styles.promoTableRow]}>
                <View style={[styles.tdCol, { flex: 1.2, flexDirection: 'row', alignItems: 'center' }]}>
                  <View style={[styles.lvlBadge, { backgroundColor: item.badgeColor }]}>
                    <Text style={styles.lvlBadgeText}>Lv.{item.level}</Text>
                  </View>
                  <Text style={styles.tdNameText} numberOfLines={1}>{item.name}</Text>
                </View>

                <Text style={[styles.tdText, { flex: 1 }]}>{item.calls} Calls</Text>
                <Text style={[styles.tdText, { flex: 1 }]}>{item.minutes} Mins</Text>
                <Text style={[styles.tdRateText, { flex: 1.2, textAlign: 'right' }]}>
                  {item.rate} Coins
                </Text>
              </View>
            ))}
          </View>

          {/* Tips Footer */}
          <View style={styles.tipsCard}>
            <Icon name="lightbulb" size={20} color="#FFD700" style={{ marginRight: 8 }} />
            <Text style={styles.tipsText}>
              <Text style={{ fontWeight: 'bold', color: '#FFD700' }}>Pro Tip: </Text>
              Keep your profile online during peak hours to receive more calls and fast-track your level upgrade!
            </Text>
          </View>
        </ScrollView>
      </View>
    </ScreenBackgroundView>
  );
};

export default LevelHelp;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: width * 0.04,
    height: 48,
    marginBottom: 8,
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: RFValue(17),
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: width * 0.04,
  },
  promoBorder: {
    borderRadius: 18,
    padding: 1.5,
    marginBottom: 20,
  },
  promoCard: {
    padding: 16,
    borderRadius: 17,
  },
  promoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fireIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  promoTitle: {
    color: '#FFD700',
    fontSize: RFValue(13),
    fontWeight: 'bold',
    marginBottom: 2,
  },
  promoDesc: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: RFValue(11),
    lineHeight: 16,
  },
  boldGold: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  promoDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 12,
  },
  promoNote: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: RFValue(10.5),
    lineHeight: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: RFValue(14),
    fontWeight: 'bold',
  },
  stepsContainer: {
    gap: 10,
    marginBottom: 20,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 14,
  },
  stepNumBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: RFValue(13),
  },
  stepInfo: {
    flex: 1,
  },
  stepTitle: {
    color: '#ffffff',
    fontSize: RFValue(12.5),
    fontWeight: 'bold',
    marginBottom: 2,
  },
  stepSub: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: RFValue(10.5),
    lineHeight: 14,
  },
  tableCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 14,
    marginBottom: 20,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 10,
    marginBottom: 6,
  },
  thText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: RFValue(11),
    fontWeight: 'bold',
  },
  tableBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  promoTableRow: {
    backgroundColor: 'rgba(255, 215, 0, 0.06)',
    borderRadius: 10,
    paddingHorizontal: 6,
  },
  tdCol: {},
  lvlBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 6,
  },
  lvlBadgeText: {
    color: '#ffffff',
    fontSize: RFValue(9.5),
    fontWeight: 'bold',
  },
  tdNameText: {
    color: '#ffffff',
    fontSize: RFValue(11),
    fontWeight: '600',
  },
  tdText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: RFValue(11),
  },
  tdRateText: {
    color: '#FFD700',
    fontSize: RFValue(11.5),
    fontWeight: 'bold',
  },
  tipsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    padding: 14,
  },
  tipsText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: RFValue(11),
    flex: 1,
    lineHeight: 16,
  },
});
