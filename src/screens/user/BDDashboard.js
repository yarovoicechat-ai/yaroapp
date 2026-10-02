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
  Modal,
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

export default function BDDashboardScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomSafePadding = getStackScreenBottomPadding(insets.bottom);
  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('agencies'); // 'agencies' | 'hosts' | 'earnings' | 'policy'
  const [searchQuery, setSearchQuery] = useState('');

  // BD Profile & Summary Stats
  const [bdStats, setBdStats] = useState({
    bdCode: user?.bdCode || '',
    tier: 'BD Partner',
    hiredAgenciesCount: 0,
    hiredHostsCount: 0,
    monthlyEarnings: 0,
    activeRecruitsToday: 0,
    monthlyTargetAgencies: 10,
    monthlyTargetHosts: 50,
  });

  // Hired Agencies List
  const [hiredAgencies, setHiredAgencies] = useState([]);

  // Hired Hosts List
  const [hiredHosts, setHiredHosts] = useState([]);

  // Modal States
  const [hireAgencyModalVisible, setHireAgencyModalVisible] = useState(false);
  const [agencyForm, setAgencyForm] = useState({
    name: '',
    leaderName: '',
    phone: '',
    email: '',
    state: '',
    estHosts: '',
  });

  const [hireHostModalVisible, setHireHostModalVisible] = useState(false);
  const [hostForm, setHostForm] = useState({
    name: '',
    userIdOrPhone: '',
    language: 'Hindi',
    experience: 'Fresher',
    dailyTargetHours: '3 Hours',
  });

  const [payoutModalVisible, setPayoutModalVisible] = useState(false);
  const [payoutForm, setPayoutForm] = useState({
    upiId: '',
    accountHolder: '',
    accountNumber: '',
    ifsc: '',
    amount: '',
  });

  // Share BD Referral Links
  const handleCopyBDCode = () => {
    Clipboard.setString(bdStats.bdCode);
    AlertService.show('Copied', `BD Code ${bdStats.bdCode} copied to clipboard!`, 'success');
  };

  const handleShareAgencyInvite = async () => {
    try {
      await Share.share({
        message: `Join Yaro as an Official Agency Leader! Register under Business Development Partner Code: ${bdStats.bdCode} to receive high host rev-share (up to 85%) and dedicated BD support. Download App: https://yaroapp.in/download`,
      });
    } catch (err) {
      console.log('Share error:', err.message);
    }
  };

  const handleShareHostInvite = async () => {
    try {
      await Share.share({
        message: `Become a Verified Voice Host on Yaro! Join directly through BD Partner Code: ${bdStats.bdCode} for guaranteed daily audio room traffic, hourly bonuses, and instant weekly payouts! Download App: https://yaroapp.in/download`,
      });
    } catch (err) {
      console.log('Share error:', err.message);
    }
  };

  // Submit Agency Recruitment Form
  const handleSubmitHireAgency = async () => {
    if (!agencyForm.name.trim() || !agencyForm.leaderName.trim() || !agencyForm.phone.trim()) {
      AlertService.show('Required', 'Please fill in Agency Name, Leader Name, and Contact Number', 'warning');
      return;
    }

    const newAgencyCode = `AGY-${Math.floor(1000 + Math.random() * 9000)}`;
    const newAgency = {
      id: `agy-${Date.now()}`,
      code: newAgencyCode,
      name: agencyForm.name.trim(),
      leader: agencyForm.leaderName.trim(),
      phone: agencyForm.phone.trim(),
      hostsCount: 0,
      monthlyVolume: '₹0',
      bdCommissionShare: '4.0%',
      earnedFromAgency: '₹0',
      status: 'Review',
      joinedDate: 'Today',
    };

    setHiredAgencies([newAgency, ...hiredAgencies]);
    setBdStats(prev => ({
      ...prev,
      hiredAgenciesCount: prev.hiredAgenciesCount + 1,
      activeRecruitsToday: prev.activeRecruitsToday + 1,
    }));

    setAgencyForm({ name: '', leaderName: '', phone: '', email: '', state: '', estHosts: '' });
    setHireAgencyModalVisible(false);
    AlertService.show('Agency Onboarded', `Agency ${newAgency.name} registered with Code ${newAgencyCode}!`, 'success');
  };

  // Submit Host Recruitment Form
  const handleSubmitHireHost = async () => {
    if (!hostForm.name.trim() || !hostForm.userIdOrPhone.trim()) {
      AlertService.show('Required', 'Please enter Host Name and User ID / Phone Number', 'warning');
      return;
    }

    const newHost = {
      id: `host-${Date.now()}`,
      userId: hostForm.userIdOrPhone.trim().replace(/[^0-9]/g, '').slice(-8) || `1000${Math.floor(1000 + Math.random() * 9000)}`,
      name: hostForm.name.trim(),
      language: hostForm.language || 'Hindi',
      isOnline: true,
      todayMins: 0,
      todayDiamonds: 0,
      monthlySalary: '₹0',
      bdRecruiterBonus: '₹500 (On Target)',
      status: 'Active Host',
      hiredOn: 'Today',
    };

    setHiredHosts([newHost, ...hiredHosts]);
    setBdStats(prev => ({
      ...prev,
      hiredHostsCount: prev.hiredHostsCount + 1,
      activeRecruitsToday: prev.activeRecruitsToday + 1,
    }));

    setHostForm({ name: '', userIdOrPhone: '', language: 'Hindi', experience: 'Fresher', dailyTargetHours: '3 Hours' });
    setHireHostModalVisible(false);
    AlertService.show('Host Recruited', `${newHost.name} has been enrolled under your BD profile!`, 'success');
  };

  // Submit Payout Request
  const handleSubmitPayout = () => {
    if (!payoutForm.amount || Number(payoutForm.amount) < 500) {
      AlertService.show('Invalid Amount', 'Minimum payout settlement request is ₹500', 'warning');
      return;
    }
    if (!payoutForm.upiId.trim() && (!payoutForm.accountNumber.trim() || !payoutForm.ifsc.trim())) {
      AlertService.show('Details Required', 'Please provide either UPI ID or Bank Details', 'warning');
      return;
    }

    Alert.alert(
      'Confirm Settlement',
      `Request commission payout of ₹${Number(payoutForm.amount).toLocaleString()} to ${payoutForm.upiId.trim() || payoutForm.accountNumber.trim()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            setPayoutModalVisible(false);
            setPayoutForm({ upiId: '', accountHolder: '', accountNumber: '', ifsc: '', amount: '' });
            AlertService.show('Submitted', 'BD Payout request submitted! Approved funds will credit within 24-48 hours.', 'success');
          },
        },
      ]
    );
  };

  const filteredAgencies = hiredAgencies.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.leader.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredHosts = hiredHosts.filter(h =>
    h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.userId.includes(searchQuery) ||
    h.language.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.screenContainer}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* Hero Header */}
      <LinearGradient
        colors={['#FFFFFF', '#F8FAFC', '#EEF2FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerHero, { paddingTop: topSafeInset + 8 }]}
      >
        <View style={styles.navBar}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Icon name="arrow-back" size={22} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.navCenter}>
            <Text style={styles.headerTitle}>BD Development Center</Text>
            <Text style={styles.headerSubtitle}>Hire & Manage Agencies & Hosts</Text>
          </View>
          <TouchableOpacity
            style={styles.helpBtn}
            onPress={() => Alert.alert('BD Guidelines', 'Business Development Partners earn lifelong override commissions by onboarding new Agencies and direct Hosts to the platform.')}
            activeOpacity={0.7}
          >
            <Icon name="help-circle-outline" size={22} color="#4F46E5" />
          </TouchableOpacity>
        </View>

        {/* BD Profile Card */}
        <View style={styles.bdProfileCard}>
          <View style={styles.bdAvatarBadge}>
            <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.bdAvatarGradient}>
              <MaterialCommunityIcons name="account-tie" size={32} color="#FFF" />
            </LinearGradient>
            <View style={styles.verifiedCheckBadge}>
              <MaterialIcons name="verified" size={14} color="#FFF" />
            </View>
          </View>

          <View style={styles.bdProfileInfo}>
            <View style={styles.bdNameRow}>
              <Text style={styles.bdUserName} numberOfLines={1}>{user?.name || 'BD Partner'}</Text>
              <View style={styles.tierChip}>
                <Text style={styles.tierChipText}>{bdStats.tier}</Text>
              </View>
            </View>
            <View style={styles.bdCodeRow}>
              <Text style={styles.bdCodeLabel}>BD Referral Code: </Text>
              <TouchableOpacity onPress={handleCopyBDCode} style={styles.bdCodeBox} activeOpacity={0.7}>
                <Text style={styles.bdCodeText}>{bdStats.bdCode}</Text>
                <Icon name="copy-outline" size={13} color="#FDE047" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 3-Stat Metric Cards */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Agencies Hired</Text>
            <Text style={styles.metricValue}>{bdStats.hiredAgenciesCount}</Text>
            <Text style={styles.metricSub}>All Verified</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Hosts Hired</Text>
            <Text style={styles.metricValue}>{bdStats.hiredHostsCount}</Text>
            <Text style={styles.metricSub}>Active Team</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>BD Earnings</Text>
            <Text style={[styles.metricValue, { color: '#4ADE80' }]}>₹{(bdStats.monthlyEarnings / 1000).toFixed(1)}k</Text>
            <Text style={styles.metricSub}>This Month</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Main Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'agencies' && styles.tabItemActive]}
          onPress={() => { setActiveTab('agencies'); setSearchQuery(''); }}
          activeOpacity={0.8}
        >
          <MaterialIcons
            name="business"
            size={18}
            color={activeTab === 'agencies' ? '#4F46E5' : '#64748B'}
          />
          <Text style={[styles.tabText, activeTab === 'agencies' && styles.tabTextActive]}>
            Hire Agencies ({hiredAgencies.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'hosts' && styles.tabItemActive]}
          onPress={() => { setActiveTab('hosts'); setSearchQuery(''); }}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="microphone-variant"
            size={18}
            color={activeTab === 'hosts' ? '#4F46E5' : '#64748B'}
          />
          <Text style={[styles.tabText, activeTab === 'hosts' && styles.tabTextActive]}>
            Hire Hosts ({hiredHosts.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'earnings' && styles.tabItemActive]}
          onPress={() => { setActiveTab('earnings'); }}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="wallet-outline"
            size={18}
            color={activeTab === 'earnings' ? '#4F46E5' : '#64748B'}
          />
          <Text style={[styles.tabText, activeTab === 'earnings' && styles.tabTextActive]}>
            Payouts
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'policy' && styles.tabItemActive]}
          onPress={() => { setActiveTab('policy'); }}
          activeOpacity={0.8}
        >
          <MaterialIcons
            name="military-tech"
            size={18}
            color={activeTab === 'policy' ? '#4F46E5' : '#64748B'}
          />
          <Text style={[styles.tabText, activeTab === 'policy' && styles.tabTextActive]}>
            Slabs
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomSafePadding + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ============================================================== */}
        {/* TAB 1: HIRE AGENCIES                                            */}
        {/* ============================================================== */}
        {activeTab === 'agencies' && (
          <View>
            {/* Action Bar for Agency Recruitment */}
            <View style={styles.actionBanner}>
              <View style={styles.actionBannerLeft}>
                <Text style={styles.actionBannerTitle}>Agency Recruitment Hub</Text>
                <Text style={styles.actionBannerSub}>
                  Earn 3% - 5% recurring revenue commission from all onboarded agencies.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.hireBtn}
                onPress={() => setHireAgencyModalVisible(true)}
                activeOpacity={0.85}
              >
                <LinearGradient colors={['#4F46E5', '#3730A3']} style={styles.hireBtnGradient}>
                  <Icon name="add-circle-outline" size={16} color="#FFF" style={{ marginRight: 4 }} />
                  <Text style={styles.hireBtnText}>Hire Agency</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Share Agency Invite Box */}
            <View style={styles.shareBox}>
              <View style={styles.shareBoxTop}>
                <View style={styles.shareIconBox}>
                  <MaterialCommunityIcons name="share-variant" size={20} color="#4F46E5" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.shareTitle}>Agency Leader Invitation Link</Text>
                  <Text style={styles.shareDesc}>Send this invitation link or code to prospective agency owners.</Text>
                </View>
              </View>
              <View style={styles.shareActionsRow}>
                <TouchableOpacity style={styles.copyLinkBtn} onPress={handleCopyBDCode} activeOpacity={0.75}>
                  <Icon name="copy-outline" size={16} color="#374151" style={{ marginRight: 6 }} />
                  <Text style={styles.copyLinkText}>Copy Code: {bdStats.bdCode}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.shareLinkBtn} onPress={handleShareAgencyInvite} activeOpacity={0.75}>
                  <Icon name="share-social-outline" size={16} color="#FFF" style={{ marginRight: 6 }} />
                  <Text style={styles.shareLinkText}>Share Invite</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Search Agencies */}
            <View style={styles.searchBar}>
              <Icon name="search" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search hired agencies by name or code..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Icon name="close-circle" size={18} color="#94A3B8" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Hired Agencies List */}
            <Text style={styles.sectionHeaderTitle}>Hired Agencies Under Your Network ({filteredAgencies.length})</Text>

            {filteredAgencies.length === 0 ? (
              <View style={styles.emptyCard}>
                <MaterialIcons name="business" size={42} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>No Agencies Found</Text>
                <Text style={styles.emptySub}>Click 'Hire Agency' above to register your first partner agency.</Text>
              </View>
            ) : (
              filteredAgencies.map((agency) => (
                <View key={agency.id} style={styles.cardItem}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <View style={styles.cardAvatar}>
                        <MaterialCommunityIcons name="shield-crown" size={22} color="#F59E0B" />
                      </View>
                      <View>
                        <Text style={styles.cardName}>{agency.name}</Text>
                        <Text style={styles.cardCode}>Code: {agency.code} • Leader: {agency.leader}</Text>
                      </View>
                    </View>
                    <View style={[
                      styles.statusPill,
                      agency.status === 'Active' ? styles.statusPillActive : styles.statusPillReview
                    ]}>
                      <Text style={[
                        styles.statusPillText,
                        agency.status === 'Active' ? styles.statusPillTextActive : styles.statusPillTextReview
                      ]}>{agency.status}</Text>
                    </View>
                  </View>

                  <View style={styles.cardStatsRow}>
                    <View style={styles.cardStatCol}>
                      <Text style={styles.cardStatLabel}>Active Hosts</Text>
                      <Text style={styles.cardStatVal}>{agency.hostsCount}</Text>
                    </View>
                    <View style={styles.cardStatCol}>
                      <Text style={styles.cardStatLabel}>Monthly Volume</Text>
                      <Text style={styles.cardStatVal}>{agency.monthlyVolume}</Text>
                    </View>
                    <View style={styles.cardStatCol}>
                      <Text style={styles.cardStatLabel}>BD Share ({agency.bdCommissionShare})</Text>
                      <Text style={[styles.cardStatVal, { color: '#16A34A' }]}>{agency.earnedFromAgency}</Text>
                    </View>
                  </View>

                  <View style={styles.cardFooter}>
                    <Text style={styles.joinedDateText}>Joined: {agency.joinedDate}</Text>
                    <TouchableOpacity
                      style={styles.cardActionBtn}
                      onPress={() => Alert.alert('Agency Details', `Agency: ${agency.name}\nLeader: ${agency.leader}\nPhone: ${agency.phone}\nTotal Active Hosts: ${agency.hostsCount}\nCommission Rate: ${agency.bdCommissionShare}`)}
                    >
                      <Text style={styles.cardActionBtnText}>View Breakdown</Text>
                      <Icon name="chevron-forward" size={14} color="#4F46E5" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ============================================================== */}
        {/* TAB 2: HIRE HOSTS                                               */}
        {/* ============================================================== */}
        {activeTab === 'hosts' && (
          <View>
            {/* Action Bar for Direct Host Recruitment */}
            <View style={styles.actionBanner}>
              <View style={styles.actionBannerLeft}>
                <Text style={styles.actionBannerTitle}>Host Recruitment Hub</Text>
                <Text style={styles.actionBannerSub}>
                  Hire talented audio hosts directly under your BD identity and earn per-host recruitment bonuses.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.hireBtn}
                onPress={() => setHireHostModalVisible(true)}
                activeOpacity={0.85}
              >
                <LinearGradient colors={['#EC4899', '#BE185D']} style={styles.hireBtnGradient}>
                  <Icon name="person-add" size={16} color="#FFF" style={{ marginRight: 4 }} />
                  <Text style={styles.hireBtnText}>Hire Host</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Share Host Invite Box */}
            <View style={styles.shareBox}>
              <View style={styles.shareBoxTop}>
                <View style={[styles.shareIconBox, { backgroundColor: '#FDF2F8' }]}>
                  <MaterialCommunityIcons name="microphone-variant" size={20} color="#EC4899" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.shareTitle}>Direct Host Invite Link</Text>
                  <Text style={styles.shareDesc}>Share this with potential creators to onboard them as verified voice hosts.</Text>
                </View>
              </View>
              <View style={styles.shareActionsRow}>
                <TouchableOpacity style={styles.copyLinkBtn} onPress={handleCopyBDCode} activeOpacity={0.75}>
                  <Icon name="copy-outline" size={16} color="#374151" style={{ marginRight: 6 }} />
                  <Text style={styles.copyLinkText}>Code: {bdStats.bdCode}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.shareLinkBtn, { backgroundColor: '#EC4899' }]}
                  onPress={handleShareHostInvite}
                  activeOpacity={0.75}
                >
                  <Icon name="share-social-outline" size={16} color="#FFF" style={{ marginRight: 6 }} />
                  <Text style={styles.shareLinkText}>Invite Hosts</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Search Hosts */}
            <View style={styles.searchBar}>
              <Icon name="search" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search hired hosts by name, ID or language..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Icon name="close-circle" size={18} color="#94A3B8" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Hired Hosts List */}
            <Text style={styles.sectionHeaderTitle}>Directly Recruited Hosts ({filteredHosts.length})</Text>

            {filteredHosts.length === 0 ? (
              <View style={styles.emptyCard}>
                <MaterialCommunityIcons name="account-group-outline" size={42} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>No Hosts Found</Text>
                <Text style={styles.emptySub}>Click 'Hire Host' to enroll your first creator.</Text>
              </View>
            ) : (
              filteredHosts.map((host) => (
                <View key={host.id} style={styles.cardItem}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <View style={[styles.cardAvatar, { backgroundColor: '#FDF2F8' }]}>
                        <MaterialCommunityIcons name="microphone-variant" size={22} color="#EC4899" />
                      </View>
                      <View>
                        <Text style={styles.cardName}>{host.name}</Text>
                        <Text style={styles.cardCode}>ID: {host.userId} • {host.language}</Text>
                      </View>
                    </View>
                    <View style={[
                      styles.statusPill,
                      host.isOnline ? styles.statusPillActive : styles.statusPillReview
                    ]}>
                      <View style={[styles.onlineDot, { backgroundColor: host.isOnline ? '#22C55E' : '#94A3B8' }]} />
                      <Text style={[
                        styles.statusPillText,
                        host.isOnline ? styles.statusPillTextActive : styles.statusPillTextReview
                      ]}>{host.status}</Text>
                    </View>
                  </View>

                  <View style={styles.cardStatsRow}>
                    <View style={styles.cardStatCol}>
                      <Text style={styles.cardStatLabel}>Today Minutes</Text>
                      <Text style={styles.cardStatVal}>{host.todayMins}m</Text>
                    </View>
                    <View style={styles.cardStatCol}>
                      <Text style={styles.cardStatLabel}>Diamonds Earned</Text>
                      <Text style={styles.cardStatVal}>{host.todayDiamonds.toLocaleString()}</Text>
                    </View>
                    <View style={styles.cardStatCol}>
                      <Text style={styles.cardStatLabel}>BD Recruiter Bonus</Text>
                      <Text style={[styles.cardStatVal, { color: '#EC4899' }]}>{host.bdRecruiterBonus}</Text>
                    </View>
                  </View>

                  <View style={styles.cardFooter}>
                    <Text style={styles.joinedDateText}>Recruited: {host.hiredOn}</Text>
                    <TouchableOpacity
                      style={styles.cardActionBtn}
                      onPress={() => Alert.alert('Host Target Stats', `Host: ${host.name}\nUser ID: ${host.userId}\nLanguages: ${host.language}\nStatus: ${host.status}\nBonus: ${host.bdRecruiterBonus}`)}
                    >
                      <Text style={[styles.cardActionBtnText, { color: '#EC4899' }]}>Activity Stats</Text>
                      <Icon name="chevron-forward" size={14} color="#EC4899" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ============================================================== */}
        {/* TAB 3: EARNINGS & PAYOUTS                                       */}
        {/* ============================================================== */}
        {activeTab === 'earnings' && (
          <View>
            {/* Wallet Overview Card */}
            <LinearGradient
              colors={['#0F172A', '#1E293B', '#334155']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.earningsHeroCard}
            >
              <Text style={styles.earningsHeroLabel}>Total Available BD Commission</Text>
              <Text style={styles.earningsHeroAmount}>₹{bdStats.monthlyEarnings.toLocaleString()}</Text>

              <View style={styles.earningsHeroDivider} />

              <View style={styles.earningsBreakdownRow}>
                <View style={styles.earningsBreakdownCol}>
                  <Text style={styles.earningsSubLabel}>From Hired Agencies</Text>
                  <Text style={styles.earningsSubValue}>₹48,250</Text>
                </View>
                <View style={styles.earningsBreakdownCol}>
                  <Text style={styles.earningsSubLabel}>From Direct Hosts</Text>
                  <Text style={styles.earningsSubValue}>₹20,250</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.payoutBtn}
                onPress={() => setPayoutModalVisible(true)}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#22C55E', '#16A34A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.payoutBtnGradient}
                >
                  <MaterialIcons name="account-balance-wallet" size={18} color="#FFF" style={{ marginRight: 6 }} />
                  <Text style={styles.payoutBtnText}>Request Settlement / Payout</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>

            {/* Settlement History */}
            <Text style={styles.sectionHeaderTitle}>Recent Commission Settlements</Text>

            <View style={styles.settlementItem}>
              <View style={styles.settlementLeft}>
                <View style={[styles.settlementIconBox, { backgroundColor: '#DCFCE7' }]}>
                  <MaterialIcons name="check-circle" size={20} color="#16A34A" />
                </View>
                <View>
                  <Text style={styles.settlementTitle}>Weekly Agency Override Payout</Text>
                  <Text style={styles.settlementDate}>14 Feb 2026 • UPI Transfer</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.settlementAmount}>+₹28,500</Text>
                <Text style={styles.settlementSuccess}>Completed</Text>
              </View>
            </View>

            <View style={styles.settlementItem}>
              <View style={styles.settlementLeft}>
                <View style={[styles.settlementIconBox, { backgroundColor: '#DCFCE7' }]}>
                  <MaterialIcons name="check-circle" size={20} color="#16A34A" />
                </View>
                <View>
                  <Text style={styles.settlementTitle}>Direct Host Recruitment Bonus</Text>
                  <Text style={styles.settlementDate}>07 Feb 2026 • Bank Transfer</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.settlementAmount}>+₹14,000</Text>
                <Text style={styles.settlementSuccess}>Completed</Text>
              </View>
            </View>
          </View>
        )}

        {/* ============================================================== */}
        {/* TAB 4: BD POLICIES & SLABS                                      */}
        {/* ============================================================== */}
        {activeTab === 'policy' && (
          <View>
            <View style={styles.policyCard}>
              <Text style={styles.policyCardTitle}>BD Career Progression & Slabs</Text>
              <Text style={styles.policyCardDesc}>
                Higher tier BD partners receive higher agency volume cuts and direct creator bounties.
              </Text>

              <View style={styles.slabRow}>
                <View style={styles.slabLeft}>
                  <Text style={styles.slabTitle}>Tier 1: Associate BD</Text>
                  <Text style={styles.slabSub}>1 - 3 Agencies • 10+ Hosts</Text>
                </View>
                <View style={styles.slabRight}>
                  <Text style={styles.slabValue}>3.0%</Text>
                  <Text style={styles.slabSubLabel}>Agency Cut</Text>
                </View>
              </View>

              <View style={styles.slabRow}>
                <View style={styles.slabLeft}>
                  <Text style={[styles.slabTitle, { color: '#4F46E5' }]}>Tier 2: Senior BD Partner (Current)</Text>
                  <Text style={styles.slabSub}>4 - 10 Agencies • 25+ Hosts</Text>
                </View>
                <View style={styles.slabRight}>
                  <Text style={[styles.slabValue, { color: '#4F46E5' }]}>4.0%</Text>
                  <Text style={styles.slabSubLabel}>Agency Cut</Text>
                </View>
              </View>

              <View style={styles.slabRow}>
                <View style={styles.slabLeft}>
                  <Text style={[styles.slabTitle, { color: '#D97706' }]}>Tier 3: Regional BD Director</Text>
                  <Text style={styles.slabSub}>10+ Agencies • 100+ Hosts</Text>
                </View>
                <View style={styles.slabRight}>
                  <Text style={[styles.slabValue, { color: '#D97706' }]}>5.0% + Bonus</Text>
                  <Text style={styles.slabSubLabel}>Agency Cut</Text>
                </View>
              </View>
            </View>

            <View style={styles.policyCard}>
              <Text style={styles.policyCardTitle}>Key BD Rules & Ethics</Text>
              <Text style={styles.ruleItem}>• No poaching hosts from existing certified platform agencies.</Text>
              <Text style={styles.ruleItem}>• Direct host bonus is released once host completes 15 active calling hours.</Text>
              <Text style={styles.ruleItem}>• Payout settlements are processed every Tuesday and Friday.</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ============================================================== */}
      {/* MODAL: HIRE AGENCY                                              */}
      {/* ============================================================== */}
      <Modal
        visible={hireAgencyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setHireAgencyModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { paddingBottom: bottomSafePadding + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Onboard New Agency</Text>
              <TouchableOpacity onPress={() => setHireAgencyModalVisible(false)}>
                <Icon name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Agency Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Star Creators Media"
                placeholderTextColor="#94A3B8"
                value={agencyForm.name}
                onChangeText={(t) => setAgencyForm({ ...agencyForm, name: t })}
              />

              <Text style={styles.inputLabel}>Leader / Owner Full Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Rajesh Sharma"
                placeholderTextColor="#94A3B8"
                value={agencyForm.leaderName}
                onChangeText={(t) => setAgencyForm({ ...agencyForm, leaderName: t })}
              />

              <Text style={styles.inputLabel}>WhatsApp / Contact Number *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. +91 98765 43210"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                value={agencyForm.phone}
                onChangeText={(t) => setAgencyForm({ ...agencyForm, phone: t })}
              />

              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. contact@agency.com"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                value={agencyForm.email}
                onChangeText={(t) => setAgencyForm({ ...agencyForm, email: t })}
              />

              <Text style={styles.inputLabel}>Operating State / Region</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Delhi NCR, Maharashtra"
                placeholderTextColor="#94A3B8"
                value={agencyForm.state}
                onChangeText={(t) => setAgencyForm({ ...agencyForm, state: t })}
              />

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSubmitHireAgency}
                activeOpacity={0.85}
              >
                <LinearGradient colors={['#4F46E5', '#3730A3']} style={styles.modalSubmitGradient}>
                  <Text style={styles.modalSubmitText}>Register & Assign Agency Code</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL: HIRE HOST                                                */}
      {/* ============================================================== */}
      <Modal
        visible={hireHostModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setHireHostModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { paddingBottom: bottomSafePadding + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Onboard New Host</Text>
              <TouchableOpacity onPress={() => setHireHostModalVisible(false)}>
                <Icon name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Host Full Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Neha Verma"
                placeholderTextColor="#94A3B8"
                value={hostForm.name}
                onChangeText={(t) => setHostForm({ ...hostForm, name: t })}
              />

              <Text style={styles.inputLabel}>User ID or Registered Mobile *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 10000045 or 9876543210"
                placeholderTextColor="#94A3B8"
                value={hostForm.userIdOrPhone}
                onChangeText={(t) => setHostForm({ ...hostForm, userIdOrPhone: t })}
              />

              <Text style={styles.inputLabel}>Primary Languages</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Hindi, English, Punjabi"
                placeholderTextColor="#94A3B8"
                value={hostForm.language}
                onChangeText={(t) => setHostForm({ ...hostForm, language: t })}
              />

              <Text style={styles.inputLabel}>Daily Calling Target Commitment</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 2-3 Hours Daily"
                placeholderTextColor="#94A3B8"
                value={hostForm.dailyTargetHours}
                onChangeText={(t) => setHostForm({ ...hostForm, dailyTargetHours: t })}
              />

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSubmitHireHost}
                activeOpacity={0.85}
              >
                <LinearGradient colors={['#EC4899', '#BE185D']} style={styles.modalSubmitGradient}>
                  <Text style={styles.modalSubmitText}>Register Host Under BD</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL: PAYOUT SETTLEMENT                                        */}
      {/* ============================================================== */}
      <Modal
        visible={payoutModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPayoutModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { paddingBottom: bottomSafePadding + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request BD Payout</Text>
              <TouchableOpacity onPress={() => setPayoutModalVisible(false)}>
                <Icon name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Withdrawal Amount (₹) *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Minimum ₹500"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={payoutForm.amount}
                onChangeText={(t) => setPayoutForm({ ...payoutForm, amount: t })}
              />

              <Text style={styles.inputLabel}>UPI ID (Recommended)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. username@okhdfcbank"
                placeholderTextColor="#94A3B8"
                value={payoutForm.upiId}
                onChangeText={(t) => setPayoutForm({ ...payoutForm, upiId: t })}
              />

              <Text style={styles.orDividerText}>— OR BANK TRANSFER —</Text>

              <Text style={styles.inputLabel}>Account Holder Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Full Name as per Bank"
                placeholderTextColor="#94A3B8"
                value={payoutForm.accountHolder}
                onChangeText={(t) => setPayoutForm({ ...payoutForm, accountHolder: t })}
              />

              <Text style={styles.inputLabel}>Account Number</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Bank Account Number"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={payoutForm.accountNumber}
                onChangeText={(t) => setPayoutForm({ ...payoutForm, accountNumber: t })}
              />

              <Text style={styles.inputLabel}>IFSC Code</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. HDFC0001234"
                placeholderTextColor="#94A3B8"
                autoCapitalize="characters"
                value={payoutForm.ifsc}
                onChangeText={(t) => setPayoutForm({ ...payoutForm, ifsc: t.toUpperCase() })}
              />

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSubmitPayout}
                activeOpacity={0.85}
              >
                <LinearGradient colors={['#22C55E', '#16A34A']} style={styles.modalSubmitGradient}>
                  <Text style={styles.modalSubmitText}>Submit Payout Request</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerHero: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  navCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  helpBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  bdProfileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  bdAvatarBadge: {
    position: 'relative',
    marginRight: 14,
  },
  bdAvatarGradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedCheckBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  bdProfileInfo: {
    flex: 1,
  },
  bdNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  bdUserName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  tierChip: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tierChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  bdCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bdCodeLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  bdCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bdCodeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  metricsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  metricSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabItemActive: {
    backgroundColor: '#EEF2FF',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginLeft: 4,
  },
  tabTextActive: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
  },
  actionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  actionBannerLeft: {
    flex: 1,
    marginRight: 10,
  },
  actionBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  actionBannerSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 15,
  },
  hireBtn: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  hireBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  hireBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  shareBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  shareBoxTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  shareIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  shareTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  shareDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  shareActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  copyLinkBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    borderRadius: 8,
  },
  copyLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  shareLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  shareLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 10,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  cardItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFBEB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  cardCode: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusPillActive: {
    backgroundColor: '#DCFCE7',
  },
  statusPillReview: {
    backgroundColor: '#FEF3C7',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusPillTextActive: {
    color: '#15803D',
  },
  statusPillTextReview: {
    color: '#B45309',
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  cardStatsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  cardStatCol: {
    flex: 1,
    alignItems: 'center',
  },
  cardStatLabel: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 2,
  },
  cardStatVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  joinedDateText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  cardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
    marginRight: 2,
  },
  earningsHeroCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
  },
  earningsHeroLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  earningsHeroAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 4,
  },
  earningsHeroDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginVertical: 16,
  },
  earningsBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  earningsBreakdownCol: {
    flex: 1,
  },
  earningsSubLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 2,
  },
  earningsSubValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#38BDF8',
  },
  payoutBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  payoutBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  payoutBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  settlementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  settlementLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settlementIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  settlementTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  settlementDate: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  settlementAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#15803D',
  },
  settlementSuccess: {
    fontSize: 11,
    color: '#16A34A',
    fontWeight: '600',
  },
  policyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  policyCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  policyCardDesc: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
    lineHeight: 17,
  },
  slabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  slabLeft: {
    flex: 1,
  },
  slabTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  slabSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  slabRight: {
    alignItems: 'flex-end',
  },
  slabValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  slabSubLabel: {
    fontSize: 10,
    color: '#94A3B8',
  },
  ruleItem: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 6,
    lineHeight: 18,
  },
  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 8,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  orDividerText: {
    textAlign: 'center',
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '700',
    marginVertical: 14,
  },
  modalSubmitBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 20,
    marginBottom: 10,
  },
  modalSubmitGradient: {
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
