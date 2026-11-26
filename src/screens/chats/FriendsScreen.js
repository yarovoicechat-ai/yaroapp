import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { apiUtil } from '../../utils/apiUtil';
import { getUserAvatar } from '../../utils/avatarUtil';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';

export default function FriendsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 16);

  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchFriends = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiUtil.get('/user/friends');
      if (res.data?.success) {
        const list = res.data.data?.users || res.data.data || [];
        setFriends(Array.isArray(list) ? list : []);
      } else {
        setFriends([]);
      }
    } catch (err) {
      console.log('Error fetching friends:', err?.message);
      setFriends([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  const filteredFriends = friends.filter((item) => {
    if (!searchQuery.trim()) return true;
    const name = String(item.name || '').toLowerCase();
    const uid = String(item.userId || '').toLowerCase();
    const q = searchQuery.trim().toLowerCase();
    return name.includes(q) || uid.includes(q);
  });

  const renderFriendItem = ({ item }) => {
    const isFemale = String(item.gender || '').toLowerCase() === 'female';
    return (
      <TouchableOpacity
        style={styles.cardWrapper}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('Chat', { otherUser: item })}
      >
        <View style={styles.avatarBox}>
          <Image source={getUserAvatar(item)} style={styles.avatarImg} />
          {item.isOnline && <View style={styles.onlineDot} />}
        </View>

        <View style={styles.infoBox}>
          <View style={styles.nameRow}>
            <Text style={styles.nameText} numberOfLines={1}>
              {item.name || 'Friend'}
            </Text>
            {item.isVerified && (
              <Icon name="checkmark-circle" size={16} color="#3B82F6" style={{ marginLeft: 4 }} />
            )}
            <View style={[styles.genderPill, isFemale ? styles.femalePill : styles.malePill]}>
              <Icon
                name={isFemale ? 'female' : 'male'}
                size={11}
                color="#FFFFFF"
                style={{ marginRight: 2 }}
              />
              <Text style={styles.genderText}>{item.age || 20}</Text>
            </View>
          </View>
          <Text style={styles.bioText} numberOfLines={1}>
            {item.bio || 'Available to chat'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.chatActionBtn}
          onPress={() => navigation.navigate('Chat', { otherUser: item })}
          activeOpacity={0.8}
        >
          <Icon name="chatbubble-ellipses" size={20} color="#7C3AED" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: topSafeInset }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Friends</Text>
        <View style={styles.headerRightSpacer} />
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchBarWrapper}>
        <View style={styles.searchBox}>
          <Icon name="search" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search friends"
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#7C3AED" />
        </View>
      ) : filteredFriends.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>👥</Text>
          <Text style={styles.emptyTitle}>No friends found</Text>
          <Text style={styles.emptySubtitle}>
            When you and another user follow each other, you become friends!
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredFriends}
          keyExtractor={(item) => String(item._id || item.id || item.userId)}
          renderItem={renderFriendItem}
          contentContainerStyle={[styles.listContent, { paddingBottom: bottomPadding }]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  headerRightSpacer: {
    width: 40,
  },
  searchBarWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 38,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 0,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  cardWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    position: 'relative',
  },
  avatarImg: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  infoBox: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E293B',
    maxWidth: '65%',
  },
  genderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 6,
  },
  femalePill: {
    backgroundColor: '#EC4899',
  },
  malePill: {
    backgroundColor: '#3B82F6',
  },
  genderText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  bioText: {
    fontSize: 12,
    color: '#64748B',
  },
  chatActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },
});
