import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Platform,
  StyleSheet,
  Pressable,
  Text,
  requireNativeComponent,
} from 'react-native';
import { SvgUri } from 'react-native-svg';
import Video from 'react-native-video';
import { SvgaPlayer } from '@dasimems/react-native-svga';
import AssetImage from './AssetImage';

export const NativeSvgaPlayer = Platform.OS === 'android'
  ? requireNativeComponent('SvgaPlayerView')
  : null;

const inferType = (uri, explicitType) => {
  const cleanUri = String(uri || '').split('?')[0].toLowerCase();
  if (cleanUri.endsWith('.svga')) return 'svga';
  if (cleanUri.endsWith('.svg')) return 'svg';
  if (cleanUri.endsWith('.gif')) return 'gif';
  if (cleanUri.endsWith('.webp')) return 'webp';
  if (/\.(?:mp4|m4v|mov)$/.test(cleanUri)) return 'video';
  if (explicitType) return String(explicitType).toLowerCase();
  return 'image';
};

const GiftMedia = ({
  source,
  mediaType,
  style,
  resizeMode = 'contain',
  fallbackSource,
  repeat = true,
  muted = true,
  onFinish,
  onLoad,
  onError,
}) => {
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => { setFailed(false); setAttempt(0); }, [source]);
  useEffect(() => {
    if (!failed || attempt >= 2) return undefined;
    const timer = setTimeout(() => { setAttempt(value => value + 1); setFailed(false); }, 1000 * (attempt + 1));
    return () => clearTimeout(timer);
  }, [failed, attempt]);
  const fail = useCallback(error => { setFailed(true); onError?.(error); }, [onError]);
  const type = useMemo(() => inferType(source, mediaType), [source, mediaType]);
  const flattenedStyle = StyleSheet.flatten(style) || {};
  const width = flattenedStyle.width || '100%';
  const height = flattenedStyle.height || '100%';

  if (!source || failed) {
    if (fallbackSource) {
      return <AssetImage source={fallbackSource} style={style} resizeMode={resizeMode} onLoad={onLoad} />;
    }
    return (
      <Pressable style={[styles.fallback, style]} accessibilityLabel="Retry media loading"
        onPress={() => { setAttempt(value => value + 1); setFailed(false); }}>
        <Text style={{ color: '#94A3B8', fontSize: 22 }}>↻</Text>
      </Pressable>
    );
  }

  if (type === 'svga') {
    if (NativeSvgaPlayer) {
      return (
        <NativeSvgaPlayer
          key={`${source}:${attempt}`}
          source={source}
          style={style}
          loops={repeat ? 0 : 1}
          autoPlay
          scaleMode={resizeMode === 'contain' ? 'aspectFit' : 'aspectFill'}
          onPlaybackFinished={onFinish}
          onPlaybackReady={onLoad}
          onPlaybackError={fail}
        />
      );
    }
    return (
      <SvgaPlayer
        key={`${source}:${attempt}`}
        source={source}
        style={style}
        loops={repeat ? 0 : 1}
        autoPlay
        muteBuiltInAudio={muted}
        scaleMode={resizeMode === 'contain' ? 'aspectFit' : 'aspectFill'}
        onFinish={onFinish}
        onStart={onLoad}
        onError={fail}
      />
    );
  }

  if (type === 'svg') {
    return (
      <SvgUri
        key={`${source}:${attempt}`}
        uri={source}
        width={width}
        height={height}
        onLoad={onLoad}
        onError={fail}
      />
    );
  }

  if (type === 'video' || type === 'mp4') {
    return (
      <Video
        key={`${source}:${attempt}`}
        source={{ uri: source }}
        style={style}
        resizeMode={resizeMode}
        repeat={repeat}
        muted={muted}
        paused={false}
        playInBackground={false}
        playWhenInactive={false}
        ignoreSilentSwitch="ignore"
        onLoad={onLoad}
        onError={fail}
      />
    );
  }

  // Fresco dependencies enable animated GIF and animated WebP playback on
  // Android; static PNG/JPEG/WebP uses the same component.
  return (
    <AssetImage
      source={{ uri: source }}
      style={style}
      resizeMode={resizeMode}
      onLoad={onLoad}
      onError={onError}
    />
  );
};

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default GiftMedia;
