import React from 'react';
import { ActivityIndicator, Image, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import GiftMedia from '../GiftMedia';
import { resolveGiftVisual } from '../gift/giftMediaUtils';

export default function ChatGiftModal({
  visible,
  onClose,
  onRecharge,
  bottomInset,
  user,
  otherUser,
  categories,
  activeTab,
  onSelectTab,
  loading,
  gifts,
  selectedGift,
  onSelectGift,
  quantities,
  selectedQuantity,
  onSelectQuantity,
  sending,
  onSend,
  styles,
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.giftModalOverlay} activeOpacity={1} onPress={onClose}>
        <View
          style={[styles.giftModalContainer, { paddingBottom: Math.max(16, (bottomInset || 0) + 12) }]}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.giftModalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Icon name="card-giftcard" size={22} color="#fbbf24" style={{ marginRight: 6 }} />
              <Text style={styles.giftModalTitle}>Send Gift to {otherUser?.name || 'User'}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.giftBalanceRow}>
            <View style={styles.giftBalancePill}>
              <Image source={require('../../assets/icons/diamond.png')} style={{ width: 14, height: 14, marginRight: 4 }} resizeMode="contain" />
              <Text style={styles.giftBalanceText}>{user?.diamonds || 0} Diamonds</Text>
              <TouchableOpacity style={styles.rechargePlusBtn} onPress={onRecharge}>
                <Icon name="add-circle" size={18} color="#03dcfe" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.categoryTabsContainer}>
            {categories.map((category) => {
              const active = activeTab.toLowerCase() === category.toLowerCase();
              return (
                <TouchableOpacity key={category} style={[styles.categoryTab, active && styles.activeCategoryTab]} onPress={() => onSelectTab(category)}>
                  <Text style={[styles.categoryTabText, active && styles.activeCategoryTabText]}>{category}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <ScrollView contentContainerStyle={styles.giftsGridContainer} showsVerticalScrollIndicator={false}>
            {loading ? (
              <ActivityIndicator size="large" color="#03dcfe" style={{ marginVertical: 20, width: '100%' }} />
            ) : gifts.length === 0 ? (
              <Text style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginVertical: 20, width: '100%' }}>
                No gifts in this category
              </Text>
            ) : gifts.map((gift) => {
              const active = String(selectedGift?._id || selectedGift?.id) === String(gift._id || gift.id);
              const visual = resolveGiftVisual(gift);
              return (
                <TouchableOpacity
                  key={gift._id || gift.id}
                  style={[styles.giftGridCard, active && styles.selectedGiftCard]}
                  activeOpacity={0.8}
                  disabled={sending}
                  onPress={() => onSelectGift(gift)}
                >
                  <LinearGradient
                    colors={active ? ['rgba(3, 220, 254, 0.35)', 'rgba(251, 191, 36, 0.2)'] : ['rgba(251, 191, 36, 0.12)', 'rgba(3, 220, 254, 0.05)']}
                    style={styles.giftGridCardGradient}
                  >
                    {gift.animationUrl || visual.giftImage ? (
                      <GiftMedia source={gift.animationUrl || visual.giftImage} mediaType={gift.mediaType} style={styles.giftIconMedia} resizeMode="contain" />
                    ) : visual.giftIcon ? (
                      <Text style={{ fontSize: 30, marginBottom: 4 }}>{visual.giftIcon}</Text>
                    ) : (
                      <Icon name="card-giftcard" size={30} color="#FBBF24" style={{ marginBottom: 4 }} />
                    )}
                    <Text style={styles.giftCardName} numberOfLines={1}>{gift.name}</Text>
                    <View style={styles.giftCostTag}>
                      <Image source={require('../../assets/icons/diamond.png')} style={{ width: 10, height: 10, marginRight: 2 }} resizeMode="contain" />
                      <Text style={styles.giftCostTagText}>{gift.cost}</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {selectedGift && (
            <View style={styles.giftFooterBar}>
              <View style={styles.comboPillsContainer}>
                {quantities.map((quantity) => {
                  const active = selectedQuantity === quantity;
                  return (
                    <TouchableOpacity key={quantity} style={[styles.comboPill, active && styles.activeComboPill]} onPress={() => onSelectQuantity(quantity)}>
                      <Text style={[styles.comboPillText, active && styles.activeComboPillText]}>x{quantity}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity style={styles.sendGiftActionBtn} onPress={onSend} disabled={sending}>
                <LinearGradient colors={['#2911fe', '#03dcfe']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.sendGiftGradient}>
                  <Text style={styles.sendGiftBtnText}>
                    Send ({Number(selectedGift.price ?? selectedGift.cost ?? selectedGift.priceDiamonds ?? 0) * selectedQuantity} diamonds)
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {sending && (
            <View style={styles.sendingGiftOverlay}>
              <ActivityIndicator size="large" color="#03dcfe" />
              <Text style={{ color: '#fff', marginTop: 8, fontWeight: 'bold' }}>Sending Gift...</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
