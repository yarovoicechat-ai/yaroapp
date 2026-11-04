import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { Text, TextInput, TouchableOpacity } from 'react-native';
import RoomLockModal from '../components/room/RoomLockModal';
import { apiUtil } from '../utils/apiUtil';

jest.mock('react-native-linear-gradient', () => 'LinearGradient');
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');
jest.mock('../utils/apiUtil', () => ({ apiUtil: { post: jest.fn() } }));
jest.mock('../utils/AlertService', () => ({ AlertService: { show: jest.fn() } }));
let tree;
beforeEach(() => { global.IS_REACT_ACT_ENVIRONMENT = true; jest.useFakeTimers(); apiUtil.post.mockReset(); });
afterEach(async () => { if (tree) await act(async () => tree.unmount()); tree = null; jest.clearAllTimers(); jest.useRealTimers(); });
const button = label => tree.root.findAllByType(TouchableOpacity).find(node => node.findAllByType(Text).some(text => text.props.children === label));

test('correct PIN closes as verified so the parent does not leave the room', async () => {
  const onSuccess = jest.fn(), onClose = jest.fn();
  apiUtil.post.mockResolvedValue({ data: { success: true, valid: true } });
  await act(async () => { tree = Renderer.create(<RoomLockModal visible mode="enter_pin" roomId="123" onSuccess={onSuccess} onClose={onClose} />); });
  await act(async () => tree.root.findByType(TextInput).props.onChangeText('1234'));
  await act(async () => button('Confirm').props.onPress());
  expect(apiUtil.post).toHaveBeenCalledWith('/voice-club/rooms/123/verify-pin', { pin: '1234' });
  expect(onSuccess).toHaveBeenCalledWith('1234');
  expect(onClose).toHaveBeenCalledWith(true);
});
test('wrong PIN does not close or authorize entry', async () => {
  const onSuccess = jest.fn(), onClose = jest.fn();
  apiUtil.post.mockResolvedValue({ data: { success: false, valid: false } });
  await act(async () => { tree = Renderer.create(<RoomLockModal visible mode="enter_pin" roomId="123" onSuccess={onSuccess} onClose={onClose} />); });
  await act(async () => tree.root.findByType(TextInput).props.onChangeText('9999'));
  await act(async () => button('Confirm').props.onPress());
  expect(onSuccess).not.toHaveBeenCalled();
  expect(onClose).not.toHaveBeenCalled();
});
