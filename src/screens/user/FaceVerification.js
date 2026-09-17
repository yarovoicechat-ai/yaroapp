import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, Image, Linking, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
  View as ScreenBackgroundView,
  StatusBar as ScreenBackgroundStatusBar,
  StyleSheet as ScreenBackgroundStyleSheet
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ScreenBackgroundGradient from 'react-native-linear-gradient';
import AnimatedTitleLine from '../../components/AnimatedTitleLine';
import { apiUtil, getApiErrorMessage } from '../../utils/apiUtil';
import { AlertService } from '../../utils/AlertService';
import { appendFile, requestCameraAndCapture } from '../../utils/verificationMedia';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';

const copy = {
  NOT_SUBMITTED: ['Not submitted', 'Capture a live selfie to start manual verification.'],
  PENDING: ['Pending review', 'Your selfie is waiting for an admin to review it.'],
  UNDER_REVIEW: ['Under review', 'An admin is manually reviewing your selfie.'],
  APPROVED: ['Face verified', 'Your face verification has been approved.'],
  REJECTED: ['Verification rejected', 'Review the reason below and submit a fresh selfie.'],
  RESUBMISSION_REQUIRED: ['New selfie required', 'Please follow the admin instructions and capture a new selfie.'],
  CANCELLED: ['Request cancelled', 'You can submit a new live selfie.'],
};

export default function FaceVerification() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 40);
  const [status, setStatus] = useState({ status: 'NOT_SUBMITTED' });
  const [selfie, setSelfie] = useState(null);
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const response = await apiUtil.get('/v1/verifications/face/me');
      setStatus(response.data?.data || { status: 'NOT_SUBMITTED' });
    } catch (error) {
      AlertService.show('Unable to load', getApiErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  }, []);
  useFocusEffect(useCallback(() => { setLoading(true); loadStatus(); }, [loadStatus]));

  const capture = async () => {
    try {
      const image = await requestCameraAndCapture('front');
      if (image) setSelfie(image);
    } catch (error) {
      AlertService.show('Camera', error.message, 'error', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open settings', onPress: () => Linking.openSettings() },
      ]);
    }
  };

  const submit = async () => {
    if (!selfie) return AlertService.show('Live selfie required', 'Capture your face using the front camera.', 'error');
    if (!consent) return AlertService.show('Consent required', 'Please confirm the verification consent.', 'error');
    try {
      setSubmitting(true);
      const body = new FormData();
      body.append('purpose', 'PROFILE_VERIFICATION');
      body.append('consentAccepted', 'true');
      body.append('deviceInfo', JSON.stringify({ platform: 'mobile', capturedAt: new Date().toISOString() }));
      appendFile(body, 'faceImage', selfie);
      const resubmitting = ['REJECTED', 'RESUBMISSION_REQUIRED'].includes(status.status);
      const url = resubmitting ? `/v1/verifications/face/${status.requestId}/resubmit` : '/v1/verifications/face';
      await apiUtil.post(url, body, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSelfie(null); setConsent(false);
      await loadStatus();
      AlertService.show('Submitted', 'Your live selfie was sent for manual review.', 'success');
    } catch (error) {
      AlertService.show('Submission failed', getApiErrorMessage(error), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const current = copy[status.status] || copy.NOT_SUBMITTED;
  const locked = ['PENDING', 'UNDER_REVIEW', 'APPROVED'].includes(status.status);
  return (
    <ScreenBackgroundView style={[{ flex: 1, backgroundColor: '#08031a' }]}>
      <ScreenBackgroundStatusBar translucent backgroundColor="transparent" barStyle="light-content" animated />
      <ScreenBackgroundGradient colors={['#08031a', '#050212', '#020108']} style={ScreenBackgroundStyleSheet.absoluteFillObject} />
      <View style={[styles.header, { paddingTop: topSafeInset + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Icon name="arrow-back" size={26} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Face Verification</Text><View style={styles.spacer} />
      </View>
      <AnimatedTitleLine />
      {loading ? <ActivityIndicator style={styles.loader} size="large" color="#03dcfe" /> : (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}>
          <View style={styles.statusCard}>
            <Icon name={status.status === 'APPROVED' ? 'verified' : 'face'} size={34} color={status.status === 'APPROVED' ? '#10b981' : '#03dcfe'} />
            <View style={styles.statusCopy}><Text style={styles.statusTitle}>{current[0]}</Text><Text style={styles.muted}>{current[1]}</Text></View>
          </View>
          {status.rejectionReasonText ? <View style={styles.warning}><Text style={styles.warningTitle}>Reason</Text><Text style={styles.warningText}>{status.rejectionReasonText}</Text></View> : null}
          {status.resubmissionInstructions ? <View style={styles.warning}><Text style={styles.warningTitle}>Admin instructions</Text><Text style={styles.warningText}>{status.resubmissionInstructions}</Text></View> : null}
          {!locked ? <>
            <Text style={styles.sectionTitle}>Live camera instructions</Text>
            <View style={styles.guide}>
              <View style={styles.oval}><Icon name="face" size={88} color="rgba(255,255,255,.28)" /></View>
              <Text style={styles.guideTitle}>Keep one face inside the oval</Text>
              <Text style={styles.muted}>Use bright, even light. Remove sunglasses or face covering. A blurry or screen-captured image will be rejected.</Text>
            </View>
            {selfie ? <Image source={{ uri: selfie.uri }} style={styles.preview} /> : null}
            <TouchableOpacity style={styles.secondaryButton} onPress={capture} disabled={submitting}>
              <Icon name="photo-camera" size={20} color="#03dcfe" />
              <Text style={styles.secondaryText}>{selfie ? 'Retake selfie' : 'Capture live selfie'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.consentRow} onPress={() => setConsent(value => !value)}>
              <Icon name={consent ? 'check-box' : 'check-box-outline-blank'} size={24} color={consent ? '#10b981' : '#94a3b8'} />
              <Text style={styles.consentText}>I confirm this live selfie belongs to me and consent to its use for manual account verification.</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.submit, (!selfie || !consent) && styles.disabled]} onPress={submit} disabled={submitting || !selfie || !consent}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit for verification</Text>}
            </TouchableOpacity>
          </> : null}
        </ScrollView>
      )}
    </ScreenBackgroundView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' }, spacer: { width: 26 },
  loader: { marginTop: 80 }, content: { padding: 20, paddingBottom: 60 },
  statusCard: { flexDirection: 'row', padding: 18, borderRadius: 20, backgroundColor: 'rgba(255,255,255,.05)', borderWidth: 1, borderColor: 'rgba(3,220,254,.25)' },
  statusCopy: { flex: 1, marginLeft: 14 }, statusTitle: { color: '#fff', fontSize: 17, fontWeight: '800', marginBottom: 5 },
  muted: { color: 'rgba(255,255,255,.62)', fontSize: 13, lineHeight: 19 },
  warning: { marginTop: 14, padding: 14, borderRadius: 14, backgroundColor: 'rgba(245,158,11,.10)', borderWidth: 1, borderColor: 'rgba(245,158,11,.35)' },
  warningTitle: { color: '#fbbf24', fontWeight: '800', marginBottom: 4 }, warningText: { color: '#fde68a', lineHeight: 19 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginTop: 24, marginBottom: 12 },
  guide: { alignItems: 'center', padding: 20, borderRadius: 24, backgroundColor: 'rgba(124,77,255,.08)', borderWidth: 1, borderColor: 'rgba(124,77,255,.35)' },
  oval: { width: 150, height: 190, borderRadius: 75, borderWidth: 3, borderColor: '#03dcfe', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  guideTitle: { color: '#fff', fontWeight: '800', fontSize: 15, marginBottom: 7 }, preview: { width: '100%', height: 330, borderRadius: 22, marginTop: 16 },
  secondaryButton: { marginTop: 16, height: 52, borderRadius: 16, borderWidth: 1, borderColor: '#03dcfe', flexDirection: 'row', gap: 9, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: '#03dcfe', fontWeight: '800' }, consentRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 20 },
  consentText: { flex: 1, color: 'rgba(255,255,255,.7)', marginLeft: 10, lineHeight: 19 },
  submit: { height: 54, marginTop: 20, borderRadius: 17, backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: .45 }, submitText: { color: '#fff', fontSize: 15, fontWeight: '900' },
});
