import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Animated } from 'react-native';
import { getSocket } from '../sockets';
import { useGiftQueue } from '../components/gift/hooks/useGiftQueue';
import { useGiftSocket } from '../components/gift/hooks/useGiftSocket';
import GiftAnimationEngine from '../components/gift/GiftAnimationEngine';

jest.mock('../sockets', () => ({ getSocket: jest.fn() }));
jest.mock('../utils/apiUtil', () => ({ API_BASE_URL: 'https://api.yaroapp.in/api' }));
jest.mock('../components/GiftMedia', () => 'GiftMedia');
jest.mock('react-native-linear-gradient', () => 'Gradient');
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');

let queue;
let tree;
function GiftQueue() {
  queue = useGiftQueue();
  return null;
}
function GiftListener(props) {
  useGiftSocket(props);
  return null;
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
});
afterEach(async () => {
  if (tree) await act(async () => tree.unmount());
  tree = null;
  jest.restoreAllMocks();
  jest.useRealTimers();
});

test('media completion advances the queue and an old completion cannot skip the next gift', async () => {
  await act(async () => {
    tree = renderer.create(<GiftQueue />);
  });
  await act(async () =>
    queue.enqueue({ animationId: 'first', gift: { id: 'rose' } }),
  );
  await act(async () =>
    queue.enqueue({ animationId: 'second', gift: { id: 'car' } }),
  );
  expect(queue.activeAnimation.id).toBe('first');
  await act(async () => queue.completeAnimation('first'));
  expect(queue.activeAnimation.id).toBe('second');
  await act(async () => queue.completeAnimation('first'));
  expect(queue.activeAnimation.id).toBe('second');
  await act(async () => queue.completeAnimation('second'));
  expect(queue.activeAnimation).toBe(null);
});

test('leaving a room clears the animation timeout and pending gifts', async () => {
  const scheduled = jest.spyOn(global, 'setTimeout');
  const cancelled = jest.spyOn(global, 'clearTimeout');
  await act(async () => {
    tree = renderer.create(<GiftQueue />);
  });
  await act(async () =>
    queue.enqueue({ animationId: 'first', gift: { id: 'rose' } }),
  );
  const timerIndex = scheduled.mock.calls.findIndex(([, delay]) => delay === 17200);
  expect(timerIndex).toBeGreaterThanOrEqual(0);
  const timer = scheduled.mock.results[timerIndex].value;
  await act(async () => tree.unmount());
  tree = null;
  expect(cancelled).toHaveBeenCalledWith(timer);
});

test('remote gift retains its playback duration after a slow load and reloads a repeated gift', async () => {
  const start = jest.fn();
  const sequence = jest.spyOn(Animated, 'sequence').mockReturnValue({ start, stop: jest.fn() });
  const complete = jest.fn();
  const gift = { image: 'https://api.yaroapp.in/uploads/bear.gif', name: 'Bear' };
  await act(async () => {
    tree = renderer.create(<GiftAnimationEngine animation={{ id: 'first', gift }} onAnimationComplete={complete} />);
  });
  await act(async () => jest.advanceTimersByTime(6000));
  expect(sequence).not.toHaveBeenCalled();
  expect(complete).not.toHaveBeenCalled();
  await act(async () => tree.root.findByType('GiftMedia').props.onLoad());
  expect(sequence).toHaveBeenCalledTimes(1);
  await act(async () => start.mock.calls[0][0]({ finished: true }));
  expect(complete).toHaveBeenCalledWith('first');
  await act(async () => {
    tree.update(<GiftAnimationEngine animation={{ id: 'second', gift }} onAnimationComplete={complete} />);
  });
  expect(sequence).toHaveBeenCalledTimes(1);
  await act(async () => tree.root.findByType('GiftMedia').props.onLoad());
  expect(sequence).toHaveBeenCalledTimes(2);
});

test('unloadable gift releases the queue after a bounded load wait', async () => {
  const complete = jest.fn();
  await act(async () => {
    tree = renderer.create(<GiftAnimationEngine animation={{ id: 'failed', gift: { image: 'https://api.yaroapp.in/uploads/missing.gif' } }} onAnimationComplete={complete} />);
  });
  await act(async () => jest.advanceTimersByTime(11999));
  expect(complete).not.toHaveBeenCalled();
  await act(async () => jest.advanceTimersByTime(1));
  expect(complete).toHaveBeenCalledWith('failed');
});

test('gift listeners preserve other subscribers and match legacy room aliases', async () => {
  const listeners = new Map();
  const socket = {
    connected: true,
    emit: jest.fn(),
    on: jest.fn((event, callback) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event).add(callback);
    }),
    off: jest.fn((event, callback) => listeners.get(event)?.delete(callback)),
  };
  const otherSubscriber = jest.fn();
  socket.on('gift:animation', otherSubscriber);
  getSocket.mockReturnValue(socket);
  const received = jest.fn();
  await act(async () => {
    tree = renderer.create(
      <GiftListener
        roomId="10000123"
        currentUserId="viewer"
        onGiftAnimation={received}
      />,
    );
  });
  const deliver = payload =>
    listeners.get('gift:animation').forEach(callback => callback(payload));
  await act(async () =>
    deliver({
      roomId: '0000000123',
      animationId: 'first',
      sender: { id: 'sender' },
    }),
  );
  expect(received).toHaveBeenCalledTimes(1);
  await act(async () =>
    deliver({
      roomId: 'another-room',
      animationId: 'second',
      sender: { id: 'sender' },
    }),
  );
  expect(received).toHaveBeenCalledTimes(1);
  await act(async () => tree.unmount());
  tree = null;
  expect(listeners.get('gift:animation')).toEqual(new Set([otherSubscriber]));
  expect(
    socket.off.mock.calls.every(
      ([, callback]) => typeof callback === 'function',
    ),
  ).toBe(true);
});
