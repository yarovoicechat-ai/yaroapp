import React from 'react';
import SvgaView from '../SvgaView';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function LevelRewardThumbnail({ item, size = 60 }) {
  const imageUrl = item?.imageUrl || item?.image;
  const animationUrl = item?.animationUrl;

  if (animationUrl || imageUrl) {
    return (
      <SvgaView
        source={animationUrl || imageUrl}
        style={{ width: size, height: size }}
        resizeMode="contain"
        fallbackImage={imageUrl}
      />
    );
  }

  const iconsByType = {
    frame: ['circle-double', '#EC4899'],
    badge: ['shield-star', '#F59E0B'],
    vehicle: ['car-sports', '#06B6D4'],
    custom_id: ['card-account-details-star', '#8B5CF6'],
    entrance: ['weather-night', '#EAB308'],
    profile_border: ['border-outside', '#10B981'],
    theme: ['palette', '#6366F1'],
    mic: ['microphone-variant', '#F43F5E'],
    room_skin: ['home-modern', '#A855F7'],
    party_set: ['cake-variant', '#EC4899'],
  };
  const [iconName, iconColor] = iconsByType[item?.type] || ['star-shooting', '#F59E0B'];

  return <MaterialCommunityIcons name={iconName} size={size * 0.7} color={iconColor} />;
}
