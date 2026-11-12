import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Image, Text } from 'react-native';
jest.mock('../constants/roomEmojis', () => ({ BUNDLED_EMOJIS: [{
  code: 'dizzy', localGif: 101, localPng: 102,
  gifUrl: '/api/emoji-assets/dizzy.gif', pngUrl: '/api/emoji-assets/dizzy.png',
}] }));
jest.mock('../utils/cosmeticResolver', () => ({ resolveAssetUrl: url => url.startsWith('/') ? `https://api.yaroapp.in${url}` : url }));
import { reactionSeatIndex, seatReactionMedia } from '../utils/seatReactions';
import SeatReaction from '../components/room/SeatReaction';

test('matches every user ID alias and numeric/string seat indexes', () => {
  const seats = [{ seatIndex: 0, user: { userId: 123, _id: 'mongo-id' } }, { seatIndex: '2', user: { id: 'other' } }];
  expect(reactionSeatIndex(seats, 'mongo-id', undefined)).toBe(0);
  expect(reactionSeatIndex(seats, { userId: 123 }, null)).toBe(0);
  expect(reactionSeatIndex(seats, 'other', null)).toBe(2);
  expect(reactionSeatIndex(seats, null, '3')).toBe(3);
  expect(reactionSeatIndex(seats, null, null)).toBeUndefined();
  expect(reactionSeatIndex(seats, null, -1)).toBeUndefined();
});

test('built-in emoji plays from this APK immediately, ignoring foreign asset IDs', () => {
  const media = seatReactionMedia({ emoji: '/api/emoji-assets/dizzy.png', gifUrl: '/api/emoji-assets/dizzy.gif', emojiData: { code: 'dizzy', localGif: 999 } });
  expect(media.sources[0]).toBe(101);
  expect(media.sources).not.toContain(999);
  const custom = seatReactionMedia({ emoji: '/uploads/new.png', gifUrl: '/uploads/new.gif' });
  expect(custom.sources[0]).toEqual({ uri: 'https://api.yaroapp.in/uploads/new.gif' });
});

test('failed animation falls back to the image instead of disappearing above the avatar', () => {
  let tree;
  act(() => { tree = renderer.create(<SeatReaction emoji="/uploads/new.png" gifUrl="/uploads/new.gif" />); });
  expect(tree.root.findByType(Image).props.source.uri).toContain('new.gif');
  act(() => { tree.root.findByType(Image).props.onError(); });
  expect(tree.root.findByType(Image).props.source.uri).toContain('new.png');
  act(() => { tree.root.findByType(Image).props.onError(); });
  expect(tree.root.findByType(Text).props.children).toBe('🙂');
  act(() => tree.unmount());
});

test('classic Unicode emoji renders as text without an image request', () => {
  let tree;
  act(() => { tree = renderer.create(<SeatReaction emoji="❤️" />); });
  expect(tree.root.findAllByType(Image)).toHaveLength(0);
  expect(tree.root.findByType(Text).props.children).toBe('❤️');
  act(() => tree.unmount());
});

test('seat reaction does not show the emoji name over the avatar', () => {
  let tree;
  act(() => { tree = renderer.create(<SeatReaction emoji="dizzy" name="Dizzy" emojiData={{ code: 'dizzy', name: 'Dizzy' }} />); });
  expect(tree.root.findAllByType(Text)).toHaveLength(0);
  act(() => tree.unmount());
});

test('custom server animation overrides bundled media for an existing reaction code', () => {
  const media = seatReactionMedia({ emoji: 'dizzy', emojiData: { code: 'dizzy', gifUrl: '/uploads/dizzy-v2.gif' } });
  expect(media.sources[0]).toEqual({ uri: 'https://api.yaroapp.in/uploads/dizzy-v2.gif' });
  expect(media.sources[1]).toBe(101);
});
