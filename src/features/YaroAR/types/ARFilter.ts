export const AR_CATEGORIES = [
  'All',
  'Beauty',
  'Animals',
  'Accessories',
  'Fantasy',
  'Anime',
  'Emotions',
  'Nature',
  'Party',
  'Premium',
  'Special',
] as const;
export type ARCategory = (typeof AR_CATEGORIES)[number];
export type EffectStatus = 'pending' | 'experimental' | 'verified';
export interface ARFilter {
  id: string;
  name: string;
  category: Exclude<ARCategory, 'All'>;
  version: string;
  premium: boolean;
  status: EffectStatus;
  pendingReason?: string;
  thumbnailSvg: string;
  assetPath: string;
  renderer: { kind: 'beauty' | 'glb'; mode: number; shader: string };
  tracking: {
    faces: 1;
    landmarks: boolean;
    blendshapes: boolean;
    transformationMatrix: boolean;
    smoothing: number;
  };
  intensity: { min: number; max: number; default: number };
  platforms: readonly ('android' | 'ios')[];
}
