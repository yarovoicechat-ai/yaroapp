import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Text,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';

const QUICK_EMOJIS = ['❤️', '🔥', '👏', '🌹', '😍', '✨', '👑', '🎉'];

export default function LiveChatInputModal({
  visible,
  onClose,
  onSendMessage,
}) {
  const [text, setText] = useState('');

  if (!visible) return null;

  const handleSend = () => {
    if (!text.trim()) return;
    onSendMessage && onSendMessage(text.trim());
    setText('');
    onClose && onClose();
  };

  const handleEmojiPress = emoji => {
    setText(prev => prev + emoji);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.inputContainer}>
          {/* Quick Emoji Bar */}
          <View style={styles.emojiRow}>
            {QUICK_EMOJIS.map(em => (
              <TouchableOpacity
                key={em}
                onPress={() => handleEmojiPress(em)}
                style={styles.emojiBtn}
              >
                <Text style={styles.emojiText}>{em}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Text Input Row */}
          <View style={styles.inputRow}>
            <TextInput
              autoFocus
              value={text}
              onChangeText={setText}
              placeholder="Say something nice..."
              placeholderTextColor="#94A3B8"
              maxLength={150}
              returnKeyType="send"
              onSubmitEditing={handleSend}
              style={styles.input}
            />

            <TouchableOpacity
              disabled={!text.trim()}
              onPress={handleSend}
              style={[styles.sendBtn, !text.trim() && { opacity: 0.5 }]}
            >
              <LinearGradient
                colors={['#EC4899', '#DB2777']}
                style={styles.sendGradient}
              >
                <Icon name="send" size={16} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  inputContainer: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 16,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  emojiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  emojiBtn: {
    padding: 4,
  },
  emojiText: {
    fontSize: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    color: '#FFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sendBtn: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  sendGradient: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
