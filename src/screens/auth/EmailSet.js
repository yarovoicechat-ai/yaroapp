import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { RFValue } from 'react-native-responsive-fontsize';
import axios from 'axios';
import { AlertService } from '../../utils/AlertService';

const { width, height } = Dimensions.get('window');

const InputEmailScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      AlertService.show('Invalid Email', 'Please enter a valid email address.', 'error');
      return;
    }

    setLoading(true);
    try {
      // ✅ Replace with your API endpoint
      const response = await axios.post('https://your-api.com/send-email', {
        email,
      });

      if (response.data.success) {
        AlertService.show('Success', 'OTP has been sent to your email.', 'success');
        // Navigate to OTP verification screen
        navigation.navigate('EmailOTPVerification', { email });
      } else {
        AlertService.show('Error', response.data.message || 'Something went wrong.', 'error');
      }
    } catch (error) {
      console.log('API Error:', error);
      AlertService.show('Error', 'Failed to send OTP. Try again.', 'error');
    } finally {
      setLoading(false);
    }
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
          <Text style={styles.title}>Enter Your Email</Text>
          <Text style={styles.subtitle}>
            We will send a verification OTP to your email.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="rgba(255,255,255,0.5)"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <TouchableOpacity onPress={handleSend} style={styles.button} disabled={loading}>
            <LinearGradient
              colors={['#49BFFD', '#62EFFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.buttonText}>Send Email</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

export default InputEmailScreen;

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
  input: {
    width: '80%',
    fontSize: RFValue(16),
    color: 'white',
    borderBottomWidth: 2,
    borderBottomColor: 'white',
    marginBottom: height * 0.05,
    paddingVertical: height * 0.01,
  },
  button: {
    width: '80%',
    borderRadius: RFValue(10),
    overflow: 'hidden',
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
});
