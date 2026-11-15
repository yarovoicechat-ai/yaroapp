import React from 'react';
import { View, StyleSheet, Image, Pressable, Text } from 'react-native';
import { NavigationContext } from '@react-navigation/native';
import GiftMedia, { NativeSvgaPlayer as NativeSvga } from './GiftMedia';
import AssetImage from './AssetImage';
import { resolveMediaUrl } from '../utils/assetUrl';

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
  return resolveMediaUrl(trimmed);
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
  const [attempt, setAttempt] = React.useState(0);
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
    setAttempt(0);
  }, [src]);
  React.useEffect(() => {
    if (!failed || attempt >= 2) return undefined;
    const timer = setTimeout(() => { setAttempt(value => value + 1); setFailed(false); }, 1000 * (attempt + 1));
    return () => clearTimeout(timer);
  }, [failed, attempt]);

  if (typeof source === 'number') return <Image source={source} style={style} resizeMode={resizeMode} />;

  if (!src || failed) {
    if (normalizedFallback) {
      return <AssetImage source={{ uri: normalizedFallback }} style={style} resizeMode={resizeMode} />;
    }
    return src ? <Pressable style={[style, { alignItems: 'center', justifyContent: 'center' }]} accessibilityLabel="Retry animation loading"
      onPress={() => { setAttempt(value => value + 1); setFailed(false); }}><Text style={{ color: '#94A3B8', fontSize: 22 }}>↻</Text></Pressable> : null;
  }

  const isSvga = /\.svga(?:[?#]|$)/i.test(src);

  if (isSvga && NativeSvga) {
    return (
      <View style={[{ backgroundColor: 'transparent' }, style]}>
        {failed && normalizedFallback ? (
          <Image
            source={{ uri: normalizedFallback }}
            style={StyleSheet.absoluteFillObject}
            resizeMode={resizeMode}
          />
        ) : null}
        <NativeSvga
            key={`${src}:${attempt}`}
            source={src}
            loops={loops}
            autoPlay={autoPlay && isFocused}
            scaleMode={scaleMode || (resizeMode === 'cover' ? 'aspectFill' : resizeMode === 'stretch' ? 'fill' : 'aspectFit')}
            resizeMode={resizeMode}
            muteBuiltInAudio={muteBuiltInAudio}
            onPlaybackFinished={onFinish}
            onPlaybackError={(error) => {
              setFailed(true);
              onError?.(error);
            }}
            style={[StyleSheet.absoluteFillObject, { backgroundColor: 'transparent' }]}
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
