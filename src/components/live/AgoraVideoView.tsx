import React, { useSyncExternalStore } from 'react';
import { Platform, requireNativeComponent } from 'react-native';
import type { ViewProps } from 'react-native';
import { RtcSurfaceView, RtcTextureView } from 'react-native-agora';
import type { RtcSurfaceViewProps } from 'react-native-agora';
import { ARManager } from '../../features/YaroAR/core/ARManager';

const NativeARPreview = requireNativeComponent<ViewProps & { trackId: number; mirror: boolean }>('YaroARPreview');

export default function AgoraVideoView(props: RtcSurfaceViewProps) {
  const session = useSyncExternalStore(ARManager.subscribe, ARManager.getSnapshot, ARManager.getSnapshot);
  if (Platform.OS === 'android' && props.canvas.sourceType === 4 && session.trackId !== null) {
    return <NativeARPreview style={props.style} trackId={session.trackId} mirror={props.canvas.mirrorMode !== 2} />;
  }
  // TextureView participates in the Android view hierarchy with camera controls,
  // gradients and animated overlays above it.
  return Platform.OS === 'android' ? (
    <RtcTextureView {...props} />
  ) : (
    <RtcSurfaceView {...props} />
  );
}
