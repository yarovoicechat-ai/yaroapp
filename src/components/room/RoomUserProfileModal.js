import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  ScrollView,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { AlertService } from '../../utils/AlertService';
import AvatarWithFrame from '../AvatarWithFrame';
import IdentityDisplayId from '../identity/IdentityDisplayId';
import { AuthContext } from '../../context/AuthProvider';
import { getUserAvatar } from '../../utils/avatarUtil';
import { apiUtil } from '../../utils/apiUtil';
import { formatCompactBalance } from '../../utils/numberUtil';

const { width } = Dimensions.get('window');

// 7 Prestige Medals strictly matching Screenshot 2
const PRESTIGE_MEDALS = [
  { id: 'm1', label: 'Verified', icon: 'shield-check', colors: ['#F59E0B', '#D97706'], badge: 'VERIFIED' },
  { id: 'm2', label: 'Crystal Crown', icon: 'crown', colors: ['#38BDF8', '#0284C7'], badge: 'VIP' },
  { id: 'm3', label: '40M Received', icon: 'heart', colors: ['#EF4444', '#DC2626'], badge: '40M' },
  { id: 'm4', label: '30-Day Loyalty', icon: 'shield-star', colors: ['#10B981', '#059669'], badge: '30' },
  { id: 'm5', label: 'Eagle SVIP 1', icon: 'shield-crown', colors: ['#F59E0B', '#B45309'], badge: 'SVIP' },
  { id: 'm6', label: 'Eagle SVIP 2', icon: 'shield-crown', colors: ['#F59E0B', '#B45309'], badge: 'SVIP' },
  { id: 'm7', label: 'Eagle SVIP 3', icon: 'shield-crown', colors: ['#F59E0B', '#B45309'], badge: 'SVIP' },
  { id: 'm8', label: 'CP Level 6', icon: 'heart-multiple', colors: ['#EC4899', '#BE185D'], badge: 'LV.6' },
  { id: 'm9', label: 'Honor 35', icon: 'laurel', colors: ['#10B981', '#047857'], badge: '35' },
];

export default function RoomUserProfileModal({
  visible,
  onClose,
  user,
  currentUserId,
  currentUserFrame = null,
  onMention,
  onGift,
  onFollow,
  onReport,
  onLeaveSeat,
  onOpenFullProfile,
  onOpenChat,
  isHostOrAdmin = false,
  isRoomOwner = false,
  isGlobalRoomManager = false,
  roomOwnerId,
  admins = [],
  seats = [],
  onToggleAdmin,
  onBanChat,
  onKickUser,
  onRemoveFromSeat,
  onToggleSeatLock,
  onMuteSeat,
  bannedChatUsers = [],
  mutedUsers = [],
  bottomSafePadding = 16,
}) {
  const { user: authUser, equippedFrame } = useContext(AuthContext) || {};
  const [resolvedProfile, setResolvedProfile] = useState(null);
  const targetUserId = String(user?.userId || user?.id || user?._id || '');
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentFollowersCount, setCurrentFollowersCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (!visible || !targetUserId) {
      setResolvedProfile(null);
      return undefined;
    }

    let current = true;
    setResolvedProfile(null);

    // Record profile visit in background
    apiUtil.post(`/user/visit/${encodeURIComponent(targetUserId)}`).catch(() => {});

    apiUtil.get(`/user/profile/${encodeURIComponent(targetUserId)}`)
      .then((response) => {
        const profile = response.data?.user || response.data?.data?.user || response.data?.data;
        if (current && profile && typeof profile === 'object') {
          setResolvedProfile(profile);
          setIsFollowing(Boolean(profile.isFollowing));
          setCurrentFollowersCount(
            Number(profile.followersCount ?? (Array.isArray(profile.followers) ? profile.followers.length : 0))
          );
        }
      })
      .catch(() => {});

    return () => { current = false; };
  }, [visible, targetUserId]);

  useEffect(() => {
    const initialFollowing = Boolean(resolvedProfile?.isFollowing || user?.isFollowing);
    setIsFollowing(initialFollowing);
    const initialCount = Number(
      resolvedProfile?.followersCount ??
      user?.followersCount ??
      (Array.isArray(user?.followers) ? user.followers.length : 0)
    );
    setCurrentFollowersCount(initialCount);
  }, [user, resolvedProfile]);

  const handleToggleFollow = async () => {
    if (followLoading || !targetUserId) return;
    setFollowLoading(true);
    const nextFollowing = !isFollowing;
    setIsFollowing(nextFollowing);
    setCurrentFollowersCount((prev) => Math.max(0, prev + (nextFollowing ? 1 : -1)));

    try {
      const res = await apiUtil.post(`/user/follow/${encodeURIComponent(targetUserId)}`);
      if (res.data?.success) {
        AlertService.show(
          nextFollowing ? 'Following' : 'Unfollowed',
          nextFollowing ? 'You are now following this user.' : 'You unfollowed this user.',
          'success'
        );
        onFollow && onFollow(nextFollowing);
      }
    } catch (err) {
      setIsFollowing(!nextFollowing);
      setCurrentFollowersCount((prev) => Math.max(0, prev + (nextFollowing ? -1 : 1)));
      AlertService.show('Notice', err.response?.data?.message || 'Could not update follow status.', 'error');
    } finally {
      setFollowLoading(false);
    }
  };

  if (!visible || !user) return null;

  const currentAuthId = String(currentUserId || authUser?.userId || authUser?.id || authUser?._id || '');
  const isSelf = Boolean(targetUserId && currentAuthId && targetUserId === currentAuthId);

  const displayData = resolvedProfile || user;
  const targetName = displayData.name || displayData.userName || 'User';
  const targetGender = displayData.gender || 'female';
  const targetAge = displayData.age || 24;
  const wealthLevel = displayData.wealthLevel ?? displayData.level ?? 35;
  const charmLevel = displayData.charmLevel ?? 36;
  const svipLevel = Number(displayData.svipLevel ?? displayData.svip ?? (displayData.isSvip ? 3 : 0));
  const followersCount = currentFollowersCount || displayData.followersCount || 987;
  const userBio = displayData.bio || displayData.about || '^мy нusвαиd💫JAFAR💫... дои\'т тоuсн му iд';

  const identityProfile = displayData.effectiveIdentity || {};
  const displayId = displayData.displayId || identityProfile.displayId || targetUserId;
  const isOfficialId = Boolean(displayData.isOfficial || identityProfile.isOfficial);
  const officialBadge = displayData.officialBadge || identityProfile.officialBadge || {};
  const uniqueIdBadge = displayData.uniqueIdBadge || identityProfile.uniqueIdBadge || {};
  const badgeUrl = displayData.badgeUrl || uniqueIdBadge.badgeIconUrl || officialBadge.badgeUrl || null;

  // CP Partner
  const cpPartner = displayData.cpPartner?.name ? displayData.cpPartner : null;

  // Room roles
  const ownerIdStr = String(roomOwnerId || '');
  const isTargetOwner = Boolean(ownerIdStr && targetUserId === ownerIdStr);
  const isTargetAdmin = admins.some((admId) => String(admId) === targetUserId);
  const isTargetChatBanned = bannedChatUsers.some((id) => String(id) === targetUserId);

  // Seat
  const targetSeat = seats.find((s) => {
    if (!s || !s.user) return false;
    const sUid = String(s.user.userId || s.user._id || s.user.id || '');
    return sUid === targetUserId;
  });
  const isTargetMuted = targetSeat?.isMuted || mutedUsers.some((id) => String(id) === targetUserId);

  const canModerate = !isSelf && (isRoomOwner || isHostOrAdmin || isGlobalRoomManager);
  const canAssignRoomAdmins = isRoomOwner || isGlobalRoomManager;

  const renderModerationAction = (label, iconName, onPress, variant = 'default') => (
    <TouchableOpacity
      key={label}
      style={[styles.moderationBtn, variant === 'danger' && styles.moderationBtnDanger]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <MaterialCommunityIcons
        name={iconName}
        size={18}
        color={variant === 'danger' ? '#EF4444' : '#1E293B'}
      />
      <Text style={[styles.moderationBtnText, variant === 'danger' && styles.moderationBtnTextDanger]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Bottom Sheet Card matching Screenshot 2 */}
        <View style={[styles.bottomSheetCard, { paddingBottom: Math.max(bottomSafePadding, 16) }]}>
          {/* Top Report Button */}
          <TouchableOpacity
            style={styles.topReportBtn}
            onPress={() => {
              onClose();
              onReport ? onReport(user) : AlertService.show('Report', 'Report submitted to moderators.', 'info');
            }}
            activeOpacity={0.7}
          >
            <Icon name="warning-outline" size={16} color="#94A3B8" />
            <Text style={styles.topReportText}>Report</Text>
          </TouchableOpacity>

          <ScrollView
            style={styles.profileContentScroll}
            contentContainerStyle={styles.profileContentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Header: Large Avatar in Golden Eagle SVIP Frame + Mini CP Partner */}
            <View style={styles.avatarHeaderRow}>
              {/* Main Avatar Container */}
              <View style={styles.mainAvatarContainer}>
                <AvatarWithFrame
                  user={isSelf ? (authUser || user) : user}
                  frame={
                    (isSelf
                      ? (authUser?.equippedFrameAsset || authUser?.equippedFrame || equippedFrame || currentUserFrame)
                      : (user?.equippedFrameAsset || user?.equippedFrame)) || null
                  }
                  size={92}
                  showOnlineDot={false}
                />

                {/* SVIP Plaque Ribbon under avatar */}
                <LinearGradient
                  colors={['#CA8A04', '#F59E0B', '#B45309']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.svipRibbonBadge}
                >
                  <Text style={styles.svipRibbonText}>SVIP{svipLevel || 3}</Text>
                </LinearGradient>
              </View>

              {/* CP Partner Avatar Bubble */}
              {cpPartner && (
                <View style={styles.cpBubbleWrap}>
                  <Image
                    source={cpPartner.avatar ? { uri: cpPartner.avatar } : require('../../assets/images/user2.png')}
                    style={styles.cpAvatarImg}
                  />
                  <LinearGradient
                    colors={['#EC4899', '#BE185D']}
                    style={styles.cpLevelBadge}
                  >
                    <Text style={styles.cpLevelBadgeText}>Lv.{cpPartner.level || 6}</Text>
                  </LinearGradient>
                </View>
              )}
            </View>

            {/* User Name + Gender/Age Badge */}
            <View style={styles.nameRow}>
              <Text style={styles.nameSparkle}>💫</Text>
              <Text style={styles.userName} numberOfLines={1}>
                {targetName}
              </Text>
              <Text style={styles.nameSparkle}>💫</Text>

              <View style={[styles.genderAgePill, targetGender === 'female' ? styles.genderFemale : styles.genderMale]}>
                <Text style={styles.genderIcon}>{targetGender === 'female' ? '♀' : '♂'}</Text>
                <Text style={styles.genderAgeText}>{targetAge}</Text>
              </View>
            </View>

            {/* TAGS ROW directly under Name (Screenshot 2) */}
            <View style={styles.tagsRow}>
              {/* SVIP Tag */}
              <LinearGradient
                colors={['#0D9488', '#115E59']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.svipTagPill}
              >
                <Text style={styles.svipTagPillText}>🦅 SVIP{svipLevel || 3}</Text>
              </LinearGradient>

              {/* Wealth Tag */}
              <LinearGradient
                colors={['#0284C7', '#0369A1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.wealthTagPill}
              >
                <Text style={styles.wealthTagPillText}>💎 Lv.{wealthLevel}</Text>
              </LinearGradient>

              {/* Charm Tag */}
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.charmTagPill}
              >
                <Text style={styles.charmTagPillText}>🌿 Lv.{charmLevel}</Text>
              </LinearGradient>

              {/* Club / Family Tag */}
              <View style={styles.clubTagPill}>
                <Text style={styles.clubTagPillText}>🛡️ JP</Text>
              </View>

              {/* Member Tag */}
              <View style={styles.memberTagPill}>
                <Text style={styles.memberTagPillText}>Member</Text>
              </View>

              {/* Admin Tag */}
              {(isTargetAdmin || isTargetOwner) && (
                <View style={styles.adminTagPill}>
                  <Text style={styles.adminTagPillText}>{isTargetOwner ? 'Owner' : 'Admin'}</Text>
                </View>
              )}
            </View>

            {/* BADGES ROW directly under Tags (Screenshot 2) */}
            <View style={styles.medalsShelfContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.medalsScroll}
              >
                {PRESTIGE_MEDALS.map((medal) => (
                  <View key={medal.id} style={styles.medalItemWrap}>
                    <LinearGradient
                      colors={medal.colors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.medalCircle}
                    >
                      <MaterialCommunityIcons name={medal.icon} size={15} color="#FFFFFF" />
                    </LinearGradient>
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* ID & Followers Row (Screenshot 2) */}
            <View style={styles.idFollowersRow}>
              <IdentityDisplayId
                userId={targetUserId}
                officialDisplayId={displayId}
                customDisplayId={identityProfile.customDisplayId || displayData?.customDisplayId}
                isOfficial={isOfficialId}
                badgeUrl={badgeUrl}
                badgeText={uniqueIdBadge.badgeName || officialBadge.badgeText || 'VIP'}
                showBadge={true}
                showCopy={true}
                fontSize={13.5}
                textColor="#D97706"
              />

              <View style={styles.followersWrap}>
                <MaterialCommunityIcons name="account-group" size={13} color="#64748B" />
                <Text style={styles.followersText}>{formatCompactBalance(followersCount)} Followers</Text>
              </View>
            </View>

            {/* Bio Row (Screenshot 2) */}
            <Text style={styles.bioText} numberOfLines={2}>
              {userBio}
            </Text>

            {/* 4 Round Action Buttons: Profile | Chat | Mute Mic | Mention (Screenshot 2) */}
            <View style={styles.actionButtonsRow}>
              {/* Profile */}
              <TouchableOpacity
                style={styles.actionBtnCol}
                onPress={() => {
                  onClose();
                  onOpenFullProfile && onOpenFullProfile(user);
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.roundActionCircle, { backgroundColor: '#38BDF8' }]}>
                  <Icon name="person" size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.roundActionLabel}>Profile</Text>
              </TouchableOpacity>

              {/* Chat */}
              <TouchableOpacity
                style={styles.actionBtnCol}
                onPress={() => {
                  onClose();
                  if (onOpenChat) {
                    onOpenChat(user);
                  } else {
                    AlertService.show('Chat', `Opening private chat with ${targetName}`, 'info');
                  }
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.roundActionCircle, { backgroundColor: '#C084FC' }]}>
                  <Icon name="chatbubble" size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.roundActionLabel}>Chat</Text>
              </TouchableOpacity>

              {/* Mute Mic */}
              <TouchableOpacity
                style={styles.actionBtnCol}
                onPress={() => {
                  if (targetSeat && onMuteSeat) {
                    onMuteSeat(user);
                  } else {
                    AlertService.show('Mute', isTargetMuted ? 'User mic unmuted.' : 'User mic muted.', 'info');
                  }
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.roundActionCircle, { backgroundColor: '#F97316' }]}>
                  <MaterialCommunityIcons
                    name={isTargetMuted ? 'microphone-off' : 'microphone'}
                    size={20}
                    color="#FFFFFF"
                  />
                </View>
                <Text style={styles.roundActionLabel}>{isTargetMuted ? 'Unmute' : 'Mute Mic'}</Text>
              </TouchableOpacity>

              {/* Mention */}
              <TouchableOpacity
                style={styles.actionBtnCol}
                onPress={() => {
                  onClose();
                  onMention && onMention(targetName);
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.roundActionCircle, { backgroundColor: '#FACC15' }]}>
                  <MaterialCommunityIcons name="at" size={20} color="#1E293B" />
                </View>
                <Text style={styles.roundActionLabel}>Mention</Text>
              </TouchableOpacity>
            </View>

            {/* Moderation Controls (if host/owner) */}
            {canModerate && (
              <View style={styles.moderationPanel}>
                <Text style={styles.moderationPanelTitle}>Room Moderation</Text>
                <View style={styles.moderationActions}>
                  {canAssignRoomAdmins && onToggleAdmin && renderModerationAction(
                    isTargetAdmin ? 'Remove Admin' : 'Make Admin',
                    isTargetAdmin ? 'account-minus-outline' : 'account-plus-outline',
                    () => onToggleAdmin(user),
                  )}
                  {onBanChat && renderModerationAction(
                    isTargetChatBanned ? 'Unmute Chat' : 'Mute Chat',
                    isTargetChatBanned ? 'message-text-outline' : 'message-off-outline',
                    () => onBanChat(user),
                  )}
                  {targetSeat && onRemoveFromSeat && renderModerationAction(
                    'Remove Seat',
                    'account-arrow-down-outline',
                    () => onRemoveFromSeat(user),
                    'danger',
                  )}
                  {targetSeat && onToggleSeatLock && renderModerationAction(
                    targetSeat.isLocked ? 'Unlock Seat' : 'Lock Seat',
                    targetSeat.isLocked ? 'lock-open-variant-outline' : 'lock-outline',
                    () => onToggleSeatLock(targetSeat.seatIndex),
                  )}
                  {onKickUser && renderModerationAction(
                    'Kick 24h',
                    'account-cancel-outline',
                    () => onKickUser(user),
                    'danger',
                  )}
                </View>
              </View>
            )}

            {/* Bottom Row: SVIP Diamond Level + Follow + Send Gifts (Screenshot 2) */}
            {!isSelf && (
              <View style={styles.bottomButtonsRow}>
                {/* SVIP Level Badge on Left */}
                <View style={styles.bottomSvipBadgeWrap}>
                  <LinearGradient
                    colors={['#10B981', '#047857']}
                    style={styles.bottomSvipDiamond}
                  >
                    <Text style={styles.bottomSvipLevelNum}>{svipLevel || 3}</Text>
                  </LinearGradient>
                </View>

                {/* Follow Button (White Pill with Shadow) */}
                <TouchableOpacity
                  style={[styles.followButton, isFollowing && styles.followingButton]}
                  onPress={handleToggleFollow}
                  disabled={followLoading}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
                    {isFollowing ? 'Following' : 'Follow'}
                  </Text>
                </TouchableOpacity>

                {/* Send Gifts Button (Golden Amber Gradient) */}
                <TouchableOpacity
                  style={styles.sendGiftButton}
                  onPress={() => {
                    onClose();
                    onGift && onGift(user);
                  }}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#FDE047', '#F59E0B', '#D97706']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.sendGiftGrad}
                  >
                    <Text style={styles.sendGiftBtnText}>Send Gifts</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {isSelf && (
              <View style={styles.bottomButtonsRow}>
                <TouchableOpacity
                  style={[styles.followButton, { borderColor: '#EF4444', flex: 1 }]}
                  onPress={() => {
                    onClose();
                    onLeaveSeat && onLeaveSeat();
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.followBtnText, { color: '#EF4444' }]}>Leave the Seat</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  bottomSheetCard: {
    backgroundColor: '#FAF7FF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 18,
    paddingTop: 16,
    maxHeight: '92%',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 20,
  },
  topReportBtn: {
    position: 'absolute',
    top: 14,
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    zIndex: 10,
    padding: 4,
  },
  topReportText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  profileContentScroll: {
    width: '100%',
  },
  profileContentContainer: {
    alignItems: 'center',
    paddingBottom: 10,
  },
  avatarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 6,
    position: 'relative',
  },
  mainAvatarContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  svipRibbonBadge: {
    position: 'absolute',
    bottom: -6,
    paddingHorizontal: 14,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FEF08A',
    shadowColor: '#CA8A04',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 4,
  },
  svipRibbonText: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cpBubbleWrap: {
    position: 'absolute',
    right: -36,
    top: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cpAvatarImg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#EC4899',
  },
  cpLevelBadge: {
    position: 'absolute',
    bottom: -5,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  cpLevelBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 12,
  },
  nameSparkle: {
    fontSize: 14,
  },
  userName: {
    color: '#F59E0B',
    fontSize: 17,
    fontWeight: '900',
    maxWidth: width * 0.55,
  },
  genderAgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 12,
    marginLeft: 4,
    gap: 2,
  },
  genderFemale: {
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
    borderWidth: 1,
    borderColor: '#F472B6',
  },
  genderMale: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: '#60A5FA',
  },
  genderIcon: {
    color: '#EC4899',
    fontSize: 11,
    fontWeight: '900',
  },
  genderAgeText: {
    color: '#1E293B',
    fontSize: 10.5,
    fontWeight: '800',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 8,
    paddingHorizontal: 12,
  },
  svipTagPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  svipTagPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  wealthTagPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  wealthTagPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  charmTagPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  charmTagPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  clubTagPill: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  clubTagPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  memberTagPill: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  memberTagPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  adminTagPill: {
    backgroundColor: '#10B981',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  adminTagPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  medalsShelfContainer: {
    marginVertical: 10,
    width: '100%',
  },
  medalsScroll: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalItemWrap: {
    alignItems: 'center',
  },
  medalCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 3,
  },
  idFollowersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginVertical: 4,
  },
  followersWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  followersText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  bioText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 24,
    marginVertical: 6,
    lineHeight: 16,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '88%',
    marginTop: 10,
    marginBottom: 14,
  },
  actionBtnCol: {
    alignItems: 'center',
    gap: 4,
  },
  roundActionCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  roundActionLabel: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
  },
  moderationPanel: {
    width: '92%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  moderationPanelTitle: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  moderationActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  moderationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  moderationBtnDanger: {
    backgroundColor: '#FEE2E2',
  },
  moderationBtnText: {
    color: '#1E293B',
    fontSize: 11,
    fontWeight: '700',
  },
  moderationBtnTextDanger: {
    color: '#DC2626',
  },
  bottomButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '94%',
    gap: 10,
    marginTop: 4,
  },
  bottomSvipBadgeWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSvipDiamond: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  bottomSvipLevelNum: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  followButton: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  followingButton: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  followBtnText: {
    color: '#D97706',
    fontSize: 14,
    fontWeight: '800',
  },
  followingBtnText: {
    color: '#64748B',
  },
  sendGiftButton: {
    flex: 1.2,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 5,
  },
  sendGiftGrad: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendGiftBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
});
