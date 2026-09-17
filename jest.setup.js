/* eslint-env jest */
jest.mock(
  '@react-native-async-storage/async-storage',
  () => require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@notifee/react-native', () => {
  const api = {
    createChannel: jest.fn(async () => 'test-channel'),
    displayNotification: jest.fn(async () => 'test-notification'),
    cancelNotification: jest.fn(async () => {}),
    cancelAllNotifications: jest.fn(async () => {}),
    onForegroundEvent: jest.fn(() => () => {}),
    onBackgroundEvent: jest.fn(),
    getInitialNotification: jest.fn(async () => null),
  };
  return {
    __esModule: true,
    default: api,
    AndroidCategory: { CALL: 'call' },
    AndroidImportance: { HIGH: 4 },
    AndroidVisibility: { PUBLIC: 1 },
    EventType: { ACTION_PRESS: 1, PRESS: 2, DISMISSED: 3 },
  };
});
jest.mock('@react-native-firebase/messaging', () => {
  const instance = {
    getInitialNotification: jest.fn(async () => null),
    getToken: jest.fn(async () => 'test-token'),
    onMessage: jest.fn(() => () => {}),
    onNotificationOpenedApp: jest.fn(() => () => {}),
    onTokenRefresh: jest.fn(() => () => {}),
    requestPermission: jest.fn(async () => 1),
  };
  const messaging = jest.fn(() => instance);
  messaging.AuthorizationStatus = { AUTHORIZED: 1, PROVISIONAL: 2 };
  return { __esModule: true, default: messaging };
});