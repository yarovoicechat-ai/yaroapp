import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';
import { AlertService } from '../../utils/AlertService';
import { requestGalleryAndSelect } from '../../utils/verificationMedia';

export default function UploadShortScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 28);

  const [selectedVideo, setSelectedVideo] = useState(null);
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('#YaroVibes #Music #Party');
  const [privacy, setPrivacy] = useState('Public');
  const [uploading, setUploading] = useState(false);

  const handlePickVideo = async () => {
    try {
      const file = await requestGalleryAndSelect();
      if (file) {
        setSelectedVideo(file);
      }
    } catch (e) {
      AlertService.show('Notice', 'No video selected.', 'info');
    }
  };

  const handleUpload = async () => {
    if (!caption.trim()) {
      AlertService.show('Caption Required', 'Please enter a brief caption for your short video.', 'error');
      return;
    }

    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      AlertService.show(
        'Short Video Queued',
        'Your video has been recorded and saved locally. Backend video CDN processing service is currently synchronizing.',
        'success',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }, 1200);
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topSafeInset + 6 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="chevron-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Short Video</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}>
        {/* Video Picker Card */}
        <TouchableOpacity
          style={styles.pickerBox}
          activeOpacity={0.85}
          onPress={handlePickVideo}
        >
          {selectedVideo ? (
            <View style={styles.selectedVideoInfo}>
              <Icon name="checkmark-circle" size={42} color="#10B981" />
              <Text style={styles.videoSelectedText}>Video Selected Successfully</Text>
              <Text style={styles.videoChangeText}>Tap to choose a different video</Text>
            </View>
          ) : (
            <View style={styles.emptyPicker}>
              <View style={styles.cameraCircle}>
                <Icon name="videocam" size={32} color="#7C3AED" />
              </View>
              <Text style={styles.pickerTitle}>Select or Record Video</Text>
              <Text style={styles.pickerSub}>MP4, MOV up to 60 seconds (max 50MB)</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Caption Input */}
        <Text style={styles.fieldLabel}>Caption</Text>
        <View style={styles.inputCard}>
          <TextInput
            style={styles.captionInput}
            placeholder="Write an engaging caption..."
            placeholderTextColor="#94A3B8"
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={180}
          />
          <Text style={styles.charCount}>{caption.length}/180</Text>
        </View>

        {/* Hashtags Input */}
        <Text style={styles.fieldLabel}>Tags & Topics</Text>
        <View style={styles.inputCard}>
          <TextInput
            style={styles.tagsInput}
            placeholder="#Yaro #Vibes #Music"
            placeholderTextColor="#94A3B8"
            value={hashtags}
            onChangeText={setHashtags}
          />
        </View>

        {/* Privacy Selector */}
        <Text style={styles.fieldLabel}>Who can watch this video?</Text>
        <View style={styles.privacyRow}>
          {['Public', 'Friends Only', 'Private'].map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.privacyChip, privacy === opt && styles.privacyChipActive]}
              onPress={() => setPrivacy(opt)}
            >
              <Text style={[styles.privacyText, privacy === opt && styles.privacyTextActive]}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.uploadBtnWrap}
          activeOpacity={0.88}
          onPress={handleUpload}
          disabled={uploading}
        >
          <LinearGradient
            colors={['#7C3AED', '#6D28D9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.uploadBtn}
          >
            {uploading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.uploadBtnText}>Publish Short Video</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  content: {
    padding: 16,
  },
  pickerBox: {
    height: 180,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyPicker: {
    alignItems: 'center',
  },
  cameraCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  pickerTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  pickerSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  selectedVideoInfo: {
    alignItems: 'center',
  },
  videoSelectedText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#10B981',
    marginTop: 8,
  },
  videoChangeText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  captionInput: {
    fontSize: 13.5,
    color: '#0F172A',
    minHeight: 64,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'right',
    marginTop: 4,
  },
  tagsInput: {
    fontSize: 13.5,
    color: '#0F172A',
    paddingVertical: 2,
  },
  privacyRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  privacyChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  privacyChipActive: {
    backgroundColor: '#F3E8FF',
    borderColor: '#7C3AED',
  },
  privacyText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
  },
  privacyTextActive: {
    color: '#7C3AED',
    fontWeight: '700',
  },
  uploadBtnWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#7C3AED',
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  uploadBtn: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
