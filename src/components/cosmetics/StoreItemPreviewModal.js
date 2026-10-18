import React from 'react';
import { Image, Modal, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AvatarWithFrame from '../AvatarWithFrame';
import CosmeticAsset from './CosmeticAsset';
import CosmeticFormatBadge from './CosmeticFormatBadge';
import DurationPicker from './DurationPicker';
import { getUserAvatar } from '../../utils/avatarUtil';
import { formatCompactBalance } from '../../utils/numberUtil';

export default function StoreItemPreviewModal({ visible, onClose, onRecharge, item, activeCategory, user, priceOptions, selectedDurationDays, onSelectDuration, price, diamonds, onConfirmPurchase, purchasing, styles }) {
  return (
<Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.previewModalDialog}>
            {/* Modal Header */}
            <View style={styles.previewModalHeader}>
              <CosmeticFormatBadge
                item={item}
                containerStyle={styles.previewFormatTag}
                textStyle={styles.previewFormatTagText}
              />
              <TouchableOpacity
                onPress={() => onClose()}
                style={styles.previewModalCloseBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Central Animated Preview Box */}
            <View style={styles.previewShowcaseBox}>
              {activeCategory === 'Frames' ? (
                <View style={styles.popupFrameWrap}>
                  {(item?.animationUrl || !(item?.coverImageUrl || item?.imageUrl || item?.image)) ? (
                    <AvatarWithFrame
                      user={user}
                      frame={item}
                      size={110}
                      showOnlineDot={false}
                    />
                  ) : (
                    <Image
                      source={{ uri: item.coverImageUrl || item.imageUrl || item.image }}
                      style={styles.popupGenericAsset}
                      resizeMode="contain"
                    />
                  )}
                </View>
              ) : activeCategory === 'Entry' ? (
                <LinearGradient
                  colors={['#0F0C20', '#1E1435', '#2E1065']}
                  style={styles.popupEntryBox}
                >
                  <CosmeticAsset item={item} style={styles.popupEntryAsset} />
                </LinearGradient>
              ) : activeCategory === 'Mic Wave' ? (
                <View style={styles.popupMicBox}>
                  <View style={[styles.popupMicRingOuter, { borderColor: `${item?.previewColor || '#F59E0B'}50` }]}>
                    <View style={[styles.popupMicRingInner, { borderColor: `${item?.previewColor || '#F59E0B'}80` }]}>
                      <Image source={getUserAvatar(user)} style={styles.popupMicAvatar} />
                    </View>
                  </View>
                  <View style={[styles.popupMicIconBadge, { backgroundColor: item?.previewColor || '#F59E0B' }]}>
                    <MaterialCommunityIcons name="microphone" size={16} color="#FFFFFF" />
                  </View>
                </View>
              ) : activeCategory === 'Chat Bubble' ? (
                <View style={styles.popupBubbleBox}>
                  <Image source={getUserAvatar(user)} style={styles.popupBubbleAvatar} />
                  <View style={[styles.popupBubbleMsg, { backgroundColor: item?.bgColor || '#4F46E5' }]}>
                    <Text style={[styles.popupBubbleMsgText, { color: item?.textColor || '#FFFFFF' }]}>
                      Hello from Yaro Voice Club! ✨
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.popupGenericBox}>
                  <CosmeticAsset item={item} style={styles.popupGenericAsset} />
                </View>
              )}
            </View>

            {/* Item Title & Tag */}
            <View style={styles.previewTitleRow}>
              <Text style={styles.previewModalItemTitle} numberOfLines={1}>{item?.name}</Text>
              {item?.tag ? (
                <View style={styles.previewCategoryBadge}>
                  <Text style={styles.previewCategoryBadgeText}>{item.tag}</Text>
                </View>
              ) : null}
            </View>

            {/* Description */}
            <Text style={styles.previewModalItemDesc} numberOfLines={2}>
              {item?.desc || 'Exclusive store item for your profile and party voice rooms.'}
            </Text>

            {/* Duration Selector */}
            <Text style={styles.previewDurationLabel}>SELECT DURATION</Text>
            <DurationPicker
              options={priceOptions}
              selectedDays={selectedDurationDays}
              onSelect={onSelectDuration}
              compactPrices
            />

            {/* Price & Balance Row */}
            <View style={styles.previewBalanceRow}>
              <View style={styles.previewPriceCol}>
                <Text style={styles.previewPriceLabel}>Cost:</Text>
                <View style={styles.previewPriceValueWrap}>
                  <Icon name="diamond" size={14} color="#06B6D4" style={{ marginRight: 4 }} />
                  <Text style={styles.previewPriceValueText}>
                    {price === 0 ? 'FREE' : `${formatCompactBalance(price)} Diamonds`}
                  </Text>
                </View>
              </View>
              <View style={styles.previewBalanceCol}>
                <Text style={styles.previewBalanceLabel}>My Balance:</Text>
                <Text style={styles.previewBalanceValueText}>
                  {formatCompactBalance(diamonds)} 💎
                </Text>
              </View>
            </View>

            {/* Buy / Recharge Action Button */}
            {diamonds >= price ? (
              <TouchableOpacity
                style={styles.previewActionBtn}
                onPress={onConfirmPurchase}
                disabled={purchasing}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={['#7C3AED', '#EC4899']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.previewActionGradient}
                >
                  <Icon name="bag-check" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.previewActionBtnText}>
                    {purchasing ? 'Unlocking Item...' : price === 0 ? 'Unlock Free' : `Unlock for ${formatCompactBalance(price)} Diamonds`}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.previewActionBtn} onPress={onRecharge} activeOpacity={0.88}>
                <LinearGradient
                  colors={['#F59E0B', '#EF4444']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.previewActionGradient}
                >
                  <Icon name="wallet" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.previewActionBtnText}>
                    Recharge Diamonds (Need {(price - diamonds).toLocaleString()} more)
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
  );
}
