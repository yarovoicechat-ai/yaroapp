import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

export default function LiveToolsBottomSheet({
  visible,
  onClose,
  isHost = false,
  muted = false,
  camera = true,
  onSwitchCamera,
  onToggleMute,
  onToggleCamera,
  onShare,
  onReport,
  onDailyTask,
  bottomPadding = 16,
}) {
  if (!visible) return null;

  const tools = isHost
    ? [
        { id: 'flip', name: 'Flip Camera', icon: 'camera-reverse-outline', action: onSwitchCamera },
        { id: 'mute', name: muted ? 'Unmute' : 'Mute', icon: muted ? 'mic-off-outline' : 'mic-outline', action: onToggleMute },
        { id: 'cam', name: camera ? 'Camera Off' : 'Camera On', icon: camera ? 'videocam-outline' : 'videocam-off-outline', action: onToggleCamera },
        { id: 'share', name: 'Share', icon: 'share-social-outline', action: onShare },
        { id: 'task', name: 'Daily task', icon: 'calendar-outline', action: onDailyTask },
        { id: 'beauty', name: 'Beauty', icon: 'sparkles-outline', action: onClose },
        { id: 'settings', name: 'Live settings', icon: 'settings-outline', action: onClose },
      ]
    : [
        { id: 'report', name: 'Report', icon: 'flag-outline', action: onReport },
        { id: 'dislike', name: 'Dislike', icon: 'heart-dislike-outline', action: onClose },
        { id: 'task', name: 'Daily task', icon: 'calendar-outline', action: onDailyTask },
        { id: 'share', name: 'Share', icon: 'share-social-outline', action: onShare },
        { id: 'screenshot', name: 'Screenshot', icon: 'camera-outline', action: onClose },
        { id: 'record', name: 'Record', icon: 'videocam-outline', action: onClose },
        { id: 'voice', name: 'Voice mode', icon: 'headset-outline', action: onClose },
        { id: 'settings', name: 'Live settings', icon: 'settings-outline', action: onClose },
        { id: 'origin', name: 'Origin', icon: 'tv-outline', action: onClose },
        { id: 'line1', name: 'Line 1', icon: 'swap-horizontal-outline', action: onClose },
      ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={[styles.sheetContainer, { paddingBottom: bottomPadding + 14 }]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Basic tools</Text>

          <View style={styles.grid}>
            {tools.map(tool => (
              <TouchableOpacity
                key={tool.id}
                activeOpacity={0.75}
                onPress={() => {
                  tool.action && tool.action();
                }}
                style={styles.toolItem}
              >
                <View style={styles.toolIconWrap}>
                  <Icon name={tool.icon} size={24} color="#FFF" />
                </View>
                <Text style={styles.toolName} numberOfLines={1}>
                  {tool.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#0F1123',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  toolItem: {
    width: (width - 32) / 5,
    alignItems: 'center',
    marginBottom: 16,
  },
  toolIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 6,
  },
  toolName: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
});
