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
import AlertService from '../../services/AlertService';
import { ROOM_THEME_CATALOG, DEFAULT_ROOM_BG } from '../../utils/cosmeticResolver';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

const normalizeTheme = (inventoryItem) => {
  const catalog = inventoryItem.catalogItem || inventoryItem.itemId || inventoryItem;
  const metadata = catalog.metadata || inventoryItem.metadata || {};
  return {
    ...catalog,
    itemId: String(catalog._id || catalog.id || inventoryItem.itemId || ''),
    id: String(catalog._id || catalog.id || inventoryItem.itemId || ''),
    name: catalog.name || inventoryItem.name || 'Theme',
    category: catalog.category || inventoryItem.category,
    coverImage: catalog.imageUrl || metadata.coverImage || inventoryItem.imageUrl || null,
    bgColors: catalog.bgColors || metadata.bgColors || ['#1E1B4B', '#0F172A'],
    previewColor: catalog.previewColor || metadata.previewColor || '#8B5CF6',
    desc: catalog.desc || metadata.description || '',
    expiresAt: inventoryItem.expiresAt || null,
    isOwned: Boolean(inventoryItem.isOwned || inventoryItem.catalogItem),
    isFree: Boolean(inventoryItem.isFree || metadata.isFree || Number(catalog.price || 0) === 0),
  };
};

const PRESET_THEMES = ROOM_THEME_CATALOG.map((item) => ({
  id: item.id,
  itemId: item.id,
  name: item.name || item.id || 'Default',
  coverImage: item.coverImage || (item.id === 'default' ? DEFAULT_ROOM_BG : null),
  bgColors: item.bgColors || ['#3A0E5C', '#1E0A3C', '#0B031E'],
  previewColor: item.previewColor || item.bgColors?.[0] || '#9333EA',
  desc: item.desc || 'Default Yaro room theme',
  isPreset: true,
  isFree: true,
}));

export default function RoomThemeModal({
  visible,
  onClose,
  currentTheme,
  onSelectTheme,
}) {
  const insets = useSafeAreaInsets() || { top: 0, bottom: 0 };
  const [activeTab, setActiveTab] = useState('Room Theme');
  const [themes, setThemes] = useState(PRESET_THEMES);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    let active = true;
    setSelected(String(currentTheme?.itemId || currentTheme?.id || ''));
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

        setThemes(Array.from(byId.values()));
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [visible, currentTheme]);

  if (!visible) return null;

  const handleApply = (themeItem) => {
    if (onSelectTheme) onSelectTheme(themeItem);
    setSelected(themeItem.itemId || themeItem.id);
    onClose();
  };

  const handleCustomUpload = () => {
    AlertService.show('Privilege Required', 'Custom room decorations are unlocked at Wealth Level 10 or with SVIP membership.', 'info');
  };

  // Prepend Custom card to the data list for "Room Theme" tab
  const displayData = useMemo(() => {
    if (activeTab !== 'Room Theme') return [];
    return [{ isCustomCard: true, id: '__custom_card__' }, ...themes];
  }, [activeTab, themes]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 16) }]}>
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

        {/* Tab Content */}
        {activeTab === 'Room Theme' ? (
          loading ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator size="large" color="#FB923C" />
            </View>
          ) : (
            <FlatList
              data={displayData}
              keyExtractor={(item) => item.id || item.itemId || String(Math.random())}
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

                const itemId = String(item.itemId || item.id);
                const isSelected = selected === itemId;
                const isCurrentInUse = String(currentTheme?.itemId || currentTheme?.id) === itemId;

                return (
                  <TouchableOpacity
                    style={[styles.themeCard, isSelected && styles.themeCardSelected]}
                    onPress={() => handleApply(item)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.imagePreviewWrap}>
                      {item.coverImage ? (
                        <Image
                          source={
                            typeof item.coverImage === 'number'
                              ? item.coverImage
                              : { uri: item.coverImage }
                          }
                          style={styles.previewImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <LinearGradient colors={item.bgColors} style={styles.previewImage} />
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
        ) : (
          <View style={styles.emptyTabWrap}>
            <MaterialCommunityIcons
              name={activeTab === 'Mic Theme' ? 'microphone-outline' : 'palette-swatch-outline'}
              size={54}
              color="#CBD5E1"
            />
            <Text style={styles.emptyTabText}>No {activeTab} available yet</Text>
          </View>
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
