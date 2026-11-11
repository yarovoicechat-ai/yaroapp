jest.mock('../utils/avatarUtil', () => ({ getUserAvatar: jest.fn() }));
import { resolveFrameAsset, resolveEntryAssets } from '../utils/cosmeticResolver';

test('another member frame is resolved from canonical and nested identity payloads', () => {
  const url = '/api/vip-assets/frame/vip_frame_2.svga';
  expect(resolveFrameAsset({ userId: 'other', effectiveIdentity: { avatarFrame: url } }).animationUrl)
    .toBe('https://api.yaroapp.in' + url);
  expect(resolveFrameAsset({ userId: 'other', equippedFrameAsset: url }).animationUrl)
    .toBe('https://api.yaroapp.in' + url);
});

test('another members entry payload retains their animation and explicit disabled slots', () => {
  const entry = { animationUrl: '/api/vip-assets/entry/vip_entry_2.svga' };
  expect(resolveEntryAssets({ user: { userId: 'other' }, entry }).entry.animationUrl)
    .toBe('https://api.yaroapp.in' + entry.animationUrl);
  expect(resolveEntryAssets({ entry: null, user: { equippedEntryAsset: entry } }).entry).toBeNull();
});
