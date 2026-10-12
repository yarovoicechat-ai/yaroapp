import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AlertService } from '../../utils/AlertService';
import RoomMembersListModal from './RoomMembersListModal';

export default function RoomDetailsModal({
  visible,
  onClose,
  room,
  members = [],
  onFollow,
  onJoin,
  onSelectMember,
  bottomSafePadding = 16,
}) {
  const [membersModalVisible, setMembersModalVisible] = useState(false);

  if (!room && !visible) return null;

  const roomTitle = room?.title || room?.roomName || 'Voice Room';
  const roomId = room?.id || room?.roomId || '—';
  const roomCover = room?.coverImage || room?.avatar || '';
  const roomTopic = room?.tag || room?.category || '';
  const roomAbout = room?.about || room?.description || 'No room description.';

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

        <View style={[styles.sheetContainer, { paddingBottom: bottomSafePadding + 16 }]}>
          <View style={styles.sheetHandle} />

          <View style={styles.headerRow}>
            {roomCover ? (
              <Image source={{ uri: roomCover }} style={styles.roomCover} />
            ) : (
              <View style={[styles.roomCover, styles.roomCoverPlaceholder]}>
                <MaterialCommunityIcons name="account-group" size={24} color="#C4B5FD" />
              </View>
            )}
            <View style={styles.headerInfo}>
              <Text style={styles.roomTitleText} numberOfLines={1}>{roomTitle}</Text>
              <Text style={styles.roomIdText}>ID: {roomId}</Text>
              {!!roomTopic && <View style={styles.tagPill}>
                <Text style={styles.tagText}>{roomTopic}</Text>
              </View>}
            </View>
          </View>

          <View style={styles.aboutCard}>
            <Text style={styles.aboutLabel}>About Room</Text>
            <Text style={styles.aboutText}>{roomAbout}</Text>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => {
                onClose();
                onFollow && onFollow();
              }}
            >
              <Icon name="heart-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.actionBtnText}>Follow</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.joinBtn]}
              onPress={() => {
                onClose();
                onJoin && onJoin();
              }}
            >
              <MaterialCommunityIcons name="broadcast" size={18} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.actionBtnText}>Join Community</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <RoomMembersListModal
        visible={membersModalVisible}
        onClose={() => setMembersModalVisible(false)}
        members={members}
        onSelectMember={onSelectMember}
        bottomSafePadding={bottomSafePadding}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    width: '100%',
    backgroundColor: '#121424',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#334155',
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  roomCover: {
    width: 64,
    height: 64,
    borderRadius: 16,
    marginRight: 14,
    borderWidth: 2,
    borderColor: '#7C3AED',
  },
  roomCoverPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#312E81',
  },
  headerInfo: {
    flex: 1,
  },
  roomTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 4,
  },
  roomIdText: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 6,
  },
  tagPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A78BFA',
  },
  aboutCard: {
    backgroundColor: '#1E2338',
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
  },
  aboutLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 6,
  },
  aboutText: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  actionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinBtn: {
    backgroundColor: '#7C3AED',
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
});
