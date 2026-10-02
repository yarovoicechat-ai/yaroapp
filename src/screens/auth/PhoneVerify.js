import React, { useState, useEffect } from 'react';
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
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { RFValue } from 'react-native-responsive-fontsize';
import DeviceInfo from 'react-native-device-info';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getTopSafeInset } from '../../utils/safeAreaUtils';
import { AlertService } from '../../utils/AlertService';
import { apiPublic } from '../../utils/apiUtil';
import { sendFirebasePhoneOtp, getPhoneAuthError } from '../../utils/firebasePhoneAuth';

const { width, height } = Dimensions.get('window');

const MobileVerification = () => {
  const insets = useSafeAreaInsets();
  const topSafeInset = getTopSafeInset(insets.top);
  const navigation = useNavigation();
  const route = useRoute();

  const [mobileNumber, setMobileNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState({ code: '+91', flag: '🇮🇳' });

  useEffect(() => {
    if (route.params?.selectedCountry) {
      setSelectedCountry(route.params.selectedCountry);
    }
  }, [route.params?.selectedCountry]);

  // Native Firebase Phone Auth sends the real SMS.
  const sendOtpAndNavigate = async (fullPhone) => {
    try {
      const verificationId = await sendFirebasePhoneOtp(fullPhone);
      navigation.navigate('MobileVerifyOtp', { phoneNumber: fullPhone, verificationId });
    } catch (error) {
      if (__DEV__) console.log('[PhoneVerify] Firebase OTP request failed:', error?.code || error?.message);
      const errObj = getPhoneAuthError(error);
      AlertService.show(errObj.title, errObj.message, 'error');
    }
  };

  const handleContinue = async () => {
    if (loading) return;

    if (!mobileNumber || mobileNumber.length < 10) {
      AlertService.show('Invalid Phone Number', 'Please enter a valid 10-digit mobile number.', 'error');
      return;
    }

    const fullPhone = `${selectedCountry.code}${mobileNumber}`;
    const deviceId = await DeviceInfo.getUniqueId();

    try {
      setLoading(true);

      const response = await apiPublic.post('/auth/user-phone-check', {
        phoneNumber: fullPhone,
        deviceId,
      });
      const data = response.data;

      if (data.statusCode === 200 && data.success) {
        await sendOtpAndNavigate(fullPhone);
      } else if (data.statusCode === 400) {
        AlertService.show(
          'Already Registered',
          data.message || 'Phone number already registered. Please log in.',
          'error',
          [{ text: 'Go to Login', onPress: () => navigation.navigate('LoginScreen') }]
        );
      } else if (data.statusCode === 403) {
        AlertService.show(
          'Blocked',
          data.message || 'This device already has an account. Please try with another device.',
          'error'
        );
      } else {
        AlertService.show('Something Went Wrong', data.message || 'We couldn\'t process your request right now. Please try again.', 'error');
      }
    } catch (err) {
      if (__DEV__) console.log('API Error:', err);
      const data = err.response?.data;

      if (data?.statusCode === 400) {
        AlertService.show(
          'Already Registered',
          data.message || 'Phone number already registered. Please log in.',
          'error',
          [{ text: 'Go to Login', onPress: () => navigation.navigate('LoginScreen') }]
        );
      } else if (data?.statusCode === 403) {
        AlertService.show(
          'Blocked',
          data.message || 'This device already has an account. Please try with another device.',
          'error'
        );
      } else if (data?.statusCode === 200 && data?.success) {
        await sendOtpAndNavigate(fullPhone);
      } else {
        AlertService.show('Network Error', 'Please check your internet connection and try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const openCountrySelection = () => {
    navigation.navigate('CountrySelection');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#F8FAFC', '#F1F5F9', '#EEF2FF']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, paddingBottom: insets.bottom || 0 }}
      >
        <TouchableOpacity style={[styles.backButton, { top: topSafeInset + 8 }]} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={28} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={styles.title}>Enter your mobile number</Text>
          <View style={styles.inputContainer}>
            <TouchableOpacity style={styles.countryCode} onPress={openCountrySelection}>
              <Text style={styles.flagText}>{selectedCountry.flag}</Text>
              <Text style={styles.codeText}>{selectedCountry.code}</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.phoneInput}
              placeholder="Enter mobile number"
              placeholderTextColor="#94A3B8"
              value={mobileNumber}
              onChangeText={setMobileNumber}
              keyboardType="phone-pad"
              maxLength={10}
              editable={!loading}
            />
          </View>

          <TouchableOpacity onPress={handleContinue} disabled={loading} style={styles.continueButton}>
            <LinearGradient
              colors={['#6366F1', '#4F46E5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Text style={styles.buttonText}>Continue</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.description}>
            We will send a 6-digit code to verify your number
          </Text>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

export default MobileVerification;

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: width * 0.06, justifyContent: 'center' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  loadingText: { color: '#64748B', marginTop: 10 },
  backButton: { position: 'absolute', left: width * 0.04, zIndex: 1 },
  content: { alignItems: 'center', marginTop: height * 0.1 },
  title: { fontSize: RFValue(22), color: '#0F172A', fontWeight: 'bold', marginBottom: height * 0.03 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', width: '85%', borderBottomWidth: 1.5, borderBottomColor: '#CBD5E1', marginBottom: height * 0.04, paddingBottom: 6 },
  countryCode: { flexDirection: 'row', alignItems: 'center', marginRight: 10 },
  flagText: { fontSize: RFValue(18) },
  codeText: { color: '#0F172A', fontSize: RFValue(16), marginLeft: 5, fontWeight: '600' },
  phoneInput: { flex: 1, fontSize: RFValue(16), color: '#0F172A', paddingVertical: 0 },
  continueButton: { width: '85%', borderRadius: RFValue(12), overflow: 'hidden', shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  gradientButton: { paddingVertical: height * 0.016, alignItems: 'center', borderRadius: RFValue(12) },
  buttonText: { fontSize: RFValue(16), color: '#fff', fontWeight: 'bold' },
  description: { color: '#64748B', textAlign: 'center', marginTop: height * 0.025, fontSize: RFValue(12) },
});
