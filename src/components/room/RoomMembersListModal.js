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
import Icon from 'react-native-vector-icons/Ionicons';

export default function RoomMembersListModal({
  visible,
  onClose,
  members = [],
  onSelectMember,
  bottomSafePadding = 16,
}) {
  if (!visible) return null;

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
          <Text style={styles.sheetTitle}>Room Members</Text>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {members.map((m, idx) => (
              <TouchableOpacity
                key={m.id || idx}
                style={styles.row}
                onPress={() => {
                  onClose();
                  onSelectMember && onSelectMember(m);
                }}
              >
                <Image
                  source={{ uri: typeof m === 'string' ? m : (m.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120') }}
                  style={styles.avatar}
                />
                <Text style={styles.name}>{typeof m === 'string' ? `Member ${idx + 1}` : (m.name || 'User')}</Text>
              </TouchableOpacity>
            ))}
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
  sheetContainer: {
    width: '100%',
    backgroundColor: '#121424',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 16,
    maxHeight: 460,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#334155',
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 14,
  },
  list: {
    maxHeight: 360,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
});
