export interface ARCapabilities {
  nativeAvailable: boolean;
  tracking: boolean;
  customVideo: boolean;
  backgroundSegmentation: boolean;
  implementedEffectIds: string[];
  verified: boolean;
  reason?: string;
}
export interface ARConfig {
  trackId: number;
  width: number;
  height: number;
  fps: number;
  frontCamera: boolean;
}
export interface ARNativeModule {
  addListener(event: string): void;
  removeListeners(count: number): void;
  getCapabilities(): Promise<ARCapabilities>;
  initialize(config: ARConfig): Promise<void>;
  startSession(): Promise<void>;
  setEffect(effectId: string): Promise<void>;
  setIntensity(value: number): Promise<void>;
  setBeautyIntensity(value: number): Promise<void>;
  setAdjustments(values: ARAdjustments): Promise<void>;
  removeEffect(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  stopSession(): Promise<void>;
  release(): Promise<void>;
}
export interface ARAdjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  warmth: number;
  sharpness: number;
}
export interface AREventPayloads {
  onARReady: { trackId: number };
  onFaceDetected: Record<string, never>;
  onFaceLost: Record<string, never>;
  onEffectChanged: { effectId: string };
  onARError: { message: string };
  onPerformanceUpdate: { fps: number; queuedFrames: number };
}
export type AREvent = keyof AREventPayloads;
