import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';

export default function LanguageSelectionModal({ visible, onClose, languages, selectedLanguage, onSelect, styles }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose}>
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>Select Language</Text>
          <View style={styles.modalLanguages}>
            {languages.map((language) => (
              <TouchableOpacity
                key={language}
                style={[styles.langChip, selectedLanguage === language && styles.langChipActive]}
                onPress={() => onSelect(language)}
              >
                <Text style={[styles.langChipText, selectedLanguage === language && styles.langChipTextActive]}>
                  {language}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
