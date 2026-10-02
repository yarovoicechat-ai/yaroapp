import React, { useContext, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Dimensions, StatusBar
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { AuthContext } from '../../context/AuthProvider';
import { apiUtil } from '../../utils/apiUtil';
import { useTranslation } from 'react-i18next';
import { AlertService } from '../../utils/AlertService';
import { signInWithGoogleProvider } from '../../configs/googleSignIn';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset } from '../../utils/safeAreaUtils';

const { width } = Dimensions.get('window');

const LinkAccount = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const topSafeInset = getAppTopSafeInset(insets.top);
    const { user, fetchUserProfile } = useContext(AuthContext);
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);

    const handleLinkGoogle = async () => {
        try {
            setLoading(true);
            const googleIdToken = await signInWithGoogleProvider();

            const res = await apiUtil.post('/auth/link-account', { googleIdToken });

            if (res.data?.success) {
                AlertService.show('Success', 'Google Account linked successfully.', 'success');
                fetchUserProfile();
            } else {
                AlertService.show('Error', res.data?.message || 'Failed to link Google.', 'error');
            }
        } catch (error) {
            console.error('Google linking error:', error);
            AlertService.show('Error', error.message || 'Google linking failed or was cancelled.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const navigateToPhoneLink = () => {
        navigation.navigate('MobileVerify');
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />
            {/* Header */}
            <View style={[styles.header, { paddingTop: topSafeInset + 8 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('profile.link_account') || 'Link Account'}</Text>
                <View style={styles.placeholder} />
            </View>

            <View style={styles.content}>
                {loading ? (
                    <ActivityIndicator size="large" color="#6366F1" />
                ) : (
                    <>
                        {(!user?.googleId) && (
                            <TouchableOpacity onPress={handleLinkGoogle} style={styles.linkButton} activeOpacity={0.8}>
                                <Icon name="logo-google" size={24} color="#db4437" />
                                <Text style={styles.linkText}>Link Google Account</Text>
                            </TouchableOpacity>
                        )}
                        {user?.googleId && (
                            <View style={[styles.linkButton, styles.linkedButton]}>
                                <Icon name="logo-google" size={24} color="#db4437" />
                                <Text style={styles.linkText}>Google Account Linked</Text>
                            </View>
                        )}

                        {(!user?.phoneNumber) && (
                            <TouchableOpacity onPress={navigateToPhoneLink} style={[styles.linkButton, { marginTop: 16 }]} activeOpacity={0.8}>
                                <Icon name="call" size={24} color="#16A34A" />
                                <Text style={styles.linkText}>Link Phone Number</Text>
                            </TouchableOpacity>
                        )}
                        {user?.phoneNumber && (
                            <View style={[styles.linkButton, styles.linkedButton, { marginTop: 16 }]}>
                                <Icon name="call" size={24} color="#16A34A" />
                                <Text style={styles.linkText}>Phone Linked ({user.phoneNumber})</Text>
                            </View>
                        )}
                    </>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 14,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', textAlign: 'center' },
    placeholder: { width: 32 },
    content: { padding: 20, flex: 1, justifyContent: 'center' },
    linkButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 14,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    linkedButton: {
        backgroundColor: '#F1F5F9',
        borderColor: '#CBD5E1',
        opacity: 0.85,
    },
    linkText: {
        marginLeft: 15,
        fontSize: 15,
        fontWeight: '600',
        color: '#0F172A'
    }
});

export default LinkAccount;
