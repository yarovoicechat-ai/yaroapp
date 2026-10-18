import React from 'react';
import { FlatList, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

export default function ShortsCommentsModal({ visible, onClose, comments, value, onChange, onSubmit, styles }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.commentSheet}>
          <View style={styles.commentHeader}>
            <Text style={styles.commentTitle}>Comments ({comments.length})</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={comments}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.commentItem}>
                <Text style={styles.commentAuthor}>{item.user}</Text>
                <Text style={styles.commentBody}>{item.text}</Text>
              </View>
            )}
            style={{ maxHeight: 250 }}
          />
          <View style={styles.commentInputRow}>
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment..."
              placeholderTextColor="#94A3B8"
              value={value}
              onChangeText={onChange}
              onSubmitEditing={onSubmit}
            />
            <TouchableOpacity onPress={onSubmit} style={styles.commentPostBtn}>
              <Text style={styles.commentPostText}>Post</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
