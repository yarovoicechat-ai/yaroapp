import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';

const OFFICIAL_ANNOUNCEMENTS = [
  {
    id: '1',
    title: 'Follow US and Win Big 🎁',
    subtitle: 'The key to Follow - awesome rewards are floating your way! Follow our official team handles and host parties to unlock daily rewards.',
    gradient: ['#EC4899', '#F43F5E'],
    date: 'Today 10:00 AM',
    actionText: 'Check details >',
  },
  {
    id: '2',
    title: 'Aap sabhi yaaron ko Mera dhanyavad ❤️',
    subtitle: 'Har weekend hum lekar aate hain naye exciting gifts aur coin rebate events! Stay tuned and keep spreading love in voice rooms.',
    gradient: ['#F59E0B', '#D97706'],
    date: 'Yesterday 8:00 PM',
    actionText: 'Check details >',
  },
  {
    id: '3',
    title: 'Yaro Official Community Announcement 📢',
    subtitle: 'Strict policy update: All edited/fake images and unverified sellers will face instant ban. Please report any suspicious activity to official support.',
    gradient: ['#6366F1', '#4F46E5'],
    date: 'Yesterday 3:00 AM',
    actionText: 'Check details >',
  },
  {
    id: '4',
    title: 'Voice Star Competition 2026 🌟',
    subtitle: 'Top 10 rooms with highest charm points win exclusive animated frames, entry vehicles, and verified badge for 30 days.',
    gradient: ['#8B5CF6', '#7C3AED'],
    date: '11/24/2026',
    actionText: 'Check details >',
  },
  {
    id: '5',
    title: 'Weekend Party Bonanza 🎉',
    subtitle: 'Get up to 30% extra coins on every recharge during weekend hours! Don\'t miss out on special room party boosts.',
    gradient: ['#10B981', '#059669'],
    date: '11/22/2026',
    actionText: 'Check details >',
  },
];

export default function YaroOfficialScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 16);

  const handleCardPress = (item) => {
    Alert.alert(item.title, item.subtitle);
  };

  const handleViewGuide = () => {
    Alert.alert(
      'Yaro Official Guide',
      'This channel delivers verified platform updates, community guidelines, security notices, and official platform events. Always check here for verified news.'
    );
  };

  return (
    <View style={[styles.container, { paddingTop: topSafeInset }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yaro Official</Text>
        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {OFFICIAL_ANNOUNCEMENTS.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            activeOpacity={0.9}
            onPress={() => handleCardPress(item)}
          >
            {/* Banner Header Gradient */}
            <LinearGradient
              colors={item.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardBanner}
            >
              <Text style={styles.bannerEmoji}>📢</Text>
              <Text style={styles.bannerTitle} numberOfLines={1}>
                {item.title}
              </Text>
            </LinearGradient>

            <View style={styles.cardBody}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.dateText}>{item.date}</Text>
                <Text style={styles.actionLink}>{item.actionText}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sticky Bottom View guide Button */}
      <View style={[styles.bottomBar, { paddingBottom: bottomPadding }]}>
        <TouchableOpacity
          style={styles.guideBtn}
          onPress={handleViewGuide}
          activeOpacity={0.85}
        >
          <Text style={styles.guideBtnText}>View guide</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  headerRightSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardBanner: {
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  bannerEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  cardBody: {
    padding: 16,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 6,
  },
  itemSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  dateText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  actionLink: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingTop: 12,
    paddingHorizontal: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
  },
  guideBtn: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  guideBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
