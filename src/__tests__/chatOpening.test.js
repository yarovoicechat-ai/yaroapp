import React from 'react';
import renderer, { act } from 'react-test-renderer';
import ChatScreen from '../screens/chats/ChatScreen';
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
jest.mock('react-native-linear-gradient', () => 'LinearGradient');
jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }), useIsFocused: () => true }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
jest.mock('../context/AuthProvider', () => ({ AuthContext: require('react').createContext({ user: { _id: 'self', role: 'user' }, fetchUserProfile: jest.fn() }) }));
jest.mock('../utils/apiUtil', () => ({ apiUtil: { get: jest.fn(async () => ({ data: { success: true, data: [] } })), post: jest.fn(async () => ({ data: {} })) } }));
jest.mock('../sockets', () => ({ getSocket: () => ({ on: jest.fn(), off: jest.fn(), emit: jest.fn() }) }));
jest.mock('../components/GiftMedia', () => 'GiftMedia');
jest.mock('../components/chat/ChatGiftModal', () => 'ChatGiftModal');
jest.mock('../components/chat/ChatSafetyMenu', () => 'ChatSafetyMenu');
jest.mock('../utils/AlertService', () => ({ AlertService: { show: jest.fn() } }));
for (const isHost of [false, true]) {
  test(`opening a ${isHost ? 'host' : 'regular'} conversation renders without a hosting-scope crash`, async () => {
    let tree;
    await act(async () => {
      tree = renderer.create(<ChatScreen route={{ params: { conversationId: '1234567890abcdef12345678', otherUser: { _id: 'recipient', name: 'Recipient', isHost } } }} />);
    });
    const callIcons = tree.root.findAll(node => node.type === 'Icon' && node.props.name === 'call');
    expect(callIcons).toHaveLength(isHost ? 1 : 0);
    await act(async () => tree.unmount());
  });
}
