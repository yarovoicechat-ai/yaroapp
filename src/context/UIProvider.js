import React, { createContext, useState, useContext, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Animated,
    Dimensions,
    Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { navigate } from '../utils/navigationRef';

const { width } = Dimensions.get('window');

const UIContext = createContext();

export const UIProvider = ({ children }) => {
    const [alert, setAlert] = useState({ visible: false, title: '', message: '', type: 'error', buttons: null });
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.85)).current;

    const showAlert = (title, message, type = 'error', buttons = null) => {
        setAlert({ visible: true, title, message, type, buttons });

        fadeAnim.setValue(0);
        scaleAnim.setValue(0.85);

        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 7,
                tension: 80,
                useNativeDriver: true,
            })
        ]).start();
    };

    const hideAlert = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 0.85,
                duration: 200,
                useNativeDriver: true,
            })
        ]).start(() => setAlert(prev => ({ ...prev, visible: false })));
    };

    return (
        <UIContext.Provider value={{ showAlert, hideAlert }}>
            {children}
            <Modal
                visible={alert.visible}
                transparent
                animationType="none"
                onRequestClose={hideAlert}
            >
                <View style={styles.overlay}>
                    <Animated.View
                        style={[
                            styles.alertContainer,
                            {
                                opacity: fadeAnim,
                                transform: [{ scale: scaleAnim }]
                            }
                        ]}
                    >
                        {(() => {
                            const isDiamondAlert =
                                alert.title?.toLowerCase().includes('diamond') ||
                                alert.message?.toLowerCase().includes('diamond') ||
                                alert.title?.toLowerCase().includes('recharge');

                            return (
                                <LinearGradient
                                    colors={
                                        isDiamondAlert
                                            ? ['#1f0a38', '#120426', '#090117']
                                            : alert.type === 'error'
                                            ? ['#2a0914', '#17040a', '#0a0105']
                                            : ['#09261a', '#04170f', '#010a06']
                                    }
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={[
                                        styles.gradient,
                                        isDiamondAlert && styles.diamondBorder,
                                    ]}
                                >
                                    {/* Top decorative glow badge */}
                                    <View style={styles.iconWrapper}>
                                        <LinearGradient
                                            colors={
                                                isDiamondAlert
                                                    ? ['#ff2a85', '#a855f7', '#03dcfe']
                                                    : alert.type === 'error'
                                                    ? ['#ff4d4d', '#f43f5e']
                                                    : ['#10b981', '#059669']
                                            }
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={styles.iconGlowBadge}
                                        >
                                            {isDiamondAlert ? (
                                                <Image
                                                    source={require('../assets/icons/diamond.png')}
                                                    style={styles.diamondImage}
                                                    resizeMode="contain"
                                                />
                                            ) : (
                                                <Icon
                                                    name={alert.type === 'error' ? 'error-outline' : 'check-circle-outline'}
                                                    size={40}
                                                    color="#fff"
                                                />
                                            )}
                                        </LinearGradient>
                                    </View>

                                    {/* Insufficient balance tag */}
                                    {isDiamondAlert && (
                                        <View style={styles.diamondTagContainer}>
                                            <LinearGradient
                                                colors={['rgba(255,42,133,0.25)', 'rgba(168,85,247,0.25)']}
                                                style={styles.diamondTag}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                            >
                                                <Text style={styles.diamondTagText}>💎 RECHARGE REQUIRED</Text>
                                            </LinearGradient>
                                        </View>
                                    )}

                                    {/* Title & Message */}
                                    <Text style={styles.title}>{alert.title || 'Notice'}</Text>
                                    <Text style={styles.message}>{alert.message}</Text>

                                    {/* Buttons */}
                                    {alert.buttons && alert.buttons.length > 0 ? (
                                        <View style={styles.buttonRow}>
                                            {alert.buttons.map((btn, index) => {
                                                const isCancel = btn.style === 'cancel' || btn.text?.toLowerCase() === 'cancel';
                                                const isRecharge = btn.text?.toLowerCase().includes('recharge');
                                                
                                                return (
                                                    <TouchableOpacity
                                                        key={index}
                                                        style={styles.actionButton}
                                                        onPress={() => {
                                                            hideAlert();
                                                            setTimeout(() => {
                                                                if (btn.onPress) {
                                                                    btn.onPress();
                                                                } else if (isRecharge) {
                                                                    navigate('Recharge');
                                                                }
                                                            }, 200);
                                                        }}
                                                        activeOpacity={0.8}
                                                    >
                                                        {isCancel ? (
                                                            <View style={styles.cancelBtnInner}>
                                                                <Text style={styles.cancelBtnText}>{btn.text || 'Cancel'}</Text>
                                                            </View>
                                                        ) : (
                                                            <LinearGradient
                                                                colors={['#ff2a85', '#a855f7', '#3b82f6']}
                                                                style={styles.confirmBtnInner}
                                                                start={{ x: 0, y: 0 }}
                                                                end={{ x: 1, y: 0 }}
                                                            >
                                                                {isRecharge && <Image source={require('../assets/icons/diamond.png')} style={styles.btnDiamondIcon} resizeMode="contain" />}
                                                                <Text style={styles.confirmBtnText}>{btn.text || 'OK'}</Text>
                                                            </LinearGradient>
                                                        )}
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    ) : (
                                        <TouchableOpacity
                                            style={styles.singleButton}
                                            onPress={hideAlert}
                                            activeOpacity={0.8}
                                        >
                                            <LinearGradient
                                                colors={
                                                    isDiamondAlert
                                                        ? ['#ff2a85', '#a855f7', '#3b82f6']
                                                        : alert.type === 'error'
                                                        ? ['#ff4d4d', '#f43f5e']
                                                        : ['#10b981', '#059669']
                                                }
                                                style={styles.confirmBtnInner}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                            >
                                                <Text style={styles.confirmBtnText}>OK</Text>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    )}
                                </LinearGradient>
                            );
                        })()}
                    </Animated.View>
                </View>
            </Modal>
        </UIContext.Provider>
    );
};

export const useUI = () => useContext(UIContext);

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(5, 2, 16, 0.82)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    alertContainer: {
        width: width * 0.86,
        borderRadius: 24,
        overflow: 'hidden',
        elevation: 25,
        shadowColor: '#a855f7',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
    },
    gradient: {
        paddingVertical: 26,
        paddingHorizontal: 22,
        alignItems: 'center',
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.12)',
    },
    diamondBorder: {
        borderColor: 'rgba(255, 42, 133, 0.5)',
    },
    iconWrapper: {
        marginBottom: 14,
    },
    iconGlowBadge: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 12,
        shadowColor: '#ff2a85',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.6,
        shadowRadius: 12,
    },
    diamondImage: {
        width: 42,
        height: 42,
    },
    diamondTagContainer: {
        marginBottom: 12,
    },
    diamondTag: {
        paddingHorizontal: 14,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 42, 133, 0.4)',
    },
    diamondTagText: {
        color: '#ff69b4',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: 0.3,
    },
    message: {
        fontSize: 14,
        color: '#cbd5e1',
        textAlign: 'center',
        lineHeight: 21,
        marginBottom: 22,
    },
    buttonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        gap: 10,
    },
    actionButton: {
        flex: 1,
    },
    singleButton: {
        width: '100%',
    },
    cancelBtnInner: {
        paddingVertical: 13,
        borderRadius: 16,
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
    confirmBtnInner: {
        paddingVertical: 13,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 8,
        shadowColor: '#ff2a85',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
    },
    confirmBtnText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    btnDiamondIcon: {
        width: 18,
        height: 18,
        marginRight: 6,
    },
});

