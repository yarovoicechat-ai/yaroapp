import { isFreshRoomReaction, roomEventId } from '../utils/roomEvents';

test('a cached emoji cannot replay after its display lifetime or in another room', () => {
  const reaction = { emoji: '😊', roomId: 'room-a', timestamp: 10000 };
  expect(isFreshRoomReaction(reaction, 'room-a', 11000)).toBe(true);
  expect(isFreshRoomReaction(reaction, 'room-a', 12500)).toBe(false);
  expect(isFreshRoomReaction(reaction, 'room-b', 11000)).toBe(false);
  expect(
    isFreshRoomReaction({ ...reaction, timestamp: undefined }, 'room-a', 11000),
  ).toBe(false);
});

test('legacy room aliases match gift and reaction events from the canonical room', () => {
  expect(roomEventId('10000123')).toBe(roomEventId('0000000123'));
  const reaction = { emoji: '😊', roomId: '10000123', timestamp: 10000 };
  expect(isFreshRoomReaction(reaction, '0000000123', 11000)).toBe(true);
});
