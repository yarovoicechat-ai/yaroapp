import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Animated, Text, View, StyleSheet } from 'react-native';
import RoomEmojiModal from '../components/room/RoomEmojiModal';
import VoiceRoomSeatGrid from '../components/room/VoiceRoomSeatGrid';
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');
jest.mock('../components/AvatarWithFrame', () => 'Avatar');
jest.mock('../utils/cosmeticResolver', () => ({ DEFAULT_SEAT_IMAGE: 1, LOCK_SEAT_IMAGE: 2 }));
jest.mock('../components/room/VipMicWave', () => {
  const React = require('react'), { View } = require('react-native');
  return props => React.createElement(View, null, props.children);
});
jest.mock('../components/identity/IdentityDisplayName', () => 'Name');

test('emoji picker shows large, opaque glyphs', async () => {
  let tree;
  await act(async () => { tree = renderer.create(<RoomEmojiModal visible onClose={jest.fn()} onSelectEmoji={jest.fn()} />); });
  const emoji = tree.root.findAllByType(Text).filter(node => StyleSheet.flatten(node.props.style)?.fontSize === 36);
  expect(emoji).toHaveLength(24);
  expect(emoji.every(node => StyleSheet.flatten(node.props.style).color === '#FFFFFF')).toBe(true);
  expect(emoji.every(node => StyleSheet.flatten(node.props.style).opacity === undefined)).toBe(true);
  await act(async () => tree.unmount());
});

test('seat reaction covers the avatar at full opacity instead of fading into it', async () => {
  jest.spyOn(Animated, 'sequence').mockReturnValue({ start: jest.fn() });
  const emoji = '\u{1F600}'; let tree;
  await act(async () => { tree = renderer.create(<VoiceRoomSeatGrid topTwoSeats={[{ seatIndex: 0, user: { name: 'A', userId: '1' } }]}
    bottomSeatRows={[]} room={{}} user={{}} styles={{}} handleSeatPress={jest.fn()} registerGiftAvatarPosition={jest.fn()}
    activeSeatReactions={{ 0: { id: 'reaction-1', emoji } }} />); });
  const glyph = tree.root.findAllByType(Text).find(node => node.props.children === emoji);
  const glyphStyle = StyleSheet.flatten(glyph.props.style);
  expect(glyphStyle.fontSize).toBeGreaterThanOrEqual(45);
  expect(glyphStyle.color).toBe('#FFFFFF');
  const overlay = tree.root.findAllByType(View).find(node => node.props.pointerEvents === 'none' && StyleSheet.flatten(node.props.style)?.zIndex === 99999);
  expect(overlay).toBeDefined();
  expect(StyleSheet.flatten(overlay.props.style).opacity).toBeUndefined();
  expect(StyleSheet.flatten(overlay.props.style).transform).toBeUndefined();
  expect(glyphStyle.textShadowRadius).toBeUndefined();
  expect(StyleSheet.flatten(overlay.props.style).height).toBeGreaterThanOrEqual(glyphStyle.lineHeight);
  await act(async () => tree.unmount()); jest.restoreAllMocks();
});
