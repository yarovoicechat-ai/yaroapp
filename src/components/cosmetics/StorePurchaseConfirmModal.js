import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import CosmeticAsset from './CosmeticAsset';
import DurationPicker from './DurationPicker';

export default function StorePurchaseConfirmModal({
  visible,
  onClose,
  item,
  priceOptions,
  selectedDurationDays,
  onSelectDuration,
  price,
  purchasing,
  onConfirm,
  styles,
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalDialog}>
          <View style={[styles.modalVisualWrap, { backgroundColor: `${item?.previewColor}20` }]}>
            {item?.animationUrl || item?.imageUrl ? (
              <CosmeticAsset item={item} style={styles.modalAsset} />
            ) : (
              <MaterialCommunityIcons name={item?.icon || 'gift'} size={46} color={item?.previewColor || '#7C3AED'} />
            )}
          </View>

          <Text style={styles.modalTitle}>Confirm Purchase</Text>
          <Text style={styles.modalSub}>
            Choose how long you want to unlock <Text style={{ fontWeight: '700', color: '#0F172A' }}>{item?.name}</Text>.
          </Text>

          <DurationPicker options={priceOptions} selectedDays={selectedDurationDays} onSelect={onSelectDuration} />

          <View style={styles.modalPriceRow}>
            <Text style={styles.modalPriceLabel}>Cost:</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Icon name="diamond" size={16} color="#06B6D4" style={{ marginRight: 4 }} />
              <Text style={styles.modalPriceValue}>{price === 0 ? 'FREE' : `${price.toLocaleString()} Diamonds`}</Text>
            </View>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalConfirmBtn} onPress={onConfirm} disabled={purchasing}>
              <LinearGradient colors={['#7C3AED', '#6D28D9']} style={styles.modalConfirmGradient}>
                <Text style={styles.modalConfirmText}>{purchasing ? 'Purchasing...' : 'Confirm & Unlock'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
