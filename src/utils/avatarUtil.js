import DEFAULT_FEMALE_AVATAR from '../assets/avatars/female_default.webp';
import DEFAULT_MALE_AVATAR from '../assets/avatars/male_default.webp';
import DEFAULT_NEUTRAL_AVATAR from '../assets/avatars/neutral_default.webp';
import { API_BASE_URL } from './apiUtil';

export { DEFAULT_FEMALE_AVATAR, DEFAULT_MALE_AVATAR, DEFAULT_NEUTRAL_AVATAR };

// Get backend domain base (e.g. 'https://api.yaroapp.in')
const SERVER_DOMAIN = (API_BASE_URL || 'https://api.yaroapp.in/api').replace(/\/api\/?$/i, '');

/**
 * Normalizes gender string safely to 'female', 'male', or 'neutral'
 */
export const normalizeGender = (gender) => {
  if (!gender || typeof gender !== 'string') return 'neutral';
  const g = gender.trim().toLowerCase();
  if (g === 'female' || g === 'f' || g === 'girl' || g === 'woman' || g === 'lady') {
    return 'female';
  }
  if (g === 'male' || g === 'm' || g === 'boy' || g === 'man') {
    return 'male';
  }
  return 'neutral';
};

/**
 * Resolves the default avatar asset based on gender
 */
export const getDefaultAvatar = (gender) => {
  const norm = normalizeGender(gender);
  if (norm === 'female') return DEFAULT_FEMALE_AVATAR;
  if (norm === 'male') return DEFAULT_MALE_AVATAR;
  return DEFAULT_NEUTRAL_AVATAR;
};

/**
 * Validates if custom avatar string is a valid image URL or URI candidate
 */
export const isValidAvatarUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  const str = url.trim();
  const lower = str.toLowerCase();

  if (
    str === '' ||
    lower === 'null' ||
    lower === 'undefined' ||
    lower === 'none' ||
    lower === 'false' ||
    lower === '0' ||
    lower.includes('placeholder') ||
    lower.includes('uploads/avatars/male_default') ||
    lower.includes('uploads/avatars/female_default') ||
    lower.includes('uploads/avatars/neutral_default') ||
    lower.includes('default_male') ||
    lower.includes('default_female') ||
    lower.includes('default_neutral')
  ) {
    return false;
  }
  return true;
};

/**
 * Central avatar resolver for React Native <Image source={getUserAvatar(user)} />
 */
export const getUserAvatar = (userOrImage, fallbackGender = null) => {
  if (!userOrImage) {
    return getDefaultAvatar(fallbackGender);
  }

  // If userOrImage is a local require(...) asset (number)
  if (typeof userOrImage === 'number') {
    return userOrImage;
  }

  let customUrl = null;
  let gender = fallbackGender;

  if (typeof userOrImage === 'object') {
    // If it's already an image source object like { uri: '...' }
    if (userOrImage.uri && typeof userOrImage.uri === 'string') {
      customUrl = userOrImage.uri;
    } else {
      // If userOrImage is a StoreItem or inventory item (not a user account), do not use item asset as avatar
      const isStoreItem = Boolean(
        userOrImage.category ||
        userOrImage.coverType ||
        userOrImage.priceOptions ||
        (userOrImage.price !== undefined && userOrImage.validity !== undefined)
      );

      if (!isStoreItem) {
        // Collect frame URLs to prevent frame image from replacing user avatar
        const frameUrl =
          userOrImage.equippedFrameAsset?.imageUrl ||
          userOrImage.equippedFrameAsset?.image ||
          userOrImage.equippedFrameAsset?.animationUrl ||
          null;

        const candidate =
          userOrImage.avatar ||
          userOrImage.profilePic ||
          userOrImage.photo ||
          userOrImage.profileImage ||
          userOrImage.image;

        // Candidate must not be the frame asset URL or an SVGA animation
        if (
          candidate &&
          typeof candidate === 'string' &&
          candidate !== frameUrl &&
          !candidate.toLowerCase().endsWith('.svga')
        ) {
          customUrl = candidate;
        }
      }
    }

    if (!gender) {
      gender =
        userOrImage.gender ||
        userOrImage.sex ||
        userOrImage.userGender ||
        userOrImage.hostGender;
    }
  } else if (typeof userOrImage === 'string') {
    // If a raw string is passed, make sure it is not an SVGA frame
    if (!userOrImage.toLowerCase().endsWith('.svga')) {
      customUrl = userOrImage;
    }
  }

  // Handle nested object inside image prop (e.g. user.image = { uri: '...' })
  if (customUrl && typeof customUrl === 'object' && customUrl.uri) {
    customUrl = customUrl.uri;
  }

  // Handle local require(...) asset inside image prop
  if (typeof customUrl === 'number') {
    return customUrl;
  }

  // Validate custom URL string
  if (isValidAvatarUrl(customUrl)) {
    const cleanUrl = customUrl.trim();

    // Absolute URLs, Data URIs, File URIs, Content URIs
    if (
      cleanUrl.startsWith('http://') ||
      cleanUrl.startsWith('https://') ||
      cleanUrl.startsWith('data:') ||
      cleanUrl.startsWith('file:') ||
      cleanUrl.startsWith('content:')
    ) {
      return { uri: cleanUrl };
    }

    // Protocol-relative URLs (e.g., //res.cloudinary.com/...)
    if (cleanUrl.startsWith('//')) {
      return { uri: `https:${cleanUrl}` };
    }

    // Relative server paths (e.g., /uploads/..., uploads/..., avatars/...)
    const pathWithLeadingSlash = cleanUrl.startsWith('/') ? cleanUrl : `/${cleanUrl}`;
    return { uri: `${SERVER_DOMAIN}${pathWithLeadingSlash}` };
  }

  return getDefaultAvatar(gender);
};

export default getUserAvatar;
