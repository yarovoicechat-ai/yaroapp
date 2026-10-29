import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import MeScreen from '../screens/user/Me';
import { AuthContext } from '../context/AuthProvider';

jest.mock('../context/AuthProvider', () => ({ AuthContext: require('react').createContext({}) }));
jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({ navigate: jest.fn() }), useFocusEffect: jest.fn() }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: key => key }) }));
jest.mock('react-native-vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons');
jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');
jest.mock('react-native-linear-gradient', () => 'LinearGradient');
jest.mock('react-native-device-info', () => ({ getUniqueId: jest.fn() }));
jest.mock('../utils/apiUtil', () => ({ apiUtil: {} }));
jest.mock('../utils/AlertService', () => ({ AlertService: { show: jest.fn() } }));
jest.mock('../components/AvatarWithFrame', () => 'AvatarWithFrame');
jest.mock('../components/identity/IdentityDisplayId', () => 'IdentityDisplayId');
jest.mock('../components/SvgaView', () => 'SvgaView');

jest.setTimeout(20000);

beforeEach(() => { global.IS_REACT_ACT_ENVIRONMENT = true; });

test.each([
  [{ role: 'user' }, null],
  [{ role: 'host', isHost: true }, 'Team & Targets'],
  [{ role: 'bd' }, 'BD Center'],
  [{ role: 'bdLeader' }, 'BD Leader'],
  [{ role: 'user', hasAppOption: true, appRole: 'bd-leader' }, 'BD Leader'],
  [{ role: 'agency' }, 'Agency Hub'],
])('Me opens for account %j with the correct role option', async (user, label) => {
  let tree;
  try {
    await act(async () => { tree = Renderer.create(
      <AuthContext.Provider value={{ user, loading: false, fetchUserProfile: jest.fn(), logout: jest.fn() }}>
        <MeScreen />
      </AuthContext.Provider>
    ); });
    const rendered = JSON.stringify(tree.toJSON());
    expect(rendered).toContain('Yaro User');
    if (label) expect(rendered).toContain(label);
    if (label === 'BD Center') expect(rendered).not.toContain('BD Leader');
    if (label === 'BD Leader') expect(rendered).not.toContain('BD Center');
  } finally {
    if (tree) await act(async () => tree.unmount());
  }
});
