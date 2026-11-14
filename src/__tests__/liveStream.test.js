import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { AppState, PermissionsAndroid } from 'react-native';
import LiveStreamScreen from '../screens/user/LiveStreamScreen';
import { apiUtil } from '../utils/apiUtil';
import { createAgoraRtcEngine } from 'react-native-agora';

jest.mock('../utils/apiUtil', () => ({ apiUtil: { post: jest.fn() } }));
jest.mock('../context/VoiceRoomContext', () => ({ useVoiceRoom: () => ({ activeRoom: null, leaveRoom: jest.fn() }) }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) }));
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');
jest.mock('react-native-agora', () => ({
  createAgoraRtcEngine: jest.fn(),
  ChannelProfileType: { ChannelProfileLiveBroadcasting: 1 },
  ClientRoleType: { ClientRoleBroadcaster: 1, ClientRoleAudience: 2 },
  RtcSurfaceView: 'RtcSurfaceView',
}));
const room = { _id: 'room', title: 'Live' };
let engine, events, stateHandler, tree;
const navigation = { goBack: jest.fn(), addListener: jest.fn(() => () => {}), dispatch: jest.fn() };
beforeEach(() => {
  jest.useFakeTimers(); jest.clearAllMocks();
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_name, handler) => { stateHandler = handler; return { remove: jest.fn() }; });
  jest.spyOn(PermissionsAndroid, 'requestMultiple').mockResolvedValue({ camera: 'granted', mic: 'granted' });
  engine = Object.fromEntries(['initialize', 'enableVideo', 'startPreview', 'stopPreview', 'leaveChannel', 'release', 'renewToken'].map(key => [key, jest.fn()]));
  engine.joinChannel = jest.fn(() => 0);
  engine.registerEventHandler = jest.fn(handler => { events = handler; });
  createAgoraRtcEngine.mockReturnValue(engine);
});
afterEach(async () => { if (tree) await act(async () => tree.unmount()); tree = null; jest.useRealTimers(); jest.restoreAllMocks(); });
const mount = async isHost => {
  const rtc = { isHost, appId: 'app', token: 'token', channelName: 'live_room', agoraUid: 20, hostUid: 10 };
  apiUtil.post.mockImplementation(async path => ({ data: { success: true, data: path.endsWith('/join') ? { room, rtc } : room } }));
  await act(async () => { tree = renderer.create(<LiveStreamScreen navigation={navigation} route={{ params: { roomId: 'room', rtc } }} />); });
};
test('viewer joins as audience without publishing camera or microphone', async () => {
  await mount(false);
  expect(engine.joinChannel).toHaveBeenCalledWith('token', 'live_room', 20, expect.objectContaining({ clientRoleType: 2, publishCameraTrack: false, publishMicrophoneTrack: false }));
  expect(engine.startPreview).not.toHaveBeenCalled();
  await act(async () => tree.unmount()); tree = null;
  expect(apiUtil.post).toHaveBeenCalledWith('/live/rooms/room/leave');
  expect(engine.release).toHaveBeenCalled();
});
test('host publishes video and ends capture on backgrounding', async () => {
  await mount(true);
  expect(engine.joinChannel).toHaveBeenCalledWith('token', 'live_room', 20, expect.objectContaining({ clientRoleType: 1, publishCameraTrack: true, publishMicrophoneTrack: true }));
  await act(async () => stateHandler('background'));
  expect(engine.stopPreview).toHaveBeenCalled(); expect(engine.leaveChannel).toHaveBeenCalled();
  expect(apiUtil.post).toHaveBeenCalledWith('/live/rooms/room/end');
});
test('server moderation stops the native connection on the next heartbeat', async () => {
  await mount(false);
  await act(async () => events.onJoinChannelSuccess());
  apiUtil.post.mockRejectedValueOnce({ response: { status: 410 } });
  await act(async () => jest.advanceTimersByTime(15000));
  expect(engine.leaveChannel).toHaveBeenCalled();
  expect(JSON.stringify(tree.toJSON())).toContain('This live has ended.');
});
