import { API_BASE_URL } from '../../utils/apiUtil';

const API_ORIGIN = String(API_BASE_URL || 'https://api.yaroapp.in/api').replace(/\/api\/?$/i, '');

export const isGiftImageUri = (value) =>
  typeof value === 'string' && (
    /^(?:https?:\/\/|file:\/\/|content:\/\/|data:image\/|\/uploads\/|uploads\/)/i.test(value.trim()) ||
    /\.(?:png|jpe?g|gif|webp|svg|svga|mp4)(?:[?#]|$)/i.test(value.trim())
  );

export const normalizeGiftImageUri = (value) => {
  if (!isGiftImageUri(value)) return '';
  const uri = value.trim();
  if (/^https?:\/\//i.test(uri) || /^(?:file|content|data):/i.test(uri)) return uri;
  return `${API_ORIGIN}/${uri.replace(/^\/+/, '')}`;
};

export const resolveGiftVisual = (gift = {}) => {
  const icons = [gift.giftEmoji, gift.emoji, gift.giftIcon, gift.icon].filter(Boolean);
  const imageCandidate =
    gift.image || gift.giftImage || gift.imageUrl || gift.iconUrl || gift.thumbnail || gift.previewUrl ||
    icons.find(isGiftImageUri) || '';
  const giftImage = normalizeGiftImageUri(imageCandidate);

  return {
    giftImage,
    giftIcon: icons.find((value) => !isGiftImageUri(value)) || '',
  };
};
