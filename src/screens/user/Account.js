import React, { useCallback, useContext, useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { AuthContext } from '../../context/AuthProvider';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { apiUtil } from '../../utils/apiUtil';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Ionicon from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';
import { AlertService } from '../../utils/AlertService';
import { auth } from '../../configs/firebaseConfig';
import { signInWithGoogleProvider } from '../../configs/googleSignIn';
import {
  confirmFirebasePhoneOtp,
  getPhoneAuthError,
  getOtpResendCooldown,
  isFirebaseUserForPhone,
  sendFirebasePhoneOtp,
  signOutFirebasePhoneUser,
} from '../../utils/firebasePhoneAuth';

const { width } = Dimensions.get('window');

const Account = () => {
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 36);
  const { user, fetchUserProfile } = useContext(AuthContext);
  const { t } = useTranslation();
  const navigation = useNavigation();

  // Google linking state
  const [googleLoading, setGoogleLoading] = useState(false);

  // Phone linking state
  const [phoneModalVisible, setPhoneModalVisible] = useState(false);
  const [phoneStep, setPhoneStep] = useState('input'); // 'input' | 'otp'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState({ code: '+91', flag: '🇮🇳', name: 'India' });

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [phoneVerificationId, setPhoneVerificationId] = useState(null);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(60);
  const inputRefs = useRef([]);
  const phoneVerificationCompletedRef = useRef(false);

  const finalizeFirebasePhoneLink = useCallback(async (firebaseUser) => {
    if (!firebaseUser || phoneVerificationCompletedRef.current) return;
    phoneVerificationCompletedRef.current = true;
    const fullPhone = selectedCountry.code + phoneNumber;

    try {
      setPhoneLoading(true);
      const firebaseIdToken = await firebaseUser.getIdToken(true);
      const response = await apiUtil.post('/user/verify-phone', {
        phoneNumber: fullPhone,
        firebaseIdToken,
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Phone verification failed.');
      }

      AlertService.show('Success', 'Phone number linked and verified successfully!', 'success');
      await fetchUserProfile();
      setPhoneModalVisible(false);
    } catch (error) {
      phoneVerificationCompletedRef.current = false;
      const errObj = getPhoneAuthError(error);
      const displayMsg = error.response ? (error.response?.data?.message || errObj.message) : errObj.message;
      AlertService.show(errObj.title, displayMsg, 'error');
    } finally {
      await signOutFirebasePhoneUser().catch(() => undefined);
      setPhoneLoading(false);
    }
  }, [fetchUserProfile, phoneNumber, selectedCountry.code]);

  useEffect(() => {
    if (!phoneModalVisible || phoneStep !== 'otp') return undefined;
    const fullPhone = selectedCountry.code + phoneNumber;
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      if (isFirebaseUserForPhone(firebaseUser, fullPhone)) {
        finalizeFirebasePhoneLink(firebaseUser);
      }
    });
    return unsubscribe;
  }, [finalizeFirebasePhoneLink, phoneModalVisible, phoneNumber, phoneStep, selectedCountry.code]);

  useEffect(() => {
    if (!phoneModalVisible || phoneStep !== 'otp') return undefined;
    let isMounted = true;
    const fullPhone = selectedCountry.code + phoneNumber;

    const checkCooldown = async () => {
      const remaining = await getOtpResendCooldown(fullPhone, 60);
      if (isMounted) {
        setResendSeconds(remaining > 0 ? remaining : 60);
      }
    };
    checkCooldown();

    return () => { isMounted = false; };
  }, [phoneModalVisible, phoneNumber, phoneStep, selectedCountry.code]);

  useEffect(() => {
    if (!phoneModalVisible || phoneStep !== 'otp' || resendSeconds <= 0) return undefined;
    const timer = setTimeout(() => setResendSeconds(sec => sec - 1), 1000);
    return () => clearTimeout(timer);
  }, [phoneModalVisible, phoneStep, resendSeconds]);

  // ====== GOOGLE LINKING ======
  const handleLinkGoogle = async () => {
    try {
      setGoogleLoading(true);
      const googleIdToken = await signInWithGoogleProvider();
      const res = await apiUtil.post('/auth/link-account', { googleIdToken });

      if (res.data?.success) {
        AlertService.show('Success', 'Google Account linked successfully.', 'success');
        fetchUserProfile();
      } else {
        AlertService.show('Error', res.data?.message || 'Failed to link Google.', 'error');
      }
    } catch (error) {
      if (__DEV__) console.error('Google linking error:', error);
      AlertService.show('Error', error.message || 'Google linking failed or was cancelled.', 'error');
    } finally {
      setGoogleLoading(false);
    }
  };

  // ====== PHONE LINKING ======
  const openPhoneModal = () => {
    setPhoneStep('input');
    setPhoneNumber('');
    setOtp(['', '', '', '', '', '']);
    setPhoneVerificationId(null);
    setResendSeconds(60);
    setPhoneModalVisible(true);
  };

  const handleSendOtp = async () => {
    if (phoneLoading) return;

    if (!phoneNumber || phoneNumber.length < 10) {
      AlertService.show('Invalid Phone Number', 'Please enter a valid 10-digit mobile number.', 'error');
      return;
    }

    const fullPhone = selectedCountry.code + phoneNumber;
    try {
      setPhoneLoading(true);
      phoneVerificationCompletedRef.current = false;
      const verificationId = await sendFirebasePhoneOtp(fullPhone);
      setPhoneVerificationId(verificationId);
      setResendSeconds(60);
      setPhoneStep('otp');
      AlertService.show('OTP Sent', 'A 6-digit OTP has been sent to your number.', 'success');
    } catch (error) {
      if (__DEV__) console.log('Firebase OTP send error:', error?.code || error?.message);
      const errObj = getPhoneAuthError(error);
      AlertService.show(errObj.title, errObj.message, 'error');
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleOtpChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    if (phoneLoading) return;

    const otpString = otp.join('');
    if (otpString.length !== 6 || !/^\d{6}$/.test(otpString)) {
      AlertService.show('Invalid OTP', 'The OTP you entered is incorrect. Please check the code and try again.', 'error');
      return;
    }

    try {
      setPhoneLoading(true);
      const credential = await confirmFirebasePhoneOtp(phoneVerificationId, otpString);
      await finalizeFirebasePhoneLink(credential?.user || auth.currentUser);
    } catch (error) {
      if (__DEV__) console.log('Firebase OTP verification error:', error?.code || error?.message);
      const errObj = getPhoneAuthError(error);
      AlertService.show(errObj.title, errObj.message, 'error');
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (phoneLoading || resendSeconds > 0) return;

    const fullPhone = selectedCountry.code + phoneNumber;
    try {
      setPhoneLoading(true);
      phoneVerificationCompletedRef.current = false;
      const verificationId = await sendFirebasePhoneOtp(fullPhone, true);
      setPhoneVerificationId(verificationId);
      setOtp(['', '', '', '', '', '']);
      setResendSeconds(60);
      inputRefs.current[0]?.focus();
      AlertService.show('OTP Sent', 'A fresh 6-digit OTP has been sent to your number.', 'success');
    } catch (error) {
      if (__DEV__) console.log('Firebase OTP resend error:', error?.code || error?.message);
      const errObj = getPhoneAuthError(error);
      AlertService.show(errObj.title, errObj.message, 'error');
    } finally {
      setPhoneLoading(false);
    }
  };

  const isSecured = Boolean(user?.emailVerified || user?.phoneVerified);

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* Decorative background glow */}
      <View style={styles.glowTopRight} />
      <View style={styles.glowBottomLeft} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topSafeInset + 10 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicon name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{t('account.title') || 'Account & Security'}</Text>
          <View style={styles.securityPill}>
            <Icon name="verified-user" size={12} color="#10B981" />
            <Text style={styles.securityPillText}>Protected</Text>
          </View>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Security Overview Hero Card */}
        <LinearGradient
          colors={['#7C3AED', '#4F46E5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroTopRow}>
            <View style={styles.shieldIconWrapper}>
              <Icon name="security" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.heroTextWrapper}>
              <Text style={styles.heroStatusLabel}>ACCOUNT PROTECTION STATUS</Text>
              <Text style={styles.heroStatusTitle}>
                {isSecured ? 'Strongly Secured' : 'Security Setup Incomplete'}
              </Text>
            </View>
          </View>

          <Text style={styles.heroDescription}>
            Linking both your phone number and Google account protects your wallet balance, prevents unauthorized access, and provides immediate account recovery.
          </Text>

          <View style={styles.heroFooter}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>USER ID</Text>
              <Text style={styles.metaValue}>{user?.userId || 'N/A'}</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>ROLE</Text>
              <Text style={styles.metaValue}>{String(user?.role || 'User').toUpperCase()}</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>STATUS</Text>
              <Text style={[styles.metaValue, { color: '#34D399' }]}>ACTIVE</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Section: Linked Authentication Methods */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Connected Accounts</Text>
          <Text style={styles.sectionSubtitle}>
            Manage how you sign in and authorize security operations
          </Text>

          {/* Google Account Card */}
          <View style={styles.authTile}>
            <View style={[styles.tileIconBox, { backgroundColor: '#FEE2E2' }]}>
              <Ionicon name="logo-google" size={22} color="#EA4335" />
            </View>
            <View style={styles.tileInfo}>
              <Text style={styles.tileTitle}>Google Account</Text>
              <Text style={styles.tileDesc} numberOfLines={1}>
                {user?.email && user.email.trim() !== ''
                  ? user.email
                  : 'Link Google for 1-tap login'}
              </Text>
            </View>
            {user?.emailVerified ? (
              <View style={styles.verifiedBadge}>
                <Icon name="check-circle" size={16} color="#10B981" />
                <Text style={styles.verifiedText}>Linked</Text>
              </View>
            ) : googleLoading ? (
              <ActivityIndicator size="small" color="#7C3AED" />
            ) : (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleLinkGoogle}
                activeOpacity={0.8}
              >
                <Text style={styles.actionButtonText}>Link</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Phone Number Card */}
          <View style={[styles.authTile, { borderBottomWidth: 0, paddingBottom: 0 }]}>
            <View style={[styles.tileIconBox, { backgroundColor: '#EDE9FE' }]}>
              <Icon name="phone-iphone" size={22} color="#7C3AED" />
            </View>
            <View style={styles.tileInfo}>
              <Text style={styles.tileTitle}>Phone Number</Text>
              <Text style={styles.tileDesc} numberOfLines={1}>
                {user?.phoneNumber && String(user.phoneNumber).trim() !== ''
                  ? String(user.phoneNumber)
                  : 'Add verified mobile number'}
              </Text>
            </View>
            {user?.phoneVerified ? (
              <View style={styles.verifiedBadge}>
                <Icon name="check-circle" size={16} color="#10B981" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={openPhoneModal}
                activeOpacity={0.8}
              >
                <Text style={styles.actionButtonText}>Verify</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Section: Additional Security Options */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Security Preferences</Text>

          <TouchableOpacity
            style={styles.preferenceRow}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('PasswordSetup')}
          >
            <View style={[styles.tileIconBox, { backgroundColor: '#EEF2FF' }]}>
              <Icon name="lock-outline" size={20} color="#4F46E5" />
            </View>
            <View style={styles.tileInfo}>
              <Text style={styles.tileTitle}>Login Password</Text>
              <Text style={styles.tileDesc}>Setup or change password for direct login</Text>
            </View>
            <Ionicon name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.preferenceRow}
            activeOpacity={0.7}
            onPress={() => AlertService.show('Session Active', 'You are currently logged in securely from this mobile device.', 'info')}
          >
            <View style={[styles.tileIconBox, { backgroundColor: '#F0FDF4' }]}>
              <Icon name="devices" size={20} color="#16A34A" />
            </View>
            <View style={styles.tileInfo}>
              <Text style={styles.tileTitle}>Trusted Devices</Text>
              <Text style={styles.tileDesc}>Current session verified</Text>
            </View>
            <View style={styles.onlineDot} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ====== PHONE LINKING MODAL ====== */}
      <Modal
        visible={phoneModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPhoneModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { paddingBottom: Math.max(24, (insets.bottom || 0) + 16) }]}>
            <View style={styles.modalHandleBar} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {phoneStep === 'input' ? 'Link Phone Number' : 'Enter 6-Digit OTP'}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setPhoneModalVisible(false)}
              >
                <Icon name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {phoneStep === 'input' ? (
              <View style={styles.modalBody}>
                <Text style={styles.modalSub}>
                  Enter your mobile number to receive an SMS verification code.
                </Text>

                <View style={styles.phoneInputRow}>
                  <TouchableOpacity
                    style={styles.countryPickerBtn}
                    onPress={() => {
                      setPhoneModalVisible(false);
                      navigation.navigate('CountrySelection', {
                        onSelect: (country) => {
                          setSelectedCountry({ code: country.code, flag: country.flag, name: country.name });
                          setPhoneModalVisible(true);
                        },
                      });
                    }}
                  >
                    <Text style={styles.countryPickerText}>{selectedCountry.flag} {selectedCountry.code}</Text>
                    <Icon name="arrow-drop-down" size={18} color="#64748B" />
                  </TouchableOpacity>

                  <TextInput
                    style={styles.phoneInputBox}
                    placeholder="Enter 10-digit number"
                    placeholderTextColor="#94A3B8"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    maxLength={10}
                    autoFocus
                  />
                </View>

                <TouchableOpacity
                  style={styles.modalPrimaryBtn}
                  onPress={handleSendOtp}
                  disabled={phoneLoading}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#7C3AED', '#4F46E5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.modalBtnGradient}
                  >
                    {phoneLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.modalBtnText}>Send Verification Code</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.modalBody}>
                <Text style={styles.modalSub}>
                  We sent a 6-digit code to{' '}
                  <Text style={{ fontWeight: '700', color: '#1E293B' }}>
                    {selectedCountry.code} {phoneNumber}
                  </Text>
                </Text>

                <View style={styles.otpGrid}>
                  {otp.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={ref => { inputRefs.current[index] = ref; }}
                      style={[
                        styles.otpBox,
                        digit ? styles.otpBoxFilled : styles.otpBoxEmpty,
                      ]}
                      value={digit}
                      onChangeText={val => handleOtpChange(val, index)}
                      onKeyPress={e => handleOtpKeyPress(e, index)}
                      keyboardType="numeric"
                      maxLength={1}
                      textAlign="center"
                      autoFocus={index === 0}
                    />
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.modalPrimaryBtn}
                  onPress={handleVerifyOtp}
                  disabled={phoneLoading}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#7C3AED', '#4F46E5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.modalBtnGradient}
                  >
                    {phoneLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.modalBtnText}>Confirm & Link Number</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.resendContainer}>
                  <Text style={styles.resendText}>Didn't receive code? </Text>
                  <TouchableOpacity
                    onPress={handleResendOtp}
                    disabled={phoneLoading || resendSeconds > 0}
                  >
                    <Text style={[styles.resendAction, resendSeconds > 0 && { opacity: 0.6 }]}>
                      {resendSeconds > 0
                        ? `Resend in ${resendSeconds}s`
                        : 'Resend OTP'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  glowTopRight: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
  },
  glowBottomLeft: {
    position: 'absolute',
    bottom: 100,
    left: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(79, 70, 229, 0.06)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  securityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 3,
    marginTop: 2,
  },
  securityPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#059669',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  heroCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  shieldIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  heroTextWrapper: {
    flex: 1,
  },
  heroStatusLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.75)',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  heroStatusTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroDescription: {
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 18,
    marginBottom: 18,
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  metaItem: {
    alignItems: 'center',
    flex: 1,
  },
  metaLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  metaDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#64748B',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 16,
  },
  authTile: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tileIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  tileInfo: {
    flex: 1,
  },
  tileTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  tileDesc: {
    fontSize: 12,
    color: '#64748B',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  actionButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 14,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  onlineDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#10B981',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  modalHandleBar: {
    width: 44,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    paddingTop: 6,
  },
  modalSub: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 18,
    lineHeight: 18,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  countryPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    marginRight: 10,
  },
  countryPickerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  phoneInputBox: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '600',
    paddingVertical: 12,
  },
  modalPrimaryBtn: {
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#7C3AED',
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalBtnGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  modalBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  otpGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    marginTop: 6,
  },
  otpBox: {
    width: (width - 40 - 50) / 6,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  otpBoxFilled: {
    borderColor: '#7C3AED',
    backgroundColor: '#F5F3FF',
  },
  otpBoxEmpty: {
    borderColor: '#E2E8F0',
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  resendText: {
    fontSize: 13,
    color: '#64748B',
  },
  resendAction: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7C3AED',
  },
});

export default Account;
