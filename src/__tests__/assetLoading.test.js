import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Image } from 'react-native';
import AssetImage from '../components/AssetImage';
import { resolveMediaUrl } from '../utils/assetUrl';
import { getUserAvatar } from '../utils/avatarUtil';
jest.mock('../utils/apiUtil', () => ({ API_BASE_URL: 'https://api.yaroapp.in/api' }));

test('server SVGA and protocol-relative URLs resolve to their real network location', () => {
  expect(resolveMediaUrl('/uploads/store/frame.svga')).toBe('https://api.yaroapp.in/uploads/store/frame.svga');
  expect(resolveMediaUrl('uploads/store/frame.svga')).toBe('https://api.yaroapp.in/uploads/store/frame.svga');
  expect(resolveMediaUrl('asset://bundled.svga')).toBe('asset://bundled.svga');
  expect(resolveMediaUrl('//cdn.example.com/a.png')).toBe('https://cdn.example.com/a.png');
});

test('default/invalid avatar fields do not hide a real profile image', () => {
  expect(getUserAvatar({ avatar: '/uploads/avatars/male_default.webp', image: '/uploads/user-real.jpg' }).uri)
    .toBe('https://api.yaroapp.in/uploads/user-real.jpg');
  expect(getUserAvatar({ avatar: { uri: '/uploads/real.png' } }).uri).toBe('https://api.yaroapp.in/uploads/real.png');
});

test('failed avatar retries the original URL and offers retry instead of showing another avatar', async () => {
  jest.useFakeTimers();
  let tree;
  try {
    await act(async () => { tree = renderer.create(<AssetImage source={{ uri: '/uploads/real.png' }} style={{ width: 54, height: 54 }} />); });
    for (let i = 0; i < 3; i++) {
      await act(async () => tree.root.findByType(Image).props.onError({ nativeEvent: {} }));
      if (i < 2) await act(async () => jest.advanceTimersByTime(800 * (i + 1)));
    }
    expect(tree.root.findByType(Image).props.source.uri).toBe('https://api.yaroapp.in/uploads/real.png');
    expect(JSON.stringify(tree.toJSON())).toContain('Retry image loading');
    await act(async () => tree.root.findByProps({ accessibilityLabel: 'Retry image loading' }).props.onPress());
    await act(async () => tree.root.findByType(Image).props.onLoad({}));
    expect(JSON.stringify(tree.toJSON())).not.toContain('Retry image loading');
    await act(async () => tree.update(<AssetImage source={{ uri: '/uploads/changed.png' }} />));
    expect(tree.root.findByType(Image).props.source.uri).toBe('https://api.yaroapp.in/uploads/changed.png');
  } finally { if (tree) await act(async () => tree.unmount()); jest.useRealTimers(); }
});
