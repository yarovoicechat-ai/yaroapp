import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';

const takeMicCardImg = require('../../assets/card/take_mic_card.png');

export default function AllRewardsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 16);

  return (
    <View style={[styles.container, { paddingTop: topSafeInset }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Rewards</Text>
        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.timestampCenter}>5:16 AM</Text>

        {/* Goods Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Goods</Text>
          <View style={styles.goodsItemCard}>
            <View style={styles.goodsBadgeBox}>
              <Text style={styles.multiplierText}>x1</Text>
              <Image source={takeMicCardImg} style={styles.goodsImg} resizeMode="contain" />
              <View style={styles.hoursPill}>
                <Text style={styles.hoursPillText}>24 Hours</Text>
              </View>
            </View>
            <Text style={styles.goodsName}>Take-mic Card</Text>
            <Text style={styles.goodsPrice}>💎 30</Text>
          </View>
        </View>

        <Text style={styles.timestampCenter}>Yesterday 2:54 AM</Text>

        {/* Golds Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Golds</Text>
          <View style={styles.goldsCard}>
            <Text style={styles.currencyRowText}>💎 1   🪙 10</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  headerRightSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  timestampCenter: {
    textAlign: 'center',
    fontSize: 12,
    color: '#94A3B8',
    marginVertical: 12,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 16,
  },
  goodsItemCard: {
    width: 100,
    alignItems: 'center',
  },
  goodsBadgeBox: {
    width: 88,
    height: 94,
    borderRadius: 12,
    backgroundColor: '#FFFBEB',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingTop: 8,
  },
  multiplierText: {
    position: 'absolute',
    top: 4,
    right: 6,
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  goodsImg: {
    width: 46,
    height: 46,
    marginBottom: 4,
  },
  hoursPill: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  hoursPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  goodsName: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
  },
  goodsPrice: {
    fontSize: 13,
    color: '#7C3AED',
    fontWeight: 'bold',
    marginTop: 4,
  },
  goldsCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyRowText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
});
