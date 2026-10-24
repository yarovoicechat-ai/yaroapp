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
import AvatarWithFrame from '../AvatarWithFrame';
import IdentityDisplayId from '../identity/IdentityDisplayId';
import { AuthContext } from '../../context/AuthProvider';
import { getUserAvatar } from '../../utils/avatarUtil';
import { apiUtil } from '../../utils/apiUtil';
import { formatCompactBalance } from '../../utils/numberUtil';

const { width } = Dimensions.get('window');

// 9 Prestige Medals strictly matching Screenshot 2
const PRESTIGE_MEDALS = [
  { id: 'm1', label: 'Heart', icon: 'heart', colors: ['#EF4444', '#DC2626'] },
  { id: 'm2', label: 'Verified', icon: 'shield-check', colors: ['#F59E0B', '#D97706'] },
  { id: 'm3', label: 'Golden Heart', icon: 'heart-multiple', colors: ['#F59E0B', '#B45309'] },
  { id: 'm4', label: 'Chalice', icon: 'trophy', colors: ['#D97706', '#92400E'] },
  { id: 'm5', label: '30-Day', icon: 'shield-star', colors: ['#10B981', '#059669'] },
  { id: 'm6', label: 'Gift', icon: 'gift', colors: ['#84CC16', '#65A30D'] },
  { id: 'm7', label: 'Crown', icon: 'crown', colors: ['#38BDF8', '#0284C7'] },
  { id: 'm8', label: 'Rose', icon: 'flower', colors: ['#EC4899', '#BE185D'] },
  { id: 'm9', label: 'Shield', icon: 'shield-sun', colors: ['#F59E0B', '#B45309'] },
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
  onBanUser,
  canBanUser = false,
  onRemoveFromSeat,
  onToggleSeatLock,
  onMuteSeat,
  onOpenGroup,
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
        onFollow && onFollow(nextFollowing);
      }
    } catch (err) {
      setIsFollowing(!nextFollowing);
      setCurrentFollowersCount((prev) => Math.max(0, prev + (nextFollowing ? -1 : 1)));
    } finally {
      setFollowLoading(false);
    }
  };

  if (!visible || !user) return null;

  const currentAuthId = String(currentUserId || authUser?.userId || authUser?.id || authUser?._id || '');
  const isSelf = Boolean(
    user?.isCurrentUser ||
    (targetUserId && currentAuthId && targetUserId === currentAuthId)
  );

  const displayData = resolvedProfile || user;
  const targetName = displayData.name || displayData.userName || 'User';
  const targetGender = displayData.gender || 'female';
  const targetAge = displayData.age || 24;
  const wealthLevel = displayData.wealthLevel ?? displayData.level ?? 4;
  const followersCount = currentFollowersCount || displayData.followersCount || 0;
  const userBio = displayData.bio || displayData.about || (isSelf ? 'Adding Information can gain more followers.' : '');

  const uniqueId = displayData.equippedCustomId || displayData.uniqueId || displayData.customId || null;
  const hasUniqueId = Boolean(uniqueId && String(uniqueId).trim());
  const displayId = displayData.displayId || displayData.customDisplayId || targetUserId || '—';
  const uniqueIdBadgeUrl =
    displayData.uniqueIdBadge?.badgeIconUrl ||
    displayData.uniqueIdBadge?.badgeUrl ||
    displayData.badgeIconUrl ||
    displayData.effectiveIdentity?.uniqueIdBadge?.badgeIconUrl ||
    resolvedProfile?.uniqueIdBadge?.badgeIconUrl ||
    resolvedProfile?.badgeIconUrl ||
    user?.uniqueIdBadge?.badgeIconUrl ||
    null;
  const uniqueIdBadgeText =
    displayData.uniqueIdBadge?.badgeName ||
    resolvedProfile?.uniqueIdBadge?.badgeName ||
    (hasUniqueId ? 'VIP' : 'ID');

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

  const hasOfficialBanUserPower = Boolean(canBanUser || authUser?.officialPowers?.canBanUser || isGlobalRoomManager);
  // canModerate is true when current user is room owner, host, or admin, and NOT viewing themselves
  const canModerate = !isSelf && (isRoomOwner || isHostOrAdmin || isGlobalRoomManager || hasOfficialBanUserPower);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Bottom Sheet Card matching Screenshots 1, 2, 3 */}
        <View style={[styles.bottomSheetCard, { paddingBottom: Math.max(bottomSafePadding, 20) }]}>
          {/* Top Report Button (Only shown when not self) */}
          {!isSelf && (
            <TouchableOpacity
              style={styles.topReportBtn}
              onPress={() => {
                onClose();
                onReport && onReport(user);
              }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="alert-outline" size={20} color="#94A3B8" />
              <Text style={styles.topReportText}>Report</Text>
            </TouchableOpacity>
          )}

          <ScrollView
            style={styles.profileContentScroll}
            contentContainerStyle={styles.profileContentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. Center Avatar */}
            <View style={styles.avatarCenterWrap}>
              <AvatarWithFrame
                user={isSelf ? (authUser || user) : user}
                frame={
                  (isSelf
                    ? (authUser?.equippedFrameAsset || authUser?.equippedFrame || equippedFrame || currentUserFrame)
                    : (user?.equippedFrameAsset || user?.equippedFrame)) || null
                }
                size={84}
                showOnlineDot={false}
              />
            </View>

            {/* 2. User Name + Gender Badge */}
            <View style={styles.nameRow}>
              <Text style={styles.userName} numberOfLines={1}>
                {targetName}
              </Text>

              {/* Gender Tag: Male is blue circle with ♂, Female is pink pill with ♀ age */}
              {targetGender === 'female' ? (
                <View style={styles.genderFemalePill}>
                  <Text style={styles.genderText}>♀ {targetAge}</Text>
                </View>
              ) : (
                <View style={styles.genderMaleCircle}>
                  <Text style={styles.genderMaleIcon}>♂</Text>
                </View>
              )}
            </View>

            {/* 3. Badges Row: Lv.4, Lv.0, VIP+, SYAMBABA, Admin/Owner */}
            <View style={styles.badgesRow}>
              {/* Bronze Level Pill */}
              <View style={styles.levelBronzePill}>
                <MaterialCommunityIcons name="star-four-points" size={11} color="#FFF" style={{ marginRight: 2 }} />
                <Text style={styles.levelText}>Lv.{wealthLevel}</Text>
              </View>

              {/* Silver Star Level Pill */}
              <View style={styles.levelSilverPill}>
                <MaterialCommunityIcons name="star" size={11} color="#CBD5E1" style={{ marginRight: 2 }} />
                <Text style={styles.levelText}>Lv.0</Text>
              </View>

              {/* VIP+ badge if not self */}
              {!isSelf && (
                <View style={styles.vipPill}>
                  <Text style={styles.vipText}>VIP+</Text>
                </View>
              )}

              {/* Agency Tag if any */}
              {!isSelf && (
                <View style={styles.agencyPill}>
                  <Text style={styles.agencyText}>SYAMBABA</Text>
                </View>
              )}

              {/* Admin or Owner Badge */}
              {isTargetOwner && (
                <View style={styles.ownerBadgePill}>
                  <Text style={styles.roleBadgeText}>Owner</Text>
                </View>
              )}
              {isTargetAdmin && !isTargetOwner && (
                <View style={styles.adminBadgePill}>
                  <Text style={styles.roleBadgeText}>Admin</Text>
                </View>
              )}
            </View>

            {/* 4. Prestigious Medals Row (Screenshot 2: only for another user when regular guest) */}
            {!isSelf && !canModerate && (
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
            )}

            {/* 5. YARO ID / Unique ID with SVGA Badge & Followers Row */}
            <View style={styles.idFollowersRow}>
              <IdentityDisplayId
                userId={targetUserId || displayData.userId}
                customDisplayId={hasUniqueId ? uniqueId : null}
                officialDisplayId={displayData.officialDisplayId || (displayData.isOfficial ? displayData.displayId : null)}
                isOfficial={Boolean(displayData.isOfficial)}
                badgeUrl={uniqueIdBadgeUrl}
                badgeText={uniqueIdBadgeText}
                showBadge={true}
                showCopy={true}
                showPrefix={!hasUniqueId && !displayData.isOfficial}
                prefix="YARO ID : "
                fontSize={12}
                style={styles.identityDisplayWrap}
              />
              <View style={styles.greenFollowersBadge}>
                <MaterialCommunityIcons name="account-group" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.followersBadgeText}>{formatCompactBalance(followersCount)} Followers</Text>
              </View>
            </View>

            {/* 6. Bio Text (Screenshots 1, 2, 3) */}
            {!!userBio && (
              <Text style={styles.bioText} numberOfLines={2}>
                {userBio}
              </Text>
            )}

            {/* ------------------------------------------------------------- */}
            {/* CASE A: User is looking at THEMSELVES (Screenshot 1) */}
            {/* ------------------------------------------------------------- */}
            {isSelf && (
              <View style={styles.selfActionRow}>
                {/* Profile Button */}
                <TouchableOpacity
                  style={styles.actionColBtn}
                  onPress={() => {
                    onClose();
                    onOpenFullProfile && onOpenFullProfile(user);
                  }}
                  activeOpacity={0.75}
                >
                  <View style={styles.selfIconCircle}>
                    <MaterialCommunityIcons name="account" size={32} color="#0EA5E9" />
                  </View>
                  <Text style={styles.actionColLabel}>Profile</Text>
                </TouchableOpacity>

                {/* Leave the seat Button */}
                <TouchableOpacity
                  style={styles.actionColBtn}
                  onPress={() => {
                    onClose();
                    onLeaveSeat && onLeaveSeat();
                  }}
                  activeOpacity={0.75}
                >
                  <View style={styles.selfIconCircle}>
                    <MaterialCommunityIcons name="seat-passenger" size={32} color="#EAB308" />
                  </View>
                  <Text style={styles.actionColLabel}>Leave the seat</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ------------------------------------------------------------- */}
            {/* CASE B: User is GUEST viewing ANOTHER USER (Screenshot 2) */}
            {/* ------------------------------------------------------------- */}
            {!isSelf && !canModerate && (
              <>
                <View style={styles.actionButtonsRow}>
                  {/* Profile */}
                  <TouchableOpacity
                    style={styles.actionColBtn}
                    onPress={() => {
                      onClose();
                      onOpenFullProfile && onOpenFullProfile(user);
                    }}
                    activeOpacity={0.75}
                  >
                    <View style={styles.selfIconCircle}>
                      <MaterialCommunityIcons name="account" size={28} color="#0EA5E9" />
                    </View>
                    <Text style={styles.actionColLabel}>Profile</Text>
                  </TouchableOpacity>

                  {/* Chat */}
                  <TouchableOpacity
                    style={styles.actionColBtn}
                    onPress={() => {
                      onClose();
                      onOpenChat && onOpenChat(user);
                    }}
                    activeOpacity={0.75}
                  >
                    <View style={styles.selfIconCircle}>
                      <MaterialCommunityIcons name="chat" size={28} color="#A855F7" />
                    </View>
                    <Text style={styles.actionColLabel}>Chat</Text>
                  </TouchableOpacity>

                  {/* Mute Mic */}
                  <TouchableOpacity
                    style={styles.actionColBtn}
                    onPress={() => {
                      onMuteSeat && onMuteSeat(user);
                    }}
                    activeOpacity={0.75}
                  >
                    <View style={styles.selfIconCircle}>
                      <MaterialCommunityIcons
                        name={isTargetMuted ? 'volume-high' : 'volume-mute'}
                        size={28}
                        color="#F97316"
                      />
                    </View>
                    <Text style={styles.actionColLabel}>{isTargetMuted ? 'Unmute' : 'Mute Mic'}</Text>
                  </TouchableOpacity>

                  {/* Mention */}
                  <TouchableOpacity
                    style={styles.actionColBtn}
                    onPress={() => {
                      onClose();
                      onMention && onMention(targetName);
                    }}
                    activeOpacity={0.75}
                  >
                    <View style={styles.selfIconCircle}>
                      <MaterialCommunityIcons name="at" size={28} color="#EAB308" />
                    </View>
                    <Text style={styles.actionColLabel}>Mention</Text>
                  </TouchableOpacity>
                </View>

                {/* Bottom Row: Follow (white with yellow border) & Send Gifts (golden yellow) */}
                <View style={styles.bottomButtonsRow}>
                  <TouchableOpacity
                    style={[styles.followOutlineBtn, isFollowing && styles.followingBtn]}
                    onPress={handleToggleFollow}
                    disabled={followLoading}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
                      {isFollowing ? 'Following' : 'Follow'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.sendGiftSolidBtn}
                    onPress={() => {
                      onClose();
                      onGift && onGift(user);
                    }}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={['#FACC15', '#F59E0B']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.sendGiftGrad}
                    >
                      <Text style={styles.sendGiftText}>Send Gifts</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* ------------------------------------------------------------- */}
            {/* CASE C: User is HOST / ADMIN viewing ANOTHER USER (Screenshot 3) */}
            {/* ------------------------------------------------------------- */}
            {!isSelf && canModerate && (
              <>
                {/* Row 1: Profile | Chat | Mention (3 items) */}
                <View style={[styles.actionButtonsRow, { justifyContent: 'space-around', paddingHorizontal: 20 }]}>
                  {/* Profile */}
                  <TouchableOpacity
                    style={styles.actionColBtn}
                    onPress={() => {
                      onClose();
                      onOpenFullProfile && onOpenFullProfile(user);
                    }}
                    activeOpacity={0.75}
                  >
                    <View style={styles.selfIconCircle}>
                      <MaterialCommunityIcons name="account" size={28} color="#0EA5E9" />
                    </View>
                    <Text style={styles.actionColLabel}>Profile</Text>
                  </TouchableOpacity>

                  {/* Chat */}
                  <TouchableOpacity
                    style={styles.actionColBtn}
                    onPress={() => {
                      onClose();
                      onOpenChat && onOpenChat(user);
                    }}
                    activeOpacity={0.75}
                  >
                    <View style={styles.selfIconCircle}>
                      <MaterialCommunityIcons name="chat" size={28} color="#A855F7" />
                    </View>
                    <Text style={styles.actionColLabel}>Chat</Text>
                  </TouchableOpacity>

                  {/* Mention */}
                  <TouchableOpacity
                    style={styles.actionColBtn}
                    onPress={() => {
                      onClose();
                      onMention && onMention(targetName);
                    }}
                    activeOpacity={0.75}
                  >
                    <View style={styles.selfIconCircle}>
                      <MaterialCommunityIcons name="at" size={28} color="#EAB308" />
                    </View>
                    <Text style={styles.actionColLabel}>Mention</Text>
                  </TouchableOpacity>
                </View>

                {/* Moderation Grid matching Screenshot 3 */}
                <View style={styles.moderationGrid}>
                  {/* Row 1: Lock | Mute | Ban Chat | Kick */}
                  <View style={styles.moderationRow}>
                    {/* Lock */}
                    <TouchableOpacity
                      style={styles.moderationItem}
                      onPress={() => targetSeat && onToggleSeatLock && onToggleSeatLock(targetSeat.seatIndex)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons
                        name={targetSeat?.isLocked ? 'lock' : 'lock-outline'}
                        size={28}
                        color="#64748B"
                      />
                      <Text style={styles.moderationLabel}>
                        {targetSeat?.isLocked ? 'Unlock' : 'Lock'}
                      </Text>
                    </TouchableOpacity>

                    {/* Mute */}
                    <TouchableOpacity
                      style={styles.moderationItem}
                      onPress={() => onMuteSeat && onMuteSeat(user)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons
                        name={isTargetMuted ? 'microphone' : 'microphone-off'}
                        size={28}
                        color="#64748B"
                      />
                      <Text style={styles.moderationLabel}>
                        {isTargetMuted ? 'Unmute' : 'Mute'}
                      </Text>
                    </TouchableOpacity>

                    {/* Ban Chat */}
                    <TouchableOpacity
                      style={styles.moderationItem}
                      onPress={() => onBanChat && onBanChat(user)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons
                        name={isTargetChatBanned ? 'comment-text-outline' : 'comment-off-outline'}
                        size={28}
                        color="#64748B"
                      />
                      <Text style={styles.moderationLabel}>
                        {isTargetChatBanned ? 'Unban Chat' : 'Ban Chat'}
                      </Text>
                    </TouchableOpacity>

                    {/* Kick */}
                    <TouchableOpacity
                      style={styles.moderationItem}
                      onPress={() => {
                        onClose();
                        onKickUser && onKickUser(user);
                      }}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="logout-variant" size={28} color="#64748B" />
                      <Text style={styles.moderationLabel}>Kick</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Row 2: Remove | Group | Remove Admin / Make Admin */}
                  <View style={styles.moderationRow}>
                    {/* Remove from seat */}
                    <TouchableOpacity
                      style={styles.moderationItem}
                      onPress={() => {
                        onClose();
                        onRemoveFromSeat && onRemoveFromSeat(user);
                      }}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="seat-passenger" size={28} color="#64748B" />
                      <Text style={styles.moderationLabel}>Remove</Text>
                    </TouchableOpacity>

                    {/* Fan Club */}
                    <TouchableOpacity
                      style={styles.moderationItem}
                      onPress={() => {
                        onClose();
                        onOpenGroup && onOpenGroup();
                      }}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="account-group-outline" size={28} color="#64748B" />
                      <Text style={styles.moderationLabel}>Fan Club</Text>
                    </TouchableOpacity>

                    {/* Admin Toggle - Room Owner Only */}
                    {isRoomOwner && (
                      <TouchableOpacity
                        style={styles.moderationItem}
                        onPress={() => onToggleAdmin && onToggleAdmin(user)}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons
                          name={isTargetAdmin ? 'account-minus-outline' : 'account-plus-outline'}
                          size={28}
                          color="#64748B"
                        />
                        <Text style={styles.moderationLabel}>
                          {isTargetAdmin ? 'Remove Admin' : 'Admin'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Bottom Row: Follow & Send Gifts */}
                <View style={styles.bottomButtonsRow}>
                  <TouchableOpacity
                    style={[styles.followOutlineBtn, isFollowing && styles.followingBtn]}
                    onPress={handleToggleFollow}
                    disabled={followLoading}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
                      {isFollowing ? 'Following' : 'Follow'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.sendGiftSolidBtn}
                    onPress={() => {
                      onClose();
                      onGift && onGift(user);
                    }}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={['#FACC15', '#F59E0B']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.sendGiftGrad}
                    >
                      <Text style={styles.sendGiftText}>Send Gifts</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
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
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 24,
    maxHeight: '92%',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 20,
    overflow: 'hidden',
  },
  topReportBtn: {
    position: 'absolute',
    top: 14,
    right: 18,
    alignItems: 'center',
    zIndex: 10,
  },
  topReportText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 1,
  },
  profileContentScroll: {
    width: '100%',
  },
  profileContentContainer: {
    alignItems: 'center',
    paddingBottom: 10,
  },
  avatarCenterWrap: {
    marginTop: 8,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  idPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  uniqueIdBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 8,
    marginRight: 6,
  },
  uniqueIdBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  uniqueIdValText: {
    color: '#B45309',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    maxWidth: '85%',
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginRight: 6,
  },
  genderMaleCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderMaleIcon: {
    fontSize: 13,
    color: '#0284C7',
    fontWeight: '900',
  },
  genderFemalePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FCE7F3',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  genderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DB2777',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  levelBronzePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9A5B28',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  levelSilverPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#64748B',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  levelText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  vipPill: {
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  vipText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FACC15',
  },
  agencyPill: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  agencyText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#38BDF8',
  },
  ownerBadgePill: {
    backgroundColor: '#F97316',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  adminBadgePill: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  roleBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  medalsShelfContainer: {
    width: '100%',
    marginVertical: 4,
  },
  medalsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    gap: 8,
  },
  medalItemWrap: {
    marginHorizontal: 3,
  },
  medalCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  idFollowersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
    gap: 8,
    flexWrap: 'wrap',
  },
  identityDisplayWrap: {
    marginRight: 4,
  },
  mazaIdText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  greenFollowersBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  followersBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bioText: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    paddingHorizontal: 16,
    lineHeight: 18,
  },
  // Self actions (Screenshot 1)
  selfActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 30,
    paddingVertical: 14,
  },
  actionColBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  selfIconCircle: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  actionColLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },
  // Guest / Another user 4 action buttons (Screenshot 2)
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 12,
    marginVertical: 10,
  },
  // Moderation Grid (Screenshot 3)
  moderationGrid: {
    width: '100%',
    paddingHorizontal: 10,
    marginVertical: 12,
  },
  moderationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginVertical: 8,
  },
  moderationItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 68,
  },
  moderationLabel: {
    fontSize: 12,
    color: '#475569',
    marginTop: 4,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Bottom Buttons: Follow & Send Gifts
  bottomButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
    marginTop: 14,
    gap: 12,
  },
  followOutlineBtn: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  followingBtn: {
    backgroundColor: '#FEF3C7',
    borderColor: '#D97706',
  },
  followBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F59E0B',
  },
  followingBtnText: {
    color: '#D97706',
  },
  sendGiftSolidBtn: {
    flex: 1.2,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
  },
  sendGiftGrad: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendGiftText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
