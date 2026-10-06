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

const normalizeSkin = (inventoryItem) => {
  const catalog = inventoryItem.catalogItem || inventoryItem.itemId || inventoryItem;
  const metadata = catalog.metadata || inventoryItem.metadata || {};
  return {
    ...catalog,
    itemId: String(catalog._id || catalog.id || inventoryItem.itemId || ''),
    id: String(catalog._id || catalog.id || inventoryItem.itemId || ''),
    name: catalog.name || inventoryItem.name || 'Seat Skin',
    category: catalog.category || inventoryItem.category,
    imageUrl: catalog.imageUrl || metadata.imageUrl || inventoryItem.imageUrl || null,
    icon: catalog.icon || metadata.icon || 'mic-outline',
    previewColor: catalog.previewColor || metadata.previewColor || '#94A3B8',
    borderColor: metadata.borderColor || '#94A3B8',
    bgColor: metadata.bgColor || 'rgba(148,163,184,0.15)',
    seatSkinType: metadata.seatSkinType || 'custom',
    desc: catalog.desc || metadata.description || '',
    expiresAt: inventoryItem.expiresAt || null,
  };
};

import { SEAT_SKIN_CATALOG, DEFAULT_SEAT_SKIN } from '../../utils/cosmeticResolver';

const PRESET_SEAT_SKINS = SEAT_SKIN_CATALOG.map((item) => ({
  ...item,
  isPreset: true,
}));

export default function RoomSeatSkinModal({
  visible,
  onClose,
  currentSeatSkin,
  onSelectSeatSkin,
  bottomSafePadding = 16,
}) {
  const [skins, setSkins] = useState(PRESET_SEAT_SKINS);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return undefined;
    let active = true;
    const currentId = String(currentSeatSkin?.itemId || currentSeatSkin?.id || 'default');
    setSelected(currentId);
    setLoading(true);
    setError('');

    Promise.allSettled([
      apiUtil.get('/store/inventory'),
      apiUtil.get('/store/items', { params: { category: 'Seat Skin', activeOnly: true } }),
    ])
      .then(([inventoryResult, catalogResult]) => {
        if (!active) return;
        const inventoryResponse = inventoryResult.status === 'fulfilled' ? inventoryResult.value : null;
        const catalogResponse = catalogResult.status === 'fulfilled' ? catalogResult.value : null;

        const inventoryItems = inventoryResponse?.data?.data?.items || [];
        const ownedSkins = inventoryItems
          .filter((item) => ['seat skin', 'seat skins'].includes(String(item.catalogItem?.category || item.category || '').toLowerCase()))
          .map(normalizeSkin);

        const catalogPayload = catalogResponse?.data?.data || catalogResponse?.data || {};
        const catalogItems = Array.isArray(catalogPayload) ? catalogPayload : (catalogPayload.items || []);
        const storeSkins = catalogItems
          .filter((item) => ['seat skin', 'seat skins'].includes(String(item.category || '').toLowerCase()))
          .map((item) => normalizeSkin({ ...item, isFromStore: true }));

        const byId = new Map();
        // 1. First add all built-in HD presets
        PRESET_SEAT_SKINS.forEach((preset) => byId.set(preset.id, { ...preset }));
        // 2. Merge store catalog items
        storeSkins.forEach((skin) => byId.set(skin.id, { ...(byId.get(skin.id) || {}), ...skin }));
        // 3. Merge owned skins
        ownedSkins.forEach((skin) => byId.set(skin.id, { ...(byId.get(skin.id) || {}), ...skin, isOwned: true }));

        const combined = Array.from(byId.values());
        setSkins(combined);
        setSelected((value) => value || currentId || combined[0]?.id || 'default');
      })
      .catch((requestError) => {
        if (!active) return;
        setSkins(PRESET_SEAT_SKINS);
        setSelected((value) => value || currentId || PRESET_SEAT_SKINS[0]?.id || 'default');
        setError(requestError?.response?.data?.message || 'Inventory seat skins sync failed, showing presets.');
      })
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [visible, currentSeatSkin?.id, currentSeatSkin?.itemId]);

  const selectedSkin = useMemo(
    () => skins.find((skin) => skin.id === selected) || null,
    [skins, selected],
  );

  const handleApply = () => {
    if (!selectedSkin) return;
    onSelectSeatSkin?.(selectedSkin);
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
              <MaterialCommunityIcons name="chair-rolling" size={20} color="#F59E0B" />
              <Text style={styles.headerTitle}>Room Seat Skins</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerSubtitle}>
            Room ke sabhi seats ke liye HD royal skins chunen.
          </Text>

          {loading ? (
            <ActivityIndicator color="#F59E0B" style={styles.loader} />
          ) : (
            <FlatList
              data={skins}
              keyExtractor={(item) => String(item.id || item.itemId || item._id)}
              numColumns={2}
              columnWrapperStyle={skins.length > 1 ? styles.columnWrapper : undefined}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <Text style={styles.emptyText}>{error || 'Koi seat skin uplabdh nahi hai.'}</Text>
              }
              renderItem={({ item }) => {
                const isSelected = selected === item.id;
                const activeId = String(currentSeatSkin?.itemId || currentSeatSkin?.id || 'default').toLowerCase();
                const thisId = String(item.id || item.itemId || '').toLowerCase();
                const isActive = activeId === thisId || (activeId === 'default' && thisId === 'default');

                return (
                  <TouchableOpacity
                    style={[styles.skinCard, isSelected && styles.skinCardSelected]}
                    onPress={() => setSelected(item.id)}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.previewSeat, { borderColor: item.borderColor || '#F59E0B', backgroundColor: item.bgColor || 'rgba(255,255,255,0.06)' }]}>
                      {item.imageUrl ? (
                        <Image
                          source={typeof item.imageUrl === 'string' ? { uri: item.imageUrl } : item.imageUrl}
                          style={styles.previewImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <MaterialCommunityIcons name={item.icon || 'sofa-outline'} size={32} color={item.previewColor || '#F59E0B'} />
                      )}
                      {isActive && <Text style={styles.activeBadge}>IN USE</Text>}
                      {isSelected && (
                        <View style={styles.checkCircle}>
                          <Icon name="checkmark" size={12} color="#FFF" />
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
            style={[styles.applyBtn, !selectedSkin && styles.disabled]}
            onPress={handleApply}
            disabled={!selectedSkin || loading}
          >
            <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.applyGradient}>
              <Text style={styles.applyBtnText}>USE SEAT SKIN</Text>
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
  skinCard: { width: ITEM_WIDTH, backgroundColor: '#1E293B', borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1.5, borderColor: 'transparent', marginBottom: 12 },
  skinCardSelected: { borderColor: '#F59E0B', backgroundColor: '#2D200E' },
  previewSeat: { width: 66, height: 66, borderRadius: 33, borderWidth: 2, alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: 8, overflow: 'hidden' },
  previewImage: { width: '100%', height: '100%' },
  activeBadge: { position: 'absolute', bottom: 1, color: '#FFF', backgroundColor: '#22C55E', paddingHorizontal: 5, borderRadius: 4, fontSize: 8, fontWeight: '800' },
  checkCircle: { position: 'absolute', top: 1, right: 1, width: 20, height: 20, borderRadius: 10, backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center' },
  itemName: { color: '#F1F5F9', fontSize: 12.5, fontWeight: '700', textAlign: 'center', marginBottom: 2 },
  itemDesc: { color: '#94A3B8', fontSize: 10, textAlign: 'center', lineHeight: 13 },
  emptyText: { color: '#94A3B8', textAlign: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  applyBtn: { borderRadius: 12, overflow: 'hidden', marginTop: 4 },
  disabled: { opacity: 0.45 },
  applyGradient: { paddingVertical: 13, alignItems: 'center' },
  applyBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },
});
