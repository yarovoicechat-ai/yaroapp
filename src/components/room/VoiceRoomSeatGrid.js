import React from 'react';
import { Animated, Dimensions, Image, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import VipMicWave from './VipMicWave';
import IdentityDisplayName from '../identity/IdentityDisplayName';
import AvatarWithFrame from '../AvatarWithFrame';
import { DEFAULT_SEAT_IMAGE, LOCK_SEAT_IMAGE } from '../../utils/cosmeticResolver';

const { width } = Dimensions.get('window');
const seatNameEffect = user => user?.nameEffect || user?.effectiveIdentity?.nameEffect ||
  ((user?.equippedVipId || user?.equippedSvipId)
    ? { colors: ['#FFE890', '#FFF8D6', '#E9B74D'], animationType: 'shimmer' } : undefined);

const AnimatedSeatReaction = React.memo(function AnimatedSeatReaction({ emoji, id }) {
  const anim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    anim.setValue(0);
    Animated.sequence([
      Animated.spring(anim, {
        toValue: 1,
        friction: 4,
        tension: 70,
        useNativeDriver: true,
      }),
      Animated.timing(anim, {
        toValue: 2,
        duration: 1800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [id]);

  const translateY = anim.interpolate({
    inputRange: [0, 0.4, 1, 2],
    outputRange: [6, -10, -32, -58],
  });

  const translateX = anim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1, 1.5, 2],
    outputRange: [0, -4, 4, -3, 2, -2, 0],
  });

  const scale = anim.interpolate({
    inputRange: [0, 0.35, 0.7, 1.4, 2],
    outputRange: [0.3, 1.35, 1.15, 1.0, 0.5],
  });

  const opacity = anim.interpolate({
    inputRange: [0, 0.1, 1.3, 2],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: -26,
        alignSelf: 'center',
        zIndex: 99999,
        elevation: 99999,
        transform: [{ translateY }, { translateX }, { scale }],
        opacity,
      }}
    >
      <Text
        style={{
          fontSize: 34,
          textAlign: 'center',
          textShadowColor: 'rgba(0,0,0,0.65)',
          textShadowOffset: { width: 0, height: 2 },
          textShadowRadius: 6,
        }}
      >
        {emoji}
      </Text>
    </Animated.View>
  );
});

export default function VoiceRoomSeatGrid({
  topTwoSeats,
  bottomSeatRows,
  isCompactLayout,
  speakingSeatIndices,
  activeSeatSkin,
  user,
  room,
  showSeatCharm,
  handleSeatPress,
  registerGiftAvatarPosition,
  activeSeatReactions,
  styles,
}) {
  return (
      <View style={styles.seatsAreaContainer}>
        {/* 1. TOP ROW: 2 FEATURED SEATS (Centered: Host 👑 & Co-Host 💖) */}
        <View style={styles.topTwoSeatsRow}>
          {topTwoSeats.map((seat) => {
            const isHostSeat = seat.seatIndex === 0;
            const isOccupied = Boolean(seat.user);
            return (
              <TouchableOpacity
                key={`top-seat-${seat.seatIndex}`}
                style={styles.topFeaturedSeatItem}
                onPress={() => {
                  handleSeatPress(seat);
                }}
                activeOpacity={0.85}
              >
                {isOccupied ? (
                  <View style={styles.occupiedSeatWrapper}>
                    <VipMicWave
                      state={seat.isMuted ? 'MUTED' : ((seat.isSpeaking || speakingSeatIndices?.has?.(seat.seatIndex) || speakingSeatIndices?.has?.(Number(seat.seatIndex)) || speakingSeatIndices?.has?.(String(seat.seatIndex))) ? 'SPEAKING' : 'IDLE')}
                      waveColors={isHostSeat ? ['#F59E0B', '#FBBF24', '#D97706'] : ['#EC4899', '#F472B6', '#DB2777']}
                      intensity={1.15}
                      size={62}
                    >
                      <View
                        ref={(ref) => registerGiftAvatarPosition(ref, [
                          seat.user.userId,
                          seat.user.id,
                          seat.user._id,
                          seat.user.name,
                          seat.seatIndex === 0 ? 'host' : null,
                          seat.seatIndex === 1 ? 'cohost' : null,
                          seat.seatIndex === 0 ? room?.hostId : null,
                          seat.seatIndex === 0 ? room?.ownerId : null,
                          seat.seatIndex === 0 ? room?.hostName : null,
                        ])}
                        style={[styles.topFeaturedAvatarBox, { width: 60, height: 60, borderRadius: 30 }]}
                      >
                        <AvatarWithFrame
                          user={seat.user}
                          frame={seat.user?.equippedFrameAsset || seat.user?.equippedFrame || (seat.user?.isCurrentUser ? (user?.equippedFrameAsset || user?.equippedFrame) : null)}
                          size={54}
                          showOnlineDot={false}
                        />
                        {seat.isMuted && (
                          <View style={styles.micMuteBadge}>
                            <Icon name="mic-off" size={7} color="#FFF" />
                          </View>
                        )}
                      </View>
                    </VipMicWave>
                    <IdentityDisplayName name={seat.user.name} effect={seatNameEffect(seat.user)} style={styles.topSeatUserName} />
                    {showSeatCharm && (
                      <View style={styles.charmPill}>
                        <Text style={styles.charmFlower}>🌸</Text>
                        <Text style={styles.charmVal}>{seat.charm || 0}</Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={styles.emptySeatWrapper}>
                    <View style={[styles.topFeaturedEmptyCircle, { width: 62, height: 62, borderRadius: 31, borderWidth: 0, borderColor: 'transparent', backgroundColor: 'transparent', overflow: 'hidden' }]}>
                      {seat.isLocked ? (
                        <Image
                          source={LOCK_SEAT_IMAGE}
                          style={{ width: 56, height: 56, borderRadius: 28 }}
                          resizeMode="cover"
                        />
                      ) : (
                        <Image
                          source={DEFAULT_SEAT_IMAGE}
                          style={{ width: 56, height: 56, borderRadius: 28 }}
                          resizeMode="cover"
                        />
                      )}
                    </View>
                    <Text style={[styles.topSeatLabel, isHostSeat ? styles.hostLabelColor : styles.cpLabelColor]}>
                      {seat.isLocked ? 'Locked 🔒' : (isHostSeat ? 'Host 👑' : 'Co-Host 💖')}
                    </Text>
                    {showSeatCharm && (
                      <View style={styles.charmPill}>
                        <Text style={styles.charmFlower}>🌸</Text>
                        <Text style={styles.charmVal}>0</Text>
                      </View>
                    )}
                  </View>
                )}
                {activeSeatReactions?.[seat.seatIndex] && (
                  <AnimatedSeatReaction
                    key={activeSeatReactions[seat.seatIndex].id}
                    emoji={activeSeatReactions[seat.seatIndex].emoji}
                    id={activeSeatReactions[seat.seatIndex].id}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 2. BOTTOM SEAT ROWS: 5 in a line for > 8 seats */}
        {bottomSeatRows.map((row, rowIdx) => (
          <View key={`bottom-row-${rowIdx}`} style={[styles.seatsRow, { marginTop: 10 }]}>
            {row.map((seat) => {
              const seatNum = `No.${seat.seatIndex + 1}`;
              const isOccupied = Boolean(seat.user);
              const seatWidth = isCompactLayout ? (width - 16) / 5 : (width - 24) / 4;
              const circleSize = isCompactLayout ? 50 : 58;
              const avatarSize = isCompactLayout ? 46 : 54;

              return (
                <TouchableOpacity
                  key={`seat-${seat.seatIndex}`}
                  style={[styles.seatItem, { width: seatWidth }]}
                  onPress={() => {
                    handleSeatPress(seat);
                  }}
                  activeOpacity={0.85}
                >
                  {isOccupied ? (
                    <View style={styles.occupiedSeatWrapper}>
                      <VipMicWave
                        state={seat.isMuted ? 'MUTED' : ((seat.isSpeaking || speakingSeatIndices?.has?.(seat.seatIndex) || speakingSeatIndices?.has?.(Number(seat.seatIndex)) || speakingSeatIndices?.has?.(String(seat.seatIndex))) ? 'SPEAKING' : 'IDLE')}
                        waveColors={activeSeatSkin?.ringColors || ['#10B981', '#06B6D4', '#3B82F6']}
                        intensity={1.1}
                        size={circleSize}
                      >
                        <View
                          ref={(ref) => registerGiftAvatarPosition(ref, [
                            seat.user.userId,
                            seat.user.id,
                            seat.user._id,
                            seat.user.name,
                          ])}
                          style={[
                          styles.occupiedAvatarContainer,
                          {
                            width: circleSize,
                            height: circleSize,
                            borderRadius: circleSize / 2,
                            borderWidth: 0,
                            borderColor: 'transparent',
                            overflow: 'visible',
                          },
                        ]}
                        >
                          <AvatarWithFrame
                            user={seat.user}
                            frame={seat.user?.equippedFrameAsset || seat.user?.equippedFrame || (seat.user?.isCurrentUser ? (user?.equippedFrameAsset || user?.equippedFrame) : null)}
                            size={avatarSize}
                            showOnlineDot={false}
                          />
                          {seat.isMuted && (
                            <View style={styles.micMuteBadge}>
                              <Icon name="mic-off" size={7} color="#FFF" />
                            </View>
                          )}
                        </View>
                      </VipMicWave>
                      <IdentityDisplayName name={seat.user.name} effect={seatNameEffect(seat.user)} isCrowded={isCompactLayout} style={[styles.seatUserName, isCompactLayout && { fontSize: 9.5, maxWidth: 66 }]} />
                      {showSeatCharm && (
                        <View style={[styles.charmPill, isCompactLayout && { paddingHorizontal: 3, paddingVertical: 0 }]}>
                          <Text style={styles.charmFlower}>🌸</Text>
                          <Text style={[styles.charmVal, isCompactLayout && { fontSize: 8 }]}>{seat.charm || 0}</Text>
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={styles.emptySeatWrapper}>
                      <View style={[
                        styles.emptySeatCircle,
                        {
                          width: circleSize,
                          height: circleSize,
                          borderRadius: circleSize / 2,
                          borderColor: 'transparent',
                          backgroundColor: 'transparent',
                          borderWidth: 0,
                          overflow: 'hidden',
                          alignItems: 'center',
                          justifyContent: 'center',
                        },
                      ]}>
                        {seat.isLocked ? (
                          <Image
                            source={LOCK_SEAT_IMAGE}
                            style={{
                              width: circleSize,
                              height: circleSize,
                              borderRadius: circleSize / 2,
                            }}
                            resizeMode="cover"
                          />
                        ) : activeSeatSkin?.imageUrl ? (
                          <Image
                            source={typeof activeSeatSkin.imageUrl === 'string' ? { uri: activeSeatSkin.imageUrl } : activeSeatSkin.imageUrl}
                            style={{
                              width: circleSize,
                              height: circleSize,
                              borderRadius: circleSize / 2,
                            }}
                            resizeMode="cover"
                          />
                        ) : (
                          <Image
                            source={DEFAULT_SEAT_IMAGE}
                            style={{
                              width: circleSize,
                              height: circleSize,
                              borderRadius: circleSize / 2,
                            }}
                            resizeMode="cover"
                          />
                        )}
                      </View>
                      <Text style={[styles.seatNumText, isCompactLayout && { fontSize: 8.5 }, seat.isLocked && { color: '#F59E0B' }]}>
                        {seat.isLocked ? 'Locked 🔒' : seatNum}
                      </Text>
                      {showSeatCharm && (
                        <View style={[styles.charmPill, isCompactLayout && { paddingHorizontal: 3, paddingVertical: 0 }]}>
                          <Text style={styles.charmFlower}>🌸</Text>
                          <Text style={[styles.charmVal, isCompactLayout && { fontSize: 8 }]}>0</Text>
                        </View>
                      )}
                    </View>
                  )}
                  {activeSeatReactions?.[seat.seatIndex] && (
                    <AnimatedSeatReaction
                      key={activeSeatReactions[seat.seatIndex].id}
                      emoji={activeSeatReactions[seat.seatIndex].emoji}
                      id={activeSeatReactions[seat.seatIndex].id}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

  );
}
