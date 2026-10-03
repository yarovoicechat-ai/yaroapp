import React from 'react';
import { Platform, View, StyleSheet, Image } from 'react-native';
import { NativeSvgaPlayer as NativeSvga } from './GiftMedia';

/**
 * Universal SVGA / Animated Asset Viewer for YaroApp
 * Plays .svga files using hardware-accelerated SvgaPlayerView on Android,
 * or displays images/gifs if not SVGA.
 */
export default function SvgaView({
  source,
  style,
  loops = 0,
  resizeMode = 'contain',
  fallbackImage,
}) {
  const [failed, setFailed] = React.useState(false);
  const src = String(source || '').trim();

  if (!src || failed) {
    if (fallbackImage) {
      return <Image source={{ uri: fallbackImage }} style={style} resizeMode={resizeMode} />;
    }
    return null;
  }

  const isSvga = /\.svga(?:\?|$)/i.test(src);

  if (isSvga && NativeSvga) {
    return (
      <NativeSvga
        source={src}
        loops={loops}
        style={style}
      />
    );
  }

  return (
    <Image
      source={{ uri: src }}
      style={style}
      resizeMode={resizeMode}
      onError={() => setFailed(true)}
    />
  );
}
