import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Linking } from 'react-native';
import { buildRoomShare, buildProfileShare } from '../utils/shareLinks';
import RoomShareModal from '../components/room/RoomShareModal';
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ bottom: 0 }) }));

test.each([[buildRoomShare, 'room'], [buildProfileShare, 'user']])('share payload always includes clickable %s link in Android message text', (build, path) => {
  const payload = build('123456', 'Yaro Test');
  expect(payload.url).toBe('https://yaroapp.in/' + path + '/123456');
  expect(payload.message.split('\n').at(-1)).toBe(payload.url);
  expect(payload.message).toContain('123456');
  expect(() => build('', 'Test')).toThrow();
});

test('WhatsApp room share carries the complete link instead of only the ID', async () => {
  jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
  const open = jest.spyOn(Linking, 'openURL').mockResolvedValue();
  let tree;
  await act(async () => { tree = renderer.create(<RoomShareModal visible roomId="1000000086"
    roomName="Customer Service" onClose={jest.fn()} />); });
  await act(async () => { await tree.root.findByProps({ accessibilityLabel: 'Share room on WhatsApp' }).props.onPress(); });
  const sharedText = decodeURIComponent(open.mock.calls[0][0].split('?text=')[1]);
  expect(sharedText).toContain('https://yaroapp.in/room/1000000086');
  await act(async () => tree.unmount());
  jest.restoreAllMocks();
}, 15000);
