import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AuthContext } from '../../context/AuthProvider';
import { getUserAvatar } from '../../utils/avatarUtil';
import AvatarWithFrame from '../../components/AvatarWithFrame';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';
import { AlertService } from '../../utils/AlertService';
import { apiUtil } from '../../utils/apiUtil';
import { formatCompactBalance } from '../../utils/numberUtil';
import StoreItemPreviewModal from '../../components/cosmetics/StoreItemPreviewModal';
import StoreBundleDetailModal from '../../components/cosmetics/StoreBundleDetailModal';
import StorePurchaseConfirmModal from '../../components/cosmetics/StorePurchaseConfirmModal';
import CosmeticAsset from '../../components/cosmetics/CosmeticAsset';
import CosmeticFormatBadge from '../../components/cosmetics/CosmeticFormatBadge';
import DurationPicker from '../../components/cosmetics/DurationPicker';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 2;
const STORE_DURATIONS = [3, 7, 15, 30];

const getPriceOptions = (item) => {
  if (Array.isArray(item?.priceOptions) && item.priceOptions.length) {
    return item.priceOptions
      .filter(option => STORE_DURATIONS.includes(Number(option.days)))
      .map(option => ({ days: Number(option.days), diamonds: Number(option.diamonds) || 0 }))
      .sort((a, b) => a.days - b.days);
  }
  const price = Number(item?.price) || 0;
  const ratios = { 3: 0.15, 7: 0.3, 15: 0.55, 30: 1 };
  return STORE_DURATIONS.map(days => ({ days, diamonds: Math.max(0, Math.round(price * ratios[days])) }));
};

const isFreeStoreItem = (item) =>
  Boolean(item?.isFree || item?.metadata?.isFree) ||
  getPriceOptions(item).every(option => Number(option.diamonds || 0) === 0);

const normalizeStoreItem = (item) => ({
  ...item,
  ...(item?.metadata || {}),
  id: String(item?.id || item?._id || ''),
  tag: item?.tag || item?.metadata?.tag || item?.badgeText || '',
  benefits: Array.isArray(item?.benefits)
    ? item.benefits
    : Array.isArray(item?.metadata?.benefits) ? item.metadata.benefits : [],
  priceOptions: getPriceOptions(item),
});

const StoreAsset = CosmeticAsset;


// Store categories: Unique ID, Frames, Chat Bubble, Theme, Tassel, Entry, Mic Wave, Profile Card, Room Card, Profile Entry, VIP, King of Kings, Badge, Tag
const STORE_CATEGORIES = ['Unique ID', 'Frames', 'Chat Bubble', 'Theme', 'Seat Skin', 'Tassel', 'Entry', 'Mic Wave', 'Profile Card', 'Room Card', 'Profile Entry', 'VIP', 'King of Kings', 'Badge', 'Tag'];

const createEmptyCatalog = () =>
  STORE_CATEGORIES.reduce((result, category) => ({ ...result, [category]: [] }), {});

export default function StoreScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 24);
  const { user, fetchUserProfile } = useContext(AuthContext);

  const [catalog, setCatalog] = useState(createEmptyCatalog);
  const [activeCategory, setActiveCategory] = useState('Unique ID');
  const [selectedItem, setSelectedItem] = useState(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedDurationDays, setSelectedDurationDays] = useState(30);

  useFocusEffect(React.useCallback(() => {
    let isMounted = true;
    const fetchCatalog = async () => {
      try {
        const response = await apiUtil.get('/store/items', { params: { activeOnly: true } });
        const payload = response?.data?.data || response?.data || {};
        if (isMounted && Array.isArray(payload.items)) {
          const liveCatalog = createEmptyCatalog();
          payload.items.map(normalizeStoreItem).forEach((item) => {
            // Keep employee-only items out of the public app even when an
            // older backend response has not applied the catalog filter yet.
            if (item.isStaffOnly || String(item.audience || '').toLowerCase() === 'employee') return;
            const rawCat = String(item.category || '').trim();
            const cat = (rawCat === 'Frame' || rawCat === 'Frames') ? 'Frames'
              : (rawCat === 'Entry' || rawCat === 'Entry Effect' || rawCat === 'Entry Effects' || rawCat === 'Entrance') ? 'Entry'
              : (rawCat === 'Chat Bubble' || rawCat === 'Chat Bubbles') ? 'Chat Bubble'
              : (rawCat === 'Theme' || rawCat === 'Themes') ? 'Theme'
              : (rawCat === 'Seat Skin' || rawCat === 'Seat Skins') ? 'Seat Skin'
              : (rawCat === 'Tassel' || rawCat === 'Tassels') ? 'Tassel'
              : (rawCat === 'Mic Wave' || rawCat === 'Mic Waves') ? 'Mic Wave'
              : (rawCat === 'Profile Card' || rawCat === 'Profile Cards') ? 'Profile Card'
              : (rawCat === 'Room Card' || rawCat === 'Room Cards') ? 'Room Card'
              : (rawCat === 'Profile Entry' || rawCat === 'Profile Entries') ? 'Profile Entry'
              : rawCat;
            if (cat === 'Theme') {
              const location = String(item.themeLocation || item.metadata?.themeLocation || 'STORE')
                .trim()
                .toUpperCase()
                .replace(/[ -]+/g, '_');
              if (location === 'ROOM_TOOL') return;
            }
            if (liveCatalog[cat]) {
              liveCatalog[cat].push({ ...item, category: cat });
            }
          });
          setCatalog(liveCatalog);
          const firstItem = liveCatalog['Unique ID']?.[0] || Object.values(liveCatalog).flat()[0] || null;
          setSelectedItem(previous =>
            liveCatalog[previous?.category]?.find(item => item.id === previous.id)
            || liveCatalog[previous?.category]?.[0]
            || firstItem
          );
          setActiveCategory(previous => liveCatalog[previous]?.length ? previous : (firstItem?.category || previous));
        }
      } catch (error) {
        if (isMounted) {
          setCatalog(createEmptyCatalog());
          setSelectedItem(null);
          AlertService.show(
            'Store',
            error?.response?.data?.message || 'Store catalog load nahi ho saka.',
            'warning',
          );
        }
      }
    };
    fetchCatalog();
    return () => {
      isMounted = false;
    };
  }, []));

  const currentDiamonds = Number(user?.diamonds || 0);
  const items = catalog[activeCategory] || [];
  const selectedPriceOptions = getPriceOptions(selectedItem);
  const selectedPrice = selectedPriceOptions.find(option => option.days === selectedDurationDays)?.diamonds
    ?? selectedPriceOptions[0]?.diamonds
    ?? Number(selectedItem?.price || 0);

  const handleOpenPurchase = (item) => {
    setSelectedItem(item);
    const options = getPriceOptions(item);
    setSelectedDurationDays(options.find(option => option.days === 30)?.days || options[0]?.days || 30);
    setConfirmModalVisible(true);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedItem) return;
    if (!/^[a-f0-9]{24}$/i.test(String(selectedItem._id || selectedItem.id || ''))) {
      setConfirmModalVisible(false);
      setPreviewModalVisible(false);
      AlertService.show('Store unavailable', 'Connect to the internet and reopen the store to buy this item.', 'error');
      return;
    }

    if (currentDiamonds < selectedPrice) {
      setConfirmModalVisible(false);
      setPreviewModalVisible(false);
      AlertService.show(
        'Insufficient Diamonds',
        `You have ${currentDiamonds.toLocaleString()} Diamonds, but this ${selectedDurationDays}-day option costs ${selectedPrice.toLocaleString()} Diamonds. Please recharge to continue.`,
        'error',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Recharge Diamonds', onPress: () => navigation.navigate('Recharge') },
        ]
      );
      return;
    }

    setPurchasing(true);
    try {
      await apiUtil.post('/store/purchase', {
        itemId: selectedItem._id || selectedItem.id,
        durationDays: selectedDurationDays,
      });

      await fetchUserProfile();
      setConfirmModalVisible(false);
      setPreviewModalVisible(false);

      AlertService.show(
        'Purchase Successful 🎉',
        selectedItem.category === 'Unique ID'
          ? `Unique ID ${selectedItem.number || selectedItem.metadata?.number || ''} is in My Items. Activate it there when you are ready to display it.`
          : isFreeStoreItem(selectedItem)
          ? `${selectedItem.name} is now unlocked and available in your Profile / My Items.`
          : `You purchased ${selectedItem.name} for ${selectedDurationDays} days. It is now equipped and available in your Profile / My Items.`,
        'success',
        [
          { text: 'View in My Items', onPress: () => navigation.navigate('MyItems') },
          { text: 'OK', style: 'cancel' },
        ]
      );
    } catch (err) {
      AlertService.show('Error', err?.message || 'Could not complete purchase', 'error');
    } finally {
      setPurchasing(false);
    }
  };

  // Render contextual live preview in top banner
  const renderLivePreview = () => {
    const item = selectedItem || items[0];

    if (!item) {
      return (
        <LinearGradient
          colors={['#1E1B4B', '#312E81', '#4338CA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.previewCard}
        >
          <View style={styles.emptyPreviewWrapper}>
            <MaterialCommunityIcons name="storefront-outline" size={32} color="#A5B4FC" style={{ marginBottom: 6 }} />
            <Text style={styles.previewTitle}>Yaro Store</Text>
            <Text style={styles.previewSub}>
              {`No active ${activeCategory} items currently. Items managed via Admin Panel will appear here.`}
            </Text>
          </View>
        </LinearGradient>
      );
    }

    // 1. UNIQUE ID PREVIEW
    if (activeCategory === 'Unique ID') {
      return (
        <LinearGradient
          colors={item?.bgColors || ['#78350F', '#B45309', '#D97706']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.previewCard}
        >
          <View style={styles.idCardPreviewBox}>
            <View style={styles.idCardHeader}>
              <View style={styles.idCardCrownWrap}>
                <MaterialCommunityIcons name="crown" size={20} color="#FDE68A" />
                <Text style={styles.idCardTitle}>Yaro Sovereign ID</Text>
              </View>
              <View style={styles.idCardTagPill}>
                <Text style={styles.idCardTagText}>{item?.tag || 'Exclusive'}</Text>
              </View>
            </View>

            <View style={styles.idNumberRow}>
              <Text style={styles.idNumberLabel}>ID:</Text>
              <Text style={styles.idNumberDigits}>{item?.number || '—'}</Text>
              <MaterialIcons name="verified" size={18} color="#6EE7B7" style={{ marginLeft: 6 }} />
            </View>

            <View style={styles.idCardFooter}>
              <View style={styles.idUserMiniRow}>
                <Image source={getUserAvatar(user)} style={styles.idMiniAvatar} />
                <Text style={styles.idUserMiniName} numberOfLines={1}>{user?.name || 'Yaro User'}</Text>
              </View>
              <Text style={styles.idCardValidity}>{item?.validity || 'Permanent'}</Text>
            </View>
          </View>
        </LinearGradient>
      );
    }

    // 2. CHAT BUBBLE PREVIEW
    if (activeCategory === 'Chat Bubble') {
      return (
        <LinearGradient
          colors={['#1E1B4B', '#312E81', '#4338CA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.previewCard}
        >
          <View style={styles.bubblePreviewWrapper}>
            <View style={styles.bubbleHeaderRow}>
              <MaterialCommunityIcons name="chat-processing" size={18} color="#A5B4FC" />
              <Text style={styles.bubblePreviewHeaderTitle}>Party & Chat Bubble Preview</Text>
            </View>

            <View style={styles.bubbleChatRow}>
              <Image source={getUserAvatar(user)} style={styles.bubbleAvatarImg} />
              <View
                style={[
                  styles.speechBubbleBox,
                  {
                    backgroundColor: item?.bubbleBg || '#FEF3C7',
                    borderColor: item?.bubbleBorder || '#F59E0B',
                  },
                ]}
              >
                <Text style={[styles.bubbleSenderName, { color: item?.bubbleBorder || '#D97706' }]}>
                  {user?.name || 'Yaro Host'}
                </Text>
                <Text style={[styles.bubbleMessageText, { color: item?.bubbleText || '#78350F' }]}>
                  Welcome to Yaro Voice Club! Enjoy music & fun 💛🎤
                </Text>
              </View>
            </View>
            <Text style={styles.previewSubSmall}>{item?.desc}</Text>
          </View>
        </LinearGradient>
      );
    }

    // 3. THEME PREVIEW
    if (activeCategory === 'Theme') {
      return (
        <LinearGradient
          colors={item?.bgColors || ['#0F172A', '#1E1B4B', '#312E81']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.previewCard}
        >
          <View style={styles.themePreviewWrapper}>
            <View style={styles.themeTopRow}>
              <View style={styles.themeIconCircle}>
                <MaterialCommunityIcons name={item?.icon || 'image-filter-hdr'} size={24} color={item?.previewColor || '#F59E0B'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.themePreviewTitle}>{item?.name || 'Room Theme'}</Text>
                <Text style={styles.themePreviewTag}>{item?.tag || 'Luxury Room Wallpaper'}</Text>
              </View>
              <View style={styles.themeBadgeActive}>
                <Text style={styles.themeBadgeActiveText}>30 Days</Text>
              </View>
            </View>
            <Text style={styles.themeDescText}>{item?.desc}</Text>
          </View>
        </LinearGradient>
      );
    }

    // 3.1 SEAT SKIN PREVIEW
    if (activeCategory === 'Seat Skin') {
      const skinBg = item?.previewColor || '#F59E0B';
      const imgSrc = item?.imageUrl || item?.image;
      return (
        <LinearGradient
          colors={item?.bgColors || ['#0F172A', '#1E1B4B', '#312E81']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.previewCard}
        >
          <View style={styles.tasselPreviewRow}>
            {/* 3D Seat Throne Display */}
            <View style={styles.micSeatSimBox}>
              <View style={[styles.micSeatCircle, { borderColor: skinBg, width: 68, height: 68, borderRadius: 34, overflow: 'hidden', borderWidth: 2 }]}>
                {imgSrc ? (
                  <Image
                    source={typeof imgSrc === 'string' ? { uri: imgSrc } : imgSrc}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                ) : (
                  <MaterialCommunityIcons name={item?.icon || 'chair-rolling'} size={32} color={skinBg} />
                )}
              </View>
              <View style={[styles.tasselDangle, { backgroundColor: skinBg }]}>
                <MaterialCommunityIcons name="crown" size={14} color="#FFFFFF" />
              </View>
            </View>

            <View style={styles.tasselTextCol}>
              <Text style={styles.tasselTitle}>{item?.name || 'Luxury Seat Skin'}</Text>
              <View style={styles.micWaveTagRow}>
                <Text style={styles.tasselTagBadge}>{item?.tag || 'HD Room Seat'}</Text>
                <View style={[styles.themeBadgeActive, { backgroundColor: `${skinBg}30`, borderColor: skinBg, borderWidth: 1 }]}>
                  <Text style={[styles.themeBadgeActiveText, { color: skinBg }]}>Room Tools Ready</Text>
                </View>
              </View>
              <Text style={styles.tasselDesc}>{item?.desc || 'Exclusive HD royal seat skin for your voice club rooms.'}</Text>
            </View>
          </View>
        </LinearGradient>
      );
    }

    // 4. TASSEL PREVIEW
    if (activeCategory === 'Tassel') {
      return (
        <LinearGradient
          colors={['#1E293B', '#0F172A', '#020617']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.previewCard}
        >
          <View style={styles.tasselPreviewRow}>
            {/* Mic Seat Simulation */}
            <View style={styles.micSeatSimBox}>
              <View style={[styles.micSeatCircle, { borderColor: item?.previewColor || '#F59E0B' }]}>
                <MaterialIcons name="mic" size={26} color={item?.previewColor || '#F59E0B'} />
              </View>
              {/* Dangling Tassel Graphic */}
              <View style={[styles.tasselDangle, { backgroundColor: item?.previewColor || '#F59E0B' }]}>
                <MaterialCommunityIcons name="ribbon" size={20} color="#FFFFFF" />
              </View>
            </View>

            <View style={styles.tasselTextCol}>
              <Text style={styles.tasselTitle}>{item?.name}</Text>
              <Text style={styles.tasselTagBadge}>{item?.tag || 'Mic Tassel Ornament'}</Text>
              <Text style={styles.tasselDesc}>{item?.desc}</Text>
            </View>
          </View>
        </LinearGradient>
      );
    }

    // 5. MIC WAVE PREVIEW
    if (activeCategory === 'Mic Wave') {
      const waveColor = item?.previewColor || '#F59E0B';
      return (
        <LinearGradient
          colors={['#0F172A', '#1E293B', '#334155']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.previewCard}
        >
          <View style={styles.tasselPreviewRow}>
            {/* Mic Seat Speaking Ripple Simulation */}
            <View style={styles.micSeatSimBox}>
              <View style={[styles.micSeatRippleOuter, { borderColor: waveColor + '40' }]}>
                <View style={[styles.micSeatRippleMiddle, { borderColor: waveColor + '70' }]}>
                  <View style={[styles.micSeatCircle, { borderColor: waveColor, backgroundColor: '#020617' }]}>
                    <Image source={getUserAvatar(user)} style={{ width: 38, height: 38, borderRadius: 19 }} />
                    <View style={[styles.micSeatSmallIconBadge, { backgroundColor: waveColor }]}>
                      <MaterialIcons name="mic" size={12} color="#FFFFFF" />
                    </View>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.tasselTextCol}>
              <Text style={styles.tasselTitle}>{item?.name}</Text>
              <View style={styles.micWaveTagRow}>
                <Text style={styles.tasselTagBadge}>{item?.tag || 'Soundwave Aura'}</Text>
                <View style={styles.micSpeakingIndicator}>
                  <View style={[styles.micWaveBar, { height: 7, backgroundColor: waveColor }]} />
                  <View style={[styles.micWaveBar, { height: 13, backgroundColor: waveColor }]} />
                  <View style={[styles.micWaveBar, { height: 18, backgroundColor: waveColor }]} />
                  <View style={[styles.micWaveBar, { height: 10, backgroundColor: waveColor }]} />
                </View>
              </View>
              <Text style={styles.tasselDesc}>{item?.desc}</Text>
            </View>
          </View>
        </LinearGradient>
      );
    }

    // 6. FRAMES PREVIEW
    if (activeCategory === 'Frames') {
      const coverImage = item?.coverImageUrl || item?.imageUrl || item?.image;
      return (
        <LinearGradient
          colors={['#4C1D95', '#6D28D9', '#7C3AED']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.previewCard}
        >
          <View style={styles.framePreviewRow}>
            <View style={styles.previewAvatarWrap}>
              {item?.animationUrl || !coverImage ? (
                <AvatarWithFrame
                  user={user}
                  frame={item || 'Rose frame'}
                  size={66}
                  showOnlineDot={false}
                />
              ) : (
                <Image
                  source={{ uri: coverImage }}
                  style={styles.gridItemAsset}
                  resizeMode="contain"
                />
              )}
            </View>

            <View style={styles.previewTextCol}>
              <Text style={styles.previewTitle}>
                {item ? item.name : 'Avatar Frame'}
              </Text>
              <View style={styles.micWaveTagRow}>
                <Text style={styles.tasselTagBadge}>{item?.tag || 'Exclusive Frame'}</Text>
              </View>
              <Text style={styles.previewSub}>
                {item ? item.desc : 'Equip animated frames with blooming flowers, wings, or crowns.'}
              </Text>
            </View>
          </View>
        </LinearGradient>
      );
    }

    if (activeCategory === 'Entry' && (item?.animationUrl || item?.imageUrl)) {
      return (
        <LinearGradient colors={['#111827', '#312E81', '#4C1D95']} style={styles.previewCard}>
          <View style={styles.entryAssetPreview}>
            <StoreAsset item={item} style={styles.entryAssetMedia} />
            <View style={styles.entryAssetCaption}>
              <Text style={styles.previewTitle}>{item.name}</Text>
              <Text style={styles.previewSub}>{item.banner || item.desc}</Text>
            </View>
          </View>
        </LinearGradient>
      );
    }

    // 7. DEFAULT (ENTRY, VIP)
    return (
      <LinearGradient
        colors={['#7C3AED', '#6D28D9', '#4C1D95']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.previewCard}
      >
        <View style={styles.framePreviewRow}>
          <View style={styles.previewAvatarWrap}>
            <View style={[styles.previewFrameRing, { borderColor: item ? item.previewColor : '#F59E0B' }]}>
              <Image source={getUserAvatar(user)} style={styles.previewAvatarImg} />
            </View>
            <View style={styles.vipCrownBadge}>
              <Text style={{ fontSize: 13 }}>👑</Text>
            </View>
          </View>

          <View style={styles.previewTextCol}>
            <Text style={styles.previewTitle}>
              {item ? item.name : 'Exclusive Store Items'}
            </Text>
            <Text style={styles.previewSub}>
              {item ? item.desc : 'Equip animated frames, entry dragons & glowing badges.'}
            </Text>
            {Array.isArray(item?.benefits) && item.benefits.slice(0, 3).map((benefit, index) => (
              <Text key={`${benefit}-${index}`} style={styles.previewBenefit}>✓ {benefit}</Text>
            ))}
          </View>
        </View>
      </LinearGradient>
    );
  };

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
        <Text style={styles.headerTitle}>Yaro Store</Text>

        {/* Diamond Balance Pill */}
        <TouchableOpacity
          style={styles.balancePill}
          onPress={() => navigation.navigate('Recharge')}
          activeOpacity={0.8}
        >
          <Icon name="diamond" size={14} color="#06B6D4" />
          <Text style={styles.balanceText}>{formatCompactBalance(currentDiamonds)}</Text>
          <View style={styles.addIconWrap}>
            <Icon name="add" size={10} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Dynamic Live Preview Banner */}
      <View style={styles.previewContainer}>
        {renderLivePreview()}
      </View>

      {/* Category Tabs */}
      <View style={styles.categoryTabs}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {STORE_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryTabBtn, isActive && styles.categoryTabBtnActive]}
                onPress={() => {
                  setActiveCategory(cat);
                  setSelectedItem(catalog[cat]?.[0] || null);
                }}
              >
                <Text style={[styles.categoryTabText, isActive && styles.categoryTabTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Items Grid */}
      <ScrollView
        contentContainerStyle={[styles.gridContent, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {items.length === 0 ? (
          <View style={styles.emptyStateBox}>
            <View style={styles.emptyIconCircle}>
              <Icon name="sparkles-outline" size={36} color="#94A3B8" />
            </View>
            <Text style={styles.emptyStateTitle}>No {activeCategory} Items</Text>
            <Text style={styles.emptyStateSubtitle}>
              Exclusive {activeCategory} items added or updated from the Admin Panel will appear here.
            </Text>
          </View>
        ) : (
          <View style={styles.itemsGrid}>
            {items.map((item) => {
            const isSelected = selectedItem?.id === item.id;
            const isUniqueId = activeCategory === 'Unique ID';

            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.itemCard,
                  isSelected && styles.itemCardSelected,
                  isUniqueId && styles.itemCardUniqueId,
                ]}
                activeOpacity={0.88}
                onPress={() => {
                  setSelectedItem(item);
                  const options = getPriceOptions(item);
                  setSelectedDurationDays(options.find(option => option.days === 30)?.days || options[0]?.days || 30);
                  if (activeCategory === 'VIP' || activeCategory === 'King of Kings') {
                    setDetailModalVisible(true);
                  } else {
                    setPreviewModalVisible(true);
                  }
                }}
              >
                {/* Visual Circle / Unique ID Big Badge */}
                {isUniqueId ? (
                  <LinearGradient
                    colors={item.bgColors || ['#78350F', '#D97706']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.idCardMiniVisual}
                  >
                    <View style={styles.idCrownMini}>
                      <MaterialCommunityIcons name="crown" size={12} color="#FDE68A" />
                    </View>
                    <Text style={styles.idCardMiniDigits}>{item.number}</Text>
                    <Text style={styles.idCardMiniTag}>{item.tag}</Text>
                  </LinearGradient>
                ) : activeCategory === 'Mic Wave' ? (
                  <View style={[styles.itemVisualCircle, { backgroundColor: `${item.previewColor}18`, borderWidth: 1.5, borderColor: `${item.previewColor}50` }]}>
                    <View style={[styles.micGridCenterRipple, { borderColor: `${item.previewColor}80` }]}>
                      <MaterialCommunityIcons name="microphone" size={24} color={item.previewColor} />
                    </View>
                  </View>
                ) : activeCategory === 'Frames' ? (
                  <View style={[styles.itemVisualCircle, { backgroundColor: `${item.previewColor}12` }]}>
                    {(item.coverImageUrl || item.imageUrl || item.image) ? (
                      <Image
                        source={{ uri: item.coverImageUrl || item.imageUrl || item.image }}
                        style={styles.gridItemAsset}
                        resizeMode="contain"
                      />
                    ) : (
                      <AvatarWithFrame
                        user={user}
                        frame={item}
                        size={54}
                        showOnlineDot={false}
                      />
                    )}
                  </View>
                ) : activeCategory === 'Entry' && (item.coverImageUrl || item.imageUrl || item.image || item.animationUrl) ? (
                  <View style={[styles.itemVisualCircle, { backgroundColor: `${item.previewColor}18` }]}>
                    {(item.coverImageUrl || item.imageUrl || item.image) ? (
                      <Image
                        source={{ uri: item.coverImageUrl || item.imageUrl || item.image }}
                        style={styles.gridItemAsset}
                        resizeMode="contain"
                      />
                    ) : (
                      <StoreAsset item={item} style={styles.gridItemAsset} />
                    )}
                  </View>
                ) : activeCategory === 'Seat Skin' ? (
                  <View style={[styles.itemVisualCircle, { backgroundColor: `${item.previewColor || '#F59E0B'}18`, overflow: 'hidden', borderWidth: 1.5, borderColor: item.borderColor || `${item.previewColor || '#F59E0B'}60` }]}>
                    {item.imageUrl || item.image ? (
                      <Image
                        source={typeof (item.imageUrl || item.image) === 'string' ? { uri: item.imageUrl || item.image } : (item.imageUrl || item.image)}
                        style={{ width: 58, height: 58, borderRadius: 29 }}
                        resizeMode="cover"
                      />
                    ) : (
                      <MaterialCommunityIcons name={item.icon || 'chair-rolling'} size={32} color={item.previewColor || '#F59E0B'} />
                    )}
                  </View>
                ) : item.animationUrl || item.imageUrl ? (
                  <View style={[styles.itemVisualCircle, { backgroundColor: `${item.previewColor}18` }]}>
                    <StoreAsset item={item} style={styles.gridItemAsset} />
                  </View>
                ) : (
                  <View style={[styles.itemVisualCircle, { backgroundColor: `${item.previewColor}18` }]}>
                    <MaterialCommunityIcons name={item.icon} size={36} color={item.previewColor} />
                  </View>
                )}

                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.itemValidity}>3 / 7 / 15 / 30 Days</Text>

                <TouchableOpacity
                  style={styles.buyBtn}
                  onPress={() => {
                    setSelectedItem(item);
                    const options = getPriceOptions(item);
                    setSelectedDurationDays(options.find(option => option.days === 30)?.days || options[0]?.days || 30);
                    if (activeCategory === 'VIP' || activeCategory === 'King of Kings') {
                      setDetailModalVisible(true);
                    } else {
                      setPreviewModalVisible(true);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  {!isFreeStoreItem(item) && <Icon name="diamond" size={12} color="#06B6D4" style={{ marginRight: 4 }} />}
                  <Text style={styles.buyBtnText}>
                    {isFreeStoreItem(item)
                      ? 'FREE'
                      : `From ${formatCompactBalance(Math.min(...getPriceOptions(item).map(option => option.diamonds)))}`}
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
          </View>
        )}
      </ScrollView>

      {/* Frame & Item Interactive Preview Popup Modal */}
      <StoreItemPreviewModal
        visible={previewModalVisible}
        onClose={() => setPreviewModalVisible(false)}
        onRecharge={() => { setPreviewModalVisible(false); navigation.navigate('Recharge'); }}
        item={selectedItem}
        activeCategory={activeCategory}
        user={user}
        priceOptions={selectedPriceOptions}
        selectedDurationDays={selectedDurationDays}
        onSelectDuration={setSelectedDurationDays}
        price={selectedPrice}
        diamonds={currentDiamonds}
        onConfirmPurchase={handleConfirmPurchase}
        purchasing={purchasing}
        styles={styles}
      />

      {/* VIP and King of Kings included items */}
      <StoreBundleDetailModal
        visible={detailModalVisible}
        onClose={() => setDetailModalVisible(false)}
        item={selectedItem}
        category={activeCategory}
        isFreeItem={isFreeStoreItem}
        onOpenPurchase={handleOpenPurchase}
        styles={styles}
      />

      {/* Purchase Confirmation Modal */}
      <StorePurchaseConfirmModal
        visible={confirmModalVisible}
        onClose={() => setConfirmModalVisible(false)}
        item={selectedItem}
        priceOptions={selectedPriceOptions}
        selectedDurationDays={selectedDurationDays}
        onSelectDuration={setSelectedDurationDays}
        price={selectedPrice}
        purchasing={purchasing}
        onConfirm={handleConfirmPurchase}
        styles={styles}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  detailClose: { alignSelf: 'flex-end' },
  detailPreview: { height: 96, alignItems: 'center', justifyContent: 'center' },
  detailAsset: { width: 96, height: 96 },
  detailHeading: { alignSelf: 'flex-start', fontSize: 13, fontWeight: '800', color: '#0F172A', marginTop: 14, marginBottom: 8 },
  detailBenefitRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, width: '100%', marginTop: 5 },
  detailBenefitText: { flex: 1, color: '#334155', fontSize: 12, lineHeight: 18 },
  detailBuyButton: { backgroundColor: '#7C3AED', width: '100%', padding: 12, borderRadius: 12, alignItems: 'center', marginTop: 18 },
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
  balancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
    gap: 5,
  },
  balanceText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F766E',
  },
  addIconWrap: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewContainer: {
    padding: 16,
  },
  previewCard: {
    borderRadius: 20,
    padding: 16,
    elevation: 4,
    shadowColor: '#7C3AED',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    minHeight: 110,
    justifyContent: 'center',
  },
  framePreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewAvatarWrap: {
    position: 'relative',
    alignSelf: 'center',
  },
  previewFrameRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewAvatarImg: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  vipCrownBadge: {
    position: 'absolute',
    top: -8,
    right: -4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 2,
    elevation: 2,
  },
  previewTextCol: {
    flex: 1,
    marginLeft: 16,
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  previewSub: {
    fontSize: 12,
    color: '#E9D5FF',
    marginTop: 4,
    lineHeight: 16,
  },
  previewBenefit: {
    fontSize: 10.5,
    color: '#FDE68A',
    marginTop: 3,
  },
  uploadedFramePreview: {
    width: 82,
    height: 82,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadedFrameAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  uploadedFrameAsset: {
    ...StyleSheet.absoluteFillObject,
    width: 82,
    height: 82,
  },
  entryAssetPreview: {
    minHeight: 120,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderRadius: 16,
  },
  entryAssetMedia: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: 120,
  },
  entryAssetCaption: {
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.48)',
  },
  previewSubSmall: {
    fontSize: 11,
    color: '#C7D2FE',
    marginTop: 6,
  },

  // Unique ID Preview Styles
  idCardPreviewBox: {
    width: '100%',
  },
  idCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  idCardCrownWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  idCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FDE68A',
    letterSpacing: 0.5,
  },
  idCardTagPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  idCardTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  idNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 8,
  },
  idNumberLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FEF3C7',
    marginRight: 6,
  },
  idNumberDigits: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  idCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: 8,
  },
  idUserMiniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  idMiniAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  idUserMiniName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    maxWidth: 160,
  },
  idCardValidity: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FEF3C7',
  },

  // Chat Bubble Preview Styles
  bubblePreviewWrapper: {
    width: '100%',
  },
  bubbleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  bubblePreviewHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C7D2FE',
  },
  bubbleChatRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bubbleAvatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#818CF8',
  },
  speechBubbleBox: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopLeftRadius: 2,
  },
  bubbleSenderName: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  bubbleMessageText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },

  // Theme Preview Styles
  themePreviewWrapper: {
    width: '100%',
  },
  themeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  themeIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  themePreviewTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  themePreviewTag: {
    fontSize: 11,
    color: '#CBD5E1',
    marginTop: 2,
  },
  themeBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  themeBadgeActiveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  themeDescText: {
    fontSize: 12,
    color: '#E2E8F0',
    marginTop: 10,
    lineHeight: 16,
  },

  // Tassel Preview Styles
  tasselPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  micSeatSimBox: {
    alignItems: 'center',
  },
  micSeatCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tasselDangle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -8,
    elevation: 3,
  },
  tasselTextCol: {
    flex: 1,
  },
  tasselTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  tasselTagBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FBBF24',
    marginTop: 2,
  },
  tasselDesc: {
    fontSize: 11,
    color: '#CBD5E1',
    marginTop: 4,
    lineHeight: 15,
  },

  categoryTabs: {
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  categoryTabBtn: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryTabBtnActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  categoryTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  categoryTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  gridContent: {
    padding: 16,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  itemCard: {
    width: ITEM_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  itemCardSelected: {
    borderColor: '#7C3AED',
    borderWidth: 2,
  },
  itemCardUniqueId: {
    backgroundColor: '#FAF5FF',
  },
  idCardMiniVisual: {
    width: ITEM_WIDTH - 28,
    height: 72,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    position: 'relative',
    padding: 6,
  },
  idCrownMini: {
    position: 'absolute',
    top: 4,
    left: 8,
  },
  idCardMiniDigits: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  idCardMiniTag: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FEF3C7',
    marginTop: 2,
  },
  itemVisualCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  itemValidity: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 10,
  },
  buyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    borderRadius: 14,
    paddingVertical: 7,
    paddingHorizontal: 12,
    width: '100%',
  },
  buyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F766E',
  },
  gridUploadedFrame: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridUploadedAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  gridUploadedAsset: {
    ...StyleSheet.absoluteFillObject,
    width: 58,
    height: 58,
  },
  gridItemAsset: {
    width: 70,
    height: 70,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalDialog: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
  },
  modalVisualWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  modalAsset: {
    width: 72,
    height: 72,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  modalSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  modalPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
  },
  modalPriceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  modalPriceValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  modalConfirmBtn: {
    flex: 1.5,
    borderRadius: 14,
    overflow: 'hidden',
  },
  modalConfirmGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  /* Mic Wave Preview & Grid */
  micSeatRippleOuter: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micSeatRippleMiddle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micSeatSmallIconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  micWaveTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
    marginBottom: 4,
  },
  micSpeakingIndicator: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  micWaveBar: {
    width: 3,
    borderRadius: 1.5,
  },
  micGridCenterRipple: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  /* Uploaded Frame Preview in Banner */
  uploadedFramePreview: {
    width: 66,
    height: 66,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  uploadedFrameAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3B0764',
  },
  uploadedFrameAsset: {
    position: 'absolute',
    top: -5,
    left: -5,
    width: 76,
    height: 76,
    zIndex: 10,
  },
  /* Uploaded Frame in Item Grid */
  gridUploadedFrame: {
    width: 54,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  gridUploadedAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E1B4B',
  },
  gridUploadedAsset: {
    position: 'absolute',
    top: -4,
    left: -4,
    width: 62,
    height: 62,
    zIndex: 10,
  },
  /* Frame & Item Interactive Preview Popup Styles */
  previewModalDialog: {
    width: '100%',
    maxWidth: 350,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  previewModalHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewModalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewShowcaseBox: {
    width: 170,
    height: 170,
    borderRadius: 24,
    backgroundColor: '#FAF5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  popupFrameWrap: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  popupAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#3B0764',
  },
  popupFrameAsset: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: 154,
    height: 154,
    zIndex: 10,
  },
  popupEntryBox: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  popupEntryAsset: {
    width: 140,
    height: 110,
  },
  popupMicBox: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  popupMicRingOuter: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupMicRingInner: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupMicAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  popupMicIconBadge: {
    position: 'absolute',
    bottom: 2,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupBubbleBox: {
    padding: 10,
    alignItems: 'flex-start',
    width: '100%',
  },
  popupBubbleAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginBottom: 6,
  },
  popupBubbleMsg: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    maxWidth: '85%',
  },
  popupBubbleMsgText: {
    fontSize: 12,
    fontWeight: '600',
  },
  popupGenericBox: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupGenericAsset: {
    width: 130,
    height: 130,
  },
  previewTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
    width: '100%',
  },
  previewModalItemTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  previewCategoryBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  previewCategoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7C3AED',
  },
  previewModalItemDesc: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 10,
    lineHeight: 16,
  },
  previewDurationLabel: {
    alignSelf: 'flex-start',
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginTop: 10,
    marginBottom: 6,
  },
  previewBalanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
    paddingHorizontal: 4,
  },
  previewPriceCol: {
    alignItems: 'flex-start',
  },
  previewPriceLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  previewPriceValueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  previewPriceValueText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0891B2',
  },
  previewBalanceCol: {
    alignItems: 'flex-end',
  },
  previewBalanceLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  previewBalanceValueText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  previewActionBtn: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 12,
  },
  previewActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  previewActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
});
