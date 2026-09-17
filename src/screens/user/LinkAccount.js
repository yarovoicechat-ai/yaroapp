import React, { useContext, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Dimensions
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { AuthContext } from '../../context/AuthProvider';
import { apiUtil } from '../../utils/apiUtil';
import { useTranslation } from 'react-i18next';
import { AlertService } from '../../utils/AlertService';
import { signInWithGoogleProvider } from '../../configs/googleSignIn';

const { width } = Dimensions.get('window');

const LinkAccount = ({ navigation }) => {
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
        // We already have PhoneVerify or phoneAuth screens. 
        // Usually it requires sending OTP to phone and returning token.
        // For now we navigate to the existing PhoneLogin/PhoneVerify UI if possible, 
        // but typically we can navigate to a custom "LinkPhone" screen.
        // Let's assume there is a LinkPhone component, or we can just navigate to PhoneVerify.
        navigation.navigate('LinkPhone');
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#17096b', '#17096b', '#083fe4']} style={styles.gradientBackground}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Icon name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('profile.link_account') || 'Link Account'}</Text>
                    <View style={styles.placeholder} />
                </View>

                <View style={styles.content}>
                    {loading ? (
                        <ActivityIndicator size="large" color="#fff" />
                    ) : (
                        <>
                            {(!user?.googleId) && (
                                <TouchableOpacity onPress={handleLinkGoogle} style={styles.linkButton}>
                                    <Icon name="logo-google" size={24} color="#db4437" />
                                    <Text style={styles.linkText}>Link Google Account</Text>
                                </TouchableOpacity>
                            )}
                            {user?.googleId && (
                                <View style={[styles.linkButton, { opacity: 0.6 }]}>
                                    <Icon name="logo-google" size={24} color="#db4437" />
                                    <Text style={styles.linkText}>Google Account Linked</Text>
                                </View>
                            )}

                            {(!user?.phoneNumber) && (
                                <TouchableOpacity onPress={navigateToPhoneLink} style={[styles.linkButton, { marginTop: 20 }]}>
                                    <Icon name="call" size={24} color="#4ade80" />
                                    <Text style={styles.linkText}>Link Phone Number</Text>
                                </TouchableOpacity>
                            )}
                            {user?.phoneNumber && (
                                <View style={[styles.linkButton, { marginTop: 20, opacity: 0.6 }]}>
                                    <Icon name="call" size={24} color="#4ade80" />
                                    <Text style={styles.linkText}>Phone Linked ({user.phoneNumber})</Text>
                                </View>
                            )}
                        </>
                    )}
                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    gradientBackground: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 15,
        paddingBottom: 20,
    },
    backButton: { padding: 8 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
    placeholder: { width: 40 },
    content: { padding: 20, flex: 1, justifyContent: 'center' },
    linkButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },
    linkText: {
        marginLeft: 15,
        fontSize: 16,
        fontWeight: '600',
        color: '#333'
    }
});

export default LinkAccount;
