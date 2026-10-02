import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import GiftMedia from '../GiftMedia';

const { width } = Dimensions.get('window');
const H_PADDING = 12;
const GAP = 6;
// Exactly 4 columns per row
export const CARD_WIDTH = Math.floor((width - H_PADDING * 2 - GAP * 3) / 4);

export default function GiftCard({ gift, isSelected, onSelect }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const imageBounce = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isSelected) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1.0,
          friction: 4,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();

      Animated.sequence([
        Animated.timing(imageBounce, {
          toValue: 1.15,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(imageBounce, {
          toValue: 1.0,
          friction: 3,
          tension: 70,
          useNativeDriver: true,
        }),
      ]).start();

      Animated.timing(glowOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(glowOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [isSelected]);

  const price = Number(
    gift.price !== undefined
      ? gift.price
      : (gift.cost !== undefined ? gift.cost : (gift.priceDiamonds || 0))
  );

  const badgeText =
    gift.badge ||
    (gift.isVip ? 'VIP' : (gift.isLimited ? 'LIMITED' : ((gift.isNew || gift.isNewItem) ? 'NEW' : (gift.isHot ? 'HOT' : (gift.category === 'Event' ? 'EVENT' : null)))));

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.container,
          isSelected && styles.containerSelected,
        ]}
        onPress={() => onSelect(gift)}
        activeOpacity={0.85}
      >
        {/* Selected Glowing Gold Border */}
        {isSelected && (
          <LinearGradient
            colors={['#FDE047', '#EAB308', '#CA8A04']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.selectedBorder}
          />
        )}

        <View style={[styles.cardInner, isSelected && styles.cardInnerSelected]}>
          {/* Header Row: Badge */}
          <View style={styles.badgeRow}>
            {badgeText ? (
              <LinearGradient
                colors={
                  badgeText === 'VIP' || badgeText === 'SVIP'
                    ? ['#F59E0B', '#B45309']
                    : badgeText === 'NEW'
                    ? ['#10B981', '#059669']
                    : badgeText === 'LIMITED'
                    ? ['#8B5CF6', '#6D28D9']
                    : badgeText === 'EVENT'
                    ? ['#EC4899', '#BE185D']
                    : ['#EF4444', '#DC2626']
                }
                style={styles.badgePill}
              >
                <Text style={styles.badgeText}>{badgeText}</Text>
              </LinearGradient>
            ) : (
              <View style={styles.badgePlaceholder}>
                <Text style={{ fontSize: 9 }}>🎁</Text>
              </View>
            )}

            {/* Check Indicator when selected */}
            {isSelected && (
              <View style={styles.selectedRadio}>
                <MaterialCommunityIcons name="check" size={10} color="#0F172A" />
              </View>
            )}
          </View>

          {/* Centered Gift Media or Icon */}
          <Animated.View
            style={[
              styles.mediaContainer,
              { transform: [{ scale: imageBounce }] },
            ]}
          >
            {gift.animationUrl || gift.image?.startsWith('http') || gift.icon?.startsWith('http') ? (
              <GiftMedia
                source={gift.animationUrl || gift.image || gift.icon}
                mediaType={gift.mediaType || 'image'}
                style={styles.media}
                resizeMode="contain"
              />
            ) : (
              <Text style={styles.emojiIcon}>{gift.icon || '🎁'}</Text>
            )}
          </Animated.View>

          {/* Gift Name */}
          <Text style={[styles.giftName, isSelected && styles.giftNameSelected]} numberOfLines={1}>
            {gift.name}
          </Text>

          {/* Price with Diamond 💎 */}
          <View style={[styles.priceRow, isSelected && styles.priceRowSelected]}>
            <Text style={styles.diamondEmoji}>💎</Text>
            <Text style={[styles.priceText, isSelected && styles.priceTextSelected]}>
              {price.toLocaleString()}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: 110,
    borderRadius: 14,
    backgroundColor: 'rgba(30, 41, 59, 0.75)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    overflow: 'hidden',
    position: 'relative',
    marginBottom: GAP,
  },
  containerSelected: {
    borderColor: '#FBBF24',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
    elevation: 8,
  },
  selectedBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
  },
  cardInner: {
    flex: 1,
    margin: 1.5,
    backgroundColor: '#0F172A',
    borderRadius: 12.5,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardInnerSelected: {
    backgroundColor: '#111827',
  },
  badgeRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 14,
    paddingHorizontal: 2,
  },
  badgePill: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 7.5,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  badgePlaceholder: {
    opacity: 0.8,
  },
  selectedRadio: {
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: '#FDE047',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaContainer: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  media: {
    width: 42,
    height: 42,
  },
  emojiIcon: {
    fontSize: 32,
  },
  giftName: {
    color: '#E2E8F0',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: '92%',
  },
  giftNameSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 9,
    gap: 2,
  },
  priceRowSelected: {
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
  },
  diamondEmoji: {
    fontSize: 9.5,
  },
  priceText: {
    color: '#FBBF24',
    fontSize: 9.5,
    fontWeight: '800',
  },
  priceTextSelected: {
    color: '#FDE047',
    fontWeight: '900',
  },
});
