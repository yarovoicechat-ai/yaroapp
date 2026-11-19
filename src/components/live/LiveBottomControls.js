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
  onOpenTools,
  onOpenGames,
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
        {/* Menu Column with Game Button directly above */}
        <View style={styles.menuColumn}>
          {onOpenGames && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onOpenGames}
              style={styles.gameIconAboveMenu}
              accessibilityLabel="Games"
            >
              <LinearGradient
                colors={['#FF6B00', '#FF1493', '#7928CA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gameGradientBadge}
              >
                <MaterialCommunityIcons name="gamepad-variant" size={20} color="#FFF" />
              </LinearGradient>
              <View style={styles.gamePillTag}>
                <Text style={styles.gamePillText}>GAME</Text>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity accessibilityLabel="Live menu" onPress={onOpenTools} style={styles.iconCircle}>
            <MaterialCommunityIcons name="dots-horizontal" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

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
  menuColumn: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 98,
    marginTop: -54,
  },
  gameIconAboveMenu: {
    alignItems: 'center',
    marginBottom: 6,
    zIndex: 25,
  },
  gameGradientBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF1493',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  gamePillTag: {
    position: 'absolute',
    bottom: -6,
    backgroundColor: '#FF1493',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  gamePillText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '900',
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

