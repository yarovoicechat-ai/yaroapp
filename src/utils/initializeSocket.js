import { navigationRef } from './navigationRef';
import { AppState } from 'react-native';
import { showIncomingCallNotification } from './CallNotificationService';
import { applyTerminalCallState, canOpenIncomingCall } from './callLifecycle';
import { apiUtil } from './apiUtil';

const cleanupBySocket = new WeakMap();
const navigationTimers = new Map();

import AsyncStorage from '@react-native-async-storage/async-storage';

const openIncomingCall = async data => {
  if (!await canOpenIncomingCall(data)) return;
  if (!data?.transactionId) return;
  const targetTxId = String(data.transactionId);

  try {
    const [[, acceptingStr], [, acceptedStr]] = await AsyncStorage.multiGet([
      'acceptingCall',
      'acceptedCall',
    ]);

    if (acceptingStr) {
      const accepting = JSON.parse(acceptingStr);
      if (String(accepting?.transactionId) === targetTxId) {
        console.log('Skipping openIncomingCall: call is currently being accepted');
        return;
      }
    }

    if (acceptedStr) {
      const accepted = JSON.parse(acceptedStr);
      if (String(accepted?.transactionId) === targetTxId) {
        console.log('Skipping openIncomingCall: call was already accepted');
        return;
      }
    }
  } catch (_) {
    // Continue with navigation check if storage read fails
  }

  navigationTimers.get(targetTxId)?.();
  let cancelled = false;
  let attempts = 0;

  const open = async () => {
    if (cancelled) return;
    if (
      navigationRef.isReady() &&
      navigationRef.getRootState()?.routeNames?.includes('Incomming')
    ) {
      try {
        const response = await apiUtil.get(`/call/status/${targetTxId}`);
        const serverData = response.data?.data || {};
        const status = String(serverData.status || '').toLowerCase();
        if (!['initiated', 'ringing'].includes(status)) {
          await applyTerminalCallState({
            transactionId: targetTxId,
            state: status || 'ended',
          });
          navigationTimers.delete(targetTxId);
          return;
        }
        data = { ...data, ...serverData, agora: serverData.agora || data.agora };
        if (!await canOpenIncomingCall(data)) return;
      } catch (error) {
        console.log(
          `[NAVIGATION] STATUS_RETRY tx=${targetTxId} error=${error?.response?.status || error.message}`,
        );
        if (++attempts < 450) setTimeout(open, 100);
        return;
      }
      const currentRoute = navigationRef.getCurrentRoute();
      const currentTxId = String(currentRoute?.params?.transactionId || '');
      const alreadyOpen =
        ['Incomming', 'OnGoing'].includes(currentRoute?.name) &&
        currentTxId === targetTxId;

      if (!alreadyOpen && currentRoute?.name !== 'OnGoing') {
        navigationRef.resetRoot({
          index: 1,
          routes: [
            { name: 'MainTabs' },
            { name: 'Incomming', params: { ...data, fromNotification: false } },
          ],
        });
        console.log(`[NAVIGATION] INCOMING_OPEN tx=${targetTxId}`);
      }
      navigationTimers.delete(targetTxId);
      return;
    }

    if (++attempts < 450) setTimeout(open, 100);
  };

  navigationTimers.set(targetTxId, () => { cancelled = true; });
  open();
};

export const attachSocketListeners = (socketInstance, setHosts) => {
  if (!socketInstance) return undefined;

  cleanupBySocket.get(socketInstance)?.();
  console.log('[SOCKET] LISTENER_REGISTERED');

  const handleHostsList = data => setHosts(data?.hosts || data);
  const handleHostsUpdated = data => setHosts(data?.hosts || data);
  const handleCallEnded = data => {
    const transactionId = String(data?.transactionId || data?.callId || '');
    navigationTimers.get(transactionId)?.();
    navigationTimers.delete(transactionId);
    applyTerminalCallState({ ...data, state: data?.reason || 'ended' }).catch(() => {});
    console.log(`[SOCKET] CALL_ENDED tx=${transactionId}`);
  };
  const handleIncomingCall = async data => {
    if (!data?.transactionId) return;
    console.log(`[SOCKET] INCOMING_CALL tx=${data.transactionId}`);

    const shown = await showIncomingCallNotification(data).catch(() => false);
    if (!shown) {
      console.log(`[SOCKET] DUPLICATE_INCOMING_IGNORED tx=${data.transactionId}`);
    }
    if (AppState.currentState === 'active') openIncomingCall(data);
  };

  socketInstance.on('hostsList', handleHostsList);
  socketInstance.on('hostsUpdated', handleHostsUpdated);
  socketInstance.on('incomingCall', handleIncomingCall);
  socketInstance.on('callEnded', handleCallEnded);
  socketInstance.on('callCancelled', handleCallEnded);
  socketInstance.emit('requestHostsList');

  const cleanup = () => {
    socketInstance.off('hostsList', handleHostsList);
    socketInstance.off('hostsUpdated', handleHostsUpdated);
    socketInstance.off('incomingCall', handleIncomingCall);
    socketInstance.off('callEnded', handleCallEnded);
    socketInstance.off('callCancelled', handleCallEnded);
    console.log('[SOCKET] LISTENER_CLEANED');
  };

  cleanupBySocket.set(socketInstance, cleanup);
  return cleanup;
};
