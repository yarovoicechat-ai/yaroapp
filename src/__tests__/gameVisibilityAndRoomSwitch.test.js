import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import LiveGamesModal from '../components/live/LiveGamesModal';
import FloatingGameBannerWidget from '../components/room/FloatingGameBannerWidget';
import { apiUtil } from '../utils/apiUtil';

jest.mock('../utils/apiUtil', () => ({
  apiUtil: {
    get: jest.fn(),
  },
}));

jest.mock('react-native-linear-gradient', () => 'LinearGradient');
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons');
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');

describe('Game Visibility & Management Sync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('FloatingGameBannerWidget queries /games/config and hides when management sets showInVoiceRoom=false', async () => {
    apiUtil.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          greedyKing: {
            gameId: 'greedy-king',
            isActive: true,
            isHidden: false,
            showInVoiceRoom: false,
            showFloatingBanner: false,
          },
        },
      },
    });

    let component;
    await act(async () => {
      component = Renderer.create(
        <FloatingGameBannerWidget roomType="voice" onSelectGame={jest.fn()} />
      );
    });

    expect(apiUtil.get).toHaveBeenCalledWith('/games/config');
    // When hidden, component renders null
    expect(component.toJSON()).toBeNull();
  });

  test('FloatingGameBannerWidget renders when management enables it', async () => {
    apiUtil.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          greedyKing: {
            gameId: 'greedy-king',
            isActive: true,
            isHidden: false,
            showInVoiceRoom: true,
            showFloatingBanner: true,
          },
        },
      },
    });

    let component;
    await act(async () => {
      component = Renderer.create(
        <FloatingGameBannerWidget roomType="voice" onSelectGame={jest.fn()} />
      );
    });

    expect(apiUtil.get).toHaveBeenCalledWith('/games/config');
    expect(component.toJSON()).not.toBeNull();
  });

  test('LiveGamesModal hides Greedy King and displays empty state when isHidden=true', async () => {
    apiUtil.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          greedyKing: {
            gameId: 'greedy-king',
            isActive: true,
            isHidden: true,
            showInVoiceRoom: false,
          },
        },
      },
    });

    let component;
    await act(async () => {
      component = Renderer.create(
        <LiveGamesModal visible roomType="voice" onClose={jest.fn()} onSelectGame={jest.fn()} />
      );
    });

    expect(apiUtil.get).toHaveBeenCalledWith('/games/config');
    const root = component.root;
    // Check for empty state text
    const texts = root.findAllByType('Text').map((t) => t.props.children);
    expect(texts).toContain('Games Currently Unavailable');
  });
});
