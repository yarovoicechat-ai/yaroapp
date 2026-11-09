import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { NavigationContext } from '@react-navigation/native';
import GiftMedia, { NativeSvgaPlayer as NativeSvga } from './GiftMedia';

const normalizeUrl = (url) => {
  if (!url) return '';
  if (typeof url === 'number') {
    const resolved = Image.resolveAssetSource(url);
    return resolved?.uri || '';
  }
  if (typeof url !== 'string') {
    if (typeof url === 'object' && url.uri) {
      return normalizeUrl(url.uri);
    }
    return '';
  }
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^(?:https?:\/\/|file:\/\/|content:\/\/|data:|asset:\/\/)/i.test(trimmed)) {
    return trimmed;
  }
  if (trimmed.toLowerCase().endsWith('.svga') && !trimmed.includes('://')) {
    return `asset://${trimmed.replace(/^\/+/, '')}`;
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
  muteBuiltInAudio = false,
  onFinish,
  onError,
}) {
  const [failed, setFailed] = React.useState(false);
  const navigation = React.useContext(NavigationContext);
  const subscribeToFocus = React.useCallback(callback => {
    if (!navigation) return () => {};
    const focus = navigation.addListener('focus', callback);
    const blur = navigation.addListener('blur', callback);
    return () => { focus(); blur(); };
  }, [navigation]);
  const readFocus = React.useCallback(() => navigation?.isFocused() ?? true, [navigation]);
  const isFocused = React.useSyncExternalStore(subscribeToFocus, readFocus, readFocus);
  const src = normalizeUrl(source);
  const normalizedFallback = normalizeUrl(fallbackImage);

  React.useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || (failed && normalizedFallback)) {
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
        <NativeSvga
            key={src}
            source={src}
            loops={loops}
            autoPlay={autoPlay && isFocused}
            scaleMode={scaleMode || (resizeMode === 'cover' ? 'aspectFill' : resizeMode === 'stretch' ? 'fill' : 'aspectFit')}
            resizeMode={resizeMode}
            muteBuiltInAudio={muteBuiltInAudio}
            onPlaybackFinished={onFinish}
            onPlaybackError={(error) => {
              if (normalizedFallback) setFailed(true);
              onError?.(error);
            }}
            style={StyleSheet.absoluteFillObject}
          />

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
