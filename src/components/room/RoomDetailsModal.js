import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon from 'react-native-vector-icons/Ionicons';
import { getUserAvatar } from '../../utils/avatarUtil';

export default function RoomDetailsModal({
  visible,
  onClose,
  room,
  owner,
  onOpenSettings,
  onOpenGroup,
  bottomSafePadding = 16,
}) {
  if (!visible) return null;

  const roomTitle = room?.title || room?.roomName || owner?.name || 'Voice Room';
  const roomId = room?.id || room?.roomId || owner?.userId || '—';
  const roomCover = room?.coverImage || owner?.avatar || owner?.image || '';
  const roomLanguage = room?.language || 'Hindi(हिंदी)';
  const roomCountry = room?.country || 'India';
  const roomAnnouncement = room?.about || room?.description || 'Welcome to my room, let\'s chat together!';
  const totalDiamonds = room?.totalDiamonds ?? room?.diamonds ?? 0;
  const membersCount = room?.onlineCount ?? room?.membersCount ?? 1;

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

        <View style={[styles.bottomSheetCard, { paddingBottom: Math.max(bottomSafePadding, 24) }]}>
          {/* Top Header Row: Room Profile Title + Close Button */}
          <View style={styles.topHeaderRow}>
            <Text style={styles.topTitle}>Room Profile</Text>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Icon name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Top Right Settings Option */}
          <TouchableOpacity
            style={styles.settingsTouch}
            onPress={() => {
              onClose();
              onOpenSettings && onOpenSettings();
            }}
            activeOpacity={0.75}
          >
            <MaterialCommunityIcons name="cog-outline" size={24} color="#64748B" />
            <Text style={styles.settingsLabel}>Settings</Text>
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Center Avatar */}
            <View style={styles.avatarCenterWrap}>
              <Image
                source={getUserAvatar({ avatar: roomCover, image: roomCover })}
                style={styles.roomAvatar}
              />
            </View>

            {/* Room Title */}
            <Text style={styles.roomTitleText} numberOfLines={1}>
              {roomTitle}
            </Text>

            {/* ID */}
            <Text style={styles.roomIdText}>ID:{roomId}</Text>

            {/* Stats Row: Total Diamonds | Members */}
            <View style={styles.statsRow}>
              {/* Total Diamonds */}
              <View style={styles.statCol}>
                <View style={styles.statTopItem}>
                  <MaterialCommunityIcons name="diamond" size={19} color="#A855F7" style={{ marginRight: 4 }} />
                  <Text style={styles.statNumber}>{totalDiamonds}</Text>
                </View>
                <Text style={styles.statLabel}>Total Diamonds</Text>
              </View>

              {/* Vertical Divider */}
              <View style={styles.verticalDivider} />

              {/* Members */}
              <TouchableOpacity
                style={styles.statCol}
                activeOpacity={0.75}
                onPress={() => {
                  onClose();
                  onOpenGroup && onOpenGroup();
                }}
              >
                <View style={styles.statTopItem}>
                  <MaterialCommunityIcons name="account-heart" size={19} color="#F97316" style={{ marginRight: 4 }} />
                  <Text style={styles.statNumber}>{membersCount}</Text>
                </View>
                <Text style={styles.statLabel}>Members</Text>
              </TouchableOpacity>
            </View>

            {/* Horizontal Divider */}
            <View style={styles.horizontalDivider} />

            {/* Field 1: Language */}
            <View style={styles.fieldSection}>
              <Text style={styles.fieldLabel}>Language:</Text>
              <Text style={styles.fieldValue}>{roomLanguage}</Text>
            </View>

            {/* Horizontal Divider */}
            <View style={styles.horizontalDivider} />

            {/* Field 2: Country */}
            <View style={styles.fieldSection}>
              <Text style={styles.fieldLabel}>Country:</Text>
              <Text style={styles.fieldValue}>{roomCountry}</Text>
            </View>

            {/* Horizontal Divider */}
            <View style={styles.horizontalDivider} />

            {/* Field 3: Announcement */}
            <View style={styles.fieldSection}>
              <Text style={styles.fieldLabel}>Announcement:</Text>
              <Text style={styles.announcementValue}>{roomAnnouncement}</Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  bottomSheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 16,
    maxHeight: '88%',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    position: 'relative',
  },
  topTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
  },
  closeBtn: {
    position: 'absolute',
    right: 0,
    top: 4,
    padding: 4,
  },
  settingsTouch: {
    position: 'absolute',
    right: 20,
    top: 52,
    alignItems: 'center',
    zIndex: 10,
  },
  settingsLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  scrollContent: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  avatarCenterWrap: {
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 12,
  },
  roomAvatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#FED7AA',
  },
  roomTitleText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 4,
  },
  roomIdText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statTopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  verticalDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
  },
  horizontalDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  fieldSection: {
    paddingHorizontal: 4,
  },
  fieldLabel: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  announcementValue: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
});
