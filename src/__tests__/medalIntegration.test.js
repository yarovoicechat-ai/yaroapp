import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { TouchableOpacity, Text } from 'react-native';
import Medal from '../screens/user/Medal';
import { apiUtil } from '../utils/apiUtil';
import { AuthContext } from '../context/AuthProvider';
import { AlertService } from '../utils/AlertService';

jest.mock('../utils/apiUtil', () => ({ apiUtil: { get: jest.fn(), post: jest.fn() } }));
jest.mock('../context/AuthProvider', () => ({ AuthContext: require('react').createContext({}) }));
jest.mock('../utils/AlertService', () => ({ AlertService: { show: jest.fn(), error: jest.fn() } }));
jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({}),
  useFocusEffect: callback => require('react').useEffect(callback, [callback]) }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) }));
jest.mock('react-native-linear-gradient', () => 'Gradient');
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'MedalIcon');

test('medals load from shared Badge catalog and wear/purchase use live store endpoints', async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const item = { _id: 'medal-1', name: 'Gold', category: 'Badge', price: 15, imageUrl: 'https://test/gold.png' };
  apiUtil.get.mockImplementation(async url => ({ data: { data: { items:
    url === '/store/inventory' ? [{ itemId: item._id, catalogItem: item }] : [item] } } }));
  apiUtil.post.mockResolvedValue({ data: { data: { equippedBadge: 'Gold' } } });
  let tree;
  const press = async text => {
    const button = tree.root.findAllByType(TouchableOpacity).find(node =>
      node.findAllByType(Text).some(label => label.props.children === text));
    expect(button).toBeDefined();
    await act(async () => button.props.onPress());
  };
  try {
    await act(async () => { tree = Renderer.create(<AuthContext.Provider value={{ user: {}, setUser: jest.fn() }}><Medal /></AuthContext.Provider>); });
    expect(apiUtil.get).toHaveBeenCalledWith('/store/items', { params: { category: 'Badge', activeOnly: true } });
    await press('Wear on Profile');
    expect(apiUtil.post).toHaveBeenCalledWith('/store/equip', { itemId: 'medal-1', name: 'Gold', category: 'Badge', equipped: true });
    await press('Medal Store');
    await press('15 diamonds');
    const buttons = AlertService.show.mock.calls.at(-1)[3];
    await act(async () => buttons.find(button => button.text === 'Buy').onPress());
    expect(apiUtil.post).toHaveBeenCalledWith('/store/buy', { itemId: 'medal-1', durationDays: 30 });
  } finally { if (tree) await act(async () => tree.unmount()); }
});
