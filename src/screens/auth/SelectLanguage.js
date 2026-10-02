import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
  Platform,
  View as ScreenBackgroundView,
  Image as ScreenBackgroundImage,
  StatusBar as ScreenBackgroundStatusBar,
  StyleSheet as ScreenBackgroundStyleSheet
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import DeviceInfo from 'react-native-device-info';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RFValue } from 'react-native-responsive-fontsize';
import { languages } from '../../constants/language';
import { AuthContext } from '../../context/AuthProvider';
import { AlertService } from '../../utils/AlertService';
import LinearGradient from 'react-native-linear-gradient';
import { apiPublic } from '../../utils/apiUtil';
import { trackCompletedRegistration } from '../../utils/metaEventsUtil';

const { width, height } = Dimensions.get('window');
const LangBG = require('../../assets/backgraund/mobile_login_background.jpeg');

const SelectLanguage = () => {
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const navigation = useNavigation();
  const route = useRoute();
  const { login } = useContext(AuthContext);
  const { idToken, gender, password, phoneNumber, country, age, firebaseIdToken } = route.params || {};

  const toggleLanguage = language => {
    setSelectedLanguages(prev => {
      if (prev.includes(language)) {
        return prev.filter(lang => lang !== language);
      } else if (prev.length < 2) {
        return [...prev, language];
      }
      return prev;
    });
  };

  const handleSubmit = async () => {
    try {
      if (selectedLanguages.length !== 2) {
        AlertService.show('Select languages', 'Please select exactly 2 languages.', 'error');
        return;
      }
      const deviceId = await DeviceInfo.getUniqueId();
      const payload = {
        deviceId,
        userFrom: 'app',
        gender,
        language: selectedLanguages,
        country: country || { name: 'India', code: '+91', flag: '🇮🇳' },
        age,
      };

      let url = '';
      if (idToken) {
        url = '/auth/user-google-auth';
        payload.googleIdToken = idToken;
      } else if (phoneNumber) {
        url = '/auth/user-signup';
        payload.phoneNumber = phoneNumber;
        payload.password = password;
        payload.firebaseIdToken = firebaseIdToken;
      } else {
        AlertService.show('Error', 'No login method detected.', 'error');
        return;
      }

      const res = await apiPublic.post(url, payload);
      if (res.data.success) {
        const { accessToken, refreshToken, role, gender, userId } = res.data.data;

        // Safely log Meta CompletedRegistration standard event ONLY for genuine new user registrations
        try {
          const regMethod = idToken ? 'google' : (phoneNumber ? 'phone' : 'other');
          trackCompletedRegistration(regMethod, userId || phoneNumber || idToken);
        } catch (metaErr) {
          // Fail silently so auth and navigation are never impacted
        }

        await AsyncStorage.setItem('accessToken', accessToken);
        await AsyncStorage.setItem('refreshToken', refreshToken);
        await AsyncStorage.setItem('role', role);
        if (idToken) {
          await login({ accessToken, refreshToken, role, gender, isRegister: true });
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: 'SignIn' }],
          });
        }
      } else {
        AlertService.show('Login Failed', res.data.message || 'Please try again.', 'error');
      }
    } catch (error) {
      console.log('Backend Error:', error);
      AlertService.show(
        'Error',
        error.response?.data?.message || error.message || 'Something went wrong',
        'error'
      );
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar backgroundColor="transparent" barStyle="dark-content" translucent animated />
      <LinearGradient colors={['#F8FAFC', '#F1F5F9', '#EEF2FF']} style={StyleSheet.absoluteFillObject} />
      
      <View style={styles.container}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>

        {/* Card */}
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Icon name="language-outline" size={RFValue(28)} color="#6366F1" />
            </View>
            <Text style={styles.title}>Languages</Text>
            <Text style={styles.subtitle}>Choose up to 2 languages you speak</Text>
            <View style={styles.counterBadge}>
              <Text style={styles.counter}>{selectedLanguages.length}/2 Selected</Text>
            </View>
          </View>

          {/* Chips Container */}
          <View style={styles.chipsContainer}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <View style={styles.languageGrid}>
                {languages.map(language => {
                  const isSelected = selectedLanguages.includes(language);
                  const isDisabled = !isSelected && selectedLanguages.length >= 2;
                  
                  return (
                    <TouchableOpacity
                      key={language}
                      onPress={() => toggleLanguage(language)}
                      disabled={isDisabled}
                      style={[
                        styles.languageChip,
                        isSelected && styles.selectedChip,
                        isDisabled && styles.disabledChip
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text style={[
                        styles.chipText,
                        isSelected && styles.selectedChipText,
                        isDisabled && styles.disabledChipText
                      ]}>
                        {language}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {/* Action Section */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                selectedLanguages.length !== 2 && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={selectedLanguages.length !== 2}
            >
              <LinearGradient
                colors={selectedLanguages.length === 2 ? ['#6366F1', '#4F46E5'] : ['#E2E8F0', '#CBD5E1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Text style={[
                  styles.submitText,
                  selectedLanguages.length !== 2 && { color: '#94A3B8' }
                ]}>CONTINUE</Text>
                <Icon name="arrow-forward" size={RFValue(16)} color={selectedLanguages.length === 2 ? '#fff' : '#94A3B8'} style={{ marginLeft: 8 }} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default SelectLanguage;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 25) + 10,
    paddingHorizontal: width * 0.05,
  },
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
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: width * 0.04,
    paddingTop: 20,
    paddingBottom: 24,
    marginBottom: 20,
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
  header: {
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: RFValue(20),
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: RFValue(12),
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 8,
  },
  counterBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  counter: {
    fontSize: RFValue(12),
    color: '#4F46E5',
    fontWeight: '700',
  },
  chipsContainer: {
    flex: 1,
    marginVertical: 12,
  },
  scrollContent: {
    paddingBottom: 10,
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  languageChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
  },
  selectedChip: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  disabledChip: {
    opacity: 0.35,
  },
  chipText: {
    fontSize: RFValue(12.5),
    color: '#475569',
    fontWeight: '500',
  },
  selectedChipText: {
    color: '#4F46E5',
    fontWeight: 'bold',
  },
  disabledChipText: {
    color: '#94A3B8',
  },
  footer: {
    marginTop: 10,
    width: '100%',
  },
  submitButton: {
    borderRadius: 14,
    overflow: 'hidden',
    width: '100%',
  },
  submitButtonDisabled: {
    opacity: 0.8,
  },
  gradientButton: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  submitText: {
    fontSize: RFValue(13.5),
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 1,
  },
});
