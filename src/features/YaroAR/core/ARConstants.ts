import type { ARAdjustments } from '../types/ARNativeTypes';
export const AR_CONFIG = {
  width: 720,
  height: 1280,
  fps: 24,
  frontCamera: true,
};
export const DEFAULT_ADJUSTMENTS: ARAdjustments = {
  brightness: 0,
  contrast: 1,
  saturation: 1,
  warmth: 0,
  sharpness: 0,
};
export const clampIntensity = (value: number) => {
  if (!Number.isFinite(value))
    throw new Error('Intensity must be a finite number');
  return Math.min(1, Math.max(0, value));
};
