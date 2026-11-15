import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { AppState, PermissionsAndroid } from 'react-native';
import LiveStreamScreen from '../screens/user/LiveStreamScreen';
import { apiUtil } from '../utils/apiUtil';
import { createAgoraRtcEngine } from 'react-native-agora';
import { getSocket } from '../sockets';
import LiveConnectionSheet from '../components/live/LiveConnectionSheet';
import LiveBottomControls from '../components/live/LiveBottomControls';
import LiveChatInputModal from '../components/live/LiveChatInputModal';
import LiveGiftTrayModal from '../components/live/LiveGiftTrayModal';

jest.mock('../utils/apiUtil', () => ({ apiUtil: { post: jest.fn(), get: jest.fn() } }));
jest.mock('../sockets', () => ({ getSocket: jest.fn(() => null) }));
jest.mock('../services/BillingService', () => ({ __esModule: true, default: { queryProducts: jest.fn(async () => ({})) } }));
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
  getSocket.mockReturnValue(null);
  apiUtil.get.mockResolvedValue({ data: { data: { diamonds: 500 } } });
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_name, handler) => { stateHandler = handler; return { remove: jest.fn() }; });
  jest.spyOn(PermissionsAndroid, 'requestMultiple').mockResolvedValue({ camera: 'granted', mic: 'granted' });
  engine = Object.fromEntries(['initialize', 'enableVideo', 'startPreview', 'stopPreview', 'leaveChannel', 'release', 'renewToken', 'setClientRole', 'updateChannelMediaOptions'].map(key => [key, jest.fn()]));
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

test('newly created host uses issued credentials immediately without a second join request', async () => {
 const rtc = { isHost: true, appId: 'app', token: 'issued', channelName: 'live_room', agoraUid: 10, hostUid: 10 };
 apiUtil.post.mockResolvedValue({ data: { data: room } });
 await act(async () => { tree = renderer.create(<LiveStreamScreen navigation={navigation} route={{ params: { roomId: room._id, room, rtc, permissionsGranted: true } }} />); });
 expect(apiUtil.post).not.toHaveBeenCalledWith('/live/rooms/room/join');
 expect(engine.joinChannel).toHaveBeenCalledWith('issued', 'live_room', 10, expect.objectContaining({ publishCameraTrack: true }));
 expect(tree.root.findAllByType('RtcSurfaceView')).toHaveLength(1);
});

test('failed RTC connection stops capture after a bounded wait', async () => {
 await mount(true);
 await act(async () => jest.advanceTimersByTime(20000));
 expect(engine.stopPreview).toHaveBeenCalled();
 expect(JSON.stringify(tree.toJSON())).toContain('Live connection timed out');
});
test('server moderation stops the native connection on the next heartbeat', async () => {
  await mount(false);
  await act(async () => events.onJoinChannelSuccess());
  apiUtil.post.mockRejectedValueOnce({ response: { status: 410 } });
  await act(async () => jest.advanceTimersByTime(15000));
  expect(engine.leaveChannel).toHaveBeenCalled();
  expect(JSON.stringify(tree.toJSON())).toContain('This live has ended.');
});

test('viewer previews locally and sends a real connection request before publishing', async () => {
  const handlers = {};
  const socket = { connected: true, emit: jest.fn(), on: jest.fn((event, handler) => { handlers[event] = handler; }), off: jest.fn() };
  getSocket.mockReturnValue(socket);
  await mount(false);
  await act(async () => events.onJoinChannelSuccess());
  await act(async () => tree.root.findByType(LiveBottomControls).props.onOpenPK());
  expect(tree.root.findByType(LiveConnectionSheet).props.visible).toBe(true);
  expect(engine.startPreview).toHaveBeenCalled();
  expect(engine.updateChannelMediaOptions).not.toHaveBeenCalled();
  await act(async () => tree.root.findByType(LiveConnectionSheet).props.onRequest());
  expect(socket.emit).toHaveBeenCalledWith('live:apply_join', { roomId: 'room' });
  expect(tree.root.findByType(LiveConnectionSheet).props.pending).toBe(true);
  await act(async () => handlers['live:guest_accepted']({ roomId: 'different', rtc: { token: 'bad' } }));
  expect(engine.renewToken).not.toHaveBeenCalled();
  await act(async () => handlers['live:guest_accepted']({ roomId: 'room', rtc: { token: 'publisher', isCoHost: true, agoraUid: 20 } }));
  expect(engine.renewToken).toHaveBeenCalledWith('publisher');
  expect(engine.updateChannelMediaOptions).toHaveBeenCalledWith(expect.objectContaining({ publishCameraTrack: true, publishMicrophoneTrack: true }));
  expect(tree.root.findByType(LiveConnectionSheet).props.visible).toBe(false);
  await act(async () => tree.unmount()); tree = null;
  expect(socket.off).toHaveBeenCalledWith('live:chat_message', handlers['live:chat_message']);
  expect(socket.emit).toHaveBeenCalledWith('live:leave_guest', { roomId: 'room' });
});

test('chat is delivered through the socket and gifts use the server wallet', async () => {
  const socket = { connected: true, emit: jest.fn(), on: jest.fn(), off: jest.fn() };
  getSocket.mockReturnValue(socket);
  await mount(false);
  await act(async () => tree.root.findByType(LiveChatInputModal).props.onSendMessage('Hello'));
  expect(socket.emit).toHaveBeenCalledWith('live:chat', { roomId: 'room', text: 'Hello' });
  expect(tree.root.findByType(LiveGiftTrayModal).props.coinBalance).toBe(500);
  await act(async () => tree.root.findByType(LiveGiftTrayModal).props.onSendGift({ gift: { id: 'rose', price: 20 }, quantity: 10, receiver: {} }));
  expect(apiUtil.post).toHaveBeenCalledWith('/live/rooms/room/gift', { giftId: 'rose', quantity: 10, target: 'host' });
});
