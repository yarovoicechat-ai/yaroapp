import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  PanResponder,
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import GiftCategoryTabs from './GiftCategoryTabs';
import GiftCard from './GiftCard';
import ReceiverSelector from './ReceiverSelector';
import GiftLevelBar from './GiftLevelBar';
import GiftConfirmationModal from './GiftConfirmationModal';
import GiftHistoryModal from './GiftHistoryModal';
import InsufficientBalanceModal from './InsufficientBalanceModal';
import { AlertService } from '../../utils/AlertService';

const { width, height } = Dimensions.get('window');
const SHEET_HEIGHT = Math.min(height * 0.84, 660);

const PRESET_QUANTITIES = [1, 5, 10, 20, 50, 100];

export default function GiftPanel({
  visible,
  onClose,
  room = {},
  seats = [],
  diamondBalance = 0,
  onTopUp,
  giftHook,
  bottomSafePadding = 12,
}) {
  const activeBalance = Number(diamondBalance !== undefined ? diamondBalance : 0);

  const {
    categories,
    activeCategory,
    setActiveCategory,
    gifts,
    loadingGifts,
    selectedGift,
    setSelectedGift,
    selectedQuantity,
    setSelectedQuantity,
    selectedReceivers,
    setSelectedReceivers,
    isMultiSelectMode,
    setIsMultiSelectMode,
    totalDiamonds,
    hasSufficientDiamonds,
    sending,
    comboCount = 1,
    confirmationPending,
    handleInitiateSend,
    confirmSend,
    cancelConfirmation,
  } = giftHook || {};

  const currentCost = Number(totalDiamonds || 0);
  const isAffordable = hasSufficientDiamonds;

  // Single Source of Truth for Panel Visibility & Animated Progress
  const [mounted, setMounted] = useState(visible);
  const giftPanelProgress = useRef(new Animated.Value(visible ? 1 : 0)).current;

  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [insufficientModalVisible, setInsufficientModalVisible] = useState(false);
  const [quantityPickerOpen, setQuantityPickerOpen] = useState(false);

  // Smooth Bottom Sheet Animation (250–350ms opening, 200–300ms closing)
  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.spring(giftPanelProgress, {
        toValue: 1,
        friction: 8,
        tension: 65,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(giftPanelProgress, {
        toValue: 0,
        duration: 230,
        useNativeDriver: true,
      }).start(() => {
        setMounted(false);
        setQuantityPickerOpen(false);
      });
    }
  }, [visible, giftPanelProgress]);

  // Pan Responder for swipe-down to dismiss
  const panY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 6,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 70 || gestureState.vy > 0.5) {
          onClose();
        } else {
          Animated.spring(panY, {
            toValue: 0,
            friction: 6,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Android Back Button closes panel
  useEffect(() => {
    if (!visible) return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });

    panY.setValue(0);
    return () => backHandler.remove();
  }, [visible, onClose, panY]);

  // Default receiver setup: if none selected, select Host by default
  useEffect(() => {
    if (visible && selectedReceivers.length === 0) {
      const defaultHost = {
        id: room.hostId || room.ownerId || 'host',
        userId: room.hostId || room.ownerId || 'host',
        name: room.hostName || 'Host',
        avatar: room.hostAvatar || room.coverImage || 'https://api.yaroapp.in/uploads/avatars/female_default.webp',
        seatNumber: '1',
      };
      setSelectedReceivers([defaultHost]);
    }
  }, [visible, room, selectedReceivers.length, setSelectedReceivers]);

  const handleSelectReceiver = useCallback(
    (receiver) => {
      if (receiver.isAll || receiver.id === 'all') {
        setSelectedReceivers([receiver]);
        return;
      }

      if (!isMultiSelectMode) {
        setSelectedReceivers([receiver]);
        return;
      }

      // Multi-select toggle
      setSelectedReceivers((prev) => {
        const exists = prev.some((r) => String(r.id) === String(receiver.id));
        if (exists) {
          const filtered = prev.filter((r) => String(r.id) !== String(receiver.id));
          return filtered.length > 0 ? filtered : [receiver];
        } else {
          return [...prev.filter((r) => !r.isAll && r.id !== 'all'), receiver];
        }
      });
    },
    [isMultiSelectMode, setSelectedReceivers]
  );

  const handleStepQuantity = useCallback(
    (delta) => {
      setSelectedQuantity((prev) => {
        const next = Math.max(1, Math.min(1000, Number(prev || 1) + delta));
        return next;
      });
    },
    [setSelectedQuantity]
  );

  const sendBtnScale = useRef(new Animated.Value(1)).current;

  const handlePressSend = () => {
    if (!selectedReceivers || selectedReceivers.length === 0) {
      AlertService.show('Select Recipient', 'Select a user to send a gift', 'info');
      return;
    }
    if (!isAffordable) {
      setInsufficientModalVisible(true);
      return;
    }

    // Instant tactile bounce on every tap
    sendBtnScale.setValue(0.88);
    Animated.spring(sendBtnScale, {
      toValue: 1,
      friction: 3,
      tension: 100,
      useNativeDriver: true,
    }).start();

    // Panel remains open when sending! Continuous tap sends consecutively
    handleInitiateSend();
  };

  if (!mounted) return null;

  const translateY = Animated.add(
    giftPanelProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [SHEET_HEIGHT, 0],
    }),
    panY
  );

  const backdropOpacity = giftPanelProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.6],
  });

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        {/* Backdrop touch to dismiss */}
        <Animated.View style={[styles.backdropTouch, { opacity: backdropOpacity }]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={onClose}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheetContainer,
            {
              transform: [{ translateY }],
              paddingBottom: Math.max(bottomSafePadding, 10),
            },
          ]}
        >
          {/* 1. Drag Handle */}
          <View {...panResponder.panHandlers} style={styles.handleContainer}>
            <View style={styles.sheetHandle} />
          </View>

          {/* 2. Top Row: Receiver Selector (Avatars with seat badges & All button) */}
          <ReceiverSelector
            room={room}
            seats={seats}
            selectedReceivers={selectedReceivers}
            onSelectReceiver={handleSelectReceiver}
            isMultiSelectMode={isMultiSelectMode}
            onToggleMultiSelect={() => setIsMultiSelectMode((prev) => !prev)}
          />

          {/* Prompt if no recipient selected */}
          {selectedReceivers.length === 0 && (
            <View style={styles.recipientPromptBox}>
              <MaterialCommunityIcons name="account-alert-outline" size={14} color="#FACC15" />
              <Text style={styles.recipientPromptText}>Select a user to send a gift</Text>
            </View>
          )}

          {/* 3. Gold Level Progress Bar */}
          <GiftLevelBar
            level={3}
            currentExp={900}
            targetExp={1000}
            onPress={() => setHistoryModalVisible(true)}
          />

          {/* 4. Category Tabs: Gifts | Lucky | Event | Surprise | Custom | VIP | Special */}
          <GiftCategoryTabs
            categories={categories}
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
          />

          {/* 5. 4-Column Gift Grid */}
          <View style={styles.gridContainer}>
            {loadingGifts && gifts.length === 0 ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color="#FACC15" />
              </View>
            ) : gifts.length === 0 ? (
              <View style={styles.emptyGrid}>
                <Text style={{ fontSize: 32 }}>🎁</Text>
                <Text style={styles.emptyGridText}>No gifts available</Text>
              </View>
            ) : (
              <ScrollView
                style={styles.gridScrollView}
                contentContainerStyle={styles.gridContent}
                showsVerticalScrollIndicator={false}
              >
                {gifts.map((item) => (
                  <GiftCard
                    key={item._id || item.id}
                    gift={item}
                    isSelected={selectedGift?._id === item._id || selectedGift?.id === item.id}
                    onSelect={setSelectedGift}
                  />
                ))}
              </ScrollView>
            )}
          </View>

          {/* 6. Quantity Preset Popover Menu (Appears above bottom bar if open) */}
          {quantityPickerOpen && (
            <View style={styles.quantityPopover}>
              <Text style={styles.popoverTitle}>Select Quantity</Text>
              <View style={styles.quantityChipRow}>
                {PRESET_QUANTITIES.map((q) => {
                  const isQSelected = selectedQuantity === q;
                  return (
                    <TouchableOpacity
                      key={`pop-qty-${q}`}
                      style={[styles.popoverChip, isQSelected && styles.popoverChipSelected]}
                      onPress={() => {
                        setSelectedQuantity(q);
                        setQuantityPickerOpen(false);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.popoverChipText, isQSelected && styles.popoverChipTextSelected]}>
                        x{q}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* 7. Bottom Action Bar (💎 Balance | [- 1 +] Quantity Selector | SEND Button) */}
          <View style={styles.bottomBar}>
            {/* LEFT: Current Diamond Balance */}
            <TouchableOpacity
              style={styles.balancePill}
              onPress={() => {
                onClose();
                onTopUp && onTopUp();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.diamondEmoji}>💎</Text>
              <Text style={styles.balanceNum}>
                {activeBalance.toLocaleString()}
              </Text>
              <MaterialCommunityIcons name="chevron-right" size={16} color="#94A3B8" />
            </TouchableOpacity>

            {/* CENTER: Quantity Selector [- 1 +] */}
            <View style={styles.quantityStepper}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => handleStepQuantity(-1)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="minus" size={14} color="#94A3B8" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.stepperPill}
                onPress={() => setQuantityPickerOpen((prev) => !prev)}
                activeOpacity={0.8}
              >
                <Text style={styles.stepperPillText}>{selectedQuantity}</Text>
                <MaterialCommunityIcons
                  name={quantityPickerOpen ? 'chevron-down' : 'chevron-up'}
                  size={12}
                  color="#94A3B8"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => handleStepQuantity(1)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="plus" size={14} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* RIGHT: SEND Button (Continuous Tap-Tap Supported) */}
            <Animated.View style={{ transform: [{ scale: sendBtnScale }] }}>
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  !isAffordable && styles.sendButtonDisabled,
                ]}
                onPress={handlePressSend}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={
                    isAffordable
                      ? (comboCount > 1 ? ['#FF007A', '#F59E0B'] : ['#FDE047', '#EAB308'])
                      : ['#475569', '#334155']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.sendButtonGradient}
                >
                  <Text
                    style={[
                      styles.sendButtonText,
                      !isAffordable && { color: '#94A3B8' },
                      comboCount > 1 && { color: '#FFFFFF', fontWeight: '900' },
                    ]}
                  >
                    {comboCount > 1 ? `x${comboCount} SEND` : 'SEND'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>

        {/* Confirmation Modal for high-value gifts */}
        <GiftConfirmationModal
          visible={confirmationPending}
          gift={selectedGift}
          quantity={selectedQuantity}
          receivers={selectedReceivers}
          totalDiamonds={currentCost}
          currentBalance={activeBalance}
          onConfirm={confirmSend}
          onCancel={cancelConfirmation}
        />

        {/* Insufficient Diamonds Modal */}
        <InsufficientBalanceModal
          visible={insufficientModalVisible}
          requiredDiamonds={currentCost}
          availableDiamonds={activeBalance}
          onTopUp={() => {
            setInsufficientModalVisible(false);
            onClose();
            onTopUp && onTopUp();
          }}
          onCancel={() => setInsufficientModalVisible(false)}
        />

        {/* Gift History Modal */}
        <GiftHistoryModal
          visible={historyModalVisible}
          onClose={() => setHistoryModalVisible(false)}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropTouch: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  sheetContainer: {
    width: '100%',
    backgroundColor: '#0A0F1D',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SHEET_HEIGHT,
    minHeight: 520,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 20,
  },
  handleContainer: {
    width: '100%',
    paddingVertical: 7,
    alignItems: 'center',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#475569',
  },
  recipientPromptBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(250, 204, 21, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginHorizontal: 14,
    borderRadius: 8,
    gap: 6,
    marginBottom: 4,
  },
  recipientPromptText: {
    color: '#FACC15',
    fontSize: 11,
    fontWeight: '700',
  },
  gridContainer: {
    flex: 1,
    minHeight: 240,
  },
  gridScrollView: {
    flex: 1,
  },
  gridContent: {
    paddingHorizontal: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingTop: 6,
    paddingBottom: 8,
  },
  loadingBox: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyGrid: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyGridText: {
    color: '#64748B',
    fontSize: 12,
  },
  quantityPopover: {
    position: 'absolute',
    bottom: 64,
    alignSelf: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 12,
    zIndex: 60,
  },
  popoverTitle: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  quantityChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 190,
    gap: 6,
    justifyContent: 'center',
  },
  popoverChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  popoverChipSelected: {
    backgroundColor: '#FACC15',
    borderColor: '#FACC15',
  },
  popoverChipText: {
    color: '#CBD5E1',
    fontSize: 11.5,
    fontWeight: '700',
  },
  popoverChipTextSelected: {
    color: '#0F172A',
    fontWeight: '900',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: 'rgba(10, 15, 29, 0.95)',
  },
  balancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 4,
  },
  diamondEmoji: {
    fontSize: 12,
  },
  balanceNum: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '800',
  },
  quantityStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  stepperBtn: {
    paddingHorizontal: 8,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 7,
    gap: 3,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  stepperPillText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '800',
    minWidth: 16,
    textAlign: 'center',
  },
  sendButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#FACC15',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 5,
  },
  sendButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  sendButtonGradient: {
    paddingHorizontal: 22,
    paddingVertical: 8.5,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 76,
  },
  sendButtonText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
