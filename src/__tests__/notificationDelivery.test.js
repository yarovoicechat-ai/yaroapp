import notifee, { EventType } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCallParams } from '../utils/CallNotificationService';
import { showActivityNotification, showRoomOpenSocketNotification, handleActivityNotificationEvent } from '../utils/ActivityNotificationService';

jest.mock('../utils/apiUtil', () => ({ apiUtil: { post: jest.fn() } }));
jest.mock('../sockets', () => ({ getSocket: jest.fn(), initSocket: jest.fn() }));

beforeEach(async () => { jest.clearAllMocks(); await AsyncStorage.clear(); });

test('socket room opening displays the same notification ID and room target as push', async () => {
  await showRoomOpenSocketNotification({ notification: { _id: 'record', title: 'Host opened a room',
    message: 'Join now', data: { type: 'room_open', roomId: 'room', notificationId: 'opening' } } });
  expect(notifee.displayNotification).toHaveBeenCalledWith(expect.objectContaining({
    id: 'opening', title: 'Host opened a room', body: 'Join now',
    data: expect.objectContaining({ roomId: 'room', type: 'room_open' }),
  }));
});

test.each([true, 'true'])('notification video flag %s survives call restoration', isVideo => {
  const params = getCallParams({ callId: 'call-1', isVideo, callerId: 'caller-1', agora: '{"appId":"app"}' });
  expect(params).toMatchObject({ transactionId: 'call-1', isVideo: true, callerId: 'caller-1', agora: { appId: 'app' } });
});

test('audio notification does not become a video call', () => {
  expect(getCallParams({ isVideo: 'false' }).isVideo).toBe(false);
});

test.each(['missed_call', 'room_open', 'system'])('%s produces a visible notification', async type => {
  await showActivityNotification({ type, title: 'Title', body: 'Body', transactionId: 'call-1', roomId: 'room-1' });
  expect(notifee.displayNotification).toHaveBeenCalledWith(expect.objectContaining({
    title: 'Title', body: 'Body', data: expect.objectContaining({ type }),
    android: expect.objectContaining({ pressAction: { id: 'open-activity', launchActivity: 'default' } }),
  }));
});

test('cold-start room press is persisted while dismissal does not navigate', async () => {
  const data = { type: 'room_open', roomId: 'room-1' };
  const detail = { notification: { data } };
  await handleActivityNotificationEvent({ type: EventType.DISMISSED, detail });
  expect(await AsyncStorage.getItem('pendingActivityNotification')).toBeNull();
  await handleActivityNotificationEvent({ type: EventType.PRESS, detail });
  expect(JSON.parse(await AsyncStorage.getItem('pendingActivityNotification'))).toEqual(data);
});
