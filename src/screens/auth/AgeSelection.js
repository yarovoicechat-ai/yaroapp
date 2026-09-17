import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
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
    <ScreenBackgroundView style={[{ flex: 1, backgroundColor: '#F8FAFC' }]}>
      <ScreenBackgroundStatusBar backgroundColor="#FFFFFF" barStyle="dark-content" animated />
      <ScreenBackgroundImage source={AgeBG} style={ScreenBackgroundStyleSheet.absoluteFillObject} resizeMode="cover" />
      <ScreenBackgroundStatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={styles.container}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Card Container */}
        <View style={styles.card}>
          {/* Header Text */}
          <View style={styles.headerTextSection}>
            <Text style={styles.title}>Enter your Date of Birth</Text>
            <Text style={styles.subtitle}>
              Please enter your date of birth to continue
            </Text>
          </View>

          {/* Date of Birth Display Box */}
          <View style={styles.dateDisplayBox}>
            <Icon name="calendar" size={RFValue(20)} color="#FF2D87" style={styles.calendarIcon} />
            <View style={styles.dateTextContainer}>
              <Text style={styles.dateLabel}>Date of Birth</Text>
              <Text style={styles.dateValue}>{formattedDate}</Text>
            </View>
            <Icon name="chevron-down" size={RFValue(18)} color="rgba(255, 255, 255, 0.4)" />
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
              colors={['#FF6B00', '#FF2D87', '#C026D3']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.confirmButton}
            >
              <Text style={styles.confirmButtonText}>CONFIRM</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenBackgroundView>
  );
};

export default AgeSelectionScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
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
    alignItems: 'center',
    paddingBottom: 20,
  },
  headerTextSection: {
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: RFValue(18),
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: RFValue(11),
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 16,
  },
  dateDisplayBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#FF2D87',
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
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 1,
  },
  dateValue: {
    fontSize: RFValue(13),
    fontWeight: 'bold',
    color: '#ffffff',
  },
  pickerContainer: {
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(192, 38, 211, 0.35)',
    paddingTop: 10,
    paddingBottom: 6,
    marginBottom: 14,
  },
  pickerHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 6,
    marginHorizontal: 8,
  },
  pickerHeaderColumn: {
    flex: 1,
    textAlign: 'center',
    fontSize: RFValue(11),
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.7)',
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
    borderColor: '#FF2D87',
    backgroundColor: 'rgba(255, 45, 135, 0.08)',
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
    color: '#FF2D87',
    fontWeight: 'bold',
    fontSize: RFValue(15),
  },
  pickerItemTextUnselected: {
    color: 'rgba(255, 255, 255, 0.3)',
  },
  confirmButtonWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
  },
  confirmButton: {
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: RFValue(13.5),
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 1,
  },
});
