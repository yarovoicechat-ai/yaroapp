import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  Clipboard,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { apiUtil } from '../../utils/apiUtil';
import { SOCKET_URL } from '@env';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';
import { AlertService } from '../../utils/AlertService';

const imageFor = (call) => {
  const value = call?.callerImage || call?.image || call?.avatar;
  if (!value) return require('../../assets/girl.webp');
  if (/^https?:\/\//i.test(value)) return { uri: value };
  const base = String(SOCKET_URL || 'https://api.yaroapp.in').replace(/\/$/, '');
  return { uri: `${base}${value.startsWith('/') ? '' : '/'}${value}` };
};

const formatDuration = (val) => {
  if (!val) return '0s';
  if (typeof val === 'string' && val.includes(':')) return val;
  const num = Number(val);
  if (isNaN(num)) return String(val);
  const m = Math.floor(num / 60);
  const s = Math.floor(num % 60);
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

export default function CallHistoryStudio() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [days, setDays] = useState(7);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'VOICE' | 'VIDEO'
  const [history, setHistory] = useState({ calls: [], totalTiming: '0 min' });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setLoadError(false);
    try {
      const response = await apiUtil.get(`/call/history?days=${days}`);
      setHistory(response?.data?.data || { calls: [], totalTiming: '0 min' });
    } catch (_) {
      setHistory({ calls: [], totalTiming: '0 min' });
      setLoadError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [days]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const allCalls = Array.isArray(history?.calls) ? history.calls : [];

  const filteredCalls = allCalls.filter((call) => {
    const typeStr = String(call?.type || '').toLowerCase();
    if (activeTab === 'VOICE') return typeStr.includes('voice') || typeStr.includes('audio');
    if (activeTab === 'VIDEO') return typeStr.includes('video');
    return true;
  });

  const totalCoins = allCalls.reduce(
    (sum, call) => sum + Number(call?.voice || 0) + Number(call?.gift || 0),
    0
  );

  const copyId = (id) => {
    if (!id) return;
    Clipboard.setString(String(id));
    AlertService.show('Copied!', `ID #${id} copied to clipboard`, 'success');
  };

  return (
    <View style={styles.screen}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Hero Header */}
      <LinearGradient
        colors={['#0F0A2A', '#231557', '#4E1F8C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: getAppTopSafeInset(insets.top) + 8 }]}
      >
        {/* Top Bar */}
        <View style={styles.nav}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            activeOpacity={0.8}
          >
            <Icon name="chevron-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>{t('history.call_history') || 'Call History'}</Text>
          <TouchableOpacity
            onPress={() => load(true)}
            style={styles.backBtn}
            activeOpacity={0.8}
          >
            <Icon name="refresh" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Hero Kicker & Headline */}
        <View style={styles.heroBadgeRow}>
          <View style={styles.sparkleBadge}>
            <MaterialCommunityIcons name="phone-log" size={13} color="#D8B4FE" />
            <Text style={styles.sparkleBadgeText}>VOICE & VIDEO ARCHIVE</Text>
          </View>
        </View>
        <Text style={styles.heroTitle}>Connection Log</Text>
        <Text style={styles.heroSubtitle}>
          Review all your conversations, duration & diamond exchanges.
        </Text>

        {/* Stats Row */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{allCalls.length}</Text>
            <Text style={styles.statLabel}>{t('history.total_calls') || 'TOTAL CALLS'}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{history?.totalTiming || '0 min'}</Text>
            <Text style={styles.statLabel}>{t('history.total_timing') || 'TALK TIME'}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <MaterialCommunityIcons name="diamond-stone" size={16} color="#67E8F9" />
              <Text style={styles.statNumber}>{totalCoins}</Text>
            </View>
            <Text style={styles.statLabel}>DIAMONDS</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Time Period Tabs */}
      <View style={styles.controlsBar}>
        <View style={styles.periodTabs}>
          {[7, 15, 30].map((val) => {
            const isSelected = days === val;
            return (
              <TouchableOpacity
                key={val}
                onPress={() => setDays(val)}
                style={[styles.periodBtn, isSelected && styles.periodBtnActive]}
                activeOpacity={0.8}
              >
                <Text style={[styles.periodText, isSelected && styles.periodTextActive]}>
                  {val === 30 ? (t('history.one_month') || '30 Days') : `${val} ${t('history.days') || 'Days'}`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Call Type Filter Pills */}
        <View style={styles.typeFilterRow}>
          {[
            { id: 'ALL', label: 'All', icon: 'grid-outline' },
            { id: 'VOICE', label: 'Voice', icon: 'call-outline' },
            { id: 'VIDEO', label: 'Video', icon: 'videocam-outline' },
          ].map((type) => {
            const isSelected = activeTab === type.id;
            return (
              <TouchableOpacity
                key={type.id}
                onPress={() => setActiveTab(type.id)}
                style={[styles.typeChip, isSelected && styles.typeChipActive]}
                activeOpacity={0.8}
              >
                <Icon
                  name={type.icon}
                  size={14}
                  color={isSelected ? '#6366F1' : '#64748B'}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.typeChipText, isSelected && styles.typeChipTextActive]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Main List */}
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: getStackScreenBottomPadding(insets.bottom, 28),
        }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#6366F1" />
            <Text style={styles.loadingText}>Fetching call logs...</Text>
          </View>
        ) : loadError ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Icon name="cloud-offline-outline" size={36} color="#818CF8" />
            </View>
            <Text style={styles.emptyTitle}>Unable to Load Calls</Text>
            <Text style={styles.emptySubtitle}>
              Could not retrieve your conversation history. Check connection.
            </Text>
            <TouchableOpacity onPress={() => load(true)} style={styles.retryBtn}>
              <Text style={styles.retryBtnText}>Retry Now</Text>
            </TouchableOpacity>
          </View>
        ) : filteredCalls.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <MaterialCommunityIcons name="phone-off" size={38} color="#818CF8" />
            </View>
            <Text style={styles.emptyTitle}>No Calls Recorded</Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'ALL'
                ? `You haven't made or received calls in the last ${days} days.`
                : `No ${activeTab.toLowerCase()} calls recorded in the last ${days} days.`}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Home')}
              style={styles.exploreBtn}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#6366F1', '#4F46E5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.exploreGradient}
              >
                <Icon name="people" size={17} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.exploreBtnText}>Connect with Hosts</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          filteredCalls.map((call, idx) => {
            const rawType = String(call?.type || 'voice_call').toLowerCase();
            const isVideo = rawType.includes('video');
            const diamonds = Number(call?.voice || 0) + Number(call?.gift || 0);
            const callDateStr = call?.callStart
              ? new Date(call.callStart).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : call?.date || 'Recent';
            const callTimeStr = call?.callStart
              ? new Date(call.callStart).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '';

            return (
              <View key={call._id || `${call.id}-${idx}`} style={styles.callCard}>
                {/* Header Row */}
                <View style={styles.cardHeader}>
                  <Image source={imageFor(call)} style={styles.callerAvatar} />
                  <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                      <Text style={styles.callerName} numberOfLines={1}>
                        {call.name || 'Yaro User'}
                      </Text>
                      {call.id ? (
                        <TouchableOpacity
                          onPress={() => copyId(call.id)}
                          style={styles.idChip}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.idChipText}>ID {call.id}</Text>
                          <Icon name="copy-outline" size={10} color="#64748B" style={{ marginLeft: 3 }} />
                        </TouchableOpacity>
                      ) : null}
                    </View>
                    <Text style={styles.callTimestamp}>
                      {callDateStr} {callTimeStr ? `· ${callTimeStr}` : ''}
                    </Text>
                  </View>

                  {/* Call Type Pill */}
                  <View style={[styles.typeBadge, isVideo ? styles.videoBadge : styles.voiceBadge]}>
                    <Icon
                      name={isVideo ? 'videocam' : 'call'}
                      size={12}
                      color={isVideo ? '#EC4899' : '#8B5CF6'}
                      style={{ marginRight: 3 }}
                    />
                    <Text style={[styles.typeBadgeText, isVideo ? { color: '#EC4899' } : { color: '#8B5CF6' }]}>
                      {isVideo ? 'Video' : 'Voice'}
                    </Text>
                  </View>
                </View>

                {/* Metrics Row */}
                <View style={styles.cardFooter}>
                  <View style={styles.metricItem}>
                    <Icon name="time-outline" size={14} color="#6366F1" />
                    <Text style={styles.metricValue}>{formatDuration(call.duration)}</Text>
                  </View>

                  <View style={styles.metricItem}>
                    <MaterialCommunityIcons name="diamond-stone" size={14} color="#06B6D4" />
                    <Text style={[styles.metricValue, { color: '#0891B2' }]}>
                      {diamonds} {t('history.diamonds') || 'Coins'}
                    </Text>
                  </View>

                  {call.commission !== undefined && (
                    <View style={styles.metricItem}>
                      <MaterialIcons name="monetization-on" size={14} color="#10B981" />
                      <Text style={[styles.metricValue, { color: '#059669' }]}>
                        {call.commission} Comm.
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  heroBadgeRow: { flexDirection: 'row', marginBottom: 6 },
  sparkleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(216, 180, 254, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  sparkleBadgeText: {
    color: '#D8B4FE',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    marginTop: 4,
  },
  heroSubtitle: {
    color: '#DDD6FE',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 18,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 18,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  statItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statNumber: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  statLabel: { color: '#C4B5FD', fontSize: 9, fontWeight: '800', marginTop: 3 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)' },
  controlsBar: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  periodTabs: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    padding: 3,
    marginBottom: 10,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 11,
    alignItems: 'center',
  },
  periodBtnActive: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#6366F1',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  periodText: { color: '#64748B', fontSize: 12, fontWeight: '700' },
  periodTextActive: { color: '#4F46E5', fontWeight: '900' },
  typeFilterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  typeChipActive: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  typeChipText: { color: '#64748B', fontSize: 11, fontWeight: '700' },
  typeChipTextActive: { color: '#4F46E5', fontWeight: '900' },
  loadingWrap: { alignItems: 'center', paddingVertical: 60 },
  loadingText: { color: '#64748B', fontSize: 13, marginTop: 12, fontWeight: '600' },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { color: '#1E293B', fontSize: 18, fontWeight: '900' },
  emptySubtitle: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 20,
  },
  retryBtn: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryBtnText: { color: '#4F46E5', fontWeight: '800', fontSize: 13 },
  exploreBtn: { width: '100%', maxWidth: 220 },
  exploreGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 14,
  },
  exploreBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  callCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  callerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    marginRight: 12,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  callerName: { color: '#0F172A', fontSize: 15, fontWeight: '800', flexShrink: 1 },
  idChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  idChipText: { color: '#64748B', fontSize: 10, fontWeight: '700' },
  callTimestamp: { color: '#94A3B8', fontSize: 11, marginTop: 3 },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  voiceBadge: { backgroundColor: '#F3E8FF' },
  videoBadge: { backgroundColor: '#FCE7F3' },
  typeBadgeText: { fontSize: 11, fontWeight: '800' },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    paddingTop: 10,
    marginTop: 12,
    gap: 16,
  },
  metricItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metricValue: { color: '#334155', fontSize: 12, fontWeight: '700' },
});
