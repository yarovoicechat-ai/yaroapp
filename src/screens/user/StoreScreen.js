import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Dimensions,
  Modal,
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
import { SvgaPlayer } from '@dasimems/react-native-svga';

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

const StoreAsset = ({ item, style, resizeMode = 'contain' }) => {
  const animationUrl = item?.animationUrl;
  const sourceUrl = animationUrl || item?.imageUrl;
  if (!sourceUrl) return null;
  if (/\.svga(?:\?|$)/i.test(animationUrl || '')) {
    return <SvgaPlayer source={animationUrl} style={style} loops={0} />;
  }
  return <Image source={{ uri: sourceUrl }} style={style} resizeMode={resizeMode} />;
};

// Store categories: Unique ID, Frames, Chat Bubble, Theme, Tassel, Entry, Mic Wave, Profile Card, Room Card, Profile Entry, VIP, King of Kings, Badge, Tag
const STORE_CATEGORIES = ['Unique ID', 'Frames', 'Chat Bubble', 'Theme', 'Tassel', 'Entry', 'Mic Wave', 'Profile Card', 'Room Card', 'Profile Entry', 'VIP', 'King of Kings', 'Badge', 'Tag'];

const STORE_CATALOG = {
  'Unique ID': [
    {
      id: 'uid-1',
      name: '88888 (Fortune Gold)',
      number: '88888',
      digits: '5-Digit',
      price: 50000,
      validity: 'Permanent',
      previewColor: '#F59E0B',
      bgColors: ['#78350F', '#B45309', '#D97706'],
      icon: 'numeric-8-circle',
      tag: 'Royal Gold',
      desc: 'Exclusive 5-digit lucky fortune ID with golden profile shine and room entrance highlight.',
    },
    {
      id: 'uid-2',
      name: '99999 (Crown Emperor)',
      number: '99999',
      digits: '5-Digit',
      price: 60000,
      validity: 'Permanent',
      previewColor: '#8B5CF6',
      bgColors: ['#3B0764', '#581C87', '#7C3AED'],
      icon: 'numeric-9-circle',
      tag: 'Imperial',
      desc: 'Supreme 5-digit Emperor ID with purple royal aura and permanent verified profile mark.',
    },
    {
      id: 'uid-3',
      name: '77777 (Jackpot Lucky)',
      number: '77777',
      digits: '5-Digit',
      price: 45000,
      validity: 'Permanent',
      previewColor: '#10B981',
      bgColors: ['#064E3B', '#065F46', '#059669'],
      icon: 'numeric-7-circle',
      tag: 'Lucky 7',
      desc: 'Lucky 77777 sequence with clover highlight and lucky emerald room greeting.',
    },
    {
      id: 'uid-4',
      name: '1314520 (Forever Romance)',
      number: '1314520',
      digits: '7-Digit',
      price: 35000,
      validity: 'Permanent',
      previewColor: '#EC4899',
      bgColors: ['#831843', '#9D174D', '#DB2777'],
      icon: 'heart-circle',
      tag: 'Romance',
      desc: 'Special romance sequence meaning "Love You For A Lifetime" with floating hearts badge.',
    },
    {
      id: 'uid-5',
      name: '666666 (Smooth Victory)',
      number: '666666',
      digits: '6-Digit',
      price: 30000,
      validity: 'Permanent',
      previewColor: '#06B6D4',
      bgColors: ['#164E63', '#155E75', '#0891B2'],
      icon: 'numeric-6-circle',
      tag: 'Grand Hex',
      desc: 'Six-digit repeating victory ID with laser cyan banner and custom badge tag.',
    },
    {
      id: 'uid-6',
      name: '100000 (Century Milestone)',
      number: '100000',
      digits: '6-Digit',
      price: 40000,
      validity: 'Permanent',
      previewColor: '#64748B',
      bgColors: ['#1E293B', '#334155', '#475569'],
      icon: 'star-circle',
      tag: 'Century',
      desc: 'Clean 100,000 Century luxury milestone ID with silver titanium sheen.',
    },
    {
      id: 'uid-7',
      name: '8888 (Ultra Sovereign 4-Digit)',
      number: '8888',
      digits: '4-Digit',
      price: 150000,
      validity: 'Permanent',
      previewColor: '#F59E0B',
      bgColors: ['#451A03', '#78350F', '#B45309'],
      icon: 'crown',
      tag: 'Ultra Rare',
      desc: 'Ultra exclusive 4-digit Sovereign ID with global marquee room entrance broadcast.',
    },
    {
      id: 'uid-8',
      name: '9999 (Diamond Monarch 4-Digit)',
      number: '9999',
      digits: '4-Digit',
      price: 180000,
      validity: 'Permanent',
      previewColor: '#0284C7',
      bgColors: ['#082F49', '#0C4A6E', '#0284C7'],
      icon: 'diamond-stone',
      tag: 'Prestige',
      desc: 'Supreme 4-digit diamond series ID with permanent crown border & anti-kick privilege.',
    },
  ],
  'Chat Bubble': [
    {
      id: 'bb-1',
      name: 'Golden Glow Bubble',
      price: 350,
      validity: '30 Days',
      previewColor: '#F59E0B',
      bubbleBg: '#FEF3C7',
      bubbleBorder: '#F59E0B',
      bubbleText: '#92400E',
      icon: 'chat-processing',
      tag: 'Gold Shimmer',
      desc: 'All your chat and party messages appear in an opulent golden gradient speech bubble.',
    },
    {
      id: 'bb-2',
      name: 'Cyber Neon Bubble',
      price: 400,
      validity: '30 Days',
      previewColor: '#06B6D4',
      bubbleBg: '#083344',
      bubbleBorder: '#06B6D4',
      bubbleText: '#E0F2FE',
      icon: 'message-text',
      tag: 'Cyberpunk',
      desc: 'Electric cyan & neon violet glowing speech box with high-tech laser border.',
    },
    {
      id: 'bb-3',
      name: 'Pink Sakura Blossom',
      price: 300,
      validity: '30 Days',
      previewColor: '#EC4899',
      bubbleBg: '#FDF2F8',
      bubbleBorder: '#F472B6',
      bubbleText: '#9D174D',
      icon: 'flower',
      tag: 'Romantic',
      desc: 'Romantic pastel pink floral bubble with drifting cherry blossom petal accents.',
    },
    {
      id: 'bb-4',
      name: 'Purple Crystal Box',
      price: 450,
      validity: '30 Days',
      previewColor: '#8B5CF6',
      bubbleBg: '#2E1065',
      bubbleBorder: '#A78BFA',
      bubbleText: '#EDE9FE',
      icon: 'cube-outline',
      tag: 'Royal Gem',
      desc: 'Deep royal amethyst crystal bubble with gem light refraction along text lines.',
    },
    {
      id: 'bb-5',
      name: 'Flame Inferno Bubble',
      price: 500,
      validity: '30 Days',
      previewColor: '#EF4444',
      bubbleBg: '#450A0A',
      bubbleBorder: '#EF4444',
      bubbleText: '#FEE2E2',
      icon: 'fire',
      tag: 'Hot Inferno',
      desc: 'Blazing animated flame border bubble with red magma accents on your text.',
    },
    {
      id: 'bb-6',
      name: 'Midnight Galaxy Bubble',
      price: 420,
      validity: '30 Days',
      previewColor: '#4338CA',
      bubbleBg: '#1E1B4B',
      bubbleBorder: '#6366F1',
      bubbleText: '#E0E7FF',
      icon: 'planet',
      tag: 'Deep Cosmos',
      desc: 'Deep space cosmic nebula with twinkling starlight message background.',
    },
  ],
  Theme: [
    {
      id: 'th-1',
      name: 'Cyberpunk Neon City',
      price: 1500,
      validity: '30 Days',
      previewColor: '#06B6D4',
      bgColors: ['#030712', '#0F172A', '#1E1B4B'],
      icon: 'city-variant',
      tag: 'Futuristic',
      desc: 'Glowing futuristic high-tech skyscraper skyline wallpaper for voice rooms & profile.',
    },
    {
      id: 'th-2',
      name: 'Imperial Golden Palace',
      price: 2200,
      validity: '30 Days',
      previewColor: '#F59E0B',
      bgColors: ['#451A03', '#78350F', '#B45309'],
      icon: 'castle',
      tag: 'Royal Palace',
      desc: 'Royal palace grand hall with magnificent golden pillars, chandeliers and velvet carpets.',
    },
    {
      id: 'th-3',
      name: 'Sakura Blossom Spring',
      price: 1200,
      validity: '30 Days',
      previewColor: '#EC4899',
      bgColors: ['#500724', '#831843', '#BE185D'],
      icon: 'image-filter-hdr',
      tag: 'Spring Love',
      desc: 'Enchanting Japanese spring garden with soft cherry blossoms drifting across the screen.',
    },
    {
      id: 'th-4',
      name: 'Deep Space Galaxy',
      price: 1800,
      validity: '30 Days',
      previewColor: '#8B5CF6',
      bgColors: ['#0F172A', '#1E1B4B', '#4C1D95'],
      icon: 'orbit',
      tag: 'Infinite Space',
      desc: 'Infinite starry cosmos, swirling purple nebula clouds and glowing planets in background.',
    },
    {
      id: 'th-5',
      name: 'Ocean Sunset Beach',
      price: 1100,
      validity: '30 Days',
      previewColor: '#F97316',
      bgColors: ['#1E1B4B', '#7C2D12', '#C2410C'],
      icon: 'beach',
      tag: 'Tropical Sun',
      desc: 'Golden tropical sunset over tranquil turquoise ocean waves and palm silhouettes.',
    },
    {
      id: 'th-6',
      name: 'Velvet VIP Casino',
      price: 2500,
      validity: '30 Days',
      previewColor: '#E11D48',
      bgColors: ['#18181B', '#3F3F46', '#881337'],
      icon: 'cards-playing-outline',
      tag: 'Casino Royale',
      desc: 'Ultra luxury dark velvet lounge with champagne, poker chips, and neon club lighting.',
    },
  ],
  Tassel: [
    {
      id: 'ts-1',
      name: 'Imperial Gold Silk Tassel',
      price: 600,
      validity: '30 Days',
      previewColor: '#F59E0B',
      icon: 'ribbon',
      tag: 'Silk Gold',
      desc: 'Traditional royal golden silk tassel hanging gracefully beside your room mic seat.',
    },
    {
      id: 'ts-2',
      name: 'Ruby Crystal Lotus Tassel',
      price: 750,
      validity: '30 Days',
      previewColor: '#E11D48',
      icon: 'diamond',
      tag: 'Cut Ruby',
      desc: 'Deep crimson cut crystal lotus pendant with fine dangling silk cords on your seat.',
    },
    {
      id: 'ts-3',
      name: 'Emerald Jade Phoenix Tassel',
      price: 900,
      validity: '30 Days',
      previewColor: '#10B981',
      icon: 'shield-star',
      tag: 'Jade Wealth',
      desc: 'Carved auspicious jade medallion with flowing emerald green cords bringing fortune.',
    },
    {
      id: 'ts-4',
      name: 'Cyberpunk Neon LED Tassel',
      price: 650,
      validity: '30 Days',
      previewColor: '#06B6D4',
      icon: 'lightning-bolt',
      tag: 'Neon Pulse',
      desc: 'Electric cyan and neon magenta glowing fiber-optic tassel ribbons that pulse with music.',
    },
    {
      id: 'ts-5',
      name: 'Diamond Chandelier Tassel',
      price: 1200,
      validity: '30 Days',
      previewColor: '#38BDF8',
      icon: 'shimmer',
      tag: 'Chandelier',
      desc: 'Brilliant sparkling diamond droplets that shimmer in the mic seat when you speak.',
    },
    {
      id: 'ts-6',
      name: 'Sacred Silver Bell Tassel',
      price: 500,
      validity: '30 Days',
      previewColor: '#94A3B8',
      icon: 'bell-ring-outline',
      tag: 'Silver Chime',
      desc: 'Delicate engraved silver bells and pure white silk tassels with gentle ringing effect.',
    },
  ],
  'Mic Wave': [
    {
      id: 'mw-1',
      name: 'Golden Pulse Wave',
      price: 600,
      validity: '30 Days',
      previewColor: '#F59E0B',
      waveColors: ['#F59E0B', '#FBBF24', '#D97706'],
      icon: 'waveform',
      tag: 'Gold Pulse',
      desc: 'Radiant golden ripples expanding outward dynamically around your mic seat in party rooms.',
    },
    {
      id: 'mw-2',
      name: 'Cyber Neon Wave',
      price: 750,
      validity: '30 Days',
      previewColor: '#06B6D4',
      waveColors: ['#06B6D4', '#3B82F6', '#8B5CF6'],
      icon: 'sine-wave',
      tag: 'Cyber Neon',
      desc: 'High-tech cyan & ultraviolet laser frequency soundwaves pulsating in sync with your voice.',
    },
    {
      id: 'mw-3',
      name: 'Love Aura Wave',
      price: 500,
      validity: '30 Days',
      previewColor: '#EC4899',
      waveColors: ['#EC4899', '#F43F5E', '#FB7185'],
      icon: 'heart-pulse',
      tag: 'Sweet Aura',
      desc: 'Charming pastel pink heart soundwave rings creating romantic ambiance when speaking.',
    },
    {
      id: 'mw-4',
      name: 'Inferno Flame Wave',
      price: 900,
      validity: '30 Days',
      previewColor: '#EF4444',
      waveColors: ['#EF4444', '#F97316', '#DC2626'],
      icon: 'fire',
      tag: 'Blaze Wave',
      desc: 'Explosive molten crimson shockwaves that ignite the room whenever you take the mic.',
    },
    {
      id: 'mw-5',
      name: 'Amethyst Stardust Wave',
      price: 800,
      validity: '30 Days',
      previewColor: '#A855F7',
      waveColors: ['#A855F7', '#C084FC', '#7E22CE'],
      icon: 'star-shooting',
      tag: 'Stardust',
      desc: 'Mystical purple astral stardust particles and concentric cosmic rings around your avatar.',
    },
    {
      id: 'mw-6',
      name: 'Emerald Aurora Wave',
      price: 850,
      validity: '30 Days',
      previewColor: '#10B981',
      waveColors: ['#10B981', '#34D399', '#059669'],
      icon: 'weather-windy',
      tag: 'Aurora',
      desc: 'Luminous northern lights wave flowing smoothly in soothing emerald and mint ripples.',
    },
  ],
  Frames: [
    { id: 'f-1', name: 'Golden Royal Crown', price: 500, validity: '30 Days', previewColor: '#F59E0B', icon: 'crown', tag: 'Royal', desc: 'Shimmering pure gold crown with animated sparkles around avatar.' },
    { id: 'f-2', name: 'Rose Blossom Frame', price: 300, validity: 'Permanent', previewColor: '#F43F5E', icon: 'flower', tag: 'Floral', desc: 'Romantic blooming pink rose petals continuously framing your profile.' },
    { id: 'f-3', name: 'Cyber Neon Ring', price: 450, validity: '30 Days', previewColor: '#06B6D4', icon: 'radioactive', tag: 'High-Tech', desc: 'Glowing turquoise and neon violet cyberpunk ring with revolving laser dots.' },
    { id: 'f-4', name: 'Divine Angel Wings', price: 800, validity: 'Permanent', previewColor: '#EAB308', icon: 'wing', tag: 'Celestial', desc: 'Divine fluttering angel wings framing your profile photo in rooms.' },
    { id: 'f-5', name: 'Dragon Emperor Frame', price: 1500, validity: '30 Days', previewColor: '#EF4444', icon: 'fire', tag: 'Legendary', desc: 'Fierce golden-red dragon coiled around your profile emitting flaming aura.' },
    { id: 'f-6', name: 'Celestial Cosmos Frame', price: 2000, validity: '30 Days', previewColor: '#8B5CF6', icon: 'orbit', tag: 'Mythic', desc: 'Revolving planetary rings with sparkling purple stardust and aurora.' },
  ],
  Entry: [
    { id: 'e-1', name: 'Sports Car Entry', price: 1200, validity: '30 Days', previewColor: '#EC4899', icon: 'car-sports', tag: 'Supercar', desc: 'A 3D sports car sweeps across the room upon your arrival with engine roars.' },
    { id: 'e-2', name: 'Golden Dragon Flight', price: 2500, validity: '30 Days', previewColor: '#E11D48', icon: 'fire', tag: 'Mythic', desc: 'A mythical flaming golden dragon sweeps through the room announcing your presence.' },
    { id: 'e-3', name: 'Galaxy Space Portal', price: 900, validity: '15 Days', previewColor: '#8B5CF6', icon: 'planet', tag: 'Cosmic', desc: 'Cosmic space portal with swirling stars on room entry and sound effect.' },
    { id: 'e-4', name: 'Cyber Battleship Entry', price: 3500, validity: '30 Days', previewColor: '#06B6D4', icon: 'rocket-launch', tag: 'Supreme', desc: 'Giant futuristic mothership warp-in with laser light show and banners.' },
    { id: 'e-5', name: 'Pegasus Celestial Carriage', price: 4000, validity: '30 Days', previewColor: '#F59E0B', icon: 'horse', tag: 'Imperial', desc: 'Winged pegasus drawing a golden royal carriage with fireworks explosion.' },
  ],
  VIP: [
    { id: 'v-1', name: 'SVIP 1-Month Pass', price: 2999, validity: '30 Days', previewColor: '#7C3AED', icon: 'crown', tag: 'Noble VIP', desc: 'Unlock all basic privileges, entry badges, free mic decoration, and 100 bonus XP.' },
    { id: 'v-2', name: 'SVIP 3-Month Pass', price: 7999, validity: '90 Days', previewColor: '#BE185D', icon: 'shield-crown', tag: 'King SVIP', desc: 'Unlock premium anti-kick protection, exclusive supercar entry, frames, and 400 XP.' },
  ],
  Badge: [
    { id: 'bd-1', name: 'Legendary Master Badge', price: 1500, validity: '30 Days', previewColor: '#F59E0B', icon: 'shield-star', tag: 'Master', desc: 'Golden master badge displayed prominently on your profile.' },
    { id: 'bd-2', name: 'Diamond Heart Donor', price: 2000, validity: '30 Days', previewColor: '#EC4899', icon: 'heart-flash', tag: 'Top Donor', desc: 'Exclusive shining diamond heart badge celebrating generous patrons.' },
  ],
  Tag: [
    { id: 'tg-1', name: 'Imperial Majesty Tag', price: 800, validity: '30 Days', previewColor: '#F59E0B', icon: 'tag', tag: 'Imperial', desc: 'Glowing imperial name tag shown in voice chat user lists.' },
    { id: 'tg-2', name: 'Cyber Hero Tag', price: 600, validity: '30 Days', previewColor: '#06B6D4', icon: 'label-variant', tag: 'Cyber Hero', desc: 'Neon cyan laser title tag alongside your nickname.' },
  ],
};

export default function StoreScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 24);
  const { user, fetchUserProfile } = useContext(AuthContext);

  const [catalog, setCatalog] = useState(STORE_CATALOG);
  const [activeCategory, setActiveCategory] = useState('Unique ID');
  const [selectedItem, setSelectedItem] = useState(STORE_CATALOG['Unique ID'][0]);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedDurationDays, setSelectedDurationDays] = useState(30);

  useFocusEffect(React.useCallback(() => {
    let isMounted = true;
    const fetchCatalog = async () => {
      try {
        const response = await apiUtil.get('/store/items', { params: { activeOnly: true } });
        const payload = response?.data?.data || response?.data || {};
        if (isMounted && Array.isArray(payload.items)) {
          const liveCatalog = STORE_CATEGORIES.reduce((result, category) => ({ ...result, [category]: [] }), {});
          payload.items.map(normalizeStoreItem).forEach((item) => {
            const rawCat = String(item.category || '').trim();
            const cat = (rawCat === 'Frame' || rawCat === 'Frames') ? 'Frames'
              : (rawCat === 'Entry' || rawCat === 'Entry Effect' || rawCat === 'Entry Effects' || rawCat === 'Entrance') ? 'Entry'
              : (rawCat === 'Chat Bubble' || rawCat === 'Chat Bubbles') ? 'Chat Bubble'
              : (rawCat === 'Theme' || rawCat === 'Themes') ? 'Theme'
              : (rawCat === 'Tassel' || rawCat === 'Tassels') ? 'Tassel'
              : (rawCat === 'Mic Wave' || rawCat === 'Mic Waves') ? 'Mic Wave'
              : (rawCat === 'Profile Card' || rawCat === 'Profile Cards') ? 'Profile Card'
              : (rawCat === 'Room Card' || rawCat === 'Room Cards') ? 'Room Card'
              : (rawCat === 'Profile Entry' || rawCat === 'Profile Entries') ? 'Profile Entry'
              : rawCat;
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
      } catch (e) {
        // Silently preserve local catalog on offline/network errors
      }
    };
    fetchCatalog();
    return () => {
      isMounted = false;
    };
  }, []));

  const currentDiamonds = Number(user?.diamonds || 0);
  const items = catalog[activeCategory] || STORE_CATALOG[activeCategory] || [];
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
      AlertService.show('Store unavailable', 'Connect to the internet and reopen the store to buy this item.', 'error');
      return;
    }

    if (currentDiamonds < selectedPrice) {
      setConfirmModalVisible(false);
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

      AlertService.show(
        'Purchase Successful 🎉',
        `You purchased ${selectedItem.name} for ${selectedDurationDays} days. It is now available in your Inventory / Profile.`,
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
              <Text style={styles.idNumberDigits}>{item?.number || '88888'}</Text>
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
      const hasUploadedFrame = Boolean(item?.animationUrl || item?.imageUrl);
      return (
        <LinearGradient
          colors={['#4C1D95', '#6D28D9', '#7C3AED']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.previewCard}
        >
          <View style={styles.framePreviewRow}>
            <View style={styles.previewAvatarWrap}>
              {hasUploadedFrame ? (
                <View style={styles.uploadedFramePreview}>
                  <Image source={getUserAvatar(user)} style={styles.uploadedFrameAvatar} />
                  <StoreAsset item={item} style={styles.uploadedFrameAsset} />
                </View>
              ) : (
                <AvatarWithFrame
                  user={user}
                  frame={item ? item.name : 'Rose frame'}
                  size={66}
                  showOnlineDot={false}
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
          <Text style={styles.balanceText}>{currentDiamonds.toLocaleString()}</Text>
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
                  if (activeCategory === 'VIP' || activeCategory === 'King of Kings') setDetailModalVisible(true);
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
                    {item.animationUrl || item.imageUrl ? (
                      <View style={styles.gridUploadedFrame}>
                        <Image source={getUserAvatar(user)} style={styles.gridUploadedAvatar} />
                        <StoreAsset item={item} style={styles.gridUploadedAsset} />
                      </View>
                    ) : (
                      <AvatarWithFrame
                        user={user}
                        frame={item.name}
                        size={54}
                        showOnlineDot={false}
                      />
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
                  onPress={() => handleOpenPurchase(item)}
                  activeOpacity={0.8}
                >
                  <Icon name="diamond" size={12} color="#06B6D4" style={{ marginRight: 4 }} />
                  <Text style={styles.buyBtnText}>From {Math.min(...getPriceOptions(item).map(option => option.diamonds)).toLocaleString()}</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* VIP and King of Kings included items */}
      <Modal visible={detailModalVisible} transparent animationType="fade" onRequestClose={() => setDetailModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalDialog}>
            <TouchableOpacity onPress={() => setDetailModalVisible(false)} style={styles.detailClose}>
              <Icon name="close" size={22} color="#64748B" />
            </TouchableOpacity>
            <View style={styles.detailPreview}>
              {selectedItem?.animationUrl || selectedItem?.imageUrl ? (
                <StoreAsset item={selectedItem} style={styles.detailAsset} />
              ) : (
                <MaterialCommunityIcons name="crown" size={58} color={selectedItem?.previewColor || '#F59E0B'} />
              )}
            </View>
            <Text style={styles.modalTitle}>{selectedItem?.name}</Text>
            <Text style={styles.modalSub}>{selectedItem?.desc}</Text>
            <Text style={styles.detailHeading}>Included with this {activeCategory} item</Text>
            {(selectedItem?.benefits?.length ? selectedItem.benefits : [selectedItem?.desc || 'Premium membership']).map((benefit, index) => (
              <View key={`${index}-${benefit}`} style={styles.detailBenefitRow}>
                <Icon name="checkmark-circle" size={17} color="#10B981" />
                <Text style={styles.detailBenefitText}>{benefit}</Text>
              </View>
            ))}
            <TouchableOpacity style={styles.detailBuyButton} onPress={() => {
              setDetailModalVisible(false);
              handleOpenPurchase(selectedItem);
            }}>
              <Text style={styles.modalConfirmText}>Choose Duration & Buy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Purchase Confirmation Modal */}
      <Modal
        visible={confirmModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalDialog}>
            <View style={[styles.modalVisualWrap, { backgroundColor: `${selectedItem?.previewColor}20` }]}>
              {selectedItem?.animationUrl || selectedItem?.imageUrl ? (
                <StoreAsset item={selectedItem} style={styles.modalAsset} />
              ) : (
                <MaterialCommunityIcons name={selectedItem?.icon || 'gift'} size={46} color={selectedItem?.previewColor || '#7C3AED'} />
              )}
            </View>

            <Text style={styles.modalTitle}>Confirm Purchase</Text>
            <Text style={styles.modalSub}>
              Choose how long you want to unlock <Text style={{ fontWeight: '700', color: '#0F172A' }}>{selectedItem?.name}</Text>.
            </Text>

            <View style={styles.durationOptionsRow}>
              {selectedPriceOptions.map(option => {
                const active = selectedDurationDays === option.days;
                return (
                  <TouchableOpacity
                    key={option.days}
                    style={[styles.durationOption, active && styles.durationOptionActive]}
                    onPress={() => setSelectedDurationDays(option.days)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.durationDaysText, active && styles.durationDaysTextActive]}>{option.days} Days</Text>
                    <View style={styles.durationDiamondRow}>
                      <Icon name="diamond" size={11} color={active ? '#FFFFFF' : '#0891B2'} />
                      <Text style={[styles.durationPriceText, active && styles.durationPriceTextActive]}>{option.diamonds.toLocaleString()}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalPriceRow}>
              <Text style={styles.modalPriceLabel}>Cost:</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Icon name="diamond" size={16} color="#06B6D4" style={{ marginRight: 4 }} />
                <Text style={styles.modalPriceValue}>{selectedPrice.toLocaleString()} Diamonds</Text>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setConfirmModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleConfirmPurchase}
                disabled={purchasing}
              >
                <LinearGradient
                  colors={['#7C3AED', '#6D28D9']}
                  style={styles.modalConfirmGradient}
                >
                  <Text style={styles.modalConfirmText}>
                    {purchasing ? 'Purchasing...' : 'Confirm & Unlock'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  durationOptionsRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 7,
    marginBottom: 14,
  },
  durationOption: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingVertical: 9,
    backgroundColor: '#F8FAFC',
  },
  durationOptionActive: {
    borderColor: '#7C3AED',
    backgroundColor: '#7C3AED',
  },
  durationDaysText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  durationDaysTextActive: {
    color: '#FFFFFF',
  },
  durationDiamondRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  durationPriceText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0E7490',
  },
  durationPriceTextActive: {
    color: '#FFFFFF',
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
});
