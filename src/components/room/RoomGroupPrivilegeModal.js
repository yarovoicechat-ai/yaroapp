import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon from 'react-native-vector-icons/Ionicons';
import { getUserAvatar } from '../../utils/avatarUtil';

export default function RoomGroupPrivilegeModal({
  visible,
  onClose,
  room,
  owner,
  membersCount = 1,
  onOpenMembers,
  bottomSafePadding = 16,
}) {
  if (!visible) return null;

  const roomTitle = room?.title || room?.roomName || owner?.name || 'Group';
  const coverImage = room?.coverImage || owner?.avatar || owner?.image || 'https://api.yaroapp.in/uploads/avatars/female_default.webp';

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
          {/* Top Close Button (X) */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Icon name="close" size={24} color="#64748B" />
          </TouchableOpacity>

          {/* Group Header Row */}
          <View style={styles.groupHeaderRow}>
            <Image
              source={getUserAvatar({ avatar: coverImage, image: coverImage })}
              style={styles.groupAvatar}
            />

            <View style={styles.groupHeaderInfo}>
              <View style={styles.groupNameRow}>
                <Text style={styles.groupNameText} numberOfLines={1}>
                  {roomTitle}
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.helpIconBtn}
                >
                  <MaterialCommunityIcons name="help-circle-outline" size={19} color="#F59E0B" />
                </TouchableOpacity>
              </View>
              <Text style={styles.membersCountText}>Members: {membersCount}</Text>
            </View>

            {/* Right: Members icon with chevron */}
            <TouchableOpacity
              style={styles.rightMembersTouch}
              onPress={() => {
                onClose();
                onOpenMembers && onOpenMembers();
              }}
              activeOpacity={0.75}
            >
              <View style={styles.smallMemberAvatarCircle}>
                <MaterialCommunityIcons name="account" size={18} color="#FFF" />
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#CBD5E1" />
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Section: Member Privilege */}
          <Text style={styles.sectionTitle}>Member Privilege</Text>

          {/* Privilege Card 1: Own Member Logo (Red to peach gradient) */}
          <LinearGradient
            colors={['#FB7185', '#FDA4AF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.privilegeCard}
          >
            <Text style={styles.privilegeText}>Own Member Logo</Text>
            <View style={styles.privilegeIconWrap}>
              <MaterialCommunityIcons name="medal-outline" size={32} color="#FFF" />
            </View>
          </LinearGradient>

          {/* Privilege Card 2: Take mic freely (Purple to magenta gradient) */}
          <LinearGradient
            colors={['#A855F7', '#E879F9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.privilegeCard}
          >
            <Text style={styles.privilegeText}>Take mic freely</Text>
            <View style={styles.privilegeIconWrap}>
              <MaterialCommunityIcons name="microphone-variant" size={32} color="#FFF" />
            </View>
          </LinearGradient>

          {/* Privilege Card 3: Have more followers (Blue to sky gradient) */}
          <LinearGradient
            colors={['#3B82F6', '#93C5FD']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.privilegeCard}
          >
            <Text style={styles.privilegeText}>Have more followers</Text>
            <View style={styles.privilegeIconWrap}>
              <MaterialCommunityIcons name="account-heart" size={32} color="#FFF" />
            </View>
          </LinearGradient>
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
    paddingHorizontal: 20,
    paddingTop: 18,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
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
    paddingVertical: 10,
    paddingRight: 36,
  },
  groupAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FED7AA',
  },
  groupHeaderInfo: {
    flex: 1,
    marginLeft: 14,
  },
  groupNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupNameText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
    maxWidth: '82%',
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
  rightMembersTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  smallMemberAvatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
  },
  privilegeCard: {
    height: 72,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  privilegeText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  privilegeIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
