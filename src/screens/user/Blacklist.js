import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  ScrollView,
  View as ScreenBackgroundView,
  StatusBar as ScreenBackgroundStatusBar,
  StyleSheet as ScreenBackgroundStyleSheet
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import { apiUtil } from '../../utils/apiUtil';
import { AlertService } from '../../utils/AlertService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';

const { width, height } = Dimensions.get('window');

const Blacklist = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 40);
  const { t } = useTranslation();
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  const fetchBlockedUsers = async () => {
    try {
      setLoading(true);
      const res = await apiUtil.get('/user/blocked-contacts');
      console.log('Blocked Users Response:', res.data);
      if (res.data?.success) {
        // Defensive check for nested data
        const list = res.data?.data?.blockedUsers || res.data?.blockedUsers || [];
        setBlockedUsers(list);
      } else {
        // If success is false, show message if available
        if (res.data?.message) {
          AlertService.show('Info', res.data.message, 'info');
        }
        setBlockedUsers([]);
      }
    } catch (error) {
      console.error('Error fetching blocked contacts:', error);
      AlertService.show('Error', t('common.error_msg') || 'Failed to fetch blocked users. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (userId) => {
    try {
      const res = await apiUtil.post(`/user/unblock-contact/${userId}`);
      if (res.data?.success) {
        AlertService.show('Success', 'User unblocked successfully', 'success');
        // Remove from list locally
        setBlockedUsers(prev => prev.filter(user => user.userId !== userId));
      } else {
        AlertService.show('Error', res.data?.message || 'Failed to unblock', 'error');
      }
    } catch (error) {
      console.error('Error unblocking user:', error);
      AlertService.show('Error', 'Something went wrong', 'error');
    }
  };

  const handleGoBack = () => {
    if (navigation) {
      navigation.goBack();
    }
  };

  return (
    <ScreenBackgroundView style={[{ flex: 1, backgroundColor: '#08031a' }]}>
      <ScreenBackgroundStatusBar translucent backgroundColor="transparent" barStyle="light-content" animated />
      <LinearGradient colors={['#08031a', '#050212', '#020108']} style={ScreenBackgroundStyleSheet.absoluteFillObject} />
        {/* Header */}
        <View style={[styles.header, { paddingTop: topSafeInset + 8 }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Icon name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('blocklist.title') || 'Blocklist'}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.userListContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#ffffff" style={{ marginTop: 40 }} />
          ) : blockedUsers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="people" size={60} color="rgba(255,255,255,0.2)" />
              <Text style={styles.emptyText}>{t('blocklist.empty') || 'No blocked users'}</Text>
            </View>
          ) : (
            blockedUsers.map((user, index) => {
              if (!user) return null;
              return (
                <View key={user.userId || index} style={styles.userCard}>
                  <View style={styles.userInfo}>
                    <Icon name="account-circle" size={40} color="#fff" />
                    <View style={{ marginLeft: 15 }}>
                      <Text style={styles.userName}>{user.name || 'Unknown'}</Text>
                      <Text style={styles.userId}>ID: {user.userId || 'N/A'}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleUnblock(user.userId)}
                    style={styles.unblockButton}
                  >
                    <Text style={styles.unblockButtonText}>{t('blocklist.unblock') || 'Unblock'}</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </ScreenBackgroundView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: width,
    height: height,
  },
  gradientBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  placeholder: {
    width: 40, // Same width as back button to center the title
  },
  scrollContent: {
  },
  userListContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: 15,
    fontSize: 16,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  unblockButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  unblockButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default Blacklist;
