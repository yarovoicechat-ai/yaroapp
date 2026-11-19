import type { ARAgoraEngine, ARState } from '../types/ARSessionTypes';
import type { ARAdjustments } from '../types/ARNativeTypes';
import { ARSession } from './ARSession';
import { ARBridge } from './ARBridge';
import { AR_CONFIG, clampIntensity, DEFAULT_ADJUSTMENTS } from './ARConstants';
import { getEffect, effectRegistry, beautyPresetRegistry } from '../effects/registry/effectRegistry';

export class ARController extends ARSession {
  private engine: ARAgoraEngine | null = null;
  private owner: symbol | null = null;
  private inChannel = false;
  private foreground = true;
  private frontCamera = true;
  private restoreWhenActive = false;
  private queue: Promise<unknown> = Promise.resolve();
  private cleanups: (() => void)[] = [];
  private serialize<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.queue.then(operation);
    this.queue = result.catch(() => {});
    return result;
  }
  async inspect() {
    const capabilities = await ARBridge.capabilities();
    const effectStates = { ...this.getSnapshot().effectStates };
    for (const effect of [...effectRegistry, ...beautyPresetRegistry]) {
      if (!effectStates[effect.id] || effectStates[effect.id] === 'unavailable')
        effectStates[effect.id] = capabilities.implementedEffectIds.includes(effect.id) ? 'available' : 'unavailable';
    }
    this.update({ capabilities, effectStates });
    return capabilities;
  }
  waitForRelease() {
    return this.queue;
  }
  channelPublishing(enabled: boolean) {
    this.inChannel = enabled;
  }
  setForeground(active: boolean) {
    this.foreground = active;
    if (
      active &&
      this.restoreWhenActive &&
      this.engine &&
      this.getSnapshot().trackId === null
    ) {
      this.restoreWhenActive = false;
      this.engine.enableLocalVideo(true);
      this.engine.startPreview();
      if (this.inChannel)
        this.engine.updateChannelMediaOptions({
          publishCameraTrack: true,
          publishCustomVideoTrack: false,
        });
    }
  }
  bind(engine: ARAgoraEngine, options: { inChannel?: boolean } = {}) {
    if (this.owner)
      throw new Error(
        'Another camera session still owns AR. Release it before switching screens.',
      );
    this.owner = Symbol('AR camera owner');
    this.frontCamera = true;
    this.update({ frontCamera: true });
    this.engine = engine;
    this.inChannel = Boolean(options.inChannel);
    this.cleanups = [
      ARBridge.subscribe('onFaceDetected', () =>
        this.update({ faceDetected: true }),
      ),
      ARBridge.subscribe('onFaceLost', () =>
        this.update({ faceDetected: false }),
      ),
      ARBridge.subscribe('onARError', data => {
        const current = this.getSnapshot();
        for (const [id, state] of Object.entries(current.effectStates))
          if (state === 'active' || state === 'loading') this.effectState(id, 'failed');
        this.update({ error: data.message || 'Native AR error' });
        void this.stop().catch(error => this.update({ status: 'error', error: `${data.message || 'Native AR error'}; cleanup: ${error.message}` }));
      }),
    ];
    const owner = this.owner;
    return () =>
      this.serialize(async () => {
        if (this.owner !== owner) return;
        await this.stopInternal(false);
        this.cleanups.forEach(cleanup => cleanup());
        this.cleanups = [];
        this.owner = null;
        this.engine = null;
        this.restoreWhenActive = false;
      });
  }
  select(effectId: string, options?: { intensity: number; beautyIntensity: number; adjustments: ARAdjustments; frontCamera: boolean }) {
    return this.serialize(async () => {
      const effect = getEffect(effectId);
      if (!effect || effect.status === 'pending') {
        throw new Error(effect?.pendingReason || 'Effect assets are pending.');
      }
      this.effectState(effectId, 'loading');
      try {
        const intensity = clampIntensity(options?.intensity ?? effect.intensity.default);
        if (options) {
          this.frontCamera = options.frontCamera;
          this.update({ frontCamera: options.frontCamera });
        }

        // Apply Agora hardware beauty preset
        const beautyPresets: Record<string, { s: number; l: number; r: number; sh: number; c?: number }> = {
          'yaro-beauty': { s: 0.75, l: 0.6, r: 0.35, sh: 0.35, c: 0.4 },
          'natural-skin': { s: 0.4, l: 0.3, r: 0.15, sh: 0.25 },
          'smooth-skin': { s: 0.9, l: 0.55, r: 0.15, sh: 0.25 },
          'pink-glow': { s: 0.7, l: 0.65, r: 0.55, sh: 0.35, c: 0.5 },
          'golden-shine': { s: 0.65, l: 0.7, r: 0.3, sh: 0.45, c: 0.6 },
          'rosy-cheeks': { s: 0.75, l: 0.55, r: 0.65, sh: 0.35 },
          'soft-makeup': { s: 0.8, l: 0.6, r: 0.4, sh: 0.4 },
          'bright-eyes': { s: 0.55, l: 0.85, r: 0.2, sh: 0.65 },
          'lip-tint': { s: 0.65, l: 0.5, r: 0.5, sh: 0.3 },
        };
        const p = beautyPresets[effectId] || { s: 0.6, l: 0.5, r: 0.25, sh: 0.3, c: 0.3 };
        const factor = Math.max(0.1, Math.min(1.0, intensity));
        try {
          this.engine?.setBeautyEffectOptions?.(true, {
            lighteningContrastLevel: 1,
            lighteningLevel: Math.max(0, Math.min(1, p.l * factor)),
            smoothnessLevel: Math.max(0, Math.min(1, p.s * factor)),
            rednessLevel: Math.max(0, Math.min(1, p.r * factor)),
            sharpnessLevel: Math.max(0, Math.min(1, p.sh * factor)),
          });
          if (p.c) {
            this.engine?.setColorEnhanceOptions?.(true, {
              strengthLevel: Math.max(0, Math.min(1, p.c * factor)),
              skinProtect: true,
            });
          }
        } catch {}

        const previous = this.getSnapshot().selectedId;
        if (previous && previous !== effectId) this.effectState(previous, 'available');
        this.effectState(effectId, 'active');
        this.update({
          selectedId: effectId,
          intensity,
          ...(options ? { beautyIntensity: clampIntensity(options.beautyIntensity), adjustments: options.adjustments } : {}),
          error: null,
          status: 'running',
        });
      } catch (error) {
        this.effectState(effectId, 'failed');
        this.update({ error: (error as Error).message });
        throw error;
      }
    });
  }
  private effectState(id: string, state: ARState['effectStates'][string]) {
    this.update({ effectStates: { ...this.getSnapshot().effectStates, [id]: state } });
  }
  private async startInternal() {
    const engine = this.engine!;
    this.update({ status: 'starting', error: null });
    let trackId: number;
    try {
      trackId = engine.createCustomVideoTrack();
      if (!Number.isInteger(trackId) || trackId < 0 || trackId === 0xffffffff)
        throw new Error('Agora could not create a custom video track.');
    } catch (error) {
      this.update({ status: 'error', error: (error as Error).message });
      throw error;
    }
    this.update({ trackId });
    try {
      engine.stopPreview();
      this.check(engine.enableLocalVideo(false));
      await ARBridge.native().initialize({ ...AR_CONFIG, frontCamera: this.frontCamera, trackId });
      // The custom track is fed by native capture. SDK 4.6.2 rejects
      // startPreview(VideoSourceCustom) with ERR_INVALID_ARGUMENT (-2).
      await ARBridge.native().startSession();
      if (this.inChannel)
        this.check(
          engine.updateChannelMediaOptions({
            publishCameraTrack: false,
            publishCustomVideoTrack: true,
            customVideoTrackId: trackId,
          }),
        );
      this.update({ status: 'running' });
    } catch (error) {
      await this.stopInternal(true);
      this.update({ status: 'error', error: String((error as Error).message) });
      throw error;
    }
  }
  private check(result: number | void) {
    if (typeof result === 'number' && result < 0)
      throw new Error(`Agora video operation failed (${result})`);
  }
  switchCamera() {
    return this.serialize(async () => {
      if (!this.engine) throw new Error('Open the live camera first.');
      const old = this.getSnapshot();
      if (old.trackId === null) {
        this.check(this.engine.switchCamera?.());
        this.frontCamera = !this.frontCamera;
        this.update({ frontCamera: this.frontCamera });
        return;
      }
      await this.stopInternal(false);
      this.frontCamera = !this.frontCamera;
      this.update({ frontCamera: this.frontCamera });
      try {
        await this.startInternal();
        await ARBridge.native().setIntensity(old.intensity);
        await ARBridge.native().setBeautyIntensity(old.beautyIntensity);
        await ARBridge.native().setAdjustments(old.adjustments);
        if (old.selectedId) {
          this.effectState(old.selectedId, 'loading');
          await ARBridge.native().setEffect(old.selectedId);
          this.effectState(old.selectedId, 'active');
        }
        this.update({ selectedId: old.selectedId });
      } catch (error) {
        if (old.selectedId) this.effectState(old.selectedId, 'failed');
        await this.stopInternal(true);
        throw error;
      }
    });
  }
  intensity(value: number) {
    return this.serialize(async () => {
      const safe = clampIntensity(value);
      if (this.getSnapshot().trackId !== null)
        await ARBridge.native().setIntensity(safe);
      this.update({ intensity: safe });
    });
  }
  beauty(value: number) {
    return this.serialize(async () => {
      const safe = clampIntensity(value);
      if (this.getSnapshot().trackId !== null)
        await ARBridge.native().setBeautyIntensity(safe);
      this.update({ beautyIntensity: safe });
    });
  }
  adjustments(values: ARAdjustments) {
    return this.serialize(async () => {
      if (!Object.values(values).every(Number.isFinite))
        throw new Error('Adjustments must be finite');
      const safe = {
        brightness: Math.max(-1, Math.min(1, values.brightness)),
        contrast: Math.max(0, Math.min(2, values.contrast)),
        saturation: Math.max(0, Math.min(2, values.saturation)),
        warmth: Math.max(-1, Math.min(1, values.warmth)),
        sharpness: Math.max(0, Math.min(1, values.sharpness)),
      };
      try {
        const factor = Math.max(0.1, Math.min(1.0, this.getSnapshot().intensity));
        this.engine?.setBeautyEffectOptions?.(true, {
          lighteningContrastLevel: safe.contrast > 1 ? 2 : safe.contrast < 0.5 ? 0 : 1,
          lighteningLevel: Math.max(0, Math.min(1, (0.5 + safe.brightness * 0.4) * factor)),
          smoothnessLevel: factor * 0.7,
          rednessLevel: 0.3 * factor,
          sharpnessLevel: Math.max(0, Math.min(1, safe.sharpness * factor)),
        });
        if (safe.saturation !== 1) {
          this.engine?.setColorEnhanceOptions?.(true, {
            strengthLevel: Math.max(0, Math.min(1, safe.saturation * 0.5)),
            skinProtect: true,
          });
        }
      } catch {}
      this.update({ adjustments: safe });
    });
  }
  pause() {
    return this.serialize(async () => {
      if (this.getSnapshot().status === 'running') {
        await ARBridge.native().pause();
        this.update({ status: 'paused' });
      }
    });
  }
  resume() {
    return this.serialize(async () => {
      if (this.getSnapshot().status === 'paused') {
        await ARBridge.native().resume();
        this.update({ status: 'running' });
      }
    });
  }
  stop() {
    return this.serialize(() => this.stopInternal(true));
  }
  private async stopInternal(restore: boolean) {
    const selected = this.getSnapshot().selectedId;
    const trackId = this.getSnapshot().trackId;
    if (trackId !== null) {
      // Never restore Agora's camera until native capture has actually stopped.
      await ARBridge.native().stopSession();
      await ARBridge.native().release();
      if (this.engine) {
        const restoreNow = restore && this.foreground;
        if (this.inChannel)
          this.check(
            this.engine.updateChannelMediaOptions({
              publishCustomVideoTrack: false,
              publishCameraTrack: restoreNow,
            }),
          );
        this.engine.destroyCustomVideoTrack(trackId);
        if (restoreNow) {
          this.engine.enableLocalVideo(true);
          this.engine.startPreview();
        }
        this.restoreWhenActive = restore && !this.foreground;
      }
    }
    if (selected && this.getSnapshot().effectStates[selected] === 'active') this.effectState(selected, 'available');
    this.update({
      trackId: null,
      selectedId: null,
      status: 'idle',
      faceDetected: false,
    });
  }
  async reset() {
    await this.stop();
    this.update({
      intensity: 0.5,
      beautyIntensity: 0.5,
      adjustments: { ...DEFAULT_ADJUSTMENTS },
      error: null,
    });
  }
  favorite(id: string) {
    if (!getEffect(id)) return;
    const current = this.getSnapshot().favorites;
    this.update({
      favorites: current.includes(id)
        ? current.filter(value => value !== id)
        : [...current, id],
    });
  }
}
