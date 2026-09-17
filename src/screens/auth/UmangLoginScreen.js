import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StatusBar,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { AlertService } from '../../utils/AlertService';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import DeviceInfo from 'react-native-device-info';
import { AuthContext } from '../../context/AuthProvider';
import Icon from 'react-native-vector-icons/Ionicons';
import { RFValue } from 'react-native-responsive-fontsize';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiPublic, getApiErrorMessage } from '../../utils/apiUtil';
import { signInWithGoogleProvider } from '../../configs/googleSignIn';

const GoogleLogo = require('../../assets/Login/google-icon.webp');
const AppIcon = require('../../assets/app_icon.png');
const { width, height } = Dimensions.get('window');

const UmangLoginScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, StatusBar.currentHeight || 0, 24);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [selectedCountry] = useState({ name: 'India', code: '+91', flag: '🇮🇳' });
  const { login } = useContext(AuthContext);

  const signInWithGoogle = async () => {
    let idToken;
    try {
      setGoogleLoading(true);
      idToken = await signInWithGoogleProvider();
      const deviceId = await DeviceInfo.getUniqueId();
      const res = await apiPublic.post('/auth/user-google-auth', {
        googleIdToken: idToken,
        deviceId,
        userFrom: 'app',
      });
      if (res.data.success) {
        const { accessToken, refreshToken, role, isAccount, gender } = res.data.data;
        if (isAccount) {
          await login({ accessToken, refreshToken, role, gender, isRegister: false });
        } else {
          navigation.navigate('AgeSelection', { idToken });
        }
      } else {
        AlertService.show('Login Failed', res.data.message || 'Please try again.', 'error');
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 428 || error.response.data?.statusCode === 428) {
          navigation.navigate('AgeSelection', { idToken });
          return;
        }
      }
      AlertService.show('Login Error', getApiErrorMessage(error, 'Google login failed'), 'error');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      AlertService.show('Invalid Number', 'Please enter a valid 10-digit mobile number.', 'error');
      return;
    }
    if (!password) {
      AlertService.show('Missing Password', 'Please enter your password.', 'error');
      return;
    }
    try {
      setLoading(true);
      const deviceId = await DeviceInfo.getUniqueId();
      const payload = {
        phoneNumber: `${selectedCountry.code}${phoneNumber}`,
        password,
        deviceId,
        userFrom: 'app',
      };
      const response = await apiPublic.post('/auth/user-login', payload);

      if (response.data.success) {
        const { accessToken, refreshToken, role, gender } = response.data.data;
        await login({ accessToken, refreshToken, role, gender, isRegister: false });
      } else {
        AlertService.show('Login Failed', response.data.message || 'Please try again.', 'error');
      }
    } catch (err) {
      AlertService.show('Login Failed', getApiErrorMessage(err, 'Login failed. Please try again.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#0F021D', '#1F0433', '#2A0644', '#150228', '#0A0014']}
      locations={[0, 0.25, 0.5, 0.75, 1]}
      style={styles.fullScreenGradient}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Decorative Glow Elements */}
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
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Logo & Branding Header */}
          <View style={styles.brandingHeader}>
            {/* Glowing 3D Heart Logo Container */}
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

          {/* Main Glassmorphism Card Container */}
          <View style={styles.cardBorderOuter}>
            <LinearGradient
              colors={['rgba(255, 45, 135, 0.45)', 'rgba(192, 38, 211, 0.25)', 'rgba(255, 45, 135, 0.35)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardBorderGradient}
            >
              <View style={styles.cardContent}>
                {/* Card Header */}
                <Text style={styles.cardTitle}>Welcome Back</Text>
                <Text style={styles.cardSubtitle}>Login to continue your journey</Text>

                {/* Phone Input */}
                <View style={styles.inputContainer}>
                  <View style={styles.countryCodePill}>
                    <Text style={styles.countryCodeText}>{selectedCountry.code}</Text>
                  </View>
                  <View style={styles.divider} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter Mobile Number"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    keyboardType="phone-pad"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    maxLength={10}
                  />
                </View>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <Icon name="lock-closed-outline" size={RFValue(16)} color="#FF2D87" style={styles.inputIcon} />
                  <View style={styles.divider} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter Password"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                    <Icon name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={RFValue(16)} color="#FF2D87" />
                  </TouchableOpacity>
                </View>

                {/* Forgot Password */}
                <TouchableOpacity
                  style={styles.forgotPasswordRow}
                  onPress={() => navigation.navigate('ForgotPassword')}
                >
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>

                {/* Login Button with Vibrant Orange to Pink Gradient */}
                <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.85} style={styles.primaryButtonWrapper}>
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
                        <Text style={styles.primaryButtonText}>LOGIN</Text>
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

                {/* Google Sign In Button */}
                <TouchableOpacity
                  style={styles.googleButton}
                  onPress={signInWithGoogle}
                  disabled={googleLoading || loading}
                  activeOpacity={0.8}
                >
                  {googleLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Image source={GoogleLogo} style={styles.googleLogo} resizeMode="contain" />
                      <Text style={styles.googleButtonText}>Continue with Google</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Footer */}
                <View style={styles.footerRow}>
                  <Text style={styles.footerText}>Don't have an account? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('MobileVerification')}>
                    <Text style={styles.footerLink}>Sign Up</Text>
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
    marginBottom: 20,
  },
  logoWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  logoGradientRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
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
    width: 80,
    height: 80,
    borderRadius: 40,
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
    fontSize: RFValue(28),
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
    marginTop: 4,
  },
  brandSubtitle: {
    fontSize: RFValue(11.5),
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
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  cardBorderGradient: {
    padding: 1.5,
    borderRadius: 24,
  },
  cardContent: {
    backgroundColor: 'rgba(22, 8, 38, 0.88)',
    borderRadius: 22.5,
    paddingHorizontal: width * 0.06,
    paddingVertical: 24,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: RFValue(20),
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: RFValue(11.5),
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 5, 30, 0.7)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 45, 135, 0.35)',
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 12,
    width: '100%',
  },
  countryCodePill: {
    paddingRight: 4,
  },
  countryCodeText: {
    color: '#ffffff',
    fontSize: RFValue(14),
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(255, 45, 135, 0.3)',
    marginHorizontal: 10,
  },
  inputIcon: {
    marginRight: 2,
  },
  textInput: {
    flex: 1,
    fontSize: RFValue(13.5),
    color: '#ffffff',
    paddingVertical: 0,
  },
  eyeBtn: {
    paddingLeft: 8,
  },
  forgotPasswordRow: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  forgotPasswordText: {
    fontSize: RFValue(11.5),
    color: '#FF2D87',
    fontWeight: '600',
  },
  primaryButtonWrapper: {
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 16,
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
    marginBottom: 16,
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
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 16,
  },
  googleLogo: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  googleButtonText: {
    fontSize: RFValue(13.5),
    color: '#ffffff',
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
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

export default UmangLoginScreen;
