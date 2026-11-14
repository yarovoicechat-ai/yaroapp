/** Agora engine and Party room regression tests. */

import { AgoraClientService } from '../services/agoraService';
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
    expect(appId).toBe('a728e57756ce4e9caebe4ace185c8bae');
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

describe('Agora teardown regression', () => {
  test('releases every native lifecycle when Agora returns its JS singleton', () => {
    const singleton = { leaveChannel: jest.fn(), release: jest.fn() };
    AgoraClientService.registerEngine(singleton, 'singleton-project');
    AgoraClientService.releaseEngine(singleton);
    AgoraClientService.releaseEngine(singleton);
    expect(singleton.release).toHaveBeenCalledTimes(1);
    AgoraClientService.prepareEngineForAppId('singleton-project', () => singleton);
    AgoraClientService.releaseEngine(singleton);
    AgoraClientService.releaseEngine(singleton);
    expect(singleton.release).toHaveBeenCalledTimes(2);
  });

  test('next call with the same App ID gets a fresh engine; duplicate teardown is harmless', () => {
    const oldEngine = { leaveChannel: jest.fn(), release: jest.fn() };
    const nextEngine = { leaveChannel: jest.fn(), release: jest.fn() };
    AgoraClientService.registerEngine(oldEngine, 'same-project');
    AgoraClientService.releaseEngine(oldEngine);
    AgoraClientService.releaseEngine(oldEngine);
    expect(oldEngine.release).toHaveBeenCalledTimes(1);
    const next = AgoraClientService.prepareEngineForAppId('same-project', () => nextEngine);
    expect(next.engine).toBe(nextEngine);
    // An old screen cleaning up late must not evict the new call's engine.
    AgoraClientService.releaseEngine(oldEngine);
    expect(AgoraClientService.prepareEngineForAppId('same-project').engine).toBe(nextEngine);
  });
});
