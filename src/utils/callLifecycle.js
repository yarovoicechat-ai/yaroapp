import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee from '@notifee/react-native';
import { FloatingCallBridge } from '../services/FloatingCallBridge';

export const INCOMING_CALL_TIMEOUT_MS = 45_000;
export const INCOMING_NOTIFICATION_ID = 'incoming-call';

const TERMINAL_STATES = new Set(['ended', 'cancelled', 'rejected', 'expired', 'missed']);
const NON_RINGING_STATES = new Set([...TERMINAL_STATES, 'accepting', 'accepted', 'connecting', 'connected', 'ongoing']);
const stateKey = transactionId => `callLifecycle:${transactionId}`;
const inflightStarts = new Map();

export const getIncomingNotificationId = transactionId =>
  transactionId ? `incoming-call-${String(transactionId).replace(/[^a-zA-Z0-9_-]/g, '')}` : INCOMING_NOTIFICATION_ID;

const parseTime = value => {
  if (value === undefined || value === null || value === '') return 0;
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 0) return numeric;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const getCallIdentity = data => String(data?.transactionId || data?.callId || '').trim();

export const getCallTiming = data => {
  const createdAtMs = parseTime(data?.createdAt || data?.eventAt) || Date.now();
  const ringExpiresAtMs = parseTime(data?.ringExpiresAt) || createdAtMs + INCOMING_CALL_TIMEOUT_MS;
  return { createdAtMs, ringExpiresAtMs };
};

export const readCallLifecycle = async transactionId => {
  if (!transactionId) return null;
  try {
    const raw = await AsyncStorage.getItem(stateKey(transactionId));
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
};

export const clearCallLifecycle = transactionId =>
  transactionId ? AsyncStorage.removeItem(stateKey(transactionId)) : Promise.resolve();

export const markCallLifecycle = async (transactionId, state, eventAt = Date.now(), extra = {}) => {
  if (!transactionId) return null;
  const eventAtMs = parseTime(eventAt) || Date.now();
  const existing = await readCallLifecycle(transactionId);
  if (existing && Number(existing.eventAtMs || 0) > eventAtMs) return existing;
  const next = { ...existing, ...extra, transactionId: String(transactionId), state, eventAtMs };
  await AsyncStorage.setItem(stateKey(transactionId), JSON.stringify(next));
  return next;
};

export const beginIncomingRinging = async data => {
  const transactionId = getCallIdentity(data);
  if (!transactionId) return null;
  if (inflightStarts.has(transactionId)) return inflightStarts.get(transactionId);

  const task = (async () => {
    const { createdAtMs, ringExpiresAtMs } = getCallTiming(data);
    if (Date.now() >= ringExpiresAtMs) {
      await markCallLifecycle(transactionId, 'expired', ringExpiresAtMs, { createdAtMs, ringExpiresAtMs });
      return null;
    }

    const existing = await readCallLifecycle(transactionId);
    if (existing) {
      const existingState = String(existing.state || '').toLowerCase();
      if (NON_RINGING_STATES.has(existingState)) return null;
      if (existingState === 'ringing' && Number(existing.createdAtMs || 0) === createdAtMs) return null;
      if (Number(existing.eventAtMs || 0) > createdAtMs) return null;
    }

    await markCallLifecycle(transactionId, 'ringing', createdAtMs, { createdAtMs, ringExpiresAtMs });
    return { transactionId, createdAtMs, ringExpiresAtMs };
  })().finally(() => inflightStarts.delete(transactionId));

  inflightStarts.set(transactionId, task);
  return task;
};

export const canOpenIncomingCall = async data => {
  const transactionId = getCallIdentity(data);
  if (!transactionId) return false;
  const { createdAtMs, ringExpiresAtMs } = getCallTiming(data);
  if (Date.now() >= ringExpiresAtMs) {
    await markCallLifecycle(transactionId, 'expired', ringExpiresAtMs, { createdAtMs, ringExpiresAtMs });
    return false;
  }
  const existing = await readCallLifecycle(transactionId);
  if (existing && NON_RINGING_STATES.has(String(existing.state || '').toLowerCase())) return false;
  if (!existing) {
    await markCallLifecycle(transactionId, 'ringing', createdAtMs, { createdAtMs, ringExpiresAtMs });
  }
  return true;
};

export const stopIncomingCallAlert = async (transactionId, state, eventAt = Date.now()) => {
  if (transactionId && state) await markCallLifecycle(transactionId, state, eventAt);
  FloatingCallBridge.stopIncomingRingtone(transactionId);
  try { await notifee.cancelNotification(getIncomingNotificationId(transactionId)); } catch (_) {}
  console.log(`[NOTIFICATION] CANCEL tx=${transactionId || 'unknown'}`);
  console.log(`[RINGTONE] STOP tx=${transactionId || 'unknown'}`);
  console.log(`[VIBRATION] STOP tx=${transactionId || 'unknown'}`);
  // Clean up notifications created by versions that used one global ID. New
  // transaction-scoped notifications are not affected by this legacy ID.
  if (transactionId) {
    try { await notifee.cancelNotification(INCOMING_NOTIFICATION_ID); } catch (_) {}
  }
};

const storedCallMatches = (raw, transactionId) => {
  if (!raw || !transactionId) return false;
  try {
    const value = JSON.parse(raw);
    return getCallIdentity(value) === String(transactionId);
  } catch (_) {
    return false;
  }
};

export const clearStoredCallState = async (
  transactionId,
  keys = ['pendingCall', 'acceptingCall', 'acceptedCall'],
) => {
  if (!transactionId) return;
  const entries = await AsyncStorage.multiGet(keys);
  const matchingKeys = entries
    .filter(([, value]) => storedCallMatches(value, transactionId))
    .map(([key]) => key);
  if (matchingKeys.length) await AsyncStorage.multiRemove(matchingKeys);
};

export const applyTerminalCallState = async data => {
  const transactionId = getCallIdentity(data);
  const rawState = String(data?.state || data?.reason || 'ended').toLowerCase();
  const state = rawState === 'no_answer' ? 'expired' : (TERMINAL_STATES.has(rawState) ? rawState : 'ended');
  if (!transactionId) return false;
  await stopIncomingCallAlert(transactionId, state, data?.eventAt || Date.now());
  await clearStoredCallState(transactionId);
  console.log(`[CALL_STATE] ${state.toUpperCase()} tx=${transactionId}`);
  return true;
};

export const isTerminalCallState = state => TERMINAL_STATES.has(String(state || '').toLowerCase());
