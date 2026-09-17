import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  View as ScreenBackgroundView,
  StatusBar as ScreenBackgroundStatusBar,
  StyleSheet as ScreenBackgroundStyleSheet
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { RFValue } from 'react-native-responsive-fontsize';
import {
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { apiUtil } from '../../utils/apiUtil';
import { SOCKET_URL } from '@env';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';

const { width } = Dimensions.get('window');

const CallHistoryScreen = () => {
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 40);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDays, setSelectedDays] = useState(7);
  const navigation = useNavigation();
  const { t } = useTranslation();

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await apiUtil.get(`/call/history?days=${selectedDays}`);
      console.log('📞 Call History:', response.data);
      setHistory(response.data.data);
    } catch (error) {
      console.log(
        '❌ Error fetching call history:',
        error.response?.data || error.message,
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [selectedDays]);

  return (
    <ScreenBackgroundView style={[{ flex: 1, backgroundColor: '#08031a' }]}>
      <ScreenBackgroundStatusBar translucent backgroundColor="transparent" barStyle="light-content" animated />
      <LinearGradient colors={['#08031a', '#050212', '#020108']} style={ScreenBackgroundStyleSheet.absoluteFillObject} />
      <View style={styles.container}>
        <ScrollView contentContainerStyle={{ paddingBottom: bottomPadding }} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={[styles.header, { paddingTop: topSafeInset + 8 }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Icon name="arrow-back" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerText}>{t('history.call_history') || 'Call History'}</Text>
            <View style={{ width: 44 }} />
          </View>

          {/* Tabs */}
          <LinearGradient
            colors={['#2819F8', '#1EE5F3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.tabBorder}
          >
            <View style={styles.innerTabWrapper}>
              {[7, 15, 30].map((days) => (
                <TouchableOpacity
                  key={days}
                  onPress={() => setSelectedDays(days)}
                  style={[
                    styles.tabItem,
                    selectedDays === days ? {} : styles.nonActiveTab,
                    selectedDays === days && {
                      backgroundColor: undefined, // Let gradient show
                    }
                  ]}
                >
                  {selectedDays === days ? (
                    <LinearGradient
                      colors={['#8E2DE2', '#4A00E0']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[StyleSheet.absoluteFill, { borderRadius: RFValue(25) }]}
                    />
                  ) : null}
                  <Text style={styles.tabText}>
                    {days === 30 ? (t('history.one_month') || '1 Month') : `${days} ${t('history.days') || 'Days'}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </LinearGradient>

          {/* Loading */}
          {loading && (
            <ActivityIndicator
              size="large"
              color="#fff"
              style={{ marginTop: 20 }}
            />
          )}

          {/* Total Timing */}
          {!loading && history && (
            <LinearGradient
              colors={['#2819F8', '#1EE5F3']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.totalTiming}
            >
              <Image
                source={require('../../assets/time.webp')}
                style={styles.icon}
              />
              <Text style={styles.totalTimingText}>
                {t('history.total_timing') || 'Total Timing :'} {' '}
                <Text style={{ fontWeight: 'bold' }}>
                  {history.totalTiming}
                </Text>
              </Text>
            </LinearGradient>
          )}

          {/* Call List */}
          {!loading && history?.calls?.length > 0
            ? history.calls.map((call, index) => (
              <LinearGradient
                key={index}
                colors={['#00c6ff', '#0072ff']}
                style={styles.card}
              >
                <View style={styles.cardHeader}>
                  <Image
                    source={call.image ? { uri: `${SOCKET_URL}${call.image}` } : (call.callerImage ? { uri: call.callerImage } : require('../../assets/girl.webp'))}
                    style={styles.profileImage}
                  />
                  <View style={styles.info}>
                    <Text style={styles.name}>{t('history.name_label') || 'Name :'} {call.name}</Text>
                    <Text style={styles.id}>{t('history.id_label') || 'ID :'} {call.id}</Text>
                    <Text style={styles.commission}>
                      {t('history.type_label') || 'Type :'} {call.type.replace('_', ' ').toUpperCase()}
                    </Text>
                    {/* ✅ Show Commission only if exists */}
                    {call.commission !== undefined && (
                      <Text style={[styles.commission, { color: '#FFD700' }]}>
                        {t('history.commission') || 'Commission :'} {call.commission}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Voice & Gift Row */}
                <View style={styles.voiceGiftRow}>
                  <Text style={styles.detailText}>
                    {t('history.voice') || 'Voice :'} {call.voice}{' '}
                    <Image
                      source={require('../../assets/coin.webp')}
                      style={styles.coinIcon}
                    />
                  </Text>
                  <View style={styles.verticalDivider} />
                  <Text style={styles.detailText}>
                    {t('history.gift') || 'Gift :'} {call.gift}{' '}
                    <Image
                      source={require('../../assets/coin.webp')}
                      style={styles.coinIcon}
                    />
                  </Text>
                </View>

                {/* Duration & Date */}
                <View style={styles.bottomRow}>
                  <Text style={styles.detailText}>
                    {t('history.duration') || 'Duration:'} {call.duration}
                  </Text>
                  <Text style={styles.detailText}>{t('history.date_label') || 'Date:'} {call.date}</Text>
                </View>

                {/* Start / End Time */}
                <View style={styles.bottomRow}>
                  <Text style={styles.detailText}>
                    {t('history.start') || 'Start:'} {new Date(call.callStart).toLocaleTimeString()}
                  </Text>
                  <View style={styles.verticalDivider} />
                  <Text style={styles.detailText}>
                    {t('history.end') || 'End:'} {new Date(call.callEnd).toLocaleTimeString()}
                  </Text>
                </View>
              </LinearGradient>
            ))
            : !loading && (
              <Text
                style={{ color: '#fff', textAlign: 'center', marginTop: 30 }}
              >
                {t('history.no_call_history') || 'No call history found.'}
              </Text>
            )}
        </ScrollView>
      </View>
    </ScreenBackgroundView>
  );
};

export default CallHistoryScreen;

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: RFValue(15) },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: RFValue(20),
  },
  backIcon: { width: RFValue(20), height: RFValue(20), tintColor: '#fff' },
  headerText: {
    fontSize: RFValue(18),
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tabBorder: {
    borderRadius: RFValue(25),
    padding: RFValue(2),
    marginBottom: RFValue(20),
  },
  innerTabWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#002060',
    borderRadius: RFValue(25),
    padding: RFValue(2),
  },
  tabItem: {
    flex: 1,
    paddingVertical: RFValue(8),
    alignItems: 'center',
  },
  nonActiveTab: {
    backgroundColor: 'transparent',
  },
  tabText: {
    color: '#fff',
    fontSize: RFValue(12),
  },
  totalTiming: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: RFValue(10),
    borderRadius: RFValue(15),
    marginBottom: RFValue(15),
  },
  icon: { width: RFValue(18), height: RFValue(18), marginRight: RFValue(8) },
  totalTimingText: { color: '#fff', fontSize: RFValue(13) },
  card: {
    borderRadius: RFValue(15),
    padding: RFValue(12),
    marginBottom: RFValue(15),
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  profileImage: {
    width: RFValue(45),
    height: RFValue(45),
    borderRadius: RFValue(25),
    marginRight: RFValue(10),
  },
  info: { flex: 1 },
  name: { color: '#fff', fontSize: RFValue(13) },
  id: { color: '#ccc', fontSize: RFValue(11) },
  commission: { color: '#fff', fontSize: RFValue(12), marginTop: 4 },
  voiceGiftRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: RFValue(10),
  },
  detailText: { color: '#fff', fontSize: RFValue(12) },
  coinIcon: { width: RFValue(12), height: RFValue(12), marginLeft: 3 },
  verticalDivider: {
    width: 1,
    height: RFValue(14),
    backgroundColor: '#fff',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: RFValue(6),
  },
});
