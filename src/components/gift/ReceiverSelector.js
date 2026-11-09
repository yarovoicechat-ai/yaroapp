import React from 'react';
import { roomGiftRecipients } from '../../utils/giftRecipients';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function ReceiverSelector({
  room = {},
  user = {},
  seats = [],
  selectedReceivers = [],
  onSelectReceiver,
  isMultiSelectMode = false,
  onToggleMultiSelect,
}) {
  const isSelected = (id) => {
    if (!id || id === 'all') return false;
    return selectedReceivers.some(
      (r) => !r.isAll && r.id !== 'all' && (String(r.id) === String(id) || String(r.userId) === String(id))
    );
  };

  const isAllSelected = selectedReceivers.some((r) => r.isAll || r.id === 'all');

  const handleSelect = (receiver) => {
    onSelectReceiver(receiver);
  };

  const recipients = roomGiftRecipients(room, seats, user);

  const allOption = {
    id: 'all',
    name: 'All',
    isAll: true,
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onToggleMultiSelect} accessibilityRole="button"
        accessibilityLabel="Select multiple gift recipients" accessibilityState={{ selected: isMultiSelectMode }}
        style={{ alignSelf: 'flex-end', padding: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <MaterialCommunityIcons name={isMultiSelectMode ? 'checkbox-marked' : 'checkbox-blank-outline'} size={20} color="#FBBF24" />
        <Text style={{ color: '#FBBF24', fontWeight: '600' }}>Select multiple</Text>
      </TouchableOpacity>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.receiversScroll}
      >
        {recipients.map((receiverObj) => {
            const active = isSelected(receiverObj.id) || isAllSelected;

            return (
              <TouchableOpacity
                key={`seat-${receiverObj.id}`}
                style={styles.recipientBtn}
                onPress={() => handleSelect(receiverObj)}
                activeOpacity={0.8}
              >
                <View style={[styles.avatarRing, active && styles.avatarRingSelected]}>
                  <Image source={{ uri: receiverObj.avatar }} style={styles.avatarImage} />
                  <View style={styles.seatBadge}>
                    <Text style={styles.seatBadgeText}>{receiverObj.seatNumber}</Text>
                  </View>
                </View>
                <Text style={[styles.nameText, active && styles.nameTextSelected]} numberOfLines={1}>
                  {receiverObj.name}
                </Text>
              </TouchableOpacity>
            );
          })}

        {/* "All" Button at end */}
        <TouchableOpacity
          style={styles.recipientBtn}
          onPress={() => handleSelect(allOption)}
          activeOpacity={0.8}
        >
          <View style={[styles.avatarRing, isAllSelected && styles.avatarRingSelected, styles.allRing]}>
            <View style={styles.allCircleInner}>
              <MaterialCommunityIcons name="account-group" size={18} color={isAllSelected ? '#FBBF24' : '#94A3B8'} />
            </View>
          </View>
          <Text style={[styles.nameText, isAllSelected && styles.nameTextSelected]}>All</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingTop: 2,
    paddingBottom: 4,
  },
  receiversScroll: {
    gap: 12,
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  recipientBtn: {
    alignItems: 'center',
    width: 48,
  },
  avatarRing: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarRingSelected: {
    borderColor: '#FACC15',
    shadowColor: '#FACC15',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E293B',
  },
  seatBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#3B82F6',
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#0F172A',
  },
  seatBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },
  allRing: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
  },
  allCircleInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameText: {
    color: '#94A3B8',
    fontSize: 9.5,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
  nameTextSelected: {
    color: '#FACC15',
    fontWeight: '800',
  },
});
