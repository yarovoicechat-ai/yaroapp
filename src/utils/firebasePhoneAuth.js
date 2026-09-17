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

  if (__DEV__) {
    console.log('[FirebasePhoneAuth Error Raw Code]:', error?.code);
    console.log('[FirebasePhoneAuth Error Raw Message]:', rawMsg);
    console.log('[FirebasePhoneAuth Extracted Code]:', normalizedCode);
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
        message: 'OTP requests are temporarily unavailable. Please try again later.',
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
      return {
        title: 'Something Went Wrong',
        message: "We couldn't process your request right now. Please try again.",
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

    if (__DEV__) {
      console.log('[sendFirebasePhoneOtp] Requesting OTP for:', normalizedPhone);
    }

    const confirmation = await auth.signInWithPhoneNumber(normalizedPhone, forceResend);
    await saveOtpSendTimestamp(normalizedPhone);

    return confirmation.verificationId;
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
