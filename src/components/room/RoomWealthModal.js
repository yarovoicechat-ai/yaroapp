import React, { useState, useMemo } from 'react';
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import RankAvatar from '../ranking/RankAvatar';
import { formatCompactBalance } from '../../utils/numberUtil';
import { getUserAvatar } from '../../utils/avatarUtil';

export default function RoomWealthModal({
  visible,
  onClose,
  onSelectUser,
  users = [],
  currentUser = null,
  onOpenGiftPanel,
  bottomSafePadding = 16,
}) {
  const [activeTab, setActiveTab] = useState('Daily'); // 'Daily' | 'Weekly' | 'Monthly'

  // Filter ONLY users who have actually contributed / sent gifts (> 0 points)
  const rankedUsers = useMemo(() => {
    return [...users]
      .map((member) => {
        const points = Number(
          member.wealthPoints ||
          member.points ||
          member.diamonds ||
          member.totalDiamonds ||
          member.totalSent ||
          member.contribution ||
          0
        );
        return {
          ...member,
          points,
        };
      })
      .filter((m) => m.points > 0)
      .sort((a, b) => b.points - a.points)
      .map((member, index) => ({
        ...member,
        rank: index + 1,
      }));
  }, [users]);

  // Current user's contribution and rank
  const myContribution = useMemo(() => {
    if (!currentUser) return 0;
    const myId = String(currentUser.userId || currentUser._id || currentUser.id || '');
    const found = rankedUsers.find(
      (u) => String(u.userId || u._id || u.id || '') === myId
    );
    return found ? found.points : 0;
  }, [currentUser, rankedUsers]);

  const myRank = useMemo(() => {
    if (!currentUser) return '99+';
    const myId = String(currentUser.userId || currentUser._id || currentUser.id || '');
    const found = rankedUsers.find(
      (u) => String(u.userId || u._id || u.id || '') === myId
    );
    if (!found) return '99+';
    return found.rank > 99 ? '99+' : `#${found.rank}`;
  }, [currentUser, rankedUsers]);

  const myRankNum = useMemo(() => {
    if (!currentUser) return 0;
    const myId = String(currentUser.userId || currentUser._id || currentUser.id || '');
    const found = rankedUsers.find(
      (u) => String(u.userId || u._id || u.id || '') === myId
    );
    return found ? found.rank : 0;
  }, [currentUser, rankedUsers]);

  if (!visible) return null;

  // Top 1 user
  const top1User = rankedUsers.length > 0 ? rankedUsers[0] : null;
  // Users from rank 2 onwards
  const restUsers = rankedUsers.length > 1 ? rankedUsers.slice(1) : [];

  // Dynamic time period text based on tab
  const today = new Date();
  const dateStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
  const timePeriodText =
    activeTab === 'Daily'
      ? `Time period: ${dateStr} 00:00am ~ 23:59pm`
      : activeTab === 'Weekly'
      ? `Time period: This Week (Mon ~ Sun)`
      : `Time period: This Month (${today.toLocaleString('default', { month: 'short' })} 01 ~ ${today.toLocaleString('default', { month: 'short' })} 31)`;

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
        <View style={[styles.sheetContainer, { paddingBottom: Math.max(bottomSafePadding, 16) }]}>
          {/* Header Title */}
          <Text style={styles.sheetTitle}>Contribution</Text>

          {/* 3 Tabs: Daily | Weekly | Monthly */}
          <View style={styles.tabsRow}>
            {['Daily', 'Weekly', 'Monthly'].map((tab) => {
              const isActive = activeTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={styles.tabBtn}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tabBtnText, isActive && styles.activeTabBtnText]}>
                    {tab}
                  </Text>
                  {isActive && <View style={styles.activeTabIndicator} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Subtitle: Time Period */}
          <Text style={styles.timePeriodText}>{timePeriodText}</Text>

          {/* Main Scrollable Content */}
          <ScrollView style={styles.userList} showsVerticalScrollIndicator={false}>
            {rankedUsers.length === 0 ? (
              /* Empty State (when no one has sent gifts yet in the room) */
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconBox}>
                  <MaterialCommunityIcons name="treasure-chest" size={56} color="#CBD5E1" />
                </View>
                <Text style={styles.emptyTitle}>No contributions yet</Text>
                <Text style={styles.emptySubtitle}>Come take on the ranking list</Text>
                {onOpenGiftPanel && (
                  <TouchableOpacity
                    style={styles.emptySendBtn}
                    onPress={() => {
                      onClose?.();
                      onOpenGiftPanel?.();
                    }}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={['#F59E0B', '#D97706']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.emptySendBtnGradient}
                    >
                      <Text style={styles.emptySendBtnText}>Send First Gift 🎁</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <>
                {/* ============================================================== */}
                {/* HERO TOP 1 PODIUM (EXACT MATCH TO SCREENSHOT)                  */}
                {/* ============================================================== */}
                {top1User && (
                  <TouchableOpacity
                    style={styles.heroPodiumContainer}
                    activeOpacity={0.85}
                    onPress={() => {
                      onClose?.();
                      onSelectUser?.(top1User);
                    }}
                  >
                    {/* Golden Laurel Frame & Avatar Container */}
                    <View style={styles.heroAvatarContainer}>
                      <RankAvatar
                        rank={1}
                        user={top1User}
                        size={72}
                      />
                    </View>

                    {/* User Name */}
                    <Text style={styles.heroUserName} numberOfLines={1}>
                      {top1User.name || 'User'}
                    </Text>

                    {/* Badges Row: Lv (Green), Wealth (Cyan), SVIP (Blue), Crest */}
                    <View style={styles.heroBadgesRow}>
                      <View style={[styles.badgePill, { backgroundColor: '#10B981' }]}>
                        <MaterialCommunityIcons name="diamond-stone" size={10} color="#FFF" style={{ marginRight: 2 }} />
                        <Text style={styles.badgeText}>Lv.{top1User.level || 20}</Text>
                      </View>

                      <View style={[styles.badgePill, { backgroundColor: '#06B6D4' }]}>
                        <MaterialCommunityIcons name="star-four-points" size={10} color="#FFF" style={{ marginRight: 2 }} />
                        <Text style={styles.badgeText}>Lv.{top1User.wealthLevel || top1User.charmLevel || 22}</Text>
                      </View>

                      <LinearGradient
                        colors={['#3B82F6', '#1D4ED8']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.svipBadgePill}
                      >
                        <MaterialCommunityIcons name="chess-knight" size={10} color="#FFF" style={{ marginRight: 2 }} />
                        <Text style={styles.svipBadgeText}>SVIP{top1User.svipLevel || 2}</Text>
                      </LinearGradient>

                      <View style={styles.crestBadge}>
                        <MaterialCommunityIcons name="shield-star" size={16} color="#DC2626" />
                      </View>
                    </View>

                    {/* Diamond Amount: 💎 1.4M */}
                    <View style={styles.heroDiamondRow}>
                      <Text style={styles.diamondEmoji}>💎</Text>
                      <Text style={styles.heroDiamondValue}>
                        {formatCompactBalance(top1User.points)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}

                {/* ============================================================== */}
                {/* RANK 2 ONWARDS LIST                                            */}
                {/* ============================================================== */}
                {restUsers.map((member) => {
                  const isRank2 = member.rank === 2;
                  const isRank3 = member.rank === 3;

                  return (
                    <TouchableOpacity
                      key={String(member.id || member._id || member.userId || member.rank)}
                      style={styles.userRow}
                      onPress={() => {
                        onClose?.();
                        onSelectUser?.(member);
                      }}
                      activeOpacity={0.75}
                    >
                      {/* Left Rank Medal / Number */}
                      <View style={styles.rankCol}>
                        {isRank2 ? (
                          <LinearGradient
                            colors={['#93C5FD', '#3B82F6', '#1D4ED8']}
                            style={styles.medalCircle}
                          >
                            <Text style={styles.medalNumText}>2</Text>
                          </LinearGradient>
                        ) : isRank3 ? (
                          <LinearGradient
                            colors={['#FDBA74', '#EA580C', '#C2410C']}
                            style={styles.medalCircle}
                          >
                            <Text style={styles.medalNumText}>3</Text>
                          </LinearGradient>
                        ) : (
                          <Text style={styles.plainRankNum}>{member.rank}</Text>
                        )}
                      </View>

                      {/* Avatar with Crown Tag on Top Right */}
                      <View style={styles.avatarWrapper}>
                        {isRank2 || isRank3 ? (
                          <RankAvatar
                            rank={isRank2 ? 2 : 3}
                            user={member}
                            size={44}
                          />
                        ) : (
                          <>
                            <Image
                              source={getUserAvatar(member)}
                              style={styles.userAvatar}
                            />
                            <View style={styles.avatarCrownTag}>
                              <MaterialCommunityIcons name="crown" size={7} color="#FFF" style={{ marginRight: 1 }} />
                              <Text style={styles.avatarCrownTagText}>{member.rank}</Text>
                            </View>
                          </>
                        )}
                      </View>

                      {/* User Info Column */}
                      <View style={styles.userInfoCol}>
                        <Text style={styles.userName} numberOfLines={1}>
                          {member.name || 'User'}
                        </Text>

                        {/* Badges Row */}
                        <View style={styles.rowBadges}>
                          <View style={[styles.badgePill, { backgroundColor: '#10B981' }]}>
                            <MaterialCommunityIcons name="diamond-stone" size={9} color="#FFF" style={{ marginRight: 1 }} />
                            <Text style={styles.badgeTextMini}>Lv.{member.level || 15}</Text>
                          </View>

                          <View style={[styles.badgePill, { backgroundColor: '#06B6D4' }]}>
                            <MaterialCommunityIcons name="star-four-points" size={9} color="#FFF" style={{ marginRight: 1 }} />
                            <Text style={styles.badgeTextMini}>Lv.{member.wealthLevel || member.charmLevel || 10}</Text>
                          </View>

                          {member.svipLevel ? (
                            <LinearGradient
                              colors={['#3B82F6', '#1D4ED8']}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              style={styles.svipBadgePillMini}
                            >
                              <MaterialCommunityIcons name="chess-knight" size={8} color="#FFF" style={{ marginRight: 1 }} />
                              <Text style={styles.svipBadgeTextMini}>SVIP{member.svipLevel}</Text>
                            </LinearGradient>
                          ) : (
                            <View style={[styles.badgePill, { backgroundColor: '#F59E0B' }]}>
                              <Text style={styles.badgeTextMini}>VIP</Text>
                            </View>
                          )}

                          <View style={styles.crestBadgeMini}>
                            <MaterialCommunityIcons name="shield-star" size={13} color="#DC2626" />
                          </View>
                        </View>
                      </View>

                      {/* Right Diamonds Contribution: 💎 1M */}
                      <View style={styles.diamondScoreCol}>
                        <Text style={styles.diamondEmojiSmall}>💎</Text>
                        <Text style={styles.diamondScoreText}>
                          {formatCompactBalance(member.points)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}
          </ScrollView>

          {/* ============================================================== */}
          {/* BOTTOM FIXED CURRENT USER ROW (EXACT MATCH TO SCREENSHOT)      */}
          {/* ============================================================== */}
          <View style={styles.myRankBar}>
            {/* Rank Number: 99+ */}
            <Text style={styles.myRankNum}>{myRank}</Text>

            {/* Avatar */}
            {myRankNum >= 1 && myRankNum <= 3 ? (
              <RankAvatar
                rank={myRankNum}
                user={currentUser}
                size={38}
              />
            ) : (
              <Image
                source={getUserAvatar(currentUser)}
                style={styles.myAvatar}
              />
            )}

            {/* Name & Levels */}
            <View style={styles.myInfoCol}>
              <Text style={styles.myName} numberOfLines={1}>
                {currentUser?.name || 'You'}
              </Text>
              <View style={styles.myBadgesRow}>
                <View style={[styles.badgePill, { backgroundColor: '#D97706', paddingVertical: 1, paddingHorizontal: 4 }]}>
                  <MaterialCommunityIcons name="diamond-stone" size={8} color="#FFF" style={{ marginRight: 1 }} />
                  <Text style={styles.badgeTextMicro}>Lv.{currentUser?.level || 4}</Text>
                </View>

                <View style={[styles.badgePill, { backgroundColor: '#64748B', paddingVertical: 1, paddingHorizontal: 4 }]}>
                  <MaterialCommunityIcons name="star" size={8} color="#FFF" style={{ marginRight: 1 }} />
                  <Text style={styles.badgeTextMicro}>Lv.{currentUser?.charmLevel || 0}</Text>
                </View>
              </View>
            </View>

            {/* Diamonds: 💎 0 */}
            <View style={styles.diamondScoreCol}>
              <Text style={styles.diamondEmojiSmall}>💎</Text>
              <Text style={styles.myDiamondsVal}>
                {myContribution > 0 ? formatCompactBalance(myContribution) : '0'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 16,
    paddingHorizontal: 18,
    height: '75%',
    maxHeight: 640,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 24,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 12,
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 4,
  },
  tabBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    position: 'relative',
  },
  tabBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#94A3B8',
  },
  activeTabBtnText: {
    color: '#F59E0B',
    fontWeight: '700',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: -1,
    width: '80%',
    height: 3,
    backgroundColor: '#F59E0B',
    borderRadius: 2,
  },
  timePeriodText: {
    fontSize: 11.5,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 10,
    fontWeight: '500',
  },
  userList: {
    flex: 1,
  },

  /* Empty State */
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 45,
  },
  emptyIconBox: {
    width: 80,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
    marginBottom: 16,
  },
  emptySendBtn: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  emptySendBtnGradient: {
    paddingHorizontal: 20,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySendBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },

  /* Hero Podium Top 1 */
  heroPodiumContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 8,
  },
  heroAvatarContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  heroCrownWrap: {
    position: 'absolute',
    top: -24,
    alignItems: 'center',
    zIndex: 10,
  },
  crownMiniBadge: {
    position: 'absolute',
    top: 0,
    right: -10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  crownMiniBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
  },
  heroAvatarRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#F59E0B',
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  heroAvatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#F1F5F9',
  },
  top1Ribbon: {
    position: 'absolute',
    bottom: -8,
    paddingHorizontal: 12,
    paddingVertical: 2.5,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FFD700',
    zIndex: 10,
  },
  top1RibbonText: {
    color: '#FFE875',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  heroUserName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 6,
    maxWidth: 220,
    textAlign: 'center',
  },
  heroBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 5,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  svipBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  svipBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  crestBadge: {
    marginLeft: 2,
  },
  heroDiamondRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  diamondEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  heroDiamondValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#475569',
  },

  /* Rank 2+ Rows */
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F8FAFC',
  },
  rankCol: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF',
    elevation: 2,
  },
  medalNumText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
  },
  plainRankNum: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748B',
  },
  avatarWrapper: {
    position: 'relative',
    marginHorizontal: 10,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
  },
  avatarCrownTag: {
    position: 'absolute',
    top: -3,
    right: -4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    borderRadius: 6,
    paddingHorizontal: 3,
    paddingVertical: 0.8,
  },
  avatarCrownTagText: {
    color: '#FFF',
    fontSize: 8.5,
    fontWeight: '900',
  },
  userInfoCol: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 3,
  },
  rowBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  badgeTextMini: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },
  svipBadgePillMini: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 5,
  },
  svipBadgeTextMini: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },
  crestBadgeMini: {
    marginLeft: 1,
  },
  diamondScoreCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 8,
  },
  diamondEmojiSmall: {
    fontSize: 12,
    marginBottom: 1,
  },
  diamondScoreText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
  },

  /* Bottom Pinned User Row */
  myRankBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
    marginTop: 4,
  },
  myRankNum: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748B',
    width: 32,
    textAlign: 'center',
  },
  myAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginHorizontal: 10,
    backgroundColor: '#F1F5F9',
  },
  myInfoCol: {
    flex: 1,
    minWidth: 0,
  },
  myName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 3,
  },
  myBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeTextMicro: {
    color: '#FFF',
    fontSize: 8.5,
    fontWeight: '800',
  },
  myDiamondsVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
  },
});
