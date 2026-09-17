import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
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
import { apiPublic, getApiErrorMessage } from '../../utils/apiUtil';
import MithiChatLogo from '../../components/MithiChatLogo';

const { width, height } = Dimensions.get('window');
const AppLogo = require('../../assets/app_icon.png');
const SetPasswordBG = require('../../assets/backgraund/set_password_background.jpeg');

const PasswordSetupScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { phoneNumber, firebaseIdToken } = route.params || { phoneNumber: '' };

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Real-time password validation
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const handleSubmit = async () => {
    if (!password || !confirmPassword) {
      AlertService.show('Error', 'Please fill in all fields', 'error');
      return;
    }
    if (password !== confirmPassword) {
      AlertService.show('Error', 'Passwords do not match', 'error');
      return;
    }
    if (password.length < 8) {
      AlertService.show('Error', 'Password must be at least 8 characters long', 'error');
      return;
    }

    if (route.params?.isResetPassword) {
      setLoading(true);
      try {
        const res = await apiPublic.post('/auth/reset-password', {
          phoneNumber,
          newPassword: password,
          firebaseIdToken,
        });
        if (res.data.success) {
          AlertService.show('Success', 'Password reset successfully. You can now login.', 'success');
          navigation.navigate('UmangLoginScreen');
        } else {
          AlertService.show('Error', res.data.message || 'Failed to reset password.', 'error');
        }
      } catch (err) {
        AlertService.show('Error', getApiErrorMessage(err, 'Password reset failed.'), 'error');
      } finally {
        setLoading(false);
      }
    } else {
      navigation.navigate('AgeSelection', { password, phoneNumber, firebaseIdToken });
    }
  };

  const RequirementItem = ({ met, label }) => (
    <View style={styles.reqItem}>
      <Icon
        name={met ? 'checkmark-circle' : 'checkmark-circle-outline'}
        size={RFValue(14)}
        color={met ? '#FF2D87' : 'rgba(255,255,255,0.3)'}
        style={{ marginRight: 6 }}
      />
      <Text style={[styles.reqText, met && styles.reqTextMet]}>{label}</Text>
    </View>
  );

  return (
    <ScreenBackgroundView style={[{ flex: 1, backgroundColor: '#F8FAFC' }]}>
      <ScreenBackgroundStatusBar backgroundColor="#FFFFFF" barStyle="dark-content" animated />
      <ScreenBackgroundImage source={SetPasswordBG} style={ScreenBackgroundStyleSheet.absoluteFillObject} resizeMode="cover" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Set Password</Text>
            <Text style={styles.cardSubtitle}>
              Create a strong password to{'\n'}secure your account
            </Text>

            {/* New Password Input */}
            <View style={styles.inputContainer}>
              <Icon name="lock-closed-outline" size={RFValue(18)} color="#C026D3" style={styles.inputIcon} />
              <View style={styles.divider} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter New Password"
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Icon name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={RFValue(18)} color="#C026D3" />
              </TouchableOpacity>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Icon name="lock-closed-outline" size={RFValue(18)} color="#C026D3" style={styles.inputIcon} />
              <View style={styles.divider} />
              <TextInput
                style={styles.textInput}
                placeholder="Confirm New Password"
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeBtn}>
                <Icon name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'} size={RFValue(18)} color="#C026D3" />
              </TouchableOpacity>
            </View>

            {/* Password Requirements */}
            <View style={styles.requirementsCard}>
              <Text style={styles.requirementsTitle}>Your password must contain:</Text>
              <View style={styles.requirementsGrid}>
                <View style={styles.requirementsCol}>
                  <RequirementItem met={hasMinLength} label="At least 8 characters" />
                  <RequirementItem met={hasUppercase} label="One uppercase letter" />
                </View>
                <View style={styles.requirementsCol}>
                  <RequirementItem met={hasNumber} label="One number" />
                  <RequirementItem met={hasSpecial} label="One special character" />
                </View>
              </View>
            </View>

            {/* Set Password Button */}
            <TouchableOpacity onPress={handleSubmit} disabled={loading} style={styles.primaryButtonWrapper}>
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
                    <Text style={styles.primaryButtonText}>SET PASSWORD</Text>
                    <Icon name="arrow-forward" size={RFValue(18)} color="#fff" style={styles.buttonArrow} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Footer security note */}
            <View style={styles.secureRow}>
              <Icon name="shield-outline" size={RFValue(13)} color="#C026D3" style={{ marginRight: 6 }} />
              <Text style={styles.secureText}>
                Your account is{' '}
                <Text style={styles.secureHighlight}>100% secure</Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBackgroundView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, paddingTop: height * 0.44, paddingBottom: 20 },
  keyboardView: { flex: 1 },
  backButton: { position: 'absolute', top: Platform.OS === 'ios' ? 40 : 20, left: width * 0.04, zIndex: 10, padding: 10 },
  logoSection: { marginTop: height * 0.03, marginBottom: height * 0.03, alignItems: 'center' },
  logo: { width: Math.min(width * 0.55, 220), height: Math.min(width * 0.32, 130) },
  card: {
    marginHorizontal: width * 0.10,
    backgroundColor: 'transparent',
    borderRadius: 24,
    borderWidth: 0,
    paddingHorizontal: 0,
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: RFValue(17),
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: RFValue(11),
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 15,
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: 'rgba(192,38,211,0.45)',
    paddingHorizontal: 10,
    height: 42,
    marginBottom: 8,
    width: '100%',
  },
  inputIcon: { marginRight: 2 },
  divider: { width: 1, height: 16, backgroundColor: 'rgba(192,38,211,0.4)', marginHorizontal: 6 },
  textInput: { flex: 1, fontSize: RFValue(12), color: '#ffffff', paddingVertical: 2 },
  eyeBtn: { paddingLeft: 6 },
  requirementsCard: {
    width: '100%',
    backgroundColor: 'rgba(192,38,211,0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(192,38,211,0.3)',
    padding: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  requirementsTitle: {
    fontSize: RFValue(10.5),
    color: '#FF2D87',
    fontWeight: '600',
    marginBottom: 4,
  },
  requirementsGrid: { flexDirection: 'row' },
  requirementsCol: { flex: 1 },
  reqItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  reqText: { fontSize: RFValue(9.5), color: 'rgba(255,255,255,0.45)' },
  reqTextMet: { color: 'rgba(255,255,255,0.85)' },
  primaryButtonWrapper: { borderRadius: 10, overflow: 'hidden', marginBottom: 8, width: '100%' },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: 10,
  },
  primaryButtonText: {
    fontSize: RFValue(12.5),
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 1,
  },
  buttonArrow: { marginLeft: 8 },
  secureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  secureText: { fontSize: RFValue(10), color: 'rgba(255,255,255,0.5)' },
  secureHighlight: { color: '#FF2D87', fontWeight: '700' },
});

export default PasswordSetupScreen;
