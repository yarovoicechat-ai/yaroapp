import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
  FlatList,
  Dimensions,
  Platform,
  Modal,
  View as ScreenBackgroundView,
  StatusBar as ScreenBackgroundStatusBar,
  StyleSheet as ScreenBackgroundStyleSheet
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';
import { AuthContext } from '../../context/AuthProvider';
import { apiUtil } from '../../utils/apiUtil';
import { languages } from '../../constants/language';
import { useTranslation } from 'react-i18next';
import { AlertService } from '../../utils/AlertService';
import { requestCameraAndCapture, requestGalleryAndSelect } from '../../utils/verificationMedia';
import { uploadToCloudinary } from '../../utils/cloudinaryUtil';

const EditProfile = () => {
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 42);
  const { user, fetchUserProfile } = useContext(AuthContext);
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [avatars, setAvatars] = useState([]);
  const [selectedAvatar, setSelectedAvatar] = useState('');
  // Local state
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameInput, setUsernameInput] = useState(''); // for input
  const [canSetUsername, setCanSetUsername] = useState(false);
  const [userId, setUserId] = useState('');
  const [bio, setBio] = useState('');
  const [defaultBios, setDefaultBios] = useState([]);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [photoPickerVisible, setPhotoPickerVisible] = useState(false);

  const toggleLanguage = language => {
    setSelectedLanguages(prev =>
      prev.includes(language)
        ? prev.filter(lang => lang !== language)
        : [...prev, language],
    );
  };

  const renderLanguageChips = () => (
    <View style={styles.languageChipsRow}>
      {languages.map(language => {
        const isSelected = selectedLanguages.includes(language);
        return (
          <TouchableOpacity
            key={language}
            onPress={() => toggleLanguage(language)}
            style={styles.chipTouch}
            activeOpacity={0.8}
          >
            {isSelected ? (
              <LinearGradient
                colors={['#7c4dff', '#03dcfe']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.languageChipSelected}
              >
                <Text style={styles.languageChipTextSelected}>{language}</Text>
              </LinearGradient>
            ) : (
              <View style={styles.languageChipUnselected}>
                <Text style={styles.languageChipTextUnselected}>{language}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const handleCameraIconPress = () => {
    const isVerified = user?.faceVerificationStatus === 'APPROVED' || user?.kycVerificationStatus === 'APPROVED';
    if (!isVerified) {
      AlertService.show(
        'Verification Required',
        'Verification complete hone k baad hi avatar/photo upload enable hoga. Kripya pehle Face ya KYC Verification poora karein.',
        'info'
      );
      return;
    }
    setPhotoPickerVisible(true);
  };

  const processPhotoUpload = async source => {
    try {
      let captured = null;
      if (source === 'camera') {
        captured = await requestCameraAndCapture('front');
      } else {
        captured = await requestGalleryAndSelect();
      }

      if (!captured) return;

      AlertService.show('Uploading', 'Uploading custom avatar...', 'info');
      const uploadedUrl = await uploadToCloudinary(captured, 'help');

      const res = await apiUtil.post('/avatar-request', {
        requestedAvatar: uploadedUrl,
      });

      if (res.data?.success) {
        AlertService.show(
          'Request Submitted',
          'Avatar request successfully submitted! Admin verification review ke baad aapka avatar update ho jayega.',
          'success'
        );
      } else {
        AlertService.show('Upload Failed', res.data?.message || 'Failed to submit avatar request', 'error');
      }
    } catch (err) {
      if (err.message && !err.message.includes('cancelled')) {
        AlertService.show('Error', err.message || 'Avatar upload failed', 'error');
      }
    }
  };

  const renderAvatars = () => {
    const listData = [...avatars];

    const renderAvatarItem = ({ item }) => {
      const avatarUrl = item.avatarUrl?.startsWith('http')
        ? item.avatarUrl
        : `https://api.mithichat.live${item.avatarUrl}`;
      const isSelected = selectedAvatar === avatarUrl;

      return (
        <TouchableOpacity
          onPress={() => setSelectedAvatar(avatarUrl)}
          style={styles.avatarThumbnailWrapper}
          activeOpacity={0.8}
        >
          <Image
            source={{ uri: avatarUrl }}
            style={[styles.avatarThumbnail, isSelected && styles.avatarThumbnailSelected]}
          />
          {isSelected && (
            <View style={styles.avatarCheckBadge}>
              <Icon name="check" size={10} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
      );
    };

    return (
      <FlatList
        data={listData}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderAvatarItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.avatarsCarouselContent}
      />
    );
  };

  const fetchAvatars = async gender => {
    try {
      const res = await apiUtil.get(`/avatar/${gender}`);
      if (res.data) {
        setAvatars(res.data || []);
      }
    } catch (err) {
      console.log('❌ Failed to fetch avatars:', err.message);
    }
  };

  const fetchDefaultBios = async () => {
    try {
      const res = await apiUtil.get('/user/default-bios');
      if (res.data?.success) setDefaultBios(res.data.data || []);
    } catch (err) {
      console.log('Default bios fetch failed:', err.response?.data || err.message);
    }
  };

  // Load user data from context
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setUsername(user.userName || 'Add User Name');
      setUserId(user.userId?.toString() || '');
      setBio(user.bio || '');
      setSelectedLanguages(user.language || []);
      setSelectedAvatar(user.image || '');
      fetchAvatars(user.gender || 'male');
      if (user.role === 'host') fetchDefaultBios();
      else setDefaultBios([]);

      setCanSetUsername(!user.isUserName && !user.userName);
      setUsernameInput(!user.userName ? '' : user.userName);
    }
  }, [user]);

  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState(null);

  const handleNameChange = text => {
    setName(text.slice(0, 20));
  };

  useEffect(() => {
    if (!canSetUsername) return;
    const trimmed = usernameInput.trim();
    if (!trimmed) {
      setUsernameStatus(null);
      return;
    }

    let isMounted = true;
    const timer = setTimeout(async () => {
      setUsernameChecking(true);
      try {
        const res = await apiUtil.get(`/user/check-username?username=${encodeURIComponent(trimmed)}`);
        if (isMounted) {
          if (res.data?.success && res.data.data) {
            setUsernameStatus(res.data.data);
          } else {
            setUsernameStatus({ available: false, message: 'Username is already taken' });
          }
        }
      } catch (err) {
        if (isMounted) {
          setUsernameStatus({ available: false, message: 'Username is already taken' });
        }
      } finally {
        if (isMounted) setUsernameChecking(false);
      }
    }, 400);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [usernameInput, canSetUsername]);

  const handleSetUsername = async () => {
    if (!usernameInput || usernameInput.length < 3) {
      AlertService.show(t('edit_profile.error'), t('edit_profile.username_length_error'), 'error');
      return;
    }

    if (usernameStatus && !usernameStatus.available) {
      AlertService.show('Unavailable', 'Username is already taken', 'error');
      return;
    }

    try {
      const res = await apiUtil.post('/user/set-username', {
        userName: usernameInput.trim(),
      });

      if (res.data.success) {
        AlertService.show(t('edit_profile.success'), t('edit_profile.username_success'), 'success');
        fetchUserProfile();
        setCanSetUsername(false);
      } else {
        AlertService.show(t('edit_profile.error'), res.data.message || t('edit_profile.username_fail'), 'error');
      }
    } catch (err) {
      console.log(err);
      AlertService.show(t('edit_profile.error'), t('edit_profile.something_wrong'), 'error');
    }
  };

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      AlertService.show(t('edit_profile.error'), 'Name is required', 'error');
      return;
    }
    if (trimmedName.length > 20) {
      AlertService.show(t('edit_profile.error'), 'Name cannot exceed 20 characters', 'error');
      return;
    }
    if (bio.length > 100) {
      AlertService.show(t('edit_profile.error'), t('edit_profile.bio_error'), 'error');
      return;
    }
    if (selectedLanguages.length > 2) {
      AlertService.show(t('edit_profile.error'), t('edit_profile.lang_error'), 'error');
      return;
    }

    try {
      const targetId = userId || user?._id || user?.userId;
      const res = await apiUtil.patch(`/user/${targetId}`, {
        name: trimmedName.slice(0, 20),
        bio,
        language: selectedLanguages,
        image: selectedAvatar,
      });

      if (res.data.success) {
        await fetchUserProfile();
        AlertService.show(t('edit_profile.success'), t('edit_profile.update_success'), 'success');
        navigation.goBack();
      } else {
        AlertService.show(t('edit_profile.error'), res.data.message || t('edit_profile.update_fail'), 'error');
      }
    } catch (err) {
      console.log('❌ Update failed:', err.response?.data || err.message);
      const serverMsg = err.response?.data?.message || err.message || t('edit_profile.something_wrong');
      AlertService.show(t('edit_profile.error'), serverMsg, 'error');
    }
  };

  return (
    <ScreenBackgroundView style={[{ flex: 1, backgroundColor: '#F8FAFC' }]}>
      <ScreenBackgroundStatusBar translucent backgroundColor="transparent" barStyle="dark-content" animated />
      <LinearGradient colors={['#F8FAFC', '#F1F5F9', '#E2E8F0']} style={ScreenBackgroundStyleSheet.absoluteFillObject} />
      {/* Decorative background overlays (matches screenshots) */}
      <View style={styles.starOverlay1} />
      <View style={styles.starOverlay2} />
      <View style={styles.planetWrapper}>
        <LinearGradient
          colors={['rgba(124, 77, 255, 0.12)', 'rgba(3, 220, 254, 0.25)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.planetGlow}
        />
      </View>
      <View style={styles.gridWrapper}>
        <View style={styles.gridLine1} />
        <View style={styles.gridLine2} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: bottomPadding }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: topSafeInset + 8 }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="chevron-left" size={22} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('edit_profile.title') || 'Edit Profile'}</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.headerSeparatorContainer}>
          <LinearGradient
            colors={['#ff3366', '#03dcfe']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.headerTitleLine}
          />
        </View>

        {/* Profile Image */}
        <View style={styles.profileImageSection}>
          <View style={styles.profileImageContainer}>
            <LinearGradient
              colors={['#03dcfe', '#d946ef']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.profileImageBorder}
            >
              <Image
                source={{
                  uri: selectedAvatar || 'https://via.placeholder.com/100',
                }}
                style={styles.profileImage}
                resizeMode="cover"
              />
            </LinearGradient>
            <TouchableOpacity style={styles.cameraIconBadge} activeOpacity={0.8} onPress={handleCameraIconPress}>
              <Icon name="photo-camera" size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Avatar selection carousel */}
          {renderAvatars()}
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          {/* Name Field */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>{t('edit_profile.name_label') || 'Name'}</Text>
              <Text style={[styles.charCounter, name.length === 20 && styles.charCounterMax]}>{name.length}/20</Text>
            </View>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={handleNameChange}
                maxLength={20}
                placeholder={t('edit_profile.enter_name')}
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
              />
            </View>
          </View>

          {/* Username Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('edit_profile.username_label') || 'Username'}</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={canSetUsername ? usernameInput : username}
                onChangeText={text => setUsernameInput(text.trim())}
                placeholder={t('edit_profile.set_username')}
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                editable={canSetUsername}
              />
              {canSetUsername ? (
                <TouchableOpacity
                  onPress={handleSetUsername}
                  disabled={usernameChecking || (usernameStatus && !usernameStatus.available)}
                  style={[
                    styles.usernameCheckBtn,
                    (usernameChecking || (usernameStatus && !usernameStatus.available)) && { opacity: 0.5 }
                  ]}
                >
                  <Text style={styles.usernameCheckBtnText}>
                    {t('edit_profile.set_btn') || 'Set'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <Icon name="check-circle" size={20} color="#10b981" style={{ marginRight: 16 }} />
              )}
            </View>
            {canSetUsername && usernameStatus && (
              <Text style={[styles.statusHint, { color: usernameStatus.available ? '#10b981' : '#ef4444' }]}>
                {usernameStatus.available ? '✓ Username is available' : `✕ ${usernameStatus.message || 'Username is already taken'}`}
              </Text>
            )}
          </View>

          {/* User ID Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('edit_profile.user_id_label') || 'User ID'}</Text>
            <View style={[styles.inputWrapper, styles.inputWrapperDisabled]}>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={userId}
                editable={false}
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
              />
            </View>
          </View>

          {/* Bio Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('edit_profile.bio_label') || 'Bio'}</Text>
            <View style={[styles.inputWrapper, { height: 110 }]}>
              <TextInput
                style={[styles.input, styles.bioInput]}
                value={bio}
                onChangeText={setBio}
                editable={user?.role !== 'host'}
                maxLength={100}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholder={t('edit_profile.write_something')}
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
              />
            </View>
            <Text style={styles.bioCount}>{bio.length}/100</Text>
            {defaultBios.length > 0 ? (
              <View style={styles.bioSuggestions}>
                <Text style={styles.bioSuggestionTitle}>{user?.role === 'host' ? 'Select one approved bio' : 'Quick bio suggestions'}</Text>
                {defaultBios.map(item => (
                  <TouchableOpacity key={item._id} style={styles.bioSuggestionChip} onPress={() => setBio(item.text)} activeOpacity={0.8}>
                    <Text style={styles.bioSuggestionText}>{item.text}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </View>

          {/* Call Level dropdown placeholder (matches screenshot) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Call Level</Text>
            <View style={[styles.inputWrapper, styles.inputWrapperDisabled]}>
              <Icon name="stars" size={18} color="#a855f7" style={{ marginLeft: 16, marginRight: -6 }} />
              <TextInput
                style={[styles.input, styles.inputDisabled, { flex: 1 }]}
                value={`Level ${user?.level || 6}`}
                editable={false}
              />
              <Icon name="keyboard-arrow-down" size={20} color="rgba(255, 255, 255, 0.4)" style={{ marginRight: 16 }} />
            </View>
          </View>

          {/* Language Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('edit_profile.language') || 'Language'}</Text>
            {renderLanguageChips()}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitButtonContainer}
            onPress={handleSubmit}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#03dcfe', '#2563eb']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGradient}
            >
              <Text style={styles.submitButtonText}>{t('edit_profile.submit') || 'Submit'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Custom Glassmorphic Photo Source Picker Modal */}
      <Modal
        visible={photoPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPhotoPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPhotoPickerVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalContainer}>
            <LinearGradient
              colors={['#1e1b4b', '#0f172a']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modalGradientCard}
            >
              <View style={styles.modalHeaderHandle} />

              <Text style={styles.modalTitle}>Upload Profile Photo</Text>
              <Text style={styles.modalSubtitle}>Choose photo source to set your avatar</Text>

              <View style={styles.modalOptionsWrapper}>
                {/* Camera Option */}
                <TouchableOpacity
                  style={styles.modalOptionCard}
                  activeOpacity={0.8}
                  onPress={() => {
                    setPhotoPickerVisible(false);
                    processPhotoUpload('camera');
                  }}
                >
                  <LinearGradient
                    colors={['#7c4dff', '#6366f1']}
                    style={styles.modalOptionIconGlow}
                  >
                    <Icon name="photo-camera" size={22} color="#fff" />
                  </LinearGradient>
                  <View style={styles.modalOptionTextCol}>
                    <Text style={styles.modalOptionTitle}>Take Photo</Text>
                    <Text style={styles.modalOptionSub}>Use front camera for live avatar</Text>
                  </View>
                  <Icon name="chevron-right" size={20} color="rgba(255,255,255,0.4)" />
                </TouchableOpacity>

                {/* Gallery Option */}
                <TouchableOpacity
                  style={styles.modalOptionCard}
                  activeOpacity={0.8}
                  onPress={() => {
                    setPhotoPickerVisible(false);
                    processPhotoUpload('gallery');
                  }}
                >
                  <LinearGradient
                    colors={['#ec4899', '#d946ef']}
                    style={styles.modalOptionIconGlow}
                  >
                    <Icon name="photo-library" size={22} color="#fff" />
                  </LinearGradient>
                  <View style={styles.modalOptionTextCol}>
                    <Text style={styles.modalOptionTitle}>Choose from Gallery</Text>
                    <Text style={styles.modalOptionSub}>Pick photo from device gallery</Text>
                  </View>
                  <Icon name="chevron-right" size={20} color="rgba(255,255,255,0.4)" />
                </TouchableOpacity>
              </View>

              {/* Close Button */}
              <TouchableOpacity
                style={styles.modalCancelBtn}
                activeOpacity={0.8}
                onPress={() => setPhotoPickerVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </LinearGradient>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </ScreenBackgroundView>
  );
};

const styles = StyleSheet.create({
  // Decorative space elements
  starOverlay1: {
    position: 'absolute',
    top: Dimensions.get('window').height * 0.15,
    left: Dimensions.get('window').width * 0.1,
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#fff',
    opacity: 0.8,
  },
  starOverlay2: {
    position: 'absolute',
    top: Dimensions.get('window').height * 0.3,
    right: Dimensions.get('window').width * 0.15,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#ff3366',
    opacity: 0.5,
  },
  planetWrapper: {
    position: 'absolute',
    bottom: -Dimensions.get('window').height * 0.15,
    right: -Dimensions.get('window').width * 0.15,
    width: Dimensions.get('window').width * 0.65,
    height: Dimensions.get('window').width * 0.65,
    borderRadius: (Dimensions.get('window').width * 0.65) / 2,
    overflow: 'hidden',
  },
  planetGlow: {
    flex: 1,
    borderRadius: (Dimensions.get('window').width * 0.65) / 2,
  },
  gridWrapper: {
    position: 'absolute',
    bottom: Dimensions.get('window').height * 0.05,
    left: -Dimensions.get('window').width * 0.1,
    width: Dimensions.get('window').width * 0.5,
    height: Dimensions.get('window').height * 0.2,
    opacity: 0.15,
  },
  gridLine1: {
    position: 'absolute',
    width: '100%',
    height: 1.5,
    backgroundColor: '#ff3366',
    transform: [{ rotate: '30deg' }],
  },
  gridLine2: {
    position: 'absolute',
    width: '100%',
    height: 1.5,
    backgroundColor: '#ff3366',
    top: 30,
    transform: [{ rotate: '30deg' }],
  },

  scrollView: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: 'rgba(124, 77, 255, 0.4)',
    backgroundColor: 'rgba(124, 77, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '800',
  },
  headerSeparatorContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitleLine: {
    width: 60,
    height: 3,
    borderRadius: 1.5,
  },

  // Profile Section
  profileImageSection: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 24,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  profileImageBorder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#0c0628',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#03dcfe',
    borderWidth: 2,
    borderColor: '#0c0628',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#03dcfe',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },

  // Avatars Carousel List
  avatarsCarouselContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'center',
  },
  addAvatarTouch: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarThumbnailWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  avatarThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  avatarThumbnailSelected: {
    borderColor: '#03dcfe',
  },
  avatarCheckBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#0c0628',
  },

  // Form Section
  formContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  inputWrapperDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.015)',
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  inputDisabled: {
    color: 'rgba(255, 255, 255, 0.4)',
  },
  bioInput: {
    height: 100,
    paddingTop: 12,
  },
  bioCount: { color: 'rgba(255,255,255,0.45)', fontSize: 11, textAlign: 'right', marginTop: 5 },
  bioSuggestions: { marginTop: 10, gap: 8 },
  bioSuggestionTitle: { color: '#f0abfc', fontSize: 12, fontWeight: '700' },
  bioSuggestionChip: { borderWidth: 1, borderColor: 'rgba(217,70,239,0.3)', backgroundColor: 'rgba(217,70,239,0.08)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9 },
  bioSuggestionText: { color: 'rgba(255,255,255,0.82)', fontSize: 12, lineHeight: 17 },
  usernameCheckBtn: {
    backgroundColor: 'rgba(3, 220, 254, 0.1)',
    borderWidth: 1.2,
    borderColor: 'rgba(3, 220, 254, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 10,
  },
  usernameCheckBtnText: {
    color: '#03dcfe',
    fontSize: 12,
    fontWeight: '700',
  },

  // Languages Tags Row
  languageChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipTouch: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  languageChipSelected: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageChipTextSelected: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  languageChipUnselected: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageChipTextUnselected: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 13,
    fontWeight: '600',
  },

  // Submit Button
  submitButtonContainer: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 20,
    elevation: 4,
    shadowColor: '#03dcfe',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  submitGradient: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  charCounter: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    fontWeight: '600',
  },
  charCounterMax: {
    color: '#ef4444',
    fontWeight: 'bold',
  },
  statusHint: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '500',
  },

  // Custom Glassmorphic Photo Picker Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    width: '100%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  modalGradientCard: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
  },
  modalHeaderHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  modalSubtitle: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 13,
    marginTop: 4,
    marginBottom: 20,
  },
  modalOptionsWrapper: {
    width: '100%',
    gap: 12,
  },
  modalOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 18,
    padding: 14,
  },
  modalOptionIconGlow: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  modalOptionTextCol: {
    flex: 1,
  },
  modalOptionTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  modalOptionSub: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    marginTop: 2,
  },
  modalCancelBtn: {
    marginTop: 18,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalCancelBtnText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default EditProfile;
