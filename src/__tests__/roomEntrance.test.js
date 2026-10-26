import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { Animated, ImageBackground } from 'react-native';
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
  expect(JSON.stringify(tree.toJSON())).toContain('enter the room');
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
  const entry = { entryId: 'ride', user: { name: 'Rider' }, entry: {
    animationUrl: 'bike.svga', metadata: { showAvatar: true, comingText: 'is coming' },
  } };
  await act(async () => { tree = Renderer.create(<RoomEntryEffectEngine activeEntry={entry} />); });
  expect(tree.root.findAllByType('SvgaView')[0].props.source).toBe('bike.svga');
  expect(tree.root.findAllByType('AvatarWithFrame')).toHaveLength(3);
  expect(JSON.stringify(tree.toJSON())).toContain('enter the room');
  expect(JSON.stringify(tree.toJSON())).toContain('is coming');
  await act(async () => finish.shift()({ finished: true }));
  expect(tree.root.findAllByType('SvgaView')).toHaveLength(1);
  await act(async () => tree.root.findByType('SvgaView').props.onFinish());
  const noAvatar = { ...entry, entryId: 'ride-2', entry: { ...entry.entry, metadata: { showAvatar: false } } };
  await act(async () => tree.update(<RoomEntryEffectEngine activeEntry={noAvatar} />));
  expect(tree.root.findAllByType('AvatarWithFrame')).toHaveLength(2);
});

test('styled names keep the full name with gold styling', async () => {
  await act(async () => { tree = Renderer.create(<IdentityDisplayName name="Long Fancy Name" effect={{
    colors: ['#FFD700', '#FFFFFF'], animationType: 'none', glowColor: '#FFAA00',
  }} />); });
  const text = tree.root.findAllByType('Text')[0];
  expect(text.props.accessibilityLabel).toBe('Long Fancy Name');
  expect(JSON.stringify(text.props.style)).toContain('#FFD700');
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

test('entrance metadata never enables coming banner and holds for two seconds', async () => {
  const delay = jest.spyOn(Animated, 'delay').mockImplementation(motion);
  await act(async () => { tree = Renderer.create(<RoomEntryEffectEngine activeEntry={{
    entryId: 'entrance-only', user: { name: 'Banner' },
    entrance: { animationUrl: 'strip.svga', metadata: { comingText: 'is coming', showAvatar: true } },
  }} />); });
  expect(JSON.stringify(tree.toJSON())).not.toContain('is coming');
  expect(JSON.stringify(tree.toJSON())).toContain('enter the room');
  expect(delay).toHaveBeenCalledWith(2000);
});

test('batched socket entries all play in order', async () => {
  const queuedEntries = ['First', 'Second', 'Third'].map(name => ({ entryId: name, user: { name } }));
  await act(async () => { tree = Renderer.create(<RoomEntryEffectEngine activeEntry={{
    ...queuedEntries[2], queuedEntries,
  }} />); });
  for (const name of ['First', 'Second', 'Third']) {
    expect(JSON.stringify(tree.toJSON())).toContain(name);
    await act(async () => finish.shift()({ finished: true }));
  }
  expect(tree.toJSON()).toBeNull();
});

test('reference entrance shows level, avatar, name and arrival text in order', async () => {
  await act(async () => { tree = Renderer.create(<RoomEntryEffectEngine activeEntry={{
    entryId: 'reference', user: { name: 'Prince', wealthLevel: 17 },
  }} />); });
  const banner = tree.root.findByType(ImageBackground);
  const content = React.Children.toArray(banner.props.children);
  expect(content[0].props.children[1].props.children).toEqual(['Lv.', 17]);
  expect(content[1].props.children.props.user.name).toBe('Prince');
  expect(content[2].props.name).toBe('Prince');
  expect(content[3].props.children.trim()).toBe('enter the room');
});

test('ride and entrance finish independently before advancing the queue', async () => {
  const onComplete = jest.fn();
  const first = { entryId: 'full', user: { name: 'Full' },
    entry: { animationUrl: 'long.svga', duration: 1000 },
    entrance: { animationUrl: 'strip.svga' } };
  await act(async () => { tree = Renderer.create(<RoomEntryEffectEngine activeEntry={first} onComplete={onComplete} />); });
  const players = tree.root.findAllByType('SvgaView');
  expect(players.every(player => player.props.loops === 1)).toBe(true);
  const staleFinish = players[0].props.onFinish;
  await act(async () => tree.update(<RoomEntryEffectEngine activeEntry={{ entryId: 'next', user: { name: 'Next' } }} onComplete={onComplete} />));
  await act(async () => finish.shift()({ finished: true }));
  expect(onComplete).not.toHaveBeenCalled();
  await act(async () => players[0].props.onFinish());
  expect(onComplete).not.toHaveBeenCalled();
  await act(async () => players[1].props.onError());
  expect(onComplete).toHaveBeenCalledWith('full');
  expect(JSON.stringify(tree.toJSON())).toContain('Next');
  await act(async () => staleFinish());
  expect(onComplete).toHaveBeenCalledTimes(1);
});

test.each([
  ['no entrance equipped', null],
  ['default entrance equipped', { isDefault: true }],
])('equipped ride plays with default banner when %s', async (_, entrance) => {
  await act(async () => { tree = Renderer.create(<RoomEntryEffectEngine activeEntry={{
    entryId: 'ride-default', user: { name: 'Rider' },
    entry: { animationUrl: 'ride.svga' }, entrance,
  }} />); });
  expect(tree.root.findByType('SvgaView').props.source).toBe('ride.svga');
  expect(tree.root.findAllByType(ImageBackground)).toHaveLength(1);
  expect(JSON.stringify(tree.toJSON())).toContain('is coming');
  expect(JSON.stringify(tree.toJSON())).toContain('enter the room');
});

test.each([
  ['only custom entrance', { animationUrl: 'entrance.svga' }],
  ['only default entrance', { isDefault: true }],
  ['no cosmetics', null],
])('%s never revives an unequipped ride or coming banner', async (_, entrance) => {
  await act(async () => { tree = Renderer.create(<RoomEntryEffectEngine activeEntry={{
    entryId: 'no-ride', entry: null, effect: null, entrance,
    user: { name: 'Banner', equippedEntryAsset: { animationUrl: 'stale-ride.svga' },
      equippedEntranceAsset: { animationUrl: 'stale-entrance.svga' } },
  }} />); });
  const sources = tree.root.findAllByType('SvgaView').map(player => player.props.source);
  expect(sources).toEqual(entrance?.animationUrl ? ['entrance.svga'] : []);
  expect(JSON.stringify(tree.toJSON())).not.toContain('is coming');
  expect(JSON.stringify(tree.toJSON())).toContain('enter the room');
});
