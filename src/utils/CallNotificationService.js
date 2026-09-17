import notifee, {
  AndroidCategory,
  AndroidImportance,
  AndroidVisibility,
  EventType,
} from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiUtil } from './apiUtil';
import { getSocket, initSocket } from '../sockets';
import {
  beginIncomingRinging,
  clearStoredCallState,
  clearCallLifecycle,
  getIncomingNotificationId,
  getCallTiming,
  markCallLifecycle,
  stopIncomingCallAlert,
} from './callLifecycle';

const INCOMING_CHANNEL_ID = 'incoming_calls_v5';
const ONGOING_NOTIFICATION_ID = 'ongoing-call';
const acceptRequests = new Map();

const asNotificationData = data => Object.entries(data || {}).reduce((result, [key, value]) => {
  if (value !== undefined && value !== null) {
    result[key] = typeof value === 'string' ? value : JSON.stringify(value);
  }
  return result;
}, {});

export const getCallParams = data => {
  let agora = data?.agora || {};
  if (typeof agora === 'string') {
    try { agora = JSON.parse(agora); } catch (_) { agora = {}; }
  }
  if (data?.agoraString) {
    try { agora = JSON.parse(data.agoraString); } catch (_) { /* use existing agora */ }
  }

  return {
    transactionId: data?.transactionId || data?.callId,
    channelName: data?.channelName,
    name: data?.callerName || data?.name || 'Incoming Call',
    callerImage: data?.callerImage || data?.image,
    image: data?.callerImage || data?.image,
    maxMinutes: Number(data?.maxMinutes || 0),
    createdAt: data?.createdAt,
    ringExpiresAt: data?.ringExpiresAt,
    eventAt: data?.eventAt,
    agora,
    isCaller: false,
    fromNotification: true,
  };
};

const ensureIncomingChannel = () => notifee.createChannel({
  id: INCOMING_CHANNEL_ID,
  name: 'Incoming Calls',
  description: 'Incoming voice calls',
  importance: AndroidImportance.HIGH,
  sound: 'incallmanager_ringtone',
  vibration: true,
  vibrationPattern: [300, 500, 300, 500],
});

export const showIncomingCallNotification = async rawData => {
  const ringing = await beginIncomingRinging(rawData);
  if (!ringing) return false;
  const data = asNotificationData({
    ...rawData,
    type: 'call',
    transactionId: ringing.transactionId,
  });
  const channelId = await ensureIncomingChannel();
  const timeoutAfter = Math.max(1, ringing.ringExpiresAtMs - Date.now());

  try {
    await notifee.displayNotification({
    id: getIncomingNotificationId(ringing.transactionId),
    title: data.callerName || 'Incoming voice call',
    body: 'Incoming voice call  •  Answer to connect',
    data,
    android: {
      channelId,
      category: AndroidCategory.CALL,
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
      ...(data.callerImage ? {
        largeIcon: data.callerImage,
        circularLargeIcon: true,
      } : {}),
      color: '#7C3AED',
      colorized: true,
      lights: ['#A855F7', 500, 500],
      sound: 'incallmanager_ringtone',
      ongoing: true,
      autoCancel: false,
      timeoutAfter,
      loopSound: true,
      onlyAlertOnce: true,
      pressAction: { id: 'open-call', launchActivity: 'default' },
      fullScreenAction: { id: 'open-call', launchActivity: 'default' },
      actions: [
        {
          title: 'Reject',
          pressAction: { id: 'reject-call' },
        },
        {
          title: 'Accept',
          pressAction: { id: 'accept-call', launchActivity: 'default' },
        },
      ],
    },
    });
  } catch (error) {
    await clearCallLifecycle(ringing.transactionId);
    throw error;
  }
  await AsyncStorage.setItem('pendingCall', JSON.stringify({
    ...rawData,
    type: 'call',
    transactionId: ringing.transactionId,
    ringExpiresAt: new Date(ringing.ringExpiresAtMs).toISOString(),
  }));
  console.log(`[NOTIFICATION] SHOW tx=${ringing.transactionId}`);
  console.log(`[RINGTONE] START tx=${ringing.transactionId}`);
  console.log(`[VIBRATION] START tx=${ringing.transactionId}`);
  return true;
};

export const cancelIncomingCallNotification = (transactionId, state, eventAt) =>
  stopIncomingCallAlert(transactionId, state, eventAt);

const readAcceptedCall = async transactionId => {
  const value = await AsyncStorage.getItem('acceptedCall');
  if (!value) return null;
  try {
    const accepted = JSON.parse(value);
    const acceptedId = accepted.transactionId || accepted.callId;
    return String(acceptedId) === String(transactionId) ? accepted : null;
  } catch (_) {
    return null;
  }
};

const waitForAcceptedCall = async (transactionId, timeoutMs = 15000) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const accepted = await readAcceptedCall(transactionId);
    if (accepted) return accepted;
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  return null;
};

const emitCallAction = async (eventName, transactionId) => {
  const activeSocket = getSocket() || await initSocket();
  if (!activeSocket) return false;
  activeSocket.emit(eventName, { transactionId });
  return true;
};

export const handleCallNotificationEvent = async ({ type, detail }) => {
  const actionId = detail?.pressAction?.id;
  const data = detail?.notification?.data || {};
  const transactionId = data.transactionId || data.callId;
  if (!transactionId) return null;

  if (type === EventType.DISMISSED) {
    const { ringExpiresAtMs } = getCallTiming(data);
    const expired = Date.now() >= ringExpiresAtMs;
    await stopIncomingCallAlert(transactionId, expired ? 'expired' : undefined, ringExpiresAtMs);
    if (expired) await clearStoredCallState(transactionId, ['pendingCall']);
    return { action: expired ? 'expired' : 'dismissed', data };
  }

  if (type === EventType.ACTION_PRESS && actionId === 'reject-call') {
    await stopIncomingCallAlert(transactionId, 'rejected');
    try {
      await apiUtil.post('/call/reject', { transactionId });
    } catch (error) {
      const emitted = await emitCallAction('rejectCall', transactionId);
      if (!emitted) console.log('Call reject deferred:', error.response?.status || error.message);
    } finally {
      await clearStoredCallState(transactionId, ['pendingCall']);
    }
    return { action: 'reject', data };
  }

  if (type === EventType.ACTION_PRESS && actionId === 'accept-call') {
    const { ringExpiresAtMs } = getCallTiming(data);
    if (Date.now() >= ringExpiresAtMs) {
      await stopIncomingCallAlert(transactionId, 'expired', ringExpiresAtMs);
      return { action: 'expired', data };
    }
    await stopIncomingCallAlert(transactionId, 'accepting');
    const alreadyAccepted = await readAcceptedCall(transactionId);
    if (alreadyAccepted) return { action: 'accept', data: alreadyAccepted };

    const acceptingValue = await AsyncStorage.getItem('acceptingCall');
    if (acceptingValue) {
      try {
        const accepting = JSON.parse(acceptingValue);
        const isSameCall = String(accepting.transactionId) === String(transactionId);
        const isFresh = Date.now() - Number(accepting.startedAt || 0) < 20000;
        if (isSameCall && isFresh) {
          const accepted = await waitForAcceptedCall(transactionId);
          return accepted ? { action: 'accept', data: accepted } : null;
        }
      } catch (_) {
        // Replace malformed/stale accepting state below.
      }
    }

    // Prevent startup restoration from opening the ringing screen while the
    // background accept request is still being completed.
    await clearStoredCallState(transactionId, ['pendingCall']);
    await AsyncStorage.setItem(
      'acceptingCall',
      JSON.stringify({ transactionId, startedAt: Date.now() }),
    );
    try {
      const requestKey = String(transactionId);
      let acceptRequest = acceptRequests.get(requestKey);
      if (!acceptRequest) {
        acceptRequest = apiUtil.post('/call/accept', { transactionId })
          .finally(() => acceptRequests.delete(requestKey));
        acceptRequests.set(requestKey, acceptRequest);
      }
      const response = await acceptRequest;
      const acceptedData = {
        ...data,
        ...(response.data?.data || {}),
        transactionId,
      };
      await AsyncStorage.setItem('acceptedCall', JSON.stringify(acceptedData));
      await markCallLifecycle(transactionId, 'accepted');
      return { action: 'accept', data: acceptedData };
    } catch (error) {
      const status = Number(error?.response?.status || 0);
      if (status === 409 || status === 404) {
        await stopIncomingCallAlert(transactionId, 'expired');
        await clearStoredCallState(transactionId);
      } else {
        // A transient failure must not strand a live call in ACCEPTING with no
        // alert. Recreate the transaction-scoped presentation if it is valid.
        await clearCallLifecycle(transactionId);
        await showIncomingCallNotification(data).catch(() => {});
      }
      console.log('Call accept failed:', status || error.message);
      return { action: 'error', data };
    } finally {
      await AsyncStorage.removeItem('acceptingCall');
    }
  }

  if (type === EventType.PRESS || actionId === 'open-call') {
    await AsyncStorage.setItem('pendingCall', JSON.stringify(data));
    return { action: 'open', data };
  }

  if (type === EventType.ACTION_PRESS && actionId === 'end-call') {
    try {
      await apiUtil.post('/call/end', { transactionId });
    } finally {
      await stopOngoingCallNotification();
    }
    return { action: 'end', data };
  }

  return null;
};

export const showOngoingCallNotification = async () => {
  // Top notification banner disabled; floating circular bubble handles user interactions
  return;
};

export const stopOngoingCallNotification = async () => {
  try {
    await notifee.cancelNotification(ONGOING_NOTIFICATION_ID);
    await notifee.stopForegroundService();
  } catch (err) {
    console.warn('stopOngoingCallNotification error caught safely:', err);
  }
};
