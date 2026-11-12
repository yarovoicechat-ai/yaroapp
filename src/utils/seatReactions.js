import { BUNDLED_EMOJIS } from '../constants/roomEmojis';
import { resolveAssetUrl } from './cosmeticResolver';

const assetPath = value => typeof value === 'string' ? value.replace(/^https?:\/\/[^/]+/i, '').split(/[?#]/)[0] : '';
const imageUrl = value => typeof value === 'string' && /^(https?:\/\/|\/)/i.test(value);

export function seatReactionMedia({ emoji, gifUrl, emojiData }) {
  const bundled = BUNDLED_EMOJIS.find(item => {
    if (!item) return false;
    const targetCode = String(emojiData?.code || '').toLowerCase().trim();
    if (targetCode && item.code.toLowerCase() === targetCode) return true;

    if (typeof emoji === 'string') {
      const emojiTrim = emoji.trim();
      if (item.code.toLowerCase() === emojiTrim.toLowerCase()) return true;
      if (item.name?.toLowerCase() === emojiTrim.toLowerCase()) return true;
      const cleanEmoji = assetPath(emojiTrim).replace(/^.*[\/\\]/, '').replace(/^(anim_)?emoji_/, '').replace(/\.(png|gif|webp)$/i, '').toLowerCase();
      const cleanCode = item.code.replace(/^(anim_)?emoji_/, '').toLowerCase();
      if (cleanEmoji && cleanEmoji === cleanCode) return true;
      if (imageUrl(emojiTrim) && (assetPath(item.pngUrl) === assetPath(emojiTrim) || assetPath(item.gifUrl) === assetPath(emojiTrim))) return true;
    }

    if (typeof gifUrl === 'number' && item.localGif === gifUrl) return true;
    if (typeof gifUrl === 'string') {
      const gifTrim = gifUrl.trim();
      if (item.code.toLowerCase() === gifTrim.toLowerCase()) return true;
      const cleanGif = assetPath(gifTrim).replace(/^.*[\/\\]/, '').replace(/^(anim_)?emoji_/, '').replace(/\.(png|gif|webp)$/i, '').toLowerCase();
      const cleanCode = item.code.replace(/^(anim_)?emoji_/, '').toLowerCase();
      if (cleanGif && cleanGif === cleanCode) return true;
      if (assetPath(item.gifUrl) === assetPath(gifTrim)) return true;
    }
    return false;
  });

  // animation gif candidate
  let animation = gifUrl || emojiData?.gifUrl || (typeof emoji === 'string' && /\.gif(?:[?#]|$)/i.test(emoji) ? emoji : null);
  if (!animation && typeof emoji === 'string' && imageUrl(emoji)) {
    const replaced = emoji.replace(/\/emoji_([^/\\?#]+)\.png/i, '/anim_emoji_$1.gif');
    if (replaced !== emoji) {
      animation = replaced;
    }
  }

  const cover = imageUrl(emoji) ? emoji : emojiData?.pngUrl;
  // A custom uploaded animation for an existing code must override its bundled fallback.
  const customAnimation = [gifUrl, emojiData?.gifUrl].find(value =>
    imageUrl(value) && bundled && assetPath(value) !== assetPath(bundled.gifUrl) &&
    !/\/emoji_[^/]+\.gif(?:[?#]|$)/i.test(value));
  const candidates = bundled
    ? [customAnimation ? { uri: resolveAssetUrl(customAnimation) } : null, bundled.localGif].filter(Boolean)
    : [
      typeof animation === 'string' && imageUrl(animation) && /\/emoji_[^/]+\.gif/i.test(animation)
        ? { uri: resolveAssetUrl(animation.replace(/\/emoji_([^/]+\.gif)/i, '/anim_emoji_$1')) }
        : (typeof animation === 'string' && imageUrl(animation) ? { uri: resolveAssetUrl(animation) } : null),
      imageUrl(cover) && cover !== animation ? { uri: resolveAssetUrl(cover) } : null,
    ].filter(Boolean);

  return {
    sources: candidates,
    text: typeof emoji === 'string' && !imageUrl(emoji) && !bundled ? emoji : '🙂',
  };
}

export function reactionSeatIndex(seats, user, explicitIndex) {
  const keys = typeof user === 'object' && user !== null
    ? [user.userId, user._id, user.id] : [user];
  const ids = new Set(keys.filter(value => value !== undefined && value !== null && value !== '').map(String));
  const matched = seats.find(seat => seat.user && (
    [seat.user.userId, seat.user._id, seat.user.id].some(id => id != null && ids.has(String(id)))
  ));
  const value = matched?.seatIndex ?? explicitIndex;
  if (value === null || value === undefined || value === '') return undefined;
  const index = Number(value);
  return Number.isInteger(index) && index >= 0 ? index : undefined;
}
