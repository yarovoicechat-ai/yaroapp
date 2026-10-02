import React, { useCallback, useEffect, useState, useContext, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions, Platform, ActivityIndicator,
  View as ScreenBackgroundView,
  StatusBar as ScreenBackgroundStatusBar,
  StyleSheet as ScreenBackgroundStyleSheet
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { apiUtil } from '../../utils/apiUtil';
import { getSocket } from '../../sockets';
import { AuthContext } from '../../context/AuthProvider';
import { AlertService } from '../../utils/AlertService';
import { CALL_DIAMONDS_PER_MINUTE, hasCallStartIdentity } from '../../utils/callValidation';

const { width, height } = Dimensions.get('window');

const Notifications = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const topSafeInset = getAppTopSafeInset(insets.top);
    const bottomPadding = getStackScreenBottomPadding(insets.bottom, 40);
    const { user } = useContext(AuthContext);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const { t } = useTranslation();
    const callbackInFlightRef = useRef(false);

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await apiUtil.get('/notifications');
            if (res.data?.success && res.data?.data) {
                const list = Array.isArray(res.data.data.notifications)
                    ? res.data.data.notifications
                    : Array.isArray(res.data.data)
                    ? res.data.data
                    : [];

                const formattedData = list.map((item, idx) => ({
                    id: String(item?._id || item?.id || idx),
                    title: item?.title || 'Notification',
                    body: item?.message || item?.body || '',
                    date: item?.createdAt ? dayjs(item.createdAt).format('DD/MM/YYYY, hh:mm A') : '',
                    type: item?.type || 'system',
                    data: item?.data || {},
                    isRead: Boolean(item?.isRead),
                }));
                setMessages(formattedData);

                const unreadCount = Number(res.data.data.unreadCount || 0);
                if (unreadCount > 0) {
                    apiUtil.patch('/notifications/read-all').catch(err => {
                        console.log('Read all patch notice:', err?.message);
                    });
                    setMessages(current => current.map(item => ({ ...item, isRead: true })));
                }
            } else {
                setMessages([]);
            }
        } catch (error) {
            console.log("Fetch Notifications Error:", error.response?.data || error.message);
            setMessages([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            fetchNotifications();
        }, [fetchNotifications])
    );

    useEffect(() => {
        const socket = getSocket();
        const refresh = () => fetchNotifications();
        socket?.on('notification:new', refresh);
        return () => socket?.off('notification:new', refresh);
    }, [fetchNotifications]);

    const callBack = async item => {
        if (callbackInFlightRef.current) return;
        const userDiamonds = Number(user?.diamonds || 0);
        console.log('[CALL] START REQUEST | DIAMONDS:', userDiamonds);

        const showInsufficientDiamondsAlert = () => {
            AlertService.show(
                'Insufficient Diamonds',
                'Your Diamond balance is too low to start this call. Please recharge your Diamonds to continue.',
                'error',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Recharge Now', onPress: () => navigation.navigate('Recharge') },
                ]
            );
        };

        if (userDiamonds < CALL_DIAMONDS_PER_MINUTE) {
            console.log('[CALL] INSUFFICIENT DIAMONDS | REJECTED ON FRONTEND');
            showInsufficientDiamondsAlert();
            return;
        }

        console.log('[CALL] BALANCE OK');
        try {
            callbackInFlightRef.current = true;
            const response = await apiUtil.post('/call/start', { hostId: item.data?.targetUserId });
            if (!response.data?.success || !hasCallStartIdentity(response.data?.data)) {
                const msg = response.data?.message || 'Failed to start call.';
                const errCode = response.data?.data?.code || response.data?.data?.errorCode;
                if (errCode === 'INSUFFICIENT_DIAMONDS' || msg.includes('INSUFFICIENT_DIAMONDS') || msg.toLowerCase().includes('diamond')) {
                    showInsufficientDiamondsAlert();
                } else {
                    AlertService.show('Call unavailable', msg, 'error');
                }
                return;
            }
            navigation.navigate('OutGoing', {
                ...response.data.data,
                name: item.data?.targetName || 'User',
                image: item.data?.targetImage,
                isCaller: true,
            });
        } catch (error) {
            const msg = error.response?.data?.message || error.message || 'Callback unavailable';
            const errCode = error.response?.data?.data?.code || error.response?.data?.data?.errorCode;
            if (errCode === 'INSUFFICIENT_DIAMONDS' || msg.includes('INSUFFICIENT_DIAMONDS') || msg.toLowerCase().includes('diamond')) {
                showInsufficientDiamondsAlert();
            } else {
                AlertService.show('Call unavailable', msg, 'error');
            }
        } finally {
            callbackInFlightRef.current = false;
        }
    };

    const renderItem = ({ item }) => (
        <View style={[styles.messageCard, !item.isRead && styles.unreadCard]}>
            <LinearGradient
                colors={['rgba(217, 70, 239, 0.3)', 'rgba(14, 165, 233, 0.3)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardBorderOverlay}
            />
            <View style={styles.cardInner}>
                <LinearGradient
                    colors={item.type === 'promo' ? ['#ff3366', '#d946ef'] : ['#03dcfe', '#2911fe']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.iconContainer}
                >
                    <Icon
                        name={item.type === 'call' ? 'phone-missed' : item.type === 'promo' ? 'card-giftcard' : item.type === 'event' ? 'celebration' : 'notifications'}
                        size={20}
                        color="#fff"
                    />
                </LinearGradient>
                <View style={styles.messageContent}>
                    <View style={styles.headerRow}>
                        <Text style={styles.title}>{item.title}</Text>
                        <Text style={styles.date}>{item.date}</Text>
                    </View>
                    <Text style={styles.body}>{item.body}</Text>
                    {item.type === 'event' ? (
                        <View style={styles.eventMeta}>
                            {Number(item.data?.rewardCoins || 0) > 0 ? (
                                <View style={styles.rewardPill}>
                                    <Icon name="monetization-on" size={14} color="#facc15" />
                                    <Text style={styles.rewardText}>{Number(item.data.rewardCoins).toLocaleString()} coins</Text>
                                </View>
                            ) : null}
                            {item.data?.startAt ? (
                                <Text style={styles.eventDate}>Starts: {dayjs(item.data.startAt).format('DD MMM, hh:mm A')}</Text>
                            ) : null}
                        </View>
                    ) : null}
                    {item.type === 'call' && item.data?.targetUserId ? (
                        <TouchableOpacity style={styles.callbackButton} onPress={() => callBack(item)}>
                            <Icon name="call" size={16} color="#fff" />
                            <Text style={styles.callbackText}>Call again</Text>
                        </TouchableOpacity>
                    ) : null}
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
                <Text style={styles.headerTitle}>Activity</Text>
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
                    keyExtractor={(item, index) => String(item?.id || item?._id || index)}
                    contentContainerStyle={[styles.listContent, { paddingBottom: bottomPadding }]}
                    ListEmptyComponent={
                        <View style={styles.centerContainer}>
                            <View style={styles.emptyIllustrationWrapper}>
                                <View style={styles.glowBg} />
                                <View style={styles.bellOverlayContainer}>
                                    <Icon name="notifications" size={100} color="rgba(37, 99, 235, 0.75)" style={styles.bellIcon} />
                                    <View style={styles.bubbleGlow}>
                                        <Icon name="chat" size={38} color="#03dcfe" />
                                        <View style={styles.bubbleDotsRow}>
                                            <View style={styles.bubbleDot} />
                                            <View style={styles.bubbleDot} />
                                            <View style={styles.bubbleDot} />
                                        </View>
                                    </View>
                                </View>
                                <Icon name="close" size={12} color="#03dcfe" style={styles.cross1} />
                                <Icon name="star" size={14} color="#ff3366" style={styles.sparkle1} />
                                <Icon name="star" size={10} color="#a855f7" style={styles.sparkle2} />
                                <View style={styles.circleOutline} />
                            </View>
                            <Text style={styles.emptyText}>{t('notifications.empty') || 'No notifications yet'}</Text>
                            <Text style={styles.emptySubText}>
                                {t('notifications.empty_subtitle') || "You're all caught up! We'll notify you\nwhen something new arrives."}
                            </Text>
                            
                            {/* Star Divider Line */}
                            <View style={styles.dividerStarContainer}>
                                <View style={styles.dividerLine} />
                                <Icon name="star" size={10} color="#a855f7" style={{ marginHorizontal: 8 }} />
                                <View style={styles.dividerLine} />
                            </View>
                        </View>
                    }
                />
            )}
        </ScreenBackgroundView>
    );
};

const styles = StyleSheet.create({
    eventMeta: { marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
    rewardPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 12, backgroundColor: 'rgba(250,204,21,0.12)', borderWidth: 1, borderColor: 'rgba(250,204,21,0.3)' },
    rewardText: { color: '#fde047', fontWeight: '700', fontSize: 11 },
    eventDate: { color: '#67e8f9', fontSize: 11, fontWeight: '600' },    callbackButton: {
        alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center',
        marginTop: 10, paddingHorizontal: 12, paddingVertical: 7,
        borderRadius: 16, backgroundColor: '#2563eb',
    },
    callbackText: { color: '#fff', fontWeight: '700', fontSize: 12, marginLeft: 6 },
    // Decorative space elements
    starOverlay1: {
        position: 'absolute',
        top: height * 0.15,
        left: width * 0.1,
        width: 2,
        height: 2,
        borderRadius: 1,
        backgroundColor: '#fff',
        opacity: 0.8,
    },
    starOverlay2: {
        position: 'absolute',
        top: height * 0.3,
        right: width * 0.15,
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: '#ff3366',
        opacity: 0.5,
    },
    planetWrapper: {
        position: 'absolute',
        bottom: -height * 0.15,
        right: -width * 0.15,
        width: width * 0.65,
        height: width * 0.65,
        borderRadius: (width * 0.65) / 2,
        overflow: 'hidden',
    },
    planetGlow: {
        flex: 1,
        borderRadius: (width * 0.65) / 2,
    },
    gridWrapper: {
        position: 'absolute',
        bottom: height * 0.05,
        left: -width * 0.1,
        width: width * 0.5,
        height: height * 0.2,
        opacity: 0.15,
    },
    gridLine1: {
        position: 'absolute',
        width: '100%',
        height: 1.5,
        backgroundColor: '#ff3366',
        transform: [{ rotate: '30deg' }],
    },
    gridLine2: {
        position: 'absolute',
        width: '100%',
        height: 1.5,
        backgroundColor: '#ff3366',
        top: 30,
        transform: [{ rotate: '30deg' }],
    },

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
        textAlign: 'center',
        flex: 1,
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
    unreadCard: {
        borderColor: '#6366F1',
        borderWidth: 1.5,
    },
    cardBorderOverlay: {
        display: 'none',
    },
    cardInner: {
        backgroundColor: '#FFFFFF',
        borderRadius: 19,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
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
        fontSize: 15,
        fontWeight: 'bold',
    },
    date: {
        color: '#94A3B8',
        fontSize: 11,
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
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(99, 102, 241, 0.08)',
    },
    bellOverlayContainer: {
        position: 'relative',
        width: 100,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bellIcon: {
        position: 'absolute',
        zIndex: 1,
        color: '#CBD5E1',
    },
    bubbleGlow: {
        position: 'absolute',
        right: -10,
        top: 20,
        zIndex: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bubbleDotsRow: {
        position: 'absolute',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2.5,
        top: 12,
        zIndex: 3,
    },
    bubbleDot: {
        width: 3.5,
        height: 3.5,
        borderRadius: 1.75,
        backgroundColor: '#fff',
    },
    cross1: {
        position: 'absolute',
        top: 25,
        left: 20,
        opacity: 0.6,
    },
    sparkle1: {
        position: 'absolute',
        top: 30,
        right: 25,
        opacity: 0.7,
    },
    sparkle2: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        opacity: 0.6,
    },
    circleOutline: {
        position: 'absolute',
        bottom: 45,
        left: 15,
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: 1.5,
        borderColor: '#C7D2FE',
    },

    // Star Divider Line
    dividerStarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        justifyContent: 'center',
        marginTop: 20,
    },
    dividerLine: {
        width: 30,
        height: 1.2,
        backgroundColor: '#E2E8F0',
    },
});

export default Notifications;
