import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';


const coinIcon = require('../../assets/coin.webp');

const SYSTEM_FILTER_TABS = [
  { id: 'all_messages', label: 'All Messages', icon: 'mail-outline' },
  { id: 'calls', label: 'Calls', icon: 'call-outline' },
  { id: 'gifts', label: 'Gifts', icon: 'gift-outline' },
  { id: 'system', label: 'System', icon: 'shield-checkmark-outline' },
];

const DUMMY_SYSTEM_NOTICES = [
  {
    id: 's1',
    title: 'Account Verified',
    badge: 'New',
    subtitle: 'Your account has been successfully verified. Enjoy all features now!',
    time: '2m ago',
    icon: 'shield-checkmark',
    iconColor: '#8B5CF6',
    iconBg: '#F3E8FF',
  },
  {
    id: 's2',
    title: 'Welcome Bonus',
    badge: 'New',
    subtitle: 'You’ve received 120 coins as a welcome bonus. Start connecting now!',
    time: '10m ago',
    icon: 'amber-coin',
    iconColor: '#D97706',
    iconBg: '#FEF3C7',
  },
  {
    id: 's3',
    title: 'Security Alert',
    badge: 'New',
    subtitle: 'A new login was detected from a new device. If this wasn’t you, please secure your account.',
    time: '1h ago',
    icon: 'shield-outline',
    iconColor: '#EF4444',
    iconBg: '#FEE2E2',
  },
  {
    id: 's4',
    title: 'Maintenance Update',
    badge: null,
    subtitle: 'We’ll be performing scheduled maintenance on May 10, 2025 from 02:00–04:00 (UTC).',
    time: 'May 9, 2025',
    icon: 'megaphone-outline',
    iconColor: '#A855F7',
    iconBg: '#F3E8FF',
  },
  {
    id: 's5',
    title: 'Level Up',
    badge: 'New',
    subtitle: 'Congratulations! You’ve reached Level 3. Unlock more features and meet more friends!',
    time: 'May 8, 2025',
    icon: 'stats-chart-outline',
    iconColor: '#10B981',
    iconBg: '#D1FAE5',
  },
  {
    id: 's6',
    title: 'Withdrawal Successful',
    badge: null,
    subtitle: 'Your withdrawal of $50.00 has been processed successfully.',
    time: 'May 7, 2025',
    icon: 'wallet-outline',
    iconColor: '#10B981',
    iconBg: '#D1FAE5',
  },
  {
    id: 's7',
    title: 'Terms Updated',
    badge: null,
    subtitle: 'Our Terms of Service have been updated. Please take a moment to review the changes.',
    time: 'May 5, 2025',
    icon: 'document-text-outline',
    iconColor: '#3B82F6',
    iconBg: '#DBEAFE',
  },
];

export default function SystemNoticeScreen() {
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 42);
  const navigation = useNavigation();
  const [activeFilter, setActiveFilter] = useState('system');

  const renderSystemItem = ({ item }) => (
    <TouchableOpacity activeOpacity={0.8} style={styles.cardWrapper}>
      <View style={[styles.specialIconBox, { backgroundColor: item.iconBg }]}>
        {item.icon === 'amber-coin' ? (
          <Image source={coinIcon} style={{ width: 24, height: 24 }} />
        ) : (
          <Icon name={item.icon} size={22} color={item.iconColor} />
        )}
      </View>

      <View style={styles.cardMainContent}>
        <View style={styles.nameAgeBadgeRow}>
          <Text style={styles.userNameText}>{item.title}</Text>
          {item.badge && (
            <View style={styles.newPurpleTagBadge}>
              <Text style={styles.newPurpleTagText}>{item.badge}</Text>
            </View>
          )}
        </View>
        <Text style={styles.systemNoticeBodyText} numberOfLines={2}>
          {item.subtitle}
        </Text>
      </View>

      <View style={styles.cardRightMeta}>
        <Text style={styles.timeAgoText}>{item.time}</Text>
        <Icon name="chevron-forward" size={18} color="#CBD5E1" style={{ marginTop: 6 }} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <LinearGradient colors={['#F8FAFC', '#F1F5F9', '#E2E8F0']} style={StyleSheet.absoluteFillObject} />
      {/* Top Header Bar */}
      <View style={[styles.topBarGroup, { paddingTop: topSafeInset + 4 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity
            style={styles.backBtnCircle}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Icon name="arrow-back" size={20} color="#1E293B" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.langPillBtn} activeOpacity={0.8}>
            <Icon name="language-outline" size={17} color="#1E293B" />
            <Text style={styles.langPillValText}>English</Text>
            <Icon name="chevron-down" size={14} color="#64748B" />
          </TouchableOpacity>
        </View>

        <View style={styles.rightActionsGroup}>
          <TouchableOpacity
            style={styles.coinBalancePillCard}
            onPress={() => navigation.navigate('Recharge')}
            activeOpacity={0.8}
          >
            <Image source={coinIcon} style={styles.coinIconImg} resizeMode="contain" />
            <Text style={styles.coinValText}>120</Text>
            <View style={styles.plusIconBadgeCircle}>
              <Icon name="add" size={10} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.bellButtonCircle} activeOpacity={0.8}>
            <Icon name="notifications-outline" size={19} color="#1E293B" />
            <View style={styles.redBadgeDotSmall} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Title */}
      <View style={styles.mainTitleRow}>
        <View>
          <Text style={styles.mainHeaderTitle}>System</Text>
          <Text style={styles.mainHeaderSubtitle}>Important updates and notifications</Text>
        </View>

        <View style={styles.titleRightIcons}>
          <TouchableOpacity style={styles.actionCircleBtn} activeOpacity={0.8}>
            <Icon name="search" size={20} color="#1E293B" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCircleBtn} activeOpacity={0.8}>
            <Icon name="options-outline" size={20} color="#1E293B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScrollContent}
      >
        {SYSTEM_FILTER_TABS.map(tab => {
          const isActive = activeFilter === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => {
                setActiveFilter(tab.id);
                if (tab.id === 'all_messages') navigation.navigate('MainTabs', { screen: 'ChatScreen' });
                else if (tab.id === 'calls') navigation.navigate('CallsScreen');
                else if (tab.id === 'gifts') navigation.navigate('GiftsScreen');
              }}
              activeOpacity={0.8}
              style={[styles.filterPillBtn, isActive && styles.filterPillBtnActive]}
            >
              {isActive ? (
                <LinearGradient
                  colors={['#8B5CF6', '#6C5CE7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.filterGradient}
                >
                  <Icon name={tab.icon} size={15} color="#FFF" style={{ marginRight: 6 }} />
                  <Text style={styles.filterTextActive}>{tab.label}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.filterInactiveInner}>
                  <Icon name={tab.icon} size={15} color="#64748B" style={{ marginRight: 6 }} />
                  <Text style={styles.filterTextInactive}>{tab.label}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* System List */}
      <FlatList
        data={DUMMY_SYSTEM_NOTICES}
        renderItem={renderSystemItem}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.listContainer,
          { paddingBottom: bottomPadding },
        ]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  topBarGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  langPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
    elevation: 2,
  },
  langPillValText: { color: '#1E293B', fontSize: 13, fontWeight: '700' },
  rightActionsGroup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  coinBalancePillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 20,
    paddingLeft: 8,
    paddingRight: 6,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 6,
    elevation: 2,
  },
  coinIconImg: { width: 18, height: 18 },
  coinValText: { color: '#1E293B', fontSize: 13, fontWeight: '800' },
  plusIconBadgeCircle: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: '#6C5CE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellButtonCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  redBadgeDotSmall: {
    position: 'absolute',
    top: 6,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF2D55',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  mainTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginVertical: 10,
  },
  mainHeaderTitle: { fontSize: 26, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
  mainHeaderSubtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  titleRightIcons: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  actionCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterScrollContent: { paddingHorizontal: 16, paddingVertical: 6, gap: 8 },
  filterPillBtn: { borderRadius: 20, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },
  filterPillBtnActive: { borderColor: 'transparent' },
  filterGradient: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  filterInactiveInner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  filterTextActive: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  filterTextInactive: { color: '#64748B', fontSize: 13, fontWeight: '600' },
  listContainer: { paddingHorizontal: 16, paddingTop: 10 },
  cardWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 3,
  },
  specialIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardMainContent: { flex: 1 },
  nameAgeBadgeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  userNameText: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginRight: 6 },
  newPurpleTagBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 4,
  },
  newPurpleTagText: { color: '#8B5CF6', fontSize: 9.5, fontWeight: '800' },
  systemNoticeBodyText: { fontSize: 12, color: '#64748B', lineHeight: 16, marginTop: 2 },
  cardRightMeta: { alignItems: 'flex-end', justifyContent: 'center', marginLeft: 8 },
  timeAgoText: { fontSize: 11, color: '#94A3B8' },
  backBtnCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
});
