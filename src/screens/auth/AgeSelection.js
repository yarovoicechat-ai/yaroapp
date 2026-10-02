import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ScrollView,
  FlatList,
  Platform,
  View as ScreenBackgroundView,
  Image as ScreenBackgroundImage,
  StatusBar as ScreenBackgroundStatusBar,
  StyleSheet as ScreenBackgroundStyleSheet
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RFValue } from 'react-native-responsive-fontsize';
import LinearGradient from 'react-native-linear-gradient';
import { AlertService } from '../../utils/AlertService';

const { width, height } = Dimensions.get('window');
const AgeBG = require('../../assets/backgraund/mobile_login_background.jpeg');

const ITEM_HEIGHT = 44; // height of each item in the scroll picker

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const AgeSelectionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params || {};

  // Date picker states (defaults to May 31, 2005)
  const [day, setDay] = useState(31);
  const [month, setMonth] = useState(5); // 1-indexed (May)
  const [year, setYear] = useState(2005);

  // Generate data lists with padding
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1939 }, (_, i) => 1940 + i); // 1940 to currentYear
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  // FlatList data lists with padding (2 empty items at start and end)
  const dayData = [null, null, ...days, null, null];
  const monthData = [null, null, ...SHORT_MONTHS, null, null];
  const yearData = [null, null, ...years, null, null];

  // Refs for auto-scrolling to initial/default values
  const dayRef = useRef(null);
  const monthRef = useRef(null);
  const yearRef = useRef(null);

  // Scroll to initial values on mount
  useEffect(() => {
    const dayIndex = days.indexOf(day);
    const monthIndex = month - 1;
    const yearIndex = years.indexOf(year);

    setTimeout(() => {
      if (dayRef.current) dayRef.current.scrollToOffset({ offset: dayIndex * ITEM_HEIGHT, animated: false });
      if (monthRef.current) monthRef.current.scrollToOffset({ offset: monthIndex * ITEM_HEIGHT, animated: false });
      if (yearRef.current) yearRef.current.scrollToOffset({ offset: yearIndex * ITEM_HEIGHT, animated: false });
    }, 100);
  }, []);

  const calculateAge = (d, m, y) => {
    const birthDate = new Date(y, m - 1, d);
    const today = new Date();
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }
    return calculatedAge;
  };

  const getMaxDays = (m, y) => {
    return new Date(y, m, 0).getDate();
  };

  const handleConfirm = () => {
    const maxDays = getMaxDays(month, year);
    let finalDay = day;
    if (day > maxDays) {
      finalDay = maxDays;
    }

    const age = calculateAge(finalDay, month, year);

    if (age < 0) {
      AlertService.show('Invalid Date', 'Date of birth cannot be in the future.', 'error');
      return;
    }

    if (age < 18) {
      AlertService.show(
        'Age Restriction',
        'You must be at least 18 years old to register.',
        'warning'
      );
      return;
    }

    const dobString = `${year}-${String(month).padStart(2, '0')}-${String(finalDay).padStart(2, '0')}`;

    navigation.navigate('GenderSelection', {
      ...params,
      age,
      dob: dobString
    });
  };

  const handleScrollEnd = (e, type, listData) => {
    const offsetY = e.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const actualItem = listData[index + 2];

    if (actualItem !== undefined && actualItem !== null) {
      if (type === 'day') {
        setDay(actualItem);
      } else if (type === 'month') {
        const monthNum = SHORT_MONTHS.indexOf(actualItem) + 1;
        setMonth(monthNum);
      } else if (type === 'year') {
        setYear(actualItem);
      }
    }
  };

  const renderPickerItem = (item, isSelected) => {
    if (item === null) {
      return <View style={{ height: ITEM_HEIGHT }} />;
    }

    return (
      <View style={styles.pickerItem}>
        <Text style={[
          styles.pickerItemText,
          isSelected ? styles.pickerItemTextSelected : styles.pickerItemTextUnselected
        ]}>
          {item}
        </Text>
      </View>
    );
  };

  const formattedDate = `${String(day).padStart(2, '0')} / ${String(month).padStart(2, '0')} / ${year}`;

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

        {/* Card Container */}
        <View style={styles.card}>
          {/* Header Text */}
          <View style={styles.headerTextSection}>
            <View style={styles.iconCircle}>
              <Icon name="calendar-outline" size={RFValue(28)} color="#6366F1" />
            </View>
            <Text style={styles.title}>Enter your Date of Birth</Text>
            <Text style={styles.subtitle}>
              Please enter your date of birth to continue
            </Text>
          </View>

          {/* Date of Birth Display Box */}
          <View style={styles.dateDisplayBox}>
            <Icon name="calendar" size={RFValue(20)} color="#6366F1" style={styles.calendarIcon} />
            <View style={styles.dateTextContainer}>
              <Text style={styles.dateLabel}>Date of Birth</Text>
              <Text style={styles.dateValue}>{formattedDate}</Text>
            </View>
            <Icon name="chevron-down" size={RFValue(18)} color="#64748B" />
          </View>

          {/* Custom Wheel Picker */}
          <View style={styles.pickerContainer}>
            {/* Header Row */}
            <View style={styles.pickerHeaderRow}>
              <Text style={styles.pickerHeaderColumn}>DAY</Text>
              <Text style={styles.pickerHeaderColumn}>MONTH</Text>
              <Text style={styles.pickerHeaderColumn}>YEAR</Text>
            </View>

            {/* Scrolling Wheels Container */}
            <View style={styles.wheelsContainer}>
              {/* Highlighted Row Overlay */}
              <View style={styles.highlightOverlay} pointerEvents="none" />

              {/* DAY list */}
              <FlatList
                ref={dayRef}
                data={dayData}
                keyExtractor={(_, index) => `day-${index}`}
                renderItem={({ item }) => renderPickerItem(item, item === day)}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                onMomentumScrollEnd={(e) => handleScrollEnd(e, 'day', dayData)}
                getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
                style={styles.wheelList}
                contentContainerStyle={styles.wheelContent}
              />

              {/* MONTH list */}
              <FlatList
                ref={monthRef}
                data={monthData}
                keyExtractor={(_, index) => `month-${index}`}
                renderItem={({ item }) => renderPickerItem(item, SHORT_MONTHS.indexOf(item) + 1 === month)}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                onMomentumScrollEnd={(e) => handleScrollEnd(e, 'month', monthData)}
                getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
                style={styles.wheelList}
                contentContainerStyle={styles.wheelContent}
              />

              {/* YEAR list */}
              <FlatList
                ref={yearRef}
                data={yearData}
                keyExtractor={(_, index) => `year-${index}`}
                renderItem={({ item }) => renderPickerItem(item, item === year)}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                onMomentumScrollEnd={(e) => handleScrollEnd(e, 'year', yearData)}
                getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
                style={styles.wheelList}
                contentContainerStyle={styles.wheelContent}
              />
            </View>
          </View>

          {/* Confirm Button */}
          <TouchableOpacity style={styles.confirmButtonWrapper} onPress={handleConfirm}>
            <LinearGradient
              colors={['#6366F1', '#4F46E5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.confirmButton}
            >
              <Text style={styles.confirmButtonText}>CONFIRM</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default AgeSelectionScreen;

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
    marginBottom: 16,
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
    paddingHorizontal: width * 0.05,
    paddingVertical: 24,
    alignItems: 'center',
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
    marginBottom: 10,
  },
  headerTextSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: RFValue(19),
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: RFValue(11.5),
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
  },
  dateDisplayBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#6366F1',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
    width: '100%',
  },
  calendarIcon: {
    marginRight: 10,
  },
  dateTextContainer: {
    flex: 1,
  },
  dateLabel: {
    fontSize: RFValue(10),
    color: '#64748B',
    marginBottom: 2,
    fontWeight: '500',
  },
  dateValue: {
    fontSize: RFValue(13.5),
    fontWeight: 'bold',
    color: '#0F172A',
  },
  pickerContainer: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    paddingTop: 10,
    paddingBottom: 6,
    marginBottom: 16,
  },
  pickerHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 6,
    marginHorizontal: 8,
  },
  pickerHeaderColumn: {
    flex: 1,
    textAlign: 'center',
    fontSize: RFValue(11),
    fontWeight: 'bold',
    color: '#64748B',
    letterSpacing: 1,
  },
  wheelsContainer: {
    height: ITEM_HEIGHT * 5,
    flexDirection: 'row',
    position: 'relative',
    marginHorizontal: 8,
  },
  highlightOverlay: {
    position: 'absolute',
    top: ITEM_HEIGHT * 2,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderRadius: 8,
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: '#6366F1',
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    zIndex: 1,
  },
  wheelList: {
    flex: 1,
    height: '100%',
  },
  wheelContent: {
    paddingVertical: 0,
  },
  pickerItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerItemText: {
    fontSize: RFValue(14),
    fontWeight: '600',
  },
  pickerItemTextSelected: {
    color: '#4F46E5',
    fontWeight: 'bold',
    fontSize: RFValue(15),
  },
  pickerItemTextUnselected: {
    color: '#94A3B8',
  },
  confirmButtonWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
    width: '100%',
  },
  confirmButton: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  confirmButtonText: {
    fontSize: RFValue(13.5),
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 1,
  },
});
