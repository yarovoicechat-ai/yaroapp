export const normalizePKRoomId = value => {
  const id = String(value || '').trim();
  return /^10000\d{3}$/.test(id) ? `100000000${id.slice(5)}`.slice(-10) : id;
};

export function roomPKView(match, roomId, now = Date.now(), serverOffset = 0) {
  const side = match?.roomIds?.indexOf(normalizePKRoomId(roomId)) ?? -1;
  const deadline = match?.status === 'invited' ? match.inviteExpiresAt : match?.endsAt;
  const remaining = deadline ? Math.max(0, Math.ceil((new Date(deadline).getTime() - now - serverOffset) / 1000)) : 0;

  let result = null;
  let winnerLabel = null;
  if (match?.status === 'finished') {
    if (match.draw) {
      result = 'DRAW';
      winnerLabel = 'Draw';
    } else if (match.winnerSide !== null && match.winnerSide !== undefined) {
      const isSide0 = match.winnerSide === 0;
      if (match.pkMode === 'team') {
        winnerLabel = isSide0 ? 'Yellow Team' : 'Blue Team';
      } else if (match.pkMode === 'vote' || match.pkMode === 'personal') {
        winnerLabel = isSide0
          ? (match.participantA?.name || match.rooms?.[0]?.title || 'Side A')
          : (match.participantB?.name || match.rooms?.[1]?.title || 'Side B');
      } else {
        winnerLabel = isSide0 ? (match.rooms?.[0]?.title || 'Room 1') : (match.rooms?.[1]?.title || 'Room 2');
      }
      result = `${winnerLabel} Won!`;
    } else if (match.winnerRoomId) {
      const isMyRoom = normalizePKRoomId(match.winnerRoomId) === normalizePKRoomId(roomId);
      result = isMyRoom ? 'WINNER' : 'LOSER';
      winnerLabel = isMyRoom ? 'My Room' : 'Opponent';
    } else {
      result = 'FINISHED';
    }
  }

  return {
    side,
    remaining,
    timer: `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`,
    result,
    winnerLabel,
  };
}
