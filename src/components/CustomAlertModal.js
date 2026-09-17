import React, { useState, useImperativeHandle, forwardRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { setAlertRef } from '../utils/AlertService';

const { width } = Dimensions.get('window');

const CustomAlertModal = forwardRef((props, ref) => {
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('error'); // error, warning, info, success
  const [buttons, setButtons] = useState([]);
  const [scaleAnim] = useState(new Animated.Value(0.8));

  useImperativeHandle(ref, () => ({
    showAlert: (alertTitle, alertMessage, alertType = 'error', alertButtons = null) => {
      setTitle(alertTitle || 'Notice');
      setMessage(alertMessage || '');
      setType(alertType);
      
      if (alertButtons && Array.isArray(alertButtons) && alertButtons.length > 0) {
        setButtons(alertButtons);
      } else {
        setButtons([{ text: 'OK', onPress: () => hideAlert() }]);
      }

      setVisible(true);
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 100,
        useNativeDriver: true,
      }).start();
    },
    hideAlert: () => {
      hideAlert();
    },
  }));

  const hideAlert = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.8,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
    });
  };

  if (!visible) return null;

  const isDiamondAlert =
    title.toLowerCase().includes('diamond') ||
    message.toLowerCase().includes('diamond') ||
    title.toLowerCase().includes('recharge');

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={hideAlert}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.dialogCard, { transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient
            colors={['#1c0c3a', '#100526', '#090217']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientContainer}
          >
            {/* Header Icon Badge */}
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={
                  isDiamondAlert
                    ? ['#f43f5e', '#a855f7', '#6366f1']
                    : type === 'success'
                    ? ['#10b981', '#059669']
                    : ['#ef4444', '#b91c1c']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconBadge}
              >
                {isDiamondAlert ? (
                  <Image
                    source={require('../assets/icons/diamond.png')}
                    style={styles.diamondIcon}
                    resizeMode="contain"
                  />
                ) : type === 'success' ? (
                  <Icon name="check-circle-outline" size={32} color="#fff" />
                ) : (
                  <Icon name="alert-circle-outline" size={32} color="#fff" />
                )}
              </LinearGradient>
            </View>

            {/* Title */}
            <Text style={styles.titleText}>{title}</Text>

            {/* Message */}
            <Text style={styles.messageText}>{message}</Text>

            {/* Action Buttons */}
            <View style={styles.buttonRow}>
              {buttons.map((btn, index) => {
                const isCancel = btn.style === 'cancel' || btn.text?.toLowerCase() === 'cancel';
                return (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={0.8}
                    style={styles.buttonFlex}
                    onPress={() => {
                      hideAlert();
                      if (btn.onPress) btn.onPress();
                    }}
                  >
                    {isCancel ? (
                      <View style={styles.cancelBtn}>
                        <Text style={styles.cancelBtnText}>{btn.text || 'Cancel'}</Text>
                      </View>
                    ) : (
                      <LinearGradient
                        colors={['#ec4899', '#8b5cf6']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.confirmBtn}
                      >
                        <Text style={styles.confirmBtnText}>{btn.text || 'OK'}</Text>
                      </LinearGradient>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
});

// Auto-register ref callback when mounted
export default function RegisteredCustomAlertModal() {
  return <CustomAlertModal ref={(ref) => setAlertRef(ref)} />;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(3, 1, 10, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  dialogCard: {
    width: width * 0.85,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(168, 85, 247, 0.5)',
    elevation: 20,
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  gradientContainer: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  diamondIcon: {
    width: 34,
    height: 34,
  },
  titleText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  messageText: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  buttonFlex: {
    flex: 1,
  },
  cancelBtn: {
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#94a3b8',
    fontSize: 15,
    fontWeight: '600',
  },
  confirmBtn: {
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
