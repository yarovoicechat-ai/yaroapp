import React from 'react';
import renderer, { act } from 'react-test-renderer';
import LiveGamesModal, { LIVE_GAMES_LIST } from '../components/live/LiveGamesModal';
import LiveRoomGameView from '../components/live/LiveRoomGameView';

describe('Live Room Games System', () => {
  it('contains all 8 live games in catalog list including greedy-king and food-game', () => {
    expect(LIVE_GAMES_LIST.length).toBe(8);
    expect(LIVE_GAMES_LIST.map(g => g.id)).toEqual([
      'greedy-king',
      'food-game',
      'greedy-baby',
      'lucky-wheel',
      'teen-patti',
      'lucky-7',
      'crash',
      'ludo',
    ]);
  });

  it('renders LiveGamesModal properly', () => {
    const onSelectGame = jest.fn();
    const onClose = jest.fn();

    let root;
    act(() => {
      root = renderer.create(
        <LiveGamesModal
          visible={true}
          onClose={onClose}
          onSelectGame={onSelectGame}
          coinBalance={15000}
        />
      );
    });

    expect(root).toBeTruthy();

    act(() => {
      root.unmount();
    });
  });

  it('renders LiveRoomGameView and interacts with chips and minimize', () => {
    const onClose = jest.fn();
    const onMinimize = jest.fn();
    const onUpdateCoinBalance = jest.fn();

    let root;
    act(() => {
      root = renderer.create(
        <LiveRoomGameView
          game={{ id: 'food-game', title: 'Food Game' }}
          onClose={onClose}
          onMinimize={onMinimize}
          coinBalance={10000}
          onUpdateCoinBalance={onUpdateCoinBalance}
        />
      );
    });

    const instance = root.root;
    const minimizeBtn = instance.findByProps({ accessibilityLabel: 'Minimize Game' });
    const closeBtn = instance.findByProps({ accessibilityLabel: 'Close Game' });
    const clearBtn = instance.findByProps({ accessibilityLabel: 'Clear Bets' });

    expect(minimizeBtn).toBeTruthy();
    expect(closeBtn).toBeTruthy();
    expect(clearBtn).toBeTruthy();

    act(() => {
      minimizeBtn.props.onPress();
    });
    expect(onMinimize).toHaveBeenCalled();

    act(() => {
      closeBtn.props.onPress();
    });
    expect(onClose).toHaveBeenCalled();

    act(() => {
      root.unmount();
    });
  });
});
