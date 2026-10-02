import React, { useCallback, useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Switch,
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
import { AuthContext } from '../../context/AuthProvider';
import { getUserAvatar } from '../../utils/avatarUtil';
import { apiUtil } from '../../utils/apiUtil';
import { AlertService } from '../../utils/AlertService';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';

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

export default function IdManageStudio() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user, fetchUserProfile } = useContext(AuthContext);

  const [enabled, setEnabled] = useState(Boolean(user?.isActive));
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL');

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [profile, response] = await Promise.all([
        fetchUserProfile(),
        apiUtil.get('/call/history?days=30'),
      ]);
      if (profile) setEnabled(Boolean(profile.isActive));
      const calls = Array.isArray(response?.data?.data?.calls) ? response.data.data.calls : [];
      setHistory(calls);
    } catch (_) {
      setHistory([]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchUserProfile]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggle = async (val) => {
    if (busy) return;
    setBusy(true);
    try {
      const response = await apiUtil.patch('/user/status', { status: val });
      if (!response?.data?.success) {
        throw new Error(response?.data?.message || 'Could not update status');
      }
      setEnabled(val);
      await fetchUserProfile();
      AlertService.show(
        val ? 'ID Active' : 'Do Not Disturb Active',
        val ? 'Your ID is now online and available for incoming calls.' : 'You will not receive incoming calls while status is paused.',
        'info'
      );
    } catch (error) {
      AlertService.show('Update Failed', error?.response?.data?.message || error.message || 'Please try again.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const copyId = () => {
    const idVal = user?.userId || user?._id;
    if (!idVal) return;
    Clipboard.setString(String(idVal));
    AlertService.show('Copied!', `ID #${idVal} copied to clipboard`, 'success');
  };

  const filteredHistory = history.filter((c) => {
    if (activeTab === 'VOICE') return String(c?.type || '').toLowerCase().includes('voice');
    if (activeTab === 'VIDEO') return String(c?.type || '').toLowerCase().includes('video');
    return true;
  });

  return (
    <View style={styles.screen}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Top Hero Gradient */}
      <LinearGradient
        colors={['#0F0826', '#22114E', '#4B1C84']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: getAppTopSafeInset(insets.top) + 8 }]}
      >
        <View style={styles.nav}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            activeOpacity={0.8}
          >
            <Icon name="chevron-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>{t('id_manage.title') || 'ID Management'}</Text>
          <TouchableOpacity onPress={load} style={styles.backBtn} activeOpacity={0.8}>
            <Icon name="refresh" size={19} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Digital VIP Identity Card */}
        <LinearGradient
          colors={['#2D1466', '#521D9C', '#7B2CBF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.idCard}
        >
          {/* Card Top Pill */}
          <View style={styles.idCardHeader}>
            <View style={styles.cardChip}>
              <MaterialCommunityIcons name="integrated-circuit-chip" size={20} color="#FDE047" />
              <Text style={styles.cardChipText}>OFFICIAL YARO IDENTITY</Text>
            </View>
            <View style={[styles.statusDotRow, { backgroundColor: enabled ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)' }]}>
              <View style={[styles.liveDot, { backgroundColor: enabled ? '#10B981' : '#EF4444' }]} />
              <Text style={[styles.statusDotText, { color: enabled ? '#34D399' : '#FCA5A5' }]}>
                {enabled ? 'ONLINE' : 'PAUSED'}
              </Text>
            </View>
          </View>

          {/* User Profile Details */}
          <View style={styles.profileRow}>
            <View style={styles.avatarBorder}>
              <Image source={getUserAvatar(user)} style={styles.avatar} />
              <View style={styles.levelTag}>
                <Text style={styles.levelTagText}>Lv.{user?.level || 1}</Text>
              </View>
            </View>

            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Text style={styles.userName} numberOfLines={1}>
                  {user?.name || 'Yaro Member'}
                </Text>
                <MaterialIcons name="verified" size={16} color="#60A5FA" />
              </View>
              <Text style={styles.userHandle}>
                {user?.userName ? `@${user.userName}` : 'Personal Account'}
              </Text>

              {/* Copyable ID Badge */}
              <TouchableOpacity onPress={copyId} style={styles.idBadge} activeOpacity={0.8}>
                <Text style={styles.idLabel}>ID :</Text>
                <Text style={styles.idNumber}>{user?.userId || user?._id || '—'}</Text>
                <Icon name="copy-outline" size={13} color="#C4B5FD" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </LinearGradient>

      {/* Main Controls & Logs */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollBody,
          { paddingBottom: getStackScreenBottomPadding(insets.bottom, 24) },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Availability Toggle Card */}
        <View style={styles.availabilityCard}>
          <View style={[styles.availIconCircle, { backgroundColor: enabled ? '#ECFDF5' : '#F1F5F9' }]}>
            <Icon
              name={enabled ? 'radio-button-on' : 'moon-outline'}
              size={24}
              color={enabled ? '#10B981' : '#64748B'}
            />
          </View>

          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={styles.availTitle}>
              {enabled ? 'Available for Incoming Calls' : 'Call Receiving Paused'}
            </Text>
            <Text style={styles.availSubtitle}>
              {enabled
                ? 'Your ID is active. Other users can discover and call you.'
                : 'Your profile remains online, but incoming calls will not ring.'}
            </Text>
          </View>

          {busy ? (
            <ActivityIndicator color="#7C3AED" />
          ) : (
            <Switch
              value={enabled}
              onValueChange={toggle}
              trackColor={{ false: '#CBD5E1', true: '#C4B5FD' }}
              thumbColor={enabled ? '#7C3AED' : '#FFFFFF'}
            />
          )}
        </View>

        {/* Tip Banner */}
        <View style={styles.tipCard}>
          <Icon name="shield-checkmark" size={17} color="#7C3AED" style={{ marginTop: 2 }} />
          <Text style={styles.tipText}>
            Keep your ID active to maximize diamonds earned from conversations. Toggling off will not affect your wallet, SVIP or coins.
          </Text>
        </View>

        {/* Call Activity Section */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionKicker}>CONNECTED CONVERSATIONS</Text>
            <Text style={styles.sectionTitle}>30-Day Activity</Text>
          </View>
          <Text style={styles.totalCallsText}>{history.length} Calls Total</Text>
        </View>

        {/* Filter Chips */}
        <View style={styles.typeFilterBar}>
          {[
            { id: 'ALL', label: 'All Calls' },
            { id: 'VOICE', label: 'Voice Calls' },
            { id: 'VIDEO', label: 'Video Calls' },
          ].map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={[styles.typeFilterBtn, isSelected && styles.typeFilterBtnActive]}
                activeOpacity={0.8}
              >
                <Text style={[styles.typeFilterText, isSelected && styles.typeFilterTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Call List */}
        {filteredHistory.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="phone-clock" size={42} color="#A78BFA" />
            <Text style={styles.emptyTitle}>No Calls in Selected Period</Text>
            <Text style={styles.emptySubtitle}>
              When someone calls your ID, the duration and logs will be recorded here.
            </Text>
          </View>
        ) : (
          filteredHistory.map((call, idx) => {
            const isVideo = String(call?.type || '').toLowerCase().includes('video');
            const dateStr = call?.callStart
              ? new Date(call.callStart).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : call?.date || 'Recent';
            const timeStr = call?.callStart
              ? new Date(call.callStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '';

            return (
              <View key={call._id || idx} style={styles.logCard}>
                <View style={[styles.callIconBox, { backgroundColor: isVideo ? '#FCE7F3' : '#EEF2FF' }]}>
                  <Icon
                    name={isVideo ? 'videocam' : 'call'}
                    size={20}
                    color={isVideo ? '#EC4899' : '#6366F1'}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.logDate}>{dateStr}</Text>
                  <Text style={styles.logTime}>{timeStr || 'Voice Session'}</Text>
                </View>

                <View style={styles.durationPill}>
                  <Icon name="timer-outline" size={13} color="#6D28D9" style={{ marginRight: 3 }} />
                  <Text style={styles.durationText}>{formatDuration(call.duration)}</Text>
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
    paddingHorizontal: 18,
    paddingBottom: 20,
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
  idCard: {
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    elevation: 4,
    shadowColor: '#7C3AED',
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  idCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardChipText: {
    color: '#FDE047',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  statusDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  statusDotText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  avatarBorder: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: {
    width: 66,
    height: 66,
    borderRadius: 22,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    backgroundColor: '#EEF2FF',
  },
  levelTag: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  levelTagText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900' },
  userName: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', flexShrink: 1 },
  userHandle: { color: '#DDD6FE', fontSize: 11, marginTop: 2, fontWeight: '600' },
  idBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 8,
  },
  idLabel: { color: '#C4B5FD', fontSize: 11, fontWeight: '800', marginRight: 4 },
  idNumber: { color: '#FFFFFF', fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
  scrollBody: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  availabilityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    marginBottom: 12,
  },
  availIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  availTitle: { color: '#0F172A', fontSize: 15, fontWeight: '800' },
  availSubtitle: { color: '#64748B', fontSize: 11, lineHeight: 16, marginTop: 3 },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F3E8FF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 20,
  },
  tipText: { flex: 1, color: '#581C87', fontSize: 11, lineHeight: 16, fontWeight: '600' },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  sectionKicker: { color: '#94A3B8', fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  sectionTitle: { color: '#0F172A', fontSize: 18, fontWeight: '900', marginTop: 2 },
  totalCallsText: { color: '#7C3AED', fontSize: 12, fontWeight: '800' },
  typeFilterBar: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    padding: 3,
    borderRadius: 12,
    marginBottom: 12,
  },
  typeFilterBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
  },
  typeFilterBtnActive: {
    backgroundColor: '#FFFFFF',
    elevation: 1,
  },
  typeFilterText: { color: '#64748B', fontSize: 11, fontWeight: '700' },
  typeFilterTextActive: { color: '#4F46E5', fontWeight: '900' },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  emptyTitle: { color: '#1E293B', fontSize: 16, fontWeight: '800', marginTop: 10 },
  emptySubtitle: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 17,
  },
  logCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  callIconBox: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logDate: { color: '#0F172A', fontSize: 13, fontWeight: '800' },
  logTime: { color: '#94A3B8', fontSize: 11, marginTop: 2 },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  durationText: { color: '#6D28D9', fontSize: 11, fontWeight: '800' },
});
