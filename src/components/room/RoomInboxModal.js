import React from 'react';
import { Modal, View, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ChatListScreen from '../../screens/chats/chatList';

export default function RoomInboxModal({ visible, onClose }) {
  const navigation = useNavigation();
  if (!visible) return null;

  return (
    <Modal
      visible={Boolean(visible)}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <TouchableOpacity
          style={styles.backdropTouch}
          onPress={onClose}
          activeOpacity={1}
          accessibilityLabel="Close inbox"
        />
        <View style={styles.sheetContainer}>
          <View style={styles.sheetHandle} />
          <ChatListScreen
            embedded
            onClose={onClose}
            onNavigate={(name, params) => {
              onClose?.();
              requestAnimationFrame(() => navigation.navigate(name, params));
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  backdropTouch: {
    flex: 1,
  },
  sheetContainer: {
    height: '86%',
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 20,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
});
