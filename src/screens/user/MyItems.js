import React, { useState, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
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
import SvgaView from '../../components/SvgaView';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

const ItemAsset = ({ item, style, resizeMode = 'contain' }) => {
  const animationUrl = item?.animationUrl;
  const imageUrl = item?.imageUrl || item?.image;
  const source = animationUrl || imageUrl;
  if (!source) return null;

  return (
    <SvgaView
      source={source}
      style={style}
      resizeMode={resizeMode}
      loops={0}
      fallbackImage={imageUrl}
    />
  );
};

const getFormatBadge = (item) => {
  const anim = String(item?.animationUrl || '').toLowerCase();
  const img = String(item?.imageUrl || item?.image || '').toLowerCase();
  if (anim.includes('.svga')) return { label: '✨ SVGA Animation', color: '#8B5CF6', bg: '#F5F3FF' };
  if (anim.includes('.gif') || img.includes('.gif')) return { label: '✨ Animated GIF', color: '#EC4899', bg: '#FDF2F8' };
  if (anim.includes('.webp') || img.includes('.webp')) return { label: '✨ Animated WebP', color: '#06B6D4', bg: '#ECFEFF' };
  if (img.includes('.png') || img.includes('.jpg') || img.includes('.jpeg')) return { label: '✨ HD Frame', color: '#10B981', bg: '#ECFDF5' };
  return { label: '✨ Exclusive Item', color: '#F59E0B', bg: '#FFFBEB' };
};

const CATEGORIES = ['All', 'Frame', 'Mic Wave', 'Entry', 'Entrance', 'Vehicle', 'Badge', 'Tag', 'Theme', 'Seat Skin', 'Unique ID', 'Profile Border', 'VIP', 'King of Kings', 'Chat Bubble', 'Tassel'];
const EQUIPPABLE_TYPES = ['Frame', 'Mic Wave', 'Entry', 'Entrance', 'Vehicle', 'Badge', 'VIP', 'Chat Bubble', 'Tassel', 'Theme', 'Profile Border', 'Unique ID'];

export default function MyItems() {
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const navigation = useNavigation();
  const { user, equipCosmetic } = useContext(AuthContext);

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [items, setItems] = useState([]);
  const [previewModalItem, setPreviewModalItem] = useState(null);

  const getEquippedName = useCallback(
    (type) => {
      if (type === 'Frame') return user?.equippedFrame;
      if (type === 'Entry') return user?.equippedEntry;
      if (type === 'Mic Wave') return user?.equippedMicWave;
      if (type === 'Chat Bubble') return user?.equippedChatBubble;
      if (type === 'Tassel') return user?.equippedTassel;
      if (type === 'Entrance') return user?.equippedEntrance;
      if (type === 'Vehicle') return user?.equippedVehicle;
      if (type === 'Profile Border') return user?.equippedProfileBorder;
      if (type === 'Unique ID' || type === 'Custom ID') return user?.equippedCustomId;
      if (type === 'Theme') return user?.equippedRoomTheme;
      if (type === 'VIP') return user?.equippedVipId;
      if (type === 'Badge') return user?.equippedBadge;
      return null;
    },
    [user],
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;
      apiUtil
        .get('/store/inventory', { suppressGlobalError: true })
        .then((response) => {
          if (!active) return;
          const owned = response?.data?.data?.items || [];
          const mapped = owned.map((entry) => {
            const rawCatalog = entry.catalogItem;
            const catalog =
              rawCatalog && typeof rawCatalog === 'object' ? rawCatalog : {};
            const category = catalog.category || entry.category || '';
            const normalized = String(category).toLowerCase();
            const type =
              normalized === 'frames' || normalized === 'frame'
                ? 'Frame'
                : normalized.startsWith('entry')
                  ? 'Entry'
                  : normalized.startsWith('mic wave')
                    ? 'Mic Wave'
                    : normalized.startsWith('chat bubble')
                      ? 'Chat Bubble'
                      : normalized.startsWith('tassel')
                        ? 'Tassel'
                        : ['entrance', 'ride', 'profile entry'].includes(normalized)
                          ? 'Entrance'
                          : ['vehicle'].includes(normalized)
                            ? 'Vehicle'
                            : ['profile border', 'border'].includes(normalized)
                              ? 'Profile Border'
                              : ['custom id', 'unique id'].includes(normalized)
                                ? 'Unique ID'
                                : normalized === 'badge'
                                  ? 'Badge'
                                  : category;
            const metadata = catalog.metadata || entry.metadata || {};
            const itemId = String(catalog._id || catalog.id || entry.itemId || entry._id);
            const name = catalog.name || entry.name || 'Item';
            const equippedName = getEquippedName(type);
            const isIdEquipped =
              (type === 'VIP' || type === 'Theme') &&
              String(equippedName || '') === itemId;
            return {
              ...catalog,
              ...entry,
              id: itemId,
              itemId,
              name,
              category,
              type,
              validity: entry.expiresAt
                ? `Until ${new Date(entry.expiresAt).toLocaleDateString()}`
                : catalog.validity || 'Permanent',
              inUse:
                isIdEquipped ||
                Boolean(
                  equippedName &&
                    String(name).toLowerCase() === String(equippedName).toLowerCase(),
                ),
              coverType:
                type === 'Frame'
                  ? 'avatar_frame'
                  : type === 'Entry'
                    ? 'portal_entry'
                    : type === 'Mic Wave'
                      ? 'mic_wave'
                      : type === 'Chat Bubble'
                        ? 'chat_bubble'
                        : '',
              previewColor: catalog.previewColor || metadata.previewColor || '#8B5CF6',
              bgColors: catalog.bgColors || metadata.bgColors || [],
              borderColor: metadata.borderColor || '',
              textColor: metadata.textColor || '',
              badgeText: catalog.badgeText || (entry.source === 'level' ? 'LEVEL' : 'OWNED'),
              description:
                catalog.desc ||
                metadata.description ||
                (entry.source === 'level'
                  ? 'Unlocked by your level.'
                  : 'Purchased from Yaro Store.'),
              imageUrl: catalog.imageUrl || entry.imageUrl || '',
              animationUrl: catalog.animationUrl || entry.animationUrl || '',
              metadata,
            };
          });
          setItems(mapped);
        })
        .catch((error) => {
          if (active) {
            setItems([]);
            AlertService.show(
              'Inventory',
              error?.response?.data?.message || 'Items load nahi ho sake.',
              'warning',
            );
          }
        });
      return () => {
        active = false;
      };
    }, [getEquippedName]),
  );

  const filteredItems = items.filter((item) => {
    if (selectedCategory === 'All') return true;
    return item.type.toLowerCase() === selectedCategory.toLowerCase();
  });

  const handleToggleUse = async (item) => {
    const shouldEquip = !item.inUse;
    try {
      await equipCosmetic(item, item.category || item.type, shouldEquip);
      setItems((previous) =>
        previous.map((candidate) => {
          if (candidate.type !== item.type) return candidate;
          return {
            ...candidate,
            inUse: shouldEquip && candidate.id === item.id,
          };
        }),
      );
      setPreviewModalItem((previous) =>
        previous?.id === item.id ? { ...previous, inUse: shouldEquip } : previous,
      );
      AlertService.show(
        shouldEquip ? 'Item Equipped' : 'Item Unequipped',
        shouldEquip
          ? `${item.name} is now active.`
          : `${item.name} has been removed.`,
        shouldEquip ? 'success' : 'info',
      );
    } catch (error) {
      AlertService.show(
        'Item Update Failed',
        error?.response?.data?.message || error?.message || 'Please try again.',
        'error',
      );
    }
  };

  const renderItemVisual = (item) => {
    const avatar = getUserAvatar(user);

    const assetUrl = item.animationUrl || item.imageUrl;
    if (assetUrl) {
      const media = (
        <SvgaView
          source={item.animationUrl || item.imageUrl}
          style={styles.ownedAsset}
          loops={0}
          fallbackImage={item.imageUrl}
        />
      );
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

    if (item.type === 'Chat Bubble' || item.type === 'Chat Bubbles' || item.coverType === 'chat_bubble') {
      const bgColors =
        (Array.isArray(item.bgColors) && item.bgColors.length >= 2
          ? item.bgColors
          : item.metadata?.bgColors) || ['#1E293B', '#334155'];
      const borderColor =
        item.borderColor || item.metadata?.borderColor || item.previewColor || '#64748B';
      const textColor = item.textColor || item.metadata?.textColor || '#E2E8F0';
      return (
        <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', padding: 6 }}>
          <LinearGradient
            colors={bgColors}
            style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1.5, borderColor: borderColor, maxWidth: '95%', alignItems: 'center' }}
          >
            <Text style={{ color: borderColor, fontSize: 10, fontWeight: '800' }} numberOfLines={1}>{item.name}</Text>
            <Text style={{ color: textColor, fontSize: 9, marginTop: 2 }}>Chat bubble preview</Text>
          </LinearGradient>
        </View>
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

  const renderModalShowcase = (item) => {
    const avatar = getUserAvatar(user);
    const hasMedia = Boolean(item?.animationUrl || item?.imageUrl);

    if (item?.type === 'Frame' || item?.coverType === 'avatar_frame') {
      return (
        <View style={styles.modalFrameShowcase}>
          <AvatarWithFrame
            user={user}
            frame={item}
            size={110}
            showOnlineDot={false}
          />
        </View>
      );
    }

    if (item?.type === 'Entry' || item?.coverType === 'portal_entry') {
      return (
        <LinearGradient
          colors={['#0F0C20', '#1E1435', '#2E1065']}
          style={styles.modalEntryShowcase}
        >
          {hasMedia ? (
            <ItemAsset item={item} style={styles.modalEntryAsset} />
          ) : (
            <MaterialCommunityIcons name="human" size={48} color="#C084FC" />
          )}
        </LinearGradient>
      );
    }

    if (item?.type === 'Mic Wave' || item?.coverType === 'mic_wave') {
      const u = item?.previewColor || '#F59E0B';
      return (
        <View style={styles.modalMicShowcase}>
          <View style={[styles.popupMicRingOuter, { borderColor: u + '50' }]}>
            <View style={[styles.popupMicRingInner, { borderColor: u + '80' }]}>
              <Image source={avatar} style={{ width: 68, height: 68, borderRadius: 34 }} />
            </View>
          </View>
          <View style={[styles.popupMicIconBadge, { backgroundColor: u }]}>
            <MaterialCommunityIcons name="microphone" size={16} color="#FFFFFF" />
          </View>
        </View>
      );
    }

    if (item?.type === 'Chat Bubble' || item?.type === 'Chat Bubbles' || item?.coverType === 'chat_bubble') {
      const bgColors =
        (Array.isArray(item.bgColors) && item.bgColors.length >= 2
          ? item.bgColors
          : item.metadata?.bgColors) || ['#1E293B', '#334155'];
      const borderColor =
        item.borderColor || item.metadata?.borderColor || item.previewColor || '#64748B';
      const textColor = item.textColor || item.metadata?.textColor || '#FFFFFF';
      return (
        <View style={{ width: '100%', height: 120, alignItems: 'center', justifyContent: 'center' }}>
          <LinearGradient
            colors={bgColors}
            style={{ paddingHorizontal: 20, paddingVertical: 14, borderRadius: 16, borderWidth: 2, borderColor: borderColor, minWidth: 200, alignItems: 'center' }}
          >
            <Text style={{ color: borderColor, fontSize: 13, fontWeight: '800' }}>💬 {item.name}</Text>
            <Text style={{ color: textColor, fontSize: 12, marginTop: 6 }}>Voice room chat bubble preview</Text>
          </LinearGradient>
        </View>
      );
    }

    if (hasMedia) {
      return (
        <View style={styles.modalGenericShowcase}>
          <ItemAsset item={item} style={styles.modalGenericAsset} />
        </View>
      );
    }

    return renderItemVisual(item);
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
          onPress={() => navigation.navigate('Store')}
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
                {EQUIPPABLE_TYPES.includes(item.type) ? (
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
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPreviewModalItem(null)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalContent}
            onPress={(e) => e?.stopPropagation?.()}
          >
            {previewModalItem && (
              <>
                <View style={styles.modalHeader}>
                  <View style={[styles.previewFormatTag, { backgroundColor: getFormatBadge(previewModalItem).bg }]}>
                    <Text style={[styles.previewFormatTagText, { color: getFormatBadge(previewModalItem).color }]}>
                      {getFormatBadge(previewModalItem).label}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setPreviewModalItem(null)}
                    style={styles.modalCloseBtn}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Icon name="close" size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalVisualCenter}>
                  {renderModalShowcase(previewModalItem)}
                </View>

                <Text style={styles.modalTitle}>{previewModalItem.name}</Text>

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

                {EQUIPPABLE_TYPES.includes(previewModalItem.type) && (
                  <TouchableOpacity
                    activeOpacity={0.88}
                    style={[
                      styles.modalActionBtn,
                      previewModalItem.inUse ? styles.modalActionBtnInUse : styles.modalActionBtnUse,
                    ]}
                    onPress={() => handleToggleUse(previewModalItem)}
                  >
                    <Text style={styles.modalActionBtnText}>
                      {previewModalItem.inUse ? 'Currently Active on Profile' : 'Equip This Item'}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewFormatTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  previewFormatTagText: {
    fontSize: 11,
    fontWeight: '800',
  },
  modalVisualCenter: {
    width: 170,
    height: 170,
    borderRadius: 24,
    backgroundColor: '#FAF5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  modalFrameShowcase: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  modalAvatarImg: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#3B0764',
  },
  modalFrameAsset: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: 154,
    height: 154,
    zIndex: 10,
  },
  modalEntryShowcase: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  modalEntryAsset: {
    width: 140,
    height: 110,
  },
  modalMicShowcase: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  modalGenericShowcase: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalGenericAsset: {
    width: 130,
    height: 130,
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
