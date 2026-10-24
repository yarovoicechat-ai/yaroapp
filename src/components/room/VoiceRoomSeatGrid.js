import React from 'react';
import { Dimensions, Image, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import VipMicWave from './VipMicWave';
import AvatarWithFrame from '../AvatarWithFrame';
import { DEFAULT_SEAT_IMAGE, LOCK_SEAT_IMAGE } from '../../utils/cosmeticResolver';

const { width } = Dimensions.get('window');

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
                      size={56}
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
                        style={styles.topFeaturedAvatarBox}
                      >
                        <AvatarWithFrame
                          user={seat.user}
                          frame={seat.user?.equippedFrameAsset || seat.user?.equippedFrame || (seat.user?.isCurrentUser ? (user?.equippedFrameAsset || user?.equippedFrame) : null)}
                          size={50}
                          showOnlineDot={false}
                        />
                        {seat.isMuted && (
                          <View style={styles.micMuteBadge}>
                            <Icon name="mic-off" size={7} color="#FFF" />
                          </View>
                        )}
                      </View>
                    </VipMicWave>
                    <Text style={styles.topSeatUserName} numberOfLines={1}>
                      {seat.user.name}
                    </Text>
                    {showSeatCharm && (
                      <View style={styles.charmPill}>
                        <Text style={styles.charmFlower}>🌸</Text>
                        <Text style={styles.charmVal}>{seat.charm || 0}</Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={styles.emptySeatWrapper}>
                    <View style={[styles.topFeaturedEmptyCircle, { borderWidth: 0, borderColor: 'transparent', backgroundColor: 'transparent', overflow: 'hidden' }]}>
                      {seat.isLocked ? (
                        <Image
                          source={LOCK_SEAT_IMAGE}
                          style={{ width: 50, height: 50, borderRadius: 25 }}
                          resizeMode="cover"
                        />
                      ) : (
                        <Image
                          source={DEFAULT_SEAT_IMAGE}
                          style={{ width: 50, height: 50, borderRadius: 25 }}
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
              const circleSize = isCompactLayout ? 42 : 50;
              const avatarSize = isCompactLayout ? 38 : 46;

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
                      <Text style={[styles.seatUserName, isCompactLayout && { fontSize: 8.5, maxWidth: 54 }]} numberOfLines={1}>
                        {seat.user.name}
                      </Text>
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
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

  );
}
