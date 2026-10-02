import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, StyleSheet, Text, TouchableOpacity, View,
  View as ScreenBackgroundView,
  StatusBar as ScreenBackgroundStatusBar,
  StyleSheet as ScreenBackgroundStyleSheet
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ScreenBackgroundGradient from 'react-native-linear-gradient';
import AnimatedTitleLine from '../../components/AnimatedTitleLine';
import { apiUtil } from '../../utils/apiUtil';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';

const colorFor = status => status === 'APPROVED' ? '#10B981' : status === 'REJECTED' ? '#EF4444' : status === 'NOT_SUBMITTED' ? '#94A3B8' : '#F59E0B';
const Card = ({ title, description, status, icon, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    <View style={styles.icon}><Icon name={icon} size={28} color="#4F46E5" /></View>
    <View style={styles.copy}>
      <Text style={styles.title}>{title}</Text><Text style={styles.description}>{description}</Text>
      <Text style={[styles.status, { color: colorFor(status) }]}>{String(status || 'NOT_SUBMITTED').replace(/_/g, ' ')}</Text>
    </View>
    <Icon name="chevron-right" size={26} color="#94A3B8" />
  </TouchableOpacity>
);

export default function VerificationHub() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 40);
  const [loading, setLoading] = useState(true);
  const [face, setFace] = useState('NOT_SUBMITTED');
  const [kyc, setKyc] = useState('NOT_SUBMITTED');
  const load = useCallback(async () => {
    try {
      const [faceResult, kycResult] = await Promise.all([
        apiUtil.get('/v1/verifications/face/me'), apiUtil.get('/v1/verifications/kyc/me'),
      ]);
      setFace(faceResult.data?.data?.status || 'NOT_SUBMITTED');
      setKyc(kycResult.data?.data?.overallStatus || 'NOT_SUBMITTED');
    } finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));
  return (
    <ScreenBackgroundView style={[{ flex: 1, backgroundColor: '#F8FAFC' }]}>
      <ScreenBackgroundStatusBar translucent backgroundColor="transparent" barStyle="dark-content" animated />
      <ScreenBackgroundGradient colors={['#F8FAFC', '#F1F5F9', '#E2E8F0']} style={ScreenBackgroundStyleSheet.absoluteFillObject} />
      <View style={[styles.header, { paddingTop: topSafeInset + 8 }]}><TouchableOpacity onPress={() => navigation.goBack()}><Icon name="arrow-back" size={26} color="#1E293B" /></TouchableOpacity><Text style={styles.headerTitle}>Verification</Text><View style={styles.gap} /></View>
      <AnimatedTitleLine />
      {loading ? <ActivityIndicator style={styles.loader} color="#6366F1" size="large" /> : <View style={[styles.content, { paddingBottom: bottomPadding }]}>
        <Text style={styles.heading}>Manual verification</Text>
        <Text style={styles.subheading}>Face and KYC are reviewed separately by authorised administrators. No automatic Aadhaar face authentication is used.</Text>
        <Card title="Face Verification" description="Submit only a fresh live selfie." status={face} icon="face" onPress={() => navigation.navigate('FaceVerification')} />
        <Card title="KYC Verification" description="Submit identity, documents and applicable bank details." status={kyc} icon="badge" onPress={() => navigation.navigate('Kyc')} />
      </View>}
    </ScreenBackgroundView>
  );
}
const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18 },
  headerTitle: { color: '#0F172A', fontSize: 20, fontWeight: '800' },
  gap: { width: 26 },
  loader: { marginTop: 80 },
  content: { padding: 20 },
  heading: { color: '#0F172A', fontSize: 22, fontWeight: '900' },
  subheading: { color: '#64748B', lineHeight: 20, marginTop: 8, marginBottom: 22 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 20,
    marginBottom: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  icon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEF2FF' },
  copy: { flex: 1, marginHorizontal: 14 },
  title: { color: '#0F172A', fontSize: 16, fontWeight: '800' },
  description: { color: '#64748B', fontSize: 12, marginTop: 4 },
  status: { marginTop: 8, fontSize: 11, fontWeight: '900' },
});
