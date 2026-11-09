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

export default function CpSpaceScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState('space'); // 'space' | 'leaderboard'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Active CP Data
  const [myCp, setMyCp] = useState(null);
  const [partner, setPartner] = useState(null);
  const [daysTogether, setDaysTogether] = useState(0);
  const [isCheckedInToday, setIsCheckedInToday] = useState(false);
  const [nextLevelIntimacy, setNextLevelIntimacy] = useState(1000);
  const [checkingIn, setCheckingIn] = useState(false);

  // Proposals
  const [incomingProposals, setIncomingProposals] = useState([]);
  const [outgoingProposals, setOutgoingProposals] = useState([]);

  // Leaderboard Data
  const [couples, setCouples] = useState([]);

  // Propose Modal
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
        setNextLevelIntimacy(myPayload.nextLevelIntimacy || 1000);
        setIncomingProposals(myPayload.incomingProposals || []);
        setOutgoingProposals(myPayload.outgoingProposals || []);
        setActiveTab('space');
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

  const top3Couples = couples.slice(0, 3);

  // Helper to get self & partner info cleanly
  const selfUser = user || {};
  const currentPartner = partner || (myCp ? (String(myCp.user1?._id) === String(selfUser?._id || selfUser?.id) ? myCp.user2 : myCp.user1) : null);

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Romantic Hero Header */}
      <LinearGradient
        colors={['#4C0519', '#881337', '#BE123C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: getAppTopSafeInset(insets.top) + 8 }]}
      >
        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Icon name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>CP Love Space 💖</Text>
          <TouchableOpacity
            onPress={() => setProposeModalVisible(true)}
            style={styles.proposePillBtn}
          >
            <MaterialCommunityIcons name="ring" size={16} color="#FFFFFF" />
            <Text style={styles.proposePillText}>Propose</Text>
          </TouchableOpacity>
        </View>

        {/* Tab switch */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            onPress={() => setActiveTab('space')}
            style={[styles.tabBtn, activeTab === 'space' && styles.tabBtnActive]}
          >
            <Text style={[styles.tabBtnText, activeTab === 'space' && styles.tabBtnTextActive]}>
              💖 Our Love Nest
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('leaderboard')}
            style={[styles.tabBtn, activeTab === 'leaderboard' && styles.tabBtnActive]}
          >
            <Text style={[styles.tabBtnText, activeTab === 'leaderboard' && styles.tabBtnTextActive]}>
              👑 Love Ranking
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Main Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FB7185" />}
      >
        {loading && !refreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#FB7185" />
            <Text style={styles.loadingText}>Entering romantic space...</Text>
          </View>
        ) : activeTab === 'space' ? (
          myCp ? (
            /* ACTIVE CP LOVE NEST VIEW */
            <View>
              {/* Couple Palace Hero Card */}
              <LinearGradient
                colors={['#881337', '#9F1239', '#E11D48']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.coupleHeroCard}
              >
                {/* Ring & CP Title Banner */}
                <View style={styles.topRingBadge}>
                  <MaterialCommunityIcons name="ring" size={14} color="#FBBF24" />
                  <Text style={styles.topRingBadgeText}>
                    {myCp.ringName || 'Diamond Promise Ring'}
                  </Text>
                  <Text style={styles.cpTitleText}>• {myCp.cpTitle || 'Eternal Soulmates'}</Text>
                </View>

                {/* Dual Avatar Presentation */}
                <View style={styles.dualAvatarsRow}>
                  {/* User Avatar */}
                  <View style={styles.avatarCol}>
                    <View style={styles.avatarGlowCircle}>
                      <Image
                        source={getUserAvatar({
                          avatar: selfUser?.avatar || selfUser?.image,
                          gender: selfUser?.gender,
                        })}
                        style={styles.avatarImg}
                      />
                    </View>
                    <Text style={styles.partnerName} numberOfLines={1}>
                      {selfUser?.name || 'You'}
                    </Text>
                    <View style={styles.selfTagPill}>
                      <Text style={styles.selfTagText}>You</Text>
                    </View>
                  </View>

                  {/* Pulsating Connector */}
                  <View style={styles.heartConnectorCol}>
                    <MaterialCommunityIcons name="heart-pulse" size={38} color="#FFE4E6" />
                    <Text style={styles.intimacyScoreText}>
                      {(myCp.intimacyScore || 520).toLocaleString()} 💖
                    </Text>
                    <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.cpLvlBadge}>
                      <Text style={styles.cpLvlBadgeText}>Lv.{myCp.cpLevel || 1}</Text>
                    </LinearGradient>
                  </View>

                  {/* Partner Avatar */}
                  <View style={styles.avatarCol}>
                    <View style={styles.avatarGlowCircle}>
                      <Image
                        source={getUserAvatar({
                          avatar: currentPartner?.avatar || currentPartner?.image,
                          gender: currentPartner?.gender,
                        })}
                        style={styles.avatarImg}
                      />
                    </View>
                    <Text style={styles.partnerName} numberOfLines={1}>
                      {currentPartner?.name || 'Partner'}
                    </Text>
                    <View style={[styles.selfTagPill, { backgroundColor: '#F43F5E' }]}>
                      <Text style={styles.selfTagText}>Soulmate</Text>
                    </View>
                  </View>
                </View>

                {/* Anniversary Counter */}
                <View style={styles.anniversaryBanner}>
                  <Icon name="calendar-heart-outline" size={16} color="#FFE4E6" />
                  <Text style={styles.anniversaryText}>
                    Together for <Text style={{ fontWeight: '800', color: '#FFF' }}>{daysTogether}</Text> Days
                  </Text>
                </View>

                {/* Intimacy Progress Bar */}
                <View style={styles.intimacyTrackBox}>
                  <View style={styles.intimacyRow}>
                    <Text style={styles.intimacyLabel}>Affection Progression</Text>
                    <Text style={styles.intimacyValue}>
                      {myCp.intimacyScore || 0} / {nextLevelIntimacy}
                    </Text>
                  </View>
                  <View style={styles.intimacyTrack}>
                    <LinearGradient
                      colors={['#F43F5E', '#FDE047']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[
                        styles.intimacyFill,
                        {
                          width: `${Math.min(
                            100,
                            Math.round(((myCp.intimacyScore || 0) / Math.max(1, nextLevelIntimacy)) * 100)
                          )}%`,
                        },
                      ]}
                    />
                  </View>
                </View>
              </LinearGradient>

              {/* Daily Sweet Check-in Card */}
              <LinearGradient
                colors={['#1E1B4B', '#312E81']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.checkinCard}
              >
                <View style={styles.checkinLeft}>
                  <MaterialCommunityIcons name="heart-flash" size={30} color="#FB7185" />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.checkinHeading}>Daily Sweet Check-in</Text>
                    <Text style={styles.checkinSub}>
                      Nurture your affection tree & earn +100 Intimacy daily!
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleCheckin}
                  disabled={isCheckedInToday || checkingIn}
                  style={[
                    styles.checkinBtn,
                    isCheckedInToday ? styles.checkinBtnDisabled : styles.checkinBtnActive,
                  ]}
                >
                  {checkingIn ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.checkinBtnText}>
                      {isCheckedInToday ? '✓ Done Today' : 'Sign In 💖'}
                    </Text>
                  )}
                </TouchableOpacity>
              </LinearGradient>

              {/* Ring Showcase & Upgrade Card */}
              <View style={styles.ringCard}>
                <View style={styles.ringCardTop}>
                  <Image
                    source={{ uri: myCp.ringImage || RING_PRESETS[0].image }}
                    style={styles.ringShowcaseImg}
                  />
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={styles.ringHeading}>{myCp.ringName || 'Diamond Promise Ring'}</Text>
                    <Text style={styles.ringTierPill}>Tier {myCp.ringTier || 1} Sacred Bond</Text>
                    <Text style={styles.ringDesc}>
                      Grants exclusive couple seat sparkle and matching room entrance fanfare.
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => setRingModalVisible(true)}
                  style={styles.upgradeRingBtn}
                >
                  <MaterialCommunityIcons name="ring" size={16} color="#FFFFFF" />
                  <Text style={styles.upgradeRingBtnText}>Upgrade Ring 💍</Text>
                </TouchableOpacity>
              </View>

              {/* Couple Privileges Grid */}
              <View style={styles.perksCard}>
                <Text style={styles.perksHeading}>Sacred CP Privileges 👑</Text>
                <View style={styles.perksGrid}>
                  <View style={styles.perkItem}>
                    <MaterialCommunityIcons name="card-account-details-star" size={24} color="#FB7185" />
                    <Text style={styles.perkLabel}>Dual Card</Text>
                    <Text style={styles.perkDesc}>Highlighted soulmate badge</Text>
                  </View>
                  <View style={styles.perkItem}>
                    <MaterialCommunityIcons name="seat-passenger" size={24} color="#F43F5E" />
                    <Text style={styles.perkLabel}>CP Seat Aura</Text>
                    <Text style={styles.perkDesc}>Heart pulse on mic seat</Text>
                  </View>
                  <View style={styles.perkItem}>
                    <MaterialCommunityIcons name="tree" size={24} color="#10B981" />
                    <Text style={styles.perkLabel}>Love Tree</Text>
                    <Text style={styles.perkDesc}>Daily affection water</Text>
                  </View>
                  <View style={styles.perkItem}>
                    <MaterialCommunityIcons name="star-shooting" size={24} color="#FBBF24" />
                    <Text style={styles.perkLabel}>Entry Fanfare</Text>
                    <Text style={styles.perkDesc}>Paired room entry banner</Text>
                  </View>
                </View>
              </View>

              {/* Love Wall / Sweet Memories Timeline */}
              <View style={styles.loveWallCard}>
                <View style={styles.wallHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Icon name="heart" size={18} color="#F43F5E" />
                    <Text style={styles.wallTitle}>Love Wall Memories 💌</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setNoteModalVisible(true)}
                    style={styles.writeNoteBtn}
                  >
                    <Icon name="pencil" size={14} color="#FB7185" />
                    <Text style={styles.writeNoteText}>Write Note</Text>
                  </TouchableOpacity>
                </View>

                {Array.isArray(myCp.loveWall) && myCp.loveWall.length > 0 ? (
                  myCp.loveWall.map((note, i) => (
                    <View key={i} style={styles.noteItem}>
                      <Image
                        source={getUserAvatar({
                          avatar: note.sender?.avatar,
                          gender: note.sender?.gender,
                        })}
                        style={styles.noteAvatar}
                      />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={styles.noteAuthor}>{note.sender?.name || 'Soulmate'}</Text>
                          <Text style={styles.noteDate}>
                            {new Date(note.createdAt).toLocaleDateString()}
                          </Text>
                        </View>
                        <Text style={styles.noteBodyText}>{note.text}</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyWallText}>
                    No love notes written yet. Be the first to leave a sweet memory! ❤️
                  </Text>
                )}
              </View>

              {/* Dissolve CP Action */}
              <View style={styles.dissolveRow}>
                <TouchableOpacity onPress={handleDissolveCp} style={styles.dissolveBtn}>
                  <Icon name="heart-dislike-outline" size={18} color="#EF4444" />
                  <Text style={styles.dissolveBtnText}>Dissolve CP Bond</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* SINGLE / NO CP VIEW */
            <View>
              {/* Incoming Proposals Card (if any) */}
              {incomingProposals.length > 0 && (
                <View style={styles.proposalsSection}>
                  <Text style={styles.proposalSectionTitle}>Incoming Confessions 💌</Text>
                  {incomingProposals.map((prop) => (
                    <View key={prop._id} style={styles.proposalCard}>
                      <Image
                        source={getUserAvatar({
                          avatar: prop.sender?.avatar,
                          gender: prop.sender?.gender,
                        })}
                        style={styles.proposalAvatar}
                      />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.proposerName}>{prop.sender?.name || 'Secret Admirer'}</Text>
                        <Text style={styles.proposerRing}>Offered: {prop.ringName || 'Diamond Ring'} 💍</Text>
                        <Text style={styles.proposalMsg} numberOfLines={2}>
                          "{prop.message}"
                        </Text>
                        <View style={styles.proposalActionsRow}>
                          <TouchableOpacity
                            onPress={() => handleRespondProposal(prop._id, 'accept')}
                            style={styles.acceptPropBtn}
                          >
                            <Text style={styles.acceptPropText}>Accept 💖</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleRespondProposal(prop._id, 'decline')}
                            style={styles.declinePropBtn}
                          >
                            <Text style={styles.declinePropText}>Decline</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Outgoing proposals notice */}
              {outgoingProposals.length > 0 && (
                <View style={styles.outgoingCard}>
                  <Icon name="time-outline" size={18} color="#FBBF24" />
                  <Text style={styles.outgoingText}>
                    Waiting for {outgoingProposals[0]?.receiver?.name || 'partner'} to respond to your romantic proposal...
                  </Text>
                </View>
              )}

              {/* Grand Empty CP Welcome Banner */}
              <View style={styles.emptyContainer}>
                <LinearGradient
                  colors={['#881337', '#BE123C']}
                  style={styles.emptyRingCircle}
                >
                  <MaterialCommunityIcons name="heart-multiple-outline" size={60} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.emptyTitle}>Find Your Soulmate & Enter CP Space</Text>
                <Text style={styles.emptySub}>
                  Form a sacred couple bond, wear matching diamond rings, display dual frames in rooms, and water your daily intimacy tree.
                </Text>

                <TouchableOpacity
                  onPress={() => setProposeModalVisible(true)}
                  style={styles.proposeLargeBtn}
                >
                  <LinearGradient
                    colors={['#F43F5E', '#E11D48']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.proposeLargeGrad}
                  >
                    <MaterialCommunityIcons name="ring" size={20} color="#FFFFFF" />
                    <Text style={styles.proposeLargeText}>Send Romantic Proposal 💍</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* CP Perks Showcase */}
              <View style={styles.perksCard}>
                <Text style={styles.perksHeading}>Couple Privileges Awaiting You</Text>
                <View style={styles.perksGrid}>
                  <View style={styles.perkItem}>
                    <MaterialCommunityIcons name="card-account-details-star" size={24} color="#FB7185" />
                    <Text style={styles.perkLabel}>Couple Card</Text>
                    <Text style={styles.perkDesc}>Special dual profile highlight</Text>
                  </View>
                  <View style={styles.perkItem}>
                    <MaterialCommunityIcons name="seat-passenger" size={24} color="#F43F5E" />
                    <Text style={styles.perkLabel}>CP Seat Aura</Text>
                    <Text style={styles.perkDesc}>Rippling heart effects on mics</Text>
                  </View>
                  <View style={styles.perkItem}>
                    <MaterialCommunityIcons name="tree" size={24} color="#10B981" />
                    <Text style={styles.perkLabel}>Love Tree</Text>
                    <Text style={styles.perkDesc}>Water daily for diamonds</Text>
                  </View>
                  <View style={styles.perkItem}>
                    <MaterialCommunityIcons name="star-shooting" size={24} color="#FBBF24" />
                    <Text style={styles.perkLabel}>Entry Fanfare</Text>
                    <Text style={styles.perkDesc}>Paired entrance into rooms</Text>
                  </View>
                </View>
              </View>
            </View>
          )
        ) : (
          /* LEADERBOARD VIEW */
          <View>
            {/* Top 3 Podium */}
            {top3Couples.length >= 3 && (
              <View style={styles.podiumContainer}>
                {/* #2 Silver */}
                <View style={[styles.podiumCol, { marginTop: 24 }]}>
                  <View style={styles.podiumDualWrap}>
                    <Image
                      source={getUserAvatar({
                        avatar: top3Couples[1]?.user1?.avatar,
                        gender: top3Couples[1]?.user1?.gender,
                      })}
                      style={styles.podiumMiniAvatar}
                    />
                    <MaterialCommunityIcons name="heart" size={14} color="#F43F5E" />
                    <Image
                      source={getUserAvatar({
                        avatar: top3Couples[1]?.user2?.avatar,
                        gender: top3Couples[1]?.user2?.gender,
                      })}
                      style={styles.podiumMiniAvatar}
                    />
                  </View>
                  <Text style={styles.podiumNames} numberOfLines={1}>
                    {top3Couples[1]?.user1?.name} & {top3Couples[1]?.user2?.name}
                  </Text>
                  <Text style={styles.podiumScore}>
                    {(top3Couples[1]?.intimacyScore || 0).toLocaleString()} 💖
                  </Text>
                </View>

                {/* #1 Gold */}
                <View style={styles.podiumCol}>
                  <MaterialCommunityIcons name="crown" size={26} color="#FBBF24" style={{ marginBottom: 2 }} />
                  <View style={[styles.podiumDualWrap, { borderColor: '#FBBF24', borderWidth: 2 }]}>
                    <Image
                      source={getUserAvatar({
                        avatar: top3Couples[0]?.user1?.avatar,
                        gender: top3Couples[0]?.user1?.gender,
                      })}
                      style={[styles.podiumMiniAvatar, { width: 38, height: 38, borderRadius: 19 }]}
                    />
                    <MaterialCommunityIcons name="heart-pulse" size={16} color="#F43F5E" />
                    <Image
                      source={getUserAvatar({
                        avatar: top3Couples[0]?.user2?.avatar,
                        gender: top3Couples[0]?.user2?.gender,
                      })}
                      style={[styles.podiumMiniAvatar, { width: 38, height: 38, borderRadius: 19 }]}
                    />
                  </View>
                  <Text style={[styles.podiumNames, { color: '#FDE047', fontWeight: '800' }]} numberOfLines={1}>
                    {top3Couples[0]?.user1?.name} & {top3Couples[0]?.user2?.name}
                  </Text>
                  <Text style={styles.podiumScore}>
                    {(top3Couples[0]?.intimacyScore || 0).toLocaleString()} 💖
                  </Text>
                </View>

                {/* #3 Bronze */}
                <View style={[styles.podiumCol, { marginTop: 32 }]}>
                  <View style={styles.podiumDualWrap}>
                    <Image
                      source={getUserAvatar({
                        avatar: top3Couples[2]?.user1?.avatar,
                        gender: top3Couples[2]?.user1?.gender,
                      })}
                      style={styles.podiumMiniAvatar}
                    />
                    <MaterialCommunityIcons name="heart" size={14} color="#F43F5E" />
                    <Image
                      source={getUserAvatar({
                        avatar: top3Couples[2]?.user2?.avatar,
                        gender: top3Couples[2]?.user2?.gender,
                      })}
                      style={styles.podiumMiniAvatar}
                    />
                  </View>
                  <Text style={styles.podiumNames} numberOfLines={1}>
                    {top3Couples[2]?.user1?.name} & {top3Couples[2]?.user2?.name}
                  </Text>
                  <Text style={styles.podiumScore}>
                    {(top3Couples[2]?.intimacyScore || 0).toLocaleString()} 💖
                  </Text>
                </View>
              </View>
            )}

            {/* Full Couples List */}
            {couples.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptySub}>No couples currently on the leaderboard.</Text>
              </View>
            ) : (
              couples.map((cp, idx) => (
                <View key={cp._id || idx} style={styles.rankCard}>
                  <View style={styles.rankPill}>
                    <Text style={styles.rankPillText}>#{idx + 1}</Text>
                  </View>

                  <View style={styles.coupleAvatarsRow}>
                    <Image
                      source={getUserAvatar({
                        avatar: cp.user1?.avatar,
                        gender: cp.user1?.gender,
                      })}
                      style={styles.tinyAvatar}
                    />
                    <MaterialCommunityIcons
                      name="heart"
                      size={14}
                      color="#F43F5E"
                      style={{ marginHorizontal: 2 }}
                    />
                    <Image
                      source={getUserAvatar({
                        avatar: cp.user2?.avatar,
                        gender: cp.user2?.gender,
                      })}
                      style={styles.tinyAvatar}
                    />
                  </View>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.coupleNames} numberOfLines={1}>
                      {cp.user1?.name} & {cp.user2?.name}
                    </Text>
                    <Text style={styles.coupleRing}>{cp.ringName || 'Diamond Promise Ring'}</Text>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.coupleScore}>{(cp.intimacyScore || 0).toLocaleString()} 💖</Text>
                    <Text style={styles.coupleLevelPill}>Lv.{cp.cpLevel || 1}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* PROPOSE MODAL */}
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
                style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]}
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

            {upgradingRing ? (
              <ActivityIndicator size="large" color="#FB7185" style={{ marginVertical: 30 }} />
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {RING_PRESETS.map((ring, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => handleUpgradeRing(ring)}
                    style={styles.ringTierRow}
                  >
                    <Image source={{ uri: ring.image }} style={styles.ringTierImg} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.ringTierName}>{ring.name}</Text>
                      <Text style={styles.ringTierDesc}>{ring.desc}</Text>
                      <Text style={styles.ringBonus}>+500 Intimacy Boost</Text>
                    </View>
                    <View style={styles.equipBtn}>
                      <Text style={styles.equipBtnText}>Equip</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0B15',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  proposePillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#BE123C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  proposePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 24,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 20,
  },
  tabBtnActive: {
    backgroundColor: '#BE123C',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
  },
  loadingBox: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#FDA4AF',
  },
  coupleHeroCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
  },
  topRingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginBottom: 14,
  },
  topRingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FBBF24',
  },
  cpTitleText: {
    fontSize: 11,
    color: '#FFE4E6',
  },
  dualAvatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  avatarCol: {
    alignItems: 'center',
    width: width * 0.28,
  },
  avatarGlowCircle: {
    borderWidth: 2.5,
    borderColor: '#F43F5E',
    borderRadius: 36,
    padding: 2,
    backgroundColor: 'rgba(244, 63, 94, 0.2)',
  },
  avatarImg: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  partnerName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 6,
  },
  selfTagPill: {
    backgroundColor: '#881337',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 3,
  },
  selfTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heartConnectorCol: {
    alignItems: 'center',
  },
  intimacyScoreText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
  },
  cpLvlBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  cpLvlBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  anniversaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
    marginTop: 14,
  },
  anniversaryText: {
    fontSize: 12,
    color: '#FFE4E6',
  },
  intimacyTrackBox: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  intimacyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  intimacyLabel: {
    fontSize: 11,
    color: '#FFE4E6',
    fontWeight: '600',
  },
  intimacyValue: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  intimacyTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    overflow: 'hidden',
  },
  intimacyFill: {
    height: '100%',
    borderRadius: 4,
  },
  checkinCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    marginBottom: 14,
  },
  checkinLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  checkinHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  checkinSub: {
    fontSize: 11,
    color: '#CBD5E1',
    marginTop: 2,
  },
  checkinBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  checkinBtnActive: {
    backgroundColor: '#BE123C',
  },
  checkinBtnDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  checkinBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ringCard: {
    backgroundColor: '#1C1425',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.15)',
  },
  ringCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ringShowcaseImg: {
    width: 58,
    height: 58,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FBBF24',
  },
  ringHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ringTierPill: {
    fontSize: 11,
    color: '#FBBF24',
    fontWeight: '600',
    marginTop: 2,
  },
  ringDesc: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 3,
  },
  upgradeRingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#881337',
    paddingVertical: 9,
    borderRadius: 14,
    marginTop: 12,
  },
  upgradeRingBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  perksCard: {
    backgroundColor: '#1C1425',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  perksHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  perksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  perkItem: {
    width: (width - 64) / 2,
    backgroundColor: '#261B33',
    padding: 12,
    borderRadius: 12,
  },
  perkLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 6,
  },
  perkDesc: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  loveWallCard: {
    backgroundColor: '#1C1425',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.15)',
  },
  wallHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  wallTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FB7185',
    marginLeft: 6,
  },
  writeNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  writeNoteText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FB7185',
  },
  noteItem: {
    flexDirection: 'row',
    backgroundColor: '#261B33',
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
  },
  noteAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  noteAuthor: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  noteDate: {
    fontSize: 10,
    color: '#64748B',
  },
  noteBodyText: {
    fontSize: 12,
    color: '#E2E8F0',
    marginTop: 4,
    lineHeight: 17,
  },
  emptyWallText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 14,
  },
  dissolveRow: {
    alignItems: 'center',
    marginTop: 10,
  },
  dissolveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  dissolveBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  proposalsSection: {
    marginBottom: 16,
  },
  proposalSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FB7185',
    marginBottom: 8,
  },
  proposalCard: {
    flexDirection: 'row',
    backgroundColor: '#261B33',
    padding: 12,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  proposalAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  proposerName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  proposerRing: {
    fontSize: 11,
    color: '#FBBF24',
    marginTop: 2,
  },
  proposalMsg: {
    fontSize: 11,
    color: '#CBD5E1',
    marginTop: 4,
    fontStyle: 'italic',
  },
  proposalActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  acceptPropBtn: {
    backgroundColor: '#BE123C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  acceptPropText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  declinePropBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  declinePropText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  outgoingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  outgoingText: {
    fontSize: 12,
    color: '#FDE68A',
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
  },
  emptyRingCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  proposeLargeBtn: {
    marginTop: 22,
    borderRadius: 25,
    overflow: 'hidden',
  },
  proposeLargeGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  proposeLargeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    marginBottom: 20,
    paddingVertical: 12,
  },
  podiumCol: {
    alignItems: 'center',
    width: width * 0.28,
  },
  podiumDualWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#261B33',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 20,
  },
  podiumMiniAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  podiumNames: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 8,
    textAlign: 'center',
  },
  podiumScore: {
    fontSize: 10,
    color: '#FB7185',
    marginTop: 2,
    fontWeight: '700',
  },
  rankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1425',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  rankPill: {
    width: 28,
    alignItems: 'center',
  },
  rankPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  coupleAvatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tinyAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  coupleNames: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  coupleRing: {
    fontSize: 10,
    color: '#FBBF24',
    marginTop: 2,
  },
  coupleScore: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FB7185',
  },
  coupleLevelPill: {
    fontSize: 10,
    fontWeight: '700',
    color: '#CBD5E1',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#1C1425',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#261B33',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#FFFFFF',
    marginBottom: 14,
  },
  ringPickCard: {
    width: 90,
    backgroundColor: '#261B33',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  ringPickCardActive: {
    borderColor: '#BE123C',
    backgroundColor: '#381628',
  },
  ringPickImg: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  ringPickName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 4,
    textAlign: 'center',
  },
  ringPickTier: {
    fontSize: 9,
    color: '#FBBF24',
    marginTop: 2,
  },
  submitModalBtn: {
    backgroundColor: '#BE123C',
    paddingVertical: 13,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 6,
  },
  submitModalBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ringTierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#261B33',
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
  },
  ringTierImg: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  ringTierName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ringTierDesc: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  ringBonus: {
    fontSize: 10,
    color: '#FBBF24',
    fontWeight: '700',
    marginTop: 3,
  },
  equipBtn: {
    backgroundColor: '#BE123C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  equipBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
