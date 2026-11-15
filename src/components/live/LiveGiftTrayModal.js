import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { apiUtil } from '../../utils/apiUtil';
import { getUserAvatar } from '../../utils/avatarUtil';

const { width } = Dimensions.get('window');

const CATEGORIES = ['Event', 'Hot', 'Lucky', 'SVIP', 'Customized'];
const PRICE_FILTERS = ['All', '1-10000', '10000-40000', '40000-200000'];
const QUANTITIES = [1, 10, 20, 50, 99];

export default function LiveGiftTrayModal({
  visible,
  onClose,
  coinBalance = 0,
  sending = false,
  hostUser = {},
  rivalUser = {},
  isPK = false,
  onSendGift,
  onRecharge,
  bottomPadding = 16,
}) {
  const [selectedCategory, setSelectedCategory] = useState('Hot');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedReceiver, setSelectedReceiver] = useState('host'); // 'host' | 'rival'
  const [selectedGiftId, setSelectedGiftId] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!visible) return undefined;
    let disposed = false;
    setLoading(true); setLoadError(false);
    apiUtil.get('/gifts').then(response => {
      if (disposed) return;
      const items = Array.isArray(response.data?.data) ? response.data.data : [];
      setGifts(items.filter(g => g.isActive !== false).map(g => ({ ...g, id: g._id || g.id,
        price: Number(g.price ?? g.cost ?? 0), image: g.image || g.icon,
        category: g.categoryId?.name || g.category || 'Hot' })));
    }).catch(() => { if (!disposed) setLoadError(true); })
      .finally(() => { if (!disposed) setLoading(false); });
    return () => { disposed = true; };
  }, [visible, retry]);
  const categories = [...new Set([...CATEGORIES, ...gifts.map(g => g.category)])];
  const sampleGifts = gifts.filter(g => {
    const categoryMatches = selectedCategory === 'Hot' ? true : g.category.toLowerCase() === selectedCategory.toLowerCase();
    const [min, max] = selectedFilter.split('-').map(Number);
    return categoryMatches && (selectedFilter === 'All' || (g.price >= min && g.price <= max));
  });
  const selectedGift = sampleGifts.find(g => g.id === selectedGiftId);
  if (!visible) return null;

  const handleSend = () => {
    const gift = selectedGift;
    if (!gift || sending) return;
    if (gift.price * quantity > coinBalance) { onRecharge?.(); return; }
    onSendGift && onSendGift({
      gift,
      quantity,
      receiver: selectedReceiver === 'rival' ? rivalUser : hostUser,
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={[styles.sheetContainer, { paddingBottom: bottomPadding + 10 }]}>
          {/* 1. Level & XP Progress Row */}
          <View style={styles.levelProgressRow}>
            <View style={styles.levelLeftGroup}>
              <Text style={styles.lvText}>Lv.0</Text>
              <View style={styles.xpBarTrack}>
                <LinearGradient
                  colors={['#EC4899', '#F43F5E']}
                  style={[styles.xpBarFill, { width: '25%' }]}
                />
              </View>
              <Text style={styles.xpRequireText}>Send a gift to show your support</Text>
            </View>

            <View style={styles.levelBadge}>
              <Text style={styles.levelStar}>⭐</Text>
              <Text style={styles.levelBadgeNum}>1</Text>
            </View>
          </View>

          {/* 2. Receiver Selector (In PK Mode: Host vs Rival) */}
          <View style={styles.receiversRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setSelectedReceiver('host')}
              style={[
                styles.receiverPill,
                selectedReceiver === 'host' && styles.receiverPillActive,
              ]}
            >
              <Image source={getUserAvatar(hostUser)} style={styles.receiverAvatar} />
              <Text style={styles.receiverName} numberOfLines={1}>
                {hostUser.name || 'Broadcaster'}
              </Text>
              <View style={styles.pkTag}>
                <Text style={styles.pkTagText}>PK</Text>
              </View>
            </TouchableOpacity>

            {isPK && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setSelectedReceiver('rival')}
                style={[
                  styles.receiverPill,
                  selectedReceiver === 'rival' && styles.receiverPillActive,
                ]}
              >
                <Image source={getUserAvatar(rivalUser)} style={styles.receiverAvatar} />
                <Text style={styles.receiverName} numberOfLines={1}>
                  {rivalUser.name || 'Shelly'}
                </Text>
                <View style={[styles.pkTag, { backgroundColor: '#0284C7' }]}>
                  <Text style={styles.pkTagText}>PK</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* 3. Category Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryTabs}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={styles.catTab}
              >
                <Text
                  style={[
                    styles.catTabText,
                    selectedCategory === cat && styles.catTabTextActive,
                  ]}
                >
                  {cat}
                </Text>
                {selectedCategory === cat && <View style={styles.catActiveIndicator} />}
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.bagTab}>
              <MaterialCommunityIcons name="bag-personal-outline" size={18} color="#94A3B8" />
            </TouchableOpacity>
          </ScrollView>

          {/* 4. Price Range Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {PRICE_FILTERS.map(f => (
              <TouchableOpacity
                key={f}
                onPress={() => setSelectedFilter(f)}
                style={[
                  styles.filterChip,
                  selectedFilter === f && styles.filterChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedFilter === f && styles.filterChipTextActive,
                  ]}
                >
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* 5. Gifts Grid */}
          <ScrollView
            style={styles.giftsScrollView}
            contentContainerStyle={styles.giftsGrid}
            showsVerticalScrollIndicator={false}
          >
            {loading && <Text style={styles.emptyText}>Loading gifts…</Text>}
            {loadError && <TouchableOpacity onPress={() => setRetry(value => value + 1)}><Text style={styles.emptyText}>Could not load gifts. Tap to retry.</Text></TouchableOpacity>}
            {!loading && !loadError && !sampleGifts.length && <Text style={styles.emptyText}>No gifts in this category</Text>}
            {sampleGifts.map(g => {
              const isSelected = selectedGiftId === g.id;
              return (
                <TouchableOpacity
                  key={g.id}
                  activeOpacity={0.8}
                  onPress={() => setSelectedGiftId(g.id)}
                  style={[styles.giftCard, isSelected && styles.giftCardActive]}
                >
                  {g.xp && (
                    <View style={styles.giftXpBadge}>
                      <Text style={styles.giftXpText}>{g.xp}</Text>
                    </View>
                  )}
                  {typeof g.image === 'string' && /^https?:/.test(g.image)
                    ? <Image source={{ uri: g.image }} style={styles.giftImage} resizeMode="contain" />
                    : <Text style={styles.giftIcon}>🎁</Text>}
                  <Text style={styles.giftCardName} numberOfLines={1}>
                    {g.name}
                  </Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.coinCoin}>🪙</Text>
                    <Text style={styles.giftPrice}>{g.price}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* 6. Bottom Bar: Coin Balance + Quantities + Send */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onRecharge}
              style={styles.balancePill}
            >
              <Text style={styles.coinCoin}>🪙</Text>
              <Text style={styles.balanceText}>{coinBalance}</Text>
              <Icon name="chevron-forward" size={14} color="#94A3B8" />
            </TouchableOpacity>

            <View style={styles.quantityRow}>
              {QUANTITIES.map(q => (
                <TouchableOpacity
                  key={q}
                  onPress={() => setQuantity(q)}
                  style={[
                    styles.quantityBtn,
                    quantity === q && styles.quantityBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.quantityText,
                      quantity === q && styles.quantityTextActive,
                    ]}
                  >
                    {q}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSend}
              disabled={!selectedGift || sending}
              accessibilityState={{ disabled: !selectedGift || sending }}
              style={styles.sendBtn}
            >
              <LinearGradient
                colors={['#EC4899', '#F43F5E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.sendGradient}
              >
                <Text style={styles.sendText}>{sending ? 'Sending…' : 'Send'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  emptyText: { color: '#B8ADC8', padding: 24, textAlign: 'center', width: '100%' },
  giftImage: { width: 48, height: 48, marginBottom: 4 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#10091F',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    maxHeight: 480,
  },
  levelProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  levelLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  lvText: {
    color: '#CBD5E1',
    fontWeight: '800',
    fontSize: 11,
  },
  xpBarTrack: {
    width: 90,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
  },
  xpRequireText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D9488',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 2,
  },
  levelStar: {
    fontSize: 9,
  },
  levelBadgeNum: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },
  receiversRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
    marginBottom: 8,
  },
  receiverPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 18,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 6,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  receiverPillActive: {
    borderColor: '#EC4899',
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
  },
  receiverAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  receiverName: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    maxWidth: 80,
  },
  pkTag: {
    backgroundColor: '#EC4899',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  pkTagText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '900',
  },
  categoryTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  catTab: {
    paddingVertical: 8,
    marginRight: 18,
    position: 'relative',
  },
  catTabText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
  catTabTextActive: {
    color: '#FFF',
    fontWeight: '900',
  },
  catActiveIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: '#EC4899',
    borderRadius: 2,
  },
  bagTab: {
    marginLeft: 'auto',
    padding: 6,
  },
  filterScroll: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
  },
  filterChip: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  filterChipActive: {
    backgroundColor: '#EC4899',
    borderColor: '#EC4899',
  },
  filterChipText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: '#FFF',
  },
  giftsScrollView: {
    maxHeight: 200,
  },
  giftsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    paddingBottom: 6,
  },
  giftCard: {
    width: (width - 20) / 4,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    position: 'relative',
  },
  giftCardActive: {
    borderColor: '#EC4899',
    backgroundColor: 'rgba(236, 72, 153, 0.12)',
  },
  giftXpBadge: {
    position: 'absolute',
    top: 2,
    right: 4,
    backgroundColor: 'rgba(236, 72, 153, 0.3)',
    borderRadius: 4,
    paddingHorizontal: 3,
  },
  giftXpText: {
    color: '#F472B6',
    fontSize: 7,
    fontWeight: '800',
  },
  giftIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  giftCardName: {
    color: '#E2E8F0',
    fontSize: 10,
    fontWeight: '700',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  coinCoin: {
    fontSize: 10,
  },
  giftPrice: {
    color: '#FBBF24',
    fontSize: 10,
    fontWeight: '800',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  balancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  balanceText: {
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: '900',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quantityBtn: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  quantityBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  quantityText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  quantityTextActive: {
    color: '#EC4899',
    fontWeight: '900',
  },
  sendBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  sendGradient: {
    paddingHorizontal: 18,
    paddingVertical: 7,
  },
  sendText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
  },
});

