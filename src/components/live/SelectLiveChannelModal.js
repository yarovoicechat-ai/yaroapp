import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

export const LIVE_CHANNELS = [
  {
    id: 'purchase',
    name: 'Live purchase',
    description: 'Buy, buy, buy and share the best things',
    colors: ['#FF69B4', '#FF1493'],
    icon: 'cart-outline',
  },
  {
    id: 'dance',
    name: 'Dance',
    description: 'Modern dance, pole dancing, belly dancing, etc., falling in love i...',
    colors: ['#7B68EE', '#4169E1'],
    icon: 'human-female-dance',
    isMci: true,
  },
  {
    id: 'music',
    name: 'Music',
    description: 'Pop, rock, rap, ethnic, etc., the most powerful online concert',
    colors: ['#FF7F50', '#FF4500'],
    icon: 'musical-notes',
  },
  {
    id: 'outdoor',
    name: 'Outdoor',
    description: 'You can choose from the streets or outdoors, and you can enjo...',
    colors: ['#20B2AA', '#00FA9A'],
    icon: 'leaf',
  },
  {
    id: 'campus',
    name: 'Campus',
    description: 'Student parties share campus fun',
    colors: ['#6495ED', '#4169E1'],
    icon: 'school',
  },
  {
    id: 'friends',
    name: 'Make friends',
    description: 'A gathering place for single men and women, with lots of inter...',
    colors: ['#FF6347', '#FF1493'],
    icon: 'heart',
  },
  {
    id: 'mai',
    name: 'Shout out to Mai',
    description: 'Europe and America have RAP, we have MC',
    colors: ['#DA70D6', '#BA55D3'],
    icon: 'mic',
  },
  {
    id: 'game',
    name: 'Game',
    description: "It's time to show your real skills",
    colors: ['#FF8C00', '#FF4500'],
    icon: 'game-controller',
  },
  {
    id: 'food',
    name: 'Gourmet food',
    description: "Foodie? Chef? Food is the only thing you can't live up to",
    colors: ['#FFA500', '#FF8C00'],
    icon: 'restaurant',
  },
  {
    id: 'talent',
    name: 'Talent',
    description: 'Handicrafts, magic, painting, makeup, etc., art masters among...',
    colors: ['#FF69B4', '#FF7F50'],
    icon: 'sparkles',
  },
  {
    id: 'king',
    name: 'King',
    description: "There's a big wave of fans ahead, and they're about to arrive",
    colors: ['#1E90FF', '#00BFFF'],
    icon: 'shield',
  },
  {
    id: 'queen',
    name: 'Queen',
    description: 'Good looks and a good figure should be shown off',
    colors: ['#FF1493', '#FF69B4'],
    icon: 'diamond',
  },
];

export default function SelectLiveChannelModal({
  visible,
  onClose,
  selectedChannel,
  onSelectChannel,
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Icon name="chevron-back" size={26} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select live channel</Text>
          <View style={styles.backButton} />
        </View>

        {/* Warning / Instruction Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            Pay attention to choosing a channel that suits you. During the live
            broadcast, if the operator finds that the selected channel does not match
            the live broadcast content, your live broadcast channel will be adjusted.
          </Text>
        </View>

        {/* Channel List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        >
          {LIVE_CHANNELS.map(channel => {
            const isSelected = selectedChannel === channel.name;
            return (
              <TouchableOpacity
                key={channel.id}
                onPress={() => {
                  onSelectChannel(channel.name);
                  onClose();
                }}
                activeOpacity={0.7}
                style={[
                  styles.channelItem,
                  isSelected && styles.channelItemSelected,
                ]}
              >
                <LinearGradient
                  colors={channel.colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.iconCircle}
                >
                  {channel.isMci ? (
                    <MaterialCommunityIcons
                      name={channel.icon}
                      size={20}
                      color="#FFFFFF"
                    />
                  ) : (
                    <Icon name={channel.icon} size={18} color="#FFFFFF" />
                  )}
                </LinearGradient>
                <View style={styles.channelTextCol}>
                  <Text style={styles.channelName}>{channel.name}</Text>
                  <Text style={styles.channelDesc} numberOfLines={1}>
                    {channel.description}
                  </Text>
                </View>
                {isSelected && (
                  <Icon name="checkmark-circle" size={22} color="#E11D48" />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  banner: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  bannerText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#94A3B8',
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F1F5F9',
  },
  channelItemSelected: {
    backgroundColor: '#FFF1F2',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  channelTextCol: {
    flex: 1,
    paddingRight: 10,
  },
  channelName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  channelDesc: {
    fontSize: 12,
    color: '#94A3B8',
  },
});
