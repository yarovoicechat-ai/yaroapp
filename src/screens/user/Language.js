import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  View as ScreenBackgroundView,
  StatusBar as ScreenBackgroundStatusBar,
  StyleSheet as ScreenBackgroundStyleSheet
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import AnimatedTitleLine from '../../components/AnimatedTitleLine';
import { Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';

const { width } = Dimensions.get('window');

const Language = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 40);
  const { t, i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState('English');

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    const lang = await AsyncStorage.getItem('language');
    if (lang) setSelectedLanguage(lang);
  };

  const handleSave = async () => {
    await AsyncStorage.setItem('language', selectedLanguage);

    // Map human-readable name to language code for i18n
    const langMap = {
      'English': 'en',
      'Hindi': 'hi',
      'Bengali': 'bn',
      'Arabic': 'ar',
      'Urdu': 'ur',
    };

    const langCode = langMap[selectedLanguage] || 'en';
    i18n.changeLanguage(langCode);

    console.log('Selected language saved & i18n updated:', selectedLanguage, langCode);
    navigation.goBack();
  };

  const languageOptions = [
    {
      id: 'english',
      name: 'English',
    },
    {
      id: 'hindi',
      name: 'Hindi',
    },
    {
      id: 'bengali',
      name: 'Bengali',
    },
    {
      id: 'arabic',
      name: 'Arabic',
    },
    {
      id: 'urdu',
      name: 'Urdu',
    },
  ];

  return (
    <ScreenBackgroundView style={[{ flex: 1, backgroundColor: '#08031a' }]}>
      <ScreenBackgroundStatusBar translucent backgroundColor="transparent" barStyle="light-content" animated />
      <LinearGradient colors={['#08031a', '#050212', '#020108']} style={ScreenBackgroundStyleSheet.absoluteFillObject} />
      {/* Header */}
      <View style={[styles.headerContainer, { paddingTop: topSafeInset + 8 }]}>
        <TouchableOpacity style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.language') || 'Language'}</Text>
        <View style={styles.headerPlaceholder} />
      </View>
      <AnimatedTitleLine />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Language Options Grid */}
        <View style={styles.languageGrid}>
          {languageOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[styles.glassCard, selectedLanguage === option.name && styles.glassCardActive]}
              onPress={() => setSelectedLanguage(option.name)}
            >
              <Icon
                name="translate"
                size={28}
                color={selectedLanguage === option.name ? '#4ade80' : 'rgba(255,255,255,0.6)'}
              />
              <Text style={[styles.glassCardText, selectedLanguage === option.name && styles.glassCardTextActive]}>
                {option.name}
              </Text>
              {selectedLanguage === option.name && (
                <View style={styles.selectedBadge}>
                  <Icon name="check" size={14} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.saveButtonContainer}>
        <TouchableOpacity onPress={handleSave} activeOpacity={0.8}>
          <LinearGradient
            colors={['#3b82f6', '#2563eb']}
            style={styles.saveButtonGradient}
          >
            <Text style={styles.saveButtonText}>{t('profile.save') || 'Save Changes'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScreenBackgroundView>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  headerPlaceholder: {
    width: 40,
  },
  scrollContent: {
  },
  languageGrid: {
    padding: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  glassCard: {
    width: (width - 64) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    position: 'relative',
  },
  glassCardActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
    borderColor: '#3b82f6',
    borderWidth: 2,
  },
  glassCardText: {
    marginTop: 12,
    fontSize: 18,
    color: '#fff',
    opacity: 0.8,
    fontWeight: '600',
  },
  glassCardTextActive: {
    opacity: 1,
    color: '#fff',
  },
  selectedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
  saveButtonGradient: {
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

export default Language;
