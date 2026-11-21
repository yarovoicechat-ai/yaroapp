jest.mock('../utils/avatarUtil', () => ({ getUserAvatar: jest.fn() }));
import { resolveFrameAsset, resolveEntryAssets, mergeCanonicalUser } from '../utils/cosmeticResolver';

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

test('mergeCanonicalUser preserves cosmetics and avatar fields across partial seat updates', () => {
  const richPreviousUser = {
    userId: '1000000002',
    name: 'Naruto',
    image: 'https://api.yaroapp.in/uploads/avatar.jpg',
    avatar: 'https://api.yaroapp.in/uploads/avatar.jpg',
    equippedFrame: '/api/vip-assets/frame/vip_frame_5.svga',
    equippedFrameAsset: '/api/vip-assets/frame/vip_frame_5.svga',
    equippedVipId: 'vip_5',
  };
  const partialIncomingUser = {
    userId: '1000000002',
    name: 'Naruto',
  };
  const merged = mergeCanonicalUser(richPreviousUser, partialIncomingUser);
  expect(merged.equippedFrame).toBe('/api/vip-assets/frame/vip_frame_5.svga');
  expect(merged.equippedFrameAsset).toBe('/api/vip-assets/frame/vip_frame_5.svga');
  expect(merged.equippedVipId).toBe('vip_5');
});
