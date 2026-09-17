import React, { useCallback, useContext, useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  View as ScreenBackgroundView,
  StatusBar as ScreenBackgroundStatusBar,
  StyleSheet as ScreenBackgroundStyleSheet
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { RFValue } from 'react-native-responsive-fontsize';
import { AuthContext } from '../../context/AuthProvider';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { apiUtil } from '../../utils/apiUtil';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Ionicon from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset } from '../../utils/safeAreaUtils';
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

const { width, height } = Dimensions.get('window');

const Account = () => {
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
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

      AlertService.show('Success', 'Phone number verified successfully!', 'success');
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
  return (
    <ScreenBackgroundView style={[{ flex: 1, backgroundColor: '#F8FAFC' }]}>
      <ScreenBackgroundStatusBar translucent backgroundColor="transparent" barStyle="dark-content" animated />
      <LinearGradient colors={['#F8FAFC', '#F1F5F9', '#E2E8F0']} style={ScreenBackgroundStyleSheet.absoluteFillObject} />
      {/* Header */}
      <View style={[styles.header, { paddingTop: topSafeInset + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={28} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerText}>{t('account.title') || 'Account'}</Text>
      </View>

      {/* Google Email Section */}
      <LinearGradient
        colors={['#49BFFD', '#62EFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.card}
      >
        <View style={styles.cardLeft}>
          <Ionicon name="logo-google" size={24} color="#17096b" style={styles.icon} />
          <View style={{ flex: 1 }}>
            <Text style={styles.cardText} numberOfLines={1} ellipsizeMode="tail">
              {(user?.email && user.email.trim() !== '') ? user.email : (t('account.google_email') || 'Google Account')}
            </Text>
          </View>
        </View>
        {user?.emailVerified ? (
          <Icon name="check-circle" size={28} color="#16a34a" />
        ) : googleLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <TouchableOpacity
            style={styles.verifyButton}
            onPress={handleLinkGoogle}
          >
            <Text style={styles.verifyText}>{t('account.verify') || 'Verify'}</Text>
          </TouchableOpacity>
        )}
      </LinearGradient>

      {/* Phone Number Section */}
      <LinearGradient
        colors={['#49BFFD', '#62EFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.card}
      >
        <View style={styles.cardLeft}>
          <Icon name="call" size={24} color="#17096b" style={styles.icon} />
          <View style={{ flex: 1 }}>
            <Text style={styles.cardText} numberOfLines={1} ellipsizeMode="tail">
              {(user?.phoneNumber && String(user.phoneNumber).trim() !== '') ? String(user.phoneNumber) : (t('account.phone_number') || 'Phone Number')}
            </Text>
          </View>
        </View>
        {user?.phoneVerified ? (
          <Icon name="check-circle" size={28} color="#16a34a" />
        ) : (
          <TouchableOpacity
            style={styles.verifyButton}
            onPress={openPhoneModal}
          >
            <Text style={styles.verifyText}>{t('account.verify') || 'Verify'}</Text>
          </TouchableOpacity>
        )}
      </LinearGradient>

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
          <View style={[styles.modalContent, { paddingBottom: Math.max(20, (insets.bottom || 0) + 16) }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setPhoneModalVisible(false)}>
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {phoneStep === 'input' ? 'Link Phone Number' : 'Enter OTP'}
              </Text>
              <View style={{ width: 24 }} />
            </View>

            {phoneStep === 'input' ? (
              /* ====== PHONE INPUT STEP ====== */
              <View style={styles.modalBody}>
                <Text style={styles.modalLabel}>Enter your mobile number</Text>
                <View style={styles.phoneInputContainer}>
                  <TouchableOpacity
                    style={styles.countryCodeBtn}
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
                    <Text style={styles.countryCodeText}>{selectedCountry.flag} {selectedCountry.code}</Text>
                    <Icon name="chevron-down" size={16} color="#fff" style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="Enter mobile number"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                </View>
                <TouchableOpacity
                  style={styles.sendOtpButton}
                  onPress={handleSendOtp}
                  disabled={phoneLoading}
                >
                  <LinearGradient
                    colors={['#49BFFD', '#62EFFF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientBtn}
                  >
                    {phoneLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.sendOtpText}>Send OTP</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              /* ====== OTP VERIFICATION STEP ====== */
              <View style={styles.modalBody}>
                <Text style={styles.modalLabel}>
                  We sent a 6-digit code to{'\n'}{selectedCountry.code}{phoneNumber}
                </Text>
                <View style={styles.otpContainer}>
                  {otp.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={ref => { inputRefs.current[index] = ref; }}
                      style={[
                        styles.otpInput,
                        digit ? styles.otpInputFilled : styles.otpInputEmpty,
                      ]}
                      value={digit}
                      onChangeText={value => handleOtpChange(value, index)}
                      onKeyPress={e => handleOtpKeyPress(e, index)}
                      keyboardType="numeric"
                      maxLength={1}
                      textAlign="center"
                      autoFocus={index === 0}
                    />
                  ))}
                </View>
                <TouchableOpacity
                  style={styles.sendOtpButton}
                  onPress={handleVerifyOtp}
                  disabled={phoneLoading}
                >
                  <LinearGradient
                    colors={['#49BFFD', '#62EFFF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientBtn}
                  >
                    {phoneLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.sendOtpText}>Verify</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
                <View style={styles.resendRow}>
                  <Text style={styles.resendLabel}>Didn't receive the code? </Text>
                  <TouchableOpacity onPress={handleResendOtp} disabled={phoneLoading || resendSeconds > 0}>
                    <Text style={[styles.resendLink, resendSeconds > 0 && { opacity: 0.5 }]}>
                      {resendSeconds > 0
                        ? `Resend in 00:${String(resendSeconds).padStart(2, '0')}`
                        : 'Resend OTP'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenBackgroundView>
  );
};

export default Account;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: width * 0.05,
    paddingBottom: 20,
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: '#fff',
    marginRight: 15,
  },
  headerText: {
    fontSize: RFValue(20),
    color: '#0F172A',
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginRight: 24, // balance back button
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: width * 0.05,
    borderRadius: 15,
    paddingVertical: height * 0.02,
    paddingHorizontal: width * 0.05,
    marginBottom: height * 0.02,
    elevation: 5,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  icon: {
    marginRight: 15,
  },
  cardText: {
    fontSize: RFValue(16),
    fontWeight: '500',
    color: '#fff',
  },
  status: {
    fontSize: RFValue(14),
    fontWeight: '600',
  },
  verifyButton: {
    paddingVertical: 6,
    paddingHorizontal: 5,
  },
  verifyText: {
    color: 'red',
    fontSize: RFValue(14),
    fontWeight: '600',
  },

  // ====== Modal Styles ======
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#17096b',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingBottom: 40,
    minHeight: height * 0.45,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: RFValue(18),
    fontWeight: 'bold',
    color: '#fff',
  },
  modalBody: {
    padding: 25,
    alignItems: 'center',
  },
  modalLabel: {
    fontSize: RFValue(14),
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: RFValue(22),
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.3)',
    marginBottom: 30,
    paddingBottom: 8,
  },
  countryCodeBtn: {
    marginRight: 10,
    paddingVertical: 5,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
  },
  countryCodeText: {
    color: '#fff',
    fontSize: RFValue(14),
  },
  phoneInput: {
    flex: 1,
    fontSize: RFValue(16),
    color: '#fff',
    paddingVertical: 5,
  },
  sendOtpButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradientBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
  },
  sendOtpText: {
    fontSize: RFValue(16),
    color: '#fff',
    fontWeight: 'bold',
  },

  // OTP styles
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 30,
    width: '100%',
  },
  otpInput: {
    width: width * 0.11,
    height: width * 0.11,
    borderRadius: width * 0.055,
    fontSize: RFValue(18),
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  otpInputEmpty: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  otpInputFilled: {
    backgroundColor: '#2d1b3d',
    borderWidth: 2,
    borderColor: '#8b5cf6',
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  resendLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: RFValue(13),
  },
  resendLink: {
    color: '#8b5cf6',
    fontSize: RFValue(13),
    fontWeight: '600',
  },
});
