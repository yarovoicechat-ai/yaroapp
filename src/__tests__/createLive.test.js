import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { PermissionsAndroid, TouchableOpacity, Text, StyleSheet } from 'react-native';
import CreateLiveScreen from '../screens/user/CreateLiveScreen';
import { AuthContext } from '../context/AuthProvider';
import { apiUtil } from '../utils/apiUtil';
import { createAgoraRtcEngine } from 'react-native-agora';
import LiveVideoGrid from '../components/live/LiveVideoGrid';

jest.mock('../context/AuthProvider', () => ({ AuthContext: require('react').createContext({}) }));
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: effect => require('react').useEffect(effect, [effect]),
}));
jest.mock('../utils/apiUtil', () => ({ apiUtil: { post: jest.fn() } }));
jest.mock('../context/VoiceRoomContext', () => ({ useVoiceRoom: () => ({ activeRoom: null }) }));
jest.mock('../services/agoraService', () => ({ __esModule: true, default: {
  getActiveAgoraConfig: async () => ({ appId: 'app' }),
} }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 24, bottom: 24 }) }));
jest.mock('react-native-agora', () => ({ createAgoraRtcEngine: jest.fn(), RtcSurfaceView: 'RtcSurfaceView', RtcTextureView: 'RtcSurfaceView' }));
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');
jest.mock('../features/YaroAR', () => ({
  ARPreview: 'ARPreview', ARFilterPanel: 'ARFilterPanel', ARFaceMaskOverlay: 'ARFaceMaskOverlay', useARLifecycle: jest.fn(),
  useARSession: () => ({ trackId: null, frontCamera: true }),
  ARManager: {
    waitForRelease: async () => {}, bind: () => async () => {},
    getSnapshot: () => ({ trackId: null, selectedId: null }), switchCamera: async () => {},
  },
}));

let tree;
const navigation = { goBack: jest.fn(), navigate: jest.fn() };
beforeEach(async () => {
  jest.clearAllMocks();
  jest.spyOn(PermissionsAndroid, 'requestMultiple').mockResolvedValue({ camera: 'granted', microphone: 'granted' });
  createAgoraRtcEngine.mockReturnValue(Object.fromEntries(
    ['initialize', 'enableVideo', 'startPreview', 'stopPreview', 'release'].map(name => [name, jest.fn(() => 0)]),
  ));
  apiUtil.post.mockResolvedValue({ data: { data: { room: { _id: 'room' }, rtc: { token: 'token' } } } });
  await act(async () => {
    tree = renderer.create(<AuthContext.Provider value={{ user: { name: 'Host' } }}>
      <CreateLiveScreen navigation={navigation} route={{ params: {} }} />
    </AuthContext.Provider>);
  });
});
afterEach(async () => {
  await act(async () => tree.unmount());
  jest.restoreAllMocks();
});

const button = label => tree.root.findAllByType(TouchableOpacity).find(node =>
  node.props.accessibilityLabel === label || node.findAllByType(Text).some(text => text.props.children === label),
);

test('effects start collapsed and a tab opens a compact panel on the existing camera screen', async () => {
  expect(tree.root.findAllByType('ARFilterPanel')).toHaveLength(0);
  expect(tree.root.findAllByType('ARPreview')).toHaveLength(1);
  await act(async () => button('Effects').props.onPress());
  const panel = tree.root.findByType('ARFilterPanel');
  expect(panel.props.initialTab).toBe('Effects');
  expect(panel.props.compact).toBe(true);
  expect(panel.props.showTabs).toBe(false);
  expect(navigation.navigate).not.toHaveBeenCalled();
  await act(async () => panel.props.onClose());
  expect(tree.root.findAllByType('ARFilterPanel')).toHaveLength(0);
});

test('four-box selection previews four boxes and sends the same layout when starting live', async () => {
  await act(async () => button('Room type').props.onPress());
  await act(async () => button('4 video boxes').props.onPress());
  expect(tree.root.findByType(LiveVideoGrid).props.count).toBe(4);
  expect(tree.root.findAllByType('ARPreview')).toHaveLength(0);
  await act(async () => button('Start live').props.onPress());
  expect(apiUtil.post).toHaveBeenCalledWith('/live/rooms', expect.objectContaining({ mode: 'multi', seatCount: 4 }));
  expect(navigation.navigate).toHaveBeenCalledWith('LiveStream', expect.objectContaining({ roomId: 'room', permissionsGranted: true }));
});

test('multi-live controls and boxes follow measured content and leave space for bottom actions', async () => {
  await act(async () => button('Room type').props.onPress());
  await act(async () => button('4 video boxes').props.onPress());
  await act(async () => {
    tree.root.findByProps({ testID: 'live-info-card' }).props.onLayout({ nativeEvent: { layout: { y: 70, height: 120 } } });
    tree.root.findByProps({ testID: 'multi-live-controls' }).props.onLayout({ nativeEvent: { layout: { height: 60 } } });
    tree.root.findByProps({ testID: 'live-start-bottom' }).props.onLayout({ nativeEvent: { layout: { height: 180 } } });
  });
  const controls = StyleSheet.flatten(tree.root.findByProps({ testID: 'multi-live-controls' }).props.style);
  const preview = StyleSheet.flatten(tree.root.findByProps({ testID: 'multi-live-preview' }).props.style);
  expect(controls.top).toBe(202);
  expect(preview.top).toBeGreaterThanOrEqual(controls.top + 60);
  expect(preview.height).toBeGreaterThan(0);
});
