import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

const SEAT_OPTIONS = [
  {
    count: 8,
    title: '8 Seats (Standard)',
    sub: 'Top: 2 Seats • Bottom: 6 Seats',
    icon: 'numeric-8-box-multiple-outline',
  },
  {
    count: 10,
    title: '10 Seats (Club Party)',
    sub: 'Top: 2 Seats • Bottom: 2 Rows of 4/5',
    icon: 'numeric-10-box-multiple-outline',
  },
  {
    count: 12,
    title: '12 Seats (Celebrity)',
    sub: 'Top: 2 Seats • Bottom: 2 Rows of 5',
    icon: 'view-grid-plus-outline',
  },
  {
    count: 15,
    title: '15 Seats (Mega Lounge)',
    sub: 'Top: 2 Seats • Bottom: 3 Rows of 5 (Responsive)',
    icon: 'apps',
  },
];

export default function SeatLayoutModal({
  visible,
  onClose,
  currentCount = 8,
  currentSeatCount,
  onSelectCount,
  onSelectSeatCount,
  bottomSafePadding = 16,
}) {
  const activeCount = currentSeatCount !== undefined ? currentSeatCount : currentCount;
  const handleSelect = onSelectSeatCount || onSelectCount;

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={[styles.sheetContainer, { paddingBottom: bottomSafePadding + 16 }]}>
          <View style={styles.sheetHandle} />

          <View style={styles.headerRow}>
            <View style={styles.titleWrap}>
              <MaterialCommunityIcons name="seat-passenger" size={24} color="#F59E0B" />
              <Text style={styles.titleText}>Room Seats Layout / सीट संख्या</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <MaterialCommunityIcons name="close" size={22} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subHintText}>
            Choose room seat capacity. Above 8 seats, seat icons scale down responsively to fit 5 per line!
          </Text>

          <View style={styles.optionsList}>
            {SEAT_OPTIONS.map((opt) => {
              const isSelected = Number(activeCount) === opt.count;
              return (
                <TouchableOpacity
                  key={`seat-opt-${opt.count}`}
                  style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                  activeOpacity={0.8}
                  onPress={() => {
                    handleSelect && handleSelect(opt.count);
                    onClose && onClose();
                  }}
                >
                  <LinearGradient
                    colors={isSelected ? ['rgba(245, 158, 11, 0.2)', 'rgba(217, 119, 6, 0.1)'] : ['rgba(255, 255, 255, 0.04)', 'rgba(255, 255, 255, 0.02)']}
                    style={styles.cardGradient}
                  >
                    <View style={[styles.iconWrap, isSelected && styles.iconWrapSelected]}>
                      <MaterialCommunityIcons
                        name={opt.icon}
                        size={24}
                        color={isSelected ? '#F59E0B' : '#94A3B8'}
                      />
                    </View>

                    <View style={styles.infoCol}>
                      <Text style={[styles.optTitle, isSelected && styles.optTitleSelected]}>
                        {opt.title}
                      </Text>
                      <Text style={styles.optSub}>{opt.sub}</Text>
                    </View>

                    <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                      {isSelected && <View style={styles.radioDot} />}
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  subHintText: {
    color: '#94A3B8',
    fontSize: 11.5,
    marginBottom: 14,
    lineHeight: 16,
  },
  optionsList: {
    gap: 10,
    marginBottom: 10,
  },
  optionCard: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  optionCardSelected: {
    borderColor: '#F59E0B',
  },
  cardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconWrapSelected: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  infoCol: {
    flex: 1,
  },
  optTitle: {
    color: '#E2E8F0',
    fontSize: 13.5,
    fontWeight: '700',
  },
  optTitleSelected: {
    color: '#FBBF24',
    fontWeight: '800',
  },
  optSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  radioCircleSelected: {
    borderColor: '#F59E0B',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F59E0B',
  },
});
