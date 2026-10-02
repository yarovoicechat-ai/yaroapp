import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  StatusBar,
  View as ScreenBackgroundView,
  Image as ScreenBackgroundImage,
  StatusBar as ScreenBackgroundStatusBar,
  StyleSheet as ScreenBackgroundStyleSheet
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { RFValue } from 'react-native-responsive-fontsize';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { AlertService } from '../../utils/AlertService';
import { apiPublic } from '../../utils/apiUtil';
import { sendFirebasePhoneOtp, getPhoneAuthError } from '../../utils/firebasePhoneAuth';
import MithiChatLogo from '../../components/MithiChatLogo';

const { width, height } = Dimensions.get('window');
const AppLogo = require('../../assets/app_icon.png');
const ForgotBG = require('../../assets/backgraund/forgot_background.jpeg');

const ForgotPassword = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, StatusBar.currentHeight || 0, 24);
  const [mobileNumber, setMobileNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState({ code: '+91', flag: '🇮🇳' });

  const openCountrySelection = () => {
    navigation.navigate('CountrySelection', {
      selectedCountry,
      onSelect: (country) => setSelectedCountry(country),
    });
  };

  const handleContinue = async () => {
    if (loading) return;

    if (!mobileNumber || mobileNumber.length < 10) {
      AlertService.show('Invalid Phone Number', 'Please enter a valid 10-digit mobile number.', 'error');
      return;
    }

    const fullPhone = `${selectedCountry.code}${mobileNumber}`;

    try {
      setLoading(true);
      if (__DEV__) console.log('[ForgotPassword] Verifying registered user & requesting OTP for:', fullPhone);

      const serverResponse = await apiPublic.post('/auth/forgot-password', {
        phoneNumber: fullPhone,
      });

      if (!serverResponse.data?.success) {
        AlertService.show('Something Went Wrong', serverResponse.data?.message || 'Unable to verify account. Please try again.', 'error');
        return;
      }

      const verificationId = await sendFirebasePhoneOtp(fullPhone);
      navigation.navigate('OTPVerificationPhone', {
        phoneNumber: fullPhone,
        isResetPassword: true,
        verificationId,
      });
    } catch (err) {
      if (__DEV__) {
        console.log('[ForgotPassword] OTP request failed:', {
          status: err.response?.status,
          message: err.response?.data?.message || err.message,
        });
      }
      const statusCode = err.response?.status;
      const serverMsg = err.response?.data?.message;

      if (statusCode === 404) {
        AlertService.show('Account Not Found', serverMsg || 'No account registered with this phone number. Please check and try again.', 'error');
      } else if (statusCode === 403) {
        AlertService.show('Account Blocked', serverMsg || 'Your account is currently blocked. Please contact support.', 'error');
      } else if (!err.response && (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error'))) {
        AlertService.show('Network Error', 'Please check your internet connection and try again.', 'error');
      } else {
        const errObj = getPhoneAuthError(err);
        const displayMsg = err.response ? (serverMsg || errObj.message) : errObj.message;
        AlertService.show(errObj.title, displayMsg, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar backgroundColor="transparent" barStyle="dark-content" translucent animated />
      <LinearGradient colors={['#F8FAFC', '#F1F5F9', '#EEF2FF']} style={StyleSheet.absoluteFillObject} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContainer,
            { paddingTop: topPadding + 20, paddingBottom: Math.max(insets.bottom, 24) }
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <TouchableOpacity style={[styles.backButton, { top: topPadding + 10 }]} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>

          {/* Card */}
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <Icon name="key-outline" size={RFValue(28)} color="#6366F1" />
            </View>
            <Text style={styles.cardTitle}>Forgot Password?</Text>
            <Text style={styles.cardSubtitle}>
              Don't worry! Enter your registered mobile number{'\n'}and we'll send you an OTP to reset your password.
            </Text>

            {/* Phone Input */}
            <View style={styles.inputContainer}>
              <TouchableOpacity style={styles.countryCodePill} onPress={openCountrySelection}>
                <Text style={styles.countryCodeText}>{selectedCountry.code}</Text>
                <Icon name="chevron-down" size={RFValue(13)} color="#4F46E5" style={{ marginLeft: 2 }} />
              </TouchableOpacity>
              <View style={styles.divider} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter Mobile Number"
                placeholderTextColor="#94A3B8"
                value={mobileNumber}
                onChangeText={setMobileNumber}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>

            {/* Send OTP Button */}
            <TouchableOpacity onPress={handleContinue} disabled={loading} style={styles.primaryButtonWrapper}>
              <LinearGradient
                colors={['#6366F1', '#4F46E5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButton}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>SEND OTP</Text>
                    <Icon name="arrow-forward" size={RFValue(18)} color="#fff" style={styles.buttonArrow} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Footer */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Remember your password? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
                <Text style={styles.footerLink}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', paddingBottom: 20 },
  keyboardView: { flex: 1 },
  backButton: {
    position: 'absolute',
    left: width * 0.05,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  card: {
    marginHorizontal: width * 0.05,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: width * 0.06,
    paddingVertical: 32,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    marginTop: 60,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: RFValue(22),
    fontWeight: 'bold',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: RFValue(12.5),
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: height * 0.03,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 4,
    marginBottom: height * 0.025,
    width: '100%',
  },
  countryCodePill: { flexDirection: 'row', alignItems: 'center', paddingRight: 2 },
  countryCodeText: { color: '#4F46E5', fontSize: RFValue(15), fontWeight: '700' },
  divider: { width: 1, height: 22, backgroundColor: '#E2E8F0', marginHorizontal: 10 },
  textInput: { flex: 1, fontSize: RFValue(14), color: '#0F172A', paddingVertical: 6 },
  primaryButtonWrapper: { borderRadius: 14, overflow: 'hidden', marginBottom: height * 0.02, width: '100%' },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
  },
  primaryButtonText: {
    fontSize: RFValue(14),
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 1.2,
  },
  buttonArrow: { marginLeft: 10 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  footerText: { fontSize: RFValue(13), color: '#64748B' },
  footerLink: { fontSize: RFValue(13), color: '#4F46E5', fontWeight: 'bold' },
});

export default ForgotPassword;
