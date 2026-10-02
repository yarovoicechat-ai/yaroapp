import React, { useState, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  FlatList,
  Modal,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset } from '../../utils/safeAreaUtils';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthProvider';
import { getUserAvatar } from '../../utils/avatarUtil';
import AvatarWithFrame from '../../components/AvatarWithFrame';
import { AlertService } from '../../utils/AlertService';
import { apiUtil } from '../../utils/apiUtil';
import { SvgaPlayer } from '@dasimems/react-native-svga';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

const CATEGORIES = ['All', 'Frame', 'Mic Wave', 'Entry', 'Badge', 'Tag', 'Theme', 'Unique ID', 'VIP', 'King of Kings', 'Chat Bubble', 'Tassel'];

const INITIAL_ITEMS = [
  {
    id: 'item-1',
    name: 'Rose frame',
    type: 'Frame',
    validity: 'Permanent',
    inUse: true,
    coverType: 'avatar_frame',
    badgeText: 'HOT',
    previewColor: '#F43F5E',
    description: 'A romantic floral frame with blooming pink roses and glowing sparkle petals.',
  },
  {
    id: 'item-mic-1',
    name: 'Golden Pulse Wave',
    type: 'Mic Wave',
    validity: 'Permanent',
    inUse: true,
    coverType: 'mic_wave',
    badgeText: 'HOT',
    previewColor: '#F59E0B',
    waveColors: ['#F59E0B', '#FBBF24', '#D97706'],
    description: 'Golden radiance audio pulse rings expanding dynamically around your mic seat in party rooms.',
  },
  {
    id: 'item-mic-2',
    name: 'Cyber Neon Wave',
    type: 'Mic Wave',
    validity: '30 Days',
    inUse: false,
    coverType: 'mic_wave',
    badgeText: 'VIP',
    previewColor: '#06B6D4',
    waveColors: ['#06B6D4', '#3B82F6', '#8B5CF6'],
    description: 'High-tech cyan and ultraviolet laser frequency soundwaves pulsating in sync with your voice.',
  },
  {
    id: 'item-mic-3',
    name: 'Love Aura Wave',
    type: 'Mic Wave',
    validity: '30 Days',
    inUse: false,
    coverType: 'mic_wave',
    badgeText: 'SWEET',
    previewColor: '#EC4899',
    waveColors: ['#EC4899', '#F43F5E', '#FB7185'],
    description: 'Charming pastel pink heart soundwave rings creating romantic ambiance when speaking.',
  },
  {
    id: 'item-mic-4',
    name: 'Inferno Flame Wave',
    type: 'Mic Wave',
    validity: 'Permanent',
    inUse: false,
    coverType: 'mic_wave',
    badgeText: 'SVIP',
    previewColor: '#EF4444',
    waveColors: ['#EF4444', '#F97316', '#DC2626'],
    description: 'Explosive molten crimson shockwaves that ignite the room whenever you take the mic.',
  },
  {
    id: 'item-2',
    name: 'Star Entry',
    type: 'Entry',
    validity: '7 Days',
    inUse: false,
    coverType: 'portal_entry',
    badgeText: 'VIP',
    previewColor: '#A855F7',
    description: 'Radiant neon cosmic portal that lights up the entire room upon your arrival.',
  },
  {
    id: 'item-3',
    name: 'VIP Badge',
    type: 'Badge',
    validity: 'Permanent',
    inUse: true,
    coverType: 'vip_badge',
    badgeText: 'EXCLUSIVE',
    previewColor: '#F59E0B',
    description: 'Golden royal 3D crown badge displayed prominently next to your name.',
  },
  {
    id: 'item-4',
    name: 'Love Tag',
    type: 'Tag',
    validity: '30 Days',
    inUse: false,
    coverType: 'love_tag',
    badgeText: 'SWEET',
    previewColor: '#EC4899',
    description: 'A glowing pink heart verified tag showing your warmth and charisma.',
  },
  {
    id: 'item-5',
    name: 'Profile Card',
    type: 'Theme',
    validity: '30 Days',
    inUse: false,
    coverType: 'profile_card',
    badgeText: 'RARE',
    previewColor: '#6366F1',
    description: 'Futuristic holographic glassmorphism profile background with dynamic shimmer.',
  },
  {
    id: 'item-6',
    name: 'Neon Theme',
    type: 'Theme',
    validity: 'Permanent',
    inUse: false,
    coverType: 'neon_theme',
    badgeText: 'NEW',
    previewColor: '#06B6D4',
    description: 'Dark cyber neon party room ambiance with pulsing equalizer audio effects.',
  },
  {
    id: 'item-7',
    name: 'Dragon Entry',
    type: 'Entry',
    validity: '15 Days',
    inUse: false,
    coverType: 'portal_entry',
    badgeText: 'SVIP',
    previewColor: '#E11D48',
    description: 'A mythical flaming golden dragon sweeps across the room declaring your arrival.',
  },
  {
    id: 'item-8',
    name: 'Gold Angel Wings',
    type: 'Frame',
    validity: 'Permanent',
    inUse: false,
    coverType: 'avatar_frame',
    badgeText: 'MYTHIC',
    previewColor: '#D97706',
    description: 'Glorious animated golden angel wings embracing your profile avatar.',
  },
];

export default function MyItems() {
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const navigation = useNavigation();
  const { user, equippedFrame, setEquippedFrame, equippedMicWave, setEquippedMicWave } = useContext(AuthContext);

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [items, setItems] = useState(() => {
    const activeFrame = user?.equippedFrame || equippedFrame || 'Rose frame';
    const activeWave = user?.equippedMicWave || equippedMicWave || 'Golden Pulse Wave';
    return INITIAL_ITEMS.slice(0, 2).map((it) => {
      if (it.type === 'Frame') {
        return { ...it, inUse: it.name.toLowerCase() === activeFrame.toLowerCase() };
      }
      if (it.type === 'Mic Wave') {
        return { ...it, inUse: it.name.toLowerCase() === activeWave.toLowerCase() };
      }
      return it;
    });
  });
  const [previewModalItem, setPreviewModalItem] = useState(null);

  useFocusEffect(useCallback(() => {
    let active = true;
    apiUtil.get('/store/inventory', { suppressGlobalError: true })
      .then(response => {
        if (!active) return;
        const owned = response?.data?.data?.items || [];
        const mapped = owned.map(entry => ({
          id: String(entry._id),
          name: entry.name,
          type: entry.category === 'Frames' ? 'Frame' : entry.category,
          validity: entry.expiresAt ? `Until ${new Date(entry.expiresAt).toLocaleDateString()}` : 'Permanent',
          inUse: entry.category === 'Frames'
            ? entry.name === equippedFrame
            : entry.category === 'Mic Wave' && entry.name === equippedMicWave,
          coverType: entry.category === 'Frames' ? 'avatar_frame' : entry.category === 'Entry' ? 'portal_entry' : entry.category === 'Mic Wave' ? 'mic_wave' : '',
          previewColor: '#8B5CF6',
          badgeText: entry.source === 'level' ? 'LEVEL' : 'OWNED',
          description: entry.source === 'level' ? 'Unlocked by your level.' : 'Purchased from Yaro Store.',
          imageUrl: entry.imageUrl,
          animationUrl: entry.animationUrl,
          expiresAt: entry.expiresAt,
        }));
        const defaults = INITIAL_ITEMS.slice(0, 2).map(item => ({
          ...item,
          inUse: item.type === 'Frame' ? item.name === equippedFrame : item.name === equippedMicWave,
        }));
        setItems([...defaults, ...mapped]);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [equippedFrame, equippedMicWave]));

  const filteredItems = items.filter((item) => {
    if (selectedCategory === 'All') return true;
    return item.type.toLowerCase() === selectedCategory.toLowerCase();
  });

  const handleToggleUse = (item) => {
    setItems((prevItems) =>
      prevItems.map((it) => {
        // If equipping within the same type, unequip other item of same type
        if (it.type === item.type) {
          if (it.id === item.id) {
            const newState = !it.inUse;
            if (newState) {
              AlertService.show('Item Equipped', `${it.name} is now active on your profile!`, 'success');
              if (item.type === 'Frame') {
                setEquippedFrame?.(item);
              } else if (item.type === 'Mic Wave') {
                setEquippedMicWave?.(item.name);
              }
            } else {
              AlertService.show('Item Unequipped', `${it.name} has been removed.`, 'info');
              if (item.type === 'Frame') {
                setEquippedFrame?.('default');
              } else if (item.type === 'Mic Wave') {
                setEquippedMicWave?.('');
              }
            }
            return { ...it, inUse: newState };
          } else {
            return { ...it, inUse: false };
          }
        }
        return it;
      })
    );
  };

  const renderItemVisual = (item) => {
    const avatar = getUserAvatar(user);

    const assetUrl = item.animationUrl || item.imageUrl;
    if (assetUrl) {
      const media = /\.svga(?:\?|$)/i.test(item.animationUrl || '')
        ? <SvgaPlayer source={item.animationUrl} style={styles.ownedAsset} loops={0} />
        : <Image source={{ uri: assetUrl }} style={styles.ownedAsset} resizeMode="contain" />;
      if (item.coverType === 'avatar_frame') {
        return (
          <View style={styles.ownedFramePreview}>
            <Image source={avatar} style={styles.ownedFrameAvatar} />
            {media}
          </View>
        );
      }
      return media;
    }

    if (item.coverType === 'avatar_frame') {
      return (
        <View style={styles.avatarFramePreviewWrap}>
          <AvatarWithFrame
            user={user}
            frame={item.name}
            size={68}
            showOnlineDot={false}
          />
        </View>
      );
    }

    if (item.coverType === 'mic_wave') {
      const mainColor = item.previewColor || '#F59E0B';
      return (
        <View style={styles.micWaveCardVisual}>
          <View style={[styles.micWaveOuterRing, { borderColor: mainColor + '35' }]}>
            <View style={[styles.micWaveMiddleRing, { borderColor: mainColor + '65' }]}>
              <LinearGradient
                colors={[mainColor, mainColor + 'CC', '#1E293B']}
                style={styles.micWaveCenterCore}
              >
                <Icon name="mic" size={20} color="#FFFFFF" />
              </LinearGradient>
            </View>
          </View>
          <View style={styles.micWaveFreqRow}>
            <View style={[styles.micWaveBar, { height: 8, backgroundColor: mainColor }]} />
            <View style={[styles.micWaveBar, { height: 16, backgroundColor: mainColor }]} />
            <View style={[styles.micWaveBar, { height: 22, backgroundColor: mainColor }]} />
            <View style={[styles.micWaveBar, { height: 14, backgroundColor: mainColor }]} />
            <View style={[styles.micWaveBar, { height: 9, backgroundColor: mainColor }]} />
          </View>
        </View>
      );
    }

    if (item.coverType === 'portal_entry') {
      return (
        <LinearGradient
          colors={['#1E1B4B', '#3B0764', '#0F172A']}
          style={styles.portalBox}
        >
          <View style={[styles.portalDoorFrame, { borderColor: item.previewColor }]}>
            <MaterialCommunityIcons name="human" size={36} color="#FDF4FF" />
            <View style={[styles.portalRays, { backgroundColor: item.previewColor + '40' }]} />
          </View>
          <View style={styles.sparkleDot1}>
            <Text style={{ fontSize: 9 }}>✨</Text>
          </View>
          <View style={styles.sparkleDot2}>
            <Text style={{ fontSize: 8 }}>⚡</Text>
          </View>
        </LinearGradient>
      );
    }

    if (item.coverType === 'vip_badge') {
      return (
        <View style={styles.badgePreviewWrap}>
          <LinearGradient
            colors={['#F59E0B', '#D97706', '#78350F']}
            style={styles.crownBadgeGraphic}
          >
            <MaterialCommunityIcons name="crown" size={32} color="#FEF3C7" />
            <Text style={styles.crownBadgeText}>VIP</Text>
          </LinearGradient>
        </View>
      );
    }

    if (item.coverType === 'love_tag') {
      return (
        <View style={styles.heartTagPreviewWrap}>
          <LinearGradient
            colors={['#F43F5E', '#EC4899', '#DB2777']}
            style={styles.heartTagGraphic}
          >
            <View style={styles.heartTagCheck}>
              <Icon name="checkmark-circle" size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.heartTagLabel}>Love</Text>
          </LinearGradient>
        </View>
      );
    }

    if (item.coverType === 'profile_card') {
      return (
        <LinearGradient
          colors={['#4F46E5', '#7C3AED', '#EC4899']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.miniCardPreview}
        >
          <View style={styles.miniCardRow}>
            <Image source={avatar} style={styles.miniCardAvatar} resizeMode="cover" />
            <View style={{ flex: 1, marginLeft: 6 }}>
              <View style={styles.miniCardBar1} />
              <View style={styles.miniCardBar2} />
            </View>
            <Icon name="qr-code-outline" size={14} color="#FFF" />
          </View>
        </LinearGradient>
      );
    }

    // Default: neon theme
    return (
      <LinearGradient
        colors={['#0F172A', '#083344', '#164E63']}
        style={styles.neonThemePreview}
      >
        <View style={styles.neonRoomCircle}>
          <Icon name="mic" size={16} color="#22D3EE" />
        </View>
        <View style={styles.neonEqualizerRow}>
          <View style={[styles.eqBar, { height: 10, backgroundColor: '#22D3EE' }]} />
          <View style={[styles.eqBar, { height: 16, backgroundColor: '#F43F5E' }]} />
          <View style={[styles.eqBar, { height: 8, backgroundColor: '#A855F7' }]} />
          <View style={[styles.eqBar, { height: 14, backgroundColor: '#34D399' }]} />
        </View>
      </LinearGradient>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />
      {/* 1. Header Bar */}
      <View style={[styles.headerBar, { paddingTop: topSafeInset + 6 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Icon name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>My Items</Text>

        <TouchableOpacity
          style={styles.storeShortcutBtn}
          onPress={() => navigation.navigate('Frame')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="shopping-outline" size={22} color="#7C3AED" />
        </TouchableOpacity>
      </View>

      {/* 2. Category Filter Pills */}
      <View style={styles.categoriesWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.8}
                style={[
                  styles.categoryPill,
                  isSelected && styles.categoryPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    isSelected && styles.categoryPillTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. Items 2-Column Grid */}
      <ScrollView
        contentContainerStyle={styles.gridScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.gridRow}>
          {filteredItems.map((item) => {
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.itemCard}
                activeOpacity={0.9}
                onPress={() => setPreviewModalItem(item)}
              >
                {/* Visual Preview Container */}
                <View style={styles.previewContainer}>
                  {renderItemVisual(item)}
                </View>

                {/* Info & Title */}
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.name}
                </Text>

                <Text style={styles.itemValidity}>
                  {item.validity}
                </Text>

                {/* Use / In Use Button */}
                {['Frame', 'Mic Wave'].includes(item.type) ? (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => handleToggleUse(item)}
                    style={[styles.actionBtn, item.inUse ? styles.actionBtnInUse : styles.actionBtnUse]}
                  >
                    <Text style={[styles.actionBtnText, item.inUse ? styles.actionBtnTextInUse : styles.actionBtnTextUse]}>
                      {item.inUse ? 'In Use' : 'Use'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.actionBtn}><Text style={styles.actionBtnText}>Owned</Text></View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* 4. Item Detail & Preview Modal */}
      <Modal
        visible={!!previewModalItem}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewModalItem(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {previewModalItem && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{previewModalItem.name}</Text>
                  <TouchableOpacity
                    onPress={() => setPreviewModalItem(null)}
                    style={styles.modalCloseBtn}
                  >
                    <Icon name="close" size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalVisualCenter}>
                  {renderItemVisual(previewModalItem)}
                </View>

                <View style={styles.modalBadgeRow}>
                  <View style={styles.typeTag}>
                    <Text style={styles.typeTagText}>{previewModalItem.type}</Text>
                  </View>
                  <View style={styles.validityTag}>
                    <Icon name="time-outline" size={13} color="#D97706" style={{ marginRight: 3 }} />
                    <Text style={styles.validityTagText}>{previewModalItem.validity}</Text>
                  </View>
                </View>

                <Text style={styles.modalDescription}>
                  {previewModalItem.description}
                </Text>

                {['Frame', 'Mic Wave'].includes(previewModalItem.type) && <TouchableOpacity
                  activeOpacity={0.88}
                  style={[
                    styles.modalActionBtn,
                    previewModalItem.inUse ? styles.modalActionBtnInUse : styles.modalActionBtnUse,
                  ]}
                  onPress={() => {
                    handleToggleUse(previewModalItem);
                    setPreviewModalItem((prev) =>
                      prev ? { ...prev, inUse: !prev.inUse } : null
                    );
                  }}
                >
                  <Text style={styles.modalActionBtnText}>
                    {previewModalItem.inUse ? 'Currently In Use' : 'Equip This Item'}
                  </Text>
                </TouchableOpacity>}
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  ownedFramePreview: {
    width: 86,
    height: 86,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownedFrameAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  ownedAsset: {
    width: 86,
    height: 86,
    position: 'absolute',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
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
    letterSpacing: -0.2,
  },
  storeShortcutBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriesWrapper: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  categoryPillActive: {
    backgroundColor: '#6D28D9',
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  gridScrollContent: {
    padding: 16,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  itemCard: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  previewContainer: {
    width: '100%',
    height: 106,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 3,
  },
  itemValidity: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
    marginBottom: 10,
  },
  actionBtn: {
    width: '100%',
    paddingVertical: 7,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnInUse: {
    backgroundColor: '#DCFCE7',
  },
  actionBtnUse: {
    backgroundColor: '#EDE9FE',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionBtnTextInUse: {
    color: '#16A34A',
  },
  actionBtnTextUse: {
    color: '#7C3AED',
  },

  /* Visual Preview Styles */
  avatarFramePreviewWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  roseFrameBorder: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: '#FFE4E6',
  },
  avatarInnerImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  frameFlowerDecor1: {
    position: 'absolute',
    top: -5,
    right: -3,
  },
  frameFlowerDecor2: {
    position: 'absolute',
    bottom: -4,
    left: -4,
  },
  frameFlowerDecor3: {
    position: 'absolute',
    top: -3,
    left: -2,
  },
  portalBox: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  portalDoorFrame: {
    width: 46,
    height: 68,
    borderWidth: 2.5,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  portalRays: {
    position: 'absolute',
    width: 58,
    height: 80,
    borderRadius: 12,
    zIndex: -1,
  },
  sparkleDot1: {
    position: 'absolute',
    top: 10,
    right: 18,
  },
  sparkleDot2: {
    position: 'absolute',
    bottom: 12,
    left: 20,
  },
  badgePreviewWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  crownBadgeGraphic: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  crownBadgeText: {
    color: '#FFFBEB',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginTop: -2,
  },
  heartTagPreviewWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartTagGraphic: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 24,
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  heartTagCheck: {
    marginRight: 4,
  },
  heartTagLabel: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  miniCardPreview: {
    width: '90%',
    height: 56,
    borderRadius: 10,
    padding: 8,
    justifyContent: 'center',
  },
  miniCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniCardAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  miniCardBar1: {
    width: '60%',
    height: 5,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    marginBottom: 4,
  },
  miniCardBar2: {
    width: '40%',
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  neonThemePreview: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  neonRoomCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#22D3EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    backgroundColor: 'rgba(34, 211, 238, 0.15)',
  },
  neonEqualizerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  eqBar: {
    width: 4,
    borderRadius: 2,
  },

  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalVisualCenter: {
    width: 140,
    height: 120,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  typeTag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  typeTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  validityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
  },
  validityTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  modalDescription: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  modalActionBtn: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 24,
    alignItems: 'center',
  },
  modalActionBtnUse: {
    backgroundColor: '#7C3AED',
  },
  modalActionBtnInUse: {
    backgroundColor: '#10B981',
  },
  modalActionBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  /* Mic Wave Visual */
  micWaveCardVisual: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micWaveOuterRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micWaveMiddleRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micWaveCenterCore: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micWaveFreqRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    marginTop: 6,
  },
  micWaveBar: {
    width: 3,
    borderRadius: 1.5,
  },
});
