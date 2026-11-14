import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getUserAvatar } from '../../utils/avatarUtil';

export default function LiveTopHeader({
  room = {},
  isHost = false,
  viewerCount = 0,
  topSupporters = [],
  diamonds = 103190,
  hourlyRank = 36,
  level = 9,
  isFollowing = false,
  onFollow,
  onClose,
  onPressHost,
  onPressSupporter,
}) {
  const host = room.host || {};
  const hostName = host.name || room.title || 'Live Broadcaster';
  const hostAvatar = getUserAvatar(host);

  const defaultSupporters = [
    { id: '1', name: 'King', avatar: 'https://api.yaroapp.in/uploads/avatars/male_default.webp', score: '75K', crown: '#F59E0B' },
    { id: '2', name: 'Queen', avatar: 'https://api.yaroapp.in/uploads/avatars/female_default.webp', score: '9K', crown: '#94A3B8' },
    { id: '3', name: 'Prince', avatar: 'https://api.yaroapp.in/uploads/avatars/male_default.webp', score: '4.5K', crown: '#CD7F32' },
  ];
  const supporters = topSupporters.length > 0 ? topSupporters : defaultSupporters;

  return (
    <View style={styles.container}>
      {/* Top Row: Broadcaster Capsule + Top Supporters + Close */}
      <View style={styles.topRow}>
        {/* Host Capsule */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onPressHost}
          style={styles.hostPill}
        >
          <View style={styles.hostAvatarWrap}>
            <Image source={hostAvatar} style={styles.hostAvatar} />
            <View style={styles.onlineDot} />
          </View>

          <View style={styles.hostInfo}>
            <Text style={styles.hostName} numberOfLines={1}>
              {hostName}
            </Text>
            <View style={styles.charmRow}>
              <Text style={styles.flameIcon}>🔥</Text>
              <Text style={styles.charmText}>
                {room.hotScore ? String(room.hotScore) : '2,170'}
              </Text>
            </View>
          </View>

          {!isHost && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onFollow}
              style={[styles.followBtn, isFollowing && styles.followingBtn]}
            >
              <LinearGradient
                colors={isFollowing ? ['#475569', '#334155'] : ['#06B6D4', '#0EA5E9']}
                style={styles.followGradient}
              >
                <Icon
                  name={isFollowing ? 'checkmark' : 'add'}
                  size={14}
                  color="#FFF"
                />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {/* Top 3 Supporters */}
        <View style={styles.supportersWrap}>
          {supporters.slice(0, 3).map((sup, idx) => (
            <TouchableOpacity
              key={sup.id || idx}
              activeOpacity={0.8}
              onPress={() => onPressSupporter && onPressSupporter(sup)}
              style={styles.supporterItem}
            >
              <Image source={getUserAvatar(sup)} style={styles.supporterAvatar} />
              <View style={[styles.supporterCrown, { backgroundColor: sup.crown || '#F59E0B' }]}>
                <Text style={styles.supporterScoreText}>{sup.score || '1K'}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Viewers Pill */}
        <View style={styles.viewersPill}>
          <Icon name="people" size={13} color="#FFF" />
          <Text style={styles.viewersCount}>{viewerCount || 0}</Text>
        </View>

        {/* Close Button */}
        <TouchableOpacity
          accessibilityLabel="Leave live"
          activeOpacity={0.7}
          onPress={onClose}
          style={styles.closeBtn}
        >
          <Icon name="close" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Second Row: Diamond Counter + Hourly Rank + Level Bar */}
      <View style={styles.statsRow}>
        <View style={styles.statChip}>
          <Text style={styles.gemIcon}>💎</Text>
          <Text style={styles.statValue}>
            {Number(diamonds).toLocaleString('en-US')}
          </Text>
        </View>

        <TouchableOpacity activeOpacity={0.8} style={styles.statChip}>
          <MaterialCommunityIcons name="chart-bar" size={12} color="#F59E0B" />
          <Text style={styles.rankLabel}>Hour </Text>
          <Text style={styles.rankNum}>No.{hourlyRank}</Text>
          <Icon name="caret-down" size={10} color="#FBBF24" style={{ marginLeft: 2 }} />
        </TouchableOpacity>

        <View style={styles.levelProgressWrap}>
          <LinearGradient
            colors={['#8B5CF6', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.levelBadge}
          >
            <Text style={styles.levelBadgeText}>Lv.{level}</Text>
          </LinearGradient>
          <View style={styles.levelBarTrack}>
            <LinearGradient
              colors={['#EC4899', '#F43F5E']}
              style={[styles.levelBarFill, { width: '65%' }]}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    zIndex: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  hostPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderRadius: 20,
    padding: 3,
    paddingRight: 6,
    maxWidth: 165,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  hostAvatarWrap: {
    position: 'relative',
  },
  hostAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#0F172A',
  },
  hostInfo: {
    marginLeft: 6,
    flex: 1,
  },
  hostName: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 12,
  },
  charmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  flameIcon: {
    fontSize: 10,
  },
  charmText: {
    color: '#F472B6',
    fontWeight: '700',
    fontSize: 10,
    marginLeft: 2,
  },
  followBtn: {
    marginLeft: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  followingBtn: {
    opacity: 0.65,
  },
  followGradient: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportersWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  supporterItem: {
    position: 'relative',
    alignItems: 'center',
  },
  supporterAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  supporterCrown: {
    position: 'absolute',
    bottom: -4,
    borderRadius: 4,
    paddingHorizontal: 3,
    paddingVertical: 1,
    alignItems: 'center',
  },
  supporterScoreText: {
    color: '#FFF',
    fontSize: 7,
    fontWeight: '900',
  },
  viewersPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 14,
    paddingHorizontal: 7,
    paddingVertical: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  viewersCount: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 11,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  gemIcon: {
    fontSize: 10,
    marginRight: 3,
  },
  statValue: {
    color: '#38BDF8',
    fontWeight: '800',
    fontSize: 11,
  },
  rankLabel: {
    color: '#CBD5E1',
    fontWeight: '600',
    fontSize: 10,
    marginLeft: 3,
  },
  rankNum: {
    color: '#FBBF24',
    fontWeight: '800',
    fontSize: 10,
  },
  levelProgressWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
    gap: 4,
  },
  levelBadge: {
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  levelBadgeText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '900',
  },
  levelBarTrack: {
    width: 50,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  levelBarFill: {
    height: '100%',
    borderRadius: 2,
  },
});

