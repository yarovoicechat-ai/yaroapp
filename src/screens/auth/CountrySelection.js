import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SectionList,
  Dimensions,
  StatusBar,
  Platform,
  View as ScreenBackgroundView,
  StatusBar as ScreenBackgroundStatusBar,
  StyleSheet as ScreenBackgroundStyleSheet
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RFValue } from 'react-native-responsive-fontsize';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';
import { countries } from '../../constants/countries';

const { width, height } = Dimensions.get('window');

const RECOMMENDED_IDS = ['1', '2', '3', '4']; // India (+91), US (+1), UK (+44), Canada (+1)

const CountrySelectionScreen = () => {
  const insets = useSafeAreaInsets();
  const topSafeInset = getTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 20);
  const navigation = useNavigation();
  const route = useRoute();
  const [searchQuery, setSearchQuery] = useState('');
  const sectionListRef = useRef(null);

  // Extract selected country from params (for highlighting)
  const selectedCountry = route.params?.selectedCountry || route.params?.country || {};
  const selectedCode = selectedCountry.code || '+91';

  // Recommended countries filter
  const recommendedCountries = countries.filter(c => RECOMMENDED_IDS.includes(c.id));

  // Filter countries based on search query
  const filteredCountries = countries.filter(
    country =>
      country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      country.code.includes(searchQuery)
  );

  // Group filtered countries by first letter
  const getSectionData = () => {
    const groups = {};
    filteredCountries.forEach(country => {
      const char = country.name.charAt(0).toUpperCase();
      if (!groups[char]) {
        groups[char] = [];
      }
      groups[char].push(country);
    });

    const sections = Object.keys(groups)
      .sort()
      .map(char => ({
        title: char,
        data: groups[char].sort((a, b) => a.name.localeCompare(b.name)),
      }));

    return sections;
  };

  const sections = getSectionData();

  const handleCountrySelect = country => {
    if (route.params?.onboarding) {
      navigation.replace('SelectLanguage', { ...route.params, onboarding: undefined, country });
      return;
    }
    if (route.params?.onSelect) {
      route.params.onSelect(country);
    }
    navigation.goBack();
  };

  const scrollToSection = (title) => {
    try {
      if (title === '#') {
        sectionListRef.current?.scrollToLocation({
          sectionIndex: 0,
          itemIndex: 0,
          viewOffset: 0,
          animated: true,
        });
        return;
      }
      const sectionIndex = sections.findIndex(sec => sec.title === title);
      if (sectionIndex !== -1) {
        sectionListRef.current?.scrollToLocation({
          sectionIndex,
          itemIndex: 0,
          viewOffset: 0,
          animated: true,
        });
      }
    } catch (err) {
      console.warn('Scroll error:', err);
    }
  };

  const renderCountryItem = ({ item }) => {
    const isSelected = Boolean(selectedCode && selectedCode === item.code);
    return (
      <TouchableOpacity
        style={[styles.countryItem, isSelected ? styles.countryItemActive : null]}
        onPress={() => handleCountrySelect(item)}
        activeOpacity={0.8}
      >
        <View style={styles.countryFlag}>
          <Text style={styles.flagEmoji}>{item.flag}</Text>
        </View>
        <Text style={styles.countryName}>{item.name}</Text>
        <Text style={styles.countryCode}>{item.code}</Text>

        {/* Radio Checkbox */}
        <View style={[styles.checkOuter, isSelected ? styles.checkOuterActive : null]}>
          {isSelected ? <Icon name="checkmark" size={11} color="#ffffff" /> : null}
        </View>
      </TouchableOpacity>
    );
  };

  const renderRecommendedSection = () => {
    if (searchQuery.length > 0) return null;

    return (
      <View style={styles.recommendedContainer}>
        <Text style={styles.sectionHeaderTitle}>Recommended</Text>
        {recommendedCountries.map(item => {
          const isSelected = Boolean(selectedCode && selectedCode === item.code);
          return (
            <TouchableOpacity
              key={`rec-${item.id}`}
              style={[styles.countryItem, isSelected ? styles.countryItemActive : null]}
              onPress={() => handleCountrySelect(item)}
              activeOpacity={0.8}
            >
              <View style={styles.countryFlag}>
                <Text style={styles.flagEmoji}>{item.flag}</Text>
              </View>
              <Text style={styles.countryName}>{item.name}</Text>
              <Text style={styles.countryCode}>{item.code}</Text>

              {/* Radio Checkbox */}
              <View style={[styles.checkOuter, isSelected ? styles.checkOuterActive : null]}>
                {isSelected ? <Icon name="checkmark" size={11} color="#ffffff" /> : null}
              </View>
            </TouchableOpacity>
          );
        })}
        <Text style={[styles.sectionHeaderTitle, { marginTop: 14 }]}>All Countries</Text>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar backgroundColor="transparent" barStyle="dark-content" translucent animated />
      <LinearGradient colors={['#F8FAFC', '#F1F5F9', '#EEF2FF']} style={StyleSheet.absoluteFillObject} />
      <View style={[styles.container, { paddingTop: topSafeInset }]}>
        {/* Custom Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="chevron-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.title}>Select Country</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Icon name="search" size={18} color="#64748B" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search country or code"
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Main Content Area with A-Z side index */}
        <View style={styles.listWrapper}>
          {/* Countries Grouped List */}
          <SectionList
            ref={sectionListRef}
            sections={sections}
            keyExtractor={item => item.id}
            renderItem={renderCountryItem}
            renderSectionHeader={({ section: { title } }) => (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitleText}>{title}</Text>
              </View>
            )}
            ListHeaderComponent={renderRecommendedSection}
            showsVerticalScrollIndicator={false}
            style={styles.countryList}
            contentContainerStyle={{ paddingBottom: bottomPadding }}
          />

          {/* Vertical A-Z index on the right */}
          <View style={styles.indexContainer}>
            <TouchableOpacity onPress={() => scrollToSection('#')} style={styles.hashBadgeItem}>
              <View style={styles.hashBadge}>
                <Text style={styles.hashBadgeText}>#</Text>
              </View>
            </TouchableOpacity>
            {sections.map((sec, idx) => (
              <TouchableOpacity
                key={`index-${idx}`}
                onPress={() => scrollToSection(sec.title)}
                style={styles.indexItem}
                hitSlop={{ top: 4, bottom: 4, left: 8, right: 8 }}
              >
                <Text style={styles.indexText}>{sec.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

export default CountrySelectionScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: width * 0.04,
    height: 48,
    marginBottom: 6,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  title: {
    fontSize: RFValue(17),
    fontWeight: 'bold',
    color: '#0F172A',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginHorizontal: width * 0.04,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: RFValue(13),
    color: '#0F172A',
    paddingVertical: 0,
  },
  listWrapper: {
    flex: 1,
    flexDirection: 'row',
  },
  countryList: {
    flex: 1,
    paddingLeft: width * 0.04,
    paddingRight: width * 0.02,
  },
  recommendedContainer: {
    marginBottom: 6,
  },
  sectionHeaderTitle: {
    fontSize: RFValue(12),
    color: '#64748B',
    marginTop: 6,
    marginBottom: 8,
    fontWeight: '600',
  },
  sectionHeader: {
    backgroundColor: 'transparent',
    paddingVertical: 4,
    marginBottom: 4,
  },
  sectionTitleText: {
    fontSize: RFValue(13),
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  countryItemActive: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  countryFlag: {
    marginRight: 12,
  },
  flagEmoji: {
    fontSize: RFValue(18),
  },
  countryName: {
    flex: 1,
    fontSize: RFValue(13),
    color: '#0F172A',
    fontWeight: '500',
  },
  countryCode: {
    fontSize: RFValue(13),
    color: '#64748B',
    marginRight: 12,
  },
  checkOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOuterActive: {
    borderColor: '#6366F1',
    backgroundColor: '#6366F1',
  },
  indexContainer: {
    width: 28,
    alignItems: 'center',
    paddingRight: 6,
    paddingTop: 4,
  },
  hashBadgeItem: {
    marginBottom: 4,
  },
  hashBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hashBadgeText: {
    fontSize: RFValue(10),
    fontWeight: 'bold',
    color: '#ffffff',
  },
  indexItem: {
    paddingVertical: 1,
  },
  indexText: {
    fontSize: RFValue(9),
    fontWeight: '500',
    color: '#64748B',
  },
});
