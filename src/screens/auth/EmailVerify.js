import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { RFValue } from 'react-native-responsive-fontsize';
import { AlertService } from '../../utils/AlertService';

const { width, height } = Dimensions.get('window');

const EmailOTPVerification = ({ onVerify }) => {
  const [otp, setOtp] = useState('');

  const handleVerify = () => {
    if (otp.length !== 6) {
      AlertService.show('Error', 'Please enter a valid 6-digit OTP.', 'error');
      return;
    }
    onVerify(otp);
  };

  const handleResend = () => {
    AlertService.show('OTP', 'OTP has been resent to your email.', 'success');
  };

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
        style={{ flex: 1, justifyContent: 'center' }}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Email Verification</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit OTP sent to your email.
          </Text>

          {/* OTP Input */}
          <TextInput
            style={styles.otpInput}
            keyboardType="number-pad"
            maxLength={6}
            value={otp}
            onChangeText={setOtp}
            placeholder="______"
            placeholderTextColor="#94A3B8"
            textAlign="center"
          />

          {/* Verify Button */}
          <TouchableOpacity onPress={handleVerify} style={styles.button}>
            <LinearGradient
              colors={['#6366F1', '#4F46E5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Verify OTP</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Resend OTP */}
          <TouchableOpacity onPress={handleResend} style={styles.resendContainer}>
            <Text style={styles.resendText}>Resend OTP</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

export default EmailOTPVerification;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: width * 0.06,
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: RFValue(24),
    color: '#0F172A',
    fontWeight: 'bold',
    marginBottom: height * 0.02,
  },
  subtitle: {
    fontSize: RFValue(14),
    color: '#64748B',
    textAlign: 'center',
    marginBottom: height * 0.04,
  },
  otpInput: {
    width: '60%',
    fontSize: RFValue(20),
    color: '#0F172A',
    borderBottomWidth: 2,
    borderBottomColor: '#CBD5E1',
    marginBottom: height * 0.05,
    letterSpacing: 10,
    paddingVertical: height * 0.01,
  },
  button: {
    width: '80%',
    borderRadius: RFValue(12),
    overflow: 'hidden',
    marginBottom: height * 0.03,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonGradient: {
    paddingVertical: height * 0.016,
    alignItems: 'center',
    borderRadius: RFValue(12),
  },
  buttonText: {
    fontSize: RFValue(16),
    color: 'white',
    fontWeight: 'bold',
  },
  resendContainer: {
    marginTop: height * 0.01,
  },
  resendText: {
    color: '#6366F1',
    fontSize: RFValue(14),
    fontWeight: 'bold',
  },
});
