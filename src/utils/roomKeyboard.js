// Coordinates use the same window frame; adjustResize is already reflected
// in viewportBottom, so it must never be subtracted a second time.
export const roomKeyboardLift = (viewportBottom, keyboardTop) => {
  if (!Number.isFinite(viewportBottom) || !Number.isFinite(keyboardTop)) return 0;
  return Math.max(0, viewportBottom - keyboardTop);
};
