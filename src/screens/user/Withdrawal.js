import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  Dimensions,
  StatusBar as ScreenBackgroundStatusBar,
  StyleSheet as ScreenBackgroundStyleSheet
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';
import { AuthContext } from '../../context/AuthProvider';
import { apiUtil, apiPublic } from '../../utils/apiUtil';
import { useTranslation } from 'react-i18next';
import AnimatedTitleLine from '../../components/AnimatedTitleLine';
import { AlertService } from '../../utils/AlertService';

const { width } = Dimensions.get('window');
const COIN_TO_INR_RATIO = 20;
const MIN_WITHDRAWAL_INR = 200;
const DEFAULT_PLATFORM_FEE_PERCENT = 5;
const money = value => (Math.round(Number(value) * 100) / 100).toFixed(2);

const Withdrawal = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 42);
  const { user, fetchUserProfile } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [platformFeePercent, setPlatformFeePercent] = useState(DEFAULT_PLATFORM_FEE_PERCENT);
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState('bank');
  const [withdrawalAmount, setWithdrawalAmount] = useState(''); // Amount in COINS
  const [calculatedINR, setCalculatedINR] = useState(0);

  const [bankDetails, setBankDetails] = useState({
    bankName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    receiverName: ''
  });
  const [upiId, setUpiId] = useState('');

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  useEffect(() => {
    apiPublic.get('/public/settings')
      .then(res => {
        const fee = Number(res.data?.data?.withdrawalPlatformFeePercent);
        if (Number.isFinite(fee)) setPlatformFeePercent(fee);
      })
      .catch(() => {});
  }, []);

  // Update INR when coins change
  useEffect(() => {
    const coins = parseFloat(withdrawalAmount) || 0;
    setCalculatedINR((coins / COIN_TO_INR_RATIO).toFixed(2));
  }, [withdrawalAmount]);

  const handleInputChange = (field, value) => {
    setBankDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const submitWithdrawal = async grossAmount => {
    setLoading(true);
    try {
      const payload = {
        amount: grossAmount,
        method: activeTab === 'bank' ? 'bank' : 'upi',
        details: activeTab === 'bank' ? {
          bankName: bankDetails.bankName,
          accountNumber: bankDetails.accountNumber,
          ifscCode: bankDetails.ifscCode,
          accountHolderName: bankDetails.receiverName,
        } : { upiId },
      };

      const res = await apiUtil.post('/withdrawal/request', payload);
      if (res.data.success) {
        const result = res.data.data;
        AlertService.show(
          t('withdrawal.success') || 'Withdrawal submitted',
          result ? `Platform fee: \u20B9${money(result.platformFee)}\nYou will receive: \u20B9${money(result.netAmount)}` : (t('withdrawal.submitted') || 'Withdrawal request submitted successfully!'),
          'success',
        );
        setWithdrawalAmount('');
        setBankDetails({ bankName: '', accountNumber: '', confirmAccountNumber: '', ifscCode: '', receiverName: '' });
        setUpiId('');
        fetchUserProfile();
        navigation.goBack();
      }
    } catch (err) {
      AlertService.show(t('recharge.error') || 'Error', err.response?.data?.message || t('withdrawal.failed') || 'Withdrawal failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = () => {
    const coins = parseFloat(withdrawalAmount);
    const grossAmount = parseFloat(calculatedINR);

    if (!withdrawalAmount || grossAmount < MIN_WITHDRAWAL_INR) {
      AlertService.show(t('recharge.error') || 'Error', `${t('withdrawal.min_withdrawal') || 'Minimum withdrawal is ₹'}${MIN_WITHDRAWAL_INR} (${Math.ceil(MIN_WITHDRAWAL_INR * COIN_TO_INR_RATIO)} coins).`, 'error');
      return;
    }
    if (coins > (user?.coins || 0)) {
      AlertService.show(t('recharge.error') || 'Error', t('withdrawal.insufficient_balance') || 'Insufficient coins', 'error');
      return;
    }
    if (activeTab === 'bank') {
      if (!bankDetails.bankName || !bankDetails.accountNumber || !bankDetails.ifscCode || !bankDetails.receiverName) {
        AlertService.show(t('recharge.error') || 'Error', t('withdrawal.fill_bank') || 'Please fill all bank details', 'error');
        return;
      }
      if (bankDetails.accountNumber !== bankDetails.confirmAccountNumber) {
        AlertService.show(t('recharge.error') || 'Error', t('withdrawal.mismatch_account') || 'Account numbers do not match', 'error');
        return;
      }
    } else if (!upiId) {
      AlertService.show(t('recharge.error') || 'Error', t('withdrawal.enter_upi_id') || 'Please enter UPI ID', 'error');
      return;
    }

    const platformFee = Math.round(grossAmount * platformFeePercent) / 100;
    const netAmount = Math.round((grossAmount - platformFee) * 100) / 100;
    AlertService.show(
      'Confirm Withdrawal',
      `Withdrawal amount: \u20B9${money(grossAmount)}\nPlatform fee (${platformFeePercent}%): -\u20B9${money(platformFee)}\nYou will receive: \u20B9${money(netAmount)}\nCoins deducted: ${Math.ceil(grossAmount * COIN_TO_INR_RATIO)}`,
      'info',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => submitWithdrawal(grossAmount) },
      ],
    );
  };

  const handleVerifyUpi = () => {
    navigation.navigate('UPIVerify', {
      initialUpi: upiId,
      onVerify: (verifiedUpi) => {
        setUpiId(verifiedUpi);
      }
    });
  };

  const renderBankAccountForm = () => (
    <View style={styles.formContainer}>
      <View style={styles.inputWrapper}>
        <Icon name="account-balance" size={20} color="#03dcfe" style={styles.inputIcon} />
        <TextInput
          style={styles.formInput}
          placeholder={t('withdrawal.bank_name') || 'Bank Name'}
          placeholderTextColor="#aaa"
          value={bankDetails.bankName}
          onChangeText={(text) => handleInputChange('bankName', text)}
        />
      </View>

      <View style={styles.inputWrapper}>
        <Icon name="payment" size={20} color="#03dcfe" style={styles.inputIcon} />
        <TextInput
          style={styles.formInput}
          placeholder={t('withdrawal.account_number') || 'Account Number'}
          placeholderTextColor="#aaa"
          keyboardType="numeric"
          value={bankDetails.accountNumber}
          onChangeText={(text) => handleInputChange('accountNumber', text)}
        />
      </View>

      <View style={styles.inputWrapper}>
        <Icon name="gpp-good" size={20} color="#03dcfe" style={styles.inputIcon} />
        <TextInput
          style={styles.formInput}
          placeholder={t('withdrawal.confirm_account') || 'Confirm Account Number'}
          placeholderTextColor="#aaa"
          keyboardType="numeric"
          value={bankDetails.confirmAccountNumber}
          onChangeText={(text) => handleInputChange('confirmAccountNumber', text)}
        />
      </View>

      <View style={styles.inputWrapper}>
        <Icon name="code" size={20} color="#03dcfe" style={styles.inputIcon} />
        <TextInput
          style={styles.formInput}
          placeholder={t('withdrawal.ifsc_code') || 'IFSC CODE'}
          placeholderTextColor="#aaa"
          value={bankDetails.ifscCode}
          onChangeText={(text) => handleInputChange('ifscCode', text)}
          autoCapitalize="characters"
        />
      </View>

      <View style={styles.inputWrapper}>
        <Icon name="person" size={20} color="#03dcfe" style={styles.inputIcon} />
        <TextInput
          style={styles.formInput}
          placeholder={t('withdrawal.receiver_name') || 'Receiver Name'}
          placeholderTextColor="#aaa"
          value={bankDetails.receiverName}
          onChangeText={(text) => handleInputChange('receiverName', text)}
        />
      </View>
    </View>
  );

  const renderUPIForm = () => (
    <View style={styles.formContainer}>
      <View style={styles.upiInputWrapper}>
        <Icon name="alternate-email" size={20} color="#03dcfe" style={styles.inputIcon} />
        <TextInput
          style={styles.upiFormInput}
          placeholder={t('withdrawal.enter_upi') || 'Enter UPI ID'}
          placeholderTextColor="#aaa"
          value={upiId}
          onChangeText={setUpiId}
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.verifyBtn} onPress={handleVerifyUpi}>
          <Text style={styles.verifyBtnText}>{upiId ? 'Change' : 'Verify'}</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.savedUpiText}>{t('withdrawal.example_upi') || 'Example: user@upi'}</Text>
    </View>
  );

  return (
    <View style={[{ flex: 1, backgroundColor: '#F8FAFC' }]}>
      <ScreenBackgroundStatusBar translucent backgroundColor="transparent" barStyle="dark-content" animated />
      <LinearGradient colors={['#F8FAFC', '#F1F5F9', '#E2E8F0']} style={ScreenBackgroundStyleSheet.absoluteFillObject} />
      {/* Header */}
      <View style={[styles.header, { paddingTop: topSafeInset + 8 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back-ios" size={20} color="#1E293B" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('withdrawal.title') || 'Withdrawal'}</Text>
        <View style={{ width: 40 }} />
      </View>
      <AnimatedTitleLine />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]} showsVerticalScrollIndicator={false}>
        {/* Total Coins Card */}
        <View style={styles.coinCard}>
          <LinearGradient
            colors={['#1e1b4b', '#31108f']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.coinGradient}
          >
            <View style={styles.coinContent}>
              <View>
                <Text style={styles.totalCoinsText}>{t('home.total_coins') || 'Total Balance'}</Text>
                <Text style={styles.coinAmount}>{user?.coins || 0}</Text>
              </View>
              <View style={styles.coinIconContainer}>
                <Image
                  source={require('../../assets/coin.webp')}
                  style={{ width: 36, height: 36 }}
                  resizeMode="contain"
                />
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Rules & Guidelines */}
        <View style={styles.rulesCard}>
          <View style={styles.rulesHeader}>
            <Icon name="info" size={18} color="#03dcfe" />
            <Text style={styles.rulesTitle}>{t('profile.rules') || 'Withdrawal Rules'}</Text>
          </View>
          <View style={styles.ruleItem}>
            <Icon name="check-circle" size={16} color="#4CD964" style={styles.ruleCheckIcon} />
            <Text style={styles.ruleText}>{COIN_TO_INR_RATIO} Beans = 1 INR</Text>
          </View>
          <View style={styles.ruleItem}>
            <Icon name="check-circle" size={16} color="#4CD964" style={styles.ruleCheckIcon} />
            <Text style={styles.ruleText}>
              {t('withdrawal.min_withdrawal') || 'Minimum withdrawal is ₹'}{MIN_WITHDRAWAL_INR} ({Math.ceil(MIN_WITHDRAWAL_INR * COIN_TO_INR_RATIO)} Beans)
            </Text>
          </View>
        </View>

        {/* KYC Banner */}
        <TouchableOpacity style={styles.kycBanner} onPress={() => navigation.navigate('Kyc')}>
          <View style={styles.kycLeft}>
            <Icon name="verified-user" size={24} color="#fff" />
            <Text style={styles.kycText}>{t('withdrawal.complete_kyc') || 'Complete Your KYC'}</Text>
          </View>
          <View style={styles.kycVerifyBtn}>
            <Text style={styles.kycVerifyText}>{t('withdrawal.verify') || 'Verify'}</Text>
            <Icon name="chevron-right" size={16} color="#fff" />
          </View>
        </TouchableOpacity>

        {/* Withdrawal Amount Input Section */}
        <View style={styles.amountCard}>
          <Text style={styles.cardSectionLabel}>Withdrawal Amount</Text>
          <View style={styles.amountInputRow}>
            <View style={styles.inputWrapper}>
              <Image source={require('../../assets/coin.webp')} style={styles.tinyCoinIcon} />
              <TextInput
                style={styles.coinInput}
                placeholder={t('withdrawal.input_coin') || 'Input Beans'}
                placeholderTextColor="#aaa"
                keyboardType="numeric"
                value={withdrawalAmount}
                onChangeText={setWithdrawalAmount}
              />
            </View>
          </View>

          <View style={styles.conversionBox}>
            <Text style={styles.conversionBoxLabel}>{t('withdrawal.equivalent_amount') || 'Equivalent Payout:'}</Text>
            <Text style={styles.conversionBoxValue}>₹ {calculatedINR}</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'bank' && styles.activeTab]}
            onPress={() => setActiveTab('bank')}
            activeOpacity={0.8}
          >
            <Icon name="account-balance" size={16} color={activeTab === 'bank' ? '#fff' : '#aaa'} style={{ marginRight: 6 }} />
            <Text style={[styles.tabText, activeTab === 'bank' && styles.activeTabText]}>
              {t('withdrawal.bank_account') || 'Bank Account'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'upi' && styles.activeTab]}
            onPress={() => setActiveTab('upi')}
            activeOpacity={0.8}
          >
            <Icon name="send-to-mobile" size={16} color={activeTab === 'upi' ? '#fff' : '#aaa'} style={{ marginRight: 6 }} />
            <Text style={[styles.tabText, activeTab === 'upi' && styles.activeTabText]}>
              {t('withdrawal.upi') || 'UPI'}
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'bank' ? renderBankAccountForm() : renderUPIForm()}

        {/* Withdrawal Submit Button */}
        <TouchableOpacity
          style={styles.withdrawSubmitBtn}
          onPress={handleWithdraw}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#2911fe', '#03dcfe']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.withdrawSubmitGradient}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Icon name="payment" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.withdrawSubmitText}>{t('withdrawal.withdraw_now') || 'Withdraw Now'}</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    flex: 1,
  },
  content: {
    padding: 20,
  },

  // Coins Card
  coinCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 3,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    marginBottom: 20,
  },
  coinGradient: {
    padding: 24,
  },
  coinContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalCoinsText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  coinAmount: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
  },
  coinIconContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Rules Card
  rulesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  rulesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rulesTitle: {
    color: '#6C5CE7',
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ruleCheckIcon: {
    marginRight: 8,
  },
  ruleText: {
    color: '#475569',
    fontSize: 13.5,
    fontWeight: '600',
  },

  // KYC Banner
  kycBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#6C5CE7',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  kycLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kycText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 12,
  },
  kycVerifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  kycVerifyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginRight: 4,
  },

  // Amount Card
  amountCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  cardSectionLabel: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 12,
  },
  amountInputRow: {
    marginBottom: 16,
  },
  coinInput: {
    flex: 1,
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
    paddingVertical: 12,
  },
  tinyCoinIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  conversionBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  conversionBoxLabel: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  conversionBoxValue: {
    color: '#16A34A',
    fontSize: 18,
    fontWeight: '800',
  },

  // Tabs Container
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 6,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  activeTab: {
    backgroundColor: '#EDE9FE',
  },
  tabText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#6C5CE7',
    fontWeight: '800',
  },

  // Form Container
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 25,
    elevation: 2,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  formInput: {
    flex: 1,
    color: '#0F172A',
    fontSize: 15,
    paddingVertical: 14,
  },

  // UPI Input Form
  upiInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingLeft: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  upiFormInput: {
    flex: 1,
    color: '#0F172A',
    fontSize: 15,
    paddingVertical: 14,
  },
  verifyBtn: {
    backgroundColor: '#03dcfe',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyBtnText: {
    color: '#111',
    fontWeight: '700',
    fontSize: 13,
  },
  savedUpiText: {
    color: '#4CD964',
    fontSize: 12,
    marginTop: 8,
    marginLeft: 4,
    fontWeight: '500',
  },

  // Submit Button
  withdrawSubmitBtn: {
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#2911fe',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  withdrawSubmitGradient: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  withdrawSubmitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default Withdrawal;
