import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { SvgXml } from 'react-native-svg';
import type { ARFilter } from '../types/ARFilter';
import { getEffectThumbnail } from '../effects/registry/effectThumbnails';
export default function ARFilterCard({
  effect,
  runtimeStatus,
  selected,
  favorite,
  onPress,
  onFavorite,
}: {
  effect: ARFilter;
  runtimeStatus: string;
  selected: boolean;
  favorite: boolean;
  onPress: () => void;
  onFavorite: () => void;
}) {
  const thumbnailXml = getEffectThumbnail(effect.id) || effect.thumbnailSvg;
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`${effect.name}, ${effect.status}${
        effect.premium ? ', premium' : ''
      }`}
      accessibilityState={{ selected }}
      onPress={onPress}
      onLongPress={onFavorite}
      style={s.card}
    >
      <View style={[s.image, selected && s.selected]}>
        <SvgXml xml={thumbnailXml} width={64} height={64} />
        {favorite && <Text style={s.star}>★</Text>}
      </View>
      <Text style={s.name} numberOfLines={2}>
        {effect.name}
      </Text>
      <Text style={[s.status, effect.status === 'pending' && s.pending]}>
        {runtimeStatus}
      </Text>
    </TouchableOpacity>
  );
}
const s = StyleSheet.create({
  card: { width: 82, alignItems: 'center', paddingVertical: 8 },
  image: {
    borderWidth: 2,
    borderColor: 'transparent',
    padding: 3,
    borderRadius: 23,
  },
  selected: { borderColor: '#F1CA76' },
  name: {
    fontSize: 11,
    color: '#F5EEF9',
    textAlign: 'center',
    marginTop: 5,
    minHeight: 29,
  },
  status: { fontSize: 9, color: '#B6A6C8', marginTop: 3 },
  pending: { color: '#CFAC7F' },
  star: { position: 'absolute', right: 2, top: 0, color: '#F1CA76' },
});
