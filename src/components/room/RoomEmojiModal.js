import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { BUNDLED_EMOJIS } from '../../constants/roomEmojis';
import { apiPublic } from '../../utils/apiUtil';

const { width } = Dimensions.get('window');

const CLASSIC_EMOJIS = [
  '❤️', '🔥', '👍', '🎉', '😂', '😍', '✨', '👑',
  '🌸', '🌹', '💯', '🥳', '😎', '💃', '🕺', '⭐',
  '🚀', '💎', '🥂', '🍀', '🦋', '💖', '🙌', '🤩',
];

const resolveEmojiUrl = (url) => {
  if (!url) return '';
  if (typeof url !== 'string') return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const baseUrl = 'https://api.yaroapp.in';
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default function RoomEmojiModal({
  visible,
  onClose,
  onSelectEmoji,
  emojis: propEmojis,
  initialCategory = 'All',
  bottomSafePadding = 16,
}) {
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [emojiList, setEmojiList] = useState(propEmojis || BUNDLED_EMOJIS);

  useEffect(() => {
    if (propEmojis && propEmojis.length > 0) {
      setEmojiList(propEmojis);
      return;
    }
    let isMounted = true;
    apiPublic
      .get('/emojis')
      .then((res) => {
        if (isMounted && res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          // Merge with local bundled mappings to get bundled local png/gif fallbacks
          const bundledMap = new Map(BUNDLED_EMOJIS.map((e) => [e.code, e]));
          const merged = res.data.data.map((item) => {
            const local = bundledMap.get(item.code);
            return {
              ...item,
              localPng: local?.localPng,
              localGif: local?.localGif,
            };
          });
          setEmojiList(merged);
        }
      })
      .catch((err) => {
        // Fallback safely to local bundled emojis
        console.warn('[RoomEmojiModal] Remote fetch notice:', err?.message || err);
      });
    return () => {
      isMounted = false;
    };
  }, [propEmojis]);

  const categories = useMemo(() => {
    const set = new Set(['All']);
    (emojiList || []).forEach((e) => {
      if (e.category) set.add(e.category);
    });
    set.add('Classic');
    return Array.from(set);
  }, [emojiList]);

  const filteredEmojis = useMemo(() => {
    if (activeCategory === 'All') return emojiList;
    if (activeCategory === 'Classic') return [];
    return (emojiList || []).filter((e) => e.category === activeCategory);
  }, [activeCategory, emojiList]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={[styles.sheetContainer, { paddingBottom: bottomSafePadding + 16 }]}>
          <View style={styles.sheetHandle} />

          {/* Header & Category Tabs */}
          <View style={styles.headerRow}>
            <Text style={styles.sheetTitle}>Room Reactions</Text>
          </View>

          {/* Categories Horizontal Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {categories.map((cat) => {
              const isActive = cat === activeCategory;
              return (
                <TouchableOpacity
                  key={`cat-${cat}`}
                  style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                  onPress={() => setActiveCategory(cat)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Emojis Grid */}
          <ScrollView
            contentContainerStyle={styles.emojiGrid}
            showsVerticalScrollIndicator={false}
          >
            {activeCategory === 'Classic' ? (
              CLASSIC_EMOJIS.map((emoji, idx) => (
                <TouchableOpacity
                  key={`classic-${idx}`}
                  style={styles.classicEmojiBtn}
                  onPress={() => {
                    onClose();
                    onSelectEmoji && onSelectEmoji(emoji);
                  }}
                  activeOpacity={0.8}
                >
                  <Text allowFontScaling={false} style={styles.emojiGlyph}>{emoji}</Text>
                </TouchableOpacity>
              ))
            ) : (
              filteredEmojis.map((item, idx) => {
                const imgSource = item.localPng
                  ? item.localPng
                  : { uri: resolveEmojiUrl(item.pngUrl || item.icon) };

                return (
                  <TouchableOpacity
                    key={`emoji-${item.code || idx}`}
                    style={styles.emojiCard}
                    onPress={() => {
                      onClose();
                      onSelectEmoji && onSelectEmoji(item);
                    }}
                    activeOpacity={0.75}
                  >
                    <View style={styles.emojiIconWrap}>
                      <Image
                        source={imgSource}
                        style={styles.emojiImage}
                        resizeMode="contain"
                      />
                    </View>
                    <Text numberOfLines={2} style={styles.emojiName}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    width: '100%',
    backgroundColor: '#121422',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 12,
    maxHeight: 440,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#334155',
    alignSelf: 'center',
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  sheetTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#94A3B8',
    textAlign: 'center',
  },
  categoryScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
    paddingBottom: 10,
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  categoryPillActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  categoryTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 8,
    paddingBottom: 16,
    paddingTop: 4,
  },
  emojiCard: {
    width: (width - 24 - 32) / 4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 14,
    backgroundColor: '#1E2338',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  emojiIconWrap: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emojiImage: {
    width: 44,
    height: 44,
  },
  emojiName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#E2E8F0',
    textAlign: 'center',
    lineHeight: 12,
    marginTop: 2,
    paddingHorizontal: 2,
    width: '100%',
  },
  classicEmojiBtn: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#1E2338',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    margin: 4,
  },
  emojiGlyph: {
    color: '#FFFFFF',
    fontSize: 36,
    lineHeight: 46,
    includeFontPadding: false,
  },
});
