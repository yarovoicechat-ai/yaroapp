import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ARFilterPanel from '../components/ARFilterPanel';
export default function ARFilterStudio({ navigation }: { navigation: any }) {
  const insets = useSafeAreaInsets();
  // Catalog-only entry. The existing Live Start screen remains the sole camera studio.
  return (
    <View
      style={[
        s.screen,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 },
      ]}
    >
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={s.back}>‹ Back</Text>
      </TouchableOpacity>
      <Text style={s.title}>Made for your moments</Text>
      <Text style={s.copy}>
        Explore 50 original Yaro effect definitions. Open the live camera to
        preview available effects. Pending assets are clearly marked.
      </Text>
      <View style={s.space} />
      <ARFilterPanel initialTab="Effects" />
      <TouchableOpacity
        style={s.button}
        onPress={() =>
          navigation.navigate('MainTabs', {
            screen: 'CreateLive',
            params: { arTab: 'Effects' },
          })
        }
      >
        <Text style={s.buttonText}>Open live camera</Text>
      </TouchableOpacity>
    </View>
  );
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0F0919', paddingHorizontal: 16 },
  back: { color: '#E7D2A4', fontSize: 15 },
  title: { color: '#fff', fontSize: 29, fontWeight: '700', marginTop: 30 },
  copy: { color: '#BBAACB', fontSize: 14, lineHeight: 23, marginTop: 12 },
  space: { flex: 1, minHeight: 20 },
  button: {
    backgroundColor: '#F1CA76',
    borderRadius: 24,
    padding: 15,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: { color: '#372841', fontWeight: '700' },
});
