import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const MIC_LAYOUTS = [
  {
    id: 8,
    label: '8 people',
    count: 8,
    rows: [4, 4],
  },
  {
    id: 12,
    label: '12 people',
    count: 12,
    rows: [4, 4, 4],
  },
  {
    id: '12_alt',
    label: '12 people',
    count: 12,
    rows: [3, 4, 5],
  },
  {
    id: 15,
    label: '15 people',
    count: 15,
    rows: [5, 5, 5],
  },
];

export default function SeatLayoutModal({
  visible,
  onClose,
  currentCount = 8,
  currentSeatCount,
  onSelectCount,
  onSelectSeatCount,
}) {
  const insets = useSafeAreaInsets() || { top: 0, bottom: 0 };
  const activeCount = Number(currentSeatCount !== undefined ? currentSeatCount : currentCount) || 8;
  const handleSelect = onSelectSeatCount || onSelectCount;

  // Selected layout state
  const [selectedLayoutId, setSelectedLayoutId] = useState(activeCount);

  if (!visible) return null;

  const currentLayout =
    MIC_LAYOUTS.find((l) => l.id === selectedLayoutId) ||
    MIC_LAYOUTS.find((l) => l.count === activeCount) ||
    MIC_LAYOUTS[0];

  const isCurrentActive = currentLayout.count === activeCount;

  const handleApply = () => {
    if (handleSelect) {
      handleSelect(currentLayout.count);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 16) }]}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-back" size={26} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Choose number of mic</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Center Phone Mockup Preview */}
        <View style={styles.previewContainer}>
          <View style={styles.phoneFrame}>
            <LinearGradient
              colors={['#1E0A3C', '#3B0764', '#581C87', '#2E1065']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.phoneScreen}
            >
              {/* Room Mini Header */}
              <View style={styles.phoneHeader}>
                <View style={styles.phoneHostInfo}>
                  <View style={styles.phoneHostAvatar}>
                    <MaterialCommunityIcons name="account" size={16} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text style={styles.phoneHostTitle}>Club Welcome</Text>
                    <Text style={styles.phoneHostId}>ID:10000087  👤999</Text>
                  </View>
                </View>
                <View style={styles.phoneHeaderIcons}>
                  <Ionicons name="share-outline" size={14} color="#E2E8F0" />
                  <Ionicons name="ellipsis-horizontal" size={14} color="#E2E8F0" />
                  <Ionicons name="power" size={14} color="#E2E8F0" />
                </View>
              </View>

              {/* Dynamic Mic Seats Grid Preview */}
              <View style={styles.micsGrid}>
                {(() => {
                  let seatCounter = 1;
                  return currentLayout.rows.map((rowSeats, rowIndex) => (
                    <View key={`row-${rowIndex}`} style={styles.micRow}>
                      {Array.from({ length: rowSeats }).map((_, seatIdx) => {
                        const num = seatCounter++;
                        return (
                          <View key={`seat-${num}`} style={styles.micItem}>
                            <View style={styles.micCircle}>
                              <MaterialCommunityIcons name="microphone" size={14} color="#E9D5FF" />
                            </View>
                            <Text style={styles.micLabel}>No.{num}</Text>
                          </View>
                        );
                      })}
                    </View>
                  ));
                })()}
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Thin Divider */}
        <View style={styles.divider} />

        {/* Horizontal Thumbnails Carousel */}
        <View style={styles.thumbnailsWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbnailsScroll}
          >
            {MIC_LAYOUTS.map((item) => {
              const isSelected = selectedLayoutId === item.id;
              return (
                <TouchableOpacity
                  key={`thumb-${item.id}`}
                  style={styles.thumbnailCardWrap}
                  activeOpacity={0.85}
                  onPress={() => setSelectedLayoutId(item.id)}
                >
                  <View
                    style={[
                      styles.thumbnailCard,
                      isSelected && styles.thumbnailCardSelected,
                    ]}
                  >
                    <LinearGradient
                      colors={['#1E0A3C', '#4C1D95']}
                      style={styles.thumbnailInner}
                    >
                      {/* Mini mic dots preview */}
                      <View style={styles.thumbMics}>
                        {item.rows.map((rCount, rIdx) => (
                          <View key={`tr-${rIdx}`} style={styles.thumbRow}>
                            {Array.from({ length: rCount }).map((_, cIdx) => (
                              <View key={`tc-${cIdx}`} style={styles.thumbDot}>
                                <MaterialCommunityIcons name="microphone" size={5} color="#DDD6FE" />
                              </View>
                            ))}
                          </View>
                        ))}
                      </View>
                    </LinearGradient>

                    {/* Green checkmark badge when selected */}
                    {isSelected && (
                      <View style={styles.checkBadge}>
                        <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                      </View>
                    )}
                  </View>
                  <Text style={[styles.thumbLabel, isSelected && styles.thumbLabelSelected]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Bottom Button ("Using" or "Use") */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleApply}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#FFB703', '#FB8500']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionBtnGradient}
            >
              <Text style={styles.actionBtnText}>
                {isCurrentActive ? 'Using' : 'Use'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 52,
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  phoneFrame: {
    width: width * 0.62,
    aspectRatio: 9 / 16,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#334155',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  phoneScreen: {
    flex: 1,
    paddingTop: 14,
    paddingHorizontal: 10,
  },
  phoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  phoneHostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  phoneHostAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FB7185',
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneHostTitle: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  phoneHostId: {
    fontSize: 7.5,
    color: '#CBD5E1',
  },
  phoneHeaderIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  micsGrid: {
    marginTop: 8,
    gap: 14,
  },
  micRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  micItem: {
    alignItems: 'center',
    gap: 4,
  },
  micCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micLabel: {
    fontSize: 8,
    color: '#DDD6FE',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 16,
  },
  thumbnailsWrap: {
    paddingVertical: 18,
  },
  thumbnailsScroll: {
    paddingHorizontal: 16,
    gap: 14,
  },
  thumbnailCardWrap: {
    alignItems: 'center',
    width: 78,
  },
  thumbnailCard: {
    width: 76,
    height: 120,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0F172A',
  },
  thumbnailCardSelected: {
    borderColor: '#10B981',
    borderWidth: 2,
  },
  thumbnailInner: {
    flex: 1,
    paddingTop: 10,
    paddingHorizontal: 4,
  },
  thumbMics: {
    gap: 6,
    marginTop: 6,
  },
  thumbRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  thumbDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbLabel: {
    fontSize: 12,
    color: '#475569',
    marginTop: 8,
    fontWeight: '500',
    textAlign: 'center',
  },
  thumbLabelSelected: {
    color: '#0F172A',
    fontWeight: '700',
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
  },
  actionBtn: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 3,
  },
  actionBtnGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
