import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  StatusBar,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AuthContext } from '../../context/AuthProvider';
import { apiUtil } from '../../utils/apiUtil';
import { AlertService } from '../../utils/AlertService';
import { getAppTopSafeInset } from '../../utils/safeAreaUtils';
import { getUserAvatar } from '../../utils/avatarUtil';

const { width } = Dimensions.get('window');

const RING_PRESETS = [
  {
    name: 'Silver Promise Ring',
    tier: 1,
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=200',
    desc: 'Sweet humble beginnings of eternal romance.',
  },
  {
    name: 'Rose Gold Halo Ring',
    tier: 2,
    image: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=200',
    desc: 'Blushing petals enclosing pure devotion.',
  },
  {
    name: 'Princess Cut Solitaire',
    tier: 3,
    image: 'https://images.unsplash.com/photo-1598560917505-59a3ad559071?w=200',
    desc: 'Brilliant faceted gem radiating fiery passion.',
  },
  {
    name: 'Celestial Crown Ring',
    tier: 4,
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=200',
    desc: 'The pinnacle of sovereign lovers and eternal glory.',
  },
];

const CP_LEVEL_PERKS = {
  1: {
    level: 1,
    label: 'Lv.1',
    intimacyReq: '0 - 999 Intimacy',
    frameTitle: 'Emerald Love Frame',
    themeTitle: 'Emerald Serenity Room',
    themeBg: ['#065F46', '#047857', '#10B981'],
    badgeDesc: 'Lv.1 Couple Crest displayed on room profile & header.',
  },
  2: {
    level: 2,
    label: 'Lv.2',
    intimacyReq: '1,000 - 4,999 Intimacy',
    frameTitle: 'Sapphire Crown Frame',
    themeTitle: 'Sapphire Starlight Room',
    themeBg: ['#1E3A8A', '#2563EB', '#60A5FA'],
    badgeDesc: 'Lv.2 Sapphire Heart Crest with sparkling aura on seat.',
  },
  3: {
    level: 3,
    label: 'Lv.3',
    intimacyReq: '5,000 - 19,999 Intimacy',
    frameTitle: 'Ruby Passion Frame',
    themeTitle: 'Ruby Romance Castle',
    themeBg: ['#881337', '#BE123C', '#FB7185'],
    badgeDesc: 'Lv.3 Royal Ruby Crest with exclusive love fanfare.',
  },
  4: {
    level: 4,
    label: 'Lv.4',
    intimacyReq: '20,000 - 49,999 Intimacy',
    frameTitle: 'Amethyst Sovereign Frame',
    themeTitle: 'Amethyst Aurora Palace',
    themeBg: ['#581C87', '#7E22CE', '#C084FC'],
    badgeDesc: 'Lv.4 Imperial Amethyst Crest with global room entry notice.',
  },
  5: {
    level: 5,
    label: 'Lv.5',
    intimacyReq: '50,000+ Intimacy',
    frameTitle: 'Eternal Sovereign Frame',
    themeTitle: 'Golden Eternity Kingdom',
    themeBg: ['#78350F', '#B45309', '#FBBF24'],
    badgeDesc: 'Lv.5 Eternal Sovereign Gold Crest with Hall of Fame glory.',
  },
};

export default function CpSpaceScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(1);

  // Active CP Data
  const [myCp, setMyCp] = useState(null);
  const [partner, setPartner] = useState(null);
  const [daysTogether, setDaysTogether] = useState(0);
  const [isCheckedInToday, setIsCheckedInToday] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);

  // Proposals
  const [incomingProposals, setIncomingProposals] = useState([]);
  const [outgoingProposals, setOutgoingProposals] = useState([]);

  // Leaderboard Data
  const [couples, setCouples] = useState([]);

  // Modals
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [rankModalVisible, setRankModalVisible] = useState(false);
  const [proposeModalVisible, setProposeModalVisible] = useState(false);
  const [targetId, setTargetId] = useState('');
  const [selectedRing, setSelectedRing] = useState(RING_PRESETS[0]);
  const [proposeMessage, setProposeMessage] = useState('');
  const [proposing, setProposing] = useState(false);

  // Love Note Modal
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [postingNote, setPostingNote] = useState(false);

  // Upgrade Ring Modal
  const [ringModalVisible, setRingModalVisible] = useState(false);
  const [upgradingRing, setUpgradingRing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [myRes, listRes] = await Promise.all([
        apiUtil.get('/couple/my', { suppressGlobalError: true }).catch(() => null),
        apiUtil.get('/couple', { suppressGlobalError: true }).catch(() => null),
      ]);

      const myPayload = myRes?.data?.data;
      if (myPayload && myPayload.couple) {
        setMyCp(myPayload.couple);
        setPartner(myPayload.partner || null);
        setDaysTogether(myPayload.daysTogether || 1);
        setIsCheckedInToday(Boolean(myPayload.isCheckedInToday));
        setIncomingProposals(myPayload.incomingProposals || []);
        setOutgoingProposals(myPayload.outgoingProposals || []);
      } else {
        setMyCp(null);
        setPartner(null);
        setDaysTogether(0);
        setIsCheckedInToday(false);
        setIncomingProposals(myPayload?.incomingProposals || []);
        setOutgoingProposals(myPayload?.outgoingProposals || []);
      }

      const listPayload = listRes?.data?.data;
      const coupleList = Array.isArray(listPayload)
        ? listPayload
        : Array.isArray(listPayload?.couples)
        ? listPayload.couples
        : [];
      setCouples(coupleList);
    } catch (_) {
      // Graceful fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Daily Sweet Check-in
  const handleCheckin = async () => {
    if (isCheckedInToday || checkingIn) return;
    setCheckingIn(true);
    try {
      const res = await apiUtil.post('/couple/checkin', {}, { suppressGlobalError: true });
      AlertService.show('Sweet Romance! 💖', res?.data?.message || '+100 Intimacy Points added!', 'success');
      setIsCheckedInToday(true);
      loadData();
    } catch (err) {
      AlertService.show('Notice', err?.response?.data?.message || err?.message || 'Check-in failed.', 'info');
    } finally {
      setCheckingIn(false);
    }
  };

  // Send Romantic Proposal
  const handlePropose = async () => {
    if (!targetId.trim()) {
      AlertService.show('Required', 'Please enter partner numeric ID', 'error');
      return;
    }
    setProposing(true);
    try {
      const res = await apiUtil.post('/couple/propose', {
        partnerNumericId: targetId.trim(),
        ringName: selectedRing.name,
        ringImage: selectedRing.image,
        message: proposeMessage.trim() || 'Will you be my CP and share your journey with me? ❤️',
      });
      setProposeModalVisible(false);
      setTargetId('');
      setProposeMessage('');
      AlertService.show('Proposal Delivered 💌💍', res?.data?.message || 'Your romantic proposal was delivered!', 'success');
      loadData();
    } catch (err) {
      AlertService.show('Proposal Notice', err?.response?.data?.message || err?.message || 'Could not send proposal.', 'info');
    } finally {
      setProposing(false);
    }
  };

  // Respond to incoming proposal
  const handleRespondProposal = async (proposalId, action) => {
    try {
      const res = await apiUtil.post(`/couple/proposals/${proposalId}/respond`, { action }, { suppressGlobalError: true });
      if (action === 'accept') {
        AlertService.show('CP Bond Established! 💍💖', res?.data?.message || 'Happy Anniversary!', 'success');
      } else {
        AlertService.show('Declined', 'Proposal declined.', 'info');
      }
      loadData();
    } catch (err) {
      AlertService.show('Error', err?.response?.data?.message || err?.message || 'Failed to respond', 'error');
    }
  };

  // Post Love Note
  const handlePostNote = async () => {
    if (!noteText.trim()) return;
    setPostingNote(true);
    try {
      await apiUtil.post('/couple/wall', { text: noteText.trim() });
      AlertService.show('Love Note Published 💌', 'Your sweet note was added to the Love Wall!', 'success');
      setNoteModalVisible(false);
      setNoteText('');
      loadData();
    } catch (err) {
      AlertService.show('Error', err?.response?.data?.message || err?.message || 'Failed to post note', 'error');
    } finally {
      setPostingNote(false);
    }
  };

  // Upgrade Ring
  const handleUpgradeRing = async (ring) => {
    setUpgradingRing(true);
    try {
      const res = await apiUtil.post('/couple/ring/upgrade', {
        ringName: ring.name,
        ringImage: ring.image,
        tier: ring.tier,
      });
      AlertService.show('Ring Upgraded! 💍✨', res?.data?.message || 'Ring updated with bonus intimacy!', 'success');
      setRingModalVisible(false);
      loadData();
    } catch (err) {
      AlertService.show('Error', err?.response?.data?.message || err?.message || 'Failed to upgrade ring', 'error');
    } finally {
      setUpgradingRing(false);
    }
  };

  // Dissolve CP
  const handleDissolveCp = () => {
    Alert.alert(
      'Dissolve CP Bond',
      'Are you sure you want to end your CP relationship? This will reset intimacy and remove your shared badges.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Dissolve',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiUtil.post('/couple/dissolve', {}, { suppressGlobalError: true });
              AlertService.show('CP Dissolved', 'Your CP bond has ended.', 'info');
              loadData();
            } catch (err) {
              AlertService.show('Error', err?.response?.data?.message || err?.message || 'Failed to dissolve CP', 'error');
            }
          },
        },
      ]
    );
  };

  const selfUser = user || {};
  const currentPartner = partner || (myCp ? (String(myCp.user1?._id) === String(selfUser?._id || selfUser?.id) ? myCp.user2 : myCp.user1) : null);
  const currentPerk = CP_LEVEL_PERKS[selectedLevel] || CP_LEVEL_PERKS[1];

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Main Gradient Background (Dreamy Pink Palace) */}
      <LinearGradient
        colors={['#4A0429', '#831843', '#BE185D', '#FB7185', '#FCE7F3']}
        locations={[0, 0.22, 0.48, 0.8, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* App Bar / Navigation Header */}
      <View style={[styles.topHeader, { paddingTop: getAppTopSafeInset(insets.top) + 6 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerIconBtn}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Icon name="chevron-back" size={26} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>CP Center</Text>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            onPress={() => setRankModalVisible(true)}
            style={styles.headerIconBtn}
            accessibilityRole="button"
            accessibilityLabel="Rankings"
          >
            <MaterialCommunityIcons name="crown-outline" size={22} color="#FDE047" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setHelpModalVisible(true)}
            style={styles.headerIconBtn}
            accessibilityRole="button"
            accessibilityLabel="Help"
          >
            <Icon name="help-circle-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />}
      >
        {loading && !refreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>Opening CP Center...</Text>
          </View>
        ) : (
          <>
            {/* INCOMING PROPOSALS NOTICE BANNER */}
            {incomingProposals.length > 0 && (
              <View style={styles.incomingBannerContainer}>
                <LinearGradient
                  colors={['#BE185D', '#E11D48']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.incomingBannerCard}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.incomingTitle}>Incoming Romantic Confession 💌</Text>
                    <Text style={styles.incomingSender} numberOfLines={1}>
                      {incomingProposals[0]?.sender?.name || 'Someone'} proposed to you with a {incomingProposals[0]?.ringName || 'Diamond Ring'}!
                    </Text>
                  </View>
                  <View style={styles.incomingActions}>
                    <TouchableOpacity
                      onPress={() => handleRespondProposal(incomingProposals[0]?._id, 'accept')}
                      style={styles.incomingAcceptBtn}
                    >
                      <Text style={styles.incomingAcceptText}>Accept 💍</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleRespondProposal(incomingProposals[0]?._id, 'decline')}
                      style={styles.incomingDeclineBtn}
                    >
                      <Text style={styles.incomingDeclineText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </View>
            )}

            {/* TOP WINGED HEART HERO SECTION */}
            <View style={styles.wingedHeartHeroWrap}>
              {/* Angelic Winged Heart Backdrop */}
              <View style={styles.wingsContainer}>
                {/* Left Feathered Wing */}
                <View style={styles.leftWingWrap}>
                  <MaterialCommunityIcons
                    name="wing"
                    size={90}
                    color="rgba(255, 255, 255, 0.88)"
                    style={{ transform: [{ scaleX: -1 }, { rotate: '12deg' }] }}
                  />
                </View>

                {/* Center Glowing Heart */}
                <View style={styles.centerPinkHeart}>
                  <MaterialCommunityIcons name="heart" size={175} color="#FFAEC0" />
                </View>

                {/* Right Feathered Wing */}
                <View style={styles.rightWingWrap}>
                  <MaterialCommunityIcons
                    name="wing"
                    size={90}
                    color="rgba(255, 255, 255, 0.88)"
                    style={{ transform: [{ rotate: '12deg' }] }}
                  />
                </View>
              </View>

              {/* Overlaid Avatars & Badges Row */}
              <View style={styles.heroAvatarsRow}>
                {/* User Avatar (Left) */}
                <View style={styles.avatarCol}>
                  <View style={styles.goldRingShell}>
                    <Image
                      source={getUserAvatar({
                        avatar: selfUser?.avatar || selfUser?.image,
                        gender: selfUser?.gender,
                      })}
                      style={styles.heroAvatarImg}
                    />
                  </View>
                  <Text style={styles.heroUserName} numberOfLines={1}>
                    {selfUser?.name || 'You'}
                  </Text>
                </View>

                {/* Center Green Winged Heart Badge */}
                <View style={styles.centerHeartBadgeWrap}>
                  <Image
                    source={require('../../assets/cp/cp_lv0_heart.png')}
                    style={styles.lv0HeartImage}
                    resizeMode="contain"
                  />
                  <View style={styles.lv0HeartTextOverlay}>
                    <Text style={styles.lv0DaysText}>
                      {myCp ? `${daysTogether} Days` : '0 Days'}
                    </Text>
                    <Text style={styles.lv0LevelText}>
                      {myCp ? `LV.${myCp.cpLevel || 1}` : 'LV.0'}
                    </Text>
                  </View>
                </View>

                {/* Partner Avatar / Invite Placeholder (Right) */}
                <View style={styles.avatarCol}>
                  {myCp && currentPartner ? (
                    <>
                      <View style={styles.goldRingShell}>
                        <Image
                          source={getUserAvatar({
                            avatar: currentPartner?.avatar || currentPartner?.image,
                            gender: currentPartner?.gender,
                          })}
                          style={styles.heroAvatarImg}
                        />
                      </View>
                      <Text style={styles.heroUserName} numberOfLines={1}>
                        {currentPartner?.name || 'Partner'}
                      </Text>
                    </>
                  ) : (
                    <View style={styles.inviteContainer}>
                      <TouchableOpacity
                        onPress={() => setProposeModalVisible(true)}
                        activeOpacity={0.8}
                        style={styles.placeholderDashedCircle}
                      >
                        <Icon name="add" size={32} color="#FFFFFF" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setProposeModalVisible(true)}
                        activeOpacity={0.85}
                        style={styles.inviteBtnTouch}
                      >
                        <Image
                          source={require('../../assets/cp/cp_invite_btn.png')}
                          style={styles.inviteBtnImage}
                          resizeMode="contain"
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>

              {/* Status Subtitle */}
              <Text style={styles.cpSubtitleText}>
                {myCp
                  ? `Anniversary • ${daysTogether} Days together with ${currentPartner?.name || 'Soulmate'} 💖`
                  : "You don't have CP yet."}
              </Text>
            </View>

            {/* PRIVILEGES SECTION */}
            <View style={styles.privilegesSectionWrapper}>
              {/* Ribbon Header Banner */}
              <View style={styles.privilegesRibbonWrap}>
                <Image
                  source={require('../../assets/cp/cp_privileges_header.png')}
                  style={styles.privilegesRibbonImg}
                  resizeMode="contain"
                />
              </View>

              {/* Privileges Card Container */}
              <View style={styles.privilegesCardBox}>
                {/* Level Stepper Bar */}
                <View style={styles.stepperWrap}>
                  <View style={styles.stepperConnectingLine} />
                  {[1, 2, 3, 4, 5].map((lvl) => {
                    const isSelected = selectedLevel === lvl;
                    return (
                      <TouchableOpacity
                        key={lvl}
                        onPress={() => setSelectedLevel(lvl)}
                        activeOpacity={0.8}
                        style={styles.stepperItem}
                      >
                        <View style={[styles.stepIconRing, isSelected && styles.stepIconRingSelected]}>
                          <MaterialCommunityIcons
                            name="heart"
                            size={isSelected ? 18 : 15}
                            color={isSelected ? '#FBBF24' : '#E2E8F0'}
                          />
                          <Text style={[styles.stepInnerLvlText, isSelected && styles.stepInnerLvlTextSelected]}>
                            LV{lvl}
                          </Text>
                        </View>
                        <Text style={[styles.stepOuterLabel, isSelected && styles.stepOuterLabelSelected]}>
                          Lv.{lvl}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* PREVIEW 1: CP ICON */}
                <Text style={styles.perkSectionTitle}>CP Icon</Text>
                <View style={styles.perkPreviewCard}>
                  <View style={styles.cpIconPreviewRow}>
                    <View style={styles.previewAvatarShell}>
                      <Image
                        source={getUserAvatar({
                          avatar: selfUser?.avatar || selfUser?.image,
                          gender: selfUser?.gender,
                        })}
                        style={styles.previewAvatarImg}
                      />
                    </View>
                    <Image
                      source={require('../../assets/cp/cp_badge_level1.png')}
                      style={styles.badgePreviewImage}
                      resizeMode="contain"
                    />
                    <View style={styles.previewAvatarShell}>
                      <Image
                        source={getUserAvatar({
                          avatar: currentPartner?.avatar || currentPartner?.image,
                          gender: currentPartner?.gender || 'female',
                        })}
                        style={styles.previewAvatarImg}
                      />
                    </View>
                  </View>
                </View>

                {/* PREVIEW 2: CP FRAME & CP ROOM THEME */}
                <Text style={styles.perkSectionTitle}>CP Frame & CP Room Theme</Text>
                <View style={styles.perkPreviewCard}>
                  <View style={styles.frameThemeRow}>
                    {/* Frame Preview */}
                    <View style={styles.framePreviewCol}>
                      <View style={styles.frameOuterRing}>
                        <Image
                          source={getUserAvatar({
                            avatar: selfUser?.avatar || selfUser?.image,
                            gender: selfUser?.gender,
                          })}
                          style={styles.frameAvatarInside}
                        />
                        <View style={styles.frameTagBadge}>
                          <Text style={styles.frameTagText}>Lv.{selectedLevel}</Text>
                        </View>
                      </View>
                      <Text style={styles.frameTitleLabel}>{currentPerk.frameTitle}</Text>
                    </View>

                    {/* Room Theme Preview */}
                    <View style={styles.themePreviewCol}>
                      <LinearGradient
                        colors={currentPerk.themeBg}
                        style={styles.themeThumbnailCard}
                      >
                        <MaterialCommunityIcons name="heart-multiple" size={24} color="rgba(255,255,255,0.85)" />
                        <View style={styles.themePillWrap}>
                          <Text style={styles.themePillText}>Lv.{selectedLevel} Theme</Text>
                        </View>
                      </LinearGradient>
                      <Text style={styles.frameTitleLabel}>{currentPerk.themeTitle}</Text>
                    </View>
                  </View>
                </View>

                {/* PREVIEW 3: CP BADGE */}
                <Text style={styles.perkSectionTitle}>CP Badge</Text>
                <View style={styles.perkPreviewCard}>
                  <View style={styles.badgeProfileCard}>
                    <View style={styles.badgeProfileHeader}>
                      <Icon name="chevron-back" size={16} color="#CBD5E1" />
                      <View style={styles.badgeProfileAvatars}>
                        <Image
                          source={getUserAvatar({
                            avatar: selfUser?.avatar || selfUser?.image,
                            gender: selfUser?.gender,
                          })}
                          style={styles.badgeMiniAvatar}
                        />
                        <Image
                          source={require('../../assets/cp/cp_lv0_heart.png')}
                          style={styles.badgeMiniHeart}
                          resizeMode="contain"
                        />
                        <Image
                          source={getUserAvatar({
                            avatar: currentPartner?.avatar || currentPartner?.image,
                            gender: currentPartner?.gender || 'female',
                          })}
                          style={styles.badgeMiniAvatar}
                        />
                      </View>
                      <Icon name="share-social-outline" size={16} color="#CBD5E1" />
                    </View>
                    <View style={styles.badgeProfileInfo}>
                      <Text style={styles.badgeCoupleNameText} numberOfLines={1}>
                        {myCp
                          ? `${selfUser?.name || 'You'} & ${currentPartner?.name || 'Soulmate'}`
                          : `${selfUser?.name || 'Ansh'} & Soulmate`}
                      </Text>
                      <Text style={styles.badgeIdText}>
                        ID: {selfUser?.customDisplayId || selfUser?.userId || '12546620'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* ACTIVE CP ROMANTIC ACTIONS (If coupled) */}
            {myCp && (
              <View style={styles.activeCpCard}>
                <Text style={styles.activeCpSectionTitle}>Couple Space Features 💖</Text>

                <View style={styles.activeCpButtonsGrid}>
                  <TouchableOpacity
                    onPress={handleCheckin}
                    disabled={isCheckedInToday || checkingIn}
                    style={[styles.cpActionBtn, isCheckedInToday && styles.cpActionBtnDisabled]}
                  >
                    <MaterialCommunityIcons
                      name={isCheckedInToday ? 'check-circle' : 'heart-flash'}
                      size={20}
                      color="#FFFFFF"
                    />
                    <Text style={styles.cpActionBtnText}>
                      {isCheckedInToday ? 'Checked In Today' : 'Daily Sweet (+100 💖)'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setNoteModalVisible(true)}
                    style={[styles.cpActionBtn, { backgroundColor: '#BE185D' }]}
                  >
                    <MaterialCommunityIcons name="email-heart-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.cpActionBtnText}>Love Wall Notes</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setRingModalVisible(true)}
                    style={[styles.cpActionBtn, { backgroundColor: '#9D174D' }]}
                  >
                    <MaterialCommunityIcons name="ring" size={20} color="#FFFFFF" />
                    <Text style={styles.cpActionBtnText}>Upgrade Ring</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleDissolveCp}
                    style={[styles.cpActionBtn, { backgroundColor: 'rgba(239, 68, 68, 0.85)' }]}
                  >
                    <Icon name="heart-dislike-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.cpActionBtnText}>Dissolve CP</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* HELP & RULES MODAL */}
      <Modal
        visible={helpModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setHelpModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.helpModalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>CP Center Rules & Privileges 📖</Text>
              <TouchableOpacity onPress={() => setHelpModalVisible(false)}>
                <Icon name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              <Text style={styles.helpHeading}>1. How to Establish CP</Text>
              <Text style={styles.helpBody}>
                Tap the "+ Invite" button, enter your partner's numeric ID, choose a romantic promise ring, and write a heartfelt confession. Once your partner accepts, your CP bond is established!
              </Text>

              <Text style={styles.helpHeading}>2. Increasing Intimacy Points</Text>
              <Text style={styles.helpBody}>
                • Daily Sweet Check-in: +100 Intimacy daily.{'\n'}
                • Voice Room Gifts: 1 Diamond spent on CP = 1 Charm & Wealth Point.{'\n'}
                • Chatting & Co-hosting on mic together.
              </Text>

              <Text style={styles.helpHeading}>3. Privileges by Level</Text>
              <Text style={styles.helpBody}>
                • Lv.1 (0 - 999): CP Icon, Emerald Avatar Frame, Serenity Room Theme, Profile Badge.{'\n'}
                • Lv.2 (1,000 - 4,999): Sapphire Crown Frame, Starlight Theme, Mic Aura.{'\n'}
                • Lv.3 (5,000 - 19,999): Ruby Passion Frame, Romance Castle, Entry Fanfare.{'\n'}
                • Lv.4 (20,000 - 49,999): Amethyst Sovereign Frame, Global Room Entry Notice.{'\n'}
                • Lv.5 (50,000+): Sovereign Eternity Gold Frame, Hall of Fame spotlight.
              </Text>
            </ScrollView>

            <TouchableOpacity
              onPress={() => setHelpModalVisible(false)}
              style={styles.helpCloseBtn}
            >
              <Text style={styles.helpCloseBtnText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* LOVE RANKING MODAL */}
      <Modal
        visible={rankModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRankModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.helpModalCard, { height: '80%' }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>👑 CP Love Rankings</Text>
              <TouchableOpacity onPress={() => setRankModalVisible(false)}>
                <Icon name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {couples.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptySub}>No couples on leaderboard yet.</Text>
                </View>
              ) : (
                couples.map((cp, idx) => (
                  <View key={cp._id || idx} style={styles.rankCardItem}>
                    <Text style={styles.rankIndexText}>#{idx + 1}</Text>
                    <View style={styles.rankAvatarsRow}>
                      <Image
                        source={getUserAvatar({
                          avatar: cp.user1?.avatar,
                          gender: cp.user1?.gender,
                        })}
                        style={styles.rankAvatarSmall}
                      />
                      <MaterialCommunityIcons name="heart" size={14} color="#F43F5E" />
                      <Image
                        source={getUserAvatar({
                          avatar: cp.user2?.avatar,
                          gender: cp.user2?.gender,
                        })}
                        style={styles.rankAvatarSmall}
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.rankCoupleNames} numberOfLines={1}>
                        {cp.user1?.name} & {cp.user2?.name}
                      </Text>
                      <Text style={styles.rankRingName}>{cp.ringName || 'Diamond Ring'}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.rankScoreText}>{(cp.intimacyScore || 0).toLocaleString()} 💖</Text>
                      <Text style={styles.rankLevelPill}>Lv.{cp.cpLevel || 1}</Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* PROPOSE / INVITE MODAL */}
      <Modal
        visible={proposeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setProposeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Romantic Proposal 💍</Text>
              <TouchableOpacity onPress={() => setProposeModalVisible(false)}>
                <Icon name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Partner Numeric ID *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 1002456"
                placeholderTextColor="#64748B"
                keyboardType="numeric"
                value={targetId}
                onChangeText={setTargetId}
              />

              <Text style={styles.inputLabel}>Select Proposal Ring</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                {RING_PRESETS.map((ring, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setSelectedRing(ring)}
                    style={[
                      styles.ringPickCard,
                      selectedRing.name === ring.name && styles.ringPickCardActive,
                    ]}
                  >
                    <Image source={{ uri: ring.image }} style={styles.ringPickImg} />
                    <Text style={styles.ringPickName} numberOfLines={1}>{ring.name}</Text>
                    <Text style={styles.ringPickTier}>Tier {ring.tier}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.inputLabel}>Love Confession Letter</Text>
              <TextInput
                style={[styles.modalInput, { height: 75, textAlignVertical: 'top' }]}
                placeholder="Write your heartfelt confession here..."
                placeholderTextColor="#64748B"
                multiline
                value={proposeMessage}
                onChangeText={setProposeMessage}
              />

              <TouchableOpacity
                onPress={handlePropose}
                disabled={proposing}
                style={styles.submitModalBtn}
              >
                {proposing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitModalBtnText}>Deliver Proposal 💌</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* WRITE LOVE NOTE MODAL */}
      <Modal
        visible={noteModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setNoteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Leave a Love Note 💌</Text>
              <TouchableOpacity onPress={() => setNoteModalVisible(false)}>
                <Icon name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.modalInput, { height: 100, textAlignVertical: 'top' }]}
              placeholder="Record a sweet memory, anniversary note, or promise to your partner..."
              placeholderTextColor="#64748B"
              multiline
              value={noteText}
              onChangeText={setNoteText}
            />

            <TouchableOpacity
              onPress={handlePostNote}
              disabled={postingNote}
              style={styles.submitModalBtn}
            >
              {postingNote ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitModalBtnText}>Publish Note ❤️</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* UPGRADE RING MODAL */}
      <Modal
        visible={ringModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRingModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Upgrade Couple Ring 💍</Text>
              <TouchableOpacity onPress={() => setRingModalVisible(false)}>
                <Icon name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Available Romantic Rings</Text>
            {RING_PRESETS.map((ring, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => handleUpgradeRing(ring)}
                disabled={upgradingRing}
                style={styles.ringUpgradeRow}
              >
                <Image source={{ uri: ring.image }} style={styles.ringUpgradeImg} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.ringUpgradeName}>{ring.name}</Text>
                  <Text style={styles.ringUpgradeDesc}>{ring.desc}</Text>
                </View>
                <LinearGradient colors={['#F43F5E', '#BE123C']} style={styles.ringUpgradeBadge}>
                  <Text style={styles.ringUpgradeBadgeText}>Upgrade</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#831843',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    zIndex: 50,
  },
  headerIconBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingBox: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#FFFFFF',
  },

  // Incoming Proposals Banner
  incomingBannerContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 6,
  },
  incomingBannerCard: {
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  incomingTitle: {
    color: '#FDE047',
    fontSize: 12,
    fontWeight: '800',
  },
  incomingSender: {
    color: '#FFFFFF',
    fontSize: 11,
    marginTop: 2,
  },
  incomingActions: {
    flexDirection: 'row',
    gap: 6,
  },
  incomingAcceptBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  incomingAcceptText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  incomingDeclineBtn: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  incomingDeclineText: {
    color: '#E2E8F0',
    fontSize: 11,
  },

  // Top Winged Heart Hero Section
  wingedHeartHeroWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    minHeight: 240,
  },
  wingsContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  leftWingWrap: {
    marginRight: -35,
    marginTop: -25,
  },
  centerPinkHeart: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FB7185',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  rightWingWrap: {
    marginLeft: -35,
    marginTop: -25,
  },
  heroAvatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    marginTop: 18,
    width: '100%',
    paddingHorizontal: 24,
  },
  avatarCol: {
    alignItems: 'center',
    width: 85,
  },
  goldRingShell: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2.2,
    borderColor: '#FDE047',
    padding: 2,
    backgroundColor: 'rgba(253, 224, 71, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAvatarImg: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  heroUserName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'center',
  },
  centerHeartBadgeWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
    width: 90,
  },
  lv0HeartImage: {
    width: 82,
    height: 68,
  },
  lv0HeartTextOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    top: 10,
  },
  lv0DaysText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  lv0LevelText: {
    color: '#FEF08A',
    fontSize: 9,
    fontWeight: '900',
    marginTop: 1,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  inviteContainer: {
    alignItems: 'center',
  },
  placeholderDashedCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.8,
    borderColor: 'rgba(255, 255, 255, 0.75)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(190, 24, 93, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteBtnTouch: {
    marginTop: -8,
  },
  inviteBtnImage: {
    width: 78,
    height: 28,
  },
  cpSubtitleText: {
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: 12.5,
    fontWeight: '600',
    marginTop: 16,
    zIndex: 10,
  },

  // Privileges Section
  privilegesSectionWrapper: {
    marginTop: 10,
    paddingHorizontal: 14,
  },
  privilegesRibbonWrap: {
    alignItems: 'center',
    zIndex: 15,
    marginBottom: -22,
  },
  privilegesRibbonImg: {
    width: 220,
    height: 54,
  },
  privilegesCardBox: {
    backgroundColor: '#F472B6',
    borderRadius: 22,
    borderWidth: 1.8,
    borderColor: '#FDE047',
    paddingTop: 30,
    paddingHorizontal: 12,
    paddingBottom: 16,
    shadowColor: '#BE185D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },

  // Level Stepper Bar
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginVertical: 10,
    position: 'relative',
  },
  stepperConnectingLine: {
    position: 'absolute',
    left: 28,
    right: 28,
    top: 15,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  stepperItem: {
    alignItems: 'center',
  },
  stepIconRing: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: '#FFFFFF',
  },
  stepIconRingSelected: {
    backgroundColor: '#9D174D',
    borderColor: '#FDE047',
    borderWidth: 2,
    transform: [{ scale: 1.15 }],
  },
  stepInnerLvlText: {
    position: 'absolute',
    fontSize: 7,
    fontWeight: '900',
    color: '#1E293B',
    bottom: 2,
  },
  stepInnerLvlTextSelected: {
    color: '#FDE047',
  },
  stepOuterLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: 4,
  },
  stepOuterLabelSelected: {
    color: '#FEF08A',
    fontWeight: '900',
    fontSize: 11.5,
  },

  // Perk Preview Cards
  perkSectionTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  perkPreviewCard: {
    backgroundColor: 'rgba(157, 23, 77, 0.48)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },

  // CP Icon Preview Row
  cpIconPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 4,
  },
  previewAvatarShell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.6,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
  },
  previewAvatarImg: {
    width: '100%',
    height: '100%',
  },
  badgePreviewImage: {
    width: 140,
    height: 52,
  },

  // Frame & Theme Preview
  frameThemeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 6,
  },
  framePreviewCol: {
    alignItems: 'center',
  },
  frameOuterRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2.5,
    borderColor: '#FDE047',
    padding: 2,
    backgroundColor: 'rgba(253, 224, 71, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameAvatarInside: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  frameTagBadge: {
    position: 'absolute',
    top: -4,
    left: -4,
    backgroundColor: '#BE185D',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: '#FDE047',
  },
  frameTagText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
  },
  frameTitleLabel: {
    color: '#FFE4E6',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'center',
  },
  themePreviewCol: {
    alignItems: 'center',
  },
  themeThumbnailCard: {
    width: 65,
    height: 75,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FDE047',
    overflow: 'hidden',
  },
  themePillWrap: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
  },
  themePillText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '700',
  },

  // Badge Profile Card Preview
  badgeProfileCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.35)',
  },
  badgeProfileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeProfileAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeMiniAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#FDE047',
  },
  badgeMiniHeart: {
    width: 26,
    height: 22,
  },
  badgeProfileInfo: {
    marginTop: 6,
  },
  badgeCoupleNameText: {
    color: '#93C5FD',
    fontSize: 11,
    fontWeight: '700',
  },
  badgeIdText: {
    color: '#F59E0B',
    fontSize: 9.5,
    fontWeight: '600',
    marginTop: 1,
  },

  // Active CP Features Grid
  activeCpCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: 'rgba(131, 24, 67, 0.65)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  activeCpSectionTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10,
  },
  activeCpButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cpActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E11D48',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    flex: 1,
    minWidth: '45%',
    justifyContent: 'center',
  },
  cpActionBtnDisabled: {
    opacity: 0.6,
  },
  cpActionBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  helpModalCard: {
    width: '100%',
    backgroundColor: '#1E1B4B',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#F472B6',
  },
  modalBox: {
    width: '100%',
    backgroundColor: '#1E1B4B',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#F472B6',
    maxHeight: '85%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  helpHeading: {
    color: '#FDE047',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 10,
    marginBottom: 4,
  },
  helpBody: {
    color: '#E2E8F0',
    fontSize: 12,
    lineHeight: 18,
  },
  helpCloseBtn: {
    marginTop: 14,
    backgroundColor: '#BE185D',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  helpCloseBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  // Propose Modal Inputs
  inputLabel: {
    color: '#FDE047',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 10,
  },
  modalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontSize: 13,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  ringPickCard: {
    width: 85,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 10,
    padding: 6,
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  ringPickCardActive: {
    borderColor: '#F43F5E',
    backgroundColor: 'rgba(244, 63, 94, 0.2)',
  },
  ringPickImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginBottom: 4,
  },
  ringPickName: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  ringPickTier: {
    color: '#FBBF24',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 1,
  },
  submitModalBtn: {
    backgroundColor: '#BE185D',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  submitModalBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  // Ring Upgrade List
  ringUpgradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
  },
  ringUpgradeImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  ringUpgradeName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  ringUpgradeDesc: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 2,
  },
  ringUpgradeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  ringUpgradeBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  // Rankings List
  rankCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
  },
  rankIndexText: {
    color: '#FDE047',
    fontSize: 13,
    fontWeight: '800',
    width: 24,
  },
  rankAvatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 6,
  },
  rankAvatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  rankCoupleNames: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  rankRingName: {
    color: '#94A3B8',
    fontSize: 10,
  },
  rankScoreText: {
    color: '#F43F5E',
    fontSize: 11,
    fontWeight: '800',
  },
  rankLevelPill: {
    backgroundColor: '#BE185D',
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptySub: {
    color: '#94A3B8',
    fontSize: 12,
  },
});
