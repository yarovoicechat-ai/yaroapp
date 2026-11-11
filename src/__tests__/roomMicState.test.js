import { resolveRoomMicMute } from '../utils/roomMicState';

test('a delayed seat snapshot cannot mute an already unmuted speaker', () => {
  expect(resolveRoomMicMute({ isOnSeat: true, isMuted: false }, true)).toBe(false);
});

test('snapshots cannot undo an explicit self mute or moderator mute', () => {
  expect(resolveRoomMicMute({ isOnSeat: true, isMuted: true }, false)).toBe(true);
  expect(resolveRoomMicMute({ isOnSeat: true, isMuted: false }, false, true)).toBe(true);
});

test('taking a seat from audience uses the server mute state', () => {
  expect(resolveRoomMicMute({ isOnSeat: false, isMuted: true }, false)).toBe(false);
  expect(resolveRoomMicMute({ isOnSeat: false, isMuted: true }, true)).toBe(true);
});
