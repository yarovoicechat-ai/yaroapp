import { BUNDLED_EMOJIS } from '../constants/roomEmojis';
import { resolveAssetUrl } from './cosmeticResolver';

const assetPath = value => typeof value === 'string' ? value.replace(/^https?:\/\/[^/]+/i, '').split(/[?#]/)[0] : '';
const imageUrl = value => typeof value === 'string' && /^(https?:\/\/|\/)/i.test(value);

export function seatReactionMedia({ emoji, gifUrl, emojiData }) {
  const bundled = BUNDLED_EMOJIS.find(item => item.code === emojiData?.code || item.code === emoji ||
    (imageUrl(emoji) && assetPath(item.pngUrl) === assetPath(emoji)) ||
    (gifUrl && assetPath(item.gifUrl) === assetPath(gifUrl)));
  const animation = gifUrl || emojiData?.gifUrl || (/\.gif(?:[?#]|$)/i.test(emoji || '') ? emoji : null);
  const cover = imageUrl(emoji) ? emoji : emojiData?.pngUrl;
  // Numeric Metro asset IDs received from another APK are not portable. Resolve
  // bundled media against this build's catalog instead of trusting the payload.
  const localFirst = bundled && (!animation || assetPath(animation) === assetPath(bundled.gifUrl));
  const candidates = [
    ...(localFirst ? [bundled.localGif] : []),
    typeof animation === 'string' && imageUrl(animation) ? { uri: resolveAssetUrl(animation) } : null,
    ...(!localFirst && bundled ? [bundled.localGif] : []),
    imageUrl(cover) ? { uri: resolveAssetUrl(cover) } : null,
    bundled?.localPng,
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
