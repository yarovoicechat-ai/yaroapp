import React, { useCallback, useContext, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Linking,
  Clipboard,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AuthContext } from '../../context/AuthProvider';
import { apiUtil, API_BASE_URL } from '../../utils/apiUtil';
import { AlertService } from '../../utils/AlertService';

const CHANNELS = ['voice', 'video', 'room'];
const CHANNEL_NAMES = {
  voice: 'Voice Calling',
  video: 'Video Calling',
  room: 'Party Room Hosting',
};

const ROLES = ['owner', 'operator', 'superAdmin', 'admin', 'bdLeader', 'bd', 'agency', 'host'];

const ROLE_DISPLAY = {
  owner: { label: 'Platform Owner', color: '#fbbf24', bg: '#78350f33', border: '#f59e0b55' },
  operator: { label: 'Operator', color: '#38bdf8', bg: '#0369a133', border: '#0ea5e955' },
  superAdmin: { label: 'Super Admin', color: '#c084fc', bg: '#581c8733', border: '#a855f755' },
  admin: { label: 'Admin', color: '#34d399', bg: '#064e3b33', border: '#10b98155' },
  bdLeader: { label: 'BD Leader', color: '#818cf8', bg: '#312e8133', border: '#6366f155' },
  bd: { label: 'BD', color: '#60a5fa', bg: '#1e3a8a33', border: '#3b82f655' },
  agency: { label: 'Agency', color: '#f472b6', bg: '#83184333', border: '#ec489955' },
  host: { label: 'Host', color: '#fb7185', bg: '#88133733', border: '#f43f5e55' },
};

const formatNumber = n => Number(n || 0).toLocaleString('en-IN');

const calcPercent = (achieved, target) => {
  if (!target || target <= 0) return achieved > 0 ? 100 : 0;
  return Math.min(100, Math.round((achieved / target) * 100));
};

export default function TeamDashboard() {
  const { user } = useContext(AuthContext);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [month, setMonth] = useState(() => new Date(Date.now() + 330 * 60000).toISOString().slice(0, 7));
  const [rootId, setRootId] = useState('');
  const [trail, setTrail] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Target editing state
  const [editTarget, setEditTarget] = useState(null);
  const [targetReason, setTargetReason] = useState('');

  // Invitation state
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [inviteRecipientId, setInviteRecipientId] = useState('');
  const [inviteRole, setInviteRole] = useState('host');

  // Spreadsheet export state
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportGuideVisible, setExportGuideVisible] = useState(false);
  const [cachedTsv, setCachedTsv] = useState('');
  const [cachedXlsxUrl, setCachedXlsxUrl] = useState('');

  const actorRole = user?.role === 'user' && user?.hasAppOption ? user.appRole : user?.role;
  const canonicalRole = String(actorRole || '').replace(/[-_]/g, '').toLowerCase();
  const actorIndex = ROLES.findIndex(r => r.toLowerCase() === canonicalRole);
  const allowedInviteRoles = actorIndex < 0 ? ['host'] : ROLES.slice(actorIndex + 1);

  const load = useCallback(async () => {
    if (!/^\d{4}-\d{2}$/.test(month)) return;
    setLoading(true);
    setError('');
    try {
      const res = await apiUtil.get('/team/report', {
        params: {
          month,
          rootId: rootId || undefined,
          role: roleFilter || undefined,
          search: search.trim() || undefined,
          page,
        },
      });
      if (!res.data?.success) throw new Error(res.data?.message || 'Could not load team hierarchy');
      setReport(res.data.data);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Error loading team data');
    } finally {
      setLoading(false);
    }
  }, [month, rootId, roleFilter, search, page]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleExport = async (format = 'sheets') => {
    setLoading(true);
    try {
      const res = await apiUtil.post('/team/exports', { month, rootId: rootId || undefined });
      const {
        downloadPath,
        xlsxDownloadPath,
        csvDownloadPath,
        filename,
        tsv,
        googleSheetsUrl,
      } = res.data?.data || {};

      if (!downloadPath?.startsWith('/api/team/exports/')) {
        throw new Error('Invalid download response');
      }

      const baseUrl = API_BASE_URL.replace(/\/api$/, '');
      const fullXlsxUrl = baseUrl + (xlsxDownloadPath || downloadPath);
      const fullCsvUrl = baseUrl + csvDownloadPath;

      setCachedTsv(tsv || '');
      setCachedXlsxUrl(fullXlsxUrl);

      if (format === 'sheets') {
        if (tsv) Clipboard.setString(tsv);
        setExportModalVisible(false);
        setExportGuideVisible(true);

        try {
          const canOpenApp = await Linking.canOpenURL('googlesheets://');
          if (canOpenApp) {
            await Linking.openURL('googlesheets://');
          } else {
            await Linking.openURL('https://sheets.new');
          }
        } catch {
          await Linking.openURL(googleSheetsUrl || 'https://sheets.new');
        }
        AlertService.show(
          'Google Sheets Ready!',
          'Table copied to clipboard! Paste directly into Google Sheets, or download .xlsx below.',
          'success'
        );
      } else if (format === 'xlsx') {
        setExportModalVisible(false);
        await Linking.openURL(fullXlsxUrl);
        AlertService.show(
          'Downloading .XLSX',
          'Standard Excel & Google Sheets spreadsheet download initiated.',
          'success'
        );
      } else if (format === 'csv') {
        setExportModalVisible(false);
        await Linking.openURL(fullCsvUrl);
        AlertService.show(
          'Downloading CSV',
          'Universal CSV download initiated.',
          'success'
        );
      } else if (format === 'copy') {
        if (tsv) {
          Clipboard.setString(tsv);
          AlertService.show(
            'Copied!',
            'Complete Google Sheets table copied to clipboard!',
            'success'
          );
        }
        setExportModalVisible(false);
      }
    } catch (e) {
      AlertService.show('Export failed', e.response?.data?.message || e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const saveHostTargets = async () => {
    if (!editTarget) return;
    const enabled = CHANNELS.filter(c => editTarget[c]?.enabled);
    if (!enabled.length) {
      AlertService.show('Selection required', 'Please enable at least one hosting target type.', 'warning');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        month,
        channels: enabled,
        revision: editTarget.revision,
        reason: targetReason.trim() || 'Target updated via mobile dashboard',
        ...(enabled.includes('room')
          ? { roomVolume: editTarget.roomVolume === '' ? null : Number(editTarget.roomVolume) }
          : {}),
        ...Object.fromEntries(enabled.map(c => [c, Number(editTarget[c]?.value || 0)])),
      };

      await apiUtil.put(`/team/targets/${editTarget.id}`, payload);
      setEditTarget(null);
      setTargetReason('');
      AlertService.show('Target Saved', `Targets successfully updated for ${editTarget.name}.`, 'success');
      await load();
    } catch (e) {
      AlertService.show('Save failed', e.response?.data?.message || e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const sendInvitation = async () => {
    const uid = Number(inviteRecipientId.trim());
    if (!uid || isNaN(uid) || uid <= 0) {
      AlertService.show('Invalid ID', 'Please enter a valid numeric YARO User ID.', 'warning');
      return;
    }
    setLoading(true);
    try {
      const requestKey = `invite_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await apiUtil.post('/team/invitations', {
        userId: uid,
        role: inviteRole,
        requestKey,
      });
      setInviteModalVisible(false);
      setInviteRecipientId('');
      AlertService.show(
        'Invitation Sent',
        `Invitation sent to YARO ID ${uid}! Delivered to their in-app System Messages.`,
        'success'
      );
    } catch (e) {
      AlertService.show('Invitation failed', e.response?.data?.message || e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const openTargetModal = member => {
    setEditTarget({
      id: member.id,
      name: member.name,
      revision: member.targetRevision,
      roomVolume: String(member.roomVolume?.target ?? ''),
      ...Object.fromEntries(
        CHANNELS.map(c => [
          c,
          {
            enabled: !!member.channels[c]?.enabled,
            value: String(member.channels[c]?.target ?? ''),
          },
        ])
      ),
    });
    setTargetReason('');
  };

  const handleMemberPress = member => {
    if (member.role !== 'host') {
      setTrail(prev => [...prev, rootId]);
      setRootId(member.id);
      setRoleFilter('');
      setPage(1);
    } else {
      openTargetModal(member);
    }
  };

  const handleBreadcrumbPress = id => {
    setRootId(id === report?.breadcrumbs?.[0]?.id ? '' : id);
    setTrail([]);
    setRoleFilter('');
    setPage(1);
  };

  const handleUpLevel = () => {
    if (trail.length > 0) {
      const lastId = trail[trail.length - 1];
      setRootId(lastId);
      setTrail(t => t.slice(0, -1));
      setRoleFilter('');
      setPage(1);
    } else if (rootId) {
      setRootId('');
      setRoleFilter('');
      setPage(1);
    }
  };

  const summary = report?.summary;
  const voice = summary?.channels?.voice;
  const video = summary?.channels?.video;
  const room = summary?.channels?.room;
  const totalCallsAchieved = (voice?.achieved || 0) + (video?.achieved || 0);
  const totalCallsTarget = (voice?.target || 0) + (video?.target || 0);
  const totalCallsPending = (voice?.pending || 0) + (video?.pending || 0);
  const totalTargetBeans = summary?.totalTarget ?? ((voice?.target || 0) + (video?.target || 0) + (room?.target || 0));
  const totalPendingBeans = summary?.totalPending ?? ((voice?.pending || 0) + (video?.pending || 0) + (room?.pending || 0));

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0b0f19" />

      {/* Top Navigation Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginHorizontal: 10 }}>
          <Text style={styles.screenTitle} numberOfLines={1}>
            Team & Hosting Targets
          </Text>
          <Text style={styles.screenSubtitle} numberOfLines={1}>
            {report?.root?.name || 'Hierarchy Analytics'} · Beans Revenue
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={load} disabled={loading}>
          <Ionicons name="refresh" size={18} color="#c7d2fe" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 14, paddingBottom: insets.bottom + 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Action Header Card with Month & Invite/Export */}
        <LinearGradient
          colors={['#1e1b4b', '#0f172a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.monthRow}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.inputLabel}>Report Month (YYYY-MM):</Text>
              <TextInput
                style={styles.monthInput}
                value={month}
                onChangeText={v => {
                  setMonth(v);
                  setPage(1);
                }}
                placeholder="YYYY-MM"
                placeholderTextColor="#64748b"
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TouchableOpacity
                style={styles.sheetsQuickButton}
                onPress={() => handleExport('sheets')}
                disabled={loading}
              >
                <MaterialCommunityIcons name="google-spreadsheet" size={16} color="#6ee7b7" />
                <Text style={styles.sheetsQuickButtonText}>Sheets</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.exportButton}
                onPress={() => setExportModalVisible(true)}
                disabled={loading}
              >
                <MaterialCommunityIcons name="file-download-outline" size={16} color="#38bdf8" />
                <Text style={styles.exportButtonText}>Export</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.actionButtonsRow}>
            {allowedInviteRoles.length > 0 && (
              <TouchableOpacity
                style={styles.inviteButton}
                onPress={() => setInviteModalVisible(true)}
              >
                <Ionicons name="person-add" size={16} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.inviteButtonText}>Invite New Member</Text>
              </TouchableOpacity>
            )}

            {(trail.length > 0 || rootId !== '') && (
              <TouchableOpacity style={styles.upLevelButton} onPress={handleUpLevel}>
                <Ionicons name="arrow-up" size={16} color="#a5b4fc" style={{ marginRight: 4 }} />
                <Text style={styles.upLevelButtonText}>Up Level</Text>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>

        {/* Hierarchy Breadcrumbs Trail */}
        {report?.breadcrumbs && report.breadcrumbs.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.breadcrumbsContainer}
          >
            <Text style={styles.breadcrumbLabel}>Hierarchy:</Text>
            {report.breadcrumbs.map((crumb, idx) => {
              const isLast = idx === report.breadcrumbs.length - 1;
              const rDef = ROLE_DISPLAY[crumb.role] || ROLE_DISPLAY.host;
              return (
                <View key={crumb.id} style={styles.breadcrumbItem}>
                  <TouchableOpacity
                    onPress={() => handleBreadcrumbPress(crumb.id)}
                    disabled={isLast}
                    style={[
                      styles.breadcrumbChip,
                      isLast && { backgroundColor: rDef.bg, borderColor: rDef.border },
                    ]}
                  >
                    <Text
                      style={[
                        styles.breadcrumbText,
                        isLast ? { color: rDef.color, fontWeight: '700' } : { color: '#cbd5e1' },
                      ]}
                    >
                      {crumb.name} ({rDef.label})
                    </Text>
                  </TouchableOpacity>
                  {!isLast && (
                    <Ionicons name="chevron-forward" size={14} color="#475569" style={{ marginHorizontal: 2 }} />
                  )}
                </View>
              );
            })}
          </ScrollView>
        )}

        {error ? <Text style={styles.errorBanner}>{error}</Text> : null}
        {loading && <ActivityIndicator color="#6366f1" style={{ marginVertical: 12 }} />}

        {/* Sabhi Hosts Total Overview Banner */}
        {summary && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <MaterialCommunityIcons name="trophy-award" size={18} color="#fbbf24" />
              <Text style={styles.sectionTitle}>
                All {summary.hostCount} Hosts Revenue & Targets
              </Text>
            </View>

            {/* Total Sabhi Hosts Revenue Card */}
            <LinearGradient
              colors={['#1e1b4b', '#172554']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.metricBanner}
            >
              <View style={styles.metricHeaderRow}>
                <Text style={styles.metricBadge}>Sabhi Hosts Total</Text>
                <Text style={styles.metricSubhead}>Asia/Calcutta Month</Text>
              </View>
              <View style={styles.beansRow}>
                <MaterialCommunityIcons name="diamond-stone" size={26} color="#fbbf24" />
                <Text style={styles.beansTotalText}>{formatNumber(summary.earnedBeans)}</Text>
                <Text style={styles.beansUnit}>Earned Beans</Text>
              </View>
              <View style={styles.metricFooter}>
                <Text style={styles.footerNote}>
                  Room Gift Volume: {formatNumber(summary.giftVolumeBeans)} Beans reference
                </Text>
              </View>
            </LinearGradient>

            {/* 3 Channels Breakdown Cards */}
            <View style={styles.channelCardsGrid}>
              {/* Voice Calling */}
              <View style={[styles.channelCard, { borderColor: '#10b98144' }]}>
                <View style={styles.channelHeader}>
                  <Ionicons name="call" size={16} color="#34d399" />
                  <Text style={styles.channelName}>Voice Calls</Text>
                  <Text style={styles.channelPercent}>
                    {calcPercent(voice?.achieved, voice?.target)}%
                  </Text>
                </View>
                <Text style={styles.channelAchieved}>{formatNumber(voice?.achieved)} Beans</Text>
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        backgroundColor: '#10b981',
                        width: `${calcPercent(voice?.achieved, voice?.target)}%`,
                      },
                    ]}
                  />
                </View>
                <View style={styles.channelStatsRow}>
                  <Text style={styles.targetPending}>
                    Pending: {formatNumber(voice?.pending)}
                  </Text>
                  <Text style={styles.targetGoal}>
                    Target: {formatNumber(voice?.target)}
                  </Text>
                </View>
              </View>

              {/* Video Calling */}
              <View style={[styles.channelCard, { borderColor: '#0ea5e944' }]}>
                <View style={styles.channelHeader}>
                  <Ionicons name="videocam" size={16} color="#38bdf8" />
                  <Text style={styles.channelName}>Video Calls</Text>
                  <Text style={styles.channelPercent}>
                    {calcPercent(video?.achieved, video?.target)}%
                  </Text>
                </View>
                <Text style={styles.channelAchieved}>{formatNumber(video?.achieved)} Beans</Text>
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        backgroundColor: '#0ea5e9',
                        width: `${calcPercent(video?.achieved, video?.target)}%`,
                      },
                    ]}
                  />
                </View>
                <View style={styles.channelStatsRow}>
                  <Text style={styles.targetPending}>
                    Pending: {formatNumber(video?.pending)}
                  </Text>
                  <Text style={styles.targetGoal}>
                    Target: {formatNumber(video?.target)}
                  </Text>
                </View>
              </View>

              {/* Party Room */}
              <View style={[styles.channelCard, { borderColor: '#a855f744' }]}>
                <View style={styles.channelHeader}>
                  <Ionicons name="radio" size={16} color="#c084fc" />
                  <Text style={styles.channelName}>Party Rooms</Text>
                  <Text style={styles.channelPercent}>
                    {calcPercent(room?.achieved, room?.target)}%
                  </Text>
                </View>
                <Text style={styles.channelAchieved}>{formatNumber(room?.achieved)} Beans</Text>
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        backgroundColor: '#a855f7',
                        width: `${calcPercent(room?.achieved, room?.target)}%`,
                      },
                    ]}
                  />
                </View>
                <View style={styles.channelStatsRow}>
                  <Text style={styles.targetPending}>
                    Pending: {formatNumber(room?.pending)}
                  </Text>
                  <Text style={styles.targetGoal}>
                    Target: {formatNumber(room?.target)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Combined 1-on-1 Calls Strip */}
            <View style={styles.combinedStrip}>
              <View style={{ flex: 1 }}>
                <Text style={styles.combinedTitle}>Combined 1-on-1 Calls (Voice + Video)</Text>
                <Text style={styles.combinedValue}>
                  {formatNumber(totalCallsAchieved)} Beans achieved · {formatNumber(totalCallsPending)} pending of {formatNumber(totalCallsTarget)}
                </Text>
              </View>
              <View style={styles.totalBadge}>
                <Text style={styles.totalBadgeText}>
                  Total Pending: {formatNumber(totalPendingBeans)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Subordinate Role Filters */}
        {report && (
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Filter By Subordinate Roles:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsRow}>
              <TouchableOpacity
                style={[styles.filterPill, roleFilter === '' && styles.filterPillSelected]}
                onPress={() => {
                  setRoleFilter('');
                  setPage(1);
                }}
              >
                <Text style={[styles.filterPillText, roleFilter === '' && styles.filterPillTextSelected]}>
                  All ({report.pagination.total})
                </Text>
              </TouchableOpacity>

              {Object.entries(report.counts)
                .filter(([, count]) => count > 0)
                .map(([rKey, count]) => {
                  const rDef = ROLE_DISPLAY[rKey] || ROLE_DISPLAY.host;
                  const isSelected = roleFilter === rKey;
                  return (
                    <TouchableOpacity
                      key={rKey}
                      style={[
                        styles.filterPill,
                        isSelected && { backgroundColor: rDef.bg, borderColor: rDef.border },
                      ]}
                      onPress={() => {
                        setRoleFilter(rKey);
                        setPage(1);
                      }}
                    >
                      <Text
                        style={[
                          styles.filterPillText,
                          isSelected && { color: rDef.color, fontWeight: '700' },
                        ]}
                      >
                        {rDef.label}: {count}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>
          </View>
        )}

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#64748b" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={v => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search team member name or YARO ID..."
            placeholderTextColor="#64748b"
          />
        </View>

        {/* Member List */}
        {report?.members?.map(member => {
          const isHost = member.role === 'host';
          const rDef = ROLE_DISPLAY[member.role] || ROLE_DISPLAY.host;

          return (
            <View key={member.id} style={styles.memberCard}>
              <View style={styles.memberTopRow}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.avatarText}>{member.name?.slice(0, 2).toUpperCase() || 'U'}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.memberName} numberOfLines={1}>
                      {member.name}
                    </Text>
                    <View style={[styles.roleBadge, { backgroundColor: rDef.bg, borderColor: rDef.border }]}>
                      <Text style={[styles.roleBadgeText, { color: rDef.color }]}>{rDef.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.yaroIdText}>
                    YARO ID: <Text style={{ color: '#e2e8f0', fontWeight: '700' }}>{member.userId}</Text>
                    {!isHost && member.hostCount != null && ` · ${member.hostCount} hosts under team`}
                  </Text>
                </View>
              </View>

              {/* Earned Beans Row */}
              <View style={styles.memberRevenueRow}>
                <Text style={styles.revenueLabel}>Total Earned Beans:</Text>
                <Text style={styles.revenueValue}>{formatNumber(member.earnedBeans)} Beans</Text>
              </View>

              {/* Host Specific Channels Breakdown */}
              {isHost && (
                <View style={styles.hostChannelsContainer}>
                  {CHANNELS.map(c => {
                    const chData = member.channels[c];
                    if (!chData?.enabled) return null;
                    return (
                      <View key={c} style={styles.hostChannelRow}>
                        <Text style={styles.channelTitleMini}>{CHANNEL_NAMES[c]}:</Text>
                        <Text style={styles.channelValueMini}>
                          {formatNumber(chData.achieved)} earned
                          {chData.target != null ? ` · ${formatNumber(chData.pending)} pending of ${formatNumber(chData.target)}` : ' (no target)'}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Member Card Action Button */}
              <View style={styles.memberActionsRow}>
                {isHost ? (
                  <TouchableOpacity
                    style={styles.setTargetBtn}
                    onPress={() => openTargetModal(member)}
                  >
                    <Ionicons name="options-outline" size={15} color="#818cf8" style={{ marginRight: 5 }} />
                    <Text style={styles.setTargetBtnText}>Set Separate Hosting Targets</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.openTeamBtn}
                    onPress={() => handleMemberPress(member)}
                  >
                    <Text style={styles.openTeamBtnText}>Open Team Under {rDef.label}</Text>
                    <Ionicons name="chevron-forward" size={16} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}

        {report && !report.members?.length && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No members found under this branch or filter.</Text>
          </View>
        )}

        {/* Pagination Bar */}
        {report && report.pagination.total > 0 && (
          <View style={styles.paginationRow}>
            <TouchableOpacity
              style={[styles.pageButton, page <= 1 && styles.disabledButton]}
              disabled={page <= 1}
              onPress={() => setPage(p => p - 1)}
            >
              <Text style={styles.pageButtonText}>Previous</Text>
            </TouchableOpacity>

            <Text style={styles.pageIndicator}>
              Page {page} of {Math.ceil((report.pagination.total || 1) / (report.pagination.limit || 30))}
            </Text>

            <TouchableOpacity
              style={[
                styles.pageButton,
                page * report.pagination.limit >= report.pagination.total && styles.disabledButton,
              ]}
              disabled={page * report.pagination.limit >= report.pagination.total}
              onPress={() => setPage(p => p + 1)}
            >
              <Text style={styles.pageButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Target Setting Modal */}
      <Modal visible={!!editTarget} transparent animationType="fade" onRequestClose={() => setEditTarget(null)}>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>Set Separate Targets</Text>
                <Text style={styles.modalSub}>{editTarget?.name} · {month}</Text>
              </View>
              <TouchableOpacity onPress={() => setEditTarget(null)}>
                <Ionicons name="close" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalHelp}>
              Select only the hosting types this host actively performs. Voice, video and room targets are completely independent.
            </Text>

            {editTarget &&
              CHANNELS.map(c => {
                const isEnabled = editTarget[c]?.enabled;
                return (
                  <View key={c} style={[styles.targetInputCard, isEnabled && styles.targetInputCardActive]}>
                    <TouchableOpacity
                      style={styles.checkboxRow}
                      onPress={() =>
                        setEditTarget(t => ({
                          ...t,
                          [c]: { ...t[c], enabled: !t[c]?.enabled },
                        }))
                      }
                    >
                      <Ionicons
                        name={isEnabled ? 'checkbox' : 'square-outline'}
                        size={20}
                        color={isEnabled ? '#6366f1' : '#64748b'}
                      />
                      <Text style={styles.checkboxLabel}>{CHANNEL_NAMES[c]}</Text>
                    </TouchableOpacity>

                    {isEnabled && (
                      <View style={{ marginTop: 8 }}>
                        <Text style={styles.inputMiniLabel}>Monthly Target (in Beans):</Text>
                        <TextInput
                          style={styles.modalTextInput}
                          keyboardType="number-pad"
                          value={editTarget[c]?.value}
                          onChangeText={v =>
                            setEditTarget(t => ({
                              ...t,
                              [c]: { ...t[c], value: v },
                            }))
                          }
                          placeholder="e.g. 500000 Beans"
                          placeholderTextColor="#64748b"
                        />
                      </View>
                    )}
                  </View>
                );
              })}

            {editTarget?.room?.enabled && (
              <View style={styles.targetInputCard}>
                <Text style={styles.inputMiniLabel}>
                  Optional Room Gift-Volume Target (Beans reference):
                </Text>
                <TextInput
                  style={styles.modalTextInput}
                  keyboardType="number-pad"
                  value={editTarget.roomVolume}
                  onChangeText={v => setEditTarget(t => ({ ...t, roomVolume: v }))}
                  placeholder="Volume reference in Beans (optional)"
                  placeholderTextColor="#64748b"
                />
              </View>
            )}

            <View style={{ marginTop: 4 }}>
              <Text style={styles.inputMiniLabel}>Reason for target assignment / update:</Text>
              <TextInput
                style={styles.modalTextInput}
                value={targetReason}
                onChangeText={setTargetReason}
                placeholder="e.g. Monthly hosting goal"
                placeholderTextColor="#64748b"
              />
            </View>

            <TouchableOpacity style={styles.modalSubmitButton} onPress={saveHostTargets} disabled={loading}>
              <Text style={styles.modalSubmitButtonText}>Save Separate Targets</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalCancelButton} onPress={() => setEditTarget(null)}>
              <Text style={styles.modalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Invitation Modal */}
      <Modal visible={inviteModalVisible} transparent animationType="fade" onRequestClose={() => setInviteModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>Invite Member to Team</Text>
                <Text style={styles.modalSub}>Sent directly to their in-app System Messages</Text>
              </View>
              <TouchableOpacity onPress={() => setInviteModalVisible(false)}>
                <Ionicons name="close" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputMiniLabel}>Recipient YARO User ID:</Text>
            <TextInput
              style={styles.modalTextInput}
              value={inviteRecipientId}
              onChangeText={setInviteRecipientId}
              keyboardType="number-pad"
              placeholder="Enter numeric YARO User ID"
              placeholderTextColor="#64748b"
            />

            <Text style={[styles.inputMiniLabel, { marginTop: 12 }]}>Assign Role:</Text>
            <View style={styles.roleChipsWrap}>
              {allowedInviteRoles.map(r => {
                const rDef = ROLE_DISPLAY[r] || ROLE_DISPLAY.host;
                const isSelected = r === inviteRole;
                return (
                  <TouchableOpacity
                    key={r}
                    style={[
                      styles.roleChipOption,
                      isSelected && { backgroundColor: rDef.bg, borderColor: rDef.border },
                    ]}
                    onPress={() => setInviteRole(r)}
                  >
                    <Text
                      style={[
                        styles.roleChipOptionText,
                        isSelected && { color: rDef.color, fontWeight: '700' },
                      ]}
                    >
                      {rDef.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.inviteNoticeBox}>
              <Text style={styles.inviteNoticeText}>
                💡 The user receives a system notification in their app. They tap the invitation, fill in their details (name, phone, host types), and submit for approval.
              </Text>
            </View>

            <TouchableOpacity style={styles.modalSubmitButton} onPress={sendInvitation} disabled={loading}>
              <Text style={styles.modalSubmitButtonText}>Send to System Messages</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalCancelButton} onPress={() => setInviteModalVisible(false)}>
              <Text style={styles.modalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Spreadsheet Export Options Modal */}
      <Modal
        visible={exportModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setExportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>Export Hosting Targets</Text>
                <Text style={styles.modalSub}>Month {month} · Multiple spreadsheet formats</Text>
              </View>
              <TouchableOpacity onPress={() => setExportModalVisible(false)}>
                <Ionicons name="close" size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* Option 1: Direct Google Sheets */}
            <TouchableOpacity
              style={[styles.exportOptionCard, { borderColor: '#10b98155', backgroundColor: '#064e3b22' }]}
              onPress={() => handleExport('sheets')}
              disabled={loading}
            >
              <View style={styles.exportOptionHeader}>
                <View style={styles.exportOptionTitleRow}>
                  <MaterialCommunityIcons name="google-spreadsheet" size={20} color="#34d399" />
                  <Text style={styles.exportOptionTitle}>Google Sheets</Text>
                </View>
                <View style={[styles.exportOptionBadge, { backgroundColor: '#064e3b', borderColor: '#10b981' }]}>
                  <Text style={[styles.exportOptionBadgeText, { color: '#6ee7b7' }]}>1-Click Web</Text>
                </View>
              </View>
              <Text style={styles.exportOptionDesc}>
                Opens Google Sheets (sheets.new) and copies full table to clipboard ready to paste into cell A1.
              </Text>
            </TouchableOpacity>

            {/* Option 2: Excel / Google Sheets (.xlsx) */}
            <TouchableOpacity
              style={[styles.exportOptionCard, { borderColor: '#0ea5e955', backgroundColor: '#0369a122' }]}
              onPress={() => handleExport('xlsx')}
              disabled={loading}
            >
              <View style={styles.exportOptionHeader}>
                <View style={styles.exportOptionTitleRow}>
                  <MaterialCommunityIcons name="file-excel-outline" size={20} color="#38bdf8" />
                  <Text style={styles.exportOptionTitle}>Excel & Sheets (.xlsx)</Text>
                </View>
                <View style={[styles.exportOptionBadge, { backgroundColor: '#0369a1', borderColor: '#0ea5e9' }]}>
                  <Text style={[styles.exportOptionBadgeText, { color: '#7dd3fc' }]}>.XLSX</Text>
                </View>
              </View>
              <Text style={styles.exportOptionDesc}>
                OpenXML spreadsheet with automatic column widths, integers & bold totals.
              </Text>
            </TouchableOpacity>

            {/* Option 3: Universal CSV (.csv) */}
            <TouchableOpacity
              style={[styles.exportOptionCard, { borderColor: '#6366f155', backgroundColor: '#312e8122' }]}
              onPress={() => handleExport('csv')}
              disabled={loading}
            >
              <View style={styles.exportOptionHeader}>
                <View style={styles.exportOptionTitleRow}>
                  <MaterialCommunityIcons name="file-delimited-outline" size={20} color="#a5b4fc" />
                  <Text style={styles.exportOptionTitle}>Universal CSV (.csv)</Text>
                </View>
                <View style={[styles.exportOptionBadge, { backgroundColor: '#312e81', borderColor: '#6366f1' }]}>
                  <Text style={[styles.exportOptionBadgeText, { color: '#c7d2fe' }]}>UTF-8 BOM</Text>
                </View>
              </View>
              <Text style={styles.exportOptionDesc}>
                Standard RFC-4180 CSV with UTF-8 BOM encoding for Google Drive & offline apps.
              </Text>
            </TouchableOpacity>

            {/* Option 4: Copy Table */}
            <TouchableOpacity
              style={[styles.exportOptionCard, { borderColor: '#ec489955', backgroundColor: '#83184322' }]}
              onPress={() => handleExport('copy')}
              disabled={loading}
            >
              <View style={styles.exportOptionHeader}>
                <View style={styles.exportOptionTitleRow}>
                  <MaterialCommunityIcons name="content-copy" size={20} color="#f472b6" />
                  <Text style={styles.exportOptionTitle}>Copy Table Data</Text>
                </View>
                <View style={[styles.exportOptionBadge, { backgroundColor: '#831843', borderColor: '#ec4899' }]}>
                  <Text style={[styles.exportOptionBadgeText, { color: '#fbcfe8' }]}>Clipboard</Text>
                </View>
              </View>
              <Text style={styles.exportOptionDesc}>
                Copies tab-separated text to mobile clipboard to paste into any spreadsheet.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalCancelButton} onPress={() => setExportModalVisible(false)}>
              <Text style={styles.modalCancelButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Google Sheets Guide Modal */}
      <Modal
        visible={exportGuideVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setExportGuideVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { borderColor: '#10b98155' }]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialCommunityIcons name="check-circle-outline" size={24} color="#34d399" />
                <Text style={styles.modalTitle}>Google Sheets Ready!</Text>
              </View>
              <TouchableOpacity onPress={() => setExportGuideVisible(false)}>
                <Ionicons name="close" size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <View style={{ backgroundColor: '#064e3b22', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#10b98133', gap: 6 }}>
              <Text style={{ color: '#6ee7b7', fontSize: 12, fontWeight: '700' }}>
                Table data is copied to your clipboard!
              </Text>
              <Text style={{ color: '#cbd5e1', fontSize: 11, lineHeight: 16 }}>
                1. Switch to Google Sheets app or web tab.
              </Text>
              <Text style={{ color: '#cbd5e1', fontSize: 11, lineHeight: 16 }}>
                2. Tap/click on cell A1.
              </Text>
              <Text style={{ color: '#cbd5e1', fontSize: 11, lineHeight: 16 }}>
                3. Select Paste (Ctrl+V) to populate all 30 target & Beans columns!
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
              <TouchableOpacity
                style={[styles.modalSubmitButton, { flex: 1, backgroundColor: '#1e293b', borderColor: '#475569', borderWidth: 1 }]}
                onPress={() => {
                  if (cachedTsv) {
                    Clipboard.setString(cachedTsv);
                    AlertService.show('Copied!', 'Table copied to clipboard again.', 'success');
                  }
                }}
              >
                <Text style={[styles.modalSubmitButtonText, { color: '#a5b4fc' }]}>Copy Again</Text>
              </TouchableOpacity>

              {cachedXlsxUrl ? (
                <TouchableOpacity
                  style={[styles.modalSubmitButton, { flex: 1, backgroundColor: '#0369a1' }]}
                  onPress={() => Linking.openURL(cachedXlsxUrl)}
                >
                  <Text style={styles.modalSubmitButtonText}>Get .XLSX</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                style={[styles.modalSubmitButton, { flex: 1, backgroundColor: '#059669' }]}
                onPress={() => setExportGuideVisible(false)}
              >
                <Text style={styles.modalSubmitButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0b0f19' },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: '#0f172a',
  },
  iconButton: { padding: 6, borderRadius: 10, backgroundColor: '#1e293b' },
  refreshButton: { padding: 8, borderRadius: 10, backgroundColor: '#312e81' },
  screenTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  screenSubtitle: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  heroCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3730a3',
    marginBottom: 12,
  },
  monthRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  inputLabel: { fontSize: 11, fontWeight: '600', color: '#a5b4fc', marginBottom: 4 },
  monthInput: {
    backgroundColor: '#0f172a',
    color: '#fff',
    borderColor: '#312e81',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontWeight: '700',
  },
  sheetsQuickButton: {
    backgroundColor: '#064e3b',
    borderWidth: 1,
    borderColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4,
  },
  sheetsQuickButtonText: { color: '#6ee7b7', fontWeight: '800', fontSize: 11 },
  exportButton: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#38bdf855',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4,
  },
  exportButtonText: { color: '#38bdf8', fontWeight: '800', fontSize: 11 },
  actionButtonsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  inviteButton: {
    flex: 1,
    backgroundColor: '#4f46e5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  inviteButtonText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  upLevelButton: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#475569',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  upLevelButtonText: { color: '#a5b4fc', fontWeight: '700', fontSize: 12 },
  breadcrumbsContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 4 },
  breadcrumbLabel: { color: '#fbbf24', fontSize: 11, fontWeight: '700', marginRight: 4 },
  breadcrumbItem: { flexDirection: 'row', alignItems: 'center' },
  breadcrumbChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  breadcrumbText: { fontSize: 11 },
  sectionContainer: { marginTop: 6, marginBottom: 12 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  sectionTitle: { color: '#fff', fontSize: 14, fontWeight: '800' },
  metricBanner: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#4f46e555',
    marginBottom: 10,
  },
  metricHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metricBadge: {
    backgroundColor: '#3b82f633',
    color: '#60a5fa',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  metricSubhead: { color: '#94a3b8', fontSize: 10 },
  beansRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 8 },
  beansTotalText: { color: '#fbbf24', fontSize: 24, fontWeight: '900' },
  beansUnit: { color: '#fef08a', fontSize: 12, fontWeight: '700' },
  metricFooter: { borderTopWidth: 1, borderTopColor: '#33415555', paddingTop: 6, marginTop: 4 },
  footerNote: { color: '#94a3b8', fontSize: 11 },
  channelCardsGrid: { gap: 8 },
  channelCard: {
    backgroundColor: '#111827',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  channelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  channelName: { color: '#fff', fontSize: 12, fontWeight: '700', flex: 1, marginLeft: 6 },
  channelPercent: { color: '#38bdf8', fontSize: 11, fontWeight: '700' },
  channelAchieved: { color: '#e2e8f0', fontSize: 14, fontWeight: '800', marginTop: 4 },
  progressBarBg: { height: 5, backgroundColor: '#1e293b', borderRadius: 4, marginVertical: 6, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  channelStatsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  targetPending: { color: '#fb7185', fontSize: 10, fontWeight: '600' },
  targetGoal: { color: '#94a3b8', fontSize: 10 },
  combinedStrip: {
    backgroundColor: '#1e1b4b44',
    borderWidth: 1,
    borderColor: '#4338ca44',
    padding: 12,
    borderRadius: 14,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  combinedTitle: { color: '#a5b4fc', fontSize: 11, fontWeight: '700' },
  combinedValue: { color: '#fff', fontSize: 12, fontWeight: '800', marginTop: 2 },
  totalBadge: { backgroundColor: '#be123c33', borderWidth: 1, borderColor: '#f43f5e55', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  totalBadgeText: { color: '#fda4af', fontSize: 10, fontWeight: '700' },
  filterSection: { marginBottom: 10 },
  filterLabel: { color: '#94a3b8', fontSize: 11, fontWeight: '600', marginBottom: 6 },
  filterPillsRow: { flexDirection: 'row', gap: 6 },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterPillSelected: { backgroundColor: '#4f46e5', borderColor: '#6366f1' },
  filterPillText: { color: '#cbd5e1', fontSize: 11, fontWeight: '600' },
  filterPillTextSelected: { color: '#fff', fontWeight: '800' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 14,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 12, paddingVertical: 9 },
  memberCard: {
    backgroundColor: '#111827',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
    marginBottom: 10,
  },
  memberTopRow: { flexDirection: 'row', alignItems: 'center' },
  memberAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#312e81',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#4f46e5',
  },
  avatarText: { color: '#fff', fontWeight: '900', fontSize: 13 },
  memberName: { color: '#fff', fontWeight: '700', fontSize: 14 },
  roleBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  roleBadgeText: { fontSize: 9, fontWeight: '700' },
  yaroIdText: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  memberRevenueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
  },
  revenueLabel: { color: '#94a3b8', fontSize: 11 },
  revenueValue: { color: '#fbbf24', fontSize: 13, fontWeight: '800' },
  hostChannelsContainer: {
    marginTop: 8,
    backgroundColor: '#0b0f19',
    padding: 8,
    borderRadius: 10,
    gap: 4,
  },
  hostChannelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  channelTitleMini: { color: '#94a3b8', fontSize: 10, fontWeight: '600' },
  channelValueMini: { color: '#e2e8f0', fontSize: 10, fontWeight: '700' },
  memberActionsRow: { marginTop: 10 },
  setTargetBtn: {
    backgroundColor: '#312e8133',
    borderWidth: 1,
    borderColor: '#6366f155',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
  },
  setTargetBtnText: { color: '#a5b4fc', fontSize: 11, fontWeight: '700' },
  openTeamBtn: {
    backgroundColor: '#4f46e5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  openTeamBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  emptyContainer: { padding: 24, alignItems: 'center' },
  emptyText: { color: '#64748b', fontSize: 12 },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingVertical: 8,
  },
  pageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  disabledButton: { opacity: 0.4 },
  pageButtonText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  pageIndicator: { color: '#94a3b8', fontSize: 11 },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000000aa',
    justifyContent: 'center',
    padding: 18,
  },
  modalContent: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 18,
    gap: 8,
  },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  modalTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  modalSub: { color: '#94a3b8', fontSize: 11 },
  modalHelp: { color: '#94a3b8', fontSize: 11, lineHeight: 16 },
  targetInputCard: {
    backgroundColor: '#1e293b55',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  targetInputCardActive: { borderColor: '#6366f1', backgroundColor: '#312e8122' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkboxLabel: { color: '#fff', fontSize: 13, fontWeight: '700' },
  inputMiniLabel: { color: '#94a3b8', fontSize: 10, fontWeight: '600', marginBottom: 4 },
  modalTextInput: {
    backgroundColor: '#0b0f19',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#fff',
    fontSize: 12,
  },
  modalSubmitButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  modalSubmitButtonText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  modalCancelButton: { alignItems: 'center', paddingVertical: 8 },
  modalCancelButtonText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  roleChipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 6 },
  roleChipOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1e293b',
  },
  roleChipOptionText: { color: '#cbd5e1', fontSize: 11, fontWeight: '600' },
  inviteNoticeBox: {
    backgroundColor: '#312e8133',
    borderWidth: 1,
    borderColor: '#4f46e555',
    padding: 10,
    borderRadius: 10,
    marginVertical: 6,
  },
  inviteNoticeText: { color: '#c7d2fe', fontSize: 11, lineHeight: 16 },
  errorBanner: {
    backgroundColor: '#881337',
    color: '#fecdd3',
    padding: 10,
    borderRadius: 10,
    fontSize: 11,
    marginVertical: 8,
  },
  exportOptionCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginVertical: 4,
  },
  exportOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exportOptionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exportOptionTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  exportOptionBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  exportOptionBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  exportOptionDesc: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 4,
    lineHeight: 15,
  },
});
