import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import IonIcon from 'react-native-vector-icons/Ionicons';

export default function AvatarSourceModal({ visible, onClose, onSelectSource, styles }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.modalContentCard}>
          <View style={styles.modalHandleBar} />
          <Text style={styles.modalHeading}>Change Profile Photo</Text>
          <Text style={styles.modalSubheading}>Select a source to instantly update your avatar</Text>
          <View style={styles.modalOptionsGrid}>
            <TouchableOpacity style={styles.modalTile} activeOpacity={0.8} onPress={() => onSelectSource('camera')}>
              <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.modalTileIconBox}>
                <Icon name="photo-camera" size={24} color="#FFFFFF" />
              </LinearGradient>
              <View style={styles.modalTileTextWrap}>
                <Text style={styles.modalTileTitle}>Take Live Photo</Text>
                <Text style={styles.modalTileDesc}>Open camera for a quick selfie</Text>
              </View>
              <IonIcon name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalTile} activeOpacity={0.8} onPress={() => onSelectSource('gallery')}>
              <LinearGradient colors={['#EC4899', '#D946EF']} style={styles.modalTileIconBox}>
                <Icon name="photo-library" size={24} color="#FFFFFF" />
              </LinearGradient>
              <View style={styles.modalTileTextWrap}>
                <Text style={styles.modalTileTitle}>Choose From Gallery</Text>
                <Text style={styles.modalTileDesc}>Select from photos on device</Text>
              </View>
              <IonIcon name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.modalCancelButton} activeOpacity={0.7} onPress={onClose}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
