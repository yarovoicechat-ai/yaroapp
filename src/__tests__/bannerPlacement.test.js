import { isBannerForPlacement } from '../utils/bannerPlacement';
test('home/party support banners cannot replace the Me recharge banner', () => {
  const banner = { placements: ['home', 'oneToOne', 'party'], placement: 'home' };
  expect(isBannerForPlacement(banner, 'me')).toBe(false);
  expect(isBannerForPlacement(banner, 'party')).toBe(true);
});
test('explicit placements override legacy placement and inactive banners stay hidden', () => {
  expect(isBannerForPlacement({ placements: ['party'], placement: 'me' }, 'me')).toBe(false);
  expect(isBannerForPlacement({ placement: 'me' }, 'me')).toBe(true);
  expect(isBannerForPlacement({}, 'me')).toBe(false);
  expect(isBannerForPlacement({ placements: ['all'] }, 'me')).toBe(true);
  expect(isBannerForPlacement({ placement: 'me', isActive: false }, 'me')).toBe(false);
});
