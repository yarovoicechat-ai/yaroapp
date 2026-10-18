import React from 'react';
import SvgaView from '../SvgaView';

export const getCosmeticFormatBadge = (item) => {
  const animation = String(item?.animationUrl || '').toLowerCase();
  const image = String(item?.coverImageUrl || item?.imageUrl || item?.image || '').toLowerCase();

  if (animation.includes('.svga')) {
    return { label: '✨ SVGA Animation', color: '#8B5CF6', bg: '#F5F3FF' };
  }
  if (animation.includes('.gif') || image.includes('.gif')) {
    return { label: '✨ Animated GIF', color: '#EC4899', bg: '#FDF2F8' };
  }
  if (animation.includes('.webp') || image.includes('.webp')) {
    return { label: '✨ Animated WebP', color: '#06B6D4', bg: '#ECFEFF' };
  }
  if (image.includes('.png') || image.includes('.jpg') || image.includes('.jpeg')) {
    return { label: '✨ HD Frame', color: '#10B981', bg: '#ECFDF5' };
  }
  return { label: '✨ Exclusive Item', color: '#F59E0B', bg: '#FFFBEB' };
};

export default function CosmeticAsset({ item, style, resizeMode = 'contain' }) {
  const imageUrl = item?.coverImageUrl || item?.imageUrl || item?.image;
  const source = item?.animationUrl || imageUrl;
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
}
