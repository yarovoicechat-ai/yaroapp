import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
export default function LevelHelp({ navigation }) {
  const insets = useSafeAreaInsets();
  return <ScrollView style={styles.screen} contentContainerStyle={{ padding: 24, paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }}>
    <TouchableOpacity accessibilityLabel="Go back" onPress={() => navigation.goBack()}><Icon name="chevron-back" size={28} color="#0F172A" /></TouchableOpacity>
    <Text style={styles.title}>Levels & Rewards</Text>
    <Text style={styles.text}>View your current level, progress and available rewards on the Levels screen. Rewards depend on the active rules shown in the app.</Text>
    {[
      ['Gift activity', 'Eligible gift activity contributes to wealth and charm progress under the active reward rules.'],
      ['Live & Party', 'Create a video live room from the centre tab, or join a Party room from the second tab.'],
      ['Your activity', 'See your recent broadcasts and their status in Live Activity.'],
      ['Reward details', 'Open a reward to check its requirements, duration and availability before claiming.'],
    ].map(([title, text]) => <View key={title} style={styles.card}><Text style={styles.heading}>{title}</Text><Text style={styles.text}>{text}</Text></View>)}
  </ScrollView>;
}
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: '#FFF' }, title: { color: '#0F172A', fontSize: 28, fontWeight: '800', marginTop: 24 }, text: { color: '#64748B', lineHeight: 23, marginTop: 12 }, card: { borderColor: '#E2E8F0', borderWidth: 1, borderRadius: 20, padding: 20, marginTop: 20 }, heading: { color: '#0F172A', fontWeight: '800', fontSize: 18 } });
