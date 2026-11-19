import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AgoraVideoView from './AgoraVideoView';
import Icon from 'react-native-vector-icons/Ionicons';
import { ARFaceMaskOverlay, useARSession } from '../../features/YaroAR';

export default function LiveVideoGrid({
  count = 4,
  host,
  guests = [],
  localUid,
  hostUid,
  isHost,
  ready,
  trackId = null,
  frontCamera = true,
  camera = true,
  onJoin,
  onMuteGuest,
  muted = false,
  onMute,
  onCamera,
}) {
  const ar = useARSession();
  const participants = [{ ...host, agoraUid: hostUid, host: true }, ...guests];
  return (
    <View style={styles.grid}>
      {Array.from({ length: count }, (_, index) => {
        const participant = participants[index];
        const local =
          participant &&
          (participant.host
            ? isHost
            : Number(participant.agoraUid) === Number(localUid));
        const videoVisible =
          participant &&
          ready &&
          (!local || camera) &&
          participant.camera !== false;
        return (
          <View key={index} style={[styles.box, count > 4 && styles.smallBox, count === 6 && { height: '49.4%' }]}>
            {videoVisible ? (
              <>
                <AgoraVideoView
                  key={`${participant.agoraUid}-${local ? trackId : 'remote'}`}
                  style={StyleSheet.absoluteFill}
                  canvas={{
                    uid: local ? 0 : participant.agoraUid,
                    ...(local
                      ? {
                          sourceType: trackId === null ? 0 : 4,
                          mirrorMode: frontCamera ? 1 : 2,
                        }
                      : {}),
                  }}
                />
                {local && (
                  <ARFaceMaskOverlay
                    effectId={ar.selectedId}
                    intensity={ar.intensity}
                    style={StyleSheet.absoluteFill}
                    compact
                  />
                )}
              </>
            ) : (
              <TouchableOpacity
                style={styles.placeholder}
                onPress={!participant ? onJoin : undefined}
                disabled={Boolean(participant) || !onJoin}
                accessibilityLabel={`Join video box ${index + 1}`}
              >
                <Icon
                  name={participant ? 'videocam-off-outline' : 'add'}
                  size={28}
                  color="#C4B5FD"
                />
                <Text style={styles.name}>
                  {participant?.name || participant?.user?.name || 'Join live'}
                </Text>
              </TouchableOpacity>
            )}
            {participant && (
              <Text pointerEvents="none" style={styles.label}>
                {participant.host
                  ? 'Host'
                  : participant.name || participant.user?.name || 'Guest'}
              </Text>
            )}
            {local && onMute && (
              <View style={styles.localControls}>
                <TouchableOpacity
                  accessibilityLabel={
                    muted ? 'Unmute microphone' : 'Mute microphone'
                  }
                  onPress={onMute}
                  style={styles.control}
                >
                  <Icon
                    name={muted ? 'mic-off' : 'mic'}
                    size={18}
                    color="#FFF"
                  />
                </TouchableOpacity>
                {!isHost && onCamera && (
                  <TouchableOpacity
                    accessibilityLabel={
                      camera ? 'Turn camera off' : 'Turn camera on'
                    }
                    onPress={onCamera}
                    style={styles.control}
                  >
                    <Icon
                      name={camera ? 'videocam' : 'videocam-off'}
                      size={18}
                      color="#FFF"
                    />
                  </TouchableOpacity>
                )}
              </View>
            )}
            {isHost && participant && !participant.host && (
              <TouchableOpacity
                accessibilityLabel={`Mute ${participant.name || 'guest'}`}
                style={styles.mute}
                onPress={() => onMuteGuest?.(participant)}
              >
                <Icon name="mic-off" size={18} color="#FFF" />
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  box: {
    width: '49.4%',
    height: '49.4%',
    backgroundColor: '#211B34',
    overflow: 'hidden',
    borderRadius: 8,
  },
  smallBox: { width: '32.7%', height: '32.7%' },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  name: { color: '#DDD6FE', fontSize: 12 },
  label: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    color: '#FFF',
    fontSize: 11,
    backgroundColor: '#0008',
    padding: 4,
    borderRadius: 5,
  },
  mute: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    backgroundColor: '#0008',
    padding: 7,
    borderRadius: 18,
  },
  localControls: {
    position: 'absolute',
    right: 4,
    top: 4,
    flexDirection: 'row',
    gap: 4,
  },
  control: { backgroundColor: '#0009', padding: 7, borderRadius: 18 },
});
