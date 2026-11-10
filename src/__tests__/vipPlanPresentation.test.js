jest.mock('../utils/cosmeticResolver', () => ({
  resolveAssetUrl: url => !url ? '' : url.startsWith('/') ? `https://api.yaroapp.in${url}` : url,
}));
import { presentVipTier } from '../utils/vipPlanPresentation';

test('panel URLs, price and visibility are read from the current API plan', () => {
  const source = {
    _id: 'existing-tier', slug: 'svip-2', name: 'SVIP 2 Count', level: 2, price: 500,
    entryAnimationUrl: '/uploads/new-entry.svga', entryPreviewUrl: '/uploads/new-entry.png',
    avatarFrameUrl: '/uploads/new-frame.svga', avatarFramePreviewUrl: '/uploads/new-frame.png',
    privileges: [{ key: 'one', isEnabled: true, isVisible: true }, { key: 'two', isEnabled: false }],
  };
  const first = presentVipTier(source);
  expect(first.id).toBe('existing-tier');
  expect(first.slug).toBe('svip-2');
  expect(first.name).toBe('VIP 2 Count');
  expect(first.entry.animationUrl).toBe('https://api.yaroapp.in/uploads/new-entry.svga');
  expect(first.frame.imageUrl).toBe('https://api.yaroapp.in/uploads/new-frame.png');
  expect(first.privileges).toHaveLength(1);
  const updated = presentVipTier({ ...source, price: 900, entryAnimationUrl: '/uploads/replaced.svga', features: { enableAvatarFrame: false } });
  expect(updated.price).toBe(900);
  expect(updated.entry.animationUrl).toContain('replaced.svga');
  expect(updated.frame).toBeNull();
  expect(updated.previewOptions).toEqual(['entry']);
  expect(updated.previewOptions).not.toContain('bubble');
});
