/**
 * Centralized Agora RTC Client Service for Yaro Mobile App
 * Handles dynamic public App ID resolution, configuration caching,
 * and safe RtcEngine destruction/recreation across App ID switches.
 */

import { apiUtil } from '../utils/apiUtil';

// Fallback App ID in case of initial offline network state
const DEFAULT_FALLBACK_APP_ID = 'd23c897f9305450faa7809ffcf666e57';

let cachedAppConfig = {
  appId: DEFAULT_FALLBACK_APP_ID,
  projectId: null,
  configVersion: 1,
  lastFetchedAt: 0,
};

let activeEngineInstance = null;
let currentEngineAppId = null;

export const AgoraClientService = {
  /**
   * Fetches the current active Agora public configuration from the server.
   * Caches for 5 minutes in memory to avoid redundant network calls.
   */
  async getActiveAgoraConfig(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && cachedAppConfig.lastFetchedAt && now - cachedAppConfig.lastFetchedAt < 300000) {
      return cachedAppConfig;
    }

    try {
      const response = await apiUtil.get('/agora/client-config');
      if (response.data?.success && response.data?.data?.appId) {
        cachedAppConfig = {
          appId: String(response.data.data.appId).trim(),
          projectId: response.data.data.projectId || null,
          configVersion: response.data.data.configVersion || 1,
          lastFetchedAt: now,
        };
        console.log('📡 [AgoraService] Resolved active Agora App ID from server:', cachedAppConfig.appId);
      }
    } catch (err) {
      console.warn('⚠️ [AgoraService] Failed to fetch active Agora config from server, using cached/fallback:', err?.message || err);
    }

    return cachedAppConfig;
  },

  /**
   * Gets the active App ID synchronously from cache or fallback.
   */
  getAppId() {
    return cachedAppConfig.appId || DEFAULT_FALLBACK_APP_ID;
  },

  /**
   * Registers the active engine instance and its bound App ID.
   */
  registerEngine(engine, appId) {
    activeEngineInstance = engine;
    currentEngineAppId = appId;
  },

  /**
   * Checks if an existing engine instance requires recreation because the App ID changed.
   * If the App ID differs, cleanly releases the old engine instance first.
   */
  prepareEngineForAppId(requestedAppId, createEngineFn) {
    const targetAppId = requestedAppId || this.getAppId();

    if (activeEngineInstance && currentEngineAppId && currentEngineAppId !== targetAppId) {
      console.warn(`🔄 [AgoraService] App ID switched from ${currentEngineAppId} to ${targetAppId}. Releasing previous engine instance...`);
      try {
        activeEngineInstance.leaveChannel();
        activeEngineInstance.release();
      } catch (err) {
        console.warn('Engine release warning:', err?.message || err);
      }
      activeEngineInstance = null;
      currentEngineAppId = null;
    }

    if (!activeEngineInstance && typeof createEngineFn === 'function') {
      activeEngineInstance = createEngineFn();
      currentEngineAppId = targetAppId;
    }

    return {
      engine: activeEngineInstance,
      appId: targetAppId,
    };
  },

  /**
   * Cleans up engine on final call / room exit.
   */
  releaseEngine(engine) {
    if (engine) {
      try {
        engine.leaveChannel();
      } catch (_) {}
    }
  },
};

export default AgoraClientService;
