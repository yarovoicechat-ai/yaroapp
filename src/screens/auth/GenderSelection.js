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
    <ScreenBackgroundView style={[{ flex: 1, backgroundColor: '#F8FAFC' }]}>
      <ScreenBackgroundStatusBar backgroundColor="#FFFFFF" barStyle="dark-content" animated />
      <ScreenBackgroundImage source={GenderBG} style={ScreenBackgroundStyleSheet.absoluteFillObject} resizeMode="cover" />
      <ScreenBackgroundStatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Card */}
        <View style={styles.card}>
          {/* Gender icon in circle */}
          <View style={styles.iconCircle}>
            <Icon name="transgender-outline" size={RFValue(24)} color="#C026D3" />
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
                    <Icon name={option.icon} size={RFValue(16)} color={option.iconColor} />
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
              colors={selectedGender ? ['#FF6B00', '#FF2D87', '#C026D3'] : ['#444', '#444']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>CONTINUE</Text>
              <Icon name="arrow-forward" size={RFValue(16)} color="#fff" style={styles.buttonArrow} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenBackgroundView>
  );
};

export default GenderSelectionScreen;

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, paddingTop: height * 0.44, paddingBottom: 20 },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 45 : 25,
    left: width * 0.04,
    zIndex: 10,
    padding: 10,
  },
  card: {
    marginHorizontal: width * 0.10,
    backgroundColor: 'transparent',
    borderRadius: 24,
    borderWidth: 0,
    paddingHorizontal: 0,
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(192,38,211,0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(192,38,211,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
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
    marginBottom: 12,
  },
  optionsList: { width: '100%', marginBottom: 12 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 8,
  },
  optionRowSelected: {
    borderColor: 'rgba(192,38,211,0.7)',
    backgroundColor: 'rgba(192,38,211,0.15)',
  },
  optionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  optionLabel: {
    flex: 1,
    fontSize: RFValue(12.5),
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  optionLabelSelected: { color: '#ffffff', fontWeight: '700' },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: { borderColor: '#C026D3' },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C026D3',
  },
  primaryButtonWrapper: { borderRadius: 10, overflow: 'hidden', width: '100%' },
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
});
