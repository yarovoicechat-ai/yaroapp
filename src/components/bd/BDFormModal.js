import React from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';

export default function BDFormModal({
  visible,
  title,
  onClose,
  bottomSafePadding,
  form,
  onChange,
  fields,
  submitLabel,
  gradientColors,
  onSubmit,
  styles,
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalSheet, { paddingBottom: bottomSafePadding + 20 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {fields.map((field) => (
              <React.Fragment key={field.key || field.separatorLabel}>
                {field.separatorLabel ? <Text style={styles.orDividerText}>{field.separatorLabel}</Text> : null}
                {field.key ? (
                  <View>
                    <Text style={styles.inputLabel}>{field.label}</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder={field.placeholder}
                      placeholderTextColor="#94A3B8"
                      keyboardType={field.keyboardType}
                      autoCapitalize={field.autoCapitalize}
                      value={form[field.key]}
                      onChangeText={(value) => onChange(field.key, field.uppercase ? value.toUpperCase() : value)}
                    />
                  </View>
                ) : null}
              </React.Fragment>
            ))}

            <TouchableOpacity style={styles.modalSubmitBtn} onPress={onSubmit} activeOpacity={0.85}>
              <LinearGradient colors={gradientColors} style={styles.modalSubmitGradient}>
                <Text style={styles.modalSubmitText}>{submitLabel}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
