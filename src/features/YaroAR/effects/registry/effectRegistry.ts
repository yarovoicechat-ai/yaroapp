import type { ARFilter } from '../../types/ARFilter';
import e1 from '../beauty/yaro-beauty';
import e2 from '../beauty/pink-glow';
import e3 from '../beauty/rosy-cheeks';
import e4 from '../beauty/soft-makeup';
import e5 from '../beauty/golden-shine';
import e6 from '../animals/puppy';
import e7 from '../animals/bunny';
import e8 from '../animals/kitty';
import e9 from '../animals/panda';
import e10 from '../animals/fox';
import e11 from '../accessories/royal-crown';
import e12 from '../accessories/heart-glasses';
import e13 from '../accessories/butterfly-hair';
import e14 from '../accessories/golden-earrings';
import e15 from '../accessories/cyber-headset';
import e16 from '../fantasy/angel';
import e17 from '../fantasy/devil';
import e18 from '../fantasy/fairy';
import e19 from '../fantasy/ice-queen';
import e20 from '../fantasy/fire-king';
import e21 from '../anime/anime-eyes';
import e22 from '../anime/anime-blush';
import e23 from '../anime/magic-eyes';
import e24 from '../anime/anime-cat';
import e25 from '../anime/star-eyes';
import e26 from '../emotions/love-hearts';
import e27 from '../emotions/cry-baby';
import e28 from '../emotions/funny-face';
import e29 from '../emotions/happy-spark';
import e30 from '../emotions/angry-face';
import e31 from '../nature/butterflies';
import e32 from '../nature/flower-crown';
import e33 from '../nature/snowfall';
import e34 from '../nature/star-shower';
import e35 from '../nature/rainbow-aura';
import e36 from '../party/birthday';
import e37 from '../party/disco-king';
import e38 from '../party/confetti';
import e39 from '../party/neon-party';
import e40 from '../party/gold-rain';
import e41 from '../premium/diamond-face';
import e42 from '../premium/hologram';
import e43 from '../premium/dragon-mask';
import e44 from '../premium/crystal-butterfly';
import e45 from '../premium/yaro-royal';
import e46 from '../special/neon-rings';
import e47 from '../special/galaxy-face';
import e48 from '../special/robot-face';
import e49 from '../special/flame-face';
import e50 from '../special/yaro-signature';
export const effectRegistry: readonly ARFilter[] = Object.freeze([
  e1,
  e2,
  e3,
  e4,
  e5,
  e6,
  e7,
  e8,
  e9,
  e10,
  e11,
  e12,
  e13,
  e14,
  e15,
  e16,
  e17,
  e18,
  e19,
  e20,
  e21,
  e22,
  e23,
  e24,
  e25,
  e26,
  e27,
  e28,
  e29,
  e30,
  e31,
  e32,
  e33,
  e34,
  e35,
  e36,
  e37,
  e38,
  e39,
  e40,
  e41,
  e42,
  e43,
  e44,
  e45,
  e46,
  e47,
  e48,
  e49,
  e50,
]);
const beautyPresets = [
  ['natural-skin', 'Natural Skin', 6],
  ['smooth-skin', 'Smooth Skin', 7],
  ['bright-eyes', 'Bright Eyes', 8],
  ['lip-tint', 'Lip Tint', 9],
] as const;
// Additional beauty controls share the shader asset, with distinct native modes.
// The original 50 catalog IDs remain unchanged.
export const beautyPresetRegistry = beautyPresets.map(([id, name, mode]) => ({
  ...effectRegistry[0], id, name,
  renderer: { kind: 'beauty' as const, mode, shader: 'yaro-beauty-v2' },
}));
export const getEffect = (id: string) =>
  effectRegistry.find(effect => effect.id === id) || beautyPresetRegistry.find(effect => effect.id === id);
