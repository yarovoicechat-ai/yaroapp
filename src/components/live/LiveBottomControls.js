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
  onOpenPromo,
  onPressHeart,
  onOpenTools,
  likeCount = 9,
  bottomPadding = 12,
}) {
  return (
    <View style={[styles.container, { paddingBottom: bottomPadding }]}>
      {/* 1. Quick Chat Pill (Hi there) */}
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
          <Text style={styles.chatText}>Hi there</Text>
        </LinearGradient>
      </TouchableOpacity>

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

      {/* 4. 90% OFF Promo Offer Badge */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onOpenPromo}
        style={styles.promoBadge}
      >
        <LinearGradient
          colors={['#F43F5E', '#E11D48']}
          style={styles.promoGradient}
        >
          <Text style={styles.promoTextTop}>90%</Text>
          <Text style={styles.promoTextSub}>OFF</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* 5. Heart / Like Button with Counter */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPressHeart}
        style={styles.heartCircle}
      >
        <MaterialCommunityIcons name="heart" size={26} color="#FB7185" />
        {likeCount > 0 && (
          <View style={styles.likeCounter}>
            <Text style={styles.likeCountText}>{likeCount > 99 ? '99+' : likeCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* 6. Tools / Menu Button */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onOpenTools}
        style={styles.iconCircle}
      >
        <MaterialCommunityIcons name="gamepad-variant" size={22} color="#A78BFA" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 8,
    zIndex: 20,
  },
  chatPill: {
    borderRadius: 20,
    overflow: 'hidden',
    minWidth: 92,
  },
  chatGradient: {
    paddingHorizontal: 16,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  giftCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
  promoBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#FEF08A',
  },
  promoGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  promoTextTop: {
    color: '#FEF08A',
    fontSize: 9,
    fontWeight: '900',
    lineHeight: 10,
  },
  promoTextSub: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '800',
    lineHeight: 9,
  },
  heartCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    position: 'relative',
  },
  likeCounter: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#E11D48',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  likeCountText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '900',
  },
});

