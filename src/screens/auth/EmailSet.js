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
  StatusBar,
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
          <Text style={styles.title}>Enter Your Email</Text>
          <Text style={styles.subtitle}>
            We will send a verification OTP to your email.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="#94A3B8"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <TouchableOpacity onPress={handleSend} style={styles.button} disabled={loading}>
            <LinearGradient
              colors={['#6366F1', '#4F46E5']}
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
  input: {
    width: '80%',
    fontSize: RFValue(16),
    color: '#0F172A',
    borderBottomWidth: 2,
    borderBottomColor: '#CBD5E1',
    marginBottom: height * 0.05,
    paddingVertical: height * 0.01,
  },
  button: {
    width: '80%',
    borderRadius: RFValue(12),
    overflow: 'hidden',
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
});
