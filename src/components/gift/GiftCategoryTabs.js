import React from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

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
              style={styles.tabButton}
              onPress={() => onSelectCategory(cat.name)}
              activeOpacity={0.8}
            >
              {isActive ? (
                <LinearGradient
                  colors={['rgba(236, 72, 153, 0.25)', 'rgba(168, 85, 247, 0.3)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.activeCapsule}
                >
                  <Text style={styles.tabTextActive}>
                    {String(cat.slug || cat.name).toLowerCase() === 'popular' ? '?? Popular' : cat.name}
                  </Text>
                  <LinearGradient
                    colors={['#EC4899', '#A855F7', '#38BDF8']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.activeIndicator}
                  />
                </LinearGradient>
              ) : (
                <View style={styles.inactiveCapsule}>
                  <Text style={styles.tabText}>
                    {cat.name}
                  </Text>
                </View>
              )}
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
    borderBottomColor: 'rgba(168, 85, 247, 0.15)',
    paddingVertical: 5,
    backgroundColor: 'rgba(12, 7, 28, 0.6)',
  },
  scrollContent: {
    paddingHorizontal: 12,
    gap: 10,
    alignItems: 'center',
  },
  tabButton: {
    position: 'relative',
    alignItems: 'center',
  },
  activeCapsule: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveCapsule: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    color: '#94A3B8',
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '900',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(236, 72, 153, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -1,
    width: 22,
    height: 2.5,
    borderRadius: 2,
  },
});
