import type { ARCapabilities, ARAdjustments } from './ARNativeTypes';
export interface ARState {
  effectStates: Record<string, 'available' | 'loading' | 'active' | 'failed' | 'unavailable'>;
  frontCamera: boolean;
  status: 'idle' | 'starting' | 'running' | 'paused' | 'error';
  selectedId: string | null;
  intensity: number;
  beautyIntensity: number;
  trackId: number | null;
  faceDetected: boolean;
  error: string | null;
  capabilities: ARCapabilities | null;
  adjustments: ARAdjustments;
  favorites: string[];
}
// Only video ownership is changed. The existing caller retains channel/audio ownership.
export interface ARAgoraEngine {
  stopPreview(sourceType?: number): number | void;
  startPreview(sourceType?: number): number | void;
  switchCamera?(): number;
  enableLocalVideo(enabled: boolean): number;
  createCustomVideoTrack(): number;
  destroyCustomVideoTrack(id: number): number;
  setBeautyEffectOptions?(enabled: boolean, options: any): number | void;
  setColorEnhanceOptions?(enabled: boolean, options: any): number | void;
  updateChannelMediaOptions(options: {
    publishCameraTrack?: boolean;
    publishCustomVideoTrack?: boolean;
    customVideoTrackId?: number;
  }): number;
}
