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
  StyleSheet as ScreenBackgroundStyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { RFValue } from 'react-native-responsive-fontsize';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
    <ScreenBackgroundView style={[{ flex: 1, backgroundColor: '#F8FAFC' }]}>
      <ScreenBackgroundStatusBar translucent backgroundColor="transparent" barStyle="dark-content" animated />
      <LinearGradient colors={['#F8FAFC', '#F1F5F9', '#E2E8F0']} style={ScreenBackgroundStyleSheet.absoluteFillObject} />
      <View style={styles.container}>
        <ScrollView contentContainerStyle={{ paddingBottom: bottomPadding }} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={[styles.header, { paddingTop: topSafeInset + 8 }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Icon name="arrow-back" size={24} color="#1E293B" />
            </TouchableOpacity>
            <Text style={styles.headerText}>{t('history.call_history') || 'Call History'}</Text>
            <View style={{ width: 44 }} />
          </View>

          {/* Day Tabs */}
          <View style={styles.tabBorder}>
            <View style={styles.innerTabWrapper}>
              {[7, 15, 30].map((days) => {
                const isSelected = selectedDays === days;
                return (
                  <TouchableOpacity
                    key={days}
                    onPress={() => setSelectedDays(days)}
                    style={[
                      styles.tabItem,
                      isSelected ? styles.activeTabItem : styles.nonActiveTab,
                    ]}
                  >
                    {isSelected ? (
                      <LinearGradient
                        colors={['#8B5CF6', '#6C5CE7']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[StyleSheet.absoluteFill, { borderRadius: RFValue(25) }]}
                      />
                    ) : null}
                    <Text style={[styles.tabText, isSelected ? styles.activeTabText : styles.inactiveTabText]}>
                      {days === 30 ? (t('history.one_month') || '1 Month') : `${days} ${t('history.days') || 'Days'}`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Loading */}
          {loading && (
            <ActivityIndicator
              size="large"
              color="#6C5CE7"
              style={{ marginTop: 24 }}
            />
          )}

          {/* Total Timing Banner */}
          {!loading && history && (
            <LinearGradient
              colors={['#EDE9FE', '#DDD6FE']}
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
                <Text style={{ fontWeight: 'bold', color: '#4C1D95' }}>
                  {history.totalTiming}
                </Text>
              </Text>
            </LinearGradient>
          )}

          {/* Call List */}
          {!loading && history?.calls?.length > 0
            ? history.calls.map((call, index) => (
              <View
                key={index}
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
                    <Text style={styles.type}>
                      {t('history.type_label') || 'Type :'} {call.type.replace('_', ' ').toUpperCase()}
                    </Text>
                    {call.commission !== undefined && (
                      <Text style={styles.commission}>
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
                    {t('history.start') || 'Start:'} {call.callStart ? new Date(call.callStart).toLocaleTimeString() : 'N/A'}
                  </Text>
                  <View style={styles.verticalDivider} />
                  <Text style={styles.detailText}>
                    {t('history.end') || 'End:'} {call.callEnd ? new Date(call.callEnd).toLocaleTimeString() : 'N/A'}
                  </Text>
                </View>
              </View>
            ))
            : !loading && (
              <Text
                style={{ color: '#94A3B8', textAlign: 'center', marginTop: 30, fontSize: 14, fontWeight: '600' }}
              >
                {t('history.no_call_history') || 'No call history found.'}
              </Text>
            )}
        </ScrollView>
      </View>
    </ScreenBackgroundView>
  );
};

export { CallHistoryScreen as LegacyCallHistoryScreen };
export { default } from './CallHistoryStudio';

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: RFValue(15) },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: RFValue(16),
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerText: {
    fontSize: RFValue(18),
    color: '#0F172A',
    fontWeight: '800',
    textAlign: 'center',
  },
  tabBorder: {
    borderRadius: RFValue(25),
    marginBottom: RFValue(16),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 3,
    elevation: 2,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  innerTabWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: RFValue(25),
  },
  tabItem: {
    flex: 1,
    paddingVertical: RFValue(8),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RFValue(25),
  },
  activeTabItem: {},
  nonActiveTab: {
    backgroundColor: 'transparent',
  },
  tabText: {
    fontSize: RFValue(12),
    fontWeight: '700',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  inactiveTabText: {
    color: '#64748B',
  },
  totalTiming: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: RFValue(11),
    borderRadius: RFValue(16),
    marginBottom: RFValue(16),
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  icon: { width: RFValue(18), height: RFValue(18), marginRight: RFValue(8) },
  totalTimingText: { color: '#6C5CE7', fontSize: RFValue(13), fontWeight: '700' },
  card: {
    borderRadius: RFValue(18),
    padding: RFValue(14),
    marginBottom: RFValue(12),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 2,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  profileImage: {
    width: RFValue(45),
    height: RFValue(45),
    borderRadius: RFValue(25),
    marginRight: RFValue(10),
    backgroundColor: '#E2E8F0',
  },
  info: { flex: 1 },
  name: { color: '#0F172A', fontSize: RFValue(13), fontWeight: '800' },
  id: { color: '#64748B', fontSize: RFValue(11), marginTop: 2 },
  type: { color: '#3B82F6', fontSize: RFValue(11.5), fontWeight: '700', marginTop: 3 },
  commission: { color: '#D97706', fontSize: RFValue(12), fontWeight: '700', marginTop: 3 },
  voiceGiftRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: RFValue(10),
    paddingTop: RFValue(8),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  detailText: { color: '#475569', fontSize: RFValue(11.5), fontWeight: '600' },
  coinIcon: { width: RFValue(12), height: RFValue(12), marginLeft: 3 },
  verticalDivider: {
    width: 1,
    height: RFValue(14),
    backgroundColor: '#E2E8F0',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: RFValue(6),
  },
});
