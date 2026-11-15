import React, { useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import BillingService from '../../services/BillingService';

export default function LiveRechargeSheet({ visible, onClose, onContinue, bottomPadding = 0 }) {
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!visible) return undefined;
    let disposed = false;
    setLoading(true);
    BillingService.queryProducts().then(catalog => {
      if (disposed) return;
      const available = Object.values(catalog || {}).filter(product => product.available && product.localizedPrice);
      setProducts(available);
      setSelected(available[0]?.productId || null);
    }).catch(() => { if (!disposed) setProducts([]); })
      .finally(() => { if (!disposed) setLoading(false); });
    return () => { disposed = true; };
  }, [visible]);
  const product = products.find(item => item.productId === selected);
  return <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
    <View style={s.backdrop}>
      <TouchableOpacity style={StyleSheet.absoluteFill} accessibilityLabel="Close recharge" onPress={onClose} />
      <View style={[s.sheet, { paddingBottom: bottomPadding + 14 }]}>
        <LinearGradient colors={['#FF9866', '#FF3B9F', '#C44CFA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.header}>
          <View><Text style={s.title}>Recharge</Text><Text style={s.subtitle}>Make their live a little brighter</Text></View>
          <Text style={s.present}>🎁</Text>
        </LinearGradient>
        <Text style={s.heading}>Choose your coin pack</Text>
        {loading ? <ActivityIndicator color="#EF39AA" style={s.loading} /> :
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.packs}>
            {products.map(item => <TouchableOpacity key={item.productId} accessibilityRole="radio" accessibilityState={{ checked: item.productId === selected }}
              onPress={() => setSelected(item.productId)} style={[s.pack, item.productId === selected && s.selected]}>
              <Text style={s.coin}>🪙</Text><Text style={s.amount}>{Number(item.coins).toLocaleString()}</Text>
              <Text style={s.price}>{item.localizedPrice}</Text>
            </TouchableOpacity>)}
          </ScrollView>}
        {!loading && !products.length && <Text style={s.empty}>Open your wallet to view available recharge options.</Text>}
        <View style={s.reward}><Icon name="gift-outline" size={26} color="#C95723" /><View style={s.rewardCopy}>
          <Text style={s.rewardTitle}>Send a little happiness</Text><Text style={s.rewardText}>Use coins for gifts and support your favourite broadcaster.</Text>
        </View></View>
        <TouchableOpacity onPress={() => onContinue(product?.productId)} style={s.button}>
          <LinearGradient colors={['#FF6CC4', '#F22498']} style={s.buttonFill}>
            <Text style={s.buttonText}>{product ? product.localizedPrice + ' · Continue' : 'Open wallet'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>;
}
const s = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#0007' },
  sheet: { backgroundColor: '#FFF1D4', borderTopLeftRadius: 22, borderTopRightRadius: 22, overflow: 'hidden' },
  header: { padding: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: '#fff', fontWeight: '800', fontSize: 25, fontStyle: 'italic' },
  subtitle: { color: '#FFF7EB', fontSize: 12, marginTop: 5 }, present: { fontSize: 55 },
  heading: { color: '#A74835', fontWeight: '700', fontSize: 16, textAlign: 'center', margin: 18 },
  packs: { paddingHorizontal: 16, gap: 10, paddingBottom: 14 },
  pack: { minWidth: 94, borderRadius: 14, borderWidth: 1, borderColor: '#EDDBB9', backgroundColor: '#FFFAEF', padding: 12, alignItems: 'center', gap: 6 },
  selected: { borderColor: '#F633A3', backgroundColor: '#FFE1EF' }, coin: { fontSize: 25 },
  amount: { fontSize: 14, color: '#AD6B20', fontWeight: '800' }, price: { color: '#BD397C', fontWeight: '700', fontSize: 13 },
  reward: { backgroundColor: '#FFE6B9', margin: 16, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rewardCopy: { flex: 1 }, rewardTitle: { color: '#AA5E27', fontSize: 14, fontWeight: '700' },
  rewardText: { color: '#AB805A', fontSize: 12, lineHeight: 18, marginTop: 5 },
  loading: { padding: 35 }, empty: { color: '#AB805A', marginHorizontal: 24, textAlign: 'center', lineHeight: 20 },
  button: { marginHorizontal: 14, borderRadius: 24, overflow: 'hidden' }, buttonFill: { padding: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
