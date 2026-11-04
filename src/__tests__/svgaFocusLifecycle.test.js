import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { NavigationContext } from '@react-navigation/native';
import SvgaView from '../components/SvgaView';
jest.mock('@react-navigation/native', () => ({ NavigationContext: require('react').createContext(undefined) }));
jest.mock('../components/GiftMedia', () => ({ __esModule: true, default: 'GiftMedia', NativeSvgaPlayer: 'NativeSvga' }));

test('asset can gain navigation context without changing hook order or crashing', async () => {
 let tree; let focused = false; const listeners = {};
 const nav = { isFocused: () => focused, addListener: (name, callback) => { listeners[name] = callback; return jest.fn(); } };
 const render = value => <NavigationContext.Provider value={value}><SvgaView source="https://example.com/frame.svga" /></NavigationContext.Provider>;
 await act(async () => { tree = renderer.create(render(undefined)); });
 expect(tree.root.findByType('NativeSvga').props.autoPlay).toBe(true);
 await act(async () => { tree.update(render(nav)); });
 expect(tree.root.findByType('NativeSvga').props.autoPlay).toBe(false);
 await act(async () => { focused = true; listeners.focus(); });
 expect(tree.root.findByType('NativeSvga').props.autoPlay).toBe(true);
 await act(async () => tree.unmount());
});
