import React from 'react';
import { StyleProp, ViewStyle, View, StyleSheet } from 'react-native';
import AgoraVideoView from '../../../components/live/AgoraVideoView';
import { useARSession } from '../hooks/useARSession';
import ARFaceMaskOverlay from './ARFaceMaskOverlay';

export default function ARPreview({
  style,
  mirror,
}: {
  style?: StyleProp<ViewStyle>;
  mirror?: boolean;
}) {
  const session = useARSession();
  return (
    <View style={style} pointerEvents="none">
      <AgoraVideoView
        style={StyleSheet.absoluteFill}
        canvas={{
          uid: 0,
          sourceType: session.trackId === null ? 0 : 4,
          mirrorMode: (mirror ?? session.frontCamera) ? 1 : 2,
        }}
      />
      <ARFaceMaskOverlay
        effectId={session.selectedId}
        intensity={session.intensity}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
