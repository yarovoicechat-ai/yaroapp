import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, { EventType } from '@notifee/react-native';
import { AppState, PermissionsAndroid, Platform } from 'react-native';
import { apiUtil } from './apiUtil';
import { navigate, navigationRef } from './navigationRef';
import {
    getCallParams,
    handleCallNotificationEvent,
    showIncomingCallNotification,
} from './CallNotificationService';
import { handleMessageNotificationEvent } from './MessageNotificationService';
import { getSocket } from '../sockets';
import {
    applyTerminalCallState,
    canOpenIncomingCall,
    clearStoredCallState,
} from './callLifecycle';

export const requestUserPermission = async () => {
    try {
        if (Platform.OS === 'android' && Platform.Version >= 33) {
            try {
                await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
            } catch (permErr) {
                console.log('Android POST_NOTIFICATIONS request deferred:', permErr.message);
            }
        }

        const authStatus = await messaging().requestPermission();
        const enabled =
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) await syncFCMToken();
    } catch (error) {
        console.log('Notification permission notice:', error.message);
    }
};

export const syncFCMToken = async () => {
    try {
        const fcmToken = await messaging().getToken();
        if (!fcmToken) return;

        await AsyncStorage.setItem('fcmToken', fcmToken);
        const accessToken = await AsyncStorage.getItem('accessToken');
        if (accessToken) await apiUtil.post('/user/save-fcm', { fcmToken });
    } catch (error) {
        console.log('FCM token sync deferred:', error.response?.data || error.message);
    }
};

const navigationRetryTimers = new Map();

const closeIncomingIfMatching = transactionId => {
    if (!transactionId || !navigationRef.isReady()) return;
    const currentRoute = navigationRef.getCurrentRoute();
    if (
        currentRoute?.name === 'Incomming' &&
        String(currentRoute?.params?.transactionId || '') === String(transactionId) &&
        navigationRef.getRootState()?.routeNames?.includes('MainTabs')
    ) {
        navigationRef.resetRoot({ index: 0, routes: [{ name: 'MainTabs' }] });
        console.log(`[NAVIGATION] INCOMING_CLOSED tx=${transactionId}`);
    }
};

const applyTerminalAndClose = async data => {
    await applyTerminalCallState(data);
    closeIncomingIfMatching(data?.transactionId || data?.callId);
};

const navigateWithRetry = (screen, params, options = {}) => {
    const { resetRoot = false, onNavigated, key = screen } = options;
    const existingTimer = navigationRetryTimers.get(key);
    if (existingTimer) clearInterval(existingTimer);

    let retries = 0;
    const timer = setInterval(() => {
        const rootState = navigationRef.isReady() ? navigationRef.getRootState() : null;
        const routeIsRegistered = rootState?.routeNames?.includes(screen);
        if (routeIsRegistered) {
            clearInterval(timer);
            navigationRetryTimers.delete(key);
            if (resetRoot) {
                if (screen === 'OnGoing' || screen === 'Incomming') {
                    navigationRef.resetRoot({
                        index: 1,
                        routes: [{ name: 'MainTabs' }, { name: screen, params }],
                    });
                } else {
                    navigationRef.resetRoot({ index: 0, routes: [{ name: screen, params }] });
                }
            } else {
                navigate(screen, params);
            }
            onNavigated?.();
        } else if (++retries > 600) {
            clearInterval(timer);
            navigationRetryTimers.delete(key);
        }
    }, 100);
    navigationRetryTimers.set(key, timer);
};

const handleAcceptedCallNavigation = data => {
    const params = getCallParams(data);
    if (!params.transactionId) return;

    const currentRoute = navigationRef.isReady() ? navigationRef.getCurrentRoute() : null;
    const alreadyOnThisCall =
        currentRoute?.name === 'OnGoing' &&
        String(currentRoute?.params?.transactionId) === String(params.transactionId);
    if (alreadyOnThisCall) {
        clearStoredCallState(params.transactionId)
            .catch(error => console.error('Accepted call cleanup failed:', error.message));
        return;
    }

    navigateWithRetry('OnGoing', params, {
        resetRoot: true,
        key: `call-${params.transactionId}`,
        onNavigated: () => {
            clearStoredCallState(params.transactionId)
                .catch(error => console.error('Accepted call cleanup failed:', error.message));
        },
    });
};

const handleNotificationNavigation = async remoteMessage => {
    if (remoteMessage?.data?.type === 'call') {
        const params = getCallParams(remoteMessage.data);
        if (!params.transactionId) return;

        const acceptingStr = await AsyncStorage.getItem('acceptingCall');
        if (acceptingStr) {
            const accepting = JSON.parse(acceptingStr);
            const isSameCall = String(accepting.transactionId) === String(params.transactionId);
            const isFresh = Date.now() - Number(accepting.startedAt || 0) < 15000;
            if (isSameCall && isFresh) {
                setTimeout(() => handleNotificationNavigation(remoteMessage), 200);
                return;
            }
            if (!isFresh) await AsyncStorage.removeItem('acceptingCall');
        }

        const acceptedStr = await AsyncStorage.getItem('acceptedCall');
        if (acceptedStr) {
            const acceptedCall = JSON.parse(acceptedStr);
            const acceptedParams = getCallParams(acceptedCall);
            if (String(acceptedParams.transactionId) === String(params.transactionId)) {
                handleAcceptedCallNavigation(acceptedCall);
                return;
            }
        }

        let liveParams = params;
        try {
            const response = await apiUtil.get(`/call/status/${params.transactionId}`);
            const statusData = response.data?.data || {};
            const status = String(statusData.status || '').toLowerCase();
            const resolvedParams = { ...params, ...statusData, agora: statusData.agora || params.agora };
            if (['accepted', 'connecting', 'connected'].includes(status)) {
                handleAcceptedCallNavigation(resolvedParams);
                return;
            }
            if (!['initiated', 'ringing'].includes(status)) {
                await applyTerminalAndClose({
                    transactionId: params.transactionId,
                    state: status || 'ended',
                    eventAt: Date.now(),
                });
                return;
            }
            liveParams = resolvedParams;
        } catch (error) {
            console.log('Incoming call status validation failed:', error.response?.status || error.message);
            return;
        }

        if (!await canOpenIncomingCall(liveParams)) return;
        const currentRoute = navigationRef.isReady() ? navigationRef.getCurrentRoute() : null;
        if (
            ['Incomming', 'OnGoing'].includes(currentRoute?.name) &&
            String(currentRoute?.params?.transactionId || '') === String(liveParams.transactionId)
        ) return;

        navigateWithRetry('Incomming', liveParams, {
            resetRoot: true,
            key: `call-${liveParams.transactionId}`,
            onNavigated: () => {
                clearStoredCallState(liveParams.transactionId, ['pendingCall'])
                    .catch(error => console.error('Pending call cleanup failed:', error.message));
            },
        });
    } else if (remoteMessage?.data?.type === 'message') {
        navigateWithRetry('Chat', {
            conversationId: remoteMessage.data.conversationId,
            otherUser: {
                _id: remoteMessage.data.senderId,
                name: remoteMessage.data.senderName || 'User',
                image: remoteMessage.data.senderImage || '',
            },
        });
    } else if (remoteMessage?.data?.action === 'open_face_verification') {
        navigateWithRetry('FaceVerification');
    } else if (remoteMessage?.data?.action === 'open_kyc_verification') {
        navigateWithRetry('Kyc');
    } else if (remoteMessage?.data?.type === 'missed_call' || remoteMessage?.data?.action === 'open_activity') {
        navigateWithRetry('Notifications');
    } else if (remoteMessage?.data?.action === 'login_redirect') {
        navigateWithRetry('SignIn');
    }
};

const checkPendingCallPayload = async (attempt = 0) => {
    try {
        const acceptedStr = await AsyncStorage.getItem('acceptedCall');
        if (acceptedStr) {
            handleAcceptedCallNavigation(JSON.parse(acceptedStr));
            return;
        }

        const pendingStr = await AsyncStorage.getItem('pendingCall');
        if (pendingStr) {
            handleNotificationNavigation({ data: JSON.parse(pendingStr) });
            return;
        }

        // Accept can launch the Activity while its headless API request is
        // still finishing, so briefly wait for the accepted payload.
        if (attempt < 75) {
            setTimeout(() => checkPendingCallPayload(attempt + 1), 200);
        }
    } catch (error) {
        console.error('Pending call restore failed:', error);
    }
};

const checkPendingMessagePayload = async () => {
    const pending = await AsyncStorage.getItem('pendingMessage');
    if (!pending) return;
    await AsyncStorage.removeItem('pendingMessage');
    await handleNotificationNavigation({ data: JSON.parse(pending) });
};

export const NotificationListen = () => {
    const appStateSubscription = AppState.addEventListener('change', nextState => {
        if (nextState === 'active') checkPendingCallPayload();
    });
    const unsubscribeTokenRefresh = messaging().onTokenRefresh(async fcmToken => {
        await AsyncStorage.setItem('fcmToken', fcmToken);
        const accessToken = await AsyncStorage.getItem('accessToken');
        if (accessToken) {
            await apiUtil.post('/user/save-fcm', { fcmToken })
                .catch(error => console.log('Token refresh sync failed:', error.message));
        }
    });

    // FCM remains active even when Home.js and its socket listener are not mounted.
    const unsubscribeMessage = messaging().onMessage(async remoteMessage => {
        if (remoteMessage.data?.type === 'call_state') {
            await applyTerminalAndClose(remoteMessage.data);
        } else if (remoteMessage.data?.type === 'call') {
            // The connected socket is the single foreground call source.
            if (getSocket()?.connected) return;
            await showIncomingCallNotification(remoteMessage.data);
            await handleNotificationNavigation(remoteMessage);
        }
    });

    const unsubscribeOpened = messaging().onNotificationOpenedApp(message => {
        handleNotificationNavigation(message).catch(error =>
            console.error('Notification navigation failed:', error.message));
    });

    const unsubscribeNotifee = notifee.onForegroundEvent(async event => {
        try {
            if (event.detail?.notification?.data?.type === 'message') {
                const messageResult = await handleMessageNotificationEvent(event);
                if (messageResult?.action === 'open') {
                    await AsyncStorage.removeItem('pendingMessage');
                    await handleNotificationNavigation({ data: messageResult.data });
                }
                return;
            }
            const result = await handleCallNotificationEvent(event);
            if (result?.action === 'accept') {
                handleAcceptedCallNavigation(result.data);
            } else if (result?.action === 'open') {
                await handleNotificationNavigation({ data: result.data });
            }
        } catch (error) {
            console.error('Call notification action failed:', error.response?.data || error.message);
        }
    });

    messaging().getInitialNotification().then(remoteMessage => {
        if (remoteMessage) {
            handleNotificationNavigation(remoteMessage).catch(error =>
                console.error('Initial notification navigation failed:', error.message));
        }
    });
    notifee.getInitialNotification().then(async initial => {
        if (!initial) return;
        const data = initial.notification?.data;
        if (data?.type === 'message') {
            const result = await handleMessageNotificationEvent({
                type: EventType.PRESS,
                detail: initial,
            });
            if (result?.action === 'open') {
                await AsyncStorage.removeItem('pendingMessage');
                await handleNotificationNavigation({ data: result.data });
            }
        } else if (data?.type === 'call') {
            const pressActionId = initial.pressAction?.id;
            const result = await handleCallNotificationEvent({
                type: pressActionId ? EventType.ACTION_PRESS : EventType.PRESS,
                detail: initial,
            });
            if (result?.action === 'accept') {
                handleAcceptedCallNavigation(result.data);
            } else if (result?.action === 'open') {
                await handleNotificationNavigation({ data: result.data });
            }
        }
    }).catch(error => console.error('Initial local notification failed:', error.message));
    checkPendingCallPayload();
    checkPendingMessagePayload().catch(error =>
        console.error('Pending message restore failed:', error.message));

    return () => {
        appStateSubscription.remove();
        unsubscribeTokenRefresh?.();
        unsubscribeMessage?.();
        unsubscribeOpened?.();
        unsubscribeNotifee?.();
    };
};
