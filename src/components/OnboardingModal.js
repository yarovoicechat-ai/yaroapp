import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  StatusBar,
  BackHandler,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { apiUtil } from '../utils/apiUtil';
import { AuthContext } from '../context/AuthProvider';
import { AlertService } from '../utils/AlertService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../utils/safeAreaUtils';

const { width, height } = Dimensions.get('window');

const diamondIcon = require('../assets/icons/diamond.png');

const OnboardingModal = ({ visible }) => {
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 24);
  const { user, fetchUserProfile } = useContext(AuthContext);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [avatars, setAvatars] = useState([]);

  const [loadingAvatars, setLoadingAvatars] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState(null); // { available: boolean, message: string }

  // Prefill default name / username / user avatar if present
  useEffect(() => {
    if (user) {
      if (user.name) setName(user.name);
      if (user.userName) setUsername(user.userName);
      if (user.image) setSelectedAvatar(user.image);
    }
  }, [user]);

  // Disable Android physical back button when onboarding is visible
  useEffect(() => {
    if (!visible) return;
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => backHandler.remove();
  }, [visible]);

  // Fetch avatars based on gender
  useEffect(() => {
    if (!visible) return;
    const gender = user?.gender || 'male';
    let isMounted = true;

    const fetchAvatars = async () => {
      setLoadingAvatars(true);
      try {
        const res = await apiUtil.get(`/avatar/${gender}`);
        if (isMounted) {
          const list = res.data || [];
          setAvatars(list);
          if (list.length > 0 && !selectedAvatar) {
            const firstAvatarUrl = list[0]?.avatarUrl?.startsWith('http')
              ? list[0]?.avatarUrl
              : `https://api.yaroapp.in${list[0]?.avatarUrl}`;
            setSelectedAvatar(firstAvatarUrl);
          }
        }
      } catch (err) {
        console.log('Failed to fetch avatars in onboarding:', err.message);
      } finally {
        if (isMounted) setLoadingAvatars(false);
      }
    };

    fetchAvatars();
    return () => { isMounted = false; };
  }, [visible, user?.gender]);

  // Handle Name Input Change (Hard Limit 20 Chars)
  const handleNameChange = text => {
    setName(text.slice(0, 20));
  };

  // Debounced Username availability check
  useEffect(() => {
    const trimmed = username.trim();
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
  }, [username]);

  const isNameValid = name.trim().length >= 1 && name.trim().length <= 20;
  const isUsernameValid = username.trim().length >= 1 && usernameStatus?.available !== false;
  const isAvatarValid = Boolean(selectedAvatar);
  const isFormValid = isNameValid && isUsernameValid && isAvatarValid && !usernameChecking;

  const handleSelectAvatar = item => {
    const avatarUrl = item.avatarUrl?.startsWith('http')
      ? item.avatarUrl
      : `https://api.yaroapp.in${item.avatarUrl}`;
    setSelectedAvatar(avatarUrl);
  };

  const handleSaveProfile = async () => {
    const trimmedName = name.trim();
    const trimmedUsername = username.trim();

    if (!trimmedName) {
      AlertService.show('Required', 'Please enter your name', 'error');
      return;
    }

    if (trimmedName.length > 20) {
      AlertService.show('Limit Exceeded', 'Name cannot exceed 20 characters', 'error');
      return;
    }

    if (!trimmedUsername) {
      AlertService.show('Required', 'Please enter a username', 'error');
      return;
    }

    if (usernameStatus && !usernameStatus.available) {
      AlertService.show('Unavailable', 'Username is already taken', 'error');
      return;
    }

    if (!selectedAvatar) {
      AlertService.show('Required', 'Please select an avatar', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: trimmedName.slice(0, 20),
        username: trimmedUsername,
        avatar: selectedAvatar,
        referralCode: referralCode.trim(),
      };

      const res = await apiUtil.post('/user/complete-profile', payload);

      if (res.data?.success) {
        AlertService.show('Congratulations! 🎉', 'Profile completed! You earned +100 Welcome Diamonds 💎', 'success');
        await fetchUserProfile();
      } else {
        AlertService.show('Error', res.data?.message || 'Failed to complete profile', 'error');
      }
    } catch (err) {
      console.log('Onboarding complete error:', err.response?.data || err.message);
      const errMsg = err.response?.data?.message || err.message || 'Something went wrong';
      AlertService.show('Notice', errMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent
      onRequestClose={() => {}}
    >
      <StatusBar backgroundColor="#020b24" barStyle="light-content" />
      <LinearGradient
        colors={['#020b24', '#081438', '#010512']}
        style={[styles.container, { paddingTop: topSafeInset }]}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Badge & Title */}
          <View style={styles.headerContainer}>
            <LinearGradient
              colors={['#03dcfe', '#d946ef']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.welcomeBadge}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Image source={diamondIcon} style={{ width: 16, height: 16 }} resizeMode="contain" />
                <Text style={styles.welcomeBadgeText}>WELCOME TO YARO</Text>
                <Image source={diamondIcon} style={{ width: 16, height: 16 }} resizeMode="contain" />
              </View>
            </LinearGradient>
            <Text style={styles.headerTitle}>Complete Your Profile</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Text style={styles.headerSub}>Set up your profile now & claim </Text>
              <Image source={diamondIcon} style={{ width: 16, height: 16, marginHorizontal: 2 }} resizeMode="contain" />
              <Text style={styles.highlightText}>+100 FREE Diamonds!</Text>
            </View>
          </View>

          {/* Card Container */}
          <LinearGradient
            colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
            style={styles.card}
          >
            {/* 1. Avatar Selection */}
            <View style={styles.sectionHeader}>
              <Icon name="face" size={20} color="#03dcfe" />
              <Text style={styles.sectionTitle}>Select Avatar <Text style={styles.reqMark}>*</Text></Text>
            </View>

            {loadingAvatars ? (
              <ActivityIndicator size="small" color="#03dcfe" style={{ marginVertical: 20 }} />
            ) : avatars.length > 0 ? (
              <FlatList
                horizontal
                data={avatars}
                keyExtractor={(item, index) => item._id || String(index)}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.avatarListContent}
                renderItem={({ item }) => {
                  const avatarUrl = item.avatarUrl?.startsWith('http')
                    ? item.avatarUrl
                    : `https://api.yaroapp.in${item.avatarUrl}`;
                  const isSelected = selectedAvatar === avatarUrl;
                  return (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleSelectAvatar(item)}
                      style={[
                        styles.avatarItemWrapper,
                        isSelected && styles.avatarItemWrapperSelected,
                      ]}
                    >
                      <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                      {isSelected && (
                        <View style={styles.avatarSelectedBadge}>
                          <Icon name="check" size={14} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            ) : (
              <View style={styles.defaultAvatarContainer}>
                <Image
                  source={{ uri: selectedAvatar || 'https://api.yaroapp.in/uploads/avatars/205766/77c96d4c-7224-4e7f-893a-542e9727d232.jpg' }}
                  style={styles.defaultAvatarImage}
                />
              </View>
            )}

            {/* 2. Full Name Input */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Full Name <Text style={styles.reqMark}>*</Text></Text>
                <Text style={[styles.charCounter, name.length === 20 && styles.charCounterMax]}>{name.length}/20</Text>
              </View>
              <View style={styles.inputWrapper}>
                <Icon name="person" size={20} color="rgba(255,255,255,0.4)" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your name"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={name}
                  onChangeText={handleNameChange}
                  maxLength={20}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* 3. Username Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username <Text style={styles.reqMark}>*</Text></Text>
              <View style={styles.inputWrapper}>
                <Icon name="alternate-email" size={20} color="rgba(255,255,255,0.4)" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Choose unique username"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={username}
                  onChangeText={text => setUsername(text.trim())}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {usernameChecking && <ActivityIndicator size="small" color="#03dcfe" style={{ marginRight: 10 }} />}
                {!usernameChecking && usernameStatus && (
                  <Icon
                    name={usernameStatus.available ? "check-circle" : "cancel"}
                    size={18}
                    color={usernameStatus.available ? "#22c55e" : "#ef4444"}
                    style={{ marginRight: 10 }}
                  />
                )}
              </View>
              {usernameStatus && (
                <Text style={[styles.statusHint, { color: usernameStatus.available ? '#22c55e' : '#ef4444' }]}>
                  {usernameStatus.available ? '✓ Username is available' : `✕ ${usernameStatus.message || 'Username is already taken'}`}
                </Text>
              )}
            </View>

            {/* 4. Referral Code Input (Optional) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Referral Code <Text style={styles.optionalText}>(Optional)</Text></Text>
              <View style={styles.inputWrapper}>
                <Icon name="card-giftcard" size={20} color="#d946ef" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Have a referral code? (e.g. ABC123)"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={referralCode}
                  onChangeText={text => setReferralCode(text.toUpperCase())}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
              </View>
              <Text style={styles.hintText}>Entering a friend's referral code rewards your referrer +25 🫘 Beans on setup + 25 🫘 Beans after 5 min call!</Text>
            </View>
          </LinearGradient>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, (!isFormValid || submitting) && styles.submitBtnDisabled]}
            activeOpacity={0.85}
            onPress={handleSaveProfile}
            disabled={!isFormValid || submitting}
          >
            <LinearGradient
              colors={isFormValid ? ['#03dcfe', '#d946ef'] : ['#475569', '#334155']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGradient}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>Save & Claim +100 💎</Text>
                  <Icon name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

        </ScrollView>
      </LinearGradient>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeBadge: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 12,
  },
  welcomeBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  headerSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
  },
  highlightText: {
    color: '#03dcfe',
    fontWeight: 'bold',
  },

  card: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    padding: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  reqMark: {
    color: '#ef4444',
  },

  avatarListContent: {
    paddingVertical: 8,
    gap: 12,
  },
  avatarItemWrapper: {
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 3,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    marginRight: 10,
  },
  avatarItemWrapperSelected: {
    borderColor: '#03dcfe',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
  },
  avatarSelectedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#03dcfe',
    width: 22,
    height: 22,
    borderRadius: 11,
    justify: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#020b24',
  },
  defaultAvatarContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  defaultAvatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: '#03dcfe',
  },

  inputGroup: {
    marginTop: 16,
  },
  label: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  optionalText: {
    color: 'rgba(255,255,255,0.5)',
    fontWeight: 'normal',
    fontSize: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
  },
  hintText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    marginTop: 4,
    marginLeft: 4,
  },

  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  charCounter: {
    color: 'rgba(255,255,255,0.5)',
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
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtn: {
    width: '100%',
    borderRadius: 25,
    overflow: 'hidden',
    marginTop: 10,
    elevation: 5,
  },
  submitGradient: {
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

export default OnboardingModal;
