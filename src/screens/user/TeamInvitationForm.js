import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { apiUtil } from '../../utils/apiUtil';
import { AlertService } from '../../utils/AlertService';

export default function TeamInvitationForm() {
  const { params } = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [invite, setInvite] = useState(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    experienceYears: '',
    hostTypes: ['voice'],
  });

  const setField = (key, value) => setForm(f => ({ ...f, [key]: value }));

  useEffect(() => {
    if (!params?.invitationId) return;
    setBusy(true);
    apiUtil
      .get(`/team/invitations/${params.invitationId}`)
      .then(r => setInvite(r.data.data))
      .catch(e => setError(e.response?.data?.message || 'Could not open invitation'))
      .finally(() => setBusy(false));
  }, [params?.invitationId]);

  const submit = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      AlertService.show('Required Fields', 'Please enter your Full Name and Contact Phone.', 'warning');
      return;
    }
    if (invite?.role === 'host' && (!form.hostTypes || form.hostTypes.length === 0)) {
      AlertService.show('Hosting Type', 'Please select at least one hosting category (Voice, Video, or Room).', 'warning');
      return;
    }

    setBusy(true);
    try {
      await apiUtil.post(`/team/invitations/${params.invitationId}/submit`, form);
      setInvite(i => ({ ...i, state: 'submitted' }));
      AlertService.show(
        'Application Submitted',
        'Your profile details have been sent to your team manager for approval! You will be notified once approved.',
        'success'
      );
    } catch (e) {
      AlertService.show('Submission failed', e.response?.data?.message || e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const decline = async () => {
    setBusy(true);
    try {
      await apiUtil.post(`/team/invitations/${params.invitationId}/decline`);
      setInvite(i => ({ ...i, state: 'declined' }));
      AlertService.show('Invitation Declined', 'You have declined this team invitation.', 'info');
      navigation.goBack();
    } catch (e) {
      setError(e.response?.data?.message || 'Could not decline invitation');
    } finally {
      setBusy(false);
    }
  };

  const active = invite?.state === 'pending' && new Date(invite.expiresAt).getTime() > Date.now();
  const fields = (invite?.fields || []).filter(
    f =>
      !/password|role|permission|parent|hierarchy|referr|owner|operator|admin|agencyId|bdId|userId|yaroId|__proto__|constructor/i.test(
        f.fieldKey
      ) && !['name', 'email', 'phone', 'hostTypes', 'city', 'experienceYears'].includes(f.fieldKey)
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0b0f19" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Team Invitation</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 18, paddingBottom: insets.bottom + 50 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {busy && <ActivityIndicator size="large" color="#6366f1" style={{ marginVertical: 20 }} />}
        {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

        {invite && (
          <>
            {/* Invitation Details Banner */}
            <LinearGradient
              colors={['#1e1b4b', '#312e81']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.inviteCard}
            >
              <View style={styles.inviteHeaderRow}>
                <View style={styles.inviteIconCircle}>
                  <Ionicons name="mail-open" size={24} color="#a5b4fc" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.inviterName}>
                    {invite.inviter?.name || 'Team Manager'}
                  </Text>
                  <Text style={styles.invitationSubhead}>
                    invited you to join as <Text style={styles.roleHighlight}>{invite.role?.toUpperCase()}</Text>
                  </Text>
                </View>
              </View>

              <View style={styles.inviteStatusBadge}>
                <Text style={styles.statusLabel}>
                  Status: <Text style={{ fontWeight: '800', color: '#fff' }}>{invite.state?.toUpperCase()}</Text>
                </Text>
              </View>
            </LinearGradient>

            {active ? (
              <View style={styles.formContainer}>
                <Text style={styles.formSectionTitle}>Complete Your Details</Text>
                <Text style={styles.formSectionSub}>
                  Fill out your professional details below to finalize your onboarding application.
                </Text>

                {/* Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full Name *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={form.name}
                    onChangeText={v => setField('name', v)}
                    placeholder="Enter your real or display name"
                    placeholderTextColor="#64748b"
                  />
                </View>

                {/* Phone */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>WhatsApp / Contact Phone *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={form.phone}
                    onChangeText={v => setField('phone', v)}
                    placeholder="Enter your mobile number"
                    placeholderTextColor="#64748b"
                    keyboardType="phone-pad"
                  />
                </View>

                {/* Email */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Address</Text>
                  <TextInput
                    style={styles.textInput}
                    value={form.email}
                    onChangeText={v => setField('email', v)}
                    placeholder="name@example.com"
                    placeholderTextColor="#64748b"
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>

                {/* City */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>City / Location</Text>
                  <TextInput
                    style={styles.textInput}
                    value={form.city}
                    onChangeText={v => setField('city', v)}
                    placeholder="e.g. Mumbai, Delhi"
                    placeholderTextColor="#64748b"
                  />
                </View>

                {/* Experience */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Hosting Experience (Years/Months)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={form.experienceYears}
                    onChangeText={v => setField('experienceYears', v)}
                    placeholder="e.g. 1 year, 6 months"
                    placeholderTextColor="#64748b"
                  />
                </View>

                {/* Host Types if joining as Host */}
                {invite.role === 'host' && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Hosting Categories (select all that apply) *</Text>
                    <View style={styles.hostTypesGrid}>
                      {[
                        { key: 'voice', label: '1-on-1 Voice Calling', icon: 'call' },
                        { key: 'video', label: '1-on-1 Video Calling', icon: 'videocam' },
                        { key: 'room', label: 'Voice Party Room', icon: 'radio' },
                      ].map(type => {
                        const selected = form.hostTypes.includes(type.key);
                        return (
                          <TouchableOpacity
                            key={type.key}
                            style={[styles.hostTypeChip, selected && styles.hostTypeChipSelected]}
                            onPress={() =>
                              setField(
                                'hostTypes',
                                selected
                                  ? form.hostTypes.filter(t => t !== type.key)
                                  : [...form.hostTypes, type.key]
                              )
                            }
                          >
                            <Ionicons
                              name={selected ? 'checkbox' : 'square-outline'}
                              size={18}
                              color={selected ? '#6366f1' : '#64748b'}
                            />
                            <Text style={[styles.hostTypeText, selected && styles.hostTypeTextSelected]}>
                              {type.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Custom Fields */}
                {fields.map(f => (
                  <View key={f.fieldKey} style={styles.inputGroup}>
                    <Text style={styles.label}>
                      {f.label} {f.required ? '*' : ''}
                    </Text>
                    <TextInput
                      style={styles.textInput}
                      value={String(form[f.fieldKey] || '')}
                      onChangeText={v => setField(f.fieldKey, v)}
                      placeholder={f.placeholder || `Enter ${f.label}`}
                      placeholderTextColor="#64748b"
                    />
                  </View>
                ))}

                {/* Submit Application Button */}
                <TouchableOpacity style={styles.submitButton} onPress={submit} disabled={busy}>
                  <Text style={styles.submitButtonText}>Submit Application for Approval</Text>
                </TouchableOpacity>

                {/* Decline Button */}
                <TouchableOpacity style={styles.declineButton} onPress={decline} disabled={busy}>
                  <Text style={styles.declineButtonText}>Decline Invitation</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.inactiveCard}>
                <Ionicons name="information-circle-outline" size={32} color="#a5b4fc" />
                <Text style={styles.inactiveTitle}>Invitation Closed</Text>
                <Text style={styles.inactiveText}>
                  This invitation has already been {invite.state || 'processed'} or has expired. No role change occurs without manager approval.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0b0f19' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: '#0f172a',
  },
  backButton: { padding: 8, borderRadius: 10, backgroundColor: '#1e293b' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  inviteCard: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4338ca55',
    marginBottom: 16,
  },
  inviteHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  inviteIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#312e81',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  inviterName: { color: '#fff', fontSize: 16, fontWeight: '800' },
  invitationSubhead: { color: '#c7d2fe', fontSize: 12, marginTop: 2 },
  roleHighlight: { color: '#fbbf24', fontWeight: '900' },
  inviteStatusBadge: {
    backgroundColor: '#0f172a66',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 12,
  },
  statusLabel: { color: '#a5b4fc', fontSize: 11 },
  formContainer: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  formSectionTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  formSectionSub: { color: '#94a3b8', fontSize: 11, marginTop: 4, marginBottom: 14 },
  inputGroup: { marginBottom: 12 },
  label: { color: '#cbd5e1', fontSize: 11, fontWeight: '700', marginBottom: 6 },
  textInput: {
    backgroundColor: '#0b0f19',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 13,
  },
  hostTypesGrid: { gap: 8, marginTop: 4 },
  hostTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  hostTypeChipSelected: {
    backgroundColor: '#312e8144',
    borderColor: '#6366f1',
  },
  hostTypeText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  hostTypeTextSelected: { color: '#fff', fontWeight: '800' },
  submitButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 14,
  },
  submitButtonText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  declineButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  declineButtonText: { color: '#f43f5e', fontSize: 12, fontWeight: '700' },
  inactiveCard: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 8,
  },
  inactiveTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  inactiveText: { color: '#94a3b8', fontSize: 12, textAlign: 'center', lineHeight: 18 },
  errorBanner: {
    backgroundColor: '#881337',
    color: '#fecdd3',
    padding: 10,
    borderRadius: 10,
    fontSize: 11,
    marginBottom: 12,
  },
});
