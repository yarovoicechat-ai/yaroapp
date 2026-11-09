const identities = (user) => [user?._id, user?.id, user?.userId, user?.meethiId]
  .filter(value => value !== undefined && value !== null && value !== '')
  .map(String);

export const roomGiftRecipients = (room = {}, seats = [], sender = {}) => {
  const senderIds = new Set(identities(sender));
  const seen = new Set();
  const users = seats.filter(seat => seat.user).map(seat => ({
    ...seat.user, seatIndex: seat.seatIndex, seatNumber: String(seat.seatIndex + 1),
  }));
  if (!seats.length && (room.hostId || room.ownerId)) {
    users.unshift({ id: room.hostId || room.ownerId, name: room.hostName || 'Host',
      avatar: room.hostAvatar || room.coverImage, seatIndex: 0, seatNumber: '1' });
  }
  return users.filter(user => {
    const ids = identities(user);
    if (!ids.length || ids.some(id => senderIds.has(id) || seen.has(id))) return false;
    ids.forEach(id => seen.add(id));
    return true;
  }).map(user => ({ ...user, id: String(user._id || user.id || user.userId),
    avatar: user.avatar || user.image || 'https://api.yaroapp.in/uploads/avatars/female_default.webp',
    isHost: user.seatIndex === 0 }));
};

export const resolveGiftRecipients = (selection = [], available = []) => {
  if (selection.some(user => user?.isAll || user?.id === 'all')) return available;
  return available.filter(user => selection.some(selected =>
    identities(selected).some(id => identities(user).includes(id))));
};
