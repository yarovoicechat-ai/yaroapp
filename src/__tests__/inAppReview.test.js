import { NativeModules, Platform, Linking, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import InAppReviewService, {
  PLAY_STORE_URL,
  MIN_PARTICIPATION_DURATION_MS,
  EXIT_TRANSITION_DELAY_MS,
} from '../services/InAppReviewService';

jest.useFakeTimers();

const flushAsyncTimers = async (ms) => {
  jest.advanceTimersByTime(ms);
  for (let i = 0; i < 10; i++) {
    await Promise.resolve();
  }
};

beforeEach(async () => {
  Platform.OS = 'android';
  AppState.currentState = 'active';
  NativeModules.InAppReviewModule = {
    isAvailable: jest.fn(async () => true),
    requestReview: jest.fn(async () => true),
  };
  await AsyncStorage.clear();
  await InAppReviewService.resetReviewEligibilityForTesting();
  jest.clearAllMocks();
});

describe('InAppReviewService - Eligibility & Persistence', () => {
  test('initial state is eligible for first room review', async () => {
    const eligible = await InAppReviewService.isEligibleForFirstRoomReview('user_123');
    expect(eligible).toBe(true);
  });

  test('marking review attempted persists globally and per-user', async () => {
    await InAppReviewService.markReviewAttempted('user_123');
    expect(await InAppReviewService.isEligibleForFirstRoomReview('user_123')).toBe(false);
    expect(await InAppReviewService.isEligibleForFirstRoomReview('user_456')).toBe(false);
  });

  test('app restart preserves attempted state from AsyncStorage', async () => {
    await AsyncStorage.setItem('@yaro_review_attempted_global', 'true');
    const eligible = await InAppReviewService.isEligibleForFirstRoomReview('new_user');
    expect(eligible).toBe(false);
  });
});

describe('InAppReviewService - Room Join and Exit Trigger Flow', () => {
  test('failed room join (exit without join) does not trigger review', async () => {
    await InAppReviewService.recordRoomExited('room_failed', 'user_1');
    jest.runAllTimers();

    expect(NativeModules.InAppReviewModule.requestReview).not.toHaveBeenCalled();
    expect(await InAppReviewService.isEligibleForFirstRoomReview('user_1')).toBe(true);
  });

  test('accidental bounce (< 10 seconds duration) does not trigger review', async () => {
    const now = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(now);

    InAppReviewService.recordRoomJoined('room_quick', 'user_1');

    // User leaves after only 3 seconds
    jest.spyOn(Date, 'now').mockReturnValue(now + 3000);
    await InAppReviewService.recordRoomExited('room_quick', 'user_1');
    jest.runAllTimers();

    expect(NativeModules.InAppReviewModule.requestReview).not.toHaveBeenCalled();
    // User remains eligible for next real room session
    expect(await InAppReviewService.isEligibleForFirstRoomReview('user_1')).toBe(true);
  });

  test('first successful participation (> 10s) triggers review after transition delay', async () => {
    const now = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(now);

    InAppReviewService.recordRoomJoined('room_success', 'user_1');

    // User participates for 15 seconds
    jest.spyOn(Date, 'now').mockReturnValue(now + 15000);
    await InAppReviewService.recordRoomExited('room_success', 'user_1');

    // Marked as attempted immediately to prevent race conditions
    expect(await InAppReviewService.isEligibleForFirstRoomReview('user_1')).toBe(false);

    // Review is delayed by EXIT_TRANSITION_DELAY_MS so teardown finishes
    expect(NativeModules.InAppReviewModule.requestReview).not.toHaveBeenCalled();

    await flushAsyncTimers(EXIT_TRANSITION_DELAY_MS);

    expect(NativeModules.InAppReviewModule.requestReview).toHaveBeenCalledTimes(1);
  });

  test('duplicate room exit events do not trigger duplicate review requests', async () => {
    const now = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(now);

    InAppReviewService.recordRoomJoined('room_dup', 'user_1');

    // Simulate 20 seconds participation
    jest.spyOn(Date, 'now').mockReturnValue(now + 20000);
    await InAppReviewService.recordRoomExited('room_dup', 'user_1');

    // Immediate duplicate exit event (e.g. socket + component unmount)
    await InAppReviewService.recordRoomExited('room_dup', 'user_1');

    await flushAsyncTimers(EXIT_TRANSITION_DELAY_MS);

    expect(NativeModules.InAppReviewModule.requestReview).toHaveBeenCalledTimes(1);
  });

  test('second room exit after initial review never triggers again', async () => {
    // Complete first review
    await InAppReviewService.markReviewAttempted('user_1');

    const now = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(now);

    InAppReviewService.recordRoomJoined('room_second', 'user_1');
    jest.spyOn(Date, 'now').mockReturnValue(now + 30000);

    await InAppReviewService.recordRoomExited('room_second', 'user_1');
    jest.runAllTimers();

    expect(NativeModules.InAppReviewModule.requestReview).not.toHaveBeenCalled();
  });
});

describe('InAppReviewService - Google Play Store Fallback Link', () => {
  test('openPlayStoreListing opens official Google Play URL', async () => {
    const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(false);

    const success = await InAppReviewService.openPlayStoreListing();

    expect(success).toBe(true);
    expect(openURLSpy).toHaveBeenCalledWith(PLAY_STORE_URL);
  });
});
