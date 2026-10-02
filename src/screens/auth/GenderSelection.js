import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  ScrollView,
  Platform,
  View as ScreenBackgroundView,
  Image as ScreenBackgroundImage,
  StatusBar as ScreenBackgroundStatusBar,
  StyleSheet as ScreenBackgroundStyleSheet
} from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');
const GenderBG = require('../../assets/backgraund/mobile_login_background.jpeg');

const GENDER_OPTIONS = [
  {
    key: 'male',
    label: 'Male',
    icon: 'male',
    iconColor: '#4DA6FF',
  },
  {
    key: 'female',
    label: 'Female',
    icon: 'female',
    iconColor: '#FF2D87',
  },
];

const GenderSelectionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { idToken, password, phoneNumber, age, dob, firebaseIdToken } = route.params || {};

  const [selectedGender, setSelectedGender] = useState(null);

  const handleContinue = () => {
    if (!selectedGender) {
      return;
    }
    navigation.navigate('CountrySelection', {
      idToken,
      gender: selectedGender,
      password,
      phoneNumber,
      firebaseIdToken,
      age,
      dob,
      onboarding: true,
    });
  };

  return (
    <View style={styles.screen}>
      <StatusBar backgroundColor="transparent" barStyle="dark-content" translucent animated />
      <LinearGradient colors={['#F8FAFC', '#F1F5F9', '#EEF2FF']} style={StyleSheet.absoluteFillObject} />
      
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>

        {/* Card */}
        <View style={styles.card}>
          {/* Gender icon in circle */}
          <View style={styles.iconCircle}>
            <Icon name="transgender-outline" size={RFValue(28)} color="#6366F1" />
          </View>

          <Text style={styles.cardTitle}>Select Your Gender</Text>
          <Text style={styles.cardSubtitle}>Help us personalize your experience</Text>

          {/* Gender Options */}
          <View style={styles.optionsList}>
            {GENDER_OPTIONS.map((option) => {
              const isSelected = selectedGender === option.key;
              return (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                  onPress={() => setSelectedGender(option.key)}
                  activeOpacity={0.8}
                >
                  {/* Left icon */}
                  <View style={[styles.optionIconWrap, { borderColor: option.iconColor + '55' }]}>
                    <Icon name={option.icon} size={RFValue(18)} color={option.iconColor} />
                  </View>

                  {/* Label */}
                  <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                    {option.label}
                  </Text>

                  {/* Radio circle */}
                  <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            onPress={handleContinue}
            disabled={!selectedGender}
            style={styles.primaryButtonWrapper}
          >
            <LinearGradient
              colors={selectedGender ? ['#6366F1', '#4F46E5'] : ['#E2E8F0', '#CBD5E1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButton}
            >
              <Text style={[
                styles.primaryButtonText,
                !selectedGender && { color: '#94A3B8' }
              ]}>CONTINUE</Text>
              <Icon name="arrow-forward" size={RFValue(16)} color={selectedGender ? '#fff' : '#94A3B8'} style={styles.buttonArrow} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default GenderSelectionScreen;

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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
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
    paddingHorizontal: width * 0.06,
    paddingVertical: 28,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
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
    marginBottom: 20,
  },
  optionsList: {
    width: '100%',
    marginBottom: 20,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 12,
  },
  optionRowSelected: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  optionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionLabel: {
    flex: 1,
    fontSize: RFValue(13.5),
    color: '#334155',
    fontWeight: '500',
  },
  optionLabelSelected: {
    color: '#0F172A',
    fontWeight: '700',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: '#6366F1',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6366F1',
  },
  primaryButtonWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
    width: '100%',
  },
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
  buttonArrow: {
    marginLeft: 8,
  },
});
