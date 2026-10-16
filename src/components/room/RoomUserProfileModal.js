import React, { useContext } from 'react';
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

const { width } = Dimensions.get('window');

// 7 Prestige Medals matching Screenshot 1 & 2
const PRESTIGE_MEDALS = [
  { id: 'm1', label: 'Top Contributor', icon: 'trophy', colors: ['#F59E0B', '#D97706'], badge: 'TOP 1' },
  { id: 'm2', label: 'Diamond Received', icon: 'diamond', colors: ['#3B82F6', '#1D4ED8'], badge: '40M' },
  { id: 'm3', label: 'Charm Star', icon: 'heart', colors: ['#EC4899', '#BE185D'], badge: 'CHARM' },
  { id: 'm4', label: '30-Day Loyalty', icon: 'shield-star', colors: ['#10B981', '#047857'], badge: '30D' },
  { id: 'm5', label: 'Golden Eagle SVIP', icon: 'crown', colors: ['#F59E0B', '#B45309'], badge: 'SVIP' },
  { id: 'm6', label: 'Royal Prestige', icon: 'seal', colors: ['#8B5CF6', '#6D28D9'], badge: 'ROYAL' },
  { id: 'm7', label: 'CP Level 6', icon: 'heart-multiple', colors: ['#F43F5E', '#E11D48'], badge: 'LV.6' },
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
  const { user: authUser, equippedFrame } = useContext(AuthContext) || {};
  if (!user && !visible) return null;

  const targetName = user?.name || user?.username || 'User';
  const targetGender = user?.gender?.toLowerCase() || 'female';
  const targetAge = user?.age || 24;
  const followersCount = user?.followersCount ?? user?.followers ?? 987;
  const targetUserId = String(user?.userId || user?.id || user?._id || '');

  const svipLevel = Number(user?.svipLevel || user?.svip || (user?.isSvip ? 3 : 0));
  const wealthLevel = Number(user?.wealthLevel || user?.level || 35);
  const charmLevel = Number(user?.charmLevel || 36);

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

  const targetIds = [user?.userId, user?.id, user?._id, targetUserId].filter(Boolean).map(String);
  const isSelf = Boolean(
    user?.isCurrentUser ||
    (currentUserId && targetIds.includes(String(currentUserId)))
  );

  const canModerate = (isHostOrAdmin || isRoomOwner) && !isTargetOwner && !isSelf;

  // Partner CP Info if available
  const cpPartner = user?.cpPartner || user?.cpInfo || (svipLevel >= 3 ? {
    name: 'JAFAR',
    level: 6,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop',
  } : null);

  const userBio = user?.bio || user?.about || '^мy нusвαηd 💫 JAFAR 💫 🧿❤️\nDon\'t touch my id...';

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

        {/* Bottom Sheet Card */}
        <View style={[styles.bottomSheetCard, { paddingBottom: Math.max(bottomSafePadding, 20) }]}>
          {/* Top Decorative Arc Glow */}
          <LinearGradient
            colors={['rgba(251, 191, 36, 0.25)', 'rgba(236, 72, 153, 0.1)', 'transparent']}
            style={styles.topSheetGlow}
          />

          {/* Top Report Button */}
          <TouchableOpacity
            style={styles.reportBtn}
            onPress={() => {
              onClose();
              onReport && onReport(user);
            }}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#94A3B8" />
            <Text style={styles.reportText}>Report</Text>
          </TouchableOpacity>

          {/* Floating Avatar & CP Bubble Header (Screenshot 1) */}
          <View style={styles.avatarHeaderRow}>
            {/* Main User Avatar with Ornate SVIP Frame */}
            <View style={styles.mainAvatarContainer}>
              <AvatarWithFrame
                user={isSelf ? (authUser || user) : user}
                frame={
                  (isSelf
                    ? (authUser?.equippedFrameAsset || authUser?.equippedFrame || equippedFrame || currentUserFrame)
                    : (user?.equippedFrameAsset || user?.equippedFrame)) || null
                }
                size={88}
                showOnlineDot={false}
              />

              {/* SVIP Golden Crown & Ribbon Overlay */}
              {svipLevel > 0 && (
                <LinearGradient
                  colors={['#1E3A8A', '#2563EB', '#1D4ED8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.svipRibbonBadge}
                >
                  <Text style={styles.svipRibbonText}>SVIP{svipLevel}</Text>
                </LinearGradient>
              )}
            </View>

            {/* CP Bubble if equipped */}
            {cpPartner && (
              <View style={styles.cpBubbleWrap}>
                <Image
                  source={{ uri: cpPartner.avatar }}
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

          {/* User Display Name with Sparkles */}
          <View style={styles.nameRow}>
            <Text style={styles.nameSparkle}>💫</Text>
            <Text style={styles.userName} numberOfLines={1}>
              {targetName}
            </Text>
            <Text style={styles.nameSparkle}>💫</Text>
          </View>

          {/* Tags Row: SVIP Badge + Wealth + Charm + Gender + Club + Roles */}
          <View style={styles.badgesRow}>
            {/* SVIP Tag */}
            {svipLevel > 0 && (
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.svipPill}
              >
                <Text style={styles.svipPillText}>👑 SVIP{svipLevel}</Text>
              </LinearGradient>
            )}

            {/* Wealth Level */}
            <View style={[styles.statPill, { backgroundColor: '#0284C7' }]}>
              <Text style={styles.statPillText}>💎 Lv.{wealthLevel}</Text>
            </View>

            {/* Charm Level */}
            <View style={[styles.statPill, { backgroundColor: '#10B981' }]}>
              <Text style={styles.statPillText}>🌿 Lv.{charmLevel}</Text>
            </View>

            {/* Gender & Age */}
            <View style={[styles.statPill, { backgroundColor: targetGender === 'female' ? '#DB2777' : '#2563EB' }]}>
              <Text style={styles.statPillText}>
                {targetGender === 'female' ? '♀' : '♂'} {targetAge}
              </Text>
            </View>

            {/* Club Pill */}
            <View style={[styles.statPill, { backgroundColor: '#475569' }]}>
              <Text style={styles.statPillText}>JP</Text>
            </View>

            {/* Room Role */}
            <View style={[styles.statPill, { backgroundColor: '#8B5CF6' }]}>
              <Text style={styles.statPillText}>{isTargetOwner ? 'Owner' : isTargetAdmin ? 'Admin' : 'Member'}</Text>
            </View>
          </View>

          {/* 7 Prestige Medals Wall (Screenshot 1) */}
          <View style={styles.medalsRowContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.medalsScroll}>
              {PRESTIGE_MEDALS.map((medal) => (
                <View key={medal.id} style={styles.medalItemWrap}>
                  <LinearGradient
                    colors={medal.colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.medalCircle}
                  >
                    <MaterialCommunityIcons name={medal.icon} size={16} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={styles.medalBadgeText}>{medal.badge}</Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* ID & Followers Row (Screenshot 1) */}
          <View style={styles.idFollowersRow}>
            {/* Golden Animated Vanity / Official ID */}
            <IdentityDisplayId
              userId={targetUserId}
              officialDisplayId={user?.displayId || user?.equippedCustomId || (svipLevel >= 3 ? '600002' : null)}
              isOfficial={Boolean(user?.isOfficial || user?.equippedCustomId || svipLevel >= 3)}
              showBadge={true}
              showCopy={true}
              fontSize={14}
            />

            {/* Followers Count */}
            <View style={styles.followersWrap}>
              <View style={styles.followerIconBox}>
                <MaterialCommunityIcons name="account-group" size={12} color="#FFFFFF" />
              </View>
              <Text style={styles.followersText}>{followersCount.toLocaleString()} Followers</Text>
            </View>
          </View>

          {/* Bio Text */}
          <Text style={styles.bioText} numberOfLines={2}>
            {userBio}
          </Text>

          {/* 4 Action Icons Row: Profile, Chat, Mute Mic, Mention */}
          <View style={styles.fourActionsRow}>
            <TouchableOpacity
              style={styles.circleActionBtn}
              onPress={() => {
                onClose();
                onOpenFullProfile && onOpenFullProfile(user);
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: '#38BDF8' }]}>
                <Icon name="person" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.actionIconLabel}>Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.circleActionBtn}
              onPress={() => {
                onClose();
                AlertService.show('Chat', `Opening private chat with ${targetName}`, 'info');
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: '#C084FC' }]}>
                <Icon name="chatbubble" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.actionIconLabel}>Chat</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.circleActionBtn}
              onPress={() => {
                onMuteSeat && onMuteSeat(targetUserId);
                AlertService.show('Mute', `Mute toggled for ${targetName}`, 'info');
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: '#FB923C' }]}>
                <MaterialCommunityIcons name="microphone-off" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.actionIconLabel}>Mute Mic</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.circleActionBtn}
              onPress={() => {
                onClose();
                onMention && onMention(targetName);
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: '#FACC15' }]}>
                <MaterialCommunityIcons name="at" size={20} color="#1E293B" />
              </View>
              <Text style={styles.actionIconLabel}>Mention</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom Big Action Buttons: Follow & Send Gifts */}
          {!isSelf && (
            <View style={styles.bottomButtonsRow}>
              <TouchableOpacity
                style={styles.followButton}
                onPress={() => {
                  onFollow && onFollow(user);
                  AlertService.show('Followed', `You are now following ${targetName}!`, 'success');
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.followBtnText}>Follow</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sendGiftButton}
                onPress={() => {
                  onClose();
                  onGift && onGift(user);
                }}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#FBBF24', '#F59E0B', '#D97706']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.sendGiftGrad}
                >
                  <Text style={styles.sendGiftBtnText}>Send Gifts</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Self-Action: Leave Seat */}
          {isSelf && (
            <View style={styles.bottomButtonsRow}>
              <TouchableOpacity
                style={[styles.followButton, { borderColor: '#EF4444' }]}
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
    paddingTop: 16,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
  },
  topSheetGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  reportBtn: {
    position: 'absolute',
    top: 14,
    right: 18,
    alignItems: 'center',
    zIndex: 20,
  },
  reportText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 1,
  },
  avatarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginTop: -52,
    zIndex: 15,
  },
  mainAvatarContainer: {
    width: 92,
    height: 92,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  svipRibbonBadge: {
    position: 'absolute',
    bottom: -6,
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FBBF24',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 4,
  },
  svipRibbonText: {
    color: '#FDE047',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cpBubbleWrap: {
    position: 'absolute',
    right: -24,
    bottom: 2,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#EC4899',
    backgroundColor: '#FFFFFF',
    overflow: 'visible',
  },
  cpAvatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  cpLevelBadge: {
    position: 'absolute',
    bottom: -5,
    right: -6,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#FFFFFF',
  },
  cpLevelBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  nameSparkle: {
    fontSize: 14,
    marginHorizontal: 4,
  },
  userName: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    maxWidth: width * 0.6,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 8,
  },
  svipPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  svipPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  statPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  medalsRowContainer: {
    width: '100%',
    marginVertical: 10,
  },
  medalsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 10,
  },
  medalItemWrap: {
    alignItems: 'center',
  },
  medalCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FEF08A',
    elevation: 2,
  },
  medalBadgeText: {
    fontSize: 8,
    color: '#64748B',
    fontWeight: '700',
    marginTop: 2,
  },
  idFollowersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginVertical: 6,
  },
  followersWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  followerIconBox: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  followersText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  bioText: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 18,
    fontStyle: 'italic',
    marginVertical: 4,
  },
  fourActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: 12,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  circleActionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  actionIconLabel: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
    marginTop: 5,
  },
  bottomButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    marginTop: 10,
  },
  followButton: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  followBtnText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
  },
  sendGiftButton: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  sendGiftGrad: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendGiftBtnText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
});
