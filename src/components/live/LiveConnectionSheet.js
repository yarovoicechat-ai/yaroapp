import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

export default function LiveConnectionSheet({ visible, onClose, preview, camera, muted,
  mirrored, beauty, onBeauty, onCamera, onMute, onRotate, onMirror, onRequest, pending, bottomPadding = 0 }) {
  const { height } = useWindowDimensions();
  const controls = [
    ['Camera', camera ? 'videocam-outline' : 'videocam-off-outline', onCamera],
    ['Beauty', 'sparkles-outline', onBeauty],
    ['Rotate', 'camera-reverse-outline', onRotate],
    [muted ? 'Unmute' : 'Mute', muted ? 'mic-off-outline' : 'mic-outline', onMute],
    ['Mirror', 'swap-horizontal-outline', onMirror],
  ];
  return <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
    <View style={s.backdrop}>
      <TouchableOpacity accessibilityLabel="Close connection preview" style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={[s.sheet, { paddingBottom: bottomPadding + 12 }]}>
        <View style={[s.preview, { height: Math.min(height * 0.42, 370) }]}>
          {camera ? preview : <View style={s.off}><Icon name="videocam-off-outline" size={42} color="#fff" /><Text style={s.label}>Camera off</Text></View>}
        </View>
        <View style={s.controls}>{controls.map(([label, icon, action]) =>
          <TouchableOpacity key={label} accessibilityLabel={label} accessibilityState={{ selected: label === 'Mirror' && mirrored }} onPress={action} style={s.control}>
            <View style={[s.icon, ((label === 'Mirror' && mirrored) || (label === 'Beauty' && beauty)) && s.active]}><Icon name={icon} color="#eee" size={24} /></View>
            <Text style={s.label}>{label}</Text>
          </TouchableOpacity>)}</View>
        <TouchableOpacity accessibilityRole="button" disabled={pending} onPress={onRequest} style={[s.request, pending && s.pending]}>
          <Text style={s.requestText}>{pending ? 'Request sent · waiting for host' : 'Connection Request'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>;
}
const s = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#0005' },
  sheet: { backgroundColor: '#10091F', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16 },
  preview: { overflow: 'hidden', borderRadius: 6, backgroundColor: '#099E9E' },
  off: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  controls: { flexDirection: 'row', paddingVertical: 18, justifyContent: 'space-around' },
  control: { alignItems: 'center', gap: 7 },
  icon: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#ffffff10', alignItems: 'center', justifyContent: 'center' },
  active: { backgroundColor: '#00DDBB55' },
  label: { color: '#eee', fontSize: 12 },
  request: { backgroundColor: '#00E6C3', borderRadius: 24, paddingVertical: 14, alignItems: 'center' },
  pending: { opacity: 0.6 },
  requestText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
