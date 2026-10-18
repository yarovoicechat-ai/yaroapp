import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import CosmeticAsset from './CosmeticAsset';

export default function StoreBundleDetailModal({ visible, onClose, item, category, isFreeItem, onOpenPurchase, styles }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalDialog}>
          <TouchableOpacity onPress={onClose} style={styles.detailClose}>
            <Icon name="close" size={22} color="#64748B" />
          </TouchableOpacity>
          <View style={styles.detailPreview}>
            {item?.animationUrl || item?.imageUrl ? (
              <CosmeticAsset item={item} style={styles.detailAsset} />
            ) : (
              <MaterialCommunityIcons name="crown" size={58} color={item?.previewColor || '#F59E0B'} />
            )}
          </View>
          <Text style={styles.modalTitle}>{item?.name}</Text>
          <Text style={styles.modalSub}>{item?.desc}</Text>
          <Text style={styles.detailHeading}>Included with this {category} item</Text>
          {(item?.benefits?.length ? item.benefits : [item?.desc || 'Premium membership']).map((benefit, index) => (
            <View key={`${index}-${benefit}`} style={styles.detailBenefitRow}>
              <Icon name="checkmark-circle" size={17} color="#10B981" />
              <Text style={styles.detailBenefitText}>{benefit}</Text>
            </View>
          ))}
          <TouchableOpacity style={styles.detailBuyButton} onPress={() => { onClose(); onOpenPurchase(item); }}>
            <Text style={styles.modalConfirmText}>{isFreeItem(item) ? 'Unlock Free' : 'Choose Duration & Buy'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
