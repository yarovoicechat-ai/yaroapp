import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

export default function LiveChatOverlay({
  messages = [],
  recentGift,
  onSayHi,
  onPressMessage,
}) {
  const listRef = useRef(null);

  useEffect(() => {
    if (messages.length > 0) {
      listRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* 1. Gift Notification Pill (e.g. Rocky Sent 🌹 x 1) */}
      {recentGift && (
        <View style={styles.giftNoticeCard}>
          <Text style={styles.giftNoticeSender}>
            {recentGift.senderName || 'VIP'}
          </Text>
          <Text style={styles.giftNoticeText}> Sent </Text>
          <Text style={styles.giftNoticeIcon}>
            {recentGift.giftEmoji || '🌹'}
          </Text>
          <Text style={styles.giftNoticeQty}>
            {' '}x {recentGift.count || 1}
          </Text>
        </View>
      )}

      {/* 2. Quick "Say Hi" Chip */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onSayHi}
        style={styles.sayHiChip}
      >
        <LinearGradient
          colors={['#06B6D4', '#0D9488']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.sayHiGradient}
        >
          <Icon name="chatbubble" size={13} color="#FFF" />
          <Text style={styles.sayHiText}>Say Hi to the broadcaster</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* 3. Live Chat Messages List */}
      <View style={styles.chatListWrapper}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item, index) => item.id || String(index)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => onPressMessage && onPressMessage(item)}
              style={styles.chatBubble}
            >
              <View style={styles.badgeRow}>
                {/* Level Badge */}
                <View style={styles.levelBadge}>
                  <Text style={styles.levelText}>
                    Lv.{item.level || 1}
                  </Text>
                </View>

                {/* SVIP / VIP Badge */}
                {item.isSvip && (
                  <LinearGradient
                    colors={['#F59E0B', '#EF4444', '#EC4899']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.svipBadge}
                  >
                    <Text style={styles.svipText}>SVIP {item.svipLevel || 1}</Text>
                  </LinearGradient>
                )}

                {/* Sender Name */}
                <Text style={styles.senderName} numberOfLines={1}>
                  {item.senderName || item.user || 'Viewer'}
                </Text>
              </View>

              {/* Message Content */}
              <Text style={styles.messageText}>
                {item.text || item.content}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: width * 0.72,
    maxHeight: 230,
    justifyContent: 'flex-end',
    marginBottom: 8,
    marginLeft: 10,
    zIndex: 10,
  },
  giftNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(244, 114, 182, 0.35)',
  },
  giftNoticeSender: {
    color: '#F472B6',
    fontWeight: '800',
    fontSize: 11,
  },
  giftNoticeText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '600',
  },
  giftNoticeIcon: {
    fontSize: 12,
  },
  giftNoticeQty: {
    color: '#FBBF24',
    fontWeight: '900',
    fontSize: 11,
  },
  sayHiChip: {
    alignSelf: 'flex-start',
    marginBottom: 6,
    borderRadius: 14,
    overflow: 'hidden',
  },
  sayHiGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
  },
  sayHiText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  chatListWrapper: {
    maxHeight: 160,
  },
  listContent: {
    gap: 4,
    paddingBottom: 2,
  },
  chatBubble: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignSelf: 'flex-start',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  levelBadge: {
    backgroundColor: '#0284C7',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  levelText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '900',
  },
  svipBadge: {
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  svipText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '900',
  },
  senderName: {
    color: '#CBD5E1',
    fontWeight: '800',
    fontSize: 10,
    maxWidth: 120,
  },
  messageText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
});

