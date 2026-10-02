import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator,
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
            if (route.params?.onVerify) {
                route.params.onVerify(upiId);
            }
            navigation.goBack();
        } else {
            AlertService.show("Error", "Please verify a valid UPI ID before saving.", "error");
        }
    };

    return (
        <ScreenBackgroundView style={[{ flex: 1, backgroundColor: '#F8FAFC' }]}>
            <ScreenBackgroundStatusBar translucent backgroundColor="transparent" barStyle="dark-content" animated />
            <ScreenBackgroundGradient colors={['#F8FAFC', '#F1F5F9', '#E2E8F0']} style={ScreenBackgroundStyleSheet.absoluteFillObject} />
            <View style={[styles.header, { paddingTop: topSafeInset + 8 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-back" size={26} color="#1E293B" />
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
                        placeholderTextColor="#94A3B8"
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
                            color={verificationResult.success ? "#10B981" : "#EF4444"}
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0'
    },
    backButton: {
        padding: 4,
    },
    headerTitle: { color: '#0F172A', fontSize: 18, fontWeight: 'bold' },
    content: { padding: 20 },
    label: { color: '#475569', fontSize: 14, fontWeight: '600', marginBottom: 10 },
    inputContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        overflow: 'hidden',
        marginBottom: 20,
        elevation: 1,
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowRadius: 4,
    },
    input: {
        flex: 1,
        color: '#0F172A',
        paddingHorizontal: 15,
        height: 50,
        fontSize: 14,
    },
    verifyBtn: {
        backgroundColor: '#6366F1',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    verifyBtnText: { color: '#FFFFFF', fontWeight: 'bold' },
    resultCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
    },
    successCard: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
    errorCard: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
    resultTextContainer: { marginLeft: 10 },
    resultText: { fontSize: 14, fontWeight: 'bold' },
    successText: { color: '#15803D' },
    errorText: { color: '#DC2626' },
    resultName: { color: '#0F172A', fontSize: 18, fontWeight: '700', marginTop: 4 },
    saveBtn: {
        backgroundColor: '#6366F1',
        borderRadius: 12,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#6366F1',
        shadowOpacity: 0.2,
        shadowRadius: 6,
    },
    saveBtnDisabled: {
        backgroundColor: '#CBD5E1',
        elevation: 0,
        shadowOpacity: 0,
    },
    saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});

export default UPIVerify;
