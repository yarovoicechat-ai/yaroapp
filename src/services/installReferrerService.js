import { Linking, NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING_REFERRAL_KEY = 'pendingReferralCode';
const REFERRAL_CLAIMED_KEY = 'referralClaimedPermanently';

/**
 * Extracts referral code from URL string or Play Store install referrer string.
 * Supports:
 * - https://mithichat.live/refer/CODE
 * - https://mithichat.live/invite?ref=CODE
 * - mithichat://refer/CODE
 * - utm_source=mithichat&referralCode=CODE
 */
export const extractReferralCodeFromUrlOrString = (rawString) => {
  if (!rawString || typeof rawString !== 'string') return null;

  try {
    const trimmed = rawString.trim();

    // 1. Direct path matching for /refer/CODE or /invite/CODE
    const pathMatch = trimmed.match(/(?:refer|invite)\/([A-Za-z0-9_-]+)/i);
    if (pathMatch && pathMatch[1]) {
      return pathMatch[1].toUpperCase();
    }

    // 2. Query param matching for ?referralCode=CODE or ?ref=CODE or ?code=CODE
    const paramMatch = trimmed.match(/(?:referralCode|ref|code)=([A-Za-z0-9_-]+)/i);
    if (paramMatch && paramMatch[1]) {
      return paramMatch[1].toUpperCase();
    }

    // 3. Fallback standalone code (if string is just a referral code like ABC123)
    if (/^[A-Z0-9_-]{4,20}$/i.test(trimmed)) {
      return trimmed.toUpperCase();
    }
  } catch (err) {
    console.warn('[InstallReferrer] Failed to parse referral code string:', err.message);
  }

  return null;
};

/**
 * Capture referral code from initial deep link or Play Install Referrer,
 * saving it to persistent storage if not already claimed.
 */
export const captureAndStoreReferralCode = async (rawUrlOrReferrer) => {
  try {
    const isClaimed = await AsyncStorage.getItem(REFERRAL_CLAIMED_KEY);
    if (isClaimed === 'true') {
      console.log('[InstallReferrer] User has already permanently claimed referral code.');
      return null;
    }

    const existingPending = await AsyncStorage.getItem(PENDING_REFERRAL_KEY);
    if (existingPending) {
      console.log('[InstallReferrer] Existing pending referral code preserved:', existingPending);
      return existingPending;
    }

    const extractedCode = extractReferralCodeFromUrlOrString(rawUrlOrReferrer);
    if (extractedCode) {
      await AsyncStorage.setItem(PENDING_REFERRAL_KEY, extractedCode);
      console.log('✅ [REFERRAL_ATTRIBUTION_CAPTURED] Referral code stored:', extractedCode);
      return extractedCode;
    }
  } catch (err) {
    console.error('[InstallReferrer] Error storing captured referral code:', err.message);
  }

  return null;
};

/**
 * Initialize Deep Link listener and Play Install Referrer on app launch.
 */
export const initializeReferralAttribution = async () => {
  try {
    // Check initial deep link URL on app start
    const initialUrl = await Linking.getInitialURL();
    if (initialUrl) {
      console.log('[InstallReferrer] Initial Deep Link URL:', initialUrl);
      await captureAndStoreReferralCode(initialUrl);
    }

    // Listen for incoming deep links while app is open
    Linking.addEventListener('url', async ({ url }) => {
      if (url) {
        console.log('[InstallReferrer] Incoming Deep Link URL:', url);
        await captureAndStoreReferralCode(url);
      }
    });

    // Check Android Play Install Referrer (if native module available)
    if (Platform.OS === 'android' && NativeModules.InstallReferrerModule) {
      try {
        NativeModules.InstallReferrerModule.getInstallReferrer((referrerString) => {
          if (referrerString) {
            console.log('[InstallReferrer] Play Store Referrer String:', referrerString);
            captureAndStoreReferralCode(referrerString);
          }
        });
      } catch (nativeErr) {
        console.log('[InstallReferrer] Native InstallReferrerModule notice:', nativeErr.message);
      }
    }
  } catch (err) {
    console.warn('[InstallReferrer] Initialization error:', err.message);
  }
};

/**
 * Fetch currently stored pending referral code.
 */
export const getPendingReferralCode = async () => {
  try {
    const isClaimed = await AsyncStorage.getItem(REFERRAL_CLAIMED_KEY);
    if (isClaimed === 'true') return null;

    return await AsyncStorage.getItem(PENDING_REFERRAL_KEY);
  } catch (err) {
    return null;
  }
};

/**
 * Mark referral as permanently claimed and clear pending referral code.
 */
export const clearPendingReferralCode = async () => {
  try {
    await AsyncStorage.setItem(REFERRAL_CLAIMED_KEY, 'true');
    await AsyncStorage.removeItem(PENDING_REFERRAL_KEY);
    console.log('[InstallReferrer] Cleared pending referral code post-registration.');
  } catch (err) {
    console.warn('[InstallReferrer] Error clearing pending referral code:', err.message);
  }
};
