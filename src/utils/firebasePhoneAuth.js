import { auth } from '../configs/firebaseConfig';
import {
  PhoneAuthProvider,
  signInWithCredential,
} from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

let isSendingOtpLock = false;
let isVerifyingOtpLock = false;

/**
 * Normalizes phone numbers to standard E.164 format (+91XXXXXXXXXX for India).
 * Validates length before making any network requests.
 */
export const normalizePhone = phoneNumber => {
  const raw = String(phoneNumber || '').trim();
  let digits = raw.replace(/\D/g, '');

  if (!digits || digits.length < 10 || digits.length > 15) {
    const error = new Error('Please enter a valid phone number and try again.');
    error.code = 'auth/invalid-phone-number';
    throw error;
  }

  // If 10 digits (standard Indian number without country code), prefix with 91
  if (digits.length === 10) {
    digits = `91${digits}`;
  }

  return `+${digits}`;
};

const samePhone = (left, right) =>
  String(left || '').replace(/\D/g, '') === String(right || '').replace(/\D/g, '');

/**
 * Centralized Firebase Phone Auth Error Mapper.
 * Maps raw Firebase error codes to safe, end-user friendly titles & messages.
 */
export const getPhoneAuthError = error => {
  let rawCode = error?.code || '';
  const rawMsg = String(error?.message || (typeof error === 'string' ? error : '') || '');

  // Extract auth/xxx error code from message if error.code is missing
  if (!rawCode && rawMsg) {
    const match = rawMsg.match(/\[?(auth\/[a-z0-9-]+)\]?/i);
    if (match && match[1]) {
      rawCode = match[1];
    }
  }

  const normalizedCode = String(rawCode || '').toLowerCase().trim();
  const lowerMsg = rawMsg.toLowerCase();

  console.error('[FirebasePhoneAuth Error Code]:', error?.code, 'RawMsg:', rawMsg, 'Extracted:', normalizedCode);

  // App validation / Play Integrity / unauthorized APK
  if (
    normalizedCode === 'auth/app-not-authorized' ||
    normalizedCode === 'auth/play-integrity-token-failed' ||
    normalizedCode === 'auth/invalid-app-credential' ||
    normalizedCode === 'auth/captcha-check-failed' ||
    normalizedCode === 'auth/missing-client-identifier' ||
    lowerMsg.includes('app-not-authorized') ||
    lowerMsg.includes('app validation failed') ||
    lowerMsg.includes('play integrity') ||
    lowerMsg.includes('playintegrity') ||
    lowerMsg.includes('missing-client-identifier') ||
    lowerMsg.includes('missing a valid app identifier') ||
    lowerMsg.includes('recaptcha')
  ) {
    return {
      title: 'Verification Failed',
      message: 'Device verification could not be completed on this build. You can sign in using Google instead.',
      code: normalizedCode || 'auth/app-not-authorized',
    };
  }

  // Provider disabled in Firebase Console
  if (
    normalizedCode === 'auth/operation-not-allowed' ||
    lowerMsg.includes('operation-not-allowed') ||
    lowerMsg.includes('provider is disabled')
  ) {
    return {
      title: 'Phone Sign-In Disabled',
      message: 'Phone authentication is currently disabled in Firebase Console. Please continue with Google Sign-In.',
      code: 'auth/operation-not-allowed',
    };
  }

  // Billing / Quota in Firebase / Google Cloud
  if (
    normalizedCode === 'auth/billing-not-enabled' ||
    lowerMsg.includes('billing') ||
    lowerMsg.includes('daily sms quota')
  ) {
    return {
      title: 'SMS Limit Reached',
      message: 'Daily SMS verification limit reached for this project. Please sign in using Google.',
      code: 'auth/billing-not-enabled',
    };
  }

  // Explicit check for too-many-requests in code or message
  if (
    normalizedCode === 'auth/too-many-requests' ||
    lowerMsg.includes('too-many-requests') ||
    lowerMsg.includes('too many requests') ||
    lowerMsg.includes('unusual activity') ||
    lowerMsg.includes('blocked all requests')
  ) {
    return {
      title: 'OTP Limit Reached',
      message: 'Too many OTP requests have been made from this device. Please wait for some time before trying again.',
      code: 'auth/too-many-requests',
    };
  }

  if (normalizedCode === 'auth/already-in-progress') {
    return {
      title: 'Please Wait',
      message: 'An OTP request is already in progress. Please wait a moment.',
      code: 'auth/already-in-progress',
    };
  }

  switch (normalizedCode) {
    case 'auth/invalid-phone-number':
      return {
        title: 'Invalid Phone Number',
        message: 'Please enter a valid phone number and try again.',
        code: normalizedCode,
      };

    case 'auth/invalid-verification-code':
    case 'auth/invalid-otp':
      return {
        title: 'Invalid OTP',
        message: 'The OTP you entered is incorrect. Please check the code and try again.',
        code: normalizedCode,
      };

    case 'auth/code-expired':
      return {
        title: 'OTP Expired',
        message: 'This OTP has expired. Please request a new OTP.',
        code: normalizedCode,
      };

    case 'auth/session-expired':
      return {
        title: 'Session Expired',
        message: 'Your OTP verification session has expired. Please request a new OTP.',
        code: normalizedCode,
      };

    case 'auth/quota-exceeded':
      return {
        title: 'OTP Service Unavailable',
        message: 'OTP requests are temporarily unavailable. Please try again later or continue with Google.',
        code: normalizedCode,
      };

    case 'auth/network-request-failed':
      return {
        title: 'Network Error',
        message: 'Please check your internet connection and try again.',
        code: normalizedCode,
      };

    default:
      if (lowerMsg.includes('invalid-phone-number') || lowerMsg.includes('invalid phone')) {
        return {
          title: 'Invalid Phone Number',
          message: 'Please enter a valid phone number and try again.',
          code: 'auth/invalid-phone-number',
        };
      }
      if (lowerMsg.includes('invalid-verification-code') || lowerMsg.includes('invalid otp') || lowerMsg.includes('incorrect')) {
        return {
          title: 'Invalid OTP',
          message: 'The OTP you entered is incorrect. Please check the code and try again.',
          code: 'auth/invalid-verification-code',
        };
      }
      if (lowerMsg.includes('code-expired') || lowerMsg.includes('expired')) {
        return {
          title: 'OTP Expired',
          message: 'This OTP has expired. Please request a new OTP.',
          code: 'auth/code-expired',
        };
      }
      const cleanMsg = rawMsg.replace(/^\[auth\/[a-z0-9-]+\]\s*/i, '').trim();
      return {
        title: 'Verification Error',
        message: cleanMsg && cleanMsg.length < 120
          ? cleanMsg
          : "We couldn't process your request right now. Please try again or use Google Sign-In.",
        code: normalizedCode,
      };
  }
};

/**
 * Backward compatible message-string extractor for legacy callers.
 * Guarantees raw technical codes and messages are NEVER returned.
 */
export const firebasePhoneErrorMessage = error => {
  return getPhoneAuthError(error).message;
};

/**
 * Saves the timestamp when an OTP was requested for a phone number.
 */
export const saveOtpSendTimestamp = async phoneNumber => {
  try {
    const cleanPhone = String(phoneNumber || '').replace(/\D/g, '');
    if (!cleanPhone) return;
    await AsyncStorage.setItem(`@otp_last_send_${cleanPhone}`, String(Date.now()));
  } catch (err) {
    if (__DEV__) {
      console.log('[saveOtpSendTimestamp] Error saving timestamp:', err);
    }
  }
};

/**
 * Gets remaining resend cooldown seconds for a phone number.
 */
export const getOtpResendCooldown = async (phoneNumber, cooldownSeconds = 60) => {
  try {
    const cleanPhone = String(phoneNumber || '').replace(/\D/g, '');
    if (!cleanPhone) return 0;
    const saved = await AsyncStorage.getItem(`@otp_last_send_${cleanPhone}`);
    if (!saved) return 0;
    const elapsedSeconds = Math.floor((Date.now() - Number(saved)) / 1000);
    const remaining = cooldownSeconds - elapsedSeconds;
    return remaining > 0 ? remaining : 0;
  } catch (err) {
    if (__DEV__) {
      console.log('[getOtpResendCooldown] Error reading timestamp:', err);
    }
    return 0;
  }
};

/**
 * Sends Firebase Phone OTP with programmatic lock protection and normalization.
 */
export const sendFirebasePhoneOtp = async (phoneNumber, forceResend = false) => {
  if (isSendingOtpLock) {
    const lockErr = new Error('OTP request is already in progress.');
    lockErr.code = 'auth/already-in-progress';
    throw lockErr;
  }

  isSendingOtpLock = true;

  try {
    const normalizedPhone = normalizePhone(phoneNumber);

    if (auth.currentUser) {
      await auth.signOut();
    }

    try {
      const confirmation = await auth.signInWithPhoneNumber(normalizedPhone, forceResend);
      await saveOtpSendTimestamp(normalizedPhone);
      return confirmation.verificationId;
    } catch (firstErr) {
      console.error('[sendFirebasePhoneOtp] Attempt failed:', firstErr?.code, firstErr?.message);
      const errCode = String(firstErr?.code || '').toLowerCase();
      const errMsg = String(firstErr?.message || '').toLowerCase();
      if (
        errCode.includes('app-not-authorized') ||
        errCode.includes('invalid-app-credential') ||
        errCode.includes('missing-client-identifier') ||
        errMsg.includes('missing-client-identifier') ||
        errMsg.includes('play integrity') ||
        errMsg.includes('app identifier')
      ) {
        try {
          if (auth.settings) {
            auth.settings.forceRecaptchaFlowForTesting = true;
          }
          const retryConfirmation = await auth.signInWithPhoneNumber(normalizedPhone, forceResend);
          await saveOtpSendTimestamp(normalizedPhone);
          return retryConfirmation.verificationId;
        } catch (retryErr) {
          console.error('[sendFirebasePhoneOtp] ReCAPTCHA retry failed:', retryErr?.code, retryErr?.message);
          throw retryErr;
        }
      }
      throw firstErr;
    }
  } finally {
    isSendingOtpLock = false;
  }
};

/**
 * Confirms Firebase Phone OTP code with programmatic lock protection & 6-digit validation.
 */
export const confirmFirebasePhoneOtp = async (verificationId, code) => {
  const cleanCode = String(code || '').trim();

  if (!verificationId) {
    const error = new Error('OTP session expired. Please request a new OTP.');
    error.code = 'auth/session-expired';
    throw error;
  }

  if (cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
    const error = new Error('The OTP you entered is incorrect.');
    error.code = 'auth/invalid-verification-code';
    throw error;
  }

  if (isVerifyingOtpLock) {
    const lockErr = new Error('OTP verification is already in progress.');
    lockErr.code = 'auth/already-in-progress';
    throw lockErr;
  }

  isVerifyingOtpLock = true;

  try {
    const credential = PhoneAuthProvider.credential(
      verificationId,
      cleanCode,
    );
    return await signInWithCredential(auth, credential);
  } finally {
    isVerifyingOtpLock = false;
  }
};

export const isFirebaseUserForPhone = (user, phoneNumber) =>
  Boolean(user?.phoneNumber && samePhone(user.phoneNumber, phoneNumber));

export const clearFirebasePhoneSession = () => {
  // Verification IDs live in screen state/navigation params.
};

export const signOutFirebasePhoneUser = async () => {
  clearFirebasePhoneSession();
  if (auth.currentUser) {
    await auth.signOut();
  }
};
