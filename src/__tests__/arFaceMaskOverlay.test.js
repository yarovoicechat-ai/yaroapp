import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { View } from 'react-native';

jest.mock('react-native-svg', () => {
  const React = require('react');
  const { View } = require('react-native');
  const createMock = name => props => React.createElement(View, { ...props, testID: name }, props.children);
  return {
    __esModule: true,
    default: createMock('Svg'),
    Svg: createMock('Svg'),
    Path: createMock('Path'),
    Circle: createMock('Circle'),
    Ellipse: createMock('Ellipse'),
    Rect: createMock('Rect'),
    Polygon: createMock('Polygon'),
    Line: createMock('Line'),
    Defs: createMock('Defs'),
    LinearGradient: createMock('LinearGradient'),
    RadialGradient: createMock('RadialGradient'),
    Stop: createMock('Stop'),
    G: createMock('G'),
    SvgXml: createMock('SvgXml'),
  };
});

import ARFaceMaskOverlay from '../features/YaroAR/components/ARFaceMaskOverlay';
import { getEffectThumbnail } from '../features/YaroAR/effects/registry/effectThumbnails';
import { effectRegistry } from '../features/YaroAR/effects/registry/effectRegistry';

describe('ARFaceMaskOverlay and Thumbnails', () => {
  test('returns null for empty or none effectId', () => {
    let treeNull, treeNone, treeOriginal;
    act(() => {
      treeNull = renderer.create(<ARFaceMaskOverlay effectId={null} />).toJSON();
      treeNone = renderer.create(<ARFaceMaskOverlay effectId="none" />).toJSON();
      treeOriginal = renderer.create(<ARFaceMaskOverlay effectId="original" />).toJSON();
    });
    expect(treeNull).toBeNull();
    expect(treeNone).toBeNull();
    expect(treeOriginal).toBeNull();
  });

  test('renders Snapchat Puppy (Dog) filter overlay', () => {
    let comp;
    act(() => {
      comp = renderer.create(<ARFaceMaskOverlay effectId="puppy" intensity={0.9} />);
    });
    expect(comp.root).toBeDefined();
    expect(comp.root.findAllByType(View).length).toBeGreaterThan(0);
  });

  test('renders Snapchat Kitty (Cat) filter overlay with whiskers', () => {
    let comp;
    act(() => {
      comp = renderer.create(<ARFaceMaskOverlay effectId="kitty" intensity={0.8} />);
    });
    expect(comp.root).toBeDefined();
    expect(comp.root.findAllByType(View).length).toBeGreaterThan(0);
  });

  test('renders Bunny filter overlay', () => {
    let comp;
    act(() => {
      comp = renderer.create(<ARFaceMaskOverlay effectId="bunny" intensity={0.8} />);
    });
    expect(comp.root).toBeDefined();
    expect(comp.root.findAllByType(View).length).toBeGreaterThan(0);
  });

  test('renders Royal Crown filter overlay', () => {
    let comp;
    act(() => {
      comp = renderer.create(<ARFaceMaskOverlay effectId="royal-crown" intensity={1.0} />);
    });
    expect(comp.root).toBeDefined();
    expect(comp.root.findAllByType(View).length).toBeGreaterThan(0);
  });

  test('renders Heart Glasses filter overlay', () => {
    let comp;
    act(() => {
      comp = renderer.create(<ARFaceMaskOverlay effectId="heart-glasses" intensity={0.7} />);
    });
    expect(comp.root).toBeDefined();
    expect(comp.root.findAllByType(View).length).toBeGreaterThan(0);
  });

  test('renders Cry Baby filter overlay with streaming tears', () => {
    let comp;
    act(() => {
      comp = renderer.create(<ARFaceMaskOverlay effectId="cry-baby" intensity={0.85} />);
    });
    expect(comp.root).toBeDefined();
    expect(comp.root.findAllByType(View).length).toBeGreaterThan(0);
  });

  test('renders Flame Face filter overlay', () => {
    let comp;
    act(() => {
      comp = renderer.create(<ARFaceMaskOverlay effectId="flame-face" intensity={0.8} />);
    });
    expect(comp.root).toBeDefined();
    expect(comp.root.findAllByType(View).length).toBeGreaterThan(0);
  });

  test('renders Cyber Headset filter overlay', () => {
    let comp;
    act(() => {
      comp = renderer.create(<ARFaceMaskOverlay effectId="cyber-headset" intensity={0.8} />);
    });
    expect(comp.root).toBeDefined();
    expect(comp.root.findAllByType(View).length).toBeGreaterThan(0);
  });

  test('renders Beauty presets (Rosy Cheeks, Lip Tint, Soft Makeup, Yaro Beauty)', () => {
    let rosy, lip, makeup, yaro;
    act(() => {
      rosy = renderer.create(<ARFaceMaskOverlay effectId="rosy-cheeks" intensity={0.6} />);
      lip = renderer.create(<ARFaceMaskOverlay effectId="lip-tint" intensity={0.7} />);
      makeup = renderer.create(<ARFaceMaskOverlay effectId="soft-makeup" intensity={0.8} />);
      yaro = renderer.create(<ARFaceMaskOverlay effectId="yaro-beauty" intensity={0.9} />);
    });
    expect(rosy.root.findAllByType(View).length).toBeGreaterThan(0);
    expect(lip.root.findAllByType(View).length).toBeGreaterThan(0);
    expect(makeup.root.findAllByType(View).length).toBeGreaterThan(0);
    expect(yaro.root.findAllByType(View).length).toBeGreaterThan(0);
  });

  test('renders in compact mode for split PK battle and multi-guest grids', () => {
    let comp;
    act(() => {
      comp = renderer.create(<ARFaceMaskOverlay effectId="puppy" intensity={0.8} compact />);
    });
    expect(comp.root).toBeDefined();
    expect(comp.root.findAllByType(View).length).toBeGreaterThan(0);
  });

  test('getEffectThumbnail returns unique, distinctive SVGs for effects', () => {
    const puppySvg = getEffectThumbnail('puppy');
    const kittySvg = getEffectThumbnail('kitty');
    const bunnySvg = getEffectThumbnail('bunny');
    const crownSvg = getEffectThumbnail('royal-crown');
    const glassesSvg = getEffectThumbnail('heart-glasses');
    const tearsSvg = getEffectThumbnail('cry-baby');

    expect(puppySvg).toBeDefined();
    expect(kittySvg).toBeDefined();
    expect(bunnySvg).toBeDefined();
    expect(crownSvg).toBeDefined();
    expect(glassesSvg).toBeDefined();
    expect(tearsSvg).toBeDefined();

    // Verify all are completely distinct
    expect(puppySvg).not.toEqual(kittySvg);
    expect(kittySvg).not.toEqual(bunnySvg);
    expect(bunnySvg).not.toEqual(crownSvg);
    expect(crownSvg).not.toEqual(glassesSvg);
    expect(glassesSvg).not.toEqual(tearsSvg);

    // Verify they contain their respective labels/features
    expect(puppySvg).toContain('Puppy');
    expect(kittySvg).toContain('Kitty');
    expect(bunnySvg).toContain('Bunny');
    expect(crownSvg).toContain('Royal Crown');
    expect(glassesSvg).toContain('Heart Glasses');
    expect(tearsSvg).toContain('Cry Baby');
  });

  test('beauty presets have distinct thumbnails', () => {
    const yaroBeauty = getEffectThumbnail('yaro-beauty');
    const rosyCheeks = getEffectThumbnail('rosy-cheeks');
    const lipTint = getEffectThumbnail('lip-tint');
    const brightEyes = getEffectThumbnail('bright-eyes');

    expect(yaroBeauty).toBeDefined();
    expect(rosyCheeks).toBeDefined();
    expect(lipTint).toBeDefined();
    expect(brightEyes).toBeDefined();

    expect(rosyCheeks).not.toEqual(lipTint);
    expect(lipTint).not.toEqual(brightEyes);
    expect(yaroBeauty).not.toEqual(rosyCheeks);
  });
});
