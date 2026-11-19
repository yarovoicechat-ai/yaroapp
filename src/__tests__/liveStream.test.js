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
import LiveToolsBottomSheet from '../components/live/LiveToolsBottomSheet';
import LiveVideoGrid from '../components/live/LiveVideoGrid';
import LiveChatOverlay from '../components/live/LiveChatOverlay';
import GiftAnimationEngine from '../components/gift/GiftAnimationEngine';
import RoomEntryEffectEngine from '../components/room/RoomEntryEffectEngine';
import { ARManager } from '../features/YaroAR';

jest.mock('../utils/apiUtil', () => ({ apiUtil: { post: jest.fn(), get: jest.fn() } }));
jest.mock('../sockets', () => ({ getSocket: jest.fn(() => null) }));
jest.mock('../components/GiftMedia', () => 'GiftMedia');
jest.mock('../components/SvgaView', () => 'SvgaView');
jest.mock('../services/BillingService', () => ({ __esModule: true, default: { queryProducts: jest.fn(async () => ({})) } }));
jest.mock('../context/VoiceRoomContext', () => ({ useVoiceRoom: () => ({ activeRoom: null, leaveRoom: jest.fn() }) }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) }));
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');
jest.mock('react-native-agora', () => ({
  createAgoraRtcEngine: jest.fn(),
  ChannelProfileType: { ChannelProfileLiveBroadcasting: 1 },
  ClientRoleType: { ClientRoleBroadcaster: 1, ClientRoleAudience: 2 },
  RtcSurfaceView: 'RtcSurfaceView', RtcTextureView: 'RtcSurfaceView',
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
  engine = Object.fromEntries(['initialize', 'enableVideo', 'startPreview', 'stopPreview', 'leaveChannel', 'release', 'renewToken', 'setClientRole', 'updateChannelMediaOptions', 'muteLocalAudioStream', 'muteLocalVideoStream'].map(key => [key, jest.fn()]));
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

test('the live menu opens and host tools omit the camera-off control', async () => {
  await mount(true);
  await act(async () => tree.root.findByType(LiveBottomControls).props.onOpenTools());
  const tools = tree.root.findByType(LiveToolsBottomSheet);
  expect(tools.props.visible).toBe(true);
  expect(JSON.stringify(tree.toJSON())).toContain('Flip Camera');
  expect(JSON.stringify(tree.toJSON())).not.toContain('Camera Off');
});

test('a viewer mounts the host video after joining before the first remote-frame callback', async () => {
  await mount(false);
  expect(tree.root.findAllByType('RtcSurfaceView')).toHaveLength(0);
  await act(async () => events.onJoinChannelSuccess());
  expect(tree.root.findAllByType('RtcSurfaceView')).toHaveLength(1);
  expect(tree.root.findByType('RtcSurfaceView').props.canvas.uid).toBe(10);
  await act(async () => events.onFirstRemoteVideoFrame({}, 10));
  expect(JSON.stringify(tree.toJSON())).not.toContain('Waiting for the host video');
});

test('socket initialization after opening live still subscribes for gifts and entries', async () => {
  await mount(false);
  const socket = { connected: true, emit: jest.fn(), on: jest.fn(), off: jest.fn() };
  getSocket.mockReturnValue(socket);
  await act(async () => jest.advanceTimersByTime(500));
  expect(socket.emit).toHaveBeenCalledWith('live:join', { roomId: 'room' });
  expect(socket.on).toHaveBeenCalledWith('live:gift_received', expect.any(Function));
  expect(socket.on).toHaveBeenCalledWith('entry:effect', expect.any(Function));
});

test('remote gifts and entries reach the fullscreen players with their real assets', async () => {
  const handlers = {};
  getSocket.mockReturnValue({ connected: true, emit: jest.fn(), off: jest.fn(),
    on: jest.fn((name, handler) => { handlers[name] = handler; }) });
  await mount(false);
  const gift = { roomId: 'room', transactionId: 'transaction-1', sender: { name: 'Sender' },
    gift: { id: 'rose', name: 'Rose', icon: 'https://example.com/rose.gif', animationUrl: 'https://example.com/rose.svga', mediaType: 'svga' }, quantity: 2 };
  await act(async () => handlers['live:gift_received'](gift));
  const player = tree.root.findByType(GiftAnimationEngine);
  expect(player.props.animation.gift.animationUrl).toBe(gift.gift.animationUrl);
  expect(player.props.fullScreen).toBe(true);
  expect(tree.root.findByType(LiveChatOverlay).props.recentGift).toMatchObject({
    giftImage: 'https://example.com/rose.gif', giftEmoji: '🎁', giftName: 'Rose', count: 2,
  });
  await act(async () => handlers['live:gift_received'](gift));
  await act(async () => player.props.onAnimationComplete(player.props.animation.id));
  expect(tree.root.findByType(GiftAnimationEngine).props.animation).toBe(null);
  const entry = { roomId: 'room', entryId: 'entry-1', user: { name: 'Arrival' },
    entry: { animationUrl: 'https://example.com/entry.svga' } };
  await act(async () => handlers['entry:effect'](entry));
  expect(tree.root.findByType(RoomEntryEffectEngine).props.activeEntry.entryId).toBe('entry-1');
});

test('four-box rooms render the host and three guest boxes', async () => {
  const rtc = { isHost: true, appId: 'app', token: 'issued', channelName: 'live_room', agoraUid: 10, hostUid: 10 };
  const multiRoom = { ...room, mode: 'multi', seatCount: 4, guests: [] };
  await act(async () => {
    tree = renderer.create(<LiveStreamScreen navigation={navigation} route={{ params: {
      roomId: room._id, room: multiRoom, rtc, permissionsGranted: true,
    } }} />);
  });
  expect(tree.root.findByType(LiveVideoGrid).props.count).toBe(4);
  expect(tree.root.findAllByType('RtcSurfaceView')).toHaveLength(1);
  for (const index of [2, 3, 4]) {
    expect(tree.root.findAllByProps({ accessibilityLabel: `Join video box ${index}` }).length).toBeGreaterThan(0);
  }
});

test('REST guest subdocuments match socket user IDs for updates, deduplication and departure', async () => {
  const handlers = {};
  getSocket.mockReturnValue({ connected: true, emit: jest.fn(), off: jest.fn(),
    on: jest.fn((name, handler) => { handlers[name] = handler; }) });
  const rtc = { isHost: true, appId: 'app', token: 'issued', channelName: 'live_room', agoraUid: 10, hostUid: 10 };
  const multiRoom = { ...room, mode: 'multi', seatCount: 4,
    guests: [{ id: 'mongoose-subdocument', user: { _id: 'guest-user', name: 'Guest' }, agoraUid: 30, camera: false }] };
  await act(async () => {
    tree = renderer.create(<LiveStreamScreen navigation={navigation} route={{ params: {
      roomId: room._id, room: multiRoom, rtc, permissionsGranted: true,
    } }} />);
  });
  await act(async () => handlers['live:guest_joined']({ guest: { id: 'guest-user', name: 'Guest', agoraUid: 30 } }));
  expect(tree.root.findByType(LiveVideoGrid).props.guests).toHaveLength(1);
  expect(tree.root.findByType(LiveVideoGrid).props.guests[0].camera).toBe(false);
  await act(async () => handlers['live:guest_media']({ roomId: 'room', userId: 'guest-user', agoraUid: 30, muted: true, camera: true }));
  expect(tree.root.findByType(LiveVideoGrid).props.guests[0].muted).toBe(true);
  await act(async () => handlers['live:guest_left']({ roomId: 'different-room', userId: 'guest-user' }));
  expect(tree.root.findByType(LiveVideoGrid).props.guests).toHaveLength(1);
  await act(async () => handlers['live:guest_left']({ userId: 'guest-user' }));
  expect(tree.root.findByType(LiveVideoGrid).props.guests).toHaveLength(0);
});

test('single-host preview follows the selected camera mirroring state', async () => {
  await mount(true);
  expect(tree.root.findByType('RtcSurfaceView').props.canvas.mirrorMode).toBe(1);
  await act(async () => ARManager.update({ frontCamera: false }));
  expect(tree.root.findByType('RtcSurfaceView').props.canvas.mirrorMode).toBe(2);
});
