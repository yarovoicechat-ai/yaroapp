import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';

const RULES_DATA = [
  {
    id: '1',
    number: '01',
    title: 'Be Respectful',
    description: 'Treat every host and participant with kindness, courtesy, and respect.',
    iconName: 'heart',
    iconColor: '#EC4899',
    bgColor: '#FDF2F8',
  },
  {
    id: '2',
    number: '02',
    title: 'Zero Harassment',
    description: 'Abusive language, hate speech, bullying, or intimidation is strictly forbidden.',
    iconName: 'ban',
    iconColor: '#EF4444',
    bgColor: '#FEF2F2',
  },
  {
    id: '3',
    number: '03',
    title: 'No Explicit Content',
    description: 'Nudity, sexual solicitation, and adult content will trigger instant account bans.',
    iconName: 'close-circle',
    iconColor: '#F59E0B',
    bgColor: '#FFFBEB',
  },
  {
    id: '4',
    number: '04',
    title: 'Authentic Identity',
    description: 'Impersonating another person, celebrity, or using fraudulent avatars is prohibited.',
    iconName: 'person-remove',
    iconColor: '#8B5CF6',
    bgColor: '#F5F3FF',
  },
  {
    id: '5',
    number: '05',
    title: 'No Illegal Activity or Scams',
    description: 'Financial scams, unauthorized payment solicitations, and malware are zero tolerance.',
    iconName: 'warning',
    iconColor: '#DC2626',
    bgColor: '#FEF2F2',
  },
  {
    id: '6',
    number: '06',
    title: 'Follow Community Trust Standards',
    description: 'Continuous violations lead to automatic suspension, coin forfeiture, and device bans.',
    iconName: 'shield-checkmark',
    iconColor: '#10B981',
    bgColor: '#ECFDF5',
  },
];

export default function Rules() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const isSmall = width < 360;
  const isTablet = width >= 600;
  const isLandscape = width > height;
  const contentMaxWidth = isTablet ? 600 : '100%';

  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 28);

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* Responsive Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topSafeInset + (isSmall ? 6 : 10),
            paddingLeft: Math.max(isSmall ? 12 : 16, insets.left),
            paddingRight: Math.max(isSmall ? 12 : 16, insets.right),
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.backButton, isSmall && styles.backButtonSmall]}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <Icon name="chevron-back" size={isSmall ? 22 : 24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isSmall && styles.headerTitleSmall]}>
          Rules & Guidelines
        </Text>
        <View style={isSmall ? styles.headerPlaceholderSmall : styles.headerPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: bottomPadding,
            paddingLeft: Math.max(isSmall ? 12 : 16, insets.left),
            paddingRight: Math.max(isSmall ? 12 : 16, insets.right),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.responsiveWrapper, { maxWidth: contentMaxWidth }]}>
          {/* Hero Trust Banner */}
          <LinearGradient
            colors={['#7C3AED', '#4F46E5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.heroCard,
              isSmall && styles.heroCardSmall,
              isTablet && styles.heroCardTablet,
            ]}
          >
            <View style={[styles.heroIconBox, isSmall && styles.heroIconBoxSmall]}>
              <Icon name="shield-checkmark" size={isSmall ? 26 : 32} color="#FFFFFF" />
            </View>
            <View style={styles.heroTextCol}>
              <Text style={[styles.heroTitle, isSmall && styles.heroTitleSmall]}>
                A Safe & Welcoming Community
              </Text>
              <Text style={[styles.heroSubtitle, isSmall && styles.heroSubtitleSmall]}>
                Together we keep Yaro friendly, exciting, and respectful for every member.
              </Text>
            </View>
          </LinearGradient>

          {/* Rule Items */}
          <View style={styles.rulesList}>
            {RULES_DATA.map(rule => (
              <View
                key={rule.id}
                style={[styles.ruleCard, isSmall && styles.ruleCardSmall]}
              >
                <View
                  style={[
                    styles.ruleIconWrapper,
                    isSmall && styles.ruleIconWrapperSmall,
                    { backgroundColor: rule.bgColor },
                  ]}
                >
                  <Icon name={rule.iconName} size={isSmall ? 19 : 22} color={rule.iconColor} />
                </View>
                <View style={styles.ruleTextContainer}>
                  <View style={styles.ruleHeaderRow}>
                    <Text
                      style={[styles.ruleTitle, isSmall && styles.ruleTitleSmall]}
                      numberOfLines={1}
                    >
                      {rule.title}
                    </Text>
                    <Text style={[styles.ruleNumber, isSmall && styles.ruleNumberSmall]}>
                      {rule.number}
                    </Text>
                  </View>
                  <Text
                    style={[styles.ruleDescription, isSmall && styles.ruleDescriptionSmall]}
                    numberOfLines={3}
                  >
                    {rule.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Bottom Helpful Note Pill */}
          <View style={[styles.bottomPill, isSmall && styles.bottomPillSmall]}>
            <Icon
              name="information-circle"
              size={isSmall ? 16 : 18}
              color="#2563EB"
              style={{ marginRight: 8 }}
            />
            <Text style={[styles.bottomPillText, isSmall && styles.bottomPillTextSmall]}>
              Violations may result in warnings, temporary timeouts, or permanent device bans.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  backButtonSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerTitleSmall: {
    fontSize: 16,
  },
  headerPlaceholder: {
    width: 40,
  },
  headerPlaceholderSmall: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
  },
  responsiveWrapper: {
    width: '100%',
    alignSelf: 'center',
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  heroCardSmall: {
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
  },
  heroCardTablet: {
    borderRadius: 28,
    padding: 24,
  },
  heroIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  heroIconBoxSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  heroTextCol: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroTitleSmall: {
    fontSize: 14.5,
  },
  heroSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 17,
  },
  heroSubtitleSmall: {
    fontSize: 11,
    lineHeight: 15.5,
  },
  rulesList: {
    marginBottom: 12,
  },
  ruleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#64748B',
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  ruleCardSmall: {
    borderRadius: 16,
    paddingVertical: 11,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  ruleIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  ruleIconWrapperSmall: {
    width: 38,
    height: 38,
    borderRadius: 13,
    marginRight: 10,
  },
  ruleTextContainer: {
    flex: 1,
  },
  ruleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  ruleTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
    flexShrink: 1,
    marginRight: 8,
  },
  ruleTitleSmall: {
    fontSize: 13.5,
  },
  ruleNumber: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
  },
  ruleNumberSmall: {
    fontSize: 10,
  },
  ruleDescription: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },
  ruleDescriptionSmall: {
    fontSize: 11,
    lineHeight: 15,
  },
  bottomPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginBottom: 10,
  },
  bottomPillSmall: {
    borderRadius: 13,
    paddingVertical: 10,
    paddingHorizontal: 11,
  },
  bottomPillText: {
    flex: 1,
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
    lineHeight: 17,
  },
  bottomPillTextSmall: {
    fontSize: 11,
    lineHeight: 15,
  },
});
