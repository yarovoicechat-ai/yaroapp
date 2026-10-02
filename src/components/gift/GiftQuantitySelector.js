import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const QUANTITIES = [1, 5, 10, 20, 50, 100];

export default function GiftQuantitySelector({
  selectedQuantity = 1,
  onSelectQuantity,
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Quantity</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {QUANTITIES.map((qty) => {
          const isSelected = selectedQuantity === qty;
          return (
            <TouchableOpacity
              key={`qty-${qty}`}
              style={[styles.qtyPill, isSelected && styles.qtyPillSelected]}
              onPress={() => onSelectQuantity(qty)}
              activeOpacity={0.8}
            >
              {isSelected ? (
                <LinearGradient
                  colors={['#EC4899', '#8B5CF6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.selectedGradient}
                >
                  <Text style={styles.selectedText}>x{qty}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.unselectedInner}>
                  <Text style={styles.unselectedText}>x{qty}</Text>
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
  container: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 8,
  },
  scrollList: {
    gap: 6,
    alignItems: 'center',
  },
  qtyPill: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  qtyPillSelected: {
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedGradient: {
    paddingHorizontal: 12,
    paddingVertical: 4.5,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  unselectedInner: {
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 14,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  unselectedText: {
    color: '#CBD5E1',
    fontSize: 11.5,
    fontWeight: '600',
  },
});
