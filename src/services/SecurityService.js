import { NativeModules, Platform } from 'react-native';
import apiUtil from '../utils/apiUtil';

// In-memory cache for dynamic screen security rules
let cachedSecurityRules = {};
let isFetched = false;

/**
 * Fetch dynamic screen security rules from Backend API
 */
export const fetchScreenSecurityRules = async () => {
  try {
    const response = await apiUtil.get('/v1/app-screens/public-config');
    if (response && response.data && response.data.screens) {
      cachedSecurityRules = response.data.screens;
      isFetched = true;
      console.log('[SecurityService] Dynamic Screen Security Rules loaded:', Object.keys(cachedSecurityRules).length, 'screens');
    }
  } catch (error) {
    console.warn('[SecurityService] Failed to load remote screen security config, using local security defaults.', error.message);
  }
};

/**
 * Apply Dynamic Screenshot & Screen Recording Security Protection for a Screen
 * @param {string} screenCode - Unique screen code (e.g. 'Wallet', 'VideoCall', 'KycVerification', 'Withdrawal')
 */
export const applyScreenSecurity = async (screenCode) => {
  if (!isFetched) {
    await fetchScreenSecurityRules();
  }

  const screenRule = cachedSecurityRules[screenCode];

  // Default sensitivity defaults for critical screens if network fails
  const sensitiveScreens = ['Wallet', 'VideoCall', 'AudioCall', 'KycVerification', 'Withdrawal', 'FaceVerification', 'ChatDetail'];
  const isDefaultSensitive = sensitiveScreens.includes(screenCode);

  const allowScreenshot = screenRule ? screenRule.allowScreenshot : !isDefaultSensitive;
  const allowScreenRecording = screenRule ? screenRule.allowScreenRecording : !isDefaultSensitive;
  const shouldEnableFlagSecure = screenRule ? screenRule.flagSecureEnabled : isDefaultSensitive;

  console.log(`[SecurityService] '${screenCode}' Security Rules -> Screenshot: ${allowScreenshot ? 'ALLOWED' : 'BLOCKED'}, Recording: ${allowScreenRecording ? 'ALLOWED' : 'BLOCKED'}, FLAG_SECURE: ${shouldEnableFlagSecure}`);

  // Apply Native Android Window FLAG_SECURE if screenshot/recording is blocked
  if (Platform.OS === 'android') {
    try {
      const FlagSecureModule = NativeModules.FlagSecureModule || NativeModules.PreventScreenshot;
      if (FlagSecureModule) {
        if (shouldEnableFlagSecure || !allowScreenshot || !allowScreenRecording) {
          if (FlagSecureModule.activate) FlagSecureModule.activate();
          else if (FlagSecureModule.forbid) FlagSecureModule.forbid();
        } else {
          if (FlagSecureModule.deactivate) FlagSecureModule.deactivate();
          else if (FlagSecureModule.allow) FlagSecureModule.allow();
        }
      }
    } catch (e) {
      console.warn('[SecurityService] Native FLAG_SECURE module execution warning:', e);
    }
  }

  return {
    allowScreenshot,
    allowScreenRecording,
    flagSecureEnabled: shouldEnableFlagSecure,
  };
};

export default {
  fetchScreenSecurityRules,
  applyScreenSecurity,
};
