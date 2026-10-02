import React, { useState, useRef, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
  Image,
  Platform,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import DeviceInfo from 'react-native-device-info';
import { AuthContext } from '../../context/AuthProvider';
import { AlertService } from '../../utils/AlertService';
import { apiPublic, getApiErrorMessage } from '../../utils/apiUtil';
import MithiChatLogo from '../../components/MithiChatLogo';
import { signInWithGoogleProvider } from '../../configs/googleSignIn';

const { width, height } = Dimensions.get('window');
const MobileLoginBG = require('../../assets/backgraund/mobile_login_background.jpeg');
const GoogleLogo = require('../../assets/Login/google-icon.webp');

const AuthBubbleWelcome = () => {
  const navigation = useNavigation();
  const { login } = useContext(AuthContext);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Floating animation values for bubbles
  const bubble1Anim = useRef(new Animated.Value(0)).current;
  const bubble2Anim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Continuous floating animation loop for Login Bubble
    Animated.loop(
      Animated.sequence([
        Animated.timing(bubble1Anim, {
          toValue: -10,
          duration: 1900,
          useNativeDriver: true,
        }),
        Animated.timing(bubble1Anim, {
          toValue: 0,
          duration: 1900,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Continuous floating animation loop for Create Account Bubble (offset timing)
    Animated.loop(
      Animated.sequence([
        Animated.timing(bubble2Anim, {
          toValue: 10,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(bubble2Anim, {
          toValue: 0,
          duration: 2200,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Pulse animation loop for glowing highlights
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [bubble1Anim, bubble2Anim, pulseAnim]);

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

  const handleOpenLogin = () => {
    navigation.navigate('SignIn');
  };

  const handleOpenCreateAccount = () => {
    navigation.navigate('MobileVerification');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Light Theme Background Gradient */}
      <LinearGradient
        colors={['#F8FAFC', '#F1F5F9', '#EEF2FF']}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Large Prominent App Logo at Top */}
        <View style={styles.brandingHeader}>
          <MithiChatLogo size={195} />
        </View>

        {/* Floating Animated Bubbles Section */}
        <View style={styles.bubblesCenterContainer}>
          <Text style={styles.promptHeading}>Choose your journey</Text>
          <Text style={styles.promptSubheading}>Select an option below to get started</Text>

          {/* BUBBLE 1: LOGIN */}
          <Animated.View
            style={[
              styles.bubbleWrapper,
              { transform: [{ translateY: bubble1Anim }] },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleOpenLogin}
              style={styles.bubbleTouch}
            >
              <LinearGradient
                colors={['#7C3AED', '#C026D3', '#E11D48']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.bubbleGradient}
              >
                <Animated.View
                  style={[
                    styles.bubbleInnerContent,
                    { transform: [{ scale: pulseAnim }] },
                  ]}
                >
                  <View style={styles.bubbleIconContainer}>
                    <Icon name="log-in-outline" size={26} color="#FFFFFF" />
                  </View>
                  <View style={styles.bubbleTextContainer}>
                    <Text style={styles.bubbleTitle}>Login</Text>
                    <Text style={styles.bubbleDesc}>Already have an account? Sign in here</Text>
                  </View>
                  <Icon name="chevron-forward-circle" size={26} color="rgba(255,255,255,0.9)" />
                </Animated.View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* BUBBLE 2: CREATE ACCOUNT */}
          <Animated.View
            style={[
              styles.bubbleWrapper,
              { transform: [{ translateY: bubble2Anim }] },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleOpenCreateAccount}
              style={styles.bubbleTouch}
            >
              <LinearGradient
                colors={['#FF6B00', '#FF2D87', '#C026D3']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.bubbleGradient}
              >
                <Animated.View
                  style={[
                    styles.bubbleInnerContent,
                    { transform: [{ scale: pulseAnim }] },
                  ]}
                >
                  <View style={styles.bubbleIconContainer}>
                    <Icon name="person-add-outline" size={26} color="#FFFFFF" />
                  </View>
                  <View style={styles.bubbleTextContainer}>
                    <Text style={styles.bubbleTitle}>Create Account</Text>
                    <Text style={styles.bubbleDesc}>New user? Register in seconds</Text>
                  </View>
                  <Icon name="chevron-forward-circle" size={26} color="rgba(255,255,255,0.9)" />
                </Animated.View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Bottom Social Auth & Footer */}
        <View style={styles.bottomSection}>
          <View style={styles.orDividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.orText}>OR QUICK SIGN IN</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* GOOGLE SIGN IN BUTTON */}
          <TouchableOpacity
            style={styles.googleAuthBtn}
            onPress={signInWithGoogle}
            disabled={googleLoading}
            activeOpacity={0.8}
          >
            {googleLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Image source={GoogleLogo} style={styles.googleIcon} resizeMode="contain" />
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.termsFooter}>
            <Icon name="shield-checkmark-outline" size={11} color="#C026D3" /> 100% Safe & Secure Authentication
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default AuthBubbleWelcome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  brandingHeader: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 10,
    marginBottom: 4,
  },
  bubblesCenterContainer: {
    paddingHorizontal: 20,
    alignItems: 'center',
    marginVertical: 10,
  },
  promptHeading: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  promptSubheading: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  bubbleWrapper: {
    width: '100%',
    marginBottom: 18,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  bubbleTouch: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  bubbleGradient: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.40)',
  },
  bubbleInnerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bubbleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  bubbleTextContainer: {
    flex: 1,
  },
  bubbleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  bubbleDesc: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.92)',
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 10 : 20,
    alignItems: 'center',
  },
  orDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  orText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    marginHorizontal: 12,
  },
  googleAuthBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  googleIcon: {
    width: 22,
    height: 22,
    marginRight: 12,
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  termsFooter: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },
});
