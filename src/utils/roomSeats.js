export const getRoomSeatConfig = value => {
  const parsed = Number(value);
  const bottomCount = [8, 10, 12, 15, 17].includes(parsed) ? parsed : 8;
  const totalCount = bottomCount + 2;
  return { totalCount, bottomCount, seatsPerRow: bottomCount > 10 ? 5 : 4, isCompact: bottomCount > 10 };
};
