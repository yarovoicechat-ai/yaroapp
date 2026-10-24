import React from 'react';
import { Modal, Text, TouchableOpacity, View, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';

export default function KingAssetPreviewModal({ visible, onClose, asset, styles }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.assetModalCard}>
          <LinearGradient colors={['#2A1807', '#150C03']} style={styles.assetModalGradient}>
            <View style={styles.assetModalIconCircle}>
              {asset?.image ? (
                <Image source={asset.image} style={{ width: 68, height: 68 }} resizeMode="contain" />
              ) : (
                <Icon name={asset?.icon === 'shield-star' ? 'shield-checkmark' : (asset?.icon || 'sparkles')} size={36} color="#FDE047" />
              )}
            </View>
            <Text style={styles.assetModalTitle}>{asset?.name}</Text>
            <Text style={styles.assetModalStatus}>
              {asset?.unlocked ? 'INCLUDED IN THIS RANK' : 'AVAILABLE AT A HIGHER RANK'}
            </Text>
            <Text style={styles.assetModalDesc}>{asset?.desc}</Text>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
              <Text style={styles.modalCloseText}>Got It</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
