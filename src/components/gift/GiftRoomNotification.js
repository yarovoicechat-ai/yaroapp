import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');
const DEFAULT_AVATAR = 'https://api.yaroapp.in/uploads/avatars/female_default.webp';
const FLOW_COLORS = [
  ['rgba(236,72,153,0.96)', 'rgba(147,51,234,0.94)'],
  ['rgba(168,85,247,0.96)', 'rgba(79,70,229,0.94)'],
  ['rgba(14,165,233,0.96)', 'rgba(37,99,235,0.94)'],
  ['rgba(244,63,94,0.96)', 'rgba(190,24,93,0.94)'],
  ['rgba(217,70,239,0.96)', 'rgba(124,58,237,0.94)'],
];

const remoteImage = (value) =>
  typeof value === 'string' && /^(?:https?:\/\/|content:\/\/|file:\/\/|data:)/i.test(value);

function NotificationItem({ item, index, onDismiss }) {
  const slideAnim = useRef(new Animated.Value(-width * 0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 7,
        tension: 58,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -width * 0.75,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 230,
          useNativeDriver: true,
        }),
      ]).start(() => onDismissRef.current?.(item.id));
    }, 4200);

    return () => clearTimeout(timer);
  }, [item.id, opacityAnim, slideAnim]);

  const giftImage = item.giftImage || (remoteImage(item.giftIcon) ? item.giftIcon : '');
  const receiverAvatar = item.receiverAvatar || item.receivers?.[0]?.avatar || DEFAULT_AVATAR;
  const colors = Array.isArray(item.colors) && item.colors.length >= 2
    ? item.colors
    : FLOW_COLORS[index % FLOW_COLORS.length];

  return (
    <Animated.View
      style={[
        styles.itemWrapper,
        { opacity: opacityAnim, transform: [{ translateX: slideAnim }] },
      ]}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.itemGradient}
      >
        <View style={styles.avatarShell}>
          <Image
            source={{ uri: item.senderAvatar || DEFAULT_AVATAR }}
            style={styles.senderAvatar}
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.senderName} numberOfLines={1}>
            {item.senderName || 'User'}
          </Text>
          <Text style={styles.actionLine} numberOfLines={1}>
            sent <Text style={styles.giftName}>{item.giftName || 'Gift'}</Text>
          </Text>
        </View>

        <View style={styles.giftVisual}>
          {giftImage ? (
            <Image source={{ uri: giftImage }} style={styles.giftImage} resizeMode="contain" />
          ) : (
            <Text style={styles.giftEmoji}>{item.giftIcon || '🎁'}</Text>
          )}
          <View style={styles.quantityPill}>
            <Text style={styles.quantityText}>×{Number(item.quantity || 1)}</Text>
          </View>
        </View>

        <View style={styles.receiverWrap}>
          <Image source={{ uri: receiverAvatar }} style={styles.receiverAvatar} />
          <Text style={styles.receiverName} numberOfLines={1}>
            {item.receiverText || 'Host'}
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

export default function GiftRoomNotification({ notifications = [], onDismiss }) {
  if (!notifications?.length) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {notifications.slice(-5).map((item, index) => (
        <NotificationItem
          key={item.id}
          item={item}
          index={index}
          onDismiss={onDismiss}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 82,
    left: 8,
    zIndex: 11000,
    elevation: 24,
    gap: 3,
  },
  itemWrapper: {
    width: Math.min(width * 0.8, 330),
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 7,
  },
  itemGradient: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 4,
    paddingRight: 6,
    paddingVertical: 3,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.42)',
  },
  avatarShell: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1.2,
    borderColor: '#FDE68A',
  },
  senderAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
    marginLeft: 6,
  },
  senderName: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '900',
  },
  actionLine: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 9.5,
    fontWeight: '600',
    marginTop: 1,
  },
  giftName: {
    color: '#FEF08A',
    fontWeight: '900',
  },
  giftVisual: {
    width: 48,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftImage: {
    width: 30,
    height: 30,
  },
  giftEmoji: {
    fontSize: 24,
  },
  quantityPill: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    minWidth: 20,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 8,
    backgroundColor: 'rgba(30,16,55,0.92)',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  quantityText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '900',
    textAlign: 'center',
  },
  receiverWrap: {
    width: 34,
    alignItems: 'center',
    marginLeft: 2,
  },
  receiverAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  receiverName: {
    maxWidth: 34,
    color: '#FFFFFF',
    fontSize: 7,
    fontWeight: '800',
    marginTop: -1,
  },
});
