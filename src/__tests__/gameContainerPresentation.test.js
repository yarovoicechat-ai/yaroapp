import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { BackHandler } from 'react-native';
import { GameContainer } from '../components/game/GameContainer';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 40, bottom: 20, left: 0, right: 0 }),
}));

jest.mock('../components/game/GameWebView', () => ({
  GameWebView: 'GameWebView',
}));

describe('GameContainer Presentation & Bottom-Sheet Behavior', () => {
  const defaultProps = {
    game: {
      id: 'greedy-king',
      gameId: 'greedy-king',
      title: 'Greedy King',
      gameUrl: 'https://games.yaroapp.in/greedy-king/',
    },
    sessionUrl: 'https://games.yaroapp.in/greedy-king/?sessionId=s1&ticket=t1',
    sessionId: 'sess_123',
    ticket: 'ticket_abc',
    coinsBalance: 25400,
    isFullscreen: false,
    onToggleFullscreen: jest.fn(),
    onClose: jest.fn(),
    onMinimize: jest.fn(),
    onRecharge: jest.fn(),
    onRefreshBalance: jest.fn(),
  };

  let backHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    backHandler = null;
    jest.spyOn(BackHandler, 'addEventListener').mockImplementation((event, handler) => {
      if (event === 'hardwareBackPress') {
        backHandler = handler;
      }
      return { remove: jest.fn() };
    });
  });

  it('renders GameContainer in bottom-sheet mode with header controls and coin balance', () => {
    let root;
    act(() => {
      root = renderer.create(<GameContainer {...defaultProps} />);
    });

    const instance = root.root;

    // Check game title
    const titleText = instance.findByProps({ children: 'Greedy King' });
    expect(titleText).toBeDefined();

    // Check coins balance formatted
    const balanceText = instance.findByProps({ children: '25,400' });
    expect(balanceText).toBeDefined();

    // Check Recharge button
    const rechargeBtn = instance.findByProps({ accessibilityLabel: 'Recharge Coins' });
    expect(rechargeBtn).toBeDefined();
    act(() => {
      rechargeBtn.props.onPress();
    });
    expect(defaultProps.onRecharge).toHaveBeenCalledTimes(1);

    // Check Minimize button
    const minimizeBtn = instance.findByProps({ accessibilityLabel: 'Minimize Game' });
    expect(minimizeBtn).toBeDefined();
    act(() => {
      minimizeBtn.props.onPress();
    });
    expect(defaultProps.onMinimize).toHaveBeenCalledTimes(1);

    // Check Close button
    const closeBtn = instance.findByProps({ accessibilityLabel: 'Close Game' });
    expect(closeBtn).toBeDefined();
    act(() => {
      closeBtn.props.onPress();
    });
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);

    // Check Fullscreen toggle
    const fullscreenBtn = instance.findByProps({ accessibilityLabel: 'Enter Fullscreen' });
    expect(fullscreenBtn).toBeDefined();
    act(() => {
      fullscreenBtn.props.onPress();
    });
    expect(defaultProps.onToggleFullscreen).toHaveBeenCalledTimes(1);

    act(() => {
      root.unmount();
    });
  });

  it('handles hardware back button to minimize in bottom-sheet mode', () => {
    let root;
    act(() => {
      root = renderer.create(<GameContainer {...defaultProps} isFullscreen={false} />);
    });

    // Simulate Android hardware back press
    act(() => {
      if (backHandler) {
        backHandler();
      }
    });

    expect(defaultProps.onMinimize).toHaveBeenCalled();

    act(() => {
      root.unmount();
    });
  });

  it('handles hardware back button to exit fullscreen if currently fullscreen', () => {
    let root;
    act(() => {
      root = renderer.create(<GameContainer {...defaultProps} isFullscreen={true} />);
    });

    act(() => {
      if (backHandler) {
        backHandler();
      }
    });

    expect(defaultProps.onToggleFullscreen).toHaveBeenCalled();

    act(() => {
      root.unmount();
    });
  });
});
