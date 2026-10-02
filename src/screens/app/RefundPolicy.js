import React from 'react';
import { View,
  Text,
  StyleSheet,
  ScrollView,
  
  TouchableOpacity,
  View as ScreenBackgroundView,
  StatusBar as ScreenBackgroundStatusBar,
  StyleSheet as ScreenBackgroundStyleSheet
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ScreenBackgroundGradient from 'react-native-linear-gradient';
import { useTranslation } from 'react-i18next';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';

const RefundPolicy = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 24);

  return (
    <ScreenBackgroundView style={[{ flex: 1, backgroundColor: '#F8FAFC' }]}>
      <ScreenBackgroundStatusBar translucent backgroundColor="transparent" barStyle="dark-content" animated />
      <ScreenBackgroundGradient colors={['#F8FAFC', '#F1F5F9', '#E2E8F0']} style={ScreenBackgroundStyleSheet.absoluteFillObject} />
        <View style={[styles.header, { paddingTop: topSafeInset + 8 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={28} color="#1E293B" />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={[styles.scrollContainer, { paddingBottom: bottomPadding }]} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>{t('settings.refund')}</Text>
          <Text style={styles.content}>
            {t('refund_policy.content')}
          </Text>
        </ScrollView>
    </ScreenBackgroundView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  backButton: {
    padding: 5,
  },
  scrollContainer: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 30,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    color: '#0F172A',
    textAlign: 'justify',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 10,
  },
});

export default RefundPolicy;
