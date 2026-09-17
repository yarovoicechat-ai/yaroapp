import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Image,
  Platform,
  View as ScreenBackgroundView,
  StatusBar as ScreenBackgroundStatusBar,
  StyleSheet as ScreenBackgroundStyleSheet
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { apiUtil } from '../../utils/apiUtil';
import { useTranslation } from 'react-i18next';

const diamondIcon = require('../../assets/icons/diamond.png');
const { width, height } = Dimensions.get('window');

const RechargeHistory = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 40);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await apiUtil.get('/user/recharge-history');
      if (res.data.success) {
        setHistory(res.data.data.history || []);
      }
    } catch (error) {
      console.log('Error fetching history:', error);
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

  const getTypeLabel = (type) => {
    if (type === 'google_play') return 'Google Play';
    if (type === 'online') return 'Online';
    if (type === 'offline') return 'Offline';
    return type || 'Recharge';
  };

  const getTypeIcon = (type) => {
    if (type === 'google_play') return 'shop';
    if (type === 'online') return 'payment';
    return 'portable-wifi-off';
  };

  return (
    <ScreenBackgroundView style={[{ flex: 1, backgroundColor: '#08031a' }]}>
      <ScreenBackgroundStatusBar translucent backgroundColor="transparent" barStyle="light-content" animated />
      <LinearGradient colors={['#08031a', '#050212', '#020108']} style={ScreenBackgroundStyleSheet.absoluteFillObject} />
      {/* Space Background decorative items */}
      <View style={styles.starOverlay1} />
      <View style={styles.starOverlay2} />
      <View style={styles.planetWrapper}>
        <LinearGradient
          colors={['rgba(124, 77, 255, 0.12)', 'rgba(3, 220, 254, 0.25)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.planetGlow}
        />
      </View>
      <View style={styles.gridWrapper}>
        <View style={styles.gridLine1} />
        <View style={styles.gridLine2} />
      </View>

      {/* Header */}
      <View style={[styles.header, { paddingTop: topSafeInset + 8 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="chevron-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('recharge.history') || 'Recharge History'}</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Star Divider Line */}
      <View style={styles.dividerStarContainer}>
        <View style={styles.dividerLine} />
        <Icon name="star" size={10} color="#a855f7" style={{ marginHorizontal: 8 }} />
        <View style={styles.dividerLine} />
      </View>

      {/* Filter Headers Bar */}
      <View style={styles.filterBar}>
        <View style={[styles.filterCell, { flex: 1.5 }]}>
          <Icon name="tune" size={14} color="#a855f7" style={{ marginRight: 4 }} />
          <Text style={styles.filterText}>Type</Text>
        </View>
        <View style={styles.filterCell}>
          <Icon name="access-time" size={14} color="#a855f7" style={{ marginRight: 4 }} />
          <Text style={styles.filterText}>Time</Text>
        </View>
        <View style={styles.filterCell}>
          <Icon name="today" size={14} color="#a855f7" style={{ marginRight: 4 }} />
          <Text style={styles.filterText}>Date</Text>
        </View>
        <View style={[styles.filterCell, { flex: 1.5, justifyContent: 'flex-end' }]}>
          <Image source={diamondIcon} style={styles.filterCoinIcon} resizeMode="contain" />
          <Text style={styles.filterText}>Diamonds</Text>
        </View>
      </View>

      {/* Table Container - Full Screen */}
      <View style={styles.tableContainer}>
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#03dcfe" />
          </View>
        ) : history.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 16 }}>{t('recharge.no_history') || 'No recharge history found.'}</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: bottomPadding }}
          >
            {/* Table Rows */}
            {history.map((item, idx) => {
              const amount = item.diamonds || item.coins || 0;
              const isGooglePlay = item.type === 'google_play';

              return (
                <View key={idx} style={styles.historyCard}>
                  <LinearGradient
                    colors={['rgba(124, 77, 255, 0.4)', 'rgba(3, 220, 254, 0.4)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.cardBorderOverlay}
                  />
                  <View style={styles.cardInner}>
                    <LinearGradient
                      colors={isGooglePlay ? ['#03dcfe', '#2563eb'] : ['#7c4dff', '#2563eb']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.iconCircle}
                    >
                      <Icon name={getTypeIcon(item.type)} size={18} color="#fff" />
                    </LinearGradient>
                    
                    <View style={{ flex: 1.5 }}>
                      <Text style={styles.typeName}>{getTypeLabel(item.type)}</Text>
                      <View style={[
                        styles.badgeContainer,
                        item.status === 'PENDING' && styles.pendingBadge,
                        item.status === 'FAILED' && styles.failedBadge,
                      ]}>
                        <Text style={styles.badgeText}>{item.status || 'Completed'}</Text>
                      </View>
                    </View>
                    
                    <View style={{ flex: 1, alignItems: 'center' }}>
                      <Text style={styles.timeText}>{formatTime(item.createdAt || item.date)}</Text>
                    </View>
                    
                    <View style={{ flex: 1, alignItems: 'center' }}>
                      <Text style={styles.dateText}>{formatDate(item.createdAt || item.date)}</Text>
                    </View>
                    
                    <View style={{ flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <Image source={diamondIcon} style={styles.coinIcon} resizeMode="contain" />
                      <Text style={styles.coinValueText}>{amount.toLocaleString()}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
    </ScreenBackgroundView>
  );
};

const styles = StyleSheet.create({
  // Decorative space elements
  starOverlay1: {
    position: 'absolute',
    top: height * 0.15,
    left: width * 0.1,
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#fff',
    opacity: 0.8,
  },
  starOverlay2: {
    position: 'absolute',
    top: height * 0.3,
    right: width * 0.15,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#ff3366',
    opacity: 0.5,
  },
  planetWrapper: {
    position: 'absolute',
    bottom: -height * 0.15,
    right: -width * 0.15,
    width: width * 0.65,
    height: width * 0.65,
    borderRadius: (width * 0.65) / 2,
    overflow: 'hidden',
  },
  planetGlow: {
    flex: 1,
    borderRadius: (width * 0.65) / 2,
  },
  gridWrapper: {
    position: 'absolute',
    bottom: height * 0.05,
    left: -width * 0.1,
    width: width * 0.5,
    height: height * 0.2,
    opacity: 0.15,
  },
  gridLine1: {
    position: 'absolute',
    width: '100%',
    height: 1.5,
    backgroundColor: '#ff3366',
    transform: [{ rotate: '30deg' }],
  },
  gridLine2: {
    position: 'absolute',
    width: '100%',
    height: 1.5,
    backgroundColor: '#ff3366',
    top: 30,
    transform: [{ rotate: '30deg' }],
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: 'rgba(124, 77, 255, 0.4)',
    backgroundColor: 'rgba(124, 77, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },

  // Star Divider Line
  dividerStarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    width: 30,
    height: 1.2,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },

  // Filter Bar
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginHorizontal: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 12,
  },
  filterCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCoinIcon: {
    width: 14,
    height: 14,
    marginRight: 4,
  },
  filterText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    fontWeight: '700',
  },

  tableContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },

  historyCard: {
    borderRadius: 20,
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  cardBorderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    padding: 1.2,
    pointerEvents: 'none',
  },
  cardInner: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 19,
    paddingHorizontal: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  typeName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  badgeContainer: {
    backgroundColor: 'rgba(124, 77, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(124, 77, 255, 0.3)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  pendingBadge: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderColor: 'rgba(234, 179, 8, 0.4)',
  },
  failedBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  badgeText: {
    color: '#a855f7',
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  timeText: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 11,
    fontWeight: '500',
  },
  dateText: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 11,
    fontWeight: '500',
  },
  coinIcon: {
    width: 16,
    height: 16,
    marginRight: 4,
  },
  coinValueText: {
    color: '#03dcfe',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default RechargeHistory;