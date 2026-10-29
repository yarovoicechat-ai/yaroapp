import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function RoomSeatActionModal({
  visible,
  onClose,
  selectedSeat,
  seats = [],
  toggleSeatLock,
  lockAllSeats,
  unlockAllSeats,
  takeSeat,
  user,
  setOnlineUsersModalVisible,
  bottomSafePadding = 16,
  styles = {},
}) {
  const safeSeats = Array.isArray(seats) ? seats : [];
  const guestSeats = safeSeats.filter((s) => s?.seatIndex > 0);
  const allLocked = guestSeats.length > 0 && guestSeats.every((s) => s?.isLocked);

  return (
    <Modal
      visible={Boolean(visible)}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalBackdrop || { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={[
            styles.emptySeatActionSheet || {
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingTop: 12,
              paddingHorizontal: 16,
            },
            { paddingBottom: bottomSafePadding + 16 },
          ]}
        >
          <View style={styles.sheetHandle || { width: 40, height: 4, borderRadius: 2, backgroundColor: '#CBD5E1', alignSelf: 'center', marginBottom: 16 }} />

          <View style={styles.emptySeatActionRow || { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
            {/* Option 1: Lock / Unlock */}
            <TouchableOpacity
              style={styles.emptySeatActionItem || { alignItems: 'center', minWidth: 64 }}
              onPress={() => {
                if (selectedSeat && typeof toggleSeatLock === 'function') {
                  toggleSeatLock(selectedSeat.seatIndex);
                }
                onClose?.();
              }}
              activeOpacity={0.75}
            >
              <View style={styles.emptySeatIconCircle || { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginBottom: 6 }}>
                <MaterialCommunityIcons
                  name={selectedSeat?.isLocked ? 'lock-open-variant' : 'lock'}
                  size={26}
                  color="#334155"
                />
              </View>
              <Text style={styles.emptySeatActionLabel || { fontSize: 12, color: '#334155', fontWeight: '600' }}>
                {selectedSeat?.isLocked ? 'Unlock' : 'Lock'}
              </Text>
            </TouchableOpacity>

            {/* Option 2: Lock All / Unlock All */}
            <TouchableOpacity
              style={styles.emptySeatActionItem || { alignItems: 'center', minWidth: 64 }}
              onPress={() => {
                if (allLocked) {
                  unlockAllSeats?.();
                } else {
                  lockAllSeats?.();
                }
                onClose?.();
              }}
              activeOpacity={0.75}
            >
              <View style={styles.emptySeatIconCircle || { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginBottom: 6 }}>
                <MaterialCommunityIcons
                  name={allLocked ? 'lock-open-variant-outline' : 'lock-outline'}
                  size={26}
                  color="#334155"
                />
              </View>
              <Text style={styles.emptySeatActionLabel || { fontSize: 12, color: '#334155', fontWeight: '600' }}>
                {allLocked ? 'Unlock All' : 'Lock All'}
              </Text>
            </TouchableOpacity>

            {/* Option 3: On mic */}
            <TouchableOpacity
              style={styles.emptySeatActionItem || { alignItems: 'center', minWidth: 64 }}
              onPress={() => {
                if (selectedSeat && typeof takeSeat === 'function') {
                  takeSeat(selectedSeat.seatIndex, user);
                }
                onClose?.();
              }}
              activeOpacity={0.75}
            >
              <View style={styles.emptySeatIconCircle || { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginBottom: 6 }}>
                <MaterialCommunityIcons name="microphone" size={26} color="#334155" />
              </View>
              <Text style={styles.emptySeatActionLabel || { fontSize: 12, color: '#334155', fontWeight: '600' }}>
                On mic
              </Text>
            </TouchableOpacity>

            {/* Option 4: Invite */}
            <TouchableOpacity
              style={styles.emptySeatActionItem || { alignItems: 'center', minWidth: 64 }}
              onPress={() => {
                onClose?.();
                setOnlineUsersModalVisible?.(true);
              }}
              activeOpacity={0.75}
            >
              <View style={styles.emptySeatIconCircle || { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginBottom: 6 }}>
                <MaterialCommunityIcons name="account-plus-outline" size={26} color="#334155" />
              </View>
              <Text style={styles.emptySeatActionLabel || { fontSize: 12, color: '#334155', fontWeight: '600' }}>
                Invite
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
