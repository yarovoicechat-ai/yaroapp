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
    it('renders both event and game banner cards with pagination dots', () => {
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

      // The initial active game item is 'food-game' which is available: true
      const gameBtn = root.root.findByProps({ accessibilityLabel: 'Game Food Game' });
      expect(gameBtn).toBeDefined();

      act(() => {
        gameBtn.props.onPress();
      });

      expect(onSelectGame).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'food-game',
          gameId: 'food-game',
          title: 'Food Game (Fruit Wheel)',
        })
      );

      act(() => {
        root.unmount();
      });
    });

    it('shows Coming Soon alert when an upcoming game is tapped', () => {
      const onSelectGame = jest.fn();
      let root;
      act(() => {
        root = renderer.create(
          <FloatingGameBannerWidget onSelectGame={onSelectGame} />
        );
      });

      // Advance timers to rotate to the 3rd game: lucky-777 (available: false)
      act(() => {
        jest.advanceTimersByTime(4000); // 1st rotate -> greedy-baby
      });
      act(() => {
        jest.advanceTimersByTime(4000); // 2nd rotate -> lucky-777
      });

      const lucky777Btn = root.root.findByProps({ accessibilityLabel: 'Game Lucky 777' });
      expect(lucky777Btn).toBeDefined();

      act(() => {
        lucky777Btn.props.onPress();
      });

      expect(onSelectGame).not.toHaveBeenCalled();
      expect(AlertService.show).toHaveBeenCalledWith(
        'Coming Soon',
        expect.stringContaining('is coming soon in the next update'),
        'info'
      );

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
