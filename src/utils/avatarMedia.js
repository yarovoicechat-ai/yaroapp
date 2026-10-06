import { PermissionsAndroid, Platform } from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Standard, non-verification camera capture for user avatar/profile picture.
 */
export const pickAvatarCamera = async (cameraType = 'front') => {
  if (Platform.OS === 'android') {
    const permission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title: 'Camera Permission',
        message: 'Camera access is required to take a profile photo.',
        buttonPositive: 'OK',
        buttonNegative: 'Cancel',
      },
    );
    if (permission !== PermissionsAndroid.RESULTS.GRANTED) {
      throw new Error('Camera permission denied.');
    }
  }

  const result = await launchCamera({
    mediaType: 'photo',
    cameraType,
    quality: 0.85,
    maxWidth: 1200,
    maxHeight: 1200,
    saveToPhotos: false,
    includeBase64: true,
  });

  if (result.didCancel) return null;
  if (result.errorCode) throw new Error(result.errorMessage || 'Camera could not capture the photo.');
  const asset = result.assets?.[0];
  if (!asset?.uri) throw new Error('No photo was captured.');

  if ((asset.fileSize || 0) > MAX_AVATAR_SIZE_BYTES) {
    throw new Error('Selected photo exceeds the 5 MB size limit.');
  }

  return {
    uri: asset.uri,
    type: asset.type || 'image/jpeg',
    name: asset.fileName || `avatar-${Date.now()}.jpg`,
    width: asset.width,
    height: asset.height,
    fileSize: asset.fileSize,
    base64: asset.base64 || null,
  };
};

/**
 * Standard gallery picker for user avatar/profile picture.
 */
export const pickAvatarGallery = async () => {
  const result = await launchImageLibrary({
    mediaType: 'photo',
    quality: 0.85,
    maxWidth: 1200,
    maxHeight: 1200,
    includeBase64: true,
  });

  if (result.didCancel) return null;
  if (result.errorCode) throw new Error(result.errorMessage || 'Could not pick image from gallery.');
  const asset = result.assets?.[0];
  if (!asset?.uri) throw new Error('No image was selected.');

  if ((asset.fileSize || 0) > MAX_AVATAR_SIZE_BYTES) {
    throw new Error('Selected image exceeds the 5 MB size limit.');
  }

  return {
    uri: asset.uri,
    type: asset.type || 'image/jpeg',
    name: asset.fileName || `avatar-${Date.now()}.jpg`,
    width: asset.width,
    height: asset.height,
    fileSize: asset.fileSize,
    base64: asset.base64 || null,
  };
};
