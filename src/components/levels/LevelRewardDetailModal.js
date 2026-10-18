import React from 'react';
import { Image, Modal, Text, TouchableOpacity, View } from 'react-native';
import IonIcon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SvgaPlayer } from '@dasimems/react-native-svga';
import { getUserAvatar } from '../../utils/avatarUtil';

export default function LevelRewardDetailModal({ reward, user, onClose, styles }) {
  return (
    <Modal visible={Boolean(reward)} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.rewardModalOverlay}>
        <View style={styles.rewardModalCard}>
          <TouchableOpacity onPress={onClose} style={styles.rewardModalClose}>
            <IonIcon name="close" size={22} color="#CBD5E1" />
          </TouchableOpacity>
          <View style={styles.rewardModalPreview}>
            {reward?.type === 'frame' && <Image source={getUserAvatar(user)} style={styles.rewardModalAvatar} />}
            {reward?.animationUrl && /\.svga(?:\?|$)/i.test(reward.animationUrl) ? (
              <SvgaPlayer source={reward.animationUrl} style={styles.rewardModalAsset} loops={0} />
            ) : reward?.animationUrl || reward?.imageUrl ? (
              <Image source={{ uri: reward.animationUrl || reward.imageUrl }} style={styles.rewardModalAsset} resizeMode="contain" />
            ) : (
              <MaterialCommunityIcons name={reward?.type === 'frame' ? 'circle-double' : 'car-sports'} size={72} color="#C084FC" />
            )}
          </View>
          <Text style={styles.rewardModalTitle}>{reward?.name}</Text>
          <Text style={styles.rewardModalDuration}>
            {reward?.durationDays === 0 ? 'Permanent reward' : reward?.durationDays ? `${reward.durationDays} days after unlock` : 'Level reward preview'}
          </Text>
        </View>
      </View>
    </Modal>
  );
}
