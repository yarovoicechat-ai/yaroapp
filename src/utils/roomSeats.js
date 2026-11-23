export const getRoomSeatConfig = value => {
  const parsed = Number(value);

  // 20 Seats: 2 top (Host, Co-Host) + 18 bottom (3 rows of 6)
  if (parsed === 20 || parsed === 18) {
    return {
      totalCount: 20,
      topCount: 2,
      bottomCount: 18,
      seatsPerRow: 6,
      isCompact: true,
      isSixPerRow: true,
    };
  }

  // 26 Seats: 2 top (Host, Co-Host) + 24 bottom (4 rows of 6)
  if (parsed === 26 || parsed === 24) {
    return {
      totalCount: 26,
      topCount: 2,
      bottomCount: 24,
      seatsPerRow: 6,
      isCompact: true,
      isSixPerRow: true,
    };
  }

  // 12 Seats: bottomCount = 10 (2 rows of 5) + 2 top = 12 total
  // 17 Seats: bottomCount = 15 (3 rows of 5) + 2 top = 17 total
  const bottomCount = [8, 10, 12, 15, 17].includes(parsed) ? parsed : 8;
  const totalCount = bottomCount + 2;

  return {
    totalCount,
    topCount: 2,
    bottomCount,
    seatsPerRow: bottomCount >= 10 ? 5 : 4,
    isCompact: bottomCount >= 10,
    isSixPerRow: false,
  };
};
