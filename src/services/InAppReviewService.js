import { NativeModules, Platform, Linking, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getReviewModule = () => NativeModules.InAppReviewModule;

export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=yaro.vc.app';
export const PLAY_STORE_MARKET_URI = 'market://details?id=yaro.vc.app';

// Minimum voice room participation time required (10 seconds)
// Prevents accidental clicks, immediate bounces, and failed room entries from triggering review
export const MIN_PARTICIPATION_DURATION_MS = 10000;

// Delay after leaving room so Agora audio teardown, socket leaves, and navigation complete
export const EXIT_TRANSITION_DELAY_MS = 1800;

const STORAGE_KEYS = {
  GLOBAL_ATTEMPTED: '@yaro_review_attempted_global',
  USER_ATTEMPTED_PREFIX: '@yaro_review_attempted_user_',
};

class InAppReviewService {
  constructor() {
    this.activeRoomSessions = new Map(); // roomId -> { joinTime, userId }
    this.isReviewFlowInProgress = false;
    this.handledExits = new Set();
  }

  /**
   * Check if Google Play In-App Review API is available on this device
   */
  async isAvailable() {
    if (Platform.OS !== 'android') return false;
    const reviewModule = getReviewModule();
    if (!reviewModule || typeof reviewModule.isAvailable !== 'function') return false;

    try {
      return await reviewModule.isAvailable();
    } catch (e) {
      console.warn('[InAppReview] isAvailable check error:', e?.message || e);
      return false;
    }
  }

  /**
   * Record that a user successfully joined and established connection to a voice room
   */
  recordRoomJoined(roomId, userId = 'guest') {
    if (!roomId) return;
    const cleanRoomId = String(roomId);
    const cleanUserId = String(userId || 'guest');

    this.activeRoomSessions.set(cleanRoomId, {
      joinTime: Date.now(),
      userId: cleanUserId,
    });

    console.log(`[InAppReview] Room joined recorded for room: ${cleanRoomId}, user: ${cleanUserId}`);
  }

  /**
   * Check whether the user/device is eligible for the one-time first-room review prompt
   */
  async isEligibleForFirstRoomReview(userId = null) {
    try {
      const globalAttempted = await AsyncStorage.getItem(STORAGE_KEYS.GLOBAL_ATTEMPTED);
      if (globalAttempted === 'true') {
        return false;
      }

      if (userId) {
        const userKey = `${STORAGE_KEYS.USER_ATTEMPTED_PREFIX}${String(userId)}`;
        const userAttempted = await AsyncStorage.getItem(userKey);
        if (userAttempted === 'true') {
          return false;
        }
      }

      return true;
    } catch (err) {
      console.warn('[InAppReview] isEligible check storage error:', err?.message || err);
      return false;
    }
  }

  /**
   * Mark that a review request attempt has been executed (persisted permanently)
   */
  async markReviewAttempted(userId = null) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.GLOBAL_ATTEMPTED, 'true');
      if (userId) {
        const userKey = `${STORAGE_KEYS.USER_ATTEMPTED_PREFIX}${String(userId)}`;
        await AsyncStorage.setItem(userKey, 'true');
      }
      console.log(`[InAppReview] Permanently marked review attempted for user: ${userId || 'global'}`);
    } catch (err) {
      console.warn('[InAppReview] markReviewAttempted storage error:', err?.message || err);
    }
  }

  /**
   * Called when a user successfully exits a voice room
   * Evaluates participation duration and initiates the one-time Google Play In-App Review
   */
  async recordRoomExited(roomId, userId = null) {
    if (!roomId) return;
    const cleanRoomId = String(roomId);
    const session = this.activeRoomSessions.get(cleanRoomId);

    // Clean up active session
    this.activeRoomSessions.delete(cleanRoomId);

    if (!session) {
      console.log(`[InAppReview] Room exit for ${cleanRoomId} ignored: no active session found (join did not succeed).`);
      return;
    }

    const duration = Date.now() - session.joinTime;
    const effectiveUserId = userId || session.userId;

    // Deduplicate exit handling for this room session
    const exitKey = `${cleanRoomId}_${session.joinTime}`;
    if (this.handledExits.has(exitKey)) {
      console.log(`[InAppReview] Exit for ${exitKey} already processed. Skipping.`);
      return;
    }
    this.handledExits.add(exitKey);

    // Rule 1: Check participation duration (must be at least MIN_PARTICIPATION_DURATION_MS)
    if (duration < MIN_PARTICIPATION_DURATION_MS) {
      console.log(`[InAppReview] Room participation duration was ${duration}ms (< ${MIN_PARTICIPATION_DURATION_MS}ms). Accidental navigation or immediate bounce, skipping review.`);
      return;
    }

    // Rule 2: Check persistent eligibility
    const eligible = await this.isEligibleForFirstRoomReview(effectiveUserId);
    if (!eligible) {
      console.log(`[InAppReview] User ${effectiveUserId} is not eligible for first-room review (already attempted).`);
      return;
    }

    // Rule 3: Avoid concurrent/duplicate launches
    if (this.isReviewFlowInProgress) {
      console.log('[InAppReview] Review flow is already in progress.');
      return;
    }

    // Mark as attempted BEFORE triggering to guarantee single-invocation safety across rapid re-renders
    await this.markReviewAttempted(effectiveUserId);

    // Schedule review launch after transition delay so room teardown, audio stop, and navigation finish
    setTimeout(async () => {
      await this.triggerGooglePlayReview();
    }, EXIT_TRANSITION_DELAY_MS);
  }

  /**
   * Trigger the official Google Play In-App Review dialog
   */
  async triggerGooglePlayReview() {
    if (this.isReviewFlowInProgress) return;
    if (AppState.currentState !== 'active') {
      console.log('[InAppReview] App is not in foreground, skipping review prompt.');
      return;
    }

    const isAvailable = await this.isAvailable();
    if (!isAvailable) {
      console.log('[InAppReview] Google Play In-App Review is not available on this platform/device.');
      return;
    }

    this.isReviewFlowInProgress = true;
    console.log('[InAppReview] Requesting Google Play In-App Review via official API...');

    try {
      const reviewModule = getReviewModule();
      const result = await reviewModule?.requestReview?.();
      console.log(`[InAppReview] Google Play In-App Review completed (flow executed: ${result}). Google Play controls dialog presentation.`);
    } catch (err) {
      console.warn('[InAppReview] Google Play review request error:', err?.message || err);
    } finally {
      this.isReviewFlowInProgress = false;
    }
  }

  /**
   * Direct fallback: opens the official Google Play Store listing for Yaro
   * Used for explicit "Rate Yaro" buttons in Settings or Help & Support
   */
  async openPlayStoreListing() {
    try {
      console.log('[InAppReview] Opening official Google Play Store listing:', PLAY_STORE_URL);
      const canOpenMarket = await Linking.canOpenURL(PLAY_STORE_MARKET_URI).catch(() => false);
      if (canOpenMarket) {
        await Linking.openURL(PLAY_STORE_MARKET_URI);
      } else {
        await Linking.openURL(PLAY_STORE_URL);
      }
      return true;
    } catch (err) {
      console.warn('[InAppReview] Could not open Play Store listing:', err?.message || err);
      // Fallback to standard web URL
      try {
        await Linking.openURL(PLAY_STORE_URL);
        return true;
      } catch (_) {
        return false;
      }
    }
  }

  /**
   * Reset review eligibility (for automated tests and debugging only)
   */
  async resetReviewEligibilityForTesting(userId = null) {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.GLOBAL_ATTEMPTED);
      if (userId) {
        await AsyncStorage.removeItem(`${STORAGE_KEYS.USER_ATTEMPTED_PREFIX}${String(userId)}`);
      }
      this.handledExits.clear();
      this.activeRoomSessions.clear();
      this.isReviewFlowInProgress = false;
    } catch (_) { }
  }
}

export default new InAppReviewService();

