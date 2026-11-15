import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { resolveMediaUrl } from '../utils/assetUrl';

// Retry the requested asset itself. Never replace a failed custom asset with
// an unrelated default avatar or seat.
export default function AssetImage({ source, style, onError, onLoad, ...props }) {
  const uri = resolveMediaUrl(source);
  const [state, setState] = useState({ uri, attempt: 0, status: 'loading' });
  const current = state.uri === uri ? state : { uri, attempt: 0, status: 'loading' };
  useEffect(() => { setState({ uri, attempt: 0, status: 'loading' }); }, [uri]);
  useEffect(() => {
    if (current.status !== 'retry') return undefined;
    const timer = setTimeout(() => setState(previous => previous.uri === uri
      ? { uri, attempt: previous.attempt + 1, status: 'loading' } : previous), 800 * (current.attempt + 1));
    return () => clearTimeout(timer);
  }, [uri, current.status, current.attempt]);
  if (!uri) return <Image {...props} source={source} style={style} onError={onError} onLoad={onLoad} />;
  return (
    <View style={style}>
      <Image {...props} key={`${uri}:${current.attempt}`} source={{ ...(typeof source === 'object' ? source : {}), uri, ...(current.attempt > 0 ? { cache: 'reload' } : {}) }}
        style={[StyleSheet.absoluteFillObject, { borderRadius: StyleSheet.flatten(style)?.borderRadius }]} fadeDuration={0}
        onLoad={event => { setState(previous => previous.uri === uri ? { ...previous, status: 'ready' } : previous); onLoad?.(event); }}
        onError={event => {
          setState(previous => previous.uri === uri ? { ...previous, status: previous.attempt < 2 ? 'retry' : 'error' } : previous);
          onError?.(event);
        }} />
      {current.status === 'loading' || current.status === 'retry' ? (
        <View pointerEvents="none" style={styles.overlay}><ActivityIndicator size="small" color="#94A3B8" /></View>
      ) : current.status === 'error' ? (
        <Pressable accessibilityLabel="Retry image loading" style={styles.overlay}
          onPress={() => setState({ uri, attempt: 0, status: 'loading' })}>
          <Text style={styles.retry}>↻</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({ overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' }, retry: { color: '#94A3B8', fontSize: 22 } });
