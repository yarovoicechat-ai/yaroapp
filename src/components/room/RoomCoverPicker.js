import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { requestCameraAndCapture, requestGalleryAndSelect } from '../../utils/verificationMedia';

export default function RoomCoverPicker({
  imageUri,
  fallbackUri,
  title = 'Custom Room Cover',
  subtitle = 'Upload from device gallery or take photo',
  styles,
  onImageSelected,
  onError,
}) {
  const selectImage = async (source) => {
    try {
      const image = source === 'gallery'
        ? await requestGalleryAndSelect()
        : await requestCameraAndCapture('back');
      if (image?.uri) onImageSelected?.(image, source);
    } catch (error) {
      onError?.(error, source);
    }
  };

  return (
    <View style={styles.manualUploadAvatarBox}>
      <Image source={{ uri: imageUri || fallbackUri }} style={styles.manualUploadAvatarPreview} />
      <View style={styles.manualUploadActionsCol}>
        <Text style={styles.manualUploadTitle}>{title}</Text>
        <Text style={styles.manualUploadSub}>{subtitle}</Text>
        <View style={styles.uploadBtnRow}>
          <TouchableOpacity
            style={styles.uploadMiniBtn}
            activeOpacity={0.8}
            onPress={() => selectImage('gallery')}
          >
            <Icon name="images-outline" size={16} color="#6366F1" style={{ marginRight: 5 }} />
            <Text style={styles.uploadMiniBtnText}>Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.uploadMiniBtn}
            activeOpacity={0.8}
            onPress={() => selectImage('camera')}
          >
            <Icon name="camera-outline" size={16} color="#EC4899" style={{ marginRight: 5 }} />
            <Text style={styles.uploadMiniBtnText}>Camera</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
