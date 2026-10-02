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

const VIP_TIERS = [
  {
    level: 1,
    name: 'Bronze VIP',
    badge: 'VIP 1',
    color: '#CD7F32',
    gradient: ['#78350F', '#B45309'],
    beansBonus: '+5% Beans',
    perks: [
      { icon: 'circle-slice-8', title: 'Bronze Avatar Ring', desc: 'Distinctive bronze border around your avatar in chat & rooms' },
      { icon: 'percent', title: '+5% Beans Boost', desc: 'Earn 5% extra Beans on all host calls and received gifts' },
      { icon: 'chat-processing-outline', title: 'Bronze Chat Tag', desc: 'Exclusive VIP 1 badge next to your nickname in chat lists' },
    ],
  },
  {
    level: 2,
    name: 'Silver VIP',
    badge: 'VIP 2',
    color: '#94A3B8',
    gradient: ['#475569', '#64748B'],
    beansBonus: '+10% Beans',
    perks: [
      { icon: 'shield-outline', title: 'Silver Glowing Frame', desc: 'Animated silver frame displayed across all party rooms' },
      { icon: 'percent', title: '+10% Beans Boost', desc: 'Earn 10% bonus Beans on all calls & voice room activities' },
      { icon: 'eye-outline', title: 'Visitor Notification', desc: 'Receive real-time alerts whenever a user visits your profile' },
    ],
  },
  {
    level: 3,
    name: 'Gold VIP',
    badge: 'VIP 3',
    color: '#F59E0B',
    gradient: ['#B45309', '#F59E0B'],
    beansBonus: '+15% Beans',
    perks: [
      { icon: 'crown-outline', title: 'Gold Avatar Halo', desc: 'Shining gold crown halo over your profile picture' },
      { icon: 'bullhorn-outline', title: 'Room Entrance Toast', desc: 'Screen toast alerts everyone when you join any voice room' },
      { icon: 'percent', title: '+15% Beans Boost', desc: 'Earn 15% extra Beans on all video/voice calls' },
    ],
  },
  {
    level: 4,
    name: 'Platinum VIP',
    badge: 'VIP 4',
    color: '#818CF8',
    gradient: ['#312E81', '#4F46E5'],
    beansBonus: '+20% Beans',
    perks: [
      { icon: 'wing', title: 'Platinum Angel Wings', desc: 'Majestic platinum wings animated behind your profile picture' },
      { icon: 'shield-check', title: 'Kick Resistance', desc: 'Immune to standard room kicks and mute actions from guests' },
      { icon: 'percent', title: '+20% Beans Boost', desc: 'Earn 20% bonus Beans on all incoming activities' },
    ],
  },
  {
    level: 5,
    name: 'Diamond VIP',
    badge: 'VIP 5',
    color: '#38BDF8',
    gradient: ['#0369A1', '#0284C7'],
    beansBonus: '+25% Beans',
    perks: [
      { icon: 'diamond-stone', title: 'Diamond Royal Crown', desc: 'Exclusive glowing diamond crown and royal animated entrance' },
      { icon: 'percent', title: '+25% Beans Boost', desc: 'Maximum 25% Beans bonus on all earnings and call rewards' },
      { icon: 'incognito', title: 'Stealth Room Entry', desc: 'Enter any public voice room invisibly without notice' },
    ],
  },
];

const PACKAGES = [
  { id: '1_month', title: '1 Month', diamonds: 499, save: null },
  { id: '3_months', title: '3 Months', diamonds: 1299, save: 'Save 15%', popular: true },
  { id: '12_months', title: '1 Year', diamonds: 4499, save: 'Save 25%' },
];

const VIPScreen = () => {
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 24);
  const navigation = useNavigation();
  const { user, fetchUserProfile } = useContext(AuthContext);

  const [selectedTier, setSelectedTier] = useState(1);
  const [selectedPackage, setSelectedPackage] = useState('3_months');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isVipActive, setIsVipActive] = useState(false);
  const [selectedPerk, setSelectedPerk] = useState(null);

  const currentTierData = VIP_TIERS.find((t) => t.level === selectedTier) || VIP_TIERS[0];
  const pkgData = PACKAGES.find((p) => p.id === selectedPackage) || PACKAGES[1];

  const handleActivate = () => {
    const diamonds = user?.diamonds || 0;
    if (diamonds < pkgData.diamonds) {
      setShowConfirmModal(false);
      AlertService.show(
        'Insufficient Diamonds',
        `You need ${pkgData.diamonds} Diamonds to activate VIP. Please recharge.`,
        'error'
      );
      navigation.navigate('Wallet');
      return;
    }

    setIsVipActive(true);
    setShowConfirmModal(false);
    AlertService.show('VIP Activated! 👑', `Congratulations! You are now ${currentTierData.name}!`, 'success');
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
        <Text style={styles.headerTitle}>VIP Center</Text>

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
        {/* VIP Status Card */}
        <LinearGradient
          colors={currentTierData.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statusCard}
        >
          <View style={styles.statusCardHeader}>
            <View style={styles.avatarWrap}>
              <Image source={getUserAvatar(user)} style={styles.avatarImg} />
              <View style={[styles.vipCrownBadge, { backgroundColor: currentTierData.color }]}>
                <MaterialCommunityIcons name="crown" size={14} color="#FFFFFF" />
              </View>
            </View>

            <View style={styles.statusInfo}>
              <View style={styles.vipNameRow}>
                <Text style={styles.vipName}>{currentTierData.name}</Text>
                <View style={styles.bonusBadge}>
                  <Text style={styles.bonusBadgeText}>{currentTierData.beansBonus}</Text>
                </View>
              </View>
              <Text style={styles.vipExpiryText}>
                {isVipActive ? 'VIP Active • Expires in 30 Days' : 'Activate VIP to unlock boost & privileges'}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Tier Selector Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tierSelectorScroll}
        >
          {VIP_TIERS.map((tier) => {
            const isSelected = selectedTier === tier.level;
            return (
              <TouchableOpacity
                key={tier.level}
                style={[styles.tierTab, isSelected && styles.tierTabSelected]}
                onPress={() => setSelectedTier(tier.level)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name="crown"
                  size={18}
                  color={isSelected ? tier.color : '#94A3B8'}
                />
                <Text
                  style={[
                    styles.tierTabText,
                    isSelected && { color: tier.color, fontWeight: '800' },
                  ]}
                >
                  {tier.badge}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Privileges Showcase for Selected Tier */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <MaterialCommunityIcons name="sparkles" size={18} color="#D97706" />
            <Text style={styles.sectionHeaderTitle}>{currentTierData.name} Privileges</Text>
          </View>

          <View style={styles.perksList}>
            {currentTierData.perks.map((perk, index) => (
              <TouchableOpacity key={index} style={styles.perkCard} onPress={() => setSelectedPerk(perk)} activeOpacity={0.8}>
                <View style={[styles.perkIconCircle, { backgroundColor: `${currentTierData.color}18` }]}>
                  <MaterialCommunityIcons
                    name={perk.icon}
                    size={22}
                    color={currentTierData.color}
                  />
                </View>
                <View style={styles.perkInfo}>
                  <Text style={styles.perkTitle}>{perk.title}</Text>
                  <Text style={styles.perkDesc}>{perk.desc}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Subscription Packages */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionHeaderTitle}>Select VIP Duration</Text>
          <View style={styles.packagesRow}>
            {PACKAGES.map((pkg) => {
              const isSelected = selectedPackage === pkg.id;
              return (
                <TouchableOpacity
                  key={pkg.id}
                  style={[styles.packageCard, isSelected && styles.packageCardSelected]}
                  onPress={() => setSelectedPackage(pkg.id)}
                  activeOpacity={0.8}
                >
                  {pkg.save && (
                    <View style={styles.saveTag}>
                      <Text style={styles.saveTagText}>{pkg.save}</Text>
                    </View>
                  )}
                  <Text style={styles.pkgTitle}>{pkg.title}</Text>
                  <View style={styles.pkgPriceRow}>
                    <MaterialCommunityIcons name="diamond-stone" size={16} color="#0284C7" />
                    <Text style={styles.pkgPriceText}>{pkg.diamonds}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Activate CTA Button */}
        <TouchableOpacity
          style={styles.activateBtn}
          onPress={() => setShowConfirmModal(true)}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={['#F59E0B', '#D97706']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.activateGradient}
          >
            <MaterialCommunityIcons name="crown" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.activateText}>
              Activate {currentTierData.badge} ({pkgData.diamonds} 💎)
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirm VIP Activation</Text>
              <TouchableOpacity onPress={() => setShowConfirmModal(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDesc}>
              You are activating <Text style={{ fontWeight: '700', color: '#0F172A' }}>{currentTierData.name}</Text> for{' '}
              <Text style={{ fontWeight: '700', color: '#0F172A' }}>{pkgData.title}</Text>.
            </Text>

            <View style={styles.modalCostRow}>
              <Text style={styles.modalCostLabel}>Total Price:</Text>
              <View style={styles.modalCostVal}>
                <MaterialCommunityIcons name="diamond-stone" size={18} color="#0284C7" />
                <Text style={styles.modalCostText}>{pkgData.diamonds} Diamonds</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalConfirmBtn}
              onPress={handleActivate}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={['#4F46E5', '#6366F1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalConfirmGradient}
              >
                <Text style={styles.modalConfirmText}>Confirm & Pay</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={Boolean(selectedPerk)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPerk(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Included in {currentTierData.name}</Text>
              <TouchableOpacity onPress={() => setSelectedPerk(null)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>
            <View style={[styles.perkIconCircle, { alignSelf: 'center', marginVertical: 14, backgroundColor: `${currentTierData.color}18` }]}>
              <MaterialCommunityIcons name={selectedPerk?.icon || 'crown'} size={28} color={currentTierData.color} />
            </View>
            <Text style={[styles.modalTitle, { textAlign: 'center' }]}>{selectedPerk?.title}</Text>
            <Text style={[styles.modalDesc, { textAlign: 'center', marginTop: 8 }]}>{selectedPerk?.desc}</Text>
            <TouchableOpacity style={styles.modalConfirmBtn} onPress={() => setSelectedPerk(null)}>
              <LinearGradient colors={currentTierData.gradient} style={styles.modalConfirmGradient}>
                <Text style={styles.modalConfirmText}>Got it</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default VIPScreen;

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
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
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
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  vipCrownBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  statusInfo: {
    flex: 1,
  },
  vipNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  vipName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bonusBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  bonusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  vipExpiryText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  tierSelectorScroll: {
    gap: 10,
    paddingBottom: 16,
  },
  tierTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  tierTabSelected: {
    borderColor: '#D97706',
    backgroundColor: '#FFFBEB',
  },
  tierTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
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
    marginBottom: 10,
  },
  perksList: {
    gap: 10,
  },
  perkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  perkIconCircle: {
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
  packagesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  packageCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    position: 'relative',
  },
  packageCardSelected: {
    borderColor: '#D97706',
    backgroundColor: '#FFFBEB',
  },
  saveTag: {
    position: 'absolute',
    top: -9,
    backgroundColor: '#D97706',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  saveTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  pkgTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 4,
    marginBottom: 6,
  },
  pkgPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  pkgPriceText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0284C7',
  },
  activateBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 10,
    elevation: 3,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  activateGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  activateText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
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
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalDesc: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 16,
  },
  modalCostRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  modalCostLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  modalCostVal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modalCostText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0284C7',
  },
  modalConfirmBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  modalConfirmGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
