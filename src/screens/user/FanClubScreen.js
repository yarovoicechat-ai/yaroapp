import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
  Image,
  Modal,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';
import { AuthContext } from '../../context/AuthProvider';
import { AlertService } from '../../utils/AlertService';
import { getUserAvatar } from '../../utils/avatarUtil';

const { width } = Dimensions.get('window');

const FAN_PERKS = [
  {
    id: 'perk_1',
    icon: 'card-bulleted-outline',
    title: 'Glowing Fan Badge',
    desc: 'Showcase your exclusive fan badge beside your name in all room chats.',
    color: '#EC4899',
  },
  {
    id: 'perk_2',
    icon: 'emoticon-kiss-outline',
    title: 'Custom Emoji Pack',
    desc: 'Unlock exclusive creator emoji stickers only usable by club members.',
    color: '#8B5CF6',
  },
  {
    id: 'perk_3',
    icon: 'seat-recline-extra',
    title: 'Priority Seat Access',
    desc: 'Get front-row priority queue when requesting to speak on voice seats.',
    color: '#F59E0B',
  },
  {
    id: 'perk_4',
    icon: 'waveform',
    title: 'Voice Greeting',
    desc: 'Host automated special audio welcome whenever you enter their room.',
    color: '#06B6D4',
  },
  {
    id: 'perk_5',
    icon: 'gift-outline',
    title: 'Intimacy Multiplier',
    desc: 'Earn 1.5x Intimacy points for every Diamond gift sent to the host.',
    color: '#10B981',
  },
];

const INTIMACY_WAYS = [
  { action: 'Daily Sign-in to Room', points: '+10 Intimacy', icon: 'login' },
  { action: 'Send 10 Diamonds of Gifts', points: '+10 Intimacy', icon: 'card-giftcard' },
  { action: 'Chat 10 Messages in Room', points: '+5 Intimacy', icon: 'chat-bubble-outline' },
  { action: 'Stay on Seat for 10 Mins', points: '+15 Intimacy', icon: 'mic-none' },
];

const FAN_TIERS = [
  { tier: 1, name: 'Iron Fan', xp: '0 - 500 XP', badgeColor: '#94A3B8' },
  { tier: 2, name: 'Bronze Fan', xp: '500 - 1,500 XP', badgeColor: '#CD7F32' },
  { tier: 3, name: 'Silver Fan', xp: '1,500 - 3,500 XP', badgeColor: '#CBD5E1' },
  { tier: 4, name: 'Gold Fan', xp: '3,500 - 8,000 XP', badgeColor: '#F59E0B' },
  { tier: 5, name: 'Diamond Fan', xp: '8,000+ XP', badgeColor: '#38BDF8' },
];

const FanClubScreen = () => {
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 24);
  const navigation = useNavigation();
  const { user, fetchUserProfile } = useContext(AuthContext);

  const [isMember, setIsMember] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('1_month');

  const handleJoinClub = () => {
    const cost = selectedPlan === '1_month' ? 99 : 249;
    const diamonds = user?.diamonds || 0;

    if (diamonds < cost) {
      setShowJoinModal(false);
      AlertService.show(
        'Insufficient Diamonds',
        `You need ${cost} Diamonds to join Fan Club. Please recharge your wallet.`,
        'error'
      );
      navigation.navigate('Wallet');
      return;
    }

    setIsMember(true);
    setShowJoinModal(false);
    AlertService.show('Welcome to Fan Club! 💖', 'You are now an official Fan Club member!', 'success');
    if (fetchUserProfile) fetchUserProfile();
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topSafeInset + 8 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fan Club Center</Text>

        <TouchableOpacity
          style={styles.diamondPill}
          onPress={() => navigation.navigate('Wallet')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="diamond-stone" size={14} color="#0284C7" />
          <Text style={styles.diamondText}>{user?.diamonds ?? 0}</Text>
          <Ionicons name="add-circle" size={14} color="#0284C7" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Membership Status Card */}
        <LinearGradient
          colors={['#EC4899', '#DB2777', '#BE185D']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statusCard}
        >
          <View style={styles.statusCardHeader}>
            <View style={styles.avatarWrap}>
              <Image source={getUserAvatar(user)} style={styles.avatarImg} />
              <View style={styles.heartBadge}>
                <Ionicons name="heart" size={12} color="#FFFFFF" />
              </View>
            </View>

            <View style={styles.statusCardInfo}>
              <View style={styles.clubTitleRow}>
                <Text style={styles.clubName}>
                  {isMember ? 'Yaro Star Fan Club' : 'Not Joined Any Club'}
                </Text>
                {isMember && (
                  <View style={styles.fanTierBadge}>
                    <Text style={styles.fanTierText}>Silver Fan</Text>
                  </View>
                )}
              </View>
              <Text style={styles.clubSub}>
                {isMember
                  ? 'Intimacy Level 3 • 18 Days Remaining'
                  : 'Join your favorite host’s fan club to unlock exclusive perks'}
              </Text>
            </View>
          </View>

          {isMember ? (
            <View style={styles.intimacyContainer}>
              <View style={styles.intimacyLabelRow}>
                <Text style={styles.intimacyLabel}>Intimacy Points</Text>
                <Text style={styles.intimacyVal}>1,420 / 2,000 XP</Text>
              </View>
              <View style={styles.intimacyBarBg}>
                <View style={[styles.intimacyBarFill, { width: '71%' }]} />
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.joinCtaBtn}
              onPress={() => setShowJoinModal(true)}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={['#FBBF24', '#F59E0B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.joinCtaGradient}
              >
                <Ionicons name="heart" size={16} color="#78350F" style={{ marginRight: 6 }} />
                <Text style={styles.joinCtaText}>Join Fan Club (99 💎/mo)</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </LinearGradient>

        {/* Exclusive Privileges Showcase */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <MaterialCommunityIcons name="crown" size={20} color="#EC4899" />
            <Text style={styles.sectionHeaderTitle}>Fan Club Privileges</Text>
          </View>

          <View style={styles.perksGrid}>
            {FAN_PERKS.map((perk) => (
              <View key={perk.id} style={styles.perkCard}>
                <View style={[styles.perkIconWrap, { backgroundColor: `${perk.color}15` }]}>
                  <MaterialCommunityIcons name={perk.icon} size={24} color={perk.color} />
                </View>
                <View style={styles.perkInfo}>
                  <Text style={styles.perkTitle}>{perk.title}</Text>
                  <Text style={styles.perkDesc}>{perk.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Intimacy Tasks Roadmap */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="sparkles" size={18} color="#F59E0B" />
            <Text style={styles.sectionHeaderTitle}>How to Boost Intimacy</Text>
          </View>

          <View style={styles.intimacyWaysList}>
            {INTIMACY_WAYS.map((way, index) => (
              <View key={index} style={styles.wayRow}>
                <View style={styles.wayIconCircle}>
                  <Icon name={way.icon} size={18} color="#4F46E5" />
                </View>
                <Text style={styles.wayActionText}>{way.action}</Text>
                <View style={styles.wayPointsBadge}>
                  <Text style={styles.wayPointsText}>{way.points}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Fan Tiers Progression */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="trophy" size={18} color="#8B5CF6" />
            <Text style={styles.sectionHeaderTitle}>Fan Club Tiers</Text>
          </View>

          <View style={styles.tiersCard}>
            {FAN_TIERS.map((tier) => (
              <View key={tier.tier} style={styles.tierRow}>
                <View style={[styles.tierBadge, { backgroundColor: tier.badgeColor }]}>
                  <Text style={styles.tierBadgeText}>T{tier.tier}</Text>
                </View>
                <Text style={styles.tierName}>{tier.name}</Text>
                <Text style={styles.tierXp}>{tier.xp}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Join Fan Club Modal */}
      <Modal
        visible={showJoinModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowJoinModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Join Fan Club</Text>
              <TouchableOpacity onPress={() => setShowJoinModal(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDesc}>
              Support your favorite creator, unlock custom fan badges, glowing chat nameplates, and top seat priority!
            </Text>

            {/* Plans Selection */}
            <View style={styles.plansRow}>
              <TouchableOpacity
                style={[styles.planCard, selectedPlan === '1_month' && styles.planCardActive]}
                onPress={() => setSelectedPlan('1_month')}
                activeOpacity={0.8}
              >
                <Text style={styles.planDuration}>1 Month</Text>
                <View style={styles.planPriceRow}>
                  <MaterialCommunityIcons name="diamond-stone" size={16} color="#0284C7" />
                  <Text style={styles.planPriceText}>99</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.planCard, selectedPlan === '3_months' && styles.planCardActive]}
                onPress={() => setSelectedPlan('3_months')}
                activeOpacity={0.8}
              >
                <View style={styles.bestValueBadge}>
                  <Text style={styles.bestValueText}>Save 15%</Text>
                </View>
                <Text style={styles.planDuration}>3 Months</Text>
                <View style={styles.planPriceRow}>
                  <MaterialCommunityIcons name="diamond-stone" size={16} color="#0284C7" />
                  <Text style={styles.planPriceText}>249</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Confirm CTA */}
            <TouchableOpacity
              style={styles.confirmJoinBtn}
              onPress={handleJoinClub}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={['#EC4899', '#DB2777']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.confirmJoinGradient}
              >
                <Text style={styles.confirmJoinText}>Confirm & Join Club</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default FanClubScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  diamondPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    gap: 4,
  },
  diamondText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  scrollContent: {
    padding: 16,
  },
  statusCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  statusCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarImg: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  heartBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#BE185D',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  statusCardInfo: {
    flex: 1,
  },
  clubTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clubName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  fanTierBadge: {
    backgroundColor: '#FCE7F3',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  fanTierText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9D174D',
  },
  clubSub: {
    fontSize: 12,
    color: '#FCE7F3',
    marginTop: 4,
    lineHeight: 16,
  },
  intimacyContainer: {
    marginTop: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 12,
    padding: 10,
  },
  intimacyLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  intimacyLabel: {
    fontSize: 11,
    color: '#FCE7F3',
    fontWeight: '600',
  },
  intimacyVal: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  intimacyBarBg: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  intimacyBarFill: {
    height: '100%',
    backgroundColor: '#FBBF24',
    borderRadius: 3,
  },
  joinCtaBtn: {
    marginTop: 16,
    borderRadius: 14,
    overflow: 'hidden',
  },
  joinCtaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  joinCtaText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#78350F',
  },
  sectionWrap: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  perksGrid: {
    gap: 10,
  },
  perkCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  perkIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  perkInfo: {
    flex: 1,
  },
  perkTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  perkDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  intimacyWaysList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  wayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wayIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  wayActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  wayPointsBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  wayPointsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  tiersCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tierBadge: {
    width: 30,
    height: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tierBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  tierName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  tierXp: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16,
  },
  plansRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  planCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    position: 'relative',
  },
  planCardActive: {
    borderColor: '#EC4899',
    backgroundColor: '#FDF2F8',
  },
  bestValueBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: '#EC4899',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bestValueText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  planDuration: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  planPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  planPriceText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0284C7',
  },
  confirmJoinBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  confirmJoinGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmJoinText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
