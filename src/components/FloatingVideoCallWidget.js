import React, { useRef } from 'react';
import { Animated, PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCall } from '../context/CallContext';

export default function FloatingVideoCallWidget() {
  const { activeCall } = useCall();
  const insets = useSafeAreaInsets();
  const position = useRef(new Animated.ValueXY()).current;
  const drag = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) + Math.abs(gesture.dy) > 8,
    onPanResponderGrant: () => {
      position.extractOffset();
    },
    onPanResponderMove: Animated.event([null, { dx: position.x, dy: position.y }], { useNativeDriver: false }),
    onPanResponderRelease: () => position.flattenOffset(),
  })).current;
  if (activeCall?.type !== 'video' || !activeCall.isMinimized) return null;
  const seconds = Number(activeCall.timer || 0);
  const time = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  return (
    <Animated.View {...drag.panHandlers} style={[styles.bubble, { top: insets.top + 80, transform: position.getTranslateTransform() }]}>
      <TouchableOpacity onPress={activeCall.onExpand} accessibilityLabel="Return to video call" style={styles.restore}>
        <Icon name="videocam" size={24} color="#67E8F9" />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{activeCall.name}</Text>
          <Text style={styles.timer}>{time} · Tap to return</Text>
        </View>
        <Icon name="expand-outline" size={18} color="#FFFFFF" />
      </TouchableOpacity>
      <View style={styles.controls}>
        <TouchableOpacity onPress={activeCall.onToggleMute} accessibilityLabel={activeCall.isMuted ? 'Unmute video call' : 'Mute video call'} style={styles.button}>
          <Icon name={activeCall.isMuted ? 'mic-off' : 'mic'} size={21} color={activeCall.isMuted ? '#FDA4AF' : '#FFFFFF'} />
        </TouchableOpacity>
        <TouchableOpacity onPress={activeCall.onEndCall} accessibilityLabel="End video call" style={[styles.button, styles.end]}>
          <Icon name="call" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bubble: { position: 'absolute', right: 16, width: 220, borderRadius: 20, padding: 12, backgroundColor: '#180D35', borderWidth: 1, borderColor: '#8B5CF6', elevation: 30, zIndex: 9999 },
  restore: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  info: { flex: 1 },
  name: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  timer: { color: '#C4B5FD', fontSize: 11, marginTop: 4 },
  controls: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
  button: { borderRadius: 20, paddingVertical: 8, paddingHorizontal: 25, backgroundColor: '#392355' },
  end: { backgroundColor: '#E11D48' },
});
