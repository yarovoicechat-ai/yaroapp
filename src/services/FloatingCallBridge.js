import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { FloatingCall } = NativeModules;
const eventEmitter = FloatingCall ? new NativeEventEmitter(FloatingCall) : null;


export const FloatingCallBridge = {
  startIncomingRingtone: (transactionId, expiresAtMs) => {
    if (Platform.OS === 'android' && FloatingCall && transactionId && Number.isFinite(expiresAtMs)) {
      try { FloatingCall.startIncomingRingtone(String(transactionId), Number(expiresAtMs)); } catch (e) {
        console.warn('startIncomingRingtone error:', e);
      }
    }
  },

  stopIncomingRingtone: transactionId => {
    if (Platform.OS === 'android' && FloatingCall) {
      try { FloatingCall.stopIncomingRingtone(transactionId ? String(transactionId) : null); } catch (e) {
        console.warn('stopIncomingRingtone error:', e);
      }
    }
  },

  /**
   * Check if SYSTEM_ALERT_WINDOW (Display over other apps) permission is granted
   */
  hasOverlayPermission: async () => {
    if (Platform.OS !== 'android' || !FloatingCall) return false;
    try {
      return await FloatingCall.hasOverlayPermission();
    } catch (e) {
      console.warn('hasOverlayPermission error:', e);
      return false;
    }
  },

  /**
   * Open Android System Overlay Permission Settings Screen
   */
  requestOverlayPermission: () => {
    if (Platform.OS === 'android' && FloatingCall) {
      try {
        FloatingCall.requestOverlayPermission();
      } catch (e) {
        console.warn('requestOverlayPermission error:', e);
      }
    }
  },

  /**
   * Start Floating System Overlay Bubble
   */
  startFloatingCall: async (params) => {
    console.log('[ FLOATING ] startFloatingCall requested via FloatingCallBridge');
    if (Platform.OS === 'android' && FloatingCall) {
      try {
        const hasPerm = await FloatingCallBridge.hasOverlayPermission();
        if (!hasPerm) {
          console.warn('[ FLOATING ] Overlay permission missing. Floating bubble disabled; audio remains active via foreground service.');
          return;
        }
        FloatingCall.startFloatingCall({
          callerName: params?.name || 'Yaro Voice',
          callerImage: params?.image || '',
          isMuted: !!params?.isMuted,
          isSpeaker: params?.isSpeaker !== undefined ? !!params.isSpeaker : true,
        });
        console.log('[ FLOATING ] Native module startFloatingCall invoked successfully');
      } catch (e) {
        console.warn('[ FLOATING ] startFloatingCall error:', e);
      }
    } else {
      console.warn('[ FLOATING ] Native module FloatingCall unavailable or OS not Android');
    }
  },

  /**
   * Update Floating System Overlay Bubble State (Mute/Speaker)
   */
  updateFloatingCallState: (params) => {
    if (Platform.OS === 'android' && FloatingCall) {
      try {
        FloatingCall.updateFloatingCallState({
          isMuted: !!params?.isMuted,
          isSpeaker: params?.isSpeaker !== undefined ? !!params.isSpeaker : true,
        });
      } catch (e) {
        console.warn('updateFloatingCallState error:', e);
      }
    }
  },

  /**
   * Stop Floating System Overlay Bubble
   */
  stopFloatingCall: () => {
    if (Platform.OS === 'android' && FloatingCall) {
      try {
        FloatingCall.stopFloatingCall();
      } catch (e) {
        console.warn('stopFloatingCall error:', e);
      }
    }
  },

  /**
   * Register event callbacks for Floating Bubble user actions
   */
  subscribeEvents: ({ onOpenCall, onToggleMute, onToggleSpeaker, onEndCall }) => {
    if (!eventEmitter) return () => {};

    const listeners = [];

    if (onOpenCall) {
      listeners.push(
        eventEmitter.addListener('onFloatingCallOpened', () => {
          console.log('[ FLOATING BRIDGE ] onFloatingCallOpened event triggered');
          onOpenCall();
        })
      );
    }

    if (onToggleMute) {
      listeners.push(
        eventEmitter.addListener('onFloatingCallMuteToggled', (data) => {
          onToggleMute(data?.value);
        })
      );
    }

    if (onToggleSpeaker) {
      listeners.push(
        eventEmitter.addListener('onFloatingCallSpeakerToggled', (data) => {
          onToggleSpeaker(data?.value);
        })
      );
    }

    if (onEndCall) {
      listeners.push(
        eventEmitter.addListener('onFloatingCallEnded', () => {
          onEndCall();
        })
      );
    }

    return () => {
      listeners.forEach((sub) => sub?.remove && sub.remove());
    };
  },
};
