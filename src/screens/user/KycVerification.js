import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
  View as ScreenBackgroundView,
  StatusBar as ScreenBackgroundStatusBar,
  StyleSheet as ScreenBackgroundStyleSheet
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { pick, types } from '@react-native-documents/picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ScreenBackgroundGradient from 'react-native-linear-gradient';
import AnimatedTitleLine from '../../components/AnimatedTitleLine';
import { AuthContext } from '../../context/AuthProvider';
import { apiUtil, getApiErrorMessage } from '../../utils/apiUtil';
import { AlertService } from '../../utils/AlertService';
import { appendFile, requestCameraAndCapture } from '../../utils/verificationMedia';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';

const DOCUMENT_TYPES = [
  ['PAN_CARD', 'PAN Card'], ['VOTER_ID', 'Voter ID'],
  ['DRIVING_LICENCE', 'Driving Licence'], ['PASSPORT', 'Passport'],
  ['OTHER_GOVERNMENT_ID', 'Other Government ID'],
];
const statusCopy = {
  NOT_SUBMITTED: ['KYC not submitted', 'Complete the form for manual verification.'],
  PENDING: ['KYC pending', 'Your documents are waiting for admin review.'],
  UNDER_REVIEW: ['KYC under review', 'An admin is reviewing each required section.'],
  APPROVED: ['KYC approved', 'Your identity verification is complete.'],
  REJECTED: ['KYC rejected', 'Review the reason and submit corrected information.'],
  RESUBMISSION_REQUIRED: ['Additional information required', 'Only the fields requested by the admin need to be submitted again.'],
  EXPIRED: ['KYC expired', 'Please submit fresh identity documents.'],
};

const Field = ({ label, value, onChangeText, ...props }) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput style={[styles.input, props.multiline && styles.multiline]} value={value} onChangeText={onChangeText}
      placeholderTextColor="rgba(255,255,255,.32)" {...props} />
  </View>
);
const FileButton = ({ label, file, onPress, camera }) => (
  <TouchableOpacity style={[styles.fileButton, file && styles.fileReady]} onPress={onPress}>
    <Icon name={file ? 'check-circle' : camera ? 'photo-camera' : 'upload-file'} size={21} color={file ? '#10b981' : '#03dcfe'} />
    <View style={styles.fileCopy}><Text style={styles.fileLabel}>{label}</Text><Text numberOfLines={1} style={styles.fileName}>{file?.name || (camera ? 'Capture using camera' : 'Choose JPG or PNG')}</Text></View>
  </TouchableOpacity>
);

export default function KycVerification() {
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 40);
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  const [status, setStatus] = useState({ overallStatus: 'NOT_SUBMITTED' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [consent, setConsent] = useState(false);
  const [documentType, setDocumentType] = useState('PAN_CARD');
  const [form, setForm] = useState({
    fullName: '', fatherName: '', dateOfBirth: '', gender: '', mobileNumber: '',
    email: '', addressLine: '', state: '', district: '', cityOrVillage: '', pinCode: '',
    documentNumber: '', nameOnDocument: '', expiryDate: '',
    accountHolderName: '', bankName: '', accountNumber: '', confirmAccountNumber: '',
    ifscCode: '', branchName: '', upiId: '',
  });
  const [files, setFiles] = useState({});
  const set = key => value => setForm(current => ({ ...current, [key]: value }));

  useEffect(() => {
    setForm(current => ({
      ...current,
      fullName: current.fullName || user?.name || '',
      mobileNumber: current.mobileNumber || user?.phoneNumber || '',
      email: current.email || user?.email || '',
      gender: current.gender || user?.gender || '',
    }));
  }, [user]);
  const loadStatus = useCallback(async () => {
    try {
      const response = await apiUtil.get('/v1/verifications/kyc/me');
      setStatus(response.data?.data || { overallStatus: 'NOT_SUBMITTED' });
    } catch (error) {
      AlertService.show('Unable to load KYC', getApiErrorMessage(error), 'error');
    } finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { setLoading(true); loadStatus(); }, [loadStatus]));

  const chooseImage = async key => {
    try {
      const result = await pick({ type: [types.allFiles], allowMultiSelection: false });
      const selected = result?.[0];
      if (!selected) return;
      if ((selected.size || 0) > 10 * 1024 * 1024) throw new Error('Document file must be 10 MB or smaller.');
      setFiles(current => ({ ...current, [key]: selected }));
    } catch (error) {
      if (error?.code !== 'OPERATION_CANCELED' && error?.code !== 'DOCUMENT_PICKER_CANCELED' && error?.code !== 'CANCELED') {
        AlertService.show('Invalid file', error.message, 'error');
      }
    }
  };
  const captureSelfie = async () => {
    try {
      const selfie = await requestCameraAndCapture('front');
      if (selfie) setFiles(current => ({ ...current, liveSelfie: selfie }));
    } catch (error) { AlertService.show('Camera', error.message, 'error'); }
  };

  const validate = () => {
    const required = ['fullName', 'dateOfBirth', 'mobileNumber', 'addressLine', 'state', 'district', 'cityOrVillage', 'pinCode', 'documentNumber', 'nameOnDocument'];
    if (required.some(key => !String(form[key] || '').trim())) return 'Complete all required personal, address and document fields.';
    if (!/^\d{6}$/.test(form.pinCode)) return 'Enter a valid 6-digit PIN code.';
    if (!files.documentFront || !files.liveSelfie) return 'Document front image and live selfie are required.';
    if (user?.role === 'host' && (!form.accountHolderName || !form.bankName || !form.accountNumber || !form.ifscCode)) return 'Complete required bank details.';
    if (form.accountNumber !== form.confirmAccountNumber) return 'Bank account numbers do not match.';
    if (!consent) return 'Consent is required before submission.';
    return null;
  };

  const submit = async () => {
    const resubmitting = status.overallStatus === 'RESUBMISSION_REQUIRED';
    if (!resubmitting) {
      const error = validate();
      if (error) return AlertService.show('Check form', error, 'error');
    }
    try {
      setSubmitting(true);
      const body = new FormData();
      body.append('consentAccepted', 'true');
      if (resubmitting) {
        body.append('fields', JSON.stringify({
          documentNumber: form.documentNumber,
          personalDetails: {
            fullName: form.fullName, fatherName: form.fatherName, dateOfBirth: form.dateOfBirth,
            gender: form.gender, mobileNumber: form.mobileNumber, email: form.email,
            address: { addressLine: form.addressLine, state: form.state, district: form.district, cityOrVillage: form.cityOrVillage, pinCode: form.pinCode },
          },
          bankDetails: user?.role === 'host' ? {
            accountHolderName: form.accountHolderName, bankName: form.bankName,
            accountNumber: form.accountNumber, confirmAccountNumber: form.confirmAccountNumber,
            ifscCode: form.ifscCode.toUpperCase(), branchName: form.branchName, upiId: form.upiId,
          } : undefined,
        }));
      } else {
        body.append('purpose', user?.role === 'host' ? 'WITHDRAWAL_ACTIVATION' : 'PROFILE_VERIFICATION');
        body.append('personalDetails', JSON.stringify({
          fullName: form.fullName, fatherName: form.fatherName, dateOfBirth: form.dateOfBirth,
          gender: form.gender, mobileNumber: form.mobileNumber, email: form.email,
          address: { addressLine: form.addressLine, state: form.state, district: form.district, cityOrVillage: form.cityOrVillage, pinCode: form.pinCode },
        }));
        body.append('document', JSON.stringify({
          type: documentType, number: form.documentNumber, nameOnDocument: form.nameOnDocument,
          expiryDate: form.expiryDate || undefined,
        }));
        if (user?.role === 'host') body.append('bankDetails', JSON.stringify({
          accountHolderName: form.accountHolderName, bankName: form.bankName,
          accountNumber: form.accountNumber, confirmAccountNumber: form.confirmAccountNumber,
          ifscCode: form.ifscCode.toUpperCase(), branchName: form.branchName, upiId: form.upiId,
        }));
      }
      Object.entries(files).forEach(([key, file]) => appendFile(body, key, file));
      const url = resubmitting ? `/v1/verifications/kyc/${status.requestId}/resubmit` : '/v1/verifications/kyc';
      await apiUtil.post(url, body, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFiles({}); setConsent(false); await loadStatus();
      AlertService.show('KYC submitted', 'Your information was sent for manual review.', 'success');
    } catch (error) {
      AlertService.show('Submission failed', getApiErrorMessage(error), 'error');
    } finally { setSubmitting(false); }
  };

  const current = statusCopy[status.overallStatus] || statusCopy.NOT_SUBMITTED;
  const locked = ['PENDING', 'UNDER_REVIEW', 'APPROVED'].includes(status.overallStatus);
  return (
    <ScreenBackgroundView style={[{ flex: 1, backgroundColor: '#08031a' }]}>
      <ScreenBackgroundStatusBar translucent backgroundColor="transparent" barStyle="light-content" animated />
      <ScreenBackgroundGradient colors={['#08031a', '#050212', '#020108']} style={ScreenBackgroundStyleSheet.absoluteFillObject} />
      <View style={[styles.header, { paddingTop: topSafeInset + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Icon name="arrow-back" size={26} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>KYC Verification</Text><View style={styles.headerGap} />
      </View>
      <AnimatedTitleLine />
      {loading ? <ActivityIndicator style={styles.loader} color="#03dcfe" size="large" /> : (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]} keyboardShouldPersistTaps="handled">
          <View style={styles.statusCard}><Icon name={status.overallStatus === 'APPROVED' ? 'verified' : 'badge'} size={34} color="#03dcfe" />
            <View style={styles.statusText}><Text style={styles.statusTitle}>{current[0]}</Text><Text style={styles.muted}>{current[1]}</Text></View>
          </View>
          {status.rejectionReasonText ? <View style={styles.warning}><Text style={styles.warningTitle}>Rejection reason</Text><Text style={styles.warningText}>{status.rejectionReasonText}</Text></View> : null}
          {status.resubmissionInstructions ? <View style={styles.warning}><Text style={styles.warningTitle}>Resubmission instructions</Text><Text style={styles.warningText}>{status.resubmissionInstructions}</Text><Text style={styles.requested}>Requested: {(status.requestedResubmissionFields || []).join(', ')}</Text></View> : null}
          {!locked ? <>
            <Section title="Personal information">
              <Field label="Full name *" value={form.fullName} onChangeText={set('fullName')} />
              <Field label="Father's name" value={form.fatherName} onChangeText={set('fatherName')} />
              <Field label="Date of birth (YYYY-MM-DD) *" value={form.dateOfBirth} onChangeText={set('dateOfBirth')} />
              <Field label="Gender" value={form.gender} onChangeText={set('gender')} />
              <Field label="Mobile number *" value={form.mobileNumber} onChangeText={set('mobileNumber')} keyboardType="phone-pad" />
              <Field label="Email address" value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" />
              <Field label="Full address *" value={form.addressLine} onChangeText={set('addressLine')} multiline />
              <Field label="State *" value={form.state} onChangeText={set('state')} />
              <Field label="District *" value={form.district} onChangeText={set('district')} />
              <Field label="City / Village *" value={form.cityOrVillage} onChangeText={set('cityOrVillage')} />
              <Field label="PIN code *" value={form.pinCode} onChangeText={set('pinCode')} keyboardType="number-pad" maxLength={6} />
            </Section>
            <Section title="Government document">
              <View style={styles.chips}>{DOCUMENT_TYPES.map(([value, label]) => (
                <TouchableOpacity key={value} style={[styles.chip, documentType === value && styles.chipActive]} onPress={() => setDocumentType(value)}>
                  <Text style={[styles.chipText, documentType === value && styles.chipTextActive]}>{label}</Text>
                </TouchableOpacity>
              ))}</View>
              <Field label="Document number *" value={form.documentNumber} onChangeText={set('documentNumber')} autoCapitalize="characters" />
              <Field label="Name on document *" value={form.nameOnDocument} onChangeText={set('nameOnDocument')} />
              <Field label="Expiry date (if applicable)" value={form.expiryDate} onChangeText={set('expiryDate')} />
              <FileButton label="Document front *" file={files.documentFront} onPress={() => chooseImage('documentFront')} />
              <FileButton label="Document back" file={files.documentBack} onPress={() => chooseImage('documentBack')} />
              <FileButton label="Supporting document" file={files.supportingDocument} onPress={() => chooseImage('supportingDocument')} />
            </Section>
            <Section title="Live selfie">
              <Text style={styles.muted}>Gallery upload is disabled. Capture a fresh selfie in good light with only one face visible.</Text>
              {files.liveSelfie ? <Image source={{ uri: files.liveSelfie.uri }} style={styles.selfie} /> : null}
              <FileButton label="Live selfie *" file={files.liveSelfie} onPress={captureSelfie} camera />
            </Section>
            {user?.role === 'host' ? <Section title="Bank details for withdrawal">
              <Field label="Account holder name *" value={form.accountHolderName} onChangeText={set('accountHolderName')} />
              <Field label="Bank name *" value={form.bankName} onChangeText={set('bankName')} />
              <Field label="Account number *" value={form.accountNumber} onChangeText={set('accountNumber')} keyboardType="number-pad" secureTextEntry />
              <Field label="Confirm account number *" value={form.confirmAccountNumber} onChangeText={set('confirmAccountNumber')} keyboardType="number-pad" />
              <Field label="IFSC code *" value={form.ifscCode} onChangeText={set('ifscCode')} autoCapitalize="characters" />
              <Field label="Branch name" value={form.branchName} onChangeText={set('branchName')} />
              <Field label="UPI ID (optional)" value={form.upiId} onChangeText={set('upiId')} autoCapitalize="none" />
              <FileButton label="Cancelled cheque / passbook" file={files.bankProof} onPress={() => chooseImage('bankProof')} />
            </Section> : null}
            <TouchableOpacity style={styles.consent} onPress={() => setConsent(value => !value)}>
              <Icon name={consent ? 'check-box' : 'check-box-outline-blank'} size={24} color={consent ? '#10b981' : '#94a3b8'} />
              <Text style={styles.consentText}>I confirm that the submitted information and documents are correct and belong to me. I consent to their use for account and KYC verification.</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.submit, (!consent || submitting) && styles.disabled]} onPress={submit} disabled={!consent || submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>{status.overallStatus === 'RESUBMISSION_REQUIRED' ? 'Submit requested information' : 'Submit KYC for review'}</Text>}
            </TouchableOpacity>
          </> : null}
        </ScrollView>
      )}
    </ScreenBackgroundView>
  );
}

const Section = ({ title, children }) => <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>;
const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' }, headerGap: { width: 26 }, loader: { marginTop: 80 },
  content: { padding: 20, paddingBottom: 70 }, statusCard: { flexDirection: 'row', padding: 18, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(3,220,254,.25)', backgroundColor: 'rgba(255,255,255,.04)' },
  statusText: { flex: 1, marginLeft: 13 }, statusTitle: { color: '#fff', fontSize: 17, fontWeight: '800', marginBottom: 5 },
  muted: { color: 'rgba(255,255,255,.6)', fontSize: 13, lineHeight: 19 }, warning: { padding: 15, marginTop: 14, backgroundColor: 'rgba(245,158,11,.10)', borderRadius: 15, borderWidth: 1, borderColor: 'rgba(245,158,11,.35)' },
  warningTitle: { color: '#fbbf24', fontWeight: '800' }, warningText: { color: '#fde68a', marginTop: 5, lineHeight: 19 }, requested: { color: '#fff', marginTop: 7, fontWeight: '700' },
  section: { marginTop: 18, padding: 16, borderRadius: 20, backgroundColor: 'rgba(255,255,255,.035)', borderWidth: 1, borderColor: 'rgba(255,255,255,.10)' },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 15 }, field: { marginBottom: 13 }, label: { color: 'rgba(255,255,255,.72)', fontSize: 12, fontWeight: '700', marginBottom: 6 },
  input: { height: 48, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,.12)', backgroundColor: 'rgba(0,0,0,.16)', color: '#fff' },
  multiline: { minHeight: 85, height: 85, paddingTop: 13, textAlignVertical: 'top' }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 15 },
  chip: { paddingHorizontal: 11, paddingVertical: 8, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,.14)' }, chipActive: { borderColor: '#03dcfe', backgroundColor: 'rgba(3,220,254,.12)' },
  chipText: { color: 'rgba(255,255,255,.58)', fontSize: 11 }, chipTextActive: { color: '#03dcfe', fontWeight: '800' },
  fileButton: { flexDirection: 'row', alignItems: 'center', minHeight: 58, padding: 12, marginTop: 10, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(3,220,254,.28)', backgroundColor: 'rgba(3,220,254,.04)' },
  fileReady: { borderColor: 'rgba(16,185,129,.55)', backgroundColor: 'rgba(16,185,129,.06)' }, fileCopy: { flex: 1, marginLeft: 11 },
  fileLabel: { color: '#fff', fontWeight: '700', fontSize: 13 }, fileName: { color: 'rgba(255,255,255,.48)', fontSize: 11, marginTop: 3 },
  selfie: { width: '100%', height: 300, borderRadius: 18, marginTop: 13 }, consent: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 20 },
  consentText: { flex: 1, marginLeft: 10, color: 'rgba(255,255,255,.7)', lineHeight: 19 }, submit: { height: 56, marginTop: 20, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#7c3aed' },
  disabled: { opacity: .45 }, submitText: { color: '#fff', fontWeight: '900', fontSize: 15 },
});
