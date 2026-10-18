import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LevelRewardThumbnail from './LevelRewardThumbnail';

export default function RewardPreviewModal({
  item,
  onClose,
  isWealth,
  getRewardState,
  claimLoading,
  onClaim,
  onEquip,
  styles,
}) {
  if (!item) return null;

  const rewardState = getRewardState(item);
  const locked = rewardState === 'LOCKED';
  const accentColor = isWealth ? '#F59E0B' : '#EC4899';

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
        <View style={styles.previewCard}>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn} activeOpacity={0.7}>
            <Icon name="close" size={22} color="#94A3B8" />
          </TouchableOpacity>

          <Text style={styles.previewModalKicker}>{isWealth ? 'WEALTH' : 'CHARM'} LEVEL REWARD PREVIEW</Text>
          <View style={styles.enlargedArtworkBox}>
            <LevelRewardThumbnail item={item} size={110} />
          </View>

          <Text style={styles.previewTitleText}>{item.name}</Text>
          <Text style={styles.previewCategoryText}>
            {item.categoryName} â€¢{' '}
            {item.durationDays === 0 ? 'Permanent Reward' : `${item.durationDays} Days Duration`}
          </Text>
          {Boolean(item.description) && <Text style={styles.previewDescText}>{item.description}</Text>}

          <View style={[styles.previewStatusBanner, locked ? styles.previewStatusBannerLocked : styles.previewStatusBannerUnlocked]}>
            <Icon name={locked ? 'lock-closed' : 'checkmark-circle'} size={18} color={locked ? '#94A3B8' : '#10B981'} />
            <Text style={[styles.previewStatusBannerText, { color: locked ? '#CBD5E1' : '#34D399' }]}>
              {locked
                ? `Reach ${isWealth ? 'Wealth' : 'Charm'} Lv.${item.requiredLevel} to unlock this exclusive perk.`
                : 'Reward is Unlocked and ready to use!'}
            </Text>
          </View>

          <View style={styles.modalCtaRow}>
            {rewardState === 'UNLOCKED' && (
              <TouchableOpacity style={[styles.modalPrimaryBtn, { backgroundColor: accentColor }]} onPress={() => onClaim(item)} disabled={claimLoading}>
                {claimLoading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.modalPrimaryBtnText}>Claim Reward</Text>}
              </TouchableOpacity>
            )}
            {rewardState === 'CLAIMED' && (
              <TouchableOpacity style={[styles.modalPrimaryBtn, { backgroundColor: accentColor }]} onPress={() => onEquip(item, true)} disabled={claimLoading}>
                {claimLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalPrimaryBtnText}>{item.uniqueIdInventoryOnly ? 'Open My Items' : 'Equip Now'}</Text>
                )}
              </TouchableOpacity>
            )}
            {rewardState === 'EQUIPPED' && (
              <TouchableOpacity style={styles.modalUnequipBtn} onPress={() => onEquip(item, false)} disabled={claimLoading}>
                <Text style={styles.modalUnequipBtnText}>Unequip</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
