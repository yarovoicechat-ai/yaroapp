import service from '../services/InAppUpdateService';
import { apiPublic } from '../utils/apiUtil';
jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));
jest.mock('../utils/apiUtil', () => ({ apiPublic: { get: jest.fn() } }));
jest.mock('react-native-device-info', () => ({ getBuildNumber: () => '21', getVersion: () => '0.2.1' }));
jest.mock('sp-react-native-in-app-updates', () => ({ __esModule: true,
  default: jest.fn().mockImplementation(() => ({ checkNeedsUpdate: jest.fn() })),
  IAUUpdateKind: { IMMEDIATE: 1 },
}));
beforeEach(() => { jest.useFakeTimers(); jest.clearAllMocks(); service.pendingCheck = null; });
afterEach(() => jest.useRealTimers());

test('a stalled Play Store check cannot block startup indefinitely', async () => {
  service.inAppUpdates.checkNeedsUpdate.mockReturnValue(new Promise(() => {}));
  apiPublic.get.mockResolvedValue({ data: { success: true, data: { minimumSupportedVersion: 1 } } });
  const pending = service.checkUpdateStatus();
  await jest.advanceTimersByTimeAsync(5000);
  expect((await pending).needsUpdate).toBe(false);
  expect(apiPublic.get).toHaveBeenCalledWith('/public/settings', expect.objectContaining({ timeout: 5000, networkRetry: false }));
});

test('real backend mandatory version continues to block an outdated build', async () => {
  service.inAppUpdates.checkNeedsUpdate.mockResolvedValue({ shouldUpdate: false });
  apiPublic.get.mockResolvedValue({ data: { success: true, data: { minimumSupportedVersion: 22 } } });
  const result = await service.checkUpdateStatus();
  expect(result.backendForceUpdate).toBe(true);
  expect(result.isMandatory).toBe(true);
});

test('foreground events reuse an in-progress update check', async () => {
  service.inAppUpdates.checkNeedsUpdate.mockReturnValue(new Promise(() => {}));
  apiPublic.get.mockResolvedValue({ data: { success: true, data: {} } });
  const first = service.checkUpdateStatus(), second = service.checkUpdateStatus();
  await jest.advanceTimersByTimeAsync(5000);
  await Promise.all([first, second]);
  expect(service.inAppUpdates.checkNeedsUpdate).toHaveBeenCalledTimes(1);
  expect(apiPublic.get).toHaveBeenCalledTimes(1);
});
