import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { AR_CATEGORIES, ARCategory } from '../types/ARFilter';
export default function ARCategoryTabs({
  value,
  onChange,
}: {
  value: ARCategory;
  onChange: (category: ARCategory) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.row}
    >
      {AR_CATEGORIES.map(category => (
        <TouchableOpacity
          key={category}
          accessibilityRole="tab"
          accessibilityState={{ selected: value === category }}
          onPress={() => onChange(category)}
          style={[s.tab, value === category && s.selected]}
        >
          <Text style={[s.text, value === category && s.active]}>
            {category}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
const s = StyleSheet.create({
  row: { gap: 8, paddingHorizontal: 14, paddingVertical: 8 },
  tab: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#FFFFFF08',
  },
  selected: { backgroundColor: '#EDC36F20' },
  text: { color: '#B5A8C4', fontSize: 11 },
  active: { color: '#F1CA76', fontWeight: '700' },
});
