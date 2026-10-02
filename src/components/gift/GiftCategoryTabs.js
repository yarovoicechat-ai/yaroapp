import React from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
} from 'react-native';

export default function GiftCategoryTabs({
  categories = [],
  activeCategory,
  onSelectCategory,
}) {
  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((cat) => {
          const isActive =
            activeCategory?.toLowerCase() === cat.name?.toLowerCase() ||
            activeCategory?.toLowerCase() === cat.slug?.toLowerCase();

          return (
            <TouchableOpacity
              key={cat.id || cat._id || cat.slug || cat.name}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
              onPress={() => onSelectCategory(cat.name)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {cat.name}
              </Text>
              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 4,
  },
  scrollContent: {
    paddingHorizontal: 12,
    gap: 16,
    alignItems: 'center',
  },
  tabButton: {
    paddingVertical: 4,
    paddingHorizontal: 2,
    position: 'relative',
    alignItems: 'center',
  },
  tabButtonActive: {},
  tabText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -4,
    width: 20,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FACC15',
  },
});
