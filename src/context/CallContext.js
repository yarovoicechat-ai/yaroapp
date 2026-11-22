import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { navigationRef, navigate } from '../utils/navigationRef';
import { FloatingCallBridge } from '../services/FloatingCallBridge';
import { getSocket } from '../sockets';

const CallContext = createContext();

export const CallProvider = ({ children }) => {
  const [activeCall, setActiveCall] = useState(null);
  const activeCallRef = useRef(activeCall);
  activeCallRef.current = activeCall;

  const globalAgoraEngineRef = useRef(null);

  useEffect(() => {
    const socket = getSocket();
    const handleGlobalCallEnded = (data) => {
      console.log(`[CALL_DEBUG] CALL_ENDED tx=${data?.transactionId || activeCallRef.current?.transactionId} reason=${data?.reason}`);
      FloatingCallBridge.stopFloatingCall();
      setActiveCall(null);
    };

    if (socket) {
      socket.on('callEnded', handleGlobalCallEnded);
    }

    const unsubscribe = FloatingCallBridge.subscribeEvents({
      onOpenCall: () => {
        const txId = activeCallRef.current?.transactionId;
        console.log(`[CALL_DEBUG] FLOATING_BUBBLE_TAP tx=${txId}`);
        FloatingCallBridge.stopFloatingCall();
        const callData = activeCallRef.current;
        if (callData?.onExpand) {
          console.log(`[CALL_DEBUG] RESTORE_CALL tx=${txId}`);
          callData.onExpand();
        } else if (callData?.params) {
          if (navigationRef && typeof navigationRef.isReady === 'function' && navigationRef.isReady()) {
            navigationRef.navigate(callData.screen || 'OnGoing', callData.params);
          } else if (typeof navigate === 'function') {
            navigate(callData.screen || 'OnGoing', callData.params);
          }
        }
      },
      onEndCall: () => {
        const txId = activeCallRef.current?.transactionId;
        console.log(`[CALL_DEBUG] FLOATING_BUBBLE_END_BUTTON_TAP tx=${txId}`);
        const callData = activeCallRef.current;
        if (callData?.onEndCall) {
          callData.onEndCall();
        }
      },
    });

    return () => {
      unsubscribe();
      if (socket) {
        socket.off('callEnded', handleGlobalCallEnded);
      }
    };
  }, []);

  const setCallData = useCallback((data) => {
    setActiveCall(data);
  }, []);

  const clearCall = useCallback(() => {
    setActiveCall(null);
  }, []);

  return (
    <CallContext.Provider value={{ activeCall, setActiveCall: setCallData, clearCall, globalAgoraEngineRef }}>
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => useContext(CallContext);
