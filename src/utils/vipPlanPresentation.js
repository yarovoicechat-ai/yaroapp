import { resolveAssetUrl } from './cosmeticResolver';

export const presentVipTier = plan => {
  const level = Number(plan.level);
  const media = (animationUrl, imageUrl) => ({
    animationUrl: resolveAssetUrl(animationUrl), imageUrl: resolveAssetUrl(imageUrl),
  });
  const frame = plan.features?.enableAvatarFrame !== false && plan.avatarFrameUrl
    ? media(plan.avatarFrameUrl, plan.avatarFramePreviewUrl) : null;
  const entry = plan.features?.enableEntryEffect !== false && plan.entryAnimationUrl
    ? media(plan.entryAnimationUrl, plan.entryPreviewUrl) : null;
  return {
    ...plan, id: plan._id || plan.slug,
    name: String(plan.name || `VIP ${level}`).replace(/SVIP/gi, 'VIP'),
    tabLabel: level === 0 ? 'VIP+' : `VIP${level}`,
    ribbonLabel: level === 0 ? 'VIP+' : `VIP ${level}`,
    frame, entry,
    previewOptions: [...(entry ? ['entry'] : []), ...(frame ? ['frame'] : [])],
    privileges: (plan.privileges || []).filter(p => p.isEnabled && p.isVisible !== false)
      .map(p => ({ ...p, desc: p.description, icon: p.icon || 'diamond-outline' })),
  };
};
