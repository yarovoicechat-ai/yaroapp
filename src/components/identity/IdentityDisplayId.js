import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ToastAndroid, Clipboard, Animated, Easing } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import SvgaView from '../SvgaView';
import { resolveDisplayId } from '../../utils/identityId';

export default function IdentityDisplayId({ userId, officialDisplayId = null, isOfficial = false,
  customDisplayId = null, badgeUrl = null, badgeText = null, showBadge = true, showCopy = true,
  showPrefix = true, prefix = 'YARO ID : ', fontSize = 13, textColor = '#64748B', style }) {
  const { effectiveId, isUnique } = resolveDisplayId({ userId, officialDisplayId, isOfficial, customDisplayId });
  const cleanBadgeUrl = badgeUrl && !/frame/i.test(String(badgeUrl)) ? badgeUrl : null;
  const idColorAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!isUnique) return undefined;
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(idColorAnim, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      Animated.timing(idColorAnim, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [isUnique, idColorAnim]);
  const handleCopy = () => {
    if (!effectiveId) return;
    Clipboard.setString(effectiveId);
    if (ToastAndroid?.show) ToastAndroid.show(`ID ${effectiveId} copied!`, ToastAndroid.SHORT);
  };
  const color = isUnique ? idColorAnim.interpolate({ inputRange: [0, 1], outputRange: ['#FFD700', '#FDE047'] }) : textColor;
  const IdText = isUnique ? Animated.Text : Text;
  return <View style={[styles.row, style]}>
    {isUnique ? showBadge && (cleanBadgeUrl ? <SvgaView source={cleanBadgeUrl} style={styles.badge} resizeMode="contain" /> : <MaterialCommunityIcons name="shield-crown" size={fontSize + 5} color="#FFD700" style={styles.badgeFallback} />) : showPrefix && <Text style={[styles.prefix, { fontSize, color: textColor }]}>{prefix}</Text>}
    <IdText numberOfLines={1} style={[styles.id, { fontSize, color }, isUnique && styles.unique]}>{effectiveId}</IdText>
    {showCopy && Boolean(effectiveId) && <TouchableOpacity accessibilityLabel={`Copy ID ${effectiveId}`} onPress={handleCopy} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.copy}><Icon name="copy-outline" size={fontSize + 2} color={isUnique ? '#FFD700' : textColor} /></TouchableOpacity>}
  </View>;
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', minWidth: 0, flexShrink: 1 },
  prefix: { fontWeight: '500', includeFontPadding: false },
  id: { fontWeight: '600', flexShrink: 1, includeFontPadding: false, letterSpacing: 0 },
  unique: { fontWeight: '800', textShadowColor: 'rgba(212,175,55,0.35)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 3 },
  badge: { width: 38, height: 20, marginRight: 3 },
  badgeFallback: { marginRight: 3 },
  copy: { marginLeft: 4, padding: 2 },
});
