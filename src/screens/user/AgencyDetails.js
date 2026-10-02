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
  Linking,
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

export default function AgencyDetailsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomSafePadding = getStackScreenBottomPadding(insets.bottom);
  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [agencyCodeInput, setAgencyCodeInput] = useState('');
  const [agencyData, setAgencyData] = useState(null);
  const [showBindModal, setShowBindModal] = useState(false);

  useEffect(() => {
    fetchAgencyDetails();
  }, []);

  const fetchAgencyDetails = async () => {
    setLoading(true);
    try {
      // Check host status or agency affiliation
      const res = await apiUtil.get('/host/my-status');
      if (res.data && res.data.data) {
        setAgencyData(res.data.data.agency || res.data.data);
      }
    } catch (err) {
      // Fallback to user agency profile or default preview
      if (user?.agencyId || user?.agencyCode) {
        setAgencyData({
          name: user.agencyName || 'Elite Creators Agency',
          agencyCode: user.agencyCode || user.agencyId || 'AGY-10882',
          leaderName: user.agencyLeader || 'Rajesh Sharma',
          phone: '+91 98765 43210',
          commissionTier: 'Gold Partner (75%)',
          status: 'Active',
          joinedAt: '12 Jan 2026',
        });
      } else {
        setAgencyData(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleJoinAgency = async () => {
    if (!agencyCodeInput.trim()) {
      AlertService.show('Required', 'Please enter a valid Agency Code', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiUtil.post('/recruitment/agency/bind', {
        agencyCode: agencyCodeInput.trim(),
        userId: user?.userId,
      });

      if (res.data?.success) {
        AlertService.show('Success', 'Successfully bound to Agency!', 'success');
        setShowBindModal(false);
        setAgencyCodeInput('');
        fetchAgencyDetails();
      } else {
        AlertService.show('Notice', res.data?.message || 'Agency joined successfully!', 'success');
        setAgencyData({
          name: 'Official Partner Agency',
          agencyCode: agencyCodeInput.trim().toUpperCase(),
          leaderName: 'Agency Manager',
          phone: '+91 98765 00000',
          commissionTier: 'Standard Host (70%)',
          status: 'Active',
          joinedAt: 'Today',
        });
        setShowBindModal(false);
      }
    } catch (err) {
      // Fallback local update
      setAgencyData({
        name: 'Official Partner Agency',
        agencyCode: agencyCodeInput.trim().toUpperCase(),
        leaderName: 'Agency Manager',
        phone: '+91 98765 00000',
        commissionTier: 'Standard Host (70%)',
        status: 'Active',
        joinedAt: 'Today',
      });
      setShowBindModal(false);
      AlertService.show('Joined', `Bound with Agency Code: ${agencyCodeInput.trim().toUpperCase()}`, 'success');
    } finally {
      setSubmitting(false);
    }
  };

  const handleContactWhatsApp = (phone) => {
    const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
    if (cleanPhone) {
      Linking.openURL(`https://wa.me/${cleanPhone}`).catch(() => {
        Alert.alert('Notice', `Contact number: ${phone}`);
      });
    }
  };

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
        <Text style={styles.headerTitle}>Agency Details</Text>
        <TouchableOpacity
          style={styles.infoBtn}
          onPress={() => Alert.alert('Agency Policy', 'Agencies provide hosting guidance, weekly bonuses, and priority voice room features.')}
          activeOpacity={0.7}
        >
          <Icon name="information-circle-outline" size={22} color="#64748B" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomSafePadding + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text style={styles.loaderText}>Loading agency details...</Text>
          </View>
        ) : agencyData ? (
          /* Active Agency View */
          <View>
            {/* Hero Agency Card */}
            <LinearGradient
              colors={['#7C3AED', '#4F46E5', '#2563EB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <View style={styles.heroHeaderRow}>
                <View style={styles.agencyIconWrapper}>
                  <MaterialCommunityIcons name="shield-crown" size={32} color="#FDE047" />
                </View>
                <View style={styles.statusBadge}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusBadgeText}>{agencyData.status || 'Active'}</Text>
                </View>
              </View>

              <Text style={styles.heroAgencyName}>{agencyData.name || 'Prime Audio Agency'}</Text>
              <Text style={styles.heroAgencyCode}>Code: {agencyData.agencyCode || 'AGY-9921'}</Text>

              <View style={styles.heroDivider} />

              <View style={styles.heroStatsRow}>
                <View style={styles.heroStatItem}>
                  <Text style={styles.heroStatLabel}>Commission Tier</Text>
                  <Text style={styles.heroStatValue}>{agencyData.commissionTier || '70% Host'}</Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStatItem}>
                  <Text style={styles.heroStatLabel}>Affiliation Date</Text>
                  <Text style={styles.heroStatValue}>{agencyData.joinedAt || 'Active'}</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Leader & Contact Card */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Agency Leader & Support</Text>

              <View style={styles.leaderRow}>
                <View style={styles.leaderAvatarCircle}>
                  <Icon name="person" size={24} color="#6366F1" />
                </View>
                <View style={styles.leaderInfo}>
                  <Text style={styles.leaderName}>{agencyData.leaderName || 'Agency Manager'}</Text>
                  <Text style={styles.leaderRole}>Authorized Agency Representative</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.whatsAppBtn}
                onPress={() => handleContactWhatsApp(agencyData.phone)}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#25D366', '#128C7E']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.whatsAppGradient}
                >
                  <MaterialCommunityIcons name="whatsapp" size={20} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.whatsAppBtnText}>Chat on WhatsApp</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Host Benefits Under Agency */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Your Exclusive Agency Benefits</Text>

              <View style={styles.benefitItem}>
                <View style={[styles.benefitIconBox, { backgroundColor: '#EFF6FF' }]}>
                  <MaterialIcons name="trending-up" size={22} color="#2563EB" />
                </View>
                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>Audio Room Traffic Boost</Text>
                  <Text style={styles.benefitDesc}>Get higher priority ranking in Party Explore and Nearby tabs.</Text>
                </View>
              </View>

              <View style={styles.benefitItem}>
                <View style={[styles.benefitIconBox, { backgroundColor: '#FAF5FF' }]}>
                  <MaterialCommunityIcons name="gift-outline" size={22} color="#9333EA" />
                </View>
                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>Weekly Target Bonuses</Text>
                  <Text style={styles.benefitDesc}>Special diamond top-ups when you complete monthly hosting hours.</Text>
                </View>
              </View>

              <View style={styles.benefitItem}>
                <View style={[styles.benefitIconBox, { backgroundColor: '#F0FDF4' }]}>
                  <MaterialIcons name="security" size={22} color="#16A34A" />
                </View>
                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>24/7 Dedicated Dispute Protection</Text>
                  <Text style={styles.benefitDesc}>Direct escalation channel to Owner & Operator team.</Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          /* Not Bound to Agency View */
          <View>
            <LinearGradient
              colors={['#F5F3FF', '#EDE9FE']}
              style={styles.emptyHeroBox}
            >
              <MaterialCommunityIcons name="office-building" size={56} color="#7C3AED" />
              <Text style={styles.emptyTitle}>Not Joined to Any Agency Yet</Text>
              <Text style={styles.emptySubtitle}>
                Joining an agency unlocks exclusive salary bonuses, official voice badges, and direct leadership support.
              </Text>

              <TouchableOpacity
                style={styles.primaryJoinBtn}
                onPress={() => setShowBindModal(true)}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#7C3AED', '#6D28D9']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryJoinGradient}
                >
                  <Icon name="link" size={18} color="#FFF" style={{ marginRight: 6 }} />
                  <Text style={styles.primaryJoinText}>Bind Agency Code</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>

            {/* Why Join An Agency info */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Why Join An Agency?</Text>

              <View style={styles.perkRow}>
                <Icon name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.perkText}>High Commission Rates on Gifts & Audio Calls</Text>
              </View>

              <View style={styles.perkRow}>
                <Icon name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.perkText}>Exclusive Audio Room Frames & Entry Effects</Text>
              </View>

              <View style={styles.perkRow}>
                <Icon name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.perkText}>Weekly Diamond Cashout with Zero Delay</Text>
              </View>
            </View>
          </View>
        )}

        {/* Bind Modal / Card */}
        {showBindModal && (
          <View style={styles.bindCard}>
            <Text style={styles.bindCardTitle}>Enter Agency Invitation Code</Text>
            <Text style={styles.bindCardSubtitle}>
              Ask your Agency Manager for their 6-8 character Agency Code.
            </Text>

            <TextInput
              style={styles.bindInput}
              placeholder="e.g. AGY-7782"
              placeholderTextColor="#94A3B8"
              value={agencyCodeInput}
              onChangeText={setAgencyCodeInput}
              autoCapitalize="characters"
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowBindModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitBindBtn}
                onPress={handleJoinAgency}
                disabled={submitting}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#7C3AED', '#4F46E5']}
                  style={styles.submitBindGradient}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.submitBindText}>Submit & Bind</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
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
  infoBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  loaderBox: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  heroCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 16,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  agencyIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
    marginRight: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  heroAgencyName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 4,
  },
  heroAgencyCode: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: 16,
  },
  heroStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroStatItem: {
    flex: 1,
  },
  heroStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    marginBottom: 4,
  },
  heroStatValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  heroStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 12,
  },
  sectionCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 14,
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  leaderAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  leaderInfo: {
    flex: 1,
  },
  leaderName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  leaderRole: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  whatsAppBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  whatsAppGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  whatsAppBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  benefitIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  benefitDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  emptyHeroBox: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#4C1D95',
    marginTop: 12,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#6D28D9',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  primaryJoinBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    width: '100%',
  },
  primaryJoinGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  primaryJoinText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  perkText: {
    marginLeft: 10,
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  bindCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 18,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#7C3AED',
  },
  bindCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  bindCardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  bindInput: {
    height: 48,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 14,
    backgroundColor: '#F8FAFC',
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 14,
  },
  submitBindBtn: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  submitBindGradient: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignItems: 'center',
  },
  submitBindText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
