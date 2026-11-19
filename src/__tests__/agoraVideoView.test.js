import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Platform } from 'react-native';
import AgoraVideoView from '../components/live/AgoraVideoView';
import { ARManager } from '../features/YaroAR/core/ARManager';

jest.mock('react-native-agora', () => ({
  RtcSurfaceView: 'RtcSurfaceView',
  RtcTextureView: 'RtcTextureView',
}));

test.each([['android', 'RtcTextureView'], ['ios', 'RtcSurfaceView']])(
  '%s mounts its supported Agora renderer with the selected source', async (platform, view) => {
    const previous = Platform.OS;
    Platform.OS = platform;
    let tree;
    try {
      const canvas = { uid: 0, sourceType: 4, mirrorMode: 1 };
      await act(async () => { tree = renderer.create(<AgoraVideoView canvas={canvas} />); });
      expect(tree.root.findByType(view).props.canvas).toEqual(canvas);
    } finally {
      if (tree) await act(async () => tree.unmount());
      Platform.OS = previous;
    }
  },
);

test('Android custom track previews processed native frames and releases the view on stop', async () => {
  const previous = Platform.OS;
  Platform.OS = 'android';
  let tree;
  try {
    ARManager.update({ trackId: 17 });
    await act(async () => {
      tree = renderer.create(<AgoraVideoView canvas={{ uid: 0, sourceType: 4, mirrorMode: 2 }} />);
    });
    expect(tree.toJSON().props).toMatchObject({ trackId: 17, mirror: false });
    expect(tree.root.findAllByType('RtcTextureView')).toHaveLength(0);
    await act(async () => { ARManager.update({ trackId: null }); });
    expect(tree.root.findAllByType('RtcTextureView')).toHaveLength(1);
  } finally {
    if (tree) await act(async () => tree.unmount());
    ARManager.update({ trackId: null });
    Platform.OS = previous;
  }
});
