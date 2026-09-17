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
  Alert,
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
    // Force refresh profile on mount to get latest status
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
    // Prevent multiple clicks
    if (toggling) return;

    setToggling(true);
    const newValue = !isEnabled;
    setIsEnabled(newValue); // Optimistic update

    try {
      // Fixed: Use correct endpoint and payload for Host Availability
      const res = await apiUtil.patch('/user/status', {
        status: newValue
      });

      if (res.data.success) {
        await fetchUserProfile(); // Sync context
      } else {
        setIsEnabled(!newValue); // Revert
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
    <ScreenBackgroundView style={[{ flex: 1, backgroundColor: '#08031a' }]}>
      <ScreenBackgroundStatusBar translucent backgroundColor="transparent" barStyle="light-content" animated />
      <LinearGradient colors={['#08031a', '#050212', '#020108']} style={ScreenBackgroundStyleSheet.absoluteFillObject} />
      {/* Header */}
      <View style={[styles.header, { paddingTop: topSafeInset + 8 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back-ios" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('id_manage.title') || 'ID Manage'}</Text>
        <View style={{ width: RF(24) }} />
      </View>
      <AnimatedTitleLine />

      <ScrollView contentContainerStyle={[styles.contentContainer, { paddingBottom: bottomPadding }]} showsVerticalScrollIndicator={false}>
        {/* User Card with Glassmorphism */}
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.03)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.userCard}
        >
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
                  <ActivityIndicator size="small" color="#03dcfe" />
                ) : (
                  <Switch
                    trackColor={{ false: 'rgba(255,255,255,0.1)', true: '#00C851' }}
                    thumbColor={isEnabled ? '#ffffff' : '#f4f3f4'}
                    onValueChange={toggleSwitch}
                    value={isEnabled}
                  />
                )}
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* History Log Cards */}
        <Text style={styles.historyTitle}>Call Logs (Last 30 Days)</Text>
        
        {loadingHistory ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#03dcfe" />
          </View>
        ) : history.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="phone-disabled" size={48} color="rgba(255,255,255,0.2)" />
            <Text style={styles.emptyText}>{t('id_manage.no_history') || 'No call logs found'}</Text>
          </View>
        ) : (
          history.map((item, index) => (
            <View key={index} style={styles.historyCard}>
              <View style={styles.historyIconWrapper}>
                <Icon name="call" size={20} color="#03dcfe" />
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
  headerTitle: { color: '#fff', fontSize: RF(22), fontWeight: 'bold' },

  contentContainer: { padding: WP(4), paddingBottom: HP(5) },

  userCard: { 
    borderRadius: 24, 
    padding: WP(5), 
    marginBottom: HP(3), 
    borderWidth: 1.5, 
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatarBorder: {
    width: WP(22), 
    height: WP(22), 
    borderRadius: WP(11), 
    borderWidth: 2, 
    borderColor: '#03dcfe', 
    overflow: 'hidden', 
    marginRight: WP(5),
    shadowColor: '#03dcfe',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  avatar: { width: '100%', height: '100%' },
  userDetails: { flex: 1 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: HP(0.8),
  },
  label: { color: 'rgba(255, 255, 255, 0.5)', fontSize: RF(14), fontWeight: '600' },
  value: { color: '#ffffff', fontSize: RF(14), fontWeight: 'bold' },

  toggleRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: HP(1.5),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: HP(1.5),
  },
  toggleLabel: { color: '#fff', fontWeight: 'bold', fontSize: RF(14) },

  historyTitle: {
    color: '#ffffff',
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
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: RF(14),
    marginTop: HP(2),
    fontWeight: '600',
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 20,
    paddingHorizontal: WP(4),
    paddingVertical: HP(1.8),
    marginBottom: HP(1.2),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  historyIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(3, 220, 254, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: WP(4),
  },
  historyDetails: {
    flex: 1,
  },
  historyDate: {
    color: '#ffffff',
    fontSize: RF(15),
    fontWeight: '700',
    marginBottom: HP(0.5),
  },
  historyTime: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: RF(12),
    fontWeight: '500',
  },
  historyDurationContainer: {
    paddingHorizontal: WP(3),
    paddingVertical: HP(0.6),
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  historyDurationText: {
    color: '#03dcfe',
    fontSize: RF(13),
    fontWeight: 'bold',
  },
});

export default IdManage;
