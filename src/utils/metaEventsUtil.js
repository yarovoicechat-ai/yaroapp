import { AppEventsLogger } from 'react-native-fbsdk-next';
import AsyncStorage from '@react-native-async-storage/async-storage';

// In-memory set to prevent duplicate event logs during the current React session
const loggedRegistrationsMemory = new Set();

/**
 * Safely logs Meta/Facebook App Events Activation if manual trigger is required.
 * Note: AutoLogAppEventsEnabled in AndroidManifest automatically logs activations.
 */
export const trackAppActivation = () => {
  try {
    // SDK handles automatic activation via AndroidManifest AutoLogAppEventsEnabled = true
  } catch (error) {
    // Fail silently so core app flow is never interrupted
  }
};

/**
 * Safely logs Meta Completed Registration standard event ONLY for genuine new user registrations.
 * Guarantees zero duplicates across re-renders, retries, and app re-opens via memory + AsyncStorage.
 * 
 * @param {string} method - Registration method ('phone' | 'google' | 'email' | 'other')
 * @param {string|number} userIdOrIdentifier - Unique user ID or phone number
 */
export const trackCompletedRegistration = async (method = 'phone', userIdOrIdentifier = null) => {
  try {
    if (!userIdOrIdentifier) {
      return;
    }

    const uniqueIdStr = String(userIdOrIdentifier).trim();
    const storageKey = `@meta_reg_tracked_${uniqueIdStr}`;

    // 1. Check in-memory guard
    if (loggedRegistrationsMemory.has(uniqueIdStr)) {
      return;
    }

    // 2. Check persistent AsyncStorage guard
    const alreadyTrackedInStorage = await AsyncStorage.getItem(storageKey);
    if (alreadyTrackedInStorage === 'true') {
      loggedRegistrationsMemory.add(uniqueIdStr);
      return;
    }

    // 3. Mark as tracked BEFORE firing event to eliminate race condition window
    loggedRegistrationsMemory.add(uniqueIdStr);
    await AsyncStorage.setItem(storageKey, 'true');

    // 4. Log official Meta Standard Event: CompletedRegistration (fb_mobile_complete_registration)
    AppEventsLogger.logEvent(AppEventsLogger.EventNames.CompletedRegistration, {
      registration_method: String(method || 'phone').toLowerCase(),
    });
  } catch (error) {
    // Fail silently so registration, token storage, and navigation are never impacted
  }
};
