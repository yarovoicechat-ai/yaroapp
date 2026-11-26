import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';

const EVENTS_LIST = [
  {
    id: '1',
    title: 'Carrom Championship 🎯',
    tag: 'Game Arena',
    status: 'In Progress 🟢',
    description: 'Play live Carrom with friends in voice party rooms! Compete for the weekly 100,000 diamond pool prize.',
    gradient: ['#3B82F6', '#1D4ED8'],
    date: 'Active until Sunday',
  },
  {
    id: '2',
    title: 'Blind Date Audio Party ❤️',
    tag: 'Party Event',
    status: 'In Progress 🟢',
    description: 'Find your romantic partner on 8-seat audio stage! Confess feelings, send couple gifts, and activate CP space.',
    gradient: ['#EC4899', '#DB2777'],
    date: 'Daily 8:00 PM - 12:00 AM',
  },
  {
    id: '3',
    title: 'Truth Or Dare Showdown 🎲',
    tag: 'Fun Game',
    status: 'Daily Event ⚡',
    description: 'Exciting questions and hilarious dares on microphone! Spin the wheel and challenge your friends.',
    gradient: ['#8B5CF6', '#6D28D9'],
    date: 'Always Available',
  },
  {
    id: '4',
    title: 'Voice Idol Singing Contest 🎤',
    tag: 'Talent Show',
    status: 'Upcoming 🕒',
    description: 'Showcase your vocal talents! Top singers voted by audience with gifts receive exclusive SVIP & Crown avatar frame.',
    gradient: ['#F59E0B', '#B45309'],
    date: 'Starts Next Monday',
  },
  {
    id: '5',
    title: 'Lucky Wheel Jackpot 🎡',
    tag: 'Reward Pool',
    status: 'In Progress 🟢',
    description: 'Spin the wheel daily for a chance to win up to 50,000 gold coins, take-mic cards, and rare room themes.',
    gradient: ['#10B981', '#047857'],
    date: 'Daily Spins Available',
  },
];

export default function EventScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 16);

  const handleCardPress = (event) => {
    Alert.alert(event.title, `${event.description}\n\nSchedule: ${event.date}`);
  };

  const handleUserGuide = () => {
    Alert.alert(
      'Events Guide',
      'Participate in platform activities, voice room games, and talent contests to earn diamonds, badges, and recognition on the weekly leaderboard!'
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
        <Text style={styles.headerTitle}>Event</Text>
        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {EVENTS_LIST.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            activeOpacity={0.9}
            onPress={() => handleCardPress(item)}
          >
            <LinearGradient
              colors={item.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardBanner}
            >
              <View style={styles.tagBadge}>
                <Text style={styles.tagBadgeText}>{item.tag}</Text>
              </View>
              <Text style={styles.bannerTitle}>{item.title}</Text>
              <Text style={styles.statusText}>{item.status}</Text>
            </LinearGradient>

            <View style={styles.cardBody}>
              <Text style={styles.cardDescription}>{item.description}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.scheduleText}>{item.date}</Text>
                <Text style={styles.actionLink}>Check details &gt;</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sticky Bottom User guide Button */}
      <View style={[styles.bottomBar, { paddingBottom: bottomPadding }]}>
        <TouchableOpacity
          style={styles.guideBtn}
          onPress={handleUserGuide}
          activeOpacity={0.85}
        >
          <Text style={styles.guideBtnText}>User guide</Text>
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
    position: 'relative',
  },
  tagBadge: {
    position: 'absolute',
    top: 10,
    left: 12,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tagBadgeText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#E0E7FF',
    fontWeight: '600',
  },
  cardBody: {
    padding: 16,
  },
  cardDescription: {
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
  scheduleText: {
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
