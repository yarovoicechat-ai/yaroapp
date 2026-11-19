import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { AppState } from 'react-native';
import { ARManager } from '../features/YaroAR/core/ARManager';
import { useARLifecycle } from '../features/YaroAR/hooks/useARSession';

jest.mock('../features/YaroAR/core/ARManager', () => ({
  ARManager: {
    getSnapshot: jest.fn(),
    setForeground: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    update: jest.fn(),
  },
}));

function CameraLifecycle() {
  useARLifecycle();
  return null;
}

let tree;
let onStateChange;
let status;
let remove;

beforeEach(async () => {
  jest.clearAllMocks();
  status = 'running';
  remove = jest.fn();
  ARManager.getSnapshot.mockImplementation(() => ({ status }));
  ARManager.pause.mockImplementation(async () => {
    if (status === 'running') status = 'paused';
  });
  ARManager.resume.mockImplementation(async () => {
    if (status === 'paused') status = 'running';
  });
  jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation((event, handler) => {
      onStateChange = handler;
      return { remove };
    });
  await act(async () => {
    tree = renderer.create(<CameraLifecycle />);
  });
});

afterEach(async () => {
  if (tree) await act(async () => tree.unmount());
  tree = null;
  jest.restoreAllMocks();
});

async function transition(state) {
  await act(async () => onStateChange(state));
}

test('inactive then background preserves the request to resume native capture', async () => {
  await transition('inactive');
  expect(status).toBe('paused');
  await transition('background');
  await transition('active');
  expect(ARManager.resume).toHaveBeenCalledTimes(1);
  expect(status).toBe('running');
  expect(ARManager.setForeground.mock.calls).toEqual([
    [false],
    [false],
    [true],
  ]);
});

test('an idle camera stays idle when the app returns', async () => {
  status = 'idle';
  await transition('inactive');
  await transition('background');
  await transition('active');
  expect(ARManager.resume).not.toHaveBeenCalled();
  expect(status).toBe('idle');
});

test('foreground notifications consume the resume request once', async () => {
  await transition('background');
  await transition('active');
  await transition('active');
  expect(ARManager.resume).toHaveBeenCalledTimes(1);
});

test('lifecycle failures reach the visible session error state', async () => {
  ARManager.pause.mockRejectedValueOnce(new Error('Camera could not pause'));
  await transition('background');
  expect(ARManager.update).toHaveBeenCalledWith({
    error: 'Camera could not pause',
  });
});

test('unmount removes the lifecycle subscription', async () => {
  await act(async () => tree.unmount());
  tree = null;
  expect(remove).toHaveBeenCalledTimes(1);
});
