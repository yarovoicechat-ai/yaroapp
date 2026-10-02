import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import DeviceInfo from 'react-native-device-info';
import LinearGradient from 'react-native-linear-gradient';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';

export default function AboutUs() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const isSmall = width < 360;
  const isTablet = width >= 600;
  const isLandscape = width > height;
  const contentMaxWidth = isTablet ? 600 : '100%';

  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 28);

  const [licenseModalVisible, setLicenseModalVisible] = useState(false);

  const aboutLinks = [
    {
      id: 'terms',
      title: 'Terms of Service',
      desc: 'User agreements & terms of use',
      icon: 'document-text-outline',
      iconColor: '#7C3AED',
      iconBg: '#F3E8FF',
      onPress: () => navigation.navigate('TermOfUse'),
    },
    {
      id: 'privacy',
      title: 'Privacy Policy',
      desc: 'How we respect & handle your data',
      icon: 'shield-checkmark-outline',
      iconColor: '#059669',
      iconBg: '#ECFDF5',
      onPress: () => navigation.navigate('PrivacyPolicy'),
    },
    {
      id: 'licenses',
      title: 'Open Source Licenses',
      desc: 'Third-party open source attributions',
      icon: 'code-slash-outline',
      iconColor: '#2563EB',
      iconBg: '#EFF6FF',
      onPress: () => setLicenseModalVisible(true),
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
        <Text style={[styles.headerTitle, isSmall && styles.headerTitleSmall]}>About Yaro</Text>
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
          {/* Brand Banner Section */}
          <LinearGradient
            colors={['#7C3AED', '#4F46E5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.brandCard,
              isSmall && styles.brandCardSmall,
              isTablet && styles.brandCardTablet,
            ]}
          >
            <View style={styles.logoRow}>
              <Text style={[styles.logoText, isSmall && styles.logoTextSmall, isTablet && styles.logoTextTablet]}>
                Yaro
              </Text>
              <Text style={[styles.heartIcon, isSmall && styles.heartIconSmall, isTablet && styles.heartIconTablet]}>
                ❤️
              </Text>
            </View>
            <Text style={[styles.tagline, isSmall && styles.taglineSmall]}>
              Voice • Video • Live • Club
            </Text>
            <View style={styles.versionBadge}>
              <Text style={[styles.versionText, isSmall && styles.versionTextSmall]}>
                Version {DeviceInfo.getVersion() || '0.0.2'}
              </Text>
            </View>

            <Text style={[styles.communityDesc, isSmall && styles.communityDescSmall]}>
              A safe, authentic community where friends connect and celebrate memorable moments together.
            </Text>

            <View style={styles.quoteBox}>
              <Text style={[styles.quoteText, isSmall && styles.quoteTextSmall]}>
                Good Friends, Better Moments ❤️
              </Text>
            </View>
          </LinearGradient>

          {/* Links Card */}
          <View style={[styles.cardContainer, isSmall && styles.cardContainerSmall]}>
            <Text style={[styles.sectionTitle, isSmall && styles.sectionTitleSmall]}>
              Legal & Transparency
            </Text>

            {aboutLinks.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.menuRow,
                  isSmall && styles.menuRowSmall,
                  index === aboutLinks.length - 1 && { borderBottomWidth: 0 },
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

          <View style={styles.footerContainer}>
            <Text style={[styles.footerText, isSmall && styles.footerTextSmall]}>
              © 2026 Yaro Club. All rights reserved.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Licenses Modal */}
      <Modal
        visible={licenseModalVisible}
        transparent
        animationType={isTablet ? 'fade' : 'slide'}
        onRequestClose={() => setLicenseModalVisible(false)}
      >
        <View style={[styles.modalOverlay, isTablet && styles.modalOverlayTablet]}>
          <View
            style={[
              styles.modalContent,
              isTablet && styles.modalContentTablet,
              {
                paddingBottom: isTablet ? 20 : Math.max(20, insets.bottom + 12),
                maxHeight: isLandscape ? height * 0.85 : isTablet ? 600 : '75%',
              },
            ]}
          >
            {!isTablet && <View style={styles.modalHandleBar} />}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isSmall && styles.modalTitleSmall]}>
                Open Source Licenses
              </Text>
              <TouchableOpacity
                onPress={() => setLicenseModalVisible(false)}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon name="close" size={20} color="#0F172A" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.licenseCard}>
                <Text style={styles.licenseItemTitle}>React Native</Text>
                <Text style={styles.licenseItemText}>MIT License - Copyright (c) Meta Platforms, Inc.</Text>
              </View>

              <View style={styles.licenseCard}>
                <Text style={styles.licenseItemTitle}>React Navigation</Text>
                <Text style={styles.licenseItemText}>MIT License - Copyright (c) React Navigation Contributors</Text>
              </View>

              <View style={styles.licenseCard}>
                <Text style={styles.licenseItemTitle}>React Native Vector Icons</Text>
                <Text style={styles.licenseItemText}>MIT License - Copyright (c) Joel Arvidsson</Text>
              </View>

              <View style={styles.licenseCard}>
                <Text style={styles.licenseItemTitle}>Agora RTC SDK</Text>
                <Text style={styles.licenseItemText}>Commercial License - Copyright (c) Agora.io</Text>
              </View>

              <View style={styles.licenseCard}>
                <Text style={styles.licenseItemTitle}>Socket.io Client</Text>
                <Text style={styles.licenseItemText}>MIT License - Copyright (c) Automattic</Text>
              </View>
            </ScrollView>
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
  brandCard: {
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 18,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  brandCardSmall: {
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  brandCardTablet: {
    borderRadius: 28,
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  logoTextSmall: {
    fontSize: 28,
  },
  logoTextTablet: {
    fontSize: 42,
  },
  heartIcon: {
    fontSize: 26,
    marginLeft: 6,
    marginTop: -4,
  },
  heartIconSmall: {
    fontSize: 20,
    marginLeft: 4,
  },
  heartIconTablet: {
    fontSize: 30,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  taglineSmall: {
    fontSize: 11.5,
    marginBottom: 8,
  },
  versionBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 14,
  },
  versionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  versionTextSmall: {
    fontSize: 11,
  },
  communityDesc: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    paddingHorizontal: 14,
    lineHeight: 19,
    marginBottom: 16,
  },
  communityDescSmall: {
    fontSize: 11.5,
    lineHeight: 17,
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  quoteBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  quoteText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    fontStyle: 'italic',
  },
  quoteTextSmall: {
    fontSize: 11.5,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#64748B',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  cardContainerSmall: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  sectionTitleSmall: {
    fontSize: 13.5,
    marginBottom: 8,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuRowSmall: {
    paddingVertical: 10,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconBadgeSmall: {
    width: 36,
    height: 36,
    borderRadius: 12,
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
  footerContainer: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  footerTextSmall: {
    fontSize: 11,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalOverlayTablet: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    width: '100%',
  },
  modalContentTablet: {
    maxWidth: 540,
    borderRadius: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 18,
  },
  modalHandleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalTitleSmall: {
    fontSize: 15,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    paddingVertical: 4,
  },
  licenseCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  licenseItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  licenseItemText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },
});
