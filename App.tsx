import React, { useEffect, useState } from "react";
import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import AppNavigator from "./src/navigation/AppNavigator";
import { AuthProvider } from "./src/context/AuthProvider";
import { UIProvider, useUI } from "./src/context/UIProvider";
import { setAlertRef } from "./src/utils/AlertService";
import { NotificationListen, requestUserPermission } from "./src/utils/NotificationManager";

import { navigationRef } from "./src/utils/navigationRef";

import { NativeModules, StatusBar, StyleSheet, View } from "react-native";
import FloatingVoiceRoomWidget from "./src/components/FloatingVoiceRoomWidget";
import BanModal from "./src/components/BanModal";

const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#FFFFFF",
  },
};

import { setupDeepLinkListener, executePendingDeepLink } from "./src/utils/deepLinkHandler";

const linking = {
  prefixes: [
    'yaro://',
    'voiceclub://',
    'https://yaroapp.in',
    'http://yaroapp.in',
    'https://www.yaroapp.in',
    'http://www.yaroapp.in',
    'https://api.yaroapp.in',
    'http://api.yaroapp.in',
  ],
  config: {
    screens: {
      VoiceRoom: {
        path: 'room/:roomId',
      },
      UserProfile: {
        path: 'user/:userId',
      },
      HostProfile: {
        path: 'host/:hostId',
      },
      InviteEarn: {
        path: 'refer/:code',
      },
      MainTabs: '*',
    },
  },
};

const AppWrapper = () => {
  const ui = useUI();
  const [activeScreen, setActiveScreen] = useState('');
  const syncActiveScreen = () => setActiveScreen(navigationRef.getCurrentRoute()?.name || '');
  const rootBackground = activeScreen === 'VoiceRoom' ? '#0C0806' : '#FFFFFF';

  useEffect(() => {
    NativeModules.SystemBars?.setRoomAppearance(activeScreen === 'VoiceRoom');
  }, [activeScreen]);

  useEffect(() => {
    setAlertRef(ui);
  }, [ui]);

  useEffect(() => {
    requestUserPermission();
    const unsubscribeNotifications = NotificationListen();
    const unsubscribeDeepLink = setupDeepLinkListener();

    return () => {
      if (unsubscribeNotifications && typeof unsubscribeNotifications === 'function') {
        unsubscribeNotifications();
      }
      if (unsubscribeDeepLink && typeof unsubscribeDeepLink === 'function') {
        unsubscribeDeepLink();
      }
    };
  }, []);

  return (
    <View style={[styles.appRoot, { backgroundColor: rootBackground }]}>
      <NavigationContainer
        ref={navigationRef}
        theme={{ ...AppTheme, colors: { ...AppTheme.colors, background: rootBackground } }}
        linking={linking}
        onReady={() => {
          syncActiveScreen();
          executePendingDeepLink();
        }}
        onStateChange={syncActiveScreen}
      >
        <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
        <AppNavigator />
      </NavigationContainer>
      <FloatingVoiceRoomWidget />
      <BanModal />
    </View>
  );
};

import { VoiceRoomProvider } from "./src/context/VoiceRoomContext";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ErrorBoundary from './src/components/ErrorBoundary';

// Global Uncaught JS Exception Handler to prevent native process crashes
if (typeof global !== 'undefined' && (global as any).ErrorUtils) {
  const previousHandler = (global as any).ErrorUtils.getGlobalHandler?.();
  (global as any).ErrorUtils.setJSExceptionHandler((error: any, isFatal: boolean) => {
    console.warn('[GlobalCrashGuard] Intercepted JS error:', error?.message || error, 'isFatal:', isFatal);
    if (!isFatal && previousHandler) {
      try { previousHandler(error, false); } catch (_) {}
    }
  }, true);
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <UIProvider>
            <VoiceRoomProvider>
              <ErrorBoundary>
                <AppWrapper />
              </ErrorBoundary>
            </VoiceRoomProvider>
          </UIProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  appRoot: { flex: 1, backgroundColor: '#FFFFFF' },
});
