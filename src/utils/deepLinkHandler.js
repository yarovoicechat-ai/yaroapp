import { Linking } from 'react-native';
import { navigationRef } from './navigationRef';

let pendingDeepLink = null;

/**
 * Parses deep link URL or intent string into target screen and parameters.
 * Supported formats:
 * - https://yaroapp.in/room/:id
 * - http://yaroapp.in/room/:id
 * - yaro://room/:id
 * - voiceclub://room/:id
 * - https://yaroapp.in/user/:id
 * - yaro://user/:id
 * - https://yaroapp.in/profile/:id
 * - https://yaroapp.in/host/:id
 * - yaro://host/:id
 * - https://yaroapp.in/refer/:code
 * - https://yaroapp.in/invite/:code
 * - https://yaroapp.in/invite?ref=:code
 * - yaro://refer/:code
 * - Play Store referrer string: room_1000000004 or user_1000000004 or referralCode=YR1234
 */
export const parseDeepLinkUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') return null;

  try {
    const cleanUrl = rawUrl.trim();
    console.log('[DeepLink] Parsing incoming URL:', cleanUrl);

    // 1. Room Deep Link: /room/:roomId or /rooms/:roomId or ?roomId=... or referrer=room_...
    const roomMatch = cleanUrl.match(/(?:room|rooms)\/([A-Za-z0-9_-]+)/i)
      || cleanUrl.match(/[?&](?:roomId|room)=([A-Za-z0-9_-]+)/i)
      || cleanUrl.match(/room_([A-Za-z0-9_-]+)/i);

    if (roomMatch && roomMatch[1]) {
      const roomId = roomMatch[1];
      return {
        screen: 'VoiceRoom',
        params: { roomId, id: roomId },
      };
    }

    // 2. Host Profile Deep Link: /host/:hostId or /hosts/:hostId or ?hostId=...
    const hostMatch = cleanUrl.match(/(?:host|hosts)\/([A-Za-z0-9_-]+)/i)
      || cleanUrl.match(/[?&]hostId=([A-Za-z0-9_-]+)/i);

    if (hostMatch && hostMatch[1]) {
      const hostId = hostMatch[1];
      return {
        screen: 'HostProfile',
        params: { hostId, id: hostId },
      };
    }

    // 3. User Profile Deep Link: /user/:userId or /profile/:userId or ?userId=... or referrer=user_...
    const userMatch = cleanUrl.match(/(?:user|profile|users)\/([A-Za-z0-9_-]+)/i)
      || cleanUrl.match(/[?&](?:userId|uid)=([A-Za-z0-9_-]+)/i)
      || cleanUrl.match(/user_([A-Za-z0-9_-]+)/i);

    if (userMatch && userMatch[1]) {
      const userId = userMatch[1];
      return {
        screen: 'UserProfile',
        params: { userId, id: userId },
      };
    }

    // 4. Invite & Earn / Referral: /refer/:code or /invite/:code or ?ref=... or ?referralCode=...
    const referMatch = cleanUrl.match(/(?:refer|invite)\/([A-Za-z0-9_-]+)/i)
      || cleanUrl.match(/[?&](?:referralCode|ref|code)=([A-Za-z0-9_-]+)/i);

    if (referMatch && referMatch[1]) {
      const referralCode = referMatch[1].toUpperCase();
      return {
        screen: 'InviteEarn',
        params: { referralCode, code: referralCode },
      };
    }
  } catch (err) {
    console.warn('[DeepLink] Error parsing URL:', err.message);
  }

  return null;
};

/**
 * Dispatches navigation for a deep link if navigator is ready.
 * If not ready (e.g. splash screen or auth loading), stores as pending.
 */
export const handleDeepLink = (url) => {
  if (!url) return false;

  const parsed = parseDeepLinkUrl(url);
  if (!parsed) return false;

  if (navigationRef.isReady()) {
    console.log('[DeepLink] Navigating directly to screen:', parsed.screen, parsed.params);
    setTimeout(() => {
      try {
        navigationRef.navigate(parsed.screen, parsed.params);
      } catch (e) {
        console.warn('[DeepLink] Navigation error:', e);
      }
    }, 150);
    pendingDeepLink = null;
    return true;
  } else {
    console.log('[DeepLink] Navigator not ready yet. Storing pending deep link:', url);
    pendingDeepLink = parsed;
    return false;
  }
};

/**
 * Executes any queued deep link that arrived before navigator was ready.
 */
export const executePendingDeepLink = () => {
  if (!pendingDeepLink) return;

  const parsed = pendingDeepLink;
  pendingDeepLink = null;

  if (parsed && navigationRef.isReady()) {
    console.log('[DeepLink] Executing pending deep link navigation:', parsed.screen, parsed.params);
    setTimeout(() => {
      try {
        navigationRef.navigate(parsed.screen, parsed.params);
      } catch (e) {
        console.warn('[DeepLink] executePendingDeepLink error:', e);
      }
    }, 300);
  }
};

/**
 * Setup deep link listeners on initial app start and incoming intents.
 */
export const setupDeepLinkListener = () => {
  // 1. Initial URL on launch (Cold start)
  Linking.getInitialURL()
    .then((url) => {
      if (url) {
        console.log('[DeepLink] Cold launch initial URL:', url);
        handleDeepLink(url);
      }
    })
    .catch((err) => console.warn('[DeepLink] getInitialURL error:', err));

  // 2. Incoming URL while app is open / foregrounded (Warm start)
  const subscription = Linking.addEventListener('url', ({ url }) => {
    if (url) {
      console.log('[DeepLink] Warm launch / incoming URL:', url);
      handleDeepLink(url);
    }
  });

  return () => {
    if (subscription && typeof subscription.remove === 'function') {
      subscription.remove();
    }
  };
};
