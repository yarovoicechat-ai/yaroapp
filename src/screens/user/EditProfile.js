import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Dimensions,
  Modal,
  StatusBar,
  Clipboard,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import IonIcon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';
import { AuthContext } from '../../context/AuthProvider';
import { apiUtil } from '../../utils/apiUtil';
import { languages } from '../../constants/language';
import { useTranslation } from 'react-i18next';
import { AlertService } from '../../utils/AlertService';
import { pickAvatarCamera, pickAvatarGallery } from '../../utils/avatarMedia';
import { uploadToCloudinary } from '../../utils/cloudinaryUtil';
import AvatarWithFrame from '../../components/AvatarWithFrame';

const { width } = Dimensions.get('window');

const EditProfile = () => {
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 36);
  const { user, setUser, fetchUserProfile, equippedFrame } = useContext(AuthContext);
  const navigation = useNavigation();
  const { t } = useTranslation();

  const [avatars, setAvatars] = useState([]);
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [name, setName] = useState('');
  const [userId, setUserId] = useState('');
  const [bio, setBio] = useState('');
  const [defaultBios, setDefaultBios] = useState([]);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [photoPickerVisible, setPhotoPickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setUserId(user.userId?.toString() || '');
      setBio(user.bio || '');
      setSelectedLanguages(user.language || []);
      setSelectedAvatar(user.image || user.avatar || user.profilePic || '');
      fetchAvatars(user.gender || 'male');
      if (user.role === 'host') {
        fetchDefaultBios();
      } else {
        setDefaultBios([]);
      }
    }
  }, [user]);

  const fetchAvatars = async gender => {
    try {
      const res = await apiUtil.get(`/avatar/${gender}`);
      if (res.data) setAvatars(res.data || []);
    } catch (err) {
      console.log('Failed to fetch avatars:', err.message);
    }
  };

  const fetchDefaultBios = async () => {
    try {
      const res = await apiUtil.get('/user/default-bios');
      if (res.data?.success) setDefaultBios(res.data.data || []);
    } catch (err) {
      console.log('Default bios fetch error:', err.message);
    }
  };

  const toggleLanguage = lang => {
    setSelectedLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  const handleCopyId = () => {
    if (userId) {
      Clipboard.setString(userId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
      AlertService.show('Copied', 'User ID copied to clipboard', 'info');
    }
  };

  const processPhotoUpload = async source => {
    try {
      const captured =
        source === 'camera'
          ? await pickAvatarCamera('front')
          : await pickAvatarGallery();
      if (!captured) return;

      AlertService.show('Uploading', 'Uploading avatar...', 'info');
      let response;

      // Tier 1: Cloudinary upload
      try {
        const cloudUrl = await uploadToCloudinary(captured, 'avatar');
        response = await apiUtil.post('/avatar-request', {
          requestedAvatar: cloudUrl,
        });
      } catch (cloudError) {
        console.warn(
          'Cloudinary unavailable, trying direct multipart avatar upload:',
          cloudError?.message,
        );

        // Tier 2: Direct multipart upload to backend
        try {
          const extension = String(captured.name || captured.uri || '').split('.').pop()?.toLowerCase() || 'jpg';
          const mimeType =
            captured.type ||
            (extension === 'png'
              ? 'image/png'
              : extension === 'webp'
                ? 'image/webp'
                : 'image/jpeg');
          const formData = new FormData();
          formData.append('avatar', {
            uri: captured.uri,
            type: mimeType,
            name: captured.name || `avatar_${Date.now()}.${extension}`,
          });
          response = await apiUtil.post('/avatar-request', formData);
        } catch (multipartError) {
          console.warn(
            'Multipart upload failed, trying Base64 JSON fallback:',
            multipartError?.message,
          );

          // Tier 3: Direct Base64 JSON data URI
          if (captured.base64) {
            const mimeType = captured.type || 'image/jpeg';
            response = await apiUtil.post('/avatar-request', {
              requestedAvatar: `data:${mimeType};base64,${captured.base64}`,
            });
          } else {
            throw multipartError;
          }
        }
      }

      const payload = response?.data?.data;
      const uploadedUrl =
        payload?.avatarUrl ||
        payload?.image ||
        payload?.profilePic ||
        response?.data?.avatarUrl;
      if (!response?.data?.success || !uploadedUrl) {
        throw new Error(response?.data?.message || 'Avatar upload failed.');
      }

      setSelectedAvatar(uploadedUrl);
      setUser((previous) => ({
        ...(previous || {}),
        image: uploadedUrl,
        avatar: uploadedUrl,
        profilePic: uploadedUrl,
      }));
      await fetchUserProfile();
      setPhotoPickerVisible(false);
      AlertService.show(
        'Avatar Updated',
        'Aapka avatar successfully update ho gaya hai!',
        'success',
      );
    } catch (error) {
      if (!String(error?.message || '').toLowerCase().includes('cancelled')) {
        AlertService.show(
          'Error',
          error?.response?.data?.message || error?.message || 'Avatar upload failed',
          'error',
        );
      }
    }
  };

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      AlertService.show(t('edit_profile.error') || 'Error', 'Name is required', 'error');
      return;
    }
    if (trimmedName.length > 20) {
      AlertService.show(t('edit_profile.error') || 'Error', 'Name cannot exceed 20 characters', 'error');
      return;
    }
    if (bio.length > 100) {
      AlertService.show(t('edit_profile.error') || 'Error', t('edit_profile.bio_error') || 'Bio too long', 'error');
      return;
    }
    if (selectedLanguages.length > 2) {
      AlertService.show(t('edit_profile.error') || 'Error', t('edit_profile.lang_error') || 'Max 2 languages allowed', 'error');
      return;
    }

    setSaving(true);
    try {
      const targetId = userId || user?._id || user?.userId;
      const updatePayload = {
        name: trimmedName.slice(0, 20),
        bio,
        language: selectedLanguages,
      };
      if (selectedAvatar && selectedAvatar.trim() !== '') {
        updatePayload.image = selectedAvatar;
      }

      const res = await apiUtil.patch(`/user/${targetId}`, updatePayload);

      if (res.data.success) {
        await fetchUserProfile();
        AlertService.show(t('edit_profile.success') || 'Success', t('edit_profile.update_success') || 'Profile updated successfully', 'success');
        navigation.goBack();
      } else {
        AlertService.show(t('edit_profile.error') || 'Error', res.data.message || t('edit_profile.update_fail') || 'Update failed', 'error');
      }
    } catch (err) {
      console.log('Update failed:', err.response?.data || err.message);
      const serverMsg = err.response?.data?.message || err.message || t('edit_profile.something_wrong') || 'Update failed';
      AlertService.show(t('edit_profile.error') || 'Error', serverMsg, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* Ambient background glow accents */}
      <View style={styles.ambientCircle1} />
      <View style={styles.ambientCircle2} />

      {/* Top Header */}
      <View style={[styles.header, { paddingTop: topSafeInset + 10 }]}>
        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <IonIcon name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>{t('edit_profile.title') || 'Edit Profile'}</Text>
          <View style={styles.headerSubtitleDot} />
          <Text style={styles.headerSubtitle}>Personalize</Text>
        </View>

        <TouchableOpacity
          style={[styles.headerSaveBtn, saving && styles.headerSaveBtnDisabled]}
          onPress={handleSubmit}
          disabled={saving}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#7C3AED', '#4F46E5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.headerSaveGradient}
          >
            <Icon name="check" size={18} color="#FFFFFF" />
            <Text style={styles.headerSaveText}>{saving ? '...' : 'Save'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar Hero Card */}
        <View style={styles.avatarCard}>
          <LinearGradient
            colors={['rgba(124, 58, 237, 0.08)', 'rgba(79, 70, 229, 0.03)']}
            style={styles.avatarCardGradient}
          >
            <View style={styles.avatarGlowContainer}>
              <View style={styles.avatarInnerWrapper}>
                <AvatarWithFrame
                  user={user}
                  avatarUri={selectedAvatar || user?.avatar || user?.image}
                  frame={user?.equippedFrameAsset || equippedFrame || null}
                  size={105}
                  showOnlineDot={false}
                />
              </View>

              {/* Camera Trigger Badge */}
              <TouchableOpacity
                style={styles.cameraBadgeButton}
                activeOpacity={0.85}
                onPress={() => setPhotoPickerVisible(true)}
              >
                <LinearGradient
                  colors={['#7C3AED', '#4F46E5']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cameraBadgeGradient}
                >
                  <Icon name="photo-camera" size={17} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <Text style={styles.avatarHeroTitle}>{name || 'Your Profile'}</Text>
            <Text style={styles.avatarHeroSub}>Tap camera badge to update avatar freely</Text>

            {/* Avatar Preset Carousel */}
            {avatars.length > 0 && (
              <View style={styles.presetSection}>
                <Text style={styles.presetHeading}>OR CHOOSE PRESET</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.presetScrollContent}
                >
                  {avatars.map((item, idx) => {
                    const avatarUrl = item.avatarUrl?.startsWith('http')
                      ? item.avatarUrl
                      : `https://api.yaroapp.in${item.avatarUrl}`;
                    const isSelected = selectedAvatar === avatarUrl;
                    return (
                      <TouchableOpacity
                        key={idx.toString()}
                        onPress={() => setSelectedAvatar(avatarUrl)}
                        activeOpacity={0.8}
                        style={[
                          styles.presetThumbnailWrap,
                          isSelected && styles.presetThumbnailSelectedWrap,
                        ]}
                      >
                        <Image source={{ uri: avatarUrl }} style={styles.presetThumbnail} />
                        {isSelected && (
                          <View style={styles.presetCheckPill}>
                            <Icon name="check" size={11} color="#FFFFFF" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </LinearGradient>
        </View>

        {/* Form Details Card */}
        <View style={styles.cardContainer}>
          <Text style={styles.sectionHeaderTitle}>Basic Information</Text>

          {/* Name Field */}
          <View style={styles.fieldGroup}>
            <View style={styles.fieldLabelRow}>
              <View style={styles.fieldLabelWithIcon}>
                <Icon name="badge" size={16} color="#7C3AED" style={{ marginRight: 6 }} />
                <Text style={styles.fieldLabel}>Display Name</Text>
              </View>
              <Text style={[styles.charCount, name.length >= 20 && styles.charCountMax]}>
                {name.length}/20
              </Text>
            </View>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={t => setName(t.slice(0, 20))}
                maxLength={20}
                placeholder="Enter display name"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          {/* User ID Field with Copy */}
          <View style={styles.fieldGroup}>
            <View style={styles.fieldLabelRow}>
              <View style={styles.fieldLabelWithIcon}>
                <Icon name="fingerprint" size={16} color="#6366F1" style={{ marginRight: 6 }} />
                <Text style={styles.fieldLabel}>Yaro User ID</Text>
              </View>
              <Text style={styles.readOnlyTag}>Permanent</Text>
            </View>
            <View style={[styles.inputBox, styles.inputBoxReadOnly]}>
              <TextInput
                style={[styles.textInput, styles.textInputReadOnly]}
                value={userId}
                editable={false}
              />
              <TouchableOpacity
                style={styles.copyIdBtn}
                onPress={handleCopyId}
                activeOpacity={0.7}
              >
                <Icon
                  name={copiedId ? 'done' : 'content-copy'}
                  size={16}
                  color={copiedId ? '#10B981' : '#6366F1'}
                />
                <Text style={[styles.copyIdText, copiedId && { color: '#10B981' }]}>
                  {copiedId ? 'Copied' : 'Copy'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bio Field */}
          <View style={styles.fieldGroup}>
            <View style={styles.fieldLabelRow}>
              <View style={styles.fieldLabelWithIcon}>
                <Icon name="create" size={16} color="#EC4899" style={{ marginRight: 6 }} />
                <Text style={styles.fieldLabel}>Bio</Text>
              </View>
              <Text style={[styles.charCount, bio.length >= 100 && styles.charCountMax]}>
                {bio.length}/100
              </Text>
            </View>
            <View style={[styles.inputBox, styles.bioInputBox]}>
              <TextInput
                style={styles.bioTextInput}
                value={bio}
                onChangeText={setBio}
                maxLength={100}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                placeholder="Share a short bio with friends..."
                placeholderTextColor="#94A3B8"
                editable={user?.role !== 'host'}
              />
            </View>

            {/* Bio suggestions for hosts */}
            {defaultBios.length > 0 && (
              <View style={styles.bioSuggestionsWrap}>
                <Text style={styles.bioSuggestionHeading}>Approved Quick Bios:</Text>
                <View style={styles.bioChipsRow}>
                  {defaultBios.map(item => (
                    <TouchableOpacity
                      key={item._id}
                      style={styles.bioChip}
                      onPress={() => setBio(item.text)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.bioChipText} numberOfLines={2}>
                        {item.text}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Call Level Badge */}
          <View style={styles.fieldGroup}>
            <View style={styles.fieldLabelRow}>
              <View style={styles.fieldLabelWithIcon}>
                <Icon name="stars" size={16} color="#F59E0B" style={{ marginRight: 6 }} />
                <Text style={styles.fieldLabel}>Call Level</Text>
              </View>
            </View>
            <View style={[styles.inputBox, styles.inputBoxReadOnly]}>
              <View style={styles.levelBadge}>
                <LinearGradient
                  colors={['#F59E0B', '#D97706']}
                  style={styles.levelBadgeGradient}
                >
                  <Icon name="star" size={13} color="#FFFFFF" />
                  <Text style={styles.levelBadgeText}>LV.{user?.level || 1}</Text>
                </LinearGradient>
              </View>
              <Text style={styles.levelSubText}>Dynamic level calculated from active calling</Text>
            </View>
          </View>

          {/* Spoken Languages */}
          <View style={[styles.fieldGroup, { marginBottom: 4 }]}>
            <View style={styles.fieldLabelRow}>
              <View style={styles.fieldLabelWithIcon}>
                <Icon name="translate" size={16} color="#06B6D4" style={{ marginRight: 6 }} />
                <Text style={styles.fieldLabel}>Languages Spoken</Text>
              </View>
              <Text style={styles.fieldSubHint}>Select up to 2</Text>
            </View>
            <View style={styles.languageChipsContainer}>
              {languages.map(lang => {
                const isSelected = selectedLanguages.includes(lang);
                return (
                  <TouchableOpacity
                    key={lang}
                    onPress={() => toggleLanguage(lang)}
                    activeOpacity={0.75}
                    style={styles.langTouch}
                  >
                    {isSelected ? (
                      <LinearGradient
                        colors={['#7C3AED', '#4F46E5']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.langPillActive}
                      >
                        <Icon name="check" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                        <Text style={styles.langTextActive}>{lang}</Text>
                      </LinearGradient>
                    ) : (
                      <View style={styles.langPillInactive}>
                        <Text style={styles.langTextInactive}>{lang}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Primary Save Button */}
        <TouchableOpacity
          style={styles.submitBtnWrap}
          onPress={handleSubmit}
          disabled={saving}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#7C3AED', '#4F46E5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitBtnGradient}
          >
            <Icon name="done-all" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.submitBtnText}>
              {saving ? 'Updating Profile...' : 'Save All Changes'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Sleek Custom Avatar Picker Modal */}
      <Modal
        visible={photoPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPhotoPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPhotoPickerVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalContentCard}>
            <View style={styles.modalHandleBar} />
            <Text style={styles.modalHeading}>Change Profile Photo</Text>
            <Text style={styles.modalSubheading}>
              Select a source to instantly update your avatar
            </Text>

            <View style={styles.modalOptionsGrid}>
              <TouchableOpacity
                style={styles.modalTile}
                activeOpacity={0.8}
                onPress={() => {
                  setPhotoPickerVisible(false);
                  processPhotoUpload('camera');
                }}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#7C3AED']}
                  style={styles.modalTileIconBox}
                >
                  <Icon name="photo-camera" size={24} color="#FFFFFF" />
                </LinearGradient>
                <View style={styles.modalTileTextWrap}>
                  <Text style={styles.modalTileTitle}>Take Live Photo</Text>
                  <Text style={styles.modalTileDesc}>Open camera for a quick selfie</Text>
                </View>
                <IonIcon name="chevron-forward" size={18} color="#94A3B8" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalTile}
                activeOpacity={0.8}
                onPress={() => {
                  setPhotoPickerVisible(false);
                  processPhotoUpload('gallery');
                }}
              >
                <LinearGradient
                  colors={['#EC4899', '#D946EF']}
                  style={styles.modalTileIconBox}
                >
                  <Icon name="photo-library" size={24} color="#FFFFFF" />
                </LinearGradient>
                <View style={styles.modalTileTextWrap}>
                  <Text style={styles.modalTileTitle}>Choose From Gallery</Text>
                  <Text style={styles.modalTileDesc}>Select from photos on device</Text>
                </View>
                <IonIcon name="chevron-forward" size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalCancelButton}
              activeOpacity={0.7}
              onPress={() => setPhotoPickerVisible(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  ambientCircle1: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
  },
  ambientCircle2: {
    position: 'absolute',
    top: 260,
    left: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(6, 182, 212, 0.06)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'transparent',
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  headerTitleWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitleDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#7C3AED',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  headerSaveBtn: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#7C3AED',
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  headerSaveBtnDisabled: {
    opacity: 0.6,
  },
  headerSaveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    gap: 4,
  },
  headerSaveText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  avatarCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#64748B',
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  avatarCardGradient: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  avatarGlowContainer: {
    position: 'relative',
    marginBottom: 14,
  },
  avatarGradientRing: {
    width: 122,
    height: 122,
    borderRadius: 61,
    padding: 3.5,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  avatarInnerWrapper: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  cameraBadgeButton: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    elevation: 5,
    shadowColor: '#7C3AED',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  cameraBadgeGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHeroTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  avatarHeroSub: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  presetSection: {
    width: '100%',
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEF2F6',
  },
  presetHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.2,
    marginBottom: 10,
    paddingLeft: 4,
  },
  presetScrollContent: {
    gap: 12,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  presetThumbnailWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#FFFFFF',
  },
  presetThumbnailSelectedWrap: {
    borderColor: '#7C3AED',
    borderWidth: 2.5,
  },
  presetThumbnail: {
    width: '100%',
    height: '100%',
  },
  presetCheckPill: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#64748B',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  fieldLabelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  fieldSubHint: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  charCount: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  charCountMax: {
    color: '#EF4444',
    fontWeight: '800',
  },
  readOnlyTag: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#6366F1',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  inputBoxReadOnly: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
    padding: 0,
  },
  textInputReadOnly: {
    color: '#64748B',
  },
  copyIdBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  copyIdText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#6366F1',
  },
  bioInputBox: {
    height: 84,
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  bioTextInput: {
    flex: 1,
    width: '100%',
    fontSize: 13.5,
    color: '#0F172A',
    fontWeight: '500',
    lineHeight: 19,
    padding: 0,
  },
  bioSuggestionsWrap: {
    marginTop: 10,
  },
  bioSuggestionHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6366F1',
    marginBottom: 6,
  },
  bioChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  bioChip: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: '100%',
  },
  bioChipText: {
    fontSize: 11.5,
    color: '#3730A3',
    lineHeight: 16,
  },
  levelBadge: {
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 10,
  },
  levelBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 3,
  },
  levelBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  levelSubText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  languageChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  langTouch: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  langPillActive: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  langTextActive: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  langPillInactive: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
  },
  langTextInactive: {
    color: '#475569',
    fontSize: 12.5,
    fontWeight: '600',
  },
  submitBtnWrap: {
    borderRadius: 22,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    marginTop: 4,
    marginBottom: 12,
  },
  submitBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContentCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    alignItems: 'center',
  },
  modalHandleBar: {
    width: 44,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#CBD5E1',
    marginBottom: 16,
  },
  modalHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  modalSubheading: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 20,
  },
  modalOptionsGrid: {
    width: '100%',
    gap: 12,
  },
  modalTile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    padding: 14,
  },
  modalTileIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  modalTileTextWrap: {
    flex: 1,
  },
  modalTileTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  modalTileDesc: {
    fontSize: 12,
    color: '#64748B',
  },
  modalCancelButton: {
    width: '100%',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
});

export default EditProfile;
