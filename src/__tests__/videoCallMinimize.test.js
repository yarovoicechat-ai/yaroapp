import React from 'react';
import { act, create } from 'react-test-renderer';
import VideoCallScreen from '../screens/call/VideoCallScreen';

const mockEngine = Object.fromEntries([
  'initialize', 'enableVideo', 'enableAudio', 'setChannelProfile', 'setClientRole',
  'enableLocalVideo', 'enableLocalAudio', 'muteLocalVideoStream', 'muteLocalAudioStream',
  'muteAllRemoteVideoStreams', 'muteAllRemoteAudioStreams', 'setDefaultAudioRouteToSpeakerphone',
  'setEnableSpeakerphone', 'adjustPlaybackSignalVolume', 'adjustRecordingSignalVolume',
  'startPreview', 'stopPreview', 'registerEventHandler', 'updateChannelMediaOptions',
].map(key => [key, jest.fn()]));
mockEngine.joinChannel = jest.fn(() => 0);
const mockRelease = jest.fn();
const mockSetActiveCall = jest.fn();
const mockClearCall = jest.fn();
const mockNavigation = {
  push: jest.fn(), dispatch: jest.fn(), isFocused: () => true,
  addListener: jest.fn(() => () => {}),
  getState: () => ({ index: 1, routes: [{ key: 'video-test' }, { key: 'tabs-test' }] }),
};
const mockRoute = { key: 'video-test', params: { transactionId: 'tx', channelName: 'channel',
  agora: { appId: 'app', token: 'token', uid: 1 }, hostId: 'partner' } };

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation, useRoute: () => mockRoute,
  CommonActions: { reset: value => ({ type: 'RESET', ...value }) },
  StackActions: { pop: count => ({ type: 'POP', count }) },
}));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) }));
jest.mock('react-native-linear-gradient', () => 'LinearGradient');
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
jest.mock('react-native-incall-manager', () => ({ start: jest.fn(), stop: jest.fn(), setSpeakerphoneOn: jest.fn() }));
jest.mock('react-native-agora', () => ({
  createAgoraRtcEngine: () => mockEngine, RtcSurfaceView: 'Video', RtcTextureView: 'Video',
  ChannelProfileType: {}, ClientRoleType: {}, RenderModeType: {}, VideoSourceType: {},
}));
jest.mock('../context/AuthProvider', () => ({ AuthContext: require('react').createContext({ user: { id: 'me' } }) }));
jest.mock('../context/CallContext', () => ({ useCall: () => ({ clearCall: mockClearCall, setActiveCall: mockSetActiveCall }) }));
jest.mock('../context/VoiceRoomContext', () => ({ useVoiceRoom: () => ({ activeRoom: null }) }));
jest.mock('../services/agoraService', () => ({ AgoraClientService: {
  prepareEngineForAppId: () => ({ engine: mockEngine }), releaseEngine: (...args) => mockRelease(...args),
} }));
jest.mock('../services/FloatingCallBridge', () => ({ FloatingCallBridge: {
  stopFloatingCall: jest.fn(), updateFloatingCallState: jest.fn(),
  subscribeEvents: () => () => {}, startFloatingCall: jest.fn(),
} }));
jest.mock('../utils/apiUtil', () => ({ apiUtil: { get: jest.fn(), post: jest.fn(async () => ({})) } }));
jest.mock('../sockets', () => ({ getSocket: () => null }));
jest.mock('../utils/avatarUtil', () => ({ getUserAvatar: () => ({ uri: 'avatar' }) }));
jest.mock('../utils/callValidation', () => ({ getRoleAgoraCredentials: () => ({ appId: 'app', token: 'token', uid: 1 }) }));
jest.mock('../utils/AlertService', () => ({ AlertService: { show: jest.fn() } }));
jest.mock('../components/call/VideoCallSafetyModal', () => 'SafetyModal');
jest.mock('../components/call/VideoCallGiftModal', () => 'GiftModal');
jest.mock('../components/GiftMedia', () => 'GiftMedia');

test('minimize and restore keep the same RTC session; ending releases it', async () => {
  let tree;
  await act(async () => { tree = create(<VideoCallScreen />); });
  expect(mockEngine.joinChannel).toHaveBeenCalledTimes(1);
  await act(async () => {
    tree.root.findAllByProps({ accessibilityLabel: 'Minimize video call' })[0].props.onPress();
  });
  expect(mockNavigation.push).toHaveBeenCalledWith('MainTabs');
  expect(tree.toJSON()).toBeNull();
  expect(mockRelease).not.toHaveBeenCalled();
  const minimized = mockSetActiveCall.mock.calls.at(-1)[0];
  expect(minimized).toMatchObject({ type: 'video', isMinimized: true, transactionId: 'tx' });
  await act(async () => { minimized.onExpand(); });
  expect(mockNavigation.dispatch).toHaveBeenCalledWith({ type: 'POP', count: 1 });
  expect(tree.toJSON()).not.toBeNull();
  expect(mockEngine.joinChannel).toHaveBeenCalledTimes(1);
  expect(mockRelease).not.toHaveBeenCalled();
  await act(async () => { await mockSetActiveCall.mock.calls.at(-1)[0].onEndCall(); });
  expect(mockRelease).toHaveBeenCalledTimes(1);
  await act(async () => { tree.unmount(); });
  expect(mockRelease).toHaveBeenCalledTimes(1);
});
