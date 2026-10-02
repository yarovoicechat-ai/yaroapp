import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import ScreenBackgroundGradient from 'react-native-linear-gradient';
import { useTranslation } from 'react-i18next';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';

const ContactUs = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 24);

  const handleEmailPress = () => {
    Linking.openURL('mailto:support@yaroapp.in');
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" animated />
      <ScreenBackgroundGradient
        colors={['#F8FAFC', '#F1F5F9', '#E2E8F0']}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={[styles.header, { paddingTop: topSafeInset + 8 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="chevron-back" size={26} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Us</Text>
        <View style={{ width: 32 }} />
      </View>
      <ScrollView
        contentContainerStyle={[styles.scrollContainer, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentCard}>
          <Text style={styles.title}>{t('contact_us.title') || 'Need Help?'}</Text>
          <Text style={styles.content}>
            {t('contact_us.part1') || 'We are always here to help you! If you have any inquiries, technical questions or feedback, please reach out to us at '}
            <Text style={styles.link} onPress={handleEmailPress}>
              support@yaroapp.in
            </Text>
            {t('contact_us.part2') || '. You can also reach our customer support team directly at '}
            <Text style={styles.link} onPress={handleEmailPress}>
              support@yaroapp.in
            </Text>
            {t('contact_us.part3') || '. We will respond within 24-48 business hours.'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  scrollContainer: {
    padding: 20,
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 18,
  },
  content: {
    fontSize: 15,
    lineHeight: 25,
    color: '#334155',
    textAlign: 'justify',
  },
  link: {
    color: '#7C3AED',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});

export default ContactUs;
