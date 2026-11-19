import { getEffect } from './effectRegistry';
export function loadBundledEffect(id: string) {
  const effect = getEffect(id);
  if (!effect) throw new Error('Unknown effect');
  if (effect.status === 'pending') throw new Error(effect.pendingReason);
  return effect;
}
