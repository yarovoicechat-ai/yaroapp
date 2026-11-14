import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { apiUtil } from '../../utils/apiUtil';
export default function LiveHistoryScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiUtil.get('/live/history');
      setRooms(res.data.data || []);
      setError('');
    } catch (e) {
      setError(e.response?.data?.message || 'Unable to load live activity.');
    } finally {
      setLoading(false);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );
  return (
    <View style={[styles.screen, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityLabel="Go back"
          onPress={() => navigation.goBack()}
        >
          <Icon name="chevron-back" size={26} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.title}>My Live Activity</Text>
      </View>
      <View style={styles.summary}>
        <Icon name="radio" size={30} color="#E11D48" />
        <Text style={styles.total}>{rooms.length}</Text>
        <Text style={styles.subtitle}>Recent live sessions</Text>
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={rooms}
        keyExtractor={room => room._id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} />
        }
        contentContainerStyle={{
          padding: 20,
          paddingBottom: insets.bottom + 30,
        }}
        ListEmptyComponent={
          <Text style={styles.subtitle}>
            {loading
              ? 'Loading…'
              : 'No live sessions yet. Start a live from the centre tab.'}
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.name}>{item.title}</Text>
              <Text
                style={{
                  color: item.status === 'live' ? '#E11D48' : '#64748B',
                  fontWeight: '700',
                }}
              >
                {item.status.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.subtitle}>
              {item.category} · {new Date(item.createdAt).toLocaleString()}
            </Text>
            <Text style={styles.subtitle}>
              {item.endedAt
                ? `${Math.max(
                    0,
                    Math.floor(
                      (new Date(item.endedAt) - new Date(item.createdAt)) /
                        60000,
                    ),
                  )} minutes · ${item.endReason || 'Ended'}`
                : `${item.viewerCount || 0} viewers`}
            </Text>
            {item.status === 'live' && (
              <TouchableOpacity
                style={styles.join}
                onPress={() =>
                  navigation.navigate('LiveStream', {
                    roomId: item._id,
                    room: item,
                  })
                }
              >
                <Text style={{ color: '#FFF', fontWeight: '700' }}>
                  Resume live
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
  },
  title: { fontSize: 23, fontWeight: '800', color: '#0F172A' },
  summary: {
    alignItems: 'center',
    padding: 30,
    margin: 20,
    borderRadius: 24,
    backgroundColor: '#FFF1F2',
  },
  total: { fontSize: 42, fontWeight: '800', color: '#0F172A', marginTop: 10 },
  subtitle: { color: '#64748B', marginTop: 7, lineHeight: 20 },
  card: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    borderRadius: 18,
    marginBottom: 12,
  },
  row: { flexDirection: 'row', gap: 12 },
  name: { flex: 1, fontWeight: '800', color: '#0F172A', fontSize: 16 },
  join: {
    alignSelf: 'flex-start',
    backgroundColor: '#E11D48',
    borderRadius: 10,
    padding: 12,
    marginTop: 15,
  },
  error: { paddingHorizontal: 20, color: '#DC2626' },
});
