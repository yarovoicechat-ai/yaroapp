import React from 'react';
import { Image, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';
import { getUserAvatar } from '../../utils/avatarUtil';

export default function LiveStreamScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 24);
  const host = route.params?.host || {};
  const stream = route.params?.liveStream || host.liveStream || {};
  const isHost = Boolean(route.params?.isHost);
  const isLive = host.isLive === true || host.isStreaming === true || stream.isLive === true;
  const poster = stream.coverImage || host.liveCoverImage || host.coverImage || host.image || host.avatar;
  const hostName = host.name || stream.host?.name || 'Live host';
  const unavailableText = isHost
    ? 'Live broadcast is not connected to a server in this app yet.'
    : isLive
      ? 'This stream has no playable video connection yet.'
      : 'This host is not currently broadcasting.';

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      {poster ? <Image source={getUserAvatar(poster)} style={StyleSheet.absoluteFillObject} resizeMode="cover" /> : null}
      <LinearGradient
        colors={['rgba(4, 6, 20, 0.72)', 'rgba(4, 6, 20, 0.38)', 'rgba(4, 6, 20, 0.92)']}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={[styles.header, { paddingTop: topSafeInset + 8 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} accessibilityLabel="Go back">
          <Icon name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live</Text>
        <View style={styles.headerSpacer} />
      </View>
      <View style={[styles.content, { paddingBottom: bottomPadding }]}>
        <View style={styles.hostRow}>
          <Image source={getUserAvatar(host)} style={styles.avatar} />
          <View style={styles.hostInfo}>
            <Text style={styles.hostName} numberOfLines={1}>{hostName}</Text>
            <Text style={styles.hostId}>{host.userId || host.id || host._id || ''}</Text>
          </View>
          {isLive && !isHost ? <Text style={styles.liveBadge}>LIVE</Text> : null}
        </View>
        <View style={styles.messageCard}>
          <Icon name="videocam-off-outline" size={36} color="#C4B5FD" />
          <Text style={styles.messageTitle}>Stream unavailable</Text>
          <Text style={styles.messageText}>{unavailableText}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#080B18' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(15,23,42,0.65)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  headerSpacer: { width: 40 },
  content: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 20 },
  hostRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 18, backgroundColor: 'rgba(15,23,42,0.7)' },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 10, backgroundColor: '#334155' },
  hostInfo: { flex: 1 },
  hostName: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  hostId: { color: '#CBD5E1', fontSize: 11, marginTop: 3 },
  liveBadge: { color: '#FFFFFF', backgroundColor: '#DC2626', overflow: 'hidden', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4, fontSize: 10, fontWeight: '900' },
  messageCard: { alignItems: 'center', alignSelf: 'center', width: '100%', maxWidth: 360, padding: 24, borderRadius: 24, backgroundColor: 'rgba(15,23,42,0.82)', marginBottom: 40 },
  messageTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', marginTop: 14 },
  messageText: { color: '#CBD5E1', fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 8 },
});