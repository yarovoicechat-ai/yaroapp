import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  AppState,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { OverlayPermissionManager } from '../utils/OverlayPermissionManager';

const { width } = Dimensions.get('window');

const OverlayPermissionGateModal = ({ visible, onGranted, onContinueAnyway }) => {
  useEffect(() => {
    if (!visible) return;

    const subscription = AppState.addEventListener('change', async (nextState) => {
      if (nextState === 'active') {
        console.log('[OVERLAY] Returned from settings');
        const granted = await OverlayPermissionManager.checkActualOverlayPermission();
        console.log(`[OVERLAY] Permission after return: ${granted}`);

        if (granted) {
          console.log('[OVERLAY] Navigating to Home');
          if (onGranted) onGranted();
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [visible, onGranted]);

  if (!visible) return null;

  const handleEnableSettings = () => {
    OverlayPermissionManager.openOverlaySettings();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <View style={styles.overlayContainer}>
        {/* Glassmorphism Card Outer Border */}
        <View style={styles.cardBorderOuter}>
          <LinearGradient
            colors={['rgba(255, 45, 135, 0.45)', 'rgba(192, 38, 211, 0.25)', 'rgba(3, 220, 254, 0.4)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            <View style={styles.cardContent}>
              {/* Floating Icon Header */}
              <View style={styles.iconCircleWrapper}>
                <LinearGradient
                  colors={['#FF2D87', '#C026D3']}
                  style={styles.iconGradient}
                >
                  <Icon name="layers-outline" size={32} color="#FFFFFF" />
                </LinearGradient>
              </View>

              {/* Title & Description */}
              <Text style={styles.titleText}>Display Over Other Apps</Text>
              <Text style={styles.descriptionText}>
                Enable permission to keep floating call controls accessible while using other apps during voice calls.
              </Text>

              {/* Action Buttons */}
              <View style={styles.buttonGroup}>
                {/* Enable in Settings Primary Button */}
                <TouchableOpacity
                  onPress={handleEnableSettings}
                  activeOpacity={0.85}
                  style={styles.primaryButtonWrapper}
                >
                  <LinearGradient
                    colors={['#FF6B00', '#FF2D87', '#C026D3']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryButtonGradient}
                  >
                    <Icon name="settings-outline" size={18} color="#FFFFFF" style={styles.btnIcon} />
                    <Text style={styles.primaryButtonText}>ENABLE IN SETTINGS</Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Continue / Skip Button */}
                <TouchableOpacity
                  onPress={() => {
                    console.log('[OVERLAY] User selected Continue to Home without overlay permission');
                    console.log('[OVERLAY] Navigating to Home');
                    if (onContinueAnyway) onContinueAnyway();
                  }}
                  activeOpacity={0.7}
                  style={styles.secondaryButton}
                >
                  <Text style={styles.secondaryButtonText}>Continue to Home</Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    backgroundColor: 'rgba(5, 2, 18, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  cardBorderOuter: {
    width: Math.min(width * 0.9, 380),
    borderRadius: 24,
    padding: 1.5,
  },
  cardGradient: {
    borderRadius: 24,
  },
  cardContent: {
    backgroundColor: '#0F092E',
    borderRadius: 22.5,
    padding: 24,
    alignItems: 'center',
  },
  iconCircleWrapper: {
    marginBottom: 16,
    shadowColor: '#C026D3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  iconGradient: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  descriptionText: {
    fontSize: 13.5,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonGroup: {
    width: '100%',
  },
  primaryButtonWrapper: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 12,
  },
  primaryButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnIcon: {
    marginRight: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  secondaryButton: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default OverlayPermissionGateModal;
