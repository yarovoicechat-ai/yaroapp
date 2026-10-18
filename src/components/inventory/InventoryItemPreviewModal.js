import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import CosmeticFormatBadge from '../cosmetics/CosmeticFormatBadge';

export default function InventoryItemPreviewModal({ visible, onClose, item, renderShowcase, equippableTypes, onToggleUse, styles }) {
  return (
<Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => onClose()}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalContent}
            onPress={(e) => e?.stopPropagation?.()}
          >
            {item && (
              <>
                <View style={styles.modalHeader}>
                  <View style={[styles.previewFormatTag, { backgroundColor: getFormatBadge(item).bg }]}>
                    <Text style={[styles.previewFormatTagText, { color: getFormatBadge(item).color }]}>
                      {getFormatBadge(item).label}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => onClose()}
                    style={styles.modalCloseBtn}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Icon name="close" size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalVisualCenter}>
                  {renderShowcase(item)}
                </View>

                <Text style={styles.modalTitle}>{item.name}</Text>

                <View style={styles.modalBadgeRow}>
                  <View style={styles.typeTag}>
                    <Text style={styles.typeTagText}>{item.type}</Text>
                  </View>
                  <View style={styles.validityTag}>
                    <Icon name="time-outline" size={13} color="#D97706" style={{ marginRight: 3 }} />
                    <Text style={styles.validityTagText}>{item.validity}</Text>
                  </View>
                </View>

                <Text style={styles.modalDescription}>
                  {item.description}
                </Text>

                {equippableTypes.includes(item.type) && (
                  <TouchableOpacity
                    activeOpacity={0.88}
                    style={[
                      styles.modalActionBtn,
                      item.inUse ? styles.modalActionBtnInUse : styles.modalActionBtnUse,
                    ]}
                    onPress={() => onToggleUse(item)}
                  >
                    <Text style={styles.modalActionBtnText}>
                      {item.inUse ? 'Currently Active on Profile' : 'Equip This Item'}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
  );
}
