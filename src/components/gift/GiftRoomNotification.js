import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

function NotificationItem({ item, onDismiss }) {
  const slideAnim = useRef(new Animated.Value(width * 0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Slide in from right with spring settle
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 5.5,
        tension: 75,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Hold for 3.5s then slide out smoothly
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -width * 0.8,
          duration: 240,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 240,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onDismiss(item.id);
      });
    }, 3500);

    return () => clearTimeout(timer);
  }, [item.id, onDismiss]);

  return (
    <Animated.View
      style={[
        styles.itemWrapper,
        {
          opacity: opacityAnim,
          transform: [{ translateX: slideAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={['rgba(26, 11, 46, 0.95)', 'rgba(15, 23, 42, 0.92)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.itemGradient}
      >
        <Image
          source={{
            uri:
              item.senderAvatar ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
          }}
          style={styles.senderAvatar}
        />
        <View style={styles.textContainer}>
          <Text style={styles.lineOne} numberOfLines={1}>
            <Text style={styles.senderName}>{item.senderName} </Text>
            <Text style={styles.actionText}>sent </Text>
            <Text style={styles.giftHighlight}>
              {item.giftIcon} {item.giftName}
            </Text>
            <Text style={styles.quantityBadge}> ×{item.quantity}</Text>
          </Text>
          <Text style={styles.receiverLine} numberOfLines={1}>
            to <Text style={styles.receiverName}>{item.receiverText}</Text>
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

export default function GiftRoomNotification({ notifications = [], onDismiss }) {
  if (!notifications || notifications.length === 0) return null;

  // Render max 3 active notifications concurrently
  const visibleItems = notifications.slice(-3);

  return (
    <View style={styles.container} pointerEvents="none">
      {visibleItems.map((item) => (
        <NotificationItem key={item.id} item={item} onDismiss={onDismiss} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 145,
    left: 14,
    zIndex: 990,
    gap: 7,
  },
  itemWrapper: {
    maxWidth: width * 0.82,
  },
  itemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5.5,
    paddingHorizontal: 9,
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: 'rgba(236, 72, 153, 0.35)',
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    gap: 8,
  },
  senderAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.2,
    borderColor: '#EC4899',
  },
  textContainer: {
    flex: 1,
  },
  lineOne: {
    fontSize: 11.5,
    color: '#E2E8F0',
  },
  senderName: {
    fontWeight: '700',
    color: '#F8FAFC',
  },
  actionText: {
    color: '#94A3B8',
  },
  giftHighlight: {
    color: '#FBBF24',
    fontWeight: '800',
  },
  quantityBadge: {
    color: '#EC4899',
    fontWeight: '900',
  },
  receiverLine: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  receiverName: {
    color: '#38BDF8',
    fontWeight: '600',
  },
});
