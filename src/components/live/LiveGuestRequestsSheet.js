import React from 'react';
import { View, Text, Modal, ScrollView, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { getUserAvatar } from '../../utils/avatarUtil';

export default function LiveGuestRequestsSheet({ visible, requests, onClose, onRespond, bottomPadding }) {
  return <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
    <View style={s.backdrop}>
      <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close requests" />
      <View style={[s.sheet, { paddingBottom: bottomPadding + 20 }]}>
        <Text style={s.title}>Connection requests</Text>
        <ScrollView style={s.list}>
          {!requests.length && <Text style={s.empty}>Your viewers can request to join you here.</Text>}
          {requests.map(user => <View key={user.id} style={s.row}>
            <Image source={getUserAvatar(user)} style={s.avatar} /><Text style={s.name} numberOfLines={1}>{user.name || 'Viewer'}</Text>
            <TouchableOpacity onPress={() => onRespond(user.id, false)} style={s.decline}><Text style={s.white}>Decline</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => onRespond(user.id, true)} style={s.accept}><Text style={s.white}>Accept</Text></TouchableOpacity>
          </View>)}
        </ScrollView>
      </View>
    </View>
  </Modal>;
}
const s = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#0007' },
  sheet: { backgroundColor: '#10091F', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  title: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 20 }, list: { maxHeight: 320 },
  empty: { color: '#AD9DBE', textAlign: 'center', paddingVertical: 35 }, row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  avatar: { width: 36, height: 36, borderRadius: 18 }, name: { flex: 1, color: '#fff', fontSize: 13 },
  decline: { padding: 10, borderRadius: 18, backgroundColor: '#ffffff15' },
  accept: { padding: 10, borderRadius: 18, backgroundColor: '#00BDA5' }, white: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
