import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function GiftQuickSend({
  visible,
  gift,
  receiver,
  comboCount = 1,
  onQuickSend,
  onClose,
  bottomInset = 65,
}) {
  const [selectedQty, setSelectedQty] = useState(1);
  const slideAnim = useRef(new Animated.Value(50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const buttonBounceAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible && gift) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 6,
          tension: 65,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 50,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, gift]);

  if (!visible || !gift) return null;

  const handleSendAgain = () => {
    Animated.sequence([
      Animated.timing(buttonBounceAnim, {
        toValue: 0.9,
        duration: 70,
        useNativeDriver: true,
      }),
      Animated.spring(buttonBounceAnim, {
        toValue: 1,
        friction: 3.5,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();

    onQuickSend && onQuickSend(gift, selectedQty, receiver);
  };

  const unitCost = Number(gift.price !== undefined ? gift.price : (gift.cost || 0));
  const totalDiamonds = unitCost * selectedQty;

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          bottom: bottomInset,
          opacity: opacityAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={['rgba(26, 11, 46, 0.95)', 'rgba(15, 23, 42, 0.95)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.container}
      >
        {/* Left: Gift Thumbnail & Info */}
        <View style={styles.leftCol}>
          <Text style={styles.giftIcon}>{gift.icon || '🎁'}</Text>
          <View style={styles.infoCol}>
            <Text style={styles.giftName} numberOfLines={1}>{gift.name}</Text>
            <Text style={styles.costText}>💎 {totalDiamonds.toLocaleString()}</Text>
          </View>
        </View>

        {/* Center: Quick Quantities */}
        <View style={styles.qtyRow}>
          {[1, 5, 10].map((qty) => {
            const active = selectedQty === qty;
            return (
              <TouchableOpacity
                key={`quick-qty-${qty}`}
                style={[styles.qtyBtn, active && styles.qtyBtnActive]}
                onPress={() => setSelectedQty(qty)}
                activeOpacity={0.8}
              >
                <Text style={[styles.qtyText, active && styles.qtyTextActive]}>
                  x{qty}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Right: SEND AGAIN Button */}
        <Animated.View style={{ transform: [{ scale: buttonBounceAnim }] }}>
          <TouchableOpacity
            style={styles.sendAgainBtn}
            onPress={handleSendAgain}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#EC4899', '#BE185D']}
              style={styles.sendAgainGradient}
            >
              <MaterialCommunityIcons name="lightning-bolt" size={13} color="#FFFFFF" />
              <Text style={styles.sendAgainText}>AGAIN</Text>
              {comboCount > 1 && (
                <View style={styles.comboBubble}>
                  <Text style={styles.comboBubbleText}>{comboCount}</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Dismiss Icon */}
        <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
          <Icon name="close" size={12} color="#64748B" />
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    right: 14,
    zIndex: 995,
    maxWidth: 320,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: 'rgba(236, 72, 153, 0.45)',
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    gap: 8,
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  giftIcon: {
    fontSize: 22,
  },
  infoCol: {
    maxWidth: 75,
  },
  giftName: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  costText: {
    color: '#FBBF24',
    fontSize: 9.5,
    fontWeight: '600',
  },
  qtyRow: {
    flexDirection: 'row',
    gap: 3,
  },
  qtyBtn: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(51, 65, 85, 0.55)',
  },
  qtyBtnActive: {
    backgroundColor: '#8B5CF6',
  },
  qtyText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },
  qtyTextActive: {
    color: '#FFFFFF',
  },
  sendAgainBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  sendAgainGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5.5,
    borderRadius: 14,
    gap: 3,
  },
  sendAgainText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  comboBubble: {
    backgroundColor: '#F59E0B',
    borderRadius: 8,
    paddingHorizontal: 3.5,
    paddingVertical: 0.5,
    marginLeft: 2,
  },
  comboBubbleText: {
    color: '#0F172A',
    fontSize: 8.5,
    fontWeight: '900',
  },
  closeBtn: {
    padding: 2,
  },
});
