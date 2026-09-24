import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset, getTabScreenBottomPadding } from '../../utils/safeAreaUtils';
import { AuthContext } from '../../context/AuthProvider';
import { apiUtil } from '../../utils/apiUtil';
import { CALL_DIAMONDS_PER_MINUTE, hasCallStartIdentity } from '../../utils/callValidation';
import { getUserAvatar } from '../../utils/avatarUtil';
import { normalizeLanguages } from '../../utils/hostPresentation';
import EmptyStateView from '../../components/EmptyStateView';
import { HostCardSkeleton } from '../../components/SkeletonLoader';
import { DUMMY_HOSTS } from '../../constants/dummyData';

const diamondIcon = require('../../assets/icons/diamond.png');
const CARD_WIDTH = (Dimensions.get('window').width - 40) / 2;
const FILTERS = [
  ['All', 'grid-outline'],
  ['Trending', 'flame'],
  ['Verified', 'checkmark-circle'],
  ['New', 'star'],
];
const LANGUAGES = ['All', 'English', 'Hindi', 'Bengali', 'Tamil', 'Telugu', 'Urdu', 'Arabic'];

export default function OneToOne() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomTabBarPadding = getTabScreenBottomPadding(insets.bottom);
  const { user, fetchUserProfile } = useContext(AuthContext);
  const [hosts, setHosts] = useState([]);
  const [filter, setFilter] = useState('All');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [callingId, setCallingId] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchHosts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiUtil.get('/user/hosts?limit=50');
      const data = response.data?.data?.hostsData || response.data?.data;
      let list = data?.hosts || (Array.isArray(data) ? data : []);

      // If no hosts returned, query registered users as fallback
      if (!Array.isArray(list) || list.length === 0) {
        try {
          const userRes = await apiUtil.get('/user?limit=50');
          const userData = userRes.data?.data?.users || userRes.data?.data;
          if (Array.isArray(userData) && userData.length > 0) {
            list = userData.filter((u) => u._id !== user?._id);
          }
        } catch (_) {}
      }

      if (Array.isArray(list) && list.length > 0) {
        setHosts(list);
      } else {
        setHosts([]);
      }
    } catch (error) {
      console.log('[ONE_TO_ONE] Host fetch failed:', error?.message);
      setHosts([]);
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  const fetchNotificationsCount = useCallback(async () => {
    try {
      const res = await apiUtil.get('/user/notifications');
      const list = res.data?.data?.notifications || res.data?.data || [];
      const unread = list.filter((n) => !n.read && !n.isRead).length;
      setUnreadCount(unread);
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchHosts();
    fetchUserProfile?.();
    fetchNotificationsCount();
  }, [fetchHosts, fetchUserProfile, fetchNotificationsCount]);

  const visibleHosts = useMemo(() => {
    let result = Array.isArray(hosts) ? hosts : [];
    if (selectedLanguage !== 'All') {
      result = result.filter((h) => {
        const langs = normalizeLanguages(h?.languages, h?.language);
        return langs.some((l) => l.toLowerCase().includes(selectedLanguage.toLowerCase()));
      });
    }
    if (filter === 'Verified') {
      return result.filter((host) => host.isVerified || host.verified || host.tags?.includes('Verified') || host.tags?.includes('VIP'));
    }
    if (filter === 'Trending') {
      return [...result].sort((a, b) => Number(b.callsCount || 0) - Number(a.callsCount || 0));
    }
    if (filter === 'New') return [...result].reverse();
    return result;
  }, [filter, selectedLanguage, hosts]);

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchHosts(), fetchUserProfile?.(), fetchNotificationsCount()]);
    setRefreshing(false);
  };

  const startCall = async (host, isVideo = true) => {
    if (!host) return;
    if (callingId) return;
    if (Number(user?.diamonds || 0) < CALL_DIAMONDS_PER_MINUTE) {
      Alert.alert('Insufficient Diamonds', 'Please recharge your Diamonds to start this call.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Recharge', onPress: () => navigation.navigate('Recharge') },
      ]);
      return;
    }

    try {
      setCallingId(host._id);
      const response = await apiUtil.post('/call/start', {
        hostId: host._id,
        isVideo,
        callType: isVideo ? 'video' : 'audio',
      });
      const data = response.data?.data;
      if (!response.data?.success || !hasCallStartIdentity(data)) {
        Alert.alert('Call failed', response.data?.message || 'Unable to start call');
        return;
      }
      navigation.navigate('OutGoing', {
        transactionId: data.transactionId,
        channelName: data.channelName,
        maxMinutes: data.maxMinutes,
        expiresInSeconds: data.expiresInSeconds,
        callRatePerMinute: data.callRatePerMinute,
        agora: data.agora,
        name: host.name || 'Host',
        image: host.image || host.avatar,
        gender: host.gender,
        hostId: host._id,
        host,
        isVideo,
        callType: isVideo ? 'video' : 'audio',
        isCaller: true,
      });
    } catch (error) {
      Alert.alert('Call failed', error.response?.data?.message || error.message || 'Unable to start call');
    } finally {
      setCallingId(null);
    }
  };

  const heroHost = visibleHosts[0] || null;

  return (
    <View style={styles.screen}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" animated />
      <LinearGradient colors={['#FFFFFF', '#FAF7FF', '#F6F3FF']} style={StyleSheet.absoluteFillObject} />

      <View style={[styles.header, { paddingTop: topSafeInset + 4 }]}>
        <TouchableOpacity
          style={styles.language}
          activeOpacity={0.7}
          onPress={() => setLangModalVisible(true)}
        >
          <Icon name="globe-outline" size={20} color="#111827" />
          <Text style={styles.languageText}>{selectedLanguage === 'All' ? 'Language' : selectedLanguage}</Text>
          <Icon name="chevron-down" size={14} color="#111827" />
        </TouchableOpacity>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.coins} onPress={() => navigation.navigate('Recharge')} activeOpacity={0.8}>
            <Image source={diamondIcon} style={styles.coinIcon} resizeMode="contain" />
            <Text style={styles.coinText}>{Number(user?.diamonds || 0).toLocaleString('en-US')}</Text>
            <View style={styles.plus}><Icon name="add" size={17} color="#fff" /></View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.round}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Search')}
          >
            <Icon name="search-outline" size={22} color="#111827" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.round}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Icon name="notifications-outline" size={22} color="#111827" />
            {unreadCount > 0 && <View style={styles.redDot} />}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomTabBarPadding }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#7C3AED" />}
        showsVerticalScrollIndicator={false}
      >
        {heroHost && (
          <LinearGradient colors={['#EEF2FF', '#F5D0FE', '#FCE7F3']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
            <View style={styles.heroCopy}>
              <Text style={styles.connect}>Connect &lt;3</Text>
              <Text style={styles.real}>Real People</Text>
              <Text style={styles.moments}>Real Moments</Text>
              <Text style={styles.subtitle}>Join video calls, chat &amp; make friends worldwide.</Text>
              <TouchableOpacity style={styles.join} onPress={() => startCall(heroHost, true)} activeOpacity={0.85}>
                <LinearGradient colors={['#6D28D9', '#EC4899']} style={styles.joinFill}>
                  <Text style={styles.joinText}>Join Now</Text>
                  <Icon name="arrow-forward" size={18} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
            <View style={styles.heroVisual}>
              <Image source={getUserAvatar(heroHost)} style={styles.heroImage} />
              <TouchableOpacity
                style={styles.videoBubble}
                activeOpacity={0.8}
                onPress={() => startCall(heroHost, true)}
              >
                <Icon name="videocam" size={23} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.vibes}>Good Vibes{'\n'}Only!</Text>
            </View>
          </LinearGradient>
        )}

        <View style={styles.filters}>
          {FILTERS.map(([label, icon]) => {
            const active = filter === label;
            return (
              <TouchableOpacity
                key={label}
                style={[styles.filter, active && styles.filterActive]}
                onPress={() => setFilter(label)}
                activeOpacity={0.8}
              >
                <Icon name={icon} size={17} color={active ? '#fff' : label === 'Trending' ? '#F97316' : '#7C3AED'} />
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {loading ? (
          <View style={styles.grid}>
            {[1, 2, 3, 4].map((k) => (
              <HostCardSkeleton key={k} />
            ))}
          </View>
        ) : visibleHosts.length === 0 ? (
          <EmptyStateView
            icon="videocam-off-outline"
            title="No Hosts Available"
            subtitle="There are no active 1-on-1 hosts in this category. Try another filter or refresh."
            actionText="Refresh"
            onAction={refresh}
          />
        ) : (
          <View style={styles.grid}>
            {visibleHosts.map((host, index) => {
              const languages = normalizeLanguages(host?.languages, host?.language).slice(0, 2);
              return (
                <TouchableOpacity
                  key={host._id || index}
                  style={styles.card}
                  onPress={() => navigation.navigate('HostProfile', { host })}
                  activeOpacity={0.9}
                >
                  <Image source={getUserAvatar(host)} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                  <LinearGradient colors={['transparent', 'rgba(17,8,35,0.88)']} style={StyleSheet.absoluteFillObject} />
                  <View style={styles.online} />
                  <View style={styles.info}>
                    <View style={styles.nameRow}>
                      <Text style={styles.name} numberOfLines={1}>{host.name || 'Host'}</Text>
                      <Icon name="checkmark-circle" size={16} color="#A78BFA" />
                    </View>
                    <View style={styles.chips}>
                      {(languages.length ? languages : ['English']).map((lang) => (
                        <View key={lang} style={styles.chip}><Text style={styles.chipText}>{lang}</Text></View>
                      ))}
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.call}
                    onPress={() => startCall(host, true)}
                    activeOpacity={0.85}
                  >
                    <LinearGradient colors={['#9333EA', '#EC4899']} style={styles.callFill}>
                      {callingId === host._id ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Icon name="videocam" size={22} color="#fff" />
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Language Picker Modal */}
      <Modal
        visible={langModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLangModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setLangModalVisible(false)}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Select Language</Text>
            <View style={styles.modalLanguages}>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang}
                  style={[styles.langChip, selectedLanguage === lang && styles.langChipActive]}
                  onPress={() => {
                    setSelectedLanguage(lang);
                    setLangModalVisible(false);
                  }}
                >
                  <Text style={[styles.langChipText, selectedLanguage === lang && styles.langChipTextActive]}>
                    {lang}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingBottom: 10 },
  language: { height: 42, paddingHorizontal: 13, borderRadius: 22, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', gap: 6 },
  languageText: { color: '#111827', fontSize: 14, fontWeight: '700' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  coins: { height: 40, paddingLeft: 8, paddingRight: 4, borderRadius: 20, borderWidth: 1, borderColor: '#BAE6FD', backgroundColor: '#F0F9FF', flexDirection: 'row', alignItems: 'center', gap: 5 },
  coinIcon: { width: 20, height: 20 }, coinText: { color: '#0369A1', fontSize: 13.5, fontWeight: '800' },
  plus: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#0284C7', alignItems: 'center', justifyContent: 'center' },
  round: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#fff', borderWidth: 1, borderColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  redDot: { position: 'absolute', top: 5, right: 5, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },
  scroll: { flex: 1 }, content: { paddingHorizontal: 14 },
  hero: { minHeight: 176, borderRadius: 24, overflow: 'hidden', flexDirection: 'row', padding: 18, marginBottom: 12 },
  heroCopy: { flex: 1.12, zIndex: 2 }, connect: { color: '#312E81', fontSize: 18, fontStyle: 'italic' },
  real: { color: '#3B0764', fontSize: 27, fontWeight: '900', lineHeight: 31 }, moments: { color: '#DB2777', fontSize: 25, fontWeight: '900', lineHeight: 30 },
  subtitle: { color: '#1F2937', fontSize: 11, lineHeight: 15, marginTop: 5, maxWidth: 180 },
  join: { width: 132, height: 38, marginTop: 10, borderRadius: 19, overflow: 'hidden' },
  joinFill: { flex: 1, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, joinText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  heroVisual: { flex: 0.88, justifyContent: 'flex-end', alignItems: 'center' }, heroImage: { width: 142, height: 170, borderRadius: 24 },
  videoBubble: { position: 'absolute', left: -12, top: 12, width: 50, height: 44, borderRadius: 22, backgroundColor: '#EC4899', alignItems: 'center', justifyContent: 'center' },
  vibes: { position: 'absolute', right: -7, top: 42, color: '#7C3AED', fontSize: 13, fontStyle: 'italic', fontWeight: '800', width: 55, textAlign: 'center' },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 14 }, filter: { flex: 1, minHeight: 43, borderRadius: 22, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  filterActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' }, filterText: { color: '#374151', fontSize: 11, fontWeight: '700' }, filterTextActive: { color: '#fff' }, loader: { marginVertical: 28 },
  grid: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 }, card: { width: CARD_WIDTH, height: CARD_WIDTH * 1.3, borderRadius: 22, overflow: 'hidden', backgroundColor: '#EDE9FE' },
  online: { position: 'absolute', top: 10, right: 10, width: 13, height: 13, borderRadius: 7, backgroundColor: '#22C55E', borderWidth: 2, borderColor: '#fff' },
  info: { position: 'absolute', left: 11, right: 11, bottom: 12 }, nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingRight: 42 }, name: { color: '#fff', fontSize: 17, fontWeight: '900', flexShrink: 1 },
  chips: { flexDirection: 'row', gap: 5, marginTop: 7, paddingRight: 36 }, chip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: 'rgba(250,245,255,0.94)' }, chipText: { color: '#6B21A8', fontSize: 9, fontWeight: '700' },
  call: { position: 'absolute', right: 9, bottom: 9, width: 45, height: 45, borderRadius: 23, overflow: 'hidden', elevation: 5 }, callFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 16, textAlign: 'center' },
  modalLanguages: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  langChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' },
  langChipActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  langChipText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  langChipTextActive: { color: '#fff' },
});
