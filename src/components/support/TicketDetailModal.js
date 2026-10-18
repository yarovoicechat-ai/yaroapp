import React from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import IonIcon from 'react-native-vector-icons/Ionicons';

export default function TicketDetailModal({
  visible,
  onClose,
  topSafeInset,
  bottomInset,
  ticket,
  getStatusColor,
  getStatusLabel,
  replyText,
  onChangeReply,
  replyLoading,
  onSendReply,
  styles,
}) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.detailContainer}>
        <View style={[styles.detailHeader, { paddingTop: topSafeInset + 10 }]}>
          <TouchableOpacity onPress={onClose} style={styles.detailBackButton}>
            <IonIcon name="chevron-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.detailTitle}>{ticket?.ticketNumber || 'Ticket'}</Text>
            <Text style={styles.detailSubtitle} numberOfLines={1}>{ticket?.reason}</Text>
          </View>
          {ticket && (
            <View style={[styles.statusPill, { backgroundColor: `${getStatusColor(ticket.status)}18` }]}>
              <Text style={[styles.statusPillText, { color: getStatusColor(ticket.status) }]}>
                {getStatusLabel(ticket.status)}
              </Text>
            </View>
          )}
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
          {ticket && (
            <View style={styles.threadOriginalBox}>
              <View style={styles.threadMetaRow}>
                <Text style={styles.threadSender}>You (Original)</Text>
                <Text style={styles.threadTime}>{new Date(ticket.createdAt).toLocaleDateString()}</Text>
              </View>
              <Text style={styles.threadContent}>{ticket.message}</Text>
              {ticket.image ? <Image source={{ uri: ticket.image }} style={styles.threadAttachment} resizeMode="cover" /> : null}
            </View>
          )}

          {ticket?.replies?.map((reply, index) => (
            <View key={index} style={reply.sender === 'admin' ? styles.threadAdminBox : styles.threadUserBox}>
              <View style={styles.threadMetaRow}>
                <Text style={[styles.threadSender, reply.sender === 'admin' && { color: '#059669', fontWeight: '800' }]}>
                  {reply.sender === 'admin' ? 'ðŸ›¡ï¸ Yaro Care Team' : 'You'}
                </Text>
                <Text style={styles.threadTime}>{new Date(reply.createdAt).toLocaleDateString()}</Text>
              </View>
              <Text style={styles.threadContent}>{reply.message}</Text>
            </View>
          ))}
        </ScrollView>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={[styles.replyBar, { paddingBottom: Math.max(12, bottomInset + 8) }]}>
            <TextInput
              style={styles.replyInput}
              placeholder="Write a reply..."
              placeholderTextColor="#94A3B8"
              value={replyText}
              onChangeText={onChangeReply}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.replySendButton, (!replyText.trim() || replyLoading) && { opacity: 0.5 }]}
              onPress={onSendReply}
              disabled={!replyText.trim() || replyLoading}
            >
              {replyLoading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Icon name="send" size={18} color="#FFFFFF" />}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
