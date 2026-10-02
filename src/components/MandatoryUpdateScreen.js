import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  BackHandler,
  ActivityIndicator,
  StatusBar,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import InAppUpdateService from '../services/InAppUpdateService';

const AppLogo = require('../assets/app_icon.png');
const { width } = Dimensions.get('window');

const MandatoryUpdateScreen = ({ updateInfo, onUpdateCompleted }) => {
  const [updating, setUpdating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Intercept Android Hardware Back Button to prevent bypass
  useEffect(() => {
    const onBackPress = () => {
      // Return true to prevent hardware back button from closing app or navigating back
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    );

    return () => backHandler.remove();
  }, []);

  const handleUpdateNow = async () => {
    setUpdating(true);
    setErrorMessage('');
    setStatusMessage('Starting Google Play Update...');

    const result = await InAppUpdateService.startImmediateUpdate((status) => {
      if (status) {
        if (status.status === 2 || status.status === 3) {
          setStatusMessage('Downloading Update... Please wait.');
        } else if (status.status === 4 || status.status === 5) {
          setStatusMessage('Installing Update... Please wait.');
        } else if (status.status === 11 || status.status === 6) {
          setStatusMessage('Update Downloaded. Restarting...');
        }
      }
    });

    if (!result.success) {
      setUpdating(false);
      setStatusMessage('');
      setErrorMessage(
        result.message || 'Update was cancelled or failed. Please tap UPDATE NOW to retry.'
      );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" transparent backgroundColor="transparent" translucent />

      {/* Deep Rich Gradient Background */}
      <LinearGradient
        colors={['#050212', '#140632', '#2B064E', '#0A021A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Center Branding Content */}
      <View style={styles.contentCard}>
        {/* App Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoGlowBackdrop} />
          <Image source={AppLogo} style={styles.logoImage} resizeMode="contain" />
        </View>

        {/* Brand & Update Title */}
        <Text style={styles.brandTitle}>Yaro</Text>
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>UPDATE REQUIRED</Text>
        </View>

        <Text style={styles.headline}>New Version Available</Text>
        <Text style={styles.description}>
          A mandatory update is required to continue using Yaro. Please update the app now to enjoy the latest features and security improvements.
        </Text>

        {/* Current Version Subtitle */}
        {updateInfo?.currentVersionName && (
          <Text style={styles.versionText}>
            Current App Version: v{updateInfo.currentVersionName} (Build {updateInfo.currentBuildNumber})
          </Text>
        )}

        {/* Error Message if Update Failed/Cancelled */}
        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
          </View>
        ) : null}

        {/* Status Message while downloading/installing */}
        {statusMessage ? (
          <View style={styles.statusBox}>
            <ActivityIndicator size="small" color="#FF2D87" style={styles.spinner} />
            <Text style={styles.statusText}>{statusMessage}</Text>
          </View>
        ) : null}

        {/* Single Action Button: UPDATE NOW */}
        <TouchableOpacity
          style={[styles.updateButton, updating && styles.disabledButton]}
          activeOpacity={0.8}
          disabled={updating}
          onPress={handleUpdateNow}
        >
          <LinearGradient
            colors={updating ? ['#555', '#444'] : ['#FF6B00', '#FF2D87', '#C026D3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            {updating ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>UPDATE NOW</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050212',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  contentCard: {
    width: width - 48,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#C026D3',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 15,
  },
  logoContainer: {
    width: 100,
    height: 100,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoGlowBackdrop: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255, 45, 135, 0.35)',
    filter: 'blur(20px)',
  },
  logoImage: {
    width: 90,
    height: 90,
    borderRadius: 22,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 6,
  },
  badgeContainer: {
    backgroundColor: 'rgba(255, 45, 135, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 45, 135, 0.5)',
    marginBottom: 18,
  },
  badgeText: {
    color: '#FF2D87',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  headline: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F3E8FF',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 16,
  },
  versionText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.45)',
    marginBottom: 20,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 18,
    width: '100%',
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(192, 38, 211, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(192, 38, 211, 0.4)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 18,
    width: '100%',
    justifyContent: 'center',
  },
  statusText: {
    color: '#F0ABFC',
    fontSize: 13,
    fontWeight: '600',
  },
  spinner: {
    marginRight: 8,
  },
  updateButton: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    overflow: 'hidden',
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
});

export default MandatoryUpdateScreen;
