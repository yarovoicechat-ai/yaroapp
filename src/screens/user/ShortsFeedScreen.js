import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  Dimensions,
  StatusBar,
  Modal,
  TextInput,
  Share,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';
import EmptyStateView from '../../components/EmptyStateView';

const { width, height } = Dimensions.get('window');

const SAMPLE_SHORTS = [
  {
    id: 's1',
    creator: { name: 'Ananya Sharma', id: '10042189', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80', isVerified: true },
    caption: 'Late night singing session! Hope you all love this melody ✨🎶',
    hashtags: '#Music #YaroVibes #Singing #LiveClub',
    sound: 'Original Sound - Ananya Sharma',
    likes: 1420,
    comments: 89,
    shares: 34,
    videoPoster: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 's2',
    creator: { name: 'Kabir Roy', id: '10084321', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80', isVerified: false },
    caption: 'Chit-chatting with fans on Yaro App! Join the voice room! 🎧🔥',
    hashtags: '#PartyRoom #VoiceChat #GoodVibes',
    sound: 'Trending Beat - Yaro Sound Station',
    likes: 890,
    comments: 42,
    shares: 18,
    videoPoster: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 's3',
    creator: { name: 'Pooja Verma', id: '10011928', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80', isVerified: true },
    caption: 'Weekend dance challenge! Drop your votes in comments! 💃💃',
    hashtags: '#DanceChallenge #YaroShorts #WeekendFun',
    sound: 'Dance Floor Anthem - DJ Max',
    likes: 2450,
    comments: 156,
    shares: 88,
    videoPoster: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800&auto=format&fit=crop&q=80',
  },
];

export default function ShortsFeedScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 20);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedMap, setLikedMap] = useState({});
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [commentsList, setCommentsList] = useState([
    { id: 'c1', user: 'Rohan', text: 'Loved this so much! 🔥' },
    { id: 'c2', user: 'Sneha', text: 'Super talent! 💖' },
  ]);

  const handleToggleLike = (id) => {
    setLikedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleShare = async (item) => {
    try {
      await Share.share({
        message: `Watch this cool video by ${item.creator.name} on Yaro App! https://yaroapp.in/shorts/${item.id}`,
      });
    } catch (e) {
      // ignore
    }
  };

  const handleAddComment = () => {
    const trimmed = commentInput.trim();
    if (!trimmed) return;
    setCommentsList((prev) => [...prev, { id: 'c-' + Date.now(), user: 'You', text: trimmed }]);
    setCommentInput('');
  };

  const renderShortItem = ({ item, index }) => {
    const isLiked = likedMap[item.id];
    const totalLikes = item.likes + (isLiked ? 1 : 0);

    return (
      <View style={[styles.pageContainer, { height: height - topSafeInset }]}>
        {/* Fullscreen Poster / Video Placeholder */}
        <Image source={{ uri: item.videoPoster }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.85)']}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Right Floating Actions Stack */}
        <View style={[styles.rightActionsStack, { bottom: bottomPadding + 80 }]}>
          {/* Creator Avatar with Follow */}
          <TouchableOpacity
            style={styles.avatarActionWrap}
            onPress={() => navigation.navigate('HostProfile', { host: item.creator })}
          >
            <Image source={{ uri: item.creator.avatar }} style={styles.creatorAvatar} />
            <View style={styles.followBadge}>
              <Icon name="add" size={12} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          {/* Like */}
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleToggleLike(item.id)}>
            <Icon name={isLiked ? 'heart' : 'heart-outline'} size={32} color={isLiked ? '#EF4444' : '#FFFFFF'} />
            <Text style={styles.actionLabel}>{totalLikes}</Text>
          </TouchableOpacity>

          {/* Comments */}
          <TouchableOpacity style={styles.actionBtn} onPress={() => setCommentsVisible(true)}>
            <Icon name="chatbubble-ellipses-outline" size={30} color="#FFFFFF" />
            <Text style={styles.actionLabel}>{item.comments}</Text>
          </TouchableOpacity>

          {/* Share */}
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleShare(item)}>
            <Icon name="arrow-redo-outline" size={30} color="#FFFFFF" />
            <Text style={styles.actionLabel}>{item.shares}</Text>
          </TouchableOpacity>

          {/* Disc Spinning Icon */}
          <View style={styles.musicDiscBox}>
            <Icon name="musical-notes" size={16} color="#FFFFFF" />
          </View>
        </View>

        {/* Bottom Details Overlay */}
        <View style={[styles.bottomDetails, { bottom: bottomPadding + 20 }]}>
          <TouchableOpacity
            style={styles.creatorRow}
            onPress={() => navigation.navigate('HostProfile', { host: item.creator })}
          >
            <Text style={styles.creatorName}>@{item.creator.name}</Text>
            {item.creator.isVerified && (
              <Icon name="checkmark-circle" size={15} color="#38BDF8" style={{ marginLeft: 4 }} />
            )}
          </TouchableOpacity>

          <Text style={styles.captionText}>{item.caption}</Text>
          <Text style={styles.hashtagsText}>{item.hashtags}</Text>

          <View style={styles.soundRow}>
            <Icon name="disc-outline" size={14} color="#CBD5E1" style={{ marginRight: 6 }} />
            <Text style={styles.soundTitle} numberOfLines={1}>{item.sound}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Top Header Overlay */}
      <View style={[styles.topHeader, { paddingTop: topSafeInset + 6 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Icon name="chevron-back" size={26} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Shorts</Text>

        <TouchableOpacity
          onPress={() => navigation.navigate('UploadShort')}
          style={styles.createShortBtn}
        >
          <Icon name="camera" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Paging Feed */}
      <FlatList
        data={SAMPLE_SHORTS}
        keyExtractor={(item) => item.id}
        renderItem={renderShortItem}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.y / (height - topSafeInset));
          setCurrentIndex(index);
        }}
        ListEmptyComponent={
          <EmptyStateView
            icon="film-outline"
            title="No Videos Found"
            subtitle="Be the first to upload a short video to Yaro!"
            actionText="Upload Video"
            onAction={() => navigation.navigate('UploadShort')}
          />
        }
      />

      {/* Comments Modal */}
      <Modal
        visible={commentsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCommentsVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCommentsVisible(false)}
        >
          <View style={styles.commentSheet}>
            <View style={styles.commentHeader}>
              <Text style={styles.commentTitle}>Comments ({commentsList.length})</Text>
              <TouchableOpacity onPress={() => setCommentsVisible(false)}>
                <Icon name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={commentsList}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.commentItem}>
                  <Text style={styles.commentAuthor}>{item.user}</Text>
                  <Text style={styles.commentBody}>{item.text}</Text>
                </View>
              )}
              style={{ maxHeight: 250 }}
            />

            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                placeholderTextColor="#94A3B8"
                value={commentInput}
                onChangeText={setCommentInput}
                onSubmitEditing={handleAddComment}
              />
              <TouchableOpacity onPress={handleAddComment} style={styles.commentPostBtn}>
                <Text style={styles.commentPostText}>Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
  },
  topHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 20,
  },
  headerBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  createShortBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageContainer: {
    width,
    position: 'relative',
    backgroundColor: '#0F172A',
  },
  rightActionsStack: {
    position: 'absolute',
    right: 14,
    alignItems: 'center',
    gap: 18,
    zIndex: 10,
  },
  avatarActionWrap: {
    position: 'relative',
    marginBottom: 6,
  },
  creatorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  followBadge: {
    position: 'absolute',
    bottom: -6,
    alignSelf: 'center',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtn: {
    alignItems: 'center',
  },
  actionLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
  },
  musicDiscBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderWidth: 2,
    borderColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomDetails: {
    position: 'absolute',
    left: 16,
    right: 80,
    zIndex: 10,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  creatorName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  captionText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    lineHeight: 18,
    marginBottom: 4,
  },
  hashtagsText: {
    color: '#38BDF8',
    fontSize: 12.5,
    fontWeight: '600',
    marginBottom: 8,
  },
  soundRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  soundTitle: {
    color: '#CBD5E1',
    fontSize: 12,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  commentSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    paddingBottom: 24,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  commentTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  commentItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  commentAuthor: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#7C3AED',
    marginBottom: 2,
  },
  commentBody: {
    fontSize: 13,
    color: '#334155',
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  commentInput: {
    flex: 1,
    height: 42,
    backgroundColor: '#F1F5F9',
    borderRadius: 21,
    paddingHorizontal: 16,
    fontSize: 13,
    color: '#0F172A',
  },
  commentPostBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#7C3AED',
    borderRadius: 20,
  },
  commentPostText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
