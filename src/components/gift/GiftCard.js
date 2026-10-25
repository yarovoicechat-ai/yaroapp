import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import GiftMedia from '../GiftMedia';
import { resolveGiftVisual } from './giftMediaUtils';
import { formatCompactBalance } from '../../utils/numberUtil';

const { width } = Dimensions.get('window');
const H_PADDING = 12;
const GAP = 7;
// Exactly 4 columns per row
export const CARD_WIDTH = Math.floor((width - H_PADDING * 2 - GAP * 3) / 4);

export default function GiftCard({ gift, isSelected = false, onSelect }) {
  const isSelectedBool = Boolean(isSelected);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const imageBounce = useRef(new Animated.Value(1)).current;
  const pulseBorder = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (isSelectedBool) {
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.06,
            duration: 110,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1.0,
            friction: 4,
            tension: 90,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(imageBounce, {
            toValue: 1.18,
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.spring(imageBounce, {
            toValue: 1.0,
            friction: 3.5,
            tension: 80,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseBorder, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(pulseBorder, {
            toValue: 0.75,
            duration: 700,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseBorder.setValue(0.8);
    }
  }, [isSelectedBool, scaleAnim, imageBounce, pulseBorder]);

  const price = Number(
    gift.price !== undefined
      ? gift.price
      : (gift.cost !== undefined ? gift.cost : (gift.priceDiamonds || 0))
  );

  const badgeText =
    gift.badge ||
    (gift.isVip ? 'VIP' : (gift.isLimited ? 'LIMITED' : ((gift.isNew || gift.isNewItem) ? 'NEW' : (gift.isHot ? 'HOT' : (gift.category === 'Event' ? 'EVENT' : null)))));
  const giftVisual = resolveGiftVisual(gift);

  // Dynamic Neon Accent per category / rarity
  const isLuxury = gift.category === 'Luxury' || gift.isVip || badgeText === 'VIP';
  const isRomantic = gift.category === 'Romantic' || badgeText === 'HOT';

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.container,
          isSelectedBool && styles.containerSelected,
        ]}
        onPress={() => onSelect(gift)}
        activeOpacity={0.85}
      >
        {/* Animated Neon Aurora Border when selected */}
        {isSelectedBool ? (
          <Animated.View style={[styles.borderWrapper, { opacity: pulseBorder }]}>
            <LinearGradient
              colors={['#EC4899', '#A855F7', '#06B6D4', '#F59E0B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>
        ) : (
          <View style={styles.unselectedBorder} />
        )}

        {/* Card Body with Deep Royal Velvet Gradient */}
        <LinearGradient
          colors={
            isSelectedBool
              ? ['#2C1254', '#180B3B', '#110629']
              : isLuxury
              ? ['#1F1340', '#120A2B', '#0A051A']
              : isRomantic
              ? ['#241033', '#150A24', '#0A0514']
              : ['#171038', '#0F0927', '#0A061B']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.cardInner, isSelectedBool && styles.cardInnerSelected]}
        >
          {/* Header Row: Badge & Check */}
          <View style={styles.badgeRow}>
            {badgeText ? (
              <LinearGradient
                colors={
                  badgeText === 'VIP' || badgeText === 'SVIP'
                    ? ['#F59E0B', '#D97706', '#92400E']
                    : badgeText === 'NEW'
                    ? ['#06B6D4', '#0284C7', '#0369A1']
                    : badgeText === 'LIMITED'
                    ? ['#A855F7', '#7C3AED', '#581C87']
                    : badgeText === 'EVENT'
                    ? ['#F43F5E', '#BE123C', '#881337']
                    : ['#EF4444', '#DC2626', '#991B1B']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.badgePill}
              >
                <Text style={styles.badgeText}>{badgeText}</Text>
              </LinearGradient>
            ) : (
              <View style={styles.badgePlaceholder}>
                <View style={[styles.microGlowDot, isLuxury && { backgroundColor: '#F59E0B' }]} />
              </View>
            )}

            {/* Check Indicator when selected */}
            {isSelectedBool && (
              <LinearGradient
                colors={['#06B6D4', '#3B82F6']}
                style={styles.selectedRadio}
              >
                <MaterialCommunityIcons name="check-bold" size={9} color="#FFFFFF" />
              </LinearGradient>
            )}
          </View>

          {/* Centered Gift Media on Glowing Halo Pedestal */}
          <View style={styles.mediaWrapper}>
            <View
              style={[
                styles.pedestalGlow,
                isSelectedBool && styles.pedestalGlowSelected,
                isLuxury && styles.pedestalGlowLuxury,
              ]}
            />
            <Animated.View
              style={[
                styles.mediaContainer,
                { transform: [{ scale: imageBounce }] },
              ]}
            >
              {gift.animationUrl || giftVisual.giftImage ? (
                <GiftMedia
                  source={gift.animationUrl || giftVisual.giftImage}
                  mediaType={gift.mediaType || 'image'}
                  style={styles.media}
                  resizeMode="contain"
                />
              ) : (
                <Text style={styles.emojiIcon}>{giftVisual.giftIcon || gift.icon || '🎁'}</Text>
              )}
            </Animated.View>
          </View>

          {/* Gift Name */}
          <Text
            style={[styles.giftName, isSelectedBool && styles.giftNameSelected]}
            numberOfLines={1}
          >
            {gift.name}
          </Text>

          {/* Price with Glowing Diamond */}
          <View style={[styles.priceRow, isSelectedBool && styles.priceRowSelected]}>
            <Image source={require('../../assets/icons/diamond.png')} style={{ width: 12, height: 12, marginRight: 2 }} resizeMode="contain" />
            <Text style={[styles.priceText, isSelectedBool && styles.priceTextSelected]}>
              {formatCompactBalance(price)}
            </Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: 114,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: GAP,
  },
  containerSelected: {
    shadowColor: '#D946EF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.85,
    shadowRadius: 10,
    elevation: 10,
  },
  borderWrapper: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
  },
  unselectedBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(168, 85, 247, 0.22)',
  },
  cardInner: {
    flex: 1,
    margin: 1.5,
    borderRadius: 14.5,
    paddingHorizontal: 4,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardInnerSelected: {
    margin: 2,
    borderRadius: 14,
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
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 7.5,
    fontWeight: '900',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  badgePlaceholder: {
    minWidth: 12,
    height: 12,
    justifyContent: 'center',
  },
  microGlowDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(168, 85, 247, 0.6)',
  },
  selectedRadio: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 3,
  },
  mediaWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 1,
  },
  pedestalGlow: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
  },
  pedestalGlowSelected: {
    backgroundColor: 'rgba(236, 72, 153, 0.28)',
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  pedestalGlowLuxury: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
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
    fontWeight: '700',
    textAlign: 'center',
    maxWidth: '94%',
    letterSpacing: 0.1,
  },
  giftNameSelected: {
    color: '#FFFFFF',
    fontWeight: '900',
    textShadowColor: 'rgba(236, 72, 153, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 6, 27, 0.85)',
    borderWidth: 0.8,
    borderColor: 'rgba(234, 179, 8, 0.25)',
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 10,
    gap: 2.5,
  },
  priceRowSelected: {
    backgroundColor: 'rgba(234, 179, 8, 0.18)',
    borderColor: '#FDE047',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  diamondEmoji: {
    fontSize: 9.5,
  },
  priceText: {
    color: '#FDE047',
    fontSize: 9.5,
    fontWeight: '800',
  },
  priceTextSelected: {
    color: '#FEF08A',
    fontWeight: '900',
  },
});
