import { roomGiftRecipients, resolveGiftRecipients } from '../utils/giftRecipients';

const seats = [
  { seatIndex: 0, user: { _id: 'host-db', userId: 101, name: 'Host' } },
  { seatIndex: 1, user: { _id: 'sender-db', userId: 102, name: 'Sender' } },
  { seatIndex: 2, user: { _id: 'other-db', userId: 103, name: 'Other' } },
];

test('All expands to real recipients and excludes the sender by either identity', () => {
  const available = roomGiftRecipients({ hostId: 101 }, seats, { userId: 102 });
  const recipients = resolveGiftRecipients([{ id: 'all', isAll: true }], available);
  expect(recipients.map(user => user.id)).toEqual(['host-db', 'other-db']);
  expect(recipients.length * 50 * 5).toBe(500);
});

test('multiple selection resolves numeric and database aliases without duplicates', () => {
  const available = roomGiftRecipients({}, seats, { _id: 'sender-db' });
  expect(resolveGiftRecipients([{ id: 101 }, { id: 'host-db' }, { id: 103 }], available)
    .map(user => user.id)).toEqual(['host-db', 'other-db']);
});

test('recipients that left their seats are excluded before sending', () => {
  const available = roomGiftRecipients({}, seats.slice(0, 2), { userId: 102 });
  expect(resolveGiftRecipients([{ id: 'other-db' }], available)).toEqual([]);
});

test('host fallback cannot select the sender or duplicate the seated host', () => {
  expect(roomGiftRecipients({ hostId: 101 }, [], { userId: 101 })).toEqual([]);
  expect(roomGiftRecipients({ hostId: 101 }, seats, { userId: 102 })).toHaveLength(2);
});
