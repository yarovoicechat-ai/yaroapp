import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { Animated } from 'react-native';
import RoomEntryEffectEngine from '../components/room/RoomEntryEffectEngine';
import IdentityDisplayName from '../components/identity/IdentityDisplayName';

jest.mock('react-native-linear-gradient', () => 'LinearGradient');
jest.mock('../components/SvgaView', () => 'SvgaView');
jest.mock('../components/AvatarWithFrame', () => 'AvatarWithFrame');

const finish = [];
const motion = () => ({ start: callback => { if (callback) finish.push(callback); }, stop: jest.fn() });
let tree;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.spyOn(Animated, 'timing').mockImplementation(motion);
  jest.spyOn(Animated, 'parallel').mockImplementation(motion);
  jest.spyOn(Animated, 'sequence').mockImplementation(motion);
  finish.length = 0;
});
afterEach(async () => {
  if (tree) await act(async () => tree.unmount());
  tree = null;
  jest.restoreAllMocks();
});

test('plain joins queue once and do not display a fabricated ride', async () => {
  const first = { entryId: 'a', user: { name: 'One' }, hasEntry: false };
  await act(async () => { tree = Renderer.create(<RoomEntryEffectEngine activeEntry={first} />); });
  expect(tree.root.findAllByType('SvgaView')).toHaveLength(0);
  expect(JSON.stringify(tree.toJSON())).toContain('entered the room');
  const second = { entryId: 'b', user: { name: 'Two' }, hasEntry: false };
  await act(async () => tree.update(<RoomEntryEffectEngine activeEntry={second} />));
  expect(JSON.stringify(tree.toJSON())).toContain('One');
  await act(async () => finish.shift()({ finished: true }));
  expect(JSON.stringify(tree.toJSON())).toContain('Two');
  await act(async () => tree.update(<RoomEntryEffectEngine activeEntry={{ ...second }} />));
  await act(async () => finish.shift()({ finished: true }));
  expect(tree.toJSON()).toBeNull();
});

test('entry uses Coming copy and only adds the large avatar when configured', async () => {
  const entry = { entryId: 'ride', user: { name: 'Rider' }, entrance: {
    animationUrl: 'bike.svga', metadata: { showAvatar: true, comingText: 'is coming' },
  } };
  await act(async () => { tree = Renderer.create(<RoomEntryEffectEngine activeEntry={entry} />); });
  expect(tree.root.findAllByType('SvgaView')[0].props.source).toBe('bike.svga');
  expect(tree.root.findAllByType('AvatarWithFrame')).toHaveLength(2);
  expect(JSON.stringify(tree.toJSON())).toContain('is coming');
  await act(async () => finish.shift()({ finished: true }));
  const noAvatar = { ...entry, entryId: 'ride-2', entrance: { ...entry.entrance, metadata: { showAvatar: false } } };
  await act(async () => tree.update(<RoomEntryEffectEngine activeEntry={noAvatar} />));
  expect(tree.root.findAllByType('AvatarWithFrame')).toHaveLength(1);
});

test('styled names keep the full name with no glow blur', async () => {
  await act(async () => { tree = Renderer.create(<IdentityDisplayName name="Long Fancy Name" effect={{
    colors: ['#FFD700', '#FFFFFF'], animationType: 'none', glowColor: '#FFAA00',
  }} />); });
  const text = tree.root.findAllByType('Text')[0];
  expect(text.props.accessibilityLabel).toBe('Long Fancy Name');
  expect(JSON.stringify(text.props.style)).toContain('"textShadowRadius":0');
});

test('multicolour name changes smoothly across letters without hiding the name', async () => {
  jest.spyOn(Animated, 'loop').mockImplementation(motion);
  await act(async () => { tree = Renderer.create(<IdentityDisplayName name="BULLET" effect={{
    colors: ['#E6B94F', '#FFF8D6'], animationType: 'shimmer',
  }} />); });
  const sweepCall = Animated.timing.mock.calls.find(([, config]) => config.duration === 4200);
  expect(sweepCall).toBeDefined();
  const sweep = sweepCall[0];
  const glyphs = tree.root.findAllByType('Text').filter(node =>
    node.props.children === 'B' || node.props.children === 'T');
  expect(glyphs).toHaveLength(2);
  await act(async () => sweep.setValue(0.15));
  expect(glyphs[0].props.style.color).not.toBe(glyphs[1].props.style.color);
  const firstColor = glyphs[0].props.style.color;
  await act(async () => sweep.setValue(0.55));
  expect(glyphs[0].props.style.color).not.toBe(firstColor);
  const parent = tree.root.findAllByType('Text').find(node => node.props.accessibilityLabel === 'BULLET');
  expect(parent).toBeDefined();
});

test('assigned effects honour their palette and speed, and expire automatically', async () => {
  jest.useFakeTimers();
  jest.spyOn(Animated, 'loop').mockImplementation(motion);
  const expiry = new Date(Date.now() + 1000).toISOString();
  try {
    await act(async () => { tree = Renderer.create(<IdentityDisplayName name="Assigned" effect={{
      enabled: true, colors: ['#45D79A', '#B8FFD9', '#E2FFE8', '#60D6BA'],
      animationType: 'glow_pulse', speed: 0.5, expiresAt: expiry,
    }} />); });
    expect(Animated.timing.mock.calls.some(([, config]) => config.duration === 8400)).toBe(true);
    await act(async () => jest.advanceTimersByTime(1020));
    const parent = tree.root.findAllByType('Text').find(node => node.props.accessibilityLabel === 'Assigned');
    expect(parent).toBeDefined();
    expect(JSON.stringify(parent.props.style)).not.toContain('#45D79A');
  } finally { jest.useRealTimers(); }
});
