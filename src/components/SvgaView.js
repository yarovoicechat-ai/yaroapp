import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import GiftMedia, { NativeSvgaPlayer as NativeSvga } from './GiftMedia';

/**
 * Universal SVGA / Animated Asset Viewer for YaroApp
 * Plays .svga files using hardware-accelerated SvgaPlayerView on Android,
 * or displays images/gifs if not SVGA.
 * Automatically manages lifecycle with useIsFocused so animations never freeze or disappear.
 */
export default function SvgaView({
  source,
  style,
  loops = 0,
  resizeMode = 'contain',
  fallbackImage,
}) {
  const [failed, setFailed] = React.useState(false);
  let isFocused = true;
  try {
    isFocused = useIsFocused();
  } catch (_) {
    isFocused = true;
  }
  const src = String(source || '').trim();

  React.useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    if (fallbackImage) {
      return <Image source={{ uri: fallbackImage }} style={style} resizeMode={resizeMode} />;
    }
    return null;
  }

  const isSvga = /\.svga(?:\?|$)/i.test(src);

  if (isSvga && NativeSvga) {
    return (
      <View style={style}>
        {fallbackImage ? (
          <Image
            source={{ uri: fallbackImage }}
            style={StyleSheet.absoluteFillObject}
            resizeMode={resizeMode}
          />
        ) : null}
        {isFocused ? (
          <NativeSvga
            key={`${src}_${isFocused}`}
            source={src}
            loops={loops}
            style={StyleSheet.absoluteFillObject}
          />
        ) : fallbackImage ? (
          <Image
            source={{ uri: fallbackImage }}
            style={[StyleSheet.absoluteFillObject, style]}
            resizeMode={resizeMode}
          />
        ) : null}
      </View>
    );
  }

  return (
    <GiftMedia
      source={src}
      style={style}
      resizeMode={resizeMode}
      fallbackSource={fallbackImage ? { uri: fallbackImage } : undefined}
    />
  );
}
