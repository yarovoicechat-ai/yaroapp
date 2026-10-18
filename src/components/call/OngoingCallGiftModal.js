import React from 'react';
import { ActivityIndicator, FlatList, Image, Modal, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import GiftMedia from '../GiftMedia';
import { resolveGiftVisual } from '../gift/giftMediaUtils';

const QUANTITIES = [1, 5, 10, 52, 99, 520, 1314];

export default function OngoingCallGiftModal({
  visible,
  onClose,
  bottomPadding,
  user,
  categories,
  activeTab,
  onTabChange,
  loading,
  allGifts,
  selectedGift,
  onSelectGift,
  selectedQuantity,
  onSelectQuantity,
  quantityMenuVisible,
  onToggleQuantityMenu,
  onCloseQuantityMenu,
  onSend,
  styles,
}) {
  const filteredGifts = activeTab.toLowerCase() === 'all'
    ? allGifts
    : allGifts.filter((gift) => {
      const category = typeof gift.category === 'string' ? gift.category : gift.category?.name || '';
      return category.toLowerCase() === activeTab.toLowerCase();
    });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <LinearGradient
          colors={['#11052C', '#0E093D']}
          style={[styles.modalContent, { paddingBottom: bottomPadding }]}
        >
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderTitleRow}>
              <Text style={styles.modalTitle}>Choose a Gift</Text>
              <View style={styles.modalCoinBadge}>
                <Icon name="bitcoin" size={14} color="#FFD700" />
                <Text style={styles.modalCoinBadgeText}>{Number(user?.diamonds || 0).toLocaleString()}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Icon name="close-circle" size={24} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          </View>

          <View style={styles.categoriesTabBar}>
            {categories.map((tab) => {
              const active = activeTab.toLowerCase() === tab.toLowerCase();
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.categoryTabButton, active && styles.categoryTabButtonActive]}
                  onPress={() => onTabChange(tab)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.categoryTabText, active && styles.categoryTabTextActive]}>{tab}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#03dcfe" style={styles.modalLoader} />
          ) : filteredGifts.length === 0 ? (
            <View style={styles.modalEmptyState}>
              <Icon name="gift-off-outline" size={40} color="rgba(255,255,255,0.3)" />
              <Text style={styles.modalEmptyText}>No gifts in this category</Text>
            </View>
          ) : (
            <FlatList
              data={filteredGifts}
              numColumns={4}
              keyExtractor={(item) => String(item._id || item.id)}
              renderItem={({ item }) => {
                const visual = resolveGiftVisual(item);
                const selected = String(selectedGift?._id || selectedGift?.id) === String(item._id || item.id);
                return (
                  <TouchableOpacity
                    style={[styles.popupGiftItem, selected && styles.selectedPopupGiftItem]}
                    onPress={() => onSelectGift(item)}
                    activeOpacity={0.8}
                  >
                    {item.animationUrl || visual.giftImage ? (
                      <GiftMedia source={item.animationUrl || visual.giftImage} mediaType={item.mediaType} style={styles.popupGiftIcon} resizeMode="contain" />
                    ) : visual.giftIcon ? (
                      <Text style={{ fontSize: 32 }}>{visual.giftIcon}</Text>
                    ) : (
                      <Icon name="gift" size={30} color="#FBBF24" />
                    )}
                    <View style={styles.popupGiftDetails}>
                      <Text style={styles.popupGiftName}>{item.name}</Text>
                      <View style={styles.popupGiftCostRow}>
                        <Image source={require('../../assets/icons/diamond.png')} style={{ width: 14, height: 14, marginRight: 4 }} resizeMode="contain" />
                        <Text style={styles.popupGiftCost}>{item.price ?? item.cost ?? item.priceDiamonds ?? 0}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={styles.popupGiftGrid}
              showsVerticalScrollIndicator={false}
            />
          )}

          <View style={styles.modalBottomBar}>
            <View style={styles.quantityPickerContainer}>
              <TouchableOpacity style={styles.quantityPickerBtn} onPress={onToggleQuantityMenu} activeOpacity={0.8}>
                <Text style={styles.quantityPickerText}>x{selectedQuantity}</Text>
                <Icon name={quantityMenuVisible ? 'chevron-down' : 'chevron-up'} size={16} color="#fff" />
              </TouchableOpacity>
              {quantityMenuVisible && (
                <View style={styles.qtyDropdownMenu}>
                  {QUANTITIES.map((quantity) => (
                    <TouchableOpacity
                      key={quantity}
                      style={styles.qtyDropdownItem}
                      onPress={() => { onSelectQuantity(quantity); onCloseQuantityMenu(); }}
                    >
                      <Text style={[styles.qtyDropdownItemText, selectedQuantity === quantity && styles.qtyDropdownItemActive]}>x{quantity}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            <TouchableOpacity
              style={[styles.modalSendBtn, !selectedGift && styles.modalSendBtnDisabled]}
              disabled={!selectedGift}
              onPress={onSend}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={selectedGift ? ['#FF3366', '#CB11F5'] : ['#4A4A6A', '#2E2E48']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalSendBtnGradient}
              >
                <Text style={styles.modalSendBtnText}>
                  Send ({selectedGift ? Number(selectedGift.price ?? selectedGift.cost ?? selectedGift.priceDiamonds ?? 0) * selectedQuantity : 0})
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
}
