import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import RoomCoverPicker from './RoomCoverPicker';

export default function RoomSettingsModal({
  visible,
  onClose,
  onSave,
  isSaving,
  bottomSafePadding,
  styles,
  user,
  editRoomCover,
  setEditRoomCover,
  setPendingRoomCoverUpload,
  editRoomName,
  setEditRoomName,
  editRoomAbout,
  setEditRoomAbout,
  editSeatCount,
  setEditSeatCount,
  editRoomLocked,
  setEditRoomLocked,
  hasRoomPin,
  editRoomPin,
  setEditRoomPin,
}) {
  return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => onClose()}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => onClose()}
          />
          <View style={[styles.roomSettingsSheet, { paddingBottom: bottomSafePadding + 10 }]}>
            <View style={styles.sheetHandle} />

            <View style={styles.settingsHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialIcons name="tune" size={22} color="#8B5CF6" />
                <Text style={styles.settingsSheetTitle}>Room Settings</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <TouchableOpacity
                  style={styles.headerSavePillBtn}
                  onPress={onSave}
                  activeOpacity={0.8}
                  disabled={isSaving}
                >
                  <LinearGradient
                    colors={['#8B5CF6', '#EC4899']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.headerSavePillGradient}
                  >
                    <Icon name="checkmark" size={14} color="#FFF" />
                    <Text style={styles.headerSavePillText}>{isSaving ? 'Saving…' : 'Save'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onClose()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Icon name="close" size={22} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: '70%' }}>
              {/* 1. Room Cover / Avatar Manual Upload */}
              <Text style={styles.settingsSectionTitle}>Room Avatar / Cover</Text>
              <RoomCoverPicker
                imageUri={editRoomCover}
                fallbackUri={user?.avatar || 'https://api.yaroapp.in/uploads/avatars/female_default.webp'}
                styles={styles}
                onImageSelected={(image) => {
                  setEditRoomCover(image.uri);
                  setPendingRoomCoverUpload(image);
                }}
                onError={(error, source) => console.log(source === 'gallery' ? 'Upload error' : 'Camera error', error)}
              />
              {/* 2. Room Name Input */}
              <View style={styles.settingsInputGroup}>
                <View style={styles.settingsLabelRow}>
                  <Text style={styles.settingsInputLabel}>Room Name</Text>
                  <Text style={styles.settingsCharCount}>{editRoomName.length}/30</Text>
                </View>
                <TextInput
                  style={styles.settingsTextInput}
                  value={editRoomName}
                  onChangeText={setEditRoomName}
                  maxLength={30}
                  placeholder="Enter a catchy room name..."
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* 3. Room Bio / Announcement Input */}
              <View style={styles.settingsInputGroup}>
                <View style={styles.settingsLabelRow}>
                  <Text style={styles.settingsInputLabel}>Room Announcement / Bio</Text>
                  <Text style={styles.settingsCharCount}>{editRoomAbout.length}/120</Text>
                </View>
                <TextInput
                  style={[styles.settingsTextInput, { height: 75, textAlignVertical: 'top' }]}
                  value={editRoomAbout}
                  onChangeText={setEditRoomAbout}
                  maxLength={120}
                  multiline
                  numberOfLines={3}
                  placeholder="Tell listeners what this room is about..."
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* 4. Seat Layout / Count */}
              <View style={styles.settingsInputGroup}>
                <Text style={styles.settingsInputLabel}>Seat Layout (Top: 2 Seats Host & Co-Host)</Text>
                <View style={styles.seatOptionsRow}>
                  {[
                    { count: 8, label: '8 Below (4+4)' },
                    { count: 10, label: '10 Below (5+5)' },
                    { count: 15, label: '15 Below (5+5+5)' },
                  ].map((item) => {
                    const isSelected = editSeatCount === item.count;
                    return (
                      <TouchableOpacity
                        key={item.count}
                        onPress={() => setEditSeatCount(item.count)}
                        activeOpacity={0.8}
                        style={[styles.seatOptionChip, isSelected && styles.seatOptionChipActive]}
                      >
                        <Text style={[styles.seatOptionText, isSelected && styles.seatOptionTextActive]}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* 5. Room Security & Lock PIN */}
              <View style={styles.settingsInputGroup}>
                <Text style={styles.settingsInputLabel}>Room Lock & Privacy</Text>
                <View style={styles.lockToggleRow}>
                  <TouchableOpacity
                    style={[styles.lockChoiceCard, !editRoomLocked && styles.lockChoiceCardActive]}
                    onPress={() => setEditRoomLocked(false)}
                    activeOpacity={0.8}
                  >
                    <Icon name="lock-open-outline" size={20} color={!editRoomLocked ? '#10B981' : '#64748B'} />
                    <Text style={[styles.lockChoiceTitle, !editRoomLocked && { color: '#10B981' }]}>Public Room</Text>
                    <Text style={styles.lockChoiceSub}>Anyone can join</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.lockChoiceCard, editRoomLocked && styles.lockChoiceCardActive]}
                    onPress={() => setEditRoomLocked(true)}
                    activeOpacity={0.8}
                  >
                    <Icon name="lock-closed-outline" size={20} color={editRoomLocked ? '#EF4444' : '#64748B'} />
                    <Text style={[styles.lockChoiceTitle, editRoomLocked && { color: '#EF4444' }]}>PIN Protected</Text>
                    <Text style={styles.lockChoiceSub}>Passcode needed</Text>
                  </TouchableOpacity>
                </View>

                {editRoomLocked && (
                  <View style={styles.pinInputContainer}>
                    <Text style={styles.pinInputHint}>
                      {hasRoomPin ? 'PIN saved hai. Naya PIN set karne ke liye 4 digits enter karein:' : 'Set 4-Digit Passcode PIN:'}
                    </Text>
                    <TextInput
                      style={styles.pinTextInput}
                      value={editRoomPin}
                      onChangeText={(val) => setEditRoomPin(val.replace(/[^0-9]/g, '').slice(0, 4))}
                      keyboardType="numeric"
                      maxLength={4}
                      placeholder={hasRoomPin ? 'Leave blank to keep saved PIN' : 'e.g. 1234'}
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                )}
              </View>
            </ScrollView>

            {/* STICKY FIXED SAVE BUTTON AT BOTTOM - ALWAYS VISIBLE */}
            <View style={styles.fixedSettingsFooter}>
              <TouchableOpacity
                style={styles.saveSettingsSubmitBtn}
                onPress={onSave}
                activeOpacity={0.85}
                disabled={isSaving}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#EC4899']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveSettingsSubmitGradient}
                >
                  <MaterialIcons name="done-all" size={20} color="#FFF" style={{ marginRight: 6 }} />
                  <Text style={styles.saveSettingsSubmitText}>Save & Apply Settings / सहेजें</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
  );
}
