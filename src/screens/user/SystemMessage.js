import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Dimensions, Platform,
  View as ScreenBackgroundView,
  StatusBar as ScreenBackgroundStatusBar,
  StyleSheet as ScreenBackgroundStyleSheet
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { apiUtil } from '../../utils/apiUtil';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';

const { width, height } = Dimensions.get('window');

const SystemMessage = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const topSafeInset = getAppTopSafeInset(insets.top);
    const bottomPadding = getStackScreenBottomPadding(insets.bottom, 40);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const { t } = useTranslation();

    const fetchSystemMessages = async () => {
        try {
            const res = await apiUtil.get('/system-messages');
            if (res.data.success || res.data.status) {
                const dataArray = res.data.data?.messages || res.data.data || [];
                const formattedData = dataArray.map(item => ({
                    id: item._id,
                    title: item.title,
                    body: item.message || item.body || item.content,
                    date: dayjs(item.createdAt).format('DD/MM/YYYY HH:mm'),
                }));
                setMessages(formattedData);
            }
        } catch (error) {
            console.log("System Messages:", error?.response?.status || error.message);
            setMessages([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSystemMessages();
    }, []);

    const renderItem = ({ item }) => (
        <View style={styles.messageCard}>
            <LinearGradient
                colors={['rgba(217, 70, 239, 0.3)', 'rgba(14, 165, 233, 0.3)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardBorderOverlay}
            />
            <View style={styles.cardInner}>
                <LinearGradient
                    colors={['#ff3366', '#d946ef']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.iconContainer}
                >
                    <Icon name="mail" size={20} color="#fff" />
                </LinearGradient>
                <View style={styles.messageContent}>
                    <View style={styles.headerRow}>
                        <Text style={styles.title}>{item.title || 'System Alert'}</Text>
                        <Text style={styles.date}>{item.date}</Text>
                    </View>
                    <Text style={styles.body}>{item.body}</Text>
                </View>
            </View>
        </View>
    );

    return (
        <ScreenBackgroundView style={[{ flex: 1, backgroundColor: '#F8FAFC' }]}>
          <ScreenBackgroundStatusBar translucent backgroundColor="transparent" barStyle="dark-content" animated />
          <LinearGradient colors={['#F8FAFC', '#F1F5F9', '#E2E8F0']} style={ScreenBackgroundStyleSheet.absoluteFillObject} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: topSafeInset + 8 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="chevron-left" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('system_messages.title') || 'System Messages'}</Text>
                <View style={styles.headerPlaceholder} />
            </View>

            <View style={styles.headerSeparatorContainer}>
                <LinearGradient
                    colors={['#6366F1', '#8B5CF6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.headerTitleLine}
                />
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#6366F1" style={{ marginTop: 40 }} />
                </View>
            ) : (
                <FlatList
                    data={messages}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={[styles.listContent, { paddingBottom: bottomPadding }]}
                    ListEmptyComponent={
                        <View style={styles.centerContainer}>
                            <View style={styles.emptyIllustrationWrapper}>
                                <View style={styles.glowBg} />
                                <Icon name="near-me" size={32} color="rgba(3, 220, 254, 0.4)" style={styles.airplaneOutline} />
                                <View style={styles.iconOverlayContainer}>
                                    <Icon name="mail" size={90} color="rgba(124, 77, 255, 0.65)" style={styles.mailIcon} />
                                    <View style={styles.bubbleGlow}>
                                        <Icon name="chat" size={42} color="#03dcfe" />
                                        <View style={styles.bubbleDotsRow}>
                                            <View style={styles.bubbleDot} />
                                            <View style={styles.bubbleDot} />
                                            <View style={styles.bubbleDot} />
                                        </View>
                                    </View>
                                </View>
                                <Icon name="star" size={14} color="#6366F1" style={styles.sparkle1} />
                                <Icon name="star" size={10} color="#EC4899" style={styles.sparkle2} />
                                <Icon name="star" size={12} color="#F59E0B" style={styles.sparkle3} />
                            </View>
                            <Text style={styles.emptyText}>{t('system_messages.empty') || 'No system messages'}</Text>
                            <Text style={styles.emptySubText}>
                                {t('system_messages.empty_subtitle') || "You're all caught up! We'll notify you\nwhen there's something important."}
                            </Text>
                        </View>
                    }
                />
            )}
        </ScreenBackgroundView>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 8,
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 1,
    },
    headerPlaceholder: {
        width: 36,
    },
    headerTitle: {
        color: '#0F172A',
        fontSize: 20,
        fontWeight: '800',
    },
    headerSeparatorContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    headerTitleLine: {
        width: 60,
        height: 3,
        borderRadius: 1.5,
    },
    listContent: {
        padding: 20,
    },
    messageCard: {
        borderRadius: 20,
        marginBottom: 12,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
    },
    cardBorderOverlay: {
        display: 'none',
    },
    cardInner: {
        backgroundColor: '#FFFFFF',
        borderRadius: 19,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    iconContainer: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    messageContent: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
        alignItems: 'center',
    },
    title: {
        color: '#0F172A',
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
    },
    date: {
        color: '#94A3B8',
        fontSize: 11,
        marginLeft: 10,
    },
    body: {
        color: '#64748B',
        fontSize: 13,
        lineHeight: 18,
    },
    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: height * 0.06,
        paddingHorizontal: 20,
    },
    emptyText: {
        color: '#0F172A',
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 20,
        textAlign: 'center',
    },
    emptySubText: {
        color: '#64748B',
        fontSize: 13,
        lineHeight: 18,
        textAlign: 'center',
        marginTop: 8,
    },

    // Empty Illustration Design
    emptyIllustrationWrapper: {
        width: 200,
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    glowBg: {
        position: 'absolute',
        width: 130,
        height: 130,
        borderRadius: 65,
        backgroundColor: 'rgba(99, 102, 241, 0.08)',
    },
    airplaneOutline: {
        position: 'absolute',
        top: 20,
        left: 10,
        opacity: 0.6,
        transform: [{ rotate: '-15deg' }],
    },
    iconOverlayContainer: {
        position: 'relative',
        width: 100,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mailIcon: {
        position: 'absolute',
        zIndex: 1,
        color: '#CBD5E1',
    },
    bubbleGlow: {
        position: 'absolute',
        right: -12,
        top: 22,
        zIndex: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bubbleDotsRow: {
        position: 'absolute',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        top: 13,
        zIndex: 3,
    },
    bubbleDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#fff',
    },
    sparkle1: {
        position: 'absolute',
        top: 15,
        right: 35,
        opacity: 0.7,
    },
    sparkle2: {
        position: 'absolute',
        bottom: 35,
        left: 25,
        opacity: 0.5,
    },
    sparkle3: {
        position: 'absolute',
        bottom: 25,
        right: 25,
        opacity: 0.6,
    },
});

export default SystemMessage;
