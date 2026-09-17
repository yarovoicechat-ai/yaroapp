import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';

export default function AboutUs() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 24);

  const [licenseModalVisible, setLicenseModalVisible] = useState(false);

  const aboutLinks = [
    {
      id: 'terms',
      title: 'Terms of Service',
      icon: 'document-text-outline',
      onPress: () => navigation.navigate('TermOfUse'),
    },
    {
      id: 'privacy',
      title: 'Privacy Policy',
      icon: 'shield-checkmark-outline',
      onPress: () => navigation.navigate('PrivacyPolicy'),
    },
    {
      id: 'licenses',
      title: 'Open Source Licenses',
      icon: 'code-slash-outline',
      onPress: () => setLicenseModalVisible(true),
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
        <Text style={styles.headerTitle}>About Yaro</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Banner Section */}
        <View style={styles.brandContainer}>
          <View style={styles.logoRow}>
            <Text style={styles.logoText}>Yaro</Text>
            <Text style={styles.heartIcon}>❤️</Text>
          </View>
          <Text style={styles.tagline}>Voice • Video • Live • Club</Text>
          <Text style={styles.versionText}>Version 1.0.0</Text>

          <Text style={styles.communityDesc}>
            A fun and safe community where real people connect.
          </Text>

          <View style={styles.quoteBox}>
            <Text style={styles.quoteText}>Good Friends, Better Moments ❤️</Text>
          </View>
        </View>

        {/* Links Card */}
        <View style={styles.cardContainer}>
          {aboutLinks.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuRow,
                index === aboutLinks.length - 1 && { borderBottomWidth: 0 },
              ]}
              onPress={item.onPress}
              activeOpacity={0.65}
            >
              <View style={styles.menuLeft}>
                <View style={styles.iconBadge}>
                  <Icon name={item.icon} size={19} color="#7C3AED" />
                </View>
                <Text style={styles.menuTitle}>{item.title}</Text>
              </View>
              <Icon name="chevron-forward" size={19} color="#94A3B8" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>© 2026 Yaro Club. All rights reserved.</Text>
        </View>
      </ScrollView>

      {/* Licenses Modal */}
      <Modal visible={licenseModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Open Source Licenses</Text>
              <TouchableOpacity onPress={() => setLicenseModalVisible(false)}>
                <Icon name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.licenseItemTitle}>React Native</Text>
              <Text style={styles.licenseItemText}>MIT License - Copyright (c) Meta Platforms, Inc.</Text>

              <Text style={styles.licenseItemTitle}>React Navigation</Text>
              <Text style={styles.licenseItemText}>MIT License - Copyright (c) React Navigation Contributors</Text>

              <Text style={styles.licenseItemTitle}>React Native Vector Icons</Text>
              <Text style={styles.licenseItemText}>MIT License - Copyright (c) Joel Arvidsson</Text>

              <Text style={styles.licenseItemTitle}>Socket.io Client</Text>
              <Text style={styles.licenseItemText}>MIT License - Copyright (c) Automattic</Text>
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
    paddingTop: 24,
    alignItems: 'center',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 28,
    width: '100%',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  logoText: {
    fontSize: 38,
    fontWeight: '900',
    color: '#7C3AED',
    letterSpacing: -0.5,
  },
  heartIcon: {
    fontSize: 28,
    marginLeft: 4,
    marginTop: -8,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8B5CF6',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  versionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 14,
  },
  communityDesc: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
    marginBottom: 18,
  },
  quoteBox: {
    backgroundColor: '#FAF5FF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  quoteText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
    fontStyle: 'italic',
  },
  cardContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 20,
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
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  footerContainer: {
    paddingVertical: 12,
  },
  footerText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalBody: {
    paddingVertical: 8,
  },
  licenseItemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 10,
    marginBottom: 2,
  },
  licenseItemText: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 10,
  },
});
