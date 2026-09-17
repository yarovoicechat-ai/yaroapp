import { PermissionsAndroid, Platform } from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

export const requestCameraAndCapture = async (cameraType = 'front') => {
  if (Platform.OS === 'android') {
    const permission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title: 'Camera permission',
        message: 'Camera access is required to capture a live verification photo.',
        buttonPositive: 'Continue',
        buttonNegative: 'Cancel',
      },
    );
    if (permission !== PermissionsAndroid.RESULTS.GRANTED) {
      throw new Error('Camera permission denied. Enable it from app settings and try again.');
    }
  }
  const result = await launchCamera({
    mediaType: 'photo',
    cameraType,
    quality: 0.9,
    maxWidth: 1600,
    maxHeight: 1600,
    saveToPhotos: false,
    includeBase64: false,
  });
  if (result.didCancel) return null;
  if (result.errorCode) throw new Error(result.errorMessage || 'Camera could not capture the image.');
  const asset = result.assets?.[0];
  if (!asset?.uri) throw new Error('No image was captured.');
  if ((asset.width || 0) < 480 || (asset.height || 0) < 480) {
    throw new Error('Image resolution is too low. Use better light and capture again.');
  }
  if ((asset.fileSize || 0) > 5 * 1024 * 1024) {
    throw new Error('Image is larger than 5 MB. Capture again.');
  }
  return {
    uri: asset.uri,
    type: asset.type || 'image/jpeg',
    name: asset.fileName || `live-${Date.now()}.jpg`,
    width: asset.width,
    height: asset.height,
    fileSize: asset.fileSize,
  };
};

export const requestGalleryAndSelect = async () => {
  const result = await launchImageLibrary({
    mediaType: 'photo',
    quality: 0.9,
    maxWidth: 1600,
    maxHeight: 1600,
    includeBase64: false,
  });
  if (result.didCancel) return null;
  if (result.errorCode) throw new Error(result.errorMessage || 'Could not pick image from gallery.');
  const asset = result.assets?.[0];
  if (!asset?.uri) throw new Error('No image selected.');
  return {
    uri: asset.uri,
    type: asset.type || 'image/jpeg',
    name: asset.fileName || `avatar-${Date.now()}.jpg`,
    width: asset.width,
    height: asset.height,
    fileSize: asset.fileSize,
  };
};

export const appendFile = (formData, field, file) => {
  if (file?.uri) formData.append(field, {
    uri: file.uri,
    type: file.type || file.mimeType || 'image/jpeg',
    name: file.name || `verification-${Date.now()}.jpg`,
  });
};
