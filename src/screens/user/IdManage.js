import React, { useContext, useEffect, useState } from 'react';
import { View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Switch,
  Dimensions,
  ActivityIndicator,
  View as ScreenBackgroundView,
  StatusBar as ScreenBackgroundStatusBar,
  StyleSheet as ScreenBackgroundStyleSheet
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthProvider';
import { apiUtil } from '../../utils/apiUtil';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { AlertService } from '../../utils/AlertService';
import { getUserAvatar } from '../../utils/avatarUtil';
import AnimatedTitleLine from '../../components/AnimatedTitleLine';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';

const { width, height } = Dimensions.get('window');

// Responsive font helper
const RF = (size) => Math.sqrt(width * width + height * height) * (size / 1000);
const WP = (percent) => (width * percent) / 100;
const HP = (percent) => (height * percent) / 100;

const IdManage = () => {
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 40);
  const navigation = useNavigation();
  const { user, fetchUserProfile } = useContext(AuthContext);

  const [isEnabled, setIsEnabled] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [history, setHistory] = useState([]);
  const [toggling, setToggling] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    fetchUserProfile();
    if (user) {
      setIsEnabled(!!user.isActive);
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    try {
      const res = await apiUtil.get('/call/history?days=30');
      if (res.data.success) {
        setHistory(res.data.data.calls || []);
      }
    } catch (err) {
      console.log('Error fetching history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const toggleSwitch = async () => {
    if (toggling) return;

    setToggling(true);
    const newValue = !isEnabled;
    setIsEnabled(newValue);

    try {
      const res = await apiUtil.patch('/user/status', {
        status: newValue
      });

      if (res.data.success) {
        await fetchUserProfile();
      } else {
        setIsEnabled(!newValue);
        AlertService.show(t('id_manage.error') || "Error", t('id_manage.update_fail') || "Failed to update status", "error");
      }
    } catch (err) {
      console.log("Toggle error:", err);
      setIsEnabled(!newValue);
      AlertService.show(t('id_manage.error') || "Error", t('id_manage.update_fail') || "Failed to update status", "error");
    } finally {
      setToggling(false);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0s';
    const numSecs = Number(seconds);
    if (isNaN(numSecs)) return seconds;
    const h = Math.floor(numSecs / 3600);
    const m = Math.floor((numSecs % 3600) / 60);
    const s = numSecs % 60;
    return `${h > 0 ? h + 'h ' : ''}${m > 0 ? m + 'm ' : ''}${s}s`;
  };

  return (
    <ScreenBackgroundView style={[{ flex: 1, backgroundColor: '#F8FAFC' }]}>
      <ScreenBackgroundStatusBar translucent backgroundColor="transparent" barStyle="dark-content" animated />
      <LinearGradient colors={['#F8FAFC', '#F1F5F9', '#E2E8F0']} style={ScreenBackgroundStyleSheet.absoluteFillObject} />
      {/* Header */}
      <View style={[styles.header, { paddingTop: topSafeInset + 8 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back-ios" size={22} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('id_manage.title') || 'ID Manage'}</Text>
        <View style={{ width: RF(24) }} />
      </View>
      <AnimatedTitleLine />

      <ScrollView contentContainerStyle={[styles.contentContainer, { paddingBottom: bottomPadding }]} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.userInfo}>
            <View style={styles.avatarBorder}>
              <Image
                source={getUserAvatar(user)}
                style={styles.avatar}
              />
            </View>
            <View style={styles.userDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.label}>{t('id_manage.name_label') || 'Name:'}</Text>
                <Text style={styles.value}>{user?.name || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.label}>{t('id_manage.id_label') || 'ID No:'}</Text>
                <Text style={styles.value}>{user?.userId || user?._id || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.label}>{t('id_manage.username_label') || 'User Name:'}</Text>
                <Text style={styles.value}>{user?.userName || 'N/A'}</Text>
              </View>

              {/* Toggle Row */}
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>{t('id_manage.status_label') || 'ID Status (Active):'}</Text>
                {toggling ? (
                  <ActivityIndicator size="small" color="#6366F1" />
                ) : (
                  <Switch
                    trackColor={{ false: '#E2E8F0', true: '#10B981' }}
                    thumbColor={isEnabled ? '#FFFFFF' : '#FFFFFF'}
                    onValueChange={toggleSwitch}
                    value={isEnabled}
                  />
                )}
              </View>
            </View>
          </View>
        </View>

        {/* History Log Cards */}
        <Text style={styles.historyTitle}>Call Logs (Last 30 Days)</Text>
        
        {loadingHistory ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#6366F1" />
          </View>
        ) : history.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="phone-disabled" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>{t('id_manage.no_history') || 'No call logs found'}</Text>
          </View>
        ) : (
          history.map((item, index) => (
            <View key={index} style={styles.historyCard}>
              <View style={styles.historyIconWrapper}>
                <Icon name="call" size={20} color="#4F46E5" />
              </View>
              <View style={styles.historyDetails}>
                <Text style={styles.historyDate}>{dayjs(item.callStart).format('DD MMM YYYY')}</Text>
                <Text style={styles.historyTime}>
                  {`${dayjs(item.callStart).format('hh:mm A')} - ${dayjs(item.callEnd).format('hh:mm A')}`}
                </Text>
              </View>
              <View style={styles.historyDurationContainer}>
                <Text style={styles.historyDurationText}>{formatDuration(item.duration)}</Text>
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
    paddingHorizontal: WP(4),
    paddingBottom: HP(1.5),
  },
  backButton: { padding: 8 },
  headerTitle: { color: '#0F172A', fontSize: RF(22), fontWeight: 'bold' },

  contentContainer: { padding: WP(4), paddingBottom: HP(5) },

  userCard: { 
    borderRadius: 24, 
    padding: WP(5), 
    marginBottom: HP(3), 
    backgroundColor: '#FFFFFF',
    borderWidth: 1, 
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatarBorder: {
    width: WP(22), 
    height: WP(22), 
    borderRadius: WP(11), 
    borderWidth: 2, 
    borderColor: '#6366F1', 
    overflow: 'hidden', 
    marginRight: WP(5),
  },
  avatar: { width: '100%', height: '100%' },
  userDetails: { flex: 1 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: HP(0.8),
  },
  label: { color: '#64748B', fontSize: RF(14), fontWeight: '600' },
  value: { color: '#0F172A', fontSize: RF(14), fontWeight: 'bold' },

  toggleRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: HP(1.5),
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: HP(1.5),
  },
  toggleLabel: { color: '#0F172A', fontWeight: 'bold', fontSize: RF(14) },

  historyTitle: {
    color: '#0F172A',
    fontSize: RF(16),
    fontWeight: 'bold',
    marginBottom: HP(2),
    letterSpacing: 0.5,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: HP(5),
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: HP(8),
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: RF(14),
    marginTop: HP(2),
    fontWeight: '600',
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: WP(4),
    paddingVertical: HP(1.8),
    marginBottom: HP(1.2),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  historyIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: WP(4),
  },
  historyDetails: {
    flex: 1,
  },
  historyDate: {
    color: '#0F172A',
    fontSize: RF(15),
    fontWeight: '700',
    marginBottom: HP(0.5),
  },
  historyTime: {
    color: '#64748B',
    fontSize: RF(12),
    fontWeight: '500',
  },
  historyDurationContainer: {
    paddingHorizontal: WP(3),
    paddingVertical: HP(0.6),
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
  },
  historyDurationText: {
    color: '#4F46E5',
    fontSize: RF(13),
    fontWeight: 'bold',
  },
});

export { IdManage as LegacyIdManage };
export { default } from './IdManageStudio';
