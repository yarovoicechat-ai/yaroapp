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

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=200',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200',
];

const CLAN_LEVELS = [
  {
    level: 1,
    name: 'Bronze Clan',
    badge: 'BRONZE',
    expRequired: 0,
    maxMembers: 20,
    maxCoLeaders: 0,
    perk: 'Basic Clan Badge & Clan Room Seats',
    color: ['#B45309', '#78350F'],
  },
  {
    level: 2,
    name: 'Silver Clan',
    badge: 'SILVER',
    expRequired: 5000,
    maxMembers: 40,
    maxCoLeaders: 1,
    perk: 'Silver Badge, 1 Co-Leader Slot & +5% Check-in Bonus',
    color: ['#94A3B8', '#475569'],
  },
  {
    level: 3,
    name: 'Gold Clan',
    badge: 'GOLD',
    expRequired: 20000,
    maxMembers: 70,
    maxCoLeaders: 2,
    perk: 'Gold Animated Badge, 2 Co-Leaders & Entrance Banner',
    color: ['#F59E0B', '#B45309'],
  },
  {
    level: 4,
    name: 'Diamond Sovereign Clan',
    badge: 'DIAMOND',
    expRequired: 50000,
    maxMembers: 100,
    maxCoLeaders: 4,
    perk: 'Diamond Royal Halo, 4 Co-Leaders & +20% Check-in Bonus',
    color: ['#EC4899', '#8B5CF6'],
  },
];

export default function FamilyScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState('myFamily'); // 'myFamily' | 'ranking'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // My Family Data
  const [myFamilyData, setMyFamilyData] = useState(null);
  const [isLeader, setIsLeader] = useState(false);
  const [isCoLeader, setIsCoLeader] = useState(false);
  const [isCheckedInToday, setIsCheckedInToday] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [activeRooms, setActiveRooms] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [myInvitations, setMyInvitations] = useState([]);

  // Ranking / Explore Data
  const [families, setFamilies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [applyingId, setApplyingId] = useState(null);

  // Create Family Modal (10,000 Diamonds)
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [familyName, setFamilyName] = useState('');
  const [familyBadge, setFamilyBadge] = useState('');
  const [familyNotice, setFamilyNotice] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(PRESET_AVATARS[0]);
  const [creating, setCreating] = useState(false);

  // Join Requests Modal (Leader / Co-Leader)
  const [requestsModalVisible, setRequestsModalVisible] = useState(false);
  const [processingRequestId, setProcessingRequestId] = useState(null);

  // Invite Modal (Leader / Co-Leader)
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [inviteNumericId, setInviteNumericId] = useState('');
  const [inviting, setInviting] = useState(false);

  // Level Info Modal ("How to Upgrade")
  const [levelInfoModalVisible, setLevelInfoModalVisible] = useState(false);

  // Edit Notice Modal
  const [noticeModalVisible, setNoticeModalVisible] = useState(false);
  const [newNotice, setNewNotice] = useState('');
  const [savingNotice, setSavingNotice] = useState(false);

  // Manage Member Modal
  const [manageModalVisible, setManageModalVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [managing, setManaging] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [myRes, listRes] = await Promise.all([
        apiUtil.get('/family/my', { suppressGlobalError: true }).catch(() => null),
        apiUtil.get('/family', { suppressGlobalError: true }).catch(() => null),
      ]);

      const myPayload = myRes?.data?.data;
      if (myPayload && myPayload.family) {
        setMyFamilyData(myPayload.family);
        setIsLeader(Boolean(myPayload.isLeader));
        setIsCoLeader(Boolean(myPayload.isCoLeader));
        setIsCheckedInToday(Boolean(myPayload.isCheckedInToday));
        setActiveRooms(myPayload.activeRooms || []);
        setPendingRequests(myPayload.pendingRequests || []);
        setMyInvitations(myPayload.myInvitations || []);
        setActiveTab('myFamily');
      } else {
        setMyFamilyData(null);
        setIsLeader(false);
        setIsCoLeader(false);
        setIsCheckedInToday(false);
        setActiveRooms([]);
        setPendingRequests([]);
        setMyInvitations(myPayload?.myInvitations || []);
        setActiveTab('ranking');
      }

      const listPayload = listRes?.data?.data;
      const famList = Array.isArray(listPayload)
        ? listPayload
        : Array.isArray(listPayload?.families)
        ? listPayload.families
        : [];
      setFamilies(famList);
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

  // Daily Check-in (Roll Call)
  const handleCheckin = async () => {
    if (isCheckedInToday || checkingIn) return;
    setCheckingIn(true);
    try {
      const res = await apiUtil.post('/family/checkin', {}, { suppressGlobalError: true });
      AlertService.show('Roll Call Complete! 🌟', res?.data?.message || '+50 EXP & +10 Diamonds earned!', 'success');
      setIsCheckedInToday(true);
      loadData();
    } catch (err) {
      AlertService.show('Notice', err?.response?.data?.message || err?.message || 'Check-in failed.', 'info');
    } finally {
      setCheckingIn(false);
    }
  };

  // Create Family (Cost: 10,000 Diamonds, Sends Request to Admin)
  const handleCreateFamily = async () => {
    if (!familyName.trim()) {
      AlertService.show('Required', 'Please enter a Clan / Family name', 'error');
      return;
    }
    if (!familyBadge.trim()) {
      AlertService.show('Required', 'Please enter a Clan Label / Badge', 'error');
      return;
    }

    const currentDiamonds = Number(user?.diamonds || 0);
    if (currentDiamonds < 10000) {
      Alert.alert(
        'Insufficient Diamonds',
        `Clan creation requires 10,000 Diamonds. Your current balance is ${currentDiamonds.toLocaleString()} Diamonds. Would you like to recharge?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Recharge 💎', onPress: () => navigation.navigate('Wallet') },
        ]
      );
      return;
    }

    setCreating(true);
    try {
      const res = await apiUtil.post('/family/create', {
        name: familyName.trim(),
        badgeText: familyBadge.trim().toUpperCase(),
        notice: familyNotice.trim() || 'Welcome to our Family! Let us conquer the leaderboards together.',
        slogan: familyNotice.trim() || 'United we rise, together we conquer!',
        avatar: selectedAvatar,
      });

      setCreateModalVisible(false);
      setFamilyName('');
      setFamilyBadge('');
      setFamilyNotice('');

      Alert.alert(
        'Application Submitted! 👑',
        res?.data?.message ||
          'Your clan creation request with 10,000 Diamonds has been submitted to the Admin Panel. It will be activated once approved by the Admin team.',
        [{ text: 'OK', onPress: () => loadData() }]
      );
    } catch (err) {
      AlertService.show('Creation Error', err?.response?.data?.message || err?.message || 'Failed to create family', 'error');
    } finally {
      setCreating(false);
    }
  };

  // Send Join Request to a Clan
  const handleRequestJoin = async (fam) => {
    try {
      setApplyingId(fam._id);
      const res = await apiUtil.post(`/family/${fam._id}/request`, {
        message: 'I would love to join your clan!',
      });
      AlertService.show('Application Sent! 🛡️', res?.data?.message || `Join request sent to ${fam.name} leadership!`, 'success');
    } catch (err) {
      AlertService.show('Application Notice', err?.response?.data?.message || err?.message || `Could not apply to ${fam.name}.`, 'info');
    } finally {
      setApplyingId(null);
    }
  };

  // Leader / Co-Leader handles Join Request (Accept / Reject)
  const handleRequestAction = async (requestId, action) => {
    if (!myFamilyData?._id) return;
    setProcessingRequestId(requestId);
    try {
      const res = await apiUtil.post(`/family/${myFamilyData._id}/requests/${requestId}/action`, { action });
      AlertService.show(action === 'accept' ? 'Member Welcomed! 🎉' : 'Request Rejected', res?.data?.message || 'Action completed.', 'success');
      loadData();
    } catch (err) {
      AlertService.show('Action Notice', err?.response?.data?.message || err?.message || 'Failed to process request.', 'error');
    } finally {
      setProcessingRequestId(null);
    }
  };

  // Leader / Co-Leader invites user by Numeric ID
  const handleInviteUser = async () => {
    if (!inviteNumericId.trim() || !myFamilyData?._id) {
      AlertService.show('Required', 'Please enter user Numeric ID', 'error');
      return;
    }
    setInviting(true);
    try {
      const res = await apiUtil.post(`/family/${myFamilyData._id}/invite`, {
        targetNumericId: inviteNumericId.trim(),
      });
      AlertService.show('Invitation Sent! 💌', res?.data?.message || 'Clan invitation delivered!', 'success');
      setInviteModalVisible(false);
      setInviteNumericId('');
    } catch (err) {
      AlertService.show('Invite Notice', err?.response?.data?.message || err?.message || 'Failed to send invite.', 'info');
    } finally {
      setInviting(false);
    }
  };

  // Respond to incoming clan invitation
  const handleRespondInvitation = async (invitation, action) => {
    try {
      const res = await apiUtil.post(`/family/invitations/${invitation.familyId}/${invitation.invitationId}/respond`, {
        action,
      });
      AlertService.show(action === 'accept' ? 'Joined Clan! 👑' : 'Declined', res?.data?.message || 'Response submitted.', 'success');
      loadData();
    } catch (err) {
      AlertService.show('Notice', err?.response?.data?.message || err?.message || 'Failed to respond.', 'error');
    }
  };

  // Leave Family
  const handleLeaveFamily = () => {
    Alert.alert(
      'Leave Family',
      isLeader
        ? 'As the Leader, leaving will transfer leadership to a co-leader or dissolve the clan if you are the only member. Are you sure?'
        : 'Are you sure you want to leave this family?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiUtil.post('/family/leave', {}, { suppressGlobalError: true });
              AlertService.show('Left Family', 'You have left the clan.', 'info');
              loadData();
              setActiveTab('ranking');
            } catch (err) {
              AlertService.show('Error', err?.response?.data?.message || err?.message || 'Failed to leave family', 'error');
            }
          },
        },
      ]
    );
  };

  // Update Notice
  const handleSaveNotice = async () => {
    if (!myFamilyData?._id) return;
    setSavingNotice(true);
    try {
      await apiUtil.put(`/family/${myFamilyData._id}/notice`, { notice: newNotice.trim() });
      AlertService.show('Notice Published', 'Clan announcement updated.', 'success');
      setNoticeModalVisible(false);
      loadData();
    } catch (err) {
      AlertService.show('Error', err?.response?.data?.message || err?.message || 'Failed to update notice', 'error');
    } finally {
      setSavingNotice(false);
    }
  };

  // Manage Member (Promote / Demote / Kick / Transfer)
  const handleMemberAction = async (action) => {
    if (!myFamilyData?._id || !selectedMember?._id) return;
    setManaging(true);
    try {
      await apiUtil.post(`/family/${myFamilyData._id}/member/${selectedMember._id}/action`, { action });
      AlertService.show('Action Completed', `Member status updated successfully.`, 'success');
      setManageModalVisible(false);
      setSelectedMember(null);
      loadData();
    } catch (err) {
      AlertService.show('Notice', err?.response?.data?.message || err?.message || 'Failed to manage member', 'error');
    } finally {
      setManaging(false);
    }
  };

  const currentLevelConfig = CLAN_LEVELS.find((l) => l.level === (myFamilyData?.level || 1)) || CLAN_LEVELS[0];
  const nextLevelConfig = CLAN_LEVELS.find((l) => l.level === (myFamilyData?.level || 1) + 1);

  const filteredFamilies = families.filter(
    (f) =>
      !searchQuery ||
      f.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.badgeText?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.slogan?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const top3 = families.slice(0, 3);

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Royal Hero Header */}
      <LinearGradient
        colors={['#1E1035', '#2E1065', '#4C1D95']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: getAppTopSafeInset(insets.top) + 8 }]}
      >
        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Icon name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Family Guilds 👑</Text>
          <TouchableOpacity
            onPress={() => setCreateModalVisible(true)}
            style={styles.createPillBtn}
          >
            <Icon name="add" size={16} color="#FFFFFF" />
            <Text style={styles.createPillText}>Found Clan (10k 💎)</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            onPress={() => setActiveTab('myFamily')}
            style={[styles.tabBtn, activeTab === 'myFamily' && styles.tabBtnActive]}
          >
            <Text style={[styles.tabBtnText, activeTab === 'myFamily' && styles.tabBtnTextActive]}>
              🛡️ My Clan
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('ranking')}
            style={[styles.tabBtn, activeTab === 'ranking' && styles.tabBtnActive]}
          >
            <Text style={[styles.tabBtnText, activeTab === 'ranking' && styles.tabBtnTextActive]}>
              🏆 Hall of Fame
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Main Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#A855F7" />}
      >
        {/* Incoming Invitations Banner (if any) */}
        {myInvitations.length > 0 && (
          <View style={styles.inviteBannerCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialCommunityIcons name="email-seal-outline" size={26} color="#FBBF24" />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.inviteBannerTitle}>Clan Invitation 💌</Text>
                <Text style={styles.inviteBannerSub}>
                  You've been invited to join <Text style={{ fontWeight: '700', color: '#FFF' }}>{myInvitations[0].familyName}</Text>!
                </Text>
              </View>
            </View>
            <View style={styles.inviteActionsRow}>
              <TouchableOpacity
                onPress={() => handleRespondInvitation(myInvitations[0], 'accept')}
                style={styles.acceptInviteBtn}
              >
                <Text style={styles.acceptInviteText}>Join Clan 👑</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleRespondInvitation(myInvitations[0], 'decline')}
                style={styles.declineInviteBtn}
              >
                <Text style={styles.declineInviteText}>Decline</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {loading && !refreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#A855F7" />
            <Text style={styles.loadingText}>Loading clan halls...</Text>
          </View>
        ) : activeTab === 'myFamily' ? (
          myFamilyData ? (
            /* MY FAMILY VIEW */
            <View>
              {/* PENDING APPROVAL NOTICE BANNER */}
              {myFamilyData.approvalStatus === 'pending' && (
                <View style={styles.pendingAdminCard}>
                  <MaterialCommunityIcons name="clock-alert-outline" size={28} color="#F59E0B" />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.pendingAdminTitle}>Clan Application Under Admin Review ⏳</Text>
                    <Text style={styles.pendingAdminSub}>
                      Your clan request with 10,000 Diamonds has been submitted. It will become active and visible in the Hall of Fame once approved by the Admin team!
                    </Text>
                  </View>
                </View>
              )}

              {/* Clan Hero Card */}
              <LinearGradient
                colors={['#3B0764', '#581C87', '#6B21A8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.clanHeroCard}
              >
                <View style={styles.clanHeroTop}>
                  <View style={styles.clanAvatarWrapper}>
                    <Image source={{ uri: myFamilyData.avatar }} style={styles.clanAvatar} />
                    <LinearGradient colors={currentLevelConfig.color} style={styles.clanLevelBadge}>
                      <Text style={styles.clanLevelText}>Lv.{myFamilyData.level || 1}</Text>
                    </LinearGradient>
                  </View>

                  <View style={styles.clanMetaCol}>
                    <View style={styles.clanTitleRow}>
                      <Text style={styles.clanName} numberOfLines={1}>{myFamilyData.name}</Text>
                      <View style={styles.badgePill}>
                        <Text style={styles.badgePillText}>{myFamilyData.badgeText || 'YARO'}</Text>
                      </View>
                    </View>
                    <Text style={styles.clanSlogan} numberOfLines={2}>
                      {myFamilyData.slogan || myFamilyData.notice || 'United we rise, together we conquer!'}
                    </Text>
                    <View style={styles.rankPillRow}>
                      <TouchableOpacity
                        onPress={() => setLevelInfoModalVisible(true)}
                        style={styles.heroPill}
                      >
                        <MaterialCommunityIcons name="shield-star" size={13} color="#FBBF24" />
                        <Text style={styles.heroPillText}>{currentLevelConfig.name}</Text>
                      </TouchableOpacity>
                      <View style={[styles.heroPill, { backgroundColor: 'rgba(236, 72, 153, 0.2)' }]}>
                        <MaterialCommunityIcons name="diamond-stone" size={13} color="#F472B6" />
                        <Text style={styles.heroPillText}>{(myFamilyData.diamondsEarned || 0).toLocaleString()} 💎</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* 4 Levels Progress Bar */}
                <View style={styles.expBox}>
                  <View style={styles.expHeaderRow}>
                    <TouchableOpacity
                      onPress={() => setLevelInfoModalVisible(true)}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                    >
                      <Text style={styles.expLabel}>Guild EXP (4 Levels)</Text>
                      <Icon name="information-circle-outline" size={14} color="#D8B4FE" />
                    </TouchableOpacity>
                    <Text style={styles.expValue}>
                      {myFamilyData.exp || 0} / {nextLevelConfig ? nextLevelConfig.expRequired : 50000}
                    </Text>
                  </View>
                  <View style={styles.expTrack}>
                    <LinearGradient
                      colors={['#F59E0B', '#EC4899']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[
                        styles.expFill,
                        {
                          width: `${Math.min(
                            100,
                            Math.round(
                              ((myFamilyData.exp || 0) / Math.max(1, nextLevelConfig ? nextLevelConfig.expRequired : 50000)) *
                                100
                            )
                          )}%`,
                        },
                      ]}
                    />
                  </View>
                </View>
              </LinearGradient>

              {/* Clan Quick Actions (Leader/Co-Leader) */}
              {(isLeader || isCoLeader) && (
                <View style={styles.managementBar}>
                  <TouchableOpacity
                    onPress={() => setRequestsModalVisible(true)}
                    style={styles.managePillBtn}
                  >
                    <MaterialCommunityIcons name="account-clock" size={18} color="#FBBF24" />
                    <Text style={styles.managePillText}>
                      Join Requests {pendingRequests.length > 0 ? `(${pendingRequests.length})` : ''}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setInviteModalVisible(true)}
                    style={[styles.managePillBtn, { backgroundColor: '#4C1D95' }]}
                  >
                    <Icon name="person-add" size={16} color="#FFFFFF" />
                    <Text style={styles.managePillText}>Invite by ID</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* DAILY CLAN ROLL CALL (CHECK-IN) */}
              <LinearGradient
                colors={['#1E1B4B', '#312E81']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.checkinCard}
              >
                <View style={styles.checkinLeft}>
                  <MaterialCommunityIcons name="calendar-check" size={28} color="#FBBF24" />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.checkinHeading}>Daily Clan Roll Call</Text>
                    <Text style={styles.checkinSub}>
                      Earn +50 Guild EXP & +10 Clan Diamonds daily!
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
                      {isCheckedInToday ? '✓ Done Today' : 'Roll Call ⚡'}
                    </Text>
                  )}
                </TouchableOpacity>
              </LinearGradient>

              {/* CLAN ACTIVE LIVE VOICE ROOMS ("kisne kisne room open kar rakha hai") */}
              <View style={styles.liveRoomsCard}>
                <View style={styles.sectionHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialCommunityIcons name="broadcast" size={20} color="#EF4444" />
                    <Text style={[styles.sectionHeading, { marginLeft: 6 }]}>
                      Members On Air 🎙️ ({activeRooms.length})
                    </Text>
                  </View>
                </View>

                {activeRooms.length > 0 ? (
                  activeRooms.map((roomItem, idx) => (
                    <View key={roomItem._id || idx} style={styles.liveRoomRow}>
                      <Image
                        source={getUserAvatar({
                          avatar: roomItem.ownerId?.avatar,
                          gender: roomItem.ownerId?.gender,
                        })}
                        style={styles.liveHostAvatar}
                      />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.liveRoomTitle} numberOfLines={1}>
                          {roomItem.title || `${roomItem.ownerId?.name}'s Party`}
                        </Text>
                        <Text style={styles.liveHostName}>
                          Host: {roomItem.ownerId?.name} • ID: {roomItem.ownerId?.userId}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => navigation.navigate('VoiceRoom', { room: roomItem })}
                        style={styles.enterRoomBtn}
                      >
                        <Text style={styles.enterRoomBtnText}>Enter 🎙️</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyLiveBox}>
                    <Text style={styles.emptyLiveText}>
                      No clan members are currently live. Start a voice room to represent our clan!
                    </Text>
                  </View>
                )}
              </View>

              {/* Notice / Bulletin Board */}
              <View style={styles.noticeCard}>
                <View style={styles.noticeHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Icon name="megaphone" size={18} color="#F59E0B" />
                    <Text style={styles.noticeTitle}>Clan Announcement</Text>
                  </View>
                  {(isLeader || isCoLeader) && (
                    <TouchableOpacity
                      onPress={() => {
                        setNewNotice(myFamilyData.notice || '');
                        setNoticeModalVisible(true);
                      }}
                      style={styles.noticeEditBtn}
                    >
                      <Icon name="pencil" size={14} color="#A855F7" />
                      <Text style={styles.noticeEditText}>Edit</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.noticeBodyText}>
                  {myFamilyData.notice || 'Welcome to our Family! Let us conquer the leaderboards together.'}
                </Text>
              </View>

              {/* Officers & Command Section */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>Officers & Command 👑</Text>
              </View>

              {/* Leader Card */}
              {myFamilyData.leader && (
                <View style={styles.memberCard}>
                  <Image
                    source={getUserAvatar({
                      avatar: myFamilyData.leader?.avatar,
                      gender: myFamilyData.leader?.gender,
                    })}
                    style={styles.memberAvatar}
                  />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.memberName}>{myFamilyData.leader?.name || 'Leader'}</Text>
                      <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.roleTag}>
                        <Text style={styles.roleTagText}>Leader 👑</Text>
                      </LinearGradient>
                    </View>
                    <Text style={styles.memberMeta}>ID: {myFamilyData.leader?.userId || '—'}</Text>
                  </View>
                  <View style={styles.lvlPill}>
                    <Text style={styles.lvlPillText}>Lv.{myFamilyData.leader?.level || 1}</Text>
                  </View>
                </View>
              )}

              {/* Co-Leaders */}
              {Array.isArray(myFamilyData.coLeaders) &&
                myFamilyData.coLeaders.map((cl, i) => (
                  <View key={cl._id || i} style={styles.memberCard}>
                    <Image
                      source={getUserAvatar({ avatar: cl?.avatar, gender: cl?.gender })}
                      style={styles.memberAvatar}
                    />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.memberName}>{cl?.name || 'Co-Leader'}</Text>
                        <LinearGradient colors={['#8B5CF6', '#6D28D9']} style={styles.roleTag}>
                          <Text style={styles.roleTagText}>Co-Leader ⭐</Text>
                        </LinearGradient>
                      </View>
                      <Text style={styles.memberMeta}>ID: {cl?.userId || '—'}</Text>
                    </View>
                    <View style={styles.lvlPill}>
                      <Text style={styles.lvlPillText}>Lv.{cl?.level || 1}</Text>
                    </View>
                  </View>
                ))}

              {/* Member Roster */}
              <View style={[styles.sectionHeaderRow, { marginTop: 20 }]}>
                <Text style={styles.sectionHeading}>
                  Guild Members ({myFamilyData.members?.length || 1}/{myFamilyData.maxMembers || currentLevelConfig.maxMembers})
                </Text>
              </View>

              {Array.isArray(myFamilyData.members) &&
                myFamilyData.members.map((m, idx) => {
                  const isUserLeader = String(myFamilyData.leader?._id || myFamilyData.leader) === String(m._id);
                  const isUserCo = (myFamilyData.coLeaders || []).some(
                    (cl) => String(cl._id || cl) === String(m._id)
                  );
                  return (
                    <View key={m._id || idx} style={styles.memberCard}>
                      <Text style={styles.memberRankNum}>#{idx + 1}</Text>
                      <Image
                        source={getUserAvatar({ avatar: m?.avatar, gender: m?.gender })}
                        style={styles.memberAvatar}
                      />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.memberName}>{m?.name || 'Clan Warrior'}</Text>
                          {isUserLeader ? (
                            <View style={[styles.roleTag, { backgroundColor: '#F59E0B' }]}>
                              <Text style={styles.roleTagText}>Leader 👑</Text>
                            </View>
                          ) : isUserCo ? (
                            <View style={[styles.roleTag, { backgroundColor: '#8B5CF6' }]}>
                              <Text style={styles.roleTagText}>Co-Leader ⭐</Text>
                            </View>
                          ) : (
                            <View style={[styles.roleTag, { backgroundColor: '#475569' }]}>
                              <Text style={styles.roleTagText}>Member</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.memberMeta}>ID: {m?.userId || '—'}</Text>
                      </View>

                      {isLeader && !isUserLeader && (
                        <TouchableOpacity
                          onPress={() => {
                            setSelectedMember(m);
                            setManageModalVisible(true);
                          }}
                          style={styles.manageIconBtn}
                        >
                          <Icon name="ellipsis-vertical" size={18} color="#94A3B8" />
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}

              {/* Clan Actions */}
              <View style={styles.clanActionsRow}>
                <TouchableOpacity onPress={handleLeaveFamily} style={styles.leaveClanBtn}>
                  <Icon name="exit-outline" size={18} color="#EF4444" />
                  <Text style={styles.leaveClanBtnText}>Leave Family</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* EMPTY MY FAMILY VIEW */
            <View style={styles.emptyContainer}>
              <LinearGradient
                colors={['#4C1D95', '#6D28D9']}
                style={styles.emptyCrestCircle}
              >
                <MaterialCommunityIcons name="shield-crown" size={64} color="#FBBF24" />
              </LinearGradient>
              <Text style={styles.emptyTitle}>You Haven't Joined a Clan Yet</Text>
              <Text style={styles.emptySub}>
                Join a top dynasty from the Hall of Fame to earn clan diamonds, wear shared badges, and dominate voice room battles.
              </Text>
              <View style={styles.emptyActionsRow}>
                <TouchableOpacity
                  onPress={() => setActiveTab('ranking')}
                  style={styles.emptyExploreBtn}
                >
                  <Text style={styles.emptyExploreBtnText}>Browse Clans 🏆</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setCreateModalVisible(true)}
                  style={styles.emptyCreateBtn}
                >
                  <Text style={styles.emptyCreateBtnText}>Found Clan (10k 💎)</Text>
                </TouchableOpacity>
              </View>
            </View>
          )
        ) : (
          /* RANKING & EXPLORE VIEW */
          <View>
            {/* Top 3 Podium */}
            {top3.length >= 3 && (
              <View style={styles.podiumContainer}>
                {/* #2 Silver */}
                <View style={[styles.podiumCol, { marginTop: 24 }]}>
                  <View style={styles.podiumAvatarWrap}>
                    <Image source={{ uri: top3[1]?.avatar }} style={styles.podiumAvatar} />
                    <View style={[styles.podiumRankBadge, { backgroundColor: '#94A3B8' }]}>
                      <Text style={styles.podiumRankText}>2</Text>
                    </View>
                  </View>
                  <Text style={styles.podiumName} numberOfLines={1}>{top3[1]?.name}</Text>
                  <Text style={styles.podiumScore}>{(top3[1]?.diamondsEarned || 0).toLocaleString()} 💎</Text>
                </View>

                {/* #1 Gold */}
                <View style={styles.podiumCol}>
                  <MaterialCommunityIcons name="crown" size={28} color="#F59E0B" style={{ marginBottom: -4 }} />
                  <View style={[styles.podiumAvatarWrap, { borderColor: '#F59E0B', borderWidth: 2.5 }]}>
                    <Image source={{ uri: top3[0]?.avatar }} style={[styles.podiumAvatar, { width: 68, height: 68 }]} />
                    <View style={[styles.podiumRankBadge, { backgroundColor: '#F59E0B' }]}>
                      <Text style={styles.podiumRankText}>1</Text>
                    </View>
                  </View>
                  <Text style={[styles.podiumName, { fontWeight: '700', color: '#FDE047' }]} numberOfLines={1}>
                    {top3[0]?.name}
                  </Text>
                  <Text style={styles.podiumScore}>{(top3[0]?.diamondsEarned || 0).toLocaleString()} 💎</Text>
                </View>

                {/* #3 Bronze */}
                <View style={[styles.podiumCol, { marginTop: 32 }]}>
                  <View style={styles.podiumAvatarWrap}>
                    <Image source={{ uri: top3[2]?.avatar }} style={styles.podiumAvatar} />
                    <View style={[styles.podiumRankBadge, { backgroundColor: '#D97706' }]}>
                      <Text style={styles.podiumRankText}>3</Text>
                    </View>
                  </View>
                  <Text style={styles.podiumName} numberOfLines={1}>{top3[2]?.name}</Text>
                  <Text style={styles.podiumScore}>{(top3[2]?.diamondsEarned || 0).toLocaleString()} 💎</Text>
                </View>
              </View>
            )}

            {/* Search Input */}
            <View style={styles.searchBar}>
              <Icon name="search" size={18} color="#94A3B8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search clans by name or badge..."
                placeholderTextColor="#64748B"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Families List */}
            {filteredFamilies.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptySub}>No families match your search query.</Text>
              </View>
            ) : (
              filteredFamilies.map((fam, idx) => {
                const rankNum = idx + 1;
                const isCurrentMember = String(myFamilyData?._id) === String(fam._id);
                return (
                  <View key={fam._id || idx} style={styles.familyCard}>
                    <View style={styles.rankPill}>
                      <Text style={styles.rankPillText}>#{rankNum}</Text>
                    </View>

                    <Image source={{ uri: fam.avatar }} style={styles.famAvatar} />

                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.famName}>{fam.name}</Text>
                        <View style={styles.badgePill}>
                          <Text style={styles.badgePillText}>{fam.badgeText || 'YARO'}</Text>
                        </View>
                      </View>
                      <Text style={styles.famSlogan} numberOfLines={1}>
                        {fam.slogan || fam.notice || 'United we rise, together we conquer!'}
                      </Text>
                      <View style={styles.famStatsRow}>
                        <Text style={styles.famMembers}>
                          👥 {fam.memberCount || 1}/{fam.maxMembers || 20} (Lv.{fam.level || 1})
                        </Text>
                        <Text style={styles.famDiamonds}>
                          💎 {(fam.diamondsEarned || 0).toLocaleString()}
                        </Text>
                      </View>
                    </View>

                    {isCurrentMember ? (
                      <View style={styles.joinedPill}>
                        <Text style={styles.joinedPillText}>Joined ✓</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => handleRequestJoin(fam)}
                        disabled={applyingId === fam._id}
                        style={styles.joinBtn}
                      >
                        {applyingId === fam._id ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.joinBtnText}>Apply</Text>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* CREATE FAMILY MODAL (10,000 DIAMONDS + NICHE TIPS + ADMIN APPROVAL) */}
      <Modal
        visible={createModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { maxHeight: '90%' }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Establish a Sovereign Clan 👑</Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <Icon name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Cost Indicator */}
              <LinearGradient
                colors={['#831843', '#BE185D']}
                style={styles.feeBanner}
              >
                <MaterialCommunityIcons name="diamond-stone" size={20} color="#FBBF24" />
                <View style={{ marginLeft: 8, flex: 1 }}>
                  <Text style={styles.feeBannerTitle}>Creation Fee: 10,000 Diamonds</Text>
                  <Text style={styles.feeBannerSub}>
                    Your balance: {(user?.diamonds || 0).toLocaleString()} 💎
                  </Text>
                </View>
              </LinearGradient>

              <Text style={styles.inputLabel}>Clan Avatar</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                {PRESET_AVATARS.map((url, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => setSelectedAvatar(url)}
                    style={[
                      styles.avatarPickWrapper,
                      selectedAvatar === url && styles.avatarPickSelected,
                    ]}
                  >
                    <Image source={{ uri: url }} style={styles.avatarPickImg} />
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.inputLabel}>Clan Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Royal Emperors"
                placeholderTextColor="#64748B"
                value={familyName}
                onChangeText={setFamilyName}
              />

              <Text style={styles.inputLabel}>Clan Label / Badge (Max 6 chars) *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. ROYAL"
                placeholderTextColor="#64748B"
                maxLength={6}
                value={familyBadge}
                onChangeText={setFamilyBadge}
              />

              <Text style={styles.inputLabel}>Clan Announcements / Rules *</Text>
              <TextInput
                style={[styles.modalInput, { height: 75, textAlignVertical: 'top' }]}
                placeholder="Official clan announcements, vision, and entry requirements..."
                placeholderTextColor="#64748B"
                multiline
                value={familyNotice}
                onChangeText={setFamilyNotice}
              />

              {/* NICHE TIPS / IMPORTANT RULES */}
              <View style={styles.nicheTipsBox}>
                <Text style={styles.nicheTipsHeading}>📌 Clan Creation Guidelines & Tips:</Text>
                <Text style={styles.nicheTipItem}>
                  • <Text style={{ fontWeight: '700', color: '#FBBF24' }}>10,000 Diamonds</Text> will be deducted upon submission.
                </Text>
                <Text style={styles.nicheTipItem}>
                  • Your request will be sent to the <Text style={{ fontWeight: '700', color: '#A855F7' }}>Admin Panel for Approval</Text>. The clan will be active once approved.
                </Text>
                <Text style={styles.nicheTipItem}>
                  • Clanning starts at <Text style={{ fontWeight: '700', color: '#CBD5E1' }}>Level 1 (Bronze)</Text> with 20 members limit and upgrades up to Level 4 (Diamond) via check-ins and gifting.
                </Text>
                <Text style={styles.nicheTipItem}>
                  • Clan names and badges must be respectful and strictly follow community guidelines.
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleCreateFamily}
                disabled={creating}
                style={styles.submitModalBtn}
              >
                {creating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitModalBtnText}>Submit to Admin (10,000 💎) 👑</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 4 CLAN LEVELS & UPGRADE GUIDE MODAL */}
      <Modal
        visible={levelInfoModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLevelInfoModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>4 Clan Levels & How to Upgrade ℹ️</Text>
              <TouchableOpacity onPress={() => setLevelInfoModalVisible(false)}>
                <Icon name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.levelGuideSub}>
                Upgrade your Clan Level by earning Guild EXP through daily roll calls and voice room gifting!
              </Text>

              {CLAN_LEVELS.map((lvl) => (
                <View key={lvl.level} style={styles.levelCardItem}>
                  <LinearGradient colors={lvl.color} style={styles.levelCardBadge}>
                    <Text style={styles.levelCardBadgeText}>Lv.{lvl.level}</Text>
                  </LinearGradient>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.levelCardName}>{lvl.name}</Text>
                    <Text style={styles.levelCardReq}>
                      Required EXP: {lvl.expRequired.toLocaleString()} • Max Members: {lvl.maxMembers}
                    </Text>
                    <Text style={styles.levelCardPerk}>Perk: {lvl.perk}</Text>
                  </View>
                </View>
              ))}

              <View style={styles.howToEarnBox}>
                <Text style={styles.howToEarnTitle}>⚡ How to Gain Clan EXP:</Text>
                <Text style={styles.howToEarnItem}>
                  1. <Text style={{ fontWeight: '700', color: '#FBBF24' }}>Daily Member Roll Call:</Text> Each member check-in adds +50 Guild EXP daily.
                </Text>
                <Text style={styles.howToEarnItem}>
                  2. <Text style={{ fontWeight: '700', color: '#EC4899' }}>Voice Room Gifting:</Text> 10% of diamond gifts sent in live rooms converts to Clan EXP & Clan Diamonds.
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* JOIN REQUESTS MODAL (Leader/Co-Leader) */}
      <Modal
        visible={requestsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRequestsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Membership Applications 🛡️</Text>
              <TouchableOpacity onPress={() => setRequestsModalVisible(false)}>
                <Icon name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {pendingRequests.length === 0 ? (
              <View style={{ paddingVertical: 30, alignItems: 'center' }}>
                <Text style={{ color: '#94A3B8', fontSize: 13 }}>No pending join requests.</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {pendingRequests.map((reqItem) => (
                  <View key={reqItem._id} style={styles.requestCard}>
                    <Image
                      source={getUserAvatar({
                        avatar: reqItem.user?.avatar,
                        gender: reqItem.user?.gender,
                      })}
                      style={styles.reqAvatar}
                    />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.reqName}>{reqItem.user?.name || 'Applicant'}</Text>
                      <Text style={styles.reqMeta}>ID: {reqItem.user?.userId || '—'} • Lv.{reqItem.user?.level || 1}</Text>
                      <Text style={styles.reqMsg}>"{reqItem.message}"</Text>
                      <View style={styles.reqActionsRow}>
                        <TouchableOpacity
                          onPress={() => handleRequestAction(reqItem._id, 'accept')}
                          disabled={processingRequestId === reqItem._id}
                          style={styles.reqAcceptBtn}
                        >
                          <Text style={styles.reqAcceptText}>Accept ✓</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleRequestAction(reqItem._id, 'reject')}
                          disabled={processingRequestId === reqItem._id}
                          style={styles.reqRejectBtn}
                        >
                          <Text style={styles.reqRejectText}>Reject ✕</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* INVITE BY ID MODAL */}
      <Modal
        visible={inviteModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setInviteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Invite Member to Clan 💌</Text>
              <TouchableOpacity onPress={() => setInviteModalVisible(false)}>
                <Icon name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>User Numeric ID</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 1002456"
              placeholderTextColor="#64748B"
              keyboardType="numeric"
              value={inviteNumericId}
              onChangeText={setInviteNumericId}
            />

            <TouchableOpacity
              onPress={handleInviteUser}
              disabled={inviting}
              style={styles.submitModalBtn}
            >
              {inviting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitModalBtnText}>Send Clan Invitation 👑</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* EDIT NOTICE MODAL */}
      <Modal
        visible={noticeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setNoticeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Publish Clan Notice 📢</Text>
              <TouchableOpacity onPress={() => setNoticeModalVisible(false)}>
                <Icon name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.modalInput, { height: 100, textAlignVertical: 'top' }]}
              placeholder="Write the announcement for all clan members..."
              placeholderTextColor="#64748B"
              multiline
              value={newNotice}
              onChangeText={setNewNotice}
            />

            <TouchableOpacity
              onPress={handleSaveNotice}
              disabled={savingNotice}
              style={styles.submitModalBtn}
            >
              {savingNotice ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitModalBtnText}>Save Notice</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MANAGE MEMBER MODAL */}
      <Modal
        visible={manageModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setManageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Manage {selectedMember?.name || 'Member'}</Text>
              <TouchableOpacity onPress={() => setManageModalVisible(false)}>
                <Icon name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {managing ? (
              <ActivityIndicator size="large" color="#A855F7" style={{ marginVertical: 30 }} />
            ) : (
              <View style={{ gap: 12, marginTop: 10 }}>
                <TouchableOpacity
                  onPress={() => handleMemberAction('promote_co_leader')}
                  style={styles.actionRowBtn}
                >
                  <Icon name="star" size={20} color="#8B5CF6" />
                  <Text style={styles.actionRowText}>Promote to Co-Leader</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleMemberAction('demote_co_leader')}
                  style={styles.actionRowBtn}
                >
                  <Icon name="arrow-down" size={20} color="#64748B" />
                  <Text style={styles.actionRowText}>Demote to Member</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleMemberAction('transfer_leader')}
                  style={styles.actionRowBtn}
                >
                  <Icon name="shield" size={20} color="#F59E0B" />
                  <Text style={styles.actionRowText}>Transfer Leadership 👑</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleMemberAction('kick')}
                  style={[styles.actionRowBtn, { borderColor: 'rgba(239, 68, 68, 0.3)' }]}
                >
                  <Icon name="trash" size={20} color="#EF4444" />
                  <Text style={[styles.actionRowText, { color: '#EF4444' }]}>Kick from Clan</Text>
                </TouchableOpacity>
              </View>
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
    backgroundColor: '#0F0E17',
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
  createPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  createPillText: {
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
    backgroundColor: '#6D28D9',
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
    color: '#94A3B8',
  },
  inviteBannerCard: {
    backgroundColor: '#311042',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  inviteBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FBBF24',
  },
  inviteBannerSub: {
    fontSize: 12,
    color: '#E9D5FF',
    marginTop: 2,
  },
  inviteActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    justifyContent: 'flex-end',
  },
  acceptInviteBtn: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  acceptInviteText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  declineInviteBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  declineInviteText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  pendingAdminCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  pendingAdminTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FBBF24',
  },
  pendingAdminSub: {
    fontSize: 11,
    color: '#FEF3C7',
    marginTop: 3,
    lineHeight: 16,
  },
  clanHeroCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },
  clanHeroTop: {
    flexDirection: 'row',
  },
  clanAvatarWrapper: {
    position: 'relative',
  },
  clanAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  clanLevelBadge: {
    position: 'absolute',
    bottom: -4,
    alignSelf: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  clanLevelText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  clanMetaCol: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  clanTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clanName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    flexShrink: 1,
  },
  badgePill: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#000000',
  },
  clanSlogan: {
    fontSize: 12,
    color: '#E9D5FF',
    marginTop: 4,
  },
  rankPillRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  heroPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  expBox: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  expHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  expLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D8B4FE',
  },
  expValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  expTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    overflow: 'hidden',
  },
  expFill: {
    height: '100%',
    borderRadius: 4,
  },
  managementBar: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  managePillBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#26243A',
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  managePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
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
    color: '#C7D2FE',
    marginTop: 2,
  },
  checkinBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  checkinBtnActive: {
    backgroundColor: '#F59E0B',
  },
  checkinBtnDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  checkinBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  liveRoomsCard: {
    backgroundColor: '#1C1428',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  liveRoomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#261B33',
    padding: 10,
    borderRadius: 12,
    marginTop: 8,
  },
  liveHostAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#EF4444',
  },
  liveRoomTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  liveHostName: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  enterRoomBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  enterRoomBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyLiveBox: {
    paddingVertical: 12,
  },
  emptyLiveText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  noticeCard: {
    backgroundColor: '#1E1B2E',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.15)',
  },
  noticeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F59E0B',
    marginLeft: 6,
  },
  noticeEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  noticeEditText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A855F7',
  },
  noticeBodyText: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 18,
  },
  sectionHeaderRow: {
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181726',
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  memberRankNum: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    width: 24,
    textAlign: 'center',
  },
  memberAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  memberName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  roleTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  roleTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  memberMeta: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  lvlPill: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  lvlPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#C084FC',
  },
  manageIconBtn: {
    padding: 8,
  },
  clanActionsRow: {
    marginTop: 16,
    alignItems: 'center',
  },
  leaveClanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  leaveClanBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
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
  podiumAvatarWrap: {
    position: 'relative',
    borderRadius: 36,
  },
  podiumAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  podiumRankBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  podiumRankText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  podiumName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 8,
    textAlign: 'center',
  },
  podiumScore: {
    fontSize: 10,
    color: '#F472B6',
    marginTop: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1B2E',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#FFFFFF',
  },
  familyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181726',
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
  famAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  famName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  famSlogan: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  famStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  famMembers: {
    fontSize: 10,
    color: '#CBD5E1',
  },
  famDiamonds: {
    fontSize: 10,
    color: '#F472B6',
    fontWeight: '600',
  },
  joinBtn: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
  },
  joinBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  joinedPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  joinedPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyCrestCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
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
  emptyActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  emptyExploreBtn: {
    backgroundColor: '#1E1B2E',
    borderWidth: 1,
    borderColor: '#6D28D9',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyExploreBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyCreateBtn: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyCreateBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#181726',
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
  feeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    marginBottom: 14,
  },
  feeBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  feeBannerSub: {
    fontSize: 11,
    color: '#FDE68A',
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 6,
  },
  avatarPickWrapper: {
    marginRight: 10,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarPickSelected: {
    borderColor: '#F59E0B',
  },
  avatarPickImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  modalInput: {
    backgroundColor: '#26243A',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#FFFFFF',
    marginBottom: 14,
  },
  nicheTipsBox: {
    backgroundColor: '#1F1B30',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  nicheTipsHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E2E8F0',
    marginBottom: 6,
  },
  nicheTipItem: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 17,
    marginBottom: 3,
  },
  submitModalBtn: {
    backgroundColor: '#7C3AED',
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
  levelGuideSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 12,
    lineHeight: 18,
  },
  levelCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#26243A',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  levelCardBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  levelCardBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  levelCardName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  levelCardReq: {
    fontSize: 11,
    color: '#CBD5E1',
    marginTop: 2,
  },
  levelCardPerk: {
    fontSize: 11,
    color: '#FBBF24',
    marginTop: 3,
    fontWeight: '600',
  },
  howToEarnBox: {
    backgroundColor: '#1A1829',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  howToEarnTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  howToEarnItem: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 17,
    marginBottom: 4,
  },
  requestCard: {
    flexDirection: 'row',
    backgroundColor: '#26243A',
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
  },
  reqAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  reqName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reqMeta: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  reqMsg: {
    fontSize: 11,
    color: '#CBD5E1',
    fontStyle: 'italic',
    marginTop: 4,
  },
  reqActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  reqAcceptBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  reqAcceptText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reqRejectBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  reqRejectText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },
  actionRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#26243A',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  actionRowText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
