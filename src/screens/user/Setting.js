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
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthProvider';
import { apiUtil } from '../../utils/apiUtil';
import { useTranslation } from 'react-i18next';
import { AlertService } from '../../utils/AlertService';
import { OverlayPermissionManager } from '../../utils/OverlayPermissionManager';

export default function Setting() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const isSmall = width < 360;
  const isTablet = width >= 600;
  const isLandscape = width > height;
  const contentMaxWidth = isTablet ? 600 : '100%';

  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 32);
  const { logout } = useContext(AuthContext);
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
            try {
              navigation.getParent()?.reset({
                index: 0,
                routes: [{ name: 'SignIn' }],
              });
            } catch (_) {}
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
    setDeleting(true);
    try {
      const res = await apiUtil.post('/user/request-deletion', {
        reason: deleteReasonText.trim() || 'User requested account deletion from settings',
      });
      if (res.data.success) {
        setShowDeleteModal(false);
        AlertService.show(
          'Account Deleted',
          'Your account and personal data have been deleted. You will now be logged out.',
          'success',
          [
            {
              text: 'OK',
              onPress: async () => {
                await logout();
                try {
                  navigation.getParent()?.reset({
                    index: 0,
                    routes: [{ name: 'SignIn' }],
                  });
                } catch (_) {}
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

  const accountSection = [
    {
      id: 'account',
      title: 'Account & Security',
      desc: 'Linked phone, Google ID, password',
      icon: 'person-circle-outline',
      iconBg: '#F3E8FF',
      iconColor: '#7C3AED',
      onPress: () => navigation.navigate('Account'),
    },
    {
      id: 'privacy',
      title: 'Privacy Policy',
      desc: 'Permissions & data safety',
      icon: 'shield-checkmark-outline',
      iconBg: '#ECFDF5',
      iconColor: '#059669',
      onPress: () => navigation.navigate('PrivacyPolicy'),
    },
  ];

  const appSection = [
    {
      id: 'notifications',
      title: 'Notifications',
      desc: 'Call alerts, room notices',
      icon: 'notifications-outline',
      iconBg: '#EFF6FF',
      iconColor: '#2563EB',
      onPress: () => navigation.navigate('Notifications'),
    },
    {
      id: 'overlay',
      title: 'Floating Call Controls',
      desc: 'Controls over other apps during call',
      icon: 'layers-outline',
      iconBg: '#FDF4FF',
      iconColor: '#C026D3',
      onPress: async () => {
        const granted = await OverlayPermissionManager.checkActualOverlayPermission();
        if (granted) {
          AlertService.show(
            'Floating Controls Enabled',
            'Floating call controls are currently active. When you minimize Yaro during a call, a floating mini-widget allows you to mute or return to the call.',
            'info',
            [
              { text: 'Manage in Settings', onPress: () => OverlayPermissionManager.openOverlaySettings() },
              { text: 'OK', style: 'cancel' },
            ]
          );
        } else {
          AlertService.show(
            'Enable Floating Controls',
            'Allow Yaro to display floating call controls over other apps so you can mute, unmute, or return to active voice calls while using other apps.',
            'info',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Enable in Settings', onPress: () => OverlayPermissionManager.openOverlaySettings() },
            ]
          );
        }
      },
    },
    {
      id: 'language',
      title: 'Language',
      desc: 'Choose app display language',
      icon: 'language-outline',
      iconBg: '#FEF3C7',
      iconColor: '#D97706',
      onPress: () => navigation.navigate('Language'),
    },
  ];

  const supportSection = [
    {
      id: 'help',
      title: 'Help & Support',
      desc: 'FAQs, 24/7 AI Bot, tickets',
      icon: 'help-buoy-outline',
      iconBg: '#EEF2FF',
      iconColor: '#4F46E5',
      onPress: () => navigation.navigate('HelpAndSupport'),
    },
    {
      id: 'about',
      title: 'About Yaro',
      desc: 'Version, terms, legal licenses',
      icon: 'information-circle-outline',
      iconBg: '#F1F5F9',
      iconColor: '#475569',
      onPress: () => navigation.navigate('AboutUs'),
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* Responsive Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topSafeInset + (isSmall ? 6 : 10),
            paddingLeft: Math.max(isSmall ? 12 : 16, insets.left),
            paddingRight: Math.max(isSmall ? 12 : 16, insets.right),
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.backButton, isSmall && styles.backButtonSmall]}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <Icon name="chevron-back" size={isSmall ? 22 : 24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isSmall && styles.headerTitleSmall]}>Settings</Text>
        <View style={isSmall ? styles.headerPlaceholderSmall : styles.headerPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: bottomPadding,
            paddingLeft: Math.max(isSmall ? 12 : 16, insets.left),
            paddingRight: Math.max(isSmall ? 12 : 16, insets.right),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.responsiveWrapper, { maxWidth: contentMaxWidth }]}>
          {/* Section 1: Account */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, isSmall && styles.sectionTitleSmall]}>
              Account & Security
            </Text>
            <View style={[styles.cardContainer, isSmall && styles.cardContainerSmall]}>
              {accountSection.map((item, idx) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.menuRow,
                    isSmall && styles.menuRowSmall,
                    idx === accountSection.length - 1 && { borderBottomWidth: 0 },
                  ]}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.iconBadge,
                      isSmall && styles.iconBadgeSmall,
                      { backgroundColor: item.iconBg },
                    ]}
                  >
                    <Icon name={item.icon} size={isSmall ? 18 : 20} color={item.iconColor} />
                  </View>
                  <View style={styles.menuTextCol}>
                    <Text style={[styles.menuTitle, isSmall && styles.menuTitleSmall]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={[styles.menuDesc, isSmall && styles.menuDescSmall]} numberOfLines={2}>
                      {item.desc}
                    </Text>
                  </View>
                  <Icon name="chevron-forward" size={isSmall ? 16 : 18} color="#94A3B8" />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Section 2: App Experience */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, isSmall && styles.sectionTitleSmall]}>
              Preferences
            </Text>
            <View style={[styles.cardContainer, isSmall && styles.cardContainerSmall]}>
              {appSection.map((item, idx) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.menuRow,
                    isSmall && styles.menuRowSmall,
                    idx === appSection.length - 1 && { borderBottomWidth: 0 },
                  ]}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.iconBadge,
                      isSmall && styles.iconBadgeSmall,
                      { backgroundColor: item.iconBg },
                    ]}
                  >
                    <Icon name={item.icon} size={isSmall ? 18 : 20} color={item.iconColor} />
                  </View>
                  <View style={styles.menuTextCol}>
                    <Text style={[styles.menuTitle, isSmall && styles.menuTitleSmall]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={[styles.menuDesc, isSmall && styles.menuDescSmall]} numberOfLines={2}>
                      {item.desc}
                    </Text>
                  </View>
                  <Icon name="chevron-forward" size={isSmall ? 16 : 18} color="#94A3B8" />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Section 3: Support */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, isSmall && styles.sectionTitleSmall]}>
              Support & About
            </Text>
            <View style={[styles.cardContainer, isSmall && styles.cardContainerSmall]}>
              {supportSection.map((item, idx) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.menuRow,
                    isSmall && styles.menuRowSmall,
                    idx === supportSection.length - 1 && { borderBottomWidth: 0 },
                  ]}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.iconBadge,
                      isSmall && styles.iconBadgeSmall,
                      { backgroundColor: item.iconBg },
                    ]}
                  >
                    <Icon name={item.icon} size={isSmall ? 18 : 20} color={item.iconColor} />
                  </View>
                  <View style={styles.menuTextCol}>
                    <Text style={[styles.menuTitle, isSmall && styles.menuTitleSmall]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={[styles.menuDesc, isSmall && styles.menuDescSmall]} numberOfLines={2}>
                      {item.desc}
                    </Text>
                  </View>
                  <Icon name="chevron-forward" size={isSmall ? 16 : 18} color="#94A3B8" />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Section 4: Actions */}
          <View style={styles.sectionContainer}>
            <View style={[styles.cardContainer, isSmall && styles.cardContainerSmall]}>
              <TouchableOpacity
                style={[styles.menuRow, isSmall && styles.menuRowSmall]}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.iconBadge,
                    isSmall && styles.iconBadgeSmall,
                    { backgroundColor: '#FEE2E2' },
                  ]}
                >
                  <Icon name="log-out-outline" size={isSmall ? 18 : 20} color="#EF4444" />
                </View>
                <View style={styles.menuTextCol}>
                  <Text style={[styles.menuTitle, isSmall && styles.menuTitleSmall, { color: '#EF4444' }]}>
                    Log Out
                  </Text>
                  <Text style={[styles.menuDesc, isSmall && styles.menuDescSmall]}>
                    Sign out from this device
                  </Text>
                </View>
                <Icon name="chevron-forward" size={isSmall ? 16 : 18} color="#EF4444" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.menuRow, isSmall && styles.menuRowSmall, { borderBottomWidth: 0 }]}
                onPress={handleDeleteAccount}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.iconBadge,
                    isSmall && styles.iconBadgeSmall,
                    { backgroundColor: '#F1F5F9' },
                  ]}
                >
                  <Icon name="trash-outline" size={isSmall ? 16 : 18} color="#64748B" />
                </View>
                <View style={styles.menuTextCol}>
                  <Text style={[styles.menuTitle, isSmall && styles.menuTitleSmall, { color: '#64748B' }]}>
                    Delete Account
                  </Text>
                  <Text style={[styles.menuDesc, isSmall && styles.menuDescSmall]}>
                    Permanently remove personal data
                  </Text>
                </View>
                <Icon name="chevron-forward" size={isSmall ? 16 : 18} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              {
                maxWidth: isTablet ? 480 : Math.min(width - 32, 420),
                paddingBottom: Math.max(20, insets.bottom + 12),
              },
            ]}
          >
            <Text style={[styles.modalTitle, isSmall && styles.modalTitleSmall]}>Delete Account</Text>
            <Text style={[styles.modalSubtitle, isSmall && styles.modalSubtitleSmall]}>
              This action is permanent and cannot be undone. All your personal data, wallet connections, and profile records will be permanently removed.
            </Text>

            <TextInput
              style={[styles.modalInput, isSmall && styles.modalInputSmall]}
              placeholder="Reason for leaving (Optional)..."
              placeholderTextColor="#94A3B8"
              value={deleteReasonText}
              onChangeText={setDeleteReasonText}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, isSmall && styles.modalCancelBtnSmall]}
                onPress={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                <Text style={[styles.modalCancelText, isSmall && styles.modalCancelTextSmall]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalDeleteBtn, isSmall && styles.modalDeleteBtnSmall]}
                onPress={submitDeleteRequest}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={[styles.modalDeleteText, isSmall && styles.modalDeleteTextSmall]}>
                    Confirm Delete
                  </Text>
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
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  backButtonSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerTitleSmall: {
    fontSize: 16,
  },
  headerPlaceholder: {
    width: 40,
  },
  headerPlaceholderSmall: {
    width: 36,
  },
  scrollContent: {
    paddingTop: 16,
  },
  responsiveWrapper: {
    width: '100%',
    alignSelf: 'center',
  },
  sectionContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingLeft: 4,
  },
  sectionTitleSmall: {
    fontSize: 11.5,
    marginBottom: 6,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#64748B',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  cardContainerSmall: {
    borderRadius: 18,
    paddingHorizontal: 12,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuRowSmall: {
    paddingVertical: 10,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconBadgeSmall: {
    width: 34,
    height: 34,
    borderRadius: 11,
    marginRight: 10,
  },
  menuTextCol: {
    flex: 1,
    marginRight: 8,
  },
  menuTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  menuTitleSmall: {
    fontSize: 13.5,
  },
  menuDesc: {
    fontSize: 11.5,
    color: '#64748B',
  },
  menuDescSmall: {
    fontSize: 10.5,
    lineHeight: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  modalTitleSmall: {
    fontSize: 16,
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16,
  },
  modalSubtitleSmall: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    fontSize: 13.5,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    textAlignVertical: 'top',
    minHeight: 76,
    marginBottom: 18,
  },
  modalInputSmall: {
    minHeight: 64,
    fontSize: 12.5,
    padding: 10,
    marginBottom: 14,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 10,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnSmall: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  modalCancelText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#64748B',
  },
  modalCancelTextSmall: {
    fontSize: 12.5,
  },
  modalDeleteBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDeleteBtnSmall: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  modalDeleteText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalDeleteTextSmall: {
    fontSize: 12.5,
  },
});
