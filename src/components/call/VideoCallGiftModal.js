import React from 'react';
import { ActivityIndicator, FlatList, Image, Modal, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import GiftMedia from '../GiftMedia';
import { resolveGiftVisual } from '../gift/giftMediaUtils';

const QUANTITIES = [1, 5, 10, 52, 99, 520];

export default function VideoCallGiftModal({
  visible,
  onClose,
  onRecharge,
  name,
  user,
  bottomInset,
  categories,
  activeTab,
  onTabChange,
  loading,
  gifts,
  selectedGift,
  onSelectGift,
  selectedQuantity,
  onSelectQuantity,
  quantityMenuVisible,
  onToggleQuantityMenu,
  onCloseQuantityMenu,
  sending,
  onSend,
  styles,
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.giftModalBackdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity
          activeOpacity={1}
          style={[styles.giftModalSheet, { paddingBottom: Math.max(16, (bottomInset || 0) + 12) }]}
        >
          <LinearGradient colors={['#160832', '#0F0524']} style={StyleSheet.absoluteFillObject} />

          <View style={styles.giftModalHeader}>
            <View style={styles.giftHeaderLeft}>
              <Text style={styles.giftModalTitle}>Send Gift to {name}</Text>
              <View style={styles.diamondBadge}>
                <Image source={require('../../assets/icons/diamond.png')} style={styles.diamondIconSmall} resizeMode="contain" />
                <Text style={styles.diamondBadgeText}>{Number(user?.diamonds || 0).toLocaleString()}</Text>
              </View>
            </View>
            <View style={styles.giftHeaderRight}>
              <TouchableOpacity style={styles.rechargeBtnSmall} onPress={onRecharge} activeOpacity={0.8}>
                <LinearGradient colors={['#9333EA', '#7C3AED']} style={styles.rechargeGradient}>
                  <Text style={styles.rechargeTextSmall}>+ Recharge</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.giftCloseBtn} activeOpacity={0.7}>
                <Icon name="close" size={20} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.giftCategoriesBar}>
            {categories.map((tab) => {
              const active = activeTab.toLowerCase() === tab.toLowerCase();
              return (
                <TouchableOpacity key={tab} style={[styles.catTab, active && styles.catTabActive]} onPress={() => onTabChange(tab)} activeOpacity={0.8}>
                  <Text style={[styles.catTabText, active && styles.catTabTextActive]}>{tab}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#EC4899" style={{ marginVertical: 45 }} />
          ) : gifts.length === 0 ? (
            <View style={styles.emptyGiftsWrap}>
              <Icon name="gift-outline" size={40} color="rgba(255,255,255,0.25)" />
              <Text style={styles.emptyGiftsText}>No gifts in this category</Text>
            </View>
          ) : (
            <FlatList
              data={gifts}
              numColumns={4}
              keyExtractor={(item) => String(item._id || item.id)}
              contentContainerStyle={styles.giftsGridContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const active = String(selectedGift?._id || selectedGift?.id) === String(item._id || item.id);
                const visual = resolveGiftVisual(item);
                const price = item.price ?? item.cost ?? item.priceDiamonds ?? 0;
                return (
                  <TouchableOpacity style={[styles.giftCard, active && styles.giftCardSelected]} onPress={() => onSelectGift(item)} activeOpacity={0.85}>
                    <View style={styles.giftThumbWrap}>
                      {visual.giftImage ? (
                        <GiftMedia source={visual.giftImage} mediaType={item.mediaType} style={styles.giftThumb} />
                      ) : (
                        <Text style={styles.giftEmoji}>{visual.giftIcon || 'ðŸŽ'}</Text>
                      )}
                    </View>
                    <Text style={styles.giftItemName} numberOfLines={1}>{item.name}</Text>
                    <View style={styles.giftPriceRow}>
                      <Image source={require('../../assets/icons/diamond.png')} style={{ width: 11, height: 11, marginRight: 2 }} resizeMode="contain" />
                      <Text style={styles.giftItemPrice}>{price}</Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}

          <View style={styles.giftModalBottomRow}>
            <View style={styles.qtyContainer}>
              <TouchableOpacity style={styles.qtyPickerBtn} onPress={onToggleQuantityMenu} activeOpacity={0.8}>
                <Text style={styles.qtyPickerText}>x{selectedQuantity}</Text>
                <Icon name={quantityMenuVisible ? 'chevron-down' : 'chevron-up'} size={15} color="#fff" />
              </TouchableOpacity>
              {quantityMenuVisible && (
                <View style={styles.qtyMenu}>
                  {QUANTITIES.map((quantity) => (
                    <TouchableOpacity key={quantity} style={styles.qtyMenuItem} onPress={() => { onSelectQuantity(quantity); onCloseQuantityMenu(); }}>
                      <Text style={[styles.qtyMenuText, selectedQuantity === quantity && styles.qtyMenuTextActive]}>x{quantity}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            <TouchableOpacity
              style={[styles.sendGiftBtn, (!selectedGift || sending) && styles.sendGiftBtnDisabled]}
              disabled={!selectedGift || sending}
              onPress={onSend}
              activeOpacity={0.85}
            >
              <LinearGradient colors={selectedGift ? ['#FF2E93', '#7928CA'] : ['#3A3050', '#251F35']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.sendGiftGradient}>
                {sending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.sendGiftBtnText}>
                    Send ({selectedGift ? Number(selectedGift.price ?? selectedGift.cost ?? selectedGift.priceDiamonds ?? 0) * selectedQuantity : 0})
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
