import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthProvider';
import { apiUtil } from '../../utils/apiUtil';
import { useTranslation } from 'react-i18next';
import { AlertService } from '../../utils/AlertService';

export default function Setting() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 32);
  const { logout, user } = useContext(AuthContext);
  const { t } = useTranslation();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReasonText, setDeleteReasonText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleLogout = () => {
    AlertService.show(
      t('profile.logout') || 'Logout',
      'Are you sure you want to logout from Yaro?',
      'error',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: t('profile.logout') || 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'LoginWrapper' }],
            });
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    setDeleteReasonText('');
    setShowDeleteModal(true);
  };

  const submitDeleteRequest = async () => {
    if (!deleteReasonText.trim()) {
      AlertService.show('Required', 'Please write a reason for deleting your account.', 'error');
      return;
    }

    setDeleting(true);
    try {
      const res = await apiUtil.post('/user/request-deletion', {
        reason: deleteReasonText,
      });
      if (res.data.success) {
        setShowDeleteModal(false);
        AlertService.show(
          'Request Submitted',
          'Your account deletion request has been submitted for review. You will now be logged out.',
          'success',
          [
            {
              text: 'OK',
              onPress: async () => {
                await logout();
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'LoginWrapper' }],
                });
              },
            },
          ]
        );
      } else {
        AlertService.show('Error', res.data.message || 'Failed to submit request', 'error');
      }
    } catch (error) {
      console.log('Delete Request Error', error);
      AlertService.show('Error', error.response?.data?.message || 'Failed to submit request', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const settingsOptions = [
    {
      id: 'account',
      title: 'Account',
      icon: 'person',
      iconBg: '#F3E8FF',
      iconColor: '#7C3AED',
      onPress: () => navigation.navigate('Account'),
    },
    {
      id: 'privacy',
      title: 'Privacy',
      icon: 'lock-closed',
      iconBg: '#F3E8FF',
      iconColor: '#7C3AED',
      onPress: () => navigation.navigate('PrivacyPolicy'),
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: 'notifications',
      iconBg: '#F3E8FF',
      iconColor: '#7C3AED',
      onPress: () => navigation.navigate('Notifications'),
    },
    {
      id: 'language',
      title: 'Language',
      icon: 'options',
      iconBg: '#F3E8FF',
      iconColor: '#7C3AED',
      onPress: () => navigation.navigate('Language'),
    },
    {
      id: 'help',
      title: 'Help & Support',
      icon: 'help-circle',
      iconBg: '#F3E8FF',
      iconColor: '#7C3AED',
      onPress: () => navigation.navigate('HelpAndSupport'),
    },
    {
      id: 'about',
      title: 'About',
      icon: 'shield-checkmark',
      iconBg: '#F3E8FF',
      iconColor: '#7C3AED',
      onPress: () => navigation.navigate('AboutUs'),
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topSafeInset > 0 ? 8 : 12 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Icon name="chevron-back" size={26} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardContainer}>
          {settingsOptions.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuRow}
              onPress={item.onPress}
              activeOpacity={0.65}
            >
              <View style={styles.menuLeft}>
                <View style={[styles.iconBadge, { backgroundColor: item.iconBg }]}>
                  <Icon name={item.icon} size={20} color={item.iconColor} />
                </View>
                <Text style={styles.menuTitle}>{item.title}</Text>
              </View>
              <Icon name="chevron-forward" size={19} color="#6366F1" />
            </TouchableOpacity>
          ))}

          {/* Logout Row */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={handleLogout}
            activeOpacity={0.65}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.iconBadge, { backgroundColor: '#FEE2E2' }]}>
                <Icon name="notifications-off" size={20} color="#EF4444" />
              </View>
              <Text style={[styles.menuTitle, { color: '#EF4444' }]}>Logout</Text>
            </View>
            <Icon name="chevron-forward" size={19} color="#6366F1" />
          </TouchableOpacity>

          {/* Delete Account Subtle Link */}
          <TouchableOpacity
            style={styles.deleteLinkRow}
            onPress={handleDeleteAccount}
            activeOpacity={0.6}
          >
            <Text style={styles.deleteLinkText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Delete Account</Text>
            <Text style={styles.modalSubtitle}>
              Please tell us why you want to delete your account. This action is permanent and cannot be undone.
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Reason for deleting account..."
              placeholderTextColor="#94A3B8"
              value={deleteReasonText}
              onChangeText={setDeleteReasonText}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalDeleteBtn}
                onPress={submitDeleteRequest}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalDeleteText}>Confirm Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  deleteLinkRow: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  deleteLinkText: {
    fontSize: 13,
    color: '#94A3B8',
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    textAlignVertical: 'top',
    minHeight: 80,
    marginBottom: 18,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  modalDeleteBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: '#EF4444',
  },
  modalDeleteText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
