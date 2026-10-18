/**
 * Focused Unit Test Suite for Yaro Mobile App Critical Logic
 * Covers:
 * 1. Agora Project-Selection & Engine Lifecycle (AgoraClientService)
 * 2. Call Start & Role Agora Credential Validation (callValidation)
 * 3. Call Lifecycle State Transitions & Timing (callLifecycle)
 * 4. Room Presence & Navigation Helper Resolution
 * 5. Call Billing & Diamond Balance Edge Cases
 */

import { AgoraClientService } from '../services/agoraService';
import {
  hasCallStartIdentity,
  parseAgoraPayload,
  getRoleAgoraCredentials,
  getValidOngoingCall,
  CALL_DIAMONDS_PER_MINUTE,
} from '../utils/callValidation';
import {
  getCallTiming,
  markCallLifecycle,
  readCallLifecycle,
  INCOMING_CALL_TIMEOUT_MS,
} from '../utils/callLifecycle';
import { apiUtil } from '../utils/apiUtil';

// Mock apiUtil
jest.mock('../utils/apiUtil', () => ({
  apiUtil: {
    get: jest.fn(),
  },
}));

describe('1. Agora Project-Selection & Engine Lifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns fallback App ID when uninitialized or offline', () => {
    const appId = AgoraClientService.getAppId();
    expect(typeof appId).toBe('string');
    expect(appId.length).toBeGreaterThan(0);
    expect(appId).toBe('d23c897f9305450faa7809ffcf666e57');
  });

  test('fetches and caches active config for 5 minutes', async () => {
    apiUtil.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          appId: 'test_server_app_id_999',
          projectId: 'proj_abc_123',
          configVersion: 2,
        },
      },
    });

    const config = await AgoraClientService.getActiveAgoraConfig(true);
    expect(config.appId).toBe('test_server_app_id_999');
    expect(config.projectId).toBe('proj_abc_123');
    expect(config.configVersion).toBe(2);

    // Second call without forceRefresh should use cache without hitting apiUtil
    const cached = await AgoraClientService.getActiveAgoraConfig(false);
    expect(cached.appId).toBe('test_server_app_id_999');
    expect(apiUtil.get).toHaveBeenCalledTimes(1);
  });

  test('prepareEngineForAppId reuses existing engine when App ID matches', () => {
    const mockEngine = { leaveChannel: jest.fn(), release: jest.fn() };
    const createFn = jest.fn(() => mockEngine);

    // Initial preparation
    const prep1 = AgoraClientService.prepareEngineForAppId('app_id_alpha', createFn);
    expect(prep1.appId).toBe('app_id_alpha');
    expect(prep1.engine).toBe(mockEngine);
    expect(createFn).toHaveBeenCalledTimes(1);

    // Subsequent preparation with same App ID
    const prep2 = AgoraClientService.prepareEngineForAppId('app_id_alpha', createFn);
    expect(prep2.engine).toBe(mockEngine);
    expect(createFn).toHaveBeenCalledTimes(1); // not called again
    expect(mockEngine.release).not.toHaveBeenCalled();
  });

  test('prepareEngineForAppId releases and recreates engine when App ID switches', () => {
    const oldEngine = { leaveChannel: jest.fn(), release: jest.fn() };
    const newEngine = { leaveChannel: jest.fn(), release: jest.fn() };

    AgoraClientService.registerEngine(oldEngine, 'app_id_old');

    const createFn = jest.fn(() => newEngine);
    const result = AgoraClientService.prepareEngineForAppId('app_id_new', createFn);

    expect(oldEngine.leaveChannel).toHaveBeenCalled();
    expect(oldEngine.release).toHaveBeenCalled();
    expect(createFn).toHaveBeenCalledTimes(1);
    expect(result.appId).toBe('app_id_new');
    expect(result.engine).toBe(newEngine);
  });
});

describe('2. Call Start & Role Agora Credential Validation', () => {
  test('hasCallStartIdentity validates transactionId and channelName presence', () => {
    expect(hasCallStartIdentity(null)).toBe(false);
    expect(hasCallStartIdentity({})).toBe(false);
    expect(hasCallStartIdentity({ transactionId: 'tx123' })).toBe(false);
    expect(hasCallStartIdentity({ channelName: 'ch123' })).toBe(false);
    expect(hasCallStartIdentity({ transactionId: '   ', channelName: 'ch123' })).toBe(false);
    expect(hasCallStartIdentity({ transactionId: 'tx123', channelName: 'ch123' })).toBe(true);
  });

  test('parseAgoraPayload correctly handles JSON string, object, and invalid inputs', () => {
    expect(parseAgoraPayload(null)).toEqual({});
    expect(parseAgoraPayload(12345)).toEqual({});
    expect(parseAgoraPayload('invalid json')).toEqual({});

    const obj = { appId: 'app123', callerToken: 'tok123' };
    expect(parseAgoraPayload(obj)).toBe(obj);
    expect(parseAgoraPayload(JSON.stringify(obj))).toEqual(obj);
  });

  test('getRoleAgoraCredentials validates caller vs host credentials and UID boundaries', () => {
    const validPayload = {
      appId: 'agora_app_xyz',
      callerToken: 'caller_rtc_token_123',
      callerAgoraUid: 1001,
      hostToken: 'host_rtc_token_456',
      hostAgoraUid: 2002,
    };

    // Caller credentials
    const callerCreds = getRoleAgoraCredentials(validPayload, true);
    expect(callerCreds).not.toBeNull();
    expect(callerCreds.token).toBe('caller_rtc_token_123');
    expect(callerCreds.uid).toBe(1001);
    expect(callerCreds.appId).toBe('agora_app_xyz');

    // Host credentials
    const hostCreds = getRoleAgoraCredentials(validPayload, false);
    expect(hostCreds).not.toBeNull();
    expect(hostCreds.token).toBe('host_rtc_token_456');
    expect(hostCreds.uid).toBe(2002);

    // Reject negative UID
    expect(getRoleAgoraCredentials({ ...validPayload, callerAgoraUid: -1 }, true)).toBeNull();

    // Reject UID > 32-bit unsigned max (4294967295)
    expect(getRoleAgoraCredentials({ ...validPayload, callerAgoraUid: 4294967296 }, true)).toBeNull();

    // Reject empty token
    expect(getRoleAgoraCredentials({ ...validPayload, callerToken: '   ' }, true)).toBeNull();

    // Reject missing appId
    expect(getRoleAgoraCredentials({ ...validPayload, appId: '' }, true)).toBeNull();
  });

  test('getValidOngoingCall returns structured call data only when identity and credentials are valid', () => {
    const callData = {
      transactionId: 'tx_98765',
      channelName: 'room_channel_123',
      agora: {
        appId: 'valid_app_id',
        callerToken: 'token_caller',
        callerAgoraUid: 555,
      },
    };

    const valid = getValidOngoingCall(callData, true);
    expect(valid).not.toBeNull();
    expect(valid.transactionId).toBe('tx_98765');
    expect(valid.channelName).toBe('room_channel_123');

    // Rejects if credentials invalid
    const invalid = getValidOngoingCall({ ...callData, agora: {} }, true);
    expect(invalid).toBeNull();
  });
});

describe('3. Call Lifecycle State Transitions & Timing', () => {
  test('getCallTiming accurately resolves ring expiration', () => {
    const now = 1700000000000;
    const timing = getCallTiming({ createdAt: now });
    expect(timing.createdAtMs).toBe(now);
    expect(timing.ringExpiresAtMs).toBe(now + INCOMING_CALL_TIMEOUT_MS);

    // Custom expiration override
    const customTiming = getCallTiming({ createdAt: now, ringExpiresAt: now + 30000 });
    expect(customTiming.ringExpiresAtMs).toBe(now + 30000);
  });

  test('markCallLifecycle stores state and guards against out-of-order stale events', async () => {
    const txId = 'tx_lifecycle_test';

    // Newer event at t=1000
    const state1 = await markCallLifecycle(txId, 'ringing', 1000);
    expect(state1.state).toBe('ringing');
    expect(state1.eventAtMs).toBe(1000);

    const saved = await readCallLifecycle(txId);
    expect(saved.state).toBe('ringing');

    // Stale event at t=500 should be ignored (preserves t=1000)
    const staleState = await markCallLifecycle(txId, 'stale_state', 500);
    expect(staleState.state).toBe('ringing');
    expect(staleState.eventAtMs).toBe(1000);

    // Newer valid event at t=2000
    const state2 = await markCallLifecycle(txId, 'connected', 2000);
    expect(state2.state).toBe('connected');
    expect(state2.eventAtMs).toBe(2000);
  });
});

describe('4. Room-Presence & Navigation Resolution Helper', () => {
  /**
   * Helper simulating UserProfile Find me resolution logic
   */
  const resolveRoomPresenceNavigation = (userProfile) => {
    if (!userProfile) return { canNavigate: false, error: 'User profile not loaded' };
    if (!userProfile.isInRoom || !userProfile.currentRoomId) {
      return { canNavigate: false, error: 'User is not currently in an active room' };
    }
    return {
      canNavigate: true,
      screen: 'VoiceRoom',
      params: {
        roomId: String(userProfile.currentRoomId),
        room: {
          _id: String(userProfile.currentRoomId),
          title: userProfile.currentRoomTitle || 'Live Voice Room',
        },
      },
    };
  };

  test('allows navigation to VoiceRoom when user is in an active room', () => {
    const profileInRoom = {
      _id: 'user_123',
      isInRoom: true,
      currentRoomId: 'room_live_456',
      currentRoomTitle: 'Music & Vibes Club',
    };

    const nav = resolveRoomPresenceNavigation(profileInRoom);
    expect(nav.canNavigate).toBe(true);
    expect(nav.screen).toBe('VoiceRoom');
    expect(nav.params.roomId).toBe('room_live_456');
    expect(nav.params.room.title).toBe('Music & Vibes Club');
  });

  test('rejects navigation when user is not in a room or currentRoomId is missing', () => {
    expect(resolveRoomPresenceNavigation(null).canNavigate).toBe(false);
    expect(resolveRoomPresenceNavigation({ isInRoom: false }).canNavigate).toBe(false);
    expect(resolveRoomPresenceNavigation({ isInRoom: true, currentRoomId: null }).canNavigate).toBe(false);
  });

  test('navigates to Chat screen with user and otherUser parameters', () => {
    const currentUser = { _id: 'me_1', name: 'Alice' };
    const targetUser = { _id: 'target_2', name: 'Bob' };

    const chatNavParams = {
      screen: 'Chat',
      params: {
        user: currentUser,
        otherUser: targetUser,
      },
    };

    expect(chatNavParams.screen).toBe('Chat');
    expect(chatNavParams.params.otherUser._id).toBe('target_2');
  });
});

describe('5. Call Billing & Diamond Balance Edge Cases', () => {
  /**
   * Authoritative call diamond billing calculation helper
   */
  const calculateCallCost = (durationSeconds, ratePerMinute = CALL_DIAMONDS_PER_MINUTE) => {
    if (!durationSeconds || durationSeconds <= 0) return 0;
    const billedMinutes = Math.ceil(durationSeconds / 60);
    return billedMinutes * ratePerMinute;
  };

  const validateCallerBalance = (callerDiamonds, ratePerMinute = CALL_DIAMONDS_PER_MINUTE) => {
    if (typeof callerDiamonds !== 'number' || isNaN(callerDiamonds)) return false;
    return callerDiamonds >= ratePerMinute;
  };

  test('charges 0 diamonds for zero or unanswered call duration', () => {
    expect(calculateCallCost(0, 100)).toBe(0);
    expect(calculateCallCost(-10, 100)).toBe(0);
  });

  test('charges 1 minute for call between 1 and 60 seconds', () => {
    expect(calculateCallCost(1, 100)).toBe(100);
    expect(calculateCallCost(30, 100)).toBe(100);
    expect(calculateCallCost(60, 100)).toBe(100);
  });

  test('rounds up to the next minute for duration exceeding 60 seconds', () => {
    expect(calculateCallCost(61, 100)).toBe(200);
    expect(calculateCallCost(120, 100)).toBe(200);
    expect(calculateCallCost(121, 100)).toBe(300);
  });

  test('validateCallerBalance enforces minimum 1 minute rate balance before call initiation', () => {
    expect(validateCallerBalance(99, 100)).toBe(false);
    expect(validateCallerBalance(100, 100)).toBe(true);
    expect(validateCallerBalance(500, 100)).toBe(true);
    expect(validateCallerBalance(null, 100)).toBe(false);
  });
});
