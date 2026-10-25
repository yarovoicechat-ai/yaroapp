import { getUserAvatar } from './avatarUtil';

export const USER_COSMETIC_FIELDS = [
  'nameEffect',
  'equippedFrame',
  'equippedFrameAsset',
  'equippedEntry',
  'equippedEntryAsset',
  'equippedEntryEffect',
  'equippedEntryTag',
  'equippedTassel',
  'equippedTasselAsset',
  'equippedEntrance',
  'equippedEntranceAsset',
  'equippedChatBubble',
  'equippedChatBubbleAsset',
  'equippedMicWave',
  'equippedBadge',
  'equippedBadges',
  'equippedVipId',
  'equippedSvipId',
  'equippedRoomTheme',
  'equippedEntryFrame',
  'storeInventory',
  'wealthExp',
  'wealthLevel',
  'charmExp',
  'charmLevel',
  'claimedLevelRewards',
  'equippedVehicle',
  'equippedVehicleAsset',
  'equippedCustomId',
  'equippedProfileBorder',
  'equippedProfileBorderAsset',
];

const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value || {}, key);

const isRemoteAssetUrl = (value) =>
  typeof value === 'string' && /^(?:https?:\/\/|file:\/\/|content:\/\/|data:)/i.test(value.trim());

const isAnimatedAssetUrl = (value) =>
  typeof value === 'string' && /\.(?:svga|gif|webp|mp4|m4v|mov)(?:[?#]|$)/i.test(value.trim());

/**
 * Store/profile/socket endpoints have historically returned cosmetics in a
 * few different shapes. Collapse all of them into the canonical asset shape
 * consumed by the room renderers. A direct CDN URL is also a valid asset.
 */
export const normalizeCosmeticAsset = (value) => {
  if (!value) return null;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (!isRemoteAssetUrl(trimmed)) return { id: trimmed, name: trimmed };
    return isAnimatedAssetUrl(trimmed)
      ? { id: trimmed, name: '', animationUrl: trimmed, imageUrl: '' }
      : { id: trimmed, name: '', animationUrl: '', imageUrl: trimmed };
  }

  if (typeof value !== 'object') return null;

  const nested =
    value.asset ||
    value.catalogItem ||
    value.cosmetic ||
    value.item ||
    (value.itemId && typeof value.itemId === 'object' ? value.itemId : null) ||
    {};
  const merged = { ...nested, ...value };
  const directUrl = merged.uri || merged.url || merged.src || '';
  const animationUrl =
    merged.animationUrl ||
    merged.animationURL ||
    merged.svgaUrl ||
    merged.mediaUrl ||
    (isAnimatedAssetUrl(directUrl) ? directUrl : '');
  const imageUrl =
    merged.imageUrl ||
    merged.imageURL ||
    merged.image ||
    merged.previewUrl ||
    merged.thumbnail ||
    merged.coverImage ||
    (!animationUrl && isRemoteAssetUrl(directUrl) ? directUrl : '');

  return {
    ...merged,
    id: merged.id || merged._id || merged.itemId || merged.name || animationUrl || imageUrl || '',
    name: merged.name || merged.title || '',
    animationUrl: typeof animationUrl === 'string' ? animationUrl.trim() : '',
    imageUrl: typeof imageUrl === 'string' ? imageUrl.trim() : '',
  };
};

export const resolveFrameAsset = (user, explicitFrame = null) =>
  normalizeCosmeticAsset(
    explicitFrame ||
      user?.equippedFrameAsset ||
      user?.equippedProfileFrame ||
      user?.frameAsset ||
      user?.equippedFrame ||
      user?.equippedAvatarFrame ||
      user?.profileFrame ||
      user?.frame ||
      user?.frameId ||
      null,
  );

export const resolveEntryAssets = (payload) => {
  const user = payload?.user || {};
  return {
    entry: normalizeCosmeticAsset(
      payload?.entry ||
        payload?.effect ||
        payload?.entryAsset ||
        payload?.equippedEntryAsset ||
        payload?.vehicle ||
        payload?.equippedVehicle ||
        payload?.equippedVehicleAsset ||
        user?.equippedVehicleAsset ||
        user?.equippedVehicle ||
        user?.equippedEntryAsset ||
        user?.equippedEntryEffect ||
        user?.equippedEntry ||
        null,
    ),
    entrance: normalizeCosmeticAsset(
      payload?.entrance ||
        payload?.entranceAsset ||
        payload?.equippedEntranceAsset ||
        user?.equippedEntranceAsset ||
        user?.equippedEntrance ||
        null,
    ),
    tassel: normalizeCosmeticAsset(
      payload?.tassel ||
        payload?.tasselAsset ||
        payload?.equippedTasselAsset ||
        user?.equippedTasselAsset ||
        user?.equippedTassel ||
        null,
    ),
  };
};

/** Preserve canonical cosmetics when a partial endpoint omits them. */
export const mergeCanonicalUser = (previous, incoming) => {
  if (!incoming || typeof incoming !== 'object') return previous || incoming;
  const merged = { ...(previous || {}), ...incoming };
  USER_COSMETIC_FIELDS.forEach((field) => {
    if (!hasOwn(incoming, field) && hasOwn(previous, field)) {
      merged[field] = previous[field];
    }
  });
  return merged;
};

export const resolveUserCosmetics = (user) => {
  if (!user || typeof user !== 'object') {
    return {
      avatar: getUserAvatar(null),
      profileFrame: null,
      entryEffect: null,
      chatBubble: null,
      tassel: null,
      entrance: null,
      micWave: null,
      badge: null,
      vip: null,
      level: 1,
    };
  }

  return {
    avatar: getUserAvatar(user),
    profileFrame: resolveFrameAsset(user),
    entryEffect: normalizeCosmeticAsset(
      user.equippedEntryAsset || user.equippedEntryEffect || user.equippedEntry || null,
    ),
    chatBubble: user.equippedChatBubbleAsset || user.equippedChatBubble || null,
    tassel: normalizeCosmeticAsset(
      user.equippedTasselAsset || user.equippedTassel || user.equippedTassle || null,
    ),
    entrance: normalizeCosmeticAsset(user.equippedEntranceAsset || user.equippedEntrance || null),
    micWave: user.equippedMicWave || null,
    badge:
      user.equippedBadge ||
      (Array.isArray(user.equippedBadges) ? user.equippedBadges[0] : null) ||
      null,
    vip:
      user.equippedVipId ||
      user.equippedSvipId ||
      (user.isSvip ? 'SVIP' : user.isVip ? 'VIP' : null),
    level: user.level ?? null,
    wealthLevel: user.wealthLevel ?? user.level ?? null,
    wealthExp: user.wealthExp || 0,
    charmLevel: user.charmLevel ?? null,
    charmExp: user.charmExp || 0,
    vehicle: normalizeCosmeticAsset(user.equippedVehicleAsset || user.equippedVehicle || null),
    profileBorder: normalizeCosmeticAsset(user.equippedProfileBorderAsset || user.equippedProfileBorder || null),
    customId: user.equippedCustomId || null,
  };
};

export const DEFAULT_ROOM_BG = require('../assets/backgraund/default_room_bg.png');

// HD Seat Skin Assets
export const DEFAULT_SEAT_IMAGE = require('../assets/seats/default_seat.png');
export const LOCK_SEAT_IMAGE = require('../assets/seats/lock_seat.png');
export const GOLDEN_THRONE_SEAT_IMAGE = require('../assets/seats/golden_throne.jpg');
export const CYBER_POD_SEAT_IMAGE = require('../assets/seats/cyber_pod.jpg');
export const LOTUS_THRONE_SEAT_IMAGE = require('../assets/seats/lotus_throne.jpg');
export const PHOENIX_FIRE_SEAT_IMAGE = require('../assets/seats/phoenix_fire.jpg');
export const MERMAID_PEARL_SEAT_IMAGE = require('../assets/seats/mermaid_pearl.jpg');

export const SEAT_SKIN_ASSETS = {
  default: DEFAULT_SEAT_IMAGE,
  lock: LOCK_SEAT_IMAGE,
  golden_throne: GOLDEN_THRONE_SEAT_IMAGE,
  cyber_pod: CYBER_POD_SEAT_IMAGE,
  lotus_throne: LOTUS_THRONE_SEAT_IMAGE,
  phoenix_fire: PHOENIX_FIRE_SEAT_IMAGE,
  mermaid_pearl: MERMAID_PEARL_SEAT_IMAGE,
};

// Purchasable themes/skins come from the API; only code-native defaults live here.
export const DEFAULT_ROOM_THEME = {
  id: 'default',
  name: 'Default',
  coverImage: DEFAULT_ROOM_BG,
  bgColors: ['#3A0E5C', '#1E0A3C', '#0B031E'],
  previewColor: '#9333EA',
  desc: 'Default Yaro room theme with twilight beach',
  isPreset: true,
  isFree: true,
};

export const DEFAULT_SEAT_SKIN = {
  id: 'default',
  itemId: 'default',
  name: 'Golden Orb VIP Seat',
  seatSkinType: 'default',
  imageUrl: DEFAULT_SEAT_IMAGE,
  image: DEFAULT_SEAT_IMAGE,
  icon: 'chair-rolling',
  previewColor: '#F59E0B',
  borderColor: 'rgba(245, 158, 11, 0.85)',
  bgColor: 'rgba(245, 158, 11, 0.20)',
  ringColors: ['#F59E0B', '#FBBF24'],
  desc: 'Royal Golden Armchair inside glowing crystal orb with golden reflections.',
  isPreset: true,
  isFree: true,
};

export const SEAT_SKIN_CATALOG = [
  DEFAULT_SEAT_SKIN,
  {
    id: 'golden_throne',
    itemId: 'golden_throne',
    name: 'Imperial Gold Throne',
    seatSkinType: 'golden_throne',
    imageUrl: GOLDEN_THRONE_SEAT_IMAGE,
    image: GOLDEN_THRONE_SEAT_IMAGE,
    icon: 'crown',
    previewColor: '#F59E0B',
    borderColor: 'rgba(245, 158, 11, 0.85)',
    bgColor: 'rgba(245, 158, 11, 0.22)',
    ringColors: ['#F59E0B', '#FBBF24'],
    desc: 'Majestic 24k golden throne with carved royal lions, floating crown, and ruby velvet.',
    isPreset: true,
  },
  {
    id: 'cyber_pod',
    itemId: 'cyber_pod',
    name: 'Cyber Neon Pod',
    seatSkinType: 'cyber_pod',
    imageUrl: CYBER_POD_SEAT_IMAGE,
    image: CYBER_POD_SEAT_IMAGE,
    icon: 'lightning-bolt',
    previewColor: '#06B6D4',
    borderColor: 'rgba(6, 182, 212, 0.85)',
    bgColor: 'rgba(6, 182, 212, 0.22)',
    ringColors: ['#06B6D4', '#22D3EE'],
    desc: 'Futuristic floating neon gaming pod with interactive soundwave visualization rings.',
    isPreset: true,
  },
  {
    id: 'lotus_throne',
    itemId: 'lotus_throne',
    name: 'Emerald Lotus Throne',
    seatSkinType: 'lotus_throne',
    imageUrl: LOTUS_THRONE_SEAT_IMAGE,
    image: LOTUS_THRONE_SEAT_IMAGE,
    icon: 'flower',
    previewColor: '#10B981',
    borderColor: 'rgba(16, 185, 129, 0.85)',
    bgColor: 'rgba(16, 185, 129, 0.22)',
    ringColors: ['#10B981', '#34D399'],
    desc: 'Ethereal glowing jade crystal lotus blossom throne with celestial runes.',
    isPreset: true,
  },
  {
    id: 'phoenix_fire',
    itemId: 'phoenix_fire',
    name: 'Phoenix Dragon Throne',
    seatSkinType: 'phoenix_fire',
    imageUrl: PHOENIX_FIRE_SEAT_IMAGE,
    image: PHOENIX_FIRE_SEAT_IMAGE,
    icon: 'fire',
    previewColor: '#EF4444',
    borderColor: 'rgba(239, 68, 68, 0.85)',
    bgColor: 'rgba(239, 68, 68, 0.22)',
    ringColors: ['#EF4444', '#F59E0B'],
    desc: 'Legendary sovereign throne sculpted with fiery dragon wings and blazing phoenix flames.',
    isPreset: true,
  },
  {
    id: 'mermaid_pearl',
    itemId: 'mermaid_pearl',
    name: 'Mermaid Pearl Seashell',
    seatSkinType: 'mermaid_pearl',
    imageUrl: MERMAID_PEARL_SEAT_IMAGE,
    image: MERMAID_PEARL_SEAT_IMAGE,
    icon: 'water',
    previewColor: '#38BDF8',
    borderColor: 'rgba(56, 189, 248, 0.85)',
    bgColor: 'rgba(56, 189, 248, 0.22)',
    ringColors: ['#38BDF8', '#818CF8'],
    desc: 'Oceanic pearl oyster seashell throne with aquamarine water crystals and golden coral.',
    isPreset: true,
  },
];

export const ROOM_THEME_CATALOG = [
  DEFAULT_ROOM_THEME,
  {
    id: 'cyber_neon',
    itemId: 'cyber_neon',
    name: 'Cyber Neon',
    coverImage: null,
    bgColors: ['#031B33', '#062B4E', '#010E1D'],
    previewColor: '#06B6D4',
    desc: 'Futuristic electric blue neon gaming pod theme',
    isPreset: true,
    isFree: true,
  },
  {
    id: 'royal_gold',
    itemId: 'royal_gold',
    name: 'Imperial Gold',
    coverImage: null,
    bgColors: ['#3D2406', '#261603', '#130B01'],
    previewColor: '#F59E0B',
    desc: 'Majestic 24k golden palace with warm amber reflections',
    isPreset: true,
    isFree: true,
  },
  {
    id: 'sakura_blossom',
    itemId: 'sakura_blossom',
    name: 'Sakura Dream',
    coverImage: null,
    bgColors: ['#3D0B24', '#260616', '#14030B'],
    previewColor: '#EC4899',
    desc: 'Enchanted cherry blossom garden in midnight bloom',
    isPreset: true,
    isFree: true,
  },
  {
    id: 'galaxy_cosmos',
    itemId: 'galaxy_cosmos',
    name: 'Cosmic Galaxy',
    coverImage: null,
    bgColors: ['#1A0C3D', '#0F0626', '#060212'],
    previewColor: '#8B5CF6',
    desc: 'Deep space stars, nebula gradients and cosmic dust',
    isPreset: true,
    isFree: true,
  },
  {
    id: 'sunset_glow',
    itemId: 'sunset_glow',
    name: 'Sunset Twilight',
    coverImage: null,
    bgColors: ['#3F1523', '#270C15', '#120409'],
    previewColor: '#F97316',
    desc: 'Atmospheric crimson sunset with velvet violet horizon',
    isPreset: true,
    isFree: true,
  },
];

const asAsset = (value) => {
  if (!value) return null;
  return typeof value === 'string' ? { id: value, name: value } : value;
};

const normalizeTheme = (value) => {
  const asset = asAsset(value);
  if (!asset) return null;
  const rawId = String(asset.id || asset.itemId || asset._id || asset.name || '').toLowerCase().trim();
  const matchedPreset = ROOM_THEME_CATALOG.find((p) => {
    const pid = String(p.id).toLowerCase();
    const pname = String(p.name).toLowerCase();
    return rawId === pid || rawId === pname || rawId.includes(pid);
  });
  const base = matchedPreset || DEFAULT_ROOM_THEME;
  const isDefault = (base.id === 'default' || rawId === 'default' || !rawId);
  const metadata = asset.metadata || {};

  return {
    ...base,
    ...asset,
    id: asset.id || asset.itemId || asset._id || base.id,
    itemId: asset.itemId || asset.id || asset._id || base.itemId,
    name: asset.name || base.name,
    coverImage:
      asset.coverImage !== undefined
        ? asset.coverImage
        : (asset.imageUrl || asset.animationUrl || asset.backgroundImage || metadata.coverImage || (isDefault ? DEFAULT_ROOM_BG : base.coverImage)),
    bgColors:
      (Array.isArray(asset.bgColors) && asset.bgColors.length >= 2 ? asset.bgColors : null) ||
      (Array.isArray(asset.backgroundColors) && asset.backgroundColors.length >= 2 ? asset.backgroundColors : null) ||
      (Array.isArray(metadata.bgColors) && metadata.bgColors.length >= 2 ? metadata.bgColors : null) ||
      base.bgColors,
    previewColor:
      asset.previewColor || metadata.previewColor || asset.bgColor || base.previewColor,
  };
};

const normalizeSeatSkin = (value) => {
  const asset = asAsset(value);
  if (!asset) return null;
  const rawId = String(asset.id || asset.itemId || asset._id || asset.name || '').toLowerCase().trim();
  const metadata = asset.metadata || {};

  // Check if matches any preset by ID or name or seatSkinType
  const matchedPreset = SEAT_SKIN_CATALOG.find((p) => {
    const pid = String(p.id).toLowerCase();
    const pname = String(p.name).toLowerCase();
    const ptype = String(p.seatSkinType || '').toLowerCase();
    return (
      rawId === pid ||
      rawId === pname ||
      rawId === ptype ||
      String(metadata.seatSkinType || '').toLowerCase() === pid ||
      String(metadata.seatSkinType || '').toLowerCase() === ptype ||
      String(asset.name || '').toLowerCase() === pname ||
      rawId.includes(pid)
    );
  });

  const base = matchedPreset || DEFAULT_SEAT_SKIN;

  return {
    ...base,
    ...asset,
    id: asset.id || asset.itemId || asset._id || base.id,
    itemId: asset.itemId || asset.id || asset._id || base.itemId,
    name: asset.name || base.name,
    imageUrl: asset.imageUrl || asset.coverImage || metadata.imageUrl || base.imageUrl,
    seatSkinType: asset.seatSkinType || metadata.seatSkinType || base.seatSkinType,
    icon: asset.icon || metadata.icon || base.icon,
    previewColor:
      asset.previewColor || metadata.previewColor || asset.bgColor || base.previewColor,
    borderColor: asset.borderColor || metadata.borderColor || base.borderColor,
    bgColor: asset.bgColor || metadata.bgColor || base.bgColor,
    ringColors: asset.ringColors || metadata.ringColors || base.ringColors,
    desc: asset.desc || metadata.desc || metadata.description || base.desc,
  };
};

export const resolveRoomTheme = (room, currentTheme = null) =>
  normalizeTheme(currentTheme || room?.themeAsset || room?.equippedRoomTheme) ||
  (room?.themeId ? normalizeTheme({ id: room.themeId, name: room.themeId }) : null) ||
  DEFAULT_ROOM_THEME;

export const resolveSeatSkin = (room, currentSeatSkin = null) =>
  normalizeSeatSkin(currentSeatSkin || room?.seatSkinAsset) ||
  (room?.seatSkinId ? normalizeSeatSkin({ id: room.seatSkinId, name: room.seatSkinId }) : null) ||
  DEFAULT_SEAT_SKIN;
