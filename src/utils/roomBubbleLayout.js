// The room reserves space for floating controls. Size against the list's
// measured content width rather than the full device screen.
export const getRoomBubbleWidth = (windowWidth, availableWidth) => {
  const screenWidth = Number.isFinite(windowWidth) && windowWidth > 0 ? windowWidth : 360;
  const contentWidth = Number.isFinite(availableWidth) && availableWidth > 0
    ? availableWidth
    : Math.max(1, screenWidth - 70);
  return Math.floor(Math.max(1, Math.min(contentWidth, screenWidth - 32)));
};

// Keep text in the transparent centre as an ornate frame grows vertically.
export const getDecoratedBubbleInsets = (textHeight, maxWidth) => ({
  paddingLeft: Math.max(18, Math.ceil(maxWidth * 0.13)),
  paddingRight: Math.max(14, Math.ceil(maxWidth * 0.08)),
  paddingTop: Math.max(12, Math.ceil(textHeight * 0.27)),
  paddingBottom: Math.max(18, Math.ceil(textHeight * 0.40)),
});

export const getEquippedBubbleWidth = (available, text, name, { tag = false, owner = false, badges = 0, vip = false, club = '' } = {}) => {
  const header = 84 + Math.min(16, Array.from(String(name || '')).length) * 6 + (tag ? 54 : 0) + (owner ? 36 : 0);
  const levels = 156 + (vip ? 40 : 0) + Math.min(60, String(club).length * 5);
  const medals = Math.min(8, badges) * 19 + 70;
  const message = Math.max(...String(text || '').split('\n').map(line => Array.from(line).length * 6)) + 82;
  return Math.min(available, Math.max(180, header, levels, medals, message));
};
