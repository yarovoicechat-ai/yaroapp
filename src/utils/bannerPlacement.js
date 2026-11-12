export function isBannerForPlacement(banner, placement) {
  if (!banner || banner.isActive === false) return false;
  const placements = Array.isArray(banner.placements) && banner.placements.length
    ? banner.placements : [banner.placement || 'home'];
  return placements.includes(placement) || placements.includes('all');
}
