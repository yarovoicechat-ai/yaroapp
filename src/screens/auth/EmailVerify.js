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
      colors={['#004FFF', '#17096B']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
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
            placeholderTextColor="rgba(255,255,255,0.5)"
            textAlign="center"
          />

          {/* Verify Button */}
          <TouchableOpacity onPress={handleVerify} style={styles.button}>
            <LinearGradient
              colors={['#49BFFD', '#62EFFF']}
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
    color: 'white',
    fontWeight: 'bold',
    marginBottom: height * 0.02,
  },
  subtitle: {
    fontSize: RFValue(14),
    color: 'white',
    textAlign: 'center',
    marginBottom: height * 0.04,
  },
  otpInput: {
    width: '60%',
    fontSize: RFValue(20),
    color: 'white',
    borderBottomWidth: 2,
    borderBottomColor: 'white',
    marginBottom: height * 0.05,
    letterSpacing: 10,
    paddingVertical: height * 0.01,
  },
  button: {
    width: '80%',
    borderRadius: RFValue(10),
    overflow: 'hidden',
    marginBottom: height * 0.03,
  },
  buttonGradient: {
    paddingVertical: height * 0.015,
    alignItems: 'center',
    borderRadius: RFValue(10),
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
    color: '#62EFFF',
    fontSize: RFValue(14),
    fontWeight: 'bold',
  },
});
