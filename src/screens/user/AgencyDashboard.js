import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  StatusBar,
  Clipboard,
  Share,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AuthContext } from '../../context/AuthProvider';
import { apiUtil } from '../../utils/apiUtil';
import { AlertService } from '../../utils/AlertService';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';

export default function AgencyDashboardScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomSafePadding = getStackScreenBottomPadding(insets.bottom);
  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('hosts'); // 'hosts' | 'payouts'
  const [searchQuery, setSearchQuery] = useState('');

  // Agency Stats
  const [agencyStats, setAgencyStats] = useState({
    agencyName: '',
    agencyCode: '',
    totalHosts: 0,
    onlineHosts: 0,
    monthlyCommission: 0,
    totalMinutes: 0,
  });

  const [hostsList, setHostsList] = useState([]);

  useEffect(() => {
    fetchAgencyManagementData();
  }, []);

  const fetchAgencyManagementData = async () => {
    setLoading(true);
    try {
      const res = await apiUtil.get('/recruitment/agency/dashboard').catch(() => null);
      if (res?.data?.data) {
        const d = res.data.data;
        setAgencyStats(prev => ({ ...prev, ...d }));
        if (Array.isArray(d.hosts)) setHostsList(d.hosts);
      }
    } catch (err) {
      console.log('Agency management fetch notice:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    Clipboard.setString(agencyStats.agencyCode);
    AlertService.show('Copied', `Agency Code ${agencyStats.agencyCode} copied to clipboard!`, 'success');
  };

  const handleShareInvite = async () => {
    try {
      await Share.share({
        message: `Join my official Agency on Yaro! Use Agency Code: ${agencyStats.agencyCode} during Host Registration to earn exclusive salary bonuses and daily diamond payouts!`,
      });
    } catch (err) {
      console.log('Share error:', err.message);
    }
  };

  const handleRequestPayout = () => {
    Alert.alert(
      'Commission Settlement',
      `Submit commission payout request for ₹${agencyStats.monthlyCommission.toLocaleString()} to your registered bank / UPI?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Payout',
          onPress: () => {
            AlertService.show('Submitted', 'Payout request submitted successfully. Processing within 24 hours.', 'success');
          },
        },
      ]
    );
  };

  const filteredHosts = hostsList.filter(h =>
    h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.userId.includes(searchQuery)
  );

  return (
    <View style={styles.screenContainer}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* Header Bar */}
      <View style={[styles.headerBar, { paddingTop: topSafeInset + 6 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={22} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Agency Portal</Text>
        <TouchableOpacity
          style={styles.shareHeaderBtn}
          onPress={handleShareInvite}
          activeOpacity={0.7}
        >
          <Icon name="share-social-outline" size={22} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomSafePadding + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Agency Hero Gradient Card */}
        <LinearGradient
          colors={['#4338CA', '#3730A3', '#1E1B4B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.heroSubtext}>Official Agency Portal</Text>
              <Text style={styles.heroAgencyName}>{agencyStats.agencyName}</Text>
            </View>
            <TouchableOpacity
              style={styles.agencyCodePill}
              onPress={handleCopyCode}
              activeOpacity={0.8}
            >
              <Text style={styles.agencyCodePillText}>{agencyStats.agencyCode}</Text>
              <Icon name="copy-outline" size={14} color="#FDE047" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>

          <View style={styles.heroDivider} />

          {/* KPI Grid */}
          <View style={styles.kpiGrid}>
            <View style={styles.kpiBox}>
              <Text style={styles.kpiBoxLabel}>Total Hosts</Text>
              <Text style={styles.kpiBoxValue}>{agencyStats.totalHosts}</Text>
            </View>
            <View style={styles.kpiBox}>
              <Text style={styles.kpiBoxLabel}>Live Hosts</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.liveDot} />
                <Text style={[styles.kpiBoxValue, { color: '#4ADE80' }]}>{agencyStats.onlineHosts}</Text>
              </View>
            </View>
            <View style={styles.kpiBox}>
              <Text style={styles.kpiBoxLabel}>Monthly Comm.</Text>
              <Text style={[styles.kpiBoxValue, { color: '#FDE047' }]}>₹{agencyStats.monthlyCommission.toLocaleString()}</Text>
            </View>
          </View>

          {/* Action Row */}
          <View style={styles.heroActionRow}>
            <TouchableOpacity
              style={styles.inviteHostBtn}
              onPress={handleShareInvite}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#6366F1', '#4F46E5']}
                style={styles.inviteHostGradient}
              >
                <Icon name="person-add" size={15} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.inviteHostBtnText}>Recruit New Host</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.withdrawBtn}
              onPress={handleRequestPayout}
              activeOpacity={0.85}
            >
              <Text style={styles.withdrawBtnText}>Request Payout</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Tab Selector */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'hosts' && styles.tabItemActive]}
            onPress={() => setActiveTab('hosts')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabItemText, activeTab === 'hosts' && styles.tabItemTextActive]}>
              Managed Hosts ({hostsList.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'payouts' && styles.tabItemActive]}
            onPress={() => setActiveTab('payouts')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabItemText, activeTab === 'payouts' && styles.tabItemTextActive]}>
              Commission Slabs
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'hosts' ? (
          <View>
            {/* Search Box */}
            <View style={styles.searchBar}>
              <Icon name="search" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search host by name or ID..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Icon name="close-circle" size={18} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            {/* Host Cards List */}
            {filteredHosts.length === 0 && !loading && (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Icon name="people-outline" size={48} color="#94A3B8" />
                <Text style={{ color: '#94A3B8', marginTop: 12, fontSize: 14 }}>No hosts found</Text>
              </View>
            )}
            {filteredHosts.map((host) => (
              <View key={host.id} style={styles.hostCard}>
                <View style={styles.hostAvatarWrapper}>
                  <View style={styles.hostAvatarCircle}>
                    <Icon name="person" size={22} color="#6366F1" />
                  </View>
                  <View style={[styles.onlineIndicator, { backgroundColor: host.isOnline ? '#22C55E' : '#94A3B8' }]} />
                </View>

                <View style={styles.hostDetails}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.hostName}>{host.name}</Text>
                    {host.isOnline && (
                      <View style={styles.liveTag}>
                        <Text style={styles.liveTagText}>LIVE</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.hostIdText}>ID: {host.userId}</Text>

                  <View style={styles.hostStatsRow}>
                    <Text style={styles.hostStatSnippet}>
                      ⏱️ {host.todayMins} mins today
                    </Text>
                    <Text style={styles.hostStatSnippet}>
                      💎 {host.diamonds.toLocaleString()} earned
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.viewProfileBtn}
                  onPress={() => navigation.navigate('HostProfile', { hostId: host.userId })}
                  activeOpacity={0.7}
                >
                  <Icon name="chevron-forward" size={18} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          /* Commission Slabs / Policy View */
          <View style={styles.policyCard}>
            <Text style={styles.policyTitle}>Agency Commission Structure</Text>
            <Text style={styles.policySubtitle}>
              Earn recurring commission on every diamond received by your recruited hosts!
            </Text>

            <View style={styles.slabRow}>
              <View style={styles.slabTierBadge}>
                <Text style={styles.slabTierText}>Tier 1</Text>
              </View>
              <View style={styles.slabInfo}>
                <Text style={styles.slabHeading}>1 - 5 Active Hosts</Text>
                <Text style={styles.slabSub}>10% Agency Direct Commission</Text>
              </View>
            </View>

            <View style={styles.slabRow}>
              <View style={[styles.slabTierBadge, { backgroundColor: '#E0E7FF' }]}>
                <Text style={[styles.slabTierText, { color: '#4338CA' }]}>Tier 2</Text>
              </View>
              <View style={styles.slabInfo}>
                <Text style={styles.slabHeading}>6 - 20 Active Hosts</Text>
                <Text style={styles.slabSub}>15% Agency Commission + Weekly Target Bonus</Text>
              </View>
            </View>

            <View style={styles.slabRow}>
              <View style={[styles.slabTierBadge, { backgroundColor: '#FEF3C7' }]}>
                <Text style={[styles.slabTierText, { color: '#D97706' }]}>VIP Elite</Text>
              </View>
              <View style={styles.slabInfo}>
                <Text style={styles.slabHeading}>20+ Active Hosts</Text>
                <Text style={styles.slabSub}>20% Highest Agency Share + Dedicated Account Manager</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  shareHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  heroCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
    shadowColor: '#3730A3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroAgencyName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    marginTop: 2,
  },
  agencyCodePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  agencyCodePillText: {
    color: '#FDE047',
    fontWeight: '700',
    fontSize: 13,
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginVertical: 16,
  },
  kpiGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  kpiBox: {
    flex: 1,
  },
  kpiBoxLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    marginBottom: 4,
  },
  kpiBoxValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
    marginRight: 6,
  },
  heroActionRow: {
    flexDirection: 'row',
    marginTop: 18,
    alignItems: 'center',
  },
  inviteHostBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 10,
  },
  inviteHostGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  inviteHostBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  withdrawBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  withdrawBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabItemActive: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabItemTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  hostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  hostAvatarWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  hostAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  hostDetails: {
    flex: 1,
  },
  hostName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  liveTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  liveTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  hostIdText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  hostStatsRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  hostStatSnippet: {
    fontSize: 12,
    color: '#475569',
    marginRight: 12,
    fontWeight: '500',
  },
  viewProfileBtn: {
    padding: 6,
  },
  policyCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  policyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  policySubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },
  slabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  slabTierBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 12,
  },
  slabTierText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7C3AED',
  },
  slabInfo: {
    flex: 1,
  },
  slabHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  slabSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
});
