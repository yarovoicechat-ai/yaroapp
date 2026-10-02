import React from 'react';
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
  seats = [],
  selectedReceivers = [],
  onSelectReceiver,
  isMultiSelectMode = false,
}) {
  const isSelected = (id) => {
    return selectedReceivers.some((r) => String(r.id) === String(id) || String(r.userId) === String(id));
  };

  const isAllSelected = selectedReceivers.some((r) => r.isAll || r.id === 'all');

  const handleSelect = (receiver) => {
    onSelectReceiver(receiver);
  };

  const hostUser = {
    id: room.hostId || room.ownerId || 'host',
    userId: room.hostId || room.ownerId || 'host',
    name: room.hostName || 'Host',
    avatar:
      room.hostAvatar ||
      room.coverImage ||
      'https://api.yaroapp.in/uploads/avatars/female_default.webp',
    isHost: true,
    seatNumber: '1',
  };

  const allOption = {
    id: 'all',
    name: 'All',
    isAll: true,
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.receiversScroll}
      >
        {/* Host Avatar */}
        <TouchableOpacity
          style={styles.recipientBtn}
          onPress={() => handleSelect(hostUser)}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.avatarRing,
              (isSelected(hostUser.id) || isAllSelected) && styles.avatarRingSelected,
            ]}
          >
            <Image source={{ uri: hostUser.avatar }} style={styles.avatarImage} />
            <View style={styles.seatBadge}>
              <Text style={styles.seatBadgeText}>1</Text>
            </View>
          </View>
          <Text
            style={[
              styles.nameText,
              (isSelected(hostUser.id) || isAllSelected) && styles.nameTextSelected,
            ]}
            numberOfLines={1}
          >
            {hostUser.name}
          </Text>
        </TouchableOpacity>

        {/* Seated Speakers */}
        {seats
          .filter((s) => s.user)
          .map((s, idx) => {
            const receiverObj = {
              id: s.user.id || s.user._id || s.user.userId,
              userId: s.user.userId,
              name: s.user.name || `User ${idx + 2}`,
              avatar: s.user.avatar || s.user.image || 'https://api.yaroapp.in/uploads/avatars/female_default.webp',
              seatIndex: s.seatIndex,
              seatNumber: String(s.seatIndex + 1),
            };
            const active = isSelected(receiverObj.id) || isAllSelected;

            return (
              <TouchableOpacity
                key={`seat-${s.seatIndex}-${receiverObj.id}`}
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
