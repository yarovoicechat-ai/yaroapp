import React from 'react';
import IdentityDisplayName from '../identity/IdentityDisplayName';
import { View, Text, StyleSheet, Dimensions, useWindowDimensions, Image, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon from 'react-native-vector-icons/Ionicons';
import { getUserAvatar } from '../../utils/avatarUtil';
import SvgaView from '../SvgaView';
import { resolveGiftVisual } from '../gift/giftMediaUtils';

const { width } = Dimensions.get('window');
const MAX_BUBBLE_WIDTH = Math.floor(width * 0.78);

export default function ResponsiveChatBubble({
  message,
  sender,
  isVip = false,
  isSvip = false,
  bubbleConfig,
  onPressUser,
  onMention,
}) {
  const { width: viewportWidth } = useWindowDimensions();
  const responsiveWidth = Math.max(160, viewportWidth - 32);
  const text = String(message?.text || message?.content || '');
  const senderName = sender?.name || message?.user || message?.senderName || 'User';
  const isSvipUser = Boolean(isSvip || message?.isSvip || message?.svipLevel || sender?.isSvip || sender?.equippedSvipId);
  const isVipUser = Boolean(isVip || message?.isVip || message?.vipLevel || sender?.isVip || sender?.equippedVipId);
  const svipLevel = message?.svipLevel || sender?.svipLevel || (isSvipUser ? 1 : null);
  const vipLevel = message?.vipLevel || sender?.vipLevel || (isVipUser ? 1 : null);
  const nameEffect = message?.nameEffect || sender?.nameEffect || sender?.effectiveIdentity?.nameEffect ||
    ((isVipUser || isSvipUser) ? { colors: ['#FFE890', '#FFF8D6', '#E9B74D'], animationType: 'shimmer' } : undefined);
  const rawAvatar = sender?.avatar || message?.avatar || null;
  const avatarSource = getUserAvatar({ avatar: rawAvatar, image: rawAvatar, gender: message?.gender || sender?.gender || 'female' });
  const isOwner = Boolean(message?.isOwner || message?.userRole === 'owner' || message?.role === 'owner');
  const isStaff = Boolean(message?.isStaff || message?.userRole === 'staff' || sender?.isStaff);
  const isAdmin = Boolean(message?.isAdmin || message?.userRole === 'admin' || sender?.isAdmin);
  const wealthLevel = message?.wealthLevel ?? message?.level ?? sender?.wealthLevel ?? sender?.level ?? 1;
  const charmLevel = message?.charmLevel ?? sender?.charmLevel ?? sender?.charm ?? 0;
  const userLevel = wealthLevel;
  const clubName = message?.clubName || sender?.clubName || '';

  const handlePressUser = () => {
    if (!onPressUser) return;
    const resolvedId =
      message?.userId ||
      message?.senderId ||
      message?.sender?.userId ||
      message?.sender?.id ||
      message?.sender?._id ||
      message?.user?._id ||
      message?.user?.id ||
      message?.user?.userId ||
      sender?.userId ||
      sender?.id ||
      sender?._id ||
      null;
    onPressUser({
      ...sender,
      ...message,
      userId: resolvedId,
      id: resolvedId,
      _id: resolvedId,
      name: senderName,
      avatar: rawAvatar,
      image: rawAvatar,
      gender: message?.gender || sender?.gender || 'female',
      isVip: isVipUser,
      isSvip: isSvipUser,
      vipLevel,
      svipLevel,
    });
  };

  // Equipped Tag & Tag Animation File (uploaded in panel)
  const equippedTagAsset = message?.equippedTagAsset || sender?.equippedTagAsset || null;
  const equippedTag = message?.equippedTag || sender?.equippedTag || equippedTagAsset?.name || null;
  const tagMedia = equippedTagAsset?.animationUrl || equippedTagAsset?.imageUrl || null;
  const isTagSvga = Boolean(tagMedia && /\.svga(?:[?#]|$)/i.test(tagMedia));

  // Equipped Badges
  const badgeSource = Array.isArray(message?.equippedBadges)
    ? message.equippedBadges
    : Array.isArray(sender?.equippedBadges) ? sender.equippedBadges
      : message?.equippedBadgeAsset ? [message.equippedBadgeAsset] : [];
  const equippedBadges = badgeSource.filter(badge => badge && typeof badge === 'object' && badge.isActive !== false &&
    (!badge.expiresAt || new Date(badge.expiresAt).getTime() > Date.now()));

  const equippedFrame =
    message?.equippedFrameAsset ||
    message?.equippedFrame ||
    sender?.equippedFrameAsset ||
    sender?.equippedFrame ||
    null;

  const activeBubble =
    bubbleConfig ||
    message?.chatBubbleAsset ||
    message?.chatBubble ||
    message?.bubble ||
    sender?.equippedChatBubbleAsset ||
    sender?.equippedChatBubble ||
    null;

  const bubbleName = (
    typeof activeBubble === 'string'
      ? activeBubble
      : (activeBubble?.name || activeBubble?.id || '')
  ).toLowerCase();

  const getCustomBubble = () => {
    if (!activeBubble || typeof activeBubble !== 'object') return null;
    const metadata = activeBubble.metadata || {};
    const rawColors =
      activeBubble.bgColors ||
      activeBubble.backgroundColors ||
      metadata.bgColors ||
      metadata.backgroundColors ||
      activeBubble.bubbleBg ||
      metadata.bubbleBg;
    const colors = Array.isArray(rawColors)
      ? rawColors
      : rawColors
        ? [rawColors, rawColors]
        : ['#1E293B', '#334155'];
    return {
      colors,
      borderColor:
        activeBubble.borderColor ||
        metadata.borderColor ||
        activeBubble.bubbleBorder ||
        metadata.bubbleBorder ||
        activeBubble.previewColor ||
        '#64748B',
      textColor:
        activeBubble.textColor ||
        metadata.textColor ||
        activeBubble.bubbleText ||
        metadata.bubbleText ||
        '#F8FAFC',
      badge: null,
    };
  };

  const customBubble = getCustomBubble();

  // Welcome card matching Screenshot 4
  if (message?.type === 'welcome') {
    const targetUserName = message.targetUserName || 'Friend';
    const hostName = message.roomHostName || 'Host';
    const avatar = message.avatar || message.roomHostAvatar || 'https://api.yaroapp.in/uploads/avatars/male_default.webp';
    const frame = message.equippedFrame || null;
    const hostLevel = message.hostLevel ?? 4;

    return (
      <View style={[styles.welcomeCardContainer, { maxWidth: responsiveWidth, width: undefined }]}>
        <View style={styles.welcomeAvatarWrap}>
          <Image
            source={{ uri: avatar }}
            style={styles.welcomeAvatarClean}
          />
        </View>
        <View style={styles.welcomeRightCol}>
          {/* Row 1: Owner badge + Host name */}
          <View style={styles.welcomeHeaderRow}>
            <LinearGradient
              colors={['#FB7185', '#F43F5E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ownerPillTag}
            >
              <Text style={styles.ownerPillText}>Owner</Text>
            </LinearGradient>
            <Text style={styles.welcomeHostTitle} numberOfLines={1}>
              {hostName}
            </Text>
          </View>

          {/* Row 2: Levels Lv.4, Lv.0 */}
          <View style={styles.welcomeLevelsRow}>
            <View style={styles.levelPillBronze}>
              <MaterialCommunityIcons name="star-four-points" size={10} color="#FFF" style={{ marginRight: 2 }} />
              <Text style={styles.levelPillText}>Lv.{hostLevel}</Text>
            </View>
            <View style={styles.levelPillSilver}>
              <MaterialCommunityIcons name="star" size={10} color="#CBD5E1" style={{ marginRight: 2 }} />
              <Text style={styles.levelPillText}>Lv.0</Text>
            </View>
          </View>

          {/* Row 3: @Username (Yellow & Clickable) Greetings from {hostName},welcome to my chatroom! 🥰 */}
          <Text style={styles.welcomeMessageText}>
            <Text
              style={styles.welcomeMentionYellow}
              onPress={() => onMention && onMention(targetUserName)}
            >
              @{targetUserName}{' '}
            </Text>
            <Text style={styles.welcomeGreetingText}>
              Greetings from {hostName},welcome to my chatroom! 🥰
            </Text>
          </Text>
        </View>
      </View>
    );
  }

  // 1. Gift Received Message (Image 1 Model)
  if (message?.type === 'gift') {
    const giftName = message?.giftName || message?.gift || 'Gift';
    const giftCount = message?.count || message?.quantity || message?.combo || 1;
    const receiverName = message?.to || message?.receiverName || 'Host';
    const giftVisual = resolveGiftVisual(message);

    return (
      <View style={[styles.giftMessageContainer, { maxWidth: responsiveWidth, width: undefined }]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handlePressUser}
          style={styles.giftAvatarWrapper}
        >
          <Image source={avatarSource} style={styles.giftSenderAvatar} />
        </TouchableOpacity>

        <View style={styles.giftContentCol}>
          <View style={styles.giftUserRow}>
            <Text style={styles.giftSenderName} numberOfLines={1}>
              {senderName} sent a gift
            </Text>
          </View>
          <View style={styles.giftTargetRow}>
            <Text style={styles.sentToLabel}>Sent to </Text>
            <Text style={styles.giftReceiverName}>{receiverName}</Text>
          </View>

          <View style={styles.giftVisualRow}>
            {giftVisual.giftImage ? (
              <Image source={{ uri: giftVisual.giftImage }} style={styles.bigGiftImage} resizeMode="contain" />
            ) : giftVisual.giftIcon ? (
              <Text style={styles.bigGiftEmoji}>{giftVisual.giftIcon}</Text>
            ) : (
              <MaterialCommunityIcons name="gift-outline" size={30} color="#FDE68A" />
            )}
            <Text style={styles.giftNameText} numberOfLines={1}>{giftName}</Text>
            <Text style={styles.giftMultiplierText}>x{giftCount}</Text>
          </View>
        </View>
      </View>
    );
  }

  // 2. VIP / SVIP / Owner / Regent Royal Ornate Bubble (Matches Image in User Reference!)
  if (!customBubble && (svipLevel || isSvipUser || isVipUser || isOwner || wealthLevel >= 10)) {
    return (
      <View style={[styles.luxuryBubbleContainer, { maxWidth: responsiveWidth, width: undefined }]}>
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
              onPress={handlePressUser}
              style={styles.royalAvatarBorder}
            >
              <Image source={avatarSource} style={styles.royalAvatarImg} />
            </TouchableOpacity>

            <View style={styles.royalUserMetaCol}>
              <View style={styles.royalNameRow}>
                {isOwner ? (
                  <LinearGradient
                    colors={['#EF4444', '#DC2626']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.ownerPillTag}
                  >
                    <Text style={styles.ownerPillText}>Owner</Text>
                  </LinearGradient>
                ) : isStaff ? (
                  <View style={[styles.ownerPillTag, { backgroundColor: '#DC2626' }]}>
                    <Text style={styles.ownerPillText}>🛡️ Staff</Text>
                  </View>
                ) : isAdmin ? (
                  <View style={[styles.ownerPillTag, { backgroundColor: '#4F46E5' }]}>
                    <Text style={styles.ownerPillText}>Admin</Text>
                  </View>
                ) : null}
                <IdentityDisplayName name={senderName} effect={nameEffect} style={styles.royalGoldName} />
              </View>

              {/* Tag Banner Row (Animation File / Theme Asset from Admin Panel) */}
              {Boolean(tagMedia || equippedTag) && (
                <View style={styles.chatTagContainer}>
                  {tagMedia ? (
                    isTagSvga ? (
                      <SvgaView source={tagMedia} style={styles.chatTagSvga} resizeMode="contain" />
                    ) : (
                      <Image source={{ uri: tagMedia }} style={styles.chatTagImage} resizeMode="contain" />
                    )
                  ) : (
                    <View style={styles.chatTagTextPill}>
                      <Text style={styles.chatTagTextString}>{equippedTag}</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Badges Row with SVIP, Wealth Level & Charm Level */}
              <View style={styles.badgesRow}>
                {Boolean(isSvipUser || svipLevel) ? (
                  <LinearGradient
                    colors={['#B45309', '#F59E0B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.svipBadgePill}
                  >
                    <MaterialCommunityIcons name="shield-crown" size={10} color="#FEF08A" />
                    <Text style={styles.svipBadgeText}>SVIP{svipLevel || 1}</Text>
                  </LinearGradient>
                ) : Boolean(isVipUser || vipLevel) ? (
                  <LinearGradient
                    colors={['#D97706', '#F59E0B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.svipBadgePill}
                  >
                    <MaterialCommunityIcons name="crown" size={10} color="#FEF08A" />
                    <Text style={styles.svipBadgeText}>VIP{vipLevel || 1}</Text>
                  </LinearGradient>
                ) : null}

                {/* Wealth Level: Blue Badge [🛡️ Lv.54] */}
                <View style={styles.levelBadgeShield}>
                  <Text style={styles.levelBadgeIcon}>🛡️</Text>
                  <Text style={styles.levelBadgeText}>Lv.{wealthLevel}</Text>
                </View>

                {/* Charm Level: Purple Badge [👑 Lv.59] */}
                <View style={styles.levelBadgePurple}>
                  <Text style={styles.levelBadgeIcon}>👑</Text>
                  <Text style={styles.levelBadgeText}>Lv.{charmLevel}</Text>
                </View>

                {Boolean(clubName) && (
                  <View style={styles.clubPillBadge}>
                    <Text style={styles.clubPillText}>💎 {clubName}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {equippedBadges.length > 0 && (
            <View style={styles.honorMedalsRow}>
              {equippedBadges.slice(0, 8).map((badge, index) => {
                const icon = badge.imageUrl || badge.image || badge.icon;
                if (!icon || typeof icon !== 'string') return null;
                return (icon.startsWith('http://') || icon.startsWith('https://') || icon.startsWith('/'))
                  ? <Image key={index} accessibilityLabel={badge.name || 'Equipped badge'} source={{ uri: icon.startsWith('/') ? 'https://api.yaroapp.in' + icon : icon }} style={styles.shelfMedalIcon} resizeMode="contain" />
                  : <Text key={index} style={styles.honorMedal}>{icon}</Text>;
              })}
            </View>
          )}

          {/* Message Text with Golden Accent & Yellow Mention */}
          <Text style={styles.royalMessageText}>
            {text.startsWith('@') ? (
              <>
                <Text style={styles.chatMentionHighlight}>{text.split(' ')[0]} </Text>
                <Text>{text.substring(text.indexOf(' ') + 1)}</Text>
              </>
            ) : (
              text
            )}
          </Text>

          {/* Bottom Wing Ornament */}
          <View style={styles.bottomWingsEmblem}>
            <MaterialCommunityIcons name="crown-outline" size={14} color="#FBBF24" />
          </View>
        </LinearGradient>
      </View>
    );
  }

  // 3. VIP 4 / SVIP 4 Luxury Gold & Ruby Chat Bubble (Uploaded by user)
  if (
    !customBubble &&
    (svipLevel === 4 || vipLevel === 4)
  ) {
    return (
      <View style={[styles.luxuryBubbleContainer, { maxWidth: responsiveWidth, width: undefined }]}>
        <View style={styles.vip4BubbleWrapper}>
          {/* Top-Left Ruby Gem Wing Emblem */}
          <View style={styles.vip4RubyWingEmblem}>
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              style={styles.vip4WingGoldBase}
            >
              <LinearGradient
                colors={['#EF4444', '#DC2626', '#991B1B']}
                style={styles.vip4RubyDiamond}
              >
                <MaterialCommunityIcons name="diamond-stone" size={13} color="#FFF" />
              </LinearGradient>
            </LinearGradient>
          </View>

          {/* Main Gold-Bordered Bubble Body */}
          <LinearGradient
            colors={['#334155', '#1E293B', '#0F172A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.vip4BubbleBody}
          >
            {/* Header */}
            <View style={styles.royalTopHeader}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handlePressUser}
                style={styles.vip4AvatarBorder}
              >
                <Image source={avatarSource} style={styles.royalAvatarImg} />
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
                  <IdentityDisplayName name={senderName} effect={nameEffect} style={styles.vip4GoldName} />
                </View>

                {/* Tag Banner Row */}
                {Boolean(tagMedia || equippedTag) && (
                  <View style={styles.chatTagContainer}>
                    {tagMedia ? (
                      isTagSvga ? (
                        <SvgaView source={tagMedia} style={styles.chatTagSvga} resizeMode="contain" />
                      ) : (
                        <Image source={{ uri: tagMedia }} style={styles.chatTagImage} resizeMode="contain" />
                      )
                    ) : (
                      <View style={styles.chatTagTextPill}>
                        <Text style={styles.chatTagTextString}>{equippedTag}</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Badges Row */}
                <View style={styles.badgesRow}>
                  <LinearGradient
                    colors={['#DC2626', '#EF4444', '#F59E0B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.vip4BadgePill}
                  >
                    <MaterialCommunityIcons name="crown" size={10} color="#FEF08A" />
                    <Text style={styles.svipBadgeText}>VIP 4</Text>
                  </LinearGradient>

                  <View style={styles.levelBadgeShield}>
                    <Text style={styles.levelBadgeIcon}>🛡️</Text>
                    <Text style={styles.levelBadgeText}>Lv.{wealthLevel}</Text>
                  </View>

                  <View style={styles.levelBadgePurple}>
                    <Text style={styles.levelBadgeIcon}>👑</Text>
                    <Text style={styles.levelBadgeText}>Lv.{charmLevel}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Message Text */}
            <Text style={styles.vip4MessageText}>{text}</Text>

            {/* Bottom-Right Hexagonal VIP4 Plaque with Sparkle */}
            <View style={styles.vip4PlaqueWrap}>
              <LinearGradient
                colors={['#DC2626', '#B91C1C', '#7F1D1D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.vip4PlaqueInner}
              >
                <Text style={styles.vip4PlaqueText}>VIP4</Text>
                <MaterialCommunityIcons name="sparkles" size={11} color="#FFF" style={styles.vip4Sparkle} />
              </LinearGradient>
            </View>
          </LinearGradient>
        </View>
      </View>
    );
  }

  // 3.2 SVIP 3 Wolf Sovereign Amethyst & Cyan Bubble
  if (!customBubble && svipLevel === 3) {
    return (
      <View style={[styles.luxuryBubbleContainer, { maxWidth: responsiveWidth, width: undefined }]}>
        <LinearGradient
          colors={['#0F172A', '#082F49', '#0369A1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.svip3Bubble}
        >
          {/* Header */}
          <View style={styles.royalTopHeader}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handlePressUser}
              style={styles.svip3AvatarBorder}
            >
              <Image source={avatarSource} style={styles.royalAvatarImg} />
            </TouchableOpacity>

            <View style={styles.royalUserMetaCol}>
              <View style={styles.royalNameRow}>
                <IdentityDisplayName name={senderName} effect={nameEffect} style={styles.svip3CyanName} />
              </View>

              {/* Tag Banner */}
              {Boolean(tagMedia || equippedTag) && (
                <View style={styles.chatTagContainer}>
                  {tagMedia ? (
                    isTagSvga ? (
                      <SvgaView source={tagMedia} style={styles.chatTagSvga} resizeMode="contain" />
                    ) : (
                      <Image source={{ uri: tagMedia }} style={styles.chatTagImage} resizeMode="contain" />
                    )
                  ) : (
                    <View style={styles.chatTagTextPill}>
                      <Text style={styles.chatTagTextString}>{equippedTag}</Text>
                    </View>
                  )}
                </View>
              )}

              <View style={styles.badgesRow}>
                <LinearGradient
                  colors={['#06B6D4', '#0284C7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.svipBadgePill}
                >
                  <Text style={styles.svipBadgeText}>🐺 SVIP 3</Text>
                </LinearGradient>

                <View style={styles.levelBadgeShield}>
                  <Text style={styles.levelBadgeIcon}>🛡️</Text>
                  <Text style={styles.levelBadgeText}>Lv.{wealthLevel}</Text>
                </View>

                <View style={styles.levelBadgePurple}>
                  <Text style={styles.levelBadgeIcon}>👑</Text>
                  <Text style={styles.levelBadgeText}>Lv.{charmLevel}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Message Text */}
          <Text style={styles.svip3MessageText}>{text}</Text>

          {/* Corner Wing Emblem */}
          <View style={styles.svip3CornerBadge}>
            <Text style={styles.svip3CornerText}>SVIP 3</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  // 3.3 SVIP 2 Emerald Green & Gold Luxury Bubble
  if (!customBubble && svipLevel && svipLevel >= 2) {
    return (
      <View style={[styles.luxuryBubbleContainer, { maxWidth: responsiveWidth, width: undefined }]}>
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
              onPress={handlePressUser}
              style={styles.emeraldAvatarBorder}
            >
              <Image source={avatarSource} style={styles.royalAvatarImg} />
            </TouchableOpacity>

            <View style={styles.royalUserMetaCol}>
              <View style={styles.royalNameRow}>
                <IdentityDisplayName name={senderName} effect={nameEffect} style={styles.emeraldGoldName} />
              </View>

              {/* Tag Banner */}
              {Boolean(tagMedia || equippedTag) && (
                <View style={styles.chatTagContainer}>
                  {tagMedia ? (
                    isTagSvga ? (
                      <SvgaView source={tagMedia} style={styles.chatTagSvga} resizeMode="contain" />
                    ) : (
                      <Image source={{ uri: tagMedia }} style={styles.chatTagImage} resizeMode="contain" />
                    )
                  ) : (
                    <View style={styles.chatTagTextPill}>
                      <Text style={styles.chatTagTextString}>{equippedTag}</Text>
                    </View>
                  )}
                </View>
              )}

              <View style={styles.badgesRow}>
                <LinearGradient
                  colors={['#047857', '#10B981']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.svipBadgePill}
                >
                  <MaterialCommunityIcons name="crown" size={10} color="#FEF08A" />
                  <Text style={styles.svipBadgeText}>SVIP{svipLevel}</Text>
                </LinearGradient>

                <View style={styles.levelBadgeShield}>
                  <Text style={styles.levelBadgeIcon}>🛡️</Text>
                  <Text style={styles.levelBadgeText}>Lv.{wealthLevel}</Text>
                </View>

                <View style={styles.levelBadgePurple}>
                  <Text style={styles.levelBadgeIcon}>👑</Text>
                  <Text style={styles.levelBadgeText}>Lv.{charmLevel}</Text>
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
            <Text style={styles.emeraldBadgeCornerText}>SVIP{svipLevel}</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  // 3.5 Custom Store Equipped Chat Bubble
  if (customBubble) {
    return (
      <View style={[styles.luxuryBubbleContainer, { maxWidth: responsiveWidth, width: undefined }]}>
        <LinearGradient
          colors={customBubble.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.customEquippedBubble, { borderColor: customBubble.borderColor }]}
        >
          {/* Header Row */}
          <View style={styles.customBubbleHeader}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handlePressUser}
              style={styles.customAvatarWrapper}
            >
              <Image source={avatarSource} style={styles.chatAvatarClean} />
            </TouchableOpacity>

            <View style={styles.customUserMetaCol}>
              <View style={styles.customNameRow}>
                {isOwner && (
                  <View style={[styles.ownerPillTag, { backgroundColor: '#EF4444', marginRight: 4 }]}>
                    <Text style={styles.ownerPillText}>Owner</Text>
                  </View>
                )}
                {isStaff && (
                  <View style={[styles.ownerPillTag, { backgroundColor: '#DC2626', marginRight: 4 }]}>
                    <Text style={styles.ownerPillText}>🛡️ Staff</Text>
                  </View>
                )}
                <IdentityDisplayName name={senderName} effect={nameEffect} style={[styles.customSenderName, { color: customBubble.borderColor }]} />
              </View>

              {/* Tag Banner */}
              {Boolean(tagMedia || equippedTag) && (
                <View style={styles.chatTagContainer}>
                  {tagMedia ? (
                    isTagSvga ? (
                      <SvgaView source={tagMedia} style={styles.chatTagSvga} resizeMode="contain" />
                    ) : (
                      <Image source={{ uri: tagMedia }} style={styles.chatTagImage} resizeMode="contain" />
                    )
                  ) : (
                    <View style={styles.chatTagTextPill}>
                      <Text style={styles.chatTagTextString}>{equippedTag}</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Badges Row with SVIP, Wealth Level & Charm Level */}
              <View style={styles.badgesRow}>
                {Boolean(isSvipUser || svipLevel) ? (
                  <LinearGradient
                    colors={['#D97706', '#F59E0B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.svipBadgePill}
                  >
                    <MaterialCommunityIcons name="shield-crown" size={10} color="#FEF08A" />
                    <Text style={styles.svipBadgeText}>SVIP{svipLevel || 1}</Text>
                  </LinearGradient>
                ) : Boolean(isVipUser || vipLevel) ? (
                  <LinearGradient
                    colors={['#B45309', '#F59E0B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.svipBadgePill}
                  >
                    <MaterialCommunityIcons name="crown" size={10} color="#FEF08A" />
                    <Text style={styles.svipBadgeText}>VIP{vipLevel || 1}</Text>
                  </LinearGradient>
                ) : null}
                <View style={styles.levelBadgeShield}>
                  <Text style={styles.levelBadgeIcon}>🛡️</Text>
                  <Text style={styles.levelBadgeText}>Lv.{wealthLevel}</Text>
                </View>
                <View style={styles.levelBadgePurple}>
                  <Text style={styles.levelBadgeIcon}>🌸</Text>
                  <Text style={styles.levelBadgeText}>Lv.{charmLevel}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Message Text */}
          <Text style={[styles.customBubbleText, { color: customBubble.textColor }]}>
            {text}
          </Text>
        </LinearGradient>
      </View>
    );
  }

  // 4. Regular User Chat Bubble
  return (
    <View style={[styles.normalBubbleRow, { maxWidth: responsiveWidth, width: undefined }]}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handlePressUser}
      >
        <Image source={avatarSource} style={styles.chatAvatarClean} />
      </TouchableOpacity>
      <View style={styles.normalBubbleBox}>
        <View style={styles.normalSenderHeader}>
          {isOwner && (
            <View style={[styles.ownerPillTag, { backgroundColor: '#EF4444', marginRight: 4 }]}>
              <Text style={styles.ownerPillText}>Owner</Text>
            </View>
          )}
          {isStaff && (
            <View style={[styles.ownerPillTag, { backgroundColor: '#DC2626', marginRight: 4 }]}>
              <Text style={styles.ownerPillText}>🛡️ Staff</Text>
            </View>
          )}
          <IdentityDisplayName name={senderName} effect={nameEffect} style={styles.normalSenderName} />
        </View>

        {/* Tag Banner */}
        {Boolean(tagMedia || equippedTag) && (
          <View style={styles.chatTagContainer}>
            {tagMedia ? (
              isTagSvga ? (
                <SvgaView source={tagMedia} style={styles.chatTagSvga} resizeMode="contain" />
              ) : (
                <Image source={{ uri: tagMedia }} style={styles.chatTagImage} resizeMode="contain" />
              )
            ) : (
              <View style={styles.chatTagTextPill}>
                <Text style={styles.chatTagTextString}>{equippedTag}</Text>
              </View>
            )}
          </View>
        )}

        {/* Badges & Both Levels */}
        <View style={styles.badgesRow}>
          {Boolean(isSvipUser || svipLevel) ? (
            <LinearGradient
              colors={['#D97706', '#F59E0B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.svipBadgePill}
            >
              <MaterialCommunityIcons name="shield-crown" size={10} color="#FEF08A" />
              <Text style={styles.svipBadgeText}>SVIP{svipLevel || 1}</Text>
            </LinearGradient>
          ) : Boolean(isVipUser || vipLevel) ? (
            <LinearGradient
              colors={['#B45309', '#F59E0B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.svipBadgePill}
            >
              <MaterialCommunityIcons name="crown" size={10} color="#FEF08A" />
              <Text style={styles.svipBadgeText}>VIP{vipLevel || 1}</Text>
            </LinearGradient>
          ) : null}
          <View style={styles.levelBadgeShield}>
            <Text style={styles.levelBadgeIcon}>🛡️</Text>
            <Text style={styles.levelBadgeText}>Lv.{wealthLevel}</Text>
          </View>
          <View style={styles.levelBadgePurple}>
            <Text style={styles.levelBadgeIcon}>🌸</Text>
            <Text style={styles.levelBadgeText}>Lv.{charmLevel}</Text>
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
    minWidth: 0,
    flexShrink: 1,
    flex: 1,
  },
  giftUserRow: {
    flexWrap: 'wrap',
    minWidth: 0,
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
  giftNameText: {
    flexShrink: 1,
    maxWidth: 100,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
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
    borderRadius: 16,
  },
  emeraldAvatarBorder: {
    borderRadius: 16,
  },
  royalAvatarImg: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  royalUserMetaCol: {
    minWidth: 0,
    flexShrink: 1,
    flex: 1,
  },
  royalNameRow: {
    flexWrap: 'wrap',
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  
  
  royalGoldName: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '900',
    color: '#FEF08A',
  },
  emeraldGoldName: {
    flexShrink: 1,
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
    flexShrink: 1,
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
  },
  normalBubbleBox: {
    minWidth: 0,
    
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
    flexWrap: 'wrap',
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  normalSenderName: {
    flexShrink: 1,
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFD700',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2.5,
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
    flexShrink: 1,
    fontSize: 12.5,
    color: '#FFFFFF',
    fontWeight: '500',
    lineHeight: 17,
  },
  // Welcome Message Card (Matching Reference Screenshot 4)
  welcomeCardContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(10, 37, 51, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(20, 75, 90, 0.65)',
    borderRadius: 14,
    padding: 10,
    marginVertical: 4,
    maxWidth: MAX_BUBBLE_WIDTH + 20,
    gap: 10,
  },
  welcomeAvatarWrap: {
    marginTop: 2,
  },
  welcomeRightCol: {
    minWidth: 0,
    flexShrink: 1,
    flex: 1,
  },
  welcomeHeaderRow: {
    flexWrap: 'wrap',
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  ownerPillTag: {
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  ownerPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  welcomeHostTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },
  welcomeLevelsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 5,
  },
  levelPillBronze: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9A5B28',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 10,
  },
  levelPillSilver: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#64748B',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 10,
  },
  levelPillText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
  },
  welcomeMessageText: {
    fontSize: 12,
    lineHeight: 17,
  },
  welcomeMentionYellow: {
    color: '#FACC15',
    fontWeight: '800',
    fontSize: 12.5,
  },
  welcomeGreetingText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  // Custom Store Equipped Bubble
  customEquippedBubble: {
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 10,
    borderWidth: 1.5,
    maxWidth: MAX_BUBBLE_WIDTH + 20,
    marginVertical: 4,
  },
  customBubbleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  customAvatarWrapper: {
    marginTop: 2,
  },
  customUserMetaCol: {
    minWidth: 0,
    flexShrink: 1,
    flex: 1,
  },
  customNameRow: {
    flexWrap: 'wrap',
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  customSenderName: {
    fontSize: 12,
    fontWeight: '800',
    flexShrink: 1,
  },
  customBadgePill: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  customBadgeText: {
    color: '#000',
    fontSize: 8,
    fontWeight: '900',
  },
  customBubbleText: {
    flexShrink: 1,
    fontSize: 12.5,
    fontWeight: '600',
    lineHeight: 17,
  },
  // VIP 4 Luxury Chat Bubble Styles
  vip4BubbleWrapper: {
    position: 'relative',
    maxWidth: MAX_BUBBLE_WIDTH + 14,
    marginVertical: 4,
  },
  vip4RubyWingEmblem: {
    position: 'absolute',
    top: -8,
    left: -4,
    zIndex: 10,
  },
  vip4WingGoldBase: {
    padding: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE047',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.7,
    shadowRadius: 4,
    elevation: 5,
  },
  vip4RubyDiamond: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FEF08A',
  },
  vip4BubbleBody: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 14,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  vip4AvatarBorder: {
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    borderRadius: 20,
    padding: 1,
  },
  vip4GoldName: {
    color: '#FDE047',
    fontSize: 12.5,
    fontWeight: '900',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(245, 158, 11, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  vip4BadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 8,
    gap: 3,
    borderWidth: 0.8,
    borderColor: '#FDE047',
  },
  vip4MessageText: {
    color: '#F8FAFC',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    marginTop: 6,
    paddingRight: 55,
  },
  vip4PlaqueWrap: {
    position: 'absolute',
    bottom: -6,
    right: 4,
    zIndex: 10,
  },
  vip4PlaqueInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: '#FDE047',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
    elevation: 4,
    gap: 2,
  },
  vip4PlaqueText: {
    color: '#FDE047',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  vip4Sparkle: {
    marginLeft: 1,
  },
  // SVIP 3 Wolf Sovereign Bubble Styles
  svip3Bubble: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#06B6D4',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    maxWidth: MAX_BUBBLE_WIDTH + 14,
    marginVertical: 4,
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  svip3AvatarBorder: {
    borderWidth: 1.5,
    borderColor: '#06B6D4',
    borderRadius: 20,
    padding: 1,
  },
  svip3CyanName: {
    color: '#67E8F9',
    fontSize: 12.5,
    fontWeight: '800',
  },
  svip3MessageText: {
    color: '#F0FDFA',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    marginTop: 6,
    paddingRight: 45,
  },
  svip3CornerBadge: {
    position: 'absolute',
    bottom: 4,
    right: 6,
    backgroundColor: 'rgba(6, 182, 212, 0.25)',
    borderWidth: 0.8,
    borderColor: '#22D3EE',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  svip3CornerText: {
    color: '#A5F3FC',
    fontSize: 8.5,
    fontWeight: '800',
  },
  chatAvatarClean: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  welcomeAvatarClean: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  chatTagContainer: {
    marginVertical: 2,
    alignSelf: 'flex-start',
  },
  chatTagSvga: {
    width: 82,
    height: 22,
  },
  chatTagImage: {
    width: 82,
    height: 22,
  },
  chatTagTextPill: {
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
    borderWidth: 1,
    borderColor: '#EAB308',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  chatTagTextString: {
    color: '#FEF08A',
    fontSize: 9.5,
    fontWeight: '800',
  },
  levelBadgePurple: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    gap: 2,
  },
  shelfMedalIcon: {
    width: 16,
    height: 16,
  },
  chatMentionHighlight: {
    color: '#FACC15',
    fontWeight: '800',
  },
});
