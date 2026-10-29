import { roomKeyboardLift } from '../utils/roomKeyboard';
test.each([
  [800, 500, 300], // overlay keyboard
  [500, 500, 0], // Android adjustResize already moved the viewport
  [524, 500, 24], // edge-to-edge navigation overlap
  [480, 500, 0], // viewport already clears the keyboard
  [NaN, 500, 0],
])('viewport bottom %s and keyboard top %s require lift %s with no extra gap', (bottom, top, expected) => {
  expect(roomKeyboardLift(bottom, top)).toBe(expected);
});
