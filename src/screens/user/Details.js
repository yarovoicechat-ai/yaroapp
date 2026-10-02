import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Clipboard,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { AlertService } from '../../utils/AlertService';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';

export default function Details() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 24);

  const tx = route.params?.transaction || route.params?.item || {
    id: route.params?.transactionId || 'TXN-' + Math.floor(10000000 + Math.random() * 90000000),
    title: 'Diamond Recharge',
    type: 'Diamonds',
    amount: '₹299',
    diamonds: 2800,
    status: 'Completed',
    date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    paymentMethod: 'Google Play Billing',
    orderId: 'GPA.' + Math.floor(1000 + Math.random() * 9000) + '-' + Math.floor(1000 + Math.random() * 9000) + '-' + Math.floor(10000 + Math.random() * 90000),
  };

  const handleCopy = (text, label) => {
    Clipboard.setString(text);
    AlertService.show('Copied', `${label} copied to clipboard!`, 'success');
  };

  const isSuccess = (tx.status || 'Completed').toLowerCase() === 'completed' || (tx.status || '').toLowerCase() === 'success';

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topSafeInset + 6 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="chevron-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction Details</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('HelpAndSupport')}
          style={styles.helpBtn}
        >
          <Icon name="help-circle-outline" size={22} color="#64748B" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}>
        {/* Receipt Header Card */}
        <View style={styles.receiptCard}>
          <View style={[styles.statusIconCircle, isSuccess ? styles.statusSuccess : styles.statusPending]}>
            <Icon name={isSuccess ? 'checkmark' : 'time'} size={36} color="#FFFFFF" />
          </View>

          <Text style={styles.statusText}>{tx.status || 'Transaction Successful'}</Text>
          <Text style={styles.amountDisplay}>{tx.amount || `${tx.diamonds || tx.coins} Units`}</Text>
          <Text style={styles.titleText}>{tx.title || 'Wallet Transaction'}</Text>

          <View style={styles.dashedDivider} />

          {/* Key-Value Breakdown */}
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Transaction ID</Text>
            <TouchableOpacity
              style={styles.copyableValueRow}
              onPress={() => handleCopy(tx.id || tx.orderId, 'Transaction ID')}
            >
              <Text style={styles.detailVal} numberOfLines={1}>{tx.id || tx.orderId}</Text>
              <Icon name="copy-outline" size={14} color="#7C3AED" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>

          {tx.orderId && (
            <View style={styles.detailRow}>
              <Text style={styles.detailKey}>Order Reference</Text>
              <TouchableOpacity
                style={styles.copyableValueRow}
                onPress={() => handleCopy(tx.orderId, 'Order Reference')}
              >
                <Text style={styles.detailVal} numberOfLines={1}>{tx.orderId}</Text>
                <Icon name="copy-outline" size={14} color="#7C3AED" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Payment Method</Text>
            <Text style={styles.detailVal}>{tx.paymentMethod || 'Google Play Store'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Date & Time</Text>
            <Text style={styles.detailVal}>{tx.date || 'Today'}</Text>
          </View>

          {tx.diamonds && (
            <View style={styles.detailRow}>
              <Text style={styles.detailKey}>Diamonds Credited</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Icon name="diamond" size={13} color="#06B6D4" style={{ marginRight: 4 }} />
                <Text style={[styles.detailVal, { color: '#0D9488', fontWeight: '700' }]}>
                  +{Number(tx.diamonds).toLocaleString()}
                </Text>
              </View>
            </View>
          )}

          {tx.coins && (
            <View style={styles.detailRow}>
              <Text style={styles.detailKey}>Beans</Text>
              <Text style={[styles.detailVal, { color: '#059669', fontWeight: '700' }]}>
                {Number(tx.coins).toLocaleString()}
              </Text>
            </View>
          )}
        </View>

        {/* Security Assurance Card */}
        <View style={styles.securityCard}>
          <Icon name="shield-checkmark-outline" size={20} color="#10B981" />
          <Text style={styles.securityText}>
            Secured by Google Play Billing & YaroApp Financial Protection. All transactions are logged and verified.
          </Text>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={['#7C3AED', '#6D28D9']}
            style={styles.doneGradient}
          >
            <Text style={styles.doneBtnText}>Back to Wallet</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  helpBtn: {
    padding: 4,
  },
  content: {
    padding: 16,
  },
  receiptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    marginBottom: 16,
  },
  statusIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    elevation: 4,
  },
  statusSuccess: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
  },
  statusPending: {
    backgroundColor: '#F59E0B',
    shadowColor: '#F59E0B',
  },
  statusText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  amountDisplay: {
    fontSize: 28,
    fontWeight: '800',
    color: '#7C3AED',
    marginVertical: 6,
  },
  titleText: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },
  dashedDivider: {
    width: '100%',
    height: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 9,
  },
  detailKey: {
    fontSize: 13,
    color: '#64748B',
  },
  detailVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    maxWidth: 180,
  },
  copyableValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  securityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    marginBottom: 24,
    gap: 10,
  },
  securityText: {
    flex: 1,
    fontSize: 12,
    color: '#15803D',
    lineHeight: 16,
  },
  doneBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#7C3AED',
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  doneGradient: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
