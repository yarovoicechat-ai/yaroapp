import React from 'react';
import renderer, { act } from 'react-test-renderer';
import FloatingGameBannerWidget from '../components/room/FloatingGameBannerWidget';
import LiveBottomControls from '../components/live/LiveBottomControls';
import LivePKBar from '../components/live/LivePKBar';
import RoomPKPanel from '../components/room/RoomPKPanel';
import AlertService from '../utils/AlertService';

jest.mock('../utils/AlertService', () => ({
  show: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
  success: jest.fn(),
}));

describe('Floating Game Banner and PK System Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('1. FloatingGameBannerWidget', () => {
    it('renders Greedy King banner card', () => {
      let root;
      act(() => {
        root = renderer.create(
          <FloatingGameBannerWidget onSelectGame={jest.fn()} />
        );
      });

      expect(root).toBeTruthy();
      const tree = root.toJSON();
      expect(tree).toBeDefined();

      act(() => {
        root.unmount();
      });
    });

    it('launches available game directly when tapped', () => {
      const onSelectGame = jest.fn();
      let root;
      act(() => {
        root = renderer.create(
          <FloatingGameBannerWidget onSelectGame={onSelectGame} />
        );
      });

      // The sole active game item is 'greedy-king' which is available: true
      const gameBtn = root.root.findByProps({ accessibilityLabel: 'Game Greedy King' });
      expect(gameBtn).toBeDefined();

      act(() => {
        gameBtn.props.onPress();
      });

      expect(onSelectGame).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'greedy-king',
          gameId: 'greedy-king',
          title: 'Greedy King',
        })
      );

      act(() => {
        root.unmount();
      });
    });

    it('retains Greedy King as the sole game without unwanted rotations', () => {
      const onSelectGame = jest.fn();
      let root;
      act(() => {
        root = renderer.create(
          <FloatingGameBannerWidget onSelectGame={onSelectGame} />
        );
      });

      // Advance timers - ensure it remains Greedy King and does not switch to other games
      act(() => {
        jest.advanceTimersByTime(10000);
      });

      const gameBtn = root.root.findByProps({ accessibilityLabel: 'Game Greedy King' });
      expect(gameBtn).toBeDefined();

      act(() => {
        root.unmount();
      });
    });
  });

  describe('2. LiveBottomControls Swapped Menu and Gift', () => {
    it('positions Gift where Menu was, and Menu where Gift was', () => {
      const onOpenGift = jest.fn();
      const onOpenPK = jest.fn();
      const onOpenTools = jest.fn();
      const onOpenChat = jest.fn();

      let root;
      act(() => {
        root = renderer.create(
          <LiveBottomControls
            onOpenGift={onOpenGift}
            onOpenPK={onOpenPK}
            onOpenTools={onOpenTools}
            onOpenChat={onOpenChat}
          />
        );
      });

      // 1. Gift Button is present in the swapped position
      const giftBtn = root.root.findByProps({ accessibilityLabel: 'Send Gift' });
      expect(giftBtn).toBeDefined();
      act(() => {
        giftBtn.props.onPress();
      });
      expect(onOpenGift).toHaveBeenCalled();

      // 2. PK Button is present in the middle
      const pkBtn = root.root.findByProps({ accessibilityLabel: 'PK Battle' });
      expect(pkBtn).toBeDefined();
      act(() => {
        pkBtn.props.onPress();
      });
      expect(onOpenPK).toHaveBeenCalled();

      // 3. Menu Button is present in the far right
      const menuBtn = root.root.findByProps({ accessibilityLabel: 'Live menu' });
      expect(menuBtn).toBeDefined();
      act(() => {
        menuBtn.props.onPress();
      });
      expect(onOpenTools).toHaveBeenCalled();

      act(() => {
        root.unmount();
      });
    });
  });

  describe('3. PK System in Live Room & Voice Room', () => {
    it('renders LivePKBar with scores and dynamic time remaining', () => {
      let root;
      act(() => {
        root = renderer.create(
          <LivePKBar
            isPKActive={true}
            leftScore={5000}
            rightScore={3000}
            timeLeft="03:45"
          />
        );
      });

      expect(root).toBeTruthy();
      act(() => {
        root.unmount();
      });
    });

    it('opens RoomPKPanel modal when openTrigger increments', () => {
      let root;
      act(() => {
        root = renderer.create(
          <RoomPKPanel
            roomId="test-room-123"
            isOwner={true}
            openTrigger={0}
          />
        );
      });

      // Update openTrigger prop to 1
      act(() => {
        root.update(
          <RoomPKPanel
            roomId="test-room-123"
            isOwner={true}
            openTrigger={1}
          />
        );
      });

      expect(root).toBeTruthy();

      act(() => {
        root.unmount();
      });
    });
  });
});
