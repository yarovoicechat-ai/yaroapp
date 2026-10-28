import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { apiUtil } from '../utils/apiUtil';

// Separate from historical Beans. Never combine balances with different conversion versions.
export default function EconomyEarnings() {
  const navigation = useNavigation();
  const [buckets, setBuckets] = useState([]);
  useFocusEffect(useCallback(() => {
    let alive = true;
    apiUtil.get('/economy/wallet').then(res => {
      if (alive) setBuckets(res.data?.data?.buckets || []);
    }).catch(() => {});
    return () => { alive = false; };
  }, []));
  if (!buckets.length) return null;
  return <View style={{ padding: 16, marginBottom: 16, borderRadius: 16, backgroundColor: '#ECFDF5' }}>
    <Text style={{ color: '#065F46', fontWeight: '700', marginBottom: 8 }}>New economy earnings</Text>
    {buckets.map(bucket => <View key={bucket.version} style={{ marginBottom: 12 }}>
      <Text style={{ color: '#065F46' }}>{bucket.earnedBeans.toLocaleString()} earned Beans · {bucket.version}</Text>
      <Text style={{ color: '#065F46' }}>{bucket.beansPerInr} Beans per INR. Historical Beans keep their original rate.</Text>
      {bucket.earnedBeans > 0 && <TouchableOpacity accessibilityRole="button" onPress={() => navigation.navigate('Withdrawal', { economyBucket: bucket })}>
        <Text style={{ color: '#4F46E5', paddingVertical: 8 }}>Withdraw these earned Beans</Text>
      </TouchableOpacity>}
    </View>)}
  </View>;
}
