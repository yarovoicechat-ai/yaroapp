import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { Text, Animated } from 'react-native';
import IdentityDisplayId from '../components/identity/IdentityDisplayId';
import { resolveDisplayId } from '../utils/identityId';
import { getRoomSeatConfig } from '../utils/roomSeats';

jest.mock('react-native-vector-icons/Ionicons', () => 'CopyIcon');
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'BadgeIcon');
jest.mock('../components/SvgaView', () => 'IdBadge');

test('normal ID remains normal even when callers supply a default VIP label', async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  let tree;
  await act(async () => { tree = Renderer.create(<IdentityDisplayId userId={123456} badgeText="VIP" badgeUrl="https://example.test/badge.png" showCopy={false} />); });
  expect(tree.root.findAllByType(Text).map(node => node.props.children).join('')).toBe('YARO ID : 123456');
  expect(tree.root.findAllByType('IdBadge')).toHaveLength(0);
  await act(async () => tree.unmount());
});
test('unique identity uses its actual number, trims padding, and never falls back to the permanent number', () => {
  expect(resolveDisplayId({ userId: 123456, customDisplayId: ' 8888 ' })).toEqual({ effectiveId: '8888', isUnique: true });
  expect(resolveDisplayId({ userId: 123456, officialDisplayId: '123456' }).isUnique).toBe(false);
  expect(resolveDisplayId({ userId: 123456, customDisplayId: '8888', isOfficial: true, officialDisplayId: 'OFFICIAL' }).effectiveId).toBe('OFFICIAL');
});
test('badge artwork never replaces the unique ID number', async () => {
  const animation = jest.spyOn(Animated, 'loop').mockReturnValue({ start: jest.fn(), stop: jest.fn() });
  let tree;
  try {
    await act(async () => { tree = Renderer.create(<IdentityDisplayId userId={123456} customDisplayId="8888" badgeUrl="https://example.test/badge.svga" showCopy={false} />); });
    expect(tree.root.findAllByType('IdBadge')).toHaveLength(1);
    const labels = tree.root.findAllByType(Text).map(node => node.props.children).join('');
    expect(labels).toContain('8888');
    expect(labels).not.toContain('YARO ID');
    expect(labels).not.toContain('123456');
  } finally {
    if (tree) await act(async () => tree.unmount());
    animation.mockRestore();
  }
});
test('seat counts always exclude host and co-host and never fall below eight member seats', () => {
  for (const count of [8, 10, 12, 15, 17]) {
    const config = getRoomSeatConfig(count);
    expect(config.bottomCount).toBe(count);
    expect(config.totalCount).toBe(count + 2);
  }
  expect(getRoomSeatConfig(6)).toMatchObject({ bottomCount: 8, totalCount: 10 });
});
