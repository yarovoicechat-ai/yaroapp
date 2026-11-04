import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Image, Text, View, StyleSheet } from 'react-native';
import ResponsiveChatBubble from '../components/room/ResponsiveChatBubble';
import { getRoomBubbleWidth } from '../utils/roomBubbleLayout';

jest.mock('react-native-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  return props => React.createElement(View, props, props.children);
});
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');
jest.mock('../components/identity/IdentityDisplayName', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return props => React.createElement(Text, { style: props.style }, props.name);
});
jest.mock('../components/SvgaView', () => 'BubbleArtwork');
jest.mock('../utils/avatarUtil', () => ({ getUserAvatar: () => ({ uri: 'avatar.png' }) }));
jest.mock('../components/gift/giftMediaUtils', () => ({ resolveGiftVisual: () => ({}) }));

test.each([
  [360, 270, 270], [360, 328, 328], [820, 700, 700],
  [360, 600, 328], [360, null, 290], [320, 250, 250],
])('screen %s and list %s keep bubble width at %s', (screen, list, expected) => {
  expect(getRoomBubbleWidth(screen, list)).toBe(expected);
});

beforeEach(() => { jest.spyOn(Image, 'getSize').mockImplementation((uri, success) => success(300, 145)); });
afterEach(() => jest.restoreAllMocks());

const text = 'Hello! Yeh poora message dikhna chahiye. '.repeat(10) + '\nSecond line in Hindi: \u0928\u092e\u0938\u094d\u0924\u0947 \u0926\u094b\u0938\u094d\u0924\u094b\u0902 \u{1F44B}';

test.each([220, 290])('equipped artwork cannot collapse or truncate the message at list width %s', async availableWidth => {
  let tree;
  await act(async () => {
    tree = renderer.create(<ResponsiveChatBubble availableWidth={availableWidth}
      sender={{ name: 'A long sender name' }} message={{ text }}
      bubbleConfig={{ imageUrl: 'bubble.png', textColor: '#FFFFFF' }} />);
  });
  const outer = tree.root.findAllByType(View)[0];
  expect(StyleSheet.flatten(outer.props.style).width).toBeLessThanOrEqual(availableWidth);
  const message = tree.root.findAllByType(Text).find(node => node.props.children === text);
  expect(message).toBeDefined();
  expect(message.props.numberOfLines).toBeUndefined();
  expect(StyleSheet.flatten(message.props.style)).toMatchObject({ flexShrink: 0, alignSelf: 'stretch' });
  const artwork = tree.root.findByType('BubbleArtwork');
  expect(StyleSheet.flatten(artwork.props.style).position).toBe('absolute');
  const body = tree.root.findAllByType(View).find(node => node.props.testID === 'equipped-message-body');
  const bodyStyle = StyleSheet.flatten(body.props.style);
  expect(bodyStyle.width).toBeLessThanOrEqual(availableWidth);
  expect(bodyStyle.borderWidth).toBe(0);
  expect(bodyStyle.paddingLeft).toBeGreaterThanOrEqual(18);
  expect(bodyStyle.paddingBottom).toBeGreaterThanOrEqual(18);
  expect(body.findAllByType(Text).some(node => node.props.children === text)).toBe(true);
  expect(body.findAllByType(Text).some(node => node.props.children === 'A long sender name')).toBe(true);
  await act(async () => {
    tree.root.findByProps({ testID: 'equipped-message-content' }).props.onLayout({ nativeEvent: { layout: { height: 170 } } });
  });
  const tallerStyle = StyleSheet.flatten(body.props.style);
  expect(tallerStyle.paddingTop).toBeGreaterThanOrEqual(45);
  expect(tallerStyle.paddingBottom).toBeGreaterThanOrEqual(68);
  await act(async () => tree.unmount());
});

test.each([{ isVip: true }, { vipLevel: 4 }, { svipLevel: 2 }, { svipLevel: 3 }, { svipLevel: 5 }, {}, { type: 'welcome', targetUserName: 'Me' }])('membership and regular messages fit their list %j', async flags => {
  let tree;
  await act(async () => { tree = renderer.create(<ResponsiveChatBubble availableWidth={270}
    message={{ text, ...flags }} sender={{ name: 'Sender' }} />); });
  expect(StyleSheet.flatten(tree.root.findAllByType(View)[0].props.style).width).toBe(270);
  if (flags.type !== 'welcome') {
    const message = tree.root.findAllByType(Text).find(node => node.props.children === text);
    expect(message).toBeDefined();
    expect(message.props.numberOfLines).toBeUndefined();
  }
  await act(async () => tree.unmount());
});

test('resizing the list updates an existing bubble without losing its text', async () => {
  let tree;
  const render = availableWidth => <ResponsiveChatBubble availableWidth={availableWidth}
    message={{ text }} bubbleConfig={{ bgColors: ['#101010', '#202020'] }} />;
  await act(async () => { tree = renderer.create(render(290)); });
  await act(async () => { tree.update(render(150)); });
  expect(StyleSheet.flatten(tree.root.findAllByType(View)[0].props.style).width).toBe(150);
  expect(tree.root.findAllByType(Text).some(node => node.props.children === text)).toBe(true);
  await act(async () => tree.unmount());
});

test('reference layout keeps avatar, owner, levels, club, medals and message in one frame', async () => {
  let tree;
  await act(async () => { tree = renderer.create(<ResponsiveChatBubble availableWidth={290}
    sender={{ name: 'Maahi' }} message={{ text: 'Hello, nice to meet you!', isOwner: true,
      wealthLevel: 28, charmLevel: 31, clubName: 'DIVYA', equippedBadges: [{ name: 'Medal', imageUrl: 'https://example.com/medal.png' }] }}
    bubbleConfig={{ imageUrl: 'frame.png' }} />); });
  const body = tree.root.findAllByType(View).find(node => node.props.testID === 'equipped-message-body');
  const labels = body.findAllByType(Text).map(node => Array.isArray(node.props.children) ? node.props.children.join('') : node.props.children);
  for (const label of ['Maahi', 'Owner', 'Lv.28', 'Lv.31', 'DIVYA', 'Hello, nice to meet you!']) expect(labels).toContain(label);
  expect(body.findByProps({ accessibilityLabel: 'Medal' })).toBeDefined();
  await act(async () => tree.unmount());
});
