import React from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { formatCompactBalance } from '../../utils/numberUtil';

export default function DurationPicker({
  options = [],
  selectedDays,
  onSelect,
  compactPrices = false,
}) {
  return (
    <View style={styles.optionsRow}>
      {options.map((option) => {
        const active = selectedDays === option.days;
        const price = compactPrices
          ? formatCompactBalance(option.diamonds)
          : Number(option.diamonds || 0).toLocaleString();

        return (
          <TouchableOpacity
            key={option.days}
            style={[styles.option, active && styles.optionActive]}
            onPress={() => onSelect(option.days)}
            activeOpacity={0.8}
          >
            <Text style={[styles.daysText, active && styles.activeText]}>
              {option.days} Days
            </Text>
            <View style={styles.priceRow}>
              <Icon name="diamond" size={11} color={active ? '#FFFFFF' : '#0891B2'} />
              <Text style={[styles.priceText, active && styles.activeText]}>{price}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  optionsRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 7,
    marginBottom: 14,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingVertical: 9,
    backgroundColor: '#F8FAFC',
  },
  optionActive: {
    borderColor: '#7C3AED',
    backgroundColor: '#7C3AED',
  },
  daysText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  activeText: {
    color: '#FFFFFF',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  priceText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0E7490',
  },
});
