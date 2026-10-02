import React from 'react';
import { View, Text, StyleSheet, Dimensions, Image, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');
const MAX_BUBBLE_WIDTH = Math.floor(width * 0.78);

export default function ResponsiveChatBubble({
  message,
  sender,
  isVip = false,
  isSvip = false,
  bubbleConfig,
  onPressUser,
}) {
  const text = message?.text || message?.content || '';
  const senderName = sender?.name || message?.user || message?.senderName || 'User';
  const avatar = sender?.avatar || message?.avatar || 'https://api.yaroapp.in/uploads/avatars/female_default.webp';
  const isOwner = Boolean(message?.isOwner || message?.userRole === 'owner');
  const svipLevel = message?.svipLevel || (isSvip ? 1 : null);
  const vipLevel = message?.vipLevel || (isVip ? 1 : null);
  const userLevel = message?.level || 44;
  const charmLevel = message?.charmLevel || 33;
  const clubName = message?.clubName || 'SMCLUB';

  // 1. Gift Received Message (Image 1 Model)
  if (message?.type === 'gift') {
    const giftName = message?.gift || message?.giftName || 'Heart';
    const giftCount = message?.count || message?.quantity || message?.combo || 1;
    const receiverName = message?.to || message?.receiverName || 'Host';
    const giftIcon = message?.giftIcon || message?.icon || '💖';

    return (
      <View style={styles.giftMessageContainer}>
        {/* Sender Avatar */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onPressUser && onPressUser({ name: senderName, avatar })}
          style={styles.giftAvatarWrapper}
        >
          <Image source={{ uri: avatar }} style={styles.giftSenderAvatar} />
          <View style={styles.giftAvatarCrown}>
            <MaterialCommunityIcons name="crown" size={10} color="#F59E0B" />
          </View>
        </TouchableOpacity>

        <View style={styles.giftContentCol}>
          {/* User Name & Badges */}
          <View style={styles.giftUserRow}>
            <MaterialCommunityIcons name="shield-star" size={13} color="#FBBF24" />
            <Text style={styles.giftSenderName} numberOfLines={1}>
              👑 {senderName} 🏆
            </Text>
          </View>

          {/* Badges Row */}
          <View style={styles.badgesRow}>
            <LinearGradient
              colors={['#78350F', '#D97706']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.svipBadgePill}
            >
              <MaterialCommunityIcons name="shield-crown" size={10} color="#FEF08A" />
              <Text style={styles.svipBadgeText}>SVIP1</Text>
            </LinearGradient>

            <View style={styles.levelBadgeGreen}>
              <Text style={styles.levelBadgeIcon}>🌿</Text>
              <Text style={styles.levelBadgeText}>Lv.17</Text>
            </View>

            <View style={styles.levelBadgeBlue}>
              <Text style={styles.levelBadgeIcon}>⭐</Text>
              <Text style={styles.levelBadgeText}>Lv.19</Text>
            </View>

            <View style={styles.miniMedalsRow}>
              <Text style={styles.miniMedal}>🎖️</Text>
              <Text style={styles.miniMedal}>💎</Text>
            </View>
          </View>

          {/* Sent To Target */}
          <View style={styles.giftTargetRow}>
            <Text style={styles.sentToLabel}>Sent to </Text>
            <Text style={styles.giftReceiverName}>🪶{receiverName}💙</Text>
          </View>

          {/* Big Animated Gift Visual with Combo */}
          <View style={styles.giftVisualRow}>
            {message?.giftImage ? (
              <Image source={{ uri: message.giftImage }} style={styles.bigGiftImage} />
            ) : (
              <Text style={styles.bigGiftEmoji}>{giftIcon}</Text>
            )}
            <Text style={styles.giftMultiplierText}>x{giftCount}</Text>
          </View>
        </View>
      </View>
    );
  }

  // 2. VIP 1 / Owner Royal Red-Gold Ornate Bubble (Bubble 1 in Image 1)
  if (isOwner || (svipLevel && svipLevel === 1)) {
    return (
      <View style={styles.luxuryBubbleContainer}>
        {/* Double Gold Ornate Frame */}
        <LinearGradient
          colors={['#4C0519', '#881337', '#3B0712']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.royalRedBubble}
        >
          {/* Top Left Header with Avatar, Owner Tag, Name */}
          <View style={styles.royalTopHeader}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onPressUser && onPressUser({ name: senderName, avatar })}
              style={styles.royalAvatarBorder}
            >
              <Image source={{ uri: avatar }} style={styles.royalAvatarImg} />
            </TouchableOpacity>

            <View style={styles.royalUserMetaCol}>
              <View style={styles.royalNameRow}>
                {isOwner && (
                  <LinearGradient
                    colors={['#EF4444', '#DC2626']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.ownerPillTag}
                  >
                    <Text style={styles.ownerPillText}>Owner</Text>
                  </LinearGradient>
                )}
                <Text style={styles.royalGoldName} numberOfLines={1}>
                  👑 𝓡{senderName.slice(1) || senderName}
                </Text>
              </View>

              {/* Badges Row */}
              <View style={styles.badgesRow}>
                <LinearGradient
                  colors={['#B45309', '#F59E0B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.svipBadgePill}
                >
                  <MaterialCommunityIcons name="shield-crown" size={10} color="#FEF08A" />
                  <Text style={styles.svipBadgeText}>SVIP1</Text>
                </LinearGradient>

                <View style={styles.levelBadgeShield}>
                  <Text style={styles.levelBadgeIcon}>🛡️</Text>
                  <Text style={styles.levelBadgeText}>Lv.{userLevel}</Text>
                </View>

                <View style={styles.levelBadgeGreen}>
                  <Text style={styles.levelBadgeIcon}>🌿</Text>
                  <Text style={styles.levelBadgeText}>Lv.{charmLevel}</Text>
                </View>

                <View style={styles.clubPillBadge}>
                  <Text style={styles.clubPillText}>💎 {clubName}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Row of Medals & Honor Crests */}
          <View style={styles.honorMedalsRow}>
            <Text style={styles.honorMedal}>🎖️</Text>
            <Text style={styles.honorMedal}>🏆</Text>
            <Text style={styles.honorMedal}>🛡️</Text>
            <Text style={styles.honorMedal}>👑</Text>
            <Text style={styles.honorMedal}>⭐</Text>
            <Text style={styles.honorMedal}>🌟</Text>
            <Text style={styles.honorMedal}>⚜️</Text>
          </View>

          {/* Message Text with Golden Accent */}
          <Text style={styles.royalMessageText}>
            {text}
          </Text>

          {/* Bottom Wing Ornament */}
          <View style={styles.bottomWingsEmblem}>
            <MaterialCommunityIcons name="crown-outline" size={14} color="#FBBF24" />
          </View>
        </LinearGradient>
      </View>
    );
  }

  // 3. SVIP 3 Emerald Green & Gold Luxury Bubble (Bubble 2 in Image 1)
  if (svipLevel && svipLevel >= 2) {
    return (
      <View style={styles.luxuryBubbleContainer}>
        <LinearGradient
          colors={['#064E3B', '#047857', '#022C22']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.emeraldBubble}
        >
          {/* Header */}
          <View style={styles.royalTopHeader}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onPressUser && onPressUser({ name: senderName, avatar })}
              style={styles.emeraldAvatarBorder}
            >
              <Image source={{ uri: avatar }} style={styles.royalAvatarImg} />
            </TouchableOpacity>

            <View style={styles.royalUserMetaCol}>
              <View style={styles.royalNameRow}>
                <Text style={styles.emeraldGoldName} numberOfLines={1}>
                  👑 {senderName} 👑
                </Text>
              </View>

              <View style={styles.badgesRow}>
                <LinearGradient
                  colors={['#047857', '#10B981']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.svipBadgePill}
                >
                  <MaterialCommunityIcons name="crown" size={10} color="#FEF08A" />
                  <Text style={styles.svipBadgeText}>SVIP3</Text>
                </LinearGradient>

                <View style={styles.levelBadgeGreen}>
                  <Text style={styles.levelBadgeIcon}>🌿</Text>
                  <Text style={styles.levelBadgeText}>Lv.22</Text>
                </View>

                <View style={styles.levelBadgeBlue}>
                  <Text style={styles.levelBadgeIcon}>⭐</Text>
                  <Text style={styles.levelBadgeText}>Lv.15</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Medals */}
          <View style={styles.honorMedalsRow}>
            <Text style={styles.honorMedal}>🎖️</Text>
            <Text style={styles.honorMedal}>🏆</Text>
            <Text style={styles.honorMedal}>🛡️</Text>
            <Text style={styles.honorMedal}>👑</Text>
            <Text style={styles.honorMedal}>⭐</Text>
            <Text style={styles.honorMedal}>🌟</Text>
          </View>

          {/* Message Text */}
          <Text style={styles.emeraldMessageText}>{text}</Text>

          {/* Corner Eagle/Badge */}
          <View style={styles.emeraldBadgeCorner}>
            <Text style={styles.emeraldBadgeCornerText}>SVIP3</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  // 4. Regular User Chat Bubble
  return (
    <View style={styles.normalBubbleRow}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onPressUser && onPressUser({ name: senderName, avatar })}
      >
        <Image source={{ uri: avatar }} style={styles.normalAvatar} />
      </TouchableOpacity>
      <View style={styles.normalBubbleBox}>
        <View style={styles.normalSenderHeader}>
          <Text style={styles.normalSenderName} numberOfLines={1}>
            {senderName}
          </Text>
          <View style={styles.normalLevelPill}>
            <Text style={styles.normalLevelText}>Lv.{userLevel || 1}</Text>
          </View>
        </View>
        <Text style={styles.normalMessageText}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Gift Bubble Styles
  giftMessageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 5,
    paddingHorizontal: 8,
    maxWidth: MAX_BUBBLE_WIDTH,
  },
  giftAvatarWrapper: {
    position: 'relative',
    marginRight: 8,
  },
  giftSenderAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  giftAvatarCrown: {
    position: 'absolute',
    top: -5,
    right: -2,
    backgroundColor: '#1E1B4B',
    borderRadius: 6,
    padding: 1,
  },
  giftContentCol: {
    flex: 1,
  },
  giftUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  giftSenderName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FDE047',
  },
  giftTargetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  sentToLabel: {
    fontSize: 11,
    color: '#E2E8F0',
    fontWeight: '500',
  },
  giftReceiverName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#38BDF8',
  },
  giftVisualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  bigGiftImage: {
    width: 36,
    height: 36,
    resizeMode: 'contain',
  },
  bigGiftEmoji: {
    fontSize: 26,
  },
  giftMultiplierText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F43F5E',
    textShadowColor: 'rgba(244, 63, 94, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Luxury Ornate Bubble Common
  luxuryBubbleContainer: {
    marginVertical: 6,
    alignSelf: 'flex-start',
    maxWidth: MAX_BUBBLE_WIDTH + 20,
    width: '92%',
  },
  royalRedBubble: {
    borderRadius: 14,
    borderWidth: 1.8,
    borderColor: '#F59E0B',
    padding: 10,
    position: 'relative',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
  },
  emeraldBubble: {
    borderRadius: 14,
    borderWidth: 1.8,
    borderColor: '#10B981',
    padding: 10,
    position: 'relative',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
  },
  royalTopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  royalAvatarBorder: {
    borderWidth: 1.8,
    borderColor: '#FBBF24',
    borderRadius: 18,
    padding: 1,
  },
  emeraldAvatarBorder: {
    borderWidth: 1.8,
    borderColor: '#34D399',
    borderRadius: 18,
    padding: 1,
  },
  royalAvatarImg: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  royalUserMetaCol: {
    flex: 1,
  },
  royalNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  ownerPillTag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  ownerPillText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
  },
  royalGoldName: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FEF08A',
  },
  emeraldGoldName: {
    fontSize: 12,
    fontWeight: '900',
    color: '#A7F3D0',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  svipBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 0.8,
    borderColor: '#FDE047',
  },
  svipBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFF',
  },
  levelBadgeShield: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    gap: 2,
  },
  levelBadgeGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#064E3B',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    gap: 2,
  },
  levelBadgeBlue: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0369A1',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    gap: 2,
  },
  levelBadgeIcon: {
    fontSize: 8,
  },
  levelBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFF',
  },
  clubPillBadge: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  clubPillText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FFF',
  },
  miniMedalsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  miniMedal: {
    fontSize: 10,
  },
  honorMedalsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginVertical: 4,
  },
  honorMedal: {
    fontSize: 12,
  },
  royalMessageText: {
    color: '#FEF08A',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    marginTop: 2,
  },
  emeraldMessageText: {
    color: '#ECFDF5',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    marginTop: 2,
  },
  bottomWingsEmblem: {
    alignSelf: 'center',
    marginTop: 2,
    opacity: 0.8,
  },
  emeraldBadgeCorner: {
    position: 'absolute',
    bottom: -6,
    left: 10,
    backgroundColor: '#059669',
    borderColor: '#34D399',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  emeraldBadgeCornerText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFF',
  },

  // Normal / Default Chat Bubble
  normalBubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 4,
    maxWidth: MAX_BUBBLE_WIDTH + 30,
    gap: 7,
  },
  normalAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  normalBubbleBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.48)',
    borderRadius: 14,
    borderTopLeftRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flexShrink: 1,
  },
  normalSenderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  normalSenderName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FDE68A',
  },
  normalLevelPill: {
    backgroundColor: '#3B82F6',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  normalLevelText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFF',
  },
  normalMessageText: {
    fontSize: 12.5,
    color: '#FFFFFF',
    fontWeight: '500',
    lineHeight: 17,
  },
});
