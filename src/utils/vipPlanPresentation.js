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

  const tag = plan.svipTagConfig?.enabled !== false && (plan.svipTagConfig?.previewUrl || plan.svipTagConfig?.iconUrl || plan.svipTagConfig?.animationUrl || plan.svipTagConfig?.text)
    ? {
        text: plan.svipTagConfig?.text,
        imageUrl: resolveAssetUrl(plan.svipTagConfig?.previewUrl || plan.svipTagConfig?.iconUrl),
        animationUrl: resolveAssetUrl(plan.svipTagConfig?.animationUrl),
      }
    : null;

  const defaultBadgeAnim = Number.isInteger(level) && level >= 0 && level <= 5
    ? `/api/vip-assets/badge/vip_badge_${level}.svga`
    : '';
  const defaultBadgeImg = Number.isInteger(level) && level >= 0 && level <= 5
    ? `/api/vip-assets/badge/vip_badge_${level}.png`
    : '';

  const rawBadgeAnim = plan.profileBadgeConfig?.animationUrl || plan.heroAnimationUrl || defaultBadgeAnim;
  const rawBadgeImg = plan.profileBadgeConfig?.previewUrl || plan.profileBadgeConfig?.iconUrl || plan.heroBadgePreviewUrl || plan.heroBadgeUrl || defaultBadgeImg;

  const badge = plan.features?.enableSpecialBadge !== false && (rawBadgeAnim || rawBadgeImg)
    ? {
        name: plan.profileBadgeConfig?.badgeName || plan.name || (level === 0 ? 'VIP+ Badge' : `VIP ${level} Badge`),
        imageUrl: resolveAssetUrl(rawBadgeImg),
        animationUrl: resolveAssetUrl(rawBadgeAnim),
      }
    : null;

  const chatBubble = plan.svipBubbleConfig?.enabled !== false && (plan.svipBubbleConfig?.previewUrl || plan.svipBubbleConfig?.animationUrl)
    ? {
        name: plan.svipBubbleConfig?.bubbleName,
        imageUrl: resolveAssetUrl(plan.svipBubbleConfig?.previewUrl),
        animationUrl: resolveAssetUrl(plan.svipBubbleConfig?.animationUrl),
      }
    : null;

  const profileCard = plan.profileCardConfig?.enabled !== false && (plan.profileCardConfig?.previewUrl || plan.profileCardConfig?.animationUrl)
    ? {
        name: plan.profileCardConfig?.cardName,
        imageUrl: resolveAssetUrl(plan.profileCardConfig?.previewUrl),
        animationUrl: resolveAssetUrl(plan.profileCardConfig?.animationUrl),
      }
    : null;

  const micWave = plan.micWaveConfig?.enabled !== false && (plan.micWaveConfig?.previewUrl || plan.micWaveConfig?.animationUrl)
    ? {
        imageUrl: resolveAssetUrl(plan.micWaveConfig?.previewUrl),
        animationUrl: resolveAssetUrl(plan.micWaveConfig?.animationUrl),
      }
    : null;

  const giftBroadcast = plan.giftBroadcastConfig?.enabled !== false && (plan.giftBroadcastConfig?.previewUrl || plan.giftBroadcastConfig?.animationUrl)
    ? {
        name: plan.giftBroadcastConfig?.title,
        imageUrl: resolveAssetUrl(plan.giftBroadcastConfig?.previewUrl),
        animationUrl: resolveAssetUrl(plan.giftBroadcastConfig?.animationUrl),
      }
    : null;

  const vipId = plan.vipIdConfig?.enabled !== false && (plan.vipIdConfig?.previewUrl || plan.vipIdConfig?.animationUrl || plan.vipIdConfig?.vipIdPattern)
    ? {
        pattern: plan.vipIdConfig?.vipIdPattern,
        imageUrl: resolveAssetUrl(plan.vipIdConfig?.previewUrl),
        animationUrl: resolveAssetUrl(plan.vipIdConfig?.animationUrl),
      }
    : null;

  return {
    ...plan, id: plan._id || plan.slug,
    name: String(plan.name || `VIP ${level}`).replace(/SVIP/gi, 'VIP'),
    tabLabel: level === 0 ? 'VIP+' : `VIP${level}`,
    ribbonLabel: level === 0 ? 'VIP+' : `VIP ${level}`,
    frame, entry, tag, badge, chatBubble, profileCard, micWave, giftBroadcast, vipId,
    previewOptions: [...(entry ? ['entry'] : []), ...(frame ? ['frame'] : [])],
    privileges: (plan.privileges || []).filter(p => p.isEnabled && p.isVisible !== false)
      .map(p => ({ ...p, desc: p.description, icon: p.icon || 'diamond-outline' })),
  };
};
