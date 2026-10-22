import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function RoomSeatActionModal({
  visible,
  onClose,
  selectedSeat,
  seats,
  toggleSeatLock,
  lockAllSeats,
  unlockAllSeats,
  takeSeat,
  applyLiveSeat,
  user,
  isModerator = true,
  setOnlineUsersModalVisible,
  bottomSafePadding,
  styles,
}) {
  return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          onClose();
        }}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => {
            onClose();
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.emptySeatActionSheet, { paddingBottom: bottomSafePadding + 16 }]}
          >
            <View style={styles.sheetHandle} />

            <View style={styles.emptySeatActionRow}>
              {!isModerator ? (
                <>
                  <TouchableOpacity
                    style={styles.emptySeatActionItem}
                    onPress={() => {
                      if (selectedSeat) takeSeat(selectedSeat.seatIndex, user);
                      onClose();
                    }}
                    activeOpacity={0.75}
                  >
                    <View style={styles.emptySeatIconCircle}>
                      <MaterialCommunityIcons name="microphone" size={26} color="#334155" />
                    </View>
                    <Text style={styles.emptySeatActionLabel}>Free Seat</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.emptySeatActionItem}
                    onPress={() => {
                      if (selectedSeat) applyLiveSeat(selectedSeat.seatIndex, user);
                      onClose();
                    }}
                    activeOpacity={0.75}
                  >
                    <View style={styles.emptySeatIconCircle}>
                      <MaterialCommunityIcons name="account-clock-outline" size={26} color="#334155" />
                    </View>
                    <Text style={styles.emptySeatActionLabel}>Apply Seat</Text>
                  </TouchableOpacity>
                </>
              ) : (
              <>
              {/* Option 1: Lock / Unlock */}
              <TouchableOpacity
                style={styles.emptySeatActionItem}
                onPress={() => {
                  if (selectedSeat) {
                    toggleSeatLock(selectedSeat.seatIndex);
                  }
                  onClose();
                }}
                activeOpacity={0.75}
              >
                <View style={styles.emptySeatIconCircle}>
                  <MaterialCommunityIcons
                    name={selectedSeat?.isLocked ? 'lock-open-variant' : 'lock'}
                    size={26}
                    color="#334155"
                  />
                </View>
                <Text style={styles.emptySeatActionLabel}>
                  {selectedSeat?.isLocked ? 'Unlock' : 'Lock'}
                </Text>
              </TouchableOpacity>

              {/* Option 2: Lock All / Unlock All */}
              <TouchableOpacity
                style={styles.emptySeatActionItem}
                onPress={() => {
                  const guestSeats = seats.filter((s) => s.seatIndex > 0);
                  const allLocked = guestSeats.length > 0 && guestSeats.every((s) => s.isLocked);
                  if (allLocked) {
                    unlockAllSeats();
                  } else {
                    lockAllSeats();
                  }
                  onClose();
                }}
                activeOpacity={0.75}
              >
                <View style={styles.emptySeatIconCircle}>
                  <MaterialCommunityIcons
                    name={
                      seats.filter((s) => s.seatIndex > 0).every((s) => s.isLocked)
                        ? 'lock-open-variant-outline'
                        : 'lock-outline'
                    }
                    size={26}
                    color="#334155"
                  />
                </View>
                <Text style={styles.emptySeatActionLabel}>
                  {seats.filter((s) => s.seatIndex > 0).every((s) => s.isLocked)
                    ? 'Unlock All'
                    : 'Lock All'}
                </Text>
              </TouchableOpacity>

              {/* Option 3: On mic */}
              <TouchableOpacity
                style={styles.emptySeatActionItem}
                onPress={() => {
                  if (selectedSeat) {
                    takeSeat(selectedSeat.seatIndex, user);
                  }
                  onClose();
                }}
                activeOpacity={0.75}
              >
                <View style={styles.emptySeatIconCircle}>
                  <MaterialCommunityIcons name="microphone" size={26} color="#334155" />
                </View>
                <Text style={styles.emptySeatActionLabel}>On mic</Text>
              </TouchableOpacity>

              {/* Option 4: Invite */}
              <TouchableOpacity
                style={styles.emptySeatActionItem}
                onPress={() => {
                  onClose();
                  setOnlineUsersModalVisible(true);
                }}
                activeOpacity={0.75}
              >
                <View style={styles.emptySeatIconCircle}>
                  <MaterialCommunityIcons name="account-plus-outline" size={26} color="#334155" />
                </View>
                <Text style={styles.emptySeatActionLabel}>Invite</Text>
              </TouchableOpacity>
              </>
              )}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>


  );
}
