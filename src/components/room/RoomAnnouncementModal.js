import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function RoomAnnouncementModal({
  visible,
  onClose,
  announcement,
  onChangeAnnouncement,
  onSave,
  saving,
  styles,
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.announcementModalOverlay}>
        <View style={styles.announcementModalCard}>
          <View style={styles.announcementModalHeader}>
            <MaterialCommunityIcons name="bullhorn-outline" size={22} color="#F59E0B" />
            <Text style={styles.announcementModalTitle}>Edit Announcement</Text>
          </View>
          <TextInput
            style={styles.announcementTextInput}
            value={announcement}
            onChangeText={onChangeAnnouncement}
            placeholder="Enter room announcement..."
            placeholderTextColor="#94A3B8"
            multiline
            maxLength={120}
          />
          <View style={styles.announcementModalButtonsRow}>
            <TouchableOpacity style={styles.announcementCancelBtn} onPress={onClose}>
              <Text style={styles.announcementCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.announcementSaveBtn} onPress={onSave} disabled={saving}>
              <Text style={styles.announcementSaveText}>{saving ? 'Saving…' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
