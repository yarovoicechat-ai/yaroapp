import { useMemo } from 'react';
import { effectRegistry } from '../effects/registry/effectRegistry';
import type { ARCategory } from '../types/ARFilter';
export const useAREffects = (category: ARCategory = 'All') =>
  useMemo(
    () =>
      effectRegistry.filter(
        effect => category === 'All' || effect.category === category,
      ),
    [category],
  );
