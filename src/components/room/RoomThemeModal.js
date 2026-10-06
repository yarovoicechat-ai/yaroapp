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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { apiUtil } from '../../utils/apiUtil';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 2;

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
    themeLocation: metadata.themeLocation || 'STORE',
  };
};

import { ROOM_THEME_CATALOG, DEFAULT_ROOM_BG } from '../../utils/cosmeticResolver';

const PRESET_THEMES = ROOM_THEME_CATALOG.map((item) => ({
  id: item.id,
  itemId: item.id,
  name: item.name || item.id || 'Default',
  coverImage: item.coverImage || (item.id === 'default' ? DEFAULT_ROOM_BG : null),
  bgColors: item.bgColors || ['#3A0E5C', '#1E0A3C', '#0B031E'],
  previewColor: item.previewColor || item.bgColors?.[0] || '#9333EA',
  desc: item.desc || 'Default Yaro room theme preset',
  isPreset: true,
  isFree: true,
}));

export default function RoomThemeModal({
  visible,
  onClose,
  currentTheme,
  onSelectTheme,
  bottomSafePadding = 16,
}) {
  const [themes, setThemes] = useState(PRESET_THEMES);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return undefined;
    let active = true;
    setSelected(String(currentTheme?.itemId || currentTheme?.id || ''));
    setLoading(true);
    setError('');
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
            const location = String(item.metadata?.themeLocation || 'STORE')
              .trim()
              .toUpperCase()
              .replace(/[ -]+/g, '_');
            const isFree = item.metadata?.isFree === true || Number(item.price || 0) === 0;
            return isFree && ['ROOM_TOOL', 'BOTH'].includes(location);
          })
          .map((item) => normalizeTheme({ ...item, isFree: true }));

        const byId = new Map();
        [...PRESET_THEMES, ...freeRoomToolThemes, ...ownedThemes].forEach((theme) => {
          byId.set(theme.id, { ...(byId.get(theme.id) || {}), ...theme });
        });
        const combined = Array.from(byId.values());
        setThemes(combined);
        setSelected((value) => value || combined[0]?.id || null);
        if (inventoryResult.status === 'rejected' && catalogResult.status === 'rejected') {
          setError('Themes sync failed, showing the default room theme.');
        }
      })
      .catch((requestError) => {
        if (!active) return;
        setThemes(PRESET_THEMES);
        setSelected((value) => value || PRESET_THEMES[0]?.id || null);
        setError(requestError?.response?.data?.message || 'Inventory themes sync failed, showing presets.');
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [visible, currentTheme?.id, currentTheme?.itemId]);

  const selectedTheme = useMemo(
    () => themes.find((theme) => theme.id === selected) || null,
    [themes, selected],
  );

  const handleApply = () => {
    if (!selectedTheme) return;
    onSelectTheme?.(selectedTheme);
    onClose?.();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <TouchableOpacity style={styles.backdropDismiss} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheetContainer, { paddingBottom: bottomSafePadding + 16 }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.headerRow}>
            <View style={styles.headerTitleRow}>
              <MaterialCommunityIcons name="palette" size={20} color="#F59E0B" />
              <Text style={styles.headerTitle}>Room Tool Themes</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerSubtitle}>
            Free Room Tool themes direct use karein; Store themes purchase ke baad yahan milengi.
          </Text>

          {loading ? (
            <ActivityIndicator color="#8B5CF6" style={styles.loader} />
          ) : (
            <FlatList
              data={themes}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={themes.length > 1 ? styles.columnWrapper : undefined}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <Text style={styles.emptyText}>{error || 'Aapke inventory me koi active room theme nahi hai.'}</Text>
              }
              renderItem={({ item }) => {
                const isSelected = selected === item.id;
                const isActive =
                  String(currentTheme?.itemId || currentTheme?.id || '') === item.id;
                return (
                  <TouchableOpacity
                    style={[styles.themeCard, isSelected && styles.themeCardSelected]}
                    onPress={() => setSelected(item.id)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.previewContainer}>
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
                      {isActive && <Text style={styles.activeBadge}>IN USE</Text>}
                      {!isActive && (item.isFree || item.isOwned) && (
                        <Text style={[styles.accessBadge, item.isOwned && styles.ownedBadge]}>
                          {item.isOwned ? 'OWNED' : 'FREE'}
                        </Text>
                      )}
                      {isSelected && (
                        <View style={styles.checkCircle}>
                          <Icon name="checkmark" size={14} color="#FFF" />
                        </View>
                      )}
                    </View>
                    <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.itemDesc} numberOfLines={2}>{item.desc}</Text>
                  </TouchableOpacity>
                );
              }}
            />
          )}

          <TouchableOpacity
            style={[styles.applyBtn, !selectedTheme && styles.disabled]}
            onPress={handleApply}
            disabled={!selectedTheme || loading}
          >
            <LinearGradient colors={['#8B5CF6', '#6D28D9']} style={styles.applyGradient}>
              <Text style={styles.applyBtnText}>USE THEME</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  backdropDismiss: { flex: 1 },
  sheetContainer: { backgroundColor: '#0F172A', borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 16, paddingTop: 10, maxHeight: '75%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  sheetHandle: { width: 38, height: 4, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 2, alignSelf: 'center', marginBottom: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#F8FAFC' },
  headerSubtitle: { fontSize: 12, color: '#94A3B8', marginTop: 4, marginBottom: 12 },
  closeBtn: { padding: 4 },
  loader: { minHeight: 180 },
  listContent: { paddingBottom: 16, minHeight: 150 },
  columnWrapper: { justifyContent: 'space-between', marginBottom: 12 },
  themeCard: { width: ITEM_WIDTH, backgroundColor: '#1E293B', borderRadius: 12, padding: 8, borderWidth: 1.5, borderColor: 'transparent', marginBottom: 12 },
  themeCardSelected: { borderColor: '#8B5CF6', backgroundColor: '#261B48' },
  previewContainer: { width: '100%', height: 80, borderRadius: 8, overflow: 'hidden', position: 'relative', marginBottom: 6 },
  previewImage: { width: '100%', height: '100%' },
  activeBadge: { position: 'absolute', bottom: 4, left: 4, color: '#FFF', backgroundColor: '#22C55E', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 9, fontWeight: '800' },
  accessBadge: { position: 'absolute', bottom: 4, left: 4, color: '#FFF', backgroundColor: '#8B5CF6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 9, fontWeight: '800' },
  ownedBadge: { backgroundColor: '#0284C7' },
  checkCircle: { position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center' },
  itemName: { color: '#F1F5F9', fontSize: 13, fontWeight: '700', marginBottom: 2 },
  itemDesc: { color: '#94A3B8', fontSize: 10.5, lineHeight: 14 },
  emptyText: { color: '#94A3B8', textAlign: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  applyBtn: { borderRadius: 12, overflow: 'hidden', marginTop: 4 },
  disabled: { opacity: 0.45 },
  applyGradient: { paddingVertical: 13, alignItems: 'center' },
  applyBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },
});
