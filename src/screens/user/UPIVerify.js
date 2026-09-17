import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet,  ActivityIndicator, Alert,
  View as ScreenBackgroundView,
  StatusBar as ScreenBackgroundStatusBar,
  StyleSheet as ScreenBackgroundStyleSheet
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ScreenBackgroundGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { apiUtil } from '../../utils/apiUtil';
import { AlertService } from '../../utils/AlertService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';

const UPIVerify = ({ route }) => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const topSafeInset = getAppTopSafeInset(insets.top);
    const bottomPadding = getStackScreenBottomPadding(insets.bottom, 40);
    const { t } = useTranslation();
    const [upiId, setUpiId] = useState(route.params?.initialUpi || '');
    const [loading, setLoading] = useState(false);
    const [verificationResult, setVerificationResult] = useState(null);

    const handleVerify = async () => {
        if (!upiId) return;

        setLoading(true);
        setVerificationResult(null);

        try {
            const res = await apiUtil.post('/upi/verify', { upiId });
            if (res.data.success) {
                setVerificationResult({
                    success: true,
                    name: res.data.data?.name || 'Verified User',
                    message: res.data.message || 'UPI Validated'
                });
            } else {
                setVerificationResult({ success: false, message: res.data.message || 'Verification Failed' });
            }
        } catch (error) {
            setVerificationResult({
                success: false,
                message: error.response?.data?.message || 'Error verifying UPI'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = () => {
        if (verificationResult?.success) {
            // Navigate back and pass the verified UPI
            if (route.params?.onVerify) {
                route.params.onVerify(upiId);
            }
            navigation.goBack();
        } else {
            AlertService.show("Error", "Please verify a valid UPI ID before saving.", "error");
        }
    };

    return (
        <ScreenBackgroundView style={[{ flex: 1, backgroundColor: '#08031a' }]}>
          <ScreenBackgroundStatusBar translucent backgroundColor="transparent" barStyle="light-content" animated />
          <ScreenBackgroundGradient colors={['#08031a', '#050212', '#020108']} style={ScreenBackgroundStyleSheet.absoluteFillObject} />
                <View style={[styles.header, { paddingTop: topSafeInset + 8 }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Icon name="arrow-back" size={28} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('upi.verify_title') || 'Verify UPI ID'}</Text>
                    <View style={{ width: 28 }} />
                </View>

                <View style={[styles.content, { paddingBottom: bottomPadding }]}>
                    <Text style={styles.label}>{t('upi.enter_vpa') || 'Virtual Payment Address (VPA)'}</Text>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. yourname@upi"
                            placeholderTextColor="#ccc"
                            value={upiId}
                            onChangeText={(text) => {
                                setUpiId(text);
                                setVerificationResult(null);
                            }}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <TouchableOpacity style={styles.verifyBtn} onPress={handleVerify} disabled={loading || !upiId}>
                            {loading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.verifyBtnText}>{t('upi.verify') || 'Verify'}</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {verificationResult && (
                        <View style={[styles.resultCard, verificationResult.success ? styles.successCard : styles.errorCard]}>
                            <Icon
                                name={verificationResult.success ? "checkmark-circle" : "close-circle"}
                                size={24}
                                color={verificationResult.success ? "#4ade80" : "#ef4444"}
                            />
                            <View style={styles.resultTextContainer}>
                                <Text style={[styles.resultText, verificationResult.success ? styles.successText : styles.errorText]}>
                                    {verificationResult.message}
                                </Text>
                                {verificationResult.success && verificationResult.name && (
                                    <Text style={styles.resultName}>{verificationResult.name}</Text>
                                )}
                            </View>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.saveBtn, !verificationResult?.success && styles.saveBtnDisabled]}
                        onPress={handleSave}
                        disabled={!verificationResult?.success}
                    >
                        <Text style={styles.saveBtnText}>{t('upi.save') || 'Save and Continue'}</Text>
                    </TouchableOpacity>
                </View>
        </ScreenBackgroundView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    gradient: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)'
    },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    content: { padding: 20 },
    label: { color: '#fff', fontSize: 14, marginBottom: 10 },
    inputContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        overflow: 'hidden',
        marginBottom: 20,
        zIndex: 5,
        elevation: 5,
    },
    input: {
        flex: 1,
        color: '#fff',
        paddingHorizontal: 15,
        height: 50,
        zIndex: 6,
    },
    verifyBtn: {
        backgroundColor: '#0ea5e9',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        zIndex: 10,
    },
    verifyBtnText: { color: '#fff', fontWeight: 'bold' },
    resultCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
        borderWidth: 1,
    },
    successCard: { backgroundColor: 'rgba(74, 222, 128, 0.1)', borderColor: '#4ade80' },
    errorCard: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444' },
    resultTextContainer: { marginLeft: 10 },
    resultText: { fontSize: 14, fontWeight: 'bold' },
    successText: { color: '#4ade80' },
    errorText: { color: '#ef4444' },
    resultName: { color: '#fff', fontSize: 18, marginTop: 4 },
    saveBtn: {
        backgroundColor: '#8b5cf6',
        borderRadius: 10,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveBtnDisabled: {
        backgroundColor: '#6b7280',
    },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default UPIVerify;
