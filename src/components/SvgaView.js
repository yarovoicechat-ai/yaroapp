import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import GiftMedia, { NativeSvgaPlayer as NativeSvga } from './GiftMedia';

const normalizeUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^(?:https?:\/\/|file:\/\/|content:\/\/|data:|asset:\/\/)/i.test(trimmed)) {
    return trimmed;
  }
  const clean = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `https://api.yaroapp.in${clean}`;
};

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
  autoPlay = true,
  scaleMode,
  onFinish,
  onError,
}) {
  const [failed, setFailed] = React.useState(false);
  const isFocused = useIsFocused();
  const src = normalizeUrl(source);
  const normalizedFallback = normalizeUrl(fallbackImage);

  React.useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    if (normalizedFallback) {
      return <Image source={{ uri: normalizedFallback }} style={style} resizeMode={resizeMode} />;
    }
    return null;
  }

  const isSvga = /\.svga(?:[?#]|$)/i.test(src);

  if (isSvga && NativeSvga) {
    return (
      <View style={style}>
        {normalizedFallback ? (
          <Image
            source={{ uri: normalizedFallback }}
            style={StyleSheet.absoluteFillObject}
            resizeMode={resizeMode}
          />
        ) : null}
        {isFocused ? (
          <NativeSvga
            key={`${src}_${isFocused}`}
            source={src}
            loops={loops}
            autoPlay={autoPlay}
            scaleMode={scaleMode || (resizeMode === 'cover' ? 'aspectFill' : resizeMode === 'stretch' ? 'fill' : 'aspectFit')}
            onPlaybackFinished={onFinish}
            onPlaybackError={(error) => {
              setFailed(true);
              onError?.(error);
            }}
            style={StyleSheet.absoluteFillObject}
          />
        ) : normalizedFallback ? (
          <Image
            source={{ uri: normalizedFallback }}
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
      repeat={loops === 0}
      onFinish={onFinish}
      onError={onError}
      style={style}
      resizeMode={resizeMode}
      fallbackSource={normalizedFallback ? { uri: normalizedFallback } : undefined}
    />
  );
}
