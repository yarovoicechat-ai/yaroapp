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
        <ScreenBackgroundView style={[{ flex: 1, backgroundColor: '#08031a' }]}>
          <ScreenBackgroundStatusBar translucent backgroundColor="transparent" barStyle="light-content" animated />
          <LinearGradient colors={['#08031a', '#050212', '#020108']} style={ScreenBackgroundStyleSheet.absoluteFillObject} />
            {/* Space Background decorative items (matches screenshots) */}
            <View style={styles.starOverlay1} />
            <View style={styles.starOverlay2} />
            <View style={styles.planetWrapper}>
                <LinearGradient
                    colors={['rgba(124, 77, 255, 0.12)', 'rgba(3, 220, 254, 0.25)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.planetGlow}
                />
            </View>
            <View style={styles.gridWrapper}>
                <View style={styles.gridLine1} />
                <View style={styles.gridLine2} />
            </View>

            {/* Header */}
            <View style={[styles.header, { paddingTop: topSafeInset + 8 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="chevron-left" size={22} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('system_messages.title') || 'System Messages'}</Text>
                <View style={styles.headerPlaceholder} />
            </View>

            <View style={styles.headerSeparatorContainer}>
                <LinearGradient
                    colors={['#ff3366', '#03dcfe']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.headerTitleLine}
                />
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#03dcfe" style={{ marginTop: 40 }} />
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
                                <Icon name="star" size={14} color="#03dcfe" style={styles.sparkle1} />
                                <Icon name="star" size={10} color="#ff3366" style={styles.sparkle2} />
                                <Icon name="star" size={12} color="#facc15" style={styles.sparkle3} />
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
        borderWidth: 1.2,
        borderColor: 'rgba(124, 77, 255, 0.4)',
        backgroundColor: 'rgba(124, 77, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerPlaceholder: {
        width: 36,
    },
    headerTitle: {
        color: '#fff',
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
    },
    cardBorderOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 20,
        padding: 1.2,
        pointerEvents: 'none',
    },
    cardInner: {
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
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
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
    },
    date: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 11,
        marginLeft: 10,
    },
    body: {
        color: 'rgba(255,255,255,0.7)',
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
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 20,
        textAlign: 'center',
    },
    emptySubText: {
        color: 'rgba(255, 255, 255, 0.55)',
        fontSize: 13,
        lineHeight: 18,
        textAlign: 'center',
        marginTop: 8,
    },

    // Empty Illustration Design matching screenshot
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
        backgroundColor: 'rgba(124, 77, 255, 0.08)',
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
