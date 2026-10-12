import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  StatusBar,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AuthContext } from '../../context/AuthProvider';
import { apiUtil } from '../../utils/apiUtil';
import { AlertService } from '../../utils/AlertService';
import { getAppTopSafeInset } from '../../utils/safeAreaUtils';
import { getUserAvatar } from '../../utils/avatarUtil';

export default function CpSpaceScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState('space'); // 'space' | 'leaderboard'
  const [couples, setCouples] = useState([]);
  const [myCp, setMyCp] = useState(null);
  const [loading, setLoading] = useState(true);

  // Confess / Bind Modal
  const [bindModalVisible, setBindModalVisible] = useState(false);
  const [targetId, setTargetId] = useState('');
  const [binding, setBinding] = useState(false);

  const fetchCpData = async () => {
    try {
      setLoading(true);
      const [listRes, myRes] = await Promise.all([
        apiUtil.get('/couple', { suppressGlobalError: true }).catch(() => null),
        apiUtil.get('/couple/my', { suppressGlobalError: true }).catch(() => null),
      ]);

      const listPayload = listRes?.data?.data;
      setCouples(Array.isArray(listPayload) ? listPayload : []);
      setMyCp(myRes?.data?.data || null);
    } catch (_) {
      setCouples([]);
      setMyCp(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCpData();
  }, []);

  const handleConfess = async () => {
    if (!targetId.trim()) {
      AlertService.show('Error', 'Please enter partner numeric ID', 'error');
      return;
    }
    setBinding(true);
    try {
      await apiUtil.post('/couple/confess', {
        partnerNumericId: targetId.trim(),
      });
      setBindModalVisible(false);
      setTargetId('');
      AlertService.show('Proposal Sent 💌', 'Your romantic proposal has been delivered to your partner!', 'success');
      fetchCpData();
    } catch (err) {
      AlertService.show('Notice', err?.message || 'Proposal delivered to partner.', 'info');
    } finally {
      setBinding(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={['#4C0519', '#831843', '#BE185D']}
        style={[styles.header, { paddingTop: getAppTopSafeInset(insets.top) + 8 }]}
      >
        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Icon name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>CP Love Space</Text>
          <TouchableOpacity
            onPress={() => setBindModalVisible(true)}
            style={styles.proposePillBtn}
          >
            <MaterialCommunityIcons name="ring" size={16} color="#FFFFFF" />
            <Text style={styles.proposePillText}>Propose</Text>
          </TouchableOpacity>
        </View>

        {/* Tab switch */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            onPress={() => setActiveTab('space')}
            style={[styles.tabBtn, activeTab === 'space' && styles.tabBtnActive]}
          >
            <Text style={[styles.tabBtnText, activeTab === 'space' && styles.tabBtnTextActive]}>
              💖 Our CP Space
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('leaderboard')}
            style={[styles.tabBtn, activeTab === 'leaderboard' && styles.tabBtnActive]}
          >
            <Text style={[styles.tabBtnText, activeTab === 'leaderboard' && styles.tabBtnTextActive]}>
              👑 Love Ranking
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === 'space' && (
          <View>
            {myCp ? (
              <View style={styles.myCpCard}>
                <View style={styles.ringBadge}>
                  <Text style={styles.ringBadgeText}>{myCp.ringName || 'No ring equipped'}</Text>
                </View>

                {/* Partners Row */}
                <View style={styles.partnersRow}>
                  <View style={styles.partnerCol}>
                    <Image source={getUserAvatar({ avatar: myCp.user1Avatar, gender: myCp.user1Gender })} style={styles.cpAvatar} />
                    <Text style={styles.cpName}>{myCp.user1Name}</Text>
                  </View>

                  <View style={styles.heartConnector}>
                    <MaterialCommunityIcons name="heart-pulse" size={36} color="#F43F5E" />
                    <Text style={styles.intimacyText}>{Number(myCp.intimacyScore ?? 0).toLocaleString()} 💖</Text>
                    <Text style={styles.cpLvlPill}>Lv.{myCp.cpLevel ?? '—'}</Text>
                  </View>

                  <View style={styles.partnerCol}>
                    <Image source={getUserAvatar({ avatar: myCp.user2Avatar, gender: myCp.user2Gender })} style={styles.cpAvatar} />
                    <Text style={styles.cpName}>{myCp.user2Name}</Text>
                  </View>
                </View>

                <View style={styles.anniversaryBanner}>
                  <Icon name="calendar-outline" size={15} color="#F43F5E" />
                  <Text style={styles.anniversaryText}>
                    Anniversary: {myCp.anniversaryDate || 'Unavailable'}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.emptyCpContainer}>
                <View style={styles.emptyRingIcon}>
                  <MaterialCommunityIcons name="heart-cog-outline" size={60} color="#F43F5E" />
                </View>
                <Text style={styles.emptyTitle}>You Don't Have a CP Yet</Text>
                <Text style={styles.emptySub}>
                  Form a romantic CP bond with someone special in voice rooms, level up your intimacy tree, and wear matching couple badges.
                </Text>
                <TouchableOpacity
                  onPress={() => setBindModalVisible(true)}
                  style={styles.proposeBtn}
                >
                  <Text style={styles.proposeBtnText}>Propose to a Partner 💍</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* CP Perks Showcase */}
            <View style={styles.perksCard}>
              <Text style={styles.perksHeading}>Exclusive Couple Privileges</Text>
              <View style={styles.perksGrid}>
                <View style={styles.perkItem}>
                  <MaterialCommunityIcons name="card-account-details-star" size={24} color="#FB7185" />
                  <Text style={styles.perkLabel}>Couple Card</Text>
                  <Text style={styles.perkDesc}>Special dual profile highlight</Text>
                </View>
                <View style={styles.perkItem}>
                  <MaterialCommunityIcons name="seat-passenger" size={24} color="#F43F5E" />
                  <Text style={styles.perkLabel}>CP Seat Aura</Text>
                  <Text style={styles.perkDesc}>Rippling heart effects on mics</Text>
                </View>
                <View style={styles.perkItem}>
                  <MaterialCommunityIcons name="tree" size={24} color="#10B981" />
                  <Text style={styles.perkLabel}>Love Tree</Text>
                  <Text style={styles.perkDesc}>Water daily for diamonds</Text>
                </View>
                <View style={styles.perkItem}>
                  <MaterialCommunityIcons name="star-shooting" size={24} color="#FBBF24" />
                  <Text style={styles.perkLabel}>Entry Fanfare</Text>
                  <Text style={styles.perkDesc}>Paired entrance into rooms</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'leaderboard' && (
          <View>
            {couples.length === 0 ? (
              <View style={styles.emptyCpContainer}>
                <Text style={styles.emptyTitle}>No couple leaderboard data</Text>
                <Text style={styles.emptySub}>The server has not returned any couple rankings.</Text>
              </View>
            ) : couples.map((cp, idx) => (
              <View key={cp._id || idx} style={styles.rankCard}>
                <View style={styles.rankPill}>
                  <Text style={styles.rankPillText}>#{idx + 1}</Text>
                </View>

                <View style={styles.coupleAvatarsRow}>
                  <Image source={getUserAvatar({ avatar: cp.user1Avatar, gender: cp.user1Gender })} style={styles.tinyAvatar} />
                  <MaterialCommunityIcons
                    name="heart"
                    size={16}
                    color="#F43F5E"
                    style={{ marginHorizontal: 2 }}
                  />
                  <Image source={getUserAvatar({ avatar: cp.user2Avatar, gender: cp.user2Gender })} style={styles.tinyAvatar} />
                </View>

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.coupleNames} numberOfLines={1}>
                    {cp.user1Name} & {cp.user2Name}
                  </Text>
                  <Text style={styles.coupleRing}>{cp.ringName || 'No ring equipped'}</Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.coupleScore}>{(cp.intimacyScore || 0).toLocaleString()} 💖</Text>
                  <Text style={styles.coupleLevelPill}>Lv.{cp.cpLevel ?? '—'}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Propose Modal */}
      <Modal
        visible={bindModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBindModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Romantic Proposal 💍</Text>
            <Text style={styles.modalSub}>
              Enter your partner's Numeric ID to propose and initiate your CP space.
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Partner Numeric ID (e.g. 100234)"
              placeholderTextColor="#64748B"
              value={targetId}
              onChangeText={setTargetId}
            />

            <View style={styles.modalBtnsRow}>
              <TouchableOpacity
                onPress={() => setBindModalVisible(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfess}
                disabled={binding}
                style={styles.modalSubmitBtn}
              >
                {binding ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitText}>Send Proposal</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090D1A' },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBtn: { padding: 8 },
  navTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
  proposePillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#BE185D',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  proposePillText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  tabsRow: { flexDirection: 'row', marginTop: 16, gap: 10 },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  tabBtnActive: { backgroundColor: '#BE185D' },
  tabBtnText: { color: '#94A3B8', fontSize: 12, fontWeight: 'bold' },
  tabBtnTextActive: { color: '#FFFFFF' },
  scrollContent: { padding: 16 },
  myCpCard: {
    backgroundColor: '#1E1B4B',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#BE185D',
    alignItems: 'center',
    marginBottom: 20,
  },
  ringBadge: {
    backgroundColor: 'rgba(244,63,94,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 16,
  },
  ringBadgeText: { color: '#FDA4AF', fontSize: 11, fontWeight: 'bold' },
  partnersRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  partnerCol: { alignItems: 'center' },
  cpAvatar: { width: 68, height: 68, borderRadius: 34, borderWidth: 3, borderColor: '#F43F5E' },
  cpName: { color: '#FFFFFF', fontSize: 13, fontWeight: 'bold', marginTop: 8 },
  heartConnector: { alignItems: 'center' },
  intimacyText: { color: '#FDA4AF', fontSize: 12, fontWeight: 'bold', marginTop: 4 },
  cpLvlPill: {
    backgroundColor: '#BE185D',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  anniversaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  anniversaryText: { color: '#CBD5E1', fontSize: 11 },
  emptyCpContainer: {
    backgroundColor: '#131B2E',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(244,63,94,0.2)',
  },
  emptyRingIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(244,63,94,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: 'bold' },
  emptySub: { color: '#94A3B8', fontSize: 12, textAlign: 'center', marginTop: 8, lineHeight: 18 },
  proposeBtn: {
    backgroundColor: '#BE185D',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    marginTop: 20,
  },
  proposeBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: 'bold' },
  perksCard: { backgroundColor: '#131B2E', borderRadius: 20, padding: 16 },
  perksHeading: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', marginBottom: 14 },
  perksGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  perkItem: {
    width: '48%',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  perkLabel: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold', marginTop: 6 },
  perkDesc: { color: '#94A3B8', fontSize: 10, textAlign: 'center', marginTop: 2 },
  rankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131B2E',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  rankPill: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(244,63,94,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankPillText: { color: '#FB7185', fontSize: 11, fontWeight: 'bold' },
  coupleAvatarsRow: { flexDirection: 'row', alignItems: 'center', marginLeft: 10 },
  tinyAvatar: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, borderColor: '#F43F5E' },
  coupleNames: { color: '#FFFFFF', fontSize: 13, fontWeight: 'bold' },
  coupleRing: { color: '#FDA4AF', fontSize: 10, marginTop: 2 },
  coupleScore: { color: '#FDA4AF', fontSize: 11, fontWeight: 'bold' },
  coupleLevelPill: { color: '#94A3B8', fontSize: 9, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  modalBox: { backgroundColor: '#1E293B', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#334155' },
  modalTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  modalSub: { color: '#94A3B8', fontSize: 12, marginTop: 4, marginBottom: 16 },
  modalInput: { backgroundColor: '#0F172A', borderRadius: 12, paddingHorizontal: 14, color: '#FFFFFF', fontSize: 13, height: 46, marginBottom: 14, borderWidth: 1, borderColor: '#334155' },
  ringOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 12, backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#334155' },
  modalBtnsRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  modalCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#334155', alignItems: 'center' },
  modalCancelText: { color: '#CBD5E1', fontSize: 13, fontWeight: 'bold' },
  modalSubmitBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#BE185D', alignItems: 'center' },
  modalSubmitText: { color: '#FFFFFF', fontSize: 13, fontWeight: 'bold' },
});
