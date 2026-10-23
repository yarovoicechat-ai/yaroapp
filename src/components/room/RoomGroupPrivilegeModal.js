import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  ScrollView,
  FlatList,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon from 'react-native-vector-icons/Ionicons';
import { getUserAvatar } from '../../utils/avatarUtil';
import { AlertService } from '../../utils/AlertService';

export default function RoomGroupPrivilegeModal({
  visible,
  onClose,
  room,
  owner,
  membersCount = 2737,
  members = [],
  topContributors = [],
  onJoinGroup,
  bottomSafePadding = 16,
}) {
  const [view, setView] = useState('privilege'); // 'privilege' (Image 1) | 'members' (Image 2)
  const [isJoined, setIsJoined] = useState(false);

  useEffect(() => {
    if (visible) {
      setView('privilege');
    }
  }, [visible]);

  if (!visible) return null;

  const roomTitle = room?.title || room?.roomName || owner?.name || '🔥GAMING🔥 PARTY ROOM';
  const coverImage = room?.coverImage || owner?.avatar || owner?.image || 'https://api.yaroapp.in/uploads/avatars/female_default.webp';
  const displayCount = membersCount || 2737;

  // Build high-fidelity member ranking list for Image 2
  const fallbackMembers = [
    { id: '1', name: '🎯 zuned', isOwner: true, exp: 0, avatar: owner?.avatar || coverImage, badge: '👑' },
    { id: '2', name: '°•M_x_ooy•°', isOwner: false, exp: 690936, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', badge: '💎' },
    { id: '3', name: 'OFFLINE ⭐', isOwner: false, exp: 655911, avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', badge: '🛡️' },
    { id: '4', name: '†_D_evil_†', isOwner: false, exp: 642451, avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150', badge: '⚡' },
    { id: '5', name: 'im zuned', isOwner: false, exp: 622925, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', badge: '🎖️' },
    { id: '6', name: '•+Raja+•', isOwner: false, exp: 488528, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', badge: '🔥' },
    { id: '7', name: 'zuned 👑', isOwner: false, exp: 486180, avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150', badge: '🌟' },
    { id: '8', name: 'Sweety ✍️', isOwner: false, exp: 414085, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', badge: '🏵️' },
    { id: '9', name: 'Mahi 🦋', isOwner: false, exp: 412817, avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150', badge: '🌺' },
    { id: '10', name: 'Liza Cute 🐱', isOwner: false, exp: 374573, avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', badge: '✨' },
    { id: '11', name: '•MANVI• 🔥', isOwner: false, exp: 374400, avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150', badge: '🏆' },
    { id: '12', name: 'ZohaN Khan', isOwner: false, exp: 362100, avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150', badge: '💎' },
  ];

  const rankingList = Array.isArray(members) && members.length > 0
    ? members.map((m, idx) => ({
        id: String(m.userId || m.id || m._id || idx + 1),
        name: m.name || m.username || `User #${idx + 1}`,
        isOwner: idx === 0,
        exp: Number(m.exp || m.points || m.diamonds || Math.max(0, 700000 - idx * 45000)),
        avatar: m.avatar || m.image,
        badge: ['👑', '💎', '🛡️', '⚡', '🎖️', '🔥'][idx % 6],
      }))
    : fallbackMembers;

  // 3 Preview avatars at top right in Image 1
  const previewAvatars = (rankingList.length >= 3 ? rankingList.slice(0, 3) : fallbackMembers.slice(0, 3));

  const handleJoinPress = () => {
    setIsJoined(true);
    AlertService.show('Group Joined! 🎉', 'You have successfully joined the room group and unlocked all privileges!', 'success');
    onJoinGroup && onJoinGroup();
  };

  const handleHelpPress = () => {
    Alert.alert(
      'Member Privileges 💡',
      'Joining this room group grants exclusive badges, priority mic access, room group logo, and boosts your follower engagement!',
      [{ text: 'Got it', style: 'default' }]
    );
  };

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

        {view === 'privilege' ? (
          /* ============================================================== */
          /* VIEW 1: IMAGE 1 - ROOM GROUP PRIVILEGE MODAL                    */
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
                    <MaterialCommunityIcons name="help-circle-outline" size={19} color="#F59E0B" />
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
                      key={item.id || idx}
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

            {/* Full-width Golden Yellow Join Button */}
            <TouchableOpacity
              style={styles.joinBtnTouch}
              activeOpacity={0.88}
              onPress={handleJoinPress}
            >
              <LinearGradient
                colors={['#FFB800', '#F59E0B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.joinBtnGradient}
              >
                <Text style={styles.joinBtnText}>{isJoined ? 'Joined ✓' : 'Join'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          /* ============================================================== */
          /* VIEW 2: IMAGE 2 - GROUP MEMBERS RANKING LIST                    */
          /* ============================================================== */
          <View style={[styles.membersFullSheet, { paddingBottom: Math.max(bottomSafePadding, 16) }]}>
            {/* Top Bar: Back Chevron, Title, Options dots */}
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
                Group Members<Text style={styles.membersTopTitleCount}>({displayCount} members)</Text>
              </Text>

              <TouchableOpacity
                style={styles.dotsBtnTouch}
                activeOpacity={0.7}
                onPress={() => AlertService.show('Group Info', `${roomTitle} - ${displayCount} members`, 'info')}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <MaterialCommunityIcons name="dots-horizontal" size={26} color="#334155" />
              </TouchableOpacity>
            </View>

            {/* Ranked Member List */}
            <FlatList
              data={rankingList}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.membersListContent}
              renderItem={({ item, index }) => {
                const rankNumber = index + 1;
                return (
                  <View style={styles.memberRowItem}>
                    {/* Rank Number */}
                    <Text style={styles.rankNumberText}>{rankNumber}</Text>

                    {/* Circular Avatar */}
                    <Image
                      source={getUserAvatar(item)}
                      style={styles.memberRowAvatar}
                    />

                    {/* Member Details */}
                    <View style={styles.memberInfoCol}>
                      {/* Name & Badges Row */}
                      <View style={styles.memberNameRow}>
                        <Text style={styles.shieldBadgeIcon}>{item.badge || '🛡️'}</Text>
                        <Text style={styles.memberNameText} numberOfLines={1}>
                          {item.name}
                        </Text>

                        {/* Owner Badge on Rank 1 */}
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

                      {/* Contributed Exp Subtitle */}
                      <Text style={styles.contributedExpText}>
                        Contributed {item.exp ? item.exp.toLocaleString() : '0'} Exp
                      </Text>
                    </View>
                  </View>
                );
              }}
            />
          </View>
        )}
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
    marginLeft: 8,
  },
  overlappingStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewMemberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    backgroundColor: '#E2E8F0',
  },
  chevronIcon: {
    marginLeft: 4,
  },
  horizontalDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  memberPrivilegeHeading: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 16,
  },
  privilegeCard: {
    height: 82,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 20,
    paddingRight: 16,
    marginBottom: 14,
    overflow: 'hidden',
  },
  privilegeCardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  privilegeRightGraphic: {
    width: 90,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pedestalBlockPink: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goldenMedalCircle: {
    position: 'absolute',
    top: 14,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  medalWingGraphic: {
    shadowColor: '#F59E0B',
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  pedestalBlockPurple: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pedestalBlockBlue: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  heartSmallBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
  },
  joinBtnTouch: {
    width: '100%',
    marginTop: 10,
    marginBottom: 6,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  joinBtnGradient: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinBtnText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  // VIEW 2: GROUP MEMBERS RANKING LIST STYLES
  membersFullSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '90%',
    paddingTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 24,
  },
  membersTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtnTouch: {
    padding: 4,
  },
  membersTopTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  membersTopTitleCount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94A3B8',
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
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  rankNumberText: {
    width: 32,
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
    textAlign: 'center',
  },
  memberRowAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginHorizontal: 12,
    backgroundColor: '#E2E8F0',
  },
  memberInfoCol: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shieldBadgeIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  memberNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    maxWidth: '65%',
  },
  ownerBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 6,
  },
  ownerBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  contributedExpText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    fontWeight: '500',
  },
});
