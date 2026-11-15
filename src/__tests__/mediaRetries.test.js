import React from 'react';
import renderer, { act } from 'react-test-renderer';
import GiftMedia from '../components/GiftMedia';
jest.mock('react-native-svg', () => ({ SvgUri: 'AssetSvg' }));
jest.mock('react-native-video', () => 'AssetVideo');
jest.mock('@dasimems/react-native-svga', () => ({ SvgaPlayer: 'AssetSvga' }));

test.each([
  ['https://api.yaroapp.in/uploads/actual.svg', 'AssetSvg', 'uri'],
  ['https://api.yaroapp.in/uploads/actual.mp4', 'AssetVideo', 'source'],
])('failed media %s retries the same original asset', async (url, type, field) => {
  jest.useFakeTimers(); let tree;
  try {
    await act(async () => { tree = renderer.create(<GiftMedia source={url} style={{ width: 80, height: 80 }} />); });
    await act(async () => tree.root.findByType(type).props.onError({}));
    expect(JSON.stringify(tree.toJSON())).toContain('Retry media loading');
    await act(async () => jest.advanceTimersByTime(1000));
    const source = tree.root.findByType(type).props[field];
    expect(typeof source === 'string' ? source : source.uri).toBe(url);
  } finally { if (tree) await act(async () => tree.unmount()); jest.useRealTimers(); }
});
