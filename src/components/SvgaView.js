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
  if (/^(?:animations\/|assets\/)/i.test(trimmed)) {
    return `asset://${trimmed.replace(/^assets\//i, '')}`;
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
  const [isFocused, setIsFocused] = React.useState(() => (navigation?.isFocused ? navigation.isFocused() : true));

  React.useEffect(() => {
    if (!navigation?.addListener) {
      setIsFocused(true);
      return;
    }
    setIsFocused(navigation.isFocused ? navigation.isFocused() : true);
    const unsubFocus = navigation.addListener('focus', () => setIsFocused(true));
    const unsubBlur = navigation.addListener('blur', () => setIsFocused(false));
    return () => {
      unsubFocus?.();
      unsubBlur?.();
    };
  }, [navigation]);

  const src = normalizeUrl(source);
  const normalizedFallback = normalizeUrl(fallbackImage);

  React.useEffect(() => {
    setFailed(false);
    setAttempt(0);
  }, [src]);

  if (typeof source === 'number') return <Image source={source} style={style} resizeMode={resizeMode} />;

  if (!src || failed) {
    if (normalizedFallback) {
      return <AssetImage source={{ uri: normalizedFallback }} style={style} resizeMode={resizeMode} />;
    }
    return null;
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
            if (attempt < 2) {
              setAttempt(prev => prev + 1);
            } else {
              setFailed(true);
              onError?.(error);
            }
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
