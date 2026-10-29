import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StatusBar,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';
import { AuthContext } from '../../context/AuthProvider';
import { apiUtil } from '../../utils/apiUtil';

dayjs.extend(relativeTime);

export default function SystemNoticeScreen() {
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 24);
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchNotices = async () => {
      try {
        setLoading(true);
        const response = await apiUtil.get('/notifications', { params: { limit: 100, type: 'system' } });
        const payload = response.data?.data || {};
        const list = Array.isArray(payload.notifications) ? payload.notifications : [];
        if (isMounted) {
          const systemMessages = list.filter((notice) => String(notice?.type || '').toLowerCase() === 'system');
          setNotices(systemMessages.map((notice) => {
            const dataObj = notice.data || {};
            const isAssetGrant = dataObj.action === 'MyItems' || dataObj.screen === 'MyItems';
            const invitationId =
              dataObj.action === 'team_invitation' || dataObj.invitationId || notice.invitationId
                ? (dataObj.invitationId || notice.invitationId || dataObj.id)
                : null;

            return {
              ...notice,
              id: String(notice._id || notice.id),
              title: notice.title || 'System',
              subtitle: notice.message || notice.content || notice.body || '',
              timeAgo: notice.createdAt ? dayjs(notice.createdAt).fromNow() : '',
              isAssetGrant,
              invitationId,
              data: dataObj,
            };
          }));
        }
      } catch (error) {
        if (isMounted) {
          setNotices([]);
        }
        console.log('Failed to fetch system notifications:', error?.message || error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchNotices();
    return () => { isMounted = false; };
  }, []);

  const handleItemPress = async (item) => {
    if (!item.isRead) {
      try {
        await apiUtil.patch(`/notifications/${item.id}/read`);
        setNotices((current) => current.map((notice) => notice.id === item.id ? { ...notice, isRead: true } : notice));
      } catch (error) {
        console.log('Could not mark notification read:', error?.message || error);
      }
    }

    // 1. Team Invitation Click Handler
    if (item.invitationId || item.data?.action === 'team_invitation') {
      navigation.navigate('TeamInvitationForm', {
        invitationId: item.invitationId || item.data?.invitationId,
      });
      return;
    }

    // 2. Room Invite Click Handler
    if (item.data?.roomId || item.data?.action === 'room_invite') {
      navigation.navigate('VoiceRoom', {
        roomId: item.data?.roomId,
      });
      return;
    }

    // 3. Asset Grant / My Items Handler
    if (item.isAssetGrant) {
      navigation.navigate('MyItems', {
        selectedCategory: item.data?.category,
        assetId: item.data?.assetId || item.data?.uniqueId,
      });
      return;
    }

    // 4. Wallet / Recharge Handler
    if (item.data?.action === 'wallet' || item.data?.action === 'recharge') {
      navigation.navigate('Wallet');
      return;
    }

    // 5. Followers Handler
    if (item.type === 'follow') {
      navigation.navigate('Followers', { initialTab: 'followers' });
      return;
    }
  };

  const renderItem = ({ item }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.noticeRow}
        onPress={() => handleItemPress(item)}
      >
        {/* Left Orange Circle Bell Icon (Matching Screenshot 4) */}
        <View style={styles.orangeCircleIcon}>
          <Icon name="notifications" size={22} color="#FFFFFF" />
        </View>

        {/* Content Details */}
        <View style={styles.noticeContent}>
          <View style={styles.topRow}>
            <Text style={styles.systemTitle}>System</Text>
            <Text style={styles.timeAgo}>{item.timeAgo}</Text>
          </View>

          <Text style={styles.noticeBody} numberOfLines={3}>
            {item.subtitle || item.title}
          </Text>

          {/* Action button if team invitation */}
          {item.invitationId ? (
            <TouchableOpacity
              style={styles.invitationActionBtn}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('TeamInvitationForm', { invitationId: item.invitationId })}
            >
              <Text style={styles.invitationActionBtnText}>Review & Fill Application</Text>
              <Icon name="arrow-forward" size={13} color="#FFFFFF" />
            </TouchableOpacity>
          ) : null}

          {/* Action button if asset grant */}
          {item.isAssetGrant ? (
            <TouchableOpacity
              style={styles.assetActionBtn}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('MyItems', {
                selectedCategory: item.data?.category,
                assetId: item.data?.assetId || item.data?.uniqueId,
              })}
            >
              <Text style={styles.assetActionBtnText}>View in My Items</Text>
              <Icon name="arrow-forward" size={13} color="#F59E0B" />
            </TouchableOpacity>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="#F59E0B" barStyle="light-content" />

      {/* Yellow/Amber Header (Matching Screenshot 4) */}
      <View style={[styles.header, { paddingTop: topSafeInset + 6 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Icon name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>System</Text>
      </View>

      {/* Notifications List */}
      <FlatList
        data={notices}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: bottomPadding },
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="small" color="#F59E0B" style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="notifications-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>No notifications yet</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  orangeCircleIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    marginTop: 2,
    elevation: 2,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  noticeContent: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  systemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  timeAgo: {
    fontSize: 12,
    color: '#94A3B8',
  },
  noticeBody: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  invitationActionBtn: {
    marginTop: 8,
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  invitationActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  assetActionBtn: {
    marginTop: 8,
    backgroundColor: '#FEF3C7',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 6,
  },
  assetActionBtnText: {
    color: '#B45309',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
});
