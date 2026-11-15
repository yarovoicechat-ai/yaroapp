import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function LiveBottomControls({
  onOpenChat,
  onOpenPK,
  onOpenGift,
  bottomPadding = 12,
}) {
  return (
    <View style={[styles.container, { paddingBottom: bottomPadding }]}>
      {/* 1. Quick Chat Pill */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onOpenChat}
        style={styles.chatPill}
      >
        <LinearGradient
          colors={['#EC4899', '#DB2777']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.chatGradient}
        >
          <Text style={styles.chatText}>Say something</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Right Controls Row */}
      <View style={styles.rightButtonsRow}>
        {/* 2. Link / PK Mic Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onOpenPK}
          style={styles.iconCircle}
        >
          <MaterialCommunityIcons name="link-variant" size={22} color="#FFF" />
        </TouchableOpacity>

        {/* 3. Gift Box Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onOpenGift}
          style={styles.giftCircle}
        >
          <LinearGradient
            colors={['#C084FC', '#A855F7', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.giftGradient}
          >
            <MaterialCommunityIcons name="gift" size={24} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 8,
    zIndex: 20,
  },
  rightButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chatPill: {
    borderRadius: 20,
    overflow: 'hidden',
    minWidth: 120,
  },
  chatGradient: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 13,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  giftCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#EC4899',
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  giftGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

