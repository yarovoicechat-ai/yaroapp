import type { ARFilter } from '../../../types/ARFilter';
export const effect: ARFilter = {
  id: 'rosy-cheeks',
  name: 'Rosy Cheeks',
  category: 'Beauty',
  version: '1.0.0',
  premium: false,
  status: 'experimental',
  thumbnailSvg:
    '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect width="160" height="160" rx="32" fill="#241735"/><circle cx="80" cy="72" r="46" fill="#F595A5" opacity=".18"/><path d="M52 62C52 28 108 28 108 62V85C108 124 52 124 52 85Z" fill="#F595A5"/><path d="M62 70Q68 65 73 70M87 70Q94 65 99 70" fill="none" stroke="#60375C" stroke-width="3" stroke-linecap="round"/><path d="M72 94Q80 100 88 94" fill="none" stroke="#A1356F" stroke-width="3"/><circle cx="62" cy="86" r="7" fill="#E85792" opacity=".4"/><circle cx="98" cy="86" r="7" fill="#E85792" opacity=".4"/><path d="M125 29L128 38L137 41L128 44L125 53L122 44L113 41L122 38Z" fill="#F595A5"/><text x="80" y="145" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#F1DFAC">Rosy Cheeks</text></svg>',
  assetPath: 'shared/ar-assets/shaders/beauty.frag',
  renderer: {
    kind: 'beauty',
    mode: 3,
    shader: 'yaro-beauty-v1',
  },
  tracking: {
    faces: 1,
    landmarks: true,
    blendshapes: true,
    transformationMatrix: true,
    smoothing: 0.35,
  },
  intensity: {
    min: 0,
    max: 1,
    default: 0.5,
  },
  platforms: ['android', 'ios'],
};
export default effect;
