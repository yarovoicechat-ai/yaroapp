import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';

const EMOJI_LIST = [
  '❤️', '🔥', '👍', '🎉', '😂', '😍', '✨', '👑',
  '🌸', '🌹', '💯', '🥳', '😎', '💃', '🕺', '⭐',
  '🚀', '💎', '🥂', '🍀', '🦋', '💖', '🙌', '🤩',
];

export default function RoomEmojiModal({
  visible,
  onClose,
  onSelectEmoji,
  bottomSafePadding = 16,
}) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={[styles.sheetContainer, { paddingBottom: bottomSafePadding + 16 }]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Reactions</Text>

          <ScrollView
            contentContainerStyle={styles.emojiGrid}
            showsVerticalScrollIndicator={false}
          >
            {EMOJI_LIST.map((emoji, idx) => (
              <TouchableOpacity
                key={`emoji-${idx}`}
                style={styles.emojiBtn}
                onPress={() => {
                  onClose();
                  onSelectEmoji && onSelectEmoji(emoji);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    width: '100%',
    backgroundColor: '#121422',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 16,
    maxHeight: 320,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#334155',
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#94A3B8',
    marginBottom: 12,
    textAlign: 'center',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 12,
    paddingBottom: 10,
  },
  emojiBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1E2338',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  emojiText: {
    fontSize: 24,
  },
});
