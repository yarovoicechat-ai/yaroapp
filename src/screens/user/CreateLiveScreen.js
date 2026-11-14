import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { AuthContext } from '../../context/AuthProvider';
import { apiUtil } from '../../utils/apiUtil';
import { getUserAvatar } from '../../utils/avatarUtil';

export default function CreateLiveScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Live');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const insets = useSafeAreaInsets();
  const start = async () => {
    if (busy || !title.trim()) return;
    setBusy(true);
    setError('');
    try {
      const res = await apiUtil.post('/live/rooms', {
        title: title.trim(),
        category,
        coverImage: /^https:\/\//i.test(user?.image || '') ? user.image : '',
      });
      const { room, rtc } = res.data.data;
      navigation.navigate('LiveStream', { roomId: room._id, room, rtc });
    } catch (e) {
      setError(
        e.response?.data?.message || e.message || 'Could not start live.',
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{
        padding: 24,
        paddingTop: insets.top + 30,
        paddingBottom: 130,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.icon}>
        <Icon name="videocam" color="#E11D48" size={40} />
      </View>
      <Text style={styles.title}>Create Live Room</Text>
      <TouchableOpacity onPress={() => navigation.navigate("LiveHistory")} style={{paddingVertical: 14}}><Text style={{color: "#E11D48", fontWeight: "700"}}>My Live Activity</Text></TouchableOpacity>
      <Text style={styles.subtitle}>
        Share your moment. Your camera and microphone turn on when you enter the
        room.
      </Text>
      <Text style={styles.label}>Room title</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        maxLength={80}
        placeholder="What is your live about?"
        placeholderTextColor="#94A3B8"
        style={styles.input}
      />
      <Text style={styles.label}>Live cover</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Image
          source={getUserAvatar(user)}
          style={{ width: 64, height: 80, borderRadius: 12 }}
        />
        <Text style={{ color: '#64748B', flex: 1 }}>
          Your profile photo will appear on your live room.
        </Text>
      </View>
      <Text style={styles.label}>Category</Text>
      <View style={styles.categories}>
        {['Live', 'Beauty', 'PK'].map(item => (
          <TouchableOpacity
            key={item}
            onPress={() => setCategory(item)}
            style={[styles.chip, item === category && styles.selected]}
          >
            <Text style={{ color: item === category ? '#FFF' : '#475569' }}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {!!error && (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      )}
      <TouchableOpacity
        disabled={busy || !title.trim()}
        onPress={start}
        style={[styles.button, (busy || !title.trim()) && { opacity: 0.5 }]}
      >
        {busy ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <>
            <Icon name="radio" size={22} color="#FFF" />
            <Text style={styles.buttonText}>Go Live</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFF' },
  icon: {
    backgroundColor: '#FFF1F2',
    width: 80,
    height: 80,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: { fontSize: 30, fontWeight: '800', color: '#0F172A' },
  subtitle: {
    color: '#64748B',
    lineHeight: 22,
    marginTop: 10,
    marginBottom: 22,
  },
  label: {
    color: '#334155',
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 15,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  categories: { flexDirection: 'row', gap: 10 },
  chip: {
    paddingVertical: 12,
    paddingHorizontal: 22,
    backgroundColor: '#F1F5F9',
    borderRadius: 24,
  },
  selected: { backgroundColor: '#E11D48' },
  button: {
    backgroundColor: '#E11D48',
    borderRadius: 18,
    padding: 18,
    marginTop: 32,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: '#FFF', fontWeight: '800', fontSize: 18 },
  error: { color: '#DC2626', marginTop: 18 },
});
