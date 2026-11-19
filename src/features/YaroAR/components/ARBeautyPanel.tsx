import React from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { getEffect } from '../effects/registry/effectRegistry';
import { getEffectThumbnail } from '../effects/registry/effectThumbnails';
import ARIntensitySlider from './ARIntensitySlider';
import type { ARState } from '../types/ARSessionTypes';
const presets = [
  ['Yaro Beauty', 'yaro-beauty'],
  ['Natural Skin', 'natural-skin'],
  ['Smooth Skin', 'smooth-skin'],
  ['Pink Glow', 'pink-glow'],
  ['Golden Shine', 'golden-shine'],
  ['Rosy Cheeks', 'rosy-cheeks'],
  ['Soft Makeup', 'soft-makeup'],
  ['Bright Eyes', 'bright-eyes'],
  ['Lip Tint', 'lip-tint'],
] as const;
export default function ARBeautyPanel({
  intensity,
  selectedId,
  states,
  onSelect,
  onIntensity,
  onPending,
}: {
  intensity: number;
  selectedId: string | null;
  states: ARState['effectStates'];
  onSelect: (id: string) => void;
  onIntensity: (value: number) => void;
  onPending: (message: string) => void;
}) {
  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.row}
      >
        {presets.map(([name, id]) => {
          const effect = id ? getEffect(id) : undefined;
          const thumbnailXml = (id && getEffectThumbnail(id)) || effect?.thumbnailSvg;
          return (
            <TouchableOpacity
              key={name}
              accessibilityRole="button"
              accessibilityLabel={name}
              onPress={() => {
                if (!id) {
                  onPending(
                    `${name} needs a dedicated face-aware shader and is pending.`,
                  );
                  return;
                }
                onSelect(id);
              }}
              style={s.item}
            >
              <View
                style={[
                  s.icon,
                  selectedId === id &&
                    s.selected,
                ]}
              >
                {thumbnailXml ? (
                  <SvgXml xml={thumbnailXml} width={56} height={56} />
                ) : (
                  <Text style={s.pendingIcon}>✦</Text>
                )}
              </View>
              <Text style={s.name}>{name}</Text>
              <Text style={[s.status, selectedId === id && { color: '#F1CA76', fontWeight: '700' }]}>
                {selectedId === id ? 'Active' : '✦ Ready'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <ARIntensitySlider
        label="Beauty intensity"
        value={intensity}
        onChange={onIntensity}
        disabled={false}
      />
    </View>
  );
}
const s = StyleSheet.create({
  row: { paddingHorizontal: 10, gap: 6 },
  item: { width: 76, alignItems: 'center', paddingTop: 10 },
  icon: {
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 20,
    padding: 3,
  },
  selected: { borderColor: '#F1CA76' },
  name: {
    color: '#F5EEF9',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 7,
    minHeight: 30,
  },
  status: { color: '#B6A6C8', fontSize: 9, marginTop: 3 },
  pendingIcon: {
    fontSize: 32,
    color: '#C6A275',
    width: 56,
    height: 56,
    textAlign: 'center',
    paddingTop: 6,
  },
});
