import React, { useMemo, useState } from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  View,
  requireNativeComponent,
} from 'react-native';
import { SvgUri } from 'react-native-svg';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const NativeSvgaPlayer = Platform.OS === 'android'
  ? requireNativeComponent('SvgaPlayerView')
  : null;

const inferType = (uri, explicitType) => {
  const cleanUri = String(uri || '').split('?')[0].toLowerCase();
  if (cleanUri.endsWith('.svga')) return 'svga';
  if (cleanUri.endsWith('.svg')) return 'svg';
  if (cleanUri.endsWith('.gif')) return 'gif';
  if (cleanUri.endsWith('.webp')) return 'webp';
  if (explicitType) return String(explicitType).toLowerCase();
  return 'image';
};

const GiftMedia = ({
  source,
  mediaType,
  style,
  resizeMode = 'contain',
  fallbackSource,
}) => {
  const [failed, setFailed] = useState(false);
  const type = useMemo(() => inferType(source, mediaType), [source, mediaType]);
  const flattenedStyle = StyleSheet.flatten(style) || {};
  const width = flattenedStyle.width || '100%';
  const height = flattenedStyle.height || '100%';

  if (!source || failed) {
    if (fallbackSource) {
      return <Image source={fallbackSource} style={style} resizeMode={resizeMode} />;
    }
    return (
      <View style={[styles.fallback, style]}>
        <Icon name="gift-outline" size={32} color="#FFD76A" />
      </View>
    );
  }

  if (type === 'svga' && NativeSvgaPlayer) {
    return <NativeSvgaPlayer source={source} style={style} />;
  }

  if (type === 'svg') {
    return (
      <SvgUri
        uri={source}
        width={width}
        height={height}
        onError={() => setFailed(true)}
      />
    );
  }

  // Fresco dependencies enable animated GIF and animated WebP playback on
  // Android; static PNG/JPEG/WebP uses the same component.
  return (
    <Image
      source={{ uri: source }}
      style={style}
      resizeMode={resizeMode}
      onError={() => setFailed(true)}
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
