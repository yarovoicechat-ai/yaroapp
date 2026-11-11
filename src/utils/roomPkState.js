export const normalizePKRoomId = value => {
  const id = String(value || '').trim();
  return /^10000\d{3}$/.test(id) ? `100000000${id.slice(5)}`.slice(-10) : id;
};

export function roomPKView(match, roomId, now = Date.now(), serverOffset = 0) {
  const side = match?.roomIds?.indexOf(normalizePKRoomId(roomId)) ?? -1;
  const deadline = match?.status === 'invited' ? match.inviteExpiresAt : match?.endsAt;
  const remaining = deadline ? Math.max(0, Math.ceil((new Date(deadline).getTime() - now - serverOffset) / 1000)) : 0;
  const result = match?.status !== 'finished' ? null : match.draw ? 'DRAW'
    : normalizePKRoomId(match.winnerRoomId) === normalizePKRoomId(roomId) ? 'WINNER' : 'LOSER';
  return { side, remaining, timer: `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`, result };
}
