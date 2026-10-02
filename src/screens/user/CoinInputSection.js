import React, { useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AlertService } from '../../utils/AlertService';

const CoinInputSection = ({
  withdrawalCoin,
  setWithdrawalCoin,
  calculatedINR,
  setCalculatedINR,
  activeTab,
  setActiveTab,
  user,
}) => {
  const coinInputRef = useRef(null);
  const { t } = useTranslation();

  // ✅ Sanitize input to allow only numbers & single decimal
  const handleCoinInput = (text) => {
    let cleanText = text.replace(/[^0-9.]/g, '');
    const parts = cleanText.split('.');
    if (parts.length > 2) cleanText = parts[0] + '.' + parts[1];
    setWithdrawalCoin(cleanText);
  };

  // ✅ Keep keyboard open after pressing calculate
  const calculateINR = () => {
    const coins = parseFloat(withdrawalCoin);
    if (isNaN(coins) || coins <= 0) {
      setCalculatedINR('');
      AlertService.show(t('withdrawal.invalid_input') || 'Invalid Input', t('withdrawal.invalid_amount') || 'Please enter a valid amount of beans.', 'error');
      return;
    }
    if (coins > user.coins) {
      AlertService.show(
        t('withdrawal.insufficient_balance') || 'Insufficient Balance',
        t('withdrawal.exceeds_balance') || 'Withdrawal amount exceeds your bean balance.',
        'error'
      );
      return;
    }

    const inr = coins / 20;
    setCalculatedINR(inr.toFixed(2));

    // 👇 Re-focus the input so keyboard stays open
    setTimeout(() => coinInputRef.current?.focus(), 100);
  };

  return (
    <>
      {/* 🫘 Beans Input with Calculate Button */}
      <View style={{ marginBottom: 20, position: 'relative' }}>
        <TextInput
          ref={coinInputRef}
          style={{
            height: 50,
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: 8,
            paddingHorizontal: 15,
            fontSize: 16,
            color: '#fff',
            paddingRight: 100, // leave space for button
          }}
          placeholder={t('withdrawal.input_coin') || 'Input Withdrawal Beans'}
          placeholderTextColor="#a0a0a0"
          value={withdrawalCoin}
          onChangeText={handleCoinInput}
          keyboardType="decimal-pad"
          blurOnSubmit={false}
          returnKeyType="done"
        />

        <TouchableOpacity
          style={{
            position: 'absolute',
            right: 5,
            top: 5,
            height: 40,
            backgroundColor: '#3498db',
            borderRadius: 8,
            paddingHorizontal: 15,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={calculateINR}
          activeOpacity={0.8}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>{t('withdrawal.set') || 'Set'}</Text>
        </TouchableOpacity>
      </View>

      {/* 💸 INR Display */}
      <View
        style={{
          height: 50,
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: 8,
          paddingHorizontal: 15,
          justifyContent: 'center',
          marginBottom: 20,
        }}
      >
        <Text style={{ color: '#21d6ff', fontWeight: '600', fontSize: 18 }}>
          {calculatedINR ? `INR ₹ ${calculatedINR}` : 'INR'}
        </Text>
      </View>

      {/* 🏦 Bank / 💸 UPI Buttons Row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: activeTab === 'Bank' ? '#4caf50' : '#2c3e50',
            paddingVertical: 15,
            borderRadius: 8,
            alignItems: 'center',
          }}
          onPress={() => setActiveTab('Bank')}
        >
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>
            🏦 {t('withdrawal.bank_account') || 'Bank Account'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: activeTab === 'UPI' ? '#3498db' : '#2c3e50',
            paddingVertical: 15,
            borderRadius: 8,
            alignItems: 'center',
          }}
          onPress={() => setActiveTab('UPI')}
        >
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>
            💸 {t('withdrawal.upi') || 'UPI'}
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

export default CoinInputSection;
