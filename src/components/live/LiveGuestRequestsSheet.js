import React from 'react';
import { View, Text, Modal, ScrollView, Image, TouchableOpacity, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { getUserAvatar } from '../../utils/avatarUtil';

export default function LiveGuestRequestsSheet({
  visible,
  requests,
  onClose,
  onRespond,
  isPK = false,
  onTogglePK,
  bottomPadding,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={s.backdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="Close requests"
        />
        <View style={[s.sheet, { paddingBottom: bottomPadding + 20 }]}>
          {/* PK Battle Quick Control Section */}
          <View style={s.pkSection}>
            <View style={s.pkHeaderRow}>
              <Text style={s.pkTitle}>⚔️ PK Battle</Text>
              <Text style={s.pkStatus}>
                {isPK ? '🔴 Active Battle' : '⚪ Idle'}
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onTogglePK}
              style={s.pkButton}
            >
              <LinearGradient
                colors={isPK ? ['#EF4444', '#DC2626'] : ['#EC4899', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.pkGradient}
              >
                <Icon
                  name={isPK ? 'close-circle' : 'flash'}
                  size={18}
                  color="#FFF"
                />
                <Text style={s.pkButtonText}>
                  {isPK ? 'End PK Battle' : 'Start PK Match'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <Text style={s.title}>Connection requests</Text>
          <ScrollView style={s.list}>
            {!requests.length && (
              <Text style={s.empty}>
                Your viewers can request to join you here.
              </Text>
            )}
            {requests.map(user => (
              <View key={user.id} style={s.row}>
                <Image source={getUserAvatar(user)} style={s.avatar} />
                <Text style={s.name} numberOfLines={1}>
                  {user.name || 'Viewer'}
                </Text>
                <TouchableOpacity
                  onPress={() => onRespond(user.id, false)}
                  style={s.decline}
                >
                  <Text style={s.white}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onRespond(user.id, true)}
                  style={s.accept}
                >
                  <Text style={s.white}>Accept</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#0007' },
  sheet: {
    backgroundColor: '#10091F',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  pkSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  pkHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  pkTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  pkStatus: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
  },
  pkButton: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  pkGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    gap: 8,
  },
  pkButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  title: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 16 },
  list: { maxHeight: 260 },
  empty: { color: '#AD9DBE', textAlign: 'center', paddingVertical: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  name: { flex: 1, color: '#fff', fontSize: 13 },
  decline: { padding: 10, borderRadius: 18, backgroundColor: '#ffffff15' },
  accept: { padding: 10, borderRadius: 18, backgroundColor: '#00BDA5' },
  white: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
