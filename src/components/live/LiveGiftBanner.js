import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function LiveGiftBanner({ banner }) {
  const translateX = useRef(new Animated.Value(350)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!banner) return;
    translateX.setValue(350);
    opacity.setValue(0);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(3500),
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -350,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [banner]);

  if (!banner) return null;

  const sender = banner.senderName || 'VIP Supporter';
  const receiver = banner.receiverName || 'Broadcaster';
  const giftName = banner.giftName || 'Luxury Gift';

  return (
    <Animated.View
      style={[
        styles.bannerContainer,
        {
          transform: [{ translateX }],
          opacity,
        },
      ]}
      pointerEvents="none"
    >
      <LinearGradient
        colors={['rgba(245, 158, 11, 0.92)', 'rgba(236, 72, 153, 0.9)', 'rgba(139, 92, 246, 0.92)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <View style={styles.crownWrap}>
          <MaterialCommunityIcons name="crown" size={16} color="#FFF" />
        </View>

        <View style={styles.vipTag}>
          <Text style={styles.vipTagText}>VIP</Text>
        </View>

        <Text style={styles.senderText} numberOfLines={1}>
          {sender}
        </Text>

        <Text style={styles.actionText}> sent </Text>

        <View style={styles.giftPill}>
          <Text style={styles.giftEmoji}>🎁</Text>
          <Text style={styles.giftName} numberOfLines={1}>
            {giftName}
          </Text>
        </View>

        <Text style={styles.actionText}> to </Text>

        <Text style={styles.receiverText} numberOfLines={1}>
          {receiver}
        </Text>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    position: 'absolute',
    top: 75,
    left: 14,
    right: 14,
    zIndex: 30,
    alignItems: 'center',
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    elevation: 8,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  crownWrap: {
    marginRight: 4,
  },
  vipTag: {
    backgroundColor: '#DC2626',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginRight: 4,
  },
  vipTagText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
  },
  senderText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 11,
    maxWidth: 90,
  },
  actionText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 10,
    fontWeight: '600',
  },
  giftPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  giftEmoji: {
    fontSize: 11,
    marginRight: 2,
  },
  giftName: {
    color: '#FEF08A',
    fontWeight: '800',
    fontSize: 10,
    maxWidth: 80,
  },
  receiverText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 11,
    maxWidth: 90,
  },
});
