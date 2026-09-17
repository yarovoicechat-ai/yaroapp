import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  ActivityIndicator,
  View as ScreenBackgroundView,
  Image as ScreenBackgroundImage,
  StatusBar as ScreenBackgroundStatusBar,
  StyleSheet as ScreenBackgroundStyleSheet
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RFValue } from 'react-native-responsive-fontsize';
import LinearGradient from 'react-native-linear-gradient';
import { AlertService } from '../../utils/AlertService';
import { auth } from '../../configs/firebaseConfig';
import {
  clearFirebasePhoneSession,
  confirmFirebasePhoneOtp,
  getPhoneAuthError,
  getOtpResendCooldown,
  isFirebaseUserForPhone,
  sendFirebasePhoneOtp,
  signOutFirebasePhoneUser,
} from '../../utils/firebasePhoneAuth';

const { width, height } = Dimensions.get('window');
const OtpBG = require('../../assets/backgraund/otp_background.jpeg');

const OTPVerificationPhoneAuth = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { phoneNumber, isResetPassword } = route.params || {};

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [verificationId, setVerificationId] = useState(route.params?.verificationId || null);
  const [loading, setLoading] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(60);
  const inputRefs = useRef([]);
  const verificationCompletedRef = useRef(false);

  const completeFirebaseVerification = useCallback(async (firebaseUser) => {
    if (verificationCompletedRef.current || !firebaseUser) return;
    verificationCompletedRef.current = true;

    try {
      const firebaseIdToken = await firebaseUser.getIdToken(true);
      await signOutFirebasePhoneUser();
      navigation.replace('PasswordSetup', {
        phoneNumber,
        isResetPassword,
        firebaseIdToken,
      });
    } catch (error) {
      verificationCompletedRef.current = false;
      const errObj = getPhoneAuthError(error);
      AlertService.show(errObj.title, errObj.message, 'error');
    }
  }, [isResetPassword, navigation, phoneNumber]);

  useEffect(() => {
    let isMounted = true;
    const checkCooldown = async () => {
      if (!phoneNumber) return;
      const remaining = await getOtpResendCooldown(phoneNumber, 60);
      if (isMounted) {
        setResendSeconds(remaining > 0 ? remaining : 60);
      }
    };
    checkCooldown();
    return () => { isMounted = false; };
  }, [phoneNumber]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      if (isFirebaseUserForPhone(firebaseUser, phoneNumber)) {
        completeFirebaseVerification(firebaseUser);
      }
    });
    return unsubscribe;
  }, [completeFirebaseVerification, phoneNumber]);

  useEffect(() => {
    if (resendSeconds <= 0) return undefined;
    const timer = setTimeout(() => setResendSeconds(seconds => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendSeconds]);

  const handleOtpChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleContinue = async () => {
    if (loading) return;

    const otpString = otp.join('');
    if (otpString.length !== 6 || !/^\d{6}$/.test(otpString)) {
      AlertService.show('Invalid OTP', 'The OTP you entered is incorrect. Please check the code and try again.', 'error');
      return;
    }

    try {
      setLoading(true);
      const credential = await confirmFirebasePhoneOtp(verificationId, otpString);
      await completeFirebaseVerification(credential?.user || auth.currentUser);
    } catch (err) {
      if (__DEV__) console.log('Firebase OTP verification error:', err?.code || err?.message);

      if (err?.code === 'auth/session-expired' || err?.code === 'auth/code-expired') {
        try {
          clearFirebasePhoneSession();
          const freshVerificationId = await sendFirebasePhoneOtp(phoneNumber, true);
          setVerificationId(freshVerificationId);
          setOtp(['', '', '', '', '', '']);
          setResendSeconds(60);
          AlertService.show('Session Expired', 'The old OTP session expired. A fresh OTP has been sent.', 'info');
        } catch (resendError) {
          const errObj = getPhoneAuthError(resendError);
          AlertService.show(errObj.title, errObj.message, 'error');
        }
      } else {
        const errObj = getPhoneAuthError(err);
        AlertService.show(errObj.title, errObj.message, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (loading || resendSeconds > 0) return;

    try {
      setLoading(true);
      verificationCompletedRef.current = false;
      const freshVerificationId = await sendFirebasePhoneOtp(phoneNumber, true);
      setVerificationId(freshVerificationId);
      setOtp(['', '', '', '', '', '']);
      setResendSeconds(60);
      inputRefs.current[0]?.focus();
      AlertService.show('OTP Sent', 'A fresh 6-digit OTP has been sent to your mobile number.', 'success');
    } catch (err) {
      if (__DEV__) console.log('Firebase OTP resend error:', err?.code || err?.message);
      const errObj = getPhoneAuthError(err);
      AlertService.show(errObj.title, errObj.message, 'error');
    } finally {
      setLoading(false);
    }
  };
  return (
    <ScreenBackgroundView style={[{ flex: 1, backgroundColor: '#F8FAFC' }]}>
      <ScreenBackgroundStatusBar backgroundColor="#FFFFFF" barStyle="dark-content" animated />
      <ScreenBackgroundImage source={OtpBG} style={ScreenBackgroundStyleSheet.absoluteFillObject} resizeMode="cover" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={28} color="#ffffff" />
          </TouchableOpacity>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>OTP Verification</Text>
            <Text style={styles.cardSubtitle}>
              We have sent a 6-digit OTP to
            </Text>
            <Text style={styles.phoneHighlight}>
              {phoneNumber || '+91 98765 43210'}
            </Text>

            {/* OTP Boxes */}
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  style={[
                    styles.otpInput,
                    digit ? styles.otpInputFilled : styles.otpInputEmpty,
                  ]}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="numeric"
                  maxLength={1}
                  textAlign="center"
                  autoFocus={index === 0}
                />
              ))}
            </View>

            {/* Resend row */}
            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Didn't receive OTP? </Text>
              <TouchableOpacity
                onPress={handleResend}
                disabled={loading || resendSeconds > 0}
              >
                <Text style={[styles.resendLink, resendSeconds > 0 && styles.resendLinkDisabled]}>
                  {resendSeconds > 0
                    ? `Resend in 00:${String(resendSeconds).padStart(2, '0')}`
                    : 'Resend OTP'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Primary Gradient Button */}
            <TouchableOpacity onPress={handleContinue} disabled={loading} style={styles.primaryButtonWrapper}>
              <LinearGradient
                colors={['#FF6B00', '#FF2D87', '#C026D3']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButton}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>VERIFY OTP</Text>
                    <Icon name="arrow-forward" size={RFValue(18)} color="#fff" style={{ marginLeft: 8 }} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* OR Divider */}
            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.orLine} />
            </View>

            {/* Change Mobile Number Button */}
            <TouchableOpacity
              style={styles.changePhoneBtn}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.changePhoneText}>Change Mobile Number</Text>
              <Icon name="chevron-forward" size={RFValue(16)} color="#FF2D87" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBackgroundView>
  );
};

export default OTPVerificationPhoneAuth;

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, paddingTop: height * 0.45, paddingBottom: 20 },
  keyboardView: { flex: 1 },
  backButton: {
    padding: 20,
    position: 'absolute',
    top: Platform.OS === 'ios' ? 40 : 20,
    left: 0,
    zIndex: 10,
  },
  card: {
    marginHorizontal: width * 0.05,
    backgroundColor: 'transparent',
    borderRadius: 24,
    borderWidth: 0,
    paddingHorizontal: width * 0.04,
    alignItems: 'center',
    marginBottom: 30,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(192,38,211,0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(192,38,211,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: RFValue(22),
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: RFValue(13),
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 4,
  },
  phoneHighlight: {
    fontSize: RFValue(14),
    fontWeight: 'bold',
    color: '#FF2D87',
    textAlign: 'center',
    marginBottom: height * 0.025,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: height * 0.025,
    width: '100%',
    gap: 8,
  },
  otpInput: {
    width: width * 0.11,
    height: width * 0.12,
    borderRadius: 12,
    fontSize: RFValue(18),
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  otpInputEmpty: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1.5,
    borderColor: 'rgba(192,38,211,0.4)',
  },
  otpInputFilled: {
    backgroundColor: 'rgba(192, 38, 211, 0.25)',
    borderWidth: 2,
    borderColor: '#FF2D87',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: height * 0.025,
  },
  resendText: {
    fontSize: RFValue(13),
    color: 'rgba(255, 255, 255, 0.6)',
  },
  resendLink: {
    fontSize: RFValue(13),
    color: '#FF2D87',
    fontWeight: 'bold',
  },
  resendLinkDisabled: {
    color: 'rgba(255, 255, 255, 0.45)',
  },
  primaryButtonWrapper: { borderRadius: 12, overflow: 'hidden', marginBottom: height * 0.015, width: '100%' },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 12,
  },
  primaryButtonText: {
    fontSize: RFValue(13.5),
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: height * 0.015,
    width: '100%',
  },
  orLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.15)' },
  orText: { marginHorizontal: 12, fontSize: RFValue(11), color: 'rgba(255,255,255,0.4)', fontWeight: '600' },
  changePhoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(192,38,211,0.4)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    width: '100%',
  },
  changePhoneText: {
    fontSize: RFValue(12),
    color: '#ffffff',
    fontWeight: '600',
  },
});
