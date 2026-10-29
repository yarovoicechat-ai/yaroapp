export const getRoomSeatConfig = value => {
  const parsed = Number(value);
  const totalCount = [8, 10, 12, 15, 17].includes(parsed) ? parsed : 8;
  return { totalCount, bottomCount: totalCount - 2, seatsPerRow: totalCount > 10 ? 5 : 4, isCompact: totalCount > 10 };
};
