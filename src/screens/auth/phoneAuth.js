import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import DeviceInfo from 'react-native-device-info';
import Icon from 'react-native-vector-icons/Ionicons';
import { RFValue } from 'react-native-responsive-fontsize';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertService } from '../../utils/AlertService';
import { apiPublic } from '../../utils/apiUtil';
import { sendFirebasePhoneOtp, getPhoneAuthError } from '../../utils/firebasePhoneAuth';

const { width, height } = Dimensions.get('window');
const AppIcon = require('../../assets/app_icon.png');

const MobileVerificationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, StatusBar.currentHeight || 0, 24);

  const [mobileNumber, setMobileNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState({ code: '+91', flag: '🇮🇳' });

  useEffect(() => {
    if (route.params?.selectedCountry) {
      setSelectedCountry(route.params.selectedCountry);
    }
  }, [route.params?.selectedCountry]);

  const sendOtpAndNavigate = async (fullPhone) => {
    try {
      setLoading(true);
      const verificationId = await sendFirebasePhoneOtp(fullPhone);
      navigation.navigate('OTPVerificationPhone', {
        phoneNumber: fullPhone,
        isResetPassword: false,
        verificationId,
      });
    } catch (error) {
      if (__DEV__) console.log('[PhoneAuth] Firebase OTP request failed:', error?.code || error?.message);
      const errObj = getPhoneAuthError(error);
      AlertService.show(errObj.title, errObj.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async () => {
    if (!mobileNumber || mobileNumber.length < 10) {
      AlertService.show('Invalid Number', 'Please enter a valid 10-digit mobile number.', 'error');
      return;
    }

    if (!isTermsAccepted) {
      AlertService.show('Terms Required', 'Please accept the Terms of Service & Privacy Policy.', 'error');
      return;
    }

    const fullPhone = `${selectedCountry.code}${mobileNumber}`;

    try {
      setLoading(true);
      const deviceId = await DeviceInfo.getUniqueId();
      const res = await apiPublic.post('/auth/check-user-device', {
        phoneNumber: fullPhone,
        deviceId,
      });

      const { data } = res;

      const handleNavigation = (title, message, nextScreen) => {
        AlertService.show(title, message, 'error', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go to Login', onPress: () => navigation.navigate(nextScreen) },
        ]);
      };

      if (data.success) {
        if (data.canRegister) {
          await sendOtpAndNavigate(fullPhone);
        } else {
          handleNavigation('Already Registered', data.message || 'Phone number already registered.', 'UmangLoginScreen');
        }
      } else {
        if (data.userExists) {
          handleNavigation('Already Registered', data.message || 'Phone number already registered. Please log in.', 'UmangLoginScreen');
        } else if (data.deviceExists) {
          handleNavigation('Blocked', data.message || 'This device already has an account.', 'UmangLoginScreen');
        } else {
          AlertService.show('Error', data.message || 'Unable to proceed.', 'error');
        }
      }
    } catch (err) {
      console.log('[PhoneAuth] API Check Error:', err);
      const statusCode = err.response?.status;
      const apiMsg = err.response?.data?.message;

      if (statusCode === 409) {
        AlertService.show('Already Registered', apiMsg || 'Phone number or device already registered.', 'error', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go to Login', onPress: () => navigation.navigate('UmangLoginScreen') },
        ]);
      } else {
        await sendOtpAndNavigate(fullPhone);
      }
    } finally {
      setLoading(false);
    }
  };

  const openCountrySelection = () => {
    navigation.navigate('CountrySelection', {
      selectedCode: selectedCountry.code,
      onSelect: (country) => setSelectedCountry(country),
    });
  };

  return (
    <LinearGradient
      colors={['#0F021D', '#1F0433', '#2A0644', '#150228', '#0A0014']}
      locations={[0, 0.25, 0.5, 0.75, 1]}
      style={styles.fullScreenGradient}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Decorative Glow Circles */}
      <View style={styles.topGlowCircle} />
      <View style={styles.bottomGlowCircle} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContainer,
            {
              paddingTop: topPadding + 10,
              paddingBottom: Math.max(insets.bottom, 24),
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Logo & Branding Header */}
          <View style={styles.brandingHeader}>
            {/* Glowing 3D Heart Logo */}
            <View style={styles.logoWrapper}>
              <LinearGradient
                colors={['#FF2D87', '#C026D3', '#7E22CE']}
                style={styles.logoGradientRing}
              >
                <Image source={AppIcon} style={styles.appLogo} resizeMode="contain" />
              </LinearGradient>
              <View style={styles.miniHeartBadge1}>
                <Icon name="heart" size={14} color="#FF2D87" />
              </View>
              <View style={styles.miniHeartBadge2}>
                <Icon name="heart" size={10} color="#F472B6" />
              </View>
            </View>

            {/* App Title */}
            <Text style={styles.brandTitle}>Meethi Chat</Text>
            <View style={styles.subtitleRow}>
              <Text style={styles.brandSubtitle}>Connect</Text>
              <Text style={styles.heartDot}> ♥ </Text>
              <Text style={styles.brandSubtitle}>Chat</Text>
              <Text style={styles.heartDot}> ♥ </Text>
              <Text style={styles.brandSubtitle}>Enjoy</Text>
            </View>
          </View>

          {/* Main Glassmorphism Card Container (Sleek Width) */}
          <View style={styles.cardBorderOuter}>
            <LinearGradient
              colors={['rgba(255, 45, 135, 0.5)', 'rgba(192, 38, 211, 0.25)', 'rgba(255, 45, 135, 0.4)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardBorderGradient}
            >
              <View style={styles.cardContent}>
                {/* Person Icon Badge */}
                <View style={styles.iconCircleWrapper}>
                  <LinearGradient
                    colors={['#FF2D87', '#C026D3']}
                    style={styles.iconCircleGradient}
                  >
                    <View style={styles.iconCircleInner}>
                      <Icon name="person-outline" size={RFValue(22)} color="#FF2D87" />
                    </View>
                  </LinearGradient>
                </View>

                {/* Card Title & Subtitle */}
                <Text style={styles.cardTitle}>Create Account</Text>
                <Text style={styles.cardSubtitle}>Let's get you started</Text>

                {/* Phone Input */}
                <View style={styles.inputContainer}>
                  <TouchableOpacity style={styles.countryCodePill} onPress={openCountrySelection}>
                    <Text style={styles.countryCodeText}>{selectedCountry.code}</Text>
                    <Icon name="chevron-down" size={RFValue(12)} color="#FF2D87" style={{ marginLeft: 2 }} />
                  </TouchableOpacity>
                  <View style={styles.divider} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter Mobile Number"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    value={mobileNumber}
                    onChangeText={setMobileNumber}
                    keyboardType="phone-pad"
                    maxLength={10}
                    editable={!loading}
                  />
                </View>

                {/* Safety note */}
                <View style={styles.safetyRow}>
                  <Icon name="shield-checkmark-outline" size={RFValue(12)} color="#FF2D87" style={{ marginRight: 6 }} />
                  <Text style={styles.safetyText}>Your number is safe and secure with us</Text>
                </View>

                {/* Terms Checkbox */}
                <TouchableOpacity
                  style={styles.termsRow}
                  onPress={() => setIsTermsAccepted(!isTermsAccepted)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.checkbox, isTermsAccepted && styles.checkboxChecked]}>
                    {isTermsAccepted && <Icon name="checkmark" size={RFValue(11)} color="#fff" />}
                  </View>
                  <Text style={styles.termsText}>
                    I agree to the{' '}
                    <Text style={styles.termsLink}>Terms of Service</Text>
                    {' '}and{' '}
                    <Text style={styles.termsLink}>Privacy Policy</Text>
                  </Text>
                </TouchableOpacity>

                {/* Create Account Button */}
                <TouchableOpacity onPress={handleContinue} disabled={loading} activeOpacity={0.85} style={styles.primaryButtonWrapper}>
                  <LinearGradient
                    colors={['#FF5E62', '#FF1493', '#AA00FF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryButton}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Text style={styles.primaryButtonText}>CREATE ACCOUNT</Text>
                        <Icon name="arrow-forward" size={RFValue(16)} color="#fff" style={styles.buttonArrow} />
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

                {/* Footer */}
                <View style={styles.footerRow}>
                  <Text style={styles.footerText}>Already have an account? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('UmangLoginScreen')}>
                    <Text style={styles.footerLink}>Login</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

export default MobileVerificationScreen;

const styles = StyleSheet.create({
  fullScreenGradient: {
    flex: 1,
  },
  topGlowCircle: {
    position: 'absolute',
    top: -height * 0.1,
    left: width * 0.15,
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: 'rgba(255, 45, 135, 0.18)',
  },
  bottomGlowCircle: {
    position: 'absolute',
    bottom: -height * 0.1,
    right: width * 0.1,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(192, 38, 211, 0.15)',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 35,
  },
  brandingHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoGradientRing: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF2D87',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
  },
  appLogo: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
  },
  miniHeartBadge1: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: 'rgba(30, 10, 50, 0.9)',
    borderRadius: 12,
    padding: 3,
  },
  miniHeartBadge2: {
    position: 'absolute',
    bottom: 2,
    left: -4,
    backgroundColor: 'rgba(30, 10, 50, 0.9)',
    borderRadius: 10,
    padding: 3,
  },
  brandTitle: {
    fontSize: RFValue(26),
    fontWeight: '900',
    color: '#FF4BB4',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(255, 45, 135, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  brandSubtitle: {
    fontSize: RFValue(11),
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  heartDot: {
    fontSize: RFValue(10),
    color: '#FF2D87',
  },
  cardBorderOuter: {
    marginHorizontal: width * 0.075,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#FF2D87',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  cardBorderGradient: {
    padding: 1.5,
    borderRadius: 24,
  },
  cardContent: {
    backgroundColor: 'rgba(20, 7, 36, 0.88)',
    borderRadius: 22.5,
    paddingHorizontal: width * 0.055,
    paddingVertical: 22,
    alignItems: 'center',
  },
  iconCircleWrapper: {
    marginBottom: 10,
  },
  iconCircleGradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
    padding: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleInner: {
    width: 49,
    height: 49,
    borderRadius: 24.5,
    backgroundColor: '#150528',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: RFValue(19),
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: RFValue(11.5),
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(12, 4, 25, 0.75)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 45, 135, 0.35)',
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 10,
    width: '100%',
  },
  countryCodePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 2,
  },
  countryCodeText: {
    color: '#FF2D87',
    fontSize: RFValue(14),
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(255, 45, 135, 0.3)',
    marginHorizontal: 10,
  },
  textInput: {
    flex: 1,
    fontSize: RFValue(13.5),
    color: '#ffffff',
    paddingVertical: 0,
  },
  safetyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  safetyText: {
    fontSize: RFValue(10.5),
    color: 'rgba(255, 255, 255, 0.55)',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 45, 135, 0.6)',
    backgroundColor: 'rgba(12, 4, 25, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: '#FF2D87',
    borderColor: '#FF2D87',
  },
  termsText: {
    flex: 1,
    fontSize: RFValue(10.5),
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 16,
  },
  termsLink: {
    color: '#FF2D87',
    fontWeight: '600',
  },
  primaryButtonWrapper: {
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 14,
    width: '100%',
    shadowColor: '#FF1493',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 25,
  },
  primaryButtonText: {
    fontSize: RFValue(14),
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 1.2,
  },
  buttonArrow: {
    marginLeft: 8,
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    width: '100%',
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  orText: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: RFValue(11),
    marginHorizontal: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  footerText: {
    fontSize: RFValue(12),
    color: 'rgba(255, 255, 255, 0.6)',
  },
  footerLink: {
    fontSize: RFValue(12),
    color: '#FF2D87',
    fontWeight: 'bold',
  },
});
