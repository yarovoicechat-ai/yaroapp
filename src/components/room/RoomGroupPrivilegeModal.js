import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon from 'react-native-vector-icons/Ionicons';
import { getUserAvatar } from '../../utils/avatarUtil';
import { AlertService } from '../../utils/AlertService';
import { apiUtil } from '../../utils/apiUtil';
import FanClubBadge from './FanClubBadge';
import FanClubIntroModal from './FanClubIntroModal';

export default function RoomGroupPrivilegeModal({
  visible,
  onClose,
  room,
  owner,
  isRoomOwner = false,
  currentUser = null,
  membersCount = 0,
  members = [],
  topContributors = [],
  onJoinGroup,
  bottomSafePadding = 16,
}) {
  const [view, setView] = useState('privilege'); // 'privilege' (View 1) | 'members' (View 2)
  const [isJoined, setIsJoined] = useState(Boolean(isRoomOwner));
  const [joining, setJoining] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [realMembers, setRealMembers] = useState([]);
  const [realCount, setRealCount] = useState(membersCount || 0);
  const [showIntroModal, setShowIntroModal] = useState(false);

  const roomId = room?.id || room?.roomId || room?.channelName || '';

  const normalizeId = (id) => {
    const s = String(id || '').trim();
    if (/^10000\d{3}$/.test(s)) {
      return `100000000${s.slice(5)}`.slice(-10);
    }
    return s;
  };

  const ownerIdStr = String(owner?.userId || owner?.id || owner?._id || '');
  const ownerName = owner?.name || 'Room Host';
  const roomTitle = room?.title || room?.roomName || ownerName || 'Voice Room';
  const coverImage =
    room?.coverImage ||
    owner?.avatar ||
    owner?.image ||
    'https://api.yaroapp.in/uploads/avatars/female_default.webp';

  // Fetch real Fan Club data (real members, real EXP, membership status) from server
  const fetchFanClubData = useCallback(async () => {
    if (!roomId) return;
    try {
      setLoadingMembers(true);
      const res = await apiUtil.get(`/voice-club/rooms/${roomId}/fan-club`);
      if (res?.data?.success && res.data.data) {
        const d = res.data.data;
        if (isRoomOwner || d.isJoined) {
          setIsJoined(true);
        } else {
          setIsJoined(Boolean(d.isJoined));
        }
        if (Array.isArray(d.members)) {
          setRealMembers(d.members);
        }
        setRealCount(Number(d.membersCount) || (d.members ? d.members.length : 0));
      }
    } catch (err) {
      console.warn('[RoomGroupPrivilegeModal] Fetch error:', err?.message);
    } finally {
      setLoadingMembers(false);
    }
  }, [roomId, isRoomOwner]);

  useEffect(() => {
    if (visible) {
      setView('privilege');
      if (isRoomOwner) {
        setIsJoined(true);
      }
      fetchFanClubData();
    }
  }, [visible, isRoomOwner, fetchFanClubData]);

  if (!visible) return null;

  // Real ranking list from server (strictly NO fake mock members, NO fake EXP)
  const rankingList = realMembers.length > 0
    ? realMembers
    : (Array.isArray(members) && members.length > 0 ? members : [
        {
          id: ownerIdStr || 'owner',
          userId: ownerIdStr || 'owner',
          name: ownerName,
          isOwner: true,
          exp: 0,
          avatar: owner?.avatar || coverImage,
        },
      ]);

  const displayCount = realCount || rankingList.length || 1;

  // 3 Preview avatars at top right in View 1
  const previewAvatars = rankingList.slice(0, 3);

  const handleJoinPress = async () => {
    if (joining || isJoined) return;
    setJoining(true);
    try {
      const res = await apiUtil.post(`/voice-club/rooms/${roomId}/fan-club/join`, {
        plan: '1_month',
      });
      if (res?.data?.success) {
        setIsJoined(true);
        AlertService.show(
          'Fan Club Joined! 🎉',
          'You have successfully joined the room Fan Club! Your membership badge is active.',
          'success'
        );
        fetchFanClubData();
        onJoinGroup && onJoinGroup();
      } else {
        AlertService.show('Join Failed', res?.data?.message || 'Could not join Fan Club', 'error');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Could not join Fan Club';
      AlertService.show('Insufficient Diamonds', msg, 'error');
    } finally {
      setJoining(false);
    }
  };

  const handleHelpPress = () => {
    setShowIntroModal(true);
  };

  return (
    <>
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

          {view === 'privilege' ? (
            /* ============================================================== */
            /* VIEW 1: ROOM GROUP PRIVILEGE MODAL                             */
            /* ============================================================== */
            <View style={[styles.privilegeSheetCard, { paddingBottom: Math.max(bottomSafePadding, 20) }]}>
              {/* Top Close Button (X) */}
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Icon name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>

              {/* Header: Room Logo + Info + 3 Overlapping Avatars with Chevron */}
              <View style={styles.groupHeaderRow}>
                {/* Room DP */}
                <View style={styles.avatarBorderGlow}>
                  <Image
                    source={getUserAvatar({ avatar: coverImage, image: coverImage })}
                    style={styles.groupAvatar}
                  />
                </View>

                {/* Title & Count */}
                <View style={styles.groupHeaderInfo}>
                  <View style={styles.groupNameRow}>
                    <Text style={styles.groupNameText} numberOfLines={1}>
                      {roomTitle}
                    </Text>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={handleHelpPress}
                      style={styles.helpIconBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <MaterialCommunityIcons name="help-circle-outline" size={20} color="#F59E0B" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.membersCountText}>Members: {displayCount}</Text>
                </View>

                {/* Right: 3 Overlapping Member Avatars + Chevron Arrow */}
                <TouchableOpacity
                  style={styles.overlappingAvatarsTouch}
                  activeOpacity={0.75}
                  onPress={() => setView('members')}
                >
                  <View style={styles.overlappingStack}>
                    {previewAvatars.map((item, idx) => (
                      <Image
                        key={String(item.id || item._id || item.userId || idx)}
                        source={getUserAvatar(item)}
                        style={[
                          styles.previewMemberAvatar,
                          {
                            marginLeft: idx === 0 ? 0 : -10,
                            zIndex: 10 - idx,
                          },
                        ]}
                      />
                    ))}
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={22} color="#CBD5E1" style={styles.chevronIcon} />
                </TouchableOpacity>
              </View>

              {/* Divider */}
              <View style={styles.horizontalDivider} />

              {/* Title: Member Privilege */}
              <Text style={styles.memberPrivilegeHeading}>Member Privilege</Text>

              {/* Card 1: Own Member Logo (Coral / Pink Gradient with Medal Badge) */}
              <LinearGradient
                colors={['#FB7185', '#FED7AA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.privilegeCard}
              >
                <Text style={styles.privilegeCardTitle}>Own Member Logo</Text>
                <View style={styles.privilegeRightGraphic}>
                  <View style={styles.pedestalBlockPink}>
                    <View style={styles.goldenMedalCircle}>
                      <MaterialCommunityIcons name="heart" size={16} color="#FFFFFF" />
                    </View>
                    <MaterialCommunityIcons name="medal" size={40} color="#F59E0B" style={styles.medalWingGraphic} />
                  </View>
                </View>
              </LinearGradient>

              {/* Card 2: Take mic freely (Purple / Magenta Gradient with Golden Mic on Pedestal) */}
              <LinearGradient
                colors={['#A855F7', '#E9D5FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.privilegeCard}
              >
                <Text style={styles.privilegeCardTitle}>Take mic freely</Text>
                <View style={styles.privilegeRightGraphic}>
                  <View style={styles.pedestalBlockPurple}>
                    <MaterialCommunityIcons name="microphone-variant" size={38} color="#FBBF24" />
                  </View>
                </View>
              </LinearGradient>

              {/* Card 3: Have more followers (Blue / Cyan Gradient with Follower Hearts) */}
              <LinearGradient
                colors={['#3B82F6', '#BFDBFE']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.privilegeCard}
              >
                <Text style={styles.privilegeCardTitle}>Have more followers</Text>
                <View style={styles.privilegeRightGraphic}>
                  <View style={styles.pedestalBlockBlue}>
                    <MaterialCommunityIcons name="account-group" size={36} color="#EC4899" />
                    <MaterialCommunityIcons name="heart" size={16} color="#FFFFFF" style={styles.heartSmallBadge} />
                  </View>
                </View>
              </LinearGradient>

              {/* BOTTOM ACTION BUTTON:
                  - If not joined: Full-width Golden Yellow Join Button (99 💎 / month)
                  - If already joined: "Joined ✓" Status Pill (never shows Join button again) */}
              {!isRoomOwner && !isJoined ? (
                <TouchableOpacity
                  style={styles.joinBtnTouch}
                  activeOpacity={0.88}
                  disabled={joining}
                  onPress={handleJoinPress}
                >
                  <LinearGradient
                    colors={['#FFB800', '#F59E0B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.joinBtnGradient}
                  >
                    {joining ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.joinBtnText}>Join (99 💎)</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <View style={styles.joinedStatusBadgeWrap}>
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.joinedStatusGradient}
                  >
                    <MaterialCommunityIcons name="check-decagram" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.joinedStatusText}>
                      {isRoomOwner ? 'Club Host (Owner)' : 'Club Member Active'}
                    </Text>
                  </LinearGradient>
                </View>
              )}
            </View>
          ) : (
            /* ============================================================== */
            /* VIEW 2: GROUP MEMBERS RANKING LIST (NO LUXURY RANK FRAMES)      */
            /* ============================================================== */
            <View style={[styles.membersFullSheet, { paddingBottom: Math.max(bottomSafePadding, 16) }]}>
              {/* Top Bar: Back Chevron, Title, Help/Options */}
              <View style={styles.membersTopBar}>
                <TouchableOpacity
                  style={styles.backBtnTouch}
                  activeOpacity={0.7}
                  onPress={() => setView('privilege')}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Icon name="chevron-back" size={26} color="#1E293B" />
                </TouchableOpacity>

                <Text style={styles.membersTopTitle}>
                  Fan Club Members<Text style={styles.membersTopTitleCount}> ({displayCount} members)</Text>
                </Text>

                <TouchableOpacity
                  style={styles.dotsBtnTouch}
                  activeOpacity={0.7}
                  onPress={handleHelpPress}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <MaterialCommunityIcons name="help-circle-outline" size={24} color="#F59E0B" />
                </TouchableOpacity>
              </View>

              {/* Ranked Member List with Real EXP (NO FRAMES on avatars) */}
              {loadingMembers ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <ActivityIndicator size="large" color="#F59E0B" />
                </View>
              ) : (
                <FlatList
                  data={rankingList}
                  keyExtractor={(item) => String(item.id || item._id || item.userId)}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.membersListContent}
                  renderItem={({ item, index }) => {
                    const rankNumber = index + 1;
                    const memberExp = Number(item.exp || 0);

                    return (
                      <View style={styles.memberRowItem}>
                        {/* Rank Number */}
                        <Text style={styles.rankNumberText}>{rankNumber}</Text>

                        {/* Clean Circular Avatar (STRICTLY NO RANK FRAMES) */}
                        <View style={styles.avatarNoFrameWrap}>
                          <Image
                            source={getUserAvatar(item)}
                            style={styles.memberRowAvatar}
                          />
                        </View>

                        {/* Member Details */}
                        <View style={styles.memberInfoCol}>
                          {/* Name & Badge Row */}
                          <View style={styles.memberNameRow}>
                            {/* Dynamic Fan Club Medal Badge based on Real EXP */}
                            <FanClubBadge exp={memberExp} size={24} style={{ marginRight: 6 }} />

                            <Text style={styles.memberNameText} numberOfLines={1}>
                              {item.name}
                            </Text>

                            {/* Owner Badge */}
                            {item.isOwner && (
                              <LinearGradient
                                colors={['#FF6B6B', '#FA5252']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.ownerBadgePill}
                              >
                                <Text style={styles.ownerBadgeText}>Owner</Text>
                              </LinearGradient>
                            )}
                          </View>

                          {/* Contributed Real Exp (earned from sending and stay) */}
                          <Text style={styles.contributedExpText}>
                            Contributed {memberExp ? memberExp.toLocaleString() : '0'} Exp
                          </Text>
                        </View>
                      </View>
                    );
                  }}
                />
              )}
            </View>
          )}
        </View>
      </Modal>

      {/* Fan Club Introduction Modal (Matching exact user screenshot) */}
      <FanClubIntroModal
        visible={showIntroModal}
        onClose={() => setShowIntroModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  privilegeSheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 18,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 24,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 18,
    padding: 6,
    zIndex: 10,
  },
  groupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingRight: 40,
  },
  avatarBorderGlow: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#F59E0B',
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFBEB',
  },
  groupAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FED7AA',
  },
  groupHeaderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  groupNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupNameText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    maxWidth: '75%',
  },
  helpIconBtn: {
    marginLeft: 6,
  },
  membersCountText: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
    fontWeight: '500',
  },
  overlappingAvatarsTouch: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overlappingStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewMemberAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    backgroundColor: '#E2E8F0',
  },
  chevronIcon: {
    marginLeft: 2,
  },
  horizontalDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  memberPrivilegeHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  privilegeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 10,
    height: 64,
  },
  privilegeCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    maxWidth: '60%',
  },
  privilegeRightGraphic: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pedestalBlockPink: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  goldenMedalCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#EC4899',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FDE047',
    zIndex: 2,
  },
  medalWingGraphic: {
    position: 'absolute',
    top: 4,
    opacity: 0.9,
  },
  pedestalBlockPurple: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pedestalBlockBlue: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  heartSmallBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#EC4899',
    borderRadius: 8,
    padding: 1,
  },
  joinBtnTouch: {
    marginTop: 14,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  joinBtnGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  joinedStatusBadgeWrap: {
    marginTop: 14,
    borderRadius: 25,
    overflow: 'hidden',
  },
  joinedStatusGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  joinedStatusText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // View 2: Group Members Full Sheet
  membersFullSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '75%',
    paddingTop: 16,
  },
  membersTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtnTouch: {
    padding: 4,
  },
  membersTopTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  membersTopTitleCount: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },
  dotsBtnTouch: {
    padding: 4,
  },
  membersListContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
  },
  memberRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  rankNumberText: {
    width: 24,
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
  },
  avatarNoFrameWrap: {
    marginHorizontal: 10,
  },
  memberRowAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E2E8F0',
  },
  memberInfoCol: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flexShrink: 1,
    marginRight: 6,
  },
  ownerBadgePill: {
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 10,
  },
  ownerBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
  },
  contributedExpText: {
    fontSize: 11.5,
    color: '#94A3B8',
    marginTop: 3,
    fontWeight: '600',
  },
});
