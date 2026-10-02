import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Modal,
  StatusBar,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthProvider';
import { getUserAvatar } from '../../utils/avatarUtil';
import { AlertService } from '../../utils/AlertService';

const { width } = Dimensions.get('window');

const TIERS = [
  {
    id: 'knight',
    name: 'Knight',
    title: 'Knight',
    price: 99000,
    originalPrice: 150000,
    dailyReturn: 3600,
    totalReturn: 108000,
    discount: '30% OFF',
    rewardCount: '7/11',
    privilegeCount: '4/13',
    crestColor: '#F59E0B',
    ribbonColor: '#2563EB',
  },
  {
    id: 'count',
    name: 'Count',
    title: 'Count',
    price: 180000,
    originalPrice: 270000,
    dailyReturn: 6000,
    totalReturn: 198000,
    discount: '33% OFF',
    rewardCount: '8/11',
    privilegeCount: '6/13',
    crestColor: '#A855F7',
    ribbonColor: '#7C3AED',
  },
  {
    id: 'duke',
    name: 'Duke',
    title: 'Duke',
    price: 360000,
    originalPrice: 540000,
    dailyReturn: 12000,
    totalReturn: 396000,
    discount: '33% OFF',
    rewardCount: '9/11',
    privilegeCount: '8/13',
    crestColor: '#EC4899',
    ribbonColor: '#DB2777',
  },
  {
    id: 'prince',
    name: 'Prince',
    title: 'Prince',
    price: 750000,
    originalPrice: 1125000,
    dailyReturn: 25000,
    totalReturn: 825000,
    discount: '33% OFF',
    rewardCount: '10/11',
    privilegeCount: '11/13',
    crestColor: '#EF4444',
    ribbonColor: '#DC2626',
  },
  {
    id: 'king',
    name: 'King',
    title: 'King',
    price: 1500000,
    originalPrice: 2250000,
    dailyReturn: 50000,
    totalReturn: 1650000,
    discount: '33% OFF',
    rewardCount: '11/11',
    privilegeCount: '13/13',
    crestColor: '#FBBF24',
    ribbonColor: '#D97706',
  },
];

const REWARDS_DATA = [
  {
    id: 'r_coins',
    label: 'Daily free diamonds',
    iconType: 'coins',
    badgeText: '+3,600/days',
    desc: 'Receive free diamonds automatically credited to your account every day upon opening YaroApp.',
  },
  {
    id: 'r_broadcast',
    label: 'Active notification broadcast',
    iconType: 'broadcast',
    desc: 'A royal animated notification banner broadcasts across the entire platform when you join a room.',
  },
  {
    id: 'r_logo',
    label: 'Exclusive logo',
    iconType: 'logo',
    desc: 'A shimmering royal King of Kings crest displays next to your nickname in all chats and user lists.',
  },
  {
    id: 'r_badge',
    label: 'Kings badge',
    iconType: 'badge',
    desc: 'Prestige winged nobility badge attached to your user card and room microphone seat.',
  },
  {
    id: 'r_frame',
    label: 'Avatar frame',
    iconType: 'frame',
    desc: 'Ultra-luxurious animated golden deer-antler royal frame for your profile photo.',
  },
  {
    id: 'r_entry',
    label: 'Entry effects',
    iconType: 'entry',
    desc: 'A 3D sports car and golden phoenix sweep across the room upon your grand arrival.',
  },
  {
    id: 'r_barrage',
    label: 'Exclusive barrage',
    iconType: 'barrage',
    desc: 'Special full-width royal chat bubble that highlights your voice room comments with golden glow.',
  },
];

const PRIVILEGES_DATA = [
  {
    id: 'p_gifts',
    label: 'Exclusive gifts',
    icon: 'gift-outline',
    type: 'material-community',
    desc: 'Unlock unique, high-tier 3D luxury gifts only sendable by noble members.',
  },
  {
    id: 'p_translation',
    label: 'Room message translation',
    icon: 'translate',
    type: 'material',
    desc: 'Automatic real-time translation of all room messages into your local language.',
  },
  {
    id: 'p_emoticons',
    label: 'Exclusive emoticons',
    icon: 'emoticon-happy-outline',
    type: 'material-community',
    desc: 'An animated royal emoji pack for party rooms and private messaging.',
  },
  {
    id: 'p_party_bg',
    label: 'Customized party background',
    icon: 'image-outline',
    type: 'material-community',
    desc: 'Set custom animated wallpaper backgrounds in your owned voice rooms.',
  },
  {
    id: 'p_invis_access',
    label: 'Invisible access',
    icon: 'card-account-details-outline',
    type: 'material-community',
    desc: 'Browse user profiles without appearing in their recent visitor list.',
  },
  {
    id: 'p_25_room',
    label: '25 people voice room',
    icon: 'account-group-outline',
    type: 'material-community',
    desc: 'Host massive 25-seat party rooms with crystal-clear high-fidelity audio.',
  },
  {
    id: 'p_online_invis',
    label: 'Online invisibility',
    icon: 'account-edit-outline',
    type: 'material-community',
    desc: 'Hide your online active status from following and mutual friends.',
  },
  {
    id: 'p_invis_entry',
    label: 'Invisible entry',
    icon: 'glasses',
    type: 'material-community',
    desc: 'Enter voice rooms in stealth mode without triggering entrance notifications.',
  },
  {
    id: 'p_cust_service',
    label: 'Exclusive customer service',
    icon: 'headset',
    type: 'material-community',
    desc: 'Direct priority 1-on-1 VIP relationship manager line available 24/7.',
  },
  {
    id: 'p_gif_avatar',
    label: 'Post avatar',
    icon: 'account-circle-outline',
    type: 'material-community',
    desc: 'Upload dynamic animated GIF avatar photos to your user profile.',
  },
  {
    id: 'p_anti_mute',
    label: 'Anti-mute',
    icon: 'volume-mute',
    type: 'material-community',
    desc: 'Moderators cannot mute your microphone in public voice party rooms.',
  },
  {
    id: 'p_anti_kick',
    label: 'Anti-kick',
    icon: 'shield-account-outline',
    type: 'material-community',
    desc: 'Absolute immunity to room kicks and seat evictions by administrators.',
  },
  {
    id: 'p_stay_tuned',
    label: 'Stay tuned',
    icon: 'timer-sand',
    type: 'material-community',
    desc: 'More exclusive ultra-luxury nobility privileges are coming soon.',
  },
];

const SVIP = () => {
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 16);
  const navigation = useNavigation();
  const { user, fetchUserProfile } = useContext(AuthContext);

  const [activeTierId, setActiveTierId] = useState('knight');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isActivated, setIsActivated] = useState(false);

  const currentTier = TIERS.find((t) => t.id === activeTierId) || TIERS[0];

  const handleActivate = () => {
    const cost = currentTier.price;
    const diamonds = user?.diamonds || 0;

    if (diamonds < cost) {
      AlertService.show(
        'Insufficient Diamonds',
        `You need ${cost.toLocaleString()} Diamonds to activate ${currentTier.name}. Please recharge.`,
        'error'
      );
      navigation.navigate('Wallet');
      return;
    }

    setIsActivated(true);
    AlertService.show(
      'Royal Activation Successful! 👑',
      `Welcome to ${currentTier.name}! You will receive +${currentTier.dailyReturn.toLocaleString()} Diamonds daily.`,
      'success'
    );
    if (fetchUserProfile) fetchUserProfile();
  };

  return (
    <View style={styles.screen}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Deep Obsidian-Chocolate Background */}
      <LinearGradient
        colors={['#170F0A', '#1E140D', '#2A1C13', '#160E09']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Top Header */}
      <View style={[styles.header, { paddingTop: topSafeInset + 6 }]}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="chevron-back" size={26} color="#E2E8F0" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>King of Kings</Text>

        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => setShowHelpModal(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="help-circle-outline" size={24} color="#D4AF37" />
        </TouchableOpacity>
      </View>

      {/* User Info Bar */}
      <View style={styles.userInfoRow}>
        <View style={styles.avatarBorder}>
          <Image source={getUserAvatar(user)} style={styles.userAvatar} />
        </View>
        <View style={styles.userTextWrap}>
          <Text style={styles.userName} numberOfLines={1}>
            {user?.name || 'Yaro Noble'}
          </Text>
          <Text style={styles.userStatus}>
            {isActivated ? `${currentTier.name} • Active` : 'Not opened yet'}
          </Text>
        </View>
      </View>

      {/* Tier Selector Horizontal Tabs */}
      <View style={styles.tierTabsContainer}>
        {TIERS.map((tier) => {
          const isActive = tier.id === activeTierId;
          return (
            <TouchableOpacity
              key={tier.id}
              style={styles.tierTab}
              onPress={() => setActiveTierId(tier.id)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tierTabText,
                  isActive && styles.tierTabTextActive,
                ]}
              >
                {tier.name}
              </Text>
              {isActive && <View style={styles.tierTabUnderline} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomPadding + 85 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Center Hero Crest Emblem */}
        <View style={styles.heroCrestWrap}>
          {/* Subtle golden aura glow */}
          <View style={styles.crestAuraGlow} />

          {/* Winged Stag / Deer Crown Crest */}
          <View style={styles.crestCircleOuter}>
            {/* Top Crown */}
            <View style={styles.crestCrown}>
              <MaterialCommunityIcons name="crown" size={36} color="#FBBF24" />
            </View>

            {/* Crest Shield with Outstretched Golden Wings */}
            <View style={styles.crestWingRow}>
              {/* Left Wing */}
              <View style={styles.leftWingWrap}>
                <MaterialCommunityIcons
                  name="feather"
                  size={46}
                  color="#FBBF24"
                  style={{ transform: [{ rotate: '-40deg' }, { scaleX: -1 }] }}
                />
                <MaterialCommunityIcons
                  name="feather"
                  size={36}
                  color="#F59E0B"
                  style={{ marginTop: -20, transform: [{ rotate: '-25deg' }, { scaleX: -1 }] }}
                />
              </View>

              {/* Center Stag Shield */}
              <View style={styles.crestShield}>
                <LinearGradient
                  colors={['#FDE68A', '#F59E0B', '#B45309', '#78350F']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.crestShieldGrad}
                >
                  <MaterialCommunityIcons name="shield-crown" size={54} color="#FFFBEB" />
                </LinearGradient>
              </View>

              {/* Right Wing */}
              <View style={styles.rightWingWrap}>
                <MaterialCommunityIcons
                  name="feather"
                  size={46}
                  color="#FBBF24"
                  style={{ transform: [{ rotate: '40deg' }] }}
                />
                <MaterialCommunityIcons
                  name="feather"
                  size={36}
                  color="#F59E0B"
                  style={{ marginTop: -20, transform: [{ rotate: '25deg' }] }}
                />
              </View>
            </View>

            {/* Royal Name Ribbon */}
            <LinearGradient
              colors={['#1E3A8A', '#2563EB', '#1D4ED8', '#1E40AF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.crestRibbon}
            >
              <Text style={styles.crestRibbonText}>{currentTier.title}</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Blue Faceted Gemstone Ribbon Divider: Reward (7/11) */}
        <View style={styles.sectionDividerWrap}>
          <LinearGradient
            colors={['#0284C7', '#2563EB', '#1D4ED8', '#0284C7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.blueGemstoneRibbon}
          >
            <View style={styles.ribbonDiamondIcon}>
              <MaterialCommunityIcons name="rhombus-medium" size={16} color="#BAE6FD" />
            </View>
          </LinearGradient>

          {/* Title Row with Golden Flourishes */}
          <View style={styles.flourishTitleRow}>
            <Text style={styles.flourishChar}>༺ ──</Text>
            <Text style={styles.flourishTitle}>
              Reward ({currentTier.rewardCount})
            </Text>
            <Text style={styles.flourishChar}>── ༻</Text>
          </View>
        </View>

        {/* Reward 3-Column Grid */}
        <View style={styles.rewardGrid}>
          {REWARDS_DATA.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.rewardCard}
              activeOpacity={0.8}
              onPress={() => setSelectedItem(item)}
            >
              <View style={styles.rewardIconPlaceholder}>
                {item.iconType === 'coins' && (
                  <View style={styles.rewardCoinsWrap}>
                    <View style={styles.coinsStackIcon}>
                      <MaterialCommunityIcons name="diamond-stone" size={26} color="#38BDF8" />
                    </View>
                    <View style={styles.coinsBadgePill}>
                      <Text style={styles.coinsBadgeText}>
                        +{currentTier.dailyReturn.toLocaleString()}/days
                      </Text>
                    </View>
                  </View>
                )}

                {item.iconType === 'broadcast' && (
                  <LinearGradient
                    colors={['#0284C7', '#0369A1']}
                    style={styles.rewardBroadcastBar}
                  >
                    <MaterialCommunityIcons name="bullhorn" size={14} color="#FFFFFF" />
                    <View style={styles.broadcastLine} />
                  </LinearGradient>
                )}

                {item.iconType === 'logo' && (
                  <LinearGradient
                    colors={['#1E3A8A', '#2563EB']}
                    style={styles.rewardLogoBadge}
                  >
                    <MaterialCommunityIcons name="crown" size={12} color="#FBBF24" />
                    <Text style={styles.rewardLogoText}>{currentTier.name}</Text>
                  </LinearGradient>
                )}

                {item.iconType === 'badge' && (
                  <View style={styles.rewardBadgeIconWrap}>
                    <MaterialCommunityIcons name="shield-star" size={32} color="#F59E0B" />
                  </View>
                )}

                {item.iconType === 'frame' && (
                  <View style={styles.rewardFrameWrap}>
                    <View style={styles.rewardFrameInner}>
                      <MaterialCommunityIcons name="crown" size={18} color="#38BDF8" />
                    </View>
                  </View>
                )}

                {item.iconType === 'entry' && (
                  <LinearGradient
                    colors={['#1E0F38', '#4C1D95', '#1E1B4B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.rewardEntryCover}
                  >
                    <View style={styles.entryTrackLine} />
                    <LinearGradient
                      colors={['#EC4899', '#8B5CF6', '#06B6D4']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.entryNeonVehicle}
                    >
                      <MaterialCommunityIcons name="car-sports" size={16} color="#FFFFFF" />
                    </LinearGradient>
                  </LinearGradient>
                )}

                {item.iconType === 'barrage' && (
                  <LinearGradient
                    colors={['#4F46E5', '#7C3AED']}
                    style={styles.rewardBarrageWrap}
                  >
                    <MaterialCommunityIcons name="chat" size={13} color="#FFFFFF" />
                    <Text style={styles.rewardBarrageText}>{currentTier.name}</Text>
                  </LinearGradient>
                )}
              </View>

              <Text style={styles.rewardLabel} numberOfLines={2}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Second Section: Exclusive privileges */}
        <View style={styles.sectionDividerWrap}>
          <View style={styles.flourishTitleRow}>
            <Text style={styles.flourishChar}>༺ ──</Text>
            <Text style={styles.flourishTitle}>
              Exclusive privileges ({currentTier.privilegeCount})
            </Text>
            <Text style={styles.flourishChar}>── ༻</Text>
          </View>
        </View>

        {/* 3-Column Circular Privileges Grid */}
        <View style={styles.privilegesGrid}>
          {PRIVILEGES_DATA.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={styles.privilegeItem}
              activeOpacity={0.8}
              onPress={() => setSelectedItem(p)}
            >
              {/* Circular Gold-Bordered Icon */}
              <View style={styles.privilegeCircleBorder}>
                <LinearGradient
                  colors={['#2B1B11', '#1B110B']}
                  style={styles.privilegeCircleInner}
                >
                  {p.type === 'material' ? (
                    <MaterialIcons name={p.icon} size={24} color="#FBBF24" />
                  ) : (
                    <MaterialCommunityIcons name={p.icon} size={24} color="#FBBF24" />
                  )}
                </LinearGradient>
              </View>

              <Text style={styles.privilegeLabel} numberOfLines={2}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Sticky Bottom Purchase Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(bottomPadding, 16) }]}>
        <LinearGradient
          colors={['rgba(26, 17, 11, 0.98)', 'rgba(18, 12, 8, 1)']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.bottomTopBorder} />

        <View style={styles.bottomBarContent}>
          {/* Price and return details */}
          <View style={styles.priceInfoCol}>
            <View style={styles.purchasePriceRow}>
              <Text style={styles.purchaseLabel}>Purchase</Text>
              <View style={styles.currencyIconWrap}>
                <MaterialCommunityIcons
                  name="circle-slice-8"
                  size={16}
                  color="#F59E0B"
                />
              </View>
              <Text style={styles.priceMainText}>
                {currentTier.price.toLocaleString()}
              </Text>
              <Text style={styles.perDaysText}>/30 days</Text>
            </View>

            <View style={styles.originalPriceRow}>
              <View style={styles.currencyIconWrapSmall}>
                <MaterialCommunityIcons
                  name="circle-slice-8"
                  size={12}
                  color="#94A3B8"
                />
              </View>
              <Text style={styles.originalPriceText}>
                {currentTier.originalPrice.toLocaleString()}/30 days
              </Text>
            </View>

            <View style={styles.returnRow}>
              <Text style={styles.returnLabel}>Total return</Text>
              <View style={styles.currencyIconWrapSmall}>
                <MaterialCommunityIcons
                  name="circle-slice-8"
                  size={13}
                  color="#FBBF24"
                />
              </View>
              <Text style={styles.returnValText}>
                {currentTier.totalReturn.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Glowing Activate Button with Pinned Discount Badge */}
          <View style={styles.activateWrapper}>
            <View style={styles.pinnedDiscountBadge}>
              <Text style={styles.pinnedDiscountText}>{currentTier.discount}</Text>
            </View>
            <TouchableOpacity
              style={styles.activateBtn}
              onPress={handleActivate}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={['#FBBF24', '#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.activateGradient}
              >
                <Text style={styles.activateBtnText}>Activate</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Item Detail Modal */}
      <Modal
        visible={!!selectedItem}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedItem(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedItem?.label || selectedItem?.title}
              </Text>
              <TouchableOpacity onPress={() => setSelectedItem(null)}>
                <Icon name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalIconWrap}>
              <LinearGradient
                colors={['#FBBF24', '#D97706']}
                style={styles.modalIconGrad}
              >
                <MaterialCommunityIcons name="crown" size={32} color="#FFFFFF" />
              </LinearGradient>
            </View>

            <Text style={styles.modalDescText}>{selectedItem?.desc}</Text>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setSelectedItem(null)}
            >
              <Text style={styles.modalCloseText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Help Modal */}
      <Modal
        visible={showHelpModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowHelpModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>King of Kings Guide</Text>
              <TouchableOpacity onPress={() => setShowHelpModal(false)}>
                <Icon name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.helpSectionTitle}>👑 What is King of Kings?</Text>
              <Text style={styles.helpBody}>
                King of Kings is YaroApp's most prestigious nobility tier system. It offers unmatched privileges, custom royal crests, daily diamond returns, 3D supercar room entrance, and complete anti-kick immunity.
              </Text>

              <Text style={styles.helpSectionTitle}>💎 Daily Diamonds Return</Text>
              <Text style={styles.helpBody}>
                Upon activating your nobility tier, you receive free daily diamonds automatically deposited into your wallet every morning. Over 30 days, your total diamond return exceeds the activation price!
              </Text>

              <Text style={styles.helpSectionTitle}>🛡️ Anti-Kick & Stealth</Text>
              <Text style={styles.helpBody}>
                Higher nobility ranks grant total protection against admin kicks and room mutes, plus invisible entry mode.
              </Text>
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowHelpModal(false)}
            >
              <Text style={styles.modalCloseText}>Understood</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default SVIP;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#170F0A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: 0.5,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    gap: 12,
  },
  avatarBorder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#F59E0B',
    padding: 1.5,
    backgroundColor: '#1E140D',
  },
  userAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  userTextWrap: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  userStatus: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  tierTabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    marginTop: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  tierTab: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    position: 'relative',
  },
  tierTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  tierTabTextActive: {
    color: '#FBBF24',
    fontWeight: '800',
  },
  tierTabUnderline: {
    position: 'absolute',
    bottom: -1,
    width: 22,
    height: 3,
    backgroundColor: '#FBBF24',
    borderRadius: 1.5,
  },
  scrollContent: {
    paddingTop: 16,
  },
  heroCrestWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
    position: 'relative',
  },
  crestAuraGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.15)',
  },
  crestCircleOuter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  crestCrown: {
    marginBottom: -12,
    zIndex: 4,
  },
  crestWingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftWingWrap: {
    marginRight: -18,
    zIndex: 1,
    alignItems: 'center',
  },
  rightWingWrap: {
    marginLeft: -18,
    zIndex: 1,
    alignItems: 'center',
  },
  crestShield: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  crestShieldGrad: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FDE68A',
  },
  crestRibbon: {
    marginTop: -14,
    paddingHorizontal: 18,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#93C5FD',
    zIndex: 3,
    elevation: 4,
  },
  crestRibbonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  sectionDividerWrap: {
    alignItems: 'center',
    marginVertical: 16,
  },
  blueGemstoneRibbon: {
    width: width * 0.9,
    height: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  ribbonDiamondIcon: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flourishTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flourishChar: {
    fontSize: 14,
    color: '#D4AF37',
    fontWeight: '300',
  },
  flourishTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F1F5F9',
    letterSpacing: 0.5,
  },
  rewardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  rewardCard: {
    width: (width - 24) / 3,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  rewardIconPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  rewardCoinsWrap: {
    alignItems: 'center',
  },
  coinsStackIcon: {
    marginBottom: 2,
  },
  coinsBadgePill: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
  },
  coinsBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FBBF24',
  },
  rewardBroadcastBar: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 56,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 8,
    gap: 4,
  },
  broadcastLine: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 1.5,
  },
  rewardLogoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 3,
  },
  rewardLogoText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  rewardBadgeIconWrap: {
    alignItems: 'center',
  },
  rewardFrameWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardFrameInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardEntryCover: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.4)',
  },
  entryTrackLine: {
    position: 'absolute',
    width: '85%',
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  entryNeonVehicle: {
    width: 58,
    paddingVertical: 5,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  rewardBarrageWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 3,
  },
  rewardBarrageText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  rewardLabel: {
    fontSize: 11,
    color: '#CBD5E1',
    textAlign: 'center',
    lineHeight: 14,
    minHeight: 28,
  },
  privilegesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  privilegeItem: {
    width: (width - 24) / 3,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  privilegeCircleBorder: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    padding: 2,
    marginBottom: 8,
  },
  privilegeCircleInner: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privilegeLabel: {
    fontSize: 11,
    color: '#D4AF37',
    textAlign: 'center',
    lineHeight: 14,
    minHeight: 28,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  bottomTopBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.35)',
  },
  bottomBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceInfoCol: {
    flex: 1,
  },
  purchasePriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  purchaseLabel: {
    fontSize: 12,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  priceMainText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FBBF24',
  },
  perDaysText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  originalPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  originalPriceText: {
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  returnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  returnLabel: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '600',
  },
  returnValText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FBBF24',
  },
  currencyIconWrap: {
    marginHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currencyIconWrapSmall: {
    marginRight: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activateWrapper: {
    position: 'relative',
  },
  pinnedDiscountBadge: {
    position: 'absolute',
    top: -8,
    right: 4,
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 8,
    zIndex: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  pinnedDiscountText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  activateBtn: {
    borderRadius: 22,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  activateGradient: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activateBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#78350F',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#1E140D',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F1F5F9',
  },
  modalIconWrap: {
    alignItems: 'center',
    marginVertical: 12,
  },
  modalIconGrad: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDescText: {
    fontSize: 13,
    color: '#E2E8F0',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  modalCloseBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#78350F',
  },
  helpSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FBBF24',
    marginTop: 12,
    marginBottom: 4,
  },
  helpBody: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 17,
  },
});
