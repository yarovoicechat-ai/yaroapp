import React from 'react';
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import RoomCoverPicker from '../room/RoomCoverPicker';

export default function CreateRoomModal({
  visible,
  onClose,
  bottomTabBarPadding,
  styles,
  user,
  roomTitleInput,
  setRoomTitleInput,
  roomAboutInput,
  setRoomAboutInput,
  selectedCover,
  setSelectedCover,
  selectedSeatCount,
  setSelectedSeatCount,
  selectedCategory,
  setSelectedCategory,
  roomMode,
  setRoomMode,
  seatOptions,
  categoryTags,
  onCreateRoom,
  onCoverSelected,
  onCoverError,
}) {
  return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => onClose()}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { paddingBottom: bottomTabBarPadding + 20 }]}>
            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalTitleBadge}>
                <MaterialCommunityIcons name="broadcast" size={20} color="#EC4899" />
                <Text style={styles.modalSheetTitle}>Start Your Voice Room</Text>
              </View>
              <TouchableOpacity onPress={() => onClose()} style={styles.closeModalBtn}>
                <Icon name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Room Name */}
              <Text style={styles.inputFieldLabel}>Room Name *</Text>
              <TextInput
                style={styles.textInputField}
                placeholder="Give your room a catchy title..."
                placeholderTextColor="#94A3B8"
                value={roomTitleInput}
                onChangeText={setRoomTitleInput}
              />

              {/* Room About / Topic */}
              <Text style={styles.inputFieldLabel}>Room Announcement / About</Text>
              <TextInput
                style={[styles.textInputField, { height: 60, textAlignVertical: 'top' }]}
                placeholder="What's this room about? (e.g. Hindi songs, chill chit-chat)"
                placeholderTextColor="#94A3B8"
                multiline
                value={roomAboutInput}
                onChangeText={setRoomAboutInput}
              />

              {/* Cover Image Manual Upload */}
              <Text style={styles.inputFieldLabel}>Room Cover Photo</Text>
              <RoomCoverPicker
                imageUri={selectedCover}
                fallbackUri={user?.avatar || 'https://api.yaroapp.in/uploads/avatars/female_default.webp'}
                title="Custom Cover Photo"
                subtitle="Pick from gallery or capture with camera"
                styles={styles}
                onImageSelected={(image, source) => {
                  setSelectedCover(image.uri);
                  onCoverSelected?.(image, source);
                }}
                onError={onCoverError}
              />
              {/* Number of Seats Selector */}
              <Text style={styles.inputFieldLabel}>Number of Speaker Seats</Text>
              <View style={styles.chipsRow}>
                {seatOptions.map((count) => {
                  const isSelected = selectedSeatCount === count;
                  return (
                    <TouchableOpacity
                      key={count}
                      onPress={() => setSelectedSeatCount(count)}
                      style={[styles.seatChip, isSelected && styles.seatChipActive]}
                      activeOpacity={0.75}
                    >
                      <MaterialCommunityIcons
                        name="seat-recline-normal"
                        size={16}
                        color={isSelected ? '#7C3AED' : '#64748B'}
                      />
                      <Text style={[styles.seatChipText, isSelected && styles.seatChipTextActive]}>
                        {count} Seats
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Room Category Tag */}
              <Text style={styles.inputFieldLabel}>Room Category Tag</Text>
              <View style={styles.chipsRow}>
                {categoryTags.map((tag) => {
                  const isSelected = selectedCategory === tag;
                  return (
                    <TouchableOpacity
                      key={tag}
                      onPress={() => setSelectedCategory(tag)}
                      style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}>
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Room Privacy / Mode */}
              <Text style={styles.inputFieldLabel}>Room Access Mode</Text>
              <View style={styles.chipsRow}>
                {['Public', 'Friends Only', 'VIP'].map((mode) => {
                  const isSelected = roomMode === mode;
                  return (
                    <TouchableOpacity
                      key={mode}
                      onPress={() => setRoomMode(mode)}
                      style={[styles.seatChip, isSelected && styles.seatChipActive]}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.seatChipText, isSelected && styles.seatChipTextActive]}>
                        {mode === 'Public' ? '🌐 Public' : mode === 'Friends Only' ? '👥 Friends' : '🔒 VIP'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Go Live Submit Button */}
              <TouchableOpacity
                style={styles.submitGoLiveBtn}
                onPress={onCreateRoom}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#EC4899', '#8B5CF6', '#6366F1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitGoLiveGradient}
                >
                  <MaterialCommunityIcons name="broadcast" size={20} color="#FFF" style={{ marginRight: 6 }} />
                  <Text style={styles.submitGoLiveText}>Launch Room (Go Live Now)</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
  );
}
