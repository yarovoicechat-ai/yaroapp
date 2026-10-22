import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiUtil } from '../../utils/apiUtil';
import { AlertService } from '../../utils/AlertService';
import { ROOM_THEME_CATALOG, DEFAULT_ROOM_BG, SEAT_SKIN_CATALOG } from '../../utils/cosmeticResolver';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

const FALLBACK_ROOM_THEMES = [
  {
    id: 'default',
    itemId: 'default',
    name: 'Default Twilight',
    coverImage: DEFAULT_ROOM_BG,
    bgColors: ['#3A0E5C', '#1E0A3C', '#0B031E'],
    previewColor: '#9333EA',
    desc: 'Default Yaro room theme with twilight beach & ambient neon glow',
    isPreset: true,
    isFree: true,
  },
  {
    id: 'cyber_neon',
    itemId: 'cyber_neon',
    name: 'Cyber Neon',
    coverImage: null,
    bgColors: ['#031B33', '#062B4E', '#010E1D'],
    previewColor: '#06B6D4',
    desc: 'Futuristic electric blue neon gaming pod theme',
    isPreset: true,
    isFree: true,
  },
  {
    id: 'royal_gold',
    itemId: 'royal_gold',
    name: 'Imperial Gold',
    coverImage: null,
    bgColors: ['#3D2406', '#261603', '#130B01'],
    previewColor: '#F59E0B',
    desc: 'Majestic 24k golden palace with warm amber reflections',
    isPreset: true,
    isFree: true,
  },
  {
    id: 'sakura_blossom',
    itemId: 'sakura_blossom',
    name: 'Sakura Dream',
    coverImage: null,
    bgColors: ['#3D0B24', '#260616', '#14030B'],
    previewColor: '#EC4899',
    desc: 'Enchanted cherry blossom garden in midnight bloom',
    isPreset: true,
    isFree: true,
  },
  {
    id: 'galaxy_cosmos',
    itemId: 'galaxy_cosmos',
    name: 'Cosmic Galaxy',
    coverImage: null,
    bgColors: ['#1A0C3D', '#0F0626', '#060212'],
    previewColor: '#8B5CF6',
    desc: 'Deep space stars, nebula gradients and cosmic dust',
    isPreset: true,
    isFree: true,
  },
  {
    id: 'sunset_glow',
    itemId: 'sunset_glow',
    name: 'Sunset Twilight',
    coverImage: null,
    bgColors: ['#3F1523', '#270C15', '#120409'],
    previewColor: '#F97316',
    desc: 'Atmospheric crimson sunset with velvet violet horizon',
    isPreset: true,
    isFree: true,
  },
];

const PRESET_THEMES = (Array.isArray(ROOM_THEME_CATALOG) && ROOM_THEME_CATALOG.length > 0
  ? ROOM_THEME_CATALOG
  : FALLBACK_ROOM_THEMES
).map((item) => ({
  id: String(item?.id || 'default'),
  itemId: String(item?.itemId || item?.id || 'default'),
  name: item?.name || item?.id || 'Theme',
  coverImage: item?.coverImage !== undefined ? item.coverImage : (item?.id === 'default' ? DEFAULT_ROOM_BG : null),
  bgColors: Array.isArray(item?.bgColors) && item.bgColors.length >= 2 ? item.bgColors : ['#3A0E5C', '#1E0A3C', '#0B031E'],
  previewColor: item?.previewColor || item?.bgColors?.[0] || '#9333EA',
  desc: item?.desc || 'Yaro room theme',
  isPreset: true,
  isFree: true,
}));

const THEME_SETS = [
  {
    id: 'set_cyber',
    name: 'Cyberpunk Neon Set',
    themeId: 'cyber_neon',
    seatSkinId: 'cyber_pod',
    previewColor: '#06B6D4',
    bgColors: ['#031B33', '#062B4E'],
    desc: 'Futuristic Cyber Neon Room + Cyber Pod Seat',
  },
  {
    id: 'set_gold',
    name: 'Imperial Gold Set',
    themeId: 'royal_gold',
    seatSkinId: 'golden_throne',
    previewColor: '#F59E0B',
    bgColors: ['#3D2406', '#261603'],
    desc: 'Majestic 24k Imperial Room + Imperial Gold Throne',
  },
  {
    id: 'set_sakura',
    name: 'Sakura Garden Set',
    themeId: 'sakura_blossom',
    seatSkinId: 'lotus_throne',
    previewColor: '#EC4899',
    bgColors: ['#3D0B24', '#260616'],
    desc: 'Enchanted Sakura Room + Emerald Lotus Throne',
  },
  {
    id: 'set_phoenix',
    name: 'Phoenix Sovereign Set',
    themeId: 'sunset_glow',
    seatSkinId: 'phoenix_fire',
    previewColor: '#EF4444',
    bgColors: ['#3F1523', '#270C15'],
    desc: 'Sunset Crimson Room + Phoenix Dragon Throne',
  },
];

const normalizeTheme = (inventoryItem) => {
  const catalog = inventoryItem.catalogItem || inventoryItem.itemId || inventoryItem || {};
  const metadata = catalog.metadata || inventoryItem.metadata || {};
  const rawBg = catalog.bgColors || metadata.bgColors;
  const safeBg = Array.isArray(rawBg) && rawBg.length >= 2 ? rawBg : ['#1E1B4B', '#0F172A'];
  const rawCover = catalog.imageUrl || metadata.coverImage || inventoryItem.imageUrl || null;
  const coverImage = typeof rawCover === 'string' && rawCover.trim() ? rawCover.trim() : (typeof rawCover === 'number' ? rawCover : null);

  return {
    ...catalog,
    itemId: String(catalog._id || catalog.id || inventoryItem.itemId || ''),
    id: String(catalog._id || catalog.id || inventoryItem.itemId || ''),
    name: catalog.name || inventoryItem.name || 'Theme',
    category: catalog.category || inventoryItem.category,
    coverImage,
    bgColors: safeBg,
    previewColor: catalog.previewColor || metadata.previewColor || '#8B5CF6',
    desc: catalog.desc || metadata.description || '',
    expiresAt: inventoryItem.expiresAt || null,
    isOwned: Boolean(inventoryItem.isOwned || inventoryItem.catalogItem),
    isFree: Boolean(inventoryItem.isFree || metadata.isFree || Number(catalog.price || 0) === 0),
  };
};

export default function RoomThemeModal({
  visible,
  onClose,
  currentTheme,
  onSelectTheme,
  currentSeatSkin,
  onSelectSeatSkin,
  bottomSafePadding = 16,
}) {
  const insets = useSafeAreaInsets();
  const topInset = insets?.top ?? 0;
  const bottomInset = insets?.bottom ?? 16;
  const [activeTab, setActiveTab] = useState('Room Theme');
  const [themes, setThemes] = useState(PRESET_THEMES);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    let active = true;
    setSelected(String(currentTheme?.itemId || currentTheme?.id || 'default'));
    setLoading(true);

    Promise.allSettled([
      apiUtil.get('/store/inventory'),
      apiUtil.get('/store/items', { params: { category: 'Theme', activeOnly: true } }),
    ])
      .then(([inventoryResult, catalogResult]) => {
        if (!active) return;
        const inventoryResponse = inventoryResult.status === 'fulfilled' ? inventoryResult.value : null;
        const catalogResponse = catalogResult.status === 'fulfilled' ? catalogResult.value : null;
        const items = inventoryResponse?.data?.data?.items || [];
        const ownedThemes = items
          .filter((item) => ['theme', 'themes'].includes(String(item.catalogItem?.category || item.category || '').toLowerCase()))
          .map((item) => normalizeTheme({ ...item, isOwned: true }));

        const catalogPayload = catalogResponse?.data?.data || catalogResponse?.data || {};
        const catalogItems = Array.isArray(catalogPayload) ? catalogPayload : (catalogPayload.items || []);
        const freeRoomToolThemes = catalogItems
          .filter((item) => {
            if (!['theme', 'themes'].includes(String(item.category || '').toLowerCase())) return false;
            const isFree = item.metadata?.isFree === true || Number(item.price || 0) === 0;
            return isFree;
          })
          .map((item) => normalizeTheme({ ...item, isFree: true }));

        const byId = new Map();
        PRESET_THEMES.forEach((t) => byId.set(t.id, t));
        ownedThemes.forEach((t) => byId.set(t.itemId, { ...(byId.get(t.itemId) || {}), ...t, isOwned: true }));
        freeRoomToolThemes.forEach((t) => byId.set(t.itemId, { ...(byId.get(t.itemId) || {}), ...t, isFree: true }));

        const merged = Array.from(byId.values());
        setThemes(merged.length > 0 ? merged : PRESET_THEMES);
      })
      .catch(() => {
        if (active) setThemes(PRESET_THEMES);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [visible, currentTheme]);

  if (!visible) return null;

  const handleApplyTheme = (themeItem) => {
    try {
      if (onSelectTheme) onSelectTheme(themeItem);
      setSelected(String(themeItem.itemId || themeItem.id || 'default'));
      AlertService.show('Theme Applied! ✨', `"${themeItem.name}" room theme is now active for all visitors.`, 'success');
      onClose();
    } catch (e) {
      console.warn('Theme apply error:', e);
      onClose();
    }
  };

  const handleApplySeatSkin = (seatItem) => {
    try {
      if (onSelectSeatSkin) onSelectSeatSkin(seatItem);
      AlertService.show('Mic Skin Applied! 🎤', `"${seatItem.name}" mic skin is now active for all seats.`, 'success');
      onClose();
    } catch (e) {
      console.warn('Seat skin apply error:', e);
      onClose();
    }
  };

  const handleApplyThemeSet = (themeSet) => {
    try {
      const targetTheme = PRESET_THEMES.find((t) => t.id === themeSet.themeId) || PRESET_THEMES[0];
      const targetSeatSkin = (SEAT_SKIN_CATALOG || []).find((s) => s.id === themeSet.seatSkinId) || (SEAT_SKIN_CATALOG || [])[0];
      if (onSelectTheme && targetTheme) onSelectTheme(targetTheme);
      if (onSelectSeatSkin && targetSeatSkin) onSelectSeatSkin(targetSeatSkin);
      AlertService.show('Theme Set Applied! 🌟', `"${themeSet.name}" theme and matching mic skin applied!`, 'success');
      onClose();
    } catch (e) {
      console.warn('Theme set apply error:', e);
      onClose();
    }
  };

  const handleCustomUpload = () => {
    AlertService.show('Privilege Required', 'Custom room decorations are unlocked at Wealth Level 10 or with SVIP membership.', 'info');
  };

  // Prepend Custom card to the data list for "Room Theme" tab
  const displayThemeData = useMemo(() => {
    const list = themes && themes.length > 0 ? themes : PRESET_THEMES;
    return [{ isCustomCard: true, id: '__custom_card__' }, ...list];
  }, [themes]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: topInset, paddingBottom: Math.max(bottomInset, bottomSafePadding, 16) }]}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Icon name="chevron-back" size={26} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Room Decorations</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Tabs: Room Theme | Mic Theme | Theme Set */}
        <View style={styles.tabsRow}>
          {['Room Theme', 'Mic Theme', 'Theme Set'].map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabBtn, isActive && styles.tabBtnActive]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab}
                </Text>
                {isActive && <View style={styles.tabIndicator} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tab 1: Room Theme */}
        {activeTab === 'Room Theme' && (
          loading ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator size="large" color="#FB923C" />
            </View>
          ) : (
            <FlatList
              data={displayThemeData}
              keyExtractor={(item, index) => String(item.id || item.itemId || index)}
              numColumns={2}
              columnWrapperStyle={styles.columnWrapper}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                if (item.isCustomCard) {
                  return (
                    <View style={styles.customCard}>
                      <View style={styles.customPlusWrap}>
                        <Icon name="add" size={48} color="#CBD5E1" />
                      </View>
                      <Text style={styles.customTitle}>Custom</Text>
                      <Text style={styles.noPrivilegesText}>No Privileges</Text>
                      <TouchableOpacity
                        style={styles.uploadBtn}
                        onPress={handleCustomUpload}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.uploadBtnText}>Upload</Text>
                      </TouchableOpacity>
                    </View>
                  );
                }

                const itemId = String(item.itemId || item.id || '');
                const isSelected = String(selected) === itemId || (itemId === 'default' && (!selected || selected === 'default'));
                const isCurrentInUse = String(currentTheme?.itemId || currentTheme?.id || 'default') === itemId;
                const safeBgColors = Array.isArray(item.bgColors) && item.bgColors.length >= 2
                  ? item.bgColors
                  : ['#3A0E5C', '#1E0A3C'];

                return (
                  <TouchableOpacity
                    style={[styles.themeCard, isSelected && styles.themeCardSelected]}
                    onPress={() => handleApplyTheme(item)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.imagePreviewWrap}>
                      {item.coverImage ? (
                        <Image
                          source={
                            typeof item.coverImage === 'number'
                              ? item.coverImage
                              : { uri: String(item.coverImage) }
                          }
                          style={styles.previewImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <LinearGradient colors={safeBgColors} style={styles.previewImage} />
                      )}
                      {isCurrentInUse && (
                        <View style={styles.inUseBadge}>
                          <Text style={styles.inUseText}>USING</Text>
                        </View>
                      )}
                      {isSelected && (
                        <View style={styles.checkCircle}>
                          <Icon name="checkmark" size={14} color="#FFFFFF" />
                        </View>
                      )}
                    </View>
                    <Text style={styles.themeName} numberOfLines={1}>{item.name}</Text>
                  </TouchableOpacity>
                );
              }}
            />
          )
        )}

        {/* Tab 2: Mic Theme (Seat Skins) */}
        {activeTab === 'Mic Theme' && (
          <FlatList
            data={SEAT_SKIN_CATALOG || []}
            keyExtractor={(item, index) => String(item.id || item.itemId || index)}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const itemId = String(item.itemId || item.id || 'default');
              const isCurrentInUse = String(currentSeatSkin?.itemId || currentSeatSkin?.id || 'default') === itemId;
              return (
                <TouchableOpacity
                  style={[styles.themeCard, isCurrentInUse && styles.themeCardSelected]}
                  onPress={() => handleApplySeatSkin(item)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.imagePreviewWrap, { backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center' }]}>
                    {item.imageUrl || item.image ? (
                      <Image
                        source={typeof (item.imageUrl || item.image) === 'number' ? (item.imageUrl || item.image) : { uri: String(item.imageUrl || item.image) }}
                        style={styles.previewImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <MaterialCommunityIcons name={item.icon || 'chair-rolling'} size={52} color={item.previewColor || '#F59E0B'} />
                    )}
                    {isCurrentInUse && (
                      <View style={styles.inUseBadge}>
                        <Text style={styles.inUseText}>USING</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.themeName} numberOfLines={1}>{item.name}</Text>
                </TouchableOpacity>
              );
            }}
          />
        )}

        {/* Tab 3: Theme Set */}
        {activeTab === 'Theme Set' && (
          <FlatList
            data={THEME_SETS}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.themeCard}
                onPress={() => handleApplyThemeSet(item)}
                activeOpacity={0.85}
              >
                <View style={styles.imagePreviewWrap}>
                  <LinearGradient colors={item.bgColors} style={styles.previewImage}>
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <MaterialCommunityIcons name="palette" size={30} color={item.previewColor} />
                      <Text style={{ fontSize: 11, color: '#FFF', fontWeight: '700', textAlign: 'center', paddingHorizontal: 8 }}>
                        Theme + Mic
                      </Text>
                    </View>
                  </LinearGradient>
                </View>
                <Text style={styles.themeName} numberOfLines={1}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 52,
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingHorizontal: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    position: 'relative',
  },
  tabBtnActive: {},
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#F97316',
    fontWeight: '700',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: '60%',
    height: 2.5,
    backgroundColor: '#F97316',
    borderRadius: 2,
  },
  loaderWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  customCard: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.35,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customPlusWrap: {
    marginBottom: 10,
  },
  customTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  noPrivilegesText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FB923C',
    marginBottom: 16,
  },
  uploadBtn: {
    backgroundColor: '#CBD5E1',
    paddingHorizontal: 28,
    paddingVertical: 8,
    borderRadius: 16,
  },
  uploadBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  themeCard: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.35,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    padding: 6,
    alignItems: 'center',
  },
  themeCardSelected: {
    borderColor: '#F97316',
  },
  imagePreviewWrap: {
    width: '100%',
    height: '80%',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1E1B4B',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  inUseBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  inUseText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  checkCircle: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyTabWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
    gap: 12,
  },
  emptyTabText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
});
