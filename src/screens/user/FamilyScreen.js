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

const DEFAULT_FAMILIES = [
  {
    _id: 'fam_1',
    name: 'Royal Tigers',
    badge: '🐅 TIGER',
    avatar: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=100&auto=format&fit=crop',
    slogan: 'Pride of Yaro voice rooms, ruling the top rank!',
    ranking: 1,
    diamondsEarned: 1540000,
    memberCount: 48,
    maxMembers: 50,
  },
  {
    _id: 'fam_2',
    name: 'Galaxy Warriors',
    badge: '🌌 GALAXY',
    avatar: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=100&auto=format&fit=crop',
    slogan: 'Aiming for the stars together.',
    ranking: 2,
    diamondsEarned: 890000,
    memberCount: 35,
    maxMembers: 50,
  },
  {
    _id: 'fam_3',
    name: 'Sweet Harmony',
    badge: '🌸 HARMONY',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop',
    slogan: 'Singing, chatting, and spreading love.',
    ranking: 3,
    diamondsEarned: 420000,
    memberCount: 28,
    maxMembers: 50,
  },
];

export default function FamilyScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState('ranking'); // 'ranking' | 'myFamily'
  const [families, setFamilies] = useState(DEFAULT_FAMILIES);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Create Family Modal
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [familyName, setFamilyName] = useState('');
  const [familyBadge, setFamilyBadge] = useState('');
  const [familySlogan, setFamilySlogan] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchFamilies = async () => {
    try {
      setLoading(true);
      const res = await apiUtil.get('/family', { suppressGlobalError: true });
      if (res?.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setFamilies(res.data.data);
      }
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFamilies();
  }, []);

  const handleJoinFamily = async (fam) => {
    try {
      await apiUtil.post(`/family/${fam._id}/join`, {}, { suppressGlobalError: true });
      AlertService.show('Joined Family', `Welcome to ${fam.name}!`, 'success');
      fetchFamilies();
    } catch (err) {
      AlertService.show('Notice', err?.message || `Application to join ${fam.name} sent to leader.`, 'info');
    }
  };

  const handleCreateFamily = async () => {
    if (!familyName.trim()) {
      AlertService.show('Error', 'Please enter a family name', 'error');
      return;
    }
    setCreating(true);
    try {
      await apiUtil.post('/family/create', {
        name: familyName.trim(),
        badge: familyBadge.trim() || '👑 CLAN',
        slogan: familySlogan.trim(),
      });
      setCreateModalVisible(false);
      setFamilyName('');
      setFamilyBadge('');
      setFamilySlogan('');
      AlertService.show('Success', 'Your Family has been established!', 'success');
      fetchFamilies();
    } catch (err) {
      AlertService.show('Error', err?.message || 'Failed to create family', 'error');
    } finally {
      setCreating(false);
    }
  };

  const filteredFamilies = families.filter(
    (f) =>
      !searchQuery ||
      f.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.badge?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Hero Header */}
      <LinearGradient
        colors={['#1E1B4B', '#312E81', '#4338CA']}
        style={[styles.header, { paddingTop: getAppTopSafeInset(insets.top) + 8 }]}
      >
        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Icon name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Family Guilds</Text>
          <TouchableOpacity
            onPress={() => setCreateModalVisible(true)}
            style={styles.createPillBtn}
          >
            <Icon name="add" size={16} color="#FFFFFF" />
            <Text style={styles.createPillText}>Create</Text>
          </TouchableOpacity>
        </View>

        {/* Top Banner */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerInfo}>
            <Text style={styles.bannerBadge}>CLAN WARS & HONOR</Text>
            <Text style={styles.bannerHeading}>Unite Under One Banner</Text>
            <Text style={styles.bannerSub}>
              Earn shared family badges, unlock group diamond bonuses, and dominate room battles.
            </Text>
          </View>
          <MaterialCommunityIcons name="shield-crown" size={60} color="#FBBF24" />
        </View>

        {/* Tab switch */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            onPress={() => setActiveTab('ranking')}
            style={[styles.tabBtn, activeTab === 'ranking' && styles.tabBtnActive]}
          >
            <Text style={[styles.tabBtnText, activeTab === 'ranking' && styles.tabBtnTextActive]}>
              🏆 Clan Leaderboard
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('myFamily')}
            style={[styles.tabBtn, activeTab === 'myFamily' && styles.tabBtnActive]}
          >
            <Text style={[styles.tabBtnText, activeTab === 'myFamily' && styles.tabBtnTextActive]}>
              🛡️ My Family
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === 'ranking' && (
          <View>
            {/* Search Input */}
            <View style={styles.searchBar}>
              <Icon name="search" size={18} color="#94A3B8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search families by name or badge..."
                placeholderTextColor="#64748B"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {loading ? (
              <ActivityIndicator size="large" color="#6366F1" style={{ marginTop: 40 }} />
            ) : (
              filteredFamilies.map((fam, idx) => (
                <View key={fam._id || idx} style={styles.familyCard}>
                  <View style={styles.rankPill}>
                    <Text style={styles.rankText}>#{fam.ranking || idx + 1}</Text>
                  </View>

                  <Image
                    source={{
                      uri:
                        fam.avatar ||
                        'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=100&auto=format&fit=crop',
                    }}
                    style={styles.famAvatar}
                  />

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.famName}>{fam.name}</Text>
                      <View style={styles.badgePill}>
                        <Text style={styles.badgePillText}>{fam.badge}</Text>
                      </View>
                    </View>
                    <Text style={styles.famSlogan} numberOfLines={1}>
                      {fam.slogan || 'Loyal brothers and sisters of Yaro.'}
                    </Text>
                    <View style={styles.famStatsRow}>
                      <Text style={styles.famMembers}>
                        👥 {fam.memberCount || 1}/{fam.maxMembers || 50}
                      </Text>
                      <Text style={styles.famDiamonds}>
                        💎 {(fam.diamondsEarned || 0).toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleJoinFamily(fam)}
                    style={styles.joinBtn}
                  >
                    <Text style={styles.joinBtnText}>Join</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'myFamily' && (
          <View style={styles.myFamilyEmptyContainer}>
            <MaterialCommunityIcons name="shield-account-outline" size={80} color="#6366F1" />
            <Text style={styles.emptyTitle}>You Haven't Joined a Family Yet</Text>
            <Text style={styles.emptySubtitle}>
              Join an existing clan from the leaderboard or create your own sovereign family to lead members to glory.
            </Text>
            <TouchableOpacity
              onPress={() => setCreateModalVisible(true)}
              style={styles.establishBtn}
            >
              <Text style={styles.establishBtnText}>Establish a Family</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Create Modal */}
      <Modal
        visible={createModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Establish New Family</Text>
            <Text style={styles.modalSub}>
              Create your family clan and invite other voice chat friends.
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Family Name (e.g. Royal Tigers)"
              placeholderTextColor="#64748B"
              value={familyName}
              onChangeText={setFamilyName}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Badge Tag (e.g. 👑 TIGER)"
              placeholderTextColor="#64748B"
              value={familyBadge}
              onChangeText={setFamilyBadge}
            />

            <TextInput
              style={[styles.modalInput, { height: 70, textAlignVertical: 'top' }]}
              placeholder="Family Motto / Slogan"
              placeholderTextColor="#64748B"
              multiline
              value={familySlogan}
              onChangeText={setFamilySlogan}
            />

            <View style={styles.modalBtnsRow}>
              <TouchableOpacity
                onPress={() => setCreateModalVisible(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateFamily}
                disabled={creating}
                style={styles.modalSubmitBtn}
              >
                {creating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitText}>Create Clan</Text>
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
  createPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  createPillText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: 16,
    marginTop: 16,
  },
  bannerInfo: { flex: 1, paddingRight: 10 },
  bannerBadge: { color: '#FBBF24', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  bannerHeading: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginTop: 4 },
  bannerSub: { color: '#CBD5E1', fontSize: 11, marginTop: 4, lineHeight: 16 },
  tabsRow: { flexDirection: 'row', marginTop: 16, gap: 10 },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  tabBtnActive: { backgroundColor: '#4F46E5' },
  tabBtnText: { color: '#94A3B8', fontSize: 12, fontWeight: 'bold' },
  tabBtnTextActive: { color: '#FFFFFF' },
  scrollContent: { padding: 16 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchInput: { flex: 1, color: '#FFFFFF', fontSize: 13, height: 42, marginLeft: 8 },
  familyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131B2E',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  rankPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(99,102,241,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: { color: '#818CF8', fontSize: 11, fontWeight: 'bold' },
  famAvatar: { width: 48, height: 48, borderRadius: 24, marginLeft: 10 },
  famName: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  badgePill: {
    backgroundColor: 'rgba(245,158,11,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgePillText: { color: '#F59E0B', fontSize: 9, fontWeight: 'bold' },
  famSlogan: { color: '#94A3B8', fontSize: 11, marginTop: 2 },
  famStatsRow: { flexDirection: 'row', gap: 14, marginTop: 4 },
  famMembers: { color: '#38BDF8', fontSize: 10, fontWeight: '600' },
  famDiamonds: { color: '#F59E0B', fontSize: 10, fontWeight: 'bold' },
  joinBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
  },
  joinBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  myFamilyEmptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 24 },
  emptyTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginTop: 16 },
  emptySubtitle: { color: '#94A3B8', fontSize: 12, textAlign: 'center', marginTop: 8, lineHeight: 18 },
  establishBtn: { backgroundColor: '#4F46E5', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16, marginTop: 24 },
  establishBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalBox: { backgroundColor: '#1E293B', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#334155' },
  modalTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  modalSub: { color: '#94A3B8', fontSize: 12, marginTop: 4, marginBottom: 16 },
  modalInput: { backgroundColor: '#0F172A', borderRadius: 12, paddingHorizontal: 14, color: '#FFFFFF', fontSize: 13, height: 46, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  modalBtnsRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#334155', alignItems: 'center' },
  modalCancelText: { color: '#CBD5E1', fontSize: 13, fontWeight: 'bold' },
  modalSubmitBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#4F46E5', alignItems: 'center' },
  modalSubmitText: { color: '#FFFFFF', fontSize: 13, fontWeight: 'bold' },
});
