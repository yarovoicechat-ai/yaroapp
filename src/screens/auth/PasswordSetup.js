import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  StatusBar,
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
          navigation.navigate('SignIn');
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
        color={met ? '#10B981' : '#CBD5E1'}
        style={{ marginRight: 6 }}
      />
      <Text style={[styles.reqText, met && styles.reqTextMet]}>{label}</Text>
    </View>
  );

  return (
    <View style={styles.screen}>
      <StatusBar backgroundColor="transparent" barStyle="dark-content" translucent animated />
      <LinearGradient colors={['#F8FAFC', '#F1F5F9', '#EEF2FF']} style={StyleSheet.absoluteFillObject} />
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
            <Icon name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>

          {/* Card */}
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <Icon name="lock-closed-outline" size={RFValue(28)} color="#6366F1" />
            </View>
            <Text style={styles.cardTitle}>Set Password</Text>
            <Text style={styles.cardSubtitle}>
              Create a strong password to{'\n'}secure your account
            </Text>

            {/* New Password Input */}
            <View style={styles.inputContainer}>
              <Icon name="lock-closed-outline" size={RFValue(18)} color="#6366F1" style={styles.inputIcon} />
              <View style={styles.divider} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter New Password"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Icon name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={RFValue(18)} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Icon name="lock-closed-outline" size={RFValue(18)} color="#6366F1" style={styles.inputIcon} />
              <View style={styles.divider} />
              <TextInput
                style={styles.textInput}
                placeholder="Confirm New Password"
                placeholderTextColor="#94A3B8"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeBtn}>
                <Icon name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'} size={RFValue(18)} color="#64748B" />
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
                colors={['#6366F1', '#4F46E5']}
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
              <Icon name="shield-checkmark-outline" size={RFValue(14)} color="#10B981" style={{ marginRight: 6 }} />
              <Text style={styles.secureText}>
                Your account is{' '}
                <Text style={styles.secureHighlight}>100% secure</Text>
              </Text>
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
  scrollContainer: {
    flexGrow: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 25) + 10,
    paddingHorizontal: width * 0.05,
    paddingBottom: 30,
    justifyContent: 'center',
  },
  keyboardView: { flex: 1 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    alignSelf: 'flex-start',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: width * 0.05,
    paddingVertical: 28,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: RFValue(20),
    fontWeight: 'bold',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: RFValue(12),
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 18,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 12,
    width: '100%',
  },
  inputIcon: { marginRight: 2 },
  divider: { width: 1, height: 20, backgroundColor: '#E2E8F0', marginHorizontal: 8 },
  textInput: { flex: 1, fontSize: RFValue(13), color: '#0F172A', paddingVertical: 4 },
  eyeBtn: { paddingHorizontal: 6 },
  requirementsCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 18,
  },
  requirementsTitle: {
    fontSize: RFValue(11),
    color: '#4F46E5',
    fontWeight: '600',
    marginBottom: 6,
  },
  requirementsGrid: { flexDirection: 'row' },
  requirementsCol: { flex: 1 },
  reqItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  reqText: { fontSize: RFValue(10), color: '#94A3B8' },
  reqTextMet: { color: '#0F172A', fontWeight: '500' },
  primaryButtonWrapper: { borderRadius: 14, overflow: 'hidden', marginBottom: 14, width: '100%' },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
  },
  primaryButtonText: {
    fontSize: RFValue(13.5),
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 1,
  },
  buttonArrow: { marginLeft: 8 },
  secureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  secureText: { fontSize: RFValue(11), color: '#64748B' },
  secureHighlight: { color: '#4F46E5', fontWeight: '700' },
});

export default PasswordSetupScreen;
