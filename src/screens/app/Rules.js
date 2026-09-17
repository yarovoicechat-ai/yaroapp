import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';

const RULES_DATA = [
  {
    id: '1',
    title: '1. Be Respectful',
    description: 'Treat everyone with kindness and respect.',
    iconName: 'heart',
    iconType: 'ion',
    iconColor: '#EF4444',
    bgColor: '#FEE2E2',
  },
  {
    id: '2',
    title: '2. No Harassment',
    description: 'Do not use abusive, hateful or offensive language.',
    iconName: 'ban',
    iconType: 'ion',
    iconColor: '#EF4444',
    bgColor: '#FEE2E2',
  },
  {
    id: '3',
    title: '3. No Sexual Content',
    description: 'Nudity, explicit content or sexual solicitation is not allowed.',
    iconName: 'close-circle',
    iconType: 'ion',
    iconColor: '#EF4444',
    bgColor: '#FEE2E2',
  },
  {
    id: '4',
    title: '4. No Fake Identity',
    description: 'Do not impersonate others or use fake information.',
    iconName: 'person-remove',
    iconType: 'ion',
    iconColor: '#EF4444',
    bgColor: '#FEE2E2',
  },
  {
    id: '5',
    title: '5. No Illegal Activities',
    description: 'Any illegal, harmful or scam activities are strictly prohibited.',
    iconName: 'warning',
    iconType: 'ion',
    iconColor: '#EF4444',
    bgColor: '#FEE2E2',
  },
  {
    id: '6',
    title: '6. Follow Community Guidelines',
    description: 'Repeated violations may result in a warning, suspension or permanent ban.',
    iconName: 'shield-checkmark',
    iconType: 'ion',
    iconColor: '#EF4444',
    bgColor: '#FEE2E2',
  },
];

export default function Rules() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 24);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topSafeInset > 0 ? 8 : 12 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Icon name="chevron-back" size={26} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rules & Guidelines</Text>
        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Banner */}
        <LinearGradient
          colors={['#F5F3FF', '#EDE9FE']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroIconContainer}>
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              style={styles.heroIconGradient}
            >
              <Icon name="shield-checkmark" size={36} color="#FFFFFF" />
            </LinearGradient>
          </View>
          <View style={styles.heroTextContainer}>
            <Text style={styles.heroTitle}>A Safe & Friendly Community</Text>
            <Text style={styles.heroSubtitle}>Let's make Yaro a better place together!</Text>
          </View>
        </LinearGradient>

        {/* Rule Items */}
        <View style={styles.rulesList}>
          {RULES_DATA.map((rule) => (
            <View key={rule.id} style={styles.ruleCard}>
              <View style={[styles.ruleIconWrapper, { backgroundColor: rule.bgColor }]}>
                <Icon name={rule.iconName} size={22} color={rule.iconColor} />
              </View>
              <View style={styles.ruleTextContainer}>
                <Text style={styles.ruleTitle}>{rule.title}</Text>
                <Text style={styles.ruleDescription}>{rule.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Bottom Helpful Note Pill */}
        <View style={styles.bottomPill}>
          <Text style={styles.bottomPillText}>
            Help us keep Yaro safe, fun and enjoyable for everyone!
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  headerRightSpacer: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  heroIconContainer: {
    marginRight: 14,
  },
  heroIconGradient: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  heroTextContainer: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#6D28D9',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
  },
  rulesList: {
    marginBottom: 16,
  },
  ruleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  ruleIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  ruleTextContainer: {
    flex: 1,
  },
  ruleTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  ruleDescription: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },
  bottomPill: {
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginTop: 4,
  },
  bottomPillText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
    textAlign: 'center',
  },
});
