import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { AlertService } from '../../utils/AlertService';

const { width } = Dimensions.get('window');

export default function RoomUserProfileModal({
  visible,
  onClose,
  user,
  currentUserId,
  currentUserName,
  onMention,
  onGift,
  onFollow,
  onReport,
  onLeaveSeat,
  onOpenFullProfile,
  isHostOrAdmin = false,
  isRoomOwner = false,
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
  if (!user && !visible) return null;

  const targetName = user?.name || user?.username || 'Yaro User';
  const targetId = user?.userId || user?.id || user?._id || '10000001';
  const targetAvatar =
    user?.avatar ||
    user?.image ||
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200';
  const targetGender = (user?.gender || 'male').toLowerCase();
  const targetLevel = user?.level || 0;
  const charmLevel = user?.charm || 0;
  const followersCount = user?.followersCount !== undefined ? user?.followersCount : 0;

  const targetUserId = String(user?.userId || user?.id || user?._id || '');
  const isTargetOwner = Boolean(
    user?.isOwner ||
    user?.isHost ||
    (roomOwnerId && String(roomOwnerId) === targetUserId)
  );

  const isTargetAdmin = Boolean(
    !isTargetOwner && (
      user?.isAdmin ||
      (Array.isArray(admins) && admins.map(String).includes(targetUserId))
    )
  );

  const isChatBanned = Array.isArray(bannedChatUsers) && bannedChatUsers.map(String).includes(targetUserId);
  const isMicMuted = Array.isArray(mutedUsers) && mutedUsers.map(String).includes(targetUserId);

  const targetSeat = Array.isArray(seats)
    ? seats.find((s) => s.user && (
        String(s.user.userId) === targetUserId ||
        String(s.user.id) === targetUserId ||
        String(s.user._id) === targetUserId ||
        (s.user.name && targetName && s.user.name.toLowerCase() === targetName.toLowerCase())
      ))
    : null;
  const isTargetInSeat = Boolean(targetSeat);
  const targetSeatIndex = targetSeat ? targetSeat.seatIndex : null;
  const isSeatLocked = targetSeat ? Boolean(targetSeat.isLocked) : false;

  const targetIds = [user?.userId, user?.id, user?._id, targetUserId].filter(Boolean).map(String);

  const isSelf = Boolean(
    user?.isCurrentUser ||
    (currentUserId && targetIds.includes(String(currentUserId))) ||
    (currentUserName && targetName && String(currentUserName).trim().toLowerCase() === String(targetName).trim().toLowerCase())
  );

  // Can perform moderation actions if viewer is Owner or Admin, and target is NOT the room owner AND NOT oneself
  const canModerate = (isHostOrAdmin || isRoomOwner) && !isTargetOwner && !isSelf;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <TouchableOpacity
          style={styles.backdropDismissArea}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={[styles.cardContainer, { paddingBottom: Math.max(bottomSafePadding + 10, 24) }]} pointerEvents="auto">
          {/* Top-Right Report Button (Only for other users) */}
          {!isSelf && (
            <TouchableOpacity
              style={styles.reportTopBtn}
              onPress={() => {
                onClose();
                if (onReport) {
                  onReport(user);
                } else {
                  AlertService.show('Report', `Reporting ${targetName}`, 'info');
                }
              }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#9CA3AF" />
              <Text style={styles.reportText}>Report</Text>
            </TouchableOpacity>
          )}

          {/* Floating Avatar Popping Out Above Card */}
          <View style={styles.avatarWrap}>
            <Image source={{ uri: targetAvatar }} style={styles.userAvatarImg} />
          </View>

          {/* User Name & Gender Icon */}
          <View style={styles.nameRow}>
            <Text style={styles.userName} numberOfLines={1}>{targetName}</Text>
            {targetGender === 'female' ? (
              <MaterialCommunityIcons name="gender-female" size={18} color="#EC4899" style={{ marginLeft: 4 }} />
            ) : (
              <MaterialCommunityIcons name="gender-male" size={18} color="#0EA5E9" style={{ marginLeft: 4 }} />
            )}
          </View>

          {/* Badges Row: Level + Charm + Owner/Admin Pill */}
          <View style={styles.badgesRow}>
            {/* Level Badge */}
            <View style={styles.darkBadge}>
              <Text style={styles.darkBadgeText}>▲ Lv.{targetLevel}</Text>
            </View>

            {/* Charm/Wealth Badge */}
            <View style={styles.greyBadge}>
              <Text style={styles.greyBadgeText}>★ Lv.{charmLevel}</Text>
            </View>

            {/* Room Owner Tag (Coral / Orange) */}
            {isTargetOwner && (
              <View style={styles.ownerBadge}>
                <Text style={styles.ownerBadgeText}>Owner</Text>
              </View>
            )}

            {/* Room Admin Tag (Green) */}
            {isTargetAdmin && (
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>Admin</Text>
              </View>
            )}
          </View>

          {/* ID & Followers Info Row */}
          <View style={styles.infoRow}>
            <Text style={styles.idText}>Maza Id:{targetId}</Text>
            <View style={styles.followersRow}>
              <View style={styles.followerBadge}>
                <MaterialCommunityIcons name="account-group" size={13} color="#FFFFFF" />
              </View>
              <Text style={styles.followersText}>{followersCount} Followers</Text>
            </View>
          </View>

          {/* Subtext */}
          <Text style={styles.subtext}>Adding Information can gain more followers.</Text>

          {/* ACTION BUTTONS GRID */}
          {isSelf ? (
            /* KHUD KI PROFILE (Owner, Admin, or User): Exact options from screenshot: Profile & Leave the seat */
            <View style={styles.selfActionsContainer}>
              <View style={styles.selfActionsRow}>
                <TouchableOpacity
                  style={styles.selfActionItem}
                  onPress={() => {
                    onClose();
                    if (onOpenFullProfile) {
                      onOpenFullProfile(user);
                    } else {
                      AlertService.show('Profile', `Opening your profile`, 'info');
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="account" size={38} color="#38BDF8" />
                  <Text style={styles.selfActionLabel}>Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.selfActionItem}
                  onPress={() => {
                    onClose();
                    if (onLeaveSeat) {
                      onLeaveSeat();
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="seat" size={38} color="#FBBF24" />
                  <Text style={styles.selfActionLabel}>Leave the seat</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : canModerate ? (
            /* OWNER / ADMIN VIEW OF OTHER USER */
            <View style={styles.actionsContainer}>
              {/* Row 1: Profile, Chat, Mention */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => {
                    onClose();
                    AlertService.show('Profile', `Opening ${targetName}'s full profile`, 'info');
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="account" size={30} color="#3B82F6" />
                  <Text style={styles.actionLabel}>Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => {
                    onClose();
                    AlertService.show('Chat', `Opening private chat with ${targetName}`, 'info');
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="message-text" size={28} color="#A855F7" />
                  <Text style={styles.actionLabel}>Chat</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => {
                    onClose();
                    onMention && onMention(user);
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="at" size={30} color="#F59E0B" />
                  <Text style={styles.actionLabel}>Mention</Text>
                </TouchableOpacity>
              </View>

              {/* Row 2: Lock / Unlock Seat, Mute / Unmute Mic, Ban / Unban Chat */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => {
                    onClose();
                    if (onToggleSeatLock) {
                      onToggleSeatLock(targetSeatIndex !== null ? targetSeatIndex : (user?.seatIndex ?? 1));
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={isSeatLocked ? "lock-open-variant" : "lock"}
                    size={28}
                    color={isSeatLocked ? "#EF4444" : "#06B6D4"}
                  />
                  <Text style={[styles.actionLabel, isSeatLocked && { color: '#EF4444' }]}>
                    {isSeatLocked ? 'Unlock Seat' : 'Lock Seat'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => {
                    onMuteSeat && onMuteSeat(user);
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={isMicMuted ? "microphone-off" : "microphone"}
                    size={28}
                    color={isMicMuted ? "#EF4444" : "#10B981"}
                  />
                  <Text style={[styles.actionLabel, isMicMuted && { color: '#EF4444' }]}>
                    {isMicMuted ? 'Unmute Mic' : 'Mute Mic'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => {
                    onBanChat && onBanChat(user);
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={isChatBanned ? "message-bulleted-off" : "message-bulleted"}
                    size={28}
                    color={isChatBanned ? "#EF4444" : "#64748B"}
                  />
                  <Text style={[styles.actionLabel, isChatBanned && { color: '#EF4444' }]}>
                    {isChatBanned ? 'Unban Chat' : 'Ban Chat'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Row 3: Remove from Seat (stays in room), Kick (24h Ban), Set / Remove Admin */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => {
                    onClose();
                    onRemoveFromSeat && onRemoveFromSeat(user);
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="account-arrow-down" size={28} color="#8B5CF6" />
                  <Text style={styles.actionLabel}>Remove Seat</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => {
                    onClose();
                    onKickUser && onKickUser(user);
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="account-cancel" size={28} color="#EF4444" />
                  <Text style={[styles.actionLabel, { color: '#EF4444' }]}>Kick (24h Ban)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => {
                    onClose();
                    onToggleAdmin && onToggleAdmin(user);
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={isTargetAdmin ? "account-star-outline" : "account-star"}
                    size={28}
                    color={isTargetAdmin ? "#EF4444" : "#F59E0B"}
                  />
                  <Text style={[styles.actionLabel, isTargetAdmin && { color: '#EF4444' }]}>
                    {isTargetAdmin ? 'Remove Admin' : 'Set Admin'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* REGULAR USER VIEW (OR VIEWING OWNER) */
            <View style={styles.actionsContainer}>
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => {
                    onClose();
                    AlertService.show('Profile', `Opening ${targetName}'s full profile`, 'info');
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="account" size={32} color="#3B82F6" />
                  <Text style={styles.actionLabel}>Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => {
                    onClose();
                    AlertService.show('Chat', `Opening private chat with ${targetName}`, 'info');
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="message-text" size={30} color="#A855F7" />
                  <Text style={styles.actionLabel}>Chat</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => {
                    onMuteSeat && onMuteSeat(user);
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={isMicMuted ? "volume-off" : "volume-high"}
                    size={30}
                    color="#EA580C"
                  />
                  <Text style={styles.actionLabel}>
                    {isMicMuted ? 'Unmute Mic' : 'Mute Mic'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => {
                    onClose();
                    onMention && onMention(user);
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="at" size={32} color="#F59E0B" />
                  <Text style={styles.actionLabel}>Mention</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* BOTTOM ROW: Follow & Send Gifts (Only for other users) */}
          {!isSelf && (
            <View style={styles.bottomButtonsRow}>
              {/* Follow Button */}
              <TouchableOpacity
                style={styles.followBtn}
                onPress={() => {
                  onFollow && onFollow(user);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.followBtnText}>Follow</Text>
              </TouchableOpacity>

              {/* Send Gifts Button */}
              <TouchableOpacity
                style={styles.sendGiftBtn}
                onPress={() => {
                  onClose();
                  onGift && onGift(user);
                }}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#F59E0B', '#FBBF24']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.sendGiftGradient}
                >
                  <Text style={styles.sendGiftBtnText}>Send Gifts</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  backdropDismissArea: {
    flex: 1,
    width: '100%',
  },
  cardContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    elevation: 25,
    zIndex: 100,
  },
  reportTopBtn: {
    position: 'absolute',
    top: 14,
    right: 18,
    alignItems: 'center',
    zIndex: 10,
  },
  reportText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
    fontWeight: '500',
  },
  avatarWrap: {
    marginTop: -52,
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    backgroundColor: '#F3F4F6',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 45,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    maxWidth: width * 0.65,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  darkBadge: {
    backgroundColor: '#374151',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  darkBadgeText: {
    color: '#FDE047',
    fontSize: 11,
    fontWeight: '700',
  },
  greyBadge: {
    backgroundColor: '#6B7280',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  greyBadgeText: {
    color: '#F3F4F6',
    fontSize: 11,
    fontWeight: '700',
  },
  ownerBadge: {
    backgroundColor: '#FF6464',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  ownerBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  adminBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  adminBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
  },
  idText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  followerBadge: {
    backgroundColor: '#10B981',
    borderRadius: 3,
    paddingHorizontal: 3,
    paddingVertical: 1,
    marginRight: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followersRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  followersText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  subtext: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 6,
    marginBottom: 16,
  },
  actionsContainer: {
    width: '100%',
    paddingVertical: 4,
    gap: 16,
  },
  selfActionsContainer: {
    width: '100%',
    paddingVertical: 12,
    marginTop: 4,
  },
  selfActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
  },
  selfActionItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  selfActionLabel: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
    marginTop: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
  },
  actionItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  actionLabel: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
    marginTop: 6,
  },
  bottomButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    marginTop: 20,
  },
  followBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  followBtnText: {
    color: '#F59E0B',
    fontSize: 15,
    fontWeight: '700',
  },
  sendGiftBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  sendGiftGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendGiftBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
