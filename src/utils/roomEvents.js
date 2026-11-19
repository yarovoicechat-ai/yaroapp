export function roomEventId(value) {
  const id = String(value || '').trim();
  return /^10000\d{3}$/.test(id) ? `100000000${id.slice(5)}`.slice(-10) : id;
}

export function isFreshRoomReaction(reaction, roomId, now = Date.now()) {
  if (!reaction?.emoji || !Number.isFinite(Number(reaction.timestamp)))
    return false;
  const age = now - Number(reaction.timestamp);
  return (
    age >= 0 &&
    age < 2500 &&
    (!reaction.roomId || roomEventId(reaction.roomId) === roomEventId(roomId))
  );
}
