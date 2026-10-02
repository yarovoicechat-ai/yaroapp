import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';
import { AlertService } from '../../utils/AlertService';

const LANGUAGES = [
  {
    name: 'English',
    native: 'English',
    code: 'en',
    mark: 'EN',
    gradient: ['#3B82F6', '#1D4ED8'],
    example: 'Hello! Welcome to Yaro Voice Club',
    region: 'Global',
  },
  {
    name: 'Hindi',
    native: 'हिन्दी',
    code: 'hi',
    mark: 'हि',
    gradient: ['#F59E0B', '#B45309'],
    example: 'नमस्ते! यारो वॉइस क्लब में आपका स्वागत है',
    region: 'India / भारत',
  },
  {
    name: 'Bengali',
    native: 'বাংলা',
    code: 'bn',
    mark: 'বা',
    gradient: ['#10B981', '#047857'],
    example: 'হ্যালো! ইয়ারো ভয়েস ক্লাবে স্বাগতম',
    region: 'India / Bangladesh',
  },
  {
    name: 'Telugu',
    native: 'తెలుగు',
    code: 'te',
    mark: 'తె',
    gradient: ['#8B5CF6', '#6D28D9'],
    example: 'నమస్కారం! యారో వాయిస్ క్లబ్‌కు స్వాగతం',
    region: 'India (AP / Telangana)',
  },
  {
    name: 'Marathi',
    native: 'मराठी',
    code: 'mr',
    mark: 'म',
    gradient: ['#EC4899', '#BE185D'],
    example: 'नमस्कार! यारो व्हॉइस क्लबमध्ये आपले स्वागत आहे',
    region: 'India (Maharashtra)',
  },
  {
    name: 'Tamil',
    native: 'தமிழ்',
    code: 'ta',
    mark: 'த',
    gradient: ['#F97316', '#C2410C'],
    example: 'வணக்கம்! யாரோ வாய்ஸ் கிளப்பிற்கு வரவேற்கிறோம்',
    region: 'India / Tamil Nadu',
  },
  {
    name: 'Urdu',
    native: 'اردو',
    code: 'ur',
    mark: 'ا',
    gradient: ['#14B8A6', '#0F766E'],
    example: 'خوش آمدید! یارو وائس کلب میں آپ کا استقبال ہے',
    region: 'South Asia / Middle East',
  },
  {
    name: 'Gujarati',
    native: 'ગુજરાતી',
    code: 'gu',
    mark: 'ગુ',
    gradient: ['#06B6D4', '#0E7490'],
    example: 'નમસ્તે! યારો વૉઇસ ક્લબમાં આપનું સ્વાગત છે',
    region: 'India (Gujarat)',
  },
  {
    name: 'Punjabi',
    native: 'ਪੰਜਾਬੀ',
    code: 'pa',
    mark: 'ਪੰ',
    gradient: ['#EAB308', '#A16207'],
    example: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਯਾਰੋ ਵੌਇਸ ਕਲੱਬ ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ',
    region: 'India / Punjab',
  },
  {
    name: 'Kannada',
    native: 'ಕನ್ನಡ',
    code: 'kn',
    mark: 'ಕ',
    gradient: ['#A855F7', '#7E22CE'],
    example: 'ನಮಸ್ಕಾರ! ಯಾರೋ ವಾಯ್ಸ್ ಕ್ಲಬ್‌ಗೆ ಸುಸ್ವಾಗತ',
    region: 'India (Karnataka)',
  },
  {
    name: 'Malayalam',
    native: 'മലയാളം',
    code: 'ml',
    mark: 'മ',
    gradient: ['#6366F1', '#3730A3'],
    example: 'നമസ്കാരം! യാരോ വോയ്‌സ് ക്ലബ്ബിലേക്ക് സ്വാഗതം',
    region: 'India (Kerala)',
  },
  {
    name: 'Arabic',
    native: 'العربية',
    code: 'ar',
    mark: 'ع',
    gradient: ['#F43F5E', '#BE123C'],
    example: 'مرحبًا بك في نادي يارو الصوتي',
    region: 'Middle East & North Africa',
  },
];

export default function LanguageStudio() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { i18n, t } = useTranslation();

  const [selected, setSelected] = useState(
    LANGUAGES.find((item) => item.code === i18n.language)?.name || 'English'
  );
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('language')
      .then((val) => {
        if (val && LANGUAGES.some((item) => item.name === val)) {
          setSelected(val);
        }
      })
      .catch(() => undefined);
  }, []);

  const handleSave = async () => {
    const langObj = LANGUAGES.find((item) => item.name === selected) || LANGUAGES[0];
    setSaving(true);
    try {
      await AsyncStorage.setItem('language', langObj.name);
      await i18n.changeLanguage(langObj.code);
      AlertService.show(
        'Language Updated',
        `App language set to ${langObj.name} (${langObj.native})`,
        'success'
      );
      navigation.goBack();
    } catch (err) {
      AlertService.show('Error', 'Failed to change language. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const filteredLanguages = LANGUAGES.filter((item) =>
    `${item.name} ${item.native} ${item.region}`.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <View style={styles.screen}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Hero Header */}
      <LinearGradient
        colors={['#0E0826', '#261250', '#552296']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: getAppTopSafeInset(insets.top) + 8 }]}
      >
        <View style={styles.navRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            activeOpacity={0.8}
          >
            <Icon name="chevron-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>{t('settings.language') || 'Language'}</Text>
          <View style={{ width: 38 }} />
        </View>

        <View style={styles.heroContent}>
          <View style={styles.heroIconBadge}>
            <Icon name="language" size={24} color="#EDE9FE" />
          </View>
          <Text style={styles.heroKicker}>PREFERENCES</Text>
          <Text style={styles.heroTitle}>Choose App Language</Text>
          <Text style={styles.heroSubtitle}>
            Select your primary language. The entire interface, menus, and notifications will adapt.
          </Text>
        </View>

        {/* Search Bar inside Hero */}
        <View style={styles.searchBar}>
          <Icon name="search" size={17} color="#A78BFA" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search language or region..."
            placeholderTextColor="#C4B5FD"
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Icon name="close-circle" size={16} color="#C4B5FD" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Language Options List */}
      <ScrollView
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: getStackScreenBottomPadding(insets.bottom, 110) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>AVAILABLE LANGUAGES</Text>
          <Text style={styles.sectionCount}>{filteredLanguages.length} languages</Text>
        </View>

        {filteredLanguages.map((item) => {
          const isSelected = selected === item.name;
          return (
            <TouchableOpacity
              key={item.code}
              onPress={() => setSelected(item.name)}
              activeOpacity={0.85}
              style={[styles.langCard, isSelected && styles.langCardActive]}
            >
              {/* Script Badge */}
              <LinearGradient
                colors={item.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.scriptBadge}
              >
                <Text style={styles.scriptText}>{item.mark}</Text>
              </LinearGradient>

              {/* Text Info */}
              <View style={{ flex: 1 }}>
                <View style={styles.titleRow}>
                  <Text style={styles.langName}>{item.name}</Text>
                  <Text style={styles.langNative}>· {item.native}</Text>
                </View>
                <Text style={styles.langRegion}>{item.region}</Text>
                <Text style={styles.langExample} numberOfLines={1}>
                  "{item.example}"
                </Text>
              </View>

              {/* Checkmark Circle */}
              <View
                style={[
                  styles.checkCircle,
                  isSelected && styles.checkCircleActive,
                ]}
              >
                {isSelected ? (
                  <Icon name="checkmark" size={16} color="#FFFFFF" />
                ) : (
                  <View style={styles.emptyDot} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Note Footer Card */}
        <View style={styles.noteCard}>
          <Icon name="sparkles" size={18} color="#8B5CF6" />
          <Text style={styles.noteText}>
            User names, voice room titles, and real-time chat messages will display in their author's original script.
          </Text>
        </View>
      </ScrollView>

      {/* Floating Save Footer */}
      <View style={[styles.bottomFooter, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
          style={styles.saveBtnWrap}
        >
          <LinearGradient
            colors={['#7C3AED', '#5536D7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveBtn}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.saveBtnText}>Apply {selected}</Text>
                <Icon name="arrow-forward" size={18} color="#FFFFFF" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  heroContent: { marginTop: 4, marginBottom: 16 },
  heroIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  heroKicker: {
    color: '#D8B4FE',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.8,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '900',
    marginTop: 4,
  },
  heroSubtitle: {
    color: '#DDD6FE',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
    maxWidth: 320,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 15,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    paddingVertical: 9,
    paddingHorizontal: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  sectionCount: {
    color: '#8B5CF6',
    fontSize: 11,
    fontWeight: '700',
  },
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 3,
  },
  langCardActive: {
    borderColor: '#7C3AED',
    backgroundColor: '#FBF9FF',
    elevation: 2,
    shadowColor: '#7C3AED',
    shadowOpacity: 0.12,
    shadowRadius: 5,
  },
  scriptBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  scriptText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  langName: { color: '#0F172A', fontSize: 16, fontWeight: '800' },
  langNative: { color: '#64748B', fontSize: 14, fontWeight: '700' },
  langRegion: { color: '#94A3B8', fontSize: 11, marginTop: 1, fontWeight: '600' },
  langExample: {
    color: '#6D28D9',
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 4,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    marginLeft: 10,
  },
  checkCircleActive: {
    borderColor: '#7C3AED',
    backgroundColor: '#7C3AED',
  },
  emptyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#F3E8FF',
    borderRadius: 16,
    padding: 14,
    marginTop: 6,
    marginBottom: 16,
  },
  noteText: {
    flex: 1,
    color: '#581C87',
    fontSize: 11,
    lineHeight: 17,
    fontWeight: '600',
  },
  bottomFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  saveBtnWrap: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  saveBtn: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
});
