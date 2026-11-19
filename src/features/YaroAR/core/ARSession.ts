import type { ARState } from '../types/ARSessionTypes';
import { DEFAULT_ADJUSTMENTS } from './ARConstants';
export const initialARState = (): ARState => ({
  effectStates: {},
  frontCamera: true,
  status: 'idle',
  selectedId: null,
  intensity: 0.5,
  beautyIntensity: 0.5,
  trackId: null,
  faceDetected: false,
  error: null,
  capabilities: null,
  adjustments: { ...DEFAULT_ADJUSTMENTS },
  favorites: [],
});
export class ARSession {
  private state = initialARState();
  private listeners = new Set<() => void>();
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  update(patch: Partial<ARState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach(listener => listener());
  }
}
