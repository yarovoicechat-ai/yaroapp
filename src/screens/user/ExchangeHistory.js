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
import ScreenBackgroundGradient from 'react-native-linear-gradient';

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
    <ScreenBackgroundView style={[{ flex: 1, backgroundColor: '#F8FAFC' }]}>
      <ScreenBackgroundStatusBar translucent backgroundColor="transparent" barStyle="light-content" animated />
      <ScreenBackgroundGradient colors={['#020b24', '#010512', '#000000']} style={ScreenBackgroundStyleSheet.absoluteFillObject} />
      {/* Header */}
      <View style={[styles.header, { paddingTop: topSafeInset + 8 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Icon name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('exchange.history') || 'Exchange History'}</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Star Divider Line */}
      <View style={styles.dividerStarContainer}>
        <View style={styles.dividerLine} />
        <Icon name="stars" size={14} color="#FFD700" style={{ marginHorizontal: 8 }} />
        <View style={styles.dividerLine} />
      </View>

      {/* Filter / Column Headers Bar */}
      <View style={styles.filterBar}>
        <View style={[styles.filterCell, { flex: 1.5 }]}>
          <Icon name="stars" size={14} color="#FFD700" style={{ marginRight: 4 }} />
          <Text style={styles.filterText}>Coins</Text>
        </View>
        <View style={styles.filterCell}>
          <Icon name="diamond" size={14} color="#03dcfe" style={{ marginRight: 4 }} />
          <Text style={styles.filterText}>Diamonds</Text>
        </View>
        <View style={styles.filterCell}>
          <Icon name="access-time" size={14} color="#a855f7" style={{ marginRight: 4 }} />
          <Text style={styles.filterText}>Date</Text>
        </View>
        <View style={styles.filterCell}>
          <Icon name="verified" size={14} color="#10b981" style={{ marginRight: 4 }} />
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
            <ActivityIndicator size="large" color="#FFD700" />
            <Text style={styles.loadingText}>Loading history...</Text>
          </View>
        ) : history.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Icon name="swap-horiz" size={40} color="rgba(255, 215, 0, 0.4)" />
            </View>
            <Text style={styles.emptyTitle}>No Exchange History</Text>
            <Text style={styles.emptySubtitle}>
              Your coin to diamond exchange transactions will appear here.
            </Text>
          </View>
        ) : (
          history.map((item, index) => (
            <View key={item._id || index} style={styles.card}>
              {/* Coins Exchanged */}
              <View style={[styles.cardCell, { flex: 1.5 }]}>
                <Icon name="stars" size={16} color="#FFD700" style={{ marginRight: 6 }} />
                <Text style={styles.coinsText}>
                  -{item.coins ? item.coins.toLocaleString() : '0'}
                </Text>
              </View>

              {/* Diamonds Received */}
              <View style={styles.cardCell}>
                <Icon name="diamond" size={16} color="#03dcfe" style={{ marginRight: 4 }} />
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
                  <Text style={styles.statusText}>
                    {item.status ? item.status.toUpperCase() : 'SUCCESS'}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </ScreenBackgroundView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
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
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  filterCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterText: {
    color: 'rgba(255, 255, 255, 0.6)',
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
    color: 'rgba(255, 255, 255, 0.5)',
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
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 18,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 10,
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
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
  },
  diamondsText: {
    color: '#03dcfe',
    fontSize: 14,
    fontWeight: 'bold',
  },
  dateText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  timeText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 10,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statusFailed: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  statusText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default ExchangeHistory;
