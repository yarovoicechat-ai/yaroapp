import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';

const takeMicCardImg = require('../../assets/card/take_mic_card.png');

export default function RewardAssistantScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 16);

  const handleOpenDetails = () => {
    navigation.navigate('AllRewardsScreen');
  };

  const handleUserGuide = () => {
    Alert.alert(
      'Reward Assistant Guide',
      'Here you receive official gift expiry reminders, milestone rewards, and daily login bonus notifications. Tap "View details" on any reward to see your unlocked goods and diamonds/coins balances.'
    );
  };

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
        <Text style={styles.headerTitle}>Reward Assistant</Text>
        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.timestampCenter}>Mon 11:31 PM</Text>
        <Text style={styles.backpackNotice}>
          Gifts in your backpack are about to expire, please use them as soon as possible.
        </Text>
        <Text style={styles.timestampCenter}>Yesterday 2:35 AM</Text>

        {/* Card 1: Take-mic Card */}
        <View style={styles.rewardCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeaderTitle}>Rewards Overview</Text>
            <TouchableOpacity onPress={handleOpenDetails} activeOpacity={0.7}>
              <Text style={styles.viewDetailsText}>View details &gt;</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.itemContainer}>
            <View style={styles.itemBox}>
              <Image source={takeMicCardImg} style={styles.cardImg} resizeMode="contain" />
            </View>
          </View>
        </View>

        {/* Card 2: Diamonds 6 */}
        <View style={styles.rewardCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeaderTitle}>Rewards Overview</Text>
            <TouchableOpacity onPress={handleOpenDetails} activeOpacity={0.7}>
              <Text style={styles.viewDetailsText}>View details &gt;</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.itemContainerRow}>
            <Text style={styles.diamondPill}>💎 6</Text>
          </View>
        </View>

        {/* Card 3: Shake/Drink Gift */}
        <View style={styles.rewardCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeaderTitle}>Rewards Overview</Text>
            <TouchableOpacity onPress={handleOpenDetails} activeOpacity={0.7}>
              <Text style={styles.viewDetailsText}>View details &gt;</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.itemContainer}>
            <View style={styles.itemBox}>
              <Text style={styles.bigEmoji}>🧋</Text>
            </View>
          </View>
        </View>

        {/* Card 4: Sundae Gift */}
        <View style={styles.rewardCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeaderTitle}>Rewards Overview</Text>
            <TouchableOpacity onPress={handleOpenDetails} activeOpacity={0.7}>
              <Text style={styles.viewDetailsText}>View details &gt;</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.itemContainer}>
            <View style={styles.itemBox}>
              <Text style={styles.bigEmoji}>🍧</Text>
            </View>
          </View>
        </View>

        <Text style={styles.timestampCenter}>Yesterday 2:54 AM</Text>

        {/* Card 5: Diamond 1, Coin 10 */}
        <View style={styles.rewardCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeaderTitle}>Rewards Overview</Text>
            <TouchableOpacity onPress={handleOpenDetails} activeOpacity={0.7}>
              <Text style={styles.viewDetailsText}>View details &gt;</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.itemContainerRow}>
            <Text style={styles.currencyRowText}>💎 1   🪙 10</Text>
          </View>
        </View>

        <Text style={styles.timestampCenter}>Yesterday 3:00 AM</Text>

        {/* Card 6: Diamond 1, Coin 10 */}
        <View style={styles.rewardCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeaderTitle}>Rewards Overview</Text>
            <TouchableOpacity onPress={handleOpenDetails} activeOpacity={0.7}>
              <Text style={styles.viewDetailsText}>View details &gt;</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.itemContainerRow}>
            <Text style={styles.currencyRowText}>💎 1   🪙 10</Text>
          </View>
        </View>

        <Text style={styles.timestampCenter}>Yesterday 11:30 PM</Text>
        <Text style={styles.backpackNotice}>
          Gifts in your backpack are about to expire, please use them as soon as possible.
        </Text>
        <Text style={styles.timestampCenter}>5:16 AM</Text>

        {/* Card 7: Take-mic Card */}
        <View style={styles.rewardCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeaderTitle}>Rewards Overview</Text>
            <TouchableOpacity onPress={handleOpenDetails} activeOpacity={0.7}>
              <Text style={styles.viewDetailsText}>View details &gt;</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.itemContainer}>
            <View style={styles.itemBox}>
              <Image source={takeMicCardImg} style={styles.cardImg} resizeMode="contain" />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky User guide Button */}
      <View style={[styles.bottomBar, { paddingBottom: bottomPadding }]}>
        <TouchableOpacity
          style={styles.guideBtn}
          onPress={handleUserGuide}
          activeOpacity={0.85}
        >
          <Text style={styles.guideBtnText}>User guide</Text>
        </TouchableOpacity>
      </View>
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
  backpackNotice: {
    textAlign: 'center',
    fontSize: 12,
    color: '#94A3B8',
    paddingHorizontal: 24,
    lineHeight: 18,
  },
  rewardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  viewDetailsText: {
    fontSize: 13,
    color: '#64748B',
  },
  itemContainer: {
    alignItems: 'flex-start',
    paddingVertical: 6,
  },
  itemContainerRow: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemBox: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImg: {
    width: 54,
    height: 54,
  },
  bigEmoji: {
    fontSize: 36,
  },
  diamondPill: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  currencyRowText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingTop: 12,
    paddingHorizontal: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
  },
  guideBtn: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  guideBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
