import { appendRoomMention } from '../utils/roomMention';

test('profile modal name strings and room user objects produce the same mention', () => {
  expect(appendRoomMention('', 'Riya Sharma')).toBe('@Riya Sharma ');
  expect(appendRoomMention('', { name: 'Riya Sharma', userId: 123 })).toBe('@Riya Sharma ');
});
test('mention preserves a draft and supports profile name aliases', () => {
  expect(appendRoomMention('Hello ', { userName: 'Aman' })).toBe('Hello @Aman ');
  expect(appendRoomMention('@Riya ', '@Aman')).toBe('@Riya @Aman ');
});
test.each([null, undefined, {}, 'undefined', 'null', { name: undefined }])('invalid mention target %j leaves the draft intact', target => {
  expect(appendRoomMention('Hello', target)).toBe('Hello');
});
