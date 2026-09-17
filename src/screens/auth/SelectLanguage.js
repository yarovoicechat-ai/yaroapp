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
            routes: [{ name: 'UmangLoginScreen' }],
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
    <ScreenBackgroundView style={[{ flex: 1, backgroundColor: '#F8FAFC' }]}>
      <ScreenBackgroundStatusBar backgroundColor="#FFFFFF" barStyle="dark-content" animated />
      <ScreenBackgroundImage source={LangBG} style={ScreenBackgroundStyleSheet.absoluteFillObject} resizeMode="cover" />
      <ScreenBackgroundStatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <View style={styles.container}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Card */}
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Languages</Text>
            <Text style={styles.subtitle}>Choose up to 2 languages you speak</Text>
            <Text style={styles.counter}>{selectedLanguages.length}/2</Text>
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
                colors={selectedLanguages.length === 2 ? ['#FF6B00', '#FF2D87', '#C026D3'] : ['#444', '#444']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Text style={styles.submitText}>CONTINUE</Text>
                <Icon name="arrow-forward" size={RFValue(16)} color="#fff" style={{ marginLeft: 8 }} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScreenBackgroundView>
  );
};

export default SelectLanguage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 45 : 25,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 45 : 25,
    left: width * 0.04,
    zIndex: 10,
    padding: 10,
  },
  card: {
    flex: 1,
    marginTop: height * 0.38,
    marginHorizontal: width * 0.06,
    backgroundColor: 'transparent',
    borderRadius: 24,
    borderWidth: 0,
    paddingHorizontal: width * 0.02,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: RFValue(18),
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: RFValue(11),
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 4,
  },
  counter: {
    fontSize: RFValue(12.5),
    color: '#FF2D87',
    fontWeight: 'bold',
  },
  chipsContainer: {
    flex: 1,
    marginVertical: 8,
  },
  scrollContent: {
    paddingBottom: 10,
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  languageChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1.2,
    borderColor: 'rgba(192, 38, 211, 0.35)',
  },
  selectedChip: {
    backgroundColor: 'rgba(192, 38, 211, 0.25)',
    borderColor: '#FF2D87',
  },
  disabledChip: {
    opacity: 0.3,
  },
  chipText: {
    fontSize: RFValue(12),
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  selectedChipText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  disabledChipText: {
    color: 'rgba(255, 255, 255, 0.3)',
  },
  footer: {
    marginTop: 6,
    width: '100%',
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  gradientButton: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  submitText: {
    fontSize: RFValue(13),
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 1,
  },
});
