import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset } from '../../utils/safeAreaUtils';
import { useNavigation } from '@react-navigation/native';
import { AlertService } from '../../utils/AlertService';

const { width } = Dimensions.get('window');
const GRID_ITEM_WIDTH = (width - 56) / 3;

const MEDALS_DATA = [
  {
    id: 'm1',
    name: 'Rising Star',
    description: 'Awarded to creators who hit the top trending chart in their first month.',
    earnedDate: 'Earned on 04 Jan 2025',
    isOwned: true,
    isEquipped: false,
    rarity: 'Common',
    iconType: 'star_wreath',
    primaryColor: '#D97706',
    secondaryColor: '#F59E0B',
    ribbonColor: '#DC2626',
  },
  {
    id: 'm2',
    name: 'Social Pro',
    description: 'Maintained over 100+ active conversations and voice interactions.',
    earnedDate: 'Earned on 18 Feb 2025',
    isOwned: true,
    isEquipped: false,
    rarity: 'Rare',
    iconType: 'crown_wreath',
    primaryColor: '#EA580C',
    secondaryColor: '#FBBF24',
    ribbonColor: '#9333EA',
  },
  {
    id: 'm3',
    name: 'Chat Lover',
    description: 'Sent more than 10,000 engaging messages in voice parties and private chats.',
    earnedDate: 'Earned on 28 Apr 2025',
    isOwned: true,
    isEquipped: false,
    rarity: 'Epic',
    iconType: 'heart_wings',
    primaryColor: '#DB2777',
    secondaryColor: '#F472B6',
    ribbonColor: '#EC4899',
  },
  {
    id: 'm4',
    name: 'VIP Star',
    description: 'For being a valuable member\nEarned on 12 Aug 2025',
    earnedDate: 'Earned on 12 Aug 2025',
    isOwned: true,
    isEquipped: true,
    rarity: 'Legendary',
    iconType: 'ribbon_star',
    primaryColor: '#F59E0B',
    secondaryColor: '#FCD34D',
    ribbonColor: '#EF4444',
  },
  {
    id: 'm5',
    name: 'Gift Master',
    description: 'Generous soul who has sent over 50,000 diamonds in gifts to favorite hosts.',
    earnedDate: 'Earned on 03 Jul 2025',
    isOwned: true,
    isEquipped: false,
    rarity: 'Epic',
    iconType: 'gift_wings',
    primaryColor: '#E11D48',
    secondaryColor: '#FB7185',
    ribbonColor: '#F43F5E',
  },
  {
    id: 'm6',
    name: 'Voice King',
    description: 'Hosted room audio sessions exceeding 100 total broadcast hours.',
    earnedDate: 'Earned on 15 Aug 2025',
    isOwned: true,
    isEquipped: false,
    rarity: 'Mythic',
    iconType: 'voice_crown',
    primaryColor: '#2563EB',
    secondaryColor: '#60A5FA',
    ribbonColor: '#3B82F6',
  },
  {
    id: 'm7',
    name: 'Active User',
    description: 'Logged into Yaro consecutively for 60 consecutive days.',
    earnedDate: 'Earned on 10 Jun 2025',
    isOwned: true,
    isEquipped: false,
    rarity: 'Common',
    iconType: 'silver_shield',
    primaryColor: '#64748B',
    secondaryColor: '#94A3B8',
    ribbonColor: '#475569',
  },
  {
    id: 'm8',
    name: 'Popular',
    description: 'Received over 5,000 room likes and profile visitors in a single week.',
    earnedDate: 'Earned on 01 Sep 2025',
    isOwned: true,
    isEquipped: false,
    rarity: 'Rare',
    iconType: 'purple_orb',
    primaryColor: '#7C3AED',
    secondaryColor: '#A78BFA',
    ribbonColor: '#8B5CF6',
  },
  {
    id: 'm9',
    name: 'Elite Member',
    description: 'Privileged member of the elite council with verified community standing.',
    earnedDate: 'Earned on 14 Sep 2025',
    isOwned: true,
    isEquipped: false,
    rarity: 'Legendary',
    iconType: 'gold_crest',
    primaryColor: '#B45309',
    secondaryColor: '#F59E0B',
    ribbonColor: '#DC2626',
  },
];

const STORE_MEDALS = [
  {
    id: 'sm1',
    name: 'Super Diamond',
    description: 'Exclusive commemorative medal for sending 100,000 diamonds.',
    cost: '5,000 Diamonds',
    unlocked: false,
    progress: '42%',
    iconType: 'gold_crest',
    primaryColor: '#0284C7',
    secondaryColor: '#38BDF8',
    ribbonColor: '#0EA5E9',
  },
  {
    id: 'sm2',
    name: 'Party Prince',
    description: 'Host voice parties with over 50 listeners simultaneously for 5 sessions.',
    cost: '2,500 Diamonds',
    unlocked: false,
    progress: '3/5 Done',
    iconType: 'crown_wreath',
    primaryColor: '#9333EA',
    secondaryColor: '#C084FC',
    ribbonColor: '#7C3AED',
  },
  {
    id: 'sm3',
    name: 'Grand Champion',
    description: 'Achieve Rank 1 in weekly party or gifter leaderboard rankings.',
    cost: '10,000 Diamonds',
    unlocked: false,
    progress: 'Rank 8 currently',
    iconType: 'ribbon_star',
    primaryColor: '#E11D48',
    secondaryColor: '#F43F5E',
    ribbonColor: '#BE123C',
  },
];

export default function Medal() {
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const navigation = useNavigation();

  const [activeTab, setActiveTab] = useState('my'); // 'my' or 'store'
  const [medals, setMedals] = useState(MEDALS_DATA);
  const [selectedMedalId, setSelectedMedalId] = useState('m4'); // VIP Star by default

  const selectedMedal = medals.find((m) => m.id === selectedMedalId) || medals[3];

  const handleSelectMedal = (medal) => {
    setSelectedMedalId(medal.id);
  };

  const handleEquipToggle = (medal) => {
    setMedals((prev) =>
      prev.map((m) => {
        if (m.id === medal.id) {
          const newEquipped = !m.isEquipped;
          if (newEquipped) {
            AlertService.show('Medal Displayed', `${m.name} is now proudly shown on your profile!`, 'success');
          } else {
            AlertService.show('Medal Hidden', `${m.name} is no longer displayed on your profile.`, 'info');
          }
          return { ...m, isEquipped: newEquipped };
        }
        return m;
      })
    );
  };

  const renderMedalGraphic = (medal, size = 'small') => {
    const isLarge = size === 'large';
    const containerDim = isLarge ? 94 : 52;
    const starDim = isLarge ? 54 : 32;

    switch (medal.iconType) {
      case 'ribbon_star':
        return (
          <View style={[styles.graphicWrap, { width: containerDim, height: containerDim }]}>
            {/* Top Ribbon */}
            <View style={[styles.medalRibbonStripes, isLarge && { height: 26, width: 44 }]} />
            {/* Golden Circle Coin */}
            <LinearGradient
              colors={[medal.secondaryColor, medal.primaryColor, '#B45309']}
              style={[
                styles.medalDisc,
                { width: starDim + (isLarge ? 24 : 14), height: starDim + (isLarge ? 24 : 14) },
              ]}
            >
              <MaterialCommunityIcons
                name="star"
                size={isLarge ? 42 : 24}
                color="#FFFBEB"
              />
            </LinearGradient>
          </View>
        );

      case 'crown_wreath':
        return (
          <View style={[styles.graphicWrap, { width: containerDim, height: containerDim }]}>
            <LinearGradient
              colors={['#FEF3C7', medal.primaryColor]}
              style={[
                styles.medalDisc,
                { width: starDim + (isLarge ? 20 : 12), height: starDim + (isLarge ? 20 : 12) },
              ]}
            >
              <MaterialCommunityIcons
                name="crown"
                size={isLarge ? 38 : 22}
                color="#FFF"
              />
            </LinearGradient>
          </View>
        );

      case 'heart_wings':
        return (
          <View style={[styles.graphicWrap, { width: containerDim, height: containerDim }]}>
            <LinearGradient
              colors={['#FCE7F3', medal.primaryColor]}
              style={[
                styles.medalDisc,
                { width: starDim + (isLarge ? 20 : 12), height: starDim + (isLarge ? 20 : 12) },
              ]}
            >
              <MaterialCommunityIcons
                name="heart"
                size={isLarge ? 36 : 20}
                color="#FFF"
              />
            </LinearGradient>
          </View>
        );

      case 'gift_wings':
        return (
          <View style={[styles.graphicWrap, { width: containerDim, height: containerDim }]}>
            <LinearGradient
              colors={['#FFE4E6', medal.primaryColor]}
              style={[
                styles.medalDisc,
                { width: starDim + (isLarge ? 20 : 12), height: starDim + (isLarge ? 20 : 12) },
              ]}
            >
              <MaterialCommunityIcons
                name="gift"
                size={isLarge ? 36 : 20}
                color="#FFF"
              />
            </LinearGradient>
          </View>
        );

      case 'voice_crown':
        return (
          <View style={[styles.graphicWrap, { width: containerDim, height: containerDim }]}>
            <LinearGradient
              colors={['#DBEAFE', medal.primaryColor]}
              style={[
                styles.medalDisc,
                { width: starDim + (isLarge ? 20 : 12), height: starDim + (isLarge ? 20 : 12) },
              ]}
            >
              <MaterialCommunityIcons
                name="microphone-variant"
                size={isLarge ? 36 : 20}
                color="#FFF"
              />
            </LinearGradient>
          </View>
        );

      case 'silver_shield':
        return (
          <View style={[styles.graphicWrap, { width: containerDim, height: containerDim }]}>
            <LinearGradient
              colors={['#F1F5F9', medal.primaryColor]}
              style={[
                styles.medalDisc,
                { width: starDim + (isLarge ? 20 : 12), height: starDim + (isLarge ? 20 : 12) },
              ]}
            >
              <MaterialCommunityIcons
                name="shield-star"
                size={isLarge ? 38 : 22}
                color="#FFF"
              />
            </LinearGradient>
          </View>
        );

      case 'purple_orb':
        return (
          <View style={[styles.graphicWrap, { width: containerDim, height: containerDim }]}>
            <LinearGradient
              colors={['#EDE9FE', medal.primaryColor]}
              style={[
                styles.medalDisc,
                { width: starDim + (isLarge ? 20 : 12), height: starDim + (isLarge ? 20 : 12) },
              ]}
            >
              <MaterialCommunityIcons
                name="star-four-points"
                size={isLarge ? 36 : 20}
                color="#FFF"
              />
            </LinearGradient>
          </View>
        );

      default:
        // star wreath
        return (
          <View style={[styles.graphicWrap, { width: containerDim, height: containerDim }]}>
            <LinearGradient
              colors={['#FEF3C7', medal.primaryColor]}
              style={[
                styles.medalDisc,
                { width: starDim + (isLarge ? 20 : 12), height: starDim + (isLarge ? 20 : 12) },
              ]}
            >
              <MaterialCommunityIcons
                name="star-circle"
                size={isLarge ? 38 : 22}
                color="#FFF"
              />
            </LinearGradient>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Top Header */}
      <View style={[styles.headerBar, { paddingTop: topSafeInset + 6 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Icon name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Medal</Text>

        <View style={{ width: 38 }} />
      </View>

      {/* 2. Segmented Pill Tabs: My Medals vs Medal Store */}
      <View style={styles.tabBarContainer}>
        <View style={styles.tabPillBg}>
          <TouchableOpacity
            style={[styles.tabSegment, activeTab === 'my' && styles.tabSegmentActive]}
            onPress={() => setActiveTab('my')}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.tabSegmentText,
                activeTab === 'my' && styles.tabSegmentTextActive,
              ]}
            >
              My Medals
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabSegment, activeTab === 'store' && styles.tabSegmentActive]}
            onPress={() => setActiveTab('store')}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.tabSegmentText,
                activeTab === 'store' && styles.tabSegmentTextActive,
              ]}
            >
              Medal Store
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {activeTab === 'my' ? (
          <>
            {/* 3. Hero Showcase Card (Displays selected medal) */}
            <View style={styles.heroCard}>
              <LinearGradient
                colors={['#F5F3FF', '#EEF2FF', '#FAF5FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroGradient}
              >
                {/* Large Glowing Medal Graphic */}
                <View style={styles.heroGraphicCenter}>
                  {renderMedalGraphic(selectedMedal, 'large')}
                </View>

                {/* Medal Name */}
                <Text style={styles.heroMedalTitle}>{selectedMedal.name}</Text>

                {/* Subtitle / Description */}
                <Text style={styles.heroMedalSubtitle}>
                  {selectedMedal.description}
                </Text>

                {/* Date Earned or Status */}
                <Text style={styles.heroMedalDate}>
                  {selectedMedal.earnedDate}
                </Text>

                {/* Equip / Wear Button */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[
                    styles.heroActionBtn,
                    selectedMedal.isEquipped ? styles.heroActionBtnEquipped : styles.heroActionBtnWear,
                  ]}
                  onPress={() => handleEquipToggle(selectedMedal)}
                >
                  <Text
                    style={[
                      styles.heroActionBtnText,
                      selectedMedal.isEquipped ? styles.heroActionBtnTextEquipped : styles.heroActionBtnTextWear,
                    ]}
                  >
                    {selectedMedal.isEquipped ? 'Displaying on Profile ✓' : 'Wear on Profile'}
                  </Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>

            {/* 4. 3-Column Medals Grid */}
            <View style={styles.medalsGrid}>
              {medals.map((medal) => {
                const isSelected = medal.id === selectedMedalId;
                return (
                  <TouchableOpacity
                    key={medal.id}
                    activeOpacity={0.85}
                    style={[
                      styles.gridCard,
                      isSelected && styles.gridCardSelected,
                    ]}
                    onPress={() => handleSelectMedal(medal)}
                  >
                    {/* Medal Graphic */}
                    <View style={styles.gridMedalGraphicWrap}>
                      {renderMedalGraphic(medal, 'small')}
                    </View>

                    {/* Medal Name */}
                    <Text style={styles.gridMedalName} numberOfLines={1}>
                      {medal.name}
                    </Text>

                    {/* Owned Status Tag */}
                    {medal.isOwned && (
                      <View style={styles.ownedTagBadge}>
                        <Text style={styles.ownedTagText}>Owned</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        ) : (
          /* Medal Store Tab */
          <View style={styles.storeContainer}>
            <Text style={styles.storeSectionTitle}>Unlock Exclusive Medals</Text>
            <Text style={styles.storeSectionSubtitle}>
              Complete achievements or purchase limited edition event badges
            </Text>

            {STORE_MEDALS.map((sMedal) => (
              <View key={sMedal.id} style={styles.storeCard}>
                <View style={styles.storeMedalGraphic}>
                  {renderMedalGraphic(sMedal, 'small')}
                </View>

                <View style={styles.storeInfoWrap}>
                  <Text style={styles.storeMedalName}>{sMedal.name}</Text>
                  <Text style={styles.storeMedalDesc}>{sMedal.description}</Text>
                  <View style={styles.storeProgressRow}>
                    <Text style={styles.storeProgressLabel}>Progress: </Text>
                    <Text style={styles.storeProgressVal}>{sMedal.progress}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.storeBuyBtn}
                  activeOpacity={0.8}
                  onPress={() => AlertService.show('Medal Store', `Requirements for ${sMedal.name}: ${sMedal.description}`, 'info')}
                >
                  <Text style={styles.storeBuyBtnText}>{sMedal.cost}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  tabBarContainer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
  },
  tabPillBg: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 24,
    padding: 3,
  },
  tabSegment: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabSegmentActive: {
    backgroundColor: '#6D28D9',
  },
  tabSegmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabSegmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
  },

  /* Hero Showcase Card */
  heroCard: {
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  heroGradient: {
    padding: 24,
    alignItems: 'center',
  },
  heroGraphicCenter: {
    marginBottom: 12,
  },
  heroMedalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  heroMedalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 4,
  },
  heroMedalDate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 16,
  },
  heroActionBtn: {
    paddingHorizontal: 24,
    paddingVertical: 9,
    borderRadius: 20,
  },
  heroActionBtnWear: {
    backgroundColor: '#6D28D9',
  },
  heroActionBtnEquipped: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  heroActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  heroActionBtnTextWear: {
    color: '#FFFFFF',
  },
  heroActionBtnTextEquipped: {
    color: '#16A34A',
  },

  /* Medals Grid */
  medalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  gridCard: {
    width: GRID_ITEM_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
  },
  gridCardSelected: {
    borderColor: '#7C3AED',
    backgroundColor: '#FAF5FF',
    shadowColor: '#7C3AED',
    shadowOpacity: 0.2,
  },
  gridMedalGraphicWrap: {
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  gridMedalName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 4,
  },
  ownedTagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
  },
  ownedTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#16A34A',
  },

  /* Medal Visual Graphics */
  graphicWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  medalRibbonStripes: {
    position: 'absolute',
    top: -4,
    width: 26,
    height: 16,
    backgroundColor: '#EF4444',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    zIndex: 1,
  },
  medalDisc: {
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },

  /* Store Tab Styles */
  storeContainer: {
    marginTop: 4,
  },
  storeSectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  storeSectionSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  storeMedalGraphic: {
    marginRight: 12,
  },
  storeInfoWrap: {
    flex: 1,
  },
  storeMedalName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  storeMedalDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 4,
  },
  storeProgressRow: {
    flexDirection: 'row',
  },
  storeProgressLabel: {
    fontSize: 11,
    color: '#94A3B8',
  },
  storeProgressVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7C3AED',
  },
  storeBuyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    marginLeft: 8,
  },
  storeBuyBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#7C3AED',
  },
});
