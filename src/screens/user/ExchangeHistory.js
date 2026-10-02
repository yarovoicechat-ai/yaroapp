import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Platform,
  StatusBar,
  View as ScreenBackgroundView,
  StatusBar as ScreenBackgroundStatusBar,
  StyleSheet as ScreenBackgroundStyleSheet
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { apiUtil } from '../../utils/apiUtil';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';
import { useTranslation } from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

const ExchangeHistory = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 40);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    fetchExchangeHistory();
  }, []);

  const fetchExchangeHistory = async () => {
    try {
      const res = await apiUtil.get('/user/exchange-history');
      if (res.data && res.data.success) {
        setHistory(res.data.data.history || res.data.data || []);
      } else {
        setHistory([]);
      }
    } catch (error) {
      console.log('Error fetching exchange history:', error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '---';
    const d = new Date(isoString);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear().toString().substr(-2)}`;
  };

  const formatTime = (isoString) => {
    if (!isoString) return '---';
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.screen}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" animated />
      <LinearGradient colors={['#F8FAFC', '#F1F5F9', '#EEF2FF']} style={StyleSheet.absoluteFillObject} />
      {/* Header */}
      <View style={[styles.header, { paddingTop: topSafeInset + 8 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Icon name="chevron-left" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('exchange.history') || 'Exchange History'}</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Star Divider Line */}
      <View style={styles.dividerStarContainer}>
        <View style={styles.dividerLine} />
        <Icon name="stars" size={14} color="#D97706" style={{ marginHorizontal: 8 }} />
        <View style={styles.dividerLine} />
      </View>

      {/* Filter / Column Headers Bar */}
      <View style={styles.filterBar}>
        <View style={[styles.filterCell, { flex: 1.5 }]}>
          <Icon name="stars" size={14} color="#D97706" style={{ marginRight: 4 }} />
          <Text style={styles.filterText}>Beans</Text>
        </View>
        <View style={styles.filterCell}>
          <Icon name="diamond" size={14} color="#0284C7" style={{ marginRight: 4 }} />
          <Text style={styles.filterText}>Diamonds</Text>
        </View>
        <View style={styles.filterCell}>
          <Icon name="access-time" size={14} color="#7C3AED" style={{ marginRight: 4 }} />
          <Text style={styles.filterText}>Date</Text>
        </View>
        <View style={styles.filterCell}>
          <Icon name="verified" size={14} color="#10B981" style={{ marginRight: 4 }} />
          <Text style={styles.filterText}>Status</Text>
        </View>
      </View>

      {/* Main Content List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={styles.loadingText}>Loading history...</Text>
          </View>
        ) : history.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Icon name="swap-horiz" size={40} color="#D97706" />
            </View>
            <Text style={styles.emptyTitle}>No Exchange History</Text>
            <Text style={styles.emptySubtitle}>
              Your bean to diamond exchange transactions will appear here.
            </Text>
          </View>
        ) : (
          history.map((item, index) => (
            <View key={item._id || index} style={styles.card}>
              {/* Coins Exchanged */}
              <View style={[styles.cardCell, { flex: 1.5 }]}>
                <Icon name="stars" size={16} color="#D97706" style={{ marginRight: 6 }} />
                <Text style={styles.coinsText}>
                  -{item.coins ? item.coins.toLocaleString() : '0'}
                </Text>
              </View>

              {/* Diamonds Received */}
              <View style={styles.cardCell}>
                <Icon name="diamond" size={16} color="#0284C7" style={{ marginRight: 4 }} />
                <Text style={styles.diamondsText}>
                  +{item.diamonds ? item.diamonds.toLocaleString() : '0'}
                </Text>
              </View>

              {/* Date & Time */}
              <View style={styles.cardCellColumn}>
                <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
                <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
              </View>

              {/* Status */}
              <View style={styles.cardCell}>
                <View
                  style={[
                    styles.statusBadge,
                    item.status === 'failed' ? styles.statusFailed : styles.statusSuccess,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      item.status === 'failed' ? { color: '#EF4444' } : { color: '#10B981' },
                    ]}
                  >
                    {item.status ? item.status.toUpperCase() : 'SUCCESS'}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  dividerStarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  filterCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  loaderContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 14,
  },
  emptyContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 18,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  cardCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardCellColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  coinsText: {
    color: '#D97706',
    fontSize: 14,
    fontWeight: 'bold',
  },
  diamondsText: {
    color: '#0284C7',
    fontSize: 14,
    fontWeight: 'bold',
  },
  dateText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '600',
  },
  timeText: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusSuccess: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  statusFailed: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default ExchangeHistory;
