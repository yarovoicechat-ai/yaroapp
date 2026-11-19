export type RenderBackend = 'gles2' | 'metal';
export interface RenderFrame {
  width: number;
  height: number;
  timestampMs: number;
  rotation: 0 | 90 | 180 | 270;
}
